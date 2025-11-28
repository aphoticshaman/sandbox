/**
 * REWARDED CONTENT SERVICE (Web)
 *
 * Watch promo videos → earn CURRENCY for the shop.
 * NOT for Vera chats. Vera is premium or 1/day. Period.
 *
 * HOW IT WORKS:
 * 1. User watches a short promo video (feature showcase, tip, etc.)
 * 2. Must watch minimum duration (15 seconds)
 * 3. Earn currency (gems) to spend in shop on cosmetics
 *
 * LIMITS:
 * - Max 5 videos per day
 * - 15 min cooldown between watches
 * - 10-25 gems per video (varies by video type)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const REWARD_STATE_KEY = '@veilpath_video_rewards';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const REWARD_CONFIG = {
  maxPerDay: 5,              // Maximum video watches per day
  cooldownMinutes: 15,       // Minutes between video watches
  minWatchSeconds: 15,       // Minimum seconds to watch for reward
  baseReward: 15,            // Base currency per video
  bonusReward: 10,           // Extra for certain video types
};

// ═══════════════════════════════════════════════════════════════
// PROMO VIDEO CATALOG
// Host on YouTube (unlisted) or your own CDN
// ═══════════════════════════════════════════════════════════════

export const PROMO_VIDEOS = [
  {
    id: 'feature_vera',
    title: 'Meet Vera',
    description: 'Your AI life coach companion',
    duration: 20,
    url: 'https://your-cdn.com/promos/meet-vera.mp4',
    thumbnail: 'https://your-cdn.com/promos/meet-vera-thumb.jpg',
    type: 'feature',
    reward: 15,  // gems
  },
  {
    id: 'feature_readings',
    title: 'Tarot Readings',
    description: 'Discover your daily guidance',
    duration: 25,
    url: 'https://your-cdn.com/promos/tarot-readings.mp4',
    thumbnail: 'https://your-cdn.com/promos/readings-thumb.jpg',
    type: 'feature',
    reward: 15,
  },
  {
    id: 'tip_intention',
    title: 'Setting Intentions',
    description: 'Get more from your readings',
    duration: 18,
    url: 'https://your-cdn.com/promos/setting-intentions.mp4',
    thumbnail: 'https://your-cdn.com/promos/intentions-thumb.jpg',
    type: 'tip',
    reward: 20,  // Tips worth more
  },
  {
    id: 'meditation_breath',
    title: 'Quick Breath',
    description: '15 second breathing moment',
    duration: 15,
    url: 'https://your-cdn.com/promos/quick-breath.mp4',
    thumbnail: 'https://your-cdn.com/promos/breath-thumb.jpg',
    type: 'meditation',
    reward: 25,  // Meditation worth most (actual value)
  },
  {
    id: 'upgrade_showcase',
    title: 'Premium Features',
    description: 'See what subscribers unlock',
    duration: 22,
    url: 'https://your-cdn.com/promos/premium-features.mp4',
    thumbnail: 'https://your-cdn.com/promos/premium-thumb.jpg',
    type: 'upgrade',
    reward: 10,  // Less reward - it's basically an ad for premium
  },
];

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Get current reward state
 */
export async function getRewardState() {
  try {
    const data = await AsyncStorage.getItem(REWARD_STATE_KEY);
    if (data) {
      const state = JSON.parse(data);

      // Reset daily counters if new day
      const today = new Date().toDateString();
      if (state.lastResetDate !== today) {
        state.watchedToday = 0;
        state.currencyEarnedToday = 0;
        state.lastResetDate = today;
        state.videosWatchedToday = [];
        await saveRewardState(state);
      }

      return state;
    }

    // Initialize new state
    const initialState = {
      watchedToday: 0,
      currencyEarnedToday: 0,
      lastWatchTime: null,
      lastResetDate: new Date().toDateString(),
      videosWatchedToday: [],
      totalVideosWatched: 0,
      totalCurrencyEarned: 0,
    };
    await saveRewardState(initialState);
    return initialState;

  } catch (error) {
    console.error('[RewardedContent] Error loading state:', error);
    return null;
  }
}

/**
 * Save reward state
 */
