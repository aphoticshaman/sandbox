/**
 * FEATURE GATE
 * Controls access to premium features based on subscription status
 *
 * 2-Tier Model:
 * - FREE: Templates only, 2 readings/day, no AI
 * - PREMIUM: Everything unlocked, $9.99/mo
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Import config - will be swapped during build
// import { APP_CONFIG } from '../config/config.dev'; // DEV MODE: All features unlocked for testing
import { APP_CONFIG } from '../config/config.free'; // Free build
// import { APP_CONFIG } from '../config/config.premium'; // Premium build

// Debug logging

const STORAGE_KEYS = {
  LAST_READING_DATE: '@last_reading_date',
  READING_COUNT_TODAY: '@reading_count_today'
};

/**
 * Feature Gate - Controls what users can access
 */
export class FeatureGate {
  static _override = null; // Cache for premium override
  static _initialized = false; // Track if cache is loaded

  // Initialize cache from AsyncStorage (call on app start)
  static async init() {
    if (this._initialized) return;
    try {
      const override = await AsyncStorage.getItem('@veilpath_premium_override');
      this._override = override === 'lightworker';
      this._initialized = true;
    } catch (error) {
      this._override = false;
      this._initialized = true;
    }
  }

  // Check for premium override (synchronous - uses cache)
  static _checkOverride() {
    if (!this._initialized) {
      console.warn('[FeatureGate] Not initialized! Call FeatureGate.init() first');
      return false;
    }
    return this._override || false;
  }

  // Update the override cache (called when easter egg toggles premium)
  static setOverride(value) {
    this._override = value;
  }

  // Clear the override cache (called when easter egg toggles premium)
  static invalidateCache() {
    this._override = null;
    this._initialized = false;
  }

