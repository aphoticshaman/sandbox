/**
 * Content Loader
 * Centralized loading of all therapeutic content libraries
 *
 * Loads:
 * - Mindfulness exercises (28 practices)
 * - CBT cognitive distortions (10 distortions)
 * - DBT skills (4 modules)
 * - Journal prompts (625+ prompts)
 * - Gamification system (5 levels)
 */

// Import JSON files
import mindfulnessExercises from '../../data/therapy/mindfulness_exercises.json';
import cbtDistortions from '../../data/therapy/cbt_cognitive_distortions.json';
import dbtSkills from '../../data/therapy/dbt_skills_complete.json';
import journalPrompts from '../../data/therapy/journal_prompts.json';
import gamificationSystem from '../../data/gamification/gamification_system.json';

/**
 * Content library singleton
 */
class ContentLibrary {
  constructor() {
    this.mindfulness = null;
    this.cbt = null;
    this.dbt = null;
    this.prompts = null;
    this.gamification = null;
    this.loaded = false;
  }

  /**
   * Load all content
   */
  async load() {
    if (this.loaded) {
      return;
    }

    try {

      this.mindfulness = mindfulnessExercises;
      this.cbt = cbtDistortions;
      this.dbt = dbtSkills;
      this.prompts = journalPrompts;
      this.gamification = gamificationSystem;

      this.loaded = true;
    } catch (error) {
      console.error('[ContentLibrary] Failed to load content:', error);
      throw error;
    }
  }

  /**
   * Get mindfulness exercise by ID
   */
  getMindfulnessExercise(exerciseId) {
    if (!this.loaded) {
      console.warn('[ContentLibrary] Content not loaded yet');
      return null;
    }

    // Search through all categories
    const categories = [
      'breathing_techniques',
      'body_scan',
      'sensory_grounding',
      'meditation',
      'movement',
      'daily_activities',
    ];

    for (const category of categories) {
      const exercises = this.mindfulness.mindfulness_exercises[category];
      if (exercises && exercises[exerciseId]) {
        return exercises[exerciseId];
      }
    }

    return null;
  }

  /**
   * Get all mindfulness exercises
   */
  getAllMindfulnessExercises() {
    if (!this.loaded) return [];

    const exercises = [];
    const categories = [
      'breathing_techniques',
      'body_scan',
      'sensory_grounding',
      'meditation',
      'movement',
      'daily_activities',
    ];

    for (const category of categories) {
      const categoryExercises = this.mindfulness.mindfulness_exercises[category];
      if (categoryExercises) {
        Object.values(categoryExercises).forEach((exercise) => {
          exercises.push({ ...exercise, category });
        });
      }
    }

    return exercises;
  }

  /**
   * Get CBT distortion by ID
   */
  getCBTDistortion(distortionId) {
    if (!this.loaded) return null;
    return this.cbt.cognitive_distortions[distortionId] || null;
  }

  /**
   * Get all CBT distortions
   */
  getAllCBTDistortions() {
    if (!this.loaded) return [];
    return Object.values(this.cbt.cognitive_distortions);
  }

  /**
   * Get DBT skill by module and ID
   */
  getDBTSkill(moduleId, skillId) {
    if (!this.loaded) return null;
    const module = this.dbt[moduleId];
    if (!module) return null;

    // Search through module structure
    for (const category in module) {
      if (module[category][skillId]) {
        return module[category][skillId];
      }
    }

    return null;
  }

  /**
   * Get all DBT skills from a module
   */
  getDBTModule(moduleId) {
    if (!this.loaded) return null;
    return this.dbt[moduleId] || null;
  }

  /**
   * Get journal prompt by card ID
   */
  getPromptsForCard(cardId) {
    if (!this.loaded) return [];

    const cardPrompts = this.prompts.journal_prompts?.card_specific_prompts;
    if (!cardPrompts) return [];

    // Check major arcana
    const major = cardPrompts.major_arcana?.[cardId];
    if (major) return major.prompts || [];

    // Check minor arcana (cups, swords, wands, pentacles)
    const suitMappings = {
      'minor_arcana_cups': 'cups',
      'minor_arcana_swords': 'swords',
      'minor_arcana_wands': 'wands',
      'minor_arcana_pentacles': 'pentacles',
    };

    for (const [jsonKey, suit] of Object.entries(suitMappings)) {
      const suitCards = cardPrompts[jsonKey];
      if (suitCards && suitCards[cardId]) {
        return suitCards[cardId].prompts || [];
      }
    }

    return [];
  }

  /**
   * Get prompts by category
   */
  getPromptsByCategory(category) {
    if (!this.loaded) return [];

    const categoryMap = {
      cbt: 'cbt_focused_prompts',
      dbt: 'dbt_focused_prompts',
      mindfulness: 'mindfulness_prompts',
      crisis: 'crisis_support_prompts',
    };

    const categoryKey = categoryMap[category];
    if (!categoryKey || !this.prompts[categoryKey]) return [];

    return this.prompts[categoryKey];
  }

