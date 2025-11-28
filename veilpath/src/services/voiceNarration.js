/**
 * VOICE NARRATION SERVICE - STUBBED OUT
 * All TTS/STT functionality disabled for Expo Go compatibility
 *
 * NO VOICE. NO SPEECH. SILENT MODE.
 */

// Voice profiles (kept for compatibility)
export const VOICE_PROFILES = {
  luna: { name: 'Luna', emoji: '🌙' },
  sol: { name: 'Sol', emoji: '☀️' }
};

class VoiceNarrationService {
  constructor() {
  }

  async initialize() {
    return true;
  }

  async speak(text, guide = 'luna') {
    // Silent
  }

  async stopSpeaking() {
    // Silent
  }

  async pauseSpeaking() {
    // Silent
  }

  async resumeSpeaking() {
    // Silent
  }

  isSpeaking() {
    return false;
  }

  async narrateReading(reading, guide = 'luna') {
    // Silent
  }

  async narrateCardInterpretation(card, interpretation, guide = 'luna') {
    // Silent
  }

  setEnabled(enabled) {
    // No-op
  }

  isEnabled() {
    return false;
  }

  setVolume(volume) {
    // No-op
  }

  getVolume() {
    return 0;
  }
}

// Singleton instance
const voiceNarrationInstance = new VoiceNarrationService();

export default voiceNarrationInstance;

// Named exports for compatibility
export const speak = async () => {};
export const stopSpeaking = async () => {};
export const narrateReading = async () => {};
export const setNarrationEnabled = () => {};
export const isNarrationEnabled = () => false;
