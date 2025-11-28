/**
 * Subscriber Battle Pass Quest System
 *
 * Subscribers get:
 * - Upfront shard bonus on first subscription
 * - Monthly shard bonus on renewal
 * - Access to EXCLUSIVE quests that free users can't do
 * - Quest rewards: shards, achievements, rare cosmetics
 *
 * "Pay to win" but they still gotta EARN it through gameplay
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION TIERS & BONUSES
// ═══════════════════════════════════════════════════════════════════════════════

export const SUBSCRIPTION_BONUSES = {
  // First-time subscription welcome bonus
  firstSubscription: {
    shards: 1000,
    achievement: 'supporter_badge',
    title: 'The Supporter',
  },

  // Monthly renewal bonus (every billing cycle)
  monthlyRenewal: {
    shards: 500,
  },

  // Yearly subscription bonus (bigger upfront)
  yearlySubscription: {
    shards: 3000, // ~6 months worth upfront
    achievement: 'annual_patron',
    title: 'The Patron',
    exclusiveCosmetic: 'patron_card_back',
  },

  // Lifetime purchase bonus
  lifetimeSubscription: {
    shards: 10000,
    achievement: 'eternal_supporter',
    title: 'The Eternal',
    exclusiveCosmetic: 'eternal_aura',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBER-EXCLUSIVE QUESTS
// These quests are ONLY visible/completable by active subscribers
// ═══════════════════════════════════════════════════════════════════════════════

export const SUBSCRIBER_QUESTS = {
  // ─────────────────────────────────────────────────────────────────────────────
  // DAILY QUESTS (Reset every 24 hours)
  // ─────────────────────────────────────────────────────────────────────────────
  daily: [
    {
      id: 'daily_reading',
      name: 'Daily Divination',
      description: 'Complete any tarot reading today',
      icon: '🔮',
      type: 'daily',
      requirement: { type: 'readings', count: 1 },
      rewards: { shards: 25 },
      subscriberOnly: true,
    },
    {
      id: 'daily_journal',
      name: 'Mystic Reflection',
      description: 'Write a journal entry today',
      icon: '📓',
      type: 'daily',
      requirement: { type: 'journal', count: 1 },
      rewards: { shards: 30 },
      subscriberOnly: true,
    },
    {
      id: 'daily_community',
      name: 'Community Spirit',
      description: 'Like or reply to a forum post',
      icon: '💬',
      type: 'daily',
      requirement: { type: 'forum_interaction', count: 1 },
      rewards: { shards: 20 },
      subscriberOnly: true,
    },
    {
      id: 'daily_mindfulness',
      name: 'Centered Soul',
      description: 'Complete a mindfulness exercise',
      icon: '🧘',
      type: 'daily',
      requirement: { type: 'mindfulness', count: 1 },
      rewards: { shards: 25 },
      subscriberOnly: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // WEEKLY QUESTS (Reset every Monday)
  // ─────────────────────────────────────────────────────────────────────────────
  weekly: [
    {
      id: 'weekly_readings',
      name: 'Seeker of Truth',
      description: 'Complete 5 tarot readings this week',
      icon: '🎴',
      type: 'weekly',
      requirement: { type: 'readings', count: 5 },
      rewards: { shards: 150 },
      subscriberOnly: true,
    },
    {
      id: 'weekly_journal',
      name: 'Chronicle Keeper',
      description: 'Write 3 journal entries this week',
      icon: '📖',
      type: 'weekly',
      requirement: { type: 'journal', count: 3 },
      rewards: { shards: 125 },
      subscriberOnly: true,
    },
    {
      id: 'weekly_community',
      name: 'Forum Regular',
      description: 'Reply to 3 different forum threads',
      icon: '💭',
      type: 'weekly',
      requirement: { type: 'forum_replies', count: 3, unique: true },
      rewards: { shards: 100 },
      subscriberOnly: true,
    },
    {
      id: 'weekly_streak',
      name: 'Dedicated Practitioner',
      description: 'Maintain a 7-day login streak',
      icon: '🔥',
      type: 'weekly',
      requirement: { type: 'login_streak', count: 7 },
      rewards: { shards: 200 },
      subscriberOnly: true,
    },
    {
      id: 'weekly_therapy_tools',
      name: 'Inner Work',
      description: 'Use CBT or DBT tools 5 times',
      icon: '🧠',
      type: 'weekly',
      requirement: { type: 'therapy_tools', count: 5 },
      rewards: { shards: 150 },
      subscriberOnly: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // MONTHLY QUESTS (Reset on 1st of each month)
  // These give BIGGER rewards including achievements and cosmetics
  // ─────────────────────────────────────────────────────────────────────────────
  monthly: [
    {
      id: 'monthly_journal_master',
      name: 'Journal Master',
      description: 'Write 10 journal entries this month',
      icon: '📚',
      type: 'monthly',
      requirement: { type: 'journal', count: 10 },
      rewards: {
        shards: 500,
        achievement: 'journal_devotee',
      },
      subscriberOnly: true,
    },
    {
      id: 'monthly_reading_adept',
      name: 'Reading Adept',
      description: 'Complete 20 tarot readings this month',
      icon: '🃏',
      type: 'monthly',
      requirement: { type: 'readings', count: 20 },
      rewards: {
        shards: 600,
        achievement: 'tarot_adept',
      },
      subscriberOnly: true,
    },
    {
      id: 'monthly_community_pillar',
      name: 'Community Pillar',
      description: 'Create 2 forum posts and reply to 10 threads',
      icon: '🏛️',
      type: 'monthly',
      requirement: {
        type: 'compound',
        conditions: [
          { type: 'forum_posts', count: 2 },
          { type: 'forum_replies', count: 10 },
        ],
      },
      rewards: {
        shards: 750,
        achievement: 'community_pillar',
        cosmetic: { type: 'title_part', id: 'pillar' },
      },
      subscriberOnly: true,
    },
    {
      id: 'monthly_mindful_master',
      name: 'Mindful Master',
      description: 'Complete 15 mindfulness sessions',
      icon: '🌸',
      type: 'monthly',
      requirement: { type: 'mindfulness', count: 15 },
      rewards: {
        shards: 500,
        achievement: 'mindful_master',
        cosmetic: { type: 'title_part', id: 'mindful' },
      },
      subscriberOnly: true,
    },
    {
      id: 'monthly_all_rounder',
      name: 'Renaissance Soul',
      description: 'Complete at least 1 reading, 1 journal, 1 mindfulness, and 1 forum post',
      icon: '✨',
      type: 'monthly',
      requirement: {
        type: 'compound',
        conditions: [
          { type: 'readings', count: 1 },
          { type: 'journal', count: 1 },
          { type: 'mindfulness', count: 1 },
          { type: 'forum_posts', count: 1 },
        ],
      },
      rewards: {
        shards: 300,
      },
      subscriberOnly: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // SEASONAL QUESTS (Special limited-time quests)
  // ─────────────────────────────────────────────────────────────────────────────
  seasonal: [
    {
      id: 'samhain_seeker',
      name: 'Samhain Seeker',
      description: 'Complete 13 readings during October',
      icon: '🎃',
      type: 'seasonal',
      activeMonths: [9], // October (0-indexed)
      requirement: { type: 'readings', count: 13 },
      rewards: {
        shards: 1000,
        achievement: 'samhain_seeker',
        cosmetic: { type: 'card_back', id: 'samhain_spirits' },
      },
      subscriberOnly: true,
    },
    {
      id: 'winter_solstice',
      name: 'Winter Solstice Ritual',
      description: 'Complete 21 readings during December',
      icon: '❄️',
      type: 'seasonal',
      activeMonths: [11], // December
      requirement: { type: 'readings', count: 21 },
      rewards: {
        shards: 1200,
        achievement: 'winter_ritualist',
        cosmetic: { type: 'card_back', id: 'winter_solstice' },
      },
      subscriberOnly: true,
    },
    {
      id: 'imbolc_awakening',
      name: 'Imbolc Awakening',
      description: 'Write 10 journal entries during February',
      icon: '🕯️',
      type: 'seasonal',
      activeMonths: [1], // February
      requirement: { type: 'journal', count: 10 },
      rewards: {
        shards: 800,
        achievement: 'imbolc_awakened',
        cosmetic: { type: 'title_part', id: 'awakened' },
      },
      subscriberOnly: true,
    },
    {
      id: 'beltane_bloom',
      name: 'Beltane Bloom',
      description: 'Use mindfulness tools 20 times during May',
      icon: '🌺',
      type: 'seasonal',
      activeMonths: [4], // May
      requirement: { type: 'mindfulness', count: 20 },
      rewards: {
        shards: 900,
        achievement: 'beltane_blessed',
        cosmetic: { type: 'flip_animation', id: 'butterflyMetamorphosis' },
      },
      subscriberOnly: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // ONE-TIME ACHIEVEMENT QUESTS
  // These can only be completed once ever (lifetime achievements)
  // ─────────────────────────────────────────────────────────────────────────────
  lifetime: [
    {
      id: 'century_readings',
      name: 'Century Reader',
      description: 'Complete 100 total tarot readings',
      icon: '💯',
      type: 'lifetime',
      requirement: { type: 'readings_total', count: 100 },
      rewards: {
        shards: 2000,
        achievement: 'century_reader',
        cosmetic: { type: 'card_back', id: 'ancient_oracle' },
      },
      subscriberOnly: true,
    },
    {
      id: 'thousand_readings',
      name: 'Master Diviner',
      description: 'Complete 1000 total tarot readings',
      icon: '🏆',
      type: 'lifetime',
      requirement: { type: 'readings_total', count: 1000 },
      rewards: {
        shards: 10000,
        achievement: 'master_diviner',
        cosmetic: { type: 'card_back', id: 'living_mystic' },
        titlePart: { type: 'prefix', id: 'master' },
      },
      subscriberOnly: true,
    },
    {
      id: 'community_leader',
      name: 'Community Leader',
      description: 'Receive 100 likes on your forum posts',
      icon: '👑',
      type: 'lifetime',
      requirement: { type: 'forum_likes_received', count: 100 },
      rewards: {
        shards: 1500,
        achievement: 'community_leader',
        titlePart: { type: 'suffix', id: 'leader' },
      },
      subscriberOnly: true,
    },
    {
      id: 'first_referral',
      name: 'Better Together',
      description: 'Successfully refer someone to VeilPath',
      icon: '🤝',
      type: 'lifetime',
      requirement: { type: 'referrals', count: 1 },
      rewards: {
        shards: 500,
        achievement: 'better_together',
        // Both referrer AND referee get this
      },
      subscriberOnly: false, // Anyone can refer!
    },
    {
      id: 'referral_champion',
      name: 'Referral Champion',
      description: 'Successfully refer 10 people to VeilPath',
      icon: '🌟',
      type: 'lifetime',
      requirement: { type: 'referrals', count: 10 },
      rewards: {
        shards: 5000,
        achievement: 'referral_champion',
        cosmetic: { type: 'card_back', id: 'community_champion' },
        titlePart: { type: 'prefix', id: 'champion' },
      },
      subscriberOnly: false,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUEST HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all active quests for a user
 * @param {boolean} isSubscriber - Whether user has active subscription
 * @returns {Array} Active quests the user can work on
 */
