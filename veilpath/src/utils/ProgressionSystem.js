/**
 * PROGRESSION SYSTEM
 * Handles leveling, unlocks, gating, and rewards
 * Duolingo-style engagement hooks for tarot
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurrencyManager, ECONOMY } from './CurrencyManager';

const PROGRESSION_KEY = '@veilpath_progression';
const DAILY_STATE_KEY = '@veilpath_daily_state';

/**
 * Spread unlock requirements
 */
export const SPREAD_UNLOCKS = {
  single_card: {
    level: 1,
    moonlightCost: 0,
    name: 'Single Card',
    description: 'Draw one card for guidance'
  },
  three_card: {
    level: 3,
    moonlightCost: 25,
    requiresJournalEntries: 2,
    name: 'Three Card Spread',
    description: 'Past, Present, Future'
  },
  five_card: {
    level: 5,
    moonlightCost: 50,
    requiresJournalEntries: 5,
    name: 'Five Card Cross',
    description: 'Deep insight into a situation'
  },
  celtic_cross: {
    level: 10,
    veilShardCost: 100,
    requiresReadings: 25,
    requiresReflections: 10,
    name: 'Celtic Cross',
    description: 'The most comprehensive reading'
  }
};

/**
 * Level thresholds and rewards
 */
export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, reward: { moonlight: 0 } },
  { level: 2, xpRequired: 100, reward: { moonlight: 50 } },
  { level: 3, xpRequired: 250, reward: { moonlight: 75, unlock: 'three_card' } },
  { level: 4, xpRequired: 500, reward: { moonlight: 100 } },
  { level: 5, xpRequired: 1000, reward: { moonlight: 150, unlock: 'five_card' } },
  { level: 6, xpRequired: 1750, reward: { moonlight: 200 } },
  { level: 7, xpRequired: 2750, reward: { moonlight: 250 } },
  { level: 8, xpRequired: 4000, reward: { moonlight: 300 } },
  { level: 9, xpRequired: 6000, reward: { moonlight: 400 } },
  { level: 10, xpRequired: 8500, reward: { veilShards: 50, unlock: 'celtic_cross' } },
];

/**
 * XP rewards for different actions
 */
export const XP_REWARDS = {
  COMPLETE_READING: 50,
  JOURNAL_ENTRY: 30,
  REFLECTION_ANSWER: 20,
  DAILY_INTENTION: 10,
  SHARE_READING: 15,
  SEVEN_DAY_STREAK: 200,
  THIRTY_DAY_STREAK: 1000,
};

class ProgressionSystemClass {
  constructor() {
    this.progression = null;
    this.dailyState = null;
  }

  /**
   * Initialize progression system
   */
  async initialize() {
    try {
      const data = await AsyncStorage.getItem(PROGRESSION_KEY);
      this.progression = data ? JSON.parse(data) : this.getDefaultProgression();

      const dailyData = await AsyncStorage.getItem(DAILY_STATE_KEY);
      this.dailyState = dailyData ? JSON.parse(dailyData) : this.getDefaultDailyState();

      // Check if we need to reset daily state
      this.checkDailyReset();

      return this.progression;
    } catch (error) {
      console.error('[Progression] Initialize error:', error);
      return this.getDefaultProgression();
    }
  }

  getDefaultProgression() {
    return {
      level: 1,
      xp: 0,
      totalReadings: 0,
      totalJournalEntries: 0,
      totalReflections: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastReadingDate: null,
      unlockedSpreads: ['single_card'],
      achievements: [],
    };
  }

  getDefaultDailyState() {
    return {
      date: new Date().toDateString(),
      freeReadingUsed: false,
      readingsToday: 0,
      questsCompleted: [],
    };
  }

  /**
   * Check if we need to reset daily state
   */
  checkDailyReset() {
    const today = new Date().toDateString();
    if (this.dailyState.date !== today) {
      // New day - reset daily state
      const yesterday = new Date(this.dailyState.date);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate - yesterday) / (1000 * 60 * 60 * 24));

      // Update streak
      if (daysDiff === 1) {
        // Consecutive day
        this.progression.currentStreak++;
        if (this.progression.currentStreak > this.progression.longestStreak) {
          this.progression.longestStreak = this.progression.currentStreak;
        }
      } else if (daysDiff > 1) {
        // Streak broken
        this.progression.currentStreak = 0;
      }

