/**
 * PREMIUM FEATURE GATING SERVICE
 *
 * Controls access to premium features based on subscription tier.
 * Integrates with TokenEconomics for usage limits.
 *
 * FEATURE CATEGORIES:
 * 1. Vera Chat - Tiered daily limits & response lengths
 * 2. Readings - Some spreads locked to premium
 * 3. Cosmetics - Exclusive items for paid tiers
 * 4. Tools - CBT/DBT tools gated by tier
 * 5. Social - Future features like sharing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { USAGE_TIERS, hasFeature, canUserChat, getUsageSummary } from './TokenEconomics';
import { getBonusChatsAvailable, canWatchAd } from './RewardedAdsService';

const SUBSCRIPTION_KEY = '@veilpath_subscription';

// ═══════════════════════════════════════════════════════════════
// FEATURE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const PREMIUM_FEATURES = {
  // Vera AI Chat
  vera_chat: {
    id: 'vera_chat',
    name: 'Chat with Vera',
    description: 'AI life coach conversations',
    tiers: ['free', 'seeker', 'adept', 'mystic'],  // All tiers, different limits
  },
  vera_voice: {
    id: 'vera_voice',
    name: 'Voice Output',
    description: 'Have Vera speak responses aloud',
    tiers: ['adept', 'mystic'],
  },
  vera_deep_reflection: {
    id: 'vera_deep_reflection',
    name: 'Deep Reflection',
    description: 'Request deeper analysis on topics',
    tiers: ['adept', 'mystic'],
  },

  // Readings
  single_card: {
    id: 'single_card',
    name: 'Single Card Reading',
    description: 'Daily single card pull',
    tiers: ['free', 'seeker', 'adept', 'mystic'],
  },
  three_card: {
    id: 'three_card',
    name: 'Three Card Spread',
    description: 'Past, Present, Future reading',
    tiers: ['free', 'seeker', 'adept', 'mystic'],
  },
  celtic_cross: {
    id: 'celtic_cross',
    name: 'Celtic Cross Spread',
    description: 'Full 10-card comprehensive reading',
    tiers: ['seeker', 'adept', 'mystic'],  // Premium only
  },
  unlimited_readings: {
    id: 'unlimited_readings',
    name: 'Unlimited Daily Readings',
    description: 'No daily reading limit',
    tiers: ['adept', 'mystic'],
  },

  // Tools
  cbt_basic: {
    id: 'cbt_basic',
    name: 'Basic CBT Tools',
    description: 'Thought records & cognitive restructuring',
    tiers: ['free', 'seeker', 'adept', 'mystic'],
  },
  cbt_advanced: {
    id: 'cbt_advanced',
    name: 'Advanced CBT Tools',
    description: 'Behavioral experiments & exposure planning',
    tiers: ['adept', 'mystic'],
  },
  dbt_tools: {
    id: 'dbt_tools',
    name: 'DBT Tools',
    description: 'Mindfulness, distress tolerance, emotion regulation',
    tiers: ['seeker', 'adept', 'mystic'],
  },

  // Cosmetics
  basic_decks: {
    id: 'basic_decks',
    name: 'Classic Deck Collection',
    description: 'Standard tarot deck styles',
    tiers: ['free', 'seeker', 'adept', 'mystic'],
  },
  premium_decks: {
    id: 'premium_decks',
    name: 'Premium Deck Collection',
    description: 'Exclusive artistic deck styles',
    tiers: ['adept', 'mystic'],
  },
  mystic_exclusives: {
    id: 'mystic_exclusives',
    name: 'Mystic Exclusives',
    description: 'Rare cosmetics only for top tier',
    tiers: ['mystic'],
  },

  // Journal
  journal_basic: {
    id: 'journal_basic',
    name: 'Basic Journaling',
    description: 'Text journal entries',
    tiers: ['free', 'seeker', 'adept', 'mystic'],
  },
  journal_prompts: {
    id: 'journal_prompts',
    name: 'Guided Journal Prompts',
    description: 'AI-generated reflection prompts',
    tiers: ['seeker', 'adept', 'mystic'],
  },
  journal_insights: {
    id: 'journal_insights',
    name: 'Journal Insights',
    description: 'AI analysis of journal patterns',
    tiers: ['adept', 'mystic'],
  },

  // Social (Future)
  reading_sharing: {
    id: 'reading_sharing',
    name: 'Share Readings',
    description: 'Share reading results with friends',
    tiers: ['seeker', 'adept', 'mystic'],
  },

  // Ads
  ad_free: {
    id: 'ad_free',
    name: 'Ad-Free Experience',
    description: 'No advertisements',
    tiers: ['seeker', 'adept', 'mystic'],
  },
};

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION STATE
// ═══════════════════════════════════════════════════════════════

/**
 * Get current subscription state
 */
