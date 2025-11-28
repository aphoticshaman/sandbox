/**
 * SDPM Vera Personality Engine - Patent #467
 * Sanskrit-Derived Phonetic Mapping for AI Personality Vectors
 *
 * This system maps Sanskrit phonemes to a 7-dimensional personality vector,
 * enabling dynamic, personalized AI responses based on:
 * 1. Vera personality name phonetics (base personality)
 * 2. User interaction patterns (learned adaptation)
 * 3. Moment context (time, mood, activity)
 */

import {
  PHONEME_TO_CHAKRA,
  CHAKRA_TRAITS,
  VERA_PRESETS,
  FEEDBACK_TYPES
} from './types.js';

/**
 * Vera Personality Engine
 * Manages dynamic personality vectors for AI Vera responses
 */
export class VeraPersonality {
  /**
   * @param {string} veraName - Name of the persona (e.g., 'luna', 'sol', 'sarasvati')
   */
  constructor(veraName = 'luna') {
    this.veraName = veraName.toLowerCase();

    // Check if preset exists, otherwise derive from name phonemes
    if (VERA_PRESETS[this.veraName]) {
      this.baseVector = { ...VERA_PRESETS[this.veraName].baseVector };
    } else {
      this.baseVector = this.nameToVector(veraName);
    }

    // User adaptation vector (learned over time)
    this.userAdaptationVector = this.neutralVector();

    // Moment-specific modulation (temporary)
    this.momentVector = this.neutralVector();

    // Momentum state for smooth adaptation
    this.momentumState = {
      alpha: 0.9, // Decay rate
      velocities: {} // Track feedback patterns
    };

    // Feedback history for learning
    this.feedbackHistory = [];
  }

  /**
   * Convert a Sanskrit-transliterated name to SDPM vector
   * Example: "Sarasvati" → high vishuddha (S), high sahasrara (S), high anahata (T)
   *
   * @param {string} name - Vera personality name
   * @returns {Object} SDPMVector
   */
  nameToVector(name) {
    const vector = this.neutralVector();
    const phonemes = this.extractPhonemes(name.toLowerCase());

    // Each phoneme adds weight to its chakra dimension
    const phonemeWeight = 0.12; // Weight per phoneme occurrence

    for (const phoneme of phonemes) {
      const chakra = PHONEME_TO_CHAKRA[phoneme];
      if (chakra) {
        vector[chakra] = Math.min(1, vector[chakra] + phonemeWeight);
      }
    }

    return this.normalize(vector);
  }

  /**
   * Extract phonemes from text using Sanskrit phonology rules
   *
   * @param {string} text - Input text
   * @returns {string[]} Array of phonemes
   */
  extractPhonemes(text) {
    const phonemes = [];
    let i = 0;

    while (i < text.length) {
      // Try three-character phonemes first (e.g., 'sha', 'cha')
      const threeChar = text.slice(i, i + 3);
      if (PHONEME_TO_CHAKRA[threeChar]) {
        phonemes.push(threeChar);
        i += 3;
        continue;
      }

      // Try two-character phonemes (e.g., 'ka', 'ga', 'sh')
      const twoChar = text.slice(i, i + 2);
      if (PHONEME_TO_CHAKRA[twoChar]) {
        phonemes.push(twoChar);
        i += 2;
        continue;
      }

      // Try single character
      const oneChar = text[i];
      if (PHONEME_TO_CHAKRA[oneChar]) {
        phonemes.push(oneChar);
      }

      i++;
    }

    return phonemes;
  }

  /**
   * Generate system prompt modifier based on current personality state
   * This is injected into Vera's system prompt
   *
   * @returns {string} Personality modifier text
   */
  generatePromptModifier() {
    const combined = this.combineVectors();
    const traits = [];

    // Generate trait instructions based on high dimensions
    for (const [chakra, value] of Object.entries(combined)) {
      if (value > 0.6) {
        const trait = CHAKRA_TRAITS[chakra];
        if (trait) {
          traits.push(trait.high);
        }
      } else if (value < 0.4) {
        const trait = CHAKRA_TRAITS[chakra];
        if (trait) {
          traits.push(trait.low);
        }
      }
    }

    if (traits.length === 0) {
      return ''; // Neutral personality, no modifier needed
    }

    return `\n## PERSONALITY MODULATION (SDPM)
${traits.map(t => `- ${t}`).join('\n')}`;
  }

