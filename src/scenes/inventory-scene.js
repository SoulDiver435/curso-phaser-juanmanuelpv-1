import { INVENTORY_ASSET_KEYS, UI_ASSETS_KEYS } from "../assets/asset-keys.js";
import { KENNEY_FUTURE_NARROW_FONT_NAME } from "../assets/font-keys.js";
import { DIRECTION } from "../common/direction.js";
import { dataManager } from "../utils/data-manager.js";
import { exhaustiveGuard } from "../utils/guard.js";
import { NineSlice } from "../utils/nine-slice.js";
import { BaseScene } from "./base-scene.js";
import { SCENE_KEYS } from "./scene-keys.js";

const CANCEL_TEXT_DESCRIPTION = "Close your bag and go back to adventuring!";

const INVENTORY_ITEM_POSITION = Object.freeze({
  x: 50,
  y: 14,
  space: 50,
});

/**@type {Phaser.Types.GameObjects.Text.TextStyle} */
const INVENTORY_TEXT_STYLE = Object.freeze({
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: "#000000",
  fontSize: "30px",
});

/**
 * @typedef InventoryItemGameObjects
 * @type {object}
 * @property {Phaser.GameObjects.Text} [itemName]
 * @property {Phaser.GameObjects.Text} [quantitySign]
 * @property {Phaser.GameObjects.Text} [quantity]
 */

/**@typedef {import("../types/typedef.js").InventoryItem & {gameObjects: InventoryItemGameObjects}} InventoryItemWithGameObjects */

/**
 * @typedef CustomInvetory
 * @type {InventoryItemWithGameObjects[]}
 */

/**
 * @typedef InventorySceneData
 * @type {object}
 * @property {string} previousSceneName
 */

/**
 * @typedef InventorySceneWasResumedData
 * @type {object}
 * @property {boolean} itemUsed
 */

/**
 * @typedef InventorySceneItemUsedData
 * @type {object}
 * @property {boolean} itemUsed
 * @property {import("../types/typedef.js").Item} [item]
 */

export class InventoryScene extends BaseScene {
  /**@type {InventorySceneData} */
  #sceneData;
  /**@type {NineSlice} */
  #nineSliceMainContainer;
  /**@type {Phaser.GameObjects.Text} */
  #selectedInventoryDescriptionText;
  /**@type {Phaser.GameObjects.Image} */
  #userInputCursor;
  /**@type {number} */
  #selectedInventoryOptionIndex;
  /**@type {CustomInvetory} */
  #inventory;
  constructor() {
    super({
      key: SCENE_KEYS.INVENTORY_SCENE,
    });
  }

