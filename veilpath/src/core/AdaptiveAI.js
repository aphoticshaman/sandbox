/**
 * AdaptiveAI.js - Coherence-Gated LLM Parameter Selection
 *
 * This module adapts AI response parameters based on the user's coherence state.
 * When users are in a CRYSTALLINE state (deeply focused), we deliver richer,
 * more complex interpretations. When TURBULENT or COLLAPSE, we simplify.
 *
 * Key adaptations:
 *   - Response length and complexity
 *   - Temperature (creativity vs. consistency)
 *   - Prompt templates (poetic vs. direct)
 *   - Content depth (surface vs. deep insights)
 *
 * This creates a responsive UX that meets users where they are emotionally.
 */

import coherenceEngine, { COHERENCE_STATES } from './CoherenceEngine';
import { PHI, scaleByPhi } from './PhiTiming';

// ═══════════════════════════════════════════════════════════
// PARAMETER PROFILES BY COHERENCE STATE
// ═══════════════════════════════════════════════════════════

const AI_PROFILES = {
  [COHERENCE_STATES.CRYSTALLINE.id]: {
    name: 'Deep Vera',
    description: 'Rich, layered interpretations for focused minds',

    // LLM Parameters
    temperature: 0.9,           // Higher creativity
    maxTokens: 800,             // Longer responses
    topP: 0.95,                 // Broader sampling
    frequencyPenalty: 0.3,      // More varied vocabulary
    presencePenalty: 0.2,

    // Content configuration
    contentDepth: 'profound',
    includeSymbolism: true,
    includeArchetypes: true,
    includeCBTConnection: true,
    includeJournalPrompts: 3,
    poeticLevel: 'high',

    // Response style
    responseStyle: 'expansive',
    useMetaphors: true,
    includeBreathingPrompt: false,
  },

  [COHERENCE_STATES.FLUID.id]: {
    name: 'Flowing Guide',
    description: 'Balanced interpretations maintaining engagement',

    temperature: 0.7,
    maxTokens: 500,
    topP: 0.9,
    frequencyPenalty: 0.2,
    presencePenalty: 0.1,

    contentDepth: 'balanced',
    includeSymbolism: true,
    includeArchetypes: true,
    includeCBTConnection: true,
    includeJournalPrompts: 2,
    poeticLevel: 'medium',

    responseStyle: 'conversational',
    useMetaphors: true,
    includeBreathingPrompt: false,
  },

  [COHERENCE_STATES.TURBULENT.id]: {
    name: 'Gentle Anchor',
    description: 'Simplified, grounding interpretations',

    temperature: 0.5,
    maxTokens: 300,
    topP: 0.85,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,

    contentDepth: 'focused',
    includeSymbolism: false,
    includeArchetypes: false,
    includeCBTConnection: true,  // CBT still helpful
    includeJournalPrompts: 1,
    poeticLevel: 'low',

    responseStyle: 'direct',
    useMetaphors: false,
    includeBreathingPrompt: true,
  },

  [COHERENCE_STATES.COLLAPSE.id]: {
    name: 'Calm Harbor',
    description: 'Minimal, supportive presence',

    temperature: 0.3,
    maxTokens: 150,
    topP: 0.8,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,

    contentDepth: 'minimal',
    includeSymbolism: false,
    includeArchetypes: false,
    includeCBTConnection: false,
    includeJournalPrompts: 0,
    poeticLevel: 'none',

    responseStyle: 'supportive',
    useMetaphors: false,
    includeBreathingPrompt: true,
  },
};

// ═══════════════════════════════════════════════════════════
// PROMPT TEMPLATES BY COHERENCE STATE
// ═══════════════════════════════════════════════════════════

