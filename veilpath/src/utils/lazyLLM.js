/**
 * CLOUD LLM LOADER
 *
 * Wraps cloudAPIService to provide LLM functionality.
 * Premium users get cloud AI, free users get templates.
 *
 * Migration note: This replaced the old on-device llama.rn system.
 * All the heavy model download/management code is now removed.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

let cloudModule = null;
let loadPromise = null;

const STORAGE_KEYS = {
  SUBSCRIPTION_STATUS: '@subscription_status'
};

/**
 * Check if user has premium subscription
 */
export async function isPremiumUser() {
  const status = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
  return status === 'premium';
}

/**
 * Check if enhancement should be enabled (premium only)
 */
export async function shouldLoadLLM() {
  return isPremiumUser();
}

/**
 * Get the cloud API module
 */
export async function getLLMModule() {
  if (cloudModule) {
    return cloudModule;
  }

  const isPremium = await isPremiumUser();
  if (!isPremium) {
    return null;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      const module = await import('../services/cloudAPIService');
      cloudModule = module;
      return module;
    } catch (error) {
      console.error('[LLM] Failed to load cloud API:', error);
      loadPromise = null;
      return null;
    }
  })();

  return loadPromise;
}

/**
 * Check if LLM/AI enhancement is enabled
 * Returns true only for premium users with network connectivity
 */
export async function isEnhancementEnabled() {
  const module = await getLLMModule();
  if (!module) {
    return false;
  }

  try {
    const availability = await module.isCloudAvailable();
    return availability.available;
  } catch (error) {
    console.error('[LLM] isEnhancementEnabled error:', error);
    return false;
  }
}

/**
 * Legacy compatibility - enable/disable enhancement
 * Now just checks subscription status
 */
export async function enableEnhancement() {
  const isPremium = await isPremiumUser();
  if (!isPremium) {
    throw new Error('Premium subscription required for AI features');
  }
  return getLLMModule();
}

export async function disableEnhancement() {
  // No-op for cloud API - just log
}

/**
 * Initialize LLM - for cloud, just verify connectivity
 */
export async function initializeLLM() {
  try {
    const module = await getLLMModule();
    if (!module) {
      return null;
    }

    const result = await module.initializeLLM();
    return result ? { ready: true } : null;
  } catch (error) {
    console.error('[LLM] initializeLLM error:', error);
    return null;
  }
}

/**
 * Generate card interpretation
 */
export async function generateCardInterpretation(card, context) {
  const module = await getLLMModule();
  if (!module) {
    return null; // Fallback to template
  }

  return module.generateCardInterpretation(card, context);
}

/**
 * Enhance/generate synthesis
 */
export async function enhanceSynthesis(baseSynthesis, readingData) {
  const module = await getLLMModule();
  if (!module) {
    return baseSynthesis; // Return original
  }

  try {
    const result = await module.generateSynthesis(
      readingData.cards || [],
      readingData
    );
    return result?.text || baseSynthesis;
  } catch (error) {
    console.error('[LLM] enhanceSynthesis error:', error);
    return baseSynthesis;
  }
}

/**
 * Generate vera chat response
 */
export async function generateVeraResponse(messages, context) {
  const module = await getLLMModule();
  if (!module) {
    return {
      error: 'AI features require premium subscription',
      requiresUpgrade: true
    };
  }

  return module.generateVeraResponse(messages, context);
}

/**
 * Get model/service info
 */
export async function getModelInfo() {
  const module = await getLLMModule();
  if (!module) {
    return {
      type: 'cloud',
      available: false,
      requiresSubscription: true,
      reason: 'Premium subscription required'
    };
  }

  return module.getModelInfo();
}

/**
 * Get API usage stats
 */
export async function getUsageStats() {
  const module = await getLLMModule();
  if (!module) {
    return null;
  }

  return module.getUsageStats();
}

/**
 * Release resources - no-op for cloud
 */
export async function releaseLLM() {
  const module = await getLLMModule();
  if (module) {
    return module.releaseLLM();
  }
}

// ═══════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY STUBS
// These functions existed for on-device LLM but are not needed for cloud
// ═══════════════════════════════════════════════════════════

export async function downloadModel() {
  throw new Error('Model download not required. AI features use cloud API.');
}

export async function deleteModel() {
}

export async function getModelVariant() {
  return 'cloud'; // No variants for cloud
}

export async function setModelVariant() {
}

export async function getAvailableVariants() {
  return [{ id: 'cloud', name: 'Cloud API', description: 'Claude AI via cloud' }];
}

export async function checkHardwareRequirements() {
  // Cloud API has no hardware requirements
  return {
    canRun: true,
    meetsRecommended: true,
    warnings: [],
    errors: [],
    specs: { type: 'cloud' }
  };
}

export async function getEnableIntent() {
  return isPremiumUser();
}
