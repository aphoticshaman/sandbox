/**
 * /api/synthesize-reading
 * Synthesizes multiple card interpretations into a cohesive narrative
 *
 * POST body:
 * {
 *   cards: [
 *     { id: 0, name: "The Fool", reversed: false, position: "Past" },
 *     { id: 12, name: "The Hanged Man", reversed: true, position: "Present" },
 *     { id: 21, name: "The World", reversed: false, position: "Future" }
 *   ],
 *   interpretations: [
 *     { cardData: {...}, interpretation: "The Fool speaks of new beginnings..." },
 *     { cardData: {...}, interpretation: "Reversed, the Hanged Man reveals..." },
 *     { cardData: {...}, interpretation: "The World brings completion..." }
 *   ],
 *   context: {
 *     intention: "What path should I take in my career?",
 *     spreadType: "three_card",
 *     userProfile: { mbtiType: "INTJ" }
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     synthesis: "Your cards reveal a profound journey...",
 *     cards: [...],
 *     patterns: {
 *       majorCount: 3,
 *       minorCount: 0,
 *       reversedCount: 1,
 *       dominantElement: "Air"
 *     }
 *   },
 *   meta: { tokens, model, cached, timestamp }
 * }
 */

import { generateCompletion } from '../lib/claude.js';
import { buildSynthesisPrompt, buildPatternAnalysisPrompt } from '../lib/prompts/synthesis.js';
import { DARK_FANTASY_SYSTEM_PROMPT } from '../lib/prompts/system.js';
import { success, error } from './_utils/response.js';
import { checkBotId } from 'botid/server';

export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json(error('Method not allowed', 405));
  }

  try {
    // Bot detection - protect expensive AI endpoint
    const botCheck = await checkBotId({
      advancedOptions: { headers: req.headers },
    });

    if (botCheck.isBot && !botCheck.isVerifiedBot) {
      console.warn('[Synthesize] Bot blocked');
      return res.status(403).json(error('Access denied', 403));
    }

    const { cards, interpretations, context = {} } = req.body;

    // Validate required fields
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json(error('Cards array is required', 400));
    }

    if (!interpretations || !Array.isArray(interpretations) || interpretations.length === 0) {
      return res.status(400).json(error('Interpretations array is required', 400));
    }

    if (cards.length !== interpretations.length) {
      return res.status(400).json(error('Cards and interpretations arrays must have the same length', 400));
    }

    // Build context with defaults
    const synthesisContext = {
      intention: context.intention || 'seeking guidance',
      spreadType: context.spreadType || 'three_card',
      userProfile: context.userProfile || {}
    };

    // Build the synthesis prompt
    const prompt = buildSynthesisPrompt(cards, interpretations, synthesisContext);

    // Generate synthesis using Claude (higher token limit for complete narratives)
    const result = await generateCompletion({
      prompt,
      systemPrompt: DARK_FANTASY_SYSTEM_PROMPT,
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 2048,
      temperature: 1.0,
      useCache: true
    });

    // Analyze patterns in the spread
    const patterns = analyzePatterns(cards);

    // Return successful response
    return res.status(200).json(success({
      synthesis: result.text,
      cards: cards.map(c => ({
        id: c.id,
        name: c.name,
        reversed: c.reversed || false,
        position: c.position || null
      })),
      patterns
    }, {
      tokens: result.tokens,
      model: result.model,
      cached: result.cached
    }));

  } catch (err) {
    console.error('[/api/synthesize-reading] Error:', err);

    // Handle specific error types
    if (err.message && err.message.includes('disabled')) {
      return res.status(503).json(error(
        'LLM features are currently disabled',
        503,
        'Please ensure ANTHROPIC_API_KEY and ENABLE_LLM are configured'
      ));
    }

    return res.status(500).json(error(
      'Failed to generate synthesis',
      500,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    ));
  }
}

/**
 * Analyze patterns in the card spread
 */
function analyzePatterns(cards) {
  const patterns = {
    totalCards: cards.length,
    majorCount: 0,
    minorCount: 0,
    reversedCount: 0,
    suits: {},
    dominantElement: null
  };

  cards.forEach(card => {
    // Count arcana types
    if (card.arcana === 'major') {
      patterns.majorCount++;
    } else {
      patterns.minorCount++;
    }

    // Count reversals
    if (card.reversed) {
      patterns.reversedCount++;
    }

    // Count suits (minor arcana only)
    if (card.suit) {
      patterns.suits[card.suit] = (patterns.suits[card.suit] || 0) + 1;
    }
  });

  // Determine dominant element from suit distribution
  if (Object.keys(patterns.suits).length > 0) {
    const sortedSuits = Object.entries(patterns.suits).sort((a, b) => b[1] - a[1]);
    const dominantSuit = sortedSuits[0][0];
    patterns.dominantElement = getSuitElement(dominantSuit);
  }

  return patterns;
}

/**
 * Get elemental correspondence for suit
 */
function getSuitElement(suit) {
  const elements = {
    'wands': 'Fire',
    'cups': 'Water',
    'swords': 'Air',
    'pentacles': 'Earth'
  };
  return elements[suit?.toLowerCase()] || 'Unknown';
}
