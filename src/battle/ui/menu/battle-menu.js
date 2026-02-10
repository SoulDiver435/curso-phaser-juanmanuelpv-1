import {
  MONSTER_ASSET_KEYS,
  UI_ASSETS_KEYS,
} from "../../../assets/asset-keys.js";
import { DIRECTION } from "../../../common/direction.js";
import { dataManager } from "../../../utils/data-manager.js";
import { exhaustiveGuard } from "../../../utils/guard.js";
import { animateText } from "../../../utils/text-utils.js";
import { BattleMonster } from "../../monsters/battle-monster.js";
import { BATTLE_UI_TEXT_STYLE } from "./battle-menu-config.js";
import {
  ACTIVE_BATTLE_MENU,
  ATTACK_MOVE_OPTIONS,
  BATTLE_MENU_OPTIONS,
} from "./battle-menu-options.js";

const BATTLE_MENU_CURSOR_POS = Object.freeze({
  x: 42,
  y: 38,
});

const ATTACK_MENU_CURSOR_POS = Object.freeze({
  x: 42,
  y: 38,
});

const PLAYER_INPUT_CURSOR_POS = Object.freeze({
  y: 488,
});

export class BattleMenu {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {Phaser.GameObjects.Container} */
  #mainBattleMenuPhaserContainerGameObject;
  /** @type {Phaser.GameObjects.Container} */
  #moveSelectionSubBattleMenuPhaserGameObject;
  /** @type {Phaser.GameObjects.Text} */
  #battleTextGameObjectLine1;
  /** @type {Phaser.GameObjects.Text} */
  #battleTextGameObjectLine2;
  /** @type {Phaser.GameObjects.Image} */
  #mainBattleMenuCursorPhaserImageGameObject;
  /** @type {Phaser.GameObjects.Image} */
  #attackBattleMenuCursorPhaserImageGameObject;
  /** @type {import("./battle-menu-options.js").BattleMenuOptions} */
  #selectedBattleMenuOption;
  /** @type {import("./battle-menu-options.js").AttackMoveOptions} */
  #selectedAttackMenuOption;
  /**@type {import("./battle-menu-options.js").ActiveBattleMenu} */
  #activeBattleMenu;
  /** @type {string[]} */
  #queuedInfoPanelMessages;
  /** @type {() => void | undefined} */
  #queuedInfoPanelCallback;
  /** @type {boolean} */
  #waitingForPlayerInput;
  /** @type {number | undefined} */
  #selectedAttackIndex;
  /** @type {BattleMonster} */
  #activePlayerMonster;
  /** @type {Phaser.GameObjects.Image} */
  #userInputCursorPhaserImageGameObject;
  /** @type {Phaser.Tweens.Tween} */
  #userInputCursorPhaserTween;
  /** @type {boolean} */
  #skipAnimations;
  /** @type {boolean} */
  #queuedMessageAnimationPlaying;

  /**
   *
   * @param {Phaser.Scene} scene La escena de Phaser 3 a la que será añadida el BattleMenu
   * * @param {BattleMonster} activePlayerMonster
   */
  constructor(scene, activePlayerMonster, skipBattleAnimations = false) {
    this.#scene = scene;
    this.#activePlayerMonster = activePlayerMonster;
    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
    this.#queuedInfoPanelCallback = undefined;
    this.#queuedInfoPanelMessages = [];
    this.#waitingForPlayerInput = false;
    this.#selectedAttackIndex = undefined;
    this.#skipAnimations = skipBattleAnimations;
    this.#queuedMessageAnimationPlaying = false;
    this.#createMainInfoPane();
    this.#createMainBattleMenu();
    this.#createMonsterAttackSubMenu();
    this.#createPlayerInputCursor();

    this.initializingBattle = false;
  }

