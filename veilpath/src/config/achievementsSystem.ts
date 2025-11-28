/**
 * ACHIEVEMENTS SYSTEM
 *
 * Achievements that:
 * - Unlock cosmetics users are PROUD of
 * - Reward dedication and mastery
 * - Create aspirational goals
 * - Build on each other (not isolated rewards)
 *
 * Categories:
 * 1. Journey - Progress through the app
 * 2. Mastery - Demonstrate skill and knowledge
 * 3. Dedication - Long-term commitment
 * 4. Collection - Gathering and completing sets
 * 5. Social - Community engagement
 * 6. Discovery - Finding hidden content
 * 7. Seasonal - Time-limited achievements
 */

import { CosmeticCategory, Rarity } from './cosmeticsTypes';

export type AchievementCategory =
  | 'journey'
  | 'mastery'
  | 'dedication'
  | 'collection'
  | 'social'
  | 'discovery'
  | 'seasonal';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  hidden: boolean; // Show before unlocking?
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  prerequisiteIds?: string[]; // Must unlock these first
  chainId?: string; // Part of achievement chain
  lore?: string; // Mystical flavor text
}

export interface AchievementRequirement {
  type: AchievementRequirementType;
  value: number;
  target?: string; // Specific target (card id, collection id, etc.)
}

export type AchievementRequirementType =
  | 'readings_total'
  | 'readings_spread' // Specific spread type
  | 'cards_seen' // Unique cards encountered
  | 'cards_reversed' // Reversed cards seen
  | 'journal_entries'
  | 'streak_current'
  | 'streak_max'
  | 'level_reached'
  | 'xp_earned'
  | 'collection_owned' // Items in a collection
  | 'collection_complete'
  | 'cosmetics_owned'
  | 'cosmetics_evolved'
  | 'quests_completed'
  | 'quests_daily_streak'
  | 'coins_earned'
  | 'coins_spent'
  | 'shards_earned'
  | 'friends_invited'
  | 'readings_shared'
  | 'profile_viewed'
  | 'time_in_app' // Minutes
  | 'vera_conversations'
  | 'mindfulness_sessions'
  | 'specific_card' // Drew a specific card
  | 'card_suit_mastery' // All cards of a suit
  | 'major_arcana_count'
  | 'login_days'
  | 'account_age'; // Days since signup

export interface AchievementReward {
  type: AchievementRewardType;
  value: string | number;
  rarity?: Rarity;
}

export type AchievementRewardType =
  | 'cosmetic'
  | 'title'
  | 'coins'
  | 'shards'
  | 'xp'
  | 'showcase_slot'
  | 'prestige_badge'
  | 'collection_bonus';

// Tier configuration
export const ACHIEVEMENT_TIER_CONFIG: Record<AchievementTier, {
  color: string;
  xpBonus: number;
  pointValue: number;
}> = {
  bronze: { color: '#CD7F32', xpBonus: 25, pointValue: 5 },
  silver: { color: '#C0C0C0', xpBonus: 50, pointValue: 15 },
  gold: { color: '#FFD700', xpBonus: 100, pointValue: 30 },
  platinum: { color: '#E5E4E2', xpBonus: 250, pointValue: 75 },
  diamond: { color: '#B9F2FF', xpBonus: 500, pointValue: 150 },
};

