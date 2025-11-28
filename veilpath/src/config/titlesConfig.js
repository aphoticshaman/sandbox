/**
 * Title Configuration
 *
 * Titles are EARNED ONLY through achievements - never purchasable.
 * Users select from unlocked titles to display on their profile.
 *
 * Categories:
 * - progression: Level-based (automatic)
 * - activity: Engagement milestones
 * - special: Rare achievements
 * - community: Helpfulness-based
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESSION TITLES (Level-based, automatic)
// ═══════════════════════════════════════════════════════════════════════════════

export const PROGRESSION_TITLES = {
  seeker: {
    id: 'seeker',
    name: 'Seeker',
    category: 'progression',
    levelRange: [1, 4],
    description: 'Beginning your journey through the veil',
  },
  initiate: {
    id: 'initiate',
    name: 'Initiate',
    category: 'progression',
    levelRange: [5, 9],
    description: 'Stepping deeper into the mysteries',
  },
  practitioner: {
    id: 'practitioner',
    name: 'Practitioner',
    category: 'progression',
    levelRange: [10, 19],
    description: 'Practicing the art of divination',
  },
  adept: {
    id: 'adept',
    name: 'Adept',
    category: 'progression',
    levelRange: [20, 29],
    description: 'Skilled in reading the cards',
  },
  mystic: {
    id: 'mystic',
    name: 'Mystic',
    category: 'progression',
    levelRange: [30, 39],
    description: 'Touched by cosmic wisdom',
  },
  seer: {
    id: 'vera',
    name: 'Vera',
    category: 'progression',
    levelRange: [40, 49],
    description: 'Speaker of hidden truths',
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    category: 'progression',
    levelRange: [50, Infinity],
    description: 'Master of the veil',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TITLES (Engagement milestones)
// ═══════════════════════════════════════════════════════════════════════════════

export const ACTIVITY_TITLES = {
  // Streak titles
  dawn_devotee: {
    id: 'dawn_devotee',
    name: 'Dawn Devotee',
    category: 'activity',
    requirement: { type: 'streak', value: 7 },
    description: 'Maintained a 7-day streak',
  },
  moon_faithful: {
    id: 'moon_faithful',
    name: 'Moon Faithful',
    category: 'activity',
    requirement: { type: 'streak', value: 30 },
    description: 'Maintained a 30-day streak',
  },
  eternal_flame: {
    id: 'eternal_flame',
    name: 'Eternal Flame',
    category: 'activity',
    requirement: { type: 'streak', value: 100 },
    description: 'Maintained a 100-day streak',
  },

  // Reading titles
  card_whisperer: {
    id: 'card_whisperer',
    name: 'Card Whisperer',
    category: 'activity',
    requirement: { type: 'readings', value: 100 },
    description: 'Completed 100 readings',
  },
  deck_master: {
    id: 'deck_master',
    name: 'Deck Master',
    category: 'activity',
    requirement: { type: 'readings', value: 500 },
    description: 'Completed 500 readings',
  },
  thousand_draws: {
    id: 'thousand_draws',
    name: 'Thousand Draws',
    category: 'activity',
    requirement: { type: 'readings', value: 1000 },
    description: 'Completed 1000 readings',
  },

  // Journal titles
  soul_scribe: {
    id: 'soul_scribe',
    name: 'Soul Scribe',
    category: 'activity',
    requirement: { type: 'journal_entries', value: 50 },
    description: 'Written 50 journal entries',
  },
  chronicle_keeper: {
    id: 'chronicle_keeper',
    name: 'Chronicle Keeper',
    category: 'activity',
    requirement: { type: 'journal_entries', value: 100 },
    description: 'Written 100 journal entries',
  },
  memoir_master: {
    id: 'memoir_master',
    name: 'Memoir Master',
    category: 'activity',
    requirement: { type: 'journal_entries', value: 250 },
    description: 'Written 250 journal entries',
  },

  // Quest titles
  quest_curious: {
    id: 'quest_curious',
    name: 'Quest Curious',
    category: 'activity',
    requirement: { type: 'quests_completed', value: 10 },
    description: 'Completed 10 quests',
  },
  path_walker: {
    id: 'path_walker',
    name: 'Path Walker',
    category: 'activity',
    requirement: { type: 'quests_completed', value: 50 },
    description: 'Completed 50 quests',
  },
  destiny_forger: {
    id: 'destiny_forger',
    name: 'Destiny Forger',
    category: 'activity',
    requirement: { type: 'quests_completed', value: 100 },
    description: 'Completed 100 quests',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNITY TITLES (Helpfulness-based)
// ═══════════════════════════════════════════════════════════════════════════════

export const COMMUNITY_TITLES = {
  // First steps
  voice_awakened: {
    id: 'voice_awakened',
    name: 'Voice Awakened',
    category: 'community',
    requirement: { type: 'posts', value: 1 },
    description: 'Made your first community post',
  },
  conversation_starter: {
    id: 'conversation_starter',
    name: 'Conversation Starter',
    category: 'community',
    requirement: { type: 'posts', value: 10 },
    description: 'Started 10 conversations',
  },

  // Reactions received
  resonant_voice: {
    id: 'resonant_voice',
    name: 'Resonant Voice',
    category: 'community',
    requirement: { type: 'reactions_received', value: 10 },
    description: 'Received 10 reactions on your posts',
  },
  community_beacon: {
    id: 'community_beacon',
    name: 'Community Beacon',
    category: 'community',
    requirement: { type: 'reactions_received', value: 50 },
    description: 'Received 50 reactions on your posts',
  },
  guiding_light: {
    id: 'guiding_light',
    name: 'Guiding Light',
    category: 'community',
    requirement: { type: 'reactions_received', value: 100 },
    description: 'Received 100 reactions on your posts',
  },

  // Helpfulness
  kind_spirit: {
    id: 'kind_spirit',
    name: 'Kind Spirit',
    category: 'community',
    requirement: { type: 'helpful_replies', value: 10 },
    description: 'Gave 10 helpful replies',
  },
  wisdom_sharer: {
    id: 'wisdom_sharer',
    name: 'Wisdom Sharer',
    category: 'community',
    requirement: { type: 'helpful_replies', value: 50 },
    description: 'Gave 50 helpful replies',
  },
  community_guide: {
    id: 'community_guide',
    name: 'Community Guide',
    category: 'community',
    requirement: { type: 'helpful_replies', value: 100 },
    description: 'Gave 100 helpful replies',
  },

  // Daily sharing
  daily_sharer: {
    id: 'daily_sharer',
    name: 'Daily Sharer',
    category: 'community',
    requirement: { type: 'daily_shares', value: 7 },
    description: 'Shared daily card 7 days in a row',
  },
  ritual_keeper: {
    id: 'ritual_keeper',
    name: 'Ritual Keeper',
    category: 'community',
    requirement: { type: 'daily_shares', value: 30 },
    description: 'Shared daily card 30 days in a row',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIAL TITLES (Rare achievements)
// ═══════════════════════════════════════════════════════════════════════════════

export const SPECIAL_TITLES = {
  // Collection titles
  arcana_collector: {
    id: 'arcana_collector',
    name: 'Arcana Collector',
    category: 'special',
    requirement: { type: 'major_arcana_readings', value: 22 },
    description: 'Drew all 22 Major Arcana cards',
  },
  full_deck: {
    id: 'full_deck',
    name: 'Full Deck',
    category: 'special',
    requirement: { type: 'unique_cards_drawn', value: 78 },
    description: 'Drew all 78 cards at least once',
  },
  back_collector: {
    id: 'back_collector',
    name: 'Back Collector',
    category: 'special',
    requirement: { type: 'card_backs_owned', value: 'all' },
    description: 'Collected all card backs',
  },

  // Subscriber titles
  patron_of_the_veil: {
    id: 'patron_of_the_veil',
    name: 'Patron of the Veil',
    category: 'special',
    requirement: { type: 'subscription', value: 'premium' },
    description: 'Premium subscriber',
  },
  eternal_patron: {
    id: 'eternal_patron',
    name: 'Eternal Patron',
    category: 'special',
    requirement: { type: 'subscription', value: 'lifetime' },
    description: 'Lifetime subscriber',
  },

  // Anniversary titles
  year_walker: {
    id: 'year_walker',
    name: 'Year Walker',
    category: 'special',
    requirement: { type: 'account_age_days', value: 365 },
    description: 'Member for one year',
  },
  timeless_wanderer: {
    id: 'timeless_wanderer',
    name: 'Timeless Wanderer',
    category: 'special',
    requirement: { type: 'account_age_days', value: 730 },
    description: 'Member for two years',
  },

  // Hidden titles
  founding_seer: {
    id: 'founding_oracle',
    name: 'Founding Vera',
    category: 'special',
    requirement: { type: 'flag', value: 'beta_tester' },
    description: 'Beta tester',
    hidden: true,
  },
  veil_piercer: {
    id: 'veil_piercer',
    name: 'Veil Piercer',
    category: 'special',
    requirement: { type: 'flag', value: 'found_easter_egg' },
    description: 'Found a hidden secret',
    hidden: true,
  },
  spread_savant: {
    id: 'spread_savant',
    name: 'Spread Savant',
    category: 'special',
    requirement: { type: 'spreads_completed', value: 'all' },
    description: 'Completed all spread types',
  },

  // Night owl titles
  midnight_reader: {
    id: 'midnight_reader',
    name: 'Midnight Reader',
    category: 'special',
    requirement: { type: 'readings_at_midnight', value: 10 },
    description: 'Completed 10 readings at midnight',
    hidden: true,
  },
  lunar_devotee: {
    id: 'lunar_devotee',
    name: 'Lunar Devotee',
    category: 'special',
    requirement: { type: 'readings_full_moon', value: 5 },
    description: 'Completed readings during 5 full moons',
    hidden: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMBINED EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const ALL_TITLES = {
  ...PROGRESSION_TITLES,
  ...ACTIVITY_TITLES,
  ...COMMUNITY_TITLES,
  ...SPECIAL_TITLES,
};

/**
 * Get the progression title for a given level
 */
export function getProgressionTitleForLevel(level) {
  for (const title of Object.values(PROGRESSION_TITLES)) {
    const [min, max] = title.levelRange;
    if (level >= min && level <= max) {
      return title;
    }
  }
  return PROGRESSION_TITLES.seeker;
}

/**
 * Get all titles unlocked by a user based on their stats
 */
export function getUnlockedTitles(userStats) {
  const unlocked = [];

  // Progression title (always have one)
  const progressionTitle = getProgressionTitleForLevel(userStats.level || 1);
  unlocked.push(progressionTitle);

  // Check activity titles
  for (const title of Object.values(ACTIVITY_TITLES)) {
    if (checkTitleRequirement(title, userStats)) {
      unlocked.push(title);
    }
  }

  // Check community titles
  for (const title of Object.values(COMMUNITY_TITLES)) {
    if (checkTitleRequirement(title, userStats)) {
      unlocked.push(title);
    }
  }

  // Check special titles
  for (const title of Object.values(SPECIAL_TITLES)) {
    if (checkTitleRequirement(title, userStats)) {
      unlocked.push(title);
    }
  }

  return unlocked;
}

/**
 * Check if a title's requirement is met
 */
function checkTitleRequirement(title, stats) {
  const { type, value } = title.requirement || {};

  switch (type) {
    case 'streak':
      return (stats.longest_streak || 0) >= value;
    case 'readings':
      return (stats.total_readings || 0) >= value;
    case 'journal_entries':
      return (stats.total_journal_entries || 0) >= value;
    case 'quests_completed':
      return (stats.quests_completed || 0) >= value;
    case 'posts':
      return (stats.total_posts || 0) >= value;
    case 'reactions_received':
      return (stats.total_likes_received || 0) >= value;
    case 'helpful_replies':
      return (stats.helpful_replies || 0) >= value;
    case 'daily_shares':
      return (stats.daily_card_share_streak || 0) >= value;
    case 'major_arcana_readings':
      return (stats.unique_major_arcana || []).length >= value;
    case 'unique_cards_drawn':
      return (stats.unique_cards_drawn || []).length >= value;
    case 'card_backs_owned':
      // 'all' would need to check against total available
      return value === 'all' ? stats.owns_all_card_backs : (stats.card_backs_owned || 0) >= value;
    case 'subscription':
      if (value === 'lifetime') return stats.has_lifetime;
      if (value === 'premium') return stats.is_premium || stats.has_lifetime;
      return false;
    case 'account_age_days':
      const accountAge = stats.account_age_days || 0;
      return accountAge >= value;
    case 'flag':
      return stats.flags?.includes(value);
    case 'spreads_completed':
      return value === 'all' ? stats.completed_all_spreads : false;
    case 'readings_at_midnight':
      return (stats.midnight_readings || 0) >= value;
    case 'readings_full_moon':
      return (stats.full_moon_readings || 0) >= value;
    default:
      return false;
  }
}

