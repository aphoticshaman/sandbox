/**
 * VeilPath Core Module
 *
 * This module contains the core engines for VeilPath's adaptive experience:
 *
 * - PhiTiming: Golden ratio timing utilities for harmonious UX
 * - CoherenceEngine: Kuramoto-based behavioral coherence measurement
 * - AdaptiveAI: Coherence-gated LLM parameter selection
 * - HybridRouter: Edge/cloud AI routing for cost optimization
 * - PSANTriFork: Multi-substrate coherence and search optimization
 *
 * Usage:
 *   import { coherenceEngine, adaptiveAI, hybridRouter, PHI } from '@/core';
 */

// Timing utilities (no dependencies)
export {
  default as PhiTiming,
  PHI,
  PHI_INVERSE,
  PHI_SQUARED,
  TIMING,
  phiEaseIn,
  phiEaseOut,
  phiEaseInOut,
  phiSpring,
  getBreathingState,
  getBreathCycleDuration,
  fibonacci,
  fibonacciN,
  scaleByPhi,
  phiDelaySequence,
  calculateStagger,
  createPhiRhythm,
  isStateChangeAllowed,
  getPhiSpringConfig,
  getPhiTimingConfig,
} from './PhiTiming';

// Coherence engine with momentum-gating (depends on PhiTiming)
export {
  default as coherenceEngine,
  CoherenceEngine,
  COHERENCE_STATES,
  KAPPA,           // Patent-locked momentum sensitivity (1.0)
  THRESHOLD_BASE,  // Base thresholds before momentum adjustment
} from './CoherenceEngine';

// Adaptive AI (depends on CoherenceEngine, PhiTiming)
export {
  default as adaptiveAI,
  AdaptiveAI,
  AI_PROFILES,
  PROMPT_TEMPLATES,
} from './AdaptiveAI';

// Hybrid router (depends on all above)
export {
  default as hybridRouter,
  HybridRouter,
  ROUTE_TARGETS,
  ROUTE_CONFIG,
  estimateComplexity,
  routeCardReading,
  routeSpreadReading,
  routeJournalReflection,
} from './HybridRouter';

// PSAN Tri-Fork utilities (multi-substrate coherence)
export {
  default as PSANTriFork,
  computeCrossCoherence,
  simulateQuantumCoherence,
  simulatePhotonicCoherence,
  RRBRScoreManager,
  computeKGANISNoise,
  NOISE_BASE_BY_STATE,
  estimateKolmogorovComplexity,
  computeFitness,
  shouldPrune,
  phiSpiralStep,
  hopfProject,
  PPRModule,
} from './PSANTriFork';

// ═══════════════════════════════════════════════════════════
// INITIALIZATION HELPER
// ═══════════════════════════════════════════════════════════

/**
 * Initialize all core engines
 * Call this on app startup
 */
export function initializeCoreEngines() {
  // Import singletons to ensure they're created
  const { coherenceEngine } = require('./CoherenceEngine');
  const { adaptiveAI } = require('./AdaptiveAI');
  const { hybridRouter } = require('./HybridRouter');

  // Start coherence sampling
  coherenceEngine.start();

  console.log('[Core] All engines initialized');

  return {
    coherenceEngine,
    adaptiveAI,
    hybridRouter,
  };
}

/**
 * Shutdown core engines
 * Call this on app close/background
 */
export function shutdownCoreEngines() {
  const { coherenceEngine } = require('./CoherenceEngine');
  coherenceEngine.stop();

  console.log('[Core] Engines shut down');
}
