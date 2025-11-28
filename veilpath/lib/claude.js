/**
 * Anthropic Claude API Wrapper
 * Handles all interactions with Claude AI
 */

import Anthropic from '@anthropic-ai/sdk';
import { getCachedResponse, cacheResponse } from './cache.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ENABLE_LLM = process.env.ENABLE_LLM === 'true';

if (!ANTHROPIC_API_KEY && ENABLE_LLM) {
  console.warn('ANTHROPIC_API_KEY not set - LLM features will be disabled');
}

// Initialize Anthropic client
const client = ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
}) : null;

/**
 * Generate completion using Claude
 */
export async function generateCompletion(options = {}) {
  const {
    prompt,
    systemPrompt = '',
    model = 'claude-sonnet-4-5-20250929',
    maxTokens = 1024,
    temperature = 1.0,
    useCache = true
  } = options;

  if (!ENABLE_LLM || !client) {
    throw new Error('LLM features are disabled or not configured');
  }

  // Check cache first
  if (useCache) {
    const fullPrompt = systemPrompt + '\n\n' + prompt;
    const cached = await getCachedResponse(fullPrompt);
    if (cached) {
      return {
        text: cached.text,
        tokens: cached.tokens,
        model: cached.model,
        cached: true
      };
    }
  }

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{
        role: 'user',
        content: prompt
      }],
      ...(systemPrompt && { system: systemPrompt })
    });

    const result = {
      text: response.content[0].text,
      tokens: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
      cached: false
    };

    // Cache the response
    if (useCache) {
      const fullPrompt = systemPrompt + '\n\n' + prompt;
      await cacheResponse(fullPrompt, {
        text: result.text,
        tokens: result.tokens,
        model: result.model
      }, result.model, result.tokens);
    }

    return result;
  } catch (error) {
    console.error('[Claude API Error]', error);
    throw error;
  }
}

/**
 * Generate streaming completion (for real-time narration)
 */
export async function* generateStreamingCompletion(options = {}) {
  const {
    prompt,
    systemPrompt = '',
    model = 'claude-sonnet-4-5-20250929',
    maxTokens = 2048,
    temperature = 1.0
  } = options;

  if (!ENABLE_LLM || !client) {
    throw new Error('LLM features are disabled or not configured');
  }

  try {
    const stream = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{
        role: 'user',
        content: prompt
      }],
      ...(systemPrompt && { system: systemPrompt }),
      stream: true
    });

    let fullText = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullText += text;
        yield { text, fullText };
      }
    }
  } catch (error) {
    console.error('[Claude Streaming Error]', error);
    throw error;
  }
}

/**
 * Count tokens (approximation)
 * Claude uses ~4 chars per token as a rough estimate
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

export default {
  generateCompletion,
  generateStreamingCompletion,
  estimateTokens
};
