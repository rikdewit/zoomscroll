import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import {
    CSS3DRenderer,
    CSS3DObject
} from 'https://threejs.org/examples/jsm/renderers/CSS3DRenderer.js';


const layer1 = document.querySelector(".layer1");
const layer2 = document.querySelector(".layer2");
const layer3 = document.querySelector(".layer3");
const layer4 = document.querySelector(".layer4");

const background = document.querySelector(".background");
const layer5 = document.querySelector(".layer5");
const portal2 = document.querySelector(".portal2");


class zoomScroll {
    constructor(container) {

        if (container) {
            this.container = container;
        } else {
            this.container = document.createElement("div");
            this.container.className = "zoomScroll";
            document.body.prepend(this.container);
        }
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        [this.portalRenderer, this.portalScene] = this.createRenderLayer();
        [this.renderer, this.scene] = this.createRenderLayer();

        this.portals = [];

        this.resize();
        this.scroll();
        this.animate();
    }

    createRenderLayer() {
        let scene = new THREE.Scene();

        let renderer = new CSS3DRenderer(this.container);
        renderer.setSize(window.innerWidth, window.innerHeight);

        let renderEl = renderer.domElement;
        renderEl.style.position = "fixed";
        renderEl.style.height = "100%";
        renderEl.style.transform = "translate3d(0,0,0)";
        this.container.appendChild(renderEl);

        return [renderer, scene];
    }

    add(element, z = -1000) {
        let obj = new CSS3DObject(element);
        obj.position.set(0, 0, z);
        this.scene.add(obj)
        return obj;
    }

    addPortal(element, z = -1000) {
        let obj = new CSS3DObject(element);
        obj.position.set(0, 0, z);
        this.portalScene.add(obj);
        let color = getComputedStyle(element).backgroundColor;
        this.portals.push({ z: z, color: color });
        return obj;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
        this.portalRenderer.render(this.portalScene, this.camera);
    }

    scroll() {
        let _this = this;
        let controller = new ScrollMagic.Controller();

        const scroll = new ScrollMagic.Scene({
            duration: Infinity,
            offset: 0
        }).addTo(controller);

        scroll.on("update", function (event) {
            let scrollPos = controller.scrollPos()
            _this.camera.position.set(0, 0, -scrollPos);
            console.log(_this.camera.position.z);

            for (let i = 0; i < _this.portals.length; i++) {

                // if (_this.portals[i].z > _this.camera.position.z - 100) {
                //     document.body.style.backgroundColor = _this.portals[i].color;
                // } else {
                //     document.body.style.backgroundColor = "white"
                // }

            }

        });
    }

    resize() {
        window.addEventListener('resize', () => {

            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.portalRenderer.setSize(window.innerWidth, window.innerHeight)


        });
    }
}

let scene = new zoomScroll();

scene.add(layer1, - 500);
scene.add(layer2, - 1000);
scene.add(layer3, - 1500);
scene.add(layer5, -2500);
scene.addPortal(layer4, -2000);
scene.addPortal(portal2, -3500);




