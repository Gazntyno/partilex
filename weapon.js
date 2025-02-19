// weapon.js
import * as THREE from "../three.js-master/build/three.module.js";

export class Weapon {
  constructor(fireRate = 500) { // fireRate in milliseconds
    this.fireRate = fireRate;
    this.lastShotTime = 0;
  }
  
  // 'origin' is the starting point for the bullet,
  // 'direction' is a THREE.Vector3 (should be normalized),
  // 'scene' is where the bullet will be added.
  shoot(origin, direction, scene) {
    const currentTime = performance.now();
    if (currentTime - this.lastShotTime < this.fireRate) {
      return null; // Not enough time has passed since the last shot.
    }
    this.lastShotTime = currentTime;
    
    // Create a new bullet and add it to the scene.
    const bullet = new Bullet(origin, direction);
    scene.add(bullet.mesh);
    return bullet;
  }
}

// A basic weapon that simply uses the base shoot method.
export class BasicWeapon extends Weapon {
  constructor(fireRate = 500) {
    super(fireRate);
  }
}

export class ARWeapon extends Weapon {
    /**
     * @param {8} fireRate - Minimum time (in ms) between shots (e.g., 100ms for rapid fire).
     * @param {4} spreadAngle - Maximum spread in radians (e.g., 0.1 for a small spread).
     */
    constructor(fireRate = 100, spreadAngle = 0.1) {
      super(fireRate);
      this.spreadAngle = spreadAngle;
    }
    
    // Override the shoot method to add bullet spread.
    shoot(origin, direction, scene) {
      const currentTime = performance.now();
      if (currentTime - this.lastShotTime < this.fireRate) {
        return null;
      }
      this.lastShotTime = currentTime;
      
      // Add random spread: the bullet's final direction will be the original
      // direction plus a random angle offset within [-spreadAngle/2, spreadAngle/2]
      const spread = (Math.random() - 0.5) * this.spreadAngle; // random offset in radians
      const baseAngle = Math.atan2(direction.y, direction.x);
      const newAngle = baseAngle + spread;
      const newDirection = new THREE.Vector3(Math.cos(newAngle), Math.sin(newAngle), 0);
      
      // Create the bullet with the new direction.
      const bullet = new Bullet(origin, newDirection);
      scene.add(bullet.mesh);
      return bullet;
    }
  }

  export class SniperWeapon extends Weapon {
    constructor(fireRate = 1000) {
      super(fireRate);
    }
    
    shoot(origin, direction, scene) {
      const currentTime = performance.now();
      if (currentTime - this.lastShotTime < this.fireRate) {
        return null;
      }
      this.lastShotTime = currentTime;
      
      // Create a new bullet and add it to the scene.
      const bullet = new sniperBullet(origin, direction);
      scene.add(bullet.mesh);
      return bullet;
    }
  }
// Bullet class: a simple projectile.
export class Bullet {
  constructor(origin, direction, speed = 1000, lifetime = 3000) {
    // Create a simple bullet (a small sphere)
    const geometry = new THREE.SphereGeometry(2, 10, 10);
    const material = new THREE.MeshBasicMaterial({ color: "blue" });
    this.mesh = new THREE.Mesh(geometry, material);
    
    // Set its initial position
    this.mesh.position.copy(origin);
    
    this.damage = 1;
    this.direction = direction.clone().normalize();
    this.speed = speed;
    this.spawnTime = performance.now();
    this.lifetime = lifetime;
  }
  
  update(deltaTime) {
    // Move the bullet along its direction
    this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed * deltaTime));
  }
  
  // Returns true if the bullet's lifetime has expired.
  isExpired() {
    return (performance.now() - this.spawnTime) > this.lifetime;
  }
}

export class sniperBullet extends Bullet {
  constructor(origin, direction, speed = 1000, lifetime = 3000) {
    super(origin, direction, speed, lifetime);
    this.mesh.material.color.set("green");
    this.mesh.scale.set(3, 4, 7);
    this.damage = 4;
  }
}

  
