/**
 * FREE TIER CONFIGURATION
 * VeilPath - Limited free tier to drive premium conversion
 *
 * 2-Tier Model:
 * - FREE: Templates only, 2 readings/day, no AI
 * - PREMIUM: Everything unlocked, $9.99/mo
 */

export const APP_CONFIG = {
  version: 'free',
  tier: 'free',
  name: 'VeilPath',
  displayName: 'VeilPath',
  slug: 'veilpath',
  bundleId: 'com.aphoticshaman.veilpath',

  // ═══════════════════════════════════════════════════════════
  // READING LIMITS
  // ═══════════════════════════════════════════════════════════
  limits: {
    dailyReadingLimit: 2,
    unlimitedReadings: false,

    // No cloud LLM tokens for free
    dailyTokenBudget: 0,
    maxTokensPerReading: 0,
    tokensPerMinute: 0,
    requestsPerMinute: 0,
  },

  // ═══════════════════════════════════════════════════════════
  // ORACLE CHAT - BLOCKED
  // ═══════════════════════════════════════════════════════════
  veraChat: {
    enabled: false,
    chatsPerDay: 0,
    messagesPerChat: 0,
    tokensPerMessage: 0,
    historyRetention: 0,
    personalities: [],
  },

  // ═══════════════════════════════════════════════════════════
  // SPREADS & READING TYPES
  // ═══════════════════════════════════════════════════════════
  spreads: {
    allSpreadTypes: false,
    availableSpreads: ['single_card', 'three_card'],
    maxCardsPerSpread: 3,
  },

  readingTypes: {
    allReadingTypes: false,
    availableReadingTypes: ['general', 'daily'],
  },

  // ═══════════════════════════════════════════════════════════
  // FEATURES - SEVERELY RESTRICTED
  // ═══════════════════════════════════════════════════════════
  features: {
    // Core features
    cardInterpretations: 'template', // Template only, no AI
    synthesis: false,
    quantumRNG: true,

    // AI features - ALL BLOCKED
    aiInsights: false,
    patternDetection: false,
    themeTracking: false,
    archetypeAnalysis: false,

    // History & data - ALL BLOCKED
    readingHistory: false,
    saveReadings: false,
    exportReadings: false,
    shareReadings: false,
    stats: false,

    // Achievements - BLOCKED
    earnAchievements: false,
    viewAchievements: false,
    achievementBadges: false,
    leaderboards: false,

    // Personalization - BLOCKED
    mbtiIntegration: false,
    astrologyIntegration: false,
    customSpreads: false,

    // 3D Navigator - BLOCKED
    navigator3D: false,
    personalSpace: false,
    objectCustomization: false,

    // Basic UI allowed
    deckViewer: true,
    cardFlip: true,
    themeSelection: true,
  },

  // ═══════════════════════════════════════════════════════════
  // UPGRADE PROMPTS
  // ═══════════════════════════════════════════════════════════
  prompts: {
    showUpgradePrompts: true,
    afterCardReading: true,
    beforeSynthesis: true,
    atLimit: true,
    frequency: 'moderate',
  },

  // ═══════════════════════════════════════════════════════════
  // UI
  // ═══════════════════════════════════════════════════════════
  ui: {
    showPremiumBadges: true,
    showUpgradeButton: true,
    showTokenCounter: false,
    showLimitWarnings: true,
  },

  // ═══════════════════════════════════════════════════════════
  // MONETIZATION - SIMPLE 2-TIER
  // ═══════════════════════════════════════════════════════════
  monetization: {
    model: 'subscription',
    products: {
      premiumMonthly: {
        id: 'com.aphoticshaman.veilpath.premium.monthly',
        price: '$9.99',
        period: 'monthly',
      },
      premiumAnnual: {
        id: 'com.aphoticshaman.veilpath.premium.annual',
        price: '$79.99',
        period: 'annual',
        savings: '33%',
      },
    },
    upgradeMessage: 'Unlock AI-powered readings, Vera chat, and unlimited access!',
  },

  // ═══════════════════════════════════════════════════════════
  // BRANDING
  // ═══════════════════════════════════════════════════════════
  branding: {
    tagline: '2 Free Readings Daily',
    accent: 'Free',
  },

  // ═══════════════════════════════════════════════════════════
  // RATE LIMITING
  // ═══════════════════════════════════════════════════════════
  rateLimit: {
    requestsPerMinute: 2,
    burstAllowance: 1,
    cooldownSeconds: 30,
  },
};

export default APP_CONFIG;
