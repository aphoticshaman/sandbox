/**
 * PROFILE SCREEN - "Your Path"
 * Shows user's tarot journey stats and progress
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeDimensions } from '../src/utils/useSafeDimensions';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const { width } = useSafeDimensions();
  const [stats, setStats] = useState({
    totalReadings: 0,
    favoriteSuit: 'Unknown',
    recentCard: null,
    journeyStarted: null
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Load reading history
      const historyData = await AsyncStorage.getItem('@lunatiq_reading_history');
      const journalData = await AsyncStorage.getItem('@lunatiq_journal_entries');

      const history = historyData ? JSON.parse(historyData) : [];
      const journal = journalData ? JSON.parse(journalData) : [];

      // Calculate stats
      const totalReadings = history.length;
      const journeyStarted = history.length > 0
        ? new Date(history[history.length - 1].timestamp).toLocaleDateString()
        : 'Not yet begun';

      setStats({
        totalReadings,
        journalEntries: journal.length,
        journeyStarted,
        recentCard: history.length > 0 ? history[0].cards?.[0]?.name : null
      });
    } catch (error) {
      console.error('[Profile] Error loading stats:', error);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a1a2e', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Path</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>The Seeker's Journey</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            Every reading is a step deeper into the mysteries
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Total Readings */}
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(138, 43, 226, 0.2)', 'rgba(106, 27, 178, 0.1)']}
              style={styles.statGradient}
            >
              <Text style={styles.statValue}>{stats.totalReadings}</Text>
              <Text style={styles.statLabel}>Readings Cast</Text>
            </LinearGradient>
          </View>

          {/* Journal Entries */}
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(0, 255, 255, 0.2)', 'rgba(0, 200, 200, 0.1)']}
              style={styles.statGradient}
            >
              <Text style={styles.statValue}>{stats.journalEntries || 0}</Text>
              <Text style={styles.statLabel}>Journal Entries</Text>
            </LinearGradient>
          </View>

          {/* Journey Started */}
          <View style={[styles.statCard, styles.statCardWide]}>
            <LinearGradient
              colors={['rgba(218, 165, 32, 0.2)', 'rgba(184, 134, 11, 0.1)']}
              style={styles.statGradient}
            >
              <Text style={styles.statValueSmall}>{stats.journeyStarted}</Text>
              <Text style={styles.statLabel}>Journey Began</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Recent Activity */}
        {stats.recentCard && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Card Drawn</Text>
            <View style={styles.recentCard}>
              <Text style={styles.cardName}>{stats.recentCard}</Text>
              <Text style={styles.cardHint}>
                The cards remember your path through the shadows
              </Text>
            </View>
          </View>
        )}

        {/* Journey Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Path Ahead</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {stats.totalReadings === 0
                ? "Your journey begins with a single card. Visit the Village to consult the Oracle."
                : stats.totalReadings < 5
                ? "You've taken your first steps into the Shadowlands. Each reading deepens your connection to the Veil."
                : stats.totalReadings < 20
                ? "The cards are beginning to reveal their patterns. Luna and Sol watch your progress with interest."
                : "You walk the path of the adept. The mysteries of the Shadowlands unfold before you."}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ReadingHistory')}
          >
            <LinearGradient
              colors={['rgba(138, 43, 226, 0.3)', 'rgba(106, 27, 178, 0.2)']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>📜 View Reading History</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Journal')}
          >
            <LinearGradient
              colors={['rgba(0, 255, 255, 0.3)', 'rgba(0, 200, 200, 0.2)']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>✍️ Open Sacred Journal</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Achievements')}
          >
            <LinearGradient
              colors={['rgba(218, 165, 32, 0.3)', 'rgba(184, 134, 11, 0.2)']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>⭐ View Achievements</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('WeeklyChallenge')}
          >
            <LinearGradient
              colors={['rgba(138, 43, 226, 0.3)', 'rgba(106, 27, 178, 0.2)']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>📝 Weekly Challenge</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    fontSize: 16,
    color: '#00ffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8a2be2',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  divider: {
    width: 120,
    height: 2,
    backgroundColor: '#8a2be2',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    width: (width - 55) / 2,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.5)',
  },
  statCardWide: {
    width: width - 40,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.8,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8a2be2',
    marginBottom: 12,
  },
  recentCard: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.5)',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  cardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 8,
  },
  cardHint: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
    borderRadius: 10,
    padding: 18,
  },
  infoText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 22,
    opacity: 0.9,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.5)',
  },
  actionGradient: {
    padding: 16,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
