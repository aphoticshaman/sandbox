/**
 * SIMPLE ANALYTICS TRACKER
 *
 * PostHog-based event tracking for VeilPath.
 * No Kafka. No MLflow. No vaporware.
 *
 * Integration: PostHog Cloud free tier (1M events/month)
 */

import Posthog from 'posthog-react-native';

// Singleton PostHog client
let posthogClient = null;
let isInitialized = false;

/**
 * Initialize PostHog (call once in App.js)
 *
 * @param {string} apiKey - Your PostHog API key (phc_...)
 * @param {string} host - PostHog host (default: https://app.posthog.com)
 */
export async function initAnalytics(apiKey, host = 'https://us.i.posthog.com') {
  if (isInitialized) {
    console.log('[Analytics] Already initialized');
    return posthogClient;
  }

  try {
    posthogClient = await Posthog.initAsync(apiKey, {
      host,
      // Capture app lifecycle events automatically
      captureApplicationLifecycleEvents: true,
      // Capture screen views automatically
      captureDeepLinks: true,
      // Flush events every 30 seconds
      flushInterval: 30,
      // Flush when we have 20 events queued
      flushAt: 20,
      // Enable debug logging in dev
      debug: __DEV__,
    });

    isInitialized = true;
    console.log('[Analytics] PostHog initialized');
    return posthogClient;
  } catch (error) {
    console.error('[Analytics] PostHog init failed:', error);
    return null;
  }
}

/**
 * Get the PostHog client (for direct access if needed)
 */
export function getPosthog() {
  return posthogClient;
}

/**
 * Track an event
 */
export function track(event, properties = {}) {
  if (posthogClient) {
    posthogClient.capture(event, {
      ...properties,
      timestamp: Date.now(),
    });
  }

  // Also log in dev for debugging
  if (__DEV__) {
    console.log('[Analytics]', event, properties);
  }
}

/**
 * Identify a user (call on login/signup)
 */
export function identify(userId, traits = {}) {
  if (posthogClient) {
    posthogClient.identify(userId, traits);
  }
}

/**
 * Reset identity (call on logout)
 */
export function reset() {
  if (posthogClient) {
    posthogClient.reset();
  }
}

/**
 * Screen view tracking
 */
export function trackScreen(screenName, properties = {}) {
  if (posthogClient) {
    posthogClient.screen(screenName, properties);
  }
}

// ═══════════════════════════════════════════════════════════════
// CORE EVENTS (10 events that matter)
// ═══════════════════════════════════════════════════════════════

/**
 * User completed signup/onboarding
 */
export function trackSignupCompleted(method = 'email') {
  track('signup_completed', { method });
}

/**
 * Reading started
 */
export function trackReadingStarted(spreadType, intention = '') {
  track('reading_started', {
    spread_type: spreadType,
    has_intention: intention.length > 0,
    intention_length: intention.length,
  });
}

/**
 * Reading completed (user saw all cards)
 */
export function trackReadingCompleted(spreadType, cardCount, durationMs) {
  track('reading_completed', {
    spread_type: spreadType,
    card_count: cardCount,
    duration_seconds: Math.round(durationMs / 1000),
  });
}

/**
 * Reading abandoned (user left before completion)
 */
export function trackReadingAbandoned(spreadType, cardsRevealed, durationMs) {
  track('reading_abandoned', {
    spread_type: spreadType,
    cards_revealed: cardsRevealed,
    duration_seconds: Math.round(durationMs / 1000),
  });
}

/**
 * Journal entry created
 */
export function trackJournalCreated(wordCount, hasMood, hasPrompt) {
  track('journal_entry_created', {
    word_count: wordCount,
    has_mood: hasMood,
    has_prompt: hasPrompt,
  });
}

/**
 * Journal entry abandoned (started but not saved)
 */
export function trackJournalAbandoned(wordCount, durationMs) {
  track('journal_entry_abandoned', {
    word_count: wordCount,
    duration_seconds: Math.round(durationMs / 1000),
  });
}

/**
 * Vera message sent
 */
export function trackVeraMessage(messageLength, personality) {
  track('vera_message_sent', {
    message_length: messageLength,
    personality: personality,
  });
}

/**
 * Streak updated
 */
export function trackStreakUpdated(currentStreak, longestStreak) {
  track('streak_updated', {
    current_streak: currentStreak,
    longest_streak: longestStreak,
  });
}

/**
 * Subscription started
 */
export function trackSubscriptionStarted(tier, source) {
  track('subscription_started', {
    tier: tier,
    source: source,
  });
}

/**
 * Subscription cancelled
 */
export function trackSubscriptionCancelled(tier, daysActive, reason = '') {
  track('subscription_cancelled', {
    tier: tier,
    days_active: daysActive,
    reason: reason,
  });
}

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════

export default {
  init: initAnalytics,
  track,
  identify,
  reset,
  trackScreen,
  getPosthog,
  // Core events
  trackSignupCompleted,
  trackReadingStarted,
  trackReadingCompleted,
  trackReadingAbandoned,
  trackJournalCreated,
  trackJournalAbandoned,
  trackVeraMessage,
  trackStreakUpdated,
  trackSubscriptionStarted,
  trackSubscriptionCancelled,
};
