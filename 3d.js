import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import {
    CSS3DRenderer,
    CSS3DObject
} from 'https://threejs.org/examples/jsm/renderers/CSS3DRenderer.js';

import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";

const layer1 = document.querySelector(".layer1");

const layer2 = document.querySelector(".layer2");
const layer3 = document.querySelector(".layer3");
const layer4 = document.querySelector(".layer4");
const layer5 = document.querySelector(".layer5");


const container = document.querySelector(".container");
const background = document.querySelector(".background");
const panels = document.querySelector(".panels");

const render1 = document.querySelector("#render1");
const render2 = document.querySelector("#rrender2");


let scene;
let camera;
let renderer;

let bgscene;
let bgrenderer;
let bgcamera

let four;
let bgDom;
let renderDom;

init();


function init() {

    bgscene = new THREE.Scene();
    bgrenderer = new CSS3DRenderer();
    bgrenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(bgrenderer.domElement);

    bgDom = bgrenderer.domElement;
    bgDom.style.position = "fixed";
    bgDom.style.height = "100%"
    bgDom.style.transform = "translate3d(0, 0, 0)";



    bgcamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // create a CSS3DRenderer
    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    renderDom = renderer.domElement;
    renderDom.style.position = "fixed";
    renderDom.style.height = "100%"
    renderDom.style.transform = "translate3d(0, 0, 0)";



    // position and point the camera to the center of the scene
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 0;
    // camera.lookAt(scene.position);

    bgcamera.position.x = 0;
    bgcamera.position.y = 0;
    bgcamera.position.z = 0;
    bgcamera.lookAt(bgscene.position);

    let one = addObject(layer1);
    let two = addObject(layer2);
    let three = addObject(layer3);

    four = new CSS3DObject(background);
    four.position.set(0, 0, 0);
    bgscene.add(four)


    let five = addObject(layer5);


    one.position.setZ(-500)
    two.position.setZ(-1000);
    two.scale.set(0.5, 0.5, 0.5);

    three.position.setZ(-1500);
    four.position.setZ(-2000);
    five.position.setZ(-2500);


}


function addObject(domElement) {
    let obj = new CSS3DObject(domElement);
    obj.position.set(0, 0, 0);
    scene.add(obj)
    return obj;
}

animate();






var controller = new ScrollMagic.Controller();

// create a scene
const scroll = new ScrollMagic.Scene({
    // triggerElement: pages,
    duration: Infinity,	// the scene should last for a scroll distance of 100px
    offset: 0	// start this scene after scrolling for 50px
})
    // .setPin(renderer.domElemen) // pins the element for the the scene's duration
    .addIndicators()
    .addTo(controller); // assign the scene to the controller

scroll.on("update", function (event) {
    let scrollPos = controller.scrollPos()
    let zoomFactor = 1;
    camera.position.set(0, 0, -scrollPos);


    var style = window.getComputedStyle(container);
    let fontSize = parseFloat(style.fontSize);
    let zoom = scrollPos / fontSize;
    console.log(camera.position.z);

    console.log(four.position.z);


    if (four.position.z > camera.position.z - 100) {
        document.body.style.backgroundColor = "greenyellow";
    } else {
        document.body.style.backgroundColor = "white"
    }

});

function animate() {
    requestAnimationFrame(animate);

    bgrenderer.render(bgscene, camera);

    renderer.render(scene, camera);

};


window.addEventListener('resize', () => {

    renderDom.style.width = window.innerWidth;
    renderDom.style.height = window.innerHeight;

    bgDom.style.width = window.innerWidth;
    bgDom.style.height = window.innerHeight;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    bgrenderer.setSize(window.innerWidth, window.innerHeight);


});
