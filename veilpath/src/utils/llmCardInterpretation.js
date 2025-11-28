/**
 * LLM-POWERED CARD INTERPRETATIONS
 *
 * Uses local Phi-3 to generate concise, personalized card interpretations
 * Target: ~150 tokens per card (~8 seconds on mid-tier 2024 phones)
 *
 * Architecture:
 * - Each card generates independently
 * - Synthesis context accumulates in background
 * - Final synthesis gets 600 tokens (~30 seconds)
 */

import { initializeLLM, isEnhancementEnabled } from './lazyLLM';
import { CARD_DATABASE } from '../data/cardDatabase';
import { getCardMeaning } from '../data/cardMeanings';

// Token budgets for mobile performance
const CARD_INTERPRETATION_MAX_TOKENS = 150; // ~8 seconds on mid-tier phone
const FINAL_SYNTHESIS_MAX_TOKENS = 600;     // ~30 seconds

/**
 * Generate LLM-powered card interpretation
 * Falls back to template if LLM disabled or fails
 */
export async function generateCardInterpretationWithLLM(card, context = {}) {
  try {
    // Check if LLM is enabled
    const llmEnabled = await isEnhancementEnabled();
    if (!llmEnabled) {
      return null; // CardInterpretationScreen will use template
    }

    // Initialize LLM context
    const llmContext = await initializeLLM();
    if (!llmContext) {
      console.warn('[LLMCard] LLM not available, using template fallback');
      return null;
    }

    // Get card data
    const cardData = CARD_DATABASE[card.cardIndex] || CARD_DATABASE[0];
    const orientation = card.reversed ? 'reversed' : 'upright';
    const richMeaning = getCardMeaning(cardData.name, orientation);

    // Build concise prompt
    const prompt = buildCardInterpretationPrompt(cardData, card, richMeaning, context);

    const startTime = Date.now();

    // Generate with tight token budget
    const response = await llmContext.completion({
      prompt,
      temperature: 0.8,
      top_p: 0.9,
      max_tokens: CARD_INTERPRETATION_MAX_TOKENS,
      stop: ['User:', 'CARD:', '\n\n---']
    });

    const inferenceTime = Date.now() - startTime;
    const interpretation = response.text.trim();


    return {
      text: interpretation,
      tokens: response.tokens_predicted,
      inferenceTime,
      source: 'llm'
    };

  } catch (error) {
    console.error('[LLMCard] Error generating interpretation:', error);
    return null; // Fallback to template
  }
}

/**
 * Build concise card interpretation prompt
 */
function buildCardInterpretationPrompt(cardData, card, richMeaning, context) {
  const orientation = card.reversed ? 'REVERSED' : 'UPRIGHT';

  // User context
  const userName = context.userProfile?.name || 'Seeker';
  const mbtiType = context.userProfile?.mbtiType || null;
  const zodiacSign = context.userProfile?.zodiacSign || null;
  const intention = context.intention || '';
  const position = card.position || 'Unknown Position';

  // MBTI/Zodiac context if available
  let personalContext = '';
  if (mbtiType) personalContext += `MBTI: ${mbtiType}. `;
  if (zodiacSign) personalContext += `Zodiac: ${zodiacSign}. `;

  const prompt = `You are an expert tarot reader. Give a concise, direct interpretation (2-3 sentences max, ~150 tokens).

CARD: ${cardData.name} (${orientation})
POSITION: ${position}
QUESTION: "${intention || 'General guidance'}"
${personalContext ? `SEEKER: ${personalContext}` : ''}

CORE MEANING: ${richMeaning.core || cardData.description || ''}

KEYWORDS: ${(cardData.keywords?.[orientation.toLowerCase()] || []).slice(0, 5).join(', ')}

Generate a personalized interpretation that:
1. Addresses their specific question/situation
2. Includes shadow work or uncomfortable truth (this isn't fluffy tarot)
3. Gives ONE concrete action step
${mbtiType ? `4. References their ${mbtiType} cognitive patterns if relevant` : ''}

Be direct, specific, and avoid templates like "The [Card] suggests..." Just tell them what they need to hear.

INTERPRETATION (2-3 sentences):`;

  return prompt;
}

/**
 * Synthesis context accumulator
 * Builds comprehensive context as cards are revealed
 */
export class SynthesisAccumulator {
  constructor(readingContext) {
    this.context = readingContext;
    this.cardInterpretations = [];
    this.startTime = Date.now();
  }

  /**
   * Add card interpretation to accumulator
   */
  addCard(card, interpretation) {
    this.cardInterpretations.push({
      card,
      interpretation,
      timestamp: Date.now()
    });

  }

