import * as THREE from "../three.js-master/build/three.module.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { EnemySpawner } from "./enemySpawner.js";

// Create a scene
let scene;
let camera;
let renderer;
let player;
let bullets = [];
let enemies = [];
let enemySpawner;
let isGameStarted = false;
let isGameOver = false;
let isGamePaused = false;
let pauseMenu;
let score = 0;
let isShooting = false;
let animationFrameId;

function init() {
  scene = new THREE.Scene();

  const aspect = window.innerWidth / window.innerHeight;
  const cameraSize = 100;
  camera = new THREE.OrthographicCamera(
    -cameraSize * aspect,
    cameraSize * aspect,
    cameraSize,
    -cameraSize,
    1,
    1000
  );
  camera.position.set(0, 100, 100);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createStars();
  createMainMenu();
  createPauseMenu();
  windowResize();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isGameStarted && !isGameOver) {
      isGamePaused = !isGamePaused;
      if (isGamePaused) showPauseMenu();
      else hidePauseMenu();
    }
  });
}

function createPauseMenu() {
  pauseMenu = document.createElement("div");
  pauseMenu.id = "pauseMenu";
  pauseMenu.style.position = "absolute";
  pauseMenu.style.top = "50%";
  pauseMenu.style.left = "50%";
  pauseMenu.style.transform = "translate(-50%, -50%)";
  pauseMenu.style.textAlign = "center";
  pauseMenu.style.color = "white";
  pauseMenu.style.fontSize = "32px";
  pauseMenu.style.zIndex = "1000";
  pauseMenu.style.display = "none";

  const pauseTitle = document.createElement("h1");
  pauseTitle.textContent = "Paused";
  pauseMenu.appendChild(pauseTitle);

  const resumeButton = document.createElement("button");
  resumeButton.textContent = "Resume";
  resumeButton.style.padding = "10px 20px";
  resumeButton.style.fontSize = "24px";
  resumeButton.addEventListener("click", () => {
    isGamePaused = false;
    hidePauseMenu();
  });
  pauseMenu.appendChild(resumeButton);

  const restartButton = document.createElement("button");
  restartButton.textContent = "Restart";
  restartButton.style.padding = "10px 20px";
  restartButton.style.fontSize = "24px";
  restartButton.addEventListener("click", () => {
    resetGame();
    isGamePaused = false;
    hidePauseMenu();
  });
  pauseMenu.appendChild(restartButton);

  const quitButton = document.createElement("button");
  quitButton.textContent = "Quit Game";
  quitButton.style.padding = "10px 20px";
  quitButton.style.fontSize = "24px";
  quitButton.addEventListener("click", quitToMainMenu);
  pauseMenu.appendChild(quitButton);

  const settingsButton = document.createElement("button");
  settingsButton.textContent = "Settings";
  settingsButton.style.padding = "10px 20px";
  settingsButton.style.fontSize = "24px";
  settingsButton.addEventListener("click", () => {
    alert("Settings menu not implemented yet.");
  });
  pauseMenu.appendChild(settingsButton);

  document.body.appendChild(pauseMenu);
}

// Show/hide pause menu
function showPauseMenu() {
  pauseMenu.style.display = "block";
}

function hidePauseMenu() {
  pauseMenu.style.display = "none";
}

// Reset the game
function resetGame() {
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  if (gameOverOverlay) gameOverOverlay.remove();
  scene.remove(player.mesh);
  enemies.forEach(enemy => scene.remove(enemy.mesh));
  bullets.forEach(bullet => scene.remove(bullet.mesh));
  document.getElementById("healthDisplay").remove();
  document.getElementById("scoreDisplay").remove();
  initializeGame();
  isGameStarted = true;
}

// Quit to main menu
function quitToMainMenu() {
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  if (gameOverOverlay) gameOverOverlay.remove();
  scene.remove(player.mesh);
  enemies.forEach(enemy => scene.remove(enemy.mesh));
  bullets.forEach(bullet => scene.remove(bullet.mesh));
  document.getElementById("healthDisplay").remove();
  document.getElementById("scoreDisplay").remove();
  document.getElementById("mainMenu").style.display = "block";
  isGameStarted = false;
  isGamePaused = false;
  hidePauseMenu();
}

