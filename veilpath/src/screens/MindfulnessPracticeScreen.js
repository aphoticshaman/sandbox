/**
 * Mindfulness Practice Screen - VeilPath WitchTok x Victorian Gothic
 * Guided practice with timer, instructions, and journal integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useUserStore } from '../stores/userStore';
import { AudioPlayerButton } from '../components';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
  FeaturePill,
} from '../components/VeilPathDesign';

const PRACTICE_PHASES = {
  PRE: 'pre',
  DURING: 'during',
  POST: 'post',
};

// Cross-platform alert
const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  if (Platform.OS === 'web') {
    const confirmed = buttons.length > 1
      ? window.confirm(`${title}\n\n${message}`)
      : (window.alert(`${title}\n\n${message}`), true);
    if (confirmed && buttons.length > 0) {
      const okButton = buttons.find(b => b.text !== 'Not Now' && b.style !== 'cancel');
      if (okButton?.onPress) okButton.onPress();
    } else if (!confirmed && buttons.length > 1) {
      const cancelButton = buttons.find(b => b.text === 'Not Now' || b.style === 'cancel');
      if (cancelButton?.onPress) cancelButton.onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function MindfulnessPracticeScreen({ navigation, route }) {
  const { exercise } = route.params;
  const userStore = useUserStore();

  const [phase, setPhase] = useState(PRACTICE_PHASES.PRE);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(exercise.duration_minutes * 60);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isTimerActive && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            setPhase(PRACTICE_PHASES.POST);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, remainingSeconds]);

  const handleStartPractice = () => {
    setPhase(PRACTICE_PHASES.DURING);
    setIsTimerActive(true);
  };

  const handlePauseTimer = () => setIsTimerActive(false);
  const handleResumeTimer = () => setIsTimerActive(true);

  const handleStopPractice = () => {
    showAlert(
      'End Practice?',
      'Are you sure you want to stop this practice early?',
      [
        { text: 'Continue', style: 'cancel' },
        { text: 'End', style: 'destructive', onPress: () => {
          setIsTimerActive(false);
          setPhase(PRACTICE_PHASES.POST);
        }},
      ]
    );
  };

  const handleCompletePractice = () => {
    userStore.awardXP(exercise.xp_reward);
    userStore.incrementStat('totalMindfulnessPractices', 1);

    showAlert(
      '✨ Practice Complete',
      `+${exercise.xp_reward} XP earned!\n\nWould you like to journal about this experience?`,
      [
        { text: 'Not Now', onPress: () => navigation.goBack() },
        {
          text: 'Journal',
          onPress: () => {
            navigation.navigate('JournalTab', {
              screen: 'JournalEditor',
              params: { mode: 'new', promptSuggestions: [exercise.journal_prompt] },
            });
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalSeconds = exercise.duration_minutes * 60;
    return ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  };

  const renderPrePractice = () => (
    <>
      <VictorianCard style={styles.heroCard} glowColor={COSMIC.candleFlame}>
        <Text style={styles.exerciseTitle}>{exercise.name}</Text>
        <Text style={styles.category}>{exercise.category}</Text>
        <Text style={styles.description}>{exercise.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaEmoji}>⏱️</Text>
            <Text style={styles.metaValue}>{exercise.duration_minutes}m</Text>
            <Text style={styles.metaLabel}>Duration</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaEmoji}>📊</Text>
            <Text style={styles.metaValue}>{exercise.difficulty}</Text>
            <Text style={styles.metaLabel}>Difficulty</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaEmoji}>✨</Text>
            <Text style={styles.metaValue}>+{exercise.xp_reward}</Text>
            <Text style={styles.metaLabel}>XP Reward</Text>
          </View>
        </View>
      </VictorianCard>

      <SectionHeader icon="💡" title="Why This Works" />
      <VictorianCard style={styles.contentCard} showCorners={false}>
        <Text style={styles.bodyText}>{exercise.why_it_works}</Text>
      </VictorianCard>

      <SectionHeader icon="🌟" title="When to Use" />
      <VictorianCard style={styles.contentCard} showCorners={false}>
        {exercise.when_to_use.map((use, index) => (
          <View key={index} style={styles.listRow}>
            <Text style={styles.listBullet}>✧</Text>
            <Text style={styles.listItem}>{use}</Text>
          </View>
        ))}
      </VictorianCard>

      <SectionHeader icon="📋" title="Instructions" />
      <VictorianCard style={styles.contentCard} showCorners={false}>
        {exercise.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ))}
      </VictorianCard>

      <VictorianCard style={styles.promptCard} glowColor={COSMIC.deepAmethyst}>
        <Text style={styles.promptEmoji}>🌙</Text>
        <Text style={styles.promptText}>
          {exercise.app_prompts?.pre_practice || 'Find a comfortable position and prepare to begin.'}
        </Text>
      </VictorianCard>

      <CosmicDivider />

      <TouchableOpacity style={styles.primaryButton} onPress={handleStartPractice}>
        <Text style={styles.primaryButtonText}>🧘 Begin Practice</Text>
      </TouchableOpacity>
    </>
  );

  const renderDuringPractice = () => (
    <>
      <VictorianCard style={styles.timerCard} glowColor={COSMIC.etherealCyan}>
        <Text style={styles.timerLabel}>{exercise.name}</Text>

        <View style={styles.timerCircle}>
          <View style={[styles.timerProgress, { height: `${getProgressPercentage()}%` }]} />
          <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
        </View>

        <View style={styles.timerButtons}>
          {isTimerActive ? (
            <TouchableOpacity style={styles.timerButton} onPress={handlePauseTimer}>
              <Text style={styles.timerButtonText}>⏸ Pause</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={handleResumeTimer}>
              <Text style={styles.primaryButtonText}>▶️ Resume</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.ghostButton} onPress={handleStopPractice}>
            <Text style={styles.ghostButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </VictorianCard>

      <VictorianCard style={styles.promptCard} showCorners={false}>
        <Text style={styles.promptEmoji}>✨</Text>
        <Text style={styles.promptText}>
          {exercise.app_prompts?.during || 'Follow the instructions and stay present.'}
        </Text>
      </VictorianCard>

      <SectionHeader icon="📋" title="Instructions Reference" />
      <VictorianCard style={styles.contentCard} showCorners={false}>
        {exercise.instructions.map((instruction, index) => (
          <View key={index} style={styles.listRow}>
            <Text style={styles.listBullet}>{index + 1}.</Text>
            <Text style={styles.listItem}>{instruction}</Text>
          </View>
        ))}
      </VictorianCard>
    </>
  );

  const renderPostPractice = () => (
    <>
      <VictorianCard style={styles.completionCard} glowColor={COSMIC.candleFlame}>
        <Text style={styles.completionEmoji}>🌟</Text>
        <Text style={styles.completionTitle}>Practice Complete</Text>
        <Text style={styles.completionSubtitle}>
          You practiced for {exercise.duration_minutes} minutes
        </Text>
      </VictorianCard>

      <VictorianCard style={styles.promptCard} showCorners={false}>
        <Text style={styles.promptEmoji}>💭</Text>
        <Text style={styles.promptText}>
          {exercise.app_prompts?.post_practice || 'How do you feel after this practice?'}
        </Text>
      </VictorianCard>

      <SectionHeader icon="📝" title="Reflection Prompt" />
      <VictorianCard style={styles.contentCard} showCorners={false}>
        <Text style={styles.bodyText}>{exercise.journal_prompt}</Text>
      </VictorianCard>

      <VictorianCard style={styles.xpCard} glowColor={COSMIC.etherealCyan}>
        <Text style={styles.xpLabel}>XP Earned</Text>
        <Text style={styles.xpValue}>+{exercise.xp_reward}</Text>
      </VictorianCard>

      <CosmicDivider />

      <TouchableOpacity style={styles.primaryButton} onPress={handleCompletePractice}>
        <Text style={styles.primaryButtonText}>✨ Complete & Earn XP</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <TouchableOpacity
        onPress={() => {
          if (phase === PRACTICE_PHASES.DURING && isTimerActive) {
            showAlert(
              'Leave Practice?',
              'Your timer is still running. Are you sure?',
              [
                { text: 'Stay', style: 'cancel' },
                { text: 'Leave', onPress: () => navigation.goBack() },
              ]
            );
          } else {
            navigation.goBack();
          }
        }}
      >
        <Text style={styles.backLink}>← Back to Practices</Text>
      </TouchableOpacity>

      {phase === PRACTICE_PHASES.PRE && renderPrePractice()}
      {phase === PRACTICE_PHASES.DURING && renderDuringPractice()}
      {phase === PRACTICE_PHASES.POST && renderPostPractice()}
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    marginBottom: 20,
  },

  heroCard: {
    padding: 24,
    marginBottom: 20,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 1,
    color: COSMIC.moonGlow,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  category: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
    opacity: 0.7,
  },
  description: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    lineHeight: 24,
    marginBottom: 20,
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 11, 0.3)',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },

  contentCard: {
    padding: 16,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    opacity: 0.9,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listBullet: {
    fontSize: 14,
    color: COSMIC.candleFlame,
    marginRight: 10,
    marginTop: 2,
    width: 16,
  },
  listItem: {
    flex: 1,
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    opacity: 0.9,
  },

  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COSMIC.candleFlame,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1f3a',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 22,
    opacity: 0.9,
  },

  promptCard: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  promptEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 15,
    color: COSMIC.moonGlow,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    opacity: 0.9,
  },

  timerCard: {
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  timerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COSMIC.etherealCyan,
  },
  timerProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COSMIC.etherealCyan,
    opacity: 0.2,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '300',
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  timerButton: {
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
  },
  timerButtonText: {
    color: COSMIC.moonGlow,
    fontSize: 14,
    fontWeight: '600',
  },

  completionCard: {
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  completionEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  completionSubtitle: {
    fontSize: 14,
    color: COSMIC.crystalPink,
    opacity: 0.9,
  },

  xpCard: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 11,
    color: COSMIC.etherealCyan,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  xpValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },

  primaryButton: {
    backgroundColor: COSMIC.candleFlame,
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: COSMIC.candleFlame,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  primaryButtonText: {
    color: '#1a1f3a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  ghostButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  ghostButtonText: {
    color: COSMIC.crystalPink,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
});
