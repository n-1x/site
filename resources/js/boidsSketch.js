//Author: Nicholas J D Dean
//Date Created: 2017-06-17

var boids = [];
var startingBoids = 50;
var minScale = 0.9;
var maxScale = 1.3;


function setup() {
  var theCanvas = createCanvas(windowWidth * .4, windowHeight * .4);
  
  theCanvas.parent("p5parent");

  for(var i = 0; i < startingBoids; i++) {
    boids[i] = new Boid(width/2, height/2, random(minScale, maxScale));
  }
}


//accumulate a force to be applied on next update
Boid.prototype.applyForce = function(force) {
  this.acceleration.add(force);
}



function draw() {
  background(255);

  //for each boid
  for(var i = 0; i < boids.length; i++) {
    //calculate colour based on scale
    var scale = boids[i].scale;
    var colourValue = map(scale, minScale, maxScale, 100, 255);
    fill(colourValue, 0, 255-colourValue);

    //draw the boid  
    var xPos = boids[i].location.x;
    var yPos = boids[i].location.y;

    push();
    translate(xPos, yPos);
    rotate(boids[i].velocity.heading() - PI/2);
    triangle(-5 * scale, -5 * scale, 0, 15 * scale, 5 * scale, -5 * scale);
    pop();

    //add behaviours and update
    boids[i].flock();
    boids[i].update();
  }
}


//create new boids on mouse drag
// function mouseDragged() {
//   boids[boids.length] = new Boid(mouseX, mouseY, random(minSize, maxSize));
// }


//the boid constructor
function Boid(x, y, scale) {
  this.location = createVector(x, y);
  this.scale = scale;
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.acceleration = createVector(0, 0);
  this.maxSpeed = 5;
  this.maxForce = 0.3;
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

  sep.mult(1.5);
  ali.mult(1);
  coh.mult(1);

  //seek the mouse while it is pressed
  if(mouseIsPressed) {
    var seekForce = this.seek(createVector(mouseX, mouseY));
    seekForce.mult(1);
    this.applyForce(seekForce);
  }

  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
}



Boid.prototype.separation = function() {
  var desiredSeparation = 40;
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
  var range = 50;
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
  var count = 0;
  var sum = createVector(0, 0);
  var steer = createVector(0, 0);
  var range = 50;

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



Boid.prototype.seek = function(target) {
  var desired = p5.Vector.sub(target, this.location);

  desired.normalize();
  desired.mult(this.maxSpeed);

  var steer = p5.Vector.sub(desired, this.velocity);
  steer.limit(this.maxForce);

  return steer;
}



Boid.prototype.arriveMouse = function() {
  var desired = p5.Vector.sub(this.mouseLoc, this.location);

  var d = desired.mag();
  desired.normalize();

  if(d < 100) {
    var m = map(d, 0, 100, 0, this.maxSpeed);
    desired.mult(m);
  } else {
    desired.mult(this.maxSpeed);
  }

  var steer = p5.Vector.sub(desired, this.velocity);
  steer.limit(this.maxForce);

  return steer;
}