/**
 * LevelIndex.ts
 *
 * Central registry for all levels - static and procedural
 * Provides unified access for level selection, progression, and streaming
 */

import { StaticLevelDefinition } from './StaticLevels';
import { SOLO_LEVELS, SOLO_LEVEL_IDS } from './SoloLevels';
import { DUO_LEVELS, DUO_LEVEL_IDS } from './DuoLevels';
import { TRIO_LEVELS, TRIO_LEVEL_IDS } from './TrioLevels';
import { QUAD_LEVELS, QUAD_LEVEL_IDS } from './QuadLevels';
import { ProceduralLevelGenerator, GeneratorConfig, DifficultyTier } from './ProceduralLevelGenerator';

// =============================================================================
// TYPES
// =============================================================================

export type PlayerCount = 1 | 2 | 3 | 4;
export type LevelCategory = 'solo' | 'duo' | 'trio' | 'quad' | 'procedural' | 'elite';

export interface LevelInfo {
  id: string;
  name: string;
  subtitle: string;
  category: LevelCategory;
  playerCount: { min: number; max: number };
  difficulty: number;
  parTime: number;
  perfectTime: number;
  unlocked: boolean;
  completed: boolean;
  bestTime?: number;
  bestScore?: number;
  mechanics: string[];
}

export interface LevelProgress {
  completedLevels: Set<string>;
  bestTimes: Map<string, number>;
  bestScores: Map<string, number>;
  unlockedCategories: Set<LevelCategory>;
}

// =============================================================================
// ALL LEVELS COMBINED
// =============================================================================

export const ALL_STATIC_LEVELS: StaticLevelDefinition[] = [
  ...SOLO_LEVELS,
  ...DUO_LEVELS,
  ...TRIO_LEVELS,
  ...QUAD_LEVELS
];

export const LEVEL_BY_ID = new Map<string, StaticLevelDefinition>(
  ALL_STATIC_LEVELS.map(level => [level.id, level])
);

// =============================================================================
// LEVEL CATEGORIES
// =============================================================================

export const LEVEL_CATEGORIES: Record<LevelCategory, {
  name: string;
  description: string;
  playerCount: { min: number; max: number };
  levelIds: string[];
  unlockRequirement: string;
}> = {
  solo: {
    name: 'Solo Journey',
    description: '10 single-player levels. Master the basics.',
    playerCount: { min: 1, max: 1 },
    levelIds: SOLO_LEVEL_IDS,
    unlockRequirement: 'Available from start'
  },
  duo: {
    name: 'Duo Missions',
    description: '5 two-player cooperative puzzles. Trust your partner.',
    playerCount: { min: 2, max: 2 },
    levelIds: DUO_LEVEL_IDS,
    unlockRequirement: 'Complete Solo Level 3'
  },
  trio: {
    name: 'Trio Challenges',
    description: '5 three-player puzzles. Triangle dynamics.',
    playerCount: { min: 3, max: 3 },
    levelIds: TRIO_LEVEL_IDS,
    unlockRequirement: 'Complete Solo Level 5'
  },
  quad: {
    name: 'Quad Operations',
    description: '5 four-player epic puzzles. Ultimate coordination.',
    playerCount: { min: 4, max: 4 },
    levelIds: QUAD_LEVEL_IDS,
    unlockRequirement: 'Complete Solo Level 7'
  },
  procedural: {
    name: 'Infinite',
    description: 'Procedurally generated levels. Endless challenge.',
    playerCount: { min: 1, max: 4 },
    levelIds: [], // Generated on demand
    unlockRequirement: 'Complete any category finale'
  },
  elite: {
    name: 'Elite Gauntlet',
    description: 'The hardest challenges. For masters only.',
    playerCount: { min: 1, max: 4 },
    levelIds: [], // Special elite versions
    unlockRequirement: 'Complete all static levels'
  }
};

