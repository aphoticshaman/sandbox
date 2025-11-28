/**
 * POST /api/insights
 * AI insights with Sonnet for complex analysis (Premium only)
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

    const { prompt, maxTokens = 1000 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    const startTime = Date.now();

    // Use Sonnet for complex pattern analysis
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: Math.min(maxTokens, 1500),
      messages: [{ role: 'user', content: prompt }]
    });

    const inferenceTime = Date.now() - startTime;
    const tokensUsed = response.usage.output_tokens;

    // Log usage
    await logUsage(auth.user.id, 'insights', tokensUsed, 'sonnet');

    res.status(200).json({
      text: response.content[0].text,
      tokens: tokensUsed,
      inferenceTime,
      model: 'sonnet'
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      error: 'Insights generation failed',
      code: 'API_ERROR'
    });
  }
}
