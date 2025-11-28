/**
 * RATCHET LOOP - SELF-FEEDING LEARNING ENGINE
 *
 * The "ratcheting" learning loop that only improves, never regresses.
 * Aggregates free user behavior → feeds Guardian/Vera/Pod adaptations.
 *
 * Core Patent Integration:
 * - PSAN Tri-Fork (#504): Multi-domain synthesis (user behavior + friction + ad engagement)
 * - Kuramoto Flow (#467): Phase-locked learning cycles
 * - K×f Pruning: Beam search optimization for response selection
 * - Casimir (#544): Failure signals as learning opportunities
 *
 * Ratchet Principle:
 * - Learning only moves forward (commits to better states)
 * - Validated improvements are locked in
 * - Bad experiments are discarded without regressing
 *
 * Runs on schedule:
 * - Mini-ratchet: Every user session end
 * - Daily ratchet: Aggregated learning at midnight
 * - Weekly ratchet: Major adaptation cycles
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVeilAnalytics } from './VeilAnalytics';
import { getCasimirAnalyzer } from './CasimirFrictionAnalyzer';
import { getAdAssetManager } from './AdAssetManager';

const RATCHET_STATE_KEY = '@veilpath_ratchet_state';

// ═══════════════════════════════════════════════════════════════════════════
// RATCHET METRICS & THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Metrics that can only improve (ratchet forward)
 */
const RATCHET_METRICS = {
  // Engagement metrics (higher = better)
  sessionDuration: { direction: 'up', threshold: 0.05 },        // 5% improvement
  readingCompletionRate: { direction: 'up', threshold: 0.03 },  // 3% improvement
  journalEngagement: { direction: 'up', threshold: 0.05 },
  veraInteractionDepth: { direction: 'up', threshold: 0.05 },

  // Friction metrics (lower = better)
  abandonmentRate: { direction: 'down', threshold: 0.03 },
  avgFrictionComplexity: { direction: 'down', threshold: 0.05 },
  rapidExitRate: { direction: 'down', threshold: 0.03 },

  // Monetization metrics (higher = better)
  adCompletionRate: { direction: 'up', threshold: 0.02 },
  conversionRate: { direction: 'up', threshold: 0.01 },
  premiumConversionRate: { direction: 'up', threshold: 0.01 },
};

/**
 * Adaptation domains
 */
const ADAPTATION_DOMAINS = {
  GUARDIAN: 'guardian',     // Security/rate limiting adjustments
  VERA: 'vera',             // AI personality/response tuning
  UX: 'ux',                 // UI/UX improvements
  ADS: 'ads',               // Ad targeting/frequency
  CONTENT: 'content',       // Content recommendations
};

// ═══════════════════════════════════════════════════════════════════════════
// BEAM SEARCH OPTIMIZATION (K×f Pruning Inspired)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Beam search for optimal configuration
 * Explores configuration space while pruning low-performers
 *
 * @param {array} candidates - Array of config candidates
 * @param {function} scoreFn - Function to score each candidate
 * @param {number} beamWidth - Number of candidates to keep
 * @param {number} depth - Search depth
 */
function beamSearch(candidates, scoreFn, beamWidth = 3, depth = 2) {
  let beam = candidates.map(c => ({
    config: c,
    score: scoreFn(c),
    history: [c],
  }));

  // Initial prune to beam width
  beam = beam.sort((a, b) => b.score - a.score).slice(0, beamWidth);

  // Expand and prune for each depth level
  for (let d = 0; d < depth; d++) {
    const expanded = [];

    for (const item of beam) {
      // Generate mutations of current config
      const mutations = generateMutations(item.config);

      for (const mutation of mutations) {
        expanded.push({
          config: mutation,
          score: scoreFn(mutation),
          history: [...item.history, mutation],
        });
      }
    }

    // Prune to beam width
    beam = expanded.sort((a, b) => b.score - a.score).slice(0, beamWidth);
  }

  // Return best candidate
  return beam[0] || { config: candidates[0], score: 0 };
}

/**
 * Generate mutations of a configuration
 */
function generateMutations(config) {
  const mutations = [];

  // Small random perturbations
  for (let i = 0; i < 3; i++) {
    const mutation = { ...config };
    const keys = Object.keys(config);
    const key = keys[Math.floor(Math.random() * keys.length)];

    if (typeof config[key] === 'number') {
      // Perturb numeric values by ±10%
      mutation[key] = config[key] * (0.9 + Math.random() * 0.2);
    } else if (typeof config[key] === 'boolean') {
      // Flip boolean values occasionally
      if (Math.random() < 0.2) {
        mutation[key] = !config[key];
      }
    }

    mutations.push(mutation);
  }

  return mutations;
}

