let bg = "#fff";
let fg = "#000";
const canvas = document.getElementById("canv");
const ctx = canvas.getContext("2d");

let width = 800;
let height = 600;
let mouseX = 0, mouseY = 0;
let zoom = 1;

const gridSize = 80;
let gridSpacing = 10;
let gridWidth = (gridSize - 1) * gridSpacing;

let pan = [window.innerWidth/2 - gridSize * gridSpacing / 2, 
    window.innerHeight/2 - gridSize * gridSpacing / 2];
let panStartLoc = [0,0];
let panning = false;
let saveOnDraw = false;
let lineStarted = false;
let lineStartLoc = [];

let touchZooming = false;
let touchZoomStartDist = 0;

let lines = [];
let undoHistory = [];

window.addEventListener("resize", windowResized, false);
window.addEventListener("keydown", keyPressed, false);
canvas.addEventListener("mousemove", mouseMoved, false);
canvas.addEventListener("mousedown", mousePressed, false);
canvas.addEventListener("mouseup", mouseReleased, false);
canvas.addEventListener("wheel", mouseScrolled, false);

const storedLines = localStorage.getItem("lines");
const storedUndoHistory = localStorage.getItem("undoHistory");

if (storedLines) {
    lines = JSON.parse(storedLines);
}

if (storedUndoHistory) {
    undoHistory = JSON.parse(storedUndoHistory);
}


//bind touch controls
window.addEventListener("touchstart", e => {
    const {clientX : tx, clientY : ty} = e.targetTouches[0];
    panStartLoc = [tx, ty];
    mouseX = tx;
    mouseY = ty;
    e.preventDefault();
}, false);

window.addEventListener("touchmove", e => {
    if (e.targetTouches.length === 1) {
        const {clientX : tx, clientY : ty} = e.targetTouches[0];
        pan[0] += tx - panStartLoc[0];
        pan[1] += ty - panStartLoc[1];
        panStartLoc = [tx, ty];
        mouseX = tx;
        mouseY = ty;
    }
    else {
        const [t1, t2] = e.targetTouches;
        const {clientX : t1x, clientY : t1y} = t1;
        const {clientX: t2x, clientY: t2y} = t2;
        const diff = [t2x - t1x, t2y - t1y];
        const dist = (diff[0] ** 2 + diff[1] ** 2) ** .5;

        if (touchZooming) {

        }
        else {
            touchZooming = true;
        }
    }
});


window.oncontextmenu = event => {
    event.preventDefault();
}

window.requestAnimationFrame(draw);
windowResized();

//draws a line on the canvas
function drawLine(x1, y1, x2, y2, lineWidth = 2) {
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}


//draws a line at the given grid coordinates,
//accounting for pan and zoom
function drawGridLine(x1, y1, x2, y2, lineWidth = 2) {
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1 * gridSpacing * zoom + pan[0], y1 * gridSpacing * zoom + pan[1]);
    ctx.lineTo(x2 * gridSpacing * zoom + pan[0], y2 * gridSpacing * zoom + pan[1]);
    ctx.stroke();
}


function windowResized() {
    width = window.innerWidth;
    height = window.innerHeight;
    ctx.canvas.width = width;
    ctx.canvas.height = height;
}


function mouseMoved(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    calculatePan();
}


function calculatePan() {
    if (panning) {
        const xDiff = mouseX - panStartLoc[0];
        const yDiff = mouseY - panStartLoc[1];

        panStartLoc = [mouseX, mouseY];

        pan[0] += xDiff;
        pan[1] += yDiff;
    }
}


function mousePressed(event) {
    switch(event.which) {
        case 1:
            const gridLoc = getMouseGridPos();

            if (isValidGridPos(gridLoc[0], gridLoc[1])) {
                if (lineStarted) { //finish line
                    lines.push([
                        lineStartLoc,
                        getStraightPos()
                    ]);
                    lineStarted = false;

                    //save lines in local storage
                    localStorage.setItem("lines", JSON.stringify(lines));
                }
                else { //start new line
                    lineStarted = true;
                    lineStartLoc = gridLoc;
                }
            }
            break;

        case 2:
            panning = true;
            panStartLoc = [mouseX, mouseY];
            break;

        case 3:
            if (lineStarted) {
                lineStarted = false;
            }
            break;
    }
}


