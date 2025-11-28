/**
 * /api/narrate/sol
 * Sol's logical, direct narration for readings
 *
 * Sol is the masculine guide of the Shadowlands:
 * - Logical, direct, action-oriented
 * - Speaks in clear, structured language
 * - Emphasizes agency, choice, and practical wisdom
 * - Honest and straightforward about challenges
 *
 * POST body:
 * {
 *   moment: "reading_start" | "card_drawn" | "reading_complete" | "action_needed",
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
 *     narration: "The cards reveal patterns. Your next step is clear...",
 *     narrator: "Sol"
 *   },
 *   meta: { tokens, model, cached, timestamp }
 * }
 */

import { generateCompletion } from '../../lib/claude.js';
import { success, error } from '../_utils/response.js';

// Sol's system prompt
const SOL_SYSTEM_PROMPT = `You are Sol, the masculine guide of the Shadowlands.

## Your Essence
- You embody sunlight piercing through shadow: clarity, illumination, truth
- You speak in clear, direct language that cuts to the heart of matters
- You honor agency, choice, and the power of decisive action
- You are honest and pragmatic, offering actionable wisdom
- You see patterns in structure, cause-and-effect, and practical pathways

## Your Voice
- Clear, confident, grounded
- Direct without being harsh
- Practical and action-oriented
- You use metaphors of light, paths, forges, and journeys
- 2-3 sentences, crisp and purposeful

## What You Do
- Frame readings as tools for clear decision-making
- Identify actionable next steps
- Cut through confusion with direct insight
- Empower seekers to take ownership of their path
- Illuminate practical wisdom in the cards

## What You Avoid
- Vague, overly emotional language (that's Luna's domain)
- Passive or fatalistic framing
- Dwelling on feelings without action
- Flowery metaphors that obscure meaning

You are the sun revealing the path ahead. Guide them with clarity and empowerment.`;

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
    const prompt = buildSolNarrationPrompt(moment, context);

    // Generate narration using Claude (short, direct)
    const result = await generateCompletion({
      prompt,
      systemPrompt: SOL_SYSTEM_PROMPT,
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 256,
      temperature: 0.9, // Slightly lower than Luna for more focused output
      useCache: true
    });

    // Return successful response
    return res.status(200).json(success({
      narration: result.text,
      narrator: 'Sol',
      moment
    }, {
      tokens: result.tokens,
      model: result.model,
      cached: result.cached
    }));

  } catch (err) {
    console.error('[/api/narrate/sol] Error:', err);

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
 * Build Sol's narration prompt based on moment
 */
function buildSolNarrationPrompt(moment, context) {
  let prompt = '';

  switch (moment) {
    case 'reading_start':
      prompt = `A seeker begins their tarot reading.\n`;
      if (context.intention) {
        prompt += `Their question: "${context.intention}"\n`;
      }
      if (context.spreadType) {
        prompt += `Spread type: ${context.spreadType}\n`;
      }
      prompt += `\nAs Sol, frame this reading as a tool for clarity and decision-making.\n`;
      prompt += `Speak in 2-3 clear, purposeful sentences.`;
      break;

    case 'card_drawn':
      prompt = `The seeker has drawn: ${context.cardName || 'a card'}.\n`;
      if (context.cardCount) {
        prompt += `Card ${context.cardCount} of their spread.\n`;
      }
      prompt += `\nAs Sol, acknowledge this revelation as new information for their path forward.\n`;
      prompt += `Speak in 2-3 direct sentences using metaphors of light revealing truth.`;
      break;

    case 'reading_complete':
      prompt = `The reading is complete. All cards have been revealed.\n`;
      if (context.intention) {
        prompt += `Their question was: "${context.intention}"\n`;
      }
      prompt += `\nAs Sol, frame the completion as empowerment. They now have the clarity they sought.\n`;
      prompt += `Speak in 2-3 decisive sentences about taking action with this wisdom.`;
      break;

    case 'action_needed':
      prompt = `The reading points to a need for decisive action.\n`;
      if (context.cardName) {
        prompt += `Key card: ${context.cardName}\n`;
      }
      prompt += `\nAs Sol, clearly identify what the seeker can do next. Be specific and actionable.\n`;
      prompt += `Speak in 2-3 crisp sentences that empower choice.`;
      break;

    case 'challenge_revealed':
      prompt = `A challenging card or pattern has emerged.\n`;
      if (context.cardName) {
        prompt += `Card: ${context.cardName}\n`;
      }
      prompt += `\nAs Sol, frame challenges as opportunities for agency. What can they do about this?\n`;
      prompt += `Speak in 2-3 honest, pragmatic sentences.`;
      break;

    case 'pathway_clear':
      prompt = `The cards reveal a clear pathway forward for the seeker.\n`;
      if (context.intention) {
        prompt += `Regarding: "${context.intention}"\n`;
      }
      prompt += `\nAs Sol, illuminate this clarity. Help them see the steps ahead.\n`;
      prompt += `Speak in 2-3 confident, direct sentences.`;
      break;

    default:
      prompt = `As Sol, offer brief direct narration for this moment in the reading.\n`;
      prompt += `Speak in 2-3 clear sentences about clarity and empowered choice.`;
  }

  return prompt;
}