// =============================================================================
// LEVEL REGISTRY
// =============================================================================

export class LevelRegistry {
  private progress: LevelProgress;
  private proceduralGenerator: ProceduralLevelGenerator;

  constructor() {
    this.progress = this.loadProgress();
    this.proceduralGenerator = new ProceduralLevelGenerator();
  }

  // ---------------------------------------------------------------------------
  // LEVEL ACCESS
  // ---------------------------------------------------------------------------

  getLevel(id: string): StaticLevelDefinition | null {
    return LEVEL_BY_ID.get(id) || null;
  }

  getLevelsForPlayerCount(playerCount: PlayerCount): LevelInfo[] {
    const levels: LevelInfo[] = [];

    for (const level of ALL_STATIC_LEVELS) {
      if (playerCount >= level.minPlayers && playerCount <= level.maxPlayers) {
        levels.push(this.toLevelInfo(level));
      }
    }

    return levels.sort((a, b) => a.difficulty - b.difficulty);
  }

  getLevelsByCategory(category: LevelCategory): LevelInfo[] {
    const categoryInfo = LEVEL_CATEGORIES[category];
    if (!categoryInfo) return [];

    return categoryInfo.levelIds
      .map(id => LEVEL_BY_ID.get(id))
      .filter((l): l is StaticLevelDefinition => l !== undefined)
      .map(l => this.toLevelInfo(l));
  }

  private toLevelInfo(level: StaticLevelDefinition): LevelInfo {
    const category = this.getCategoryForLevel(level);

    return {
      id: level.id,
      name: level.name,
      subtitle: level.subtitle,
      category,
      playerCount: { min: level.minPlayers, max: level.maxPlayers },
      difficulty: level.difficulty,
      parTime: level.parTime,
      perfectTime: level.perfectTime,
      unlocked: this.isLevelUnlocked(level.id),
      completed: this.progress.completedLevels.has(level.id),
      bestTime: this.progress.bestTimes.get(level.id),
      bestScore: this.progress.bestScores.get(level.id),
      mechanics: level.mechanics
    };
  }

  private getCategoryForLevel(level: StaticLevelDefinition): LevelCategory {
    if (SOLO_LEVEL_IDS.includes(level.id)) return 'solo';
    if (DUO_LEVEL_IDS.includes(level.id)) return 'duo';
    if (TRIO_LEVEL_IDS.includes(level.id)) return 'trio';
    if (QUAD_LEVEL_IDS.includes(level.id)) return 'quad';
    return 'solo'; // Default
  }

  // ---------------------------------------------------------------------------
  // UNLOCKING
  // ---------------------------------------------------------------------------

  isLevelUnlocked(levelId: string): boolean {
    const level = LEVEL_BY_ID.get(levelId);
    if (!level) return false;

    const category = this.getCategoryForLevel(level);

    // Check category unlock
    if (!this.isCategoryUnlocked(category)) {
      return false;
    }

    // First level in each category is always unlocked
    const categoryLevelIds = LEVEL_CATEGORIES[category].levelIds;
    if (categoryLevelIds[0] === levelId) {
      return true;
    }

    // Subsequent levels require previous level completion
    const levelIndex = categoryLevelIds.indexOf(levelId);
    if (levelIndex > 0) {
      const previousLevelId = categoryLevelIds[levelIndex - 1];
      return this.progress.completedLevels.has(previousLevelId);
    }

    return true;
  }

  isCategoryUnlocked(category: LevelCategory): boolean {
    switch (category) {
      case 'solo':
        return true; // Always unlocked
      case 'duo':
        return this.progress.completedLevels.has('solo-stillness'); // Level 3
      case 'trio':
        return this.progress.completedLevels.has('solo-patience'); // Level 5
      case 'quad':
        return this.progress.completedLevels.has('solo-reflection'); // Level 7
      case 'procedural':
        return this.hasCompletedAnyFinale();
      case 'elite':
        return this.hasCompletedAllStatic();
      default:
        return false;
    }
  }

