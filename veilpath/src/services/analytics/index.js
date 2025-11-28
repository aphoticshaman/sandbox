/**
 * VEILPATH ANALYTICS - UNIFIED ANALYTICS ENGINE
 *
 * Complete analytics stack with self-feeding learning loop:
 * - PostHog Cloud for event tracking
 * - UX-SDPM for archetype classification
 * - Casimir for friction analysis
 * - VeilAnalytics unified service
 * - AdAssetManager for house ads → network ads
 * - RatchetLoop for only-forward improvements
 * - MetaLearner for code-that-teaches-code-to-learn
 *
 * Patents Utilized:
 * - PSAN Tri-Fork (#63/925,504): Multi-domain integration
 * - Kuramoto Flow Detection (#63/925,467): SDPM vectors
 * - Casimir (#544): Failure-as-signal analytics
 * - K×f Pruning: Beam search optimization
 *
 * Scale Strategy:
 * - 0-1K: All house ads, PostHog free tier
 * - 1K-10K: Mixed ads, RatchetLoop tuning
 * - 10K+: Targeted ads, sell anonymized engagement data
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE TRACKER (PostHog)
// ═══════════════════════════════════════════════════════════════════════════

export {
  initAnalytics,
  track,
  identify,
  reset,
  trackScreen,
  getPosthog,
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
} from './simpleTracker';

// ═══════════════════════════════════════════════════════════════════════════
// UX-SDPM ARCHETYPES
// ═══════════════════════════════════════════════════════════════════════════

export {
  computeArchetypeVector,
  classifyArchetype,
  getArchetypeDetails,
  computeUserArchetype,
} from './archetypes';

// ═══════════════════════════════════════════════════════════════════════════
// CASIMIR FRICTION TRACKING
// ═══════════════════════════════════════════════════════════════════════════

export {
  startSession,
  recordInteraction,
  trackFriction,
  trackReadingAbandonment,
  trackJournalAbandonment,
  trackVeraSkip,
  trackRapidBackNavigation,
  trackPaywallBounce,
  trackError,
  trackCrashRecovery,
  recordTap,
  FRICTION_COMPLEXITY,
} from './friction';

// Full Casimir Analyzer
export {
  CasimirFrictionAnalyzer,
  getCasimirAnalyzer,
  logFrictionEvent,
  FRICTION_TYPES,
  FRICTION_CONTEXTS,
} from './CasimirFrictionAnalyzer';

// ═══════════════════════════════════════════════════════════════════════════
// VEILANALYTICS UNIFIED SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export {
  getVeilAnalytics,
  initVeilAnalytics,
  AD_TYPES,
  AD_PLACEMENTS,
  ENGAGEMENT_LEVELS,
} from './VeilAnalytics';

// ═══════════════════════════════════════════════════════════════════════════
// AD ASSET MANAGER
// ═══════════════════════════════════════════════════════════════════════════

export {
  getAdAssetManager,
  initAdAssetManager,
  HOUSE_VIDEO_ADS,
  HOUSE_STATIC_ADS,
} from './AdAssetManager';

// ═══════════════════════════════════════════════════════════════════════════
// RATCHET LOOP (Only-Forward Learning)
// ═══════════════════════════════════════════════════════════════════════════

export {
  getRatchetLoop,
  initRatchetLoop,
  RATCHET_METRICS,
  ADAPTATION_DOMAINS,
} from './RatchetLoop';

// ═══════════════════════════════════════════════════════════════════════════
// META-LEARNER (Code Teaching Code)
// ═══════════════════════════════════════════════════════════════════════════

export {
  getMetaLearner,
  initMetaLearner,
  SIGNAL_TYPES,
  LEARNING_DOMAINS,
  RBRSTree,
  QAOAOptimizer,
} from './MetaLearner';

// ═══════════════════════════════════════════════════════════════════════════
// VALUE ARCHITECT (Financial Intelligence for Ryan)
// ═══════════════════════════════════════════════════════════════════════════

export {
  getValueArchitect,
  initValueArchitect,
  REVENUE_STREAMS,
  COST_CENTERS,
} from './ValueArchitect';

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

import { initAnalytics } from './simpleTracker';
import { initVeilAnalytics, getVeilAnalytics } from './VeilAnalytics';
import { initAdAssetManager } from './AdAssetManager';
import { initRatchetLoop } from './RatchetLoop';
import { initMetaLearner } from './MetaLearner';
import { initValueArchitect, getValueArchitect } from './ValueArchitect';

/**
 * Initialize entire analytics stack
 *
 * @param {object} config - Configuration
 * @param {string} config.posthogApiKey - PostHog API key
 * @param {string} config.userId - User ID (optional)
 * @param {string} config.userArchetype - User archetype (optional)
 * @param {boolean} config.isPremium - Is user premium (optional)
 */
export async function initAnalyticsStack(config = {}) {
  const {
    posthogApiKey,
    userId = null,
    userArchetype = 'casual_user',
    isPremium = false,
  } = config;

  console.log('[Analytics] Initializing full analytics stack...');

  // 1. PostHog (base tracking)
  if (posthogApiKey) {
    await initAnalytics(posthogApiKey);
  }

  // 2. VeilAnalytics (unified service)
  const veilAnalytics = await initVeilAnalytics(userId);

  // 3. AdAssetManager (house ads)
  await initAdAssetManager(userArchetype, isPremium);

  // 4. RatchetLoop (learning engine)
  await initRatchetLoop();

  // 5. MetaLearner (code-teaching-code)
  await initMetaLearner();

  // 6. ValueArchitect (financial intelligence for Ryan)
  const valueArchitect = await initValueArchitect();

  console.log('[Analytics] Full stack initialized');

  return { veilAnalytics, valueArchitect };
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

import simpleTracker from './simpleTracker';
import archetypes from './archetypes';
import friction from './friction';
import VeilAnalytics from './VeilAnalytics';
import AdAssetManager from './AdAssetManager';
import RatchetLoop from './RatchetLoop';
import MetaLearner from './MetaLearner';
import ValueArchitect from './ValueArchitect';

export default {
  // Simple tracker methods
  ...simpleTracker,
  ...archetypes,
  ...friction,

  // Classes
  VeilAnalytics,
  AdAssetManager,
  RatchetLoop,
  MetaLearner,
  ValueArchitect,

  // Unified init
  initAnalyticsStack,
};
