//scroll to a specific element on the page
function scrollToEl(element) {
    theElement = document.getElementById(element);
    //will smooth scroll in modern browsers
    theElement.scrollIntoView({behavior: 'smooth'});
};



//place the current year on the footer
function updateCopyright() {
    var text = "&copy ";
    var end = "";
    
    var date = new Date();
    var d = date.getFullYear();
    
    document.getElementById('copyright').innerHTML = text + d + end;
}



//take every element with the 'appear' class on it
//and make them fade in one after another
function fadeIn() {
    let els = document.getElementsByClassName("appear");

    for (let i = 0; i < els.length; ++i) {
	let delay = (i*0.2) + 's';
	let anim = "right";

	if (i%2 == 0) {
	    anim = "left"
	}
	els[i].style.animation = "appear-" + anim + " 0.8s " + delay + " ease-out forwards";
    }
}



//add in the svg images after each section
//to create the angled effect.
//Depending on whether it's an odd or even element, the other
//half of the svg must be filled. These are called svg 1 and 2.
//The a and b parts of the svg determine which way the angle will
//go. This allows the randomness to the homepage.
function insertAngleSVGs() {
    const sections = document.getElementsByClassName("section");
    
    const svgOpen = "<svg viewBox=\"0 0 100 10\" style=\"width: 100%; \" ><polygon points=\""
    const svgClose = "\"></svg>"

    const svg2a = svgOpen + "0,0 100,0 100,10" + svgClose;
    const svg2b = svgOpen + "0,0 100,0 0,10" + svgClose;
    const svg1a = svgOpen + "0,10 100,0 100,10" + svgClose;
    const svg1b = svgOpen + "0,10 0,0 100,10" + svgClose;


    //loop through all the sections, adding svg 1 or 2
    //alternately, and randomly choosing the a or b
    for (let i = 0; i < sections.length; ++i) {
	let theSVG = svg1a;
	let useB = Math.random() >= 0.5;

	//even element
	if (i%2 != 0) {
	    
	    if (useB) {
		theSVG = svg1b;
	    }
	}
	//odd element
	else {
	    theSVG = svg2a;

	    if (useB) {
		theSVG = svg2b;
	    }
	}
	
	sections[i].insertAdjacentHTML("afterEnd", theSVG);
    }
}



//to be called with the body onLoad event.
function pageLoad() {
    updateCopyright();
    fadeIn();
    insertAngleSVGs();
}
