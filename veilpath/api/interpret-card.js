/**
 * /api/interpret-card
 * Interprets a single tarot card using Claude AI
 *
 * POST body:
 * {
 *   card: { id, name, darkFantasy, keywords, arcana, suit, element, etc. },
 *   context: {
 *     intention: "What guidance do I need?",
 *     spreadType: "single_card",
 *     reversed: false,
 *     position: "Present", // optional for multi-card spreads
 *     userProfile: { mbtiType: "INFJ", zodiacSign: "Pisces" }
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     interpretation: "The Fool stands at the Veil's edge...",
 *     card: { id: 0, name: "The Fool", reversed: false }
 *   },
 *   meta: {
 *     tokens: 850,
 *     model: "claude-sonnet-4-5-20250929",
 *     cached: false,
 *     timestamp: "2025-11-20T..."
 *   }
 * }
 */

import { generateCompletion } from '../lib/claude.js';
import { buildInterpretationPrompt, buildPositionInterpretationPrompt } from '../lib/prompts/interpretation.js';
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
      console.warn('[Interpret] Bot blocked');
      return res.status(403).json(error('Access denied', 403));
    }

    const { card, context = {} } = req.body;

    // Validate required fields
    if (!card || !card.name) {
      return res.status(400).json(error('Card data is required (must include at least card.name)', 400));
    }

    // Build context with defaults
    const interpretationContext = {
      intention: context.intention || 'seeking guidance',
      spreadType: context.spreadType || 'single_card',
      reversed: context.reversed || false,
      userProfile: context.userProfile || {}
    };

    // Build the interpretation prompt (position-specific if provided)
    let prompt;
    if (context.position) {
      prompt = buildPositionInterpretationPrompt(card, context.position, interpretationContext);
    } else {
      prompt = buildInterpretationPrompt(card, interpretationContext);
    }

    // Generate interpretation using Claude
    const result = await generateCompletion({
      prompt,
      systemPrompt: DARK_FANTASY_SYSTEM_PROMPT,
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 1024,
      temperature: 1.0,
      useCache: true
    });

    // Return successful response
    return res.status(200).json(success({
      interpretation: result.text,
      card: {
        id: card.id,
        name: card.name,
        reversed: interpretationContext.reversed,
        position: context.position || null
      }
    }, {
      tokens: result.tokens,
      model: result.model,
      cached: result.cached
    }));

  } catch (err) {
    console.error('[/api/interpret-card] Error:', err);

    // Handle specific error types
    if (err.message && err.message.includes('disabled')) {
      return res.status(503).json(error(
        'LLM features are currently disabled',
        503,
        'Please ensure ANTHROPIC_API_KEY and ENABLE_LLM are configured'
      ));
    }

    return res.status(500).json(error(
      'Failed to generate interpretation',
      500,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    ));
  }
}
