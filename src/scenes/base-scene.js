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
  }

  update(time) {
    //
  }

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

  _log(message) {
    console.log(`%c${message}`, "color: orange; background: black");
  }
}
