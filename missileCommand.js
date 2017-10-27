"use strict";

const canvasElement = document.querySelector('canvas');	// for event handling
let canvas = document.getElementById('canvas');
let c = canvas.getContext('2d');

const WIDTH = 1000;
const HEIGHT = 600;
let frame = 0;
let missilesPerWave = 8;
let bases = [];
let remainingBases = bases;
let siloMissiles = [];
let cities = [];
let enemyMissiles = [];
let spawnProbability = 0.1;
let groundMissiles = [];
let explosions = [];
let enemyTargets = [];
let level = 1;
let pointMultiplier = Math.floor( (level + 1) / 2 );
let multiplierColor = ['#f00', '#0f0', '#f0f', '#0ff', '#ff0', '#fff'];
let scoreColors = ['#fff', '#cff', '#fcc'];
let score = 0;
let highScore = 0;
//let scoring = false;
let missileScore = 0;
let cityScore = 0;

// Creating bases array
const basePadding = 50;
const basePosition = [100, WIDTH / 2, WIDTH - 100];
for (let i = 0; i < basePosition.length; i++) {
	bases.push( new Base(basePosition[i]) );
}

// Stocking missiles
for (let i = 0; i < bases.length; i++) {
	bases[i].stockMissiles();
}

// Creating cities array
for (let i = 0; i < 6; i++) {
	let zone = Math.floor(i / 3);
	let fromLeft = i % 3;
	let leftBase = bases[zone].midPoint + bases[zone].radius;
	let rightBase = bases[zone + 1].midPoint - bases[zone + 1].radius;
	let xPosition = leftBase + (fromLeft + 1) * (rightBase - leftBase) / 4


	cities.push( new City(xPosition, HEIGHT - 50) );
}

////////////////////////////////////////////////////////////

let levelIntroInterval;
let playingInterval;
let missileScoringInterval;
let cityScoringInterval;
let gameOverInterval;
let finalScoreInterval;

levelIntroInterval = setInterval(levelIntro, 1000/30);

// LEVEL INTRO
function levelIntro() {
	draw();

	let intro = [
		'Level    ' + level,
		pointMultiplier + '    x    points',
		'Prepare to defend your cities !'
	];

	let line1 = intro[0].slice(0, frame);

	let line2frame = frame - intro[0].length - intro[1].length - 10;
	let line2Slice = line2frame < 0 ? line2frame : intro[1].length;
	let line2 = intro[1].slice(0, line2Slice);

	let line3frame = frame - intro[0].length - intro[1].length - intro[2].length - 20;
	let line3Slice = line3frame < 0 ? line3frame : intro[2].length;
	let line3 = intro[2].slice(0, line3Slice);

	c.textAlign = 'center';
	c.font = 'bold 30px Arial';
	c.fillStyle = multiplierColor[(pointMultiplier - 1) % multiplierColor.length];
	c.fillText( line1, WIDTH/2, HEIGHT/2 - 150 );
	c.fillText( line2, WIDTH/2, HEIGHT/2 - 75 );
	c.fillText( line3, WIDTH/2, HEIGHT/2 );

	frame ++

	let totalFrames = intro.length * 10;
	for (let i = 0; i < intro.length; i++) {
		totalFrames += intro[i].length;
	}

	if (frame > totalFrames) {
		clearInterval(levelIntroInterval);
		playingInterval = setInterval(playing, 1000/30);
		frame = 0;
	}
}

// PLAYING
function playing() {
	update();
  draw();
  frame ++;
}

// MISSILE SCORING
function missileScoring() {
	frame++;
	draw();

	let xHeading = WIDTH / 3;
	let yCenter = HEIGHT / 2;

	c.fillStyle = '#eee';
	c.font = 'bold 30px Arial';
	c.fillText(missileScore, WIDTH/3, HEIGHT/2 - 50)
	c.fillText(score, WIDTH/3, HEIGHT/2 + 50);

	let delay = 2;
	for (let m = 0; m < siloMissiles.length; m++) {
		if ( m < frame / delay ) {
			let missile = siloMissiles[m];
			let xEnd = xHeading + 30 + m*15;
			let yEnd = yCenter - 50;
			let timing = 5;
			let xStep = (xEnd - missile.xStart) / timing;
			let yStep = (yEnd - missile.yStart) / timing;

			if (missile.y > yEnd) {
				missile.x += xStep;
				missile.y += yStep;
			} else if (missile.scored == false) {
				missile.x = xEnd;
				missile.y = yEnd;
				missileScore += missile.points * pointMultiplier;
				score += missile.points * pointMultiplier;
				missile.scored = true;
			}
		}
	}

	let unscored = siloMissiles.filter(missile => missile.scored == false);
	if (unscored.length == 0) {
		clearInterval(missileScoringInterval);
		cityScoringInterval = setInterval(cityScoring, 1000/30);
		frame = 0;
	}

}

