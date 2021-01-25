

function scrollZoom() {

    var controller = new ScrollMagic.Controller();

    // create a scene
    const scroll = new ScrollMagic.Scene({
        // triggerElement: pages,
        duration: Infinity,	// the scene should last for a scroll distance of 100px
        offset: 0	// start this scene after scrolling for 50px
    })
        .setPin("canvas") // pins the element for the the scene's duration
        .addIndicators()
        .addTo(controller); // assign the scene to the controller

    scroll.on("update", function (event) {
        let scrollPos = controller.scrollPos()
        let zoomFactor = 1;
        // console.log(scrollPos);
        // containers.forEach((container) => {
        container.style.transform = "translateZ(" + scrollPos * zoomFactor + "px)";
        container.style.transform = "translateZ(" + scrollPos * zoomFactor + "px)";

        // });

        // let style = containers[1].style.transform;
        // let matrix = new WebKitCSSMatrix(bgStyle.transform);
        // console.log(style);

        var style = window.getComputedStyle(container);
        let fontSize = parseFloat(style.fontSize);

        let zoom = scrollPos / fontSize;

        console.log(zoom);

        if (zoom >= 500) {
            document.body.style.backgroundColor = "greenyellow";
        } else {
            document.body.style.backgroundColor = "white"
        }

    });
}