// =============================================================================
// ACHIEVEMENT DEFINITIONS
// =============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  // =========================================
  // JOURNEY - First steps and progress
  // =========================================
  {
    id: 'journey_first_reading',
    name: 'The Seeker Awakens',
    description: 'Complete your first tarot reading',
    category: 'journey',
    tier: 'bronze',
    hidden: false,
    requirements: [{ type: 'readings_total', value: 1 }],
    rewards: [
      { type: 'title', value: 'Seeker' },
      { type: 'xp', value: 50 },
      { type: 'coins', value: 100 },
    ],
    lore: 'Every journey begins with a single step. You have taken yours.',
  },
  {
    id: 'journey_10_readings',
    name: 'Curious Mind',
    description: 'Complete 10 tarot readings',
    category: 'journey',
    tier: 'bronze',
    hidden: false,
    requirements: [{ type: 'readings_total', value: 10 }],
    rewards: [
      { type: 'coins', value: 200 },
      { type: 'xp', value: 100 },
    ],
    prerequisiteIds: ['journey_first_reading'],
    chainId: 'journey_readings',
  },
  {
    id: 'journey_50_readings',
    name: 'Dedicated Student',
    description: 'Complete 50 tarot readings',
    category: 'journey',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'readings_total', value: 50 }],
    rewards: [
      { type: 'title', value: 'Student of the Cards' },
      { type: 'cosmetic', value: 'back_apprentice', rarity: 'uncommon' },
      { type: 'coins', value: 500 },
    ],
    prerequisiteIds: ['journey_10_readings'],
    chainId: 'journey_readings',
    lore: 'The cards begin to feel familiar in your hands.',
  },
  {
    id: 'journey_100_readings',
    name: 'Practiced Reader',
    description: 'Complete 100 tarot readings',
    category: 'journey',
    tier: 'gold',
    hidden: false,
    requirements: [{ type: 'readings_total', value: 100 }],
    rewards: [
      { type: 'title', value: 'Practiced Reader' },
      { type: 'cosmetic', value: 'frame_golden_insight', rarity: 'rare' },
      { type: 'coins', value: 1000 },
      { type: 'shards', value: 50 },
    ],
    prerequisiteIds: ['journey_50_readings'],
    chainId: 'journey_readings',
    lore: 'Your intuition strengthens with each reading.',
  },
  {
    id: 'journey_500_readings',
    name: 'Seasoned Oracle',
    description: 'Complete 500 tarot readings',
    category: 'journey',
    tier: 'platinum',
    hidden: false,
    requirements: [{ type: 'readings_total', value: 500 }],
    rewards: [
      { type: 'title', value: 'Seasoned Oracle' },
      { type: 'cosmetic', value: 'back_oracle_legacy', rarity: 'epic' },
      { type: 'cosmetic', value: 'border_golden_reader', rarity: 'epic' },
      { type: 'shards', value: 200 },
    ],
    prerequisiteIds: ['journey_100_readings'],
    chainId: 'journey_readings',
    lore: 'The veil between worlds grows thin in your presence.',
  },
  {
    id: 'journey_1000_readings',
    name: 'Master of the Veil',
    description: 'Complete 1000 tarot readings',
    category: 'journey',
    tier: 'diamond',
    hidden: false,
    requirements: [{ type: 'readings_total', value: 1000 }],
    rewards: [
      { type: 'title', value: 'Master of the Veil' },
      { type: 'cosmetic', value: 'back_veil_master', rarity: 'legendary' },
      { type: 'cosmetic', value: 'avatar_enlightened', rarity: 'legendary' },
      { type: 'cosmetic', value: 'flip_transcendent', rarity: 'legendary' },
      { type: 'shards', value: 500 },
      { type: 'prestige_badge', value: 'veil_master' },
    ],
    prerequisiteIds: ['journey_500_readings'],
    chainId: 'journey_readings',
    lore: 'You have walked a thousand paths through the cards. The universe itself takes notice.',
  },

  // =========================================
  // MASTERY - Skill and knowledge
  // =========================================
  {
    id: 'mastery_all_major',
    name: 'Keeper of Keys',
    description: 'Encounter all 22 Major Arcana cards',
    category: 'mastery',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'major_arcana_count', value: 22 }],
    rewards: [
      { type: 'title', value: 'Keeper of Keys' },
      { type: 'cosmetic', value: 'back_major_arcana', rarity: 'rare' },
      { type: 'collection_bonus', value: 'major_arcana_mastery' },
    ],
    lore: 'The 22 keys of the Major Arcana have all revealed themselves to you.',
  },
  {
    id: 'mastery_full_deck',
    name: 'Complete the Circle',
    description: 'Encounter all 78 cards of the tarot',
    category: 'mastery',
    tier: 'gold',
    hidden: false,
    requirements: [{ type: 'cards_seen', value: 78 }],
    rewards: [
      { type: 'title', value: 'Circle Keeper' },
      { type: 'cosmetic', value: 'reveal_transcendent', rarity: 'epic' },
      { type: 'cosmetic', value: 'border_complete_deck', rarity: 'epic' },
      { type: 'shards', value: 150 },
    ],
    prerequisiteIds: ['mastery_all_major'],
    lore: 'Every card has shared its wisdom with you. The full circle is complete.',
  },
  {
    id: 'mastery_wands',
    name: 'Master of Wands',
    description: 'Encounter all 14 cards of the Wands suit',
    category: 'mastery',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'card_suit_mastery', value: 14, target: 'wands' }],
    rewards: [
      { type: 'title', value: 'Flame Bearer' },
      { type: 'cosmetic', value: 'trail_ember', rarity: 'uncommon' },
    ],
    lore: 'The fire of creation burns within you.',
  },
  {
    id: 'mastery_cups',
    name: 'Master of Cups',
    description: 'Encounter all 14 cards of the Cups suit',
    category: 'mastery',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'card_suit_mastery', value: 14, target: 'cups' }],
    rewards: [
      { type: 'title', value: 'Tide Keeper' },
      { type: 'cosmetic', value: 'trail_water', rarity: 'uncommon' },
    ],
    lore: 'The depths of emotion flow through you.',
  },
  {
    id: 'mastery_swords',
    name: 'Master of Swords',
    description: 'Encounter all 14 cards of the Swords suit',
    category: 'mastery',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'card_suit_mastery', value: 14, target: 'swords' }],
    rewards: [
      { type: 'title', value: 'Truth Seeker' },
      { type: 'cosmetic', value: 'trail_wind', rarity: 'uncommon' },
    ],
    lore: 'Your mind cuts through illusion like a blade.',
  },
  {
    id: 'mastery_pentacles',
    name: 'Master of Pentacles',
    description: 'Encounter all 14 cards of the Pentacles suit',
    category: 'mastery',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'card_suit_mastery', value: 14, target: 'pentacles' }],
    rewards: [
      { type: 'title', value: 'Earth Tender' },
      { type: 'cosmetic', value: 'trail_earth', rarity: 'uncommon' },
    ],
    lore: 'The material world bends to your will.',
  },
  {
    id: 'mastery_all_suits',
    name: 'Elemental Sovereign',
    description: 'Master all four suits of the Minor Arcana',
    category: 'mastery',
    tier: 'platinum',
    hidden: false,
    requirements: [
      { type: 'card_suit_mastery', value: 14, target: 'wands' },
      { type: 'card_suit_mastery', value: 14, target: 'cups' },
      { type: 'card_suit_mastery', value: 14, target: 'swords' },
      { type: 'card_suit_mastery', value: 14, target: 'pentacles' },
    ],
    rewards: [
      { type: 'title', value: 'Elemental Sovereign' },
      { type: 'cosmetic', value: 'back_elemental_unity', rarity: 'legendary' },
      { type: 'cosmetic', value: 'reveal_four_elements', rarity: 'epic' },
      { type: 'prestige_badge', value: 'elemental_master' },
    ],
    prerequisiteIds: ['mastery_wands', 'mastery_cups', 'mastery_swords', 'mastery_pentacles'],
    lore: 'Fire, Water, Air, and Earth answer your call. You have become one with all elements.',
  },

  // =========================================
  // DEDICATION - Long-term commitment
  // =========================================
  {
    id: 'dedication_streak_7',
    name: 'Weekly Devotion',
    description: 'Maintain a 7-day reading streak',
    category: 'dedication',
    tier: 'bronze',
    hidden: false,
    requirements: [{ type: 'streak_current', value: 7 }],
    rewards: [
      { type: 'cosmetic', value: 'border_weekly_flame', rarity: 'common' },
      { type: 'coins', value: 250 },
    ],
    chainId: 'dedication_streak',
    lore: 'A week of dedication - the first flame is lit.',
  },
  {
    id: 'dedication_streak_30',
    name: 'Monthly Mastery',
    description: 'Maintain a 30-day reading streak',
    category: 'dedication',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'streak_current', value: 30 }],
    rewards: [
      { type: 'title', value: 'Moon Keeper' },
      { type: 'cosmetic', value: 'border_monthly_moon', rarity: 'rare' },
      { type: 'shards', value: 75 },
    ],
    prerequisiteIds: ['dedication_streak_7'],
    chainId: 'dedication_streak',
    lore: 'A full moon cycle of practice. The cards recognize your commitment.',
  },
  {
    id: 'dedication_streak_100',
    name: 'Century of Wisdom',
    description: 'Maintain a 100-day reading streak',
    category: 'dedication',
    tier: 'gold',
    hidden: false,
    requirements: [{ type: 'streak_current', value: 100 }],
    rewards: [
      { type: 'title', value: 'Centurion' },
      { type: 'cosmetic', value: 'back_century', rarity: 'epic' },
      { type: 'cosmetic', value: 'avatar_dedicated', rarity: 'epic' },
      { type: 'shards', value: 200 },
    ],
    prerequisiteIds: ['dedication_streak_30'],
    chainId: 'dedication_streak',
    lore: 'One hundred sunrises spent in reflection. Your dedication is undeniable.',
  },
  {
    id: 'dedication_streak_365',
    name: 'Year of Enlightenment',
    description: 'Maintain a 365-day reading streak',
    category: 'dedication',
    tier: 'diamond',
    hidden: false,
    requirements: [{ type: 'streak_current', value: 365 }],
    rewards: [
      { type: 'title', value: 'Eternal Seeker' },
      { type: 'cosmetic', value: 'back_yearly_cycle', rarity: 'legendary' },
      { type: 'cosmetic', value: 'border_eternal', rarity: 'legendary' },
      { type: 'cosmetic', value: 'flip_cosmic', rarity: 'legendary' },
      { type: 'prestige_badge', value: 'year_keeper' },
      { type: 'shards', value: 1000 },
    ],
    prerequisiteIds: ['dedication_streak_100'],
    chainId: 'dedication_streak',
    lore: 'A full turn of the wheel. You have walked with the cards through every season.',
  },

  // Journal achievements
  {
    id: 'dedication_journal_10',
    name: 'Thoughtful Reflection',
    description: 'Write 10 journal entries',
    category: 'dedication',
    tier: 'bronze',
    hidden: false,
    requirements: [{ type: 'journal_entries', value: 10 }],
    rewards: [
      { type: 'cosmetic', value: 'journal_parchment', rarity: 'common' },
      { type: 'xp', value: 100 },
    ],
    chainId: 'dedication_journal',
  },
  {
    id: 'dedication_journal_100',
    name: 'Chronicle Keeper',
    description: 'Write 100 journal entries',
    category: 'dedication',
    tier: 'gold',
    hidden: false,
    requirements: [{ type: 'journal_entries', value: 100 }],
    rewards: [
      { type: 'title', value: 'Chronicle Keeper' },
      { type: 'cosmetic', value: 'journal_illuminated', rarity: 'epic' },
      { type: 'shards', value: 100 },
    ],
    prerequisiteIds: ['dedication_journal_10'],
    chainId: 'dedication_journal',
    lore: 'Your words have become a treasure trove of personal wisdom.',
  },

  // =========================================
  // COLLECTION - Gathering cosmetics
  // =========================================
  {
    id: 'collection_first',
    name: 'First Treasure',
    description: 'Acquire your first cosmetic item',
    category: 'collection',
    tier: 'bronze',
    hidden: false,
    requirements: [{ type: 'cosmetics_owned', value: 1 }],
    rewards: [
      { type: 'xp', value: 50 },
      { type: 'coins', value: 100 },
    ],
  },
  {
    id: 'collection_10',
    name: 'Growing Hoard',
    description: 'Own 10 cosmetic items',
    category: 'collection',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'cosmetics_owned', value: 10 }],
    rewards: [
      { type: 'title', value: 'Collector' },
      { type: 'showcase_slot', value: 1 },
    ],
    chainId: 'collection_count',
  },
  {
    id: 'collection_50',
    name: 'Curator',
    description: 'Own 50 cosmetic items',
    category: 'collection',
    tier: 'gold',
    hidden: false,
    requirements: [{ type: 'cosmetics_owned', value: 50 }],
    rewards: [
      { type: 'title', value: 'Curator' },
      { type: 'cosmetic', value: 'border_collector', rarity: 'epic' },
      { type: 'showcase_slot', value: 1 },
    ],
    prerequisiteIds: ['collection_10'],
    chainId: 'collection_count',
    lore: 'Your collection grows impressive. Others look upon it with envy.',
  },
  {
    id: 'collection_complete_first',
    name: 'Set Complete',
    description: 'Complete your first collection set',
    category: 'collection',
    tier: 'gold',
    hidden: false,
    requirements: [{ type: 'collection_complete', value: 1 }],
    rewards: [
      { type: 'title', value: 'Set Collector' },
      { type: 'prestige_badge', value: 'collector_bronze' },
      { type: 'shards', value: 100 },
    ],
    lore: 'A complete set! The items resonate with each other, creating something greater.',
  },
  {
    id: 'collection_evolve_first',
    name: 'Transcendence Begins',
    description: 'Evolve a cosmetic to Enhanced tier',
    category: 'collection',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'cosmetics_evolved', value: 1 }],
    rewards: [
      { type: 'xp', value: 200 },
      { type: 'shards', value: 50 },
    ],
    lore: 'You have learned to elevate the mundane to the magical.',
  },
  {
    id: 'collection_evolve_transcendent',
    name: 'Ultimate Form',
    description: 'Evolve a cosmetic to Transcendent tier',
    category: 'collection',
    tier: 'diamond',
    hidden: false,
    requirements: [{ type: 'cosmetics_evolved', value: 4, target: 'transcendent' }],
    rewards: [
      { type: 'title', value: 'Transcendent' },
      { type: 'prestige_badge', value: 'transcendent_first' },
      { type: 'shards', value: 500 },
    ],
    lore: 'You have achieved what few dare dream. True transcendence.',
  },

  // =========================================
  // DISCOVERY - Hidden content
  // =========================================
  {
    id: 'discovery_death',
    name: 'Embrace Change',
    description: 'Draw the Death card for the first time',
    category: 'discovery',
    tier: 'bronze',
    hidden: true,
    requirements: [{ type: 'specific_card', value: 1, target: 'death' }],
    rewards: [
      { type: 'cosmetic', value: 'reveal_transformation', rarity: 'uncommon' },
      { type: 'xp', value: 100 },
    ],
    lore: 'Death is not an ending, but a transformation. You understand this now.',
  },
  {
    id: 'discovery_tower',
    name: 'Weathered the Storm',
    description: 'Draw the Tower card three times',
    category: 'discovery',
    tier: 'silver',
    hidden: true,
    requirements: [{ type: 'specific_card', value: 3, target: 'tower' }],
    rewards: [
      { type: 'title', value: 'Storm Weathered' },
      { type: 'cosmetic', value: 'back_lightning_struck', rarity: 'rare' },
    ],
    lore: 'Three towers have fallen around you, yet you still stand.',
  },
  {
    id: 'discovery_fool_world',
    name: 'The Complete Journey',
    description: 'Draw The Fool followed by The World in the same reading',
    category: 'discovery',
    tier: 'platinum',
    hidden: true,
    requirements: [
      { type: 'specific_card', value: 1, target: 'fool' },
      { type: 'specific_card', value: 1, target: 'world' },
    ],
    rewards: [
      { type: 'title', value: 'Journey Complete' },
      { type: 'cosmetic', value: 'back_fools_journey', rarity: 'legendary' },
      { type: 'cosmetic', value: 'reveal_world', rarity: 'epic' },
    ],
    lore: 'From innocent beginning to triumphant completion. The entire journey, in one reading.',
  },
  {
    id: 'discovery_all_reversed',
    name: 'Shadow Work',
    description: 'Complete a reading where all cards appear reversed',
    category: 'discovery',
    tier: 'gold',
    hidden: true,
    requirements: [{ type: 'cards_reversed', value: 3, target: 'same_reading' }],
    rewards: [
      { type: 'title', value: 'Shadow Walker' },
      { type: 'cosmetic', value: 'theme_shadow', rarity: 'epic' },
    ],
    lore: 'When all paths seem blocked, you find wisdom in the shadows.',
  },

  // =========================================
  // VERA - AI companion interactions
  // =========================================
  {
    id: 'vera_first_chat',
    name: 'Hello, Vera',
    description: 'Have your first conversation with Vera',
    category: 'journey',
    tier: 'bronze',
    hidden: false,
    requirements: [{ type: 'vera_conversations', value: 1 }],
    rewards: [
      { type: 'xp', value: 50 },
      { type: 'coins', value: 50 },
    ],
    lore: 'A new friend awaits. Vera is here to guide you.',
  },
  {
    id: 'vera_deep_talks',
    name: 'Deep Conversations',
    description: 'Have 50 meaningful conversations with Vera',
    category: 'journey',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'vera_conversations', value: 50 }],
    rewards: [
      { type: 'cosmetic', value: 'avatar_vera_bond', rarity: 'rare' },
      { type: 'shards', value: 50 },
    ],
    prerequisiteIds: ['vera_first_chat'],
    lore: 'Vera has become a trusted companion on your journey.',
  },

  // =========================================
  // WELLNESS - Mindfulness and self-care
  // =========================================
  {
    id: 'wellness_first_meditation',
    name: 'Inner Peace',
    description: 'Complete your first mindfulness session',
    category: 'journey',
    tier: 'bronze',
    hidden: false,
    requirements: [{ type: 'mindfulness_sessions', value: 1 }],
    rewards: [
      { type: 'xp', value: 50 },
      { type: 'coins', value: 75 },
    ],
  },
  {
    id: 'wellness_30_sessions',
    name: 'Centered Mind',
    description: 'Complete 30 mindfulness sessions',
    category: 'dedication',
    tier: 'silver',
    hidden: false,
    requirements: [{ type: 'mindfulness_sessions', value: 30 }],
    rewards: [
      { type: 'title', value: 'Centered' },
      { type: 'cosmetic', value: 'theme_zen', rarity: 'rare' },
      { type: 'cosmetic', value: 'sound_peaceful', rarity: 'uncommon' },
    ],
    lore: 'Your mind is a still pool, reflecting truth clearly.',
  },

  // =========================================
  // FOUNDER & EARLY ADOPTER
  // =========================================
  {
    id: 'founder_pioneer',
    name: 'Pioneer',
    description: 'Be among the first 100 users',
    category: 'discovery',
    tier: 'diamond',
    hidden: true,
    requirements: [{ type: 'account_age', value: 1, target: 'first_100' }],
    rewards: [
      { type: 'title', value: 'Pioneer' },
      { type: 'cosmetic', value: 'border_pioneer', rarity: 'mythic' },
      { type: 'cosmetic', value: 'back_genesis', rarity: 'mythic' },
      { type: 'prestige_badge', value: 'pioneer' },
    ],
    lore: 'You were there at the beginning. The very first to walk the Veil Path.',
  },
  {
    id: 'founder_1000',
    name: 'Founding Seeker',
    description: 'Be among the first 1000 users',
    category: 'discovery',
    tier: 'platinum',
    hidden: true,
    requirements: [{ type: 'account_age', value: 1, target: 'first_1000' }],
    rewards: [
      { type: 'title', value: 'Founding Seeker' },
      { type: 'cosmetic', value: 'border_founder', rarity: 'legendary' },
      { type: 'prestige_badge', value: 'founder' },
    ],
    lore: 'You believed before the crowds came. Your faith will be remembered.',
  },
];

