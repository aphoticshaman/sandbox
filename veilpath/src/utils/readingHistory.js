/**
 * READING HISTORY TRACKER
 * Automatically tracks all readings (even unsaved ones) for analytics and pattern detection
 *
 * Purpose:
 * - Learn which cards users draw most frequently
 * - Detect reading patterns over time
 * - Track spread type preferences
 * - Analyze reading frequency (daily, weekly, etc.)
 * - Identify card co-occurrence patterns
 *
 * This is separate from saved readings - this tracks EVERYTHING for analytics.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@veilpath_reading_history';
const CARD_USAGE_KEY = '@veilpath_card_usage';
const MAX_HISTORY_ENTRIES = 200; // Keep last 200 readings

/**
 * Track a reading in the history
 * @param {Object} reading - { readingId, cards, readingType, spreadType, timestamp }
 */
export async function trackReading(reading) {
  try {
    // Track in main history
    await addToHistory(reading);

    // Track card usage statistics
    await updateCardUsageStats(reading.cards);

    return true;
  } catch (error) {
    console.error('[ReadingHistory] Track error:', error);
    return false;
  }
}

/**
 * Add reading to main history log
 */
async function addToHistory(reading) {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    const history = data ? JSON.parse(data) : [];

    const entry = {
      id: reading.readingId || `reading_${Date.now()}`,
      timestamp: reading.timestamp || new Date().toISOString(),
      readingType: reading.readingType || 'General',
      spreadType: reading.spreadType || 'Unknown',
      cardCount: reading.cards?.length || 0,
      cardIndices: reading.cards?.map(c => c.cardIndex) || [],
    };

    history.push(entry);

    // Keep only last MAX_HISTORY_ENTRIES
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.splice(0, history.length - MAX_HISTORY_ENTRIES);
    }

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('[ReadingHistory] Add to history error:', error);
    return false;
  }
}

/**
 * Update card usage statistics
 * Tracks:
 * - How many times each card has been drawn
 * - Last drawn timestamp for each card
 * - Co-occurrence patterns (which cards appear together)
 */
async function updateCardUsageStats(cards) {
  try {
    const data = await AsyncStorage.getItem(CARD_USAGE_KEY);
    const stats = data ? JSON.parse(data) : {
      cardCounts: {}, // { cardIndex: { count, lastDrawn } }
      coOccurrences: {}, // { "cardIndex1-cardIndex2": count }
      totalReadings: 0,
    };

    const now = new Date().toISOString();

    // Update individual card counts
    cards?.forEach(card => {
      const idx = card.cardIndex.toString();
      if (!stats.cardCounts[idx]) {
        stats.cardCounts[idx] = { count: 0, lastDrawn: null };
      }
      stats.cardCounts[idx].count++;
      stats.cardCounts[idx].lastDrawn = now;
    });

    // Update co-occurrence matrix (pairwise)
    if (cards && cards.length > 1) {
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const card1 = Math.min(cards[i].cardIndex, cards[j].cardIndex);
          const card2 = Math.max(cards[i].cardIndex, cards[j].cardIndex);
          const key = `${card1}-${card2}`;

          if (!stats.coOccurrences[key]) {
            stats.coOccurrences[key] = 0;
          }
          stats.coOccurrences[key]++;
        }
      }
    }

    stats.totalReadings++;

    await AsyncStorage.setItem(CARD_USAGE_KEY, JSON.stringify(stats));
    return true;
  } catch (error) {
    console.error('[ReadingHistory] Card usage stats error:', error);
    return false;
  }
}

/**
 * Get full reading history
 * @returns {Array} Array of reading entries
 */
export async function getReadingHistory() {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[ReadingHistory] Get history error:', error);
    return [];
  }
}

/**
 * Get card usage statistics
 * @returns {Object} { cardCounts, coOccurrences, totalReadings }
 */
export async function getCardUsageStats() {
  try {
    const data = await AsyncStorage.getItem(CARD_USAGE_KEY);
    return data ? JSON.parse(data) : { cardCounts: {}, coOccurrences: {}, totalReadings: 0 };
  } catch (error) {
    console.error('[ReadingHistory] Get stats error:', error);
    return { cardCounts: {}, coOccurrences: {}, totalReadings: 0 };
  }
}

