/**
 * VeilPath Binary Title System
 * Inspired by Diablo 4's prefix + suffix system
 *
 * Players combine ONE prefix + ONE suffix to create their display title
 * Example: "The Awakened" + "Seeker" = "The Awakened Seeker"
 *
 * Titles are unlocked by EVERYTHING:
 * - Achievements
 * - Level milestones
 * - Reading milestones
 * - Journal entries
 * - Streak achievements
 * - Forum participation
 * - Seasonal events
 * - Referrals
 * - Subscriptions
 * - And more...
 *
 * Each unlock grants BOTH a prefix AND a suffix (like D4)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TITLE PREFIXES (Adjectives / "The ___")
// ═══════════════════════════════════════════════════════════════════════════════

export const TITLE_PREFIXES = {
  // ─────────────────────────────────────────────────────────────────────────────
  // STARTER TITLES (Given to all users)
  // ─────────────────────────────────────────────────────────────────────────────
  the: {
    id: 'the',
    text: 'The',
    category: 'default',
    rarity: 'common',
    unlockedBy: 'default',
  },
  aspiring: {
    id: 'aspiring',
    text: 'Aspiring',
    category: 'default',
    rarity: 'common',
    unlockedBy: 'default',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEVEL-BASED PREFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  novice: {
    id: 'novice',
    text: 'Novice',
    category: 'level',
    rarity: 'common',
    unlockedBy: { type: 'level', value: 5 },
  },
  apprentice: {
    id: 'apprentice',
    text: 'Apprentice',
    category: 'level',
    rarity: 'common',
    unlockedBy: { type: 'level', value: 10 },
  },
  adept: {
    id: 'adept',
    text: 'Adept',
    category: 'level',
    rarity: 'rare',
    unlockedBy: { type: 'level', value: 15 },
  },
  skilled: {
    id: 'skilled',
    text: 'Skilled',
    category: 'level',
    rarity: 'rare',
    unlockedBy: { type: 'level', value: 20 },
  },
  expert: {
    id: 'expert',
    text: 'Expert',
    category: 'level',
    rarity: 'epic',
    unlockedBy: { type: 'level', value: 25 },
  },
  master: {
    id: 'master',
    text: 'Master',
    category: 'level',
    rarity: 'epic',
    unlockedBy: { type: 'level', value: 30 },
  },
  grandmaster: {
    id: 'grandmaster',
    text: 'Grandmaster',
    category: 'level',
    rarity: 'legendary',
    unlockedBy: { type: 'level', value: 40 },
  },
  legendary: {
    id: 'legendary',
    text: 'Legendary',
    category: 'level',
    rarity: 'legendary',
    unlockedBy: { type: 'level', value: 50 },
  },
  mythic: {
    id: 'mythic',
    text: 'Mythic',
    category: 'level',
    rarity: 'mythic',
    unlockedBy: { type: 'level', value: 75 },
  },
  transcendent: {
    id: 'transcendent',
    text: 'Transcendent',
    category: 'level',
    rarity: 'mythic',
    unlockedBy: { type: 'level', value: 100 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // READING MILESTONE PREFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  curious: {
    id: 'curious',
    text: 'Curious',
    category: 'readings',
    rarity: 'common',
    unlockedBy: { type: 'readings', value: 10 },
  },
  seeking: {
    id: 'seeking',
    text: 'Seeking',
    category: 'readings',
    rarity: 'common',
    unlockedBy: { type: 'readings', value: 25 },
  },
  devoted: {
    id: 'devoted',
    text: 'Devoted',
    category: 'readings',
    rarity: 'rare',
    unlockedBy: { type: 'readings', value: 50 },
  },
  enlightened: {
    id: 'enlightened',
    text: 'Enlightened',
    category: 'readings',
    rarity: 'rare',
    unlockedBy: { type: 'readings', value: 100 },
  },
  illuminated: {
    id: 'illuminated',
    text: 'Illuminated',
    category: 'readings',
    rarity: 'epic',
    unlockedBy: { type: 'readings', value: 250 },
  },
  prophetic: {
    id: 'prophetic',
    text: 'Prophetic',
    category: 'readings',
    rarity: 'epic',
    unlockedBy: { type: 'readings', value: 500 },
  },
  omniscient: {
    id: 'omniscient',
    text: 'Omniscient',
    category: 'readings',
    rarity: 'legendary',
    unlockedBy: { type: 'readings', value: 1000 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // JOURNAL/REFLECTION PREFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  thoughtful: {
    id: 'thoughtful',
    text: 'Thoughtful',
    category: 'journal',
    rarity: 'common',
    unlockedBy: { type: 'journal', value: 5 },
  },
  introspective: {
    id: 'introspective',
    text: 'Introspective',
    category: 'journal',
    rarity: 'common',
    unlockedBy: { type: 'journal', value: 15 },
  },
  reflective: {
    id: 'reflective',
    text: 'Reflective',
    category: 'journal',
    rarity: 'rare',
    unlockedBy: { type: 'journal', value: 30 },
  },
  contemplative: {
    id: 'contemplative',
    text: 'Contemplative',
    category: 'journal',
    rarity: 'rare',
    unlockedBy: { type: 'journal', value: 50 },
  },
  wise: {
    id: 'wise',
    text: 'Wise',
    category: 'journal',
    rarity: 'epic',
    unlockedBy: { type: 'journal', value: 100 },
  },
  sagely: {
    id: 'sagely',
    text: 'Sagely',
    category: 'journal',
    rarity: 'legendary',
    unlockedBy: { type: 'journal', value: 250 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // STREAK PREFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  consistent: {
    id: 'consistent',
    text: 'Consistent',
    category: 'streak',
    rarity: 'common',
    unlockedBy: { type: 'streak', value: 7 },
  },
  dedicated: {
    id: 'dedicated',
    text: 'Dedicated',
    category: 'streak',
    rarity: 'rare',
    unlockedBy: { type: 'streak', value: 14 },
  },
  relentless: {
    id: 'relentless',
    text: 'Relentless',
    category: 'streak',
    rarity: 'rare',
    unlockedBy: { type: 'streak', value: 30 },
  },
  unstoppable: {
    id: 'unstoppable',
    text: 'Unstoppable',
    category: 'streak',
    rarity: 'epic',
    unlockedBy: { type: 'streak', value: 60 },
  },
  eternal: {
    id: 'eternal',
    text: 'Eternal',
    category: 'streak',
    rarity: 'legendary',
    unlockedBy: { type: 'streak', value: 100 },
  },
  undying: {
    id: 'undying',
    text: 'Undying',
    category: 'streak',
    rarity: 'legendary',
    unlockedBy: { type: 'streak', value: 365 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MINDFULNESS/THERAPY PREFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  mindful: {
    id: 'mindful',
    text: 'Mindful',
    category: 'mindfulness',
    rarity: 'common',
    unlockedBy: { type: 'mindfulness', value: 10 },
  },
  centered: {
    id: 'centered',
    text: 'Centered',
    category: 'mindfulness',
    rarity: 'rare',
    unlockedBy: { type: 'mindfulness', value: 25 },
  },
  balanced: {
    id: 'balanced',
    text: 'Balanced',
    category: 'mindfulness',
    rarity: 'rare',
    unlockedBy: { type: 'mindfulness', value: 50 },
  },
  serene: {
    id: 'serene',
    text: 'Serene',
    category: 'mindfulness',
    rarity: 'epic',
    unlockedBy: { type: 'mindfulness', value: 100 },
  },
  tranquil: {
    id: 'tranquil',
    text: 'Tranquil',
    category: 'mindfulness',
    rarity: 'epic',
    unlockedBy: { type: 'mindfulness', value: 200 },
  },
  zen: {
    id: 'zen',
    text: 'Zen',
    category: 'mindfulness',
    rarity: 'legendary',
    unlockedBy: { type: 'mindfulness', value: 500 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // COMMUNITY/FORUM PREFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  social: {
    id: 'social',
    text: 'Social',
    category: 'community',
    rarity: 'common',
    unlockedBy: { type: 'forum_posts', value: 5 },
  },
  vocal: {
    id: 'vocal',
    text: 'Vocal',
    category: 'community',
    rarity: 'common',
    unlockedBy: { type: 'forum_posts', value: 15 },
  },
  influential: {
    id: 'influential',
    text: 'Influential',
    category: 'community',
    rarity: 'rare',
    unlockedBy: { type: 'forum_likes_received', value: 50 },
  },
  beloved: {
    id: 'beloved',
    text: 'Beloved',
    category: 'community',
    rarity: 'epic',
    unlockedBy: { type: 'forum_likes_received', value: 200 },
  },
  venerated: {
    id: 'venerated',
    text: 'Venerated',
    category: 'community',
    rarity: 'legendary',
    unlockedBy: { type: 'forum_likes_received', value: 500 },
  },
  legendary_community: {
    id: 'legendary_community',
    text: 'Legendary',
    category: 'community',
    rarity: 'legendary',
    unlockedBy: { type: 'forum_likes_received', value: 1000 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // REFERRAL PREFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  friendly: {
    id: 'friendly',
    text: 'Friendly',
    category: 'referral',
    rarity: 'common',
    unlockedBy: { type: 'referrals', value: 1 },
  },
  welcoming: {
    id: 'welcoming',
    text: 'Welcoming',
    category: 'referral',
    rarity: 'rare',
    unlockedBy: { type: 'referrals', value: 5 },
  },
  champion: {
    id: 'champion',
    text: 'Champion',
    category: 'referral',
    rarity: 'epic',
    unlockedBy: { type: 'referrals', value: 10 },
  },
  ambassador: {
    id: 'ambassador',
    text: 'Ambassador',
    category: 'referral',
    rarity: 'legendary',
    unlockedBy: { type: 'referrals', value: 25 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SUBSCRIPTION/SUPPORTER PREFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  supportive: {
    id: 'supportive',
    text: 'Supportive',
    category: 'subscriber',
    rarity: 'rare',
    unlockedBy: { type: 'subscription', value: 'first' },
    subscriberExclusive: true,
  },
  patron: {
    id: 'patron',
    text: 'Patron',
    category: 'subscriber',
    rarity: 'epic',
    unlockedBy: { type: 'subscription', value: 'yearly' },
    subscriberExclusive: true,
  },
  benefactor: {
    id: 'benefactor',
    text: 'Benefactor',
    category: 'subscriber',
    rarity: 'legendary',
    unlockedBy: { type: 'subscription', value: 'lifetime' },
    subscriberExclusive: true,
  },
  founding: {
    id: 'founding',
    text: 'Founding',
    category: 'subscriber',
    rarity: 'mythic',
    unlockedBy: { type: 'subscription', value: 'founding_member' },
    subscriberExclusive: true,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SEASONAL/EVENT PREFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  haunted: {
    id: 'haunted',
    text: 'Haunted',
    category: 'seasonal',
    rarity: 'rare',
    unlockedBy: { type: 'event', value: 'halloween' },
  },
  blessed: {
    id: 'blessed',
    text: 'Blessed',
    category: 'seasonal',
    rarity: 'rare',
    unlockedBy: { type: 'event', value: 'winter_solstice' },
  },
  awakened: {
    id: 'awakened',
    text: 'Awakened',
    category: 'seasonal',
    rarity: 'rare',
    unlockedBy: { type: 'event', value: 'imbolc' },
  },
  blooming: {
    id: 'blooming',
    text: 'Blooming',
    category: 'seasonal',
    rarity: 'rare',
    unlockedBy: { type: 'event', value: 'beltane' },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SPECIAL ACHIEVEMENT PREFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  perfected: {
    id: 'perfected',
    text: 'Perfected',
    category: 'achievement',
    rarity: 'epic',
    unlockedBy: { type: 'achievement', value: 'complete_all_spreads' },
  },
  arcane: {
    id: 'arcane',
    text: 'Arcane',
    category: 'achievement',
    rarity: 'epic',
    unlockedBy: { type: 'achievement', value: 'major_arcana_master' },
  },
  mystic: {
    id: 'mystic',
    text: 'Mystic',
    category: 'achievement',
    rarity: 'legendary',
    unlockedBy: { type: 'achievement', value: 'minor_arcana_master' },
  },
  ancient: {
    id: 'ancient',
    text: 'Ancient',
    category: 'achievement',
    rarity: 'legendary',
    unlockedBy: { type: 'achievement', value: 'year_one_player' },
  },
  primordial: {
    id: 'primordial',
    text: 'Primordial',
    category: 'achievement',
    rarity: 'mythic',
    unlockedBy: { type: 'achievement', value: 'day_one_player' },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MBTI-BASED PREFIXES (One for each type's dominant trait)
  // ─────────────────────────────────────────────────────────────────────────────
  intuitive: {
    id: 'intuitive',
    text: 'Intuitive',
    category: 'mbti',
    rarity: 'rare',
    unlockedBy: { type: 'mbti', value: ['INFJ', 'INFP', 'ENFJ', 'ENFP', 'INTJ', 'INTP', 'ENTJ', 'ENTP'] },
  },
  observant: {
    id: 'observant',
    text: 'Observant',
    category: 'mbti',
    rarity: 'rare',
    unlockedBy: { type: 'mbti', value: ['ISFJ', 'ISFP', 'ESFJ', 'ESFP', 'ISTJ', 'ISTP', 'ESTJ', 'ESTP'] },
  },
  empathic: {
    id: 'empathic',
    text: 'Empathic',
    category: 'mbti',
    rarity: 'rare',
    unlockedBy: { type: 'mbti', value: ['INFJ', 'INFP', 'ISFJ', 'ISFP', 'ENFJ', 'ENFP', 'ESFJ', 'ESFP'] },
  },
  analytical: {
    id: 'analytical',
    text: 'Analytical',
    category: 'mbti',
    rarity: 'rare',
    unlockedBy: { type: 'mbti', value: ['INTJ', 'INTP', 'ISTJ', 'ISTP', 'ENTJ', 'ENTP', 'ESTJ', 'ESTP'] },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TITLE SUFFIXES (Nouns)
// ═══════════════════════════════════════════════════════════════════════════════

export const TITLE_SUFFIXES = {
  // ─────────────────────────────────────────────────────────────────────────────
  // STARTER TITLES
  // ─────────────────────────────────────────────────────────────────────────────
  seeker: {
    id: 'seeker',
    text: 'Seeker',
    category: 'default',
    rarity: 'common',
    unlockedBy: 'default',
  },
  wanderer: {
    id: 'wanderer',
    text: 'Wanderer',
    category: 'default',
    rarity: 'common',
    unlockedBy: 'default',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEVEL-BASED SUFFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  student: {
    id: 'student',
    text: 'Student',
    category: 'level',
    rarity: 'common',
    unlockedBy: { type: 'level', value: 5 },
  },
  practitioner: {
    id: 'practitioner',
    text: 'Practitioner',
    category: 'level',
    rarity: 'common',
    unlockedBy: { type: 'level', value: 10 },
  },
  initiate: {
    id: 'initiate',
    text: 'Initiate',
    category: 'level',
    rarity: 'rare',
    unlockedBy: { type: 'level', value: 15 },
  },
  adept_suffix: {
    id: 'adept_suffix',
    text: 'Adept',
    category: 'level',
    rarity: 'rare',
    unlockedBy: { type: 'level', value: 20 },
  },
  sage: {
    id: 'sage',
    text: 'Sage',
    category: 'level',
    rarity: 'epic',
    unlockedBy: { type: 'level', value: 25 },
  },
  master_suffix: {
    id: 'master_suffix',
    text: 'Master',
    category: 'level',
    rarity: 'epic',
    unlockedBy: { type: 'level', value: 30 },
  },
  archon: {
    id: 'archon',
    text: 'Archon',
    category: 'level',
    rarity: 'legendary',
    unlockedBy: { type: 'level', value: 40 },
  },
  ascendant: {
    id: 'ascendant',
    text: 'Ascendant',
    category: 'level',
    rarity: 'legendary',
    unlockedBy: { type: 'level', value: 50 },
  },
  paragon: {
    id: 'paragon',
    text: 'Paragon',
    category: 'level',
    rarity: 'mythic',
    unlockedBy: { type: 'level', value: 75 },
  },
  avatar: {
    id: 'avatar',
    text: 'Avatar',
    category: 'level',
    rarity: 'mythic',
    unlockedBy: { type: 'level', value: 100 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TAROT/READING SUFFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  reader: {
    id: 'reader',
    text: 'Reader',
    category: 'readings',
    rarity: 'common',
    unlockedBy: { type: 'readings', value: 10 },
  },
  diviner: {
    id: 'diviner',
    text: 'Diviner',
    category: 'readings',
    rarity: 'common',
    unlockedBy: { type: 'readings', value: 25 },
  },
  seer: {
    id: 'vera',
    text: 'Vera',
    category: 'readings',
    rarity: 'rare',
    unlockedBy: { type: 'readings', value: 50 },
  },
  seer: {
    id: 'seer',
    text: 'Seer',
    category: 'readings',
    rarity: 'rare',
    unlockedBy: { type: 'readings', value: 100 },
  },
  prophet: {
    id: 'prophet',
    text: 'Prophet',
    category: 'readings',
    rarity: 'epic',
    unlockedBy: { type: 'readings', value: 250 },
  },
  harbinger: {
    id: 'harbinger',
    text: 'Harbinger',
    category: 'readings',
    rarity: 'epic',
    unlockedBy: { type: 'readings', value: 500 },
  },
  fateweaver: {
    id: 'fateweaver',
    text: 'Fateweaver',
    category: 'readings',
    rarity: 'legendary',
    unlockedBy: { type: 'readings', value: 1000 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // JOURNAL/REFLECTION SUFFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  scribe: {
    id: 'scribe',
    text: 'Scribe',
    category: 'journal',
    rarity: 'common',
    unlockedBy: { type: 'journal', value: 5 },
  },
  chronicler: {
    id: 'chronicler',
    text: 'Chronicler',
    category: 'journal',
    rarity: 'common',
    unlockedBy: { type: 'journal', value: 15 },
  },
  keeper: {
    id: 'keeper',
    text: 'Keeper',
    category: 'journal',
    rarity: 'rare',
    unlockedBy: { type: 'journal', value: 30 },
  },
  archivist: {
    id: 'archivist',
    text: 'Archivist',
    category: 'journal',
    rarity: 'rare',
    unlockedBy: { type: 'journal', value: 50 },
  },
  loremaster: {
    id: 'loremaster',
    text: 'Loremaster',
    category: 'journal',
    rarity: 'epic',
    unlockedBy: { type: 'journal', value: 100 },
  },
  historian: {
    id: 'historian',
    text: 'Historian',
    category: 'journal',
    rarity: 'legendary',
    unlockedBy: { type: 'journal', value: 250 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // STREAK SUFFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  devotee: {
    id: 'devotee',
    text: 'Devotee',
    category: 'streak',
    rarity: 'common',
    unlockedBy: { type: 'streak', value: 7 },
  },
  faithful: {
    id: 'faithful',
    text: 'Faithful',
    category: 'streak',
    rarity: 'rare',
    unlockedBy: { type: 'streak', value: 14 },
  },
  steadfast: {
    id: 'steadfast',
    text: 'Steadfast',
    category: 'streak',
    rarity: 'rare',
    unlockedBy: { type: 'streak', value: 30 },
  },
  zealot: {
    id: 'zealot',
    text: 'Zealot',
    category: 'streak',
    rarity: 'epic',
    unlockedBy: { type: 'streak', value: 60 },
  },
  immortal: {
    id: 'immortal',
    text: 'Immortal',
    category: 'streak',
    rarity: 'legendary',
    unlockedBy: { type: 'streak', value: 100 },
  },
  everlasting: {
    id: 'everlasting',
    text: 'Everlasting',
    category: 'streak',
    rarity: 'mythic',
    unlockedBy: { type: 'streak', value: 365 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MINDFULNESS/THERAPY SUFFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  meditator: {
    id: 'meditator',
    text: 'Meditator',
    category: 'mindfulness',
    rarity: 'common',
    unlockedBy: { type: 'mindfulness', value: 10 },
  },
  healer: {
    id: 'healer',
    text: 'Healer',
    category: 'mindfulness',
    rarity: 'rare',
    unlockedBy: { type: 'mindfulness', value: 25 },
  },
  mender: {
    id: 'mender',
    text: 'Mender',
    category: 'mindfulness',
    rarity: 'rare',
    unlockedBy: { type: 'mindfulness', value: 50 },
  },
  monk: {
    id: 'monk',
    text: 'Monk',
    category: 'mindfulness',
    rarity: 'epic',
    unlockedBy: { type: 'mindfulness', value: 100 },
  },
  shaman: {
    id: 'shaman',
    text: 'Shaman',
    category: 'mindfulness',
    rarity: 'epic',
    unlockedBy: { type: 'mindfulness', value: 200 },
  },
  enlightened_suffix: {
    id: 'enlightened_suffix',
    text: 'Enlightened',
    category: 'mindfulness',
    rarity: 'legendary',
    unlockedBy: { type: 'mindfulness', value: 500 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // COMMUNITY/FORUM SUFFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  voice: {
    id: 'voice',
    text: 'Voice',
    category: 'community',
    rarity: 'common',
    unlockedBy: { type: 'forum_posts', value: 5 },
  },
  speaker: {
    id: 'speaker',
    text: 'Speaker',
    category: 'community',
    rarity: 'common',
    unlockedBy: { type: 'forum_posts', value: 15 },
  },
  pillar: {
    id: 'pillar',
    text: 'Pillar',
    category: 'community',
    rarity: 'rare',
    unlockedBy: { type: 'forum_posts', value: 50 },
  },
  leader: {
    id: 'leader',
    text: 'Leader',
    category: 'community',
    rarity: 'epic',
    unlockedBy: { type: 'forum_likes_received', value: 100 },
  },
  elder: {
    id: 'elder',
    text: 'Elder',
    category: 'community',
    rarity: 'legendary',
    unlockedBy: { type: 'forum_likes_received', value: 500 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // REFERRAL SUFFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  friend: {
    id: 'friend',
    text: 'Friend',
    category: 'referral',
    rarity: 'common',
    unlockedBy: { type: 'referrals', value: 1 },
  },
  connector: {
    id: 'connector',
    text: 'Connector',
    category: 'referral',
    rarity: 'rare',
    unlockedBy: { type: 'referrals', value: 5 },
  },
  herald: {
    id: 'herald',
    text: 'Herald',
    category: 'referral',
    rarity: 'epic',
    unlockedBy: { type: 'referrals', value: 10 },
  },
  envoy: {
    id: 'envoy',
    text: 'Envoy',
    category: 'referral',
    rarity: 'legendary',
    unlockedBy: { type: 'referrals', value: 25 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SUBSCRIPTION/SUPPORTER SUFFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  supporter: {
    id: 'supporter',
    text: 'Supporter',
    category: 'subscriber',
    rarity: 'rare',
    unlockedBy: { type: 'subscription', value: 'first' },
    subscriberExclusive: true,
  },
  patron_suffix: {
    id: 'patron_suffix',
    text: 'Patron',
    category: 'subscriber',
    rarity: 'epic',
    unlockedBy: { type: 'subscription', value: 'yearly' },
    subscriberExclusive: true,
  },
  benefactor_suffix: {
    id: 'benefactor_suffix',
    text: 'Benefactor',
    category: 'subscriber',
    rarity: 'legendary',
    unlockedBy: { type: 'subscription', value: 'lifetime' },
    subscriberExclusive: true,
  },
  founder: {
    id: 'founder',
    text: 'Founder',
    category: 'subscriber',
    rarity: 'mythic',
    unlockedBy: { type: 'subscription', value: 'founding_member' },
    subscriberExclusive: true,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SEASONAL/EVENT SUFFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  spirit: {
    id: 'spirit',
    text: 'Spirit',
    category: 'seasonal',
    rarity: 'rare',
    unlockedBy: { type: 'event', value: 'halloween' },
  },
  star: {
    id: 'star',
    text: 'Star',
    category: 'seasonal',
    rarity: 'rare',
    unlockedBy: { type: 'event', value: 'winter_solstice' },
  },
  flame: {
    id: 'flame',
    text: 'Flame',
    category: 'seasonal',
    rarity: 'rare',
    unlockedBy: { type: 'event', value: 'imbolc' },
  },
  blossom: {
    id: 'blossom',
    text: 'Blossom',
    category: 'seasonal',
    rarity: 'rare',
    unlockedBy: { type: 'event', value: 'beltane' },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TAROT SUIT SUFFIXES (Unlocked by focusing on specific suits)
  // ─────────────────────────────────────────────────────────────────────────────
  wands: {
    id: 'wands',
    text: 'of Wands',
    category: 'tarot',
    rarity: 'rare',
    unlockedBy: { type: 'suit_readings', value: { suit: 'wands', count: 100 } },
  },
  cups: {
    id: 'cups',
    text: 'of Cups',
    category: 'tarot',
    rarity: 'rare',
    unlockedBy: { type: 'suit_readings', value: { suit: 'cups', count: 100 } },
  },
  swords: {
    id: 'swords',
    text: 'of Swords',
    category: 'tarot',
    rarity: 'rare',
    unlockedBy: { type: 'suit_readings', value: { suit: 'swords', count: 100 } },
  },
  pentacles: {
    id: 'pentacles',
    text: 'of Pentacles',
    category: 'tarot',
    rarity: 'rare',
    unlockedBy: { type: 'suit_readings', value: { suit: 'pentacles', count: 100 } },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SPECIAL SUFFIXES
  // ─────────────────────────────────────────────────────────────────────────────
  fool: {
    id: 'fool',
    text: 'Fool',
    category: 'special',
    rarity: 'epic',
    unlockedBy: { type: 'achievement', value: 'drew_fool_22_times' },
  },
  magician: {
    id: 'magician',
    text: 'Magician',
    category: 'special',
    rarity: 'epic',
    unlockedBy: { type: 'achievement', value: 'drew_magician_22_times' },
  },
  priestess: {
    id: 'priestess',
    text: 'Priestess',
    category: 'special',
    rarity: 'epic',
    unlockedBy: { type: 'achievement', value: 'drew_high_priestess_22_times' },
  },
  empress: {
    id: 'empress',
    text: 'Empress',
    category: 'special',
    rarity: 'epic',
    unlockedBy: { type: 'achievement', value: 'drew_empress_22_times' },
  },
  emperor: {
    id: 'emperor',
    text: 'Emperor',
    category: 'special',
    rarity: 'epic',
    unlockedBy: { type: 'achievement', value: 'drew_emperor_22_times' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// RARITY COLORS
// ═══════════════════════════════════════════════════════════════════════════════

export const TITLE_RARITY = {
  common: { color: '#9E9E9E', name: 'Common' },
  rare: { color: '#2196F3', name: 'Rare' },
  epic: { color: '#9C27B0', name: 'Epic' },
  legendary: { color: '#FF9800', name: 'Legendary' },
  mythic: { color: '#E91E63', name: 'Mythic' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all title prefixes
 */
