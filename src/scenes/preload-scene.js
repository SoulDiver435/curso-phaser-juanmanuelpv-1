import {
  ATTACK_ASSETS_KEYS,
  AUDIO_ASSET_KEYS,
  BATTLE_ASSET_KEYS,
  BATTLE_BACKGROUND_ASSET_KEYS,
  BUILDING_ASSET_KEYS,
  CHARACTER_ASSET_KEYS,
  DATA_ASSETS_KEYS,
  HEALTH_BAR_ASSET_KEYS,
  INVENTORY_ASSET_KEYS,
  MONSTER_ASSET_KEYS,
  MONSTER_PARTY_ASSET_KEYS,
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
import { BaseScene } from "./base-scene.js";
import { setGlobalSoundSettings } from "../utils/audio-utils.js";

export class PreloadScene extends BaseScene {
  constructor() {
    super({
      key: SCENE_KEYS.PRELOAD_SCENE,
      active: false,
    });
  }

  init() {
    super.init();
  }

  preload() {
    super.preload();
    // console.log(`[${PreloadScene.name}:preload] invoked`);

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
    this.load.image(
      MONSTER_ASSET_KEYS.AQUAVALOR,
      `${monsterTamerAssetPath}/monsters/aquavalor.png`,
    );
    this.load.image(
      MONSTER_ASSET_KEYS.FROSTSABER,
      `${monsterTamerAssetPath}/monsters/frostsaber.png`,
    );
    this.load.image(
      MONSTER_ASSET_KEYS.IGNIVOLT,
      `${monsterTamerAssetPath}/monsters/Ignivolt.png`,
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

    this.load.image(
      UI_ASSETS_KEYS.BLUE_BUTTON,
      `${kenneysAssetPath}/ui-pack/blue_button01.png`,
    );

    this.load.image(
      UI_ASSETS_KEYS.BLUE_BUTTON_SELECTED,
      `${kenneysAssetPath}/ui-pack/blue_button00.png`,
    );

    //Cargando nuestra data JSON
    this.load.json(DATA_ASSETS_KEYS.ATTACKS, "assets/data/attacks.json");

    this.load.json(DATA_ASSETS_KEYS.ANIMATIONS, "assets/data/animations.json");

    this.load.json(DATA_ASSETS_KEYS.ITEMS, "assets/data/items.json");

    this.load.json(DATA_ASSETS_KEYS.MONSTERS, "assets/data/monsters.json");

    this.load.json(DATA_ASSETS_KEYS.ENCOUNTERS, "assets/data/encounters.json");

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
      WORLD_ASSET_KEYS.MAIN_1_BACKGROUND,
      `${monsterTamerAssetPath}/map/main_1_level_background.png`,
    );
    this.load.image(
      WORLD_ASSET_KEYS.MAIN_1_FOREGROUND,
      `${monsterTamerAssetPath}/map/main_1_level_foreground.png`,
    );

    this.load.tilemapTiledJSON(
      WORLD_ASSET_KEYS.MAIN_1_LEVEL,
      `assets/data/main_1.json`,
    );

    this.load.image(
      WORLD_ASSET_KEYS.WORLD_COLLISION,
      `${monsterTamerAssetPath}/map/collision.png`,
    );

    this.load.image(
      WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE,
      `${monsterTamerAssetPath}/map/encounter.png`,
    );
    this.load.spritesheet(
      WORLD_ASSET_KEYS.BEACH,
      `${axulArtAssetPath}/beach/AxulArtīs_Basic-Top-down-interior_By_AxulArt_scaled_4x_pngcrushed.png`,
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );

    this.load.image(
      BUILDING_ASSET_KEYS.BUILDING_1_BACKGROUND,
      `${monsterTamerAssetPath}/map/buildings/building_1_level_background.png`,
    );
    this.load.image(
      BUILDING_ASSET_KEYS.BUILDING_1_FOREGROUND,
      `${monsterTamerAssetPath}/map/buildings/building_1_level_foreground.png`,
    );
    this.load.tilemapTiledJSON(
      BUILDING_ASSET_KEYS.BUILDING_1_LEVEL,
      `assets/data/building_1.json`,
    );

    this.load.image(
      BUILDING_ASSET_KEYS.BUILDING_2_BACKGROUND,
      `${monsterTamerAssetPath}/map/buildings/building_2_level_background.png`,
    );
    this.load.image(
      BUILDING_ASSET_KEYS.BUILDING_2_FOREGROUND,
      `${monsterTamerAssetPath}/map/buildings/building_2_level_foreground.png`,
    );
    this.load.tilemapTiledJSON(
      BUILDING_ASSET_KEYS.BUILDING_2_LEVEL,
      `assets/data/building_2.json`,
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

    //ui components for monster party
    this.load.image(
      MONSTER_PARTY_ASSET_KEYS.PARTY_BACKGROUND,
      `${monsterTamerAssetPath}/ui/background.png`,
    );
    this.load.image(
      MONSTER_PARTY_ASSET_KEYS.MONSTER_DETAILS_BACKGROUND,
      `${monsterTamerAssetPath}/ui/monster-details-background.png`,
    );

    //ui components for inventory
    this.load.image(
      INVENTORY_ASSET_KEYS.INVENTORY_BACKGROUND,
      `${monsterTamerAssetPath}/ui/inventory/bag_background.png`,
    );

    this.load.image(
      INVENTORY_ASSET_KEYS.INVENTORY_BAG,
      `${monsterTamerAssetPath}/ui/inventory/bag.png`,
    );

    //load audio
    this.load.setPath("assets/audio/xDeviruchi");

    this.load.audio(AUDIO_ASSET_KEYS.MAIN, "And-the-Journey-Begins.wav");
    this.load.audio(AUDIO_ASSET_KEYS.BATTLE, "Decisive-Battle.wav");
    this.load.audio(AUDIO_ASSET_KEYS.TITLE, "Title-Theme.wav");

    this.load.setPath("assets/audio/leohpaz");

    this.load.audio(AUDIO_ASSET_KEYS.CLAW, "03_Claw_03.wav");
    this.load.audio(AUDIO_ASSET_KEYS.GRASS, "03_Step_grass_03.wav");
    this.load.audio(AUDIO_ASSET_KEYS.ICE, "13_Ice_explosion_01.wav");
    this.load.audio(AUDIO_ASSET_KEYS.FLEE, "51_Flee_02.wav");
  }

  create() {
    super.create();
    this.#createAnimations();
    dataManager.init(this);
    dataManager.loadData();
    this.scene.start(SCENE_KEYS.TITLE_SCENE);
    setGlobalSoundSettings(this);
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
