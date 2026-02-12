import { SCENE_KEYS } from "./scene-keys.js";
import Phaser from "../lib/phaser.js";
import { WORLD_ASSET_KEYS } from "../assets/asset-keys.js";
import { Player } from "../world/characters/player.js";
import { Controls } from "../utils/controls.js";
import { DIRECTION } from "../common/direction.js";
import { TILE_SIZE, TILED_COLLISION_LAYER_ALPHA } from "../config.js";
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../utils/data-manager.js";
import { getTargetPositionFromGameObjectPositionAndDirection } from "../utils/grid-utils.js";
import { CANNOT_READ_SIGN_TEXT, SAMPLE_TEXT } from "../utils/text-utils.js";
import { DialogUi } from "../world/dialog-ui.js";
import { NPC } from "../world/characters/npc.js";
import { Menu } from "../world/menu/menu.js";

const TILED_SIGN_PROPERTY = Object.freeze({
  MESSAGE: "message",
});

const CUSTOM_TILED_TYPES = Object.freeze({
  NPC: "npc",
  NPC_PATH: "npc_path",
});

const TILED_NPC_PROPERTY = Object.freeze({
  IS_SPAWN_POINT: "is_spawn_point",
  MOVEMENT_PATTERN: "movement_pattern",
  MESSAGES: "messages",
  FRAME: "frame",
});

/**
 * @typedef TiledObjectProperty
 * @type {object}
 * @property {string} name
 * @property {string} type
 * @property {any} value
 */

export class WorldScene extends Phaser.Scene {
  /**@type {Player} */
  #player;
  /**@type {Controls} */
  #controls;
  /**@type {Phaser.Tilemaps.TilemapLayer} */
  #encounterLayer;
  /**@type {boolean} */
  #wildMonsterEncounter;
  /**@type {Phaser.Tilemaps.ObjectLayer} */
  #signLayer;
  /**@type {DialogUi} */
  #dialogUi;
  /**@type {NPC[]} */
  #npcs;
  /**@type {NPC | undefined} */
  #npcPlayerIsInteractingWith;
  /**@type {Menu} */
  #menu;

  constructor() {
    super({
      key: SCENE_KEYS.WORLD_SCENE,
      active: false,
    });
  }

  init() {
    this.#wildMonsterEncounter = false;
    this.#npcPlayerIsInteractingWith = undefined;
  }

  create() {
    console.log(`[${WorldScene.name}:create] invoked`);

    const x = 6 * TILE_SIZE;
    const y = 22 * TILE_SIZE;

    this.cameras.main.setBounds(0, 0, 1280, 2176);
    this.cameras.main.setZoom(0.8);
    this.cameras.main.centerOn(x, y);

    const map = this.make.tilemap({ key: WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL });

    //Capa de Colisión
    const collisionTiles = map.addTilesetImage(
      "collision",
      WORLD_ASSET_KEYS.WORLD_COLLISION,
    );

    if (!collisionTiles) {
      console.log(
        `[${WorldScene.name}:create] encountered error while creating collision tiles using data from tiled `,
      );
      return;
    }

    const collisionLayer = map.createLayer("Collision", collisionTiles, 0, 0);

    if (!collisionLayer) {
      console.log(
        `[${WorldScene.name}:create] encountered error while creating collision layer using data from tiled `,
      );
      return;
    }

    collisionLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);

    //Capa Interactiva
    this.#signLayer = map.getObjectLayer("Sign");

    if (!this.#signLayer) {
      console.log(
        `[${WorldScene.name}:create] encountered error while creating sign layer using data from tiled `,
      );
      return;
    }

    //Capa de Encuentros
    const encounterTiles = map.addTilesetImage(
      "encounter",
      WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE,
    );

    if (!encounterTiles) {
      console.log(
        `[${WorldScene.name}:create] encountered error while creating encounter tiles using data from tiled `,
      );
      return;
    }

    this.#encounterLayer = map.createLayer("Encounter", encounterTiles, 0, 0);

    if (!this.#encounterLayer) {
      console.log(
        `[${WorldScene.name}:create] encountered error while creating encounter layer using data from tiled `,
      );
      return;
    }

    this.#encounterLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);

