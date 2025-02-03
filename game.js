import * as THREE from "../three.js-master/build/three.module.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { EnemySpawner } from "./enemySpawner.js";

// Create a scene
let scene;
let camera;
let renderer;

function init() {
  scene = new THREE.Scene();

  const aspect = window.innerWidth / window.innerHeight;
  const cameraSize = 100;
  camera = new THREE.OrthographicCamera(
    -cameraSize * aspect, //left
    cameraSize * aspect, //right
    cameraSize, //top
    -cameraSize, //bottom
    1, //near
    1000 //far
  );
  camera.position.set(0, 100, 100);
  //camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  scene.add(player.mesh);
  createHealthDisplay();
  createStars();
  windowResize();
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

function showGameOverOverlay() {
  // Create overlay container
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

  // Game Over text
  const gameOverText = document.createElement("div");
  gameOverText.textContent = "GAME OVER";
  gameOverText.style.color = "white";
  gameOverText.style.fontSize = "64px";
  gameOverText.style.marginBottom = "20px";
  overlay.appendChild(gameOverText);

  // Restart button
  const restartButton = document.createElement("button");
  restartButton.textContent = "Restart";
  restartButton.style.padding = "10px 20px";
  restartButton.style.fontSize = "24px";
  restartButton.addEventListener("click", () => {
    // For a full reset, simply reload the page.
    location.reload();
  });
  overlay.appendChild(restartButton);

  document.body.appendChild(overlay);
}
// player logic

let player = new Player();
let bullets = [];
let isShooting = false;

document.addEventListener("keydown", (event) => {
  player.handleKeyDown(event);
});

document.addEventListener("keyup", (event) => {
  player.handleKeyUp(event);
});

document.addEventListener("mousemove", (event) => {
  player.updateRotation(event, renderer, camera);
});

document.addEventListener("mousedown", (event) => {
  isShooting = true;
});

document.addEventListener("mouseup", (event) => {
  isShooting = false;
});

document.addEventListener("wheel", (event) => {
  // Call switchWeapon on the player with event.deltaY.
  // A positive deltaY means scrolling down, negative means scrolling up.
  player.switchWeapon(event.deltaY);
});

function updateCamera() {
  camera.position.x = player.mesh.position.x;
  camera.position.y = player.mesh.position.y + 100;
  camera.position.z = player.mesh.position.z + 100;
  camera.lookAt(player.mesh.position);
}

let enemies = [];
let enemySpawner = new EnemySpawner({
  spawnInterval: 2000,
  spawnMinDistance: 400, // Enemies spawn at least 300 units away from the player.
  spawnMaxDistance: 1400, // Up to 400 units away.
  maxEnemies: 40,
});

function createStars() {
  const numStars = 7000000;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(numStars * 3);
  const starColors = new Float32Array(numStars * 3);

  for (let s = 0; s < numStars; s++) {
    starPositions[s * 3] = (Math.random() - 0.5) * 20000;
    starPositions[s * 3 + 1] = (Math.random() - 0.5) * 20000; // y
    starPositions[s * 3 + 2] = (Math.random() - 0.5) * 20000; // x

    let r = 1;
    let g = 1;
    let b = 1;

    const randomColor = Math.random();
    if (randomColor < 0.1) {
      r = 1;
      g = 1;
      b = 0;
    } else if (randomColor < 0.2) {
      r = 0.5;
      g = 0.5;
      b = 1;
    }

    starColors[s * 3] = r;
    starColors[s * 3 + 1] = g;
    starColors[s * 3 + 2] = b;
  }

  starGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(starPositions, 3)
  );
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
let isGameOver = false;
let animationFrameId;

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - prevTime) / 1000;
  prevTime = currentTime;

  if (isGameOver){
    return;
  }

  player.update();
  updateCamera();

  if (isShooting) {
    const bullet = player.shoot(scene);
    if (bullet) {
      bullets.push(bullet);
    }
  }

  for (let b = bullets.length - 1; b >= 0; b--) {
    bullets[b].update(deltaTime);

    let bulletRemoved = false;

    for (let e = enemies.length - 1; e >= 0; e--) {
      if (enemies[e] && !enemies[e].isDead) {
        const collisionThreshold = enemies[e].boundingRadius;
        const distance = bullets[b].mesh.position.distanceTo(
          enemies[e].mesh.position
        );

        if (distance < collisionThreshold) {
          enemies[e].takeDamage(bullets[b].damage);
          scene.remove(bullets[b].mesh);
          bullets.splice(b, 1);
          bulletRemoved = true;
          break;
        }
      }
    }

    if (bulletRemoved) {
      continue;
    }

    if (bullets[b] && bullets[b].isExpired()) {
      scene.remove(bullets[b].mesh);
      bullets.splice(b, 1);
    }
  }

  if (enemies.length < enemySpawner.maxEnemies) {
    const newEnemy = enemySpawner.update(player.mesh.position, scene);
    if (newEnemy) {
      enemies.push(newEnemy);
      console.log("Enemy spawned at:", newEnemy.mesh.position);
    } else {
      //console.log("Enemy spawn attempt failed");
    }
  }

  // Update each enemy: move them toward the player.
  for (let e = enemies.length - 1; e >= 0; e--) {
    const enemy = enemies[e];
    if (!enemy.isDead) {
      const distance = enemy.mesh.position.distanceTo(player.mesh.position);
      const collisionDistance = player.boundingRadius + enemy.boundingRadius;
      if (distance < collisionDistance && enemy.hitCooldown <= 0) {
        player.takeDamage(1);
        const knockbackDirection = new THREE.Vector3();
        knockbackDirection
          .subVectors(enemy.mesh.position, player.mesh.position)
          .normalize();
        enemy.applyKnockback(knockbackDirection, 800);
        enemy.hitCooldown = 1;
      }
      enemy.update(player.mesh.position, deltaTime);
    } else {
      // Optionally remove dead enemies from the scene and array.
      scene.remove(enemy.mesh);
      enemies.splice(e, 1);
    }
  }

  document.getElementById(
    "healthDisplay"
  ).textContent = `Health: ${player.health}`;

   // If the player's health has dropped to 0 (or below), trigger game over.
   if (player.health <= 0 && !isGameOver) {
    isGameOver = true;
    // Cancel any further animation frames.
    cancelAnimationFrame(animationFrameId);
    // Show the overlay with game over text and restart button.
    showGameOverOverlay();
    return; // Stop updating further.
  }

  renderer.render(scene, camera);
}

init();
animate();
