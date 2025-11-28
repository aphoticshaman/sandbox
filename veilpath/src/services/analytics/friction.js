/**
 * CASIMIR LITE - FRICTION TRACKING
 *
 * Simple friction event tracking based on Casimir Patent #544.
 * No ML. No "self-optimizing" anything. Just event logging with complexity scores.
 *
 * Analyze in PostHog later. Build features when you have data.
 */

import { track } from './simpleTracker';

// ═══════════════════════════════════════════════════════════════
// FRICTION COMPLEXITY SCORES
// Higher = worse user experience
// ═══════════════════════════════════════════════════════════════

const FRICTION_COMPLEXITY = {
  // Reading friction
  reading_abandoned: 25,        // Started reading, left before completion
  card_reveal_skip: 10,         // Skipped past a card quickly
  spread_restart: 15,           // Started over mid-reading

  // Journal friction
  journal_abandoned: 20,        // Started writing, didn't save
  journal_deleted: 15,          // Deleted an entry
  prompt_skipped: 5,            // Dismissed a prompt without using it

  // Vera friction
  vera_skipped: 10,           // Opened Vera, left without messaging
  vera_negative: 15,          // Sent negative/frustrated message
  vera_rapid_exit: 20,        // Quick exit after Vera response

  // Navigation friction
  rapid_back_navigation: 10,    // Hit back button quickly after arriving
  rage_tap: 25,                 // Multiple rapid taps (frustration signal)
  long_pause: 5,                // Extended pause (confusion signal)

  // Onboarding friction
  onboarding_skipped: 30,       // Skipped onboarding
  tutorial_dismissed: 15,       // Dismissed help/tutorial

  // Subscription friction
  paywall_bounce: 20,           // Hit paywall and left
  subscription_cancelled: 35,   // Cancelled subscription

  // Error friction
  error_encountered: 25,        // App showed error
  crash_recovered: 40,          // App crashed and restarted

  // Feedback friction
  negative_rating: 30,          // Gave negative rating/feedback
  support_ticket: 25,           // Contacted support
};

// Session state
let sessionStartTime = Date.now();
let interactionCount = 0;

/**
 * Start a new session (call on app open)
 */
export function startSession() {
  sessionStartTime = Date.now();
  interactionCount = 0;
}

/**
 * Increment interaction count (call on any user action)
 */
export function recordInteraction() {
  interactionCount++;
}

/**
 * Get current session duration in seconds
 */
export function getSessionDuration() {
  return Math.round((Date.now() - sessionStartTime) / 1000);
}

/**
 * Get interaction count for current session
 */
export function getInteractionCount() {
  return interactionCount;
}

/**
 * Track a friction event
 *
 * @param {string} type - One of the FRICTION_COMPLEXITY keys
 * @param {string} context - Where in the app this happened
 * @param {object} metadata - Additional context
 */
export function trackFriction(type, context, metadata = {}) {
  const complexity = FRICTION_COMPLEXITY[type] || 10;

  track('friction_event', {
    friction_type: type,
    complexity,
    context,
    session_duration_seconds: getSessionDuration(),
    interaction_count: getInteractionCount(),
    ...metadata,
  });

  // Log in dev for debugging
  if (__DEV__) {
    console.log(`[Friction] ${type} (${complexity}) @ ${context}`, metadata);
  }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Track reading abandonment
 */
export function trackReadingAbandonment(spreadType, cardsRevealed) {
  trackFriction('reading_abandoned', 'reading', {
    spread_type: spreadType,
    cards_revealed: cardsRevealed,
  });
}

/**
 * Track journal abandonment
 */
export function trackJournalAbandonment(wordCount) {
  trackFriction('journal_abandoned', 'journal', {
    word_count: wordCount,
  });
}

/**
 * Track Vera skip (opened but didn't message)
 */
export function trackVeraSkip(durationMs) {
  trackFriction('vera_skipped', 'vera', {
    duration_seconds: Math.round(durationMs / 1000),
  });
}

/**
 * Track rapid back navigation (user confusion/wrong screen)
 */
export function trackRapidBackNavigation(screenName, durationMs) {
  if (durationMs < 3000) { // Less than 3 seconds on screen
    trackFriction('rapid_back_navigation', screenName, {
      duration_seconds: Math.round(durationMs / 1000),
    });
  }
}

/**
 * Track paywall bounce
 */
export function trackPaywallBounce(feature) {
  trackFriction('paywall_bounce', 'paywall', {
    feature_requested: feature,
  });
}

/**
 * Track error encountered
 */
export function trackError(errorType, screenName) {
  trackFriction('error_encountered', screenName, {
    error_type: errorType,
  });
}

/**
 * Track app crash recovery
 */
export function trackCrashRecovery() {
  trackFriction('crash_recovered', 'app', {});
}

// ═══════════════════════════════════════════════════════════════
// RAGE TAP DETECTION
// ═══════════════════════════════════════════════════════════════

let recentTaps = [];
const RAGE_TAP_THRESHOLD = 5; // taps
const RAGE_TAP_WINDOW = 1000; // ms

/**
 * Record a tap and detect rage tapping
 */
export function recordTap() {
  const now = Date.now();

  // Remove taps older than the window
  recentTaps = recentTaps.filter(t => now - t < RAGE_TAP_WINDOW);

  // Add this tap
  recentTaps.push(now);

  // Check for rage tap
  if (recentTaps.length >= RAGE_TAP_THRESHOLD) {
    trackFriction('rage_tap', 'unknown', {
      tap_count: recentTaps.length,
    });
    recentTaps = []; // Reset after detecting
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  startSession,
  recordInteraction,
  getSessionDuration,
  getInteractionCount,
  trackFriction,
  // Convenience
  trackReadingAbandonment,
  trackJournalAbandonment,
  trackVeraSkip,
  trackRapidBackNavigation,
  trackPaywallBounce,
  trackError,
  trackCrashRecovery,
  recordTap,
  // Expose complexity scores for reference
  FRICTION_COMPLEXITY,
};