    //Imagen de Background
    this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_BACKGROUND, 0).setOrigin(0);

    //Crear NPC's
    this.#createNPCs(map);

    //Instancia de Player
    this.#player = new Player({
      scene: this,
      position: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION),
      direction: dataManager.store.get(
        DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION,
      ),
      collisionLayer: collisionLayer,
      spriteGridMovementFinishedCallback: () => {
        this.#handlePlayerMovementUpdate();
      },
      spriteChangeDirectionCallback: () => {
        this.#handlePlayerDirectionUpdate();
      },
      otherCharactersToCheckForCollisionsWith: this.#npcs,
    });

    this.cameras.main.startFollow(this.#player.sprite);

    //Añadir nuestras colisiones de NPC's CON PLAYER
    this.#npcs.forEach((npc) => {
      npc.addCharacterToCheckForCollisionWith(this.#player);
    });

    //Crear Foreground para profundidad
    this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_FOREGROUND, 0).setOrigin(0);

    this.#controls = new Controls(this);

    //Crear Ui de Dialogo
    this.#dialogUi = new DialogUi(this, 1288);

    //Crear Menú
    this.#menu = new Menu(this);

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.GAME_STARTED, true);
  }

  #handlePlayerMovementUpdate() {
    //Actualizar posición de Player en data store global
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
      x: this.#player.sprite.x,
      y: this.#player.sprite.y,
    });

    if (!this.#encounterLayer) {
      return;
    }

    const isInEncounterZone =
      this.#encounterLayer.getTileAtWorldXY(
        this.#player.sprite.x,
        this.#player.sprite.y,
        true,
      ).index !== -1;

    if (!isInEncounterZone) {
      return;
    }

    console.log(
      `[${WorldScene.name}:handlePlayerMovementUpdate] player is in encounter zone `,
    );

    this.#wildMonsterEncounter = Math.random() < 0.2;

    if (this.#wildMonsterEncounter) {
      console.log(
        `[${WorldScene.name}:handlePlayerMovementUpdate] player encountered a wild monster!`,
      );
      this.cameras.main.fadeOut(2000);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start(SCENE_KEYS.BATTLE_SCENE);
        },
      );
    }
  }

  /**
   *
   * @param {DOMHighResTimeStamp} time
   * @returns {void}
   */
  update(time) {
    if (this.#wildMonsterEncounter) {
      this.#player.update(time);
      return;
    }

    const wasSpaceKeyPressed = this.#controls.wasSpaceKeyPressed();
    const selectedDirectionHeldDown =
      this.#controls.getDirectionKeyPressedDown();
    const selectedDirectionPressedOnce =
      this.#controls.getDirectionKeyJustPressed();

    if (
      selectedDirectionHeldDown !== DIRECTION.NONE &&
      !this.#isPlayerInputLocked()
    ) {
      this.#player.moveCharacter(selectedDirectionHeldDown);
    }

    if (wasSpaceKeyPressed && !this.#player.isMoving && !this.#menu.isVisible) {
      this.#handlePlayerInteraction();
    }

    if (this.#controls.wasEnterKeyPressed() && !this.#player.isMoving) {
      if (this.#dialogUi.isVisible) {
        return;
      }

      if (this.#menu.isVisible) {
        this.#menu.hide();
        return;
      }

      this.#menu.show();
    }

    if (this.#menu.isVisible) {
      if (selectedDirectionPressedOnce !== DIRECTION.NONE) {
        this.#menu.handlePlayerInput(selectedDirectionPressedOnce);
      }

      if (wasSpaceKeyPressed) {
        this.#menu.handlePlayerInput("OK");

        //TODO handle other selected menu options
        switch (this.#menu.selectedMenuOption) {
          case "SAVE":
            this.#menu.hide();
            dataManager.saveData();
            this.#dialogUi.showDialogModal(["Game progress have been saved"]);
            break;
          case "EXIT":
            this.#menu.hide();
            break;
        }
      }

      if (this.#controls.wasBackKeyPressed()) {
        this.#menu.hide();
      }
    }

    this.#player.update(time);

    this.#npcs.forEach((npc) => {
      npc.update(time);
    });
  }

  #handlePlayerInteraction() {
    if (this.#dialogUi.isAnimationPlaying) {
      return;
    }

    if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.hideDialogModal();
      if (this.#npcPlayerIsInteractingWith) {
        this.#npcPlayerIsInteractingWith.isTalkingToPlayer = false;
        this.#npcPlayerIsInteractingWith = undefined;
      }
      return;
    }

    if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.showNextMessage();
      return;
    }

    const { x, y } = this.#player.sprite;
    const targetPosition = getTargetPositionFromGameObjectPositionAndDirection(
      { x, y },
      this.#player.direction,
    );

    const nearbySign = this.#signLayer.objects.find((object) => {
      if (!object.x || !object.y) return;

      return (
        object.x === targetPosition.x &&
        object.y - TILE_SIZE === targetPosition.y
      );
    });

    if (nearbySign) {
      /**@type {TiledObjectProperty[]} */
      const props = nearbySign.properties;

      /**@type {string} */
      const msg = props.find(
        (prop) => prop.name === TILED_SIGN_PROPERTY.MESSAGE,
      )?.value;

      const usePlaceholderText = this.#player.direction !== DIRECTION.UP;
      let textToShow = CANNOT_READ_SIGN_TEXT;

      if (!usePlaceholderText) {
        textToShow = msg || SAMPLE_TEXT;
      }

      this.#dialogUi.showDialogModal([textToShow]);

      return;
    }

    const nearbyNpc = this.#npcs.find((npc) => {
      return (
        npc.sprite.x === targetPosition.x && npc.sprite.y === targetPosition.y
      );
    });

    if (nearbyNpc) {
      nearbyNpc.facePlayer(this.#player.direction);
      nearbyNpc.isTalkingToPlayer = true;
      this.#npcPlayerIsInteractingWith = nearbyNpc;
      this.#dialogUi.showDialogModal(nearbyNpc.messages);
    }
  }

  #isPlayerInputLocked() {
    return (
      this.#controls.isInputLocked ||
      this.#dialogUi.isVisible ||
      this.#menu.isVisible
    );
  }

  /**
   *
   * @param {Phaser.Tilemaps.Tilemap} map
   * @returns {void}
   */
  #createNPCs(map) {
    this.#npcs = [];

    const npcLayers = map
      .getObjectLayerNames()
      .filter((layername) => layername.includes("NPC"));

    npcLayers.forEach((layerName) => {
      const layer = map.getObjectLayer(layerName);

      const npcObject = layer.objects.find((obj) => {
        return obj.type === CUSTOM_TILED_TYPES.NPC;
      });

      if (
        !npcObject ||
        npcObject.x === undefined ||
        npcObject.y === undefined
      ) {
        return;
      }

      //Capturar los objetos de PATH para este NPC
      const pathObjects = layer.objects.filter((obj) => {
        return obj.type === CUSTOM_TILED_TYPES.NPC_PATH;
      });

      const npcPath = {
        0: {
          x: npcObject.x,
          y: npcObject.y - TILE_SIZE,
        },
      };

      pathObjects.forEach((obj) => {
        if (obj.x === undefined || obj.y === undefined) return;

        npcPath[parseInt(obj.name, 10)] = {
          x: obj.x,
          y: obj.y - TILE_SIZE,
        };
      });

      // console.log(npcPath);

      /**@type {string} */
      const npcFrame =
        /**@type {TiledObjectProperty[]} */ npcObject.properties.find(
          (property) => property.name === TILED_NPC_PROPERTY.FRAME,
        )?.value || "0";

      /**@type {string} */
      const npcMessagesString =
        /**@type {TiledObjectProperty[]} */ npcObject.properties.find(
          (property) => property.name === TILED_NPC_PROPERTY.MESSAGES,
        )?.value || "";

      const npcMessages = npcMessagesString.split("::");
      // console.log(npcMessages);

      const npcMovement =
        /**@type {TiledObjectProperty[]} */ npcObject.properties.find(
          (property) => property.name === TILED_NPC_PROPERTY.MOVEMENT_PATTERN,
        )?.value || "IDLE";

      const npc = new NPC({
        scene: this,
        position: {
          x: npcObject.x,
          y: npcObject.y - TILE_SIZE,
        },
        direction: DIRECTION.DOWN,
        frame: parseInt(npcFrame, 10),
        messages: npcMessages,
        npcPath,
        movementPattern: npcMovement,
      });

      this.#npcs.push(npc);
    });
  }

  #handlePlayerDirectionUpdate() {
    //Actualizar dirección de Player en data store global
    dataManager.store.set(
      DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION,
      this.#player.direction,
    );
  }
}