export async function getSubscriptionState() {
  try {
    const data = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
    if (data) {
      const sub = JSON.parse(data);

      // Check if subscription is still valid
      if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
        // Subscription expired, revert to free
        sub.tier = 'free';
        sub.status = 'expired';
        await saveSubscriptionState(sub);
      }

      return sub;
    }

    // Initialize as free user
    const initialState = {
      tier: 'free',
      status: 'active',
      startedAt: new Date().toISOString(),
      expiresAt: null,  // Free doesn't expire
      purchaseId: null,
      platform: null,
    };
    await saveSubscriptionState(initialState);
    return initialState;

  } catch (error) {
    console.error('[PremiumGate] Error loading subscription:', error);
    return { tier: 'free', status: 'error' };
  }
}

/**
 * Save subscription state
 */
async function saveSubscriptionState(state) {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[PremiumGate] Error saving subscription:', error);
  }
}

/**
 * Get user's current tier
 */
export async function getUserTier() {
  const sub = await getSubscriptionState();
  return sub.tier || 'free';
}

// ═══════════════════════════════════════════════════════════════
// FEATURE ACCESS CHECKS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if user has access to a feature
 * @param {string} featureId - Feature ID from PREMIUM_FEATURES
 * @returns {Promise<{hasAccess: boolean, reason?: string, upgrade?: string}>}
 */
export async function checkFeatureAccess(featureId) {
  const feature = PREMIUM_FEATURES[featureId];
  if (!feature) {
    console.warn(`[PremiumGate] Unknown feature: ${featureId}`);
    return { hasAccess: false, reason: 'unknown_feature' };
  }

  const userTier = await getUserTier();

  if (feature.tiers.includes(userTier)) {
    return { hasAccess: true };
  }

  // Find the minimum tier that unlocks this feature
  const tierOrder = ['free', 'seeker', 'adept', 'mystic'];
  const minTier = feature.tiers.find(t => tierOrder.indexOf(t) >= 0);
  const tierConfig = USAGE_TIERS[minTier];

  return {
    hasAccess: false,
    reason: 'tier_required',
    requiredTier: minTier,
    tierName: tierConfig?.name || minTier,
    tierPrice: tierConfig?.price,
    upgrade: `Upgrade to ${tierConfig?.name || minTier} to unlock ${feature.name}`,
  };
}

/**
 * Check if user can use Vera chat (considers daily limits + bonus chats)
 * @returns {Promise<{canChat: boolean, source?: string, remaining?: number, ...}>}
 */
export async function checkVeraChatAccess() {
  const userTier = await getUserTier();
  const chatCheck = await canUserChat(userTier);

  // If they have regular chats available
  if (chatCheck.canChat) {
    return {
      canChat: true,
      source: 'subscription',
      ...chatCheck,
    };
  }

  // Free users: check for bonus chats from ads
  if (userTier === 'free') {
    const bonusChats = await getBonusChatsAvailable();
    if (bonusChats > 0) {
      return {
        canChat: true,
        source: 'bonus',
        remaining: bonusChats,
        tier: chatCheck.tier,
      };
    }

    // Can they watch an ad?
    const adCheck = await canWatchAd();
    if (adCheck.canWatch) {
      return {
        canChat: false,
        reason: 'daily_limit',
        canWatchAd: true,
        adsRemaining: adCheck.adsRemaining,
        message: 'Watch a short video for a bonus chat with Vera!',
        resetTime: chatCheck.resetTime,
      };
    }
  }

  // No access - show upgrade prompt
  return {
    canChat: false,
    reason: chatCheck.reason,
    message: chatCheck.message,
    resetTime: chatCheck.resetTime,
    upgrade: userTier === 'free'
      ? 'Upgrade to Seeker for 10 daily chats →'
      : 'Upgrade for more daily chats →',
  };
}

/**
 * Get all features with access status for UI
 */
export async function getAllFeaturesWithAccess() {
  const userTier = await getUserTier();
  const features = {};

  for (const [id, feature] of Object.entries(PREMIUM_FEATURES)) {
    const hasAccess = feature.tiers.includes(userTier);
    features[id] = {
      ...feature,
      hasAccess,
      locked: !hasAccess,
    };
  }

  return features;
}

/**
 * Get features grouped by category for settings/upgrade screen
 */