  /**
   * Adapt personality based on user feedback
   * Called after each Vera interaction
   *
   * @param {Object} feedback - User feedback object
   * @param {string} feedback.type - Feedback type from FEEDBACK_TYPES
   * @param {number} feedback.intensity - 0.0 to 1.0
   */
  adaptToUser(feedback) {
    const { type, intensity = 0.5 } = feedback;
    const adaptRate = 0.05 * intensity;

    switch (type) {
      case FEEDBACK_TYPES.TOO_ABSTRACT:
        // User wants more grounding → boost muladhara, reduce sahasrara
        this.userAdaptationVector.muladhara += adaptRate;
        this.userAdaptationVector.sahasrara -= adaptRate * 0.5;
        break;

      case FEEDBACK_TYPES.TOO_DIRECT:
        // User wants softer approach → boost anahata, reduce manipura
        this.userAdaptationVector.anahata += adaptRate;
        this.userAdaptationVector.manipura -= adaptRate * 0.5;
        break;

      case FEEDBACK_TYPES.MISSED_POINT:
        // User needs better listening → boost ajna (intuition)
        this.userAdaptationVector.ajna += adaptRate;
        break;

      case FEEDBACK_TYPES.TOO_LONG:
        // User prefers brevity → boost vishuddha (clarity)
        this.userAdaptationVector.vishuddha += adaptRate;
        this.userAdaptationVector.svadhisthana -= adaptRate * 0.3; // Less flourishes
        break;

      case FEEDBACK_TYPES.WANT_MORE:
        // User wants depth → boost sahasrara, svadhisthana
        this.userAdaptationVector.sahasrara += adaptRate;
        this.userAdaptationVector.svadhisthana += adaptRate * 0.5;
        break;

      case FEEDBACK_TYPES.RESONATED:
      case FEEDBACK_TYPES.PERFECT:
        // Reinforce current pattern (momentum)
        this.reinforceCurrentPattern(adaptRate);
        break;
    }

    // Normalize and clamp
    this.userAdaptationVector = this.clamp(this.userAdaptationVector);

    // Store feedback for analysis
    this.feedbackHistory.push({
      type,
      intensity,
      timestamp: Date.now()
    });

    // Keep only recent feedback
    if (this.feedbackHistory.length > 50) {
      this.feedbackHistory = this.feedbackHistory.slice(-50);
    }
  }

  /**
   * Reinforce current personality pattern when feedback is positive
   *
   * @param {number} rate - Reinforcement rate
   */
  reinforceCurrentPattern(rate) {
    const combined = this.combineVectors();

    // Find dominant dimensions and slightly boost them
    const sorted = Object.entries(combined).sort((a, b) => b[1] - a[1]);
    const top3 = sorted.slice(0, 3);

    for (const [chakra] of top3) {
      this.userAdaptationVector[chakra] += rate * 0.3;
    }
  }

  /**
   * Set moment-specific modulation
   * Time of day, mood, activity, moon phase, etc.
   *
   * @param {Object} context - Moment context
   */
  setMomentContext(context) {
    // Reset moment vector
    this.momentVector = this.neutralVector();

    const { hourOfDay, userMood, currentActivity, moonPhase, sessionDuration } = context;

    // Time of day modulation
    if (hourOfDay !== undefined) {
      // Late night (10pm - 4am) → boost intuition, reduce action
      if (hourOfDay >= 22 || hourOfDay <= 4) {
        this.momentVector.ajna += 0.1;
        this.momentVector.sahasrara += 0.08;
        this.momentVector.manipura -= 0.1;
      }
      // Early morning (5am - 8am) → boost clarity and grounding
      else if (hourOfDay >= 5 && hourOfDay <= 8) {
        this.momentVector.vishuddha += 0.1;
        this.momentVector.muladhara += 0.08;
      }
      // Afternoon (2pm - 5pm) → boost action and practicality
      else if (hourOfDay >= 14 && hourOfDay <= 17) {
        this.momentVector.manipura += 0.1;
        this.momentVector.muladhara += 0.05;
      }
    }

    // Mood-based modulation
    if (userMood === 'low') {
      // Low mood → boost empathy, reduce directness
      this.momentVector.anahata += 0.15;
      this.momentVector.manipura -= 0.1;
    } else if (userMood === 'high') {
      // High mood → can handle more challenge
      this.momentVector.manipura += 0.08;
    }

    // Activity-based modulation
    if (currentActivity === 'journaling') {
      // Journaling → boost expression and introspection
      this.momentVector.vishuddha += 0.1;
      this.momentVector.ajna += 0.08;
    } else if (currentActivity === 'reading') {
      // Card reading → boost intuition and synthesis
      this.momentVector.ajna += 0.12;
      this.momentVector.sahasrara += 0.1;
    } else if (currentActivity === 'browsing') {
      // Casual browsing → keep it light
      this.momentVector.svadhisthana += 0.05;
    }

    // Moon phase modulation (subtle)
    if (moonPhase === 'new') {
      // New moon → introspection, intuition
      this.momentVector.ajna += 0.05;
      this.momentVector.muladhara += 0.05;
    } else if (moonPhase === 'full') {
      // Full moon → expression, illumination
      this.momentVector.vishuddha += 0.05;
      this.momentVector.sahasrara += 0.05;
    }

    // Long session → might need grounding
    if (sessionDuration && sessionDuration > 30) {
      this.momentVector.muladhara += 0.05;
    }

    // Clamp values
    this.momentVector = this.clamp(this.momentVector);
  }

