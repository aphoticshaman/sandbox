/**
 * User Store - Zustand
 * Manages user profile, progression, achievements, and skill tree
 *
 * PRIVACY: User profile contains sensitive personal data (MBTI, preferences, etc.)
 * ENCRYPTION IS ALWAYS ON - NOT OPTIONAL:
 * - All profile data is ALWAYS encrypted client-side
 * - MBTI type, display name, preferences - all encrypted
 * - Even if someone steals credentials, they can't read profile data
 * - Cookie theft, session hijack, MITM - all useless without encryption password
 *
 * State:
 * - profile: Basic user info (encrypted)
 * - progression: Level, XP, titles
 * - achievements: Unlocked achievements
 * - skillTree: Skill points, unlocked nodes
 * - stats: Engagement metrics
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/appConstants';
import encryptedStorage from '../services/encryptedStorage';

const STORAGE_KEY = STORAGE_KEYS.USER;

/**
 * Initial user state
 */
const initialState = {
  // Profile
  profile: {
    userId: null,           // Generated on first launch
    createdAt: null,        // ISO timestamp
    displayName: 'Seeker',  // Default title
    mbtiType: null,         // MBTI personality type (e.g., 'INTJ', 'ENFP')
    mbtiSource: null,       // 'test' | 'self-selected' | null
    birthDate: null,        // Full birthdate (YYYY-MM-DD) for birthday celebrations
    birthYear: null,        // For age verification (honor system, legal compliance)
    ageVerifiedAt: null,    // When they confirmed their age
    lastBirthdayCelebrated: null, // Year of last birthday reward (prevent duplicate rewards)
  },

  // Progression (Level 2 Gamification)
  progression: {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,     // XP_required = 100 * (level^1.8)
    currentTitle: 'Seeker',
    unlockedTitles: ['Seeker'],
  },

  // Achievements (Level 3 Gamification)
  achievements: {
    unlocked: [],           // Array of achievement IDs
    progress: {},           // { achievementId: currentProgress }
  },

  // Skill Tree (Level 4 Gamification)
  skillTree: {
    skillPoints: 0,
    unlockedNodes: [],      // Array of node IDs
    activeEffects: [],      // Array of active skill effects
  },

  // Meta-progression (Level 5 Gamification)
  metaProgression: {
    prestigeLevel: 0,
    seasonalPoints: 0,
    currentSeason: null,
  },

  // Statistics
  stats: {
    totalReadings: 0,
    totalJournalEntries: 0,
    totalMindfulnessMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,   // ISO timestamp
    firstReadingDate: null,
    cbtDistortionsIdentified: 0,
    dbtSkillsPracticed: 0,
  },

  // First-time experience flags
  onboarding: {
    completedWelcome: false,
    completedFirstReading: false,
    completedFirstJournal: false,
    completedFirstMindfulness: false,
    seenAchievementsIntro: false,
    seenSkillTreeIntro: false,
  },

  // Legal agreements tracking (GDPR, ToS compliance)
  agreements: {
    termsAccepted: false,
    termsAcceptedAt: null,
    termsVersion: null,           // Track which version they agreed to
    privacyAccepted: false,
    privacyAcceptedAt: null,
    privacyVersion: null,
    cookiesAccepted: null,        // true = opted in, false = opted out, null = not answered
    cookiesAnsweredAt: null,
    communityGuidelinesAccepted: false,  // Forum rules
    communityGuidelinesAcceptedAt: null,
  },

  // Feature unlock gates & quest completion
  // These features are gated behind account setup milestones
  unlocks: {
    // Individual setup steps (all required for community posting)
    emailVerified: false,
    emailVerifiedAt: null,
    mfaEnabled: false,
    mfaEnabledAt: null,
    recoverySetupComplete: false,      // Recovery questions + security image (same quest)
    recoverySetupCompletedAt: null,
    mbtiComplete: false,               // MBTI test or selection
    mbtiCompletedAt: null,
    usernameSet: false,                // Community username set
    usernameSetAt: null,
    ageVerified: false,                // Confirmed 18+ (honor system for legal compliance)
    ageVerifiedAt: null,

    // Feature unlocks (derived from above)
    // Progression (leveling/XP) - unlocked by completing recovery questions + security image
    progressionUnlocked: false,
    progressionUnlockedAt: null,
    // Locker (cosmetics showcase) - unlocked by completing MBTI
    lockerUnlocked: false,
    lockerUnlockedAt: null,
    // Community posting - requires ALL: email + MFA + recovery + MBTI + username
    communityUnlocked: false,
    communityUnlockedAt: null,

    // Quest completion tracking
    firstPostCompleted: false,
    firstPostCompletedAt: null,
  },

  // Forum username (separate from display name, required for community)
  forumUsername: null,

  // Daily card (persists across sessions)
  dailyCard: {
    card: null,        // Card object from drawCards()
    drawnAt: null,     // ISO timestamp of when card was drawn
    revealed: false,   // Whether the card has been flipped/revealed today
  },
};