  private hasCompletedAnyFinale(): boolean {
    const finales = ['solo-transcendence', 'duo-orthogonal', 'trio-triad', 'quad-tetrad'];
    return finales.some(id => this.progress.completedLevels.has(id));
  }

  private hasCompletedAllStatic(): boolean {
    return ALL_STATIC_LEVELS.every(l => this.progress.completedLevels.has(l.id));
  }

  // ---------------------------------------------------------------------------
  // PROGRESS
  // ---------------------------------------------------------------------------

  completeLevel(levelId: string, timeMs: number, score: number): void {
    this.progress.completedLevels.add(levelId);

    const bestTime = this.progress.bestTimes.get(levelId);
    if (!bestTime || timeMs < bestTime) {
      this.progress.bestTimes.set(levelId, timeMs);
    }

    const bestScore = this.progress.bestScores.get(levelId);
    if (!bestScore || score > bestScore) {
      this.progress.bestScores.set(levelId, score);
    }

    this.saveProgress();
  }

  getProgress(): LevelProgress {
    return this.progress;
  }

  getCompletionStats(): {
    total: number;
    completed: number;
    percentage: number;
    byCategory: Record<LevelCategory, { total: number; completed: number }>;
  } {
    const stats = {
      total: ALL_STATIC_LEVELS.length,
      completed: this.progress.completedLevels.size,
      percentage: 0,
      byCategory: {} as Record<LevelCategory, { total: number; completed: number }>
    };

    stats.percentage = Math.round((stats.completed / stats.total) * 100);

    for (const [category, info] of Object.entries(LEVEL_CATEGORIES)) {
      if (info.levelIds.length > 0) {
        const completed = info.levelIds.filter(id =>
          this.progress.completedLevels.has(id)
        ).length;

        stats.byCategory[category as LevelCategory] = {
          total: info.levelIds.length,
          completed
        };
      }
    }

    return stats;
  }

  // ---------------------------------------------------------------------------
  // PROCEDURAL LEVELS
  // ---------------------------------------------------------------------------

  generateProceduralLevel(config: GeneratorConfig): StaticLevelDefinition {
    return this.proceduralGenerator.generate(config);
  }

  getDailyChallenge(playerCount: PlayerCount): StaticLevelDefinition {
    // Seed based on date + player count
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const seed = dateSeed * 10 + playerCount;

    return this.proceduralGenerator.generate({
      seed,
      difficulty: 'hard',
      playerCount
    });
  }

  getWeeklyElite(playerCount: PlayerCount): StaticLevelDefinition {
    const today = new Date();
    const weekNumber = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const seed = today.getFullYear() * 100 + weekNumber * 10 + playerCount;

    return this.proceduralGenerator.generate({
      seed,
      difficulty: 'elite',
      playerCount
    });
  }

  // ---------------------------------------------------------------------------
  // PERSISTENCE
  // ---------------------------------------------------------------------------

  private loadProgress(): LevelProgress {
    try {
      const saved = localStorage.getItem('orthogonal-progress');
      if (saved) {
        const data = JSON.parse(saved);
        return {
          completedLevels: new Set(data.completedLevels || []),
          bestTimes: new Map(Object.entries(data.bestTimes || {})),
          bestScores: new Map(Object.entries(data.bestScores || {})),
          unlockedCategories: new Set(data.unlockedCategories || ['solo'])
        };
      }
    } catch (e) {
      console.warn('Failed to load progress:', e);
    }

    return {
      completedLevels: new Set(),
      bestTimes: new Map(),
      bestScores: new Map(),
      unlockedCategories: new Set(['solo'])
    };
  }