// Update event listeners to respect pause state
function setupEventListeners() {
  document.addEventListener("keydown", (event) => {
    if (isGameStarted && !isGameOver && !isGamePaused) {
      player.handleKeyDown(event);
    }
  });
  document.addEventListener("keyup", (event) => {
    if (isGameStarted && !isGameOver && !isGamePaused) {
      player.handleKeyUp(event);
    }
  });
  document.addEventListener("mousemove", (event) => {
    if (isGameStarted && !isGameOver && !isGamePaused) {
      player.updateRotation(event, renderer, camera);
    }
  });
  document.addEventListener("mousedown", () => {
    if (isGameStarted && !isGameOver && !isGamePaused) isShooting = true;
  });
  document.addEventListener("mouseup", () => {
    if (isGameStarted && !isGameOver && !isGamePaused) isShooting = false;
  });

  document.addEventListener("wheel", (event) => {
    if (isGameStarted && !isGameOver && !isGamePaused) {
      player.switchWeapon(event.deltaY);
    }
  });
}

function createMainMenu() {
  const menuDiv = document.createElement("div");
  menuDiv.id = "mainMenu";
  menuDiv.style.position = "absolute";
  menuDiv.style.top = "50%";
  menuDiv.style.left = "50%";
  menuDiv.style.transform = "translate(-50%, -50%)";
  menuDiv.style.textAlign = "center";
  menuDiv.style.color = "white";
  menuDiv.style.fontSize = "32px";
  menuDiv.style.zIndex = "1000";

  const title = document.createElement("h1");
  title.textContent = "Partilex";
  menuDiv.appendChild(title);

  const startButton = document.createElement("button");
  startButton.textContent = "Start Game";
  startButton.style.padding = "10px 20px";
  startButton.style.fontSize = "24px";
  startButton.addEventListener("click", () => {
    menuDiv.style.display = "none";
    initializeGame();
    isGameStarted = true;
  });
  menuDiv.appendChild(startButton);

  document.body.appendChild(menuDiv);
}

function initializeGame() {
  player = new Player();
  scene.add(player.mesh);
  createHealthDisplay();
  createScoreDisplay();
  setupEventListeners();
  enemySpawner = new EnemySpawner({
    spawnInterval: 2000,
    spawnMinDistance: 400,
    spawnMaxDistance: 1400,
    maxEnemies: 40,
  });
  isGameOver = false;
  score = 0;
  bullets = [];
  enemies = [];
}

function createHealthDisplay() {
  const healthDiv = document.createElement("div");
  healthDiv.id = "healthDisplay";
  healthDiv.style.position = "absolute";
  healthDiv.style.top = "10px";
  healthDiv.style.left = "10px";
  healthDiv.style.color = "white";
  healthDiv.style.fontSize = "24px";
  healthDiv.style.fontFamily = "Arial, sans-serif";
  document.body.appendChild(healthDiv);
}

function createScoreDisplay() {
  const scoreDiv = document.createElement("div");
  scoreDiv.id = "scoreDisplay";
  scoreDiv.style.position = "absolute";
  scoreDiv.style.top = "10px";
  scoreDiv.style.right = "10px";
  scoreDiv.style.color = "white";
  scoreDiv.style.fontSize = "24px";
  scoreDiv.style.fontFamily = "Arial, sans-serif";
  document.body.appendChild(scoreDiv);
}

function showGameOverOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "gameOverOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "1000";

  const gameOverText = document.createElement("div");
  gameOverText.textContent = "GAME OVER";
  gameOverText.style.color = "white";
  gameOverText.style.fontSize = "64px";
  gameOverText.style.marginBottom = "20px";
  overlay.appendChild(gameOverText);

  const restartButton = document.createElement("button");
  restartButton.textContent = "Restart";
  restartButton.style.padding = "10px 20px";
  restartButton.style.fontSize = "24px";
  restartButton.addEventListener("click", () => {
    location.reload();
  });
  overlay.appendChild(restartButton);

  document.body.appendChild(overlay);
}

