//Author: Nicholas J D Dean

//colour of the page
let backgroundColour = "#fff";

//colour of the grid lines
let gridColour = "#000";

//canvas size
let width = 800;
let height = 600;

//current mouse position on the screen in pixels
//updated every frame
let mouseX = 0, mouseY = 0;

let gridSize = 80;
let gridSpacing = 10;
let gridWidth = (gridSize - 1) * gridSpacing;

//the current zoom level
let zoom = 1;

//the current pan position
let pan = [0, 0];

//the location used to calculate the pan distance
let panStartLoc = [0,0];

//is the canvas currently being panned
let panning = false;

//whether the next draw call will save the drawn image
//this means that things that shouldn't be on the saved 
//image won't be draw, such as the cursor
let saveOnDraw = false;
let exportName = "kogin";

//is the user currently drawing a delete line
let deleteStarted = false;

//is the user currently drawing a line
let lineStarted = false;

//the location of the line or delete line currently being drawn
let lineStartLoc = [];

//stores all lines on the canvas
let lines = [];

//stores the action history
let actionStack = [];

//stores the actions that have been undone so they can be redone
let undoActionStack = [];

//the colours that are available on the bottom menu. The menu
//is automatically generated from this list
let colours = ["black", "red", "orange", "yellow", "green", "blue", "indigo", "violet"];

//the colour that new lines will have
let currentColour = "black";

const canvas = document.getElementById("canv");
const ctx = canvas.getContext("2d");

window.addEventListener("resize", windowResized, false);
window.addEventListener("keydown", keyPressed, false);
canvas.addEventListener("mousemove", mouseMoved, false);
canvas.addEventListener("mousedown", mousePressed, false);
canvas.addEventListener("mouseup", mouseReleased, false);
canvas.addEventListener("wheel", mouseScrolled, false);

//generate the colour menu from the colours array
for (const colour of colours) {
    const child = document.createElement("button");

    child.style.backgroundColor = colour;
    child.onclick = () => {
        currentColour = colour;
    }

    colourMenu.appendChild(child);
}

//prevent right click context menu
window.oncontextmenu = event => {
    event.preventDefault();
}

reset();
loadLocalStorage();
windowResized();
window.requestAnimationFrame(draw);

//*********************************************************************
//*********************************************************************
//*********************************************************************
//Draw functions
//*********************************************************************
//*********************************************************************
//*********************************************************************

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


//draw the main grid
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


function draw() {
    const [gridX, gridY] = getMouseGridPos();
    const tempPan = pan;
    const tempZoom = zoom;
    
    //position the grid in the center of the canvas
    if (saveOnDraw) {
        const borderSize = 50;
        canvas.width = gridSize * gridSpacing + borderSize * 2;
        canvas.height = canvas.width;
        
        pan = [borderSize, borderSize];
        zoom = 1;
    }
    
    //clear canvas
    ctx.fillStyle = backgroundColour;
    ctx.fillRect(0, 0, width, height);
    
    //draw the grid
    ctx.fillStyle = gridColour;
    ctx.strokeStyle = "#444";
    drawGrid();

    //draw pattern lines
    for (const l of lines) {
        const {start, end, colour} = l;
        ctx.strokeStyle = colour;

        if (deleteStarted) {
            const deleteLine = {
                start: lineStartLoc,
                end: getStraightPos()
            };

            //highlihgt lines that intercept the delete line
            if (linesIntercept(l, deleteLine)) {
                ctx.strokeStyle = "rgba(100,0,0,.5)";
            }
        }
        drawGridLine(start[0], start[1], end[0], end[1], 8, );
    }

    //these things should not be drawn on a frame that will be saved
    if (!saveOnDraw) {
        //draw line in progress
        if (lineStarted || deleteStarted) {
            const [startX, startY] = lineStartLoc;        
            const [endX, endY] = getStraightPos();
    
            ctx.strokeStyle = "rgba(100,100,100,.8)";
            drawGridLine(startX, startY, endX, endY, 6);
        }
    
        //draw cursor
        if (isValidGridPos(gridX, gridY)) {
            ctx.fillStyle = currentColour;
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
        downloadLink.download = exportName;
        downloadLink.click();

        //restore canvas size and viewport
        pan = tempPan;
        zoom = tempZoom;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.requestAnimationFrame(draw);
}

//*********************************************************************
//*********************************************************************
//*********************************************************************
//Event Handlers
//*********************************************************************
//*********************************************************************
//*********************************************************************

function windowResized() {
    width = window.innerWidth;
    height = window.innerHeight;
    ctx.canvas.width = width;
    ctx.canvas.height = height;
}


function mouseMoved(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    if (panning) {
        const xDiff = mouseX - panStartLoc[0];
        const yDiff = mouseY - panStartLoc[1];

        panStartLoc = [mouseX, mouseY];

        pan[0] += xDiff;
        pan[1] += yDiff;
    }
}


function mousePressed(event) {
    const gridLoc = getMouseGridPos();

    switch(event.which) {
        case 1:
            if (deleteStarted) {
                deleteStarted = false;
            }
            else if (isValidGridPos(gridLoc[0], gridLoc[1])) {
                if (lineStarted) { //finish line
                    const line = {
                        start: lineStartLoc,
                        end: getStraightPos(),
                        colour: currentColour
                    };
                    lines.push(line);
                    actionStack.push({
                        type: "draw", 
                        lines: [line]
                    });
                    
                    //clear history for redos
                    undoActionStack = [];

                    saveLocalStorage();

                    lineStarted = false;
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
            else if (deleteStarted) {
                deleteStarted = false;
                deleteInterceptedLines();
            }
            else {
                deleteStarted = true;
                lineStartLoc = gridLoc;
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
        case "n":
            openNewDialog();
            break;

        case "z":
            undo();
            break;

        case "r":
            redo();
            break;

        case "s":
            save();
            break;

        case "o":
            openLoadDialog();
            break;

        case "e":
            exportAsPNG();
            break;
    }
}

//*********************************************************************
//*********************************************************************
//*********************************************************************
//Action functions
//*********************************************************************
//*********************************************************************
//*********************************************************************

//open the dialog for starting a new pattern
function openNewDialog() {
    if (confirm("Start a new pattern?")) {
        reset();
    }
}


//undo the last action
function undo() {
    const lastAction = actionStack.pop();

    if (lastAction !== undefined) {
        undoActionStack.push(lastAction);

        if (lastAction.type === "draw") { //
            for(let i = 0; i < lastAction.lines.length; ++i) {
                lines.pop(); //TODO: can be optimised with splice
            }
        }
        else if (lastAction.type === "delete") {
            for (const line of lastAction.lines) {
                lines.push(line);
            }
        }

        saveLocalStorage();
    }
}


//redo the last action
function redo() {
    const lastUndo = undoActionStack.pop();

    if (lastUndo !== undefined) {
        actionStack.push(lastUndo);

        if (lastUndo.type === "draw") {
            for (const line of lastUndo.lines) {
                lines.push(line);
            }
        }
        else if (lastUndo.type === "delete") {
            for (const line of lastUndo.lines) {
                lines.pop();
            }
        }

        saveLocalStorage();
    }
}


//reset whole application to default state
function reset() {
    lines = [];
    actionStack = [];
    undoActionStack = [];
    pan = [window.innerWidth/2 - gridSize * gridSpacing / 2, 
        window.innerHeight/2 - gridSize * gridSpacing / 2];
    zoom = 1;
    localStorage.clear();
}


//converts lines into a JSON file and downloads it
function save() {
    const promptName = prompt("Enter a file name", "kogin");
    
    if (promptName !== null) {
        const b = new Blob([JSON.stringify(lines)], {type: "application/json"});
        const url = window.URL.createObjectURL(b);
    
        downloadLink.href = url;
        downloadLink.download =  promptName + ".json";
        downloadLink.click();
    }
}


//parse the JSON file currently in the uploader element
function loadFile() {
    const reader = new FileReader();

    reader.onload = () => {
        const result = reader.result;

        reset();
        lines = JSON.parse(result);        
    }
    
    reader.readAsText(uploader.files[0]);
}


//save relevant vairables to local storage
function saveLocalStorage() {
    localStorage.setItem("lines", JSON.stringify(lines));
    localStorage.setItem("actionStack", JSON.stringify(actionStack));
    localStorage.setItem("undoActionStack", JSON.stringify(undoActionStack));
}


//load saved variables form local storage and assign them
function loadLocalStorage() {
    const storedLines = localStorage.getItem("lines");
    const storedActionStack = localStorage.getItem("actionStack");
    const storedUndoActionStack = localStorage.getItem("undoActionStack");

    if (storedLines) {
        lines = JSON.parse(storedLines);
    }

    if (storedActionStack) {
        actionStack = JSON.parse(storedActionStack);
    }

    if (storedUndoActionStack) {
        undoActionStack = JSON.parse(storedUndoActionStack);
    }
}


function openLoadDialog() {
    uploader.click();
}


//delete all the lines intercepted by the current delete line
function deleteInterceptedLines() {
    let index = 0;
    const deletedLines = [];

    while (index < lines.length) {
        const line = lines[index];
        const line2 = {
            start: lineStartLoc,
            end: getStraightPos()
        }

        if (linesIntercept(line, line2)) {
            lines.splice(index, 1);
            deletedLines.push(line);
        }
        else {
            ++index;
        }
    }

    if (deletedLines.length > 0) {
        actionStack.push({
            type: "delete",
            lines: deletedLines
        });

        saveLocalStorage();
    }
}


//sets the flag so the next draw call will create a
//png and download it
function exportAsPNG() {
    const name = prompt("Enter a name for the image", exportName);
    
    if (name !== null) {
        saveOnDraw = true;
        exportName = name + ".png";
    }
}

//*********************************************************************
//*********************************************************************
//*********************************************************************
//Utility functions
//*********************************************************************
//*********************************************************************
//*********************************************************************

//returns true if the two lines intercept
function linesIntercept(line1, line2) {
    const test = (start1, end1, start2, end2) => {
        const [s1x, s1y] = start1;
        const [e1x, e1y] = end1;
        const [s2x, s2y] = start2;
        const [e2x, e2y] = end2;

        return s1x >= s2x && s1x <= e2x &&
            s1y <= s2y && e1y >= s2y;
    };

    //test every combination of which line comees first and which
    //order the line's points are in
    return test(line1.start, line1.end,   line2.start, line2.end)   ||
           test(line1.end,   line1.start, line2.start, line2.end)   ||
           test(line1.start, line1.end,   line2.end,   line2.start) ||
           test(line1.end,   line1.start, line2.end,   line2.start) ||
           
           test(line2.start, line2.end,   line1.start, line1.end)   ||
           test(line2.end,   line2.start, line1.start, line1.end)   ||
           test(line2.start, line2.end,   line1.end,   line1.start) ||
           test(line2.end,   line2.start, line1.end,   line1.start);
}


//checks if the coordinates are in the grid
function isValidGridPos(x, y) {
    return x >= 0 && x <= gridSize &&
        y >= 0 && y <= gridSize;
}


//get the mouse position in the grid accounting
//for pan and zoom 
function getMouseGridPos() {
    return [
        Math.round((mouseX - pan[0]) / (gridSpacing * zoom)),
        Math.round((mouseY - pan[1]) / (gridSpacing * zoom))
    ];
}


//gets the location of the end of the line currently being drawn
//but only allows this to be a straight line
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