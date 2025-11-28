/**
 * UserStore Test Suite
 * Tests for user state management, progression, achievements, and skill tree
 */

import { useUserStore } from '../userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock console to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('UserStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUserStore.getState().resetUser();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('initializes with default values', () => {
      const state = useUserStore.getState();

      expect(state.progression.level).toBe(1);
      expect(state.progression.xp).toBe(0);
      expect(state.progression.currentTitle).toBe('Seeker');
      expect(state.skillTree.skillPoints).toBe(0);
      expect(state.stats.totalReadings).toBe(0);
    });

    test('has empty achievements on init', () => {
      const state = useUserStore.getState();

      expect(state.achievements.unlocked).toEqual([]);
      expect(state.achievements.progress).toEqual({});
    });

    test('has all onboarding flags as false initially', () => {
      const state = useUserStore.getState();

      expect(state.onboarding.completedWelcome).toBe(false);
      expect(state.onboarding.completedFirstReading).toBe(false);
      expect(state.onboarding.seenAchievementsIntro).toBe(false);
    });
  });

  describe('XP and Leveling', () => {
    test('awardXP increases XP correctly', () => {
      const initialXP = useUserStore.getState().progression.xp;

      useUserStore.getState().awardXP(50);

      const newXP = useUserStore.getState().progression.xp;
      expect(newXP).toBe(initialXP + 50);
    });

    test('awardXP triggers level up when reaching threshold', () => {
      useUserStore.getState().awardXP(100);

      const state = useUserStore.getState();
      expect(state.progression.level).toBe(2);
      expect(state.progression.currentTitle).toBe('Seeker');
    });

    test('level up awards a skill point', () => {
      const initialSP = useUserStore.getState().skillTree.skillPoints;

      useUserStore.getState().awardXP(100); // Level up

      const newSP = useUserStore.getState().skillTree.skillPoints;
      expect(newSP).toBe(initialSP + 1);
    });

    test('carries over extra XP after level up', () => {
      useUserStore.getState().awardXP(150); // 50 XP over threshold

      const state = useUserStore.getState();
      expect(state.progression.level).toBe(2);
      expect(state.progression.xp).toBe(50);
    });

    test('XP multipliers apply correctly - firstOfDay', () => {
      useUserStore.getState().awardXP(50, { firstOfDay: true });

      const xp = useUserStore.getState().progression.xp;
      expect(xp).toBe(100); // 50 * 2.0
    });

    test('XP multipliers apply correctly - CBT', () => {
      useUserStore.getState().awardXP(50, { containsCBT: true });

      const xp = useUserStore.getState().progression.xp;
      expect(xp).toBe(75); // 50 * 1.5
    });

    test('XP multipliers stack correctly', () => {
      useUserStore.getState().awardXP(50, {
        firstOfDay: true,
        containsCBT: true,
      });

      const xp = useUserStore.getState().progression.xp;
      expect(xp).toBe(150); // 50 * 2.0 * 1.5
    });

    test('title changes at level milestones', () => {
      // Level 1-4: Seeker
      expect(useUserStore.getState().progression.currentTitle).toBe('Seeker');

      // Level to 5: Apprentice
      useUserStore.getState().awardXP(500);
      expect(useUserStore.getState().progression.currentTitle).toBe('Apprentice');
    });
  });

  describe('Achievements', () => {
    test('unlockAchievement adds achievement to unlocked list', () => {
      useUserStore.getState().unlockAchievement('first_reading');

      const unlocked = useUserStore.getState().achievements.unlocked;
      expect(unlocked).toContain('first_reading');
    });

    test('unlockAchievement does not duplicate achievements', () => {
      useUserStore.getState().unlockAchievement('first_reading');
      useUserStore.getState().unlockAchievement('first_reading');

      const unlocked = useUserStore.getState().achievements.unlocked;
      expect(unlocked.filter((a) => a === 'first_reading').length).toBe(1);
    });

    test('unlockAchievement awards XP', () => {
      const initialXP = useUserStore.getState().progression.xp;

      useUserStore.getState().unlockAchievement('test_achievement');

      const newXP = useUserStore.getState().progression.xp;
      expect(newXP).toBeGreaterThan(initialXP);
    });

    test('updateAchievementProgress updates progress', () => {
      useUserStore.getState().updateAchievementProgress('reading_milestone_10', 5);

      const progress = useUserStore.getState().achievements.progress;
      expect(progress.reading_milestone_10).toBe(5);
    });

    test('checkAchievements unlocks first_reading at 1 reading', () => {
      useUserStore.setState({ stats: { ...useUserStore.getState().stats, totalReadings: 1 } });

      useUserStore.getState().checkAchievements();

      const unlocked = useUserStore.getState().achievements.unlocked;
      expect(unlocked).toContain('first_reading');
    });

    test('checkAchievements unlocks week_warrior at 7-day streak', () => {
      useUserStore.setState({ stats: { ...useUserStore.getState().stats, currentStreak: 7 } });

      useUserStore.getState().checkAchievements();

      const unlocked = useUserStore.getState().achievements.unlocked;
      expect(unlocked).toContain('week_warrior');
    });

    test('checkAchievements unlocks level-based achievements', () => {
      useUserStore.setState({ progression: { ...useUserStore.getState().progression, level: 10 } });

      useUserStore.getState().checkAchievements();

      const unlocked = useUserStore.getState().achievements.unlocked;
      expect(unlocked).toContain('level_10');
    });
  });

  describe('Skill Tree', () => {
    test('unlockSkillNode deducts skill points', () => {
      useUserStore.setState({ skillTree: { ...useUserStore.getState().skillTree, skillPoints: 5 } });

      const result = useUserStore.getState().unlockSkillNode('test_node', 2);

      expect(result).toBe(true);
      expect(useUserStore.getState().skillTree.skillPoints).toBe(3);
    });

    test('unlockSkillNode adds node to unlockedNodes', () => {
      useUserStore.setState({ skillTree: { ...useUserStore.getState().skillTree, skillPoints: 5 } });

      useUserStore.getState().unlockSkillNode('test_node', 2);

      const unlockedNodes = useUserStore.getState().skillTree.unlockedNodes;
      expect(unlockedNodes).toContain('test_node');
    });

    test('unlockSkillNode fails without enough points', () => {
      useUserStore.setState({ skillTree: { ...useUserStore.getState().skillTree, skillPoints: 1 } });

      const result = useUserStore.getState().unlockSkillNode('expensive_node', 3);

      expect(result).toBe(false);
      expect(useUserStore.getState().skillTree.unlockedNodes).not.toContain('expensive_node');
    });

    test('unlockSkillNode prevents double-unlocking', () => {
      useUserStore.setState({
        skillTree: {
          ...useUserStore.getState().skillTree,
          skillPoints: 10,
          unlockedNodes: ['already_unlocked'],
        },
      });

      const result = useUserStore.getState().unlockSkillNode('already_unlocked', 2);

      expect(result).toBe(false);
      expect(useUserStore.getState().skillTree.skillPoints).toBe(10); // No points deducted
    });
  });

  describe('Statistics', () => {
    test('incrementStat increases stat by default amount (1)', () => {
      useUserStore.getState().incrementStat('totalReadings');

      expect(useUserStore.getState().stats.totalReadings).toBe(1);
    });

    test('incrementStat increases stat by custom amount', () => {
      useUserStore.getState().incrementStat('totalMindfulnessMinutes', 15);

      expect(useUserStore.getState().stats.totalMindfulnessMinutes).toBe(15);
    });

    test('incrementStat triggers achievement check', () => {
      // Set up to unlock achievement on next increment
      useUserStore.setState({ stats: { ...useUserStore.getState().stats, totalReadings: 0 } });

      useUserStore.getState().incrementStat('totalReadings');

      const unlocked = useUserStore.getState().achievements.unlocked;
      expect(unlocked).toContain('first_reading');
    });
  });

  describe('Streak Management', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('updateStreak sets streak to 1 on first use', () => {
      useUserStore.getState().updateStreak();

      expect(useUserStore.getState().stats.currentStreak).toBe(1);
      expect(useUserStore.getState().stats.longestStreak).toBe(1);
    });

    test('updateStreak does not change on same day', () => {
      const now = new Date();
      useUserStore.setState({
        stats: {
          ...useUserStore.getState().stats,
          currentStreak: 5,
          lastActiveDate: now.toISOString(),
        },
      });

      useUserStore.getState().updateStreak();

      expect(useUserStore.getState().stats.currentStreak).toBe(5);
    });

    test('updateStreak increments on consecutive day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      useUserStore.setState({
        stats: {
          ...useUserStore.getState().stats,
          currentStreak: 5,
          longestStreak: 10,
          lastActiveDate: yesterday.toISOString(),
        },
      });

      useUserStore.getState().updateStreak();

      expect(useUserStore.getState().stats.currentStreak).toBe(6);
    });

    test('updateStreak updates longest streak', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      useUserStore.setState({
        stats: {
          ...useUserStore.getState().stats,
          currentStreak: 10,
          longestStreak: 10,
          lastActiveDate: yesterday.toISOString(),
        },
      });

      useUserStore.getState().updateStreak();

      expect(useUserStore.getState().stats.currentStreak).toBe(11);
      expect(useUserStore.getState().stats.longestStreak).toBe(11);
    });

    test('updateStreak resets on broken streak', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      useUserStore.setState({
        stats: {
          ...useUserStore.getState().stats,
          currentStreak: 5,
          longestStreak: 10,
          lastActiveDate: twoDaysAgo.toISOString(),
        },
      });

      useUserStore.getState().updateStreak();

      expect(useUserStore.getState().stats.currentStreak).toBe(1);
      expect(useUserStore.getState().stats.longestStreak).toBe(10); // Longest stays
    });
  });

  describe('Onboarding', () => {
    test('completeOnboarding sets flag to true', () => {
      useUserStore.getState().completeOnboarding('completedWelcome');

      expect(useUserStore.getState().onboarding.completedWelcome).toBe(true);
    });

    test('completeOnboarding does not affect other flags', () => {
      useUserStore.getState().completeOnboarding('completedFirstReading');

      expect(useUserStore.getState().onboarding.completedFirstReading).toBe(true);
      expect(useUserStore.getState().onboarding.completedWelcome).toBe(false);
    });
  });

  describe('Persistence', () => {
    test('saveUser calls AsyncStorage.setItem', async () => {
      await useUserStore.getState().saveUser();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@veilpath_user',
        expect.any(String)
      );
    });

    test('saveUser stores valid JSON', async () => {
      await useUserStore.getState().saveUser();

      const call = AsyncStorage.setItem.mock.calls[0];
      const jsonString = call[1];

      expect(() => JSON.parse(jsonString)).not.toThrow();
    });

    test('initializeUser loads from AsyncStorage', async () => {
      const mockUserData = {
        profile: { userId: 'test-user', createdAt: '2025-01-01' },
        progression: { level: 5, xp: 200 },
        achievements: { unlocked: ['test_achievement'] },
        skillTree: { skillPoints: 3, unlockedNodes: [] },
        stats: { totalReadings: 10 },
        onboarding: { completedWelcome: true },
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockUserData));

      await useUserStore.getState().initializeUser();

      expect(useUserStore.getState().progression.level).toBe(5);
      expect(useUserStore.getState().profile.userId).toBe('test-user');
    });

    test('initializeUser creates new user when storage is empty', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      await useUserStore.getState().initializeUser();

      const state = useUserStore.getState();
      expect(state.profile.userId).toBeDefined();
      expect(state.profile.createdAt).toBeDefined();
      expect(state.progression.level).toBe(1);
    });
  });

  describe('Reset', () => {
    test('resetUser restores initial state', async () => {
      // Make some changes
      useUserStore.getState().awardXP(500);
      useUserStore.getState().unlockAchievement('test');

      await useUserStore.getState().resetUser();

      const state = useUserStore.getState();
      expect(state.progression.level).toBe(1);
      expect(state.progression.xp).toBe(0);
      expect(state.achievements.unlocked).toEqual([]);
    });

    test('resetUser generates new userId', async () => {
      const firstId = useUserStore.getState().profile.userId;

      await useUserStore.getState().resetUser();

      const secondId = useUserStore.getState().profile.userId;
      expect(secondId).not.toBe(firstId);
    });
  });

  describe('Edge Cases', () => {
    test('handles maximum XP without overflow', () => {
      useUserStore.getState().awardXP(999999);

      const state = useUserStore.getState();
      expect(state.progression.xp).toBeDefined();
      expect(state.progression.level).toBeGreaterThan(1);
    });

    test('handles zero XP award', () => {
      const initialXP = useUserStore.getState().progression.xp;

      useUserStore.getState().awardXP(0);

      expect(useUserStore.getState().progression.xp).toBe(initialXP);
    });

    test('handles negative stat increments gracefully', () => {
      useUserStore.setState({ stats: { ...useUserStore.getState().stats, totalReadings: 5 } });

      useUserStore.getState().incrementStat('totalReadings', -2);

      expect(useUserStore.getState().stats.totalReadings).toBe(3);
    });
  });
});
