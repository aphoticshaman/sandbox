/**
 * /api/analyze-intention
 * Real-time LLM analysis of reading intention as user types
 *
 * Returns color-coded feedback:
 * - RED: Intention needs significant work (score 0-3)
 * - YELLOW: Helpful but could be better (score 4-6)
 * - GREEN: Great intention, will enhance reading (score 7-10)
 *
 * Analyzes for:
 * - 5W+H completeness (Who, What, When, Where, Why, How)
 * - Groundedness in reality (not vague/abstract)
 * - CBT/DBT therapeutic alignment
 * - Mindfulness and self-reflection
 * - Positive growth orientation
 * - Safety screening
 */

import { generateCompletion } from '../lib/claude.js';
import { success, error } from './_utils/response.js';

const INTENTION_ANALYZER_PROMPT = `You are a therapeutic guide analyzing a tarot reading intention. Help users set meaningful, grounded intentions.

ANALYZE FOR:

1. **5W+H** (0-5): Does it address Who/What/When/Where/Why/How? More context = better reading.

2. **Groundedness** (0-5): Is it concrete? Real situations beat abstract wishes.

3. **CBT/DBT Alignment** (0-5): Does it support healthy thinking patterns?
   - Avoids catastrophizing, all-or-nothing thinking
   - Shows willingness to examine thoughts/feelings
   - Open to alternative perspectives

4. **Mindfulness** (0-5): Shows present-moment awareness and self-reflection?

5. **Growth Orientation** (0-5): Focused on understanding, healing, personal growth?

6. **Safety** (pass/fail): Flag if about:
   - Self-harm or harming others
   - Illegal activities
   - Manipulation/deception
   - Obsessive fixation on outcomes
   - Trying to control others

SCORING:
- 0-3: RED - Needs significant work (too vague, unhealthy focus, or unsafe)
- 4-6: YELLOW - Helpful but could be stronger
- 7-10: GREEN - Excellent, will enhance the reading

Respond ONLY with valid JSON:
{
  "overall_score": 0-10,
  "color": "red" | "yellow" | "green",
  "fiveWH": { "score": 0-5, "present": ["what", "why"], "missing": ["who", "when"] },
  "groundedness": { "score": 0-5, "feedback": "brief" },
  "cbtDbt": { "score": 0-5, "feedback": "brief" },
  "mindfulness": { "score": 0-5, "feedback": "brief" },
  "growth": { "score": 0-5, "feedback": "brief" },
  "safe": true/false,
  "safetyNote": null or "concern if unsafe",
  "suggestion": "One actionable tip to improve (1-2 sentences)",
  "encouragement": "Brief positive note about what they did well",
  "ready": true/false
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(error('Method not allowed', 405));
  }

  try {
    const { text, spreadType } = req.body;

    // Need minimum text to analyze
    if (!text || text.trim().length < 20) {
      return res.status(200).json(success({
        waiting: true,
        color: 'yellow',
        message: 'Keep writing... the Oracle is listening.',
        overall_score: 0
      }));
    }

    const prompt = `Analyze this tarot reading intention:

"""
${text.trim().slice(0, 1200)}
"""

Spread type: ${spreadType || 'general'}
Character count: ${text.length}

Provide therapeutic analysis as JSON.`;

    const result = await generateCompletion({
      prompt,
      systemPrompt: INTENTION_ANALYZER_PROMPT,
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 500,
      temperature: 0.3,
      useCache: false
    });

    // Parse JSON response
    let analysis;
    try {
      let jsonText = result.text;
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                        jsonText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      analysis = JSON.parse(jsonText);

      // Ensure color is set based on score
      if (!analysis.color) {
        if (analysis.overall_score <= 3) analysis.color = 'red';
        else if (analysis.overall_score <= 6) analysis.color = 'yellow';
        else analysis.color = 'green';
      }
    } catch (parseError) {
      console.error('[analyze-intention] JSON parse error:', parseError);
      analysis = {
        overall_score: 5,
        color: 'yellow',
        fiveWH: { score: 3, present: [], missing: ['details'] },
        groundedness: { score: 3, feedback: "Analyzing..." },
        cbtDbt: { score: 3, feedback: "Assessing..." },
        mindfulness: { score: 3, feedback: "Present" },
        growth: { score: 3, feedback: "Reflecting..." },
        safe: true,
        safetyNote: null,
        suggestion: "Continue developing your intention with more specific details.",
        encouragement: "You're on the right track.",
        ready: false
      };
    }

    return res.status(200).json(success(analysis));

  } catch (err) {
    console.error('[/api/analyze-intention] Error:', err);

    if (err.message && err.message.includes('disabled')) {
      return res.status(200).json(success({
        offline: true,
        overall_score: 5,
        color: 'yellow',
        safe: true,
        ready: true,
        suggestion: "LLM analysis unavailable - proceed with your intention."
      }));
    }

    return res.status(500).json(error(
      'Failed to analyze intention',
      500,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    ));
  }
}
