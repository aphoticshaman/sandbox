/**
 * LLM COST TRACKER
 *
 * Tracks API usage and costs for user transparency.
 * Users can see how much they've spent on AI-enhanced readings.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeepAGIConfig, getModelCost } from './deepAGI';

const USAGE_KEY = '@veilpath_llm_usage';

/**
 * Get usage summary
 * @returns {Promise<Object>} Usage stats
 */
export async function getUsageSummary() {
  try {
    const usageJson = await AsyncStorage.getItem(USAGE_KEY);
    if (!usageJson) {
      return {
        totalReadings: 0,
        totalTokens: 0,
        totalCostUSD: 0,
        byProvider: {},
        lastUsed: null
      };
    }

    return JSON.parse(usageJson);
  } catch (error) {
    console.error('[LLMCostTracker] Error loading usage:', error);
    return {
      totalReadings: 0,
      totalTokens: 0,
      totalCostUSD: 0,
      byProvider: {},
      lastUsed: null
    };
  }
}

/**
 * Track a reading enhancement
 * @param {Object} details - { provider, model, inputTokens, outputTokens }
 * @returns {Promise<boolean>} Success status
 */
export async function trackUsage(details) {
  try {
    const { provider, model, inputTokens, outputTokens } = details;

    // Get current usage
    const usage = await getUsageSummary();

    // Calculate cost
    const cost = getModelCost(provider, model);
    const inputCost = (inputTokens / 1000000) * cost.input;
    const outputCost = (outputTokens / 1000000) * cost.output;
    const totalCost = inputCost + outputCost;

    // Update totals
    usage.totalReadings += 1;
    usage.totalTokens += (inputTokens + outputTokens);
    usage.totalCostUSD += totalCost;
    usage.lastUsed = new Date().toISOString();

    // Update by-provider stats
    if (!usage.byProvider[provider]) {
      usage.byProvider[provider] = {
        readings: 0,
        tokens: 0,
        costUSD: 0
      };
    }
    usage.byProvider[provider].readings += 1;
    usage.byProvider[provider].tokens += (inputTokens + outputTokens);
    usage.byProvider[provider].costUSD += totalCost;

    // Save
    await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(usage));

    return true;
  } catch (error) {
    console.error('[LLMCostTracker] Error tracking usage:', error);
    return false;
  }
}

/**
 * Reset usage stats
 * @returns {Promise<boolean>}
 */
export async function resetUsage() {
  try {
    await AsyncStorage.removeItem(USAGE_KEY);
    return true;
  } catch (error) {
    console.error('[LLMCostTracker] Error resetting usage:', error);
    return false;
  }
}

/**
 * Get formatted usage summary for display
 * @returns {Promise<string>} Formatted string
 */
export async function getFormattedUsage() {
  try {
    const usage = await getUsageSummary();

    if (usage.totalReadings === 0) {
      return 'No AI-enhanced readings yet';
    }

    let formatted = `Total: ${usage.totalReadings} readings, $${usage.totalCostUSD.toFixed(2)} USD\n`;
    formatted += `Tokens: ${usage.totalTokens.toLocaleString()}\n\n`;

    if (Object.keys(usage.byProvider).length > 0) {
      formatted += 'By Provider:\n';
      for (const [provider, stats] of Object.entries(usage.byProvider)) {
        formatted += `  ${provider}: ${stats.readings} readings, $${stats.costUSD.toFixed(2)}\n`;
      }
    }

    if (usage.lastUsed) {
      const lastUsedDate = new Date(usage.lastUsed);
      formatted += `\nLast used: ${lastUsedDate.toLocaleDateString()}`;
    }

    return formatted;
  } catch (error) {
    console.error('[LLMCostTracker] Error formatting usage:', error);
    return 'Error loading usage stats';
  }
}

/**
 * Export usage data (for user records)
 * @returns {Promise<Object>} Full usage data
 */
export async function exportUsageData() {
  try {
    const usage = await getUsageSummary();
    const config = await getDeepAGIConfig();

    return {
      exported: new Date().toISOString(),
      usage,
      currentProvider: config.provider,
      currentModel: config.model
    };
  } catch (error) {
    console.error('[LLMCostTracker] Error exporting usage:', error);
    return null;
  }
}
