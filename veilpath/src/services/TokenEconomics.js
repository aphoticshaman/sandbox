/**
 * TOKEN ECONOMICS & USAGE LIMITS
 *
 * Manages AI chat usage to balance user experience with sustainability.
 *
 * CRITICAL BUSINESS CONSTRAINTS:
 * - Can't do truly unlimited (would bankrupt us)
 * - Free tier needs to give a "taste" that hooks them
 * - Paid tiers need to feel generous without breaking the bank
 * - Heavy users on highest tier can't drain us dry
 * - ToS must give us flexibility to adjust limits
 *
 * Design Philosophy:
 * - Free: 1 chat/day, 125 words max response (taste test)
 * - Seeker ($4.99): 10 chats/day, 300 words
 * - Adept ($9.99): 30 chats/day, 500 words
 * - Mystic ($14.99): 100 chats/day, 800 words (soft limit)
 *
 * Why word limits instead of tokens?
 * - Users understand words, not tokens
 * - Easier to explain and enforce
 * - Roughly 1 word ≈ 1.3 tokens, so we can convert
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const USAGE_KEY = '@veilpath_chat_usage';
const USAGE_HISTORY_KEY = '@veilpath_chat_usage_history';

/**
 * TIER DEFINITIONS
 * These can be adjusted via remote config in the future
 */
export const USAGE_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    dailyChats: 1,           // 1 chat per day
    maxResponseWords: 125,   // ~160 tokens - enough to intrigue
    maxInputWords: 100,      // Limit their questions too
    features: {
      companionSwitch: false, // Stuck with Luna (or Sol if they picked)
      deepReflection: false,
      voiceOutput: false,
      contextMemory: 3,       // Only remembers 3 messages back
    },
    upsellMessage: 'Want more? Seeker tier gives you 10 chats/day →',
  },

  seeker: {
    id: 'seeker',
    name: 'Seeker',
    price: 4.99,
    dailyChats: 10,
    maxResponseWords: 300,   // ~400 tokens
    maxInputWords: 250,
    features: {
      companionSwitch: true,  // Can switch Sol/Luna
      deepReflection: false,
      voiceOutput: false,
      contextMemory: 10,
    },
    upsellMessage: 'Upgrade to Adept for longer conversations →',
  },

  adept: {
    id: 'adept',
    name: 'Adept',
    price: 9.99,
    dailyChats: 30,
    maxResponseWords: 500,   // ~650 tokens
    maxInputWords: 400,
    features: {
      companionSwitch: true,
      deepReflection: true,  // Can request deeper analysis
      voiceOutput: true,     // TTS unlocked
      contextMemory: 20,
    },
    upsellMessage: 'Go Mystic for the full experience →',
  },

  mystic: {
    id: 'mystic',
    name: 'Mystic',
    price: 14.99,
    dailyChats: 100,         // Soft limit - we track and may throttle
    maxResponseWords: 800,   // ~1000 tokens
    maxInputWords: 600,
    features: {
      companionSwitch: true,
      deepReflection: true,
      voiceOutput: true,
      contextMemory: 50,     // Full conversation memory
      prioritySupport: true,
    },
    // No upsell - they're at the top
    hardCap: {
      // If they consistently hit these, we flag for review
      monthlyChats: 3000,    // ~100/day * 30 days
      monthlyWords: 2400000, // 800 * 3000 = 2.4M words
    },
  },
};

/**
 * Get current usage state
 */
export async function getUsageState() {
  try {
    const data = await AsyncStorage.getItem(USAGE_KEY);
    if (data) {
      const usage = JSON.parse(data);

      // Check if we need to reset daily counters
      const today = new Date().toDateString();
      if (usage.lastResetDate !== today) {
        usage.dailyChatsUsed = 0;
        usage.dailyWordsUsed = 0;
        usage.lastResetDate = today;
        await saveUsageState(usage);
      }

      return usage;
    }

    // Initialize new usage state
    const initialState = {
      tier: 'free',
      dailyChatsUsed: 0,
      dailyWordsUsed: 0,
      monthlyChatsUsed: 0,
      monthlyWordsUsed: 0,
      lastResetDate: new Date().toDateString(),
      lastMonthReset: new Date().toISOString().slice(0, 7), // YYYY-MM
      totalChatsAllTime: 0,
      totalWordsAllTime: 0,
    };
    await saveUsageState(initialState);
    return initialState;

  } catch (error) {
    console.error('[TokenEconomics] Error loading usage:', error);
    return null;
  }
}

/**
 * Save usage state
 */
async function saveUsageState(state) {
  try {
    await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[TokenEconomics] Error saving usage:', error);
  }
}

/**
 * Check if user can chat
 * Returns { canChat, reason, remaining, tier }
 */
export async function canUserChat(userTier = 'free') {
  const usage = await getUsageState();
  const tierConfig = USAGE_TIERS[userTier] || USAGE_TIERS.free;

  const remaining = tierConfig.dailyChats - usage.dailyChatsUsed;

  if (remaining <= 0) {
    return {
      canChat: false,
      reason: 'daily_limit',
      remaining: 0,
      tier: tierConfig,
      message: tierConfig.upsellMessage || 'Daily limit reached. Come back tomorrow!',
      resetTime: getTimeUntilReset(),
    };
  }

  // Check monthly hard cap for Mystic tier
  if (userTier === 'mystic' && tierConfig.hardCap) {
    if (usage.monthlyChatsUsed >= tierConfig.hardCap.monthlyChats) {
      return {
        canChat: false,
        reason: 'monthly_cap',
        remaining: 0,
        tier: tierConfig,
        message: 'Monthly limit reached. Resets on the 1st.',
      };
    }
  }

  return {
    canChat: true,
    remaining,
    tier: tierConfig,
  };
}

