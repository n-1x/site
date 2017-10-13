//Author: Nicholas J D Dean
//Date Created: 2017-06-17

var boids;     //the array of boids
var obstacles; //array of obstacles

var startingBoids = 25;
var minRadius = 10;
var maxRadius = 20;

var theCanvas;
var resetButton;
var clearBoidsButton;
var clearObstaclesButton;
var boidCountParagraph;

function setup() {
  theCanvas = createCanvas(windowWidth * .4, windowHeight * .5);

  boidCountParagraph = createP();
  boidCountParagraph.parent("p5parent");

  theCanvas.parent("p5parent");
  theCanvas.id("theCanvas");
  theCanvas.style("display", "block");
  theCanvas.style("margin", "auto");

  //disable canvas context menu
  document.getElementById("theCanvas").addEventListener(
    "contextmenu", 
    function(event) {
      event.preventDefault();
    }
  );
  
  resetButton = createButton("Reset");
  resetButton.parent("p5parent");
  resetButton.style("display", "inline");
  resetButton.style("margin", "auto");
  resetButton.style("padding", "10px 20px");
  resetButton.mousePressed(init);

  clearBoidsButton = createButton("Clear Boids");
  clearBoidsButton.parent("p5parent");
  clearBoidsButton.style("display", "inline");
  clearBoidsButton.style("margin", "auto");
  clearBoidsButton.style("padding", "10px 20px");
  clearBoidsButton.mousePressed(function() {
    boids = [];
    updateBoidCounter();
  });

  clearObstaclesButton = createButton("Clear Obstacles");
  clearObstaclesButton.parent("p5parent");
  clearObstaclesButton.style("display", "inline");
  clearObstaclesButton.style("margin", "auto");
  clearObstaclesButton.style("padding", "10px 20px");
  clearObstaclesButton.mousePressed(function() {
    obstacles = [];
  });
  
  init();
}

function init() {
  boids = [];
  obstacles = [];

  //place the starting boids
  for(var i = 0; i < startingBoids; i++) {
    boids[i] = new Boid(width/2, height/2, random(minRadius, maxRadius));
  }

  //place 3 random obstacles
  for (var i = 0; i < 4; i++) {
    obstacles[i] = new Obstacle(random(width), random(height));
  }

  updateBoidCounter();
}



function draw() {
  background(255);

  //for each boid
  for(var i = 0; i < boids.length; i++) {
    //calculate colour based on scale
    var radius = boids[i].radius;
    var colourValue = map(radius, minRadius, maxRadius, 100, 255);
    fill(0, colourValue, 255-colourValue);

    //draw the boid
    push();
    translate(boids[i].location.x, boids[i].location.y);
    ellipse(0, 0, boids[i].radius * 2, boids[i].radius * 2);
    rotate(boids[i].velocity.heading() - PI/2);
    line(0, 0, 0, boids[i].radius);
    pop();

    //add behaviours and update
    boids[i].flock();
    boids[i].update();
  }

  //draw obstacles
  for(var i = 0; i < obstacles.length; i++) {
    fill(255, 0, 0);
    ellipse(obstacles[i].location.x, obstacles[i].location.y, 15, 15);
  }
}


function keyPressed() {

  //add a boid
  if(keyCode == 90) { //90 is z
    boids[boids.length] = new Boid(mouseX, mouseY, random(minRadius, maxRadius));
    updateBoidCounter();
  } 
  //add 5 boids
  else if (keyCode == 88) { //88 is x
    for(var i = 0; i < 5; i++) {
      boids[boids.length] = new Boid(mouseX, mouseY, random(minRadius, maxRadius));
    }
    updateBoidCounter();
  }
  //add an obstacle
  else if (keyCode == 67) { //67 is c
    //if mouse is in canvas
    if(((mouseX > 0) && (mouseX < width)) && 
       ((mouseY > 0) && (mouseY < height))) {
      obstacles[obstacles.length] = new Obstacle(mouseX, mouseY);
    }
  }
}



function updateBoidCounter() {
  boidCountParagraph.html("Number of boids: " + boids.length);
}



//the boid constructor
function Boid(x, y, radius) {
  this.location = createVector(x, y);
  this.maxSpeed = 5;
  this.radius = radius;
  this.velocity = createVector(random(-this.maxSpeed, this.maxSpeed), random(-this.maxSpeed, this.maxSpeed));
  this.acceleration = createVector(0, 0);
  this.maxForce = 0.3;
}



