import Phaser from "./lib/phaser.js";
import { BattleScene } from "./scenes/battle-scene.js";
import { OptionsScene } from "./scenes/options-scene.js";
import { PreloadScene } from "./scenes/preload-scene.js";
import { SCENE_KEYS } from "./scenes/scene-keys.js";
import { TestScene } from "./scenes/test-scene.js";
import { TitleScene } from "./scenes/title-scene.js";
import { WorldScene } from "./scenes/world-scene.js";


const config = {
  type: Phaser.CANVAS,
  pixelArt: false,
  backgroundColor: "#000000",
  scale: {
    parent: "game-container",
    width: 1024,
    height: 576,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);

game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene);
game.scene.add(SCENE_KEYS.WORLD_SCENE, WorldScene);
game.scene.add(SCENE_KEYS.BATTLE_SCENE, BattleScene);
game.scene.add(SCENE_KEYS.TITLE_SCENE, TitleScene);
game.scene.add(SCENE_KEYS.OPTIONS_SCENE, OptionsScene);
game.scene.add(SCENE_KEYS.TEST_SCENE, TestScene);

game.scene.start(SCENE_KEYS.PRELOAD_SCENE, PreloadScene);
