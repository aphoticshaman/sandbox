/**
 * AD ASSET MANAGER
 *
 * Manages VeilPath's house ad assets (grok videos, promotional images)
 * and provides the foundation for future ad network integration.
 *
 * Current Phase (Alpha):
 * - House ads only (grok-generated videos with witty overlay text)
 * - Opt-in only, non-interstitial, non-annoying
 * - Goal: Smooth transition when scaling to mixed/network ads
 *
 * Scale Strategy:
 * - 0-1K users: House ads only (100%)
 * - 1K-5K: House ads (70%) + Partner native (30%)
 * - 5K-10K: House (50%) + Partner (30%) + Network (20%)
 * - 10K+: Dynamic mix based on engagement + targeted from anonymized data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AD_TYPES, AD_PLACEMENTS } from './VeilAnalytics';

const AD_PREFS_KEY = '@veilpath_ad_preferences';
const AD_HISTORY_KEY = '@veilpath_ad_history';

// ═══════════════════════════════════════════════════════════════════════════
// HOUSE AD INVENTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * House ad assets - grok videos with witty text overlays
 * These are our own promotional videos to drive subscriptions
 */
const HOUSE_VIDEO_ADS = [
  {
    id: 'house_fae_card_01',
    type: AD_TYPES.HOUSE_VIDEO,
    asset: require('../../../assets/art/ad_assets/grok-video-32f79437-6fec-4cf8-9382-20ee05b80df8.mp4'),
    duration: 15, // seconds
    overlayText: "The cards know your secrets... VeilPath knows them better 🃏",
    ctaText: "Unlock Premium",
    ctaAction: 'premium_upsell',
    targetArchetypes: ['casual_user', 'at_risk'],
    minWatchForCredit: 0.75, // 75% watch = counts as view
  },
  {
    id: 'house_fae_card_02',
    type: AD_TYPES.HOUSE_VIDEO,
    asset: require('../../../assets/art/ad_assets/grok-video-0b413bf1-a9d7-4c4f-913f-93d55ef5942d (1).mp4'),
    duration: 12,
    overlayText: "Free users get readings. Premium users get revelations ✨",
    ctaText: "Try Premium Free",
    ctaAction: 'premium_trial',
    targetArchetypes: ['power_user', 'social_butterfly'],
    minWatchForCredit: 0.75,
  },
  {
    id: 'house_mystical_01',
    type: AD_TYPES.HOUSE_VIDEO,
    asset: require('../../../assets/art/ad_assets/grok-video-fee58432-3aaf-4729-b51d-8e54602b4ad5.mp4'),
    duration: 10,
    overlayText: "Vera's waiting to tell you something important... 🔮",
    ctaText: "Talk to Vera",
    ctaAction: 'open_vera',
    targetArchetypes: ['all'],
    minWatchForCredit: 0.50,
  },
  {
    id: 'house_mystical_02',
    type: AD_TYPES.HOUSE_VIDEO,
    asset: require('../../../assets/art/ad_assets/grok-video-f235b5ae-7a85-4e3e-bd4c-b1ffff6aebb0.mp4'),
    duration: 18,
    overlayText: "Your daily draw is free. Your destiny? Priceless. 💫",
    ctaText: "Get Daily Draw",
    ctaAction: 'daily_reading',
    targetArchetypes: ['at_risk', 'casual_user'],
    minWatchForCredit: 0.75,
  },
  {
    id: 'house_ethereal_01',
    type: AD_TYPES.HOUSE_VIDEO,
    asset: require('../../../assets/art/ad_assets/grok-video-c6d5b995-08c5-4ac1-a26b-e38b17b02053.mp4'),
    duration: 14,
    overlayText: "Some ads sell products. This one sells enlightenment 🌙",
    ctaText: "Enlighten Me",
    ctaAction: 'premium_upsell',
    targetArchetypes: ['power_user'],
    minWatchForCredit: 0.75,
  },
  {
    id: 'house_ethereal_02',
    type: AD_TYPES.HOUSE_VIDEO,
    asset: require('../../../assets/art/ad_assets/grok-video-7351e105-0faf-40fa-aa44-82a28c52dd45.mp4'),
    duration: 16,
    overlayText: "Ad-free tarot? It's like having WiFi in the afterlife 📡",
    ctaText: "Go Ad-Free",
    ctaAction: 'premium_upsell',
    targetArchetypes: ['social_butterfly', 'casual_user'],
    minWatchForCredit: 0.75,
  },
];

