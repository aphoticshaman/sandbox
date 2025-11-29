/**
 * AchievementSystem.ts
 *
 * Achievement tracking and unlocking for Orthogonal
 * Tracks player progress, milestones, and hidden discoveries
 */

import { saveSystem } from '../save/SaveSystem';
import { DimensionType } from '../core/DimensionManager';

// =============================================================================
// TYPES
// =============================================================================

export type AchievementCategory =
  | 'progression'    // Story/level completion
  | 'mastery'        // Skill-based
  | 'exploration'    // Discovery
  | 'social'         // Multiplayer
  | 'meta'           // Self-aware/fourth-wall
  | 'hidden';        // Secret achievements

export type AchievementRarity =
  | 'common'         // Most players get it
  | 'uncommon'       // 50%+ of players
  | 'rare'           // 10-50% of players
  | 'epic'           // 1-10% of players
  | 'legendary';     // <1% of players

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  hiddenDescription?: string;  // Shown before unlock for hidden achievements
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  icon: string;

  // Unlock conditions
  condition: AchievementCondition;

  // Rewards
  rewards?: {
    cosmetic?: string;
    title?: string;
    insight?: string;  // Lore/wisdom text
  };

  // Dependencies
  requires?: string[];  // Other achievements that must be unlocked first
}

export type AchievementCondition =
  | { type: 'level_complete'; levelId: string }
  | { type: 'level_mastery'; levelId: string; minMastery: number }
  | { type: 'chapter_complete'; chapter: number }
  | { type: 'levels_completed'; count: number }
  | { type: 'total_playtime'; minutes: number }
  | { type: 'witness_time'; seconds: number }
  | { type: 'dimension_visits'; dimension: DimensionType; count: number }
  | { type: 'void_survival'; seconds: number }
  | { type: 'perfect_sync'; count: number }
  | { type: 'coop_completions'; count: number }
  | { type: 'friends_helped'; count: number }
  | { type: 'spectators_gained'; count: number }
  | { type: 'no_backtrack'; levelId: string }
  | { type: 'speedrun'; levelId: string; maxTime: number }
  | { type: 'find_secret'; secretId: string }
  | { type: 'archetype_discovered'; archetype: string }
  | { type: 'sdpm_samples'; count: number }
  | { type: 'custom'; check: string };  // Custom function name

export interface AchievementProgress {
  id: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;     // 0-1 for trackable achievements
  notified: boolean;     // Has the user been shown the unlock notification
}

export interface AchievementUnlockEvent {
  achievement: AchievementDefinition;
  timestamp: Date;
  firstGlobal?: boolean;  // First person ever to unlock
}