  // DEV UTILITY: Clear premium override (for testing free mode)
  static async clearPremiumOverride() {
    try {
      await AsyncStorage.removeItem('@veilpath_premium_override');
      this._override = null;
      return true;
    } catch (error) {
      console.error('[FeatureGate] Failed to clear premium override:', error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // READING LIMITS
  // ═══════════════════════════════════════════════════════════

  static async canDrawReading() {
    // Premium: always allowed
    if (APP_CONFIG.limits?.unlimitedReadings) {
      return { allowed: true, reason: 'unlimited' };
    }

    // Free: check daily limit
    const limit = APP_CONFIG.limits?.dailyReadingLimit || 2;
    const { count, lastDate } = await this.getTodayReadingCount();

    const today = this.getDateString(new Date());
    const isToday = lastDate === today;

    if (!isToday || count < limit) {
      return { allowed: true, reason: 'within_limit', remaining: isToday ? limit - count : limit };
    }

    const nextReading = this.getNextReadingTime();
    return {
      allowed: false,
      reason: 'limit_reached',
      nextReading,
      hoursUntil: this.getHoursUntil(nextReading)
    };
  }

  static async recordReading() {
    if (APP_CONFIG.limits?.unlimitedReadings) return; // Premium doesn't track

    const today = this.getDateString(new Date());
    const { count, lastDate } = await this.getTodayReadingCount();

    const newCount = (lastDate === today) ? count + 1 : 1;

    await AsyncStorage.setItem(STORAGE_KEYS.LAST_READING_DATE, today);
    await AsyncStorage.setItem(STORAGE_KEYS.READING_COUNT_TODAY, newCount.toString());
  }

  static async getTodayReadingCount() {
    try {
      const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_READING_DATE);
      const count = await AsyncStorage.getItem(STORAGE_KEYS.READING_COUNT_TODAY);

      return {
        lastDate: lastDate || '',
        count: count ? parseInt(count) : 0
      };
    } catch (error) {
      console.error('Error getting reading count:', error);
      return { lastDate: '', count: 0 };
    }
  }

  static getNextReadingTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  static getHoursUntil(futureDate) {
    const now = new Date();
    const diff = futureDate - now;
    return Math.ceil(diff / (1000 * 60 * 60));
  }

  static getDateString(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  // ═══════════════════════════════════════════════════════════
  // SPREAD ACCESS
  // ═══════════════════════════════════════════════════════════

  static isSpreadAvailable(spreadType) {
    const override = this._checkOverride();
    if (override || APP_CONFIG.spreads?.allSpreadTypes) return true;
    return (APP_CONFIG.spreads?.availableSpreads || []).includes(spreadType);
  }

  static getAvailableSpreads() {
    return APP_CONFIG.spreads?.availableSpreads || [];
  }

  static getLockedSpreads() {
    const all = [
      'single_card', 'three_card', 'goal_progress', 'decision_analysis',
      'daily_checkin', 'clairvoyant_predictive', 'relationship',
      'celtic_cross', 'horseshoe'
    ];
    return all.filter(s => !this.isSpreadAvailable(s));
  }

  // ═══════════════════════════════════════════════════════════
  // READING TYPE ACCESS
  // ═══════════════════════════════════════════════════════════

  static isReadingTypeAvailable(readingType) {
    const override = this._checkOverride();
    if (override || APP_CONFIG.readingTypes?.allReadingTypes) return true;
    return (APP_CONFIG.readingTypes?.availableReadingTypes || []).includes(readingType);
  }

  static getAvailableReadingTypes() {
    return APP_CONFIG.readingTypes?.availableReadingTypes || [];
  }

  static getLockedReadingTypes() {
    const all = [
      'career', 'romance', 'wellness', 'spiritual',
      'decision', 'general', 'shadow_work', 'year_ahead'
    ];
    return all.filter(rt => !this.isReadingTypeAvailable(rt));
  }

  // ═══════════════════════════════════════════════════════════
  // FEATURE ACCESS
  // ═══════════════════════════════════════════════════════════

  static canAccessReadingHistory() {
    const override = this._checkOverride();
    return override || APP_CONFIG.features.readingHistory;
  }

  static canExportReading() {
    const override = this._checkOverride();
    return override || APP_CONFIG.features.exportReadings;
  }

  static canShareReading() {
    const override = this._checkOverride();
    return override || APP_CONFIG.features.exportReadings; // Same as export
  }

  static canSaveReading() {
    const override = this._checkOverride();
    return override || APP_CONFIG.features.saveReadings;
  }

  static hasAdvancedInterpretations() {
    return APP_CONFIG.features.advancedInterpretations;
  }

  static hasMetaAnalysis() {
    return APP_CONFIG.features.metaAnalysis;
  }

  static canSelectThemes() {
    return APP_CONFIG.features.themeSelection;
  }

  static canFlipCards() {
    return APP_CONFIG.features.cardFlip;
  }

  // ═══════════════════════════════════════════════════════════
  // AI & CLOUD FEATURES
  // ═══════════════════════════════════════════════════════════

  static hasAIInterpretations() {
    const override = this._checkOverride();
    return override || APP_CONFIG.features.cardInterpretations === 'ai';
  }

  static canUseSynthesis() {
    const override = this._checkOverride();
    return override || APP_CONFIG.features.synthesis;
  }

  static canUseAIInsights() {
    const override = this._checkOverride();
    return override || APP_CONFIG.features.aiInsights;
  }

  static getInterpretationType() {
    const override = this._checkOverride();
    return override ? 'ai' : APP_CONFIG.features.cardInterpretations;
  }

  // ═══════════════════════════════════════════════════════════
  // ORACLE CHAT
  // ═══════════════════════════════════════════════════════════

  static canUseVeraChat() {
    const override = this._checkOverride();
    return override || APP_CONFIG.veraChat?.enabled;
  }

  static getVeraChatConfig() {
    return APP_CONFIG.veraChat || {
      enabled: false,
      chatsPerDay: 0,
      messagesPerChat: 0,
      personalities: []
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SUBSCRIPTION & TIER INFO
  // ═══════════════════════════════════════════════════════════

  static getTier() {
    const override = this._checkOverride();
    return override ? 'premium' : (APP_CONFIG.tier || 'free');
  }

  static getSubscriptionProducts() {
    return APP_CONFIG.monetization?.products || {};
  }

  static getDailyLimits() {
    return APP_CONFIG.limits || {
      dailyReadingLimit: 2,
      unlimitedReadings: false,
      dailyTokenBudget: 0
    };
  }

  // ═══════════════════════════════════════════════════════════
  // UPGRADE PROMPTS
  // ═══════════════════════════════════════════════════════════

  static shouldShowUpgradePrompt() {
    return APP_CONFIG.monetization.upgradePrompt;
  }

  static getUpgradeUrl() {
    return APP_CONFIG.monetization.upgradeUrl;
  }

  static getUpgradePrice() {
    return APP_CONFIG.monetization.upgradePrice;
  }

  static getUpgradeMessage() {
    return APP_CONFIG.monetization.upgradeMessage;
  }

  static showPremiumBadges() {
    return APP_CONFIG.ui.showPremiumBadges;
  }

  static showUpgradeButton() {
    return APP_CONFIG.ui.showUpgradeButton;
  }

  // ═══════════════════════════════════════════════════════════
  // APP INFO
  // ═══════════════════════════════════════════════════════════

  static getAppVersion() {
    return APP_CONFIG.version;
  }

  static isPremium() {
    const override = this._checkOverride();
    return override || APP_CONFIG.version === 'premium';
  }

  static isFree() {
    const override = this._checkOverride();
    return !override && APP_CONFIG.version === 'free';
  }

  static getAppName() {
    return APP_CONFIG.displayName;
  }

  static getTagline() {
    return APP_CONFIG.branding.tagline;
  }

  // ═══════════════════════════════════════════════════════════
  // FULL FEATURE LIST (for upgrade prompt)
  // ═══════════════════════════════════════════════════════════

  static getPremiumFeatures() {
    return [
      'Unlimited daily readings',
      'AI-powered interpretations',
      'Vera chat with Luna & Sol',
      'Reading synthesis & patterns',
      'All 11 spread types',
      'All 10 reading types',
      'Save & export readings',
      'MBTI & astrology integration',
      'Achievement system',
      '$9.99/mo or $79.99/yr (33% off)'
    ];
  }

  static getFreeFeatures() {
    return [
      '2 readings per day',
      'Template-based interpretations',
      'Single card & 3-card spreads',
      'General & daily readings',
      'Quantum randomness'
    ];
  }
}

export default FeatureGate;
