/**
 * POST /api/interpret
 * Generate card interpretation via Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { authenticateRequest, checkUsageLimits, logUsage, incrementReadingCount } from '../lib/auth';

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

    // Check limits
    const usage = await checkUsageLimits(auth.user.id, auth.user.tier);
    if (usage.remaining.readings <= 0 && !auth.user.isPremium) {
      return res.status(429).json({
        error: 'Daily reading limit reached',
        code: 'READING_LIMIT',
        upgrade: true
      });
    }

    const { prompt, maxTokens = 500 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: Math.min(maxTokens, 800),
      messages: [{ role: 'user', content: prompt }]
    });

    const inferenceTime = Date.now() - startTime;
    const tokensUsed = response.usage.output_tokens;

    // Log usage
    await logUsage(auth.user.id, 'interpret', tokensUsed, 'haiku');
    await incrementReadingCount(auth.user.id, tokensUsed);

    res.status(200).json({
      text: response.content[0].text,
      tokens: tokensUsed,
      inferenceTime,
      model: 'haiku'
    });
  } catch (error) {
    console.error('Interpretation error:', error);
    res.status(500).json({
      error: 'Interpretation failed',
      code: 'API_ERROR'
    });
  }
}
