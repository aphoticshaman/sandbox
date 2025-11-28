/**
 * PSANTriFork.js - Phase-Synchronized Attention Network Utilities
 *
 * Advanced coherence utilities for multi-substrate synchronization:
 *
 * - Cross-Substrate Coherence (C_cross): Harmonic mean across Digital,
 *   Quantum, and Photonic processing substrates
 * - RRBR (Ratcheting Recurrence & Backtracking Register): Asymmetric
 *   gain preservation for long-term stability
 * - KGANIS (Kuramoto-Gated Adaptive Noise Injection): Stochastic
 *   resonance-based exploration control
 * - Kolmogorov Complexity Proxy (K_h): Solution simplicity measurement
 *
 * These utilities extend the core momentum-gated coherence engine with
 * patent-protected multi-fork validation and search optimization.
 */

import { KAPPA, THRESHOLD_BASE } from './CoherenceEngine';
import { PHI } from './PhiTiming';

// ═══════════════════════════════════════════════════════════
// CROSS-SUBSTRATE COHERENCE (C_cross)
// ═══════════════════════════════════════════════════════════

/**
 * Compute Cross-Substrate Coherence using harmonic mean
 *
 * C_cross = min(1.0, 3 / (1/R_d + 1/R_q + 1/R_p))
 *
 * The harmonic mean is extremely sensitive to the smallest input value.
 * If ANY substrate decoherence (R → 0), C_cross collapses, enforcing
 * strict cross-platform stability requirements.
 *
 * @param {number} R_digital - Digital fork coherence [0, 1]
 * @param {number} R_quantum - Quantum fork coherence [0, 1]
 * @param {number} R_photonic - Photonic fork coherence [0, 1]
 * @returns {number} Cross-substrate coherence [0, 1]
 */
export function computeCrossCoherence(R_digital, R_quantum, R_photonic) {
  const epsilon = 1e-9; // Prevent division by zero

  // Clamp inputs to valid range
  const Rd = Math.max(epsilon, Math.min(1, R_digital));
  const Rq = Math.max(epsilon, Math.min(1, R_quantum));
  const Rp = Math.max(epsilon, Math.min(1, R_photonic));

  // Harmonic mean
  const harmonicMean = 3 / (1/Rd + 1/Rq + 1/Rp);

  return Math.min(1.0, harmonicMean);
}

/**
 * Simulated quantum coherence (for testing without quantum hardware)
 * Models near-unity coherence with small random fluctuations
 */
export function simulateQuantumCoherence(baseR = 0.95) {
  const noise = (Math.random() - 0.5) * 0.06;
  return Math.min(0.99, Math.max(0.85, baseR + noise));
}

/**
 * Simulated photonic coherence (for testing without photonic hardware)
 */
export function simulatePhotonicCoherence(baseR = 0.93) {
  const noise = (Math.random() - 0.5) * 0.08;
  return Math.min(0.99, Math.max(0.82, baseR + noise));
}

// ═══════════════════════════════════════════════════════════
// RRBR - RATCHETING RECURRENCE & BACKTRACKING REGISTER
// ═══════════════════════════════════════════════════════════

/**
 * RRBR Score Manager
 *
 * Implements asymmetric gain/loss handling:
 *   - Gains amplified by 1.1x (ratcheting up)
 *   - Losses dampened by 0.5x (soft backtracking)
 *
 * This preserves progress during high-coherence periods while
 * allowing exploration during TURBULENT/COLLAPSE states without
 * destroying accumulated score.
 */
export class RRBRScoreManager {
  constructor(options = {}) {
    this.score = options.initialScore || 0;
    this.lastFitness = options.initialFitness || 0;
    this.gainMultiplier = options.gainMultiplier || 1.1;
    this.lossMultiplier = options.lossMultiplier || 0.5;
    this.history = [];
    this.historyMaxLength = options.historyMaxLength || 100;
  }

  /**
   * Update RRBR score with new fitness value
   * @param {number} currentFitness - Current fitness value
   * @returns {number} Updated RRBR score
   */
  update(currentFitness) {
    const delta = currentFitness - this.lastFitness;

    if (delta > 0) {
      // Gain: amplify and ratchet up
      this.score += delta * this.gainMultiplier;
    } else {
      // Loss: dampen the backslide
      this.score += delta * this.lossMultiplier;
    }

    // Record history
    this.history.push({
      timestamp: Date.now(),
      fitness: currentFitness,
      delta,
      score: this.score,
      wasGain: delta > 0,
    });

    if (this.history.length > this.historyMaxLength) {
      this.history.shift();
    }

    this.lastFitness = currentFitness;
    return this.score;
  }

