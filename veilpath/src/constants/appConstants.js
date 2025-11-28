/**
 * App Constants
 * Centralized branding and configuration to make future rebranding easy
 *
 * To rebrand: Just update these constants and all references will update automatically
 */

export const APP_BRANDING = {
  // Core Brand Identity
  NAME: 'VeilPath',
  NAME_SHORT: 'VeilPath',
  TAGLINE: 'Lift the veil on your inner journey',
  DESCRIPTION: 'Evidence-based mental wellness through reflective practice and tarot wisdom',

  // Alternative descriptions for different contexts
  DESCRIPTION_SHORT: 'Mental wellness app combining CBT/DBT with tarot guidance',
  DESCRIPTION_LONG: 'VeilPath combines evidence-based therapy techniques (CBT, DBT, Mindfulness) with mystical tarot guidance and reflective journaling to create a guided journey of self-discovery.',

  // App Store / Marketing
  APP_STORE_SUBTITLE: 'Mental Wellness & Tarot Guidance',
  CATEGORY_PRIMARY: 'Health & Fitness',
  CATEGORY_SECONDARY: 'Lifestyle',

  // Legal
  COMPANY_NAME: 'VeilPath, Inc.',
  COPYRIGHT: `© ${new Date().getFullYear()} VeilPath, Inc.`,

  // URLs (update when domain is live)
  WEBSITE: 'https://veilpath.app',
  SUPPORT_EMAIL: 'support@veilpath.app',
  PRIVACY_URL: 'https://veilpath.app/privacy',
  TERMS_URL: 'https://veilpath.app/terms',
  SUPPORT_URL: 'https://veilpath.app/support',

  // Social Media (update when created)
  SOCIAL: {
    instagram: '@veilpathapp',
    twitter: '@veilpathapp',
    facebook: 'veilpathapp',
  },

  // App IDs (for deep linking, analytics, etc.)
  BUNDLE_ID_IOS: 'com.veilpath.app',
  PACKAGE_NAME_ANDROID: 'com.veilpath.app',

  // Version
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
};

export const FEATURE_FLAGS = {
  // Feature toggles for gradual rollout
  ENABLE_AI_INTERPRETATIONS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DATA_EXPORT: true,
  ENABLE_SKILL_TREES: true,
  ENABLE_ACHIEVEMENTS: true,
  ENABLE_SOCIAL_SHARING: false, // Future feature
  ENABLE_COMMUNITY: false, // Future feature
  ENABLE_PREMIUM: false, // Set to true when IAP implemented
};

export const ANALYTICS_CONFIG = {
  // Analytics provider settings
  PROVIDER: 'firebase', // 'firebase', 'mixpanel', or 'both'

  // Event names (standardized)
  EVENTS: {
    // Onboarding
    ONBOARDING_STARTED: 'onboarding_started',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    ONBOARDING_SKIPPED: 'onboarding_skipped',

    // Readings
    READING_STARTED: 'reading_started',
    READING_COMPLETED: 'reading_completed',
    READING_SAVED: 'reading_saved',
    AI_INTERPRETATION_REQUESTED: 'ai_interpretation_requested',

    // Journal
    JOURNAL_ENTRY_CREATED: 'journal_entry_created',
    JOURNAL_ENTRY_UPDATED: 'journal_entry_updated',
    JOURNAL_CBT_WORK: 'journal_cbt_work',
    JOURNAL_DBT_WORK: 'journal_dbt_work',

    // Mindfulness
    MINDFULNESS_STARTED: 'mindfulness_started',
    MINDFULNESS_COMPLETED: 'mindfulness_completed',

    // Gamification
    LEVEL_UP: 'level_up',
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
    SKILL_NODE_UNLOCKED: 'skill_node_unlocked',

    // Settings
    DATA_EXPORTED: 'data_exported',
    NOTIFICATIONS_ENABLED: 'notifications_enabled',

    // Errors
    ERROR_OCCURRED: 'error_occurred',
    API_ERROR: 'api_error',
  },
};

export const STORAGE_KEYS = {
  // AsyncStorage keys
  USER: '@veilpath_user',
  READINGS: '@veilpath_readings',
  JOURNAL: '@veilpath_journal',
  SETTINGS: '@veilpath_settings',
  ONBOARDING: '@veilpath_onboarding',
};

export const API_CONFIG = {
  // API endpoints and configuration
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
  CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
  CLAUDE_MAX_TOKENS: 1024,
  CLAUDE_TIMEOUT: 30000, // 30 seconds
};

export const APP_CONFIG = {
  // General app configuration
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LANGUAGES: ['en'], // Future: ['en', 'es', 'fr', 'de']

  // Performance
  PERFORMANCE_TARGETS: {
    SCREEN_LOAD_MS: 100,
    ANIMATION_FPS: 60,
    MEMORY_BASELINE_MB: 50,
    MEMORY_PEAK_MB: 150,
  },

  // Gamification
  XP_MULTIPLIERS: {
    FIRST_OF_DAY: 2.0,
    CONTAINS_CBT: 1.5,
    CONTAINS_DBT: 1.5,
    DEPTH: 1.3,
    LONG_ENTRY: 1.2, // 250+ words
  },

  XP_REWARDS: {
    SINGLE_CARD_READING: 10,
    THREE_CARD_READING: 20,
    CELTIC_CROSS_READING: 100,
    JOURNAL_ENTRY_BASE: 15,
    MINDFULNESS_SESSION_PER_MINUTE: 2,
    ACHIEVEMENT_BASE: 25,
  },
};

// Export default for easier importing
export default {
  APP_BRANDING,
  FEATURE_FLAGS,
  ANALYTICS_CONFIG,
  STORAGE_KEYS,
  API_CONFIG,
  APP_CONFIG,
};
