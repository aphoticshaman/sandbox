/**
 * DEVELOPMENT CONFIGURATION
 * Everything unlocked for testing - NO paywalls
 */

export const APP_CONFIG = {
  version: 'dev',
  name: 'VeilPath - Dev',
  displayName: 'VeilPath DEV',
  slug: 'veilpath-dev',
  bundleId: 'com.veilpath.app.dev',

  features: {
    // Reading limits - NONE in dev
    dailyReadingLimit: null,
    unlimitedReadings: true,

    // Spreads - ALL UNLOCKED
    allSpreadTypes: true, // All spreads available
    availableSpreads: [
      'single_card',
      'three_card',
      'goal_progress',
      'decision_analysis',
      'daily_checkin',
      'clairvoyant_predictive',
      'relationship',
      'celtic_cross',
      'horseshoe'
    ],
    maxCardsPerSpread: 999, // No limit in dev

    // Reading types - ALL UNLOCKED
    allReadingTypes: true,
    availableReadingTypes: [
      'career',
      'romance',
      'wellness',
      'spiritual',
      'decision',
      'general',
      'shadow_work',
      'year_ahead'
    ],

    // Features - ALL UNLOCKED
    themeSelection: true,
    readingHistory: true, // ✅ Enabled
    saveReadings: true, // ✅ Enabled
    exportReadings: true, // ✅ Enabled (copy/share)
    advancedInterpretations: true,
    metaAnalysis: true,
    cardFlip: true,
    quantumSignature: true
  },

  // NO upgrade prompts in dev
  prompts: {
    showUpgradePrompts: false,
    afterCardReading: false,
    beforeSynthesis: false,
  },

  ui: {
    showPremiumBadges: false, // No 🔒 icons in dev
    showUpgradeButton: false, // No upgrade buttons
    upgradePromptFrequency: 'never',
  },

  monetization: {
    upgradePrompt: false, // NO prompts in dev
    inAppPurchaseProductId: 'com.aphoticshaman.veilpath.premium',
    upgradePrice: '$0.00 (DEV MODE)',
    upgradeMessage: 'DEV MODE - All features unlocked',
  },

  branding: {
    tagline: '🛠️ Development Build • All Features Unlocked',
    accent: 'Dev Edition'
  }
};

export default APP_CONFIG;
