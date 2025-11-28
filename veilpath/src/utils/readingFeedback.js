/**
 * READING FEEDBACK TRACKER
 * Collects user feedback to refine geometric embeddings over time
 *
 * Future use: Learn which card combinations resonate most
 * - Track card co-occurrences that get high ratings
 * - Adjust embeddings to bring resonant cards closer together
 * - Personalize semantic space per user
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FEEDBACK_KEY = '@veilpath_reading_feedback';
const USER_CARD_HISTORY_KEY = '@veilpath_card_history';

/**
 * Save reading feedback
 * @param {Object} feedback - { readingId, rating, cards, helpful, timestamp }
 */
export async function saveReadingFeedback(feedback) {
  try {
    const existingData = await AsyncStorage.getItem(FEEDBACK_KEY);
    const feedbackHistory = existingData ? JSON.parse(existingData) : [];

    const feedbackEntry = {
      id: Date.now().toString(),
      ...feedback,
      timestamp: new Date().toISOString()
    };

    feedbackHistory.push(feedbackEntry);

    // Keep only last 100 feedback entries (prevent storage bloat)
    if (feedbackHistory.length > 100) {
      feedbackHistory.shift();
    }

    await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbackHistory));

    // Also update card co-occurrence matrix
    if (feedback.rating >= 4 && feedback.cards) {
      await trackCardCoOccurrence(feedback.cards, feedback.rating);
    }

    return true;
  } catch (error) {
    console.error('[Feedback] Save error:', error);
    return false;
  }
}

/**
 * Track which cards appear together in highly-rated readings
 * This will be used to learn user-specific semantic spaces
 */
async function trackCardCoOccurrence(cards, rating) {
  try {
    const historyData = await AsyncStorage.getItem(USER_CARD_HISTORY_KEY);
    const cardHistory = historyData ? JSON.parse(historyData) : {
      coOccurrences: {}, // { "cardIndex1-cardIndex2": { count, avgRating } }
      cardRatings: {} // { "cardIndex": { count, avgRating } }
    };

    // Track individual card ratings
    cards.forEach(card => {
      const key = card.cardIndex.toString();
      if (!cardHistory.cardRatings[key]) {
        cardHistory.cardRatings[key] = { count: 0, totalRating: 0, avgRating: 0 };
      }
      cardHistory.cardRatings[key].count++;
      cardHistory.cardRatings[key].totalRating += rating;
      cardHistory.cardRatings[key].avgRating =
        cardHistory.cardRatings[key].totalRating / cardHistory.cardRatings[key].count;
    });

    // Track card co-occurrences (pairwise)
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const card1 = Math.min(cards[i].cardIndex, cards[j].cardIndex);
        const card2 = Math.max(cards[i].cardIndex, cards[j].cardIndex);
        const key = `${card1}-${card2}`;

        if (!cardHistory.coOccurrences[key]) {
          cardHistory.coOccurrences[key] = { count: 0, totalRating: 0, avgRating: 0 };
        }
        cardHistory.coOccurrences[key].count++;
        cardHistory.coOccurrences[key].totalRating += rating;
        cardHistory.coOccurrences[key].avgRating =
          cardHistory.coOccurrences[key].totalRating / cardHistory.coOccurrences[key].count;
      }
    }

    await AsyncStorage.setItem(USER_CARD_HISTORY_KEY, JSON.stringify(cardHistory));
    return true;
  } catch (error) {
    console.error('[Feedback] Co-occurrence tracking error:', error);
    return false;
  }
}

/**
 * Get all feedback history
 */
export async function getFeedbackHistory() {
  try {
    const data = await AsyncStorage.getItem(FEEDBACK_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Feedback] Get history error:', error);
    return [];
  }
}

/**
 * Get user's card co-occurrence patterns
 * Returns highly-rated card pairs that could inform personalized embeddings
 */
export async function getCardCoOccurrencePatterns() {
  try {
    const data = await AsyncStorage.getItem(USER_CARD_HISTORY_KEY);
    if (!data) return null;

    const history = JSON.parse(data);

    // Find card pairs with high ratings and multiple occurrences
    const strongPairs = Object.entries(history.coOccurrences || {})
      .filter(([key, data]) => data.count >= 2 && data.avgRating >= 4)
      .map(([key, data]) => ({
        cardPair: key.split('-').map(Number),
        count: data.count,
        avgRating: data.avgRating
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    // Find individually highly-rated cards
    const favoriteCards = Object.entries(history.cardRatings || {})
      .filter(([key, data]) => data.count >= 3 && data.avgRating >= 4)
      .map(([key, data]) => ({
        cardIndex: Number(key),
        count: data.count,
        avgRating: data.avgRating
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    return {
      strongPairs,
      favoriteCards,
      totalReadings: Object.values(history.cardRatings || {}).reduce((sum, c) => sum + c.count, 0)
    };
  } catch (error) {
    console.error('[Feedback] Get patterns error:', error);
    return null;
  }
}

/**
 * Get average rating for a specific reading
 */
export async function getReadingRating(readingId) {
  try {
    const history = await getFeedbackHistory();
    const feedback = history.find(f => f.readingId === readingId);
    return feedback ? feedback.rating : null;
  } catch (error) {
    console.error('[Feedback] Get rating error:', error);
    return null;
  }
}

/**
 * Calculate overall user satisfaction metrics
 */
export async function getUserSatisfactionMetrics() {
  try {
    const history = await getFeedbackHistory();
    if (history.length === 0) return null;

    const totalRatings = history.length;
    const avgRating = history.reduce((sum, f) => sum + f.rating, 0) / totalRatings;
    const helpfulCount = history.filter(f => f.helpful).length;
    const helpfulPercentage = (helpfulCount / totalRatings) * 100;

    // Rating distribution
    const distribution = {
      5: history.filter(f => f.rating === 5).length,
      4: history.filter(f => f.rating === 4).length,
      3: history.filter(f => f.rating === 3).length,
      2: history.filter(f => f.rating === 2).length,
      1: history.filter(f => f.rating === 1).length
    };

    return {
      totalRatings,
      avgRating: avgRating.toFixed(2),
      helpfulPercentage: helpfulPercentage.toFixed(1),
      distribution,
      recentTrend: calculateRecentTrend(history)
    };
  } catch (error) {
    console.error('[Feedback] Get metrics error:', error);
    return null;
  }
}

/**
 * Calculate trend (are recent readings better or worse than historical average?)
 */
function calculateRecentTrend(history) {
  if (history.length < 5) return 'insufficient_data';

  const recentCount = Math.min(5, history.length);
  const recent = history.slice(-recentCount);
  const historical = history.slice(0, -recentCount);

  const recentAvg = recent.reduce((sum, f) => sum + f.rating, 0) / recentCount;
  const historicalAvg = historical.reduce((sum, f) => sum + f.rating, 0) / historical.length;

  if (recentAvg > historicalAvg + 0.5) return 'improving';
  if (recentAvg < historicalAvg - 0.5) return 'declining';
  return 'stable';
}

/**
 * FUTURE: Refine geometric embeddings based on feedback
 * This will analyze card co-occurrences and adjust 3D positions
 * to bring highly-rated card pairs closer together in semantic space
 */
export async function refineEmbeddingsFromFeedback() {
  // TODO: Implement embedding refinement
  // 1. Get card co-occurrence patterns
  // 2. For each highly-rated pair, nudge embeddings closer
  // 3. Use gradient descent to minimize distance between resonant pairs
  // 4. Store personalized embeddings per user

  console.warn('[Feedback] Embedding refinement not yet implemented');
  return null;
}