// ═══════════════════════════════════════════════════════════════════════════
// RATCHET LOOP CLASS
// ═══════════════════════════════════════════════════════════════════════════

class RatchetLoop {
  constructor() {
    this.initialized = false;

    // Current ratchet state (locked-in optimizations)
    this.state = {
      version: 1,
      lastMiniRatchet: null,
      lastDailyRatchet: null,
      lastWeeklyRatchet: null,

      // Locked-in metric baselines (only improve from here)
      baselines: {},

      // Current adaptations in effect
      adaptations: {
        guardian: {},
        vera: {},
        ux: {},
        ads: {},
        content: {},
      },

      // Experiment history
      experiments: [],

      // Learning history
      learningLog: [],
    };

    // Callbacks for adaptations
    this.adaptationCallbacks = {
      guardian: [],
      vera: [],
      ux: [],
      ads: [],
      content: [],
    };
  }

  /**
   * Initialize RatchetLoop
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(RATCHET_STATE_KEY);
      if (stored) {
        this.state = { ...this.state, ...JSON.parse(stored) };
      }

      this.initialized = true;
      console.log('[RatchetLoop] Initialized');

      // Check if daily ratchet is due
      this.checkScheduledRatchets();
    } catch (error) {
      console.error('[RatchetLoop] Init error:', error);
      this.initialized = true;
    }
  }

  /**
   * Register callback for adaptation in a domain
   */
  onAdaptation(domain, callback) {
    if (this.adaptationCallbacks[domain]) {
      this.adaptationCallbacks[domain].push(callback);
    }
  }