// =============================================================================
// ACHIEVEMENT CHAINS - Progressive unlock paths
// =============================================================================

export interface AchievementChain {
  id: string;
  name: string;
  description: string;
  achievementIds: string[];
  completionBonus: AchievementReward[];
}

export const ACHIEVEMENT_CHAINS: AchievementChain[] = [
  {
    id: 'journey_readings',
    name: 'The Reading Path',
    description: 'Progress from seeker to master through readings',
    achievementIds: [
      'journey_first_reading',
      'journey_10_readings',
      'journey_50_readings',
      'journey_100_readings',
      'journey_500_readings',
      'journey_1000_readings',
    ],
    completionBonus: [
      { type: 'title', value: 'Grandmaster Reader' },
      { type: 'cosmetic', value: 'avatar_grandmaster', rarity: 'mythic' },
      { type: 'prestige_badge', value: 'grandmaster' },
    ],
  },
  {
    id: 'dedication_streak',
    name: 'The Eternal Flame',
    description: 'Maintain an ever-growing streak of dedication',
    achievementIds: [
      'dedication_streak_7',
      'dedication_streak_30',
      'dedication_streak_100',
      'dedication_streak_365',
    ],
    completionBonus: [
      { type: 'title', value: 'Eternal' },
      { type: 'cosmetic', value: 'back_eternal_flame', rarity: 'mythic' },
    ],
  },
  {
    id: 'mastery_elements',
    name: 'Elemental Mastery',
    description: 'Master all four elements through the Minor Arcana',
    achievementIds: [
      'mastery_wands',
      'mastery_cups',
      'mastery_swords',
      'mastery_pentacles',
      'mastery_all_suits',
    ],
    completionBonus: [
      { type: 'title', value: 'Elemental Master' },
      { type: 'collection_bonus', value: 'unlock_elemental_collection' },
    ],
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

export function getAchievementChain(chainId: string): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.chainId === chainId);
}

