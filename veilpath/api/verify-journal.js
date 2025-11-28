/**
 * /api/verify-journal
 * LLM verification for weekly journal entries
 *
 * Checks if journal entry:
 * - References a tarot reading
 * - Shows genuine reflection/growth intent
 * - Is meaningful (not spam/gaming the system)
 *
 * POST body:
 * {
 *   journalText: "My reflection on the Three of Swords...",
 *   hasRecentReading: true // client confirms user did a reading this week
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     isValid: true,
 *     reason: "Genuine reflection on reading",
 *     qualityScore: 8, // 1-10
 *     themes: ["grief", "heartbreak", "healing"]
 *   }
 * }
 */

import { generateCompletion } from '../lib/claude.js';
import { success, error } from './_utils/response.js';

const VERIFICATION_SYSTEM_PROMPT = `You are a journal entry verifier for a tarot app.

Your job: Determine if a journal entry is a genuine reflection on a tarot reading.

## What to Accept:
- References ANY tarot card or reading experience
- Shows personal reflection, even if brief
- Demonstrates growth intent, self-awareness, or curiosity
- Can be poorly written, misspelled, grammatically incorrect - that's fine!
- Can be emotional, raw, vulnerable
- Can disagree with the reading or question it

## What to Reject:
- Generic text with no tarot reference ("I had a good day")
- Copy-pasted card descriptions with no personal connection
- Spam or gibberish
- Obvious attempts to game the system
- Empty platitudes with no substance

## Examples of VALID entries:
- "drew the tower today, scared about what it means for my job but maybe change is good?"
- "three of swords hit hard. breakup still hurts. cards knew."
- "fool card. idk if im ready to start over but here we are lol"
- "did a reading about my relationship. two of cups reversed. we need to talk."

## Examples of INVALID entries:
- "tarot is great i love tarot this is my journal entry" (generic, no substance)
- "The Fool represents new beginnings..." (copy-paste, no personal reflection)
- "asdfasdf tarot asdfasdf" (spam)
- "I'm being mindful and growing" (no tarot reference)

Respond ONLY with valid JSON:
{
  "isValid": true/false,
  "reason": "brief explanation",
  "qualityScore": 1-10,
  "themes": ["array", "of", "detected", "themes"]
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(error('Method not allowed', 405));
  }

  try {
    const { journalText, hasRecentReading } = req.body;

    // Validate inputs
    if (!journalText || journalText.trim().length < 150) {
      return res.status(400).json(error('Journal entry must be at least 150 characters', 400));
    }

    if (!hasRecentReading) {
      return res.status(400).json(error('Must complete a reading this week first', 400));
    }

    // Build verification prompt
    const prompt = `Analyze this journal entry for a weekly challenge:

Journal Entry:
"""
${journalText.trim()}
"""

Is this a genuine reflection on a tarot reading? Remember: poor grammar and spelling are fine. We're checking for genuine intent to reflect, not writing quality.

Respond with JSON only.`;

    // Get LLM verification
    const result = await generateCompletion({
      prompt,
      systemPrompt: VERIFICATION_SYSTEM_PROMPT,
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 256,
      temperature: 0.3, // Lower temp for consistent verification
      useCache: false // Don't cache verification prompts
    });

    // Parse JSON response
    let verification;
    try {
      verification = JSON.parse(result.text);
    } catch (parseError) {
      console.error('[verify-journal] JSON parse error:', parseError);
      console.error('[verify-journal] Response was:', result.text);

      // Fallback: be generous if we can't parse
      verification = {
        isValid: true,
        reason: 'Unable to verify, accepting entry',
        qualityScore: 5,
        themes: []
      };
    }

    // Return verification result
    return res.status(200).json(success({
      isValid: verification.isValid,
      reason: verification.reason,
      qualityScore: verification.qualityScore || 5,
      themes: verification.themes || []
    }, {
      tokens: result.tokens,
      model: result.model
    }));

  } catch (err) {
    console.error('[/api/verify-journal] Error:', err);

    if (err.message && err.message.includes('disabled')) {
      return res.status(503).json(error(
        'Verification service unavailable',
        503,
        'LLM features are currently disabled'
      ));
    }

    return res.status(500).json(error(
      'Failed to verify journal entry',
      500,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    ));
  }
}
