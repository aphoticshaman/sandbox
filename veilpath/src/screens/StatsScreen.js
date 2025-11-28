/**
 * STATS DASHBOARD SCREEN
 * Shows user progress, insights, and patterns
 * Ethical engagement - celebrates progress without punishment
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NeonText, LPMUDText, GlitchText } from '../components/TemporaryTextComponents';
import { NEON_COLORS } from '../components/TemporaryTextComponents';
import {
  getStatsSummary,
  getUserTier,
  getStreakData,
  getInsights,
} from '../services/engagementTracker';

export default function StatsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const summary = await getStatsSummary();
      setStats(summary);
    } catch (error) {
      console.error('[StatsScreen] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={NEON_COLORS.hiCyan} />
        <NeonText color={NEON_COLORS.dimCyan} style={styles.loadingText}>
          Loading insights...
        </NeonText>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <NeonText color={NEON_COLORS.hiRed} style={styles.errorText}>
          Error loading stats
        </NeonText>
      </View>
    );
  }

  const tierColor = NEON_COLORS[stats.tierColor] || NEON_COLORS.hiCyan;
  const progressToNext = stats.nextTier
    ? Math.round((stats.totalReadings / stats.nextTier.minReadings) * 100)
    : 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <NeonText color={NEON_COLORS.hiCyan} style={styles.backText}>
            ← BACK
          </NeonText>
        </TouchableOpacity>

        <GlitchText
          color={NEON_COLORS.hiCyan}
          style={styles.title}
          glitchChance={0.05}
        >
          YOUR JOURNEY
        </GlitchText>
      </View>

      {/* Tier Card */}
      <View style={[styles.card, { borderColor: tierColor }]}>
        <LPMUDText style={styles.cardTitle}>
          {`$${stats.tierColor.toUpperCase()}$TIER: ${stats.tier.toUpperCase()}$NOR$`}
        </LPMUDText>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.statLabel}>
              READINGS
            </NeonText>
            <NeonText color={tierColor} style={styles.statValue}>
              {stats.totalReadings}
            </NeonText>
          </View>

          {stats.nextTier && (
            <View style={styles.statItem}>
              <NeonText color={NEON_COLORS.dimCyan} style={styles.statLabel}>
                TO {stats.nextTier.tier.toUpperCase()}
              </NeonText>
              <NeonText color={NEON_COLORS.hiMagenta} style={styles.statValue}>
                {stats.nextTier.readingsNeeded}
              </NeonText>
            </View>
          )}

          {!stats.nextTier && (
            <View style={styles.statItem}>
              <NeonText color={NEON_COLORS.hiGreen} style={styles.maxTierLabel}>
                ✦ MAX TIER ✦
              </NeonText>
            </View>
          )}
        </View>

        {/* Progress bar to next tier */}
        {stats.nextTier && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressToNext}%`,
                    backgroundColor: tierColor,
                  },
                ]}
              />
            </View>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.progressText}>
              {progressToNext}%
            </NeonText>
          </View>
        )}
      </View>

      {/* Streak Card */}
      <View style={styles.card}>
        <LPMUDText style={styles.cardTitle}>
          $HIC$READING STREAK$NOR$
        </LPMUDText>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.statLabel}>
              CURRENT
            </NeonText>
            <NeonText color={NEON_COLORS.hiCyan} style={styles.statValue}>
              {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
            </NeonText>
          </View>

          <View style={styles.statItem}>
            <NeonText color={NEON_COLORS.dimCyan} style={styles.statLabel}>
              LONGEST
            </NeonText>
            <NeonText color={NEON_COLORS.hiMagenta} style={styles.statValue}>
              {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
            </NeonText>
          </View>
        </View>

        <NeonText color={NEON_COLORS.dimYellow} style={styles.encouragementText}>
          No pressure - read when it feels right
        </NeonText>
      </View>

      {/* Insights Card */}
      {stats.insights && stats.insights.length > 0 && (
        <View style={styles.card}>
          <LPMUDText style={styles.cardTitle}>
            $HIM$INSIGHTS$NOR$
          </LPMUDText>

          {stats.insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <NeonText color={NEON_COLORS.dimCyan} style={styles.insightBullet}>
                ▸
              </NeonText>
              <NeonText color={NEON_COLORS.hiCyan} style={styles.insightText}>
                {insight.message}
              </NeonText>
            </View>
          ))}
        </View>
      )}

      {/* Recent Readings */}
      {stats.recentReadings && stats.recentReadings.length > 0 && (
        <View style={styles.card}>
          <LPMUDText style={styles.cardTitle}>
            $HIY$RECENT READINGS$NOR$
          </LPMUDText>

          {stats.recentReadings.map((reading, index) => (
            <TouchableOpacity
              key={reading.id}
              style={styles.readingItem}
              onPress={() => {
                // Navigate to reading detail (to be implemented)
              }}
            >
              <View style={styles.readingHeader}>
                <NeonText color={NEON_COLORS.hiCyan} style={styles.readingDate}>
                  {new Date(reading.timestamp).toLocaleDateString()}
                </NeonText>
                <NeonText color={NEON_COLORS.dimMagenta} style={styles.readingSpread}>
                  {reading.spreadType}
                </NeonText>
              </View>

              {reading.intention && (
                <NeonText color={NEON_COLORS.dimCyan} style={styles.readingIntention}>
                  "{reading.intention.substring(0, 50)}..."
                </NeonText>
              )}

              <View style={styles.readingCards}>
                {(reading.cards || []).slice(0, 3).map((card, i) => {
                  const cardName = card.name || 'Unknown Card';
                  const shortName = cardName.includes(' of ')
                    ? cardName.split(' of ')[0]
                    : cardName;

                  return (
                    <NeonText
                      key={i}
                      color={card.reversed ? NEON_COLORS.hiRed : NEON_COLORS.dimGreen}
                      style={styles.readingCardName}
                    >
                      {shortName}
                      {card.reversed ? ' ⌽' : ''}
                    </NeonText>
                  );
                })}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('ReadingHistory')}
          >
            <NeonText color={NEON_COLORS.hiMagenta} style={styles.viewAllText}>
              [ VIEW ALL READINGS ]
            </NeonText>
          </TouchableOpacity>
        </View>
      )}

      {/* First reading encouragement */}
      {stats.totalReadings === 0 && (
        <View style={styles.card}>
          <NeonText color={NEON_COLORS.hiCyan} style={styles.firstReadingText}>
            Begin your journey with your first reading
          </NeonText>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Welcome')}
          >
            <LPMUDText style={styles.startButtonText}>
              $HIC$START READING$NOR$
            </LPMUDText>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 10,
    zIndex: 10,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'monospace',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  maxTierLabel: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginTop: 10,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'right',
    marginTop: 5,
  },
  encouragementText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingRight: 10,
  },
  insightBullet: {
    fontSize: 16,
    fontFamily: 'monospace',
    marginRight: 10,
    marginTop: 2,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
    flex: 1,
  },
  readingItem: {
    borderBottomWidth: 1,
    borderBottomColor: NEON_COLORS.dimCyan,
    paddingVertical: 12,
    marginBottom: 8,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  readingDate: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  readingSpread: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  readingIntention: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  readingCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  readingCardName: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  viewAllButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  firstReadingText: {
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 20,
  },
  startButton: {
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