/**
 * User Store
 */
export const useUserStore = create((set, get) => ({
  ...initialState,

  /**
   * Initialize user (called on app start)
   * Loads from encrypted storage - all profile data is encrypted
   */
  initializeUser: async () => {
    try {
      // Load from encrypted storage (handles decryption automatically)
      const userData = await encryptedStorage.getItem(STORAGE_KEY);

      if (userData) {
        set(userData);
      } else {
        // First-time user
        const newUser = {
          ...initialState,
          profile: {
            ...initialState.profile,
            userId: generateUserId(),
            createdAt: new Date().toISOString(),
          },
        };
        set(newUser);
        await get().saveUser();
      }

      // Update streak
      get().updateStreak();
    } catch (error) {
      console.error('[UserStore] Failed to initialize user:', error);
    }
  },

  /**
   * Save user to encrypted storage
   * ALWAYS encrypts - profile data contains sensitive info (MBTI, preferences)
   */
  saveUser: async () => {
    try {
      const state = get();
      // ALWAYS encrypt - encryption is mandatory
      await encryptedStorage.setItem(STORAGE_KEY, state, true);
    } catch (error) {
      console.error('[UserStore] Failed to save user:', error);
    }
  },

  /**
   * Set MBTI personality type
   * Also unlocks the Locker feature and awards shards for completing the quest
   */
  setMBTIType: (mbtiType, source = 'self-selected') => {
    const state = get();
    const wasAlreadyComplete = state.unlocks.mbtiComplete;

    set({
      profile: {
        ...state.profile,
        mbtiType,
        mbtiSource: source, // 'test' or 'self-selected'
      },
      // Mark MBTI as complete and unlock locker
      unlocks: {
        ...state.unlocks,
        mbtiComplete: true,
        mbtiCompletedAt: state.unlocks.mbtiCompletedAt || new Date().toISOString(),
        lockerUnlocked: true,
        lockerUnlockedAt: state.unlocks.lockerUnlockedAt || new Date().toISOString(),
      },
    });

    get().saveUser();
    get().checkCommunityUnlock(); // Check if all steps complete

    // Award shards for first-time completion (quest reward)
    if (!wasAlreadyComplete) {
      console.log('[UserStore] MBTI + Locker unlocked! Awarding quest reward: 50 shards');
      return {
        questCompleted: 'complete_mbti',
        shardReward: 50,
        newFeature: 'locker',
      };
    }
    return null;
  },

  /**
   * Verify age and set birthdate (honor system for legal compliance)
   * Required for app use, minimum 13 for app, 18 for forums/LLM features
   * @param {string} birthDate - User's birth date (YYYY-MM-DD format)
   * @returns {Object} Result with age bracket
   */
  verifyAge: (birthDate) => {
    const state = get();
    const birth = new Date(birthDate);
    const today = new Date();
    const birthYear = birth.getFullYear();

    // Calculate exact age
    let age = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--; // Haven't had birthday this year yet
    }

    // Minimum 13 to use app at all (COPPA)
    if (age < 13) {
      return {
        allowed: false,
        reason: 'You must be at least 13 years old to use VeilPath.',
        ageBracket: 'underage',
      };
    }

    // 13-17: Can use app but restricted from forums and some LLM features
    const isMinor = age < 18;

    set({
      profile: {
        ...state.profile,
        birthDate,
        birthYear,
        ageVerifiedAt: new Date().toISOString(),
      },
      unlocks: {
        ...state.unlocks,
        ageVerified: !isMinor, // Only 18+ counts for forum unlock
        ageVerifiedAt: new Date().toISOString(),
      },
    });

    get().saveUser();
    get().checkCommunityUnlock();

    console.log(`[UserStore] Age verified: ${age} years old, minor: ${isMinor}`);

    return {
      allowed: true,
      isMinor,
      age,
      ageBracket: isMinor ? 'teen' : 'adult',
      restrictions: isMinor ? ['forums', 'llm_chat'] : [],
    };
  },

  /**
   * Check if user is verified adult (18+)
   */
  isAdult: () => {
    const state = get();
    return state.unlocks.ageVerified;
  },

  /**
   * Check if it's the user's birthday (or if they missed it and need celebration)
   * Called on app start/login
   * @returns {Object|null} Birthday celebration data or null if not birthday
   */
  checkBirthday: () => {
    const state = get();
    const { birthDate, lastBirthdayCelebrated } = state.profile;

    if (!birthDate) return null;

    const today = new Date();
    const currentYear = today.getFullYear();
    const birth = new Date(birthDate);

    // Check if already celebrated this year
    if (lastBirthdayCelebrated === currentYear) {
      return null;
    }

    // Check if birthday is today
    const isBirthdayToday =
      birth.getMonth() === today.getMonth() &&
      birth.getDate() === today.getDate();

    // Check if birthday passed this year but wasn't celebrated
    // (user didn't log in on their birthday)
    const birthdayThisYear = new Date(currentYear, birth.getMonth(), birth.getDate());
    const missedBirthday = !isBirthdayToday && birthdayThisYear <= today && lastBirthdayCelebrated !== currentYear;

    if (isBirthdayToday || missedBirthday) {
      // Calculate their new age
      let age = currentYear - birth.getFullYear();

      // Mark as celebrated
      set({
        profile: {
          ...state.profile,
          lastBirthdayCelebrated: currentYear,
        },
      });
      get().saveUser();

      console.log(`[UserStore] Birthday celebration! Age: ${age}, Missed: ${missedBirthday}`);

      return {
        isBirthday: true,
        age,
        missedBirthday, // If true, show "belated" message
        shardReward: 50, // Birthday bonus!
        showCakeEmoji: true,
        showChampagneToast: true,
        message: missedBirthday
          ? `Belated Happy Birthday! You turned ${age} this year!`
          : `Happy Birthday! You're ${age} today!`,
      };
    }

    return null;
  },

  /**
   * Check if user's birthday is today (for profile cake emoji)
   */
  isBirthdayToday: () => {
    const state = get();
    const { birthDate } = state.profile;

    if (!birthDate) return false;

    const today = new Date();
    const birth = new Date(birthDate);

    return birth.getMonth() === today.getMonth() &&
           birth.getDate() === today.getDate();
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LEGAL AGREEMENT TRACKING
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Accept Terms of Service
   * @param {string} version - ToS version being accepted (e.g., '2024.1')
   */
  acceptTerms: (version = '2024.1') => {
    const state = get();
    set({
      agreements: {
        ...state.agreements,
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: version,
      },
    });
    get().saveUser();
    console.log(`[UserStore] ToS ${version} accepted`);
  },

  /**
   * Accept Privacy Policy
   * @param {string} version - Policy version being accepted
   */
  acceptPrivacyPolicy: (version = '2024.1') => {
    const state = get();
    set({
      agreements: {
        ...state.agreements,
        privacyAccepted: true,
        privacyAcceptedAt: new Date().toISOString(),
        privacyVersion: version,
      },
    });
    get().saveUser();
    console.log(`[UserStore] Privacy Policy ${version} accepted`);
  },

  /**
   * Set cookie consent choice
   * @param {boolean} accepted - true = opt in, false = opt out
   */
  setCookieConsent: (accepted) => {
    const state = get();
    set({
      agreements: {
        ...state.agreements,
        cookiesAccepted: accepted,
        cookiesAnsweredAt: new Date().toISOString(),
      },
    });
    get().saveUser();
    console.log(`[UserStore] Cookie consent: ${accepted ? 'opted in' : 'opted out'}`);
  },

  /**
   * Accept Community Guidelines (required for forum posting)
   */
  acceptCommunityGuidelines: () => {
    const state = get();
    set({
      agreements: {
        ...state.agreements,
        communityGuidelinesAccepted: true,
        communityGuidelinesAcceptedAt: new Date().toISOString(),
      },
    });
    get().saveUser();
    get().checkCommunityUnlock();
    console.log('[UserStore] Community Guidelines accepted');
  },

  /**
   * Check if user has all required agreements
   */
  hasRequiredAgreements: () => {
    const state = get();
    return state.agreements.termsAccepted && state.agreements.privacyAccepted;
  },

  /**
   * Check if user needs to re-accept updated ToS/Privacy
   * @param {string} currentToSVersion - Current ToS version
   * @param {string} currentPrivacyVersion - Current privacy policy version
   */
  needsReAcceptance: (currentToSVersion = '2024.1', currentPrivacyVersion = '2024.1') => {
    const state = get();
    const tosOutdated = state.agreements.termsVersion !== currentToSVersion;
    const privacyOutdated = state.agreements.privacyVersion !== currentPrivacyVersion;
    return tosOutdated || privacyOutdated;
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ACCOUNT SETUP MILESTONES
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Mark email as verified
   * Part of community unlock checklist
   */
  markEmailVerified: () => {
    const state = get();
    if (state.unlocks.emailVerified) return null;

    set({
      unlocks: {
        ...state.unlocks,
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
      },
    });

    get().saveUser();
    get().checkCommunityUnlock();

    console.log('[UserStore] Email verified! Quest reward: 25 shards');
    return {
      questCompleted: 'verify_email',
      shardReward: 25,
    };
  },

  /**
   * Mark MFA as enabled
   * Part of community unlock checklist
   */
  markMFAEnabled: () => {
    const state = get();
    if (state.unlocks.mfaEnabled) return null;

    set({
      unlocks: {
        ...state.unlocks,
        mfaEnabled: true,
        mfaEnabledAt: new Date().toISOString(),
      },
    });

    get().saveUser();
    get().checkCommunityUnlock();

    console.log('[UserStore] MFA enabled! Quest reward: 75 shards');
    return {
      questCompleted: 'enable_mfa',
      shardReward: 75,
    };
  },

  /**
   * Mark recovery setup as complete (questions + security image)
   * Unlocks progression AND is part of community checklist
   */
  markRecoveryComplete: () => {
    const state = get();
    if (state.unlocks.recoverySetupComplete) return null;

    set({
      unlocks: {
        ...state.unlocks,
        recoverySetupComplete: true,
        recoverySetupCompletedAt: new Date().toISOString(),
        progressionUnlocked: true,
        progressionUnlockedAt: new Date().toISOString(),
      },
    });

    get().saveUser();
    get().checkCommunityUnlock();

    console.log('[UserStore] Recovery + Progression unlocked! Quest reward: 100 shards');
    return {
      questCompleted: 'setup_recovery',
      shardReward: 100,
      newFeature: 'leveling',
    };
  },

  /**
   * Set forum username (after validation)
   * Part of community unlock checklist
   */
  setForumUsername: (username) => {
    const state = get();
    const wasAlreadySet = state.unlocks.usernameSet;

    set({
      forumUsername: username,
      unlocks: {
        ...state.unlocks,
        usernameSet: true,
        usernameSetAt: state.unlocks.usernameSetAt || new Date().toISOString(),
      },
    });

    get().saveUser();
    get().checkCommunityUnlock();

    // Award shards for first-time completion
    if (!wasAlreadySet) {
      console.log('[UserStore] Username set! Quest reward: 25 shards');
      return {
        questCompleted: 'set_username',
        shardReward: 25,
      };
    }
    return null;
  },

  /**
   * Check if user needs to set username (for login flow)
   */
  needsUsernameSetup: () => {
    const state = get();
    return !state.unlocks.usernameSet || !state.forumUsername;
  },

  /**
   * Sync username from Supabase profile (on login)
   */
  syncUsernameFromProfile: async () => {
    try {
      const { checkUserHasUsername } = await import('../services/UserProfileService');
      const result = await checkUserHasUsername();

      if (result.hasUsername && result.username) {
        const state = get();
        set({
          forumUsername: result.username,
          unlocks: {
            ...state.unlocks,
            usernameSet: true,
            usernameSetAt: state.unlocks.usernameSetAt || new Date().toISOString(),
          },
        });
        get().saveUser();
        get().checkCommunityUnlock();
      }

      return result;
    } catch (error) {
      console.error('[UserStore] Failed to sync username:', error);
      return { hasUsername: false, needsSetup: true, error: true };
    }
  },

  /**
   * Check if all community requirements are met and unlock if so
   * Requirements: 18+ age + email + MFA + recovery + MBTI + username + guidelines
   */
  checkCommunityUnlock: () => {
    const state = get();

    if (state.unlocks.communityUnlocked) return; // Already unlocked

    const allComplete =
      state.unlocks.ageVerified &&             // Must be 18+
      state.unlocks.emailVerified &&
      state.unlocks.mfaEnabled &&
      state.unlocks.recoverySetupComplete &&
      state.unlocks.mbtiComplete &&
      state.unlocks.usernameSet &&
      state.agreements.communityGuidelinesAccepted;  // Must accept forum rules

    if (allComplete) {
      set({
        unlocks: {
          ...state.unlocks,
          communityUnlocked: true,
          communityUnlockedAt: new Date().toISOString(),
        },
      });

      get().saveUser();
      console.log('[UserStore] Community unlocked! All security requirements met.');
    }
  },

  /**
   * Get community unlock status (for UI checklist)
   */
  getCommunityUnlockStatus: () => {
    const state = get();
    return {
      ageVerified: state.unlocks.ageVerified,
      emailVerified: state.unlocks.emailVerified,
      mfaEnabled: state.unlocks.mfaEnabled,
      recoveryComplete: state.unlocks.recoverySetupComplete,
      mbtiComplete: state.unlocks.mbtiComplete,
      usernameSet: state.unlocks.usernameSet,
      guidelinesAccepted: state.agreements.communityGuidelinesAccepted,
      communityUnlocked: state.unlocks.communityUnlocked,
      // Summary
      stepsComplete: [
        state.unlocks.ageVerified,
        state.unlocks.emailVerified,
        state.unlocks.mfaEnabled,
        state.unlocks.recoverySetupComplete,
        state.unlocks.mbtiComplete,
        state.unlocks.usernameSet,
        state.agreements.communityGuidelinesAccepted,
      ].filter(Boolean).length,
      totalSteps: 7,
    };
  },

  /**
   * Check if user can post in community
   */
  canPostInCommunity: () => {
    return get().unlocks.communityUnlocked;
  },

  /**
   * Check if progression is unlocked
   */
  isProgressionUnlocked: () => {
    return get().unlocks.progressionUnlocked;
  },

  /**
   * Check if locker is unlocked
   */
  isLockerUnlocked: () => {
    return get().unlocks.lockerUnlocked;
  },

  /**
   * Complete first forum post quest
   * Called when user makes their first community post
   */
  completeFirstPostQuest: () => {
    const state = get();

    if (state.unlocks.firstPostCompleted) {
      return null; // Already completed
    }

    // Must have community unlocked to post
    if (!state.unlocks.communityUnlocked) {
      console.warn('[UserStore] Cannot complete first post quest - community not unlocked');
      return null;
    }

    set({
      unlocks: {
        ...state.unlocks,
        firstPostCompleted: true,
        firstPostCompletedAt: new Date().toISOString(),
      },
    });

    get().saveUser();

    console.log('[UserStore] First post quest completed! Awarding reward: 25 shards');

    return {
      questCompleted: 'first_forum_post',
      shardReward: 25,
      titleUnlocked: 'voice_awakened', // From title system
    };
  },

  /**
   * Award XP (with multipliers)
   * GATED: Requires progression to be unlocked (recovery questions + security image)
   */
  awardXP: (baseXP, multipliers = {}) => {
    const state = get();

    // Gate: Progression must be unlocked first
    if (!state.unlocks.progressionUnlocked) {
      console.log('[UserStore] XP not awarded - progression locked. Complete recovery setup to unlock leveling.');
      return { awarded: false, reason: 'progression_locked' };
    }

    let xp = baseXP;

    // Apply multipliers
    if (multipliers.firstOfDay) xp *= 2.0;
    if (multipliers.containsCBT) xp *= 1.5;
    if (multipliers.containsDBT) xp *= 1.5;
    if (multipliers.depth) xp *= 1.3;

    const newXP = state.progression.xp + xp;
    const currentLevel = state.progression.level;
    const xpToNext = calculateXPForLevel(currentLevel);

    // Check for level up
    if (newXP >= xpToNext) {
      const newLevel = currentLevel + 1;
      const newXPToNext = calculateXPForLevel(newLevel);
      const newTitle = getTitleForLevel(newLevel);

      set({
        progression: {
          ...state.progression,
          level: newLevel,
          xp: newXP - xpToNext, // Carry over extra XP
          xpToNextLevel: newXPToNext,
          currentTitle: newTitle,
          unlockedTitles: [...new Set([...state.progression.unlockedTitles, newTitle])],
        },
        skillTree: {
          ...state.skillTree,
          skillPoints: state.skillTree.skillPoints + 1, // Award skill point on level up
        },
      });


      // Trigger level-up achievement check
      get().checkAchievements();
    } else {
      set({
        progression: {
          ...state.progression,
          xp: newXP,
        },
      });
    }

    get().saveUser();
  },

  /**
   * Unlock achievement
   */
  unlockAchievement: (achievementId) => {
    const state = get();

    if (state.achievements.unlocked.includes(achievementId)) {
      return;
    }

    set({
      achievements: {
        ...state.achievements,
        unlocked: [...state.achievements.unlocked, achievementId],
      },
    });


    // Award XP for achievement (will be pulled from gamification_system.json)
    // For now, award 25 XP
    get().awardXP(25);
    get().saveUser();
  },

  /**
   * Update achievement progress
   */
  updateAchievementProgress: (achievementId, progress) => {
    const state = get();

    set({
      achievements: {
        ...state.achievements,
        progress: {
          ...state.achievements.progress,
          [achievementId]: progress,
        },
      },
    });

    get().saveUser();
  },

  /**
   * Check achievements (called after major actions)
   */
  checkAchievements: () => {
    const state = get();

    // First Steps - Complete first reading
    if (state.stats.totalReadings === 1) {
      get().unlockAchievement('first_reading');
    }

    // Week Warrior - 7-day streak
    if (state.stats.currentStreak === 7) {
      get().unlockAchievement('week_warrior');
    }

    // Journaling Journeyman - 10 journal entries
    if (state.stats.totalJournalEntries === 10) {
      get().unlockAchievement('journaling_journeyman');
    }

    // Distortion Detective - Identify 25 distortions
    if (state.stats.cbtDistortionsIdentified === 25) {
      get().unlockAchievement('distortion_detective');
    }

    // Level-based achievements
    if (state.progression.level === 10) {
      get().unlockAchievement('level_10');
    }
    if (state.progression.level === 25) {
      get().unlockAchievement('level_25');
    }
    if (state.progression.level === 50) {
      get().unlockAchievement('level_50');
    }
  },

  /**
   * Unlock skill tree node
   */
  unlockSkillNode: (nodeId, cost) => {
    const state = get();

    if (state.skillTree.skillPoints < cost) {
      console.warn(`[UserStore] Not enough skill points for ${nodeId}`);
      return false;
    }

    if (state.skillTree.unlockedNodes.includes(nodeId)) {
      console.warn(`[UserStore] Node already unlocked: ${nodeId}`);
      return false;
    }

    set({
      skillTree: {
        ...state.skillTree,
        skillPoints: state.skillTree.skillPoints - cost,
        unlockedNodes: [...state.skillTree.unlockedNodes, nodeId],
        // activeEffects will be computed from unlockedNodes
      },
    });

    get().saveUser();
    return true;
  },

  /**
   * Increment stats
   */
  incrementStat: (statName, amount = 1) => {
    const state = get();

    set({
      stats: {
        ...state.stats,
        [statName]: (state.stats[statName] || 0) + amount,
      },
    });

    get().checkAchievements();
    get().saveUser();
  },

  /**
   * Update streak (called on app start and after actions)
   */
  updateStreak: () => {
    const state = get();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const lastActive = state.stats.lastActiveDate
      ? new Date(state.stats.lastActiveDate).toISOString().split('T')[0]
      : null;

    if (!lastActive) {
      // First time
      set({
        stats: {
          ...state.stats,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: now.toISOString(),
        },
      });
      get().saveUser();
      return;
    }

    if (lastActive === today) {
      // Same day, no change
      return;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === yesterdayStr) {
      // Consecutive day
      const newStreak = state.stats.currentStreak + 1;
      set({
        stats: {
          ...state.stats,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, state.stats.longestStreak),
          lastActiveDate: now.toISOString(),
        },
      });
      get().checkAchievements();
      get().saveUser();
    } else {
      // Streak broken
      set({
        stats: {
          ...state.stats,
          currentStreak: 1,
          lastActiveDate: now.toISOString(),
        },
      });
      get().saveUser();
    }
  },

  /**
   * Complete onboarding step
   */
  completeOnboarding: (step) => {
    const state = get();

    set({
      onboarding: {
        ...state.onboarding,
        [step]: true,
      },
    });

    get().saveUser();
  },

  /**
   * Unlock skill tree node
   */
  unlockSkillNode: (nodeId, cost) => {
    const state = get();

    // Check if enough skill points
    if (state.skillTree.skillPoints < cost) {
      console.warn('[UserStore] Not enough skill points');
      return false;
    }

    // Check if already unlocked
    if (state.skillTree.unlockedNodes.includes(nodeId)) {
      console.warn('[UserStore] Node already unlocked');
      return false;
    }

    // Unlock node
    set({
      skillTree: {
        ...state.skillTree,
        skillPoints: state.skillTree.skillPoints - cost,
        unlockedNodes: [...state.skillTree.unlockedNodes, nodeId],
      },
    });

    get().saveUser();
    return true;
  },

  /**
   * Reset user (for testing/debugging)
   */
  resetUser: async () => {
    set({
      ...initialState,
      profile: {
        ...initialState.profile,
        userId: generateUserId(),
        createdAt: new Date().toISOString(),
      },
    });
    await get().saveUser();
  },

  /**
   * Get daily card (returns existing if still today, null if needs new draw)
   */
  getDailyCard: () => {
    const state = get();
    const { card, drawnAt } = state.dailyCard;

    // No card drawn yet
    if (!card || !drawnAt) {
      return null;
    }

    // Check if card was drawn today
    const drawnDate = new Date(drawnAt);
    const today = new Date();
    const isSameDay =
      drawnDate.getFullYear() === today.getFullYear() &&
      drawnDate.getMonth() === today.getMonth() &&
      drawnDate.getDate() === today.getDate();

    // Return card if from today, null if old
    return isSameDay ? card : null;
  },

  /**
   * Set daily card (saves with timestamp)
   */
  setDailyCard: (card) => {
    set({
      dailyCard: {
        card,
        drawnAt: new Date().toISOString(),
        revealed: false,
      },
    });
    get().saveUser();
  },

  /**
   * Check if daily card has been revealed
   * Returns false if it's a new day (card needs redraw)
   */
  getDailyCardRevealed: () => {
    const state = get();
    const { card, drawnAt, revealed } = state.dailyCard;

    // No card or not drawn today means not revealed
    if (!card || !drawnAt) return false;

    // Check if same day
    const drawnDate = new Date(drawnAt);
    const today = new Date();
    const isSameDay =
      drawnDate.getFullYear() === today.getFullYear() &&
      drawnDate.getMonth() === today.getMonth() &&
      drawnDate.getDate() === today.getDate();

    return isSameDay && revealed;
  },

  /**
   * Mark daily card as revealed
   */
  setDailyCardRevealed: (revealed) => {
    const state = get();
    set({
      dailyCard: {
        ...state.dailyCard,
        revealed,
      },
    });
    get().saveUser();
  },
}));

/**
 * HELPER FUNCTIONS
 */

/**
 * Generate unique user ID
 */
function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculate XP required for next level
 * Formula: XP = 100 * (level^1.8)
 */
function calculateXPForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.8));
}

/**
 * Get title for level
 */
function getTitleForLevel(level) {
  if (level >= 50) return 'Eternal One';
  if (level >= 40) return 'Enlightened';
  if (level >= 30) return 'Sage';
  if (level >= 20) return 'Master';
  if (level >= 15) return 'Adept';
  if (level >= 10) return 'Practitioner';
  if (level >= 5) return 'Apprentice';
  return 'Seeker';
}

export default useUserStore;
