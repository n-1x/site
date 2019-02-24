//scroll to a specific element on the page
function scrollToEl(element) {
    theElement = document.getElementById(element);
    //will smooth scroll in modern browsers
    theElement.scrollIntoView({behavior: 'smooth'});
};


//place the current year on the footer
function updateCopyright() {
    const d = (new Date()).getFullYear();
    
    document.getElementById('copyright').innerHTML = "&copy" + d;
}


//take every element with the 'appear' class on it
//and make them fade in one after another
function fadeIn() {
    let els = document.getElementsByClassName("appear");

    for (let i = 0; i < els.length; ++i) {
        const delay = (i*0.2) + 's';
        let anim = "right";

        if (i%2 == 0) {
            anim = "left"
        }
        els[i].style.animation = "appear-" + anim + " 0.8s " + delay + " ease-out forwards";
    }
}


document.addEventListener("DOMContentLoaded", () => {
    console.log("worked");
    updateCopyright();
    fadeIn();
})