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

  createStars();
  windowResize();
}

function windowResize(){
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

function updateCamera(){
  camera.position.x = player.mesh.position.x;
  camera.position.y = player.mesh.position.y + 100;
  camera.position.z = player.mesh.position.z + 100;
  camera.lookAt(player.mesh.position);
}

let enemies = [];
let enemySpawner = new EnemySpawner({
  spawnInterval: 2000,
  spawnMinDistance: 300,   // Enemies spawn at least 300 units away from the player.
  spawnMaxDistance: 500,   // Up to 400 units away.
  maxEnemies: 40,
});



function createStars(){
  const numStars = 7000000;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(numStars * 3);
  const starColors = new Float32Array(numStars * 3);

  for (let s = 0; s < numStars; s++){
    starPositions[s * 3] = (Math.random() - 0.5) * 20000;
    starPositions[s * 3 + 1] = (Math.random() - 0.5) * 20000; // y
    starPositions[s * 3 + 2] = (Math.random() - 0.5) * 20000; // x

    let r = 1;
    let g = 1;
    let b = 1;

    const randomColor = Math.random();
    if(randomColor < 0.1){
      r = 1;
      g = 1;
      b = 0;
    } else if(randomColor < 0.2){
      r = 0.5;
      g = 0.5;
      b = 1;
    }

    starColors[s * 3] = r;
    starColors[s * 3 + 1] = g;
    starColors[s * 3 + 2] = b;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

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
  requestAnimationFrame(animate);
  

  const currentTime = performance.now();
  const deltaTime = (currentTime - prevTime) / 1000;
  prevTime = currentTime;

  player.update();
  updateCamera();

  if(isShooting){
    const bullet = player.shoot(scene);
    if(bullet){
      bullets.push(bullet);
    }
  }

  for(let b = bullets.length - 1; b >= 0; b--){
    bullets[b].update(deltaTime);

    let bulletRemoved = false;

    for (let e = enemies.length - 1; e >= 0; e--) {
      if(enemies && !enemies.isDead){
        const collisionThreshold = enemies[e].boundingRadius;
        const distance = bullets[b].mesh.position.distanceTo(enemies[e].mesh.position);
        
        if(distance < collisionThreshold){
          enemies[e].takeDamage(bullets[b].damage);
          scene.remove(bullets[b].mesh);
          bullets.splice(b, 1);
          bulletRemoved = true;
          break;
        }
    }

    }

    if(bulletRemoved){
      continue;
    }
  
    if(bullets[b] && bullets[b].isExpired()){
      scene.remove(bullets[b].mesh);
      bullets.splice(b, 1);
    }
    
  }

  

  if (enemies.length < enemySpawner.maxEnemies) {
    const newEnemy = enemySpawner.update(player.mesh.position, scene);
    if (newEnemy) {
      enemies.push(newEnemy);
    }
  }

  // Update each enemy: move them toward the player.
  for (let e = enemies.length - 1; e >= 0; e--) {
    if (!enemies[e].isDead) {
      enemies[e].update(player.mesh.position, deltaTime);
    } else {
      // Optionally remove dead enemies from the scene and array.
      scene.remove(enemies[e].mesh);
      enemies.splice(e, 1);
    }
  }

  renderer.render(scene, camera);
 
}

init();
animate();
