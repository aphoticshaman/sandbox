/**
 * ENGAGEMENT TRACKING SERVICE
 * Ethical psychology mechanics - value-add, not predatory
 *
 * Philosophy:
 * - Reward engagement without punishing absence
 * - Surface real insights, not fake metrics
 * - Create genuine value over time
 * - No FOMO, no artificial scarcity, no dark patterns
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CARD_DATABASE } from '../data/cardDatabase';

const STORAGE_KEYS = {
  READING_HISTORY: '@veilpath_reading_history', // Fixed: matches app-wide key
  STREAK_DATA: '@veilpath_streak_data',
  CARD_TRACKER: '@veilpath_card_tracker',
  USER_TIER: '@veilpath_user_tier',
  INSIGHTS: '@veilpath_insights',
};

/**
 * USER TIER SYSTEM
 * Unlock features and cosmetics, not artificial constraints
 */
const TIER_THRESHOLDS = [
  { tier: 'Apprentice', minReadings: 0, color: 'dimCyan', features: ['basic_spreads'] },
  { tier: 'Adept', minReadings: 10, color: 'hiCyan', features: ['basic_spreads', 'card_patterns'] },
  { tier: 'Master', minReadings: 50, color: 'hiMagenta', features: ['basic_spreads', 'card_patterns', 'deep_insights'] },
  { tier: 'Mystic', minReadings: 100, color: 'hiYellow', features: ['basic_spreads', 'card_patterns', 'deep_insights', 'llm_memory'] },
  { tier: 'Vera', minReadings: 250, color: 'hiGreen', features: ['all'] },
];

/**
 * Save a reading to history
 * @param {object} reading - Reading data
 * @returns {Promise<void>}
 */
export async function saveReading(reading) {
  try {
    const timestamp = Date.now();

    // Convert cards to proper format (handle both {name} and {cardIndex} formats)
    const formattedCards = reading.cards.map(c => {
      // Get card name from either c.name or lookup by cardIndex
      let cardName = c.name;
      if (!cardName && c.cardIndex !== undefined) {
        const cardData = CARD_DATABASE[c.cardIndex];
        cardName = cardData?.name;
      }

      if (!cardName) {
        console.error('[SaveReading] Card has no name and no cardIndex!', c);
      }

      return {
        name: cardName,
        reversed: c.reversed,
        position: c.position,
      };
    });


    const readingRecord = {
      id: `reading_${timestamp}`,
      timestamp,
      date: new Date(timestamp).toISOString(),
      spreadType: reading.spreadType,
      spreadSubtype: reading.spreadSubtype,
      intention: reading.intention,
      cards: formattedCards,
      themes: reading.themes || [],
      synthesis: reading.synthesis || '',
      profileId: reading.profileId,
    };

    // Get existing history
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.READING_HISTORY);
    const history = historyJson ? JSON.parse(historyJson) : [];

    // Add new reading
    history.unshift(readingRecord); // Most recent first

    // Keep last 500 readings (prevent infinite storage growth)
    if (history.length > 500) {
      history.splice(500);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.READING_HISTORY, JSON.stringify(history));

    // Update card tracker
    await updateCardTracker(reading.cards, timestamp);

    // Update streak
    await updateStreak(timestamp);

    // Update tier
    await updateTier(history.length);

    return readingRecord;
  } catch (error) {
    console.error('Error saving reading:', error);
    throw error;
  }
}

/**
 * Get reading history with optional filters
 * @param {object} filters - { profileId, spreadType, dateRange, limit }
 * @returns {Promise<array>}
 */
export async function getReadingHistory(filters = {}) {
  try {
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.READING_HISTORY);
    let history = historyJson ? JSON.parse(historyJson) : [];

    // Apply filters
    if (filters.profileId) {
      history = history.filter(r => r.profileId === filters.profileId);
    }

    if (filters.spreadType) {
      history = history.filter(r => r.spreadType === filters.spreadType);
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      history = history.filter(r => {
        const date = new Date(r.date);
        return date >= start && date <= end;
      });
    }

    if (filters.limit) {
      history = history.slice(0, filters.limit);
    }

    return history;
  } catch (error) {
    console.error('Error getting reading history:', error);
    return [];
  }
}

