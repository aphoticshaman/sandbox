/**
 * MICROTRANSACTION PRODUCTS
 * Specific IAP products for RevenueCat
 *
 * Strategy: 70% subscription revenue + 30% microtransaction revenue
 */

export const IAP_PRODUCTS = {
  // ═══════════════════════════════════════════════════════════
  // SUBSCRIPTIONS (Recurring Revenue)
  // ═══════════════════════════════════════════════════════════

  PREMIUM_MONTHLY: {
    id: 'com.veilpath.app.premium.monthly',
    type: 'subscription',
    price: 9.99,
    displayPrice: '$9.99/month',
    benefits: [
      'Unlimited readings',
      'AI interpretations (Claude)',
      'All spread types',
      'Cloud sync',
      'No ads',
      'Priority support',
      '100 Veil Shards welcome bonus'
    ],
    value: 'Most Popular',
    entitlementId: 'pro'
  },

  PREMIUM_ANNUAL: {
    id: 'com.veilpath.app.premium.annual',
    type: 'subscription',
    price: 79.99,
    displayPrice: '$79.99/year',
    savings: '33% savings',
    benefits: [
      'Everything in Monthly',
      'Save $40 per year',
      '500 Veil Shards welcome bonus',
      'Exclusive annual card back'
    ],
    value: 'Best Value',
    entitlementId: 'pro'
  },

  // ═══════════════════════════════════════════════════════════
  // CONSUMABLES (One-time purchases, repeatable)
  // ═══════════════════════════════════════════════════════════

  // Extra Readings (for free users)
  READINGS_PACK_5: {
    id: 'com.veilpath.app.readings.5pack',
    type: 'consumable',
    price: 0.99,
    displayPrice: '$0.99',
    grants: { extraReadings: 5 },
    description: '5 extra readings',
    targetAudience: 'free', // Only show to free users
    conversionHook: 'Hit daily limit',
  },

  READINGS_PACK_15: {
    id: 'com.veilpath.app.readings.15pack',
    type: 'consumable',
    price: 2.49,
    displayPrice: '$2.49',
    grants: { extraReadings: 15 },
    description: '15 extra readings',
    savings: '17% vs 5-pack',
    targetAudience: 'free',
  },

  // ═══════════════════════════════════════════════════════════
  // CURRENCY PACKS (Veil Shards - premium currency)
  // ═══════════════════════════════════════════════════════════

  SHARDS_STARTER: {
    id: 'com.veilpath.app.shards.100',
    type: 'consumable',
    price: 0.99,
    displayPrice: '$0.99',
    grants: { veilShards: 100 },
    perShardCost: 0.0099,
    description: '100 Veil Shards',
    bestFor: 'Small purchases',
  },

  SHARDS_POPULAR: {
    id: 'com.veilpath.app.shards.600',
    type: 'consumable',
    price: 4.99,
    displayPrice: '$4.99',
    grants: { veilShards: 600 },
    perShardCost: 0.0083,
    description: '600 Veil Shards',
    bonus: '+50 bonus shards',
    savings: '17% better value',
    badge: 'Most Popular',
  },

  SHARDS_BEST_VALUE: {
    id: 'com.veilpath.app.shards.1500',
    type: 'consumable',
    price: 9.99,
    displayPrice: '$9.99',
    grants: { veilShards: 1500 },
    perShardCost: 0.0067,
    description: '1500 Veil Shards',
    bonus: '+200 bonus shards',
    savings: '33% better value',
    badge: 'Best Value',
  },

  SHARDS_WHALE: {
    id: 'com.veilpath.app.shards.4000',
    type: 'consumable',
    price: 19.99,
    displayPrice: '$19.99',
    grants: { veilShards: 4000 },
    perShardCost: 0.005,
    description: '4000 Veil Shards',
    bonus: '+800 bonus shards',
    savings: '50% better value',
    badge: 'Ultimate Pack',
  },

  // ═══════════════════════════════════════════════════════════
  // NON-CONSUMABLES (One-time purchases, permanent)
  // ═══════════════════════════════════════════════════════════

  // Spread Unlocks (permanent)
  UNLOCK_THREE_CARD: {
    id: 'com.veilpath.app.unlock.three_card',
    type: 'non_consumable',
    price: 1.99,
    displayPrice: '$1.99',
    grants: { spreadUnlock: 'three_card' },
    description: 'Unlock Three Card Spread forever',
    alternative: 'Or unlock with 1000 Moonlight',
  },

  UNLOCK_FIVE_CARD: {
    id: 'com.veilpath.app.unlock.five_card',
    type: 'non_consumable',
    price: 2.99,
    displayPrice: '$2.99',
    grants: { spreadUnlock: 'five_card' },
    description: 'Unlock Five Card Spread forever',
    alternative: 'Or unlock with 2000 Moonlight',
  },

  UNLOCK_CELTIC_CROSS: {
    id: 'com.veilpath.app.unlock.celtic_cross',
    type: 'non_consumable',
    price: 4.99,
    displayPrice: '$4.99',
    grants: { spreadUnlock: 'celtic_cross' },
    description: 'Unlock Celtic Cross forever',
    exclusive: 'Premium-only spread',
  },

  // Card Back Cosmetics (permanent)
  CARD_BACK_COSMIC: {
    id: 'com.veilpath.app.cardback.cosmic',
    type: 'non_consumable',
    price: 0.99,
    displayPrice: '$0.99',
    grants: { cosmetic: 'card_back_cosmic' },
    description: 'Cosmic Nebula card back',
  },

  CARD_BACK_LUNAR: {
    id: 'com.veilpath.app.cardback.lunar',
    type: 'non_consumable',
    price: 0.99,
    displayPrice: '$0.99',
    grants: { cosmetic: 'card_back_lunar' },
    description: 'Lunar Eclipse card back',
  },

  CARD_BACK_GILDED: {
    id: 'com.veilpath.app.cardback.gilded',
    type: 'non_consumable',
    price: 2.99,
    displayPrice: '$2.99',
    grants: { cosmetic: 'card_back_gilded' },
    description: 'Gilded gold card back',
    rarity: 'rare',
  },

  // Gilded Card Upgrades (permanent, per-card)
  GILDED_FOOL: {
    id: 'com.veilpath.app.gilded.fool',
    type: 'non_consumable',
    price: 1.99,
    displayPrice: '$1.99',
    grants: { cardRarity: { cardId: 0, rarity: 'gilded' } },
    description: 'Gilded The Fool',
    alternative: 'Or unlock with 500 Moonlight',
  },

  // Artifact Card Upgrades (premium currency only)
  ARTIFACT_FOOL: {
    id: 'com.veilpath.app.artifact.fool',
    type: 'non_consumable',
    price: 4.99,
    displayPrice: '$4.99 or 1000 Shards',
    grants: { cardRarity: { cardId: 0, rarity: 'artifact' } },
    description: 'Artifact The Fool (3D animated)',
    veilShardPrice: 1000,
  },

  // ═══════════════════════════════════════════════════════════
  // UTILITY PURCHASES
  // ═══════════════════════════════════════════════════════════

  STREAK_RECOVERY: {
    id: 'com.veilpath.app.utility.streak_recovery',
    type: 'consumable',
    price: 0.99,
    displayPrice: '$0.99 or 50 Shards',
    grants: { streakRecovery: true },
    description: 'Recover your broken streak',
    targetAudience: 'broken_streak',
    veilShardPrice: 50,
  },

  AD_FREE_WEEK: {
    id: 'com.veilpath.app.utility.adfree_week',
    type: 'consumable',
    price: 0.99,
    displayPrice: '$0.99',
    grants: { adFreeWeek: true },
    description: '7 days ad-free',
    targetAudience: 'free',
    alternative: 'Or subscribe for permanent ad-free',
  },
};