  /**
   * @param {InventorySceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);

    this.#sceneData = data;
    this.#nineSliceMainContainer = new NineSlice({
      cornetCutSize: 32,
      textureManager: this.sys.textures,
      assetKeys: [UI_ASSETS_KEYS.MENU_BACKGROUND],
    });

    const inventory = dataManager.getInventory(this);

    this.#inventory = inventory.map((inventoryItem) => {
      return {
        item: inventoryItem.item,
        quantity: inventoryItem.quantity,
        gameObjects: {},
      };
    });

    this.#selectedInventoryOptionIndex = 0;
  }

  /**
   * @returns {void}
   */
  create() {
    super.create();

    //create custom background
    this.add
      .image(0, 0, INVENTORY_ASSET_KEYS.INVENTORY_BACKGROUND)
      .setOrigin(0);

    this.add
      .image(40, 120, INVENTORY_ASSET_KEYS.INVENTORY_BAG)
      .setOrigin(0)
      .setScale(0.5);

    const container = this.#nineSliceMainContainer
      .createNineSliceContainer(this, 700, 360, UI_ASSETS_KEYS.MENU_BACKGROUND)
      .setPosition(300, 20);

    const container_BG = this.add
      .rectangle(4, 4, 692, 352, 0xffff88)
      .setOrigin(0)
      .setAlpha(0.6);

    container.add(container_BG);

    const titleContainer = this.#nineSliceMainContainer
      .createNineSliceContainer(this, 240, 64, UI_ASSETS_KEYS.MENU_BACKGROUND)
      .setPosition(64, 20);

    const titleContainer_BG = this.add
      .rectangle(4, 4, 232, 56, 0xffff88)
      .setOrigin(0)
      .setAlpha(0.6);

    titleContainer.add(titleContainer_BG);

    const textTitle = this.add
      .text(116, 28, "Items", INVENTORY_TEXT_STYLE)
      .setOrigin(0.5);

    titleContainer.add(textTitle);

    //create inventory text from available items

    this.#inventory.forEach((item, index) => {
      const posX = INVENTORY_ITEM_POSITION.x;
      const posY =
        INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space;

      const itemText = this.add.text(
        posX,
        posY,
        item.item.name,
        INVENTORY_TEXT_STYLE,
      );

      const qty1Text = this.add.text(620, posY + 2, "x", {
        color: "#000000",
        fontSize: "30px",
      });

      const qty2Text = this.add.text(
        650,
        posY,
        `${item.quantity}`,
        INVENTORY_TEXT_STYLE,
      );

      container.add([itemText, qty1Text, qty2Text]);

      item.gameObjects = {
        itemName: itemText,
        quantity: qty2Text,
        quantitySign: qty1Text,
      };
    });

    //create cancel text
    const cancelText = this.add.text(
      INVENTORY_ITEM_POSITION.x,
      INVENTORY_ITEM_POSITION.y +
        this.#inventory.length * INVENTORY_ITEM_POSITION.space,
      "Cancel",
      INVENTORY_TEXT_STYLE,
    );
    container.add(cancelText);

    //create player input cursor
    this.#userInputCursor = this.add
      .image(30, 30, UI_ASSETS_KEYS.CURSOR)
      .setScale(3);

    container.add(this.#userInputCursor);

    //create inventory description text
    this.#selectedInventoryDescriptionText = this.add.text(25, 420, "", {
      ...INVENTORY_TEXT_STYLE,
      wordWrap: {
        width: this.scale.width - 18,
      },
      color: "#ffffff",
    });

    this.#updateItemDescriptionText();
  }

  update() {
    super.update();

    if (this._controls.isInputLocked) return;

    if (this._controls.wasBackKeyPressed()) {
      this.#goBackToPreviousScene(false);
      return;
    }

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();

    if (wasSpaceKeyPressed) {
      if (this.#isCancelButtonSelected()) {
        this.#goBackToPreviousScene(false);
        return;
      }

      if (this.#inventory[this.#selectedInventoryOptionIndex].quantity < 1)
        return;

      this._controls.lockInput = true;

      /**@type {import("./monster-party-scene.js").MonsterPartySceneData} */
      const sceneDataToPass = {
        previousSceneName: SCENE_KEYS.INVENTORY_SCENE,
        itemSelected: this.#inventory[this.#selectedInventoryOptionIndex].item,
      };

      this.scene.launch(SCENE_KEYS.MONSTER_PARTY_SCENE, sceneDataToPass);
      this.scene.pause(SCENE_KEYS.INVENTORY_SCENE);
      return;
    }

    const selectedDirection = this._controls.getDirectionKeyJustPressed();

    if (selectedDirection !== DIRECTION.NONE) {
      this.#movePlayerInputCursor(selectedDirection);
      this.#updateItemDescriptionText();
    }
  }

  /**
   *
   * @param {Phaser.Scenes.Systems} sys
   * @param {InventorySceneWasResumedData} data
   * @returns
   */
  handleSceneResume(sys, data) {
    super.handleSceneResume(sys, data);

    if (!data || !data.itemUsed) return;

    const selectedItem = this.#inventory[this.#selectedInventoryOptionIndex];
    selectedItem.quantity -= 1;
    selectedItem.gameObjects.quantity.setText(`${selectedItem.quantity}`);

    //TODO - add logic to handle when the last of an item was used

    dataManager.updateInventory(this.#inventory);

    if (this.#sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE) {
      this.#goBackToPreviousScene(true, selectedItem.item);
    }
  }

  #updateItemDescriptionText() {
    if (this.#isCancelButtonSelected()) {
      this.#selectedInventoryDescriptionText.setText(CANCEL_TEXT_DESCRIPTION);
      return;
    }
    this.#selectedInventoryDescriptionText.setText(
      this.#inventory[this.#selectedInventoryOptionIndex].item.description,
    );
  }

  #isCancelButtonSelected() {
    return this.#selectedInventoryOptionIndex === this.#inventory.length;
  }

  /**
   * @param {boolean} wasItemUsed
   * @param {import("../types/typedef.js").Item} [item]
   * @returns {void}
   */
  #goBackToPreviousScene(wasItemUsed, item) {
    this._controls.lockInput = true;

    this.scene.stop(SCENE_KEYS.INVENTORY_SCENE);

    /**@type {InventorySceneItemUsedData} */
    const sceneDataToPass = {
      itemUsed: wasItemUsed,
      item,
    };

    this.scene.resume(this.#sceneData.previousSceneName, sceneDataToPass);
  }

  /**
   *
   * @param {import("../common/direction.js").Direction} direction
   * @returns {void}
   */
  #movePlayerInputCursor(direction) {
    switch (direction) {
      case DIRECTION.UP:
        this.#selectedInventoryOptionIndex--;

        if (this.#selectedInventoryOptionIndex < 0) {
          this.#selectedInventoryOptionIndex = this.#inventory.length;
        }
        break;
      case DIRECTION.DOWN:
        this.#selectedInventoryOptionIndex++;

        if (this.#selectedInventoryOptionIndex > this.#inventory.length) {
          this.#selectedInventoryOptionIndex = 0;
        }
        break;
      case DIRECTION.RIGHT:
      case DIRECTION.LEFT:
        return;
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(direction);
    }

    const y = 30 + this.#selectedInventoryOptionIndex * 50;

    this.#userInputCursor.setY(y);
  }
}