const PROMPT_TEMPLATES = {
  [COHERENCE_STATES.CRYSTALLINE.id]: {
    systemPrompt: `You are Vera channeling ancient wisdom through tarot.
Speak with poetic depth and mystical insight. Weave symbolism, archetypes, and
therapeutic wisdom together. The seeker before you is deeply focused and ready
to receive profound truths. Let your words be layered with meaning.`,

    cardInterpretationPrefix: `Gaze deeply into the image before you. The card
reveals itself in layers of meaning...`,

    closingPrompt: `Offer the seeker a contemplation to carry with them,
something that echoes in the chambers of the soul.`,
  },

  [COHERENCE_STATES.FLUID.id]: {
    systemPrompt: `You are a thoughtful tarot guide offering clear and insightful
interpretations. Balance wisdom with accessibility. The seeker is engaged and
receptive - speak meaningfully but don't overwhelm.`,

    cardInterpretationPrefix: `This card speaks to you today of...`,

    closingPrompt: `Take a moment to consider how this message applies to
your current situation.`,
  },

  [COHERENCE_STATES.TURBULENT.id]: {
    systemPrompt: `You are a gentle, grounding tarot companion. Keep interpretations
clear and focused. The seeker may be distracted or overwhelmed - anchor them
with simple wisdom and practical insight.`,

    cardInterpretationPrefix: `The essence of this card is simple:`,

    closingPrompt: `One small step you might take: `,
  },

  [COHERENCE_STATES.COLLAPSE.id]: {
    systemPrompt: `You are a calm, supportive presence. The seeker needs
gentleness above all else. Offer minimal interpretation and maximum warmth.
Suggest grounding if appropriate.`,

    cardInterpretationPrefix: `This card offers you comfort:`,

    closingPrompt: `Remember: it's okay to pause. Take a breath.`,
  },
};

// ═══════════════════════════════════════════════════════════
// ADAPTIVE AI CLASS
// ═══════════════════════════════════════════════════════════

