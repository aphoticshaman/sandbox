/**
 * ACCESSIBILITY MANAGER - STUBBED OUT
 * All TTS/STT/Translation functionality disabled for Expo Go compatibility
 *
 * NO VOICE. NO TRANSLATION. SILENT MODE.
 */

// Supported languages (kept for compatibility)
export const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', code: 'en-US' },
  'es': { name: 'Español', code: 'es-ES' },
  'fr': { name: 'Français', code: 'fr-FR' },
  'de': { name: 'Deutsch', code: 'de-DE' }
};

const DEFAULT_SETTINGS = {
  ttsEnabled: false,
  sttEnabled: false,
  language: 'en',
  voiceRate: 1.0,
  voicePitch: 1.0,
  voiceVolume: 1.0
};

class AccessibilityManager {
  constructor() {
    this.settings = DEFAULT_SETTINGS;
  }

  async initialize() {
    return true;
  }

  async loadSettings() {
    return DEFAULT_SETTINGS;
  }

  async saveSettings(settings) {
    // No-op
  }

  async speak(text, options = {}) {
    // Silent
  }

  async stopSpeaking() {
    // Silent
  }

  isSpeaking() {
    return false;
  }

  async startListening() {
    // Silent
    return '';
  }

  async stopListening() {
    // Silent
  }

  isListening() {
    return false;
  }

  setTTSEnabled(enabled) {
    // No-op
  }

  getTTSEnabled() {
    return false;
  }

  setSTTEnabled(enabled) {
    // No-op
  }

  getSTTEnabled() {
    return false;
  }

  setLanguage(lang) {
    // No-op
  }

  getLanguage() {
    return 'en';
  }

  setVoiceRate(rate) {
    // No-op
  }

  setVoicePitch(pitch) {
    // No-op
  }

  setVoiceVolume(volume) {
    // No-op
  }
}

// Singleton instance
const accessibilityManagerInstance = new AccessibilityManager();

export default accessibilityManagerInstance;

// Named exports for compatibility
export const speak = async () => {};
export const stopSpeaking = async () => {};
export const startListening = async () => '';
export const stopListening = async () => {};
export const setTTSEnabled = () => {};
export const setSTTEnabled = () => {};
export const isTTSEnabled = () => false;
export const isSTTEnabled = () => false;
