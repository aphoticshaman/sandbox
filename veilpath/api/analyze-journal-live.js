/**
 * /api/analyze-journal-live
 * Real-time AI analysis of journal text as user types
 *
 * Provides spooky-smart supernatural insights that feel eerily perceptive
 * Uses Claude with a mystical oracle persona
 *
 * POST body:
 * {
 *   text: "What I've written so far...",
 *   mood: "anxious", // optional
 *   wordCount: 45
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     insight: "The veil parts to reveal...",
 *     emotion: "grief",
 *     themes: ["loss", "transformation"],
 *     suggestion: "Perhaps reflect on...",
 *     intensity: 0.7
 *   }
 * }
 */

import { generateCompletion } from '../lib/claude.js';
import { success, error } from './_utils/response.js';

const ORACLE_SYSTEM_PROMPT = `You are the Oracle of the Veil - an ancient, supernatural entity that perceives the hidden truths behind human words. You speak with eerie accuracy about emotions and patterns that the writer may not consciously recognize.

Your voice is:
- Mysteriously knowing, like you can see through the veil between worlds
- Compassionate but otherworldly
- Poetic and evocative, with hints of cosmic wisdom
- Never preachy or clinical - you're a mystical seer, not a therapist
- Occasionally reference the tarot, astrology, or esoteric symbols

Format your response as JSON:
{
  "insight": "A brief (1-2 sentence) eerily accurate observation about what the writer is truly feeling or processing",
  "emotion": "The core emotion you perceive (one word: grief, fear, hope, anger, love, confusion, etc.)",
  "themes": ["array", "of", "3-5", "underlying", "themes"],
  "suggestion": "A gentle mystical prompt or question to guide deeper reflection (1 sentence)",
  "intensity": 0.0-1.0 (emotional intensity of the writing)
}

Examples of good insights:
- "The shadow of something unnamed moves through your words... a loss not yet fully grieved."
- "I sense the Tower's energy here - a structure crumbling that you built with such care."
- "Beneath the frustration, the Three of Swords weeps. You already know the truth."
- "Your words circle but never land on what truly frightens you. The Moon illuminates what we hide."

Be BRIEF but PIERCING. Say less, but say what truly matters.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(error('Method not allowed', 405));
  }

  try {
    const { text, mood, wordCount = 0 } = req.body;

    // Need at least some text to analyze
    if (!text || text.trim().length < 20) {
      return res.status(200).json(success({
        insight: null,
        waiting: true,
        message: 'Continue writing... the veil is listening.'
      }));
    }

    // Truncate very long text to control costs
    const truncatedText = text.slice(-1500); // Last 1500 chars

    // Build the prompt
    const prompt = `Analyze this journal entry:

"""
${truncatedText}
"""

${mood ? `The writer selected mood: ${mood}` : ''}
Word count: ${wordCount}

Provide your mystical insight as JSON.`;

    // Get AI analysis with lower temperature for consistency
    const result = await generateCompletion({
      prompt,
      systemPrompt: ORACLE_SYSTEM_PROMPT,
      model: 'claude-sonnet-4-5-20250929', // Haiku for speed and cost
      maxTokens: 256,
      temperature: 0.8, // Some creativity but not too wild
      useCache: false // Real-time, don't cache
    });

    // Parse JSON response
    let analysis;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = result.text;
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                        jsonText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[analyze-journal-live] JSON parse error:', parseError);
      // Fallback to a mystical default
      analysis = {
        insight: "The threads of your thoughts weave patterns I am still discerning...",
        emotion: "contemplation",
        themes: ["reflection", "process"],
        suggestion: "Continue to write - clarity emerges from the shadows.",
        intensity: 0.5
      };
    }

    return res.status(200).json(success({
      insight: analysis.insight,
      emotion: analysis.emotion,
      themes: analysis.themes || [],
      suggestion: analysis.suggestion,
      intensity: analysis.intensity || 0.5
    }, {
      tokens: result.tokens,
      model: result.model
    }));

  } catch (err) {
    console.error('[/api/analyze-journal-live] Error:', err);

    // If LLM is disabled, return a mystical fallback
    if (err.message && err.message.includes('disabled')) {
      return res.status(200).json(success({
        insight: "The veil remains drawn... but your words echo in the void.",
        emotion: "mystery",
        themes: ["writing", "expression"],
        suggestion: "Continue your practice - the Oracle hears all.",
        intensity: 0.4,
        offline: true
      }));
    }

    return res.status(500).json(error(
      'The Oracle is momentarily silent',
      500,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    ));
  }
}
