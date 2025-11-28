/**
 * WEB SPEECH TTS SERVICE
 * Text-to-Speech using Web Speech API
 * Works in modern browsers without external APIs
 *
 * Features:
 * - Speak text with configurable voice, speed, pitch
 * - Queue management for multiple utterances
 * - Pause/resume/stop controls
 * - Event callbacks for UI updates
 */

import { Platform } from 'react-native';

class WebSpeechTTS {
  constructor() {
    this.synth = null;
    this.currentUtterance = null;
    this.queue = [];
    this.isInitialized = false;
    this.isSpeaking = false;
    this.isPaused = false;

    // Callbacks
    this.onStart = null;
    this.onEnd = null;
    this.onPause = null;
    this.onResume = null;
    this.onError = null;
    this.onBoundary = null; // Word/sentence boundaries
  }

  /**
   * Initialize the TTS service
   */
  initialize() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      console.warn('[WebSpeechTTS] Not available outside web platform');
      return false;
    }

    if (!('speechSynthesis' in window)) {
      console.warn('[WebSpeechTTS] Speech synthesis not supported');
      return false;
    }

    this.synth = window.speechSynthesis;
    this.isInitialized = true;
    return true;
  }

  /**
   * Get available voices
   */
  getVoices() {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Find a specific voice by URI or name
   */
  findVoice(voiceURI) {
    if (!voiceURI) return null;
    const voices = this.getVoices();
    return voices.find(v => v.voiceURI === voiceURI || v.name === voiceURI);
  }

  /**
   * Speak text
   * @param {string} text - Text to speak
   * @param {object} options - Voice options
   */
  speak(text, options = {}) {
    if (!this.isInitialized) {
      if (!this.initialize()) return false;
    }

    if (!text || text.trim().length === 0) return false;

    const {
      voice = null,
      voiceURI = null,
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0,
      onStart,
      onEnd,
      onError,
      interrupt = false, // Stop current speech and speak immediately
    } = options;

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set voice
    if (voice) {
      utterance.voice = voice;
    } else if (voiceURI) {
      const foundVoice = this.findVoice(voiceURI);
      if (foundVoice) utterance.voice = foundVoice;
    }

    // Set properties
    utterance.rate = Math.max(0.1, Math.min(10, rate));
    utterance.pitch = Math.max(0, Math.min(2, pitch));
    utterance.volume = Math.max(0, Math.min(1, volume));

    // Event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.currentUtterance = utterance;
      onStart?.();
      this.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      onEnd?.();
      this.onEnd?.();
      // Process next in queue
      this._processQueue();
    };

    utterance.onerror = (event) => {
      console.error('[WebSpeechTTS] Error:', event.error);
      this.isSpeaking = false;
      this.currentUtterance = null;
      onError?.(event);
      this.onError?.(event);
      // Try next in queue despite error
      this._processQueue();
    };

    utterance.onpause = () => {
      this.isPaused = true;
      this.onPause?.();
    };

    utterance.onresume = () => {
      this.isPaused = false;
      this.onResume?.();
    };

    utterance.onboundary = (event) => {
      this.onBoundary?.(event);
    };

    // Handle speaking
    if (interrupt) {
      this.stop();
      this.synth.speak(utterance);
    } else if (this.isSpeaking) {
      // Add to queue
      this.queue.push({ utterance, options: { onStart, onEnd, onError } });
    } else {
      this.synth.speak(utterance);
    }

    return true;
  }

  /**
   * Process the speech queue
   */
  _processQueue() {
    if (this.queue.length === 0) return;
    if (this.isSpeaking) return;

    const next = this.queue.shift();
    if (next) {
      this.synth.speak(next.utterance);
    }
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      return true;
    }
    return false;
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      return true;
    }
    return false;
  }

  /**
   * Stop speech and clear queue
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.queue = [];
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      return true;
    }
    return false;
  }

  /**
   * Check if currently speaking
   */
  getSpeaking() {
    return this.isSpeaking;
  }

  /**
   * Check if paused
   */
  getPaused() {
    return this.isPaused;
  }

  /**
   * Get queue length
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * Speak with Vera's voice (convenience method)
   */
  speakAsVera(text, options = {}) {
    // Vera's voice characteristics: warm, clear, slightly slower
    return this.speak(text, {
      rate: 0.95, // Slightly slower for clarity
      pitch: 1.05, // Slightly higher for warmth
      ...options,
    });
  }
}

// Singleton instance
const webSpeechTTS = new WebSpeechTTS();

// Initialize on import (for web)
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  webSpeechTTS.initialize();
}

export default webSpeechTTS;

// Named exports for convenience
export const speak = (text, options) => webSpeechTTS.speak(text, options);
export const speakAsVera = (text, options) => webSpeechTTS.speakAsVera(text, options);
export const pause = () => webSpeechTTS.pause();
export const resume = () => webSpeechTTS.resume();
export const stop = () => webSpeechTTS.stop();
export const getVoices = () => webSpeechTTS.getVoices();
export const isSpeaking = () => webSpeechTTS.getSpeaking();
