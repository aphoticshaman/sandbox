/**
 * AUDIO MANAGER - STUBBED OUT
 * All audio functionality disabled for Expo Go compatibility
 *
 * NO SOUND. NO MUSIC. NO AUDIO. SILENT MODE.
 */

// Sound effect types (kept for compatibility)
export const SOUND_EFFECTS = {
  CARD_FLIP: 'card_flip',
  CARD_REVEAL: 'card_reveal',
  TERMINAL_BEEP: 'terminal_beep',
  BUTTON_PRESS: 'button_press',
  WHOOSH: 'whoosh',
  SHIMMER: 'shimmer',
  DEEP_HUM: 'deep_hum',
  ERROR: 'error',
  SUCCESS: 'success',
};

// Ambient music types (kept for compatibility)
export const AMBIENT_TRACKS = {
  SHADOW_RECEPTIVE: 'shadow_receptive',
  SHADOW_ACTIVE: 'shadow_active',
  CONSCIOUS_RECEPTIVE: 'conscious_receptive',
  CONSCIOUS_ACTIVE: 'conscious_active',
  NEUTRAL: 'neutral',
};

class AudioManager {
  constructor() {
  }

  async initialize() {
    return true;
  }

  async loadSounds() {
    return true;
  }

  async unloadSounds() {
    return true;
  }

  async playSound(soundType, options = {}) {
    // Silent
  }

  async playCardFlip() {
    // Silent
  }

  async playCardReveal() {
    // Silent
  }

  async playTerminalBeep() {
    // Silent
  }

  async playButtonPress() {
    // Silent
  }

  async playWhoosh() {
    // Silent
  }

  async playShimmer() {
    // Silent
  }

  async playAmbient(trackType) {
    // Silent
  }

  async stopAmbient() {
    // Silent
  }

  async fadeOutAmbient() {
    // Silent
  }

  setMuted(muted) {
    this.isMuted = true; // Always muted
  }

  setSFXVolume(volume) {
    // No-op
  }

  setMusicVolume(volume) {
    // No-op
  }

  getMuted() {
    return true; // Always muted
  }

  getSFXVolume() {
    return 0;
  }

  getMusicVolume() {
    return 0;
  }
}

// Singleton instance
const audioManagerInstance = new AudioManager();

export default audioManagerInstance;

// Named exports for compatibility
export const playSound = () => {};
export const playCardSound = () => {};
export const playRevealSound = () => {};
export const playAmbientSound = () => {};
export const stopAmbientSound = () => {};
export const setVolume = () => {};
export const setSoundEnabled = () => {};
export const isSoundEnabled = () => false;
export const loadSounds = async () => {};
export const unloadSounds = async () => {};