// CITY SCORING
function cityScoring() {
	frame++;
	draw();

	let xHeading = WIDTH / 3;
	let yCenter = HEIGHT / 2;

	c.fillStyle = '#eee';
	c.font = 'bold 30px Arial';
	c.fillText(missileScore, WIDTH/3, HEIGHT/2 - 50)
	c.fillText(cityScore, WIDTH/3, HEIGHT/2);
	c.fillText(score, WIDTH/3, HEIGHT/2 + 50);

	let delay = 15;
	for (let c = 0; c < cities.length; c++) {
		if ( c < frame / delay ) {
			let city = cities[c];
			let xEnd = xHeading + 45 + c*70;
			let yEnd = yCenter + 25;
			let timing = 10;
			let xStep = (xEnd - city.xStart) / timing;
			let yStep = (yEnd - city.yStart) / timing;

			if (city.yCenter > yEnd) {
				city.xCenter += xStep;
				city.yCenter += yStep;
			} else if (city.scored == false) {
				city.xCenter = xEnd;
				city.yCenter = yEnd;
				cityScore += city.points * pointMultiplier;
				score += city.points * pointMultiplier;
				city.scored = true;
			}
		}
	}

	let unscored = cities.filter(city => city.scored == false);
	if (unscored.length == 0) {
		clearInterval(cityScoringInterval);

		bases.forEach(function(base) {
			base.missiles = [];
			base.stockMissiles();
			base.active = true;
		})
		remainingBases = bases;

		cities.forEach(function (city) {
			city.xCenter = city.xStart;
			city.yCenter = city.yStart;
			city.scored = false;
		})

		draw();
		cities.forEach(city => city.points = 500);
		levelIntroInterval = setInterval(levelIntro, 50);

		frame = 0;
		level++;
		pointMultiplier = Math.floor( (level + 1) / 2 );
		spawnProbability += 0.001;

	}
}

// GAME OVER
const colors = ['yellow', 'white'];

let explosionRadius = 200;
let explosionSpeed = 2;
let ringRadius = explosionRadius / 2;
let ringWidth = explosionRadius;
let xTopLeft = WIDTH/2 - explosionRadius;
let yTopLeft = HEIGHT/2 - explosionRadius;
let side = 2 * explosionRadius;


function gameOver() {
	c.clearRect(xTopLeft, yTopLeft, side, side);

	// background
	c.fillStyle = '#002';
	c.fillRect(xTopLeft, yTopLeft, side, side);

	// explosion background
	c.fillStyle = colors[frame % colors.length];
	c.beginPath();
	c.arc(WIDTH/2, HEIGHT/2, explosionRadius - 1, 0, 2 * Math.PI);
	c.fill();

	// text
	c.fillStyle = 'red';
	c.textAlign = 'center';
	c.textBaseline = 'middle';
	c.font = 'bold 115px Arial';
	c.fillText('GAME', WIDTH/2, HEIGHT/2 - 60);
	c.fillText('OVER', WIDTH/2, HEIGHT/2 + 60);

	// explosion radius ring
	if (explosionSpeed * frame < explosionRadius * 2) {
		ringRadius = explosionRadius - 0.5 * Math.abs(explosionRadius - explosionSpeed * frame)// + 0.5 * explosionRadius;
		ringWidth = Math.abs(explosionRadius - explosionSpeed * frame);

		c.strokeStyle = '#002';
		ringRadius += 1;
		ringWidth -= 1;
		c.lineWidth = ringWidth;
		c.beginPath();
		c.arc(WIDTH/2, HEIGHT/2, ringRadius, 0, 2 * Math.PI);
		c.stroke();

	} else {
		frame = 0;
		clearInterval(gameOverInterval);
		finalScoreInterval = setInterval(finalScore, 1000/30);
	}

	frame++;
}

