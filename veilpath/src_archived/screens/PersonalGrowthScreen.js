/**
 * PERSONAL GROWTH CENTER SCREEN
 *
 * Track progress, achievements, stats, and personal development
 * - Reading statistics
 * - Skill levels (Shadow Work, Pattern Recognition, etc.)
 * - Achievements and badges
 * - Progress tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NeonText from '../components/NeonText';
import { NEON_COLORS } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const READINGS_KEY = '@lunatiq_readings';

export default function PersonalGrowthScreen({ navigation, route }) {
  const { userProfile } = route.params || {};

  const [stats, setStats] = useState({
    totalReadings: 0,
    totalCards: 0,
    journalEntries: 0,
    oracleChats: 0,
    careerSessions: 0,
    skillLevels: {
      shadowWork: 1,
      patternRecognition: 1,
      intuition: 1,
      synthesis: 1,
      oracleCommunion: 1
    }
  });

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Load reading history
      const readingsData = await AsyncStorage.getItem(READINGS_KEY);
      const readings = readingsData ? JSON.parse(readingsData) : [];

      // Load journal entries
      const journalData = await AsyncStorage.getItem('@lunatiq_journal_entries');
      const journal = journalData ? JSON.parse(journalData) : [];

      // Load Oracle chat history
      const oracleData = await AsyncStorage.getItem('@lunatiq_oracle_history');
      const oracle = oracleData ? JSON.parse(oracleData) : [];

      // Load career counselor history
      const careerData = await AsyncStorage.getItem('@lunatiq_career_history');
      const career = careerData ? JSON.parse(careerData) : [];

      // Calculate stats
      const totalCards = readings.reduce((sum, r) => sum + (r.cards?.length || 0), 0);

      // Calculate skill levels (simplified for now - can be enhanced later)
      const skillLevels = {
        shadowWork: Math.min(10, Math.floor(oracle.length / 5) + 1),
        patternRecognition: Math.min(10, Math.floor(readings.length / 10) + 1),
        intuition: Math.min(10, Math.floor(readings.length / 5) + 1),
        synthesis: Math.min(10, Math.floor(readings.length / 8) + 1),
        oracleCommunion: Math.min(10, Math.floor(oracle.length / 3) + 1)
      };

      setStats({
        totalReadings: readings.length,
        totalCards,
        journalEntries: journal.length,
        oracleChats: oracle.length,
        careerSessions: career.length,
        skillLevels
      });
    } catch (error) {
      console.error('[PersonalGrowth] Error loading stats:', error);
    }
  }

  function renderSkillBar(skill, level, maxLevel = 10) {
    const percentage = (level / maxLevel) * 100;
    const color = level >= 7 ? NEON_COLORS.hiGreen :
                  level >= 4 ? NEON_COLORS.hiCyan :
                  NEON_COLORS.dimCyan;

    return (
      <View style={styles.skillContainer}>
        <View style={styles.skillHeader}>
          <NeonText color={color} style={styles.skillName}>
            {skill}
          </NeonText>
          <NeonText color={color} style={styles.skillLevel}>
            Level {level}/{maxLevel}
          </NeonText>
        </View>
        <View style={styles.skillBarContainer}>
          <View style={[styles.skillBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  function renderAchievement(emoji, title, description, unlocked) {
    return (
      <View style={[styles.achievementCard, !unlocked && styles.achievementLocked]}>
        <NeonText style={styles.achievementEmoji}>{emoji}</NeonText>
        <NeonText color={unlocked ? NEON_COLORS.hiYellow : NEON_COLORS.dimWhite} style={styles.achievementTitle}>
          {title}
        </NeonText>
        <NeonText color={NEON_COLORS.dimWhite} style={styles.achievementDescription}>
          {description}
        </NeonText>
        {!unlocked && (
          <NeonText color={NEON_COLORS.dimRed} style={styles.lockedText}>
            🔒 LOCKED
          </NeonText>
        )}
      </View>
    );
  }

  const achievements = [
    { emoji: '🌟', title: 'First Steps', description: 'Complete your first reading', unlocked: stats.totalReadings >= 1 },
    { emoji: '🔮', title: 'Oracle Seeker', description: 'Chat with the Oracle 5 times', unlocked: stats.oracleChats >= 5 },
    { emoji: '📖', title: 'Chronicler', description: 'Write 10 journal entries', unlocked: stats.journalEntries >= 10 },
    { emoji: '💼', title: 'Career Builder', description: 'Complete 3 career sessions', unlocked: stats.careerSessions >= 3 },
    { emoji: '⚡', title: 'Dedicated Seeker', description: 'Complete 25 readings', unlocked: stats.totalReadings >= 25 },
    { emoji: '🌙', title: 'Shadow Walker', description: 'Reach Level 5 in Shadow Work', unlocked: stats.skillLevels.shadowWork >= 5 },
    { emoji: '🎯', title: 'Pattern Master', description: 'Reach Level 7 in Pattern Recognition', unlocked: stats.skillLevels.patternRecognition >= 7 },
    { emoji: '✨', title: 'Enlightened', description: 'Reach Level 10 in all skills', unlocked: Object.values(stats.skillLevels).every(l => l >= 10) }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a1a2e', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <NeonText color={NEON_COLORS.dimCyan}>[ ← BACK ]</NeonText>
        </TouchableOpacity>
        <NeonText color={NEON_COLORS.hiYellow} style={styles.title}>
          🌱 PERSONAL GROWTH
        </NeonText>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Stats Overview */}
        <View style={styles.section}>
          <NeonText color={NEON_COLORS.hiCyan} style={styles.sectionTitle}>
            📊 STATISTICS
          </NeonText>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <NeonText color={NEON_COLORS.hiMagenta} style={styles.statValue}>
                {stats.totalReadings}
              </NeonText>
              <NeonText color={NEON_COLORS.dimWhite} style={styles.statLabel}>
                Readings
              </NeonText>
            </View>

            <View style={styles.statCard}>
              <NeonText color={NEON_COLORS.hiCyan} style={styles.statValue}>
                {stats.totalCards}
              </NeonText>
              <NeonText color={NEON_COLORS.dimWhite} style={styles.statLabel}>
                Cards Drawn
              </NeonText>
            </View>

            <View style={styles.statCard}>
              <NeonText color={NEON_COLORS.hiYellow} style={styles.statValue}>
                {stats.journalEntries}
              </NeonText>
              <NeonText color={NEON_COLORS.dimWhite} style={styles.statLabel}>
                Journal Entries
              </NeonText>
            </View>

            <View style={styles.statCard}>
              <NeonText color={NEON_COLORS.hiGreen} style={styles.statValue}>
                {stats.oracleChats}
              </NeonText>
              <NeonText color={NEON_COLORS.dimWhite} style={styles.statLabel}>
                Oracle Chats
              </NeonText>
            </View>
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <NeonText color={NEON_COLORS.hiCyan} style={styles.sectionTitle}>
            ⚡ SKILLS
          </NeonText>

          {renderSkillBar('Shadow Work', stats.skillLevels.shadowWork)}
          {renderSkillBar('Pattern Recognition', stats.skillLevels.patternRecognition)}
          {renderSkillBar('Intuition', stats.skillLevels.intuition)}
          {renderSkillBar('Synthesis', stats.skillLevels.synthesis)}
          {renderSkillBar('Oracle Communion', stats.skillLevels.oracleCommunion)}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <NeonText color={NEON_COLORS.hiCyan} style={styles.sectionTitle}>
            🏆 ACHIEVEMENTS ({achievements.filter(a => a.unlocked).length}/{achievements.length})
          </NeonText>

          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <View key={index}>
                {renderAchievement(
                  achievement.emoji,
                  achievement.title,
                  achievement.description,
                  achievement.unlocked
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Refresh button */}
        <TouchableOpacity style={styles.refreshButton} onPress={loadStats}>
          <NeonText color={NEON_COLORS.hiCyan}>[ REFRESH STATS ]</NeonText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 20
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5
  },
  statLabel: {
    fontSize: 12
  },
  skillContainer: {
    marginBottom: 15
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  skillName: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  skillLevel: {
    fontSize: 14
  },
  skillBarContainer: {
    height: 20,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 10,
    overflow: 'hidden'
  },
  skillBarFill: {
    height: '100%',
    borderRadius: 8
  },
  achievementsGrid: {
    gap: 10
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderWidth: 1,
    borderColor: NEON_COLORS.hiYellow,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  achievementLocked: {
    backgroundColor: 'rgba(100, 100, 100, 0.05)',
    borderColor: NEON_COLORS.dimWhite,
    opacity: 0.5
  },
  achievementEmoji: {
    fontSize: 32
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1
  },
  achievementDescription: {
    fontSize: 12,
    position: 'absolute',
    bottom: 10,
    left: 65
  },
  lockedText: {
    fontSize: 10,
    position: 'absolute',
    top: 10,
    right: 10
  },
  refreshButton: {
    padding: 15,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  }
});
