/**
 * DEEP AGI CONFIGURATION
 *
 * Manages AI-enhanced synthesis using cloud APIs:
 * - Claude 3.5 Sonnet (Anthropic) - Best quality, most creative
 * - GPT-4 (OpenAI) - Strong alternative
 * - Gemini Pro (Google) - Fast and cost-effective
 * - Grok (xAI) - Experimental
 *
 * Features:
 * - User brings their own API key (no app store scrutiny)
 * - User pays their own costs
 * - Fallback to standard synthesis if API fails
 * - Optional beam search for better outputs
 * - Chain-of-thought reasoning
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_KEY = '@lunatiq_deep_agi_config';

const DEFAULT_CONFIG = {
  enabled: false,
  provider: 'anthropic', // anthropic | openai | google | xai
  apiKey: '',
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.8,
  beamWidth: 3,
  useChainOfThought: true,
  useBeamSearch: true,
  maxTokens: 4000
};

/**
 * Get AGI configuration
 * @returns {Promise<Object>} Config object
 */
export async function getDeepAGIConfig() {
  try {
    const configJson = await AsyncStorage.getItem(CONFIG_KEY);
    if (!configJson) {
      return { ...DEFAULT_CONFIG };
    }

    const config = JSON.parse(configJson);
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.error('[DeepAGI] Error loading config:', error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save AGI configuration
 * @param {Object} config - Config object to save
 * @returns {Promise<boolean>} Success status
 */
export async function setDeepAGIConfig(config) {
  try {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(fullConfig));
    console.log('[DeepAGI] Configuration saved');
    return true;
  } catch (error) {
    console.error('[DeepAGI] Error saving config:', error);
    return false;
  }
}

/**
 * Check if AGI is enabled and has valid API key
 * @returns {Promise<boolean>}
 */
export async function isAGIEnabled() {
  try {
    const config = await getDeepAGIConfig();
    return config.enabled && config.apiKey && config.apiKey.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get model cost per 1M tokens (input/output)
 * Based on current pricing (Jan 2025)
 */
export function getModelCost(provider, model) {
  const costs = {
    anthropic: {
      'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
      'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
      'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }
    },
    openai: {
      'gpt-4-turbo': { input: 10.00, output: 30.00 },
      'gpt-4': { input: 30.00, output: 60.00 },
      'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
    },
    google: {
      'gemini-pro': { input: 0.50, output: 1.50 },
      'gemini-1.5-pro': { input: 1.25, output: 5.00 }
    },
    xai: {
      'grok-beta': { input: 5.00, output: 15.00 }
    }
  };

  return costs[provider]?.[model] || { input: 0, output: 0 };
}

/**
 * Estimate cost for a reading enhancement
 * @param {number} estimatedTokens - Estimated tokens (default: ~2000)
 * @returns {Promise<Object>} { costUSD, breakdown }
 */
export async function estimateReadingCost(estimatedTokens = 2000) {
  try {
    const config = await getDeepAGIConfig();
    const cost = getModelCost(config.provider, config.model);

    // Input: synthesis + cards + context (~1500 tokens)
    // Output: enhanced synthesis (~2000-4000 tokens)
    const inputTokens = 1500;
    const outputTokens = estimatedTokens;

    const inputCost = (inputTokens / 1000000) * cost.input;
    const outputCost = (outputTokens / 1000000) * cost.output;
    const totalCost = inputCost + outputCost;

    return {
      costUSD: totalCost,
      breakdown: {
        inputTokens,
        outputTokens,
        inputCost,
        outputCost
      }
    };
  } catch (error) {
    console.error('[DeepAGI] Error estimating cost:', error);
    return { costUSD: 0, breakdown: {} };
  }
}

/**
 * Clear AGI configuration (remove API key)
 * @returns {Promise<boolean>}
 */
export async function clearAGIConfig() {
  try {
    await AsyncStorage.removeItem(CONFIG_KEY);
    console.log('[DeepAGI] Configuration cleared');
    return true;
  } catch (error) {
    console.error('[DeepAGI] Error clearing config:', error);
    return false;
  }
}