/**
 * Record a chat and update usage
 */
export async function recordChat(userTier = 'free', responseWordCount = 0) {
  const usage = await getUsageState();
  const tierConfig = USAGE_TIERS[userTier] || USAGE_TIERS.free;

  // Update counters
  usage.dailyChatsUsed += 1;
  usage.dailyWordsUsed += responseWordCount;
  usage.monthlyChatsUsed += 1;
  usage.monthlyWordsUsed += responseWordCount;
  usage.totalChatsAllTime += 1;
  usage.totalWordsAllTime += responseWordCount;

  await saveUsageState(usage);

  // Record to history for analytics
  await recordUsageHistory({
    timestamp: Date.now(),
    tier: userTier,
    wordCount: responseWordCount,
  });

  return {
    dailyRemaining: tierConfig.dailyChats - usage.dailyChatsUsed,
    dailyUsed: usage.dailyChatsUsed,
    monthlyUsed: usage.monthlyChatsUsed,
  };
}

/**
 * Get max response words for tier
 */
export function getMaxResponseWords(userTier = 'free') {
  const tierConfig = USAGE_TIERS[userTier] || USAGE_TIERS.free;
  return tierConfig.maxResponseWords;
}

/**
 * Get max input words for tier
 */
export function getMaxInputWords(userTier = 'free') {
  const tierConfig = USAGE_TIERS[userTier] || USAGE_TIERS.free;
  return tierConfig.maxInputWords;
}

/**
 * Get context memory limit (how many messages to include)
 */
export function getContextMemoryLimit(userTier = 'free') {
  const tierConfig = USAGE_TIERS[userTier] || USAGE_TIERS.free;
  return tierConfig.features.contextMemory;
}

/**
 * Check if feature is available for tier
 */
export function hasFeature(userTier, featureName) {
  const tierConfig = USAGE_TIERS[userTier] || USAGE_TIERS.free;
  return tierConfig.features[featureName] || false;
}

/**
 * Get time until daily reset (for countdown display)
 */
export function getTimeUntilReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, totalMs: diff };
}

/**
 * Get usage summary for UI display
 */
export async function getUsageSummary(userTier = 'free') {
  const usage = await getUsageState();
  const tierConfig = USAGE_TIERS[userTier] || USAGE_TIERS.free;

  return {
    tier: tierConfig.name,
    daily: {
      used: usage.dailyChatsUsed,
      limit: tierConfig.dailyChats,
      remaining: tierConfig.dailyChats - usage.dailyChatsUsed,
      percent: (usage.dailyChatsUsed / tierConfig.dailyChats) * 100,
    },
    monthly: {
      used: usage.monthlyChatsUsed,
      limit: tierConfig.hardCap?.monthlyChats || 'unlimited',
    },
    lifetime: {
      chats: usage.totalChatsAllTime,
      words: usage.totalWordsAllTime,
    },
    resetTime: getTimeUntilReset(),
  };
}

/**
 * Record usage to history (for analytics)
 */
async function recordUsageHistory(entry) {
  try {
    const historyJson = await AsyncStorage.getItem(USAGE_HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];

    history.push(entry);

    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    await AsyncStorage.setItem(USAGE_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('[TokenEconomics] Error recording history:', error);
  }
}

/**
 * Convert words to approximate token count
 * For cost estimation purposes
 */
export function wordsToTokens(wordCount) {
  // Average: 1 word ≈ 1.3 tokens
  return Math.ceil(wordCount * 1.3);
}

/**
 * Estimate cost for a response
 * Based on Claude Sonnet pricing: ~$3/M input, ~$15/M output tokens
 */
export function estimateCost(inputWords, outputWords) {
  const inputTokens = wordsToTokens(inputWords);
  const outputTokens = wordsToTokens(outputWords);

  const inputCost = (inputTokens / 1000000) * 3;   // $3 per million
  const outputCost = (outputTokens / 1000000) * 15; // $15 per million

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    costUSD: inputCost + outputCost,
  };
}

/**
 * Calculate monthly cost at full usage for a tier
 * This helps us understand our exposure
 */
export function calculateTierExposure(tierName) {
  const tier = USAGE_TIERS[tierName];
  if (!tier) return null;

  const monthlyChats = tier.dailyChats * 30;
  const avgInputWords = tier.maxInputWords * 0.7; // Assume 70% utilization
  const avgOutputWords = tier.maxResponseWords * 0.9; // Assume 90% utilization

  const costPerChat = estimateCost(avgInputWords, avgOutputWords).costUSD;
  const monthlyCostAtFull = costPerChat * monthlyChats;

  return {
    tierName,
    tierPrice: tier.price || 0,
    maxMonthlyChats: monthlyChats,
    estimatedCostPerChat: costPerChat,
    estimatedMonthlyCost: monthlyCostAtFull,
    margin: tier.price ? (tier.price - monthlyCostAtFull) : -monthlyCostAtFull,
    profitable: tier.price ? tier.price > monthlyCostAtFull : false,
  };
}

/**
 * Check all tier exposures (for business planning)
 */
export function analyzeAllTiers() {
  return {
    free: calculateTierExposure('free'),
    seeker: calculateTierExposure('seeker'),
    adept: calculateTierExposure('adept'),
    mystic: calculateTierExposure('mystic'),
  };
}

/**
 * Reset usage for testing
 */
export async function resetUsageForTesting() {
  await AsyncStorage.removeItem(USAGE_KEY);
  await AsyncStorage.removeItem(USAGE_HISTORY_KEY);
}

/**
 * Upgrade user tier (called after purchase)
 */
export async function upgradeTier(newTier) {
  const usage = await getUsageState();
  usage.tier = newTier;
  await saveUsageState(usage);
  return usage;
}
