/**
 * POST /api/oracle
 * Oracle chat via Claude API (Premium only)
 */

import Anthropic from '@anthropic-ai/sdk';
import { authenticateRequest, checkUsageLimits, logUsage, incrementOracleCount } from '../lib/auth';

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

    // Check oracle limit
    const usage = await checkUsageLimits(auth.user.id, auth.user.tier);
    if (usage.remaining.oracle <= 0) {
      return res.status(429).json({
        error: 'Daily oracle message limit reached',
        code: 'ORACLE_LIMIT'
      });
    }

    const { systemPrompt, messages, maxTokens = 600 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: Math.min(maxTokens, 800),
      system: systemPrompt || 'You are a wise tarot oracle.',
      messages: messages.slice(-10) // Keep last 10 for context
    });

    const inferenceTime = Date.now() - startTime;
    const tokensUsed = response.usage.output_tokens;

    // Log usage
    await logUsage(auth.user.id, 'oracle', tokensUsed, 'haiku');
    await incrementOracleCount(auth.user.id, tokensUsed);

    res.status(200).json({
      text: response.content[0].text,
      tokens: tokensUsed,
      inferenceTime,
      model: 'haiku'
    });
  } catch (error) {
    console.error('Oracle error:', error);
    res.status(500).json({
      error: 'Oracle response failed',
      code: 'API_ERROR'
    });
  }
}
