import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import {
    CSS3DRenderer,
    CSS3DObject
} from 'https://threejs.org/examples/jsm/renderers/CSS3DRenderer.js';

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
        }
        else {
            this.loop = false;
        }
        this.scrolled = false;

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


    add(query, z = -1000, depth = 0) {
        let element = document.querySelector(query).cloneNode(true);

        let obj = new CSS3DObject(element);
        obj.position.set(0, 0, z);
        this.scene.add(obj);

        if (this.loop && depth < this.loopDepth) {
            this.add(query, z + this.loop, depth + 1);
        }
        return obj;
    }

    addPortal(query, z = -1000, depth = 0) {

        let [renderer, scene] = this.createRenderLayer({ main: false }, z);
        this.portalRenderLayers.push([renderer, scene, z]);
        this.portalRenderLayers.sort((a, b) => a[2] < b[2] ? 1 : -1) //sort from near to far (0 to -1000 to -2000)

        let element = document.querySelector(query);
        let color = getComputedStyle(element).backgroundColor;

        element = element.cloneNode(true);
        let obj = new CSS3DObject(element);
        obj.position.set(0, 0, z);

        scene.add(obj);
        this.portals.push({ z: z, color: color });
        this.portals.sort((a, b) => a.z < b.z ? 1 : -1);
        if (this.loop && depth < this.loopDepth) {
            this.addPortal(query, z + this.loop, depth + 1);
        }

        return obj;
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
            if (camPos < this.portals[i].z) {
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
        let controller = new ScrollMagic.Controller();
        const scroll = new ScrollMagic.Scene({
            duration: 0,
            offset: 0
        }).addTo(controller);


        let _this = this;
        scroll.on("update", function (event) {
            let scrollPos = controller.scrollPos()
            _this.camera.position.set(0, 0, -scrollPos);
            let scrollSpeed = checkScrollSpeed();
            console.log(scrollPos, scrollSpeed);
            console.log(_this.scrolled)

            if (_this.loop && !_this.scrolled && scrollPos + scrollSpeed - 400 > -_this.loop) {
                controller.scrollTo(scrollPos + _this.loop + scrollSpeed);
                _this.scrolled = true;
                setTimeout(() => _this.scrolled = false, 100);
            }

            if (_this.loop && !_this.scrolled && scrollPos + scrollSpeed < 400) {
                controller.scrollTo(-_this.loop + scrollPos + scrollSpeed);
                _this.scrolled = true;
                setTimeout(() => _this.scrolled = false, 100);
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

let scene = new zoomScroll({ z: -15000, depth: 2 });

scene.add(".layer1", - 500);
scene.add(".layer2", - 1500);
scene.add(".layer5", -4000);
scene.add(".layer3", - 7000);

scene.addPortal(".layer4", -5000);
scene.addPortal(".portal2", -15000);



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



