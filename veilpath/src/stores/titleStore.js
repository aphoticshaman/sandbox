/**
 * Title & Quest Store - Zustand
 *
 * Manages:
 * - Binary title system (prefix + suffix)
 * - Quest progress tracking
 * - Subscriber battle pass
 * - Achievement/milestone unlocks
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { TITLE_PREFIXES, TITLE_SUFFIXES, formatTitle, getTitleColor } from '../config/titles';
import { SUBSCRIBER_QUESTS, getActiveQuests } from '../config/subscriberQuests';

const STORAGE_KEY = '@veilpath_titles_quests';

// ═══════════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════════

const initialState = {
  // Title system
  unlockedPrefixes: ['the', 'aspiring'], // Default unlocked
  unlockedSuffixes: ['seeker', 'wanderer'], // Default unlocked
  equippedPrefix: 'the',
  equippedSuffix: 'seeker',

  // Quest progress
  dailyQuests: {},
  weeklyQuests: {},
  monthlyQuests: {},
  seasonalQuests: {},
  lifetimeQuests: {},

  // Quest reset timestamps
  lastDailyReset: null,
  lastWeeklyReset: null,
  lastMonthlyReset: null,

  // Referral tracking
  referralCount: 0,
  hasBeenReferred: false,
  referredUserSubscribed: false, // For animated card back bonus

  // Meta
  isInitialized: false,
  isSyncing: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════════

export const useTitleStore = create((set, get) => ({
  ...initialState,

  // ─────────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  initializeTitles: async () => {
    try {
      // Load local state
      const stored = Platform.OS === 'web'
        ? localStorage.getItem(STORAGE_KEY)
        : await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const data = JSON.parse(stored);
        set({
          ...data,
          // Always ensure defaults are present
          unlockedPrefixes: [...new Set([...(data.unlockedPrefixes || []), 'the', 'aspiring'])],
          unlockedSuffixes: [...new Set([...(data.unlockedSuffixes || []), 'seeker', 'wanderer'])],
          isInitialized: true,
        });
      }

      // Sync with Supabase
      await get().syncWithServer();

      // Check for quest resets
      get().checkQuestResets();

      set({ isInitialized: true });
    } catch (error) {
      console.error('[TitleStore] Init failed:', error);
      set({ isInitialized: true });
    }
  },

  saveLocal: async () => {
    try {
      const state = get();
      const data = {
        unlockedPrefixes: state.unlockedPrefixes,
        unlockedSuffixes: state.unlockedSuffixes,
        equippedPrefix: state.equippedPrefix,
        equippedSuffix: state.equippedSuffix,
        dailyQuests: state.dailyQuests,
        weeklyQuests: state.weeklyQuests,
        monthlyQuests: state.monthlyQuests,
        lifetimeQuests: state.lifetimeQuests,
        lastDailyReset: state.lastDailyReset,
        lastWeeklyReset: state.lastWeeklyReset,
        lastMonthlyReset: state.lastMonthlyReset,
        referralCount: state.referralCount,
        hasBeenReferred: state.hasBeenReferred,
        referredUserSubscribed: state.referredUserSubscribed,
      };

      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('[TitleStore] Save failed:', error);
    }
  },

  syncWithServer: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ isSyncing: true });

    try {
      // Fetch unlocked title parts
      const { data: titleParts } = await supabase
        .from('user_title_parts')
        .select('part_type, part_id')
        .eq('user_id', user.id);

      if (titleParts) {
        const prefixes = titleParts
          .filter(p => p.part_type === 'prefix')
          .map(p => p.part_id);
        const suffixes = titleParts
          .filter(p => p.part_type === 'suffix')
          .map(p => p.part_id);

        set({
          unlockedPrefixes: [...new Set([...get().unlockedPrefixes, ...prefixes])],
          unlockedSuffixes: [...new Set([...get().unlockedSuffixes, ...suffixes])],
        });
      }

      // Fetch equipped title
      const { data: equipped } = await supabase
        .from('user_equipped_title')
        .select('prefix_id, suffix_id')
        .eq('user_id', user.id)
        .single();

      if (equipped) {
        set({
          equippedPrefix: equipped.prefix_id,
          equippedSuffix: equipped.suffix_id,
        });
      }

      // Fetch referral stats
      const { count: referralCount } = await supabase
        .from('referral_completions')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id);

      const { data: referredBy } = await supabase
        .from('referral_completions')
        .select('referrer_id')
        .eq('referee_id', user.id)
        .single();

      set({
        referralCount: referralCount || 0,
        hasBeenReferred: !!referredBy,
      });

      await get().saveLocal();
    } catch (error) {
      console.error('[TitleStore] Sync failed:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TITLE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get the formatted display title
   */
  getDisplayTitle: () => {
    const state = get();
    return formatTitle(state.equippedPrefix, state.equippedSuffix);
  },

  /**
   * Get title color based on rarity
   */
  getTitleColor: () => {
    const state = get();
    return getTitleColor(state.equippedPrefix, state.equippedSuffix);
  },

  /**
   * Unlock a title part
   */
  unlockTitlePart: async (type, partId, source = 'achievement') => {
    const state = get();
    const array = type === 'prefix' ? 'unlockedPrefixes' : 'unlockedSuffixes';

    // Already unlocked?
    if (state[array].includes(partId)) {
      return { success: false, alreadyUnlocked: true };
    }

    // Unlock locally
    set({ [array]: [...state[array], partId] });

    // Sync to server
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_title_parts').insert({
        user_id: user.id,
        part_type: type,
        part_id: partId,
        unlock_source: source,
      });
    }

    await get().saveLocal();
    return { success: true, type, partId };
  },

  /**
   * Unlock BOTH a prefix and suffix (like D4 style)
   */
  unlockTitlePair: async (prefixId, suffixId, source = 'achievement') => {
    const prefixResult = await get().unlockTitlePart('prefix', prefixId, source);
    const suffixResult = await get().unlockTitlePart('suffix', suffixId, source);

    return {
      prefix: prefixResult,
      suffix: suffixResult,
      anyNew: prefixResult.success || suffixResult.success,
    };
  },

  /**
   * Equip a title combination
   */
  equipTitle: async (prefixId, suffixId) => {
    const state = get();

    // Check if unlocked
    if (!state.unlockedPrefixes.includes(prefixId)) {
      return { success: false, error: 'Prefix not unlocked' };
    }
    if (!state.unlockedSuffixes.includes(suffixId)) {
      return { success: false, error: 'Suffix not unlocked' };
    }

    // Equip locally
    set({
      equippedPrefix: prefixId,
      equippedSuffix: suffixId,
    });

    // Sync to server
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_equipped_title').upsert({
        user_id: user.id,
        prefix_id: prefixId,
        suffix_id: suffixId,
        updated_at: new Date().toISOString(),
      });
    }

    await get().saveLocal();
    return { success: true, title: formatTitle(prefixId, suffixId) };
  },

  /**
   * Get all unlocked prefixes with full data
   */
  getUnlockedPrefixes: () => {
    const state = get();
    return state.unlockedPrefixes
      .map(id => TITLE_PREFIXES[id])
      .filter(Boolean);
  },

  /**
   * Get all unlocked suffixes with full data
   */
  getUnlockedSuffixes: () => {
    const state = get();
    return state.unlockedSuffixes
      .map(id => TITLE_SUFFIXES[id])
      .filter(Boolean);
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // QUEST MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Check and reset quests based on time
   */
  checkQuestResets: () => {
    const state = get();
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Daily reset (every day at midnight)
    if (state.lastDailyReset !== today) {
      set({
        dailyQuests: {},
        lastDailyReset: today,
      });
    }

    // Weekly reset (every Monday)
    const monday = new Date(now);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    const mondayStr = monday.toISOString().split('T')[0];
    if (state.lastWeeklyReset !== mondayStr) {
      set({
        weeklyQuests: {},
        lastWeeklyReset: mondayStr,
      });
    }

    // Monthly reset (1st of each month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStr = monthStart.toISOString().split('T')[0];
    if (state.lastMonthlyReset !== monthStr) {
      set({
        monthlyQuests: {},
        lastMonthlyReset: monthStr,
      });
    }

    get().saveLocal();
  },

  /**
   * Update progress on a quest
   */
  updateQuestProgress: async (questId, increment = 1) => {
    const state = get();

    // Find the quest definition
    let questDef = null;
    let questType = null;

    for (const [type, quests] of Object.entries(SUBSCRIBER_QUESTS)) {
      const found = quests.find(q => q.id === questId);
      if (found) {
        questDef = found;
        questType = type;
        break;
      }
    }

    if (!questDef) {
      console.warn(`[TitleStore] Quest not found: ${questId}`);
      return { success: false, error: 'Quest not found' };
    }

    // Get the right quest storage
    const storageKey = `${questType}Quests`;
    const quests = { ...state[storageKey] };

    // Get current progress
    const current = quests[questId] || { progress: 0, completed: false };

    // Already completed?
    if (current.completed) {
      return { success: false, alreadyCompleted: true };
    }

    // Update progress
    const newProgress = Math.min(current.progress + increment, questDef.requirement.count || 1);
    const justCompleted = newProgress >= (questDef.requirement.count || 1) && !current.completed;

    quests[questId] = {
      progress: newProgress,
      completed: justCompleted || current.completed,
      completedAt: justCompleted ? new Date().toISOString() : current.completedAt,
    };

    set({ [storageKey]: quests });

    // Sync to server
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.rpc('update_quest_progress', {
        p_user_id: user.id,
        p_quest_id: questId,
        p_quest_type: questType === 'lifetime' ? 'lifetime' : questType,
        p_increment: increment,
        p_target: questDef.requirement.count || 1,
      });
    }

    await get().saveLocal();

    return {
      success: true,
      questId,
      newProgress,
      target: questDef.requirement.count || 1,
      justCompleted,
      rewards: justCompleted ? questDef.rewards : null,
    };
  },

  /**
   * Get active quests with progress
   */
  getActiveQuestsWithProgress: (isSubscriber = false) => {
    const state = get();
    const quests = getActiveQuests(isSubscriber);

    return quests.map(quest => {
      const storageKey = `${quest.category}Quests`;
      const progress = state[storageKey]?.[quest.id] || { progress: 0, completed: false };

      return {
        ...quest,
        currentProgress: progress.progress,
        isCompleted: progress.completed,
        completedAt: progress.completedAt,
      };
    });
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // REFERRAL BONUSES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Called when a referred user subscribes
   * Awards the animated "Better Together" card back to BOTH users
   */
  onReferredUserSubscribed: async (referrerId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    // This user is the referee who just subscribed
    // Both get the animated card back

    set({ referredUserSubscribed: true });

    // Award the animated cosmetic to both
    // This would trigger via cosmeticsStore
    return {
      success: true,
      cosmetic: 'better_together_animated',
      awardedTo: [referrerId, user.id],
    };
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TITLE UNLOCK TRIGGERS
  // Check progress and unlock titles based on milestones
  // ─────────────────────────────────────────────────────────────────────────────

  checkTitleUnlocks: async (userProgress) => {
    const {
      level,
      totalReadings,
      totalJournalEntries,
      currentStreak,
      totalMindfulness,
      forumPosts,
      forumLikesReceived,
      referralCount,
      mbtiType,
    } = userProgress;

    const unlocks = [];

    // Check all prefixes
    for (const [id, prefix] of Object.entries(TITLE_PREFIXES)) {
      if (get().unlockedPrefixes.includes(id)) continue;
      if (prefix.unlockedBy === 'default') continue;

      let shouldUnlock = false;
      const req = prefix.unlockedBy;

      switch (req?.type) {
        case 'level':
          shouldUnlock = level >= req.value;
          break;
        case 'readings':
          shouldUnlock = totalReadings >= req.value;
          break;
        case 'journal':
          shouldUnlock = totalJournalEntries >= req.value;
          break;
        case 'streak':
          shouldUnlock = currentStreak >= req.value;
          break;
        case 'mindfulness':
          shouldUnlock = totalMindfulness >= req.value;
          break;
        case 'forum_posts':
          shouldUnlock = forumPosts >= req.value;
          break;
        case 'forum_likes_received':
          shouldUnlock = forumLikesReceived >= req.value;
          break;
        case 'referrals':
          shouldUnlock = referralCount >= req.value;
          break;
        case 'mbti':
          shouldUnlock = req.value.includes(mbtiType);
          break;
      }

      if (shouldUnlock) {
        await get().unlockTitlePart('prefix', id, req?.type || 'milestone');
        unlocks.push({ type: 'prefix', id, data: prefix });
      }
    }

    // Check all suffixes
    for (const [id, suffix] of Object.entries(TITLE_SUFFIXES)) {
      if (get().unlockedSuffixes.includes(id)) continue;
      if (suffix.unlockedBy === 'default') continue;

      let shouldUnlock = false;
      const req = suffix.unlockedBy;

      switch (req?.type) {
        case 'level':
          shouldUnlock = level >= req.value;
          break;
        case 'readings':
          shouldUnlock = totalReadings >= req.value;
          break;
        case 'journal':
          shouldUnlock = totalJournalEntries >= req.value;
          break;
        case 'streak':
          shouldUnlock = currentStreak >= req.value;
          break;
        case 'mindfulness':
          shouldUnlock = totalMindfulness >= req.value;
          break;
        case 'forum_posts':
          shouldUnlock = forumPosts >= req.value;
          break;
        case 'forum_likes_received':
          shouldUnlock = forumLikesReceived >= req.value;
          break;
        case 'referrals':
          shouldUnlock = referralCount >= req.value;
          break;
      }

      if (shouldUnlock) {
        await get().unlockTitlePart('suffix', id, req?.type || 'milestone');
        unlocks.push({ type: 'suffix', id, data: suffix });
      }
    }

    return unlocks;
  },

  /**
   * Reset store (for testing)
   */
  resetStore: async () => {
    set({ ...initialState, isInitialized: true });
    await get().saveLocal();
  },
}));

export default useTitleStore;