// FINAL SCORE
function finalScore() {
	//draw();
	frame ++

	let closingSpeed = 15;
	let progress = closingSpeed * frame;
	let open =  progress < HEIGHT / 2;
	let buttonColors = ['#f88', '#88f', '#fff'];

	progress = open ? closingSpeed * frame : HEIGHT / 2;
	c.textAlign = 'center';
	c.textBaseline = 'middle';
	c.font = 'bold 80px Arial';

	// Door
	c.fillStyle = 'black';
	c.fillRect(0, 0, WIDTH, progress);
	c.fillRect(0, HEIGHT - progress, WIDTH, progress);

	// Text
	c.fillStyle = 'white';

	c.font = 'bold 60px Arial';
	c.fillText('Your Score:', WIDTH / 2, progress - 150);

	c.font = 'bold 80px Arial';
	c.fillText(score, WIDTH / 2, progress - 50);

	if ( score > highScore && Math.floor(frame / 20) % 2 == 0 ) {				// creating flashing effect
		c.font = 'bold 40px Arial';
		c.fillText("That's a new record !", WIDTH / 2, HEIGHT - progress + 50);
	}

	// Replay
	c.fillStyle = buttonColors[Math.floor(frame / 2) % buttonColors.length];
	c.beginPath();
	c.arc(WIDTH / 2, HEIGHT - progress + 150, 50, 0, 2 * Math.PI);
	c.fill();

	c.fillStyle = '#444';
	c.font = 'bold 22px Arial';
	c.fillText('Replay', WIDTH / 2, HEIGHT - progress + 150);


}

// UPDATE
function update() {
	// New wave of missiles
	if (frame === 0) {
			for (let i = 0; i < missilesPerWave; i++ ) {
					enemyMissiles.push( new EnemyMissile(Math.random() * WIDTH, 0) );
			}
	}

	// Spawning new enemy missiles
	if (Math.random() < spawnProbability && enemyMissiles.length > 0) {
		let idx = Math.floor( Math.random() * enemyMissiles.length );

		for (let j = 0; j < 2; j++) {
			let xStart = enemyMissiles[idx].xEnd;
			let yStart = enemyMissiles[idx].yEnd;
			enemyMissiles.push( new EnemyMissile(xStart, yStart) );
		}
	}

	// Update and kill enemy missiles
	enemyMissiles.forEach( missile => missile.update() );
	enemyMissiles = enemyMissiles.filter (missile => missile.active);

	// Update and kill ground missiles
	groundMissiles.forEach( missile => missile.update() );
	groundMissiles = groundMissiles.filter (missile => missile.active);

	// Update and kill explosions
	explosions.forEach( explosion => explosion.update() );
	explosions = explosions.filter (explosion => explosion.active);

	// Kill bases
	remainingBases = bases.filter (base => base.active);

	// Kill cities
	cities = cities.filter (city => city.active);

	// Filter collisions
	enemyTargets = bases.concat(cities).concat(explosions);

	for (let m = 0; m < enemyMissiles.length; m ++) {
		for (let e = 0; e < enemyTargets.length; e ++) {
			let missile = enemyMissiles[m];
			let enemyTarget = enemyTargets[e];

			let dx = enemyTarget.xCenter - missile.xEnd;
			let dy = enemyTarget.yCenter - missile.yEnd;
			let distance = Math.sqrt(dx * dx + dy * dy);

			if ( distance < enemyTarget.radius ) {
				explosions.push(new Explosion(missile.xEnd, missile.yEnd) );
				missile.active = false;

				if ( explosions.indexOf(enemyTarget) < 0 ) {
					enemyTarget.active = false;
				} else {
					score += missile.points * pointMultiplier;
				}
			}
		}
	}

	if (enemyMissiles.length == 0 && explosions.length == 0) {
		clearInterval(playingInterval);
		frame = 0;
		siloMissiles = [];
		enemyMissiles = [];
		explosions = [];
		c.lineWidth = 2 * 200;

		for (let b = 0; b < remainingBases.length; b++) {
			remainingBases[b].missiles.forEach ( missile => siloMissiles.push(missile) )
		}

		if(cities.length == 0) {
			gameOverInterval = setInterval(gameOver, 1000/30);
		} else {
			missileScoringInterval = setInterval( missileScoring, 1000/30 );
		}
	}

}