function Obstacle(x, y) {
  this.location = createVector(x, y);
}



//accumulate a force to be applied on next update
Boid.prototype.applyForce = function(force) {
  this.acceleration.add(force);
}



Boid.prototype.update = function() {
  this.velocity.add(this.acceleration); 
  this.velocity.limit(this.maxSpeed);

  this.location.add(this.velocity);

  //wrapping x
  if(this.location.x < -20) {
    this.location.x = width + 20;
  } else if (this.location.x >= width + 20) {
    this.location.x = -20;
  }

  //wrapping y
  if(this.location.y < -20) {
    this.location.y = height + 20;
  } else if (this.location.y >= height + 20) {
    this.location.y = -20;
  }

  this.acceleration.set(0, 0);
}



Boid.prototype.flock = function() {
  var sep = this.separation();
  var ali = this.alignment();
  var coh = this.cohesion();

  sep.mult(1.7);
  ali.mult(1.3);
  coh.mult(1.0);

  //seek or fear mouse based on which button is pressed
  if(mouseIsPressed) {
    var force;
    if(mouseButton == LEFT) {
      force = this.seek(createVector(mouseX, mouseY));
    }
    else if (mouseButton == RIGHT) {
      force = this.fear(createVector(mouseX, mouseY));
      force.mult(3);
    }
    this.applyForce(force);
  } 

  //add a fleeing force for all obstacles
  for(var i = 0; i < obstacles.length; i++) {
    var force = this.fear(obstacles[i].location);

    force.mult(2);
    this.applyForce(force);
    
  }

  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
}



Boid.prototype.separation = function() {
  var desiredSeparation = this.radius * 3;
  var steer = createVector(0, 0);
  var avgEscape = createVector(0, 0);
  var count = 0;

  for(var i = 0; i < boids.length; i++) {
    var b = boids[i];
    var distance = p5.Vector.dist(this.location, b.location);

    // check for >0 so doesn't work on its self
    if ((distance > 0) && (distance < desiredSeparation)) {
      var escapeVector = p5.Vector.sub(this.location, b.location);

      escapeVector.normalize();
      avgEscape.add(escapeVector);
      
      count++;
    }
  }

  if (count > 0) {
    avgEscape.div(count);

    avgEscape.setMag(this.maxSpeed);

    steer = p5.Vector.sub(avgEscape, this.velocity);
    steer.limit(this.maxForce);
  }

  return steer;
}



//a boid wants to have the average velocity
//of its neigbours
Boid.prototype.alignment = function() {
  var range = this.radius * 5;
  var sum = createVector(0, 0);
  var count = 0;
  var steer = createVector(0, 0);
  
  for(var i = 0; i < boids.length; i++) {
    var distance = p5.Vector.dist(this.location, boids[i].location);

    if ((distance > 0) && (distance < range)) {
      sum.add(boids[i].velocity);
      count++;
    }
  }

  if(count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxSpeed);

    steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxForce);
  } 
  
  return steer;
}



//desire to move towards the average position of neighbours
Boid.prototype.cohesion = function () {
  var range = this.radius * 5;
  var count = 0;
  var sum = createVector(0, 0);
  var steer = createVector(0, 0);

  for (var i = 0; i < boids.length; i++) {
    var distance = p5.Vector.dist(this.location, boids[i].location);

    if ((distance > 0) && (distance < range)) {
      sum.add(boids[i].location);
      count++;
    }
  }

  if (count > 0) {
    sum.div(count);
    steer = this.seek(sum);
  } 
  
  return steer;
}



//seek target regardless of range
Boid.prototype.seek = function(target) {
  var desired = p5.Vector.sub(target, this.location);

  desired.normalize();
  desired.mult(this.maxSpeed);

  var steer = p5.Vector.sub(desired, this.velocity);
  steer.limit(this.maxForce);

  return steer;
}



//flee the target if it's in range
Boid.prototype.fear = function(target) {
  var range = this.radius * 5;
  var distance = p5.Vector.dist(this.location, target);
  var steer = createVector(0, 0);

  if(distance < range) {
    var desired = p5.Vector.sub(this.location, target);

    desired.normalize();
    desired.mult(this.maxSpeed);

    steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);
  }

  return steer;
}