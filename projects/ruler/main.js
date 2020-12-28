const style = getComputedStyle(document.documentElement);
const fg = style.getPropertyValue("--accent");
const bg = style.getPropertyPriority("--accent-vvdark");

let ppmm = 10;
let calibrationLength = 210;
let calibrated = false;
let width = 800;
let height = 600;
let mouseX = 0, mouseY = 0;

let rectMenuShown = false;
let calibMenuShown = false;

const rects = [];

const canvas = document.getElementById("canv");
const ctx = canvas.getContext("2d");

window.addEventListener("resize", windowResized, false);
window.addEventListener("mousemove", mouseMoved, false);
window.addEventListener("mousedown", mousePressed, false);
window.addEventListener("keypress", keyPressed, false);

windowResized();

//check for saved pixel density
const storedPPMM = localStorage.getItem("ppmm");

if (storedPPMM) {
    calibrated = true;
    ppmm = storedPPMM;
}


function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}


function windowResized() {
    width = window.innerWidth;
    height = window.innerHeight;
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    window.requestAnimationFrame(draw);
}


function mouseMoved(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
}


function mousePressed(event) {
    if (!calibrated) {
        ppmm = event.clientX / calibrationLength;
        calibrated = true;
        localStorage.setItem("ppmm", ppmm);
        window.requestAnimationFrame(draw);
    }
}


function keyPressed(event) {
    switch(event.key) {
        case "c":
            if (!calibMenuShown && !rectMenuShown) {
                calibrated = false;
                ppmm = 10;
                window.requestAnimationFrame(draw);
            }
            break;

        case "l":
            calibMenuShown = !calibMenuShown;

            if (calibMenuShown) {
                calibMenu.classList.remove("hide");
            }
            else {
                calibMenu.classList.add("hide");
                
                //update the calibration length
                const parsed = parseFloat(calibLen.value);

                if (!isNaN(parsed)) {
                    calibrationLength = parsed;
                }
            }
            break;

        case "r":
            rectMenuShown = !rectMenuShown;

            if (rectMenuShown) {
                rectMenu.classList.remove("hide");
            }
            else {
                rectMenu.classList.add("hide");
            }
            break;

        case "d":
            if (!rectMenuShown && !calibMenuShown) {
                rects.pop();
                window.requestAnimationFrame(draw);
            }
    }
}


function draw() {
    ctx.fillStyle = "bg";
    ctx.clearRect(0, 0, width, height);
    
    //draw calibration screen
    if (!calibrated) {
        console.log("drawing calibration screen")
        ctx.fillStyle = fg;
        ctx.textAlign = "center";
        ctx.font = "2rem Monospace";
        ctx.fillText("CALIBRATION", width/2, 150);
    
        ctx.font = "1.5rem Monospace";
        ctx.fillText("Place the short side of a piece of A4 on the 0 mark", width/2, 200);
        ctx.fillText("click where the right hand corner reaches.", width/2, 230);
        ctx.fillText("No A4? Press L to set a different calibration length.", width/2, 280);

        ctx.beginPath()
        ctx.arc(mouseX, height/2, 4, 0, Math.PI * 2);
        ctx.fill();
        window.requestAnimationFrame(draw);
    }
    else {
        //draw all rectangles
        for (const rect of rects) {
            const {w, h} = rect;
    
            ctx.fillStyle = "rgba(100, 0, 200, 0.2)";
            ctx.strokeStyle = fg;
            ctx.beginPath();
            ctx.rect(0, 0, w * ppmm, h * ppmm);
            ctx.fill();
            ctx.stroke();
        }
    }
    
    drawHorizGuide(0, window.innerWidth, window.innerHeight/2, 10, 5);
}


// //takes a position, diagonal length in inches and aspect
// //ratio and draws a rectangle of the correct size
// //using the current calibrated ppmm
function addRect() {
    const diagLenParsed = parseFloat(diagLen.value);
    const aspectXParsed = parseFloat(aspectX.value);
    const aspectYParsed = parseFloat(aspectY.value);
    const valid = !isNaN(diagLenParsed) && 
        !isNaN(aspectXParsed) && 
        !isNaN(aspectYParsed);

    if (valid) {
        const ratio = aspectXParsed / aspectYParsed;
        //calculate height in mm using diagonal length and aspect ratio
        const h = (25.4 * diagLenParsed) / (ratio ** 2 + 1) ** 0.5;

        console.log("Diag len in mm: " + 25.4 * diagLenParsed);
        console.log("Ratio: " + ratio);
        console.log("Width: " + h * ratio);
        console.log("Height: " + h);

        rects.push({
            w: h * ratio,
            h: h
        });
    
        rectMenu.classList.add("hide");
        rectMenuShown = false;
        window.requestAnimationFrame(draw);
    }
}


function drawHorizGuide(xStart, xEnd, y, mainFreq, subFreq) {
    let counter = 0;
    let done = false;

    while (!done) {
        const xPos = counter * ppmm;
        let markLen = 6;

        if (counter % mainFreq === 0) {
            markLen *= 4;
            
            ctx.fillStyle = fg;
            ctx.textAlign = "center";
            ctx.fillText(Math.floor(counter / mainFreq), xPos, y - markLen - 10)
        }
        else if (counter % subFreq === 0) {
            markLen *= 2;
        }

        ctx.strokeStyle = fg;
        line(xStart, y, window.innerWidth, y);
        line(xPos, y - markLen, xPos, y + markLen);

        ++counter;

        done = xStart + counter * ppmm > xEnd;
    }
}