export async function getFeaturesByCategory() {
  const allFeatures = await getAllFeaturesWithAccess();

  return {
    vera: {
      name: 'Vera AI Coach',
      features: ['vera_chat', 'vera_voice', 'vera_deep_reflection'].map(id => allFeatures[id]),
    },
    readings: {
      name: 'Tarot Readings',
      features: ['single_card', 'three_card', 'celtic_cross', 'unlimited_readings'].map(id => allFeatures[id]),
    },
    tools: {
      name: 'Wellness Tools',
      features: ['cbt_basic', 'cbt_advanced', 'dbt_tools'].map(id => allFeatures[id]),
    },
    cosmetics: {
      name: 'Cosmetics & Decks',
      features: ['basic_decks', 'premium_decks', 'mystic_exclusives'].map(id => allFeatures[id]),
    },
    journal: {
      name: 'Journaling',
      features: ['journal_basic', 'journal_prompts', 'journal_insights'].map(id => allFeatures[id]),
    },
    other: {
      name: 'Other Benefits',
      features: ['ad_free', 'reading_sharing'].map(id => allFeatures[id]),
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION MANAGEMENT (Stub for IAP integration)
// ═══════════════════════════════════════════════════════════════

/**
 * Upgrade subscription (called after successful IAP)
 * In production, this should verify the purchase server-side
 */
export async function upgradeTier(newTier, purchaseDetails = {}) {
  const currentSub = await getSubscriptionState();

  // Calculate expiration (1 month from now for monthly subscription)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const updatedSub = {
    ...currentSub,
    tier: newTier,
    status: 'active',
    startedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    purchaseId: purchaseDetails.purchaseId || null,
    platform: purchaseDetails.platform || null,
    previousTier: currentSub.tier,
  };

  await saveSubscriptionState(updatedSub);

  return updatedSub;
}

/**
 * Downgrade to free (called on subscription cancellation/expiry)
 */
export async function downgradeTier() {
  const currentSub = await getSubscriptionState();

  const updatedSub = {
    ...currentSub,
    tier: 'free',
    status: 'cancelled',
    expiresAt: null,
    previousTier: currentSub.tier,
    cancelledAt: new Date().toISOString(),
  };

  await saveSubscriptionState(updatedSub);

  return updatedSub;
}

/**
 * Get subscription summary for UI
 */
export async function getSubscriptionSummary() {
  const sub = await getSubscriptionState();
  const tierConfig = USAGE_TIERS[sub.tier];
  const usage = await getUsageSummary(sub.tier);

  return {
    tier: sub.tier,
    tierName: tierConfig?.name || 'Free',
    tierPrice: tierConfig?.price || 0,
    status: sub.status,
    expiresAt: sub.expiresAt,
    daysRemaining: sub.expiresAt
      ? Math.max(0, Math.ceil((new Date(sub.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
      : null,
    usage,
    features: tierConfig?.features || {},
  };
}

// ═══════════════════════════════════════════════════════════════
// PAYWALL UI HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get paywall content for a locked feature
 */
export async function getPaywallContent(featureId) {
  const access = await checkFeatureAccess(featureId);

  if (access.hasAccess) {
    return null; // No paywall needed
  }

  const feature = PREMIUM_FEATURES[featureId];
  const tierConfig = USAGE_TIERS[access.requiredTier];

  return {
    title: `Unlock ${feature.name}`,
    description: feature.description,
    requiredTier: access.requiredTier,
    tierName: tierConfig?.name,
    tierPrice: tierConfig?.price,
    benefits: getTierBenefits(access.requiredTier),
    cta: `Start ${tierConfig?.name} - $${tierConfig?.price}/month`,
  };
}

/**
 * Get tier benefits for upgrade screen
 */
export function getTierBenefits(tierName) {
  const benefits = {
    seeker: [
      '10 daily Vera chats (vs 1)',
      'Longer conversations (300 words)',
      'Switch between personas',
      'Celtic Cross readings',
      'DBT tools access',
      'Ad-free experience',
    ],
    adept: [
      '30 daily Vera chats',
      'Deep reflection mode',
      'Voice output',
      'Extended conversations (500 words)',
      'Advanced CBT tools',
      'Premium deck collection',
      'Journal insights',
    ],
    mystic: [
      '100 daily Vera chats',
      'Longest conversations (800 words)',
      'Full context memory',
      'Priority support',
      'Mystic exclusive cosmetics',
      'All features unlocked',
    ],
  };

  return benefits[tierName] || [];
}

/**
 * Compare tiers for upgrade decision
 */
export function compareTiers() {
  return {
    free: {
      name: 'Free',
      price: 0,
      dailyChats: 1,
      maxWords: 125,
      highlights: ['1 daily chat', 'Basic readings', 'Core tools'],
    },
    seeker: {
      name: 'Seeker',
      price: 4.99,
      dailyChats: 10,
      maxWords: 300,
      highlights: ['10 daily chats', 'All spreads', 'DBT tools', 'Ad-free'],
      recommended: false,
    },
    adept: {
      name: 'Adept',
      price: 9.99,
      dailyChats: 30,
      maxWords: 500,
      highlights: ['30 daily chats', 'Voice output', 'Deep reflection', 'Journal insights'],
      recommended: true, // Best value
    },
    mystic: {
      name: 'Mystic',
      price: 14.99,
      dailyChats: 100,
      maxWords: 800,
      highlights: ['100 daily chats', 'Full memory', 'Exclusive cosmetics', 'Priority support'],
      recommended: false,
    },
  };
}

/**
 * Reset subscription for testing
 */
export async function resetSubscriptionForTesting() {
  await AsyncStorage.removeItem(SUBSCRIPTION_KEY);
}