      this.dailyState = this.getDefaultDailyState();
      this.save();
    }
  }

  /**
   * Check if user can access a spread type
   */
  canAccessSpread(spreadType) {
    const requirements = SPREAD_UNLOCKS[spreadType];
    if (!requirements) return { canAccess: false, reason: 'Unknown spread type' };

    // Check level
    if (this.progression.level < requirements.level) {
      return {
        canAccess: false,
        reason: `Reach level ${requirements.level} to unlock`,
        gate: 'level',
        required: requirements.level,
        current: this.progression.level
      };
    }

    // Check journal entries
    if (requirements.requiresJournalEntries &&
        this.progression.totalJournalEntries < requirements.requiresJournalEntries) {
      return {
        canAccess: false,
        reason: `Create ${requirements.requiresJournalEntries} journal entries to unlock`,
        gate: 'journal',
        required: requirements.requiresJournalEntries,
        current: this.progression.totalJournalEntries
      };
    }

    // Check readings
    if (requirements.requiresReadings &&
        this.progression.totalReadings < requirements.requiresReadings) {
      return {
        canAccess: false,
        reason: `Complete ${requirements.requiresReadings} readings to unlock`,
        gate: 'readings',
        required: requirements.requiresReadings,
        current: this.progression.totalReadings
      };
    }

    // Check reflections
    if (requirements.requiresReflections &&
        this.progression.totalReflections < requirements.requiresReflections) {
      return {
        canAccess: false,
        reason: `Answer ${requirements.requiresReflections} reflection questions to unlock`,
        gate: 'reflections',
        required: requirements.requiresReflections,
        current: this.progression.totalReflections
      };
    }

    return { canAccess: true };
  }

  /**
   * Check if user can start a reading (daily free OR has currency)
   */
  async canStartReading(spreadType) {
    const spreadAccess = this.canAccessSpread(spreadType);
    if (!spreadAccess.canAccess) {
      return spreadAccess;
    }

    // First reading of the day is free
    if (!this.dailyState.freeReadingUsed) {
      return { canAccess: true, isFree: true };
    }

    // Check if user has enough currency
    const requirements = SPREAD_UNLOCKS[spreadType];
    const cost = requirements.moonlightCost || 0;
    const veilCost = requirements.veilShardCost || 0;

    const balance = await CurrencyManager.getBalance();

    if (cost > 0 && balance.moonlight < cost) {
      return {
        canAccess: false,
        reason: `Need ${cost} Moonlight (you have ${balance.moonlight})`,
        gate: 'currency',
        required: cost,
        current: balance.moonlight
      };
    }

    if (veilCost > 0 && balance.veilShards < veilCost) {
      return {
        canAccess: false,
        reason: `Need ${veilCost} Veil Shards (you have ${balance.veilShards})`,
        gate: 'premium',
        required: veilCost,
        current: balance.veilShards
      };
    }

    return { canAccess: true, isFree: false, cost, veilCost };
  }

  /**
   * Award XP and check for level up
   */
  async awardXP(amount, source) {
    const oldLevel = this.progression.level;
    this.progression.xp += amount;

    // Check for level up
    const newLevel = this.calculateLevel(this.progression.xp);
    const leveledUp = newLevel > oldLevel;

    if (leveledUp) {
      this.progression.level = newLevel;
      const reward = LEVEL_THRESHOLDS.find(t => t.level === newLevel)?.reward;

      if (reward) {
        if (reward.moonlight) {
          await CurrencyManager.addMoonlight(reward.moonlight, 'level_up_reward');
        }
        if (reward.veilShards) {
          await CurrencyManager.addVeilShards(reward.veilShards, 'level_up_reward');
        }
        if (reward.unlock) {
          if (!this.progression.unlockedSpreads.includes(reward.unlock)) {
            this.progression.unlockedSpreads.push(reward.unlock);
          }
        }
      }

      await this.save();

      return {
        leveledUp: true,
        newLevel,
        reward,
        xpGained: amount
      };
    }

    await this.save();

    return {
      leveledUp: false,
      xpGained: amount,
      currentXP: this.progression.xp,
      nextLevelXP: LEVEL_THRESHOLDS.find(t => t.level === oldLevel + 1)?.xpRequired || 0
    };
  }

  /**
   * Calculate current level from XP
   */
  calculateLevel(xp) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i].xpRequired) {
        return LEVEL_THRESHOLDS[i].level;
      }
    }
    return 1;
  }

  /**
   * Complete a reading and award rewards
   */
  async completeReading(spreadType, journaled = false, reflected = false) {
    this.progression.totalReadings++;
    this.dailyState.readingsToday++;
    this.progression.lastReadingDate = new Date().toISOString();

    // Mark free reading as used if it was free
    if (!this.dailyState.freeReadingUsed) {
      this.dailyState.freeReadingUsed = true;
    }

    // Award XP
    let totalXP = XP_REWARDS.COMPLETE_READING;
    const rewards = { xp: totalXP };

    if (journaled) {
      this.progression.totalJournalEntries++;
      totalXP += XP_REWARDS.JOURNAL_ENTRY;
      rewards.journalXP = XP_REWARDS.JOURNAL_ENTRY;
    }

    if (reflected) {
      this.progression.totalReflections++;
      totalXP += XP_REWARDS.REFLECTION_ANSWER;
      rewards.reflectionXP = XP_REWARDS.REFLECTION_ANSWER;
    }

    const xpResult = await this.awardXP(totalXP, 'reading_complete');

    // Award currency
    const moonlightReward = ECONOMY.EARN.READING_COMPLETE;
    await CurrencyManager.addMoonlight(moonlightReward, 'reading_complete');
    rewards.moonlight = moonlightReward;

    // Streak bonus
    if (this.progression.currentStreak >= 7) {
      const streakBonus = Math.floor(moonlightReward * 0.5);
      await CurrencyManager.addMoonlight(streakBonus, 'streak_bonus');
      rewards.streakBonus = streakBonus;
    }

    await this.save();

    return {
      ...xpResult,
      rewards
    };
  }

  /**
   * Get current progression state
   */
  getProgression() {
    return this.progression;
  }

  /**
   * Get daily state
   */
  getDailyState() {
    return this.dailyState;
  }

  /**
   * Save to storage
   */
  async save() {
    try {
      await AsyncStorage.setItem(PROGRESSION_KEY, JSON.stringify(this.progression));
      await AsyncStorage.setItem(DAILY_STATE_KEY, JSON.stringify(this.dailyState));
    } catch (error) {
      console.error('[Progression] Save error:', error);
    }
  }
}

export const ProgressionSystem = new ProgressionSystemClass();
