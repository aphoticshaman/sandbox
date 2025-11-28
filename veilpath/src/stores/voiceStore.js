/**
 * VOICE SETTINGS STORE
 * Granular control over voice input/output for accessibility and preference
 *
 * Features:
 * - Voice Input (STT): Speak to type
 * - Voice Output (TTS): Vera speaks responses
 * - Screen Reader Mode: TTS reads responses while user types
 * - Voice-to-Voice: Full conversational mode
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default voice settings
const DEFAULT_VOICE_SETTINGS = {
  // Voice Input (STT)
  voiceInputEnabled: false,
  voiceInputLanguage: 'en-US',
  voiceInputContinuous: false, // Keep listening after pause

  // Voice Output (TTS)
  voiceOutputEnabled: false,
  voiceOutputAutoPlay: true, // Auto-play Vera's responses
  voiceOutputSpeed: 1.0, // 0.5 - 2.0
  voiceOutputPitch: 1.0, // 0.5 - 2.0
  voiceOutputVolume: 1.0, // 0 - 1
  voiceOutputVoiceURI: null, // Specific voice (null = default)
  voiceOutputVoiceName: null, // Display name of selected voice

  // Mode presets
  screenReaderMode: false, // TTS reads, user types
  voiceToVoiceMode: false, // Full voice conversation
  handsfreeMode: false, // Vera narrates readings like a human reader

  // Handsfree mode settings
  handsfreeDetailLevel: 'balanced', // 'brief' | 'balanced' | 'detailed'
  handsfreeIncludeVisuals: false, // Include visual descriptions by default
  handsfreePauseAfterCard: true, // Pause to let user process/ask questions
  handsfreeAutoPilot: false, // Auto-run entire reading without interaction
  handsfreeAutoPilotDelay: 8, // Seconds between cards in auto-pilot
  handsfreeNarrateOnly: false, // Listen only, no voice commands (for public places)

  // Advanced
  readMessageAloud: true, // Read each message as it arrives
  readNotifications: false, // Read notifications/toasts
  hapticFeedbackOnVoice: true, // Vibrate when voice recognized

  // Accessibility - Card Descriptions
  describeCardVisuals: false, // AI describes tarot card imagery for blind users
};

export const useVoiceStore = create(
  persist(
    (set, get) => ({
      ...DEFAULT_VOICE_SETTINGS,

      // Available voices (populated on init)
      availableVoices: [],
      isInitialized: false,

      /**
       * Initialize voice capabilities
       */
      initialize: async () => {
        if (typeof window === 'undefined') return;

        // Check TTS support
        if ('speechSynthesis' in window) {
          // Get available voices (may need to wait for them to load)
          const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
              set({
                availableVoices: voices.map(v => ({
                  voiceURI: v.voiceURI,
                  name: v.name,
                  lang: v.lang,
                  localService: v.localService,
                  default: v.default,
                })),
                isInitialized: true
              });
            }
          };

          loadVoices();
          // Chrome loads voices async
          if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
          }
        }

        set({ isInitialized: true });
      },

      /**
       * Toggle voice input
       */
      setVoiceInputEnabled: (enabled) => {
        set({ voiceInputEnabled: enabled });
      },

      /**
       * Toggle voice output
       */
      setVoiceOutputEnabled: (enabled) => {
        set({ voiceOutputEnabled: enabled });
      },

      /**
       * Set screen reader mode (TTS on, voice input off)
       */
      setScreenReaderMode: (enabled) => {
        set({
          screenReaderMode: enabled,
          voiceOutputEnabled: enabled,
          voiceOutputAutoPlay: enabled,
          voiceInputEnabled: false,
          voiceToVoiceMode: false,
        });
      },

      /**
       * Set voice-to-voice mode (full conversation)
       */
      setVoiceToVoiceMode: (enabled) => {
        set({
          voiceToVoiceMode: enabled,
          voiceInputEnabled: enabled,
          voiceOutputEnabled: enabled,
          voiceOutputAutoPlay: enabled,
          screenReaderMode: false,
        });
      },

      /**
       * Set TTS speed
       */
      setVoiceSpeed: (speed) => {
        set({ voiceOutputSpeed: Math.max(0.5, Math.min(2.0, speed)) });
      },

      /**
       * Set TTS pitch
       */
      setVoicePitch: (pitch) => {
        set({ voiceOutputPitch: Math.max(0.5, Math.min(2.0, pitch)) });
      },

      /**
       * Set TTS volume
       */
      setVoiceVolume: (volume) => {
        set({ voiceOutputVolume: Math.max(0, Math.min(1, volume)) });
      },

      /**
       * Select specific voice
       */
      setVoice: (voiceURI, voiceName) => {
        set({
          voiceOutputVoiceURI: voiceURI,
          voiceOutputVoiceName: voiceName,
        });
      },

      /**
       * Set auto-play for TTS
       */
      setVoiceOutputAutoPlay: (enabled) => {
        set({ voiceOutputAutoPlay: enabled });
      },

      /**
       * Set voice input language
       */
      setVoiceInputLanguage: (language) => {
        set({ voiceInputLanguage: language });
      },

      /**
       * Set continuous listening
       */
      setVoiceInputContinuous: (enabled) => {
        set({ voiceInputContinuous: enabled });
      },

      /**
       * Set haptic feedback
       */
      setHapticFeedbackOnVoice: (enabled) => {
        set({ hapticFeedbackOnVoice: enabled });
      },

      /**
       * Set read notifications
       */
      setReadNotifications: (enabled) => {
        set({ readNotifications: enabled });
      },

      /**
       * Set card visual descriptions (accessibility)
       */
      setDescribeCardVisuals: (enabled) => {
        set({ describeCardVisuals: enabled });
      },

      /**
       * Set handsfree mode (Vera narrates like a human reader)
       */
      setHandsfreeMode: (enabled) => {
        set({
          handsfreeMode: enabled,
          voiceInputEnabled: enabled, // Voice commands to navigate
          voiceOutputEnabled: enabled,
          voiceOutputAutoPlay: enabled,
          screenReaderMode: false,
          voiceToVoiceMode: false,
        });
      },

      /**
       * Set handsfree detail level
       */
      setHandsfreeDetailLevel: (level) => {
        if (['brief', 'balanced', 'detailed'].includes(level)) {
          set({ handsfreeDetailLevel: level });
        }
      },

      /**
       * Set whether handsfree includes visual descriptions
       */
      setHandsfreeIncludeVisuals: (enabled) => {
        set({ handsfreeIncludeVisuals: enabled });
      },

      /**
       * Set whether to pause after each card
       */
      setHandsfreePauseAfterCard: (enabled) => {
        set({ handsfreePauseAfterCard: enabled });
      },

      /**
       * Set auto-pilot mode (runs entire reading automatically)
       */
      setHandsfreeAutoPilot: (enabled) => {
        set({
          handsfreeAutoPilot: enabled,
          handsfreePauseAfterCard: !enabled, // Don't pause in auto-pilot
        });
      },

      /**
       * Set auto-pilot delay between cards (in seconds)
       */
      setHandsfreeAutoPilotDelay: (seconds) => {
        set({ handsfreeAutoPilotDelay: Math.max(3, Math.min(30, seconds)) });
      },

      /**
       * Set narrate-only mode (for public places, no voice input)
       */
      setHandsfreeNarrateOnly: (enabled) => {
        set({
          handsfreeNarrateOnly: enabled,
          voiceInputEnabled: !enabled, // Disable voice input in narrate-only
        });
      },

      /**
       * Reset to defaults
       */
      resetVoiceSettings: () => {
        set(DEFAULT_VOICE_SETTINGS);
      },

      /**
       * Get recommended voice for Vera (female, English)
       */
      getRecommendedVoice: () => {
        const { availableVoices } = get();

        // Priority: Google UK Female > Microsoft Zira > Any female English voice
        const priorities = [
          'Google UK English Female',
          'Microsoft Zira',
          'Samantha', // macOS
          'Karen', // macOS Australian
          'Moira', // macOS Irish
          'Google US English',
        ];

        for (const name of priorities) {
          const voice = availableVoices.find(v =>
            v.name.includes(name) || v.voiceURI.includes(name)
          );
          if (voice) return voice;
        }

        // Fallback: any English female-sounding voice
        const englishVoice = availableVoices.find(v =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('female') ||
           v.name.includes('Zira') ||
           v.name.includes('Samantha'))
        );
        if (englishVoice) return englishVoice;

        // Final fallback: any English voice
        return availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
      },
    }),
    {
      name: 'veilpath-voice-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        voiceInputEnabled: state.voiceInputEnabled,
        voiceInputLanguage: state.voiceInputLanguage,
        voiceInputContinuous: state.voiceInputContinuous,
        voiceOutputEnabled: state.voiceOutputEnabled,
        voiceOutputAutoPlay: state.voiceOutputAutoPlay,
        voiceOutputSpeed: state.voiceOutputSpeed,
        voiceOutputPitch: state.voiceOutputPitch,
        voiceOutputVolume: state.voiceOutputVolume,
        voiceOutputVoiceURI: state.voiceOutputVoiceURI,
        voiceOutputVoiceName: state.voiceOutputVoiceName,
        screenReaderMode: state.screenReaderMode,
        voiceToVoiceMode: state.voiceToVoiceMode,
        handsfreeMode: state.handsfreeMode,
        handsfreeDetailLevel: state.handsfreeDetailLevel,
        handsfreeIncludeVisuals: state.handsfreeIncludeVisuals,
        handsfreePauseAfterCard: state.handsfreePauseAfterCard,
        handsfreeAutoPilot: state.handsfreeAutoPilot,
        handsfreeAutoPilotDelay: state.handsfreeAutoPilotDelay,
        handsfreeNarrateOnly: state.handsfreeNarrateOnly,
        readMessageAloud: state.readMessageAloud,
        readNotifications: state.readNotifications,
        hapticFeedbackOnVoice: state.hapticFeedbackOnVoice,
        describeCardVisuals: state.describeCardVisuals,
      }),
    }
  )
);

export default useVoiceStore;