/**
 * Update card appearance tracker
 * Tracks which cards appear, when, and under what circumstances
 */
async function updateCardTracker(cards, timestamp) {
  try {
    const trackerJson = await AsyncStorage.getItem(STORAGE_KEYS.CARD_TRACKER);
    const tracker = trackerJson ? JSON.parse(trackerJson) : {};


    cards.forEach(card => {
      // Handle both {name, reversed, position} and {cardIndex, reversed, position} formats
      const key = card.name || (card.cardIndex !== undefined ? CARD_DATABASE[card.cardIndex]?.name : null);

      if (!key) {
        console.warn('[CardTracker] Card missing name and cardIndex:', card);
        return; // Skip this card
      }
      if (!tracker[key]) {
        tracker[key] = {
          appearances: 0,
          lastSeen: null,
          reversedCount: 0,
          uprightCount: 0,
          positions: {},
        };
      }

      tracker[key].appearances++;
      tracker[key].lastSeen = timestamp;

      if (card.reversed) {
        tracker[key].reversedCount++;
      } else {
        tracker[key].uprightCount++;
      }

      if (card.position) {
        tracker[key].positions[card.position] = (tracker[key].positions[card.position] || 0) + 1;
      }
    });

    await AsyncStorage.setItem(STORAGE_KEYS.CARD_TRACKER, JSON.stringify(tracker));
  } catch (error) {
    console.error('Error updating card tracker:', error);
  }
}

/**
 * Track a card immediately when revealed (doesn't wait for reading completion)
 * Use this during the reading to unlock cards in real-time
 * @param {Object} card - Card object with cardIndex or name
 * @returns {Promise<void>}
 */
export async function trackCardReveal(card) {
  try {
    const timestamp = Date.now();
    await updateCardTracker([card], timestamp);
  } catch (error) {
    console.error('[CardTracker] Error tracking card reveal:', error);
  }
}

/**
 * Get card appearance data
 * @returns {Promise<object>}
 */
export async function getCardTracker() {
  try {
    const trackerJson = await AsyncStorage.getItem(STORAGE_KEYS.CARD_TRACKER);
    return trackerJson ? JSON.parse(trackerJson) : {};
  } catch (error) {
    console.error('Error getting card tracker:', error);
    return {};
  }
}

/**
 * MIGRATION: Backfill card tracker from reading history
 * Call this on app startup to populate card tracker from old readings
 */
export async function migrateCardTrackerFromHistory() {
  try {

    const trackerJson = await AsyncStorage.getItem(STORAGE_KEYS.CARD_TRACKER);
    const tracker = trackerJson ? JSON.parse(trackerJson) : {};
    const trackerCardCount = Object.keys(tracker).length;

    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.READING_HISTORY);
    const history = historyJson ? JSON.parse(historyJson) : [];

    // Only migrate if we have history but empty/small tracker
    if (history.length > 0 && trackerCardCount < 5) {

      // Process all historical readings
      for (const reading of history) {
        if (reading.cards && Array.isArray(reading.cards)) {
          for (const card of reading.cards) {
            const cardName = card.name || card.cardName;
            if (!cardName || cardName === 'undefined') continue;

            if (!tracker[cardName]) {
              tracker[cardName] = {
                firstSeen: reading.timestamp,
                lastSeen: reading.timestamp,
                appearances: 0,
                uprightCount: 0,
                reversedCount: 0,
              };
            }

            tracker[cardName].appearances++;
            tracker[cardName].lastSeen = reading.timestamp;

            if (card.reversed) {
              tracker[cardName].reversedCount++;
            } else {
              tracker[cardName].uprightCount++;
            }
          }
        }
      }

      // Save migrated tracker
      await AsyncStorage.setItem(STORAGE_KEYS.CARD_TRACKER, JSON.stringify(tracker));

      return { migrated: true, cardsTracked: Object.keys(tracker).length, readingsProcessed: history.length };
    } else {
      return { migrated: false };
    }
  } catch (error) {
    console.error('[Migration] Error migrating card tracker:', error);
    return { migrated: false, error };
  }
}