  private saveProgress(): void {
    try {
      const data = {
        completedLevels: Array.from(this.progress.completedLevels),
        bestTimes: Object.fromEntries(this.progress.bestTimes),
        bestScores: Object.fromEntries(this.progress.bestScores),
        unlockedCategories: Array.from(this.progress.unlockedCategories)
      };
      localStorage.setItem('orthogonal-progress', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }

  resetProgress(): void {
    this.progress = {
      completedLevels: new Set(),
      bestTimes: new Map(),
      bestScores: new Map(),
      unlockedCategories: new Set(['solo'])
    };
    this.saveProgress();
  }
}

// =============================================================================
// LEVEL SELECTION UI HELPERS
// =============================================================================

export interface LevelSelectGroup {
  category: LevelCategory;
  name: string;
  description: string;
  unlocked: boolean;
  unlockRequirement: string;
  levels: LevelInfo[];
  completedCount: number;
}

export function getLevelSelectGroups(registry: LevelRegistry, playerCount?: PlayerCount): LevelSelectGroup[] {
  const groups: LevelSelectGroup[] = [];

  for (const [category, info] of Object.entries(LEVEL_CATEGORIES)) {
    const cat = category as LevelCategory;

    // Skip categories that don't match player count
    if (playerCount && (playerCount < info.playerCount.min || playerCount > info.playerCount.max)) {
      continue;
    }

    // Skip procedural and elite for now (handled separately)
    if (cat === 'procedural' || cat === 'elite') {
      continue;
    }

    const levels = registry.getLevelsByCategory(cat);
    const completedCount = levels.filter(l => l.completed).length;

    groups.push({
      category: cat,
      name: info.name,
      description: info.description,
      unlocked: registry.isCategoryUnlocked(cat),
      unlockRequirement: info.unlockRequirement,
      levels,
      completedCount
    });
  }

  return groups;
}

// =============================================================================
// STREAMER QUICK PICKS
// =============================================================================

export interface StreamerQuickPick {
  id: string;
  name: string;
  description: string;
  levelId: string;
  playerCount: PlayerCount;
  estimatedTime: string;
  viewerRating: number; // 1-5 stars for viewer engagement
}

export function getStreamerQuickPicks(registry: LevelRegistry): StreamerQuickPick[] {
  return [
    {
      id: 'quick-solo',
      name: '⚡ Quick Solo',
      description: 'Perfect for fills between games',
      levelId: 'solo-fork',
      playerCount: 1,
      estimatedTime: '2-3 min',
      viewerRating: 3
    },
    {
      id: 'duo-collab',
      name: '👥 Duo Collab',
      description: 'Great for collabs with another streamer',
      levelId: 'duo-relay',
      playerCount: 2,
      estimatedTime: '5-7 min',
      viewerRating: 4
    },
    {
      id: 'trio-chaos',
      name: '🔥 Trio Chaos',
      description: 'Maximum communication chaos',
      levelId: 'trio-witness',
      playerCount: 3,
      estimatedTime: '8-10 min',
      viewerRating: 5
    },
    {
      id: 'squad-epic',
      name: '👑 Squad Epic',
      description: 'Full squad content - peak engagement',
      levelId: 'quad-tetrad',
      playerCount: 4,
      estimatedTime: '10-15 min',
      viewerRating: 5
    },
    {
      id: 'daily-challenge',
      name: '📅 Daily Challenge',
      description: 'New seed every day - compete globally',
      levelId: 'procedural-daily',
      playerCount: 1,
      estimatedTime: '3-5 min',
      viewerRating: 4
    },
    {
      id: 'viewer-race',
      name: '🏁 Viewer Race',
      description: 'Race against chat predictions',
      levelId: 'procedural-race',
      playerCount: 1,
      estimatedTime: '2-4 min',
      viewerRating: 5
    }
  ];
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let registryInstance: LevelRegistry | null = null;

export function getLevelRegistry(): LevelRegistry {
  if (!registryInstance) {
    registryInstance = new LevelRegistry();
  }
  return registryInstance;
}