/**
 * House static ads - promotional images
 */
const HOUSE_STATIC_ADS = [
  {
    id: 'house_static_fae_01',
    type: AD_TYPES.HOUSE_STATIC,
    asset: require('../../../assets/art/ad_assets/aphoticshaman_A_fae_creature_smugly_holds_up_a_tarot_card._Dr_7942c743-7d1e-4fac-908e-754f46671ae6_2.png'),
    overlayText: "She knows. Do you? 🃏",
    ctaText: "Find Out",
    ctaAction: 'daily_reading',
    targetArchetypes: ['all'],
  },
  {
    id: 'house_static_fae_02',
    type: AD_TYPES.HOUSE_STATIC,
    asset: require('../../../assets/art/ad_assets/aphoticshaman_A_fae_creature_smugly_holds_up_a_tarot_card._Dr_94d90b47-44a2-4ac8-97ce-90ef5fbe237b_2.png'),
    overlayText: "Premium users get the good cards. Just saying. 👀",
    ctaText: "Get Good Cards",
    ctaAction: 'premium_upsell',
    targetArchetypes: ['power_user', 'social_butterfly'],
  },
  {
    id: 'house_static_woman_01',
    type: AD_TYPES.HOUSE_STATIC,
    asset: require('../../../assets/art/ad_assets/aphoticshaman_Open_on_an_ethereal_dark_fae_woman_in_her_late__8ac2e37b-455f-425b-b704-ad8e7b36edcf_3.png'),
    overlayText: "The veil between worlds is thin. Your wallet can be too.",
    ctaText: "See Beyond",
    ctaAction: 'premium_trial',
    targetArchetypes: ['casual_user', 'at_risk'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// AD SELECTION LOGIC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ad Asset Manager
 * Handles ad selection, rotation, and frequency capping
 */
class AdAssetManager {
  constructor() {
    this.initialized = false;
    this.userArchetype = 'casual_user';
    this.isPremium = false;

    // Ad preferences (opt-in state)
    this.preferences = {
      optedIn: true, // Users start opted-in but can opt out
      reducedFrequency: false,
      preferredTypes: ['house_video', 'house_static'],
    };

    // View history for frequency capping
    this.viewHistory = [];
    this.lastAdShown = null;

    // Performance tracking for adaptive selection
    this.adPerformance = {};
  }

  /**
   * Initialize manager
   */
  async initialize(userArchetype = 'casual_user', isPremium = false) {
    if (this.initialized) return;

    try {
      // Load preferences
      const prefsData = await AsyncStorage.getItem(AD_PREFS_KEY);
      if (prefsData) {
        this.preferences = { ...this.preferences, ...JSON.parse(prefsData) };
      }

      // Load history
      const historyData = await AsyncStorage.getItem(AD_HISTORY_KEY);
      if (historyData) {
        const parsed = JSON.parse(historyData);
        this.viewHistory = parsed.viewHistory || [];
        this.adPerformance = parsed.adPerformance || {};
      }

      this.userArchetype = userArchetype;
      this.isPremium = isPremium;
      this.initialized = true;

      console.log('[AdAssetManager] Initialized', { userArchetype, isPremium });
    } catch (error) {
      console.error('[AdAssetManager] Init error:', error);
      this.initialized = true;
    }
  }

  /**
   * Update user context
   */
  updateContext(archetype, isPremium) {
    this.userArchetype = archetype;
    this.isPremium = isPremium;
  }

  /**
   * Check if user should see ads
   */
  shouldShowAds() {
    // Premium users don't see ads
    if (this.isPremium) return false;

    // Respect opt-out
    if (!this.preferences.optedIn) return false;

    return true;
  }

  /**
   * Get an ad for a specific placement
   * @param {string} placement - From AD_PLACEMENTS
   * @returns {object|null} Ad object or null
   */
  getAdForPlacement(placement) {
    if (!this.shouldShowAds()) return null;

    // Check frequency cap
    if (this.isFrequencyCapped()) return null;

    // Get eligible ads based on archetype and placement
    const eligibleAds = this.getEligibleAds(placement);

    if (eligibleAds.length === 0) return null;

    // Select ad using performance-weighted random
    const selectedAd = this.selectAdWithWeighting(eligibleAds);

    // Record selection
    this.recordAdSelection(selectedAd.id, placement);

    return selectedAd;
  }

  /**
   * Get eligible ads for placement and archetype
   */
  getEligibleAds(placement) {
    const allAds = [...HOUSE_VIDEO_ADS, ...HOUSE_STATIC_ADS];

    return allAds.filter(ad => {
      // Check archetype targeting
      if (!ad.targetArchetypes.includes('all') &&
          !ad.targetArchetypes.includes(this.userArchetype)) {
        return false;
      }

      // Check if ad was shown too recently
      if (this.wasShownRecently(ad.id, 3)) { // 3 session cooldown
        return false;
      }

      // Placement-specific filters
      if (placement === AD_PLACEMENTS.VERA_COOLDOWN) {
        // Short ads only for cooldown
        return ad.duration <= 15 || ad.type === AD_TYPES.HOUSE_STATIC;
      }

      if (placement === AD_PLACEMENTS.POST_READING) {
        // Prefer video ads after readings
        return ad.type === AD_TYPES.HOUSE_VIDEO;
      }

      return true;
    });
  }

  /**
   * Select ad with performance-based weighting
   * Better performing ads get shown more
   */
  selectAdWithWeighting(eligibleAds) {
    if (eligibleAds.length === 1) return eligibleAds[0];

    // Calculate weights based on performance
    const weights = eligibleAds.map(ad => {
      const perf = this.adPerformance[ad.id];
      if (!perf || perf.impressions < 3) {
        // New ads get baseline weight
        return { ad, weight: 1.0 };
      }

      // Weight based on completion rate and CTR
      const completionRate = perf.completions / perf.impressions;
      const ctr = perf.clicks / perf.impressions;

      // Formula: base + completion bonus + ctr bonus
      const weight = 0.5 + (completionRate * 0.3) + (ctr * 0.2);

      return { ad, weight };
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { ad, weight } of weights) {
      random -= weight;
      if (random <= 0) return ad;
    }

    return eligibleAds[0];
  }

  /**
   * Check if frequency capped
   */
  isFrequencyCapped() {
    const now = Date.now();
    const recentViews = this.viewHistory.filter(
      v => now - v.timestamp < 300000 // Last 5 minutes
    );

    // Max 2 ads per 5 minutes
    if (recentViews.length >= 2) return true;

    // Reduced frequency mode: max 1 per 10 minutes
    if (this.preferences.reducedFrequency) {
      const veryRecent = this.viewHistory.filter(
        v => now - v.timestamp < 600000
      );
      if (veryRecent.length >= 1) return true;
    }

    return false;
  }

  /**
   * Check if specific ad was shown recently
   */
  wasShownRecently(adId, sessionCooldown = 3) {
    const adViews = this.viewHistory.filter(v => v.adId === adId);
    if (adViews.length === 0) return false;

    // Check if shown in last N sessions worth of views
    const recentViews = this.viewHistory.slice(-sessionCooldown * 3);
    return recentViews.some(v => v.adId === adId);
  }

  /**
   * Record ad selection
   */
  recordAdSelection(adId, placement) {
    this.viewHistory.push({
      adId,
      placement,
      timestamp: Date.now(),
    });

    // Trim history to last 100 views
    if (this.viewHistory.length > 100) {
      this.viewHistory = this.viewHistory.slice(-100);
    }

    this.lastAdShown = adId;
    this.persist();
  }

  /**
   * Record ad engagement (called from VeilAnalytics)
   */
  recordEngagement(adId, engagementType) {
    if (!this.adPerformance[adId]) {
      this.adPerformance[adId] = {
        impressions: 0,
        completions: 0,
        clicks: 0,
        conversions: 0,
      };
    }

    switch (engagementType) {
      case 'impression':
        this.adPerformance[adId].impressions++;
        break;
      case 'completion':
        this.adPerformance[adId].completions++;
        break;
      case 'click':
        this.adPerformance[adId].clicks++;
        break;
      case 'conversion':
        this.adPerformance[adId].conversions++;
        break;
    }

    this.persist();
  }

  /**
   * Set user preference
   */
  setPreference(key, value) {
    this.preferences[key] = value;
    this.persistPreferences();
  }

  /**
   * Opt out of ads
   */
  optOut() {
    this.preferences.optedIn = false;
    this.persistPreferences();
  }

  /**
   * Opt back in
   */
  optIn() {
    this.preferences.optedIn = true;
    this.persistPreferences();
  }

  /**
   * Get all house video ads (for preview/testing)
   */
  getAllHouseVideoAds() {
    return HOUSE_VIDEO_ADS;
  }

  /**
   * Get all house static ads
   */
  getAllHouseStaticAds() {
    return HOUSE_STATIC_ADS;
  }

  /**
   * Get ad performance stats
   */
  getPerformanceStats() {
    const stats = {
      totalAds: HOUSE_VIDEO_ADS.length + HOUSE_STATIC_ADS.length,
      totalImpressions: 0,
      totalCompletions: 0,
      totalClicks: 0,
      totalConversions: 0,
      topPerformers: [],
      lowPerformers: [],
    };

    const perfEntries = Object.entries(this.adPerformance);

    for (const [adId, perf] of perfEntries) {
      stats.totalImpressions += perf.impressions;
      stats.totalCompletions += perf.completions;
      stats.totalClicks += perf.clicks;
      stats.totalConversions += perf.conversions;
    }

    // Calculate rates
    stats.overallCTR = stats.totalImpressions > 0
      ? (stats.totalClicks / stats.totalImpressions * 100).toFixed(2)
      : 0;
    stats.overallCompletionRate = stats.totalImpressions > 0
      ? (stats.totalCompletions / stats.totalImpressions * 100).toFixed(2)
      : 0;

    // Rank ads by performance
    const rankedAds = perfEntries
      .map(([adId, perf]) => ({
        adId,
        score: perf.impressions > 0
          ? (perf.completions / perf.impressions) + (perf.clicks / perf.impressions * 2)
          : 0,
        ...perf,
      }))
      .sort((a, b) => b.score - a.score);

    stats.topPerformers = rankedAds.slice(0, 3);
    stats.lowPerformers = rankedAds.slice(-3).reverse();

    return stats;
  }

  /**
   * Persist ad history
   */
  async persist() {
    try {
      await AsyncStorage.setItem(AD_HISTORY_KEY, JSON.stringify({
        viewHistory: this.viewHistory,
        adPerformance: this.adPerformance,
      }));
    } catch (error) {
      console.error('[AdAssetManager] Persist error:', error);
    }
  }

  /**
   * Persist preferences
   */
  async persistPreferences() {
    try {
      await AsyncStorage.setItem(AD_PREFS_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('[AdAssetManager] Preferences persist error:', error);
    }
  }

  /**
   * Reset manager (for testing)
   */
  async reset() {
    this.viewHistory = [];
    this.adPerformance = {};
    this.preferences = {
      optedIn: true,
      reducedFrequency: false,
      preferredTypes: ['house_video', 'house_static'],
    };

    await AsyncStorage.multiRemove([AD_PREFS_KEY, AD_HISTORY_KEY]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

let instance = null;

/**
 * Get AdAssetManager singleton
 */
export function getAdAssetManager() {
  if (!instance) {
    instance = new AdAssetManager();
  }
  return instance;
}

/**
 * Initialize AdAssetManager
 */
export async function initAdAssetManager(userArchetype, isPremium) {
  const manager = getAdAssetManager();
  await manager.initialize(userArchetype, isPremium);
  return manager;
}

export { HOUSE_VIDEO_ADS, HOUSE_STATIC_ADS };
export default AdAssetManager;
