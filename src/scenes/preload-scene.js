import {
  ATTACK_ASSETS_KEYS,
  BATTLE_ASSET_KEYS,
  BATTLE_BACKGROUND_ASSET_KEYS,
  CHARACTER_ASSET_KEYS,
  DATA_ASSETS_KEYS,
  HEALTH_BAR_ASSET_KEYS,
  MONSTER_ASSET_KEYS,
  TITLE_ASSET_KEYS,
  UI_ASSETS_KEYS,
  WORLD_ASSET_KEYS,
} from "../assets/asset-keys.js";
import Phaser from "../lib/phaser.js";
import { SCENE_KEYS } from "./scene-keys.js";
import { KENNEY_FUTURE_NARROW_FONT_NAME } from "../assets/font-keys.js";
import { WebFontFileLoader } from "../assets/web-font-file-loader.js";
import { DataUtils } from "../utils/data-utils.js";
import { dataManager } from "../utils/data-manager.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({
      key: SCENE_KEYS.PRELOAD_SCENE,
      active: false,
    });
  }

  init() {}

  preload() {
    console.log(`[${PreloadScene.name}:preload] invoked`);

    const monsterTamerAssetPath = "assets/images/monster-tamer";
    const kenneysAssetPath = "assets/images/kenneys-assets";
    const pimenAssetPath = "assets/images/pimen";
    const axulArtAssetPath = "assets/images/axulart";
    const pbGamesAssetPath = "assets/images/parabellum-games";

    //Background de batalla
    this.load.image(
      BATTLE_BACKGROUND_ASSET_KEYS.FOREST,
      `${monsterTamerAssetPath}/battle-backgrounds/forest-background.png`,
    );

    //Assets de Batalla
    this.load.image(
      BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND,
      `${kenneysAssetPath}/ui-space-expansion/custom-ui.png`,
    );

    //Assets de Barra de Salud
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.RIGHT_CAP,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_right.png`,
    );
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.MIDDLE,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_mid.png`,
    );
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.LEFT_CAP,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_left.png`,
    );

    //Sombras de Barras de Salud
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.RIGHT_CAP_SHADOW,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_shadow_right.png`,
    );
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.MIDDLE_SHADOW,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_shadow_mid.png`,
    );
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.LEFT_CAP_SHADOW,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_shadow_left.png`,
    );

    //Assets de Monsters
    this.load.image(
      MONSTER_ASSET_KEYS.CARNODUSK,
      `${monsterTamerAssetPath}/monsters/carnodusk.png`,
    );
    this.load.image(
      MONSTER_ASSET_KEYS.IGUANIGNITE,
      `${monsterTamerAssetPath}/monsters/iguanignite.png`,
    );

    //Assets de UI
    this.load.image(
      UI_ASSETS_KEYS.CURSOR,
      `${monsterTamerAssetPath}/ui/cursor.png`,
    );

    this.load.image(
      UI_ASSETS_KEYS.CURSOR_WHITE,
      `${monsterTamerAssetPath}/ui/cursor_white.png`,
    );

    this.load.image(
      UI_ASSETS_KEYS.MENU_BACKGROUND,
      `${kenneysAssetPath}/ui-space-expansion/glassPanel.png`,
    );

    this.load.image(
      UI_ASSETS_KEYS.MENU_BACKGROUND_PURPLE,
      `${kenneysAssetPath}/ui-space-expansion/glassPanel_purple.png`,
    );

    this.load.image(
      UI_ASSETS_KEYS.MENU_BACKGROUND_GREEN,
      `${kenneysAssetPath}/ui-space-expansion/glassPanel_green.png`,
    );

    //Cargando nuestra data JSON
    this.load.json(DATA_ASSETS_KEYS.ATTACKS, "assets/data/attacks.json");

    this.load.json(DATA_ASSETS_KEYS.ANIMATIONS, "assets/data/animations.json");

    //Cargar Fuentes personalizadas
    this.load.addFile(
      new WebFontFileLoader(this.load, [KENNEY_FUTURE_NARROW_FONT_NAME]),
    );

    //Cargar assets de ataques
    this.load.spritesheet(
      ATTACK_ASSETS_KEYS.ICE_SHARD,
      `${pimenAssetPath}/ice-attack/active.png`,
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );

    this.load.spritesheet(
      ATTACK_ASSETS_KEYS.ICE_SHARD_START,
      `${pimenAssetPath}/ice-attack/start.png`,
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.spritesheet(
      ATTACK_ASSETS_KEYS.SLASH,
      `${pimenAssetPath}/slash.png`,
      {
        frameWidth: 48,
        frameHeight: 48,
      },
    );

    //Cargar assets del mundo
    this.load.image(
      WORLD_ASSET_KEYS.WORLD_BACKGROUND,
      `${monsterTamerAssetPath}/map/level_background.png`,
    );

    this.load.tilemapTiledJSON(
      WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL,
      `assets/data/level.json`,
    );
    this.load.image(
      WORLD_ASSET_KEYS.WORLD_COLLISION,
      `${monsterTamerAssetPath}/map/collision.png`,
    );
    this.load.image(
      WORLD_ASSET_KEYS.WORLD_FOREGROUND,
      `${monsterTamerAssetPath}/map/level_foreground.png`,
    );
    this.load.image(
      WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE,
      `${monsterTamerAssetPath}/map/encounter.png`,
    );

    //Cargar imágenes de personajes
    this.load.spritesheet(
      CHARACTER_ASSET_KEYS.PLAYER,
      `${axulArtAssetPath}/character/custom.png`,
      {
        frameWidth: 64,
        frameHeight: 88,
      },
    );

    this.load.spritesheet(
      CHARACTER_ASSET_KEYS.NPC,
      `${pbGamesAssetPath}/characters.png`,
      {
        frameWidth: 16,
        frameHeight: 16,
      },
    );

    //Componentes UI para el TitleScreen
    this.load.image(
      TITLE_ASSET_KEYS.BACKGROUND,
      `${monsterTamerAssetPath}/ui/title/background.png`,
    );
    this.load.image(
      TITLE_ASSET_KEYS.PANEL,
      `${monsterTamerAssetPath}/ui/title/title_background.png`,
    );
    this.load.image(
      TITLE_ASSET_KEYS.TITLE,
      `${monsterTamerAssetPath}/ui/title/title_text.png`,
    );
  }

  create() {
    this.#createAnimations();
    dataManager.loadData();
    this.scene.start(SCENE_KEYS.WORLD_SCENE);
  }

  #createAnimations() {
    const animations = DataUtils.getAnimations(this);
    animations.forEach((animation) => {
      const frames = animation.frames
        ? this.anims.generateFrameNumbers(animation.assetKey, {
            frames: animation.frames,
          })
        : this.anims.generateFrameNumbers(animation.assetKey);

      this.anims.create({
        key: animation.key,
        frames: frames,
        frameRate: animation.frameRate,
        repeat: animation.repeat,
        delay: animation.delay,
        yoyo: animation.yoyo,
      });
    });
  }
}