  /** @type {number | undefined} */
  get selectedAttack() {
    if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
      return this.#selectedAttackIndex;
    }
    return undefined;
  }

  showMainBattleMenu() {
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
    this.#battleTextGameObjectLine1.setText("What should");
    this.#mainBattleMenuPhaserContainerGameObject.setAlpha(1);
    this.#battleTextGameObjectLine1.setAlpha(1);
    this.#battleTextGameObjectLine2.setAlpha(1);

    this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(
      BATTLE_MENU_CURSOR_POS.x,
      BATTLE_MENU_CURSOR_POS.y,
    );

    this.#selectedAttackIndex = undefined;
  }

  hideMainBattleMenu() {
    this.#mainBattleMenuPhaserContainerGameObject.setAlpha(0);
    this.#battleTextGameObjectLine1.setAlpha(0);
    this.#battleTextGameObjectLine2.setAlpha(0);
  }

  showMonsterAttackSubMenu() {
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT;
    this.#moveSelectionSubBattleMenuPhaserGameObject.setAlpha(1);
  }

  hideMonsterAttackSubMenu() {
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
    this.#moveSelectionSubBattleMenuPhaserGameObject.setAlpha(0);
  }

  playInputCursorAnimation() {
    this.#userInputCursorPhaserImageGameObject.setPosition(
      this.#battleTextGameObjectLine1.displayWidth +
        this.#userInputCursorPhaserImageGameObject.displayWidth * 2.7,
      this.#userInputCursorPhaserImageGameObject.y,
    );

    this.#userInputCursorPhaserImageGameObject.setAlpha(1);
    this.#userInputCursorPhaserTween.restart();
  }

  hideInputCursor() {
    this.#userInputCursorPhaserImageGameObject.setAlpha(0);
    this.#userInputCursorPhaserTween.pause();
  }

  /**
   *
   * @param { import("../../../common/direction.js").Direction |'OK'|'CANCEL'} input
   */
  handlePlayerInput(input) {
    if (this.#queuedMessageAnimationPlaying && input === "OK") {
      return;
    }

    if (this.#waitingForPlayerInput && (input === "CANCEL" || input === "OK")) {
      this.#updateInfoPaneWithMessage();
      return;
    }

    if (input === "CANCEL") {
      this.#switchToMainBattleMenu();
      return;
    }

    if (input === "OK") {
      if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
        if (this.initializingBattle) return;
        this.#handlePlayerChooseMainBattleOption();
        return;
      }

      if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
        this.#handlePlayerChooseAttack();
        return;
      }
      this.hideMainBattleMenu();
      this.showMonsterAttackSubMenu();
      return;
    }

    this.#updateSelectedBattleMenuOptionFromInput(input);
    this.#moveMainBattleMenuCursor();
    this.#updateSelectedMoveMenuOptionFromInput(input);
    this.#moveMoveSelectBattleMenuCursor();
  }

  /**
   *
   * @param {string} message
   * @param {() => void } [callback ]
   */

  updateInfoPaneMessageNoInputRequired(message, callback) {
    this.#battleTextGameObjectLine1.setText("").setAlpha(1);

    if (this.#skipAnimations) {
      this.#battleTextGameObjectLine1.setText(message);
      this.#waitingForPlayerInput = false;
      if (callback) {
        callback();
      }
      return;
    }

    animateText(this.#scene, this.#battleTextGameObjectLine1, message, {
      delay: dataManager.getAnimatedTextSpeed(),
      callback: () => {
        this.#waitingForPlayerInput = false;
        if (callback) {
          callback();
        }
      },
    });
  }

  /**
   *
   * @param {string[]} messages
   * @param {() => void } [callback]
   */

  updateInfoPaneMessagesAndWaitForInput(messages, callback) {
    this.#queuedInfoPanelMessages = messages;
    this.#queuedInfoPanelCallback = callback;

    this.#updateInfoPaneWithMessage();
  }

  #updateInfoPaneWithMessage() {
    this.#waitingForPlayerInput = false;
    this.#battleTextGameObjectLine1.setText("").setAlpha(1);
    this.hideInputCursor();

    //Revisar si todos los mensajes se han mostrado desde la cola y llamar al Callback

    if (this.#queuedInfoPanelMessages.length === 0) {
      if (this.#queuedInfoPanelCallback) {
        this.#queuedInfoPanelCallback();
        this.#queuedInfoPanelCallback = undefined;
      }
      return;
    }

    //Capturar el primer mensaje de la cola y animarlo
    const messageToDisplay = this.#queuedInfoPanelMessages.shift();

    if (this.#skipAnimations) {
      this.#battleTextGameObjectLine1.setText(messageToDisplay);
      this.#queuedMessageAnimationPlaying = false;
      this.#waitingForPlayerInput = true;
      this.playInputCursorAnimation();
      return;
    }

    this.#queuedMessageAnimationPlaying = true;
    animateText(
      this.#scene,
      this.#battleTextGameObjectLine1,
      messageToDisplay,
      {
        delay: dataManager.getAnimatedTextSpeed(),
        callback: () => {
          this.playInputCursorAnimation();
          this.#waitingForPlayerInput = true;
          this.#queuedMessageAnimationPlaying = false;
        },
      },
    );
  }

  #createMainBattleMenu() {
    this.#battleTextGameObjectLine1 = this.#scene.add.text(
      20,
      468,
      "What should",
      BATTLE_UI_TEXT_STYLE,
    );
    this.#battleTextGameObjectLine2 = this.#scene.add.text(
      20,
      512,
      `${this.#activePlayerMonster.name} do?`,
      BATTLE_UI_TEXT_STYLE,
    );

    this.#mainBattleMenuCursorPhaserImageGameObject = this.#scene.add
      .image(
        BATTLE_MENU_CURSOR_POS.x,
        BATTLE_MENU_CURSOR_POS.y,
        UI_ASSETS_KEYS.CURSOR,
        0,
      )
      .setOrigin(0.5)
      .setScale(2.5);

    this.#mainBattleMenuPhaserContainerGameObject = this.#scene.add.container(
      520,
      448,
      [
        this.#createMainInfoSubPane(),
        this.#scene.add.text(
          55,
          22,
          BATTLE_MENU_OPTIONS.FIGHT,
          BATTLE_UI_TEXT_STYLE,
        ),
        this.#scene.add.text(
          240,
          22,
          BATTLE_MENU_OPTIONS.SWITCH,
          BATTLE_UI_TEXT_STYLE,
        ),
        this.#scene.add.text(
          55,
          70,
          BATTLE_MENU_OPTIONS.ITEM,
          BATTLE_UI_TEXT_STYLE,
        ),
        this.#scene.add.text(
          240,
          70,
          BATTLE_MENU_OPTIONS.FLEE,
          BATTLE_UI_TEXT_STYLE,
        ),
        this.#mainBattleMenuCursorPhaserImageGameObject,
      ],
    );

    this.hideMainBattleMenu();
  }

  #createMonsterAttackSubMenu() {
    this.#attackBattleMenuCursorPhaserImageGameObject = this.#scene.add
      .image(
        ATTACK_MENU_CURSOR_POS.x,
        ATTACK_MENU_CURSOR_POS.y,
        UI_ASSETS_KEYS.CURSOR,
        0,
      )
      .setOrigin(0.5)
      .setScale(2.5);

    /**@type {string[]} */
    const attackNames = [];

    for (let i = 0; i < 4; i += 1) {
      attackNames.push(this.#activePlayerMonster.attacks[i]?.name || "-");
    }

    this.#moveSelectionSubBattleMenuPhaserGameObject =
      this.#scene.add.container(0, 448, [
        this.#scene.add.text(55, 22, attackNames[0], BATTLE_UI_TEXT_STYLE),
        this.#scene.add.text(240, 22, attackNames[1], BATTLE_UI_TEXT_STYLE),
        this.#scene.add.text(55, 70, attackNames[2], BATTLE_UI_TEXT_STYLE),
        this.#scene.add.text(240, 70, attackNames[3], BATTLE_UI_TEXT_STYLE),
        this.#attackBattleMenuCursorPhaserImageGameObject,
      ]);

    this.hideMonsterAttackSubMenu();
  }

  #createMainInfoPane() {
    const padding = 4;
    const rectHeight = 124;
    this.#scene.add
      .rectangle(
        padding,
        this.#scene.scale.height - rectHeight - padding,
        this.#scene.scale.width - padding * 2,
        rectHeight,
        0xede4f3,
        1,
      )
      .setOrigin(0)
      .setStrokeStyle(8, 0xe4434a, 1);
  }

  #createMainInfoSubPane() {
    const rectWidth = 500;
    const rectHeight = 124;
    return this.#scene.add
      .rectangle(0, 0, rectWidth, rectHeight, 0xede4f3, 1)
      .setOrigin(0)
      .setStrokeStyle(8, 0x905ac2, 1);
  }

  /**
   *
   * @param { import("../../../common/direction.js").Direction} direction
   */
  #updateSelectedBattleMenuOptionFromInput(direction) {
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MAIN) return;

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
      switch (direction) {
        case DIRECTION.RIGHT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
          break;
        case DIRECTION.DOWN:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM;
          break;
        case DIRECTION.LEFT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH) {
      switch (direction) {
        case DIRECTION.LEFT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
          break;
        case DIRECTION.DOWN:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FLEE;
          break;
        case DIRECTION.RIGHT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM) {
      switch (direction) {
        case DIRECTION.RIGHT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FLEE;
          break;
        case DIRECTION.UP:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
          break;
        case DIRECTION.LEFT:
        case DIRECTION.DOWN:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE) {
      switch (direction) {
        case DIRECTION.LEFT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM;
          break;
        case DIRECTION.UP:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
          break;
        case DIRECTION.RIGHT:
        case DIRECTION.DOWN:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    exhaustiveGuard(this.#selectedBattleMenuOption);
  }

  #moveMainBattleMenuCursor() {
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MAIN) return;

    switch (this.#selectedBattleMenuOption) {
      case BATTLE_MENU_OPTIONS.FIGHT:
        this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(
          BATTLE_MENU_CURSOR_POS.x,
          BATTLE_MENU_CURSOR_POS.y,
        );
        return;
      case BATTLE_MENU_OPTIONS.SWITCH:
        this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(
          228,
          BATTLE_MENU_CURSOR_POS.y,
        );
        return;
      case BATTLE_MENU_OPTIONS.ITEM:
        this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(
          BATTLE_MENU_CURSOR_POS.x,
          86,
        );
        return;
      case BATTLE_MENU_OPTIONS.FLEE:
        this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(228, 86);
        return;
      default:
        exhaustiveGuard(this.#selectedBattleMenuOption);
    }
  }

  /**
   *
   * @param { import("../../../common/direction.js").Direction} direction
   */
  #updateSelectedMoveMenuOptionFromInput(direction) {
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT)
      return;
    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_1) {
      switch (direction) {
        case DIRECTION.RIGHT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_2;
          break;
        case DIRECTION.DOWN:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_3;
          break;
        case DIRECTION.LEFT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_2) {
      switch (direction) {
        case DIRECTION.LEFT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
          break;
        case DIRECTION.DOWN:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_4;
          break;
        case DIRECTION.RIGHT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_3) {
      switch (direction) {
        case DIRECTION.RIGHT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_4;
          break;
        case DIRECTION.UP:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
          break;
        case DIRECTION.LEFT:
        case DIRECTION.DOWN:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_4) {
      switch (direction) {
        case DIRECTION.LEFT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_3;
          break;
        case DIRECTION.UP:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_2;
          break;
        case DIRECTION.RIGHT:
        case DIRECTION.DOWN:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }
    exhaustiveGuard(this.#selectedAttackMenuOption);
  }

  #moveMoveSelectBattleMenuCursor() {
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT)
      return;
    switch (this.#selectedAttackMenuOption) {
      case ATTACK_MOVE_OPTIONS.MOVE_1:
        this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(
          ATTACK_MENU_CURSOR_POS.x,
          ATTACK_MENU_CURSOR_POS.y,
        );
        return;
      case ATTACK_MOVE_OPTIONS.MOVE_2:
        this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(
          228,
          ATTACK_MENU_CURSOR_POS.y,
        );
        return;
      case ATTACK_MOVE_OPTIONS.MOVE_3:
        this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(
          ATTACK_MENU_CURSOR_POS.x,
          86,
        );
        return;
      case ATTACK_MOVE_OPTIONS.MOVE_4:
        this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(228, 86);
        return;
      default:
        exhaustiveGuard(this.#selectedAttackMenuOption);
    }
  }

  #switchToMainBattleMenu() {
    this.#waitingForPlayerInput = false;
    this.hideInputCursor();
    this.hideMonsterAttackSubMenu();
    this.showMainBattleMenu();
  }

  #handlePlayerChooseMainBattleOption() {
    this.hideMainBattleMenu();
    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
      this.showMonsterAttackSubMenu();
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM) {
      //TODO add feature un future update

      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_ITEM;

      this.updateInfoPaneMessagesAndWaitForInput(
        ["Your bag is empty..."],
        () => {
          this.#switchToMainBattleMenu();
        },
      );
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH) {
      //TODO
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_SWITCH;
      this.updateInfoPaneMessagesAndWaitForInput(
        ["You have no other monsters in your party..."],
        () => {
          this.#switchToMainBattleMenu();
        },
      );
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE) {
      //TODO
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_FLEE;
      this.updateInfoPaneMessagesAndWaitForInput(
        ["You fail to run away..."],
        () => {
          this.#switchToMainBattleMenu();
        },
      );
      return;
    }

    exhaustiveGuard(this.#selectedBattleMenuOption);
  }

  #handlePlayerChooseAttack() {
    let selectedMoveIndex = 0;

    switch (this.#selectedAttackMenuOption) {
      case ATTACK_MOVE_OPTIONS.MOVE_1:
        selectedMoveIndex = 0;
        break;
      case ATTACK_MOVE_OPTIONS.MOVE_2:
        selectedMoveIndex = 1;
        break;
      case ATTACK_MOVE_OPTIONS.MOVE_3:
        selectedMoveIndex = 2;
        break;
      case ATTACK_MOVE_OPTIONS.MOVE_4:
        selectedMoveIndex = 3;
        break;
      default:
        exhaustiveGuard(this.#selectedAttackMenuOption);
    }
    this.#selectedAttackIndex = selectedMoveIndex;
  }

  #createPlayerInputCursor() {
    this.#userInputCursorPhaserImageGameObject = this.#scene.add.image(
      0,
      0,
      UI_ASSETS_KEYS.CURSOR,
    );

    this.#userInputCursorPhaserImageGameObject.setAngle(90).setScale(2.5, 1.25);
    this.#userInputCursorPhaserImageGameObject.setAlpha(0);

    this.#userInputCursorPhaserTween = this.#scene.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      y: {
        from: PLAYER_INPUT_CURSOR_POS.y,
        start: PLAYER_INPUT_CURSOR_POS.y,
        to: PLAYER_INPUT_CURSOR_POS.y + 6,
      },
      targets: this.#userInputCursorPhaserImageGameObject,
    });

    this.#userInputCursorPhaserTween.pause();
  }
}
