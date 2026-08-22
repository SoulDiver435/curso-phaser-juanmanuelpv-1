import { AUDIO_ASSET_KEYS, MONSTER_ASSET_KEYS } from "../assets/asset-keys.js";
import {
  ATTACK_TARGET,
  AttackManager,
} from "../battle/attacks/attack-manager.js";
import { Background } from "../battle/background.js";
import { EnemyBattleMonster } from "../battle/monsters/enemy-battle-monster.js";
import { PlayerBattleMonster } from "../battle/monsters/player-battle-monster.js";
import { BattleMenu } from "../battle/ui/menu/battle-menu.js";
import { DIRECTION } from "../common/direction.js";
import { BATTLE_SCENE_OPTIONS } from "../common/options.js";
import Phaser from "../lib/phaser.js";
import { Controls } from "../utils/controls.js";
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../utils/data-manager.js";
import { DataUtils } from "../utils/data-utils.js";
import { createSceneTransition } from "../utils/scene-transition.js";
import { StateMachine } from "../utils/state-machine.js";
import { BaseScene } from "./base-scene.js";
import { SCENE_KEYS } from "./scene-keys.js";
// Al final del método create de cada escena
import { playBackgroundMusic, playSoundFX } from "../utils/audio-utils.js";

const BATTLE_STATES = Object.freeze({
  INTRO: "INTRO",
  PRE_BATTLE_INFO: "PRE_BATTLE_INFO",
  BRING_OUT_MONSTER: "BRING_OUT_MONSTER",
  PLAYER_INPUT: "PLAYER_INPUT",
  ENEMY_INPUT: "ENEMY_INPUT",
  BATTLE: "BATTLE",
  POST_ATTACK_CHECK: "POST_ATTACK_CHECK",
  FINISHED: "FINISHED",
  FLEE_ATTEMPT: "FLEE_ATTEMPT",
});

/**
 * @typedef BattleSceneData
 * @type {object}
 * @property {import("../types/typedef.js").Monster[]} playerMonsters
 * @property {import("../types/typedef.js").Monster[]} enemyMonsters
 */
export class BattleScene extends BaseScene {
  /** @type {BattleMenu} */
  #battleMenu;
  // /**@type {Controls} */
  // _controls;
  /**@type {EnemyBattleMonster} */
  #activeEnemyMonster;
  /**@type {PlayerBattleMonster} */
  #activePlayerMonster;
  /**@type {number} */
  #activePlayerAttackIndex;
  /**@type {StateMachine} */
  #battleStateMachine;
  /**@type {AttackManager} */
  #attackManager;
  /**@type {boolean} */
  #skipAnimations;
  /**@type {number} */
  #activeEnemyAttackIndex;
  /**@type {BattleSceneData} */
  #sceneData;
  /**@type {number} */
  #activePlayerMonsterPartyIndex;
  /**@type {boolean} */
  #playerKnockedOut;

  constructor() {
    super({
      key: SCENE_KEYS.BATTLE_SCENE,
      active: false,
    });
  }