  /**
   * Get prompts by emotional state
   * Maps UI mood IDs to JSON keys
   */
  getPromptsByMood(mood) {
    if (!this.loaded) return [];

    // Map UI mood IDs to JSON emotional_states_prompts keys
    const moodToJsonKey = {
      'calm': 'joy',
      'energized': 'joy',
      'peaceful': 'joy',
      'focused': 'joy',
      'anxious': 'anxiety',
      'sad': 'depression',
      'angry': 'anger',
      'joyful': 'joy',
      'overwhelmed': 'overwhelm',
      'grateful': 'joy',
    };

    const jsonKey = moodToJsonKey[mood] || mood;

    // Access the correct nested path in the JSON
    const emotionalStates = this.prompts.journal_prompts?.emotional_states_prompts;
    if (!emotionalStates) {
      console.warn('[ContentLibrary] emotional_states_prompts not found');
      return [];
    }

    return emotionalStates[jsonKey] || [];
  }

  /**
   * Get random prompt from any category
   */
  getRandomPrompt() {
    if (!this.loaded) return null;

    const jp = this.prompts.journal_prompts;
    if (!jp) return null;

    // Flatten CBT prompts (they're nested by distortion type)
    const cbtPrompts = [];
    if (jp.cbt_focused_prompts) {
      Object.values(jp.cbt_focused_prompts).forEach(prompts => {
        if (Array.isArray(prompts)) {
          cbtPrompts.push(...prompts);
        }
      });
    }

    // Flatten DBT prompts (they're nested by skill type)
    const dbtPrompts = [];
    if (jp.dbt_focused_prompts) {
      Object.values(jp.dbt_focused_prompts).forEach(prompts => {
        if (Array.isArray(prompts)) {
          dbtPrompts.push(...prompts);
        }
      });
    }

    const mindfulnessPrompts = jp.mindfulness_integrated_prompts || [];
    const dailyPrompts = jp.daily_reflection_prompts || [];

    const allPrompts = [
      ...cbtPrompts,
      ...dbtPrompts,
      ...mindfulnessPrompts,
      ...dailyPrompts,
    ];

    if (allPrompts.length === 0) return null;
    return allPrompts[Math.floor(Math.random() * allPrompts.length)];
  }

  /**
   * Get XP for action
   */
  getXPForAction(action) {
    if (!this.loaded) return 0;

    const xpActions = this.gamification.level_2_xp_and_progression.xp_actions;
    const actionData = xpActions.find((a) => a.action === action);

    return actionData ? actionData.xp : 0;
  }

  /**
   * Get achievement by ID
   */
  getAchievement(achievementId) {
    if (!this.loaded) return null;

    try {
      const achievements = this.gamification?.level_3_achievements?.achievements;
      if (!Array.isArray(achievements)) return null;
      return achievements.find((a) => a?.id === achievementId) || null;
    } catch (error) {
      console.error('[ContentLibrary] Error getting achievement:', error);
      return null;
    }
  }

  /**
   * Get all achievements
   */
  getAllAchievements() {
    if (!this.loaded) return [];

    try {
      // Defensive access to nested structure
      const achievements = this.gamification?.level_3_achievements?.achievements;
      if (!Array.isArray(achievements)) {
        console.warn('[ContentLibrary] Achievements not found or invalid format');
        return [];
      }
      return achievements;
    } catch (error) {
      console.error('[ContentLibrary] Error accessing achievements:', error);
      return [];
    }
  }

  /**
   * Get skill tree branch
   */
  getSkillTreeBranch(branchId) {
    if (!this.loaded) return null;

    const branches = this.gamification.level_4_skill_trees.branches;
    return branches.find((b) => b.id === branchId) || null;
  }

  /**
   * Get all skill tree branches
   */
  getAllSkillTreeBranches() {
    if (!this.loaded) return [];
    return this.gamification.level_4_skill_trees.branches;
  }

  /**
   * Get level curve data
   */
  getLevelCurve() {
    if (!this.loaded) return null;
    return this.gamification.level_2_xp_and_progression.level_curve;
  }
}

// Singleton instance
const contentLibrary = new ContentLibrary();

/**
 * Initialize content library
 * Call this once on app start
 */
export const initializeContent = async () => {
  await contentLibrary.load();
};

/**
 * Get content library instance
 */
export const getContent = () => {
  if (!contentLibrary.loaded) {
    console.warn('[ContentLibrary] Content not loaded. Call initializeContent() first.');
  }
  return contentLibrary;
};

export default contentLibrary;
