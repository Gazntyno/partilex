// enemy.js
import * as THREE from "../three.js-master/build/three.module.js";

export class Enemy {
  constructor(initialPosition) {
    // Create a simple enemy mesh 
    const radius = 13; // Adjust this value as needed
    const segments = 20; // Higher segments means a smoother circle
    const geometry = new THREE.CircleGeometry(radius, segments);
    const material = new THREE.MeshBasicMaterial({ color: "red" });
    this.mesh = new THREE.Mesh(geometry, material);
    
    if (initialPosition) {
      this.mesh.position.copy(initialPosition);
    } else {
      this.mesh.position.set(50, 0, 0);
    }

    this.mesh.rotation.x = -Math.PI / 2;

    this.mesh.geometry.computeBoundingSphere();
    this.boundingRadius = this.mesh.geometry.boundingSphere.radius;

    this.speed = 80;
    this.velocity = new THREE.Vector3(0, 0, 0); // For knockback effects.

    this.health = 3;
    this.isDead = false;

    this.hitCooldown = 0;
  }

 // @param {THREE.Vector3} playerPosition // The player's current position.
 // asa@param {number} deltaTime // The time elapsed since the last frame.

  update(playerPosition, deltaTime) {
    if (this.isDead) {
      return;
    }

    this.hitCooldown = Math.max(this.hitCooldown - deltaTime, 0);
    // Move the enemy towards the player (for now, just move along the x-axis)
    const direction = new THREE.Vector3();
    direction.subVectors(playerPosition, this.mesh.position).normalize();

    this.mesh.position.add(direction.multiplyScalar(this.speed * deltaTime));

    if (this.velocity.lengthSq() > 0.001) {
      this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
      // Gradually dampen the knockback (simulate friction).
      this.velocity.multiplyScalar(0.9);
    } else {
      // Otherwise, move toward the player.
      this.mesh.position.add(direction.multiplyScalar(this.speed * deltaTime));
    }
  }

  takeDamage(amount){
    this.health -= amount;
    console.log("Enemy health:", this.health);
    if(this.health <= 0){
      this.isDead = true;
      console.log("Enemy eliminated");
    }
  }

  applyKnockback(direction, force){
    this.takeDamage(1);
    this.velocity.add(direction.clone().multiplyScalar(force));
  }
}