  /**
   * @param {BattleSceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);
    this.#sceneData = data;

    if (Object.keys(data).length === 0) {
      this.#sceneData = {
        enemyMonsters: [DataUtils.getMonsterById(this, 2)],
        playerMonsters: [
          dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY)[0],
        ],
      };
    }

    this.#activePlayerAttackIndex = -1;
    this.#activeEnemyAttackIndex = -1;
    this.#activePlayerMonsterPartyIndex = 0;

    const chosenBattleSceneOption = dataManager.store.get(
      DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS,
    );

    if (
      chosenBattleSceneOption === undefined ||
      chosenBattleSceneOption === BATTLE_SCENE_OPTIONS.ON
    ) {
      this.#skipAnimations = false;
      return;
    }

    this.#skipAnimations = true;
    this.#playerKnockedOut = false;
  }

  preload() {}

  create() {
    super.create();
    //Crear el fondo principal
    const background = new Background(this);
    background.showForest();

    //Crear los monsters del player y el enemigo
    //Monster del enemigo
    this.#activeEnemyMonster = new EnemyBattleMonster({
      scene: this,
      monsterdetails: this.#sceneData.enemyMonsters[0],
      skipBattleAnimations: this.#skipAnimations,
    });

    //Monster del Player
    this.#activePlayerMonster = new PlayerBattleMonster({
      scene: this,
      monsterdetails: this.#sceneData.playerMonsters[0],
      skipBattleAnimations: this.#skipAnimations,
    });

    //Renderizar el Main Info y Sub Info Pane
    this.#battleMenu = new BattleMenu(
      this,
      this.#activePlayerMonster,
      this.#skipAnimations,
    );

    this.#createBattleStateMachine();
    this.#attackManager = new AttackManager(this, this.#skipAnimations);

    this._controls.lockInput = true;
    playBackgroundMusic(this, AUDIO_ASSET_KEYS.BATTLE);
  }

  update() {
    super.update();

    this.#battleStateMachine.update();
    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();

    if (this._controls.isInputLocked) return;

    //Limitar el input basado en el Battle State Actual
    //Si no estamos en el battle state adecuado, hacer return y no procesar el input
    if (
      wasSpaceKeyPressed &&
      (this.#battleStateMachine.currentStateName ===
        BATTLE_STATES.PRE_BATTLE_INFO ||
        this.#battleStateMachine.currentStateName ===
          BATTLE_STATES.POST_ATTACK_CHECK ||
        this.#battleStateMachine.currentStateName ===
          BATTLE_STATES.FLEE_ATTEMPT)
    ) {
      this.#battleMenu.handlePlayerInput("OK");
      return;
    }

    if (
      this.#battleStateMachine.currentStateName !== BATTLE_STATES.PLAYER_INPUT
    ) {
      return;
    }

    if (wasSpaceKeyPressed) {
      this.#battleMenu.handlePlayerInput("OK");

      //Check if the player used an item
      if (this.#battleMenu.wasItemUsed) {
        this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT);
        return;
      }

      //Check if the player attempted to flee
      if (this.#battleMenu.isAttemptingToFlee) {
        this.#battleStateMachine.setState(BATTLE_STATES.FLEE_ATTEMPT);
        return;
      }

      //chequear si el jugador seleccionó un ataque, y actualizar el texto
      if (this.#battleMenu.selectedAttack === undefined) {
        return;
      }

      this.#activePlayerAttackIndex = this.#battleMenu.selectedAttack;

      if (!this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex]) {
        return;
      }

      console.log(
        "Player selected the following move:",
        this.#battleMenu.selectedAttack,
      );

      this.#battleMenu.hideMonsterAttackSubMenu();
      // this.#handleBattleSequence();
      this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT);

      return;
    }

    if (this._controls.wasBackKeyPressed()) {
      this.#battleMenu.handlePlayerInput("CANCEL");
      return;
    }

    const selectedDirection = this._controls.getDirectionKeyJustPressed();

    if (selectedDirection !== DIRECTION.NONE) {
      this.#battleMenu.handlePlayerInput(selectedDirection);
    }
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  #playerAttack(callback) {
    if (this.#activePlayerMonster.isFainted) {
      callback();
      return;
    }

    this.#battleMenu.updateInfoPaneMessageNoInputRequired(
      `${this.#activePlayerMonster.name} used ${
        this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex].name
      }`,
      () => {
        this.time.delayedCall(500, () => {
          this.time.delayedCall(100, () => {
            const attack =
              this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex];
            playSoundFX(this, attack.audioKey);
          });

          this.#attackManager.playAttackAnimation(
            this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex]
              .animationName,
            ATTACK_TARGET.ENEMY,
            () => {
              this.#activeEnemyMonster.playTakeDamageAnimation(() => {
                this.#activeEnemyMonster.takeDamage(
                  this.#activePlayerMonster.baseAttack,
                  () => {
                    // this.#enemyAttack();
                    callback();
                  },
                );
              });
            },
          );
        });
      },
    );
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  #enemyAttack(callback) {
    if (this.#activeEnemyMonster.isFainted) {
      callback();
      return;
    }

    console.log(
      `foe ${this.#activeEnemyMonster.name} used ${
        this.#activeEnemyMonster.attacks[this.#activeEnemyAttackIndex].name
      }`,
    );

    this.#battleMenu.updateInfoPaneMessageNoInputRequired(
      `foe ${this.#activeEnemyMonster.name} used ${
        this.#activeEnemyMonster.attacks[this.#activeEnemyAttackIndex].name
      }`,
      () => {
        this.time.delayedCall(500, () => {
          this.time.delayedCall(100, () => {
            const attack =
              this.#activeEnemyMonster.attacks[this.#activeEnemyAttackIndex];
            playSoundFX(this, attack.audioKey);
          });

          this.#attackManager.playAttackAnimation(
            this.#activeEnemyMonster.attacks[this.#activeEnemyAttackIndex]
              .animationName,
            ATTACK_TARGET.PLAYER,
            () => {
              this.#activePlayerMonster.playTakeDamageAnimation(() => {
                this.#activePlayerMonster.takeDamage(
                  this.#activeEnemyMonster.baseAttack,
                  () => {
                    // this.#battleStateMachine.setState(
                    //   BATTLE_STATES.POST_ATTACK_CHECK,
                    // );
                    callback();
                  },
                );
              });
            },
          );
        });
      },
    );
  }

  #postBattleSquenceCheck() {
    this.#sceneData.playerMonsters[
      this.#activePlayerMonsterPartyIndex
    ].currentHp = this.#activePlayerMonster.currentHp;

    dataManager.store.set(
      DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY,
      this.#sceneData.playerMonsters,
    );

    if (this.#activeEnemyMonster.isFainted) {
      this.#activeEnemyMonster.playDeathAnimation(() => {
        this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(
          [
            `Wild ${this.#activeEnemyMonster.name} fainted`,
            "You have gained some experience",
          ],
          () => {
            // this.#transitionToNextScene();
            this.#battleStateMachine.setState(BATTLE_STATES.FINISHED);
          },
        );
      });

      return;
    }

    if (this.#activePlayerMonster.isFainted) {
      this.#activePlayerMonster.playDeathAnimation(() => {
        this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(
          [
            `${this.#activePlayerMonster.name} fainted`,
            "You have no more monsters, escaping to safety...",
          ],
          () => {
            this.#playerKnockedOut = true;
            this.#battleStateMachine.setState(BATTLE_STATES.FINISHED);
          },
        );
      });

      return;
    }

    // this.#battleMenu.showMainBattleMenu();
    this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
  }

  #transitionToNextScene() {
    /**@type {import("./world-scene.js").WorldSceneData} */
    const sceneDataToPass = {
      isPlayerKnockedOut: this.#playerKnockedOut,
    };

