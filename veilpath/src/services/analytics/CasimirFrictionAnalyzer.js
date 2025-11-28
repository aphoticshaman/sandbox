/**
 * Casimir Friction Analyzer - Patent #544
 * Failure-as-Signal Analytics for Vera Adaptation
 *
 * Core insight: User friction events (abandonments, skips, negative feedback)
 * are information, not just noise. By measuring the "complexity" of failures,
 * we can distinguish between:
 * - Low complexity: User-specific issues (distraction, preference)
 * - High complexity: Systemic issues (bad prompts, confusing UX)
 *
 * Named after Casimir effect - extracting value from apparent vacuum/nothing.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@veilpath_casimir_friction_log';
const MAX_LOG_SIZE = 100;

/**
 * Friction event types
 */
export const FRICTION_TYPES = {
  ABANDON: 'abandon',           // User started something and left
  SKIP: 'skip',                 // User explicitly skipped/dismissed
  NEGATIVE_FEEDBACK: 'negative_feedback', // User disliked response
  LONG_PAUSE: 'long_pause',     // Extended inactivity mid-flow
  RAPID_EXIT: 'rapid_exit',     // Left quickly after action
  RETRY: 'retry',               // User re-attempted same action
  BACK_NAVIGATION: 'back_nav',  // Went back instead of forward
};

/**
 * Context types for friction events
 */
export const FRICTION_CONTEXTS = {
  JOURNALING: 'journaling',
  ORACLE_CHAT: 'vera_chat',
  READING: 'reading',
  ONBOARDING: 'onboarding',
  SETTINGS: 'settings',
  SHOP: 'shop',
};

/**
 * Casimir Friction Analyzer
 * Tracks user friction and triggers adaptive responses
 */
export class CasimirFrictionAnalyzer {
  constructor() {
    this.frictionLog = [];
    this.e0Floor = 100; // Initial complexity floor (updates with data)
    this.adaptationCallbacks = [];
    this.initialized = false;
  }

