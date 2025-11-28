/**
 * ACHIEVEMENT/BADGE SYSTEM
 * Flex-worthy milestones that celebrate real progress
 * No arbitrary bullshit - these mean something
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReadingHistory, getCardTracker, getStreakData } from './engagementTracker';

const STORAGE_KEY = '@veilpath_achievements';

/**
 * ACHIEVEMENT DEFINITIONS
 * Each is earned through genuine milestone, not manipulation
 */
export const ACHIEVEMENTS = {
  // Reading Count Milestones
  first_reading: {
    id: 'first_reading',
    name: 'First Step',
    description: 'Completed your first reading',
    icon: '◈',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },
  ten_readings: {
    id: 'ten_readings',
    name: 'Seeking Clarity',
    description: 'Completed 10 readings',
    icon: '▲',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },
  fifty_readings: {
    id: 'fifty_readings',
    name: 'Dedicated Seeker',
    description: 'Completed 50 readings',
    icon: '◉',
    color: 'hiMagenta',
    tier: 'silver',
    shareWorthy: true,
  },
  hundred_readings: {
    id: 'hundred_readings',
    name: 'Mystic Scholar',
    description: 'Completed 100 readings',
    icon: '✦',
    color: 'hiYellow',
    tier: 'gold',
    shareWorthy: true,
  },
  two_fifty_readings: {
    id: 'two_fifty_readings',
    name: 'Vera',
    description: 'Completed 250 readings',
    icon: '⚡',
    color: 'hiGreen',
    tier: 'platinum',
    shareWorthy: true,
  },

  // Streak Milestones
  week_streak: {
    id: 'week_streak',
    name: '7-Day Journey',
    description: '7-day reading streak',
    icon: '◇',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },
  two_week_streak: {
    id: 'two_week_streak',
    name: 'Fortnight Explorer',
    description: '14-day reading streak',
    icon: '◈',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },
  three_week_streak: {
    id: 'three_week_streak',
    name: 'Triple Week',
    description: '21-day reading streak',
    icon: '◆',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },
  month_streak: {
    id: 'month_streak',
    name: 'Moon Cycle',
    description: '30-day reading streak',
    icon: '☾',
    color: 'hiMagenta',
    tier: 'silver',
    shareWorthy: true,
  },
  two_month_streak: {
    id: 'two_month_streak',
    name: 'Bi-Lunar',
    description: '60-day reading streak',
    icon: '☽',
    color: 'hiMagenta',
    tier: 'silver',
    shareWorthy: true,
  },
  quarter_streak: {
    id: 'quarter_streak',
    name: 'Seasonal Devotion',
    description: '90-day reading streak',
    icon: '☀',
    color: 'hiYellow',
    tier: 'gold',
    shareWorthy: true,
  },
  four_month_streak: {
    id: 'four_month_streak',
    name: 'Quad Moon',
    description: '120-day reading streak',
    icon: '◐',
    color: 'hiYellow',
    tier: 'gold',
    shareWorthy: true,
  },
  five_month_streak: {
    id: 'five_month_streak',
    name: 'Pentacle Path',
    description: '150-day reading streak',
    icon: '◑',
    color: 'hiYellow',
    tier: 'gold',
    shareWorthy: true,
  },
  six_month_streak: {
    id: 'six_month_streak',
    name: 'Half-Year Seeker',
    description: '180-day reading streak',
    icon: '◒',
    color: 'hiYellow',
    tier: 'gold',
    shareWorthy: true,
  },
  seven_month_streak: {
    id: 'seven_month_streak',
    name: 'Seven Moons',
    description: '210-day reading streak',
    icon: '◓',
    color: 'hiGreen',
    tier: 'gold',
    shareWorthy: true,
  },
  eight_month_streak: {
    id: 'eight_month_streak',
    name: 'Octagonal Journey',
    description: '240-day reading streak',
    icon: '◔',
    color: 'hiGreen',
    tier: 'gold',
    shareWorthy: true,
  },
  nine_month_streak: {
    id: 'nine_month_streak',
    name: 'Hermit\'s Path',
    description: '270-day reading streak',
    icon: '◕',
    color: 'hiGreen',
    tier: 'gold',
    shareWorthy: true,
  },
  ten_month_streak: {
    id: 'ten_month_streak',
    name: 'Wheel Turns',
    description: '300-day reading streak',
    icon: '◖',
    color: 'hiGreen',
    tier: 'gold',
    shareWorthy: true,
  },
  eleven_month_streak: {
    id: 'eleven_month_streak',
    name: 'Eleventh Hour',
    description: '330-day reading streak',
    icon: '◗',
    color: 'hiGreen',
    tier: 'gold',
    shareWorthy: true,
  },
  year_streak: {
    id: 'year_streak',
    name: 'Annual Pilgrim',
    description: '365-day reading streak',
    icon: '∞',
    color: 'hiGreen',
    tier: 'platinum',
    shareWorthy: true,
  },
  two_year_streak: {
    id: 'two_year_streak',
    name: 'Bi-Annual Master',
    description: '730-day reading streak',
    icon: '⚛',
    color: 'hiMagenta',
    tier: 'platinum',
    shareWorthy: true,
  },
  three_year_streak: {
    id: 'three_year_streak',
    name: 'Tri-Annual Sage',
    description: '1095-day reading streak',
    icon: '⚝',
    color: 'hiYellow',
    tier: 'platinum',
    shareWorthy: true,
  },

  // Deck Exploration
  half_deck: {
    id: 'half_deck',
    name: 'Explorer',
    description: 'Encountered 39+ unique cards (50% of deck)',
    icon: '◎',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },
  full_deck: {
    id: 'full_deck',
    name: 'Completionist',
    description: 'Encountered all 78 cards',
    icon: '◉',
    color: 'hiYellow',
    tier: 'gold',
    shareWorthy: true,
  },

  // Special Patterns
  all_major_arcana: {
    id: 'all_major_arcana',
    name: 'Fool\'s Journey',
    description: 'Encountered all 22 Major Arcana',
    icon: '⟨ψ⟩',
    color: 'hiMagenta',
    tier: 'silver',
    shareWorthy: true,
  },
  tower_moment: {
    id: 'tower_moment',
    name: 'Tower Moment',
    description: 'The Tower appeared 5+ times',
    icon: '⚡',
    color: 'hiRed',
    tier: 'bronze',
    shareWorthy: false,
  },
  death_transformation: {
    id: 'death_transformation',
    name: 'Transformation',
    description: 'Death appeared 5+ times - embrace change',
    icon: '☠',
    color: 'dimMagenta',
    tier: 'bronze',
    shareWorthy: false,
  },

  // Time-based
  midnight_reader: {
    id: 'midnight_reader',
    name: 'Midnight Mystic',
    description: '10+ readings between midnight-3am',
    icon: '☾',
    color: 'dimCyan',
    tier: 'bronze',
    shareWorthy: false,
  },
  dawn_reader: {
    id: 'dawn_reader',
    name: 'Dawn Seeker',
    description: '10+ readings between 5am-7am',
    icon: '☀',
    color: 'hiYellow',
    tier: 'bronze',
    shareWorthy: false,
  },

  // Profile-based
  know_thyself: {
    id: 'know_thyself',
    name: 'Know Thyself',
    description: 'Completed MBTI assessment',
    icon: '◈',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },
  vibe_mode_user: {
    id: 'vibe_mode_user',
    name: 'Intuitive Path',
    description: 'Created profile in Vibe Mode (skipped MBTI)',
    icon: '~',
    color: 'hiMagenta',
    tier: 'bronze',
    shareWorthy: false,
  },
  multi_personality: {
    id: 'multi_personality',
    name: 'Multitudes',
    description: 'Created 3+ personality profiles',
    icon: '⚯',
    color: 'hiCyan',
    tier: 'silver',
    shareWorthy: false,
  },

  // Spread variety
  spread_explorer: {
    id: 'spread_explorer',
    name: 'Spread Explorer',
    description: 'Tried 5+ different spread types',
    icon: '◇',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },

  // Reading type variety
  romance_reader: {
    id: 'romance_reader',
    name: 'Heart Reader',
    description: '10+ romance/love readings',
    icon: '♥',
    color: 'hiRed',
    tier: 'bronze',
    shareWorthy: false,
  },
  career_counselor: {
    id: 'career_counselor',
    name: 'Path Finder',
    description: '10+ career/work readings',
    icon: '▲',
    color: 'hiGreen',
    tier: 'bronze',
    shareWorthy: false,
  },

  // Specific powerful cards
  devil_reckoning: {
    id: 'devil_reckoning',
    name: 'Shadow Work',
    description: 'The Devil appeared 5+ times',
    icon: '⧫',
    color: 'hiRed',
    tier: 'bronze',
    shareWorthy: false,
  },
  star_hope: {
    id: 'star_hope',
    name: 'Guided by Stars',
    description: 'The Star appeared 5+ times',
    icon: '✦',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },
  moon_mystery: {
    id: 'moon_mystery',
    name: 'Lunar Guardian',
    description: 'The Moon appeared 5+ times',
    icon: '☾',
    color: 'dimMagenta',
    tier: 'bronze',
    shareWorthy: false,
  },

  // Activity patterns
  daily_devotee: {
    id: 'daily_devotee',
    name: 'Daily Practice',
    description: '3+ readings in one day',
    icon: '◉',
    color: 'hiYellow',
    tier: 'bronze',
    shareWorthy: false,
  },
  weekend_mystic: {
    id: 'weekend_mystic',
    name: 'Weekend Warrior',
    description: '20+ readings on weekends',
    icon: '◈',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },

  // Milestone achievements
  first_share: {
    id: 'first_share',
    name: 'Truth Spreader',
    description: 'Shared your first reading',
    icon: '↗',
    color: 'hiGreen',
    tier: 'bronze',
    shareWorthy: true,
  },
  app_reviewer: {
    id: 'app_reviewer',
    name: 'Voice of Experience',
    description: 'Left a review on the app store',
    icon: '★',
    color: 'hiYellow',
    tier: 'silver',
    shareWorthy: true,
  },

  // Advanced milestones
  five_hundred_readings: {
    id: 'five_hundred_readings',
    name: 'Master Vera',
    description: 'Completed 500 readings',
    icon: '◉',
    color: 'hiMagenta',
    tier: 'platinum',
    shareWorthy: true,
  },
  thousand_readings: {
    id: 'thousand_readings',
    name: 'Eternal Seeker',
    description: 'Completed 1,000 readings - legendary status',
    icon: '✧',
    color: 'hiWhite',
    tier: 'platinum',
    shareWorthy: true,
  },

  // Minor Arcana Suit Collections
  all_wands: {
    id: 'all_wands',
    name: 'Fire Mastery',
    description: 'Encountered all 14 Wands cards',
    icon: '🜂',
    color: 'hiRed',
    tier: 'silver',
    shareWorthy: true,
  },
  all_cups: {
    id: 'all_cups',
    name: 'Water Mastery',
    description: 'Encountered all 14 Cups cards',
    icon: '🜄',
    color: 'hiCyan',
    tier: 'silver',
    shareWorthy: true,
  },
  all_swords: {
    id: 'all_swords',
    name: 'Air Mastery',
    description: 'Encountered all 14 Swords cards',
    icon: '🜁',
    color: 'hiYellow',
    tier: 'silver',
    shareWorthy: true,
  },
  all_pentacles: {
    id: 'all_pentacles',
    name: 'Earth Mastery',
    description: 'Encountered all 14 Pentacles cards',
    icon: '🜃',
    color: 'hiGreen',
    tier: 'silver',
    shareWorthy: true,
  },

  // Court Card Collections
  wands_court: {
    id: 'wands_court',
    name: 'Fire Court',
    description: 'Met all Wands court cards (Page, Knight, Queen, King)',
    icon: '♦',
    color: 'hiRed',
    tier: 'bronze',
    shareWorthy: false,
  },
  cups_court: {
    id: 'cups_court',
    name: 'Water Court',
    description: 'Met all Cups court cards (Page, Knight, Queen, King)',
    icon: '♥',
    color: 'hiCyan',
    tier: 'bronze',
    shareWorthy: false,
  },
  swords_court: {
    id: 'swords_court',
    name: 'Air Court',
    description: 'Met all Swords court cards (Page, Knight, Queen, King)',
    icon: '♠',
    color: 'hiYellow',
    tier: 'bronze',
    shareWorthy: false,
  },
  pentacles_court: {
    id: 'pentacles_court',
    name: 'Earth Court',
    description: 'Met all Pentacles court cards (Page, Knight, Queen, King)',
    icon: '♣',
    color: 'hiGreen',
    tier: 'bronze',
    shareWorthy: false,
  },
  all_court_cards: {
    id: 'all_court_cards',
    name: 'Royal Assembly',
    description: 'Encountered all 16 court cards',
    icon: '♚',
    color: 'hiMagenta',
    tier: 'gold',
    shareWorthy: true,
  },

  // Premium
  premium_unlocked: {
    id: 'premium_unlocked',
    name: 'Patron of the Arts',
    description: 'Unlocked Premium - thank you for supporting indie creators!',
    icon: '✧',
    color: 'hiYellow',
    tier: 'gold',
    shareWorthy: true,
  },

  // Special Recognition
  beta_tester: {
    id: 'beta_tester',
    name: 'Pioneer',
    description: 'Beta tester - helped shape this app from the beginning',
    icon: '⚡',
    color: 'hiMagenta',
    tier: 'platinum',
    shareWorthy: true,
  },

  // Hidden/Secret Achievements
  lightworker_mode: {
    id: 'lightworker_mode',
    name: 'The Seeker',
    description: 'Found the pattern. The doors are open.',
    icon: '◢',
    color: 'hiWhite',
    tier: 'platinum',
    shareWorthy: true,
    hidden: true, // Won't show in locked list
  },
  shut_the_door: {
    id: 'shut_the_door',
    name: 'The Closer',
    description: 'Reversed the pattern. The doors are sealed.',
    icon: '◣',
    color: 'hiRed',
    tier: 'bronze',
    shareWorthy: false,
    hidden: true, // Won't show in locked list
  },
};

/**
 * Check for new achievements based on current data
 * @returns {Promise<array>} Newly unlocked achievements
 */
export async function checkAchievements() {
  try {
    const history = await getReadingHistory();
    const tracker = await getCardTracker();
    const streak = await getStreakData();
    const unlocked = await getUnlockedAchievements();

    const newlyUnlocked = [];

    // Reading count achievements
    if (history.length >= 1 && !unlocked.includes('first_reading')) {
      newlyUnlocked.push(ACHIEVEMENTS.first_reading);
    }
    if (history.length >= 10 && !unlocked.includes('ten_readings')) {
      newlyUnlocked.push(ACHIEVEMENTS.ten_readings);
    }
    if (history.length >= 50 && !unlocked.includes('fifty_readings')) {
      newlyUnlocked.push(ACHIEVEMENTS.fifty_readings);
    }
    if (history.length >= 100 && !unlocked.includes('hundred_readings')) {
      newlyUnlocked.push(ACHIEVEMENTS.hundred_readings);
    }
    if (history.length >= 250 && !unlocked.includes('two_fifty_readings')) {
      newlyUnlocked.push(ACHIEVEMENTS.two_fifty_readings);
    }

    // Streak achievements
    if (streak.longestStreak >= 7 && !unlocked.includes('week_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.week_streak);
    }
    if (streak.longestStreak >= 14 && !unlocked.includes('two_week_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.two_week_streak);
    }
    if (streak.longestStreak >= 21 && !unlocked.includes('three_week_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.three_week_streak);
    }
    if (streak.longestStreak >= 30 && !unlocked.includes('month_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.month_streak);
    }
    if (streak.longestStreak >= 60 && !unlocked.includes('two_month_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.two_month_streak);
    }
    if (streak.longestStreak >= 90 && !unlocked.includes('quarter_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.quarter_streak);
    }
    if (streak.longestStreak >= 120 && !unlocked.includes('four_month_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.four_month_streak);
    }
    if (streak.longestStreak >= 150 && !unlocked.includes('five_month_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.five_month_streak);
    }
    if (streak.longestStreak >= 180 && !unlocked.includes('six_month_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.six_month_streak);
    }
    if (streak.longestStreak >= 210 && !unlocked.includes('seven_month_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.seven_month_streak);
    }
    if (streak.longestStreak >= 240 && !unlocked.includes('eight_month_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.eight_month_streak);
    }
    if (streak.longestStreak >= 270 && !unlocked.includes('nine_month_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.nine_month_streak);
    }
    if (streak.longestStreak >= 300 && !unlocked.includes('ten_month_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.ten_month_streak);
    }
    if (streak.longestStreak >= 330 && !unlocked.includes('eleven_month_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.eleven_month_streak);
    }
    if (streak.longestStreak >= 365 && !unlocked.includes('year_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.year_streak);
    }
    if (streak.longestStreak >= 730 && !unlocked.includes('two_year_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.two_year_streak);
    }
    if (streak.longestStreak >= 1095 && !unlocked.includes('three_year_streak')) {
      newlyUnlocked.push(ACHIEVEMENTS.three_year_streak);
    }

    // Deck exploration
    const uniqueCards = Object.keys(tracker).length;
    if (uniqueCards >= 39 && !unlocked.includes('half_deck')) {
      newlyUnlocked.push(ACHIEVEMENTS.half_deck);
    }
    if (uniqueCards >= 78 && !unlocked.includes('full_deck')) {
      newlyUnlocked.push(ACHIEVEMENTS.full_deck);
    }

    // Major Arcana collection
    const majorArcana = [
      'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
      'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
      'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
      'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World',
    ];
    const majorSeen = majorArcana.filter(card => tracker[card]).length;
    if (majorSeen >= 22 && !unlocked.includes('all_major_arcana')) {
      newlyUnlocked.push(ACHIEVEMENTS.all_major_arcana);
    }

    // Special card patterns
    if (tracker['The Tower']?.appearances >= 5 && !unlocked.includes('tower_moment')) {
      newlyUnlocked.push(ACHIEVEMENTS.tower_moment);
    }
    if (tracker['Death']?.appearances >= 5 && !unlocked.includes('death_transformation')) {
      newlyUnlocked.push(ACHIEVEMENTS.death_transformation);
    }

    // Time-based patterns
    const midnightReadings = history.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 0 && hour < 3;
    }).length;
    if (midnightReadings >= 10 && !unlocked.includes('midnight_reader')) {
      newlyUnlocked.push(ACHIEVEMENTS.midnight_reader);
    }

    const dawnReadings = history.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 5 && hour < 7;
    }).length;
    if (dawnReadings >= 10 && !unlocked.includes('dawn_reader')) {
      newlyUnlocked.push(ACHIEVEMENTS.dawn_reader);
    }

    // Advanced reading milestones
    if (history.length >= 500 && !unlocked.includes('five_hundred_readings')) {
      newlyUnlocked.push(ACHIEVEMENTS.five_hundred_readings);
    }
    if (history.length >= 1000 && !unlocked.includes('thousand_readings')) {
      newlyUnlocked.push(ACHIEVEMENTS.thousand_readings);
    }

    // More special card patterns
    if (tracker['The Devil']?.appearances >= 5 && !unlocked.includes('devil_reckoning')) {
      newlyUnlocked.push(ACHIEVEMENTS.devil_reckoning);
    }
    if (tracker['The Star']?.appearances >= 5 && !unlocked.includes('star_hope')) {
      newlyUnlocked.push(ACHIEVEMENTS.star_hope);
    }
    if (tracker['The Moon']?.appearances >= 5 && !unlocked.includes('moon_mystery')) {
      newlyUnlocked.push(ACHIEVEMENTS.moon_mystery);
    }

    // Minor Arcana suit collections
    const wandsCards = ['Ace of Wands', 'Two of Wands', 'Three of Wands', 'Four of Wands', 'Five of Wands', 'Six of Wands', 'Seven of Wands', 'Eight of Wands', 'Nine of Wands', 'Ten of Wands', 'Page of Wands', 'Knight of Wands', 'Queen of Wands', 'King of Wands'];
    const cupsCards = ['Ace of Cups', 'Two of Cups', 'Three of Cups', 'Four of Cups', 'Five of Cups', 'Six of Cups', 'Seven of Cups', 'Eight of Cups', 'Nine of Cups', 'Ten of Cups', 'Page of Cups', 'Knight of Cups', 'Queen of Cups', 'King of Cups'];
    const swordsCards = ['Ace of Swords', 'Two of Swords', 'Three of Swords', 'Four of Swords', 'Five of Swords', 'Six of Swords', 'Seven of Swords', 'Eight of Swords', 'Nine of Swords', 'Ten of Swords', 'Page of Swords', 'Knight of Swords', 'Queen of Swords', 'King of Swords'];
    const pentaclesCards = ['Ace of Pentacles', 'Two of Pentacles', 'Three of Pentacles', 'Four of Pentacles', 'Five of Pentacles', 'Six of Pentacles', 'Seven of Pentacles', 'Eight of Pentacles', 'Nine of Pentacles', 'Ten of Pentacles', 'Page of Pentacles', 'Knight of Pentacles', 'Queen of Pentacles', 'King of Pentacles'];

    if (wandsCards.every(card => tracker[card]) && !unlocked.includes('all_wands')) {
      newlyUnlocked.push(ACHIEVEMENTS.all_wands);
    }
    if (cupsCards.every(card => tracker[card]) && !unlocked.includes('all_cups')) {
      newlyUnlocked.push(ACHIEVEMENTS.all_cups);
    }
    if (swordsCards.every(card => tracker[card]) && !unlocked.includes('all_swords')) {
      newlyUnlocked.push(ACHIEVEMENTS.all_swords);
    }
    if (pentaclesCards.every(card => tracker[card]) && !unlocked.includes('all_pentacles')) {
      newlyUnlocked.push(ACHIEVEMENTS.all_pentacles);
    }

    // Court card collections
    const wandsCourt = ['Page of Wands', 'Knight of Wands', 'Queen of Wands', 'King of Wands'];
    const cupsCourt = ['Page of Cups', 'Knight of Cups', 'Queen of Cups', 'King of Cups'];
    const swordsCourt = ['Page of Swords', 'Knight of Swords', 'Queen of Swords', 'King of Swords'];
    const pentaclesCourt = ['Page of Pentacles', 'Knight of Pentacles', 'Queen of Pentacles', 'King of Pentacles'];
    const allCourt = [...wandsCourt, ...cupsCourt, ...swordsCourt, ...pentaclesCourt];

    if (wandsCourt.every(card => tracker[card]) && !unlocked.includes('wands_court')) {
      newlyUnlocked.push(ACHIEVEMENTS.wands_court);
    }
    if (cupsCourt.every(card => tracker[card]) && !unlocked.includes('cups_court')) {
      newlyUnlocked.push(ACHIEVEMENTS.cups_court);
    }
    if (swordsCourt.every(card => tracker[card]) && !unlocked.includes('swords_court')) {
      newlyUnlocked.push(ACHIEVEMENTS.swords_court);
    }
    if (pentaclesCourt.every(card => tracker[card]) && !unlocked.includes('pentacles_court')) {
      newlyUnlocked.push(ACHIEVEMENTS.pentacles_court);
    }
    if (allCourt.every(card => tracker[card]) && !unlocked.includes('all_court_cards')) {
      newlyUnlocked.push(ACHIEVEMENTS.all_court_cards);
    }

    // Weekend readings
    const weekendReadings = history.filter(r => {
      const day = new Date(r.timestamp).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    }).length;
    if (weekendReadings >= 20 && !unlocked.includes('weekend_mystic')) {
      newlyUnlocked.push(ACHIEVEMENTS.weekend_mystic);
    }

    // Daily devotee - 3+ readings in one day
    const readingsByDate = {};
    history.forEach(r => {
      const date = new Date(r.timestamp).toDateString();
      readingsByDate[date] = (readingsByDate[date] || 0) + 1;
    });
    const hasThreeInOneDay = Object.values(readingsByDate).some(count => count >= 3);
    if (hasThreeInOneDay && !unlocked.includes('daily_devotee')) {
      newlyUnlocked.push(ACHIEVEMENTS.daily_devotee);
    }

    // Reading type patterns
    const romanceReadings = history.filter(r =>
      r.spreadType?.toLowerCase().includes('love') ||
      r.spreadType?.toLowerCase().includes('romance') ||
      r.spreadType?.toLowerCase().includes('relationship')
    ).length;
    if (romanceReadings >= 10 && !unlocked.includes('romance_reader')) {
      newlyUnlocked.push(ACHIEVEMENTS.romance_reader);
    }

    const careerReadings = history.filter(r =>
      r.spreadType?.toLowerCase().includes('career') ||
      r.spreadType?.toLowerCase().includes('work') ||
      r.spreadType?.toLowerCase().includes('job')
    ).length;
    if (careerReadings >= 10 && !unlocked.includes('career_counselor')) {
      newlyUnlocked.push(ACHIEVEMENTS.career_counselor);
    }

    // Spread variety
    const uniqueSpreads = [...new Set(history.map(r => r.spreadType))].length;
    if (uniqueSpreads >= 5 && !unlocked.includes('spread_explorer')) {
      newlyUnlocked.push(ACHIEVEMENTS.spread_explorer);
    }

    // Save newly unlocked
    if (newlyUnlocked.length > 0) {
      await unlockAchievements(newlyUnlocked.map(a => a.id));
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * Get list of unlocked achievement IDs
 * @returns {Promise<array>}
 */
export async function getUnlockedAchievements() {
  try {
    const unlockedJson = await AsyncStorage.getItem(STORAGE_KEY);
    return unlockedJson ? JSON.parse(unlockedJson) : [];
  } catch (error) {
    console.error('Error getting unlocked achievements:', error);
    return [];
  }
}

/**
 * Unlock achievements
 * @param {array} achievementIds
 */
export async function unlockAchievements(achievementIds) {
  try {
    const unlocked = await getUnlockedAchievements();
    const updated = [...new Set([...unlocked, ...achievementIds])]; // Unique
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error unlocking achievements:', error);
  }
}

/**
 * Get achievements grouped by unlock status
 * @returns {Promise<object>}
 */
export async function getAchievementsGrouped() {
  try {
    const unlocked = await getUnlockedAchievements();

    const grouped = {
      unlocked: [],
      locked: [],
      shareWorthy: [],
    };

    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (unlocked.includes(achievement.id)) {
        grouped.unlocked.push(achievement);
        if (achievement.shareWorthy) {
          grouped.shareWorthy.push(achievement);
        }
      } else {
        // Don't show hidden achievements in locked list
        if (!achievement.hidden) {
          grouped.locked.push(achievement);
        }
      }
    });

    return grouped;
  } catch (error) {
    console.error('Error getting grouped achievements:', error);
    return { unlocked: [], locked: [], shareWorthy: [] };
  }
}

/**
 * Get featured badges for main screen display (max 3)
 * Shows highest tier unlocked achievements
 * @returns {Promise<array>}
 */
export async function getFeaturedBadges() {
  try {
    const grouped = await getAchievementsGrouped();

    // Sort by tier (platinum > gold > silver > bronze)
    const tierOrder = { platinum: 4, gold: 3, silver: 2, bronze: 1 };
    const sorted = grouped.unlocked.sort((a, b) => {
      return tierOrder[b.tier] - tierOrder[a.tier];
    });

    // Return top 3
    return sorted.slice(0, 3);
  } catch (error) {
    console.error('Error getting featured badges:', error);
    return [];
  }
}

/**
 * Clear all achievements (for testing)
 */
export async function clearAchievements() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing achievements:', error);
  }
}
