import { HEALTH_BAR_ASSET_KEYS } from "../../assets/asset-keys.js";
import Phaser from "../../lib/phaser.js";

export class HealthBar {
  /**@type {Phaser.Scene} */
  #scene;
  /**@type {Phaser.GameObjects.Container} */
  #healthBarContainer;
  /**@type {number} */
  #fullWidth;
  /**@type {number} */
  #scaleY;
  /**@type {Phaser.GameObjects.Image} */
  #leftCap;
  /**@type {Phaser.GameObjects.Image} */
  #middle;
  /**@type {Phaser.GameObjects.Image} */
  #rightCap;
  /**@type {Phaser.GameObjects.Image} */
  #leftShadowCap;
  /**@type {Phaser.GameObjects.Image} */
  #middleShadowCap;
  /**@type {Phaser.GameObjects.Image} */
  #rightShadowCap;
  /**
   *
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    this.#scene = scene;
    this.#fullWidth = 360;
    this.#scaleY = 0.7;
    this.#healthBarContainer = this.#scene.add.container(x, y, []);
    this.#createHealthBarShadowImages(x, y);
    this.#createHealthBarImages(x, y);
    this.#setMeterPercentage(1);
  }

  get container() {
    return this.#healthBarContainer;
  }
  /**
   *
   * @param {number} x La posición x para colocar la sombra de la barra de HP
   * @param {number} y La posición y para colocar la sombra de la barra de HP
   * @returns {void}
   */
  #createHealthBarShadowImages(x, y) {
    this.#leftShadowCap = this.#scene.add
      .image(x, y, HEALTH_BAR_ASSET_KEYS.LEFT_CAP_SHADOW)
      .setOrigin(0, 0.5)
      .setScale(1, this.#scaleY);

    this.#middleShadowCap = this.#scene.add
      .image(
        this.#leftShadowCap.x + this.#leftShadowCap.width,
        y,
        HEALTH_BAR_ASSET_KEYS.MIDDLE_SHADOW
      )
      .setOrigin(0, 0.5)
      .setScale(1, this.#scaleY);

    this.#middleShadowCap.displayWidth = this.#fullWidth;

    this.#rightShadowCap = this.#scene.add
      .image(
        this.#middleShadowCap.x + this.#middleShadowCap.displayWidth,
        y,
        HEALTH_BAR_ASSET_KEYS.RIGHT_CAP_SHADOW
      )
      .setOrigin(0, 0.5)
      .setScale(1, this.#scaleY);

    this.#healthBarContainer.add([
      this.#leftShadowCap,
      this.#middleShadowCap,
      this.#rightShadowCap,
    ]);
  }

  /**
   *
   * @param {number} x La posición x para colocar el game object de la barra de HP
   * @param {number} y La posición y para colocar el game object de la barra de HP
   * @returns {void}
   */
  #createHealthBarImages(x, y) {
    this.#leftCap = this.#scene.add
      .image(x, y, HEALTH_BAR_ASSET_KEYS.LEFT_CAP)
      .setOrigin(0, 0.5)
      .setScale(1, this.#scaleY);

    this.#middle = this.#scene.add
      .image(
        this.#leftCap.x + this.#leftCap.width,
        y,
        HEALTH_BAR_ASSET_KEYS.MIDDLE
      )
      .setOrigin(0, 0.5)
      .setScale(1, this.#scaleY);
    this.#middle.displayWidth = this.#fullWidth;

    this.#rightCap = this.#scene.add
      .image(
        this.#middle.x + this.#middle.displayWidth,
        y,
        HEALTH_BAR_ASSET_KEYS.RIGHT_CAP
      )
      .setOrigin(0, 0.5)
      .setScale(1, this.#scaleY);

    this.#healthBarContainer.add([this.#leftCap, this.#middle, this.#rightCap]);
  }

  /**
   *
   * @param {number} [percent = 1] Número entre 0 y 1 que sirve para establecer qué tan llena está la bara de Salud.
   */
  #setMeterPercentage(percent = 1) {
    const width = this.#fullWidth * percent;

    this.#middle.displayWidth = width;
    this.#rightCap.x = this.#middle.x + this.#middle.displayWidth;
  }
  /**
   *
   * @param {number} percent
   * @param {Object} [options]
   * @param {number} [options.duration = 1000]
   * @param {() => void} [options.callback]
   * @param {boolean} [options.skipBattleAnimations=false] determines if we skip the health bar animation
   */
  setMeterPercentageAnimated(percent, options) {
    const width = this.#fullWidth * percent;

    if (options?.skipBattleAnimations) {
      this.#setMeterPercentage(percent);
      if (options?.callback) {
        options.callback();
      }
      return;
    }

    this.#scene.tweens.add({
      targets: this.#middle,
      displayWidth: width,
      duration: options?.duration ?? 1000,
      ease: Phaser.Math.Easing.Sine.Out,
      onUpdate: () => {
        this.#rightCap.x = this.#middle.x + this.#middle.displayWidth;
        const isVisible = this.#middle.displayWidth > 0;
        this.#leftCap.visible = isVisible;
        this.#middle.visible = isVisible;
        this.#rightCap.visible = isVisible;
      },
      onComplete: options?.callback,
    });
  }
}
