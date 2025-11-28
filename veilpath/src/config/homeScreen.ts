/**
 * HOME SCREEN CONFIGURATION
 *
 * The "not card of the day" home - a dynamic hub showing:
 * - Daily message (inspirational, not a card)
 * - Weekly quests with progress
 * - Current events & holiday content
 * - Quarterly contest
 * - Seasonal events with rewards/achievements
 * - Achievement progress and unlocks
 *
 * All content rotates on schedule defined in dailyRotation.ts
 */

import { Rarity } from './cosmeticsTypes';
import { SignificatorAnimation } from './significatorSystem';

// =============================================================================
// DAILY MESSAGE SYSTEM
// =============================================================================

export interface DailyMessage {
  id: string;
  date: string; // YYYY-MM-DD
  message: string;
  author?: string;
  category: DailyMessageCategory;
  theme?: string; // For seasonal theming
  actionPrompt?: string; // Call to action
  relatedQuestId?: string;
}

export type DailyMessageCategory =
  | 'inspiration'
  | 'reflection'
  | 'mindfulness'
  | 'growth'
  | 'gratitude'
  | 'intention'
  | 'seasonal'
  | 'community';

// Sample daily messages (in production, from database)
export const SAMPLE_DAILY_MESSAGES: DailyMessage[] = [
  {
    id: 'dm_001',
    date: '2025-11-27',
    message: 'Today, notice the small moments of beauty that usually slip by unobserved. The steam rising from your morning cup. The quality of light through a window. These moments are gifts.',
    category: 'mindfulness',
    actionPrompt: 'Take a breath and observe',
  },
  {
    id: 'dm_002',
    date: '2025-11-28',
    message: 'Every ending carries the seed of a new beginning. What are you ready to release to make room for what wants to emerge?',
    category: 'reflection',
    actionPrompt: 'Journal your thoughts',
    relatedQuestId: 'quest_journaling_weekly',
  },
  {
    id: 'dm_003',
    date: '2025-11-29',
    message: 'You are not your thoughts. You are the awareness that notices them. Today, practice being the observer.',
    category: 'mindfulness',
    actionPrompt: 'Begin a reading with intention',
  },
];

// =============================================================================
// WEEKLY QUESTS
// =============================================================================

export interface WeeklyQuest {
  id: string;
  name: string;
  description: string;
  category: QuestCategory;
  weekNumber: number; // Week of year (1-52)
  year: number;

  // Requirements
  objectives: QuestObjective[];
  totalProgress: number;

  // Rewards
  rewards: QuestReward[];
  bonusRewards?: QuestReward[]; // For completing all objectives

  // Timing
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;