    this.cameras.main.fadeOut(1600, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.start(SCENE_KEYS.WORLD_SCENE, sceneDataToPass);
      },
    );
  }

  #createBattleStateMachine() {
    this.#battleStateMachine = new StateMachine("battle", this);

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.INTRO,
      onEnter: () => {
        //Esperar por cualquier setup de escena y completado de transiciones
        createSceneTransition(this, {
          skipSceneTransition: this.#skipAnimations,
          callback: () => {
            this.#battleStateMachine.setState(BATTLE_STATES.PRE_BATTLE_INFO);
          },
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PRE_BATTLE_INFO,
      onEnter: () => {
        this.#battleMenu.initializingBattle = true;
        //Esperar a que el monstruo enemigo aparezca en pantalla y notificar al jugador sobre el monstruo salvaje
        this.#activeEnemyMonster.playMonsterAppearAnimation(() => {
          this.#activeEnemyMonster.playMonsterHealthBarAppearAnimation(
            () => undefined,
          );
          this._controls.lockInput = false;
          this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(
            [`wild ${this.#activeEnemyMonster.name} appeared!`],
            () => {
              //Esperar a que la animacion de texto se complete y movernos al siguiente estado
              this.#battleStateMachine.setState(
                BATTLE_STATES.BRING_OUT_MONSTER,
              );
            },
          );
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.BRING_OUT_MONSTER,
      onEnter: () => {
        //Esperar a que el monstruo del player aparezca en pantalla y notificar al jugador
        this.#activePlayerMonster.playMonsterAppearAnimation(() => {
          this.#activePlayerMonster.playMonsterHealthBarAppearAnimation(
            () => undefined,
          );
          this.#battleMenu.updateInfoPaneMessageNoInputRequired(
            `Go ${this.#activePlayerMonster.name}!`,
            () => {
              //Esperar a que la animacion de texto se complete y movernos al siguiente estado
              this.time.delayedCall(1200, () => {
                this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
              });
            },
          );
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_INPUT,
      onEnter: () => {
        this.#battleMenu.initializingBattle = false;
        this.#battleMenu.showMainBattleMenu();
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_INPUT,
      onEnter: () => {
        //Escoger un movimiento aleatorio para el monstruo enemigo y en el futuro implementar algún tipo de comportamiento IA
        this.#activeEnemyAttackIndex =
          this.#activeEnemyMonster.pickRandomMove();

        this.#battleStateMachine.setState(BATTLE_STATES.BATTLE);
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.BATTLE,
      onEnter: () => {
        // Flujo General de la batalla
        // Reproducimos la animación del ataque =>
        // Breve pausa =>
        // Siguiente animación =>
        // Monstruo recibiendo daño =>
        // Otra breve pausa =>
        // Actualización de barra HP con animación y breve pausa =>
        // Transición al otro monstruo y repetir proceso.

        //Si el item fue usado, solo tener al enemigo atacando
        if (this.#battleMenu.wasItemUsed) {
          this.#activePlayerMonster.updateMonsterHealth(
            dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY)[0]
              .currentHp,
          );

          this.time.delayedCall(500, () => {
            this.#enemyAttack(() => {
              this.#battleStateMachine.setState(
                BATTLE_STATES.POST_ATTACK_CHECK,
              );
            });
          });
          return;
        }

        if (this.#battleMenu.isAttemptingToFlee) {
          this.time.delayedCall(500, () => {
            this.#enemyAttack(() => {
              this.#battleStateMachine.setState(
                BATTLE_STATES.POST_ATTACK_CHECK,
              );
            });
          });
          return;
        }

        const randomNumber = Phaser.Math.Between(0, 1);

        if (randomNumber === 0) {
          this.#playerAttack(() => {
            this.#enemyAttack(() => {
              this.#battleStateMachine.setState(
                BATTLE_STATES.POST_ATTACK_CHECK,
              );
            });
          });
          return;
        }

        this.#enemyAttack(() => {
          this.#playerAttack(() => {
            this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
          });
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.POST_ATTACK_CHECK,
      onEnter: () => {
        this.#postBattleSquenceCheck();
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.FINISHED,
      onEnter: () => {
        this.#transitionToNextScene();
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.FLEE_ATTEMPT,
      onEnter: () => {
        const randomNumber = Phaser.Math.Between(1, 10);

        if (randomNumber > 5) {
          //El jugador huyó con éxito

          playSoundFX(this, AUDIO_ASSET_KEYS.FLEE);

          this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(
            [`You got away safely!`],
            () => {
              this.#battleStateMachine.setState(BATTLE_STATES.FINISHED);
            },
          );
          return;
        }

        //El jugador falla en huir, el enmigo procede a atacar
        this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(
          ["You failed to run away..."],
          () => {
            this.time.delayedCall(200, () => {
              this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT);
            });
          },
        );
      },
    });

    //Iniciar la State Machine
    this.#battleStateMachine.setState("INTRO");
  }
}
