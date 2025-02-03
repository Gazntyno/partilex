// player.js
import * as THREE from "../three.js-master/build/three.module.js";
import { BasicWeapon, ARWeapon } from "./weapon.js";

export class Player {
  constructor() {
    // Create the player geometry (a triangle)
    const triangleShape = new THREE.Shape();
    triangleShape.moveTo(0, 1);
    triangleShape.lineTo(-1, -1);
    triangleShape.lineTo(1, -1);
    triangleShape.closePath();

    const triangleGeometry = new THREE.ShapeGeometry(triangleShape);
    const triangleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(triangleGeometry, triangleMaterial);
    // Initial player configuration
    this.mesh.position.set(0, 0, 0);
    this.mesh.scale.set(10, 10, 10);
    this.mesh.rotation.x = -Math.PI / 4;

    this.boundingRadius = 7;

    // Movement flags and speed
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.speed = 1.8;
    this.health = 4;

    this.weapons = [
        new ARWeapon(80,0),
        new BasicWeapon(1000),
    ];

    this.currentWeaponIndex = 0;
    this.weapon = this.weapons[this.currentWeaponIndex];
  }

  update() {
    if (this.moveLeft) {
      this.mesh.position.x -= this.speed;
    }
    if (this.moveRight) {
      this.mesh.position.x += this.speed;
    }
    if (this.moveUp) {
      this.mesh.position.y += this.speed;
    }
    if (this.moveDown) {
      this.mesh.position.y -= this.speed;
    }
  }

  handleKeyDown(event) {
    switch (event.code) {
      case "KeyA":
        this.moveLeft = true;
        break;
      case "KeyD":
        this.moveRight = true;
        break;
      case "KeyW":
        this.moveUp = true;
        break;
      case "KeyS":
        this.moveDown = true;
        break;
    }
  }

  handleKeyUp(event) {
    switch (event.code) {
      case "KeyA":
        this.moveLeft = false;
        break;
      case "KeyD":
        this.moveRight = false;
        break;
      case "KeyW":
        this.moveUp = false;
        break;
      case "KeyS":
        this.moveDown = false;
        break;
    }
  }

  // Update the player's rotation based on mouse position.
  updateRotation(mouseEvent, renderer, camera) {
    const rect = renderer.domElement.getBoundingClientRect();
    const ndcX = ((mouseEvent.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((mouseEvent.clientY - rect.top) / rect.height) * 2 - 1);

    const mouse = new THREE.Vector2(ndcX, ndcY);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();

    raycaster.ray.intersectPlane(plane, intersectPoint);

    const dx = intersectPoint.x - this.mesh.position.x;
    const dy = intersectPoint.y - this.mesh.position.y;
    const angle = Math.atan2(dy, dx);

    this.mesh.rotation.z = angle - Math.PI / 2;
  }

  shoot(scene) {
    const angle = this.mesh.rotation.z + Math.PI / 2;
    const direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    return this.weapon.shoot(this.mesh.position.clone(), direction, scene);
  }

  switchWeapon(delta) {
    // If delta > 0, scroll down: move to next weapon.
    // If delta < 0, scroll up: move to previous weapon.
    if (delta > 0) {
      this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    } else {
      this.currentWeaponIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
    }
    this.weapon = this.weapons[this.currentWeaponIndex];
    console.log("Switched to weapon index:", this.currentWeaponIndex);
  }

  takeDamage(amount) {
    this.health -= amount;
    console.log(`Player took ${amount} damage. Remaining health: ${this.health}`);
    if (this.health <= 0) {
      console.log("Game over");
    }
  }
}