  /**
   * Check if ready for final synthesis
   */
  isReady() {
    const expected = this.context.totalCards || this.context.cards?.length || 0;
    return this.cardInterpretations.length >= expected;
  }

  /**
   * Generate final synthesis with accumulated context
   */
  async generateFinalSynthesis() {
    try {

      const llmContext = await initializeLLM();
      if (!llmContext) {
        console.warn('[SynthesisAccumulator] LLM not available');
        return null;
      }

      const prompt = this.buildFinalSynthesisPrompt();

      const startTime = Date.now();
      const response = await llmContext.completion({
        prompt,
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: FINAL_SYNTHESIS_MAX_TOKENS,
        stop: ['User:', 'READING:', '\n\n---']
      });

      const inferenceTime = Date.now() - startTime;
      const synthesis = response.text.trim();


      return {
        text: synthesis,
        tokens: response.tokens_predicted,
        inferenceTime,
        totalTime: Date.now() - this.startTime,
        source: 'llm'
      };

    } catch (error) {
      console.error('[SynthesisAccumulator] Error generating synthesis:', error);
      return null;
    }
  }

  /**
   * Build final synthesis prompt from accumulated cards
   */
  buildFinalSynthesisPrompt() {
    const userName = this.context.userProfile?.name || 'Seeker';
    const mbtiType = this.context.userProfile?.mbtiType || null;
    const intention = this.context.intention || '';
    const spreadType = this.context.spreadType || 'Unknown';

    // Compile all card interpretations
    const cardsText = this.cardInterpretations
      .map((item, idx) => {
        const cardData = CARD_DATABASE[item.card.cardIndex];
        const orientation = item.card.reversed ? 'Reversed' : 'Upright';
        return `${idx + 1}. ${item.card.position || 'Position ' + (idx + 1)}: ${cardData.name} (${orientation})
   ${item.interpretation.text || item.interpretation}`;
      })
      .join('\n\n');

    const prompt = `You are an expert tarot reader synthesizing a ${spreadType} spread reading.

SEEKER'S QUESTION: "${intention}"
${mbtiType ? `SEEKER MBTI: ${mbtiType}` : ''}

CARDS DRAWN:
${cardsText}

Now provide a FINAL SYNTHESIS (~500-600 tokens) that:

1. OPENING (2-3 sentences): ${userName}, you asked about "${intention}". Address this directly with a narrative hook (NOT "The cards suggest...").

2. PATTERN ANALYSIS (3-4 sentences): Identify the core pattern across all cards. What story are they telling together? Look for:
   - Contradictions or tensions between cards
   - Recurring themes (elements, archetypes, etc.)
   - Shadow work opportunities
   ${mbtiType ? `- How this relates to ${mbtiType} cognitive blindspots` : ''}

3. UNCOMFORTABLE TRUTH (2-3 sentences): What is ${userName} avoiding or not seeing? Be direct but supportive.

4. ACTION PLAN (3-4 specific steps):
   - Within 48 hours: [specific action]
   - This week: [specific action]
   - Ongoing: [specific practice]

5. CLOSING (1-2 sentences): Empowerment, not prediction. Remind them they have agency.

STYLE:
- Direct, intimate, perceptive (like a trusted friend who tells hard truths)
- NO templates ("The [Card] represents...")
- Specific to their situation
- Shadow work integrated naturally
- Action-oriented, not vague

FINAL SYNTHESIS:`;

    return prompt;
  }

  /**
   * Get progress for UI display
   */
  getProgress() {
    const expected = this.context.totalCards || this.context.cards?.length || 0;
    return {
      current: this.cardInterpretations.length,
      total: expected,
      percentage: expected > 0 ? (this.cardInterpretations.length / expected) * 100 : 0
    };
  }
}

/**
 * Estimate time remaining based on current progress
 */
export function estimateTimeRemaining(cardsComplete, totalCards, avgCardTime = 8000) {
  const cardsRemaining = totalCards - cardsComplete;
  const cardTimeRemaining = cardsRemaining * avgCardTime;
  const synthesisTime = 30000; // 30 seconds for final synthesis

  return {
    cards: cardTimeRemaining,
    synthesis: cardsComplete >= totalCards ? synthesisTime : 0,
    total: cardTimeRemaining + (cardsComplete >= totalCards ? synthesisTime : 0),
    formatted: formatTime(cardTimeRemaining + (cardsComplete >= totalCards ? synthesisTime : 0))
  };
}

function formatTime(ms) {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