/**
 * Update streak data (non-punitive)
 * Tracks consecutive days, but doesn't punish breaks
 */
async function updateStreak(timestamp) {
  try {
    const streakJson = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
    const streak = streakJson ? JSON.parse(streakJson) : {
      currentStreak: 0,
      longestStreak: 0,
      lastReadingDate: null,
      totalDaysActive: 0,
      milestones: [],
    };

    const today = new Date(timestamp).toDateString();
    const lastDate = streak.lastReadingDate ? new Date(streak.lastReadingDate).toDateString() : null;

    if (today !== lastDate) {
      // New day!
      const yesterday = new Date(timestamp - 86400000).toDateString();

      if (lastDate === yesterday) {
        // Consecutive day
        streak.currentStreak++;
      } else {
        // Break in streak (but we don't punish)
        streak.currentStreak = 1;
      }

      streak.totalDaysActive++;
      streak.lastReadingDate = timestamp;

      // Update longest streak
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;

        // Celebrate milestones (non-aggressive)
        const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
        if (milestones.includes(streak.longestStreak)) {
          streak.milestones.push({
            streak: streak.longestStreak,
            date: timestamp,
          });
        }
      }

      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(streak));
    }
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}

/**
 * Get streak data
 * @returns {Promise<object>}
 */
export async function getStreakData() {
  try {
    const streakJson = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
    return streakJson ? JSON.parse(streakJson) : {
      currentStreak: 0,
      longestStreak: 0,
      lastReadingDate: null,
      totalDaysActive: 0,
      milestones: [],
    };
  } catch (error) {
    console.error('Error getting streak data:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastReadingDate: null,
      totalDaysActive: 0,
      milestones: [],
    };
  }
}

/**
 * Update user tier based on reading count
 */
async function updateTier(readingCount) {
  try {
    // Find highest tier user has reached
    let currentTier = TIER_THRESHOLDS[0];
    for (const tier of TIER_THRESHOLDS) {
      if (readingCount >= tier.minReadings) {
        currentTier = tier;
      } else {
        break;
      }
    }

    const tierData = {
      tier: currentTier.tier,
      readingCount,
      color: currentTier.color,
      features: currentTier.features,
      nextTier: getNextTier(readingCount),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER_TIER, JSON.stringify(tierData));
  } catch (error) {
    console.error('Error updating tier:', error);
  }
}

/**
 * Get next tier info for progression display
 */
function getNextTier(readingCount) {
  for (const tier of TIER_THRESHOLDS) {
    if (readingCount < tier.minReadings) {
      return {
        tier: tier.tier,
        minReadings: tier.minReadings,
        readingsNeeded: tier.minReadings - readingCount,
      };
    }
  }
  return null; // Max tier reached
}

/**
 * Get user tier data
 * @returns {Promise<object>}
 */
export async function getUserTier() {
  try {
    const tierJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_TIER);
    return tierJson ? JSON.parse(tierJson) : {
      tier: 'Apprentice',
      readingCount: 0,
      color: 'dimCyan',
      features: ['basic_spreads'],
      nextTier: TIER_THRESHOLDS[1],
    };
  } catch (error) {
    console.error('Error getting user tier:', error);
    return {
      tier: 'Apprentice',
      readingCount: 0,
      color: 'dimCyan',
      features: ['basic_spreads'],
      nextTier: TIER_THRESHOLDS[1],
    };
  }
}