// =============================================================================
// ACHIEVEMENT DEFINITIONS
// =============================================================================

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ============================================
  // PROGRESSION
  // ============================================
  {
    id: 'first_awakening',
    name: 'First Awakening',
    description: 'Complete the tutorial level',
    category: 'progression',
    rarity: 'common',
    points: 10,
    icon: '🌅',
    condition: { type: 'level_complete', levelId: 'emergence' },
    rewards: {
      insight: 'You are not the body. You are the attention that inhabits it.'
    }
  },
  {
    id: 'lattice_walker',
    name: 'Lattice Walker',
    description: 'Complete the First Lattice',
    category: 'progression',
    rarity: 'common',
    points: 15,
    icon: '💎',
    condition: { type: 'level_complete', levelId: 'first-lattice' },
    requires: ['first_awakening']
  },
  {
    id: 'witness_bearer',
    name: 'Witness Bearer',
    description: 'Learn to witness',
    category: 'progression',
    rarity: 'common',
    points: 20,
    icon: '👁️',
    condition: { type: 'level_complete', levelId: 'the-witness' },
    rewards: {
      insight: 'To see is to be still. To act is to be blind.'
    }
  },
  {
    id: 'dimension_breaker',
    name: 'Dimension Breaker',
    description: 'Cross between dimensions for the first time',
    category: 'progression',
    rarity: 'common',
    points: 25,
    icon: '🌀',
    condition: { type: 'level_complete', levelId: 'beyond-the-lattice' }
  },
  {
    id: 'void_touched',
    name: 'Void Touched',
    description: 'Enter the Void',
    category: 'progression',
    rarity: 'uncommon',
    points: 30,
    icon: '⚫',
    condition: { type: 'level_complete', levelId: 'void-touch' },
    rewards: {
      insight: 'Emptiness is not nothing. It is everything, waiting.'
    }
  },
  {
    id: 'unity',
    name: 'Unity',
    description: 'Complete your first cooperative puzzle',
    category: 'progression',
    rarity: 'uncommon',
    points: 35,
    icon: '🤝',
    condition: { type: 'level_complete', levelId: 'together' }
  },
  {
    id: 'chapter_complete',
    name: 'Static Complete',
    description: 'Complete all 10 static levels',
    category: 'progression',
    rarity: 'rare',
    points: 100,
    icon: '🏆',
    condition: { type: 'chapter_complete', chapter: 10 },
    rewards: {
      title: 'The Awakened',
      insight: 'The static levels were training. Now reality bends to your will.'
    }
  },
  {
    id: 'orthogonal_master',
    name: 'Orthogonal Master',
    description: 'Complete level Orthogonal',
    category: 'progression',
    rarity: 'rare',
    points: 75,
    icon: '📐',
    condition: { type: 'level_complete', levelId: 'orthogonal' },
    rewards: {
      cosmetic: 'orthogonal_trail',
      insight: 'You learned to think perpendicular to reality itself.'
    }
  },

  // ============================================
  // MASTERY
  // ============================================
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Achieve 100% mastery on any level',
    category: 'mastery',
    rarity: 'uncommon',
    points: 40,
    icon: '💯',
    condition: { type: 'level_mastery', levelId: '*', minMastery: 100 }
  },
  {
    id: 'flawless_emergence',
    name: 'Flawless Emergence',
    description: 'Complete Emergence in under 10 seconds',
    category: 'mastery',
    rarity: 'rare',
    points: 50,
    icon: '⚡',
    condition: { type: 'speedrun', levelId: 'emergence', maxTime: 10000 }
  },
  {
    id: 'no_looking_back',
    name: 'No Looking Back',
    description: 'Complete any level without backtracking',
    category: 'mastery',
    rarity: 'uncommon',
    points: 35,
    icon: '➡️',
    condition: { type: 'no_backtrack', levelId: '*' }
  },
  {
    id: 'void_dancer',
    name: 'Void Dancer',
    description: 'Survive in the Void for 60 seconds continuously',
    category: 'mastery',
    rarity: 'rare',
    points: 60,
    icon: '💃',
    condition: { type: 'void_survival', seconds: 60 }
  },
  {
    id: 'synchronicity',
    name: 'Synchronicity',
    description: 'Achieve perfect sync 10 times',
    category: 'mastery',
    rarity: 'rare',
    points: 55,
    icon: '🔄',
    condition: { type: 'perfect_sync', count: 10 }
  },
  {
    id: 'speedster',
    name: 'Speedster',
    description: 'Complete 5 levels under par time',
    category: 'mastery',
    rarity: 'rare',
    points: 65,
    icon: '🏃',
    condition: { type: 'levels_completed', count: 5 }  // Modified by speedrun flag
  },

  // ============================================
  // EXPLORATION
  // ============================================
  {
    id: 'long_gaze',
    name: 'The Long Gaze',
    description: 'Spend 10 minutes total in witness mode',
    category: 'exploration',
    rarity: 'uncommon',
    points: 30,
    icon: '👀',
    condition: { type: 'witness_time', seconds: 600 }
  },
  {
    id: 'void_explorer',
    name: 'Void Explorer',
    description: 'Visit the Void 50 times',
    category: 'exploration',
    rarity: 'rare',
    points: 45,
    icon: '🕳️',
    condition: { type: 'dimension_visits', dimension: 'VOID', count: 50 }
  },
  {
    id: 'marrow_seeker',
    name: 'Marrow Seeker',
    description: 'Visit the Marrow 50 times',
    category: 'exploration',
    rarity: 'rare',
    points: 45,
    icon: '🩸',
    condition: { type: 'dimension_visits', dimension: 'MARROW', count: 50 }
  },
  {
    id: 'secret_finder',
    name: 'Secret Finder',
    description: 'Find a hidden node',
    category: 'exploration',
    rarity: 'uncommon',
    points: 25,
    icon: '🔍',
    condition: { type: 'find_secret', secretId: '*' }
  },
  {
    id: 'all_secrets',
    name: 'Omniscient',
    description: 'Find all hidden nodes across static levels',
    category: 'exploration',
    rarity: 'epic',
    points: 100,
    icon: '🌟',
    condition: { type: 'find_secret', secretId: 'all' }
  },

  // ============================================
  // SOCIAL
  // ============================================
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Complete 10 cooperative levels',
    category: 'social',
    rarity: 'uncommon',
    points: 40,
    icon: '👥',
    condition: { type: 'coop_completions', count: 10 }
  },
  {
    id: 'helping_hand',
    name: 'Helping Hand',
    description: 'Help 5 friends complete levels',
    category: 'social',
    rarity: 'uncommon',
    points: 35,
    icon: '🤲',
    condition: { type: 'friends_helped', count: 5 }
  },
  {
    id: 'entertainer',
    name: 'Entertainer',
    description: 'Have 100 total spectators watch your gameplay',
    category: 'social',
    rarity: 'rare',
    points: 50,
    icon: '🎭',
    condition: { type: 'spectators_gained', count: 100 }
  },
  {
    id: 'tetrad_complete',
    name: 'Tetrad Complete',
    description: 'Complete the Tetrad level with 4 players',
    category: 'social',
    rarity: 'rare',
    points: 70,
    icon: '🎲',
    condition: { type: 'level_complete', levelId: 'tetrad' }
  },

  // ============================================
  // META
  // ============================================
  {
    id: 'know_thyself',
    name: 'Know Thyself',
    description: 'Discover your SDPM archetype',
    category: 'meta',
    rarity: 'common',
    points: 20,
    icon: '🪞',
    condition: { type: 'archetype_discovered', archetype: '*' },
    rewards: {
      insight: 'The game watches you as much as you play it.'
    }
  },
  {
    id: 'data_self',
    name: 'Data Self',
    description: 'Generate 1000 SDPM data points',
    category: 'meta',
    rarity: 'uncommon',
    points: 30,
    icon: '📊',
    condition: { type: 'sdpm_samples', count: 1000 }
  },
  {
    id: 'patient_one',
    name: 'The Patient One',
    description: 'Play for 10 hours total',
    category: 'meta',
    rarity: 'rare',
    points: 60,
    icon: '⏰',
    condition: { type: 'total_playtime', minutes: 600 },
    rewards: {
      title: 'The Patient'
    }
  },
  {
    id: 'dedication',
    name: 'Dedication',
    description: 'Play for 100 hours total',
    category: 'meta',
    rarity: 'epic',
    points: 150,
    icon: '🎖️',
    condition: { type: 'total_playtime', minutes: 6000 },
    rewards: {
      title: 'The Devoted',
      cosmetic: 'devotion_aura'
    }
  },

  // ============================================
  // HIDDEN
  // ============================================
  {
    id: 'hidden_awakening',
    name: '???',
    description: 'Discover this secret achievement',
    hiddenDescription: 'Return to Emergence after completing Orthogonal',
    category: 'hidden',
    rarity: 'epic',
    points: 100,
    icon: '❓',
    condition: { type: 'custom', check: 'emergence_return' },
    requires: ['orthogonal_master'],
    rewards: {
      insight: 'The beginning was always the end. The end was always the beginning.'
    }
  },
  {
    id: 'still_point',
    name: '???',
    description: 'Discover this secret achievement',
    hiddenDescription: 'Remain completely still for 60 seconds',
    category: 'hidden',
    rarity: 'rare',
    points: 50,
    icon: '❓',
    condition: { type: 'custom', check: 'absolute_stillness' },
    rewards: {
      insight: 'In the stillness, reality reveals its seams.'
    }
  },
  {
    id: 'boundary_break',
    name: '???',
    description: 'Discover this secret achievement',
    hiddenDescription: 'Find the edge of the level boundary',
    category: 'hidden',
    rarity: 'rare',
    points: 40,
    icon: '❓',
    condition: { type: 'custom', check: 'boundary_discovery' }
  },
  {
    id: 'mirror_self',
    name: '???',
    description: 'Discover this secret achievement',
    hiddenDescription: 'Witness yourself from another dimension',
    category: 'hidden',
    rarity: 'epic',
    points: 80,
    icon: '❓',
    condition: { type: 'custom', check: 'self_witness' },
    rewards: {
      insight: 'You saw what you always were. The observer and the observed, one.'
    }
  },
  {
    id: 'first_global',
    name: '???',
    description: 'Discover this secret achievement',
    hiddenDescription: 'Be the first player globally to unlock an achievement',
    category: 'hidden',
    rarity: 'legendary',
    points: 200,
    icon: '❓',
    condition: { type: 'custom', check: 'first_global_unlock' },
    rewards: {
      title: 'The Pioneer',
      cosmetic: 'pioneer_crown'
    }
  }
];