/**
 * Get most frequently drawn cards
 * @param {number} limit - How many top cards to return
 * @returns {Array} Array of { cardIndex, count, lastDrawn }
 */
export async function getMostFrequentCards(limit = 10) {
  try {
    const stats = await getCardUsageStats();
    const sorted = Object.entries(stats.cardCounts || {})
      .map(([cardIndex, data]) => ({
        cardIndex: Number(cardIndex),
        count: data.count,
        lastDrawn: data.lastDrawn,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted;
  } catch (error) {
    console.error('[ReadingHistory] Get frequent cards error:', error);
    return [];
  }
}

/**
 * Get most common card pairs (co-occurrences)
 * @param {number} limit - How many top pairs to return
 * @returns {Array} Array of { cardPair: [index1, index2], count }
 */
export async function getMostFrequentPairs(limit = 10) {
  try {
    const stats = await getCardUsageStats();
    const sorted = Object.entries(stats.coOccurrences || {})
      .map(([key, count]) => ({
        cardPair: key.split('-').map(Number),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted;
  } catch (error) {
    console.error('[ReadingHistory] Get frequent pairs error:', error);
    return [];
  }
}

/**
 * Get reading frequency analysis
 * @returns {Object} { total, thisWeek, thisMonth, avgPerWeek }
 */
export async function getReadingFrequency() {
  try {
    const history = await getReadingHistory();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = history.filter(r => new Date(r.timestamp) >= oneWeekAgo).length;
    const thisMonth = history.filter(r => new Date(r.timestamp) >= oneMonthAgo).length;

    // Calculate average per week (based on time since first reading)
    let avgPerWeek = 0;
    if (history.length > 0) {
      const firstReading = new Date(history[0].timestamp);
      const daysSinceFirst = (now - firstReading) / (1000 * 60 * 60 * 24);
      const weeksSinceFirst = Math.max(daysSinceFirst / 7, 1); // At least 1 week
      avgPerWeek = (history.length / weeksSinceFirst).toFixed(1);
    }

    return {
      total: history.length,
      thisWeek,
      thisMonth,
      avgPerWeek: parseFloat(avgPerWeek),
    };
  } catch (error) {
    console.error('[ReadingHistory] Get frequency error:', error);
    return { total: 0, thisWeek: 0, thisMonth: 0, avgPerWeek: 0 };
  }
}

/**
 * Get reading type distribution
 * @returns {Object} { readingType: count }
 */
export async function getReadingTypeDistribution() {
  try {
    const history = await getReadingHistory();
    const distribution = {};

    history.forEach(r => {
      const type = r.readingType || 'General';
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return distribution;
  } catch (error) {
    console.error('[ReadingHistory] Get type distribution error:', error);
    return {};
  }
}

/**
 * Get spread type distribution
 * @returns {Object} { spreadType: count }
 */
export async function getSpreadTypeDistribution() {
  try {
    const history = await getReadingHistory();
    const distribution = {};

    history.forEach(r => {
      const type = r.spreadType || 'Unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return distribution;
  } catch (error) {
    console.error('[ReadingHistory] Get spread distribution error:', error);
    return {};
  }
}

/**
 * Clear all reading history (for privacy/reset)
 */
export async function clearReadingHistory() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
    await AsyncStorage.removeItem(CARD_USAGE_KEY);
    return true;
  } catch (error) {
    console.error('[ReadingHistory] Clear history error:', error);
    return false;
  }
}

/**
 * FUTURE: Export data for embedding refinement
 * Returns card co-occurrence patterns that can be used to adjust
 * geometric embeddings (bring frequently paired cards closer together)
 */
export async function getEmbeddingRefinementData() {
  try {
    const stats = await getCardUsageStats();
    const frequentPairs = await getMostFrequentPairs(50);
    const frequentCards = await getMostFrequentCards(20);

    return {
      totalReadings: stats.totalReadings,
      frequentCards,
      frequentPairs,
      // This data can be used to:
      // 1. Nudge embeddings for frequently paired cards closer together
      // 2. Weight certain cards higher in semantic space based on user preference
      // 3. Create user-specific semantic spaces over time
    };
  } catch (error) {
    console.error('[ReadingHistory] Get refinement data error:', error);
    return null;
  }
}
