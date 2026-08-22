import Phaser from "../lib/phaser.js";

/**
 * @typedef BattleMonsterConfig
 * @type {Object}
 * @property {Phaser.Scene} scene
 * @property {Monster} monsterdetails
 * @property {number} [scaleHealthBarBackgroundImageByY = 1]
 * @property {boolean} [skipBattleAnimations=false]
 */

/**
 * @typedef Monster
 * @type {Object}
 * @property {number} id
 * @property {number} monsterId
 * @property {string} name
 * @property {string} assetKey
 * @property {number} [assetFrame = 0]
 * @property {number} currentLevel
 * @property {number} maxHp
 * @property {number} currentHp
 * @property {number} baseAttack
 * @property {number[]} attackIds
 *
 */

/**
 * @typedef Coordinate
 * @type {Object}
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef Attack
 * @type {Object}
 * @property {number} id
 * @property {string} name
 * @property {import("../battle/attacks/attack-keys.js").AttackKeys} animationName
 * @property {string} audioKey
 */

/**
 * @typedef Animation
 * @type {object}
 * @property {string} key
 * @property {number[]} [frames]
 * @property {number} frameRate
 * @property {number} repeat
 * @property {number} delay
 * @property {boolean} yoyo
 * @property {string} assetKey
 */

/**
 * @typedef {keyof typeof ITEM_EFFECT} ItemEffect
 */

/**@enum {ItemEffect}  */
export const ITEM_EFFECT = Object.freeze({
  HEAL_30: "HEAL_30",
});

/**
 * @typedef Item
 * @type {object}
 * @property {number} id
 * @property {string} name
 * @property {ItemEffect} effect
 * @property {string} description
 */

/**
 * @typedef BaseInventoryItem
 * @type {object}
 * @property {object} item
 * @property {number} item.id
 * @property {number} quantity
 */

/**
 * @typedef Inventory
 * @type {BaseInventoryItem[]}
 */

/**
 * @typedef InventoryItem
 * @type {object}
 * @property {Item} item
 * @property {number} quantity
 */

/**
 * @typedef EncounterData
 * @type {Object.<string, number[][]>}
 */