function mouseReleased(event) {
    switch(event.which) {
        case 2:
            panning = false;
            break;
    }
}


function mouseScrolled(event) {
    //the current mouse location in the world
    const loc = getMouseGridPos();
    const getLocScreenPos = () => {
        return [
            pan[0] + loc[0] * gridSpacing * zoom,
            pan[1] + loc[1] * gridSpacing * zoom
        ];
    };
    const zoomSpeed = 1.05;
    
    const b = getLocScreenPos();
    if (event.deltaY < 0 && zoom < 4) {
        zoom *= zoomSpeed;
    }
    else if (event.deltaY >= 0 && zoom > 0.25) {
        zoom /= zoomSpeed; 
    }
    const a = getLocScreenPos();

    pan[0] += b[0] - a[0];
    pan[1] += b[1] - a[1];
}


function keyPressed(event) {
    switch(event.key) {
        case "u": //undo
            undo();
            break;
        case "s":
            save();
            break;
    }
}


function draw() {
    const tempPan = pan;
    const tempZoom = zoom;

    //prepare canvas for saving
    if (saveOnDraw) {
        const borderSize = 50;
        canvas.width = gridSize * gridSpacing + borderSize * 2;
        canvas.height = canvas.width;

        pan = [borderSize,borderSize];
        zoom = 1;
    }

    const [gridX, gridY] = getMouseGridPos();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = fg;
    ctx.strokeStyle = "#444";
    drawGrid();

    ctx.strokeStyle = fg;
    //draw all lines
    for (const l of lines) {
        const [start, end] = l;

        drawGridLine(start[0], start[1], end[0], end[1], 8);
    }

    //don't draw these things when saving
    if (!saveOnDraw) {
        //draw line in progress
        if (lineStarted) {
            const [startX, startY] = lineStartLoc;        
            const [endX, endY] = getStraightPos();
    
            ctx.strokeStyle = "rgba(100,100,100,.8)";
            drawGridLine(startX, startY, endX, endY, 6);
        }
    
        //draw cursor
        if (isValidGridPos(gridX, gridY)) {
            ctx.beginPath();
            ctx.arc(
                gridX * gridSpacing * zoom + pan[0],
                gridY * gridSpacing * zoom + pan[1],
                5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    //save the image and restore canvas properties
    if (saveOnDraw) {
        saveOnDraw = false;
        
        //open save dialogue
        downloadLink.href = canvas.toDataURL();
        downloadLink.click();

        pan = tempPan;
        zoom = tempZoom;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.requestAnimationFrame(draw);
}


function undo() {
    undoHistory.push(lines.pop());
    localStorage.setItem("undoHistory", JSON.stringify(undoHistory));
}


function redo() {
    lines.push(undoHistory.pop());
}


function save() {
    saveOnDraw = true;
}


//checks if the coordinates are in the grid
function isValidGridPos(x, y) {
    return x >= 0 && x <= gridSize &&
        y >= 0 && y <= gridSize;
}


function getMouseGridPos() {
    return [
        Math.round((mouseX - pan[0]) / (gridSpacing * zoom)),
        Math.round((mouseY - pan[1]) / (gridSpacing * zoom))
    ];
}


function getMouseWorldPos() {
    return [
        (mouseX - pan[0]) / (gridSpacing * zoom),
        (mouseY - pan[1]) / (gridSpacing * zoom)
    ];
}


//gets the location of the end of the line
function getStraightPos() {
    const [gridX, gridY] = getMouseGridPos();
    const [startX, startY] = lineStartLoc;
    const lineX = Math.abs(gridX - startX);
    const lineY = Math.abs(gridY - startY);
    let endX = gridX, endY = gridY;

    if (lineX > lineY) {
        endY = startY;
    }
    else {
        endX = startX;
    }

    return [endX, endY];
}


function drawGrid() {
    for(let x = 0; x <= gridSize; ++x) {
        let lineWidth = 1;

        if (x === 0 || x === gridSize) {
            lineWidth = 6;
        }
        else if (x % 10 === 0) {
            lineWidth = 3;
        }

        //horizontal line
        drawGridLine(0, x, gridSize, x, lineWidth);
        //vertical line
        drawGridLine(x, 0, x, gridSize, lineWidth);
    }
}