// =============================================================================
// ACHIEVEMENT SYSTEM
// =============================================================================

export class AchievementSystem {
  private achievements: Map<string, AchievementDefinition>;
  private progress: Map<string, AchievementProgress>;
  private eventListeners: Map<string, Set<(event: AchievementUnlockEvent) => void>>;

  // Tracking data
  private stats: {
    witnessTime: number;
    dimensionVisits: Record<DimensionType, number>;
    voidTime: number;
    perfectSyncs: number;
    coopCompletions: number;
    friendsHelped: number;
    totalSpectators: number;
    secretsFound: Set<string>;
    speedruns: Set<string>;
    noBacktrackLevels: Set<string>;
  };

  // Custom condition checkers
  private customCheckers: Map<string, () => boolean>;

  constructor() {
    this.achievements = new Map(ACHIEVEMENTS.map(a => [a.id, a]));
    this.progress = new Map();
    this.eventListeners = new Map();

    this.stats = {
      witnessTime: 0,
      dimensionVisits: { LATTICE: 0, MARROW: 0, VOID: 0 },
      voidTime: 0,
      perfectSyncs: 0,
      coopCompletions: 0,
      friendsHelped: 0,
      totalSpectators: 0,
      secretsFound: new Set(),
      speedruns: new Set(),
      noBacktrackLevels: new Set()
    };

    this.customCheckers = new Map();
    this.setupCustomCheckers();
  }

