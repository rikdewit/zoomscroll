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

        this.portalCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.portalRenderLayers = [];
        this.portals = [];
        this.contentRenderLayers = [];

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
        this.count = 0;

        history.scrollRestoration = 'manual';
        window.scrollTo(0, 400);
        this.resize();
        this.scroll();
        this.animate();
    }


    createRenderLayer(options = { portal: true, depth: 0 }, z = 0) {
        let scene, renderer, renderEl;
        scene = new THREE.Scene();

        renderer = new CSS3DRenderer(this.container);

        renderEl = renderer.domElement;
        renderEl.style.position = "fixed";
        renderEl.style.height = "100%";
        renderEl.style.transform = "translate3d(0,0,0)";
        renderer.setSize(window.innerWidth, window.innerHeight);
        let camera;
        if (options.portal) {
            camera = this.portalCamera;
        } else {
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        }


        return { renderer: renderer, scene: scene, element: renderEl, camera: camera };
    }

    renderLayers() {
        for (const layer of this.portalRenderLayers) {
            this.container.append(layer.element);
        }
        for (const layer of this.contentRenderLayers) {
            this.container.append(layer.element);
        }

    }


    add(query, x = 0, y = 0, z = -1000, depth = 0) {
        let element = document.querySelector(query).cloneNode(true);
        let obj = new CSS3DObject(element);
        obj.position.set(x, y, z);

        let layer;
        for (let i = 0; i < this.contentRenderLayers.length; i++) {
            let renderLayer = this.contentRenderLayers[i];
            if (z < this.contentRenderLayers[i].start && z > this.contentRenderLayers[i].end) {
                layer = renderLayer;
                break;
            }
        }
        let start;
        let end;
        if (layer) {
            layer.scene.add(obj);
            start = layer.start
        } else {
            for (let i = 0; i < this.portals.length; i++) {
                if (z < this.portals[i].z) {
                    start = this.portals[i].z + this.loop * depth - 1;
                    end = this.portals[i + 1].z + this.loop * depth;
                    break;
                } else {
                    start = 0 + this.loop * depth - 1;
                    end = this.portals[0].z + this.loop * depth;
                }
            }
            const { renderer, scene, element: renderEl, camera } = this.createRenderLayer({ portal: false }, start);
            scene.add(obj);

            this.contentRenderLayers.push({ renderer: renderer, scene: scene, element: renderEl, start: start, end: end, camera: camera });
            this.contentRenderLayers.sort((a, b) => a.start > b.start ? 1 : -1);
        }

        // adding duplicates of objects in looped renders
        if (this.loop && depth < this.loopDepth) {
            this.add(query, x, y, z + this.loop, depth + 1);
        }
        return obj;
    }

    addPortal(query, z = -1000, depth = 0) {

        const { renderer, scene, element: renderEl } = this.createRenderLayer({ portal: true, depth: depth }, z);


        let element = document.querySelector(query);
        let color = getComputedStyle(element).backgroundColor;

        let cloned = element.cloneNode(true);
        let obj = new CSS3DObject(cloned);
        obj.position.set(0, 0, z);

        this.portalRenderLayers.push({ renderer: renderer, scene: scene, element: renderEl, z: z });
        this.portalRenderLayers.sort((a, b) => a.z < b.z ? 1 : -1) //sort from near to far (0 to -1000 to -2000)

        scene.add(obj);
        this.portals.push({ z: z, color: color, element: obj });
        this.portals.sort((a, b) => a.z < b.z ? 1 : -1);
        if (this.loop && depth < this.loopDepth) {
            this.addPortal(query, z + this.loop, depth + 1);
        }

        return obj;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const camPos = this.portalCamera.position.z;
        // this.ballRenderer.render(this.ballScene, this.camera);




        this.contentRenderLayers.forEach((layer) => {
            const { renderer, scene, camera } = layer;
            if (layer.start != -1) {
                let portalRect = document.querySelector(".portal1").getBoundingClientRect();
                let width = Math.min(portalRect.width, window.innerWidth);
                let height = Math.min(portalRect.height, window.innerHeight);

                console.log(window.innerHeight / height);
                camera.zoom = window.innerHeight / height;
                camera.updateProjectionMatrix();

                renderer.setSize(width, height);
            }



            renderer.render(scene, camera);
        });


        this.portalRenderLayers.forEach((layer) => {
            const { renderer, scene } = layer;
            renderer.render(scene, this.portalCamera);
        });
        this.updateBackground(camPos);
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
            _this.portalCamera.position.set(0, 0, -scrollPos);
            _this.contentRenderLayers.forEach((layer) => {
                layer.camera.position.set(0, 0, -scrollPos);
            })
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

            this.portalRenderLayers.forEach((layer) => {
                layer.renderer.setSize(window.innerWidth, window.innerHeight);
            })
            this.portalCamera.updateProjectionMatrix();
            this.portalCamera.aspect = window.innerWidth / window.innerHeight;


            this.contentRenderLayers.forEach((layer) => {
                layer.camera.aspect = window.innerWidth / window.innerHeight;;
                layer.camera.updateProjectionMatrix();
            })
        });
    }
}

let scene = new zoomScroll({ z: -25000, depth: 1 });


scene.addPortal(".portal1", -5000);
scene.addPortal(".portal2", -15000);
scene.addPortal(".portal3", -25000);


scene.add(".layer1", 0, 0, - 1000);
scene.add(".layer2", 0, 0, - 1500);

// scene.add(".portal1-clip", 0, 0, -5001);
// scene.add(".portal1-mask", 0, 0, -7000)

scene.add(".layer5", 1700, 0, - 7000);

scene.add(".layer3", 0, 1700, - 7000);


// scene.add(".text1", 200, 0, - 3000);
// scene.add(".text1", -200, 0, - 3000);
scene.add(".image", 0, -200, -10000);
scene.add(".image", 0, 200, -10000);
scene.add(".image", -400, 0, -20000);
scene.add(".image", 400, 0, -20000);
// scene.add(".video", 0, 0, -20000)

scene.renderLayers();

console.log(scene.contentRenderLayers);







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



