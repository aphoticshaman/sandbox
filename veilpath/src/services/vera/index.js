/**
 * Vera Service - Unified Patent Integration
 * Combines SDPM, PSAN, and Casimir for personalized AI guidance
 *
 * Patents integrated:
 * - SDPM (#467): Sanskrit-Derived Phonetic Mapping for personality
 * - PSAN (#504): Predictive Scaffold Attention Networks for synthesis
 * - Casimir (#544): Failure-as-signal friction analytics
 */

// SDPM - Vera Personality Engine
import { VeraPersonality, createVeraPersonality, getAvailablePersonalities } from './sdpm/VeraPersonality.js';
import { VERA_PRESETS, CHAKRA_TRAITS, FEEDBACK_TYPES } from './sdpm/types.js';

// PSAN - Multi-Stream Synthesizer
import { TriForkSynthesizer, createTriForkSynthesizer } from './psan/TriForkSynthesizer.js';
import { PATTERN_TYPES, ELEMENT_MEANINGS } from './psan/types.js';

// Casimir - Friction Analytics
import { getCasimirAnalyzer, logFrictionEvent, FRICTION_TYPES, FRICTION_CONTEXTS } from '../analytics/CasimirFrictionAnalyzer.js';

/**
 * Vera Service - Main integration class
 * Coordinates all patent systems for Vera responses
 */
export class VeraService {
  /**
   * @param {string} veraName - Name of vera personality ('luna', 'sol', etc.)
   */
  constructor(veraName = 'luna') {
    this.personality = createVeraPersonality(veraName);
    this.synthesizer = createTriForkSynthesizer();
    this.casimir = getCasimirAnalyzer();

    // Register friction adaptation callback
    this.casimir.onAdaptation(this.handleFrictionAdaptation.bind(this));
  }

  /**
   * Build complete Vera context for API request
   * Combines SDPM personality + PSAN synthesis + Casimir awareness
   *
   * @param {Object} userData - User data for personalization
   * @param {Array} userData.temporalSignals - Mood/engagement history
   * @param {Array} userData.symbolicTokens - Cards, tags, themes
   * @param {string} userData.contextualText - Recent journal/chat text
   * @param {Object} momentContext - Current moment context
   * @returns {Object} Complete Vera context
   */
  buildVeraContext(userData = {}, momentContext = {}) {
    // 1. Set moment context for SDPM personality
    this.personality.setMomentContext(momentContext);

    // 2. Generate SDPM personality modifier
    const personalityModifier = this.personality.generatePromptModifier();

    // 3. Run PSAN synthesis on multi-stream data
    const synthesis = this.synthesizer.synthesize({
      temporal: userData.temporalSignals || [],
      symbolic: userData.symbolicTokens || [],
      contextual: userData.contextualText || ''
    });

    // 4. Get Casimir friction context
    const frictionContext = this.casimir.getFrictionContext();

    // 5. Get SDPM adaptations from friction patterns
    const frictionAdaptation = this.casimir.getSDPMAdaptation();
    if (frictionAdaptation) {
      this.applyFrictionAdaptation(frictionAdaptation);
    }

    return {
      // For system prompt injection
      systemModifier: this.buildSystemModifier(personalityModifier, synthesis, frictionContext),

      // Individual components for debugging/logging
      personality: {
        veraName: this.personality.veraName,
        dominantTraits: this.personality.getDominantTraits(),
        modifier: personalityModifier
      },
      synthesis: {
        prompt: synthesis.synthesisPrompt,
        confidence: synthesis.confidence,
        insights: synthesis.insights,
        dominantStream: synthesis.dominantStream
      },
      friction: {
        context: frictionContext,
        level: this.casimir.getAnalyticsSummary().frictionLevel
      }
    };
  }

