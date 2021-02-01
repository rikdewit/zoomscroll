import * as THREE from '../three/three.module.js';
import {
    CSS3DRenderer,
    CSS3DObject
} from '../three/CSS3DRenderer.js';

class zoomScroll {
    constructor(loopOptions = false, container) {

        if (container) {
            this.container = container;
        } else {
            this.container = document.createElement("div");
            this.container.className = "zoomScroll";
            document.body.prepend(this.container);
        }
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        [this.renderer, this.scene] = this.createRenderLayer({ main: true });

        this.portalRenderLayers = [];
        this.portals = [];
        if (loopOptions) {
            this.loop = loopOptions.z;
            this.loopDepth = loopOptions.depth;

            if (this.loop) {
                document.body.style.height = (-this.loop + 400 + 10000 + window.innerHeight).toString() + "px";
            }
        }
        else {
            this.loop = false;
        }
        this.scrolled = false;
        this.portalFrames = 0;

        history.scrollRestoration = 'manual';
        window.scrollTo(0, 400);
        this.resize();
        this.scroll();
        this.animate();
    }

    createRenderLayer(options = { main: false }, z = 0) {
        let scene = new THREE.Scene();

        let renderer = new CSS3DRenderer(this.container);
        renderer.setSize(window.innerWidth, window.innerHeight);

        let renderEl = renderer.domElement;
        renderEl.style.position = "fixed";
        renderEl.style.height = "100%";
        renderEl.style.transform = "translate3d(0,0,0)";

        if (options.main) {
            this.container.append(renderEl);
            this.mainRenderLayer = renderEl;
        } else {
            if (this.portalRenderLayers.length > 0) {
                let placed = false;
                for (const layer of this.portalRenderLayers) {
                    if (z > layer[2]) {
                        this.container.insertBefore(renderEl, layer[0].domElement);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    this.container.insertBefore(renderEl, this.portalRenderLayers[this.portalRenderLayers.length - 1][0].domElement.nextSibling);
                }
            } else {
                this.container.prepend(renderEl);
            }


        }
        return [renderer, scene];
    }


    add(query, x = 0, y = 0, z = -1000, depth = 0) {
        let element = document.querySelector(query).cloneNode(true);

        let obj = new CSS3DObject(element);
        obj.position.set(x, y, z);
        this.scene.add(obj);

        if (this.loop && depth < this.loopDepth) {
            this.add(query, x, y, z + this.loop, depth + 1);
        }
        return obj;
    }

    addPortal(query, z = -1000, depth = 0) {

        let [renderer, scene] = this.createRenderLayer({ main: false }, z);
        this.portalRenderLayers.push([renderer, scene, z]);
        this.portalRenderLayers.sort((a, b) => a[2] < b[2] ? 1 : -1) //sort from near to far (0 to -1000 to -2000)

        let element = document.querySelector(query);
        let color = getComputedStyle(element).backgroundColor;

        let cloned = element.cloneNode(true);
        let obj = new CSS3DObject(cloned);
        obj.position.set(0, 0, z);

        scene.add(obj);
        this.portals.push({ z: z, color: color });
        this.portals.sort((a, b) => a.z < b.z ? 1 : -1);
        if (this.loop && depth < this.loopDepth) {
            this.addPortal(query, z + this.loop, depth + 1);
        }

        let portalSize = getComputedStyle(element).width;
        this.addPortalFrame(z, portalSize, 100);

        return obj;
    }

    addPortalFrame(z, portalSizePx, frameBorder) {

        if (z >= this.loop) {
            let fontSize = parseFloat(window.getComputedStyle(document.body).getPropertyValue('font-size'));
            let portalSize = parseFloat(portalSizePx, 10) / fontSize;
            console.log(parseFloat(portalSizePx) / fontSize)
            let leftLine = frameBorder;
            let rightLine = portalSize + leftLine;

            let portalFrame = document.createElement("div");
            portalFrame.className = `portalFrame${this.portalFrames}`;
            console.log(2 * frameBorder + portalSize)
            portalFrame.style.width = 2 * frameBorder + portalSize + "rem";
            portalFrame.style.height = 2 * frameBorder + portalSize + "rem";
            portalFrame.style.position = "absolute";
            portalFrame.style.clipPath = `polygon(0% 0%, 0% 100%, ${leftLine}rem 100%, ${leftLine}rem ${leftLine}rem, ${rightLine}rem ${leftLine}rem, ${rightLine}rem ${rightLine}rem, ${leftLine}rem ${rightLine}rem, ${leftLine}rem 100%, 100% 100%, 100% 0%)`

            let color;
            if (z <= this.portals[0].z) {
                color = "white";
            }

            for (let i = 1; i < this.portals.length - 1; i++) {

                if (z <= this.portals[i].z) {
                    color = this.portals[i - 1].color;
                }
            }

            portalFrame.style.backgroundColor = color;

            document.body.append(portalFrame);
            this.add(".portalFrame" + this.portalFrames, 0, 0, z);
            this.portalFrames += 1;

            portalFrame.style.display = "none";
        }


    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);

        this.portalRenderLayers.forEach((layer) => {
            let renderer = layer[0];
            let scene = layer[1];//to improve: array unpacking
            renderer.render(scene, this.camera);
        });
        this.updateBackground(this.camera.position.z);
    }

