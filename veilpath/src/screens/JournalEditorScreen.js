/**
 * Journal Editor Screen - VeilPath WitchTok x Victorian Gothic
 * Write and edit journal entries with cosmic design
 * Features real-time AI analysis as you type, voice-to-text, and ambient music
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { AudioPlayerButton, VoiceToTextButton } from '../components';
import { useJournalStore } from '../stores/journalStore';
import { useUserStore } from '../stores/userStore';
import { getContent } from '../data/contentLoader';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

// Cross-platform alert helper
const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  if (Platform.OS === 'web') {
    const confirmed = buttons.length > 1
      ? window.confirm(`${title}\n\n${message}`)
      : (window.alert(`${title}\n\n${message}`), true);

    if (confirmed && buttons.length > 0) {
      const okButton = buttons.find(b => b.text === 'OK' || b.style !== 'cancel');
      if (okButton?.onPress) okButton.onPress();
    } else if (!confirmed && buttons.length > 1) {
      const cancelButton = buttons.find(b => b.style === 'cancel');
      if (cancelButton?.onPress) cancelButton.onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

const MOOD_OPTIONS = [
  { id: 'calm', emoji: '😌', label: 'Calm' },
  { id: 'energized', emoji: '⚡', label: 'Energized' },
  { id: 'peaceful', emoji: '🕊️', label: 'Peaceful' },
  { id: 'focused', emoji: '🎯', label: 'Focused' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'angry', emoji: '😤', label: 'Angry' },
  { id: 'joyful', emoji: '😊', label: 'Joyful' },
  { id: 'overwhelmed', emoji: '😵', label: 'Overwhelmed' },
  { id: 'grateful', emoji: '🙏', label: 'Grateful' },
];

// Debounce helper
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Cozy messages for journaling companions
const COZY_MESSAGES = [
  (n) => `📖 ${n} ${n === 1 ? 'other seeker is' : 'seekers are'} writing too`,
  (n) => `✨ You're not alone - ${n} ${n === 1 ? 'witch' : 'witches'} journaling now`,
  (n) => `🌙 ${n} ${n === 1 ? 'soul' : 'souls'} growing alongside you`,
  (n) => `🕯️ A cozy ${n}-person writing circle`,
  (n) => `🌿 ${n} ${n === 1 ? 'heart' : 'hearts'} pouring onto pages tonight`,
];

export default function JournalEditorScreen({ navigation, route }) {
  const { mode = 'new', entryId, linkedCardIds, promptSuggestions } = route.params || {};

  const journalStore = useJournalStore();
  const userStore = useUserStore();

  const [content, setContent] = useState('');
  const [moodBefore, setMoodBefore] = useState(null);
  const [moodAfter, setMoodAfter] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [writingCompanions, setWritingCompanions] = useState(0);
  const [cozyMessage, setCozyMessage] = useState(null);

  // Fetch real stats on mount to show writing companions
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          // Use recentlyActive (5 min) for more immediate "writing together" feel
          const companions = data.recentlyActive || 0;
          if (companions > 0) {
            setWritingCompanions(companions);
            // Pick a random cozy message
            const messageFunc = COZY_MESSAGES[Math.floor(Math.random() * COZY_MESSAGES.length)];
            setCozyMessage(messageFunc(companions));
          }
        }
      } catch (error) {
        // Silent fail - just don't show the cozy message
      }
    };
    fetchStats();
  }, []);

  // AI Vera state
  const [veraInsight, setVeraInsight] = useState(null);
  const [veraLoading, setVeraLoading] = useState(false);
  const insightOpacity = useRef(new Animated.Value(0)).current;
  const lastAnalyzedText = useRef('');

  // Fetch AI analysis
  const fetchVeraInsight = useCallback(async (text, mood) => {
    if (!text || text.trim().length < 30) {
      return;
    }

    // Don't re-analyze if text hasn't changed significantly
    if (Math.abs(text.length - lastAnalyzedText.current.length) < 20) {
      return;
    }
    lastAnalyzedText.current = text;

    setVeraLoading(true);

    try {
      const response = await fetch('/api/analyze-journal-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          mood,
          wordCount: text.trim().split(/\s+/).filter(w => w).length,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.insight) {
        setVeraInsight(data.data);
        // Animate insight appearance
        Animated.sequence([
          Animated.timing(insightOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(insightOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
      }
    } catch (error) {
      console.error('[JournalEditor] Vera fetch failed:', error);
    } finally {
      setVeraLoading(false);
    }
  }, [insightOpacity]);

  // Debounced vera analysis (2 seconds after stop typing)
  const debouncedAnalyze = useDebounce(fetchVeraInsight, 2000);

  useEffect(() => {
    if (mode === 'edit' && entryId) {
      const entry = journalStore.getEntryById(entryId);
      if (entry) {
        setContent(entry.content);
        setMoodBefore(entry.mood);
        setMoodAfter(entry.moodAfter);
      }
    } else if (mode === 'new') {
      journalStore.startDraft(null, null, null);
    }
  }, [mode, entryId]);

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      showAlert('Empty Entry', 'Please write something before saving.');
      return;
    }

    if (!journalStore.currentDraft) {
      journalStore.startDraft(null, null, moodBefore);
    }

    journalStore.updateDraft(trimmedContent);

    const entry = journalStore.saveDraft({
      mood: moodBefore,
      moodAfter: moodAfter,
      linkedCardIds: linkedCardIds || [],
      tags: [],
      cbtDistortions: [],
      dbtSkills: [],
    });

    if (entry) {
      userStore.awardXP(entry.xpAwarded);
      userStore.incrementStat('totalJournalEntries', 1);

      showAlert(
        '✨ Entry Saved',
        `+${entry.xpAwarded} XP earned!\n${entry.wordCount} words written.`,
        [{
          text: 'OK',
          onPress: () => {
            if (navigation?.navigate) {
              navigation.navigate('JournalList');
            } else if (navigation?.goBack) {
              navigation.goBack();
            }
          }
        }]
      );
    } else {
      showAlert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const handleDiscard = () => {
    showAlert(
      'Discard Entry?',
      'Your entry will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            journalStore.discardDraft();
            if (navigation?.goBack) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handlePromptSelect = (prompt) => {
    setSelectedPrompt(prompt);
    setShowPrompts(false);

    if (!content.trim()) {
      setContent(`Prompt: ${prompt}\n\n`);
    }
  };

  const loadRandomPrompt = () => {
    const contentLib = getContent();
    const prompt = contentLib.getRandomPrompt();
    if (prompt) {
      handlePromptSelect(prompt);
    }
  };

  const getMoodPrompts = () => {
    if (!moodBefore) return [];

    const contentLib = getContent();
    const prompts = contentLib.getPromptsByMood(moodBefore);
    return prompts.slice(0, 5);
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w).length;

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {mode === 'edit' ? 'Edit Entry' : 'New Entry'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Cozy Writing Companions Banner - only shows if others are active */}
      {cozyMessage && writingCompanions > 0 && (
        <View style={styles.cozyBanner}>
          <Text style={styles.cozyText}>{cozyMessage}</Text>
        </View>
      )}

      {/* Mood Before */}
      <SectionHeader icon="💭" title="How are you feeling?" />
      <VictorianCard style={styles.moodCard} showCorners={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.moodOptions}>
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodOption,
                  moodBefore === mood.id && styles.moodOptionSelected,
                ]}
                onPress={() => setMoodBefore(mood.id)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  moodBefore === mood.id && styles.moodLabelSelected,
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </VictorianCard>

      {/* Ambient Music Row */}
      <View style={styles.musicRow}>
        <Text style={styles.musicLabel}>🎵 Writing ambience:</Text>
        <AudioPlayerButton
          variant="compact"
          availablePlaylists={['focus', 'sleep', 'meditation']}
        />
      </View>

      {/* Prompts Section */}
      {!showPrompts ? (
        <View style={styles.promptActions}>
          <TouchableOpacity style={styles.promptButton} onPress={loadRandomPrompt}>
            <Text style={styles.promptButtonText}>📝 Get Prompt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.promptButton, styles.promptButtonGhost]}
            onPress={() => setShowPrompts(true)}
          >
            <Text style={styles.promptButtonTextGhost}>Browse Prompts</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <VictorianCard style={styles.promptsCard} glowColor={COSMIC.deepAmethyst}>
          <Text style={styles.promptsTitle}>✨ Writing Prompts</Text>
          {getMoodPrompts().length > 0 ? (
            getMoodPrompts().map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.promptItem}
                onPress={() => handlePromptSelect(prompt)}
              >
                <Text style={styles.promptBullet}>✧</Text>
                <Text style={styles.promptText}>{prompt}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noPromptsText}>
              Select a mood to see relevant prompts
            </Text>
          )}
          <TouchableOpacity
            style={styles.hidePromptsButton}
            onPress={() => setShowPrompts(false)}
          >
            <Text style={styles.hidePromptsText}>Hide Prompts</Text>
          </TouchableOpacity>
        </VictorianCard>
      )}

      <CosmicDivider />

      {/* Text Editor */}
      <VictorianCard style={styles.editorCard} glowColor={COSMIC.candleFlame}>
        <TextInput
          style={styles.editor}
          placeholder="Start writing or tap the mic to speak..."
          placeholderTextColor="rgba(225, 190, 231, 0.4)"
          value={content}
          onChangeText={(text) => {
            setContent(text);
            journalStore.updateDraft(text);
            // Trigger debounced AI analysis
            debouncedAnalyze(text, moodBefore);
          }}
          multiline
          textAlignVertical="top"
          autoFocus={mode === 'new'}
        />
        <View style={styles.editorFooter}>
          <View style={styles.editorFooterLeft}>
            <Text style={styles.wordCount}>{wordCount} words</Text>
            {wordCount >= 50 && (
              <Text style={styles.bonusText}>✨ Depth bonus eligible</Text>
            )}
          </View>
          <VoiceToTextButton
            onTranscript={(text) => {
              // Append transcribed text with space
              const newContent = content + (content && !content.endsWith(' ') ? ' ' : '') + text;
              setContent(newContent);
              journalStore.updateDraft(newContent);
              debouncedAnalyze(newContent, moodBefore);
            }}
          />
        </View>
      </VictorianCard>

      {/* Vera Insight - Real-time AI Analysis */}
      {(veraInsight || veraLoading) && (
        <Animated.View style={[styles.veraCard, { opacity: veraLoading ? 0.6 : insightOpacity }]}>
          <View style={styles.veraHeader}>
            <Text style={styles.veraIcon}>🔮</Text>
            <Text style={styles.veraTitle}>Vera Perceives</Text>
            {veraLoading && (
              <ActivityIndicator size="small" color={COSMIC.etherealCyan} style={styles.veraLoader} />
            )}
          </View>

          {veraInsight && !veraLoading && (
            <>
              <Text style={styles.veraInsight}>{veraInsight.insight}</Text>

              {veraInsight.themes && veraInsight.themes.length > 0 && (
                <View style={styles.veraThemes}>
                  {veraInsight.themes.slice(0, 4).map((theme, i) => (
                    <View key={i} style={styles.veraThemePill}>
                      <Text style={styles.veraThemeText}>{theme}</Text>
                    </View>
                  ))}
                </View>
              )}

              {veraInsight.suggestion && (
                <Text style={styles.veraSuggestion}>
                  ✦ {veraInsight.suggestion}
                </Text>
              )}

              {veraInsight.intensity > 0.7 && (
                <Text style={styles.veraIntensity}>
                  ⚡ High emotional resonance detected
                </Text>
              )}
            </>
          )}
        </Animated.View>
      )}

      {/* Mood After */}
      <SectionHeader icon="🌙" title="How do you feel now?" subtitle="(Optional)" />
      <VictorianCard style={styles.moodCard} showCorners={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.moodOptions}>
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodOption,
                  moodAfter === mood.id && styles.moodOptionSelected,
                ]}
                onPress={() => setMoodAfter(mood.id)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  moodAfter === mood.id && styles.moodLabelSelected,
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </VictorianCard>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveMainButton} onPress={handleSave}>
        <Text style={styles.saveMainButtonText}>✨ Save Entry</Text>
      </TouchableOpacity>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButton: {
    fontSize: 16,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 2,
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },

  // Cozy writing companions banner
  cozyBanner: {
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(225, 190, 231, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  cozyText: {
    fontSize: 13,
    color: COSMIC.moonGlow,
    opacity: 0.85,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  moodCard: {
    padding: 12,
    marginBottom: 16,
  },
  moodOptions: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  moodOption: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    minWidth: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  moodOptionSelected: {
    borderColor: COSMIC.candleFlame,
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  moodLabelSelected: {
    color: COSMIC.candleFlame,
    opacity: 1,
    fontWeight: '600',
  },

  // Music row styling (WitchTok aesthetic)
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  musicLabel: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    opacity: 0.9,
  },

  promptActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  promptButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
  },
  promptButtonGhost: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  promptButtonText: {
    color: COSMIC.moonGlow,
    fontSize: 14,
    fontWeight: '600',
  },
  promptButtonTextGhost: {
    color: COSMIC.etherealCyan,
    fontSize: 14,
    fontWeight: '600',
  },

  promptsCard: {
    padding: 20,
    marginBottom: 16,
  },
  promptsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 16,
  },
  promptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.2)',
  },
  promptBullet: {
    fontSize: 14,
    color: COSMIC.candleFlame,
    marginRight: 10,
    marginTop: 2,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 20,
    opacity: 0.9,
  },
  noPromptsText: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
    opacity: 0.7,
  },
  hidePromptsButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  hidePromptsText: {
    fontSize: 14,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },

  editorCard: {
    marginBottom: 20,
    minHeight: 300,
    padding: 20,
  },
  editor: {
    fontSize: 16,
    color: COSMIC.moonGlow,
    lineHeight: 26,
    minHeight: 250,
    padding: 0,
  },
  editorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.2)',
  },
  editorFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordCount: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.7,
  },
  bonusText: {
    fontSize: 12,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },

  // Vera Insight Styles
  veraCard: {
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    } : {}),
  },
  veraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  veraIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  veraTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COSMIC.etherealCyan,
  },
  veraLoader: {
    marginLeft: 10,
  },
  veraInsight: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  veraThemes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  veraThemePill: {
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.25)',
  },
  veraThemeText: {
    fontSize: 11,
    color: COSMIC.etherealCyan,
    textTransform: 'lowercase',
  },
  veraSuggestion: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    opacity: 0.9,
  },
  veraIntensity: {
    fontSize: 11,
    color: COSMIC.candleFlame,
    marginTop: 8,
    fontWeight: '600',
  },

  saveMainButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveMainButtonText: {
    color: '#1a1f3a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