  /**
   * Check and run scheduled ratchets
   */
  checkScheduledRatchets() {
    const now = Date.now();
    const dayMs = 86400000;
    const weekMs = 604800000;

    // Daily ratchet (if 24h+ since last)
    if (!this.state.lastDailyRatchet ||
        now - this.state.lastDailyRatchet > dayMs) {
      this.runDailyRatchet();
    }

    // Weekly ratchet (if 7d+ since last)
    if (!this.state.lastWeeklyRatchet ||
        now - this.state.lastWeeklyRatchet > weekMs) {
      this.runWeeklyRatchet();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MINI-RATCHET (Per Session)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Run mini-ratchet at end of session
   * Quick adaptation based on immediate session data
   */
  async runMiniRatchet() {
    const analytics = getVeilAnalytics();
    const casimir = getCasimirAnalyzer();

    const sessionData = {
      duration: analytics.sessionStart ? Date.now() - analytics.sessionStart : 0,
      screenHistory: analytics.screenHistory || [],
      interactions: analytics.interactions || [],
      frictionEvents: casimir.frictionLog.slice(-10),
      adEngagement: analytics.adSessionStats || {},
    };

    // Calculate session metrics
    const sessionMetrics = this.calculateSessionMetrics(sessionData);

    // Compare to baselines
    const improvements = this.detectImprovements(sessionMetrics);

    // If improvements detected, consider locking them in
    if (improvements.length > 0) {
      this.logLearning('mini', improvements, sessionMetrics);
    }

    // Quick Vera adaptation based on session friction
    const frictionAdaptation = casimir.getSDPMAdaptation();
    if (frictionAdaptation) {
      this.applyAdaptation(ADAPTATION_DOMAINS.VERA, frictionAdaptation);
    }

    this.state.lastMiniRatchet = Date.now();
    await this.persist();
  }

  /**
   * Calculate metrics from session data
   */
  calculateSessionMetrics(sessionData) {
    const { duration, screenHistory, interactions, frictionEvents, adEngagement } = sessionData;

    // Session duration (normalized to minutes)
    const durationMinutes = duration / 60000;

    // Engagement depth (screens * interactions)
    const engagementDepth = screenHistory.length * Math.min(interactions.length / 10, 1);

    // Friction rate
    const frictionRate = screenHistory.length > 0
      ? frictionEvents.length / screenHistory.length
      : 0;

    // Ad completion rate
    const adCompletionRate = adEngagement.impressions > 0
      ? adEngagement.completions / adEngagement.impressions
      : 0;

    return {
      sessionDuration: durationMinutes,
      engagementDepth,
      frictionRate,
      adCompletionRate,
      screenCount: screenHistory.length,
      interactionCount: interactions.length,
    };
  }

  /**
   * Detect improvements from current metrics vs baselines
   */
  detectImprovements(metrics) {
    const improvements = [];

    for (const [metricName, config] of Object.entries(RATCHET_METRICS)) {
      const current = metrics[metricName];
      const baseline = this.state.baselines[metricName];

      if (current === undefined) continue;

      // If no baseline, establish it
      if (baseline === undefined) {
        this.state.baselines[metricName] = current;
        continue;
      }

      // Check for improvement
      const delta = current - baseline;
      const threshold = baseline * config.threshold;

      const improved = config.direction === 'up'
        ? delta > threshold
        : delta < -threshold;

      if (improved) {
        improvements.push({
          metric: metricName,
          baseline,
          current,
          delta,
          direction: config.direction,
        });
      }
    }

    return improvements;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DAILY RATCHET
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Run daily ratchet - aggregate learning and lock in improvements
   */
  async runDailyRatchet() {
    console.log('[RatchetLoop] Running daily ratchet...');

    const analytics = getVeilAnalytics();
    const casimir = getCasimirAnalyzer();
    const adManager = getAdAssetManager();

    // Aggregate daily metrics
    const dailyMetrics = await this.aggregateDailyMetrics(analytics, casimir);

    // Detect improvements
    const improvements = this.detectImprovements(dailyMetrics);

    // Lock in improvements (ratchet forward)
    for (const improvement of improvements) {
      this.lockInImprovement(improvement);
    }

    // Run beam search for optimal Vera configuration
    const veraOptimization = this.optimizeVeraConfig(dailyMetrics);
    if (veraOptimization) {
      this.applyAdaptation(ADAPTATION_DOMAINS.VERA, veraOptimization);
    }

    // Optimize ad selection based on daily performance
    const adOptimization = this.optimizeAdConfig(adManager.getPerformanceStats());
    if (adOptimization) {
      this.applyAdaptation(ADAPTATION_DOMAINS.ADS, adOptimization);
    }

    // Log daily learning
    this.logLearning('daily', improvements, dailyMetrics);

    this.state.lastDailyRatchet = Date.now();
    await this.persist();

    console.log('[RatchetLoop] Daily ratchet complete', { improvementsLocked: improvements.length });
  }

  /**
   * Aggregate daily metrics from all sources
   */
  async aggregateDailyMetrics(analytics, casimir) {
    const summary = analytics.getAnalyticsSummary();
    const frictionSummary = casimir.getAnalyticsSummary();

    return {
      sessionDuration: summary.user.metrics.totalSessions > 0
        ? summary.session.duration / summary.user.metrics.totalSessions
        : 0,
      readingCompletionRate: summary.user.metrics.readingsStarted > 0
        ? summary.user.metrics.readingsCompleted / summary.user.metrics.readingsStarted
        : 0,
      journalEngagement: Math.min(1, summary.user.metrics.journalEntriesCreated / 5),
      abandonmentRate: frictionSummary.totalEvents > 0
        ? (frictionSummary.byType?.abandon || 0) / frictionSummary.totalEvents
        : 0,
      avgFrictionComplexity: parseFloat(frictionSummary.avgComplexity) || 0,
      adCompletionRate: summary.ads.totals.completionRate
        ? parseFloat(summary.ads.totals.completionRate) / 100
        : 0,
    };
  }

  /**
   * Lock in an improvement (update baseline)
   */
  lockInImprovement(improvement) {
    // Update baseline to new level (ratchet forward)
    this.state.baselines[improvement.metric] = improvement.current;

    console.log(`[RatchetLoop] Locked in: ${improvement.metric} ${improvement.baseline.toFixed(2)} → ${improvement.current.toFixed(2)}`);
  }

  /**
   * Optimize Vera configuration using beam search
   */
  optimizeVeraConfig(metrics) {
    // Current Vera config
    const currentConfig = this.state.adaptations.vera || {
      responseLength: 1.0,    // 1.0 = normal, <1 = shorter
      empathyLevel: 0.7,      // 0-1
      directness: 0.5,        // 0-1
      mysticalTone: 0.6,      // 0-1
    };

    // Score function based on engagement and friction
    const scoreFn = (config) => {
      // Simulate expected performance based on config
      let score = 0;

      // Higher empathy = lower friction (usually)
      score += config.empathyLevel * 0.3;

      // Optimal response length varies by user archetype
      const lengthPenalty = Math.abs(config.responseLength - 0.8);
      score -= lengthPenalty * 0.2;

      // Directness should match friction level
      if (metrics.avgFrictionComplexity > 15) {
        // High friction = be more direct
        score += config.directness * 0.2;
      } else {
        // Low friction = more mystical is ok
        score += config.mysticalTone * 0.2;
      }

      return score;
    };

    // Run beam search
    const result = beamSearch([currentConfig], scoreFn, 3, 2);

    // Only return if significantly better
    if (result.score > scoreFn(currentConfig) * 1.05) {
      return result.config;
    }

    return null;
  }

  /**
   * Optimize ad configuration based on performance
   */
  optimizeAdConfig(adStats) {
    // Determine optimal ad frequency
    const currentFrequency = this.state.adaptations.ads.frequency || 2; // ads per 5 min

    // If CTR is high, can show slightly more
    const ctr = parseFloat(adStats.overallCTR) || 0;
    const completionRate = parseFloat(adStats.overallCompletionRate) || 0;

    let optimalFrequency = currentFrequency;

    if (ctr > 5 && completionRate > 60) {
      // High engagement, can increase slightly
      optimalFrequency = Math.min(currentFrequency + 0.5, 3);
    } else if (ctr < 1 || completionRate < 30) {
      // Low engagement, reduce frequency
      optimalFrequency = Math.max(currentFrequency - 0.5, 1);
    }

    // Determine optimal placement weights
    const placementWeights = {};
    if (adStats.byPlacement) {
      for (const [placement, stats] of Object.entries(adStats.byPlacement)) {
        const score = (parseFloat(stats.completionRate) || 0) +
                     (parseFloat(stats.ctr) || 0) * 2;
        placementWeights[placement] = Math.max(0.1, score / 100);
      }
    }

    return {
      frequency: optimalFrequency,
      placementWeights,
      lastOptimized: Date.now(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // WEEKLY RATCHET
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Run weekly ratchet - major adaptations and experiments
   */
  async runWeeklyRatchet() {
    console.log('[RatchetLoop] Running weekly ratchet...');

    // Review all experiments from the week
    const experiments = this.state.experiments.filter(
      e => Date.now() - e.timestamp < 604800000
    );

    // Evaluate experiment outcomes
    for (const experiment of experiments) {
      await this.evaluateExperiment(experiment);
    }

    // Generate new experiments for next week
    const newExperiments = this.generateExperiments();
    this.state.experiments.push(...newExperiments);

    // Prune old experiments
    this.state.experiments = this.state.experiments.slice(-20);

    // Optimize Guardian settings based on accumulated data
    const guardianOptimization = this.optimizeGuardianConfig();
    if (guardianOptimization) {
      this.applyAdaptation(ADAPTATION_DOMAINS.GUARDIAN, guardianOptimization);
    }

    this.state.lastWeeklyRatchet = Date.now();
    await this.persist();

    console.log('[RatchetLoop] Weekly ratchet complete');
  }

  /**
   * Evaluate an experiment's outcome
   */
  async evaluateExperiment(experiment) {
    // Compare pre/post metrics
    const improvement = experiment.postMetric - experiment.preMetric;
    const threshold = experiment.preMetric * 0.03; // 3% improvement needed

    if (improvement > threshold) {
      // Experiment succeeded - lock in the change
      console.log(`[RatchetLoop] Experiment "${experiment.name}" succeeded`);
      this.lockInImprovement({
        metric: experiment.metric,
        baseline: experiment.preMetric,
        current: experiment.postMetric,
      });
      experiment.outcome = 'success';
    } else if (improvement < -threshold) {
      // Experiment failed - revert
      console.log(`[RatchetLoop] Experiment "${experiment.name}" failed - reverting`);
      experiment.outcome = 'reverted';
    } else {
      // Inconclusive
      experiment.outcome = 'inconclusive';
    }

    experiment.evaluatedAt = Date.now();
  }

  /**
   * Generate new experiments for the week
   */
  generateExperiments() {
    const experiments = [];

    // Vera response length experiment
    experiments.push({
      id: `exp_vera_length_${Date.now()}`,
      name: 'Vera Response Length Variation',
      domain: ADAPTATION_DOMAINS.VERA,
      hypothesis: 'Shorter responses may reduce abandonment',
      change: { responseLength: 0.8 },
      metric: 'abandonmentRate',
      preMetric: this.state.baselines.abandonmentRate || 0,
      timestamp: Date.now(),
    });

    // Ad placement experiment
    experiments.push({
      id: `exp_ad_placement_${Date.now()}`,
      name: 'Post-Reading Ad Timing',
      domain: ADAPTATION_DOMAINS.ADS,
      hypothesis: 'Delayed ads after reading may improve completion',
      change: { postReadingDelay: 3000 }, // 3 second delay
      metric: 'adCompletionRate',
      preMetric: this.state.baselines.adCompletionRate || 0,
      timestamp: Date.now(),
    });

    return experiments;
  }

  /**
   * Optimize Guardian configuration
   */
  optimizeGuardianConfig() {
    const casimir = getCasimirAnalyzer();
    const frictionSummary = casimir.getAnalyticsSummary();

    // Adjust rate limits based on friction patterns
    const currentConfig = this.state.adaptations.guardian || {
      maxRequestsPerMinute: 10,
      maxRequestsPerDay: 100,
      trustScoreDecay: 0.1,
    };

    // If friction is high, slightly relax limits
    if (frictionSummary.frictionLevel === 'elevated') {
      return {
        ...currentConfig,
        maxRequestsPerMinute: Math.min(currentConfig.maxRequestsPerMinute + 1, 15),
      };
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ADAPTATION APPLICATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Apply an adaptation to a domain
   */
  applyAdaptation(domain, adaptation) {
    // Merge with existing adaptations
    this.state.adaptations[domain] = {
      ...this.state.adaptations[domain],
      ...adaptation,
      lastUpdated: Date.now(),
    };

    // Trigger callbacks
    for (const callback of this.adaptationCallbacks[domain]) {
      try {
        callback(adaptation);
      } catch (error) {
        console.error(`[RatchetLoop] Adaptation callback error (${domain}):`, error);
      }
    }

    console.log(`[RatchetLoop] Applied ${domain} adaptation:`, adaptation);
  }

  /**
   * Get current adaptations for a domain
   */
  getAdaptations(domain) {
    return this.state.adaptations[domain] || {};
  }

  /**
   * Get all adaptations
   */
  getAllAdaptations() {
    return { ...this.state.adaptations };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEARNING LOG
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Log learning event
   */
  logLearning(type, improvements, metrics) {
    this.state.learningLog.push({
      type,
      timestamp: Date.now(),
      improvements: improvements.length,
      metrics: { ...metrics },
    });

    // Keep last 100 learning events
    if (this.state.learningLog.length > 100) {
      this.state.learningLog = this.state.learningLog.slice(-100);
    }
  }

  /**
   * Get learning history
   */
  getLearningHistory(limit = 20) {
    return this.state.learningLog.slice(-limit);
  }

  /**
   * Get ratchet status summary
   */
  getRatchetStatus() {
    return {
      version: this.state.version,
      lastMiniRatchet: this.state.lastMiniRatchet,
      lastDailyRatchet: this.state.lastDailyRatchet,
      lastWeeklyRatchet: this.state.lastWeeklyRatchet,
      baselines: { ...this.state.baselines },
      adaptationCount: Object.keys(this.state.adaptations)
        .reduce((sum, d) => sum + Object.keys(this.state.adaptations[d]).length, 0),
      experimentCount: this.state.experiments.length,
      learningEvents: this.state.learningLog.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Persist ratchet state
   */
  async persist() {
    try {
      await AsyncStorage.setItem(RATCHET_STATE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('[RatchetLoop] Persist error:', error);
    }
  }

  /**
   * Reset ratchet state (for testing)
   */
  async reset() {
    this.state = {
      version: 1,
      lastMiniRatchet: null,
      lastDailyRatchet: null,
      lastWeeklyRatchet: null,
      baselines: {},
      adaptations: {
        guardian: {},
        vera: {},
        ux: {},
        ads: {},
        content: {},
      },
      experiments: [],
      learningLog: [],
    };

    await AsyncStorage.removeItem(RATCHET_STATE_KEY);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

let instance = null;

/**
 * Get RatchetLoop singleton
 */
export function getRatchetLoop() {
  if (!instance) {
    instance = new RatchetLoop();
  }
  return instance;
}

/**
 * Initialize RatchetLoop
 */
export async function initRatchetLoop() {
  const loop = getRatchetLoop();
  await loop.initialize();
  return loop;
}

export { RATCHET_METRICS, ADAPTATION_DOMAINS };
export default RatchetLoop;
