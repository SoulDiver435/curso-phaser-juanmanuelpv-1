import { SCENE_KEYS } from "./scene-keys.js";
import Phaser from "../lib/phaser.js";
import { AUDIO_ASSET_KEYS, WORLD_ASSET_KEYS } from "../assets/asset-keys.js";
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
import { BaseScene } from "./base-scene.js";
import { DataUtils } from "../utils/data-utils.js";
import { playBackgroundMusic, playSoundFX } from "../utils/audio-utils.js";
import { weightedRandom } from "../utils/random.js";
import { Item } from "../world/item.js";

/**
 * @typedef TiledObjectProperty
 * @type {object}
 * @property {string} name
 * @property {string} type
 * @property {any} value
 */

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

const TILED_ENCOUNTER_PROPERTY = Object.freeze({
  AREA: "area",
});

const TILED_ITEM_PROPERTY = Object.freeze({
  ITEM_ID: "item_id",
  ID: "id",
});

/**
 * @typedef WorldSceneData
 * @type {object}
 * @property {boolean} [isPlayerKnockedOut]
 * @property {string} [area]
 * @property {boolean} [isInterior]
 */

export class WorldScene extends BaseScene {
  /**@type {Player} */
  #player;
  /**@type {Phaser.Tilemaps.TilemapLayer | undefined} */
  #encounterLayer;
  /**@type {boolean} */
  #wildMonsterEncounter;
  /**@type {Phaser.Tilemaps.ObjectLayer | undefined} */
  #signLayer;
  /**@type {DialogUi} */
  #dialogUi;
  /**@type {NPC[]} */
  #npcs;
  /**@type {NPC | undefined} */
  #npcPlayerIsInteractingWith;
  /**@type {Menu} */
  #menu;
  /**@type {WorldSceneData} */
  #sceneData;
  /**@type {Item[]} */
  #items;
  /**@type {Phaser.Tilemaps.ObjectLayer | undefined} */
  #entranceLayer;

  constructor() {
    super({
      key: SCENE_KEYS.WORLD_SCENE,
      active: false,
    });
  }

