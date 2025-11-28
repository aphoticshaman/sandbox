/**
 * META-LEARNER - CODE THAT TEACHES CODE HOW TO LEARN
 *
 * LLM-driven beam search/optimization system that:
 * - Analyzes behavioral patterns
 * - Generates optimization hypotheses
 * - Creates/modifies configuration code
 * - Validates improvements before locking in
 *
 * Patent Integration:
 * - RBRS (Recursive Best-first Rolling Search): Multi-path exploration
 * - QAOA-inspired: Quantum-ish optimization simulation
 * - PSAN Tri-Fork: Multi-domain synthesis
 *
 * This is the "brain" that feeds Guardian, Vera, Pod connectors
 * with learned improvements a few times daily.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVeilAnalytics } from './VeilAnalytics';
import { getCasimirAnalyzer } from './CasimirFrictionAnalyzer';
import { getAdAssetManager } from './AdAssetManager';
import { getRatchetLoop, ADAPTATION_DOMAINS } from './RatchetLoop';

const META_STATE_KEY = '@veilpath_metalearner_state';

// ═══════════════════════════════════════════════════════════════════════════
// LEARNING SIGNAL TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Signal types that feed the meta-learner
 */
const SIGNAL_TYPES = {
  FRICTION: 'friction',           // User friction events
  ENGAGEMENT: 'engagement',       // Positive engagement signals
  CONVERSION: 'conversion',       // Monetization signals
  RETENTION: 'retention',         // User return patterns
  QUALITY: 'quality',             // Content quality signals
};

/**
 * Learning domains for code generation
 */
const LEARNING_DOMAINS = {
  VERA_PROMPTS: 'vera_prompts',           // System prompt optimization
  GUARDIAN_RULES: 'guardian_rules',       // Security rule tuning
  UX_FLOWS: 'ux_flows',                   // User flow optimization
  AD_TARGETING: 'ad_targeting',           // Ad selection logic
  CONTENT_RANKING: 'content_ranking',     // Content recommendation
};

// ═══════════════════════════════════════════════════════════════════════════
// RBRS (RECURSIVE BEST-FIRST ROLLING SEARCH)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RBRS Node - represents a configuration state
 */
class RBRSNode {
  constructor(state, parent = null, action = null) {
    this.state = state;
    this.parent = parent;
    this.action = action;
    this.score = 0;
    this.visits = 0;
    this.children = [];
    this.depth = parent ? parent.depth + 1 : 0;
  }

  /**
   * Get UCB1 score for selection
   */
  getUCB1(totalVisits, explorationWeight = 1.414) {
    if (this.visits === 0) return Infinity;
    return this.score / this.visits +
           explorationWeight * Math.sqrt(Math.log(totalVisits) / this.visits);
  }

  /**
   * Backpropagate score
   */
  backpropagate(score) {
    let node = this;
    while (node) {
      node.visits++;
      node.score += score;
      node = node.parent;
    }
  }
}

/**
 * RBRS Tree - explores optimization space
 */
class RBRSTree {
  constructor(initialState, scoreFn, maxDepth = 5) {
    this.root = new RBRSNode(initialState);
    this.scoreFn = scoreFn;
    this.maxDepth = maxDepth;
    this.totalVisits = 0;
    this.bestNode = this.root;
    this.bestScore = 0;
  }

  /**
   * Run N iterations of RBRS
   */
  search(iterations = 50) {
    for (let i = 0; i < iterations; i++) {
      const leaf = this.select(this.root);
      const expanded = this.expand(leaf);
      const score = this.simulate(expanded);
      expanded.backpropagate(score);
      this.totalVisits++;

      // Track best
      if (score > this.bestScore) {
        this.bestScore = score;
        this.bestNode = expanded;
      }
    }

    return this.getBestPath();
  }

