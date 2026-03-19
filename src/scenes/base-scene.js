import Phaser from "../lib/phaser.js";
import { Controls } from "../utils/controls.js";
import { SCENE_KEYS } from "./scene-keys.js";

export class BaseScene extends Phaser.Scene {
  /**@type {Controls} */
  _controls;
  constructor(config) {
    super(config);

    if (this.constructor === BaseScene) {
      throw new Error(
        "BaseScene is an abstract class and cannot be instantiated directly.",
      );
    }
  }

  init(data) {
    if (data) {
      this._log(
        `[${this.constructor.name}:init] invoked, data provided : ${JSON.stringify(data)}`,
      );
      return;
    }

    this._log(`[${this.constructor.name}:init] invoked`);
  }

  preload() {
    this._log(`[${this.constructor.name}:preload] invoked`);
  }

  create() {
    this._log(`[${this.constructor.name}:create] invoked`);

    this._controls = new Controls(this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.handleSceneResume, this);
    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.handleSceneCleanup,
      this,
    );

    this.scene.bringToTop();
  }

  update(time) {
    //
  }

  /**
   * @param {Phaser.Scenes.Systems} sys
   * @param {any | undefined} [data]
   * @returns {void}
   */
  handleSceneResume(sys, data) {
    this._controls.lockInput = false;

    if (data) {
      this._log(
        `[${this.constructor.name}:handleSceneResume] invoked, data provided ${JSON.stringify(data)}`,
      );
      return;
    }

    this._log(`[${this.constructor.name}:handleSceneResume] invoked`);
  }

  handleSceneCleanup() {
    this._log(`[${this.constructor.name}:handleSceneCleanup] invoked`);
    this.events.off(Phaser.Scenes.Events.RESUME, this.handleSceneResume, this);
  }

  _log(message) {
    console.log(`%c${message}`, "color: orange; background: black");
  }
}