export function getAllPrefixes() {
  return Object.values(TITLE_PREFIXES);
}

/**
 * Get all title suffixes
 */
export function getAllSuffixes() {
  return Object.values(TITLE_SUFFIXES);
}

/**
 * Combine prefix and suffix into display title
 */
export function formatTitle(prefixId, suffixId) {
  const prefix = TITLE_PREFIXES[prefixId];
  const suffix = TITLE_SUFFIXES[suffixId];

  if (!prefix || !suffix) {
    return 'Unknown Title';
  }

  return `${prefix.text} ${suffix.text}`;
}

/**
 * Get the rarity of a combined title (highest of the two parts)
 */
export function getTitleRarity(prefixId, suffixId) {
  const prefix = TITLE_PREFIXES[prefixId];
  const suffix = TITLE_SUFFIXES[suffixId];

  const rarityOrder = ['common', 'rare', 'epic', 'legendary', 'mythic'];

  const prefixRank = rarityOrder.indexOf(prefix?.rarity || 'common');
  const suffixRank = rarityOrder.indexOf(suffix?.rarity || 'common');

  return rarityOrder[Math.max(prefixRank, suffixRank)];
}

/**
 * Get color for a combined title
 */
export function getTitleColor(prefixId, suffixId) {
  const rarity = getTitleRarity(prefixId, suffixId);
  return TITLE_RARITY[rarity]?.color || TITLE_RARITY.common.color;
}

/**
 * Calculate total possible combinations
 */
export function getTotalCombinations() {
  return getAllPrefixes().length * getAllSuffixes().length;
}

/**
 * Get titles by category
 */
export function getTitlesByCategory(category) {
  return {
    prefixes: Object.values(TITLE_PREFIXES).filter(p => p.category === category),
    suffixes: Object.values(TITLE_SUFFIXES).filter(s => s.category === category),
  };
}

export default {
  TITLE_PREFIXES,
  TITLE_SUFFIXES,
  TITLE_RARITY,
  formatTitle,
  getTitleRarity,
  getTitleColor,
  getTotalCombinations,
  getAllPrefixes,
  getAllSuffixes,
  getTitlesByCategory,
};