  /**
   * Build unified system modifier string
   */
  buildSystemModifier(personalityMod, synthesis, frictionContext) {
    let modifier = '';

    // Add PSAN synthesis context
    if (synthesis.synthesisPrompt && synthesis.confidence > 0.3) {
      modifier += synthesis.synthesisPrompt;
    }

    // Add SDPM personality modifiers
    if (personalityMod) {
      modifier += personalityMod;
    }

    // Add friction awareness (subtle)
    if (frictionContext && frictionContext.includes('elevated')) {
      modifier += `\n\n## USER STATE NOTE\n`;
      modifier += `User has shown some friction patterns. Be especially clear and concise. `;
      modifier += `Validate before challenging. Check understanding before moving forward.`;
    }

    return modifier.trim();
  }

  /**
   * Record user feedback for SDPM adaptation
   *
   * @param {string} feedbackType - Type from FEEDBACK_TYPES
   * @param {number} intensity - 0.0 to 1.0
   */
  recordFeedback(feedbackType, intensity = 0.5) {
    this.personality.adaptToUser({ type: feedbackType, intensity });
  }

  /**
   * Record friction event
   *
   * @param {string} type - Type from FRICTION_TYPES
   * @param {string} context - Context from FRICTION_CONTEXTS
   * @param {Object} sessionData - Session state
   */
  async recordFriction(type, context, sessionData = {}) {
    return logFrictionEvent(type, context, sessionData);
  }

  /**
   * Handle friction-triggered adaptation
   */
  handleFrictionAdaptation(adaptation) {
    console.log(`[VeraService] Friction adaptation: ${adaptation.action}`);

    switch (adaptation.action) {
      case 'simplify_journal_prompts':
        // Could trigger UI changes or store preference
        break;
      case 'shorten_vera_responses':
        // Boost vishuddha (clarity)
        this.personality.adaptToUser({
          type: FEEDBACK_TYPES.TOO_LONG,
          intensity: adaptation.confidence
        });
        break;
      case 'recalibrate_interpretations':
        // Reset some momentum, increase user attention weight
        this.synthesizer.resetMomentum();
        break;
      case 'increase_response_personalization':
        // Boost anahata (empathy)
        this.personality.adaptToUser({
          type: FEEDBACK_TYPES.MISSED_POINT,
          intensity: adaptation.confidence
        });
        break;
    }
  }

  /**
   * Apply friction-derived SDPM adaptations
   */
  applyFrictionAdaptation(adaptations) {
    for (const [chakra, delta] of Object.entries(adaptations)) {
      this.personality.userAdaptationVector[chakra] =
        Math.max(0, Math.min(1,
          (this.personality.userAdaptationVector[chakra] || 0.5) + delta
        ));
    }
  }

  /**
   * Get current service state for debugging
   */
  getState() {
    return {
      personality: this.personality.getState(),
      synthesizer: {
        momentumState: this.synthesizer.momentumState
      },
      friction: this.casimir.getAnalyticsSummary()
    };
  }

  /**
   * Serialize for persistence
   */
  serialize() {
    return {
      personality: this.personality.serialize(),
      // Synthesizer is stateless (momentum can be reset)
    };
  }

  /**
   * Restore from serialized state
   */
  restore(state) {
    if (state?.personality) {
      this.personality.restore(state.personality);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// FACTORY & SINGLETON
// ═══════════════════════════════════════════════════════════

let veraServiceInstance = null;

/**
 * Get singleton Vera service instance
 *
 * @param {string} veraName - Vera personality name
 * @returns {VeraService}
 */
export function getVeraService(veraName = 'luna') {
  if (!veraServiceInstance || veraServiceInstance.personality.veraName !== veraName) {
    veraServiceInstance = new VeraService(veraName);
  }
  return veraServiceInstance;
}

/**
 * Create new Vera service (non-singleton)
 */
export function createVeraService(veraName = 'luna') {
  return new VeraService(veraName);
}

// ═══════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════

// SDPM
export {
  VeraPersonality,
  createVeraPersonality,
  getAvailablePersonalities,
  VERA_PRESETS,
  CHAKRA_TRAITS,
  FEEDBACK_TYPES
};

// PSAN
export {
  TriForkSynthesizer,
  createTriForkSynthesizer,
  PATTERN_TYPES,
  ELEMENT_MEANINGS
};

// Casimir
export {
  getCasimirAnalyzer,
  logFrictionEvent,
  FRICTION_TYPES,
  FRICTION_CONTEXTS
};

export default VeraService;