  /**
   * Combine all three vectors with weighted averaging
   *
   * @returns {Object} Combined SDPMVector
   */
  combineVectors() {
    // Weights: 40% base, 30% user adaptation, 30% moment
    const weights = {
      base: 0.4,
      user: 0.3,
      moment: 0.3
    };

    const result = this.neutralVector();

    for (const key of Object.keys(result)) {
      result[key] =
        weights.base * this.baseVector[key] +
        weights.user * this.userAdaptationVector[key] +
        weights.moment * this.momentVector[key];
    }

    return result;
  }

  /**
   * Get current personality state for debugging/display
   *
   * @returns {Object} Current state
   */
  getState() {
    return {
      veraName: this.veraName,
      baseVector: { ...this.baseVector },
      userAdaptationVector: { ...this.userAdaptationVector },
      momentVector: { ...this.momentVector },
      combinedVector: this.combineVectors(),
      feedbackCount: this.feedbackHistory.length
    };
  }

  /**
   * Get dominant personality traits (for UI display)
   *
   * @returns {string[]} Top 3 dominant traits
   */
  getDominantTraits() {
    const combined = this.combineVectors();
    const sorted = Object.entries(combined)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return sorted.map(([chakra, value]) => ({
      chakra,
      value: Math.round(value * 100),
      trait: CHAKRA_TRAITS[chakra]?.high?.split('.')[0] || chakra
    }));
  }

  /**
   * Reset user adaptation (start fresh)
   */
  resetAdaptation() {
    this.userAdaptationVector = this.neutralVector();
    this.feedbackHistory = [];
  }

  /**
   * Serialize state for storage
   *
   * @returns {Object} Serializable state
   */
  serialize() {
    return {
      veraName: this.veraName,
      userAdaptationVector: this.userAdaptationVector,
      feedbackHistory: this.feedbackHistory.slice(-20) // Keep recent only
    };
  }

  /**
   * Restore from serialized state
   *
   * @param {Object} state - Serialized state
   */
  restore(state) {
    if (state.userAdaptationVector) {
      this.userAdaptationVector = state.userAdaptationVector;
    }
    if (state.feedbackHistory) {
      this.feedbackHistory = state.feedbackHistory;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Create neutral (0.5) vector
   */
  neutralVector() {
    return {
      muladhara: 0.5,
      svadhisthana: 0.5,
      manipura: 0.5,
      anahata: 0.5,
      vishuddha: 0.5,
      ajna: 0.5,
      sahasrara: 0.5
    };
  }

  /**
   * Normalize vector to average 0.5 per dimension
   */
  normalize(vector) {
    const values = Object.values(vector);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    if (avg === 0) return this.neutralVector();

    const result = {};
    const scale = 0.5 / avg;

    for (const [key, value] of Object.entries(vector)) {
      result[key] = Math.min(1, Math.max(0, value * scale));
    }

    return result;
  }

  /**
   * Clamp vector values to 0-1 range
   */
  clamp(vector) {
    const result = {};

    for (const [key, value] of Object.entries(vector)) {
      result[key] = Math.max(0, Math.min(1, value));
    }

    return result;
  }
}

// ═══════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Create Vera personality for a specific persona
 *
 * @param {string} veraName - Vera personality name
 * @returns {VeraPersonality}
 */
export function createVeraPersonality(veraName = 'luna') {
  return new VeraPersonality(veraName);
}

/**
 * Get available persona presets
 *
 * @returns {Object[]} Array of preset info
 */
export function getAvailablePersonalities() {
  return Object.entries(VERA_PRESETS).map(([key, preset]) => ({
    id: key,
    name: preset.name,
    description: preset.description
  }));
}

export default VeraPersonality;
