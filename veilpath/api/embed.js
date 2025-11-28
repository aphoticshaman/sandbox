/**
 * POST /api/embed
 * Generate 3D semantic embeddings for arbitrary concepts
 *
 * Uses Claude to map text to 3-axis semantic space:
 * X: Elemental (Fire/Air + vs Water/Earth -)
 * Y: Consciousness (Light + vs Shadow -)
 * Z: Temporal (Future + vs Past -)
 */

import Anthropic from '@anthropic-ai/sdk';
import { authenticateRequest, logUsage } from '../lib/auth';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return res.status(auth.status).json({ error: auth.error, code: auth.error });
    }

    // Require premium
    if (!auth.user.isPremium) {
      return res.status(403).json({
        error: 'Premium subscription required',
        code: 'PREMIUM_REQUIRED',
        upgrade: true
      });
    }

    const { entities, context } = req.body;

    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return res.status(400).json({ error: 'Entities array required' });
    }

    if (entities.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 entities per request' });
    }

    const startTime = Date.now();

    // Build prompt for semantic positioning
    const prompt = buildEmbeddingPrompt(entities, context);

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.3, // Lower temp for consistent positioning
      messages: [{ role: 'user', content: prompt }]
    });

    const inferenceTime = Date.now() - startTime;
    const tokensUsed = response.usage.output_tokens;

    // Parse response
    const embeddings = parseEmbeddingResponse(response.content[0].text, entities);

    // Log usage
    await logUsage(auth.user.id, 'embed', tokensUsed, 'haiku');

    res.status(200).json({
      embeddings,
      tokens: tokensUsed,
      inferenceTime,
      model: 'haiku'
    });
  } catch (error) {
    console.error('Embedding error:', error);
    res.status(500).json({
      error: 'Embedding generation failed',
      code: 'API_ERROR'
    });
  }
}

function buildEmbeddingPrompt(entities, context = {}) {
  const userName = context.userName || 'user';
  const entitiesList = entities.map((e, i) => `${i + 1}. "${e.text}" (${e.category || 'concept'})`).join('\n');

  return `You are a semantic mapping expert. Map these concepts to 3D semantic space using tarot's archetypal framework.

USER: ${userName}
${context.mbtiType ? `MBTI: ${context.mbtiType}` : ''}
${context.recentReadings ? `Recent reading themes: ${context.recentReadings.join(', ')}` : ''}

CONCEPTS TO MAP:
${entitiesList}

═══════════════════════════════════════════════
3D SEMANTIC SPACE AXES:
═══════════════════════════════════════════════

X-AXIS: ELEMENTAL POLARITY (-1.0 to +1.0)
  -1.0 = Pure Water/Earth (receptive, grounded, feminine, internal, passive, nurturing, stable)
  +1.0 = Pure Fire/Air (active, dynamic, masculine, external, assertive, changing, energetic)
  Examples:
    - "love" → -0.3 (receptive emotion)
    - "ambition" → +0.7 (active drive)
    - "meditation" → -0.5 (internal practice)
    - "leadership" → +0.8 (external action)

Y-AXIS: CONSCIOUSNESS DEPTH (-1.0 to +1.0)
  -1.0 = Pure Shadow (hidden, repressed, unconscious, fear, shame, denied self)
  +1.0 = Pure Light (conscious, integrated, expressed, virtue, acknowledged self)
  Examples:
    - "anxiety" → -0.6 (shadow emotion)
    - "confidence" → +0.7 (light quality)
    - "addiction" → -0.8 (shadow pattern)
    - "wisdom" → +0.9 (light achievement)

Z-AXIS: TEMPORAL FOCUS (-1.0 to +1.0)
  -1.0 = Pure Past (memory, tradition, regret, history, what was, roots)
  +1.0 = Pure Future (vision, innovation, hope, possibility, what could be, growth)
  Examples:
    - "nostalgia" → -0.7 (past emotion)
    - "hope" → +0.8 (future emotion)
    - "grief" → -0.6 (processing past loss)
    - "ambition" → +0.7 (future drive)

═══════════════════════════════════════════════
CRITICAL RULES:
═══════════════════════════════════════════════

1. Position each concept based on its ESSENTIAL NATURE, not superficial associations
2. Consider ${userName}'s personal context - the same word means different things to different people
3. Spread concepts across the space - avoid clustering everything near zero
4. Use the full range (-1.0 to +1.0) - be bold with extreme positions when warranted
5. Related concepts should be near each other, opposites should be far apart
6. Each position is a 3-number array: [x, y, z]

═══════════════════════════════════════════════
OUTPUT FORMAT (JSON only, no explanation):
═══════════════════════════════════════════════

{
  "embeddings": [
    { "index": 0, "position": [x, y, z], "reasoning": "one sentence why" },
    { "index": 1, "position": [x, y, z], "reasoning": "one sentence why" },
    ...
  ]
}

Generate positions for all ${entities.length} concepts NOW:`;
}

function parseEmbeddingResponse(text, entities) {
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.embeddings || !Array.isArray(parsed.embeddings)) {
      throw new Error('Invalid embeddings format');
    }

    // Validate and normalize embeddings
    const embeddings = parsed.embeddings.map((emb, i) => {
      const entity = entities[emb.index] || entities[i];

      if (!emb.position || emb.position.length !== 3) {
        throw new Error(`Invalid position for entity ${i}`);
      }

      // Clamp values to [-1, 1]
      const position = emb.position.map(v => Math.max(-1, Math.min(1, parseFloat(v))));

      return {
        text: entity.text,
        category: entity.category || 'concept',
        position: position,
        reasoning: emb.reasoning || '',
        timestamp: Date.now()
      };
    });

    return embeddings;
  } catch (error) {
    console.error('Parse error:', error);
    // Fallback: random positions
    return entities.map(entity => ({
      text: entity.text,
      category: entity.category || 'concept',
      position: [
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ],
      reasoning: 'Fallback positioning',
      timestamp: Date.now()
    }));
  }
}
