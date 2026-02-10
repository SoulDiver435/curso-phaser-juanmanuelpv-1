import { DATA_ASSETS_KEYS } from "../assets/asset-keys.js";

export class DataUtils {
  /**
   *
   * @param {Phaser.Scene} scene
   * @param {number} attackId
   * @returns {import("../types/typedef").Attack | undefined}
   */

  static getMonsterAttack(scene, attackId) {
    /**@type {import("../types/typedef").Attack[]} */
    const data = scene.cache.json.get(DATA_ASSETS_KEYS.ATTACKS);
    return data.find((attack) => attack.id === attackId);
  }

  /**
   *
   * @param {Phaser.Scene} scene
   * @returns {import("../types/typedef").Animation[]}
   */
  static getAnimations(scene) {
    const data = scene.cache.json.get(DATA_ASSETS_KEYS.ANIMATIONS);
    return data;
  }
}