  /**
   * Get current RRBR score
   */
  getScore() {
    return this.score;
  }

  /**
   * Get score statistics
   */
  getStats() {
    if (this.history.length === 0) {
      return { gains: 0, losses: 0, netGain: 0, avgDelta: 0 };
    }

    const gains = this.history.filter(h => h.wasGain).length;
    const losses = this.history.length - gains;
    const totalDelta = this.history.reduce((sum, h) => sum + h.delta, 0);

    return {
      gains,
      losses,
      winRate: gains / this.history.length,
      netGain: totalDelta,
      avgDelta: totalDelta / this.history.length,
      currentScore: this.score,
    };
  }

  /**
   * Reset RRBR state
   */
  reset() {
    this.score = 0;
    this.lastFitness = 0;
    this.history = [];
  }
}

// ═══════════════════════════════════════════════════════════
// KGANIS - KURAMOTO-GATED ADAPTIVE NOISE INJECTION
// ═══════════════════════════════════════════════════════════

/**
 * Compute KGANIS adaptive noise level
 *
 * ξ = ξ_base + (1-R)² + 1.5×|dR/dt|
 *
 * This formula implements Stochastic Resonance principles:
 *   - Base noise from persona (exploration mode)
 *   - Incoherence term (1-R)² maximizes noise when R→0
 *   - Momentum term adds noise during high volatility
 *
 * @param {number} R - Current coherence [0, 1]
 * @param {number} dRdt - Coherence momentum (derivative)
 * @param {number} xiBase - Base noise from persona (0.01 - 0.40)
 * @returns {number} Adaptive noise level [0, 0.55]
 */
export function computeKGANISNoise(R, dRdt, xiBase) {
  const incoherenceTerm = Math.pow(1 - R, 2);
  const momentumTerm = 1.5 * Math.abs(dRdt);

  const xi = xiBase + incoherenceTerm + momentumTerm;

  // Cap at 0.55 to prevent total chaos
  return Math.min(0.55, xi);
}

/**
 * Get recommended noise level for each coherence state
 */
export const NOISE_BASE_BY_STATE = {
  crystalline: 0.01,  // Minimal noise - verification mode
  fluid: 0.15,        // Moderate exploration
  turbulent: 0.25,    // High exploration
  collapse: 0.40,     // Maximum noise - global reframe
};

// ═══════════════════════════════════════════════════════════
// KOLMOGOROV COMPLEXITY PROXY (K_h)
// ═══════════════════════════════════════════════════════════

/**
 * Estimate Kolmogorov complexity from code/hypothesis string
 *
 * K_h ≈ log(1 + structural_complexity)
 *
 * This is a proxy measurement since true Kolmogorov complexity
 * is uncomputable. Uses structural metrics as approximation.
 *
 * @param {string} hypothesisCode - Code or solution string
 * @returns {number} Complexity estimate (higher = more complex)
 */
export function estimateKolmogorovComplexity(hypothesisCode) {
  if (!hypothesisCode || typeof hypothesisCode !== 'string') {
    return 1e-5; // Minimum complexity
  }

  // Structural complexity metrics
  const length = hypothesisCode.length;
  const uniqueChars = new Set(hypothesisCode).size;
  const lineCount = (hypothesisCode.match(/\n/g) || []).length + 1;

  // Count structural elements (rough approximation)
  const braceCount = (hypothesisCode.match(/[{}[\]()]/g) || []).length;
  const operatorCount = (hypothesisCode.match(/[+\-*/%=<>&|!^~]/g) || []).length;
  const keywordCount = (hypothesisCode.match(/\b(if|else|for|while|function|return|const|let|var|class)\b/g) || []).length;

  // Weighted structural complexity
  const structuralComplexity =
    length * 0.01 +
    uniqueChars * 0.5 +
    lineCount * 2 +
    braceCount * 1.5 +
    operatorCount * 1 +
    keywordCount * 3;

  return Math.max(1e-5, Math.log(1 + structuralComplexity));
}

// ═══════════════════════════════════════════════════════════
// FITNESS FUNCTION (F_h)
// ═══════════════════════════════════════════════════════════

/**
 * Compute integrated fitness score
 *
 * F_h = (TaskScore × C_cross) / (K_h × Runtime)
 *
 * Optimizes for:
 *   - High task performance
 *   - High cross-substrate reliability
 *   - Low complexity (parsimony)
 *   - Low runtime (efficiency)
 *
 * @param {number} taskScore - Task performance score [0, 1]
 * @param {number} crossCoherence - C_cross value [0, 1]
 * @param {number} complexity - K_h value (log scale)
 * @param {number} runtime - Execution time (seconds)
 * @returns {number} Fitness score
 */
