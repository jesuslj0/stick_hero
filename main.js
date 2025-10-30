
// Estado del juego
let phases = {
  WAITING: 'WAITING',
  STRETCHING: 'STRETCHING',
  TURNING: 'TURNING',
  WALKING: 'WALKING',
  TRANSITION: 'TRANSITION',
  FALLING: 'FALLING',
}

let phase;
let lastTimestamp;

let heroX; // Changes when moving forward
let heroY; // Only changes when falling
const heroWidth = 17;
const heroHeight = 30;

let sceneOffset; // Moves the whole game

let platforms = [];
let sticks = [];

let score = 0;
let maxScore = 0;

// Canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const canvasWidth = 800;
const canvasHeight = 375;
const platformHeight = 100;

// Configuration
const stretchingSpeed = 3; // Milliseconds it takes to draw a pixel
const turningSpeed = 4; // Milliseconds it takes to turn a degree
const walkingSpeed = 3;
const transitioningSpeed = 2;
const fallingSpeed = 2;

// UI elements
const scoreElement = document.getElementById("score");
const maxScoreElement = document.getElementById("max-score");
const restartButton = document.getElementById("restart");
const introduction = document.getElementById('introduction');


// Resets game state and layout
function resetGame() {

  phase = phases.WAITING;
  lastTimestamp = undefined;

  platforms = [{x: 50, w: 50}]
  for (let i=1; i<5; i++) {
    generatePlatform()
  }

  heroX = platforms[0].x  + platforms[0].w - 5;
  heroY = 0;

  sceneOffset = 0

  sticks = [{x:  platforms[0].x + platforms[0].w, length: 0,  rotation: 0}]

  score = 0;
  scoreElement.innerHTML = score;
  restartButton.style.display = 'none';

  if (localStorage.getItem('maxScore')) {
    maxScore = localStorage.getItem('maxScore')
    maxScoreElement.innerHTML = `Max Score: ${maxScore}`
  } else {
    maxScore = 0;
  }
  
  draw();
}

// Start game
resetGame();

function generatePlatform() {
  const minimumGap = 40;
  const maximumGap = 200;
  const minimumWidth = 20;
  const maximumWidth = 100;
  
  // X coordinate of the right edge of the furthest platform
  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;
  
  const x =
  furthestX + 
  minimumGap +
  Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
  minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));
  
  platforms.push({ x, w });
}


// Dibujar plataformas
function drawPlatforms() {
  platforms.forEach(({x, w}) => {
    ctx.fillStyle = 'black'
    ctx.fillRect(x, canvasHeight - platformHeight, w, platformHeight)
  }) 
}

// Dibujar el hero
function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.lineTo(x + width - radius, y + height);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.lineTo(x + width, y + radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.lineTo(x + radius, y);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.fill();
}

function drawHero() {
  ctx.save();
  ctx.fillStyle = "black";
  ctx.translate(
    heroX - heroWidth / 2,
    heroY + canvasHeight - platformHeight - heroHeight / 2
  );

  // Body
  drawRoundedRect(
    -heroWidth / 2,
    -heroHeight / 2,
    heroWidth,
    heroHeight - 4,
    5
  );

  // Legs
  const legDistance = 5;
  ctx.beginPath();
  ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();

  // Eye
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
  ctx.fill();

  // Band
  ctx.fillStyle = "red";
  ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
  ctx.beginPath();
  ctx.moveTo(-9, -14.5);
  ctx.lineTo(-17, -18.5);
  ctx.lineTo(-14, -8.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, -10.5);
  ctx.lineTo(-15, -3.5);
  ctx.lineTo(-5, -7);
  ctx.fill();

  ctx.restore();
}

//Dibujar los sticks
function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();
    
    // Move the anchor point to the start of the stick and rotate
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);
    
    // Draw stick
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();
    
    // Restore transformations
    ctx.restore();
  });
}

//Funcion que genera los elementos del canvas segun el estado
function draw() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // Save the current transformation
  ctx.save();

  // Shifting the view
  ctx.translate(-sceneOffset, 0);

  // Draw scene
  drawPlatforms();
  drawHero();
  drawSticks();

  // Restore transformation to the last save
  ctx.restore();
}

window.addEventListener("mousedown", function (event) {
  if (phase == phases.WAITING) {
    phase = phases.STRETCHING;
    lastTimestamp = undefined;
    window.requestAnimationFrame(animate);
  }
});

window.addEventListener("mouseup", function (event) {
  if (phase == phases.STRETCHING) {
    phase = phases.TURNING;
  }
});

restartButton.addEventListener('click', function(event) {
  resetGame()
})

function thePlatformTheStickHits() {
  const lastStick = sticks[sticks.length - 1];
  const stickFarX = lastStick.x + lastStick.length;

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  return platformTheStickHits;
}

function animate(timestamp) {
  if (!lastTimestamp) {
    // First cycle
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  let timePassed = timestamp - lastTimestamp;

  switch (phase) {
    case phases.WAITING:
      return; // Stop the loop
    case phases.STRETCHING: {
      sticks[sticks.length - 1].length += timePassed / stretchingSpeed;
      break;
    }

    case phases.TURNING: {
      sticks[sticks.length - 1].rotation += timePassed / turningSpeed;

      if (sticks[sticks.length - 1].rotation >= 90) {
        sticks[sticks.length - 1].rotation = 90;

        const nextPlatform = thePlatformTheStickHits();
        if (nextPlatform) {
          score++;
          scoreElement.innerText = score;

          if (score > maxScore) {
            maxScore = score;
            localStorage.setItem('maxScore', maxScore.toLocaleString())

            maxScoreElement.innerHTML = `Max Score: ${maxScore}`
          }

          generatePlatform();
        }

        phase = phases.WALKING;
      }
      break;
    }

    case phases.WALKING: {
      heroX += timePassed / walkingSpeed;

      introduction.style.display = 'none'

      const nextPlatform = thePlatformTheStickHits();
      if (nextPlatform) {
        // If the hero will reach another platform then limit its position at its edge
        const maxHeroX = nextPlatform.x + nextPlatform.w - 5;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = phases.TRANSITION;
        }
      } else {
        // If the hero won't reach another platform then limit its position at the end of the pole
        const maxHeroX =
          sticks[sticks.length - 1].x +
          sticks[sticks.length - 1].length;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = phases.FALLING;
        }
      }
      break;
    }
    case phases.TRANSITION: {
      sceneOffset += timePassed / transitioningSpeed;

      const nextPlatform = thePlatformTheStickHits();
      if (nextPlatform.x + nextPlatform.w - sceneOffset < 100) {
        sticks.push({
          x: nextPlatform.x + nextPlatform.w,
          length: 0,
          rotation: 0,
        });
        phase = phases.WAITING;
      }
      break;
    }
    case phases.FALLING: {
      heroY += timePassed / fallingSpeed;

      if (sticks[sticks.length - 1].rotation < 180) {
        sticks[sticks.length - 1].rotation += timePassed / turningSpeed;
      }

      if (score > maxScore) {
        localStorage.setItem('maxScore', score.toLocaleString())
      }
      
      const maxHeroY = platformHeight + 100;
      if (heroY > maxHeroY) {
        restartButton.style.display = "block";
        return;
      }
      break;
    }
  }

  draw();
  lastTimestamp = timestamp;

  window.requestAnimationFrame(animate);
}