  // Display
  iconPath: string;
  accentColor: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type QuestCategory =
  | 'readings'
  | 'journaling'
  | 'learning'
  | 'community'
  | 'collection'
  | 'exploration'
  | 'seasonal';

export interface QuestObjective {
  id: string;
  description: string;
  target: number;
  progress: number; // User's current progress
  type: QuestObjectiveType;
  metadata?: Record<string, any>;
}

export type QuestObjectiveType =
  | 'complete_readings'
  | 'complete_spread_type'
  | 'journal_entries'
  | 'use_significator'
  | 'collect_cards'
  | 'streak_days'
  | 'share_reading'
  | 'explore_cards'
  | 'use_cosmetic';

export interface QuestReward {
  type: 'shards' | 'cosmetic' | 'animation' | 'achievement_progress' | 'xp' | 'title';
  amount?: number;
  itemId?: string;
  rarity?: Rarity;
}

// Sample weekly quests
export const SAMPLE_WEEKLY_QUESTS: WeeklyQuest[] = [
  {
    id: 'quest_weekly_2025_48',
    name: 'Seeker\'s Journey',
    description: 'Embrace your path of self-discovery this week',
    category: 'readings',
    weekNumber: 48,
    year: 2025,
    objectives: [
      { id: 'obj_1', description: 'Complete 3 readings', target: 3, progress: 0, type: 'complete_readings' },
      { id: 'obj_2', description: 'Use a significator in 1 reading', target: 1, progress: 0, type: 'use_significator' },
      { id: 'obj_3', description: 'Journal about a reading', target: 1, progress: 0, type: 'journal_entries' },
    ],
    totalProgress: 0,
    rewards: [
      { type: 'shards', amount: 50 },
      { type: 'xp', amount: 100 },
    ],
    bonusRewards: [
      { type: 'cosmetic', itemId: 'card_back_seeker', rarity: 'rare' },
    ],
    startsAt: new Date('2025-11-25'),
    endsAt: new Date('2025-12-01'),
    isActive: true,
    iconPath: '/assets/quests/icons/seeker.png',
    accentColor: '#7B68EE',
    difficulty: 'easy',
  },
  {
    id: 'quest_weekly_2025_48_hard',
    name: 'Celtic Mysteries',
    description: 'Master the ancient Celtic Cross spread',
    category: 'readings',
    weekNumber: 48,
    year: 2025,
    objectives: [
      { id: 'obj_1', description: 'Complete 2 Celtic Cross readings', target: 2, progress: 0, type: 'complete_spread_type', metadata: { spreadType: 'celtic_cross' } },
      { id: 'obj_2', description: 'Maintain a 5-day streak', target: 5, progress: 0, type: 'streak_days' },
      { id: 'obj_3', description: 'Explore 10 Major Arcana cards', target: 10, progress: 0, type: 'explore_cards', metadata: { suit: 'major' } },
    ],
    totalProgress: 0,
    rewards: [
      { type: 'shards', amount: 150 },
      { type: 'xp', amount: 250 },
    ],
    bonusRewards: [
      { type: 'animation', itemId: 'sig_anim_celtic_mist', rarity: 'epic' },
      { type: 'title', itemId: 'title_celtic_adept' },
    ],
    startsAt: new Date('2025-11-25'),
    endsAt: new Date('2025-12-01'),
    isActive: true,
    iconPath: '/assets/quests/icons/celtic.png',
    accentColor: '#228B22',
    difficulty: 'hard',
  },
];

// =============================================================================
// CURRENT EVENTS & HOLIDAYS
// =============================================================================

export interface CurrentEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;

  // Timing
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;

  // Content
  specialContent?: SpecialContent;
  featuredItems?: FeaturedItem[];
  limitedQuests?: string[]; // Quest IDs

  // Display
  bannerPath: string;
  thumbnailPath: string;
  accentColor: string;
  priority: number; // Higher = shown first

  // Rewards available during event
  exclusiveRewards?: EventReward[];
}

export type EventType =
  | 'holiday'
  | 'seasonal'
  | 'community'
  | 'sale'
  | 'new_content'
  | 'anniversary'
  | 'limited';

export interface SpecialContent {
  type: 'daily_message_theme' | 'special_spread' | 'collection_spotlight' | 'lore_chapter';
  contentId: string;
  description: string;
}

export interface FeaturedItem {
  itemId: string;
  itemType: 'cosmetic' | 'deck' | 'animation' | 'bundle';
  discount?: number; // Percentage off
  isNew: boolean;
  isExclusive: boolean;
}

export interface EventReward {
  id: string;
  name: string;
  description: string;
  type: 'cosmetic' | 'animation' | 'title' | 'badge' | 'currency';
  itemId: string;
  rarity: Rarity;
  unlockMethod: 'login' | 'quest' | 'purchase' | 'challenge';
  requirement?: string;
}

// Sample events
export const SAMPLE_EVENTS: CurrentEvent[] = [
  {
    id: 'event_thanksgiving_2025',
    name: 'Gratitude Week',
    description: 'A time to reflect on blessings and abundance',
    type: 'holiday',
    startsAt: new Date('2025-11-24'),
    endsAt: new Date('2025-11-30'),
    isActive: true,
    specialContent: {
      type: 'daily_message_theme',
      contentId: 'gratitude_messages',
      description: 'Special gratitude-themed daily messages',
    },
    featuredItems: [
      { itemId: 'card_back_harvest', itemType: 'cosmetic', discount: 20, isNew: false, isExclusive: false },
      { itemId: 'deck_autumn_gold', itemType: 'deck', discount: 15, isNew: true, isExclusive: false },
    ],
    bannerPath: '/assets/events/banners/gratitude_2025.png',
    thumbnailPath: '/assets/events/thumbs/gratitude_2025.jpg',
    accentColor: '#D2691E',
    priority: 10,
    exclusiveRewards: [
      {
        id: 'reward_gratitude_back',
        name: 'Harvest Moon Card Back',
        description: 'A card back featuring the autumn harvest moon',
        type: 'cosmetic',
        itemId: 'card_back_harvest_moon_2025',
        rarity: 'rare',
        unlockMethod: 'login',
        requirement: 'Login during Gratitude Week',
      },
    ],
  },
];

// =============================================================================
// QUARTERLY CONTEST
// =============================================================================

export interface QuarterlyContest {
  id: string;
  name: string;
  description: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;

  // Timing
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  daysRemaining: number;

  // Contest details
  challengeType: ContestChallengeType;
  leaderboard: LeaderboardEntry[];
  totalParticipants: number;

  // Tiers and rewards
  rewardTiers: ContestRewardTier[];

  // User's position
  userRank?: number;
  userScore?: number;
  userTier?: string;

  // Display
  bannerPath: string;
  trophyPath: string;
  accentColor: string;
}

export type ContestChallengeType =
  | 'most_readings'
  | 'longest_streak'
  | 'most_journals'
  | 'community_engagement'
  | 'collection_completion'
  | 'creative_submission';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarPath: string;
  score: number;
  tier: string;
}

export interface ContestRewardTier {
  tierName: string;
  rankRange: [number, number] | [number, null]; // [1, 10] or [100, null] for 100+
  percentileRange?: [number, number]; // Top 1%, top 10%, etc.
  rewards: EventReward[];
  badgePath: string;
}

// Sample quarterly contest
export const SAMPLE_QUARTERLY_CONTEST: QuarterlyContest = {
  id: 'contest_q4_2025',
  name: 'Winter Wisdom Championship',
  description: 'Prove your dedication and earn legendary rewards',
  quarter: 4,
  year: 2025,
  startsAt: new Date('2025-10-01'),
  endsAt: new Date('2025-12-31'),
  isActive: true,
  daysRemaining: 34,
  challengeType: 'most_readings',
  leaderboard: [
    { rank: 1, userId: 'u_001', displayName: 'MysticSeer', avatarPath: '/avatars/mystic.png', score: 847, tier: 'Diamond' },
    { rank: 2, userId: 'u_002', displayName: 'TarotMaster', avatarPath: '/avatars/master.png', score: 812, tier: 'Diamond' },
    { rank: 3, userId: 'u_003', displayName: 'CardWhisperer', avatarPath: '/avatars/whisper.png', score: 789, tier: 'Diamond' },
  ],
  totalParticipants: 12847,
  rewardTiers: [
    {
      tierName: 'Diamond',
      rankRange: [1, 10],
      rewards: [
        { id: 'r_diamond_anim', name: 'Void Emergence Animation', description: 'Legendary significator animation', type: 'animation', itemId: 'sig_anim_void_emergence', rarity: 'legendary', unlockMethod: 'challenge' },
        { id: 'r_diamond_title', name: 'Winter Champion Title', description: 'Exclusive title', type: 'title', itemId: 'title_winter_champion_2025', rarity: 'legendary', unlockMethod: 'challenge' },
      ],
      badgePath: '/assets/contests/badges/diamond.png',
    },
    {
      tierName: 'Platinum',
      rankRange: [11, 100],
      rewards: [
        { id: 'r_plat_back', name: 'Frost Crystal Card Back', description: 'Epic card back', type: 'cosmetic', itemId: 'card_back_frost_crystal', rarity: 'epic', unlockMethod: 'challenge' },
      ],
      badgePath: '/assets/contests/badges/platinum.png',
    },
    {
      tierName: 'Gold',
      rankRange: [101, 1000],
      rewards: [
        { id: 'r_gold_back', name: 'Winter Glow Card Back', description: 'Rare card back', type: 'cosmetic', itemId: 'card_back_winter_glow', rarity: 'rare', unlockMethod: 'challenge' },
      ],
      badgePath: '/assets/contests/badges/gold.png',
    },
    {
      tierName: 'Silver',
      rankRange: [1001, null],
      percentileRange: [0, 50],
      rewards: [
        { id: 'r_silver_badge', name: 'Winter Participant Badge', description: 'Contest participation badge', type: 'badge', itemId: 'badge_winter_2025', rarity: 'uncommon', unlockMethod: 'challenge' },
      ],
      badgePath: '/assets/contests/badges/silver.png',
    },
  ],
  bannerPath: '/assets/contests/banners/winter_2025.png',
  trophyPath: '/assets/contests/trophies/winter_2025.png',
  accentColor: '#4169E1',
};

// =============================================================================
// SEASONAL EVENTS
// =============================================================================

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  season: Season;
  year: number;

  // Timing
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  daysRemaining: number;

  // Content
  themeColor: string;
  themeGradient: [string, string];
  specialSpreads?: SpecialSpread[];
  seasonalQuests: string[];
  loreChapters?: LoreChapter[];

  // Rewards available until season ends
  seasonalRewards: SeasonalReward[];
  achievementsAvailable: string[]; // Achievement IDs

  // Display
  bannerPath: string;
  backgroundPath: string;
  iconPath: string;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SpecialSpread {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  isSeasonalExclusive: boolean;
}

export interface LoreChapter {
  id: string;
  title: string;
  description: string;
  unlockRequirement: string;
  isUnlocked: boolean;
}

export interface SeasonalReward {
  id: string;
  name: string;
  description: string;
  type: 'cosmetic' | 'animation' | 'deck' | 'avatar' | 'badge';
  itemId: string;
  rarity: Rarity;
  unlockMethod: 'quest' | 'achievement' | 'collection' | 'purchase' | 'login_streak';
  progress: number; // 0-100
  requirement: string;
  expiresWithSeason: boolean;
}

// Sample seasonal event
export const SAMPLE_SEASONAL_EVENT: SeasonalEvent = {
  id: 'season_winter_2025',
  name: 'Winter Solstice',
  description: 'The darkest night brings the return of light. Journey inward as the world rests.',
  season: 'winter',
  year: 2025,
  startsAt: new Date('2025-12-01'),
  endsAt: new Date('2026-02-28'),
  isActive: false, // Not yet
  daysRemaining: 4, // Days until start, or days remaining if active
  themeColor: '#1E3A5F',
  themeGradient: ['#0a1628', '#1E3A5F'],
  specialSpreads: [
    {
      id: 'spread_winter_reflection',
      name: 'Winter Reflection',
      description: 'A 5-card spread for deep introspection during the quiet season',
      cardCount: 5,
      isSeasonalExclusive: true,
    },
    {
      id: 'spread_solstice_journey',
      name: 'Solstice Journey',
      description: 'A 7-card spread marking the transition from darkness to light',
      cardCount: 7,
      isSeasonalExclusive: true,
    },
  ],
  seasonalQuests: ['quest_winter_intro', 'quest_winter_week1', 'quest_winter_week2'],
  loreChapters: [
    { id: 'lore_winter_1', title: 'The Long Night', description: 'Understanding the wisdom of darkness', unlockRequirement: 'Complete intro quest', isUnlocked: false },
    { id: 'lore_winter_2', title: 'Seeds Beneath Snow', description: 'Potential waiting to emerge', unlockRequirement: 'Complete week 1 quest', isUnlocked: false },
  ],
  seasonalRewards: [
    {
      id: 'sr_winter_back',
      name: 'Frost Walker Card Back',
      description: 'An icy card back with animated snowflakes',
      type: 'cosmetic',
      itemId: 'card_back_frost_walker',
      rarity: 'epic',
      unlockMethod: 'quest',
      progress: 0,
      requirement: 'Complete all Winter Solstice weekly quests',
      expiresWithSeason: true,
    },
    {
      id: 'sr_winter_anim',
      name: 'Winter Frost Animation',
      description: 'Significator animation with crystallizing snowflakes',
      type: 'animation',
      itemId: 'sig_anim_winter_frost',
      rarity: 'epic',
      unlockMethod: 'achievement',
      progress: 0,
      requirement: 'Earn the "Winter Walker" achievement',
      expiresWithSeason: true,
    },
    {
      id: 'sr_winter_deck',
      name: 'Solstice Deck',
      description: 'A limited edition deck with winter-themed artwork',
      type: 'deck',
      itemId: 'deck_solstice_2025',
      rarity: 'legendary',
      unlockMethod: 'collection',
      progress: 0,
      requirement: 'Collect all Winter Solstice cosmetics',
      expiresWithSeason: true,
    },
  ],
  achievementsAvailable: ['ach_winter_intro', 'ach_winter_walker', 'ach_winter_master', 'ach_solstice_seeker'],
  bannerPath: '/assets/seasons/banners/winter_2025.png',
  backgroundPath: '/assets/seasons/backgrounds/winter_2025.png',
  iconPath: '/assets/seasons/icons/winter.png',
};

// =============================================================================
// HOME SCREEN STATE
// =============================================================================

export interface HomeScreenState {
  // Daily content
  dailyMessage: DailyMessage | null;
  lastMessageDate: string;

  // Weekly quests
  weeklyQuests: WeeklyQuest[];
  questProgress: Map<string, number>; // questId -> progress %

  // Events
  activeEvents: CurrentEvent[];
  upcomingEvents: CurrentEvent[];

  // Contest
  quarterlyContest: QuarterlyContest | null;

  // Seasonal
  currentSeason: SeasonalEvent | null;
  nextSeason: SeasonalEvent | null;

  // User progress
  userStreak: number;
  totalReadings: number;
  recentAchievements: string[];
  availableRewards: SeasonalReward[];

  // UI state
  isLoading: boolean;
  lastRefresh: Date;
  selectedTab: HomeTab;
}

export type HomeTab = 'overview' | 'quests' | 'events' | 'rewards' | 'contest';

// =============================================================================
// HOME SCREEN ACTIONS
// =============================================================================

export type HomeScreenAction =
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_DAILY_MESSAGE'; message: DailyMessage }
  | { type: 'SET_WEEKLY_QUESTS'; quests: WeeklyQuest[] }
  | { type: 'UPDATE_QUEST_PROGRESS'; questId: string; progress: number }
  | { type: 'SET_ACTIVE_EVENTS'; events: CurrentEvent[] }
  | { type: 'SET_QUARTERLY_CONTEST'; contest: QuarterlyContest }
  | { type: 'SET_SEASONAL_EVENT'; event: SeasonalEvent }
  | { type: 'SET_USER_PROGRESS'; streak: number; readings: number }
  | { type: 'ADD_ACHIEVEMENT'; achievementId: string }
  | { type: 'CLAIM_REWARD'; rewardId: string }
  | { type: 'SELECT_TAB'; tab: HomeTab }
  | { type: 'REFRESH' };

export function homeScreenReducer(
  state: HomeScreenState,
  action: HomeScreenAction
): HomeScreenState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SET_DAILY_MESSAGE':
      return {
        ...state,
        dailyMessage: action.message,
        lastMessageDate: action.message.date,
      };

    case 'SET_WEEKLY_QUESTS':
      return { ...state, weeklyQuests: action.quests };

    case 'UPDATE_QUEST_PROGRESS': {
      const newProgress = new Map(state.questProgress);
      newProgress.set(action.questId, action.progress);
      return { ...state, questProgress: newProgress };
    }

    case 'SET_ACTIVE_EVENTS':
      return { ...state, activeEvents: action.events };

    case 'SET_QUARTERLY_CONTEST':
      return { ...state, quarterlyContest: action.contest };

    case 'SET_SEASONAL_EVENT':
      return { ...state, currentSeason: action.event };

    case 'SET_USER_PROGRESS':
      return {
        ...state,
        userStreak: action.streak,
        totalReadings: action.readings,
      };

    case 'ADD_ACHIEVEMENT':
      return {
        ...state,
        recentAchievements: [...state.recentAchievements, action.achievementId].slice(-5),
      };

    case 'CLAIM_REWARD':
      return {
        ...state,
        availableRewards: state.availableRewards.filter(r => r.id !== action.rewardId),
      };

    case 'SELECT_TAB':
      return { ...state, selectedTab: action.tab };

    case 'REFRESH':
      return { ...state, lastRefresh: new Date() };

    default:
      return state;
  }
}

export function createInitialHomeScreenState(): HomeScreenState {
  return {
    dailyMessage: null,
    lastMessageDate: '',
    weeklyQuests: [],
    questProgress: new Map(),
    activeEvents: [],
    upcomingEvents: [],
    quarterlyContest: null,
    currentSeason: null,
    nextSeason: null,
    userStreak: 0,
    totalReadings: 0,
    recentAchievements: [],
    availableRewards: [],
    isLoading: true,
    lastRefresh: new Date(),
    selectedTab: 'overview',
  };
}

// =============================================================================
// DATA FETCHING HELPERS
// =============================================================================

export interface HomeScreenData {
  dailyMessage: DailyMessage;
  weeklyQuests: WeeklyQuest[];
  activeEvents: CurrentEvent[];
  contest: QuarterlyContest;
  season: SeasonalEvent;
  userProgress: {
    streak: number;
    totalReadings: number;
    questProgress: Record<string, number>;
  };
}

/**
 * Calculate days remaining until a date
 */
export function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days remaining in a period
 */
export function daysRemaining(endDate: Date): number {
  return Math.max(0, daysUntil(endDate));
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Get current week number
 */
export function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

/**
 * Get current quarter
 */
export function getCurrentQuarter(): 1 | 2 | 3 | 4 {
  const month = new Date().getMonth();
  if (month < 3) return 1;
  if (month < 6) return 2;
  if (month < 9) return 3;
  return 4;
}

/**
 * Get current season
 */
export function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month < 5) return 'spring';
  if (month >= 5 && month < 8) return 'summer';
  if (month >= 8 && month < 11) return 'autumn';
  return 'winter';
}

// =============================================================================
// UI SECTION CONFIGS
// =============================================================================

export interface HomeSection {
  id: string;
  title: string;
  icon: string;
  priority: number;
  isCollapsible: boolean;
  defaultExpanded: boolean;
}

export const HOME_SECTIONS: HomeSection[] = [
  { id: 'daily_message', title: 'Today', icon: 'sun', priority: 1, isCollapsible: false, defaultExpanded: true },
  { id: 'streak', title: 'Your Streak', icon: 'flame', priority: 2, isCollapsible: true, defaultExpanded: true },
  { id: 'weekly_quests', title: 'Weekly Quests', icon: 'scroll', priority: 3, isCollapsible: true, defaultExpanded: true },
  { id: 'seasonal', title: 'Season', icon: 'snowflake', priority: 4, isCollapsible: true, defaultExpanded: true },
  { id: 'events', title: 'Events', icon: 'calendar', priority: 5, isCollapsible: true, defaultExpanded: false },
  { id: 'contest', title: 'Contest', icon: 'trophy', priority: 6, isCollapsible: true, defaultExpanded: false },
  { id: 'rewards', title: 'Available Rewards', icon: 'gift', priority: 7, isCollapsible: true, defaultExpanded: false },
];

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  SAMPLE_DAILY_MESSAGES,
  SAMPLE_WEEKLY_QUESTS,
  SAMPLE_EVENTS,
  SAMPLE_QUARTERLY_CONTEST,
  SAMPLE_SEASONAL_EVENT,
  HOME_SECTIONS,
  homeScreenReducer,
  createInitialHomeScreenState,
  daysUntil,
  daysRemaining,
  isToday,
  getCurrentWeekNumber,
  getCurrentQuarter,
  getCurrentSeason,
};