/**
 * Get insights based on patterns
 * These are REAL insights surfaced from actual data, not fake metrics
 * @returns {Promise<array>}
 */
export async function getInsights() {
  try {
    const history = await getReadingHistory({ limit: 100 });
    const tracker = await getCardTracker();
    const insights = [];

    if (history.length === 0) {
      return insights;
    }

    // Most frequent card
    const cardCounts = Object.entries(tracker)
      .filter(([cardName]) => cardName && cardName !== 'undefined') // Filter out undefined/null card names
      .sort((a, b) => b[1].appearances - a[1].appearances);

    if (cardCounts.length > 0) {
      const [mostFrequentCard, data] = cardCounts[0];
      insights.push({
        type: 'frequent_card',
        card: mostFrequentCard,
        count: data.appearances,
        message: `${mostFrequentCard} appears frequently in your readings (${data.appearances}x)`,
      });
    }

    // Reversed tendency
    const totalReversed = Object.values(tracker).reduce((sum, card) => sum + card.reversedCount, 0);
    const totalUpright = Object.values(tracker).reduce((sum, card) => sum + card.uprightCount, 0);
    const reversedPercentage = Math.round((totalReversed / (totalReversed + totalUpright)) * 100);

    if (reversedPercentage > 60) {
      insights.push({
        type: 'reversed_tendency',
        percentage: reversedPercentage,
        message: `${reversedPercentage}% of your cards appear reversed - consider what blocks or challenges you're working through`,
      });
    } else if (reversedPercentage < 30) {
      insights.push({
        type: 'upright_tendency',
        percentage: 100 - reversedPercentage,
        message: `${100 - reversedPercentage}% upright cards - your energy is flowing well`,
      });
    }

    // Reading time patterns (when do they read?)
    const readingTimes = history.map(r => new Date(r.timestamp).getHours());
    const avgHour = Math.round(readingTimes.reduce((sum, h) => sum + h, 0) / readingTimes.length);

    let timeOfDay = 'night';
    if (avgHour >= 5 && avgHour < 12) timeOfDay = 'morning';
    else if (avgHour >= 12 && avgHour < 17) timeOfDay = 'afternoon';
    else if (avgHour >= 17 && avgHour < 21) timeOfDay = 'evening';

    insights.push({
      type: 'reading_time',
      timeOfDay,
      message: `You often read in the ${timeOfDay} - your energy is consistent`,
    });

    // Cards never seen
    const allCards = 78; // Total tarot deck
    const uniqueCardsSeen = Object.keys(tracker).length;
    const explorationPercentage = Math.round((uniqueCardsSeen / allCards) * 100);

    insights.push({
      type: 'exploration',
      percentage: explorationPercentage,
      cardsRemaining: allCards - uniqueCardsSeen,
      message: `You've explored ${explorationPercentage}% of the deck (${uniqueCardsSeen}/78 cards)`,
    });

    return insights;
  } catch (error) {
    console.error('Error getting insights:', error);
    return [];
  }
}

/**
 * Get stats summary for display
 * @returns {Promise<object>}
 */
export async function getStatsSummary() {
  try {
    const history = await getReadingHistory();
    const streak = await getStreakData();
    const tier = await getUserTier();
    const insights = await getInsights();

    return {
      totalReadings: history.length,
      streak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      tier: tier.tier,
      tierColor: tier.color,
      nextTier: tier.nextTier,
      recentReadings: history.slice(0, 5),
      insights,
    };
  } catch (error) {
    console.error('Error getting stats summary:', error);
    return null;
  }
}

/**
 * Clear all data (for testing or user request)
 */
export async function clearAllData() {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.READING_HISTORY),
      AsyncStorage.removeItem(STORAGE_KEYS.STREAK_DATA),
      AsyncStorage.removeItem(STORAGE_KEYS.CARD_TRACKER),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_TIER),
      AsyncStorage.removeItem(STORAGE_KEYS.INSIGHTS),
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}
