import { DIRECTION } from "../common/direction.js";
import Phaser from "../lib/phaser.js";

export class Controls {
  /**@type {Phaser.Scene} */
  #scene;
  /**@type {Phaser.Types.Input.Keyboard.CursorKeys} */
  #cursorKeys;
  /**@type {boolean} */
  #lockPlayerInput;
  /**@type {Phaser.Input.Keyboard.Key | undefined } */
  #enterKey;
  /**
   *
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.#scene = scene;
    this.#cursorKeys = this.#scene.input.keyboard.createCursorKeys();
    this.#lockPlayerInput = false;
    this.#enterKey = this.#scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );
  }

  get isInputLocked() {
    return this.#lockPlayerInput;
  }

  set lockInput(val) {
    this.#lockPlayerInput = val;
  }

  wasEnterKeyPressed() {
    if (this.#cursorKeys === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#enterKey);
  }

  wasSpaceKeyPressed() {
    if (this.#cursorKeys === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space);
  }

  wasBackKeyPressed() {
    if (this.#cursorKeys === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#cursorKeys.shift);
  }

  getDirectionKeyJustPressed() {
    if (this.#cursorKeys === undefined) {
      return DIRECTION.NONE;
    }

    /** @type {import("../common/direction.js").Direction} */
    let selectedDirection = DIRECTION.NONE;

    if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.left)) {
      selectedDirection = DIRECTION.LEFT;
    } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.right)) {
      selectedDirection = DIRECTION.RIGHT;
    } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.up)) {
      selectedDirection = DIRECTION.UP;
    } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.down)) {
      selectedDirection = DIRECTION.DOWN;
    }

    return selectedDirection;
  }

  getDirectionKeyPressedDown() {
    if (this.#cursorKeys === undefined) {
      return DIRECTION.NONE;
    }

    /** @type {import("../common/direction.js").Direction} */
    let selectedDirection = DIRECTION.NONE;

    if (this.#cursorKeys.left.isDown) {
      selectedDirection = DIRECTION.LEFT;
    } else if (this.#cursorKeys.right.isDown) {
      selectedDirection = DIRECTION.RIGHT;
    } else if (this.#cursorKeys.up.isDown) {
      selectedDirection = DIRECTION.UP;
    } else if (this.#cursorKeys.down.isDown) {
      selectedDirection = DIRECTION.DOWN;
    }

    return selectedDirection;
  }
}
