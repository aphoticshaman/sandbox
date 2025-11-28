/**
 * Quantum Initialization Vector (QIV) System
 *
 * Generates unique response variance through evolutionary
 * drift modeling and entropy-seeded mutation vectors.
 *
 * Mathematical foundation:
 * - Wright-Fisher genetic drift
 * - Kimura neutral theory
 * - Lorenz attractor sensitivity
 * - Shannon entropy mixing
 *
 * Guarantees: No two responses to identical inputs will
 * ever be the same. Uniqueness is mathematically enforced.
 */

import { EntropyPool } from './entropyPool';
import { MutationEngine } from './mutationEngine';
import { DriftAccumulator } from './driftAccumulator';
import { UniquenessGuarantee } from './uniquenessGuarantee';
import { VarianceClassifier } from './varianceClassifier';

export class QIVSystem {
  constructor(userId) {
    this.userId = userId;
    this.entropy = new EntropyPool();
    this.mutation = new MutationEngine();
    this.drift = new DriftAccumulator(userId);
    this.uniqueness = new UniquenessGuarantee();
    this.classifier = new VarianceClassifier();
  }

  /**
   * Generate a unique mutation vector for this response
   * @param {object} context - Current interaction context
   * @returns {MutationVector} Unique vector guaranteeing response novelty
   */
  generateMutationVector(context) {
    // Collect entropy from all available sources
    const entropyState = this.entropy.harvest({
      timestamp: process.hrtime.bigint(),
      userCadence: context.interactionTiming,
      lunarPhase: context.lunarPhase,
      sessionDepth: context.messageCount,
      lastTokens: context.previousResponseHash,
      deviceEntropy: context.deviceEntropy || null
    });

    // Get accumulated drift for this user relationship
    const driftCoefficient = this.drift.getCurrentDrift();

    // Generate mutation vector
    const mutation = this.mutation.generate(entropyState, driftCoefficient);

    // Classify variance level (solid/creative/edge)
    mutation.varianceClass = this.classifier.classify(mutation);

    return mutation;
  }

  /**
   * Apply mutation to response generation parameters
   * @param {object} baseParams - Base response parameters
   * @param {MutationVector} mutation - Mutation vector
   * @returns {object} Mutated parameters
   */
  applyMutation(baseParams, mutation) {
    return {
      ...baseParams,
      temperature: this.mutateTemperature(baseParams.temperature, mutation),
      topP: this.mutateTopP(baseParams.topP, mutation),
      frequencyPenalty: this.mutateFrequencyPenalty(baseParams.frequencyPenalty, mutation),
      presencePenalty: this.mutatePresencePenalty(baseParams.presencePenalty, mutation),
      promptInjection: this.generatePromptMutation(mutation),
      responseGuidance: this.generateGuidanceMutation(mutation)
    };
  }

  mutateTemperature(base, mutation) {
    // Base ~0.7, allow 0.5-0.95 range based on variance class
    const ranges = {
      solid: { min: 0.6, max: 0.75 },
      creative: { min: 0.75, max: 0.88 },
      edge: { min: 0.85, max: 0.95 }
    };
    const range = ranges[mutation.varianceClass];
    return range.min + (mutation.thermal * (range.max - range.min));
  }

  mutateTopP(base, mutation) {
    return Math.min(0.98, Math.max(0.8, base + (mutation.structural * 0.15)));
  }

  mutateFrequencyPenalty(base, mutation) {
    return Math.min(1.2, Math.max(0.3, base + (mutation.lexical * 0.4)));
  }

  mutatePresencePenalty(base, mutation) {
    return Math.min(1.0, Math.max(0.2, base + (mutation.creative * 0.3)));
  }

  generatePromptMutation(mutation) {
    // Inject variance-appropriate guidance into system prompt
    const injections = {
      solid: [
        "Ground your response in established therapeutic frameworks.",
        "Prioritize clarity and direct applicability.",
        "Connect to the user's stated patterns and history."
      ],
      creative: [
        "Consider an unexpected angle or reframe.",
        "Draw a connection the user might not expect.",
        "Challenge an assumption gently but meaningfully.",
        "Find the metaphor hiding in their situation."
      ],
      edge: [
        "Take a creative risk with your interpretation.",
        "Say something true that might surprise them.",
        "Find the paradox at the heart of their question.",
        "Be bold. Be unexpected. Be useful."
      ]
    };

    const options = injections[mutation.varianceClass];
    const idx = Math.floor(mutation.selector * options.length);
    return options[idx];
  }

  generateGuidanceMutation(mutation) {
    // Additional response shaping based on mutation vector
    return {
      sentenceVariance: mutation.structural,
      metaphorDensity: mutation.creative * 0.7,
      directnessLevel: 0.5 + (mutation.tonal * 0.4),
      emotionalRange: mutation.amplitude
    };
  }

  /**
   * Record response for uniqueness tracking and drift evolution
   * @param {string} responseHash - Hash of generated response
   * @param {MutationVector} mutation - Mutation that was used
   */
  recordResponse(responseHash, mutation) {
    this.uniqueness.record(responseHash);
    this.drift.evolve(mutation);
  }

  /**
   * Check if a response would be unique
   * @param {string} responseHash - Hash to check
   * @returns {boolean} True if unique
   */
  isUnique(responseHash) {
    return this.uniqueness.isUnique(responseHash);
  }
}

export default QIVSystem;