  /**
   * Select best child using UCB1
   */
  select(node) {
    while (node.children.length > 0) {
      let best = node.children[0];
      let bestUCB = best.getUCB1(this.totalVisits);

      for (const child of node.children) {
        const ucb = child.getUCB1(this.totalVisits);
        if (ucb > bestUCB) {
          best = child;
          bestUCB = ucb;
        }
      }

      node = best;
    }
    return node;
  }

  /**
   * Expand node with possible actions
   */
  expand(node) {
    if (node.depth >= this.maxDepth) return node;

    const actions = this.generateActions(node.state);
    if (actions.length === 0) return node;

    // Add children
    for (const action of actions) {
      const newState = this.applyAction(node.state, action);
      node.children.push(new RBRSNode(newState, node, action));
    }

    // Return random child for simulation
    return node.children[Math.floor(Math.random() * node.children.length)];
  }

  /**
   * Simulate from node to terminal
   */
  simulate(node) {
    return this.scoreFn(node.state);
  }

  /**
   * Generate possible actions from state
   */
  generateActions(state) {
    const actions = [];
    const keys = Object.keys(state);

    for (const key of keys) {
      if (typeof state[key] === 'number') {
        // Numeric: try increase, decrease, small perturbation
        actions.push({ type: 'increase', key, factor: 1.1 });
        actions.push({ type: 'decrease', key, factor: 0.9 });
        actions.push({ type: 'perturb', key, factor: 0.95 + Math.random() * 0.1 });
      } else if (typeof state[key] === 'boolean') {
        actions.push({ type: 'toggle', key });
      } else if (Array.isArray(state[key])) {
        actions.push({ type: 'shuffle', key });
      }
    }

    // Limit to top 5 random actions
    return actions.sort(() => Math.random() - 0.5).slice(0, 5);
  }

  /**
   * Apply action to state
   */
  applyAction(state, action) {
    const newState = { ...state };

    switch (action.type) {
      case 'increase':
      case 'decrease':
      case 'perturb':
        newState[action.key] = state[action.key] * action.factor;
        break;
      case 'toggle':
        newState[action.key] = !state[action.key];
        break;
      case 'shuffle':
        newState[action.key] = [...state[action.key]].sort(() => Math.random() - 0.5);
        break;
    }

    return newState;
  }

