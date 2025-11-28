/**
 * WEEKLY CHALLENGE SCREEN
 * Submit journal entry for weekly rewards
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyChallengeSystem } from '../src/utils/WeeklyChallengeSystem';
import { CurrencyManager } from '../src/utils/CurrencyManager';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://lunatiq-tarot.vercel.app';

export default function WeeklyChallengeScreen({ navigation }) {
  const [status, setStatus] = useState(null);
  const [journalText, setJournalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRecentReading, setHasRecentReading] = useState(false);
  const [balance, setBalance] = useState({ moonlight: 0, veilShards: 0 });

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    const challengeStatus = await WeeklyChallengeSystem.initialize();
    const status = await WeeklyChallengeSystem.getStatus();
    setStatus(status);

    // Check if user has done a reading this week
    const HISTORY_KEY = '@lunatiq_reading_history';
    try {
      const historyData = await AsyncStorage.getItem(HISTORY_KEY);
      const history = historyData ? JSON.parse(historyData) : [];

      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentReadings = history.filter(r => new Date(r.timestamp).getTime() > oneWeekAgo);
      setHasRecentReading(recentReadings.length > 0);
    } catch (error) {
      console.error('[WeeklyChallenge] Error checking readings:', error);
    }

    const bal = await CurrencyManager.getBalance();
    setBalance(bal);
  }

  async function handleSubmit() {
    if (journalText.trim().length < 150) {
      Alert.alert('Too Short', 'Journal entry must be at least 150 characters. Share your genuine reflection.');
      return;
    }

    if (!hasRecentReading) {
      Alert.alert(
        'No Recent Reading',
        'Complete a tarot reading this week before submitting your journal.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Do a Reading', onPress: () => navigation.navigate('CardReading', { spreadType: 'single_card' }) }
        ]
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Call verification API
      const response = await fetch(`${API_BASE_URL}/api/verify-journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journalText: journalText.trim(),
          hasRecentReading: true
        })
      });

      const result = await response.json();

      if (!result.success) {
        Alert.alert('Verification Failed', result.error?.message || 'Unable to verify journal entry');
        setIsSubmitting(false);
        return;
      }

      // Submit to challenge system
      const submitResult = await WeeklyChallengeSystem.submitJournal(
        journalText.trim(),
        result.data
      );

      setIsSubmitting(false);

      if (submitResult.success) {
        // Reload status and balance
        await loadStatus();

        Alert.alert(
          '✨ Challenge Complete!',
          `Weekly journal accepted!\n\n+${submitResult.rewards.moonlight} Moonlight\n+${submitResult.rewards.xp} XP\n\n${submitResult.rewards.streak > 1 ? `🔥 ${submitResult.rewards.streak} week streak!` : 'Keep it up next week!'}`,
          [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'Not Accepted',
          submitResult.error + (submitResult.reason ? `\n\nReason: ${submitResult.reason}` : ''),
          [{ text: 'Try Again' }]
        );
      }

    } catch (error) {
      console.error('[WeeklyChallenge] Submit error:', error);
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to submit journal. Please try again.');
    }
  }

  if (!status) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#8a2be2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Challenge</Text>
        <View style={styles.currencyDisplay}>
          <Text style={styles.currencyText}>🌙 {balance.moonlight}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Challenge Status */}
        {status.completed ? (
          <View style={styles.completedCard}>
            <Text style={styles.completedIcon}>✅</Text>
            <Text style={styles.completedTitle}>Challenge Complete!</Text>
            <Text style={styles.completedText}>
              You've submitted your journal entry for this week.
              {'\n\n'}
              Come back next week for another chance at rewards!
            </Text>
            <View style={styles.statsBox}>
              <Text style={styles.statText}>
                🔥 Streak: {status.consecutiveWeeks} {status.consecutiveWeeks === 1 ? 'week' : 'weeks'}
              </Text>
              <Text style={styles.statText}>
                📊 Total: {status.totalCompletions} completions
              </Text>
              <Text style={styles.statText}>
                🏆 Longest: {status.longestStreak} {status.longestStreak === 1 ? 'week' : 'weeks'}
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Reward Info */}
            <View style={styles.rewardCard}>
              <Text style={styles.rewardTitle}>This Week's Reward</Text>
              <View style={styles.rewardAmount}>
                <Text style={styles.rewardMoonlight}>
                  {status.estimatedReward.moonlight} Moonlight
                </Text>
                <Text style={styles.rewardXP}>+ {status.estimatedReward.xp} XP</Text>
              </View>

              {status.consecutiveWeeks > 0 && (
                <Text style={styles.streakInfo}>
                  🔥 {status.consecutiveWeeks} week streak active!
                </Text>
              )}

              {status.nextStreakReward && (
                <Text style={styles.nextStreakInfo}>
                  Next week: {status.nextStreakReward.moonlight} Moonlight
                  ({status.nextStreakReward.week} week streak)
                </Text>
              )}
            </View>

            {/* Requirements */}
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>Requirements</Text>
              <Text style={styles.requirementItem}>
                {hasRecentReading ? '✅' : '❌'} Complete a tarot reading this week
              </Text>
              <Text style={styles.requirementItem}>
                ✍️ Write at least 150 characters
              </Text>
              <Text style={styles.requirementItem}>
                💭 Reflect on your reading with genuine intent
              </Text>
              <Text style={styles.requirementNote}>
                Don't worry about grammar or spelling - we're looking for genuine reflection, not perfect writing!
              </Text>
            </View>

            {/* Journal Input */}
            <View style={styles.journalCard}>
              <Text style={styles.journalTitle}>Your Weekly Reflection</Text>
              <Text style={styles.journalPrompt}>
                Reflect on a reading from this week:{'\n\n'}
                • What did the cards reveal?{'\n'}
                • How did it make you feel?{'\n'}
                • What will you do with this wisdom?
              </Text>

              <TextInput
                style={styles.journalInput}
                placeholder="Share your reflection... (150+ characters)"
                placeholderTextColor="#666"
                value={journalText}
                onChangeText={setJournalText}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />

              <View style={styles.charCounter}>
                <Text style={[
                  styles.charCount,
                  journalText.length >= 150 && styles.charCountValid
                ]}>
                  {journalText.length} / 150 minimum
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (journalText.length < 150 || isSubmitting || !hasRecentReading) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={journalText.length < 150 || isSubmitting || !hasRecentReading}
              >
                <LinearGradient
                  colors={journalText.length >= 150 && hasRecentReading ? ['#8a2be2', '#6a1bb2'] : ['#444', '#333']}
                  style={styles.submitGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      Submit Journal Entry
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📅 {status.daysUntilReset} days until weekly reset</Text>
              <Text style={styles.infoText}>
                Complete your journal entry before Monday to maintain your streak!
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    fontSize: 16,
    color: '#00ffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  currencyDisplay: {},
  currencyText: {
    fontSize: 14,
    color: '#00ffff',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  completedCard: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#44ff44',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  completedIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  completedTitle: {
    fontSize: 24,
    color: '#44ff44',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  completedText: {
    fontSize: 15,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  statsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 15,
    width: '100%',
  },
  statText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  rewardCard: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderColor: '#8a2be2',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 15,
  },
  rewardAmount: {
    alignItems: 'center',
  },
  rewardMoonlight: {
    fontSize: 32,
    color: '#00ffff',
    fontWeight: 'bold',
  },
  rewardXP: {
    fontSize: 18,
    color: '#8a2be2',
    marginTop: 5,
  },
  streakInfo: {
    fontSize: 16,
    color: '#ff8844',
    fontWeight: 'bold',
    marginTop: 15,
  },
  nextStreakInfo: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
  },
  requirementsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  requirementItem: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
  },
  requirementNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 18,
  },
  journalCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#8a2be2',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  journalTitle: {
    fontSize: 18,
    color: '#8a2be2',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  journalPrompt: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 15,
  },
  journalInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  charCounter: {
    marginTop: 10,
    marginBottom: 15,
  },
  charCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  charCountValid: {
    color: '#44ff44',
  },
  submitButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    padding: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00ffff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 14,
    color: '#00ffff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#ccc',
    textAlign: 'center',
  },
});