export function getActiveQuests(isSubscriber = false) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const allQuests = [];

  // Add daily quests
  SUBSCRIBER_QUESTS.daily.forEach(quest => {
    if (!quest.subscriberOnly || isSubscriber) {
      allQuests.push({ ...quest, category: 'daily' });
    }
  });

  // Add weekly quests
  SUBSCRIBER_QUESTS.weekly.forEach(quest => {
    if (!quest.subscriberOnly || isSubscriber) {
      allQuests.push({ ...quest, category: 'weekly' });
    }
  });

  // Add monthly quests
  SUBSCRIBER_QUESTS.monthly.forEach(quest => {
    if (!quest.subscriberOnly || isSubscriber) {
      allQuests.push({ ...quest, category: 'monthly' });
    }
  });

  // Add seasonal quests (if in season)
  SUBSCRIBER_QUESTS.seasonal.forEach(quest => {
    if (quest.activeMonths.includes(currentMonth)) {
      if (!quest.subscriberOnly || isSubscriber) {
        allQuests.push({ ...quest, category: 'seasonal' });
      }
    }
  });

  // Add lifetime quests (always available)
  SUBSCRIBER_QUESTS.lifetime.forEach(quest => {
    if (!quest.subscriberOnly || isSubscriber) {
      allQuests.push({ ...quest, category: 'lifetime' });
    }
  });

  return allQuests;
}

