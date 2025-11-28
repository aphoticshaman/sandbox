/**
 * Statistics Dashboard Screen - VeilPath WitchTok x Victorian Gothic
 * Comprehensive analytics and insights with cosmic design
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useUserStore } from '../stores/userStore';
import { useReadingStore } from '../stores/readingStore';
import { useJournalStore } from '../stores/journalStore';

// Import VeilPath Design System
import {
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  SectionHeader,
  CosmicDivider,
} from '../components/VeilPathDesign';

export default function StatisticsScreen({ navigation }) {
  const user = useUserStore();
  const readings = useReadingStore();
  const journal = useJournalStore();

  const stats = useMemo(() => {
    const createdAt = user.profile.createdAt ? new Date(user.profile.createdAt) : new Date();
    const now = new Date();
    const daysActive = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)) + 1;

    const avgReadingsPerDay = daysActive > 0 ? (user.stats.totalReadings / daysActive).toFixed(1) : 0;
    const avgJournalPerWeek = daysActive > 0 ? ((user.stats.totalJournalEntries / daysActive) * 7).toFixed(1) : 0;

    const xpProgress = user.progression.xpToNextLevel > 0
      ? Math.round((user.progression.xp / user.progression.xpToNextLevel) * 100)
      : 100;

    const cardFrequency = Object.entries(readings.stats.mostDrawnCards || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const moodData = Object.entries(journal.stats.entriesByMood || {})
      .sort((a, b) => b[1] - a[1]);
    const mostCommonMood = moodData[0]?.[0] || 'N/A';

    const totalAchievements = 30;
    const achievementProgress = Math.round((user.achievements.unlocked.length / totalAchievements) * 100);

    return {
      daysActive,
      avgReadingsPerDay,
      avgJournalPerWeek,
      xpProgress,
      cardFrequency,
      mostCommonMood,
      moodData,
      achievementProgress,
    };
  }, [user, readings, journal]);

  const renderProgressBar = (progress) => (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${progress}%` }]} />
    </View>
  );

  return (
    <VeilPathScreen intensity="light" scrollable={true}>
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <SectionHeader icon="📊" title="Statistics & Insights" subtitle="Your journey at a glance" />

      {/* Overview Stats Grid */}
      <View style={styles.statsGrid}>
        <VictorianCard style={styles.statCard} showCorners={false}>
          <Text style={styles.statEmoji}>🎴</Text>
          <Text style={styles.statValue}>{user.stats.totalReadings}</Text>
          <Text style={styles.statLabel}>Readings</Text>
        </VictorianCard>
        <VictorianCard style={styles.statCard} showCorners={false}>
          <Text style={styles.statEmoji}>📖</Text>
          <Text style={styles.statValue}>{user.stats.totalJournalEntries}</Text>
          <Text style={styles.statLabel}>Journal Entries</Text>
        </VictorianCard>
        <VictorianCard style={styles.statCard} showCorners={false}>
          <Text style={styles.statEmoji}>🧘</Text>
          <Text style={styles.statValue}>{Math.round(user.stats.totalMindfulnessMinutes)}</Text>
          <Text style={styles.statLabel}>Mindfulness Min</Text>
        </VictorianCard>
        <VictorianCard style={styles.statCard} showCorners={false}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statValue}>{user.stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </VictorianCard>
      </View>

      {/* Activity Summary */}
      <SectionHeader icon="✨" title="Activity Summary" />
      <VictorianCard style={styles.contentCard} glowColor={COSMIC.deepAmethyst}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Days Active</Text>
            <Text style={styles.summaryValue}>{stats.daysActive}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Longest Streak</Text>
            <Text style={styles.summaryValue}>{user.stats.longestStreak}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg Readings/Day</Text>
            <Text style={styles.summaryValue}>{stats.avgReadingsPerDay}</Text>
          </View>
        </View>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>CBT Work</Text>
            <Text style={styles.summaryValue}>{user.stats.cbtDistortionsIdentified}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>DBT Skills</Text>
            <Text style={styles.summaryValue}>{user.stats.dbtSkillsPracticed}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Journal/Week</Text>
            <Text style={styles.summaryValue}>{stats.avgJournalPerWeek}</Text>
          </View>
        </View>
      </VictorianCard>

      <CosmicDivider />

      {/* Reading Insights */}
      <SectionHeader icon="🎴" title="Reading Insights" />
      <VictorianCard style={styles.contentCard} showCorners={false}>
        <Text style={styles.subsectionTitle}>Reading Types</Text>
        <View style={styles.readingTypeRow}>
          <Text style={styles.readingTypeLabel}>Single Card</Text>
          {renderProgressBar((readings.stats.readingsByType.single / (user.stats.totalReadings || 1)) * 100)}
          <Text style={styles.readingTypeValue}>{readings.stats.readingsByType.single || 0}</Text>
        </View>
        <View style={styles.readingTypeRow}>
          <Text style={styles.readingTypeLabel}>Three-Card</Text>
          {renderProgressBar((readings.stats.readingsByType['three-card'] / (user.stats.totalReadings || 1)) * 100)}
          <Text style={styles.readingTypeValue}>{readings.stats.readingsByType['three-card'] || 0}</Text>
        </View>
        <View style={styles.readingTypeRow}>
          <Text style={styles.readingTypeLabel}>Celtic Cross</Text>
          {renderProgressBar((readings.stats.readingsByType['celtic-cross'] / (user.stats.totalReadings || 1)) * 100)}
          <Text style={styles.readingTypeValue}>{readings.stats.readingsByType['celtic-cross'] || 0}</Text>
        </View>
      </VictorianCard>

      {/* Journal Analytics */}
      <SectionHeader icon="📖" title="Journal Analytics" />
      <VictorianCard style={styles.contentCard} showCorners={false}>
        <View style={styles.journalStatsRow}>
          <View style={styles.journalStatItem}>
            <Text style={styles.journalStatValue}>{journal.stats.totalWords.toLocaleString()}</Text>
            <Text style={styles.journalStatLabel}>Total Words</Text>
          </View>
          <View style={styles.journalStatItem}>
            <Text style={styles.journalStatValue}>{Math.round(journal.stats.averageWordsPerEntry)}</Text>
            <Text style={styles.journalStatLabel}>Avg/Entry</Text>
          </View>
          <View style={styles.journalStatItem}>
            <Text style={styles.journalStatValue}>{journal.stats.longestEntry}</Text>
            <Text style={styles.journalStatLabel}>Longest</Text>
          </View>
        </View>

        {stats.moodData.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Mood Patterns</Text>
            <VictorianCard style={styles.moodInsight} showCorners={false}>
              <Text style={styles.moodInsightText}>
                Most common mood: <Text style={styles.moodInsightBold}>{stats.mostCommonMood}</Text>
              </Text>
            </VictorianCard>
          </>
        )}
      </VictorianCard>

      <CosmicDivider />

      {/* Progression */}
      <SectionHeader icon="⭐" title="Progression" />
      <VictorianCard style={styles.levelCard} glowColor={COSMIC.candleFlame}>
        <View style={styles.levelContainer}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{user.progression.level}</Text>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{user.progression.currentTitle}</Text>
            <View style={styles.xpBarContainer}>
              {renderProgressBar(stats.xpProgress)}
              <Text style={styles.xpText}>
                {user.progression.xp} / {user.progression.xpToNextLevel} XP ({stats.xpProgress}%)
              </Text>
            </View>
          </View>
        </View>
      </VictorianCard>

      {/* Achievements Progress */}
      <VictorianCard style={styles.progressCard} showCorners={false}>
        <Text style={styles.progressLabel}>🏆 Achievements</Text>
        {renderProgressBar(stats.achievementProgress)}
        <Text style={styles.progressText}>
          {user.achievements.unlocked.length}/30 ({stats.achievementProgress}%)
        </Text>
      </VictorianCard>

      <CosmicDivider />

      {/* Milestones */}
      <SectionHeader icon="🏆" title="Milestones Reached" />
      <VictorianCard style={styles.milestonesCard} showCorners={false}>
        {user.stats.currentStreak >= 7 && (
          <Text style={styles.milestoneItem}>✓ 7-day streak achieved</Text>
        )}
        {user.stats.totalReadings >= 10 && (
          <Text style={styles.milestoneItem}>✓ 10 readings completed</Text>
        )}
        {user.stats.totalJournalEntries >= 5 && (
          <Text style={styles.milestoneItem}>✓ 5 journal entries written</Text>
        )}
        {user.stats.totalMindfulnessMinutes >= 60 && (
          <Text style={styles.milestoneItem}>✓ 1 hour of mindfulness practice</Text>
        )}
        {user.progression.level >= 5 && (
          <Text style={styles.milestoneItem}>✓ Reached level 5 (Apprentice)</Text>
        )}
        {user.achievements.unlocked.length >= 5 && (
          <Text style={styles.milestoneItem}>✓ 5 achievements unlocked</Text>
        )}
      </VictorianCard>
    </VeilPathScreen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 16,
    color: COSMIC.etherealCyan,
    fontWeight: '600',
    marginBottom: 16,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },

  contentCard: {
    padding: 20,
    marginBottom: 16,
  },

  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.candleFlame,
  },

  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginTop: 12,
    marginBottom: 12,
  },

  readingTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  readingTypeLabel: {
    fontSize: 13,
    color: COSMIC.crystalPink,
    width: 90,
  },
  readingTypeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    width: 30,
    textAlign: 'right',
  },

  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COSMIC.candleFlame,
    borderRadius: 3,
  },

  journalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 11, 0.2)',
  },
  journalStatItem: {
    alignItems: 'center',
  },
  journalStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.candleFlame,
    marginBottom: 4,
  },
  journalStatLabel: {
    fontSize: 10,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },

  moodInsight: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  moodInsightText: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    textAlign: 'center',
  },
  moodInsightBold: {
    fontWeight: '700',
    color: COSMIC.candleFlame,
    textTransform: 'capitalize',
  },

  levelCard: {
    padding: 20,
    marginBottom: 16,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COSMIC.candleFlame,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1f3a',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COSMIC.moonGlow,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
  },
  xpBarContainer: {
    gap: 6,
  },
  xpText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    opacity: 0.8,
  },

  progressCard: {
    padding: 16,
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.moonGlow,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 11,
    color: COSMIC.crystalPink,
    marginTop: 6,
    opacity: 0.8,
  },

  milestonesCard: {
    padding: 20,
    marginBottom: 40,
  },
  milestoneItem: {
    fontSize: 14,
    color: COSMIC.moonGlow,
    lineHeight: 28,
    opacity: 0.9,
  },
});