  /**
   * @param {WorldSceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);
    this.#sceneData = data;

    // if (Object.keys(data).length === 0) {
    //   this.#sceneData = {
    //     isPlayerKnockedOut: false,
    //   };
    // }

    /**@type {string} */
    const area =
      this.#sceneData?.area ||
      dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION).area;

    let isInterior = this.#sceneData?.isInterior;

    if (isInterior === undefined) {
      isInterior = dataManager.store.get(
        DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION,
      ).isInterior;
    }

    const isPlayerKnockedOut = this.#sceneData?.isPlayerKnockedOut || false;

    this.#sceneData = {
      area,
      isInterior,
      isPlayerKnockedOut,
    };

    //Actualizar loccalización del player y mapear data si el jugador ha sido noqueado en una batalla
    if (this.#sceneData.isPlayerKnockedOut) {
      dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
        x: 6 * TILE_SIZE,
        y: 21 * TILE_SIZE,
      });

      dataManager.store.set(
        DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION,
        DIRECTION.DOWN,
      );
    }

    dataManager.store.set(
      DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION,
      /**@type {import("../utils/data-manager.js").PlayerLocation} */ ({
        area: this.#sceneData.area,
        isInterior: this.#sceneData.isInterior,
      }),
    );

    this.#wildMonsterEncounter = false;
    this.#npcPlayerIsInteractingWith = undefined;
    this.#items = [];

    this.#encounterLayer = undefined;
    this.#signLayer = undefined;
    this.#encounterLayer = undefined;
    this.#entranceLayer = undefined;
  }

  create() {
    super.create();

    const map = this.make.tilemap({
      key: `${this.#sceneData.area.toUpperCase()}_LEVEL`,
    });

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
    const hasSignLayer = map.getObjectLayer("Sign") !== null;

    if (hasSignLayer) {
      this.#signLayer = map.getObjectLayer("Sign");
    }

    //Crear capa para entradas con transiciones de escena
    const hasSceneTransitionLayer =
      map.getObjectLayer("Scene-Transitions") !== null;

    if (hasSceneTransitionLayer) {
      this.#entranceLayer = map.getObjectLayer("Scene-Transitions");
    }

    //Capa de Encuentros
    const hasEncounterLayer = map.getLayerIndexByName("Encounter") !== null;

    if (hasEncounterLayer) {
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
      this.#encounterLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);
    }

    if (!this.#sceneData.isInterior) {
      this.cameras.main.setBounds(0, 0, 1280, 2176);
    }

    this.cameras.main.setZoom(0.8);

    //Imagen de Background
    this.add
      .image(0, 0, `${this.#sceneData.area.toUpperCase()}_BACKGROUND`, 0)
      .setOrigin(0);

    //Crear Items y colisiones
    this.#createItems(map);

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
      objectsToCheckForCollisionsWith: this.#items,
      entranceLayer: this.#entranceLayer,
      enterEntranceCallback: (
        entranceName,
        entrance_id,
        isBuildingEntrance,
      ) => {
        this.#handleEntranceEnteredCallback(
          entranceName,
          entrance_id,
          isBuildingEntrance,
        );
      },
    });

    this.cameras.main.startFollow(this.#player.sprite);

    //Añadir nuestras colisiones de NPC's CON PLAYER
    this.#npcs.forEach((npc) => {
      npc.addCharacterToCheckForCollisionWith(this.#player);
    });

    //Crear Foreground para profundidad
    this.add
      .image(0, 0, `${this.#sceneData.area.toUpperCase()}_FOREGROUND`, 0)
      .setOrigin(0);

    //Crear Ui de Dialogo
    this.#dialogUi = new DialogUi(this, 1288);

    //Crear Menú
    this.#menu = new Menu(this);

    this.cameras.main.fadeIn(1000, 0, 0, 0, (camera, progress) => {
      //Si el jugador fue noqueado vamos a bloquear el input, curar al jugador y tener al NPC mostrando mensaje
      if (progress === 1) {
        if (this.#sceneData.isPlayerKnockedOut) {
          this.#healPlayerParty();
          this.#dialogUi.showDialogModal([
            "It looks like your team put up quite a fight...",
            "I went ahead and healed them up for you.",
          ]);
        }
      }
    });
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.GAME_STARTED, true);

    playBackgroundMusic(this, AUDIO_ASSET_KEYS.MAIN);
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

    playSoundFX(this, AUDIO_ASSET_KEYS.GRASS);

    console.log(
      `[${WorldScene.name}:handlePlayerMovementUpdate] player is in encounter zone `,
    );

    this.#wildMonsterEncounter = Math.random() < 0.2;

    if (this.#wildMonsterEncounter) {
      const encounterAreaId =
        /**@type {TiledObjectProperty[]} */
        (this.#encounterLayer.layer.properties).find(
          (prop) => prop.name === TILED_ENCOUNTER_PROPERTY.AREA,
        ).value;

      const possibleMonsters = DataUtils.getEncounterAreaDetails(
        this,
        encounterAreaId,
      );

      const randomMonsterId = weightedRandom(possibleMonsters);

      console.log(
        `[${WorldScene.name}:handlePlayerMovementUpdate] player encountered a wild monster in area ${encounterAreaId} and monster Id has been picked randomly: ${randomMonsterId}!`,
      );
      this.cameras.main.fadeOut(2000);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          /**@type {import("./battle-scene.js").BattleSceneData} */
          const dataToPass = {
            enemyMonsters: [DataUtils.getMonsterById(this, randomMonsterId)],
            playerMonsters: dataManager.store.get(
              DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY,
            ),
          };
          this.scene.start(SCENE_KEYS.BATTLE_SCENE, dataToPass);
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
    super.update();

    if (this.#wildMonsterEncounter) {
      this.#player.update(time);
      return;
    }

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    const selectedDirectionHeldDown =
      this._controls.getDirectionKeyPressedDown();
    const selectedDirectionPressedOnce =
      this._controls.getDirectionKeyJustPressed();

    if (
      selectedDirectionHeldDown !== DIRECTION.NONE &&
      !this.#isPlayerInputLocked()
    ) {
      this.#player.moveCharacter(selectedDirectionHeldDown);
    }

    if (wasSpaceKeyPressed && !this.#player.isMoving && !this.#menu.isVisible) {
      this.#handlePlayerInteraction();
    }

    if (this._controls.wasEnterKeyPressed() && !this.#player.isMoving) {
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

        switch (this.#menu.selectedMenuOption) {
          case "SAVE":
            {
              this.#menu.hide();
              dataManager.saveData();
              this.#dialogUi.showDialogModal(["Game progress have been saved"]);
            }
            break;
          case "EXIT":
            {
              this.#menu.hide();
            }
            break;
          case "MONSTERS":
            {
              /**@type {import("./monster-party-scene.js").MonsterPartySceneData} */
              const sceneDataToPass = {
                previousSceneName: SCENE_KEYS.WORLD_SCENE,
              };

              this.scene.launch(
                SCENE_KEYS.MONSTER_PARTY_SCENE,
                sceneDataToPass,
              );
              this.scene.pause();
            }
            break;
          case "BAG":
            {
              /**@type {import("./inventory-scene.js").InventorySceneData} */
              const sceneDataToPass = {
                previousSceneName: SCENE_KEYS.WORLD_SCENE,
              };

              this.scene.launch(SCENE_KEYS.INVENTORY_SCENE, sceneDataToPass);
              this.scene.pause();
            }
            break;
        }

        //TODO handle other selected menu options
      }

      if (this._controls.wasBackKeyPressed()) {
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

    const nearbySign = this.#signLayer?.objects.find((object) => {
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

    console.log(nearbyNpc);

    if (nearbyNpc) {
      nearbyNpc.facePlayer(this.#player.direction);
      nearbyNpc.isTalkingToPlayer = true;
      this.#npcPlayerIsInteractingWith = nearbyNpc;
      this.#dialogUi.showDialogModal(nearbyNpc.messages);
    }

    let nearbyItemIndex;
    const nearbyItem = this.#items.find((item, index) => {
      if (
        item.position.x === targetPosition.x &&
        item.position.y === targetPosition.y
      ) {
        nearbyItemIndex = index;
        return true;
      }
      return false;
    });

    if (nearbyItem) {
      const item = DataUtils.getItem(this, nearbyItem.id);
      dataManager.addItem(item, 1);
      nearbyItem.gameObject.destroy();
      this.#items.splice(nearbyItemIndex, 1);
      dataManager.addItemPickedUp(nearbyItem.id);
      this.#dialogUi.showDialogModal([`You found a ${item.name}`]);
    }
  }

  #isPlayerInputLocked() {
    return (
      this._controls.isInputLocked ||
      this.#dialogUi.isVisible ||
      this.#menu.isVisible
    );
  }

  /**
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

  #healPlayerParty() {
    /**@type {import("../types/typedef.js").Monster[]} */
    const monsters = dataManager.store.get(
      DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY,
    );

    monsters.forEach((m) => {
      m.currentHp = m.maxHp;
    });

    dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY, monsters);
  }

  /**
   * @param {Phaser.Tilemaps.Tilemap} map
   * @returns {void}
   */
  #createItems(map) {
    const itemObjectLayer = map.getObjectLayer("Item");

    if (!itemObjectLayer) return;

    const items = itemObjectLayer.objects;
    const validItems = items.filter((item) => {
      return item.x !== undefined && item.y !== undefined;
    });

    /**@type {number[]} */
    const itemsPickedUp =
      dataManager.store.get(DATA_MANAGER_STORE_KEYS.ITEMS_PICKED_UP) || [];

    for (const tiledItem of validItems) {
      /**@type {number} */
      const itemId =
        /**@type {TiledObjectProperty[]}*/
        (tiledItem.properties).find(
          (property) => property.name === TILED_ITEM_PROPERTY.ITEM_ID,
        )?.value;

      /**@type {number} */
      const id =
        /**@type {TiledObjectProperty[]}*/
        (tiledItem.properties).find(
          (property) => property.name === TILED_ITEM_PROPERTY.ID,
        )?.value;

      if (itemsPickedUp.includes(id)) {
        continue;
      }

      const item = new Item({
        scene: this,
        position: {
          x: tiledItem.x,
          y: tiledItem.y - TILE_SIZE,
        },
        itemId: itemId,
        id: id,
      });

      this.#items.push(item);
    }
  }

  /**
   * @param {string} entranceName
   * @param {string} entranceId
   * @param {boolean} isBuildingEntrance
   * @returns {void}
   */
  #handleEntranceEnteredCallback(entranceName, entranceId, isBuildingEntrance) {
    this._controls.lockInput = true;
    console.log(
      `entranceName: ${entranceName}`,
      `entrance_id: ${entranceId}`,
      `isBuildingEntrance: ${isBuildingEntrance}`,
    );

    const map = this.make.tilemap({
      key: `${entranceName.toUpperCase()}_LEVEL`,
    });

    const entranceObjectLayer = map.getObjectLayer("Scene-Transitions");

    const entranceObject = entranceObjectLayer.objects.find((object) => {
      const tempEntranceName = object.properties.find(
        (property) => property.name === "connects_to",
      ).value;

      const tempEntranceId = object.properties.find(
        (property) => property.name === "entrance_id",
      ).value;

      console.log("tempEntranceName:", tempEntranceName);
      console.log("tempEntranceId:", tempEntranceId);

      return (
        tempEntranceName === this.#sceneData.area &&
        tempEntranceId === entranceId
      );
    });

    console.log("entranceObject:", entranceObject);

    let x = entranceObject.x;
    let y = entranceObject.y - TILE_SIZE;

    if (this.#player.direction === DIRECTION.UP) {
      y -= TILE_SIZE;
    }

    if (this.#player.direction === DIRECTION.DOWN) {
      y += TILE_SIZE;
    }

    this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
          x,
          y,
        });

        /**@type {WorldSceneData} */
        const dataToPass = {
          area: entranceName,
          isInterior: isBuildingEntrance,
        };

        this.scene.start(SCENE_KEYS.WORLD_SCENE, dataToPass);
      }
    });
  }
}
