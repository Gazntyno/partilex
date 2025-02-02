// enemySpawner.js
import * as THREE from "../three.js-master/build/three.module.js";
import { Enemy } from "./enemy.js";

export class EnemySpawner {
  /**
   * @param {Object} options - Options to tweak the spawns.
   * @param {number} options.spawnInterval - Time between spawns in ms (default: 2000).
   * @param {number} options.spawnMinDistance - Minimum distance from the player for spawning (default: 300).
   * @param {number} options.spawnMaxDistance - Maximum distance from the player for spawning (default: 400).
   * @param {number} options.maxEnemies - Maximum number of enemies allowed at once (default: 10).
   */
  constructor(options = {}) {
    this.spawnInterval = options.spawnInterval || 2000; // ms between spawns
    // distance from player
    this.spawnMinDistance = options.spawnMinDistance || 300;
    this.spawnMaxDistance = options.spawnMaxDistance || 400;
    this.maxEnemies = options.maxEnemies || 40;
    this.lastSpawnTime = 0;
  }

  /**
   * Spawns an enemy at a random angle, at a fixed distance from the player.
   * @param {THREE.Vector3} playerPosition - The player's current position.
   * @param {THREE.Scene} scene - The scene to which the enemy is added.
   * @returns {Enemy} The newly spawned enemy.
   */
  spawn(playerPosition, scene) {
    // Generate a random angle between 0 and 2π.
    const angle = Math.random() * Math.PI * 2;

    const distance = this.spawnMinDistance + Math.random() * (this.spawnMaxDistance - this.spawnMinDistance);
    // Compute spawn coordinates relative to the player's position.
    const spawnX = playerPosition.x + Math.cos(angle) * distance;
    const spawnY = playerPosition.y + Math.sin(angle) * distance;
    
    const spawnPosition = new THREE.Vector3(spawnX, spawnY, 0);
    // Create the enemy outside the player's view.
    const enemy = new Enemy(spawnPosition);
    scene.add(enemy.mesh);
    return enemy;
  }

  /**
   * Checks if it's time to spawn an enemy. If so, spawns one.
   * @param {THREE.Vector3} playerPosition - The player's current position.
   * @param {THREE.Scene} scene - The scene to which the enemy is added.
   * @returns {Enemy|null} The newly spawned enemy or null if not time to spawn.
   */
  update(playerPosition, scene) {
    const currentTime = performance.now();
    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      this.lastSpawnTime = currentTime;
      return this.spawn(playerPosition, scene);
    }
    return null;
  }
}