  /**
   * Initialize from save data
   */
  init(): void {
    const savedProgress = saveSystem.getProgress();

    for (const achievementId of savedProgress.achievements) {
      this.progress.set(achievementId, {
        id: achievementId,
        unlocked: true,
        notified: true
      });
    }
  }

  /**
   * Set up custom achievement checkers
   */
  private setupCustomCheckers(): void {
    this.customCheckers.set('emergence_return', () => {
      // Check if player returned to emergence after completing orthogonal
      const progress = saveSystem.getProgress();
      return progress.completedLevels.includes('orthogonal') &&
             progress.levelMastery['emergence'] !== undefined &&
             (progress.levelMastery['emergence'] || 0) > 0;
    });

    this.customCheckers.set('absolute_stillness', () => {
      // Track via stats
      return (this as any).lastStillnessTime >= 60000;
    });

    this.customCheckers.set('boundary_discovery', () => {
      return this.stats.secretsFound.has('level_boundary');
    });

    this.customCheckers.set('self_witness', () => {
      return this.stats.secretsFound.has('self_witness_event');
    });

    this.customCheckers.set('first_global_unlock', () => {
      // This would be checked server-side
      return false;
    });
  }

  // ===========================================================================
  // TRACKING METHODS
  // ===========================================================================

  /**
   * Track level completion
   */
  trackLevelComplete(levelId: string, mastery: number, time: number, backtracked: boolean): void {
    // Check level-specific achievements
    this.checkCondition({ type: 'level_complete', levelId });

    // Check mastery achievements
    if (mastery === 100) {
      this.checkCondition({ type: 'level_mastery', levelId, minMastery: 100 });
    }

    // Check speedrun achievements
    const parTimes: Record<string, number> = {
      'emergence': 10000,
      'first-lattice': 25000,
      'the-witness': 35000
      // ... etc
    };

    if (parTimes[levelId] && time <= parTimes[levelId]) {
      this.stats.speedruns.add(levelId);
      this.checkCondition({ type: 'speedrun', levelId, maxTime: parTimes[levelId] });
    }

    // Check no-backtrack
    if (!backtracked) {
      this.stats.noBacktrackLevels.add(levelId);
      this.checkCondition({ type: 'no_backtrack', levelId });
    }

    // Update save
    saveSystem.completeLevel(levelId, mastery);
  }