    updateBackground(camPos) {
        let bgColor;
        let inPortal = false;
        for (let i = 0; i < this.portals.length; i++) {
            if (camPos <= this.portals[i].z) {
                bgColor = this.portals[i].color;
                inPortal = true;
            }
        }
        if (!inPortal) {
            bgColor = "white";
        }

        let html = document.querySelector("html");
        html.style.backgroundColor = bgColor;
        document.body.style.backgroundColor = bgColor;

    }

    scroll() {

        let _this = this;
        window.addEventListener("scroll", function (event) {
            let scrollPos = window.scrollY;
            _this.camera.position.set(0, 0, -scrollPos);
            let scrollSpeed = checkScrollSpeed();
            // console.log(scrollPos, scrollSpeed);
            // console.log(_this.scrolled)

            if (_this.loop && !_this.scrolled && scrollPos + scrollSpeed - 400 > -_this.loop) {
                window.scrollTo(0, scrollPos + _this.loop + scrollSpeed);
                _this.scrolled = true;
                setTimeout(() => _this.scrolled = false, 10);
            }

            if (_this.loop && !_this.scrolled && scrollPos + scrollSpeed < 400) {
                window.scrollTo(0, -_this.loop + scrollPos + scrollSpeed);
                _this.scrolled = true;
                setTimeout(() => _this.scrolled = false, 10);
            }
        });
    }

    resize() {
        window.addEventListener('resize', () => {

            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(window.innerWidth, window.innerHeight);

            this.portalRenderLayers.forEach((layer) => {
                let renderer = layer[0];
                renderer.setSize(window.innerWidth, window.innerHeight)
            });
        });
    }
}

let scene = new zoomScroll({ z: -25000, depth: 1 });

scene.add(".layer1", 0, 0, - 500);
scene.add(".layer2", 0, 0, - 1500);
scene.add(".layer5", 1700, 0, - 7000);
scene.add(".layer3", 0, 1700, - 7000);
// scene.add(".text1", 200, 0, - 3000);
// scene.add(".text1", -200, 0, - 3000);
// scene.add(".image", 0, -200, -10000);
// scene.add(".image", 0, 200, -10000);
// scene.add(".image", -400, 0, -10000);
// scene.add(".image", 400, 0, -10000);
// scene.add(".video", 0, 0, -20000)



scene.addPortal(".portal1", -5000);
scene.addPortal(".portal2", -15000);
scene.addPortal(".portal3", -25000);




var checkScrollSpeed = (function (settings) {
    settings = settings || {};

    var lastPos, newPos, timer, delta,
        delay = settings.delay || 50; // in "ms" (higher means lower fidelity )

    function clear() {
        lastPos = null;
        delta = 0;
    }

    clear();

    return function () {
        newPos = window.scrollY;
        if (lastPos != null) { // && newPos < maxScroll 
            delta = newPos - lastPos;
        }
        lastPos = newPos;
        clearTimeout(timer);
        timer = setTimeout(clear, delay);
        return delta;
    };
})();