/**
 * Get title by ID
 */
export function getTitleById(titleId) {
  return ALL_TITLES[titleId] || null;
}

/**
 * Format title display (for profile)
 * Can show multiple titles if user has them
 */
export function formatTitleDisplay(primaryTitleId, secondaryTitleId = null) {
  const primary = getTitleById(primaryTitleId);
  const secondary = secondaryTitleId ? getTitleById(secondaryTitleId) : null;

  if (!primary) return '';

  if (secondary) {
    return `${primary.name} \u00B7 ${secondary.name}`;
  }

  return primary.name;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TITLE CATEGORIES FOR DROPDOWN UI
// ═══════════════════════════════════════════════════════════════════════════════

export const TITLE_CATEGORIES = [
  {
    id: 'progression',
    name: 'Journey',
    description: 'Earned through leveling up',
    titles: Object.values(PROGRESSION_TITLES),
  },
  {
    id: 'activity',
    name: 'Dedication',
    description: 'Earned through consistent practice',
    titles: Object.values(ACTIVITY_TITLES),
  },
  {
    id: 'community',
    name: 'Community',
    description: 'Earned through helping others',
    titles: Object.values(COMMUNITY_TITLES),
  },
  {
    id: 'special',
    name: 'Rare',
    description: 'Unique achievements',
    titles: Object.values(SPECIAL_TITLES).filter(t => !t.hidden),
  },
];
