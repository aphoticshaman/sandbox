/**
 * PREMIUM TIER CONFIGURATION
 * VeilPath Premium - Everything unlocked
 *
 * 2-Tier Model:
 * - FREE: Templates only, 2 readings/day, no AI
 * - PREMIUM: Everything unlocked, $9.99/mo ($79.99/yr)
 */

export const APP_CONFIG = {
  version: 'premium',
  tier: 'premium',
  name: 'VeilPath Premium',
  displayName: 'VeilPath Premium',
  slug: 'veilpath-premium',
  bundleId: 'com.aphoticshaman.veilpath.premium',

  // ═══════════════════════════════════════════════════════════
  // READING LIMITS - UNLIMITED
  // ═══════════════════════════════════════════════════════════
  limits: {
    dailyReadingLimit: null, // Unlimited
    unlimitedReadings: true,

    // Generous cloud LLM tokens
    dailyTokenBudget: 50000,
    maxTokensPerReading: 2000,
    tokensPerMinute: 1000,
    requestsPerMinute: 30,
  },

  // ═══════════════════════════════════════════════════════════
  // ORACLE CHAT - FULLY ENABLED
  // ═══════════════════════════════════════════════════════════
  veraChat: {
    enabled: true,
    chatsPerDay: null, // Unlimited
    messagesPerChat: 100,
    tokensPerMessage: 500,
    historyRetention: 30, // days
    personalities: ['luna', 'sol', 'both'],
  },

  // ═══════════════════════════════════════════════════════════
  // SPREADS & READING TYPES - ALL AVAILABLE
  // ═══════════════════════════════════════════════════════════
  spreads: {
    allSpreadTypes: true,
    availableSpreads: [
      'single_card',
      'three_card',
      'goal_progress',
      'decision_analysis',
      'daily_checkin',
      'clairvoyant_predictive',
      'relationship',
      'celtic_cross',
      'horseshoe',
      'year_ahead',
      'shadow_work'
    ],
    maxCardsPerSpread: null, // No limit
  },

  readingTypes: {
    allReadingTypes: true,
    availableReadingTypes: [
      'general',
      'daily',
      'career',
      'romance',
      'wellness',
      'spiritual',
      'decision',
      'shadow_work',
      'year_ahead',
      'relationship'
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FEATURES - ALL ENABLED
  // ═══════════════════════════════════════════════════════════
  features: {
    // Core features
    cardInterpretations: 'ai', // Full AI interpretations
    synthesis: true,
    quantumRNG: true,

    // AI features - ALL ENABLED
    aiInsights: true,
    patternDetection: true,
    themeTracking: true,
    archetypeAnalysis: true,

    // History & data - ALL ENABLED
    readingHistory: true,
    saveReadings: true,
    exportReadings: true,
    shareReadings: true,
    stats: true,

    // Achievements - ALL ENABLED
    earnAchievements: true,
    viewAchievements: true,
    achievementBadges: true,
    leaderboards: true,

    // Personalization - ALL ENABLED
    mbtiIntegration: true,
    astrologyIntegration: true,
    customSpreads: true,

    // 3D Navigator - ALL ENABLED
    navigator3D: true,
    personalSpace: true,
    objectCustomization: true,

    // UI
    deckViewer: true,
    cardFlip: true,
    themeSelection: true,
  },

  // ═══════════════════════════════════════════════════════════
  // UPGRADE PROMPTS - DISABLED
  // ═══════════════════════════════════════════════════════════
  prompts: {
    showUpgradePrompts: false,
    afterCardReading: false,
    beforeSynthesis: false,
    atLimit: false,
    frequency: 'never',
  },

  // ═══════════════════════════════════════════════════════════
  // UI
  // ═══════════════════════════════════════════════════════════
  ui: {
    showPremiumBadges: false, // Everything unlocked
    showUpgradeButton: false,
    showTokenCounter: true,
    showLimitWarnings: false,
  },

  // ═══════════════════════════════════════════════════════════
  // MONETIZATION - ALREADY SUBSCRIBED
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
    upgradeMessage: null, // Already premium
  },

  // ═══════════════════════════════════════════════════════════
  // BRANDING
  // ═══════════════════════════════════════════════════════════
  branding: {
    tagline: 'Unlimited AI-Powered Readings',
    accent: 'Premium',
  },

  // ═══════════════════════════════════════════════════════════
  // RATE LIMITING - GENEROUS
  // ═══════════════════════════════════════════════════════════
  rateLimit: {
    requestsPerMinute: 30,
    burstAllowance: 10,
    cooldownSeconds: 5,
  },
};

export default APP_CONFIG;
