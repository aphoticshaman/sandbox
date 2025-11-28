/**
 * Quests Screen - VeilPath Daily & Weekly Challenges
 * Complete challenges to earn XP, crystals, and rare cosmetics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useUserStore } from '../stores/userStore';

import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

// Quest definitions
const DAILY_QUESTS = [
  { id: 'daily_reading', name: 'Draw a Card', description: 'Complete any tarot reading', xp: 50, emoji: '🎴' },
  { id: 'daily_journal', name: 'Write Your Truth', description: 'Write a journal entry (50+ words)', xp: 75, emoji: '📝' },
  { id: 'daily_mindfulness', name: 'Inner Peace', description: 'Complete a mindfulness exercise', xp: 50, emoji: '🧘' },
];

const WEEKLY_QUESTS = [
  { id: 'weekly_streak', name: 'Consistent Seeker', description: 'Use VeilPath 5 days this week', xp: 300, crystals: 100, emoji: '🔥' },
  { id: 'weekly_reflection', name: 'Deep Reflection', description: 'Write 3 journal entries (150+ words each)', xp: 500, crystals: 150, emoji: '✨' },
  { id: 'weekly_spread', name: 'Spread Master', description: 'Complete a Celtic Cross reading', xp: 400, crystals: 100, emoji: '🌟' },
];

export default function QuestsScreen({ navigation }) {
  const user = useUserStore();
  const [dailyProgress, setDailyProgress] = useState({});
  const [weeklyProgress, setWeeklyProgress] = useState({});

  // Calculate quest progress from user stats
  useEffect(() => {
    // This would normally fetch from a quest tracking system
    setDailyProgress({
      daily_reading: { completed: user.stats.totalReadings > 0, current: Math.min(user.stats.totalReadings, 1), target: 1 },
      daily_journal: { completed: user.stats.totalJournalEntries > 0, current: Math.min(user.stats.totalJournalEntries, 1), target: 1 },
      daily_mindfulness: { completed: (user.stats.totalMindfulnessPractices || 0) > 0, current: Math.min(user.stats.totalMindfulnessPractices || 0, 1), target: 1 },
    });
    setWeeklyProgress({
      weekly_streak: { completed: user.stats.currentStreak >= 5, current: Math.min(user.stats.currentStreak, 5), target: 5 },
      weekly_reflection: { completed: false, current: 0, target: 3 },
      weekly_spread: { completed: false, current: 0, target: 1 },
    });
  }, [user.stats]);

  const getResetTime = (type) => {
    const now = new Date();
    if (type === 'daily') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const hours = Math.floor((tomorrow - now) / (1000 * 60 * 60));
      return `${hours}h`;
    } else {
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      return `${daysUntilMonday}d`;
    }
  };

  const renderQuest = (quest, progress, type) => {
    const questProgress = progress[quest.id] || { completed: false, current: 0, target: 1 };
    const progressPercent = (questProgress.current / questProgress.target) * 100;

    return (
      <VictorianCard
        key={quest.id}
        style={[styles.questCard, questProgress.completed && styles.questCardCompleted]}
        showCorners={false}
      >
        <View style={styles.questHeader}>
          <Text style={styles.questEmoji}>{quest.emoji}</Text>
          <View style={styles.questInfo}>
            <Text style={[styles.questName, questProgress.completed && styles.questNameCompleted]}>
              {quest.name}
            </Text>
            <Text style={styles.questDescription}>{quest.description}</Text>
          </View>
          {questProgress.completed && (
            <Text style={styles.completedBadge}>✓</Text>
          )}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {questProgress.current}/{questProgress.target}
          </Text>
        </View>

        <View style={styles.rewardRow}>
          <View style={styles.reward}>
            <Text style={styles.rewardIcon}>⚡</Text>
            <Text style={styles.rewardValue}>{quest.xp} XP</Text>
          </View>
          {quest.crystals && (
            <View style={styles.reward}>
              <Text style={styles.rewardIcon}>💎</Text>
              <Text style={styles.rewardValue}>{quest.crystals}</Text>
            </View>
          )}
        </View>
      </VictorianCard>
    );
  };

  return (
    <VeilPathScreen intensity="medium" scrollable={true}>
      <SectionHeader
        icon="📜"
        title="Quests"
        subtitle="Daily & Weekly Challenges"
      />

      {/* Daily Quests */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daily Quests</Text>
        <View style={styles.resetBadge}>
          <Text style={styles.resetText}>Resets in {getResetTime('daily')}</Text>
        </View>
      </View>
      {DAILY_QUESTS.map((quest) => renderQuest(quest, dailyProgress, 'daily'))}

      <CosmicDivider />

      {/* Weekly Quests */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Weekly Quests</Text>
        <View style={styles.resetBadge}>
          <Text style={styles.resetText}>Resets in {getResetTime('weekly')}</Text>
        </View>
      </View>
      {WEEKLY_QUESTS.map((quest) => renderQuest(quest, weeklyProgress, 'weekly'))}

      {/* Quest Info */}
      <VictorianCard style={styles.infoCard}>
        <Text style={styles.infoTitle}>About Quests</Text>
        <Text style={styles.infoText}>
          Complete daily and weekly challenges to earn XP and Crystals.
          Crystals can be spent in the Shop on rare cosmetics.
        </Text>
      </VictorianCard>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resetBadge: {
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resetText: {
    fontSize: 11,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
  },
  questCard: {
    padding: 16,
    marginBottom: 12,
  },
  questCardCompleted: {
    backgroundColor: 'rgba(0, 255, 100, 0.1)',
    borderColor: 'rgba(0, 255, 100, 0.3)',
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  questInfo: {
    flex: 1,
  },
  questName: {
    fontSize: 15,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 4,
  },
  questNameCompleted: {
    color: COSMIC.etherealCyan,
  },
  questDescription: {
    fontSize: 12,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },
  completedBadge: {
    fontSize: 20,
    color: '#00FF64',
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COSMIC.etherealCyan,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardIcon: {
    fontSize: 14,
  },
  rewardValue: {
    fontSize: 13,
    color: COSMIC.candleFlame,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    marginBottom: 40,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    lineHeight: 20,
    opacity: 0.8,
  },
});