//DRAW
function draw() {
	c.clearRect(0, 0, WIDTH, HEIGHT);

	// Redraw the background
	c.fillStyle = '#002';
	c.fillRect(0, 0, WIDTH, HEIGHT);

	// Redraw ground
	c.fillStyle = 'yellow';
	c.fillRect(0, HEIGHT - 50, WIDTH, 50);

	// Redraw enemy missiles
	enemyMissiles.forEach( missile => missile.draw() );

	// Redraw target and ground missiles
	groundMissiles.forEach( missile => missile.draw() );

	// Redraw bases
	remainingBases.forEach( base => base.draw() );

	// Redraw cities
	cities.forEach( city => city.draw() );

	// Redraw explosions
	explosions.forEach( explosion => explosion.draw() );

	// Redraw score
	c.fillStyle = scoreColors[score % colors.length];
	c.textAlign = 'right';
	c.textBaseline = 'top';
	c.font = 'bold 30px Arial';
	c.fillText('Score: ' + score, WIDTH - 100, 20);

}

//////////////////////////////////////////////////////
// ON CLICK
//////////////////////////////////////////////////////
canvasElement.addEventListener('click', function(e) {
	let targetX = e.offsetX;
	let targetY = e.offsetY;

	// Calculating nearest base to target
	let closestBase;
	let nearestDistance = 2 * WIDTH;    // Arbitrary value which is certain to exceed any base from any target position

	for (let i = 0; i < bases.length; i++) {
		var base = bases[i];
		var distX = targetX - bases[i].midPoint;
		var distY = targetY + 50 - HEIGHT;
		var dist = Math.pow( Math.pow(distX, 2) + Math.pow(distY, 2), 0.5 );

		if (dist < nearestDistance && base.missiles.length > 0) {
			nearestDistance = dist;
			closestBase = bases[i];
		}
	}

	closestBase.fire(dist, targetX, targetY);
});

function Base(offsetX) {
	this.radius = 50;
	this.height = HEIGHT - 50;
	this.midPoint = offsetX;
	this.xCenter = offsetX;
	this.yCenter = this.height;
	this.color = 'gray';
	this.missiles = [];
	this.active = true;

	this.stockMissiles = function() {
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j <= i; j++) {
				this.missiles.push( new SiloMissile(offsetX - i*8 + j*16, HEIGHT - 95 + i*10) );
			}
		}
	}

	this.fire = function(dist, targetX, targetY) {
		if (this.missiles.length > 0) {
			groundMissiles.push( new GroundMissile(this, dist, targetX, targetY) );
			this.missiles.pop();
		}
	}

	this.draw = function() {
		// Base outline
		c.fillStyle = this.color;
		c.beginPath();
		c.moveTo(offsetX, HEIGHT - 50);
		c.arc(offsetX, this.height, this.radius, Math.PI, 0);
		c.fill();

		// Silo Missiles
		let missiles = this.missiles.length;
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.fillStyle = 'red';
		c.font = 'bold 15px Arial';

		if (missiles > 0) {
			this.missiles.forEach( missile => missile.draw() );
			if (missiles < 4) { c.fillText('LOW', offsetX, this.height - 10); }

		} else {
			c.fillStyle = 'blue';
			c.fillText('OUT', offsetX, this.height - 20 );
		}
	}
}

function EnemyMissile(xStart, yStart) {
	this.xStart = xStart;
	this.yStart = yStart;
	this.xEnd = this.xStart;
	this.yEnd = this.yStart;
	this.xCenter = this.xEnd;
	this.yCenter = this.yEnd;
	this.radius = 0;
	this.minAngle = Math.atan( HEIGHT / (this.xStart) );
	this.maxAngle = Math.PI - Math.atan( HEIGHT / (WIDTH - this.xStart) );
	this.angle = Math.random() * (this.maxAngle - this.minAngle) + this.minAngle;
	this.color = ['green', 'red', 'blue'];
	this.speed = 2;
	this.xVelocity = - Math.cos(this.angle) * this.speed;
	this.yVelocity = Math.sin(this.angle) * this.speed;
	this.points = 10;
	this.active = true;

	this.draw = function() {
			c.strokeStyle = multiplierColor[(pointMultiplier - 1) % multiplierColor.length];
			c.lineWidth = 2;
			c.beginPath();
			c.moveTo(this.xStart, this.yStart);
			c.lineTo(this.xEnd, this.yEnd);
			c.stroke();
	}

	this.update = function() {
		if (this.yEnd < HEIGHT - 50) {
				this.xEnd += this.xVelocity;
				this.yEnd += this.yVelocity;
				this.xCenter = this.xEnd;
				this.yCenter = this.yEnd;
		} else {
				explosions.push(new Explosion(this.xEnd, this.yEnd));
				this.active = false;
		}
	}
}

