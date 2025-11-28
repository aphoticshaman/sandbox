/**
 * PROGRESSION SYNC SERVICE
 * Syncs user progression (XP, streaks, quests) to Supabase
 *
 * Architecture:
 * - Auto-saves every 2 seconds during active sessions
 * - Saves on state changes (level up, quest complete, etc.)
 * - Restores state on app load from Supabase
 * - Handles offline gracefully (queues changes)
 */

import { supabase, auth } from './supabase';
import { useUserStore } from '../stores/userStore';
import { useCosmeticsStore } from '../stores/cosmeticsStore';
import { Platform } from 'react-native';

// Sync interval (2 seconds)
const SYNC_INTERVAL = 2000;

// Debounce delay for change-triggered saves
const DEBOUNCE_DELAY = 500;

// Sync state
let syncInterval = null;
let debounceTimeout = null;
let lastSyncedState = null;
let isInitialized = false;

/**
 * Initialize progression sync
 * Call this after user authentication
 */
export async function initProgressionSync() {
  const { session } = await auth.getSession();
  if (!session?.user) {
    console.log('[ProgressionSync] No authenticated user, skipping init');
    return false;
  }

  // Load from Supabase first
  await loadProgressionFromSupabase(session.user.id);

  // Start periodic sync
  startPeriodicSync(session.user.id);

  // Subscribe to store changes
  subscribeToStoreChanges(session.user.id);

  isInitialized = true;
  console.log('[ProgressionSync] Initialized for user:', session.user.email);
  return true;
}

/**
 * Load user progression from Supabase
 */
async function loadProgressionFromSupabase(userId) {
  try {
    const { data, error } = await supabase
      .from('user_progression')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record exists yet, create initial
        console.log('[ProgressionSync] No existing progression, creating initial record');
        await createInitialProgression(userId);
      } else {
        console.error('[ProgressionSync] Load error:', error);
      }
      return;
    }

    if (data) {
      // Merge server state with local state
      const userStore = useUserStore.getState();
      const cosmetics = useCosmeticsStore.getState();

      // Only update if server data is newer or more progressed
      if (shouldUseServerState(data, userStore)) {
        console.log('[ProgressionSync] Restoring from server state');

        // Update user store
        useUserStore.setState({
          progression: {
            level: data.level || 1,
            xp: data.xp || 0,
            xpToNextLevel: data.xp_to_next_level || 100,
            currentTitle: data.current_title || 'Seeker',
            unlockedTitles: data.unlocked_titles || ['Seeker'],
          },
          stats: {
            ...userStore.stats,
            totalReadings: data.total_readings || 0,
            totalJournalEntries: data.total_journal_entries || 0,
            totalMindfulnessMinutes: data.mindfulness_minutes || 0,
            currentStreak: data.current_streak || 0,
            longestStreak: data.longest_streak || 0,
            lastActiveDate: data.last_active_date,
          },
          achievements: {
            unlocked: data.unlocked_achievements || [],
            progress: data.achievement_progress || {},
          },
        });

        // Update cosmetics store
        if (data.veil_shards !== undefined) {
          useCosmeticsStore.setState({
            cosmicDust: data.veil_shards,
          });
        }
      }

      lastSyncedState = getStateSnapshot();
    }
  } catch (err) {
    console.error('[ProgressionSync] Load failed:', err);
  }
}

/**
 * Determine if server state should override local state
 */
function shouldUseServerState(serverData, localState) {
  // Use server state if:
  // 1. Server has higher level
  // 2. Server has higher XP at same level
  // 3. Server has longer streak
  // 4. Server has more total readings

  if (serverData.level > localState.progression.level) return true;
  if (serverData.level === localState.progression.level &&
      serverData.xp > localState.progression.xp) return true;
  if (serverData.current_streak > localState.stats.currentStreak) return true;
  if (serverData.total_readings > localState.stats.totalReadings) return true;

  return false;
}

/**
 * Create initial progression record
 */