  /**
   * Track chapter completion
   */
  trackChapterComplete(chapter: number): void {
    this.checkCondition({ type: 'chapter_complete', chapter });
  }

  /**
   * Track witness time
   */
  trackWitnessTime(deltaMs: number): void {
    this.stats.witnessTime += deltaMs / 1000;
    this.checkCondition({ type: 'witness_time', seconds: Math.floor(this.stats.witnessTime) });
  }

  /**
   * Track dimension visit
   */
  trackDimensionVisit(dimension: DimensionType): void {
    this.stats.dimensionVisits[dimension]++;
    this.checkCondition({
      type: 'dimension_visits',
      dimension,
      count: this.stats.dimensionVisits[dimension]
    });
  }

  /**
   * Track void survival time
   */
  trackVoidSurvival(seconds: number): void {
    this.checkCondition({ type: 'void_survival', seconds });
  }

  /**
   * Track perfect sync
   */
  trackPerfectSync(): void {
    this.stats.perfectSyncs++;
    this.checkCondition({ type: 'perfect_sync', count: this.stats.perfectSyncs });
  }

  /**
   * Track coop completion
   */
  trackCoopCompletion(): void {
    this.stats.coopCompletions++;
    this.checkCondition({ type: 'coop_completions', count: this.stats.coopCompletions });
  }

  /**
   * Track friend helped
   */
  trackFriendHelped(): void {
    this.stats.friendsHelped++;
    this.checkCondition({ type: 'friends_helped', count: this.stats.friendsHelped });
  }

  /**
   * Track spectator
   */
  trackSpectator(): void {
    this.stats.totalSpectators++;
    this.checkCondition({ type: 'spectators_gained', count: this.stats.totalSpectators });
  }

  /**
   * Track secret found
   */
  trackSecretFound(secretId: string): void {
    this.stats.secretsFound.add(secretId);
    this.checkCondition({ type: 'find_secret', secretId });
  }

  /**
   * Track archetype discovery
   */
  trackArchetypeDiscovered(archetype: string): void {
    this.checkCondition({ type: 'archetype_discovered', archetype });
  }

  /**
   * Track SDPM samples
   */
  trackSDPMSamples(count: number): void {
    this.checkCondition({ type: 'sdpm_samples', count });
  }

  // ===========================================================================
  // CONDITION CHECKING
  // ===========================================================================

  private checkCondition(condition: AchievementCondition): void {
    for (const achievement of this.achievements.values()) {
      if (this.isUnlocked(achievement.id)) continue;
      if (!this.matchesCondition(achievement.condition, condition)) continue;
      if (!this.hasRequirements(achievement)) continue;

      this.unlock(achievement);
    }
  }