async function saveRewardState(state) {
  try {
    await AsyncStorage.setItem(REWARD_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[RewardedContent] Error saving state:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
// AVAILABILITY CHECKS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if user can watch a video for currency
 */
export async function canWatchForReward() {
  const state = await getRewardState();
  if (!state) {
    return { canWatch: false, reason: 'error' };
  }

  // Check daily limit
  if (state.watchedToday >= REWARD_CONFIG.maxPerDay) {
    return {
      canWatch: false,
      reason: 'daily_limit',
      message: `You've watched ${REWARD_CONFIG.maxPerDay} videos today. Come back tomorrow!`,
    };
  }

  // Check cooldown
  if (state.lastWatchTime) {
    const cooldownMs = REWARD_CONFIG.cooldownMinutes * 60 * 1000;
    const timeSinceLastWatch = Date.now() - state.lastWatchTime;

    if (timeSinceLastWatch < cooldownMs) {
      const remainingMs = cooldownMs - timeSinceLastWatch;
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

      return {
        canWatch: false,
        reason: 'cooldown',
        cooldownRemaining: remainingMinutes,
        cooldownMs: remainingMs,
        message: `Wait ${remainingMinutes} min before watching another video.`,
      };
    }
  }

  return {
    canWatch: true,
    remaining: REWARD_CONFIG.maxPerDay - state.watchedToday,
  };
}

// ═══════════════════════════════════════════════════════════════
// VIDEO SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Get next video to show (prioritize unwatched, vary content)
 */
export async function getNextVideo() {
  const state = await getRewardState();
  const watchedIds = state?.videosWatchedToday || [];

  // Try to find unwatched video first
  const unwatched = PROMO_VIDEOS.filter(v => !watchedIds.includes(v.id));

  if (unwatched.length > 0) {
    return unwatched[Math.floor(Math.random() * unwatched.length)];
  }

  // All watched today, return random one
  return PROMO_VIDEOS[Math.floor(Math.random() * PROMO_VIDEOS.length)];
}

/**
 * Get video by ID
 */
export function getVideoById(videoId) {
  return PROMO_VIDEOS.find(v => v.id === videoId);
}

// ═══════════════════════════════════════════════════════════════
// VIDEO WATCHING & CURRENCY REWARDS
// ═══════════════════════════════════════════════════════════════

/**
 * Start watching a video
 */
export async function startWatching(videoId) {
  const canWatch = await canWatchForReward();
  if (!canWatch.canWatch) {
    return { success: false, error: canWatch.message };
  }

  const video = getVideoById(videoId);
  if (!video) {
    return { success: false, error: 'Video not found' };
  }

  const sessionId = `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    success: true,
    sessionId,
    video,
    minWatchSeconds: REWARD_CONFIG.minWatchSeconds,
    reward: video.reward,
    message: `Watch for ${REWARD_CONFIG.minWatchSeconds}s to earn ${video.reward} gems!`,
  };
}

/**
 * Complete watching - grant currency reward
 * @param {string} videoId - Video that was watched
 * @param {number} watchedSeconds - Actual seconds watched
 * @returns {Promise<{success: boolean, currencyEarned?: number, ...}>}
 */
export async function completeWatching(videoId, watchedSeconds) {
  const video = getVideoById(videoId);
  if (!video) {
    return { success: false, error: 'Unknown video' };
  }

  // Validate minimum watch time
  if (watchedSeconds < REWARD_CONFIG.minWatchSeconds) {
    return {
      success: false,
      error: 'incomplete',
      message: `Watch at least ${REWARD_CONFIG.minWatchSeconds} seconds to earn gems.`,
      watchedSeconds,
      required: REWARD_CONFIG.minWatchSeconds,
    };
  }

  // Double-check can still claim
  const canWatch = await canWatchForReward();
  if (!canWatch.canWatch) {
    return { success: false, error: canWatch.message };
  }

  // Grant currency reward
  const state = await getRewardState();
  const currencyEarned = video.reward;

  state.watchedToday += 1;
  state.currencyEarnedToday += currencyEarned;
  state.lastWatchTime = Date.now();
  state.totalVideosWatched += 1;
  state.totalCurrencyEarned += currencyEarned;

  if (!state.videosWatchedToday.includes(videoId)) {
    state.videosWatchedToday.push(videoId);
  }

  await saveRewardState(state);

  return {
    success: true,
    currencyEarned,
    currencyType: 'gems',
    remainingWatches: REWARD_CONFIG.maxPerDay - state.watchedToday,
    totalEarnedToday: state.currencyEarnedToday,
    message: `+${currencyEarned} gems!`,
  };
}

// ═══════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get full status for UI display
 */
export async function getRewardStatus() {
  const state = await getRewardState();
  const canWatch = await canWatchForReward();
  const nextVideo = await getNextVideo();

  return {
    ...canWatch,
    watchedToday: state?.watchedToday || 0,
    maxPerDay: REWARD_CONFIG.maxPerDay,
    currencyEarnedToday: state?.currencyEarnedToday || 0,
    cooldownMinutes: REWARD_CONFIG.cooldownMinutes,
    minWatchSeconds: REWARD_CONFIG.minWatchSeconds,
    totalVideosWatched: state?.totalVideosWatched || 0,
    totalCurrencyEarned: state?.totalCurrencyEarned || 0,
    nextVideo,
    nextReward: nextVideo?.reward || REWARD_CONFIG.baseReward,
  };
}

/**
 * Get UI text for reward button
 */
export async function getRewardButtonText() {
  const canWatch = await canWatchForReward();
  const nextVideo = await getNextVideo();

  if (!canWatch.canWatch) {
    if (canWatch.reason === 'cooldown') {
      return {
        text: `Available in ${canWatch.cooldownRemaining}m`,
        disabled: true,
        subtext: 'Cooldown active',
      };
    }
    if (canWatch.reason === 'daily_limit') {
      return {
        text: 'Come back tomorrow',
        disabled: true,
        subtext: `${REWARD_CONFIG.maxPerDay}/${REWARD_CONFIG.maxPerDay} watched`,
      };
    }
  }

  return {
    text: `Watch & Earn ${nextVideo?.reward || 15} Gems`,
    disabled: false,
    subtext: `${canWatch.remaining} remaining today`,
    icon: '💎',
  };
}

/**
 * Get potential daily earnings
 */
export function getPotentialDailyEarnings() {
  const total = PROMO_VIDEOS.reduce((sum, v) => sum + v.reward, 0);
  const average = Math.round(total / PROMO_VIDEOS.length);

  return {
    perVideo: average,
    maxDaily: average * REWARD_CONFIG.maxPerDay,
    videos: REWARD_CONFIG.maxPerDay,
  };
}

/**
 * Reset state for testing
 */
export async function resetRewardStateForTesting() {
  await AsyncStorage.removeItem(REWARD_STATE_KEY);
}
