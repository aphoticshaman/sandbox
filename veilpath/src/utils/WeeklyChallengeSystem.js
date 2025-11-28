/**
 * WEEKLY CHALLENGE SYSTEM
 * Core engagement loop: 1 meaningful journal entry per week
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurrencyManager } from './CurrencyManager';
import { ProgressionSystem } from './ProgressionSystem';

const WEEKLY_CHALLENGE_KEY = '@veilpath_weekly_challenge';

const WEEKLY_REWARDS = {
  BASE: {
    moonlight: 100,
    xp: 75
  },
  STREAK_MULTIPLIERS: [
    { week: 1, multiplier: 1.0 },   // 100 Moonlight, 75 XP
    { week: 2, multiplier: 1.5 },   // 150 Moonlight, ~113 XP
    { week: 3, multiplier: 2.25 },  // 225 Moonlight, ~169 XP
    { week: 4, multiplier: 3.0 },   // 300 Moonlight, 225 XP (cap)
  ]
};

class WeeklyChallengeSystemClass {
  constructor() {
    this.state = null;
  }

  async initialize() {
    try {
      const data = await AsyncStorage.getItem(WEEKLY_CHALLENGE_KEY);
      this.state = data ? JSON.parse(data) : this.getDefaultState();

      // Check if we need to start a new week
      this.checkWeekReset();

      return this.state;
    } catch (error) {
      console.error('[WeeklyChallenge] Initialize error:', error);
      return this.getDefaultState();
    }
  }

  getDefaultState() {
    return {
      currentWeek: this.getCurrentWeek(),
      weekStartDate: this.getWeekStartDate(),
      completed: false,
      journalEntry: null,
      submittedAt: null,
      verificationResult: null,
      consecutiveWeeks: 0,
      longestStreak: 0,
      totalCompletions: 0,
    };
  }

  getCurrentWeek() {
    // ISO week number
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek);
  }

  getWeekStartDate() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }

  checkWeekReset() {
    const currentWeek = this.getCurrentWeek();

    if (this.state.currentWeek !== currentWeek) {
      // New week started
      const wasCompleted = this.state.completed;

      if (!wasCompleted && this.state.consecutiveWeeks > 0) {
        // Streak broken - they didn't complete last week
        this.state.consecutiveWeeks = 0;
      }

      // Reset for new week
      this.state.currentWeek = currentWeek;
      this.state.weekStartDate = this.getWeekStartDate();
      this.state.completed = false;
      this.state.journalEntry = null;
      this.state.submittedAt = null;
      this.state.verificationResult = null;

      this.save();
    }
  }

  async getStatus() {
    if (!this.state) {
      await this.initialize();
    }

    const daysUntilReset = this.getDaysUntilWeekReset();
    const currentMultiplier = this.getCurrentMultiplier();

    return {
      completed: this.state.completed,
      consecutiveWeeks: this.state.consecutiveWeeks,
      longestStreak: this.state.longestStreak,
      totalCompletions: this.state.totalCompletions,
      daysUntilReset,
      estimatedReward: {
        moonlight: Math.floor(WEEKLY_REWARDS.BASE.moonlight * currentMultiplier),
        xp: Math.floor(WEEKLY_REWARDS.BASE.xp * currentMultiplier)
      },
      nextStreakReward: this.getNextStreakReward()
    };
  }

  getDaysUntilWeekReset() {
    const now = new Date();
    const nextMonday = new Date(this.state.weekStartDate);
    nextMonday.setDate(nextMonday.getDate() + 7);
    const diff = nextMonday - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getCurrentMultiplier() {
    const weekNum = Math.min(this.state.consecutiveWeeks + 1, 4);
    const multiplier = WEEKLY_REWARDS.STREAK_MULTIPLIERS.find(m => m.week === weekNum);
    return multiplier ? multiplier.multiplier : 1.0;
  }

  getNextStreakReward() {
    const nextWeek = Math.min(this.state.consecutiveWeeks + 2, 4);
    const multiplier = WEEKLY_REWARDS.STREAK_MULTIPLIERS.find(m => m.week === nextWeek);

    if (!multiplier || nextWeek > 4) return null;

    return {
      week: nextWeek,
      moonlight: Math.floor(WEEKLY_REWARDS.BASE.moonlight * multiplier.multiplier),
      xp: Math.floor(WEEKLY_REWARDS.BASE.xp * multiplier.multiplier)
    };
  }

  async submitJournal(journalText, verificationResult) {
    if (this.state.completed) {
      return {
        success: false,
        error: 'Already completed this week'
      };
    }

    if (!verificationResult.isValid) {
      return {
        success: false,
        error: 'Journal entry did not pass verification',
        reason: verificationResult.reason
      };
    }

    // Mark as completed
    this.state.completed = true;
    this.state.journalEntry = journalText;
    this.state.submittedAt = new Date().toISOString();
    this.state.verificationResult = verificationResult;
    this.state.consecutiveWeeks++;
    this.state.totalCompletions++;

    if (this.state.consecutiveWeeks > this.state.longestStreak) {
      this.state.longestStreak = this.state.consecutiveWeeks;
    }

    // Calculate rewards
    const multiplier = this.getCurrentMultiplier();
    const moonlightReward = Math.floor(WEEKLY_REWARDS.BASE.moonlight * multiplier);
    const xpReward = Math.floor(WEEKLY_REWARDS.BASE.xp * multiplier);

    // Award currency and XP
    await CurrencyManager.addMoonlight(moonlightReward, 'weekly_challenge');
    await ProgressionSystem.awardXP(xpReward, 'weekly_challenge');

    await this.save();

    return {
      success: true,
      rewards: {
        moonlight: moonlightReward,
        xp: xpReward,
        streak: this.state.consecutiveWeeks
      },
      verificationResult
    };
  }

  async save() {
    try {
      await AsyncStorage.setItem(WEEKLY_CHALLENGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('[WeeklyChallenge] Save error:', error);
    }
  }
}

export const WeeklyChallengeSystem = new WeeklyChallengeSystemClass();
