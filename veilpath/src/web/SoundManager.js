/**
 * SOUND MANAGER - DISABLED
 * All audio is disabled per user requirement.
 * NO SOUND. NO MUSIC. NO AUDIO. COMPLETELY SILENT.
 */

class SoundManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.masterVolume = 0;
    this.sfxVolume = 0;
    this.musicVolume = 0;
    this.muted = true; // Always muted
    this.initialized = false;
  }

  async initialize() {
    // NO-OP: Audio disabled
    this.initialized = true;
    return true;
  }

  async preloadSounds() {
    // NO-OP: Audio disabled
    return true;
  }

  play(soundName) {
    // NO-OP: Audio disabled
  }

  toggleMute() {
    // Always stays muted
    return true;
  }

  setMasterVolume(volume) {
    // NO-OP: Audio disabled
  }

  setSFXVolume(volume) {
    // NO-OP: Audio disabled
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Export for React components
export default soundManager;
