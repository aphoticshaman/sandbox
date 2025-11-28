/**
 * VOICE CONTROLS COMPONENT
 *
 * UI for voice-to-voice interaction with Luna/Sol
 *
 * Features:
 * - Microphone button (tap to speak)
 * - Playback controls (play/pause/stop)
 * - Voice guide selection (Luna/Sol/Androgyne)
 * - Speech rate and volume controls
 * - Visual feedback (waveform, speaking indicator)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator
} from 'react-native';
import voiceNarrator, { VOICE_PROFILES } from '../services/voiceNarration';

// ═══════════════════════════════════════════════════════════
// VOICE CONTROLS COMPONENT
// ═══════════════════════════════════════════════════════════

export default function VoiceControls({
  guide = 'luna',
  onGuideChange,
  narration = null,
  style
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(guide);
  const [initialized, setInitialized] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Initialize voice narrator
  useEffect(() => {
    initializeVoice();
  }, []);

  // Listen to voice events
  useEffect(() => {
    const unsubscribe = voiceNarrator.addListener((event, data) => {
      switch (event) {
        case 'start':
          setIsSpeaking(true);
          startSpeakingAnimation();
          break;
        case 'done':
        case 'stopped':
          setIsSpeaking(false);
          stopSpeakingAnimation();
          break;
        case 'guide_changed':
          setCurrentGuide(data.guide);
          if (onGuideChange) onGuideChange(data.guide);
          break;
      }
    });

    return unsubscribe;
  }, []);

  // Initialize
  async function initializeVoice() {
    const success = await voiceNarrator.initialize();
    setInitialized(success);
  }

  // Speaking animation
  function startSpeakingAnimation() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      })
    ).start();
  }

  function stopSpeakingAnimation() {
    pulseAnim.setValue(1);
    waveAnim.setValue(0);
  }

  // Handlers
  async function handlePlayPause() {
    if (isSpeaking) {
      await voiceNarrator.stop();
    } else {
      if (narration) {
        await voiceNarrator.speak(narration, currentGuide);
      }
    }
  }

  async function handleStop() {
    await voiceNarrator.stop();
  }

  async function handleMicPress() {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      // TODO: Stop speech recognition
    } else {
      // Start listening
      setIsListening(true);
      // TODO: Start speech recognition
    }
  }

  async function handleGuideSwitch() {
    const guides = ['luna', 'sol', 'androgyne'];
    const currentIndex = guides.indexOf(currentGuide);
    const nextGuide = guides[(currentIndex + 1) % guides.length];

    await voiceNarrator.setGuide(nextGuide);
    setCurrentGuide(nextGuide);

    if (onGuideChange) {
      onGuideChange(nextGuide);
    }
  }

  if (!initialized) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#9D5C63" />
        <Text style={styles.statusText}>Initializing voice...</Text>
      </View>
    );
  }

  const profile = VOICE_PROFILES[currentGuide];

  return (
    <View style={[styles.container, style]}>
      {/* Guide Indicator */}
      <View style={styles.guideIndicator}>
        <Text style={styles.guideEmoji}>{profile.emoji}</Text>
        <Text style={styles.guideName}>{profile.name}</Text>
        {isSpeaking && (
          <Animated.View
            style={[
              styles.speakingIndicator,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={styles.speakingText}>Speaking...</Text>
          </Animated.View>
        )}
      </View>

      {/* Main Controls */}
      <View style={styles.controls}>
        {/* Microphone Button */}
        <TouchableOpacity
          style={[
            styles.micButton,
            isListening && styles.micButtonActive
          ]}
          onPress={handleMicPress}
          activeOpacity={0.8}
        >
          <Text style={styles.micIcon}>{isListening ? '🎙️' : '🎤'}</Text>
          <Text style={styles.micLabel}>
            {isListening ? 'Listening...' : 'Tap to Speak'}
          </Text>
        </TouchableOpacity>

        {/* Playback Controls */}
        {narration && (
          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              activeOpacity={0.8}
            >
              <Text style={styles.playIcon}>
                {isSpeaking ? '⏸' : '▶️'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStop}
              activeOpacity={0.8}
            >
              <Text style={styles.stopIcon}>⏹</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Guide Switcher */}
        <TouchableOpacity
          style={styles.guideSwitcher}
          onPress={handleGuideSwitch}
          activeOpacity={0.8}
        >
          <Text style={styles.switchIcon}>🔄</Text>
          <Text style={styles.switchLabel}>Switch Guide</Text>
        </TouchableOpacity>
      </View>

      {/* Waveform Visualization (when speaking) */}
      {isSpeaking && (
        <View style={styles.waveform}>
          {[...Array(5)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.wave,
                {
                  height: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 30 + Math.random() * 20]
                  })
                }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// VOICE SETTINGS MODAL
// ═══════════════════════════════════════════════════════════

export function VoiceSettings({ visible, onClose }) {
  const [speechRate, setSpeechRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const rate = await voiceNarrator.getCustomRate();
    const vol = await voiceNarrator.getCustomVolume();

    if (rate) setSpeechRate(rate);
    if (vol) setVolume(vol);
  }

  async function handleRateChange(newRate) {
    setSpeechRate(newRate);
    await voiceNarrator.setRate(newRate);
  }

  async function handleVolumeChange(newVolume) {
    setVolume(newVolume);
    await voiceNarrator.setVolume(newVolume);
  }

  if (!visible) return null;

  return (
    <View style={styles.settingsModal}>
      <Text style={styles.settingsTitle}>Voice Settings</Text>

      {/* Speech Rate */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Speech Rate: {speechRate.toFixed(2)}x</Text>
        <View style={styles.rateButtons}>
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => handleRateChange(Math.max(0.5, speechRate - 0.1))}
          >
            <Text>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => handleRateChange(Math.min(2.0, speechRate + 0.1))}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Volume */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Volume: {(volume * 100).toFixed(0)}%</Text>
        <View style={styles.rateButtons}>
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => handleVolumeChange(Math.max(0.1, volume - 0.1))}
          >
            <Text>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => handleVolumeChange(Math.min(1.0, volume + 0.1))}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1A1625',
    borderRadius: 20,
    alignItems: 'center'
  },

  // Guide Indicator
  guideIndicator: {
    alignItems: 'center',
    marginBottom: 20
  },

  guideEmoji: {
    fontSize: 48,
    marginBottom: 8
  },

  guideName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E6D9E6',
    marginBottom: 4
  },

  speakingIndicator: {
    marginTop: 8
  },

  speakingText: {
    fontSize: 12,
    color: '#9D5C63',
    fontStyle: 'italic'
  },

  // Controls
  controls: {
    width: '100%',
    alignItems: 'center'
  },

  // Microphone
  micButton: {
    backgroundColor: '#2A243A',
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#3A3450'
  },

  micButtonActive: {
    backgroundColor: '#9D5C63',
    borderColor: '#D3A5A9'
  },

  micIcon: {
    fontSize: 40,
    marginBottom: 8
  },

  micLabel: {
    fontSize: 12,
    color: '#E6D9E6',
    fontWeight: '500'
  },

  // Playback
  playbackControls: {
    flexDirection: 'row',
    marginBottom: 20
  },

  playButton: {
    backgroundColor: '#3A3450',
    borderRadius: 40,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10
  },

  stopButton: {
    backgroundColor: '#3A3450',
    borderRadius: 40,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10
  },

  playIcon: {
    fontSize: 24
  },

  stopIcon: {
    fontSize: 24
  },

  // Guide Switcher
  guideSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A243A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25
  },

  switchIcon: {
    fontSize: 20,
    marginRight: 8
  },

  switchLabel: {
    fontSize: 14,
    color: '#E6D9E6',
    fontWeight: '500'
  },

  // Waveform
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 50
  },

  wave: {
    width: 4,
    backgroundColor: '#9D5C63',
    marginHorizontal: 3,
    borderRadius: 2
  },

  // Status
  statusText: {
    fontSize: 12,
    color: '#9D5C63',
    marginTop: 8
  },

  // Settings Modal
  settingsModal: {
    backgroundColor: '#2A243A',
    padding: 24,
    borderRadius: 20,
    minWidth: 300
  },

  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E6D9E6',
    marginBottom: 20,
    textAlign: 'center'
  },

  settingRow: {
    marginBottom: 20
  },

  settingLabel: {
    fontSize: 14,
    color: '#E6D9E6',
    marginBottom: 10
  },

  rateButtons: {
    flexDirection: 'row'
  },

  rateButton: {
    backgroundColor: '#3A3450',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10
  },

  closeButton: {
    backgroundColor: '#9D5C63',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10
  },

  closeButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600'
  }
});
