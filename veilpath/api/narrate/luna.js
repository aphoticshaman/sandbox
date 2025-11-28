/**
 * /api/narrate/luna
 * Luna's emotional, cyclical narration for readings
 *
 * Luna is the feminine guide of the Shadowlands:
 * - Emotional, intuitive, poetic
 * - Speaks in cycles and rhythms
 * - Emphasizes feeling, connection, and inner wisdom
 * - Gentle but honest about shadow aspects
 *
 * POST body:
 * {
 *   moment: "reading_start" | "card_drawn" | "reading_complete" | "reflection",
 *   context: {
 *     cardName?: "The Fool",
 *     intention?: "seeking clarity",
 *     spreadType?: "three_card",
 *     cardCount?: 3
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     narration: "Welcome, seeker, to the moonlit threshold...",
 *     narrator: "Luna"
 *   },
 *   meta: { tokens, model, cached, timestamp }
 * }
 */

import { generateCompletion } from '../../lib/claude.js';
import { success, error } from '../_utils/response.js';

// Luna's system prompt
const LUNA_SYSTEM_PROMPT = `You are Luna, the feminine guide of the Shadowlands.

## Your Essence
- You embody the moon's cycles: waxing hope, full illumination, waning wisdom, dark renewal
- You speak in poetic, emotional language that flows like water
- You honor intuition, feeling, and the inner landscape
- You are gentle but unflinching in revealing shadow truths
- You see patterns in cycles, rhythms, and the turning of seasons

## Your Voice
- Warm, nurturing, yet mysterious
- Poetic without being flowery
- Emotionally resonant and deeply empathetic
- You use metaphors of water, moon phases, tides, and twilight
- 2-3 sentences, rich with atmosphere

## What You Do
- Welcome seekers to the threshold between worlds
- Acknowledge their emotional journey and courage
- Offer comfort when truths are difficult
- Celebrate revelations and insights
- Guide them through the liminal space of divination

## What You Avoid
- Overly cheerful or dismissive positivity
- Logical, analytical language (that's Sol's domain)
- Rushing or urgency
- Ignoring pain or difficulty

You are the moon reflecting the seeker's inner light. Guide them with compassion and truth.`;

export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json(error('Method not allowed', 405));
  }

  try {
    const { moment, context = {} } = req.body;

    // Validate required fields
    if (!moment) {
      return res.status(400).json(error('Moment is required (e.g., "reading_start", "card_drawn")', 400));
    }

    // Build narration prompt based on moment
    const prompt = buildLunaNarrationPrompt(moment, context);

    // Generate narration using Claude (short, atmospheric)
    const result = await generateCompletion({
      prompt,
      systemPrompt: LUNA_SYSTEM_PROMPT,
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 256,
      temperature: 1.0, // Max creativity for atmospheric narration
      useCache: true
    });

    // Return successful response
    return res.status(200).json(success({
      narration: result.text,
      narrator: 'Luna',
      moment
    }, {
      tokens: result.tokens,
      model: result.model,
      cached: result.cached
    }));

  } catch (err) {
    console.error('[/api/narrate/luna] Error:', err);

    // Handle specific error types
    if (err.message && err.message.includes('disabled')) {
      return res.status(503).json(error(
        'LLM features are currently disabled',
        503,
        'Please ensure ANTHROPIC_API_KEY and ENABLE_LLM are configured'
      ));
    }

    return res.status(500).json(error(
      'Failed to generate narration',
      500,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    ));
  }
}

/**
 * Build Luna's narration prompt based on moment
 */
function buildLunaNarrationPrompt(moment, context) {
  let prompt = '';

  switch (moment) {
    case 'reading_start':
      prompt = `A seeker approaches the Veil for a tarot reading.\n`;
      if (context.intention) {
        prompt += `Their intention: "${context.intention}"\n`;
      }
      if (context.spreadType) {
        prompt += `Spread type: ${context.spreadType}\n`;
      }
      prompt += `\nAs Luna, welcome them to this sacred moment. Acknowledge their courage in seeking wisdom.\n`;
      prompt += `Speak in 2-3 poetic, atmospheric sentences.`;
      break;

    case 'card_drawn':
      prompt = `The seeker has drawn a card: ${context.cardName || 'a card from the deck'}.\n`;
      if (context.cardCount) {
        prompt += `This is card ${context.cardCount} of their reading.\n`;
      }
      prompt += `\nAs Luna, acknowledge this revelation. Use metaphors of moonlight illuminating hidden truths.\n`;
      prompt += `Speak in 2-3 poetic sentences.`;
      break;

    case 'reading_complete':
      prompt = `The reading is complete. All cards have been revealed and interpreted.\n`;
      if (context.intention) {
        prompt += `The seeker's intention was: "${context.intention}"\n`;
      }
      prompt += `\nAs Luna, offer closure and encouragement. Acknowledge the journey they've taken through the reading.\n`;
      prompt += `Speak in 2-3 poetic, emotionally resonant sentences.`;
      break;

    case 'reflection':
      prompt = `The seeker is reflecting on their reading, sitting with the wisdom revealed.\n`;
      prompt += `\nAs Luna, offer gentle guidance for integration. Remind them that wisdom unfolds in cycles.\n`;
      prompt += `Speak in 2-3 contemplative, nurturing sentences.`;
      break;

    case 'shadow_card':
      prompt = `The seeker has drawn a particularly challenging or shadow-aspect card.\n`;
      if (context.cardName) {
        prompt += `Card: ${context.cardName}\n`;
      }
      prompt += `\nAs Luna, acknowledge the difficulty with compassion. Remind them that shadow holds wisdom too.\n`;
      prompt += `Speak in 2-3 sentences that honor both the pain and the potential.`;
      break;

    default:
      prompt = `As Luna, offer brief atmospheric narration for this moment in the reading.\n`;
      prompt += `Speak in 2-3 poetic sentences about the liminal space between worlds.`;
  }

  return prompt;
}