// ═══════════════════════════════════════════════════════════
// PRODUCT CATEGORIZATION
// ═══════════════════════════════════════════════════════════

export const PRODUCT_CATEGORIES = {
  subscriptions: [
    IAP_PRODUCTS.PREMIUM_MONTHLY,
    IAP_PRODUCTS.PREMIUM_ANNUAL,
  ],

  consumables: {
    readings: [
      IAP_PRODUCTS.READINGS_PACK_5,
      IAP_PRODUCTS.READINGS_PACK_15,
    ],
    currency: [
      IAP_PRODUCTS.SHARDS_STARTER,
      IAP_PRODUCTS.SHARDS_POPULAR,
      IAP_PRODUCTS.SHARDS_BEST_VALUE,
      IAP_PRODUCTS.SHARDS_WHALE,
    ],
    utility: [
      IAP_PRODUCTS.STREAK_RECOVERY,
      IAP_PRODUCTS.AD_FREE_WEEK,
    ],
  },

  permanentUnlocks: {
    spreads: [
      IAP_PRODUCTS.UNLOCK_THREE_CARD,
      IAP_PRODUCTS.UNLOCK_FIVE_CARD,
      IAP_PRODUCTS.UNLOCK_CELTIC_CROSS,
    ],
    cosmetics: [
      IAP_PRODUCTS.CARD_BACK_COSMIC,
      IAP_PRODUCTS.CARD_BACK_LUNAR,
      IAP_PRODUCTS.CARD_BACK_GILDED,
    ],
    gilded: [
      IAP_PRODUCTS.GILDED_FOOL,
      // TODO: Add all 78 cards
    ],
    artifact: [
      IAP_PRODUCTS.ARTIFACT_FOOL,
      // TODO: Add all 78 cards
    ],
  },
};

