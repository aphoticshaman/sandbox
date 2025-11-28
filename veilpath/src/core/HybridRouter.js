/**
 * HybridRouter.js - Edge/Cloud AI Routing Logic
 *
 * Intelligently routes AI requests between edge (on-device/local) and cloud
 * (API-based) inference based on:
 *   - User coherence state
 *   - Request complexity
 *   - Cost constraints
 *   - Latency requirements
 *   - Network conditions
 *
 * Goal: Achieve 90%+ cost savings by routing simple requests locally
 * while preserving quality for complex/deep-focus interactions.
 *
 * Edge AI: Fast, free, private, but limited capability
 * Cloud AI: Powerful, costly, latency, but exceptional quality
 */

import { Platform } from 'react-native';
import coherenceEngine, { COHERENCE_STATES } from './CoherenceEngine';
import adaptiveAI from './AdaptiveAI';
import { PHI, TIMING } from './PhiTiming';

// ═══════════════════════════════════════════════════════════
// ROUTING CONFIGURATION
// ═══════════════════════════════════════════════════════════

export const ROUTE_TARGETS = {
  EDGE: 'edge',
  CLOUD: 'cloud',
  HYBRID: 'hybrid', // Edge first, cloud enhancement if needed
};

const ROUTE_CONFIG = {
  // Cost per 1K tokens (approximate, in cents)
  cloudCostPer1K: {
    input: 0.25,   // Claude Haiku / GPT-3.5 tier
    output: 1.25,
  },
  edgeCostPer1K: {
    input: 0,
    output: 0,
  },

  // Latency estimates (ms)
  cloudLatencyBase: 800,  // Network + API overhead
  edgeLatencyBase: 50,    // On-device inference

  // Quality scores (subjective 0-1)
  cloudQuality: 0.95,
  edgeQuality: 0.65,

  // Daily budget (in cents)
  dailyBudgetCents: 50,

  // Coherence thresholds for routing
  cloudMinCoherence: 0.75, // Below this, edge is fine
  forceCloudCoherence: 0.92, // Above this, always use cloud

  // Complexity thresholds
  simpleRequestMaxTokens: 150,
  complexRequestMinTokens: 400,
};

// ═══════════════════════════════════════════════════════════
// REQUEST COMPLEXITY ESTIMATION
// ═══════════════════════════════════════════════════════════

const COMPLEXITY_FACTORS = {
  // Card types
  majorArcana: 1.5,
  minorArcana: 1.0,

  // Spread size
  singleCard: 1.0,
  threeCard: 1.3,
  celticCross: 2.0,

  // Context
  hasQuestion: 1.2,
  hasHistory: 1.3,
  firstReading: 0.9,

  // User state
  crystallineCoherence: 1.5,  // Wants depth
  collapseCoherence: 0.6,     // Needs simplicity
};

function estimateComplexity(request) {
  let complexity = 1.0;

  // Card type
  if (request.card?.arcana === 'major') {
    complexity *= COMPLEXITY_FACTORS.majorArcana;
  }

  // Spread size
  if (request.spreadType === 'celtic_cross') {
    complexity *= COMPLEXITY_FACTORS.celticCross;
  } else if (request.spreadType === 'three_card') {
    complexity *= COMPLEXITY_FACTORS.threeCard;
  }

  // Context
  if (request.question) {
    complexity *= COMPLEXITY_FACTORS.hasQuestion;
  }
  if (request.previousReadings?.length > 0) {
    complexity *= COMPLEXITY_FACTORS.hasHistory;
  }

  // Coherence state
  const snapshot = coherenceEngine.getSnapshot();
  if (snapshot.state.id === COHERENCE_STATES.CRYSTALLINE.id) {
    complexity *= COMPLEXITY_FACTORS.crystallineCoherence;
  } else if (snapshot.state.id === COHERENCE_STATES.COLLAPSE.id) {
    complexity *= COMPLEXITY_FACTORS.collapseCoherence;
  }

  return complexity;
}

// ═══════════════════════════════════════════════════════════
// HYBRID ROUTER CLASS
// ═══════════════════════════════════════════════════════════