export function computeFitness(taskScore, crossCoherence, complexity, runtime) {
  const safeComplexity = Math.max(1e-5, complexity);
  const safeRuntime = Math.max(1e-5, runtime);

  return (taskScore * crossCoherence) / (safeComplexity * safeRuntime);
}

/**
 * Determine if hypothesis should be pruned based on fitness
 * @param {number} fitness - Computed fitness score
 * @param {number} threshold - Pruning threshold (default: 0.5)
 * @returns {boolean} True if hypothesis should be pruned
 */
export function shouldPrune(fitness, threshold = 0.5) {
  return fitness < threshold;
}

// ═══════════════════════════════════════════════════════════
// PHI-SPIRAL UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Compute φ-spiral position at time t
 *
 * Forward: r = φ^(t/scale)
 * Backward: r = φ^(-t/scale)
 *
 * @param {number} t - Time step
 * @param {number} theta - Current angle (radians)
 * @param {number} omega - Angular velocity
 * @param {number} scale - Time scaling factor
 */
export function phiSpiralStep(t, theta, omega = 0.23 * Math.PI, scale = 200) {
  const rForward = Math.pow(PHI, t / scale);
  const rBackward = Math.pow(PHI, -t / scale);

  const x = rForward * Math.cos(theta);
  const y = rForward * Math.sin(theta);
  const z = rBackward * Math.sin(3 * theta); // Third harmonic twist

  return {
    x, y, z,
    rForward,
    rBackward,
    nextTheta: theta + omega,
  };
}

/**
 * Hopf projection from 3D to 2D coherence manifold
 *
 * (u, v) = (2xz/(x²+y²+z²), 2yz/(x²+y²+z²))
 */
export function hopfProject(x, y, z) {
  const denom = x*x + y*y + z*z + 1e-9;
  return {
    u: (2 * x * z) / denom,
    v: (2 * y * z) / denom,
  };
}

// ═══════════════════════════════════════════════════════════
// PHENOMENOLOGY RECORDER (PPR) - Observability Module
// ═══════════════════════════════════════════════════════════

/**
 * PPR_Module - Records complete system state for audit trail
 *
 * Captures all dynamical metrics at each step for:
 *   - Patent claim substantiation
 *   - System debugging
 *   - Research analysis
 */
export class PPRModule {
  constructor(options = {}) {
    this.records = [];
    this.maxRecords = options.maxRecords || 1000;
    this.step = 0;
  }

  /**
   * Log a complete state record
   */
  log(data) {
    this.step++;

    this.records.push({
      step: this.step,
      timestamp: Date.now(),
      ...data,
    });

    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }
  }

  /**
   * Get all records
   */
  getRecords() {
    return [...this.records];
  }

  /**
   * Get records in a time range
   */
  getRecordsInRange(startTime, endTime) {
    return this.records.filter(
      r => r.timestamp >= startTime && r.timestamp <= endTime
    );
  }

  /**
   * Export records as JSON
   */
  exportJSON() {
    return JSON.stringify(this.records, null, 2);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    if (this.records.length === 0) {
      return { steps: 0 };
    }

    const Rs = this.records.map(r => r.R).filter(r => r !== undefined);
    const avgR = Rs.length > 0 ? Rs.reduce((a, b) => a + b, 0) / Rs.length : 0;

    const states = this.records.map(r => r.state).filter(s => s !== undefined);
    const stateCounts = {};
    states.forEach(s => {
      stateCounts[s] = (stateCounts[s] || 0) + 1;
    });

    return {
      steps: this.step,
      recordCount: this.records.length,
      averageR: avgR,
      stateDistribution: stateCounts,
      firstTimestamp: this.records[0]?.timestamp,
      lastTimestamp: this.records[this.records.length - 1]?.timestamp,
    };
  }

  /**
   * Clear all records
   */
  reset() {
    this.records = [];
    this.step = 0;
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export default {
  // Cross-substrate coherence
  computeCrossCoherence,
  simulateQuantumCoherence,
  simulatePhotonicCoherence,

  // RRBR
  RRBRScoreManager,

  // KGANIS
  computeKGANISNoise,
  NOISE_BASE_BY_STATE,

  // Complexity & Fitness
  estimateKolmogorovComplexity,
  computeFitness,
  shouldPrune,

  // φ-spiral
  phiSpiralStep,
  hopfProject,

  // Observability
  PPRModule,
};