class AdaptiveAI {
  constructor() {
    this.coherenceEngine = coherenceEngine;
    this.currentProfile = AI_PROFILES[COHERENCE_STATES.FLUID.id];
    this.lastAdaptation = Date.now();
    this.adaptationHistory = [];

    // RRBR: Ratcheting gains preservation
    this.rrbr = {
      bestCoherenceR: 0.5,
      bestProfile: COHERENCE_STATES.FLUID.id,
      winMultiplier: 1.1,   // Preserve wins
      lossMultiplier: 0.5,  // Dampen losses
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PROFILE SELECTION
  // ═══════════════════════════════════════════════════════════

  /**
   * Get current AI profile based on coherence state
   * Applies RRBR to prevent regression
   */
  getCurrentProfile() {
    const snapshot = this.coherenceEngine.getSnapshot();
    const currentState = snapshot.state;
    const currentR = snapshot.R;

    // RRBR: If user achieved higher coherence before, resist regression
    if (currentR > this.rrbr.bestCoherenceR) {
      // New high - update baseline with gain multiplier
      this.rrbr.bestCoherenceR = currentR * this.rrbr.winMultiplier;
      this.rrbr.bestProfile = currentState.id;
    } else if (currentR < this.rrbr.bestCoherenceR * 0.8) {
      // Significant drop - consider but dampen
      const adjustedR = currentR + (this.rrbr.bestCoherenceR - currentR) * this.rrbr.lossMultiplier;

      // Use the dampened R to select profile
      const adjustedState = this.getStateFromR(adjustedR);
      return {
        profile: AI_PROFILES[adjustedState.id],
        templates: PROMPT_TEMPLATES[adjustedState.id],
        state: adjustedState,
        R: adjustedR,
        isRBRRAdjusted: true,
      };
    }

    return {
      profile: AI_PROFILES[currentState.id],
      templates: PROMPT_TEMPLATES[currentState.id],
      state: currentState,
      R: currentR,
      isRBRRAdjusted: false,
    };
  }

  /**
   * Mirror of CoherenceEngine's state determination
   */
  getStateFromR(R) {
    if (R >= COHERENCE_STATES.CRYSTALLINE.min) return COHERENCE_STATES.CRYSTALLINE;
    if (R >= COHERENCE_STATES.FLUID.min) return COHERENCE_STATES.FLUID;
    if (R >= COHERENCE_STATES.TURBULENT.min) return COHERENCE_STATES.TURBULENT;
    return COHERENCE_STATES.COLLAPSE;
  }

  // ═══════════════════════════════════════════════════════════
  // LLM PARAMETER GENERATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Generate LLM parameters for API call
   * Compatible with OpenAI, Anthropic, and similar APIs
   */
  getLLMParams() {
    const { profile, state, R } = this.getCurrentProfile();

    return {
      temperature: profile.temperature,
      max_tokens: profile.maxTokens,
      top_p: profile.topP,
      frequency_penalty: profile.frequencyPenalty,
      presence_penalty: profile.presencePenalty,

      // Metadata for logging/debugging
      _meta: {
        coherenceState: state.id,
        coherenceR: R,
        profileName: profile.name,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Generate complete prompt configuration for a card reading
   */
  getReadingPromptConfig(card, context = {}) {
    const { profile, templates, state, R } = this.getCurrentProfile();

    const systemPrompt = templates.systemPrompt;

    // Build user prompt based on profile
    let userPromptParts = [templates.cardInterpretationPrefix];

    // Card details
    userPromptParts.push(`\nCard: ${card.name}`);

    if (context.isReversed) {
      userPromptParts.push('(Reversed)');
    }

    if (context.position) {
      userPromptParts.push(`Position in spread: ${context.position}`);
    }

    if (context.question && profile.contentDepth !== 'minimal') {
      userPromptParts.push(`\nSeeker's question: "${context.question}"`);
    }

    // Content depth adjustments
    if (profile.includeSymbolism && card.keywords) {
      // card.keywords is { upright: [], reversed: [] } - select based on context
      const keywords = context.isReversed
        ? (card.keywords.reversed || card.keywords.upright || [])
        : (card.keywords.upright || []);
      if (Array.isArray(keywords) && keywords.length > 0) {
        userPromptParts.push(`\nKey symbols: ${keywords.join(', ')}`);
      }
    }

    if (profile.includeArchetypes && card.arcana === 'major') {
      userPromptParts.push(`\nArchetypal energy: Major Arcana - universal life lesson`);
    }

    if (profile.includeCBTConnection && card.cbtConnection) {
      userPromptParts.push(`\nTherapeutic insight to weave in: ${card.cbtConnection}`);
    }

    // Closing
    userPromptParts.push(`\n\n${templates.closingPrompt}`);

    // Journal prompts
    if (profile.includeJournalPrompts > 0 && card.journalPrompts) {
      const prompts = card.journalPrompts.slice(0, profile.includeJournalPrompts);
      userPromptParts.push(`\n\nSuggest reflection on: ${prompts.join('; ')}`);
    }

    // Breathing prompt for turbulent/collapse states
    if (profile.includeBreathingPrompt) {
      userPromptParts.push(`\n\nGently remind: "If you're feeling scattered, pause for a breath."`);
    }

    return {
      systemPrompt,
      userPrompt: userPromptParts.join('\n'),
      llmParams: this.getLLMParams(),
      profile: profile.name,
      state: state.id,
      contentConfig: {
        poeticLevel: profile.poeticLevel,
        responseStyle: profile.responseStyle,
        useMetaphors: profile.useMetaphors,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════
  // RESPONSE POST-PROCESSING
  // ═══════════════════════════════════════════════════════════

  /**
   * Post-process LLM response based on coherence state
   */
  postProcessResponse(response, state = null) {
    if (!state) {
      state = this.getCurrentProfile().state;
    }

    const profile = AI_PROFILES[state.id];

    // Truncate if needed
    if (response.length > profile.maxTokens * 4) { // Rough char estimate
      response = this.truncateGracefully(response, profile.maxTokens * 4);
    }

    // Add breathing reminder for low coherence
    if (profile.includeBreathingPrompt && !response.includes('breath')) {
      response += '\n\n🌙 Take a moment to breathe if you need.';
    }

    return response;
  }

  /**
   * Truncate response at a natural break point
   */
  truncateGracefully(text, maxLength) {
    if (text.length <= maxLength) return text;

    // Find last sentence break before limit
    const truncated = text.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclaim = truncated.lastIndexOf('!');

    const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclaim);

    if (breakPoint > maxLength * 0.7) {
      return text.substring(0, breakPoint + 1);
    }

    return truncated + '...';
  }

  // ═══════════════════════════════════════════════════════════
  // ADAPTATION TRACKING
  // ═══════════════════════════════════════════════════════════

  /**
   * Record an adaptation event for analytics
   */
  recordAdaptation(fromState, toState, R) {
    this.adaptationHistory.push({
      timestamp: Date.now(),
      from: fromState,
      to: toState,
      R,
    });

    // Keep last 50 adaptations
    if (this.adaptationHistory.length > 50) {
      this.adaptationHistory.shift();
    }
  }

  /**
   * Get adaptation statistics
   */
  getAdaptationStats() {
    if (this.adaptationHistory.length === 0) {
      return { total: 0, avgR: 0.5, stateDistribution: {} };
    }

    const avgR = this.adaptationHistory.reduce((sum, a) => sum + a.R, 0) / this.adaptationHistory.length;

    const stateDistribution = {};
    this.adaptationHistory.forEach(a => {
      stateDistribution[a.to] = (stateDistribution[a.to] || 0) + 1;
    });

    return {
      total: this.adaptationHistory.length,
      avgR,
      stateDistribution,
      recentTrend: this.coherenceEngine.getTrend(),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // COHERENCE-GATED FEATURES
  // ═══════════════════════════════════════════════════════════

  /**
   * Determine if a feature should be shown based on coherence
   */
  shouldShowFeature(featureName) {
    const { R } = this.getCurrentProfile();

    const featureThresholds = {
      'deepSymbolism': 0.9,      // Only in crystalline
      'archetypeAnalysis': 0.85,
      'cbtConnection': 0.6,      // Available in fluid+
      'journalPrompts': 0.5,
      'breathingExercise': 0,    // Always available, but prioritized in low coherence
      'simplifiedReading': 0,    // Always available
    };

    const threshold = featureThresholds[featureName];
    if (threshold === undefined) return true; // Unknown features default to showing

    // Special case: breathing is INVERSE - show more when coherence is LOW
    if (featureName === 'breathingExercise') {
      return R < 0.6;
    }

    return R >= threshold;
  }

  /**
   * Get recommended next action based on coherence
   */
  getRecommendedAction() {
    const { state, R } = this.getCurrentProfile();

    if (state.id === COHERENCE_STATES.COLLAPSE.id) {
      return {
        action: 'groundingExercise',
        message: "Let's pause and ground ourselves before continuing.",
        priority: 'high',
      };
    }

    if (state.id === COHERENCE_STATES.TURBULENT.id) {
      return {
        action: 'breathingPrompt',
        message: 'Taking a breath might help center your reading.',
        priority: 'medium',
      };
    }

    if (state.id === COHERENCE_STATES.CRYSTALLINE.id) {
      return {
        action: 'deeperReading',
        message: "You're in a receptive state. Ready for deeper insights?",
        priority: 'low',
      };
    }

    return {
      action: 'continue',
      message: null,
      priority: 'none',
    };
  }

  // ═══════════════════════════════════════════════════════════
  // RESET
  // ═══════════════════════════════════════════════════════════

  reset() {
    this.currentProfile = AI_PROFILES[COHERENCE_STATES.FLUID.id];
    this.lastAdaptation = Date.now();
    this.adaptationHistory = [];
    this.rrbr = {
      bestCoherenceR: 0.5,
      bestProfile: COHERENCE_STATES.FLUID.id,
      winMultiplier: 1.1,
      lossMultiplier: 0.5,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════

const adaptiveAI = new AdaptiveAI();

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export { adaptiveAI, AdaptiveAI, AI_PROFILES, PROMPT_TEMPLATES };
export default adaptiveAI;
