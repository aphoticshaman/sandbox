/**
 * ACCESSIBILITY & VOICE SETTINGS SCREEN
 * Comprehensive voice control: TTS, STT, Screen Reader, Voice-to-Voice
 *
 * Features:
 * - Mode presets for quick setup
 * - Granular voice controls (speed, pitch, volume, voice selection)
 * - Multi-language support
 * - On-device first approach (Web Speech API)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Switch,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
  FeaturePill,
} from '../components/VeilPathDesign';
import { useVoiceStore } from '../stores/voiceStore';
import webSpeechTTS from '../services/WebSpeechTTS';

// Supported input languages for voice recognition
const VOICE_INPUT_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-AU', name: 'English (AU)', flag: '🇦🇺' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (MX)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
];

export default function AccessibilityScreen({ navigation }) {
  const voiceStore = useVoiceStore();
  const [isTesting, setIsTesting] = useState(false);
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);

  useEffect(() => {
    voiceStore.initialize();
  }, []);

  // Test voice output
  const handleTestVoice = useCallback(() => {
    if (isTesting) return;
    setIsTesting(true);

    const testText = "Hello, I'm Vera, your personal guide. How can I help you today?";

    const voice = voiceStore.voiceOutputVoiceURI
      ? webSpeechTTS.findVoice(voiceStore.voiceOutputVoiceURI)
      : voiceStore.getRecommendedVoice();

    webSpeechTTS.speak(testText, {
      voice,
      rate: voiceStore.voiceOutputSpeed,
      pitch: voiceStore.voiceOutputPitch,
      volume: voiceStore.voiceOutputVolume,
      onEnd: () => setIsTesting(false),
    });

    setTimeout(() => setIsTesting(false), 5000);
  }, [voiceStore, isTesting]);

  // Stop any playing audio
  const handleStopVoice = useCallback(() => {
    webSpeechTTS.stop();
    setIsTesting(false);
  }, []);

  // Get display name for selected voice
  const getSelectedVoiceName = () => {
    if (voiceStore.voiceOutputVoiceName) {
      return voiceStore.voiceOutputVoiceName;
    }
    const recommended = voiceStore.getRecommendedVoice();
    return recommended?.name || 'Default Voice';
  };

  // Get display name for selected language
  const getSelectedLanguageName = () => {
    const lang = VOICE_INPUT_LANGUAGES.find(l => l.code === voiceStore.voiceInputLanguage);
    return lang ? `${lang.flag} ${lang.name}` : 'English (US)';
  };

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <SectionHeader
          icon="🎙️"
          title="Voice & Accessibility"
          subtitle="Customize your experience"
        />
      </View>

      {/* Quick Mode Presets */}
      <VictorianCard style={styles.section} glowColor={COSMIC.deepAmethyst}>
        <Text style={styles.sectionTitle}>⚡ Quick Modes</Text>
        <Text style={styles.sectionDescription}>
          Enable preset configurations for common use cases
        </Text>

        {/* Screen Reader Mode */}
        <TouchableOpacity
          style={[
            styles.modeButton,
            voiceStore.screenReaderMode && styles.modeButtonActive
          ]}
          onPress={() => voiceStore.setScreenReaderMode(!voiceStore.screenReaderMode)}
        >
          <View style={styles.modeContent}>
            <Text style={styles.modeEmoji}>👁️</Text>
            <View style={styles.modeTextContainer}>
              <Text style={[
                styles.modeTitle,
                voiceStore.screenReaderMode && styles.modeTitleActive
              ]}>
                Screen Reader Mode
              </Text>
              <Text style={styles.modeDescription}>
                Vera reads aloud, you type responses
              </Text>
            </View>
          </View>
          <View style={[
            styles.modeIndicator,
            voiceStore.screenReaderMode && styles.modeIndicatorActive
          ]}>
            <Text style={styles.modeIndicatorText}>
              {voiceStore.screenReaderMode ? 'ON' : 'OFF'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Voice-to-Voice Mode */}
        <TouchableOpacity
          style={[
            styles.modeButton,
            voiceStore.voiceToVoiceMode && styles.modeButtonActive
          ]}
          onPress={() => voiceStore.setVoiceToVoiceMode(!voiceStore.voiceToVoiceMode)}
        >
          <View style={styles.modeContent}>
            <Text style={styles.modeEmoji}>🗣️</Text>
            <View style={styles.modeTextContainer}>
              <Text style={[
                styles.modeTitle,
                voiceStore.voiceToVoiceMode && styles.modeTitleActive
              ]}>
                Voice-to-Voice
              </Text>
              <Text style={styles.modeDescription}>
                Full conversation - speak and listen
              </Text>
            </View>
          </View>
          <View style={[
            styles.modeIndicator,
            voiceStore.voiceToVoiceMode && styles.modeIndicatorActive
          ]}>
            <Text style={styles.modeIndicatorText}>
              {voiceStore.voiceToVoiceMode ? 'ON' : 'OFF'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Handsfree Reading Mode */}
        <TouchableOpacity
          style={[
            styles.modeButton,
            voiceStore.handsfreeMode && styles.modeButtonActive
          ]}
          onPress={() => voiceStore.setHandsfreeMode(!voiceStore.handsfreeMode)}
        >
          <View style={styles.modeContent}>
            <Text style={styles.modeEmoji}>🙌</Text>
            <View style={styles.modeTextContainer}>
              <Text style={[
                styles.modeTitle,
                voiceStore.handsfreeMode && styles.modeTitleActive
              ]}>
                Handsfree Reading
              </Text>
              <Text style={styles.modeDescription}>
                Vera narrates like a human reader
              </Text>
            </View>
          </View>
          <View style={[
            styles.modeIndicator,
            voiceStore.handsfreeMode && styles.modeIndicatorActive
          ]}>
            <Text style={styles.modeIndicatorText}>
              {voiceStore.handsfreeMode ? 'ON' : 'OFF'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.pillsRow}>
          <FeaturePill icon="📱" text="On-Device" />
          <FeaturePill icon="🔒" text="Private" />
          <FeaturePill icon="⚡" text="Fast" />
        </View>
      </VictorianCard>

      {/* Handsfree Settings (visible when mode is on) */}
      {voiceStore.handsfreeMode && (
        <VictorianCard style={styles.section} glowColor={COSMIC.etherealCyan}>
          <Text style={styles.sectionTitle}>🙌 Handsfree Settings</Text>

          {/* Auto-Pilot Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Pilot</Text>
              <Text style={styles.settingDescription}>Run entire reading automatically</Text>
            </View>
            <Switch
              value={voiceStore.handsfreeAutoPilot}
              onValueChange={(val) => voiceStore.setHandsfreeAutoPilot(val)}
              trackColor={{ false: '#444', true: COSMIC.deepAmethyst }}
              thumbColor={voiceStore.handsfreeAutoPilot ? COSMIC.candleFlame : '#888'}
            />
          </View>

          {/* Auto-Pilot Delay */}
          {voiceStore.handsfreeAutoPilot && (
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Delay Between Cards</Text>
                <Text style={styles.sliderValue}>{voiceStore.handsfreeAutoPilotDelay}s</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={3}
                maximumValue={20}
                step={1}
                value={voiceStore.handsfreeAutoPilotDelay}
                onValueChange={(val) => voiceStore.setHandsfreeAutoPilotDelay(val)}
                minimumTrackTintColor={COSMIC.etherealCyan}
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor={COSMIC.etherealCyan}
              />
            </View>
          )}

          {/* Narrate-Only Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Narrate Only (Public Mode)</Text>
              <Text style={styles.settingDescription}>Listen only, tap to navigate</Text>
            </View>
            <Switch
              value={voiceStore.handsfreeNarrateOnly}
              onValueChange={(val) => voiceStore.setHandsfreeNarrateOnly(val)}
              trackColor={{ false: '#444', true: COSMIC.deepAmethyst }}
              thumbColor={voiceStore.handsfreeNarrateOnly ? COSMIC.candleFlame : '#888'}
            />
          </View>

          {/* Detail Level */}
          <Text style={[styles.settingLabel, { marginTop: 16, marginBottom: 8 }]}>
            Detail Level
          </Text>
          <View style={styles.detailLevelRow}>
            {['brief', 'balanced', 'detailed'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.detailButton,
                  voiceStore.handsfreeDetailLevel === level && styles.detailButtonActive
                ]}
                onPress={() => voiceStore.setHandsfreeDetailLevel(level)}
              >
                <Text style={[
                  styles.detailButtonText,
                  voiceStore.handsfreeDetailLevel === level && styles.detailButtonTextActive
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Include Visuals */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Include Card Visuals</Text>
              <Text style={styles.settingDescription}>Auto-describe card imagery</Text>
            </View>
            <Switch
              value={voiceStore.handsfreeIncludeVisuals}
              onValueChange={(val) => voiceStore.setHandsfreeIncludeVisuals(val)}
              trackColor={{ false: '#444', true: COSMIC.deepAmethyst }}
              thumbColor={voiceStore.handsfreeIncludeVisuals ? COSMIC.candleFlame : '#888'}
            />
          </View>

          {/* Voice Commands Cheat Sheet */}
          <View style={styles.cheatSheet}>
            <Text style={styles.cheatSheetTitle}>🎤 Voice Commands</Text>
            <View style={styles.cheatSheetGrid}>
              <View style={styles.cheatSheetItem}>
                <Text style={styles.commandText}>"Next"</Text>
                <Text style={styles.commandDesc}>Next card</Text>
              </View>
              <View style={styles.cheatSheetItem}>
                <Text style={styles.commandText}>"Back"</Text>
                <Text style={styles.commandDesc}>Previous card</Text>
              </View>
              <View style={styles.cheatSheetItem}>
                <Text style={styles.commandText}>"Tell me more"</Text>
                <Text style={styles.commandDesc}>More detail</Text>
              </View>
              <View style={styles.cheatSheetItem}>
                <Text style={styles.commandText}>"Describe card"</Text>
                <Text style={styles.commandDesc}>Visual details</Text>
              </View>
              <View style={styles.cheatSheetItem}>
                <Text style={styles.commandText}>"Summary"</Text>
                <Text style={styles.commandDesc}>Big picture</Text>
              </View>
              <View style={styles.cheatSheetItem}>
                <Text style={styles.commandText}>"Pause"</Text>
                <Text style={styles.commandDesc}>Take a break</Text>
              </View>
              <View style={styles.cheatSheetItem}>
                <Text style={styles.commandText}>"Go to shop"</Text>
                <Text style={styles.commandDesc}>Navigate app</Text>
              </View>
              <View style={styles.cheatSheetItem}>
                <Text style={styles.commandText}>"Help"</Text>
                <Text style={styles.commandDesc}>All commands</Text>
              </View>
            </View>
            <Text style={styles.cheatSheetNote}>
              Say commands during readings to navigate hands-free
            </Text>
          </View>
        </VictorianCard>
      )}

      <CosmicDivider />

      {/* Voice Output (TTS) Section */}
      <VictorianCard style={styles.section}>
        <Text style={styles.sectionTitle}>🔊 Voice Output (Vera's Voice)</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Voice Output</Text>
            <Text style={styles.settingDescription}>Vera speaks her responses</Text>
          </View>
          <Switch
            value={voiceStore.voiceOutputEnabled}
            onValueChange={(val) => voiceStore.setVoiceOutputEnabled(val)}
            trackColor={{ false: '#444', true: COSMIC.deepAmethyst }}
            thumbColor={voiceStore.voiceOutputEnabled ? COSMIC.candleFlame : '#888'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-Play Responses</Text>
            <Text style={styles.settingDescription}>Automatically speak new messages</Text>
          </View>
          <Switch
            value={voiceStore.voiceOutputAutoPlay}
            onValueChange={(val) => voiceStore.setVoiceOutputAutoPlay?.(val)}
            trackColor={{ false: '#444', true: COSMIC.deepAmethyst }}
            thumbColor={voiceStore.voiceOutputAutoPlay ? COSMIC.candleFlame : '#888'}
            disabled={!voiceStore.voiceOutputEnabled}
          />
        </View>

        {/* Voice Selection */}
        <TouchableOpacity
          style={[styles.selectButton, !voiceStore.voiceOutputEnabled && styles.selectButtonDisabled]}
          onPress={() => setShowVoiceSelect(!showVoiceSelect)}
          disabled={!voiceStore.voiceOutputEnabled}
        >
          <Text style={styles.selectLabel}>Voice</Text>
          <Text style={styles.selectValue} numberOfLines={1}>
            {getSelectedVoiceName()} ▼
          </Text>
        </TouchableOpacity>

        {/* Voice Selection Dropdown */}
        {showVoiceSelect && voiceStore.voiceOutputEnabled && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={styles.dropdown} nestedScrollEnabled>
              {voiceStore.availableVoices
                .filter(v => v.lang.startsWith('en')) // Show English voices first
                .map((voice) => (
                  <TouchableOpacity
                    key={voice.voiceURI}
                    style={[
                      styles.dropdownItem,
                      voiceStore.voiceOutputVoiceURI === voice.voiceURI && styles.dropdownItemActive
                    ]}
                    onPress={() => {
                      voiceStore.setVoice(voice.voiceURI, voice.name);
                      setShowVoiceSelect(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownText,
                      voiceStore.voiceOutputVoiceURI === voice.voiceURI && styles.dropdownTextActive
                    ]}>
                      {voice.name}
                    </Text>
                    {voice.localService && (
                      <Text style={styles.localBadge}>On-Device</Text>
                    )}
                  </TouchableOpacity>
                ))}
              <Text style={styles.dropdownDivider}>Other Languages</Text>
              {voiceStore.availableVoices
                .filter(v => !v.lang.startsWith('en'))
                .map((voice) => (
                  <TouchableOpacity
                    key={voice.voiceURI}
                    style={[
                      styles.dropdownItem,
                      voiceStore.voiceOutputVoiceURI === voice.voiceURI && styles.dropdownItemActive
                    ]}
                    onPress={() => {
                      voiceStore.setVoice(voice.voiceURI, voice.name);
                      setShowVoiceSelect(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownText,
                      voiceStore.voiceOutputVoiceURI === voice.voiceURI && styles.dropdownTextActive
                    ]}>
                      {voice.name} ({voice.lang})
                    </Text>
                    {voice.localService && (
                      <Text style={styles.localBadge}>On-Device</Text>
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Voice Speed */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={[styles.sliderLabel, !voiceStore.voiceOutputEnabled && styles.disabled]}>
              Speed
            </Text>
            <Text style={[styles.sliderValue, !voiceStore.voiceOutputEnabled && styles.disabled]}>
              {voiceStore.voiceOutputSpeed.toFixed(1)}x
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={2.0}
            step={0.1}
            value={voiceStore.voiceOutputSpeed}
            onValueChange={(val) => voiceStore.setVoiceSpeed(val)}
            minimumTrackTintColor={COSMIC.candleFlame}
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor={COSMIC.candleFlame}
            disabled={!voiceStore.voiceOutputEnabled}
          />
        </View>

        {/* Voice Pitch */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={[styles.sliderLabel, !voiceStore.voiceOutputEnabled && styles.disabled]}>
              Pitch
            </Text>
            <Text style={[styles.sliderValue, !voiceStore.voiceOutputEnabled && styles.disabled]}>
              {voiceStore.voiceOutputPitch.toFixed(1)}x
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={2.0}
            step={0.1}
            value={voiceStore.voiceOutputPitch}
            onValueChange={(val) => voiceStore.setVoicePitch(val)}
            minimumTrackTintColor={COSMIC.etherealCyan}
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor={COSMIC.etherealCyan}
            disabled={!voiceStore.voiceOutputEnabled}
          />
        </View>

        {/* Voice Volume */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={[styles.sliderLabel, !voiceStore.voiceOutputEnabled && styles.disabled]}>
              Volume
            </Text>
            <Text style={[styles.sliderValue, !voiceStore.voiceOutputEnabled && styles.disabled]}>
              {Math.round(voiceStore.voiceOutputVolume * 100)}%
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            value={voiceStore.voiceOutputVolume}
            onValueChange={(val) => voiceStore.setVoiceVolume(val)}
            minimumTrackTintColor={COSMIC.crystalPink}
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor={COSMIC.crystalPink}
            disabled={!voiceStore.voiceOutputEnabled}
          />
        </View>

        {/* Test Voice Button */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.testButton, (!voiceStore.voiceOutputEnabled || isTesting) && styles.testButtonDisabled]}
            onPress={handleTestVoice}
            disabled={!voiceStore.voiceOutputEnabled || isTesting}
          >
            <Text style={styles.testButtonText}>
              {isTesting ? '🔊 Speaking...' : '🔈 Test Voice'}
            </Text>
          </TouchableOpacity>

          {isTesting && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopVoice}
            >
              <Text style={styles.stopButtonText}>⏹️ Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </VictorianCard>

      <CosmicDivider />

      {/* Voice Input (STT) Section */}
      <VictorianCard style={styles.section}>
        <Text style={styles.sectionTitle}>🎤 Voice Input (Your Voice)</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Voice Input</Text>
            <Text style={styles.settingDescription}>Speak to type your messages</Text>
          </View>
          <Switch
            value={voiceStore.voiceInputEnabled}
            onValueChange={(val) => voiceStore.setVoiceInputEnabled(val)}
            trackColor={{ false: '#444', true: COSMIC.deepAmethyst }}
            thumbColor={voiceStore.voiceInputEnabled ? COSMIC.candleFlame : '#888'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Continuous Listening</Text>
            <Text style={styles.settingDescription}>Keep listening after pauses</Text>
          </View>
          <Switch
            value={voiceStore.voiceInputContinuous}
            onValueChange={(val) => voiceStore.setVoiceInputContinuous(val)}
            trackColor={{ false: '#444', true: COSMIC.deepAmethyst }}
            thumbColor={voiceStore.voiceInputContinuous ? COSMIC.candleFlame : '#888'}
            disabled={!voiceStore.voiceInputEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Text style={styles.settingDescription}>Vibrate when voice recognized</Text>
          </View>
          <Switch
            value={voiceStore.hapticFeedbackOnVoice}
            onValueChange={(val) => voiceStore.setHapticFeedbackOnVoice(val)}
            trackColor={{ false: '#444', true: COSMIC.deepAmethyst }}
            thumbColor={voiceStore.hapticFeedbackOnVoice ? COSMIC.candleFlame : '#888'}
            disabled={!voiceStore.voiceInputEnabled}
          />
        </View>

        {/* Language Selection */}
        <TouchableOpacity
          style={[styles.selectButton, !voiceStore.voiceInputEnabled && styles.selectButtonDisabled]}
          onPress={() => setShowLanguageSelect(!showLanguageSelect)}
          disabled={!voiceStore.voiceInputEnabled}
        >
          <Text style={styles.selectLabel}>Input Language</Text>
          <Text style={styles.selectValue}>
            {getSelectedLanguageName()} ▼
          </Text>
        </TouchableOpacity>

        {/* Language Selection Dropdown */}
        {showLanguageSelect && voiceStore.voiceInputEnabled && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={styles.dropdown} nestedScrollEnabled>
              {VOICE_INPUT_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.dropdownItem,
                    voiceStore.voiceInputLanguage === lang.code && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    voiceStore.setVoiceInputLanguage(lang.code);
                    setShowLanguageSelect(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownText,
                    voiceStore.voiceInputLanguage === lang.code && styles.dropdownTextActive
                  ]}>
                    {lang.flag} {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteEmoji}>📱</Text>
          <Text style={styles.noteText}>
            Voice input uses your device's built-in speech recognition when available.
            Processing happens on-device for privacy.
          </Text>
        </View>
      </VictorianCard>

      <CosmicDivider />

      {/* Advanced Options */}
      <VictorianCard style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Advanced</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Read Notifications</Text>
            <Text style={styles.settingDescription}>Announce achievements & updates</Text>
          </View>
          <Switch
            value={voiceStore.readNotifications}
            onValueChange={(val) => voiceStore.setReadNotifications(val)}
            trackColor={{ false: '#444', true: COSMIC.deepAmethyst }}
            thumbColor={voiceStore.readNotifications ? COSMIC.candleFlame : '#888'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Describe Card Visuals</Text>
            <Text style={styles.settingDescription}>AI describes tarot card imagery</Text>
          </View>
          <Switch
            value={voiceStore.describeCardVisuals}
            onValueChange={(val) => voiceStore.setDescribeCardVisuals(val)}
            trackColor={{ false: '#444', true: COSMIC.deepAmethyst }}
            thumbColor={voiceStore.describeCardVisuals ? COSMIC.candleFlame : '#888'}
          />
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            voiceStore.resetVoiceSettings();
            handleStopVoice();
          }}
        >
          <Text style={styles.resetButtonText}>🔄 Reset to Defaults</Text>
        </TouchableOpacity>
      </VictorianCard>

      {/* Footer Padding */}
      <View style={{ height: 40 }} />
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  backLink: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    marginBottom: 16,
  },

  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  sectionDescription: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    marginBottom: 16,
    opacity: 0.8,
  },

  // Mode buttons
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    marginBottom: 10,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
    borderColor: COSMIC.candleFlame,
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 2,
  },
  modeTitleActive: {
    color: COSMIC.candleFlame,
  },
  modeDescription: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  modeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeIndicatorActive: {
    backgroundColor: COSMIC.candleFlame,
  },
  modeIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: COSMIC.moonGlow,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  // Setting rows
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },

  // Select buttons
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectLabel: {
    fontSize: 13,
    color: COSMIC.crystalPink,
  },
  selectValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.candleFlame,
    maxWidth: 180,
  },

  // Dropdowns
  dropdownContainer: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  dropdown: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.1)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
  },
  dropdownText: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    flex: 1,
  },
  dropdownTextActive: {
    color: COSMIC.candleFlame,
    fontWeight: '600',
  },
  dropdownDivider: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  localBadge: {
    fontSize: 9,
    color: COSMIC.etherealCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontWeight: '600',
  },

  // Sliders
  sliderSection: {
    paddingVertical: 10,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 13,
    color: COSMIC.moonGlow,
  },
  sliderValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  disabled: {
    opacity: 0.4,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  testButton: {
    flex: 1,
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COSMIC.deepAmethyst,
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  testButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.moonGlow,
  },
  stopButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  stopButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF4444',
  },
  resetButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  resetButtonText: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    fontWeight: '500',
  },

  // Notes
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  noteEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: COSMIC.etherealCyan,
    lineHeight: 18,
  },

  // Detail Level Buttons
  detailLevelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  detailButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  detailButtonActive: {
    backgroundColor: 'rgba(74, 20, 140, 0.4)',
    borderColor: COSMIC.candleFlame,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COSMIC.crystalPink,
  },
  detailButtonTextActive: {
    color: COSMIC.candleFlame,
  },

  // Voice Commands Cheat Sheet
  cheatSheet: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  cheatSheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.etherealCyan,
    marginBottom: 12,
    textAlign: 'center',
  },
  cheatSheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cheatSheetItem: {
    width: '48%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  commandText: {
    fontSize: 12,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 2,
  },
  commandDesc: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  cheatSheetNote: {
    marginTop: 12,
    fontSize: 10,
    color: COSMIC.etherealCyan,
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
});