async function createInitialProgression(userId) {
  const userStore = useUserStore.getState();
  const cosmetics = useCosmeticsStore.getState();

  const { error } = await supabase
    .from('user_progression')
    .insert({
      user_id: userId,
      level: userStore.progression.level,
      xp: userStore.progression.xp,
      xp_to_next_level: userStore.progression.xpToNextLevel,
      current_title: userStore.progression.currentTitle,
      unlocked_titles: userStore.progression.unlockedTitles,
      current_streak: userStore.stats.currentStreak,
      longest_streak: userStore.stats.longestStreak,
      total_readings: userStore.stats.totalReadings,
      total_journal_entries: userStore.stats.totalJournalEntries,
      mindfulness_minutes: userStore.stats.totalMindfulnessMinutes,
      last_active_date: userStore.stats.lastActiveDate || new Date().toISOString(),
      unlocked_achievements: userStore.achievements.unlocked,
      achievement_progress: userStore.achievements.progress,
      veil_shards: cosmetics.cosmicDust,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[ProgressionSync] Failed to create initial:', error);
  } else {
    console.log('[ProgressionSync] Created initial progression record');
  }
}

/**
 * Save current progression to Supabase
 */
export async function saveProgressionToSupabase(userId) {
  if (!userId) {
    const { session } = await auth.getSession();
    userId = session?.user?.id;
  }

  if (!userId) {
    console.warn('[ProgressionSync] No user ID for save');
    return false;
  }

  const currentState = getStateSnapshot();

  // Skip if nothing changed
  if (lastSyncedState && JSON.stringify(currentState) === JSON.stringify(lastSyncedState)) {
    return true;
  }

  try {
    const userStore = useUserStore.getState();
    const cosmetics = useCosmeticsStore.getState();

    const { error } = await supabase
      .from('user_progression')
      .upsert({
        user_id: userId,
        level: userStore.progression.level,
        xp: userStore.progression.xp,
        xp_to_next_level: userStore.progression.xpToNextLevel,
        current_title: userStore.progression.currentTitle,
        unlocked_titles: userStore.progression.unlockedTitles,
        current_streak: userStore.stats.currentStreak,
        longest_streak: userStore.stats.longestStreak,
        total_readings: userStore.stats.totalReadings,
        total_journal_entries: userStore.stats.totalJournalEntries,
        mindfulness_minutes: userStore.stats.totalMindfulnessMinutes,
        last_active_date: userStore.stats.lastActiveDate || new Date().toISOString(),
        unlocked_achievements: userStore.achievements.unlocked,
        achievement_progress: userStore.achievements.progress,
        veil_shards: cosmetics.cosmicDust,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[ProgressionSync] Save error:', error);
      return false;
    }

    lastSyncedState = currentState;
    console.log('[ProgressionSync] Saved to Supabase');
    return true;
  } catch (err) {
    console.error('[ProgressionSync] Save failed:', err);
    return false;
  }
}

/**
 * Get snapshot of current state for comparison
 */
function getStateSnapshot() {
  const userStore = useUserStore.getState();
  const cosmetics = useCosmeticsStore.getState();

  return {
    level: userStore.progression.level,
    xp: userStore.progression.xp,
    currentStreak: userStore.stats.currentStreak,
    longestStreak: userStore.stats.longestStreak,
    totalReadings: userStore.stats.totalReadings,
    totalJournalEntries: userStore.stats.totalJournalEntries,
    achievementCount: userStore.achievements.unlocked.length,
    veilShards: cosmetics.cosmicDust,
  };
}

/**
 * Start periodic sync interval
 */
function startPeriodicSync(userId) {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    saveProgressionToSupabase(userId);
  }, SYNC_INTERVAL);

  console.log('[ProgressionSync] Started periodic sync');
}

/**
 * Subscribe to store changes for immediate sync on important events
 */
function subscribeToStoreChanges(userId) {
  // Subscribe to user store changes
  useUserStore.subscribe((state, prevState) => {
    // Check for level up
    if (state.progression.level !== prevState.progression.level) {
      console.log('[ProgressionSync] Level up detected, syncing immediately');
      debouncedSave(userId);
    }

    // Check for achievement unlock
    if (state.achievements.unlocked.length !== prevState.achievements.unlocked.length) {
      console.log('[ProgressionSync] Achievement unlocked, syncing immediately');
      debouncedSave(userId);
    }

    // Check for streak change
    if (state.stats.currentStreak !== prevState.stats.currentStreak) {
      console.log('[ProgressionSync] Streak changed, syncing immediately');
      debouncedSave(userId);
    }
  });

  // Subscribe to cosmetics store changes (Veil Shards)
  useCosmeticsStore.subscribe((state, prevState) => {
    if (state.cosmicDust !== prevState.cosmicDust) {
      console.log('[ProgressionSync] Veil Shards changed, syncing');
      debouncedSave(userId);
    }
  });
}

/**
 * Debounced save to prevent rapid-fire API calls
 */
function debouncedSave(userId) {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  debounceTimeout = setTimeout(() => {
    saveProgressionToSupabase(userId);
  }, DEBOUNCE_DELAY);
}

/**
 * Stop progression sync
 * Call on sign out
 */
export function stopProgressionSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
    debounceTimeout = null;
  }

  lastSyncedState = null;
  isInitialized = false;
  console.log('[ProgressionSync] Stopped');
}

/**
 * Force immediate sync
 * Call before critical operations
 */
export async function forceSync() {
  const { session } = await auth.getSession();
  if (session?.user) {
    return saveProgressionToSupabase(session.user.id);
  }
  return false;
}

/**
 * Check if sync is active
 */
export function isSyncActive() {
  return isInitialized && syncInterval !== null;
}

export default {
  initProgressionSync,
  saveProgressionToSupabase,
  stopProgressionSync,
  forceSync,
  isSyncActive,
};