// ═══════════════════════════════════════════════════════════
// CONVERSION FUNNELS
// ═══════════════════════════════════════════════════════════

export const CONVERSION_TRIGGERS = {
  // When to show paywall/purchase prompts

  DAILY_LIMIT_HIT: {
    products: ['READINGS_PACK_5', 'PREMIUM_MONTHLY'],
    message: "You've used your 2 free readings today!",
    cta: 'Get 5 more for $0.99 or go Premium for unlimited',
  },

  SPREAD_LOCKED: {
    products: (spreadType) => [`UNLOCK_${spreadType.toUpperCase()}`, 'PREMIUM_MONTHLY'],
    message: (spreadName) => `${spreadName} is locked!`,
    cta: (price) => `Unlock forever for ${price} or go Premium`,
  },

  STREAK_BROKEN: {
    products: ['STREAK_RECOVERY'],
    message: (streak) => `Your ${streak}-day streak is broken!`,
    cta: 'Recover for $0.99 or 50 Shards',
    urgency: '24 hours only',
  },

  LEVEL_UP: {
    products: ['SHARDS_POPULAR'],
    message: (level) => `Level ${level} reached!`,
    cta: 'Celebrate with a bonus currency pack?',
    discount: '20% off for 1 hour',
  },

  FIRST_READING_COMPLETE: {
    products: ['PREMIUM_MONTHLY'],
    message: 'Loved your first reading?',
    cta: 'Get unlimited + AI interpretations for $9.99/mo',
    timing: 'Show 30 seconds after first reading completes',
  },

  CARD_DISCOVERY: {
    products: (cardId) => [`GILDED_${cardId}`, `ARTIFACT_${cardId}`],
    message: (cardName) => `You drew ${cardName}!`,
    cta: 'Make it Gilded or Artifact?',
    timing: 'Show after card flip animation',
  },
};

// ═══════════════════════════════════════════════════════════
// MONETIZATION METRICS
// ═══════════════════════════════════════════════════════════

export const MONETIZATION_TARGETS = {
  // Target metrics for healthy monetization

  conversionRate: {
    freeToPaying: 0.05, // 5% of free users should buy SOMETHING
    freeToSubscriber: 0.02, // 2% of free users become subscribers
    whaleRate: 0.01, // 1% of users spend > $20/mo
  },

  revenuePerUser: {
    ARPU_month1: 0.50, // Average revenue per user in first month
    ARPU_month3: 1.00,
    LTV_90day: 5.00, // Lifetime value after 90 days
  },

  subscriptionHealth: {
    churnRate: 0.15, // 15% monthly churn (target < 20%)
    reactivationRate: 0.10, // 10% of churned users reactivate
  },
};

export default IAP_PRODUCTS;