/**
 * Get quests that the user is missing out on by not subscribing
 * Shows them what they could earn
 */
export function getSubscriberExclusiveQuests() {
  const exclusives = [];

  Object.values(SUBSCRIBER_QUESTS).forEach(questCategory => {
    questCategory.forEach(quest => {
      if (quest.subscriberOnly) {
        exclusives.push(quest);
      }
    });
  });

  return exclusives;
}

/**
 * Calculate total potential rewards for subscribers this period
 */
export function calculateSubscriberRewardsPotential() {
  let dailyShards = 0;
  let weeklyShards = 0;
  let monthlyShards = 0;

  SUBSCRIBER_QUESTS.daily.forEach(q => {
    dailyShards += q.rewards.shards || 0;
  });

  SUBSCRIBER_QUESTS.weekly.forEach(q => {
    weeklyShards += q.rewards.shards || 0;
  });

  SUBSCRIBER_QUESTS.monthly.forEach(q => {
    monthlyShards += q.rewards.shards || 0;
  });

  return {
    daily: dailyShards,
    weekly: weeklyShards,
    monthly: monthlyShards,
    // Max potential per month (assuming perfect completion)
    maxMonthly: (dailyShards * 30) + (weeklyShards * 4) + monthlyShards,
  };
}

export default {
  SUBSCRIPTION_BONUSES,
  SUBSCRIBER_QUESTS,
  getActiveQuests,
  getSubscriberExclusiveQuests,
  calculateSubscriberRewardsPotential,
};