  /**
   * Initialize analyzer - load historical data
   */
  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.frictionLog = data.frictionLog || [];
        this.e0Floor = data.e0Floor || 100;
      }
      this.initialized = true;
    } catch (error) {
      console.error('[Casimir] Failed to initialize:', error);
      this.initialized = true;
    }
  }

  /**
   * Log a friction event and compute its complexity
   *
   * @param {Object} event - Friction event
   * @param {string} event.type - Type from FRICTION_TYPES
   * @param {string} event.context - Context from FRICTION_CONTEXTS
   * @param {Object} event.sessionData - Session state at friction point
   */
  async logFriction(event) {
    if (!this.initialized) await this.initialize();

    const {
      type,
      context,
      sessionData = {}
    } = event;

    // Compute complexity score
    const complexityScore = this.computeComplexity(type, context, sessionData);

    const fullEvent = {
      type,
      context,
      complexityScore,
      timestamp: Date.now(),
      sessionData: this.sanitizeSessionData(sessionData)
    };

    this.frictionLog.push(fullEvent);

    // Update E0 floor if this is simpler than previous
    if (complexityScore < this.e0Floor && complexityScore > 0) {
      this.e0Floor = complexityScore;
      console.log(`[Casimir] New complexity floor: ${this.e0Floor}`);
    }

    // Trim log
    if (this.frictionLog.length > MAX_LOG_SIZE) {
      this.frictionLog = this.frictionLog.slice(-MAX_LOG_SIZE);
    }

    // Persist
    await this.persist();

    // Analyze and trigger adaptations
    this.analyzeAndAdapt();

    return fullEvent;
  }

  /**
   * Compute complexity of a friction event
   * Uses heuristics as proxy for Kolmogorov complexity
   *
   * @param {string} type - Friction type
   * @param {string} context - Friction context
   * @param {Object} sessionData - Session state
   * @returns {number} Complexity score
   */
  computeComplexity(type, context, sessionData) {
    let complexity = 0;

    // Base complexity by type
    const typeComplexity = {
      [FRICTION_TYPES.ABANDON]: 20,
      [FRICTION_TYPES.SKIP]: 10,
      [FRICTION_TYPES.NEGATIVE_FEEDBACK]: 15,
      [FRICTION_TYPES.LONG_PAUSE]: 5,
      [FRICTION_TYPES.RAPID_EXIT]: 25,
      [FRICTION_TYPES.RETRY]: 12,
      [FRICTION_TYPES.BACK_NAVIGATION]: 8,
    };
    complexity += typeComplexity[type] || 10;

    // Context multiplier
    const contextMultiplier = {
      [FRICTION_CONTEXTS.JOURNALING]: 1.2,     // Journal abandons are significant
      [FRICTION_CONTEXTS.ORACLE_CHAT]: 1.3,    // Chat friction very important
      [FRICTION_CONTEXTS.READING]: 1.1,
      [FRICTION_CONTEXTS.ONBOARDING]: 1.5,     // Onboarding friction is critical
      [FRICTION_CONTEXTS.SETTINGS]: 0.8,
      [FRICTION_CONTEXTS.SHOP]: 0.9,
    };
    complexity *= contextMultiplier[context] || 1;

    // Add complexity for abandoned content
    if (sessionData.draftContent) {
      // More content = more invested = more significant friction
      const contentLength = sessionData.draftContent.length;
      complexity += Math.log2(contentLength + 1) * 2;
    }

    // Add complexity for time invested
    if (sessionData.timeOnScreen) {
      // Longer time = more invested
      const minutes = sessionData.timeOnScreen / 60000;
      if (minutes > 1) {
        complexity += Math.log2(minutes) * 5;
      }
    }

    // Add complexity for interaction depth
    if (sessionData.interactionCount) {
      complexity += sessionData.interactionCount * 0.5;
    }

    // Add complexity for conversation depth in chat
    if (sessionData.messageCount) {
      complexity += sessionData.messageCount * 2;
    }

    return Math.round(complexity * 10) / 10;
  }

  /**
   * Sanitize session data for storage (remove sensitive/large data)
   */
  sanitizeSessionData(data) {
    return {
      timeOnScreen: data.timeOnScreen,
      interactionCount: data.interactionCount,
      messageCount: data.messageCount,
      draftLength: data.draftContent?.length || 0,
      readingType: data.readingType,
      screenName: data.screenName
    };
  }

  /**
   * Analyze friction patterns and trigger adaptations
   */
  analyzeAndAdapt() {
    const recentFriction = this.frictionLog.slice(-20);
    if (recentFriction.length < 5) return;

    const adaptations = [];

    // Pattern 1: Repeated journal abandons → simplify prompts
    const journalAbandons = recentFriction.filter(
      e => e.type === FRICTION_TYPES.ABANDON && e.context === FRICTION_CONTEXTS.JOURNALING
    );
    if (journalAbandons.length >= 3) {
      adaptations.push({
        action: 'simplify_journal_prompts',
        confidence: journalAbandons.length / 5,
        reason: `${journalAbandons.length} journal abandons detected`
      });
    }

    // Pattern 2: Vera chat skips → responses too long/abstract
    const veraSkips = recentFriction.filter(
      e => e.type === FRICTION_TYPES.SKIP && e.context === FRICTION_CONTEXTS.ORACLE_CHAT
    );
    if (veraSkips.length >= 3) {
      adaptations.push({
        action: 'shorten_vera_responses',
        confidence: veraSkips.length / 5,
        reason: `${veraSkips.length} Vera skips`
      });
    }

    // Pattern 3: Rapid exits after readings → interpretations missing mark
    const readingExits = recentFriction.filter(
      e => e.type === FRICTION_TYPES.RAPID_EXIT && e.context === FRICTION_CONTEXTS.READING
    );
    if (readingExits.length >= 2) {
      adaptations.push({
        action: 'recalibrate_interpretations',
        confidence: readingExits.length / 4,
        reason: `${readingExits.length} rapid exits after readings`
      });
    }

    // Pattern 4: High average complexity → systemic issue
    const avgComplexity = recentFriction.reduce((a, e) => a + e.complexityScore, 0) / recentFriction.length;
    if (avgComplexity > this.e0Floor * 2) {
      adaptations.push({
        action: 'alert_high_friction',
        confidence: 0.8,
        reason: `Average complexity ${avgComplexity.toFixed(1)} exceeds 2x floor (${this.e0Floor})`
      });
    }

    // Pattern 5: Negative feedback cluster → response quality issue
    const negativeFeedback = recentFriction.filter(
      e => e.type === FRICTION_TYPES.NEGATIVE_FEEDBACK
    );
    if (negativeFeedback.length >= 4) {
      adaptations.push({
        action: 'increase_response_personalization',
        confidence: negativeFeedback.length / 6,
        reason: `${negativeFeedback.length} negative feedback events`
      });
    }

    // Pattern 6: Back navigation in onboarding → flow confusing
    const onboardingBackNav = recentFriction.filter(
      e => e.type === FRICTION_TYPES.BACK_NAVIGATION && e.context === FRICTION_CONTEXTS.ONBOARDING
    );
    if (onboardingBackNav.length >= 2) {
      adaptations.push({
        action: 'simplify_onboarding_flow',
        confidence: 0.7,
        reason: `${onboardingBackNav.length} back navigations in onboarding`
      });
    }

    // Trigger callbacks for adaptations
    for (const adaptation of adaptations) {
      this.triggerAdaptation(adaptation);
    }

    return adaptations;
  }

  /**
   * Trigger an adaptation callback
   */
  triggerAdaptation(adaptation) {
    console.log(`[Casimir] Triggering: ${adaptation.action} (${(adaptation.confidence * 100).toFixed(0)}% confidence)`);
    console.log(`[Casimir] Reason: ${adaptation.reason}`);

    for (const callback of this.adaptationCallbacks) {
      try {
        callback(adaptation);
      } catch (error) {
        console.error('[Casimir] Adaptation callback error:', error);
      }
    }
  }

  /**
   * Register adaptation callback
   * Called when friction patterns warrant system adaptation
   *
   * @param {Function} callback - Function to call with adaptation details
   */
  onAdaptation(callback) {
    this.adaptationCallbacks.push(callback);
  }

  /**
   * Get friction context for Vera/SDPM
   * Returns summary string for system prompt
   *
   * @returns {string} Friction context summary
   */
  getFrictionContext() {
    const recent = this.frictionLog.slice(-10);
    if (recent.length === 0) return '';

    const avgComplexity = recent.reduce((a, e) => a + e.complexityScore, 0) / recent.length;
    const frictionLevel = avgComplexity > this.e0Floor * 1.5 ? 'elevated' : 'normal';

    // Count by type
    const typeCounts = recent.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {});

    const dominantFriction = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0];

    let context = `[User Friction: ${frictionLevel}`;
    if (dominantFriction && dominantFriction[1] > 2) {
      context += ` | Pattern: ${dominantFriction[0]}`;
    }
    context += `]`;

    return context;
  }

  /**
   * Get SDPM adaptation suggestions based on friction
   * Returns vector adjustments for Vera personality
   *
   * @returns {Object} SDPM vector adjustments
   */
  getSDPMAdaptation() {
    const recent = this.frictionLog.slice(-15);
    if (recent.length < 3) return null;

    const adaptations = {};

    // Negative feedback → increase empathy (anahata)
    const negativeFeedbackCount = recent.filter(
      e => e.type === FRICTION_TYPES.NEGATIVE_FEEDBACK
    ).length;
    if (negativeFeedbackCount >= 2) {
      adaptations.anahata = 0.1;
    }

    // Skips → increase clarity (vishuddha), decrease abstraction (sahasrara)
    const skipCount = recent.filter(e => e.type === FRICTION_TYPES.SKIP).length;
    if (skipCount >= 3) {
      adaptations.vishuddha = 0.1;
      adaptations.sahasrara = -0.05;
    }

    // Long pauses → reduce directness (manipura)
    const pauseCount = recent.filter(e => e.type === FRICTION_TYPES.LONG_PAUSE).length;
    if (pauseCount >= 3) {
      adaptations.manipura = -0.05;
    }

    // Rapid exits → increase groundedness (muladhara)
    const exitCount = recent.filter(e => e.type === FRICTION_TYPES.RAPID_EXIT).length;
    if (exitCount >= 2) {
      adaptations.muladhara = 0.08;
    }

    return Object.keys(adaptations).length > 0 ? adaptations : null;
  }

  /**
   * Get analytics summary for dashboard
   *
   * @returns {Object} Analytics summary
   */
  getAnalyticsSummary() {
    const all = this.frictionLog;
    const last24h = all.filter(e => Date.now() - e.timestamp < 86400000);
    const last7d = all.filter(e => Date.now() - e.timestamp < 604800000);

    const byType = all.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {});

    const byContext = all.reduce((acc, e) => {
      acc[e.context] = (acc[e.context] || 0) + 1;
      return acc;
    }, {});

    const avgComplexity = all.length > 0
      ? all.reduce((a, e) => a + e.complexityScore, 0) / all.length
      : 0;

    return {
      totalEvents: all.length,
      last24h: last24h.length,
      last7d: last7d.length,
      e0Floor: this.e0Floor,
      avgComplexity: avgComplexity.toFixed(1),
      byType,
      byContext,
      frictionLevel: avgComplexity > this.e0Floor * 1.5 ? 'elevated' : 'normal',
      topFrictionContext: Object.entries(byContext)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null
    };
  }

  /**
   * Clear friction log
   */
  async clearLog() {
    this.frictionLog = [];
    this.e0Floor = 100;
    await this.persist();
  }

  /**
   * Persist state to storage
   */
  async persist() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        frictionLog: this.frictionLog,
        e0Floor: this.e0Floor
      }));
    } catch (error) {
      console.error('[Casimir] Failed to persist:', error);
    }
  }
}

// Singleton instance
let analyzerInstance = null;

/**
 * Get singleton Casimir analyzer instance
 *
 * @returns {CasimirFrictionAnalyzer}
 */
export function getCasimirAnalyzer() {
  if (!analyzerInstance) {
    analyzerInstance = new CasimirFrictionAnalyzer();
  }
  return analyzerInstance;
}

/**
 * Log friction event (convenience function)
 *
 * @param {string} type - Friction type
 * @param {string} context - Friction context
 * @param {Object} sessionData - Session state
 */
export async function logFrictionEvent(type, context, sessionData = {}) {
  const analyzer = getCasimirAnalyzer();
  return analyzer.logFriction({ type, context, sessionData });
}

export default CasimirFrictionAnalyzer;