function GroundMissile(base, dist, xTarget, yTarget) {
		this.baseMidpoint = base.midPoint;
    this.xTarget = xTarget;
    this.yTarget = yTarget;
    this.xStart = base.midPoint;
    this.yStart = HEIGHT - 50;
    this.xEnd = this.xStart;
    this.yEnd = this.yStart;
	this.missileLength = 2;
    this.color = 'blue';
	this.angle = Math.atan( (yTarget - this.yStart) / (xTarget - this.xStart) );
    this.speed = 20;
		// Velocities have been adjusted to compensage for arctan returning angles between -pi/2 and pi/2
		// Accordingly, cos(a) is always positive (ie: sending missiles to the right)
		// And sin(a) is sometimes positive (ie: sending missiles down)
		this.xVelocity = - this.angle / Math.abs(this.angle) * Math.cos(this.angle) * this.speed;
    this.yVelocity = - Math.abs(Math.sin(this.angle)) * this.speed
    this.active = true;

	this.update = function() {
		// Sending missile to its target
		if ( (yTarget - this.yEnd) < this.yVelocity ) {
				this.xEnd += this.xVelocity;
				this.yEnd += this.yVelocity;
				this.xStart = this.xEnd - this.missileLength * this.xVelocity;
				this.yStart = this.yEnd - this.missileLength * this.yVelocity;
		} else {
			this.xEnd = xTarget;
			this.yEnd = yTarget;
			explosions.push( new Explosion(xTarget, yTarget) );
			this.active = false;
	}
}

	this.draw = function() {
    // Crosshairs
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.font = '11pt Arial';
		c.fillStyle = '#fff';
		c.fillText('x', this.xTarget, this.yTarget);

		// Missile
		c.strokeStyle = '#00f';
		c.lineWidth = 2;
		c.beginPath();
		c.moveTo(this.xStart, this.yStart);
		c.lineTo(this.xEnd, this.yEnd);
		c.stroke();
	}
}

function Explosion(xTarget, yTarget) {
	this.xCenter = xTarget;
	this.yCenter = yTarget;
	this.stage = 0;
	this.radius;
	this.maxRadius = 40;
	this.colors = ['#eee'];
	this.active = true;

	this.update = function() {
		if (this.stage < this.maxRadius * 2) {
			this.radius = this.maxRadius - Math.abs(this.maxRadius - this.stage);
			this.stage += 1;
		} else {
			this.active = false;
		}
	}

	this.draw = function() {
		c.beginPath();
		c.moveTo(xTarget, yTarget);
		c.fillStyle = this.colors[this.stage % this.colors.length];
		c.arc(xTarget, yTarget, this.radius, 0, 2 * Math.PI);
		c.fill();
	}
}

function SiloMissile(x, y) {
	this.xStart = x;
	this.yStart = y
	this.x = this.xStart;
	this.y = this.yStart;
	this.points = 10;
	this.scored = false;

	this.draw = function() {
	c.strokeStyle = '#00f';
	c.lineWidth = 2;

	c.beginPath();
	c.moveTo(this.x, this.y);
	c.lineTo(this.x, this.y + 8);
	c.lineTo(this.x - 3, this.y + 10);
	c.moveTo(this.x, this.y + 8);
	c.lineTo(this.x + 3, this.y + 10);
	c.stroke();
	}
}

function City(x, y) {
	this.buildings = 6;
	//this.ground = HEIGHT - 60;
	this.buildingWidth = 4;
	this.buildingSpace = 2;
	//this.maxHeight = HEIGHT - 80;
	//this.minHeight = HEIGHT - 50;
	this.xStart = x;
	this.yStart = y;
	this.xCenter = this.xStart;
	this.yCenter = this.yStart;
	this.radius = this.buildings * (this.buildingWidth + this.buildingSpace);
	this.color = 'gray';
	this.points = 500;
	this.scored = false;
	this.active = true;
	this.heights = [];

	this.design = function() {
		for (let i = 0; i < this.buildings; i++) {
			this.heights.push(10 + Math.random() * 10 );
		}
	}

	this.draw = function() {
		c.strokeStyle = this.color;
		c.lineWidth = 4;
		c.beginPath();

		for (let i = 0; i < this.buildings; i++) {
			let xBuilding = this.xCenter + (i - this.buildings / 2) * (this.buildingWidth + this.buildingSpace)
			c.moveTo( xBuilding, this.yCenter );
			c.lineTo( xBuilding, this.yCenter - this.heights[i] );
		}
		c.stroke();
	}

	this.design();
}