function updateCamera() {
  if (isGameStarted) {
    camera.position.x = player.mesh.position.x;
    camera.position.y = player.mesh.position.y + 100;
    camera.position.z = player.mesh.position.z + 100;
    camera.lookAt(player.mesh.position);
  }
}

function createStars() {
  const numStars = 7000000;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(numStars * 3);
  const starColors = new Float32Array(numStars * 3);

  for (let s = 0; s < numStars; s++) {
    starPositions[s * 3] = (Math.random() - 0.5) * 20000;
    starPositions[s * 3 + 1] = (Math.random() - 0.5) * 20000;
    starPositions[s * 3 + 2] = (Math.random() - 0.5) * 20000;

    let r = 1, g = 1, b = 1;
    const randomColor = Math.random();
    if (randomColor < 0.1) { r = 1; g = 1; b = 0; }
    else if (randomColor < 0.2) { r = 0.5; g = 0.5; b = 1; }
    starColors[s * 3] = r;
    starColors[s * 3 + 1] = g;
    starColors[s * 3 + 2] = b;
  }

  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 4,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
  });

  const starField = new THREE.Points(starGeometry, starMaterial);
  scene.add(starField);
}

let prevTime = performance.now();

function animate() {
  animationFrameId = requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - prevTime) / 1000;
  prevTime = currentTime;

  if (isGameStarted && !isGameOver && !isGamePaused) {
    player.update();
    updateCamera();

    if (isShooting) {
      const bullet = player.shoot(scene);
      if (bullet) bullets.push(bullet);
    }

    for (let b = bullets.length - 1; b >= 0; b--) {
      bullets[b].update(deltaTime);
      let bulletRemoved = false;
      for (let e = enemies.length - 1; e >= 0; e--) {
        if (enemies[e] && !enemies[e].isDead) {
          const distance = bullets[b].mesh.position.distanceTo(enemies[e].mesh.position);
          if (distance < enemies[e].boundingRadius) {
            score += 4;
            const wasAlive = !enemies[e].isDead;
            enemies[e].takeDamage(bullets[b].damage);
            if (wasAlive && enemies[e].isDead) score += 32;
            scene.remove(bullets[b].mesh);
            bullets.splice(b, 1);
            bulletRemoved = true;
            break;
          }
        }
      }
      if (!bulletRemoved && bullets[b].isExpired()) {
        scene.remove(bullets[b].mesh);
        bullets.splice(b, 1);
      }
    }

    if (enemies.length < enemySpawner.maxEnemies) {
      const newEnemy = enemySpawner.update(player.mesh.position, scene);
      if (newEnemy) enemies.push(newEnemy);
    }

    for (let e = enemies.length - 1; e >= 0; e--) {
      const enemy = enemies[e];
      if (!enemy.isDead) {
        const distance = enemy.mesh.position.distanceTo(player.mesh.position);
        const collisionDistance = player.boundingRadius + enemy.boundingRadius;
        if (distance < collisionDistance && enemy.hitCooldown <= 0) {
          player.takeDamage(1);
          const knockbackDirection = new THREE.Vector3()
            .subVectors(enemy.mesh.position, player.mesh.position)
            .normalize();
          enemy.applyKnockback(knockbackDirection, 800);
          enemy.hitCooldown = 1;
        }
        enemy.update(player.mesh.position, deltaTime);
      } else {
        scene.remove(enemy.mesh);
        enemies.splice(e, 1);
      }
    }

    document.getElementById("healthDisplay").textContent = `Health: ${player.health}`;
    document.getElementById("scoreDisplay").textContent = `Score: ${score}`;

    if (player.health <= 0) {
      isGameOver = true;
      showGameOverOverlay();
    }
  }

  renderer.render(scene, camera);
}

function windowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const cameraSize = 200;
  camera.left = -cameraSize * aspect;
  camera.right = cameraSize * aspect;
  camera.top = cameraSize;
  camera.bottom = -cameraSize;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", windowResize);

init();
animate();