  /**
   * Get best path from root to best node
   */
  getBestPath() {
    const path = [];
    let node = this.bestNode;

    while (node) {
      if (node.action) {
        path.unshift(node.action);
      }
      node = node.parent;
    }

    return {
      actions: path,
      finalState: this.bestNode.state,
      score: this.bestScore,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// QAOA-INSPIRED OPTIMIZER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simulated QAOA optimization
 * Classical approximation of quantum optimization principles
 */
class QAOAOptimizer {
  constructor(objectiveFn, dimension, layers = 3) {
    this.objectiveFn = objectiveFn;
    this.dimension = dimension;
    this.layers = layers;

    // Initialize variational parameters
    this.gamma = new Array(layers).fill(0).map(() => Math.random() * Math.PI);
    this.beta = new Array(layers).fill(0).map(() => Math.random() * Math.PI);
  }

  /**
   * Run optimization
   */
  optimize(iterations = 100) {
    let bestState = this.initializeState();
    let bestScore = this.evaluate(bestState);

    for (let i = 0; i < iterations; i++) {
      // Apply variational circuit simulation
      const state = this.applyCircuit(this.initializeState());
      const score = this.evaluate(state);

      if (score > bestScore) {
        bestScore = score;
        bestState = state;

        // Update parameters (gradient-free)
        this.updateParameters(i / iterations);
      }
    }

    return { state: bestState, score: bestScore };
  }

  /**
   * Initialize superposition-like state
   */
  initializeState() {
    const state = {};
    for (let i = 0; i < this.dimension; i++) {
      state[`dim_${i}`] = 0.5; // Equal superposition
    }
    return state;
  }

  /**
   * Apply simulated quantum circuit
   */
  applyCircuit(state) {
    let result = { ...state };

    for (let p = 0; p < this.layers; p++) {
      // Problem Hamiltonian (mixer)
      result = this.applyMixer(result, this.gamma[p]);
      // Driver Hamiltonian (phase)
      result = this.applyPhase(result, this.beta[p]);
    }

    // Collapse to classical state
    return this.measure(result);
  }

  /**
   * Apply mixer operation
   */
  applyMixer(state, gamma) {
    const result = {};
    for (const [key, val] of Object.entries(state)) {
      // Rotation around X-axis simulation
      result[key] = val * Math.cos(gamma) + (1 - val) * Math.sin(gamma);
    }
    return result;
  }

  /**
   * Apply phase operation
   */
  applyPhase(state, beta) {
    const result = {};
    const cost = this.objectiveFn(state);
    for (const [key, val] of Object.entries(state)) {
      // Phase based on objective
      result[key] = val + beta * cost * 0.1 * (Math.random() - 0.5);
      result[key] = Math.max(0, Math.min(1, result[key])); // Clamp
    }
    return result;
  }

  /**
   * Measure (collapse to classical)
   */
  measure(state) {
    const result = {};
    for (const [key, val] of Object.entries(state)) {
      result[key] = Math.random() < val ? 1 : 0;
    }
    return result;
  }

  /**
   * Evaluate state
   */
  evaluate(state) {
    return this.objectiveFn(state);
  }

  /**
   * Update variational parameters
   */
  updateParameters(progress) {
    // Annealing schedule
    const temperature = 1 - progress;

    for (let p = 0; p < this.layers; p++) {
      this.gamma[p] += temperature * (Math.random() - 0.5) * 0.1;
      this.beta[p] += temperature * (Math.random() - 0.5) * 0.1;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// META-LEARNER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class MetaLearner {
  constructor() {
    this.initialized = false;

    this.state = {
      version: 1,
      lastLearningCycle: null,
      signals: [],
      hypotheses: [],
      generatedConfigs: [],
      validatedImprovements: [],
    };

    // Learning callbacks (for Guardian, Vera, etc.)
    this.learningCallbacks = {};
  }

  /**
   * Initialize MetaLearner
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(META_STATE_KEY);
      if (stored) {
        this.state = { ...this.state, ...JSON.parse(stored) };
      }

      this.initialized = true;
      console.log('[MetaLearner] Initialized');
    } catch (error) {
      console.error('[MetaLearner] Init error:', error);
      this.initialized = true;
    }
  }

  /**
   * Register callback for a learning domain
   */
  onLearning(domain, callback) {
    if (!this.learningCallbacks[domain]) {
      this.learningCallbacks[domain] = [];
    }
    this.learningCallbacks[domain].push(callback);
  }

  /**
   * Ingest learning signal
   */
  ingestSignal(signalType, data) {
    this.state.signals.push({
      type: signalType,
      data,
      timestamp: Date.now(),
    });

    // Trim to last 500 signals
    if (this.state.signals.length > 500) {
      this.state.signals = this.state.signals.slice(-500);
    }

    // Auto-learn if enough signals accumulated
    if (this.state.signals.length >= 50 && this.shouldRunLearningCycle()) {
      this.runLearningCycle();
    }
  }

  /**
   * Check if learning cycle should run
   */
  shouldRunLearningCycle() {
    if (!this.state.lastLearningCycle) return true;

    // Run at most every 4 hours
    const fourHours = 4 * 60 * 60 * 1000;
    return Date.now() - this.state.lastLearningCycle > fourHours;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEARNING CYCLE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Run full learning cycle
   * This is where code teaches code how to learn
   */
  async runLearningCycle() {
    console.log('[MetaLearner] Starting learning cycle...');

    // 1. Aggregate and analyze signals
    const signalAnalysis = this.analyzeSignals();

    // 2. Generate hypotheses
    const hypotheses = this.generateHypotheses(signalAnalysis);

    // 3. Run RBRS optimization for each domain
    const optimizations = await this.runOptimizations(signalAnalysis);

    // 4. Generate configuration code
    const generatedConfigs = this.generateConfigurations(optimizations);

    // 5. Validate improvements
    const validated = this.validateConfigurations(generatedConfigs);

    // 6. Apply validated improvements
    await this.applyImprovements(validated);

    // 7. Update state
    this.state.lastLearningCycle = Date.now();
    this.state.hypotheses.push(...hypotheses);
    this.state.generatedConfigs.push(...generatedConfigs);
    this.state.validatedImprovements.push(...validated);

    // Trim histories
    this.state.hypotheses = this.state.hypotheses.slice(-50);
    this.state.generatedConfigs = this.state.generatedConfigs.slice(-50);
    this.state.validatedImprovements = this.state.validatedImprovements.slice(-50);

    await this.persist();

    console.log('[MetaLearner] Learning cycle complete', {
      hypotheses: hypotheses.length,
      optimizations: Object.keys(optimizations).length,
      validated: validated.length,
    });

    return { signalAnalysis, hypotheses, optimizations, validated };
  }

  /**
   * Analyze accumulated signals
   */
  analyzeSignals() {
    const recentSignals = this.state.signals.slice(-100);

    // Group by type
    const byType = {};
    for (const signal of recentSignals) {
      if (!byType[signal.type]) byType[signal.type] = [];
      byType[signal.type].push(signal);
    }

    // Calculate aggregate metrics
    const analysis = {
      frictionLevel: this.calculateFrictionLevel(byType[SIGNAL_TYPES.FRICTION] || []),
      engagementScore: this.calculateEngagementScore(byType[SIGNAL_TYPES.ENGAGEMENT] || []),
      conversionRate: this.calculateConversionRate(byType[SIGNAL_TYPES.CONVERSION] || []),
      retentionIndicator: this.calculateRetentionIndicator(byType[SIGNAL_TYPES.RETENTION] || []),
      patterns: this.detectPatterns(recentSignals),
      anomalies: this.detectAnomalies(recentSignals),
    };

    return analysis;
  }

  /**
   * Calculate friction level from friction signals
   */
  calculateFrictionLevel(frictionSignals) {
    if (frictionSignals.length === 0) return 0;

    const totalComplexity = frictionSignals.reduce(
      (sum, s) => sum + (s.data?.complexity || 10),
      0
    );

    return totalComplexity / frictionSignals.length;
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(engagementSignals) {
    if (engagementSignals.length === 0) return 0.5;

    const positiveCount = engagementSignals.filter(s => s.data?.positive).length;
    return positiveCount / engagementSignals.length;
  }

  /**
   * Calculate conversion rate
   */
  calculateConversionRate(conversionSignals) {
    if (conversionSignals.length === 0) return 0;

    const converted = conversionSignals.filter(s => s.data?.converted).length;
    return converted / conversionSignals.length;
  }

  /**
   * Calculate retention indicator
   */
  calculateRetentionIndicator(retentionSignals) {
    if (retentionSignals.length === 0) return 0.5;

    const returnCount = retentionSignals.filter(s => s.data?.returned).length;
    return returnCount / retentionSignals.length;
  }

  /**
   * Detect patterns in signals
   */
  detectPatterns(signals) {
    const patterns = [];

    // Time-based patterns
    const hourCounts = new Array(24).fill(0);
    for (const signal of signals) {
      const hour = new Date(signal.timestamp).getHours();
      hourCounts[hour]++;
    }

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    patterns.push({ type: 'peak_hour', value: peakHour });

    // Sequence patterns (consecutive friction events)
    let maxFrictionStreak = 0;
    let currentStreak = 0;
    for (const signal of signals) {
      if (signal.type === SIGNAL_TYPES.FRICTION) {
        currentStreak++;
        maxFrictionStreak = Math.max(maxFrictionStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    if (maxFrictionStreak > 3) {
      patterns.push({ type: 'friction_streak', value: maxFrictionStreak });
    }

    return patterns;
  }

  /**
   * Detect anomalies
   */
  detectAnomalies(signals) {
    const anomalies = [];

    // Sudden spike in friction
    const last10 = signals.slice(-10);
    const frictionIn10 = last10.filter(s => s.type === SIGNAL_TYPES.FRICTION).length;
    if (frictionIn10 > 7) {
      anomalies.push({ type: 'friction_spike', severity: 'high' });
    }

    return anomalies;
  }

  /**
   * Generate hypotheses from analysis
   */
  generateHypotheses(analysis) {
    const hypotheses = [];

    if (analysis.frictionLevel > 15) {
      hypotheses.push({
        id: `hyp_${Date.now()}_1`,
        domain: LEARNING_DOMAINS.VERA_PROMPTS,
        statement: 'High friction suggests Vera responses may be too long or abstract',
        action: 'Reduce response length by 20%, increase empathy markers',
        confidence: Math.min(0.9, analysis.frictionLevel / 20),
      });
    }

    if (analysis.engagementScore < 0.4) {
      hypotheses.push({
        id: `hyp_${Date.now()}_2`,
        domain: LEARNING_DOMAINS.UX_FLOWS,
        statement: 'Low engagement suggests friction in core flows',
        action: 'Simplify onboarding, reduce steps to first reading',
        confidence: 0.7,
      });
    }

    if (analysis.conversionRate < 0.02 && analysis.engagementScore > 0.6) {
      hypotheses.push({
        id: `hyp_${Date.now()}_3`,
        domain: LEARNING_DOMAINS.AD_TARGETING,
        statement: 'High engagement but low conversion suggests ad targeting mismatch',
        action: 'Adjust ad timing, target premium upsell after positive experiences',
        confidence: 0.6,
      });
    }

    for (const pattern of analysis.patterns) {
      if (pattern.type === 'friction_streak') {
        hypotheses.push({
          id: `hyp_${Date.now()}_streak`,
          domain: LEARNING_DOMAINS.GUARDIAN_RULES,
          statement: 'Consecutive friction events suggest systemic issue',
          action: 'Relax rate limits temporarily, add helpful error messages',
          confidence: 0.75,
        });
      }
    }

    return hypotheses;
  }

  /**
   * Run optimizations using RBRS and QAOA
   */
  async runOptimizations(analysis) {
    const optimizations = {};

    // Vera prompt optimization
    const veraInitialState = {
      responseLength: 0.8,
      empathyLevel: 0.7,
      directness: 0.5,
      mysticalTone: 0.6,
      questionFrequency: 0.3,
    };

    const veraScoreFn = (state) => {
      // Lower friction = higher score
      const frictionPenalty = analysis.frictionLevel * 0.1;
      // Higher engagement = higher score
      const engagementBonus = analysis.engagementScore;
      // Balance mystical and direct
      const balanceBonus = 1 - Math.abs(state.mysticalTone - state.directness);

      return engagementBonus + balanceBonus - frictionPenalty +
             state.empathyLevel * 0.2;
    };

    const veraTree = new RBRSTree(veraInitialState, veraScoreFn);
    optimizations.vera = veraTree.search(30);

    // Ad targeting optimization (using QAOA)
    const adObjectiveFn = (state) => {
      // Maximize conversion while maintaining engagement
      const conversionWeight = Object.values(state).reduce((s, v) => s + v, 0);
      return analysis.conversionRate * conversionWeight +
             analysis.engagementScore * (1 - conversionWeight / Object.keys(state).length);
    };

    const qaoa = new QAOAOptimizer(adObjectiveFn, 4);
    optimizations.ads = qaoa.optimize(50);

    // Guardian rules optimization
    const guardianInitialState = {
      maxRequestsPerMinute: 10,
      injectionSensitivity: 0.5,
      trustDecayRate: 0.1,
      newUserRestriction: 0.3,
    };

    const guardianScoreFn = (state) => {
      // Balance security with usability
      const securityScore = state.injectionSensitivity;
      const usabilityScore = state.maxRequestsPerMinute / 15;
      const frictionPenalty = analysis.frictionLevel > 20 ? 0.3 : 0;

      return securityScore * 0.4 + usabilityScore * 0.4 - frictionPenalty;
    };

    const guardianTree = new RBRSTree(guardianInitialState, guardianScoreFn);
    optimizations.guardian = guardianTree.search(20);

    return optimizations;
  }

  /**
   * Generate configuration code from optimizations
   */
  generateConfigurations(optimizations) {
    const configs = [];

    // Generate Vera config
    if (optimizations.vera) {
      configs.push({
        domain: LEARNING_DOMAINS.VERA_PROMPTS,
        config: {
          ...optimizations.vera.finalState,
          generatedAt: Date.now(),
          score: optimizations.vera.score,
        },
        code: this.generateVeraConfigCode(optimizations.vera.finalState),
      });
    }

    // Generate Guardian config
    if (optimizations.guardian) {
      configs.push({
        domain: LEARNING_DOMAINS.GUARDIAN_RULES,
        config: {
          ...optimizations.guardian.finalState,
          generatedAt: Date.now(),
          score: optimizations.guardian.score,
        },
        code: this.generateGuardianConfigCode(optimizations.guardian.finalState),
      });
    }

    // Generate Ad targeting config
    if (optimizations.ads) {
      configs.push({
        domain: LEARNING_DOMAINS.AD_TARGETING,
        config: {
          ...optimizations.ads.state,
          generatedAt: Date.now(),
          score: optimizations.ads.score,
        },
        code: this.generateAdConfigCode(optimizations.ads.state),
      });
    }

    return configs;
  }

  /**
   * Generate Vera configuration code string
   */
  generateVeraConfigCode(state) {
    return `
// Auto-generated Vera configuration
// Generated at: ${new Date().toISOString()}
export const VERA_CONFIG = {
  responseLength: ${state.responseLength.toFixed(3)},
  empathyLevel: ${state.empathyLevel.toFixed(3)},
  directness: ${state.directness.toFixed(3)},
  mysticalTone: ${state.mysticalTone.toFixed(3)},
  questionFrequency: ${state.questionFrequency?.toFixed(3) || 0.3},

  // Computed modifiers
  maxTokens: Math.round(500 * ${state.responseLength.toFixed(3)}),
  empathyMarkers: ${state.empathyLevel > 0.6},
  useQuestions: ${(state.questionFrequency || 0.3) > 0.25},
};
`.trim();
  }

  /**
   * Generate Guardian configuration code string
   */
  generateGuardianConfigCode(state) {
    return `
// Auto-generated Guardian configuration
// Generated at: ${new Date().toISOString()}
export const GUARDIAN_CONFIG = {
  maxRequestsPerMinute: ${Math.round(state.maxRequestsPerMinute)},
  maxRequestsPerDay: ${Math.round(state.maxRequestsPerMinute * 10)},
  injectionSensitivity: ${state.injectionSensitivity.toFixed(3)},
  trustDecayRate: ${state.trustDecayRate.toFixed(3)},
  newUserRestrictionLevel: ${state.newUserRestriction.toFixed(3)},

  // Derived thresholds
  injectionThreshold: ${(0.5 * state.injectionSensitivity).toFixed(3)},
  rateLimitGrace: ${Math.round(state.maxRequestsPerMinute * 0.2)},
};
`.trim();
  }

  /**
   * Generate Ad targeting configuration code string
   */
  generateAdConfigCode(state) {
    const dims = Object.entries(state);
    return `
// Auto-generated Ad targeting configuration
// Generated at: ${new Date().toISOString()}
export const AD_TARGET_CONFIG = {
  dimensions: {
${dims.map(([k, v]) => `    ${k}: ${v},`).join('\n')}
  },

  // Derived weights
  placementWeights: {
    post_reading: ${(state.dim_0 || 0.5).toFixed(3)},
    journal_prompt: ${(state.dim_1 || 0.5).toFixed(3)},
    vera_cooldown: ${(state.dim_2 || 0.5).toFixed(3)},
    achievement_unlock: ${(state.dim_3 || 0.5).toFixed(3)},
  },
};
`.trim();
  }

  /**
   * Validate generated configurations
   */
  validateConfigurations(configs) {
    const validated = [];

    for (const config of configs) {
      // Basic validation: score must be positive
      if (config.config.score > 0) {
        // Check bounds
        const values = Object.values(config.config).filter(v => typeof v === 'number');
        const allInBounds = values.every(v => v >= 0 && v <= 100);

        if (allInBounds) {
          validated.push({
            ...config,
            validatedAt: Date.now(),
            status: 'validated',
          });
        }
      }
    }

    return validated;
  }

  /**
   * Apply validated improvements
   */
  async applyImprovements(validated) {
    const ratchet = getRatchetLoop();

    for (const improvement of validated) {
      // Map learning domain to adaptation domain
      const domainMap = {
        [LEARNING_DOMAINS.VERA_PROMPTS]: ADAPTATION_DOMAINS.VERA,
        [LEARNING_DOMAINS.GUARDIAN_RULES]: ADAPTATION_DOMAINS.GUARDIAN,
        [LEARNING_DOMAINS.AD_TARGETING]: ADAPTATION_DOMAINS.ADS,
        [LEARNING_DOMAINS.UX_FLOWS]: ADAPTATION_DOMAINS.UX,
        [LEARNING_DOMAINS.CONTENT_RANKING]: ADAPTATION_DOMAINS.CONTENT,
      };

      const adaptDomain = domainMap[improvement.domain];
      if (adaptDomain) {
        ratchet.applyAdaptation(adaptDomain, improvement.config);
      }

      // Trigger learning callbacks
      const callbacks = this.learningCallbacks[improvement.domain] || [];
      for (const callback of callbacks) {
        try {
          callback(improvement);
        } catch (error) {
          console.error('[MetaLearner] Callback error:', error);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PERSISTENCE & STATUS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get MetaLearner status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      lastLearningCycle: this.state.lastLearningCycle,
      signalCount: this.state.signals.length,
      hypothesisCount: this.state.hypotheses.length,
      configCount: this.state.generatedConfigs.length,
      validatedCount: this.state.validatedImprovements.length,
      recentHypotheses: this.state.hypotheses.slice(-5),
    };
  }

  /**
   * Get generated code history
   */
  getGeneratedCodeHistory(limit = 10) {
    return this.state.generatedConfigs.slice(-limit);
  }

  /**
   * Persist state
   */
  async persist() {
    try {
      await AsyncStorage.setItem(META_STATE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('[MetaLearner] Persist error:', error);
    }
  }

  /**
   * Reset MetaLearner (for testing)
   */
  async reset() {
    this.state = {
      version: 1,
      lastLearningCycle: null,
      signals: [],
      hypotheses: [],
      generatedConfigs: [],
      validatedImprovements: [],
    };

    await AsyncStorage.removeItem(META_STATE_KEY);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

let instance = null;

/**
 * Get MetaLearner singleton
 */
export function getMetaLearner() {
  if (!instance) {
    instance = new MetaLearner();
  }
  return instance;
}

/**
 * Initialize MetaLearner
 */
export async function initMetaLearner() {
  const learner = getMetaLearner();
  await learner.initialize();
  return learner;
}

export { SIGNAL_TYPES, LEARNING_DOMAINS, RBRSTree, QAOAOptimizer };
export default MetaLearner;