  private matchesCondition(achievementCond: AchievementCondition, eventCond: AchievementCondition): boolean {
    if (achievementCond.type !== eventCond.type) return false;

    switch (achievementCond.type) {
      case 'level_complete':
        return achievementCond.levelId === (eventCond as typeof achievementCond).levelId ||
               achievementCond.levelId === '*';

      case 'level_mastery':
        const masteryEvent = eventCond as typeof achievementCond;
        return (achievementCond.levelId === masteryEvent.levelId || achievementCond.levelId === '*') &&
               masteryEvent.minMastery >= achievementCond.minMastery;

      case 'chapter_complete':
        return achievementCond.chapter <= (eventCond as typeof achievementCond).chapter;

      case 'witness_time':
        return (eventCond as typeof achievementCond).seconds >= achievementCond.seconds;

      case 'dimension_visits':
        const visitEvent = eventCond as typeof achievementCond;
        return achievementCond.dimension === visitEvent.dimension &&
               visitEvent.count >= achievementCond.count;

      case 'void_survival':
        return (eventCond as typeof achievementCond).seconds >= achievementCond.seconds;

      case 'perfect_sync':
      case 'coop_completions':
      case 'friends_helped':
      case 'spectators_gained':
      case 'sdpm_samples':
        return (eventCond as any).count >= (achievementCond as any).count;

      case 'no_backtrack':
      case 'speedrun':
        const levelEvent = eventCond as typeof achievementCond;
        return achievementCond.levelId === levelEvent.levelId ||
               achievementCond.levelId === '*';

      case 'find_secret':
        const secretEvent = eventCond as typeof achievementCond;
        return achievementCond.secretId === secretEvent.secretId ||
               achievementCond.secretId === '*';

      case 'archetype_discovered':
        return true;  // Any archetype

      case 'custom':
        const checker = this.customCheckers.get(achievementCond.check);
        return checker ? checker() : false;

      default:
        return false;
    }
  }

  private hasRequirements(achievement: AchievementDefinition): boolean {
    if (!achievement.requires) return true;
    return achievement.requires.every(reqId => this.isUnlocked(reqId));
  }

  // ===========================================================================
  // UNLOCK HANDLING
  // ===========================================================================

  private unlock(achievement: AchievementDefinition): void {
    const progress: AchievementProgress = {
      id: achievement.id,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
      notified: false
    };

    this.progress.set(achievement.id, progress);

    // Save to persistent storage
    saveSystem.unlockAchievement(achievement.id);

    // Emit event
    const event: AchievementUnlockEvent = {
      achievement,
      timestamp: new Date()
    };

    this.emit('unlock', event);
  }

  isUnlocked(achievementId: string): boolean {
    return this.progress.get(achievementId)?.unlocked || false;
  }

  markNotified(achievementId: string): void {
    const progress = this.progress.get(achievementId);
    if (progress) {
      progress.notified = true;
    }
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  getAchievement(id: string): AchievementDefinition | undefined {
    return this.achievements.get(id);
  }

  getAllAchievements(): AchievementDefinition[] {
    return Array.from(this.achievements.values());
  }

  getUnlockedAchievements(): AchievementDefinition[] {
    return this.getAllAchievements().filter(a => this.isUnlocked(a.id));
  }

  getLockedAchievements(): AchievementDefinition[] {
    return this.getAllAchievements().filter(a => !this.isUnlocked(a.id));
  }

  getVisibleAchievements(): AchievementDefinition[] {
    return this.getAllAchievements().filter(a =>
      a.category !== 'hidden' || this.isUnlocked(a.id)
    );
  }

  getByCategory(category: AchievementCategory): AchievementDefinition[] {
    return this.getAllAchievements().filter(a => a.category === category);
  }

  getUnnotifiedUnlocks(): AchievementDefinition[] {
    return Array.from(this.progress.values())
      .filter(p => p.unlocked && !p.notified)
      .map(p => this.achievements.get(p.id)!)
      .filter(Boolean);
  }

  getTotalPoints(): number {
    return this.getUnlockedAchievements().reduce((sum, a) => sum + a.points, 0);
  }

  getMaxPoints(): number {
    return this.getAllAchievements().reduce((sum, a) => sum + a.points, 0);
  }

  getProgress(achievementId: string): AchievementProgress | undefined {
    return this.progress.get(achievementId);
  }

  // ===========================================================================
  // EVENTS
  // ===========================================================================

  on(event: string, callback: (data: AchievementUnlockEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: AchievementUnlockEvent) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: AchievementUnlockEvent): void {
    this.eventListeners.get(event)?.forEach(cb => cb(data));
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

export const achievementSystem = new AchievementSystem();
