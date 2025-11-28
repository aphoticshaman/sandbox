/**
 * LLM ENHANCEMENT CONFIG
 *
 * Simplified config for backward compatibility.
 * This wraps deepAGI.js for legacy code that expects getLLMConfig/setLLMConfig.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_KEY = '@veilpath_llm_enhancement_config';

const DEFAULT_CONFIG = {
  enabled: false,
  provider: 'anthropic', // anthropic | openai
  apiKey: '',
  model: 'claude-3-5-sonnet-20241022'
};

/**
 * Get LLM enhancement configuration
 * @returns {Promise<Object>} Config object
 */
export async function getLLMConfig() {
  try {
    const configJson = await AsyncStorage.getItem(CONFIG_KEY);
    if (!configJson) {
      return { ...DEFAULT_CONFIG };
    }

    const config = JSON.parse(configJson);
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.error('[LLMEnhancement] Error loading config:', error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save LLM enhancement configuration
 * @param {Object} config - Config object to save
 * @returns {Promise<boolean>} Success status
 */
export async function setLLMConfig(config) {
  try {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(fullConfig));
    return true;
  } catch (error) {
    console.error('[LLMEnhancement] Error saving config:', error);
    return false;
  }
}

/**
 * Check if LLM enhancement is enabled
 * @returns {Promise<boolean>}
 */
export async function isLLMEnabled() {
  try {
    const config = await getLLMConfig();
    return config.enabled && config.apiKey && config.apiKey.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Clear LLM configuration
 * @returns {Promise<boolean>}
 */
export async function clearLLMConfig() {
  try {
    await AsyncStorage.removeItem(CONFIG_KEY);
    return true;
  } catch (error) {
    console.error('[LLMEnhancement] Error clearing config:', error);
    return false;
  }
}