export function getNextInChain(achievement: Achievement): Achievement | undefined {
  if (!achievement.chainId) return undefined;

  const chain = getAchievementChain(achievement.chainId);
  const currentIndex = chain.findIndex(a => a.id === achievement.id);

  return chain[currentIndex + 1];
}

export function calculateTotalAchievementPoints(completedIds: string[]): number {
  return completedIds.reduce((total, id) => {
    const achievement = getAchievementById(id);
    if (!achievement) return total;
    return total + ACHIEVEMENT_TIER_CONFIG[achievement.tier].pointValue;
  }, 0);
}

// Future achievements (not yet released)
export const FUTURE_ACHIEVEMENTS: { id: string; releaseDate: string; teaser: string }[] = [
  {
    id: 'seasonal_spring_equinox_2026',
    releaseDate: '2026-03-20',
    teaser: 'A celebration of balance awaits...',
  },
  {
    id: 'seasonal_summer_solstice_2026',
    releaseDate: '2026-06-21',
    teaser: 'The longest day brings the brightest rewards...',
  },
  {
    id: 'mastery_celtic_cross',
    releaseDate: '2026-01-15',
    teaser: 'Master the ancient Celtic Cross spread...',
  },
];

export default {
  ACHIEVEMENTS,
  ACHIEVEMENT_CHAINS,
  ACHIEVEMENT_TIER_CONFIG,
  FUTURE_ACHIEVEMENTS,
  getAchievementById,
  getAchievementsByCategory,
  getAchievementChain,
  getNextInChain,
  calculateTotalAchievementPoints,
};