class HybridRouter {
  constructor() {
    // Usage tracking
    this.usage = {
      today: new Date().toDateString(),
      cloudRequests: 0,
      edgeRequests: 0,
      cloudTokens: 0,
      edgeTokens: 0,
      cloudCostCents: 0,
      savedCents: 0, // What we would have spent if all cloud
    };

    // Network state
    this.networkState = {
      isOnline: true,
      lastPing: null,
      avgLatencyMs: 500,
    };

    // Decision history for learning
    this.routingHistory = [];
    this.historyMaxLength = 100;

    // Override flags
    this.forceCloud = false;
    this.forceEdge = false;

    // Load persisted usage from storage
    this.loadUsage();
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN ROUTING DECISION
  // ═══════════════════════════════════════════════════════════

  /**
   * Determine optimal route for a request
   * @param {Object} request - The AI request to route
   * @returns {Object} Routing decision
   */
  route(request) {
    // Check for overrides first
    if (this.forceEdge || !this.networkState.isOnline) {
      return this.createDecision(ROUTE_TARGETS.EDGE, 'forced_or_offline');
    }
    if (this.forceCloud) {
      return this.createDecision(ROUTE_TARGETS.CLOUD, 'forced');
    }

    // Check daily budget
    if (this.usage.cloudCostCents >= ROUTE_CONFIG.dailyBudgetCents) {
      return this.createDecision(ROUTE_TARGETS.EDGE, 'budget_exceeded');
    }

    // Get coherence state
    const snapshot = coherenceEngine.getSnapshot();
    const coherenceR = snapshot.R;
    const coherenceState = snapshot.state;

    // Calculate complexity
    const complexity = estimateComplexity(request);

    // Routing logic
    let target = ROUTE_TARGETS.EDGE;
    let reason = '';

    // High coherence = user is focused, deserves cloud quality
    if (coherenceR >= ROUTE_CONFIG.forceCloudCoherence) {
      target = ROUTE_TARGETS.CLOUD;
      reason = 'crystalline_coherence';
    }
    // Complex request needs cloud
    else if (complexity > 1.8) {
      target = ROUTE_TARGETS.CLOUD;
      reason = 'high_complexity';
    }
    // Medium coherence with medium complexity = hybrid
    else if (coherenceR >= ROUTE_CONFIG.cloudMinCoherence && complexity > 1.3) {
      target = ROUTE_TARGETS.HYBRID;
      reason = 'balanced_hybrid';
    }
    // Low coherence = simple is fine
    else if (coherenceR < 0.5) {
      target = ROUTE_TARGETS.EDGE;
      reason = 'low_coherence_simple';
    }
    // Default: edge for cost savings
    else {
      target = ROUTE_TARGETS.EDGE;
      reason = 'default_cost_savings';
    }

    return this.createDecision(target, reason, { coherenceR, complexity });
  }

  /**
   * Create a routing decision object
   */
  createDecision(target, reason, metadata = {}) {
    const decision = {
      target,
      reason,
      timestamp: Date.now(),
      ...metadata,

      // Execution hints
      hints: this.getExecutionHints(target),
    };

    // Record decision
    this.recordDecision(decision);

    return decision;
  }

  /**
   * Get execution hints for the chosen route
   */
  getExecutionHints(target) {
    const { profile } = adaptiveAI.getCurrentProfile();

    switch (target) {
      case ROUTE_TARGETS.CLOUD:
        return {
          endpoint: 'anthropic', // or 'openai'
          model: profile.maxTokens > 500 ? 'claude-3-sonnet' : 'claude-3-haiku',
          timeout: 30000,
          retries: 2,
        };

      case ROUTE_TARGETS.EDGE:
        return {
          engine: 'local-llm', // or 'onnx', 'mlkit'
          model: 'phi-2-q4', // Small quantized model
          timeout: 10000,
          retries: 1,
        };

      case ROUTE_TARGETS.HYBRID:
        return {
          primary: {
            engine: 'local-llm',
            model: 'phi-2-q4',
            timeout: 5000,
          },
          enhancement: {
            endpoint: 'anthropic',
            model: 'claude-3-haiku',
            timeout: 15000,
            trigger: 'low_confidence', // Enhance if edge result is uncertain
          },
        };

      default:
        return {};
    }
  }

  // ═══════════════════════════════════════════════════════════
  // COST TRACKING
  // ═══════════════════════════════════════════════════════════

  /**
   * Record completion of a request for cost tracking
   */
  recordCompletion(route, inputTokens, outputTokens, actualTarget) {
    // Reset if new day
    const today = new Date().toDateString();
    if (this.usage.today !== today) {
      this.resetDailyUsage();
      this.usage.today = today;
    }

    if (actualTarget === ROUTE_TARGETS.CLOUD || actualTarget === ROUTE_TARGETS.HYBRID) {
      this.usage.cloudRequests++;
      this.usage.cloudTokens += inputTokens + outputTokens;

      const cost =
        (inputTokens / 1000) * ROUTE_CONFIG.cloudCostPer1K.input +
        (outputTokens / 1000) * ROUTE_CONFIG.cloudCostPer1K.output;

      this.usage.cloudCostCents += cost;
    } else {
      this.usage.edgeRequests++;
      this.usage.edgeTokens += inputTokens + outputTokens;

      // Calculate what we saved
      const wouldHaveCost =
        (inputTokens / 1000) * ROUTE_CONFIG.cloudCostPer1K.input +
        (outputTokens / 1000) * ROUTE_CONFIG.cloudCostPer1K.output;

      this.usage.savedCents += wouldHaveCost;
    }

    this.saveUsage();
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    const totalRequests = this.usage.cloudRequests + this.usage.edgeRequests;
    const edgePercent = totalRequests > 0
      ? (this.usage.edgeRequests / totalRequests) * 100
      : 0;

    return {
      ...this.usage,
      totalRequests,
      edgePercent,
      budgetRemaining: ROUTE_CONFIG.dailyBudgetCents - this.usage.cloudCostCents,
      budgetPercent: (this.usage.cloudCostCents / ROUTE_CONFIG.dailyBudgetCents) * 100,
      totalSavings: this.usage.savedCents,
    };
  }

  /**
   * Reset daily usage counters
   */
  resetDailyUsage() {
    this.usage = {
      today: new Date().toDateString(),
      cloudRequests: 0,
      edgeRequests: 0,
      cloudTokens: 0,
      edgeTokens: 0,
      cloudCostCents: 0,
      savedCents: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // NETWORK STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Update network state
   */
  updateNetworkState(isOnline, latencyMs = null) {
    this.networkState.isOnline = isOnline;

    if (latencyMs !== null) {
      // Exponential moving average for latency
      const alpha = 0.3;
      this.networkState.avgLatencyMs =
        alpha * latencyMs + (1 - alpha) * this.networkState.avgLatencyMs;
    }

    this.networkState.lastPing = Date.now();
  }

  /**
   * Estimate if cloud request will be too slow
   */
  isCloudTooSlow(maxAcceptableMs = 3000) {
    const estimatedLatency =
      ROUTE_CONFIG.cloudLatencyBase + this.networkState.avgLatencyMs;

    return estimatedLatency > maxAcceptableMs;
  }

  // ═══════════════════════════════════════════════════════════
  // DECISION HISTORY & ANALYTICS
  // ═══════════════════════════════════════════════════════════

  /**
   * Record a routing decision
   */
  recordDecision(decision) {
    this.routingHistory.push(decision);

    if (this.routingHistory.length > this.historyMaxLength) {
      this.routingHistory.shift();
    }
  }

  /**
   * Get routing analytics
   */
  getRoutingAnalytics() {
    if (this.routingHistory.length === 0) {
      return { total: 0, distribution: {} };
    }

    const distribution = {};
    const reasonDistribution = {};

    this.routingHistory.forEach(d => {
      distribution[d.target] = (distribution[d.target] || 0) + 1;
      reasonDistribution[d.reason] = (reasonDistribution[d.reason] || 0) + 1;
    });

    // Calculate average coherence at decision time
    const avgCoherence =
      this.routingHistory
        .filter(d => d.coherenceR !== undefined)
        .reduce((sum, d) => sum + d.coherenceR, 0) /
      this.routingHistory.filter(d => d.coherenceR !== undefined).length;

    return {
      total: this.routingHistory.length,
      distribution,
      reasonDistribution,
      avgCoherence: avgCoherence || 0.5,
      recentDecisions: this.routingHistory.slice(-5),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════

  async loadUsage() {
    try {
      if (Platform.OS === 'web') {
        const stored = localStorage.getItem('@veilpath_router_usage');
        if (stored) {
          const data = JSON.parse(stored);
          // Only load if same day
          if (data.today === new Date().toDateString()) {
            this.usage = data;
          }
        }
      } else {
        // React Native: would use AsyncStorage
        // Skipping for now - usage tracking is session-based
      }
    } catch (e) {
      console.warn('[HybridRouter] Failed to load usage:', e);
    }
  }

  saveUsage() {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('@veilpath_router_usage', JSON.stringify(this.usage));
      }
    } catch (e) {
      console.warn('[HybridRouter] Failed to save usage:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // OVERRIDE CONTROLS
  // ═══════════════════════════════════════════════════════════

  /**
   * Force all requests to cloud (debugging/testing)
   */
  setForceCloud(enabled) {
    this.forceCloud = enabled;
    this.forceEdge = false;
  }

  /**
   * Force all requests to edge (offline mode/debugging)
   */
  setForceEdge(enabled) {
    this.forceEdge = enabled;
    this.forceCloud = false;
  }

  /**
   * Clear overrides and return to normal routing
   */
  clearOverrides() {
    this.forceCloud = false;
    this.forceEdge = false;
  }
}

// ═══════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════

const hybridRouter = new HybridRouter();

// ═══════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Quick route decision for a card reading request
 */
export function routeCardReading(card, options = {}) {
  return hybridRouter.route({
    type: 'card_reading',
    card,
    ...options,
  });
}

/**
 * Quick route decision for a spread reading
 */
export function routeSpreadReading(cards, spreadType, options = {}) {
  return hybridRouter.route({
    type: 'spread_reading',
    cards,
    spreadType,
    ...options,
  });
}

/**
 * Quick route decision for a journal reflection
 */
export function routeJournalReflection(entry, options = {}) {
  return hybridRouter.route({
    type: 'journal_reflection',
    entry,
    ...options,
  });
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export {
  hybridRouter,
  HybridRouter,
  ROUTE_TARGETS,
  ROUTE_CONFIG,
  estimateComplexity,
};

export default hybridRouter;
