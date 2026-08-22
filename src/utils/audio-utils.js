import { SOUND_OPTIONS } from "../common/options.js";
import { DATA_MANAGER_STORE_KEYS, dataManager } from "./data-manager.js";

/**
 * @param {Phaser.Scene} scene
 * @param {string} audioKey
 */
export function playBackgroundMusic(scene, audioKey) {
  // Accedemos al store de nuestro dataManager global para verificar la opción
  if (
    dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND) !==
    SOUND_OPTIONS.ON
  ) {
    return;
  }

  // 2. Obtenemos todos los sonidos que se están reproduciendo actualmente en el gestor global
  const existingSounds = scene.sound.getAllPlaying();

  // 3. Variable de control para saber si la música que queremos ya está sonando
  let musicAlreadyPlaying = false;

  // 4. Iteramos por cada sonido activo para limpiar o validar
  existingSounds.forEach((sound) => {
    if (sound.key === audioKey) {
      // Si el sonido que suena tiene la misma clave,
      // marcamos que ya está reproduciéndose
      musicAlreadyPlaying = true;
    } else {
      // Si es un sonido diferente (de otra escena),
      // lo detenemos y eliminamos
      sound.stop();
    }
  });

  // 5. Solo si la música deseada NO estaba sonando,
  // la iniciamos desde cero
  if (!musicAlreadyPlaying) {
    scene.sound.play(audioKey, {
      loop: true,
    });
  }
}

/**
 * @param {Phaser.Scene} scene
 * @param {string} audioKey
 */
export function playSoundFX(scene, audioKey) {
  if (
    dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND) !==
    SOUND_OPTIONS.ON
  ) {
    return;
  }

  const baseVolume =
    dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME) * 0.25;

  scene.sound.play(audioKey, {
    volume: 20 * baseVolume,
  });
}

/**
 * @param {Phaser.Scene} scene
 */
export function setGlobalSoundSettings(scene) {
  const volume =
    dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME) * 0.25;

  scene.sound.setVolume(volume);

  const isMuted =
    dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND) ===
    SOUND_OPTIONS.OFF;

  scene.sound.setMute(isMuted);
}
