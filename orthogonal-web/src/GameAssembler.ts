/**
 * GameAssembler.ts
 *
 * Assembles all game components into a runnable game instance
 * Handles dependency injection, initialization order, and wiring
 */

// Core systems
import { InputManager } from './core/InputManager';
import { DimensionManager } from './core/DimensionManager';

// Level systems
import { LevelRegistry, getLevelRegistry } from './level/LevelIndex';
import { LevelLoader } from './level/LevelLoader';
import { ProceduralLevelGenerator, GeneratorConfig } from './level/ProceduralLevelGenerator';
import { MultiplayerPatternGenerator, selectRandomPattern } from './level/MultiplayerPatterns';
import { SOLO_LEVELS } from './level/SoloLevels';
import { DUO_LEVELS } from './level/DuoLevels';
import { TRIO_LEVELS } from './level/TrioLevels';
import { QUAD_LEVELS } from './level/QuadLevels';

// Puzzle systems
import { PuzzleEngine } from './puzzle/PuzzleMechanics';

// Audio/Visual
import { AudioEngine } from './audio/AudioEngine';
import { ShaderPipeline } from './shaders/ShaderPipeline';

// Save/Progress
import { saveSystem } from './save/SaveSystem';
import { AchievementSystem } from './achievements/AchievementSystem';

// Streaming
import { StreamerMode } from './streaming/StreamerMode';
import { createLeaderboardSystem } from './streaming/StreamerLeaderboardSystem';
import { VerificationEmbedder } from './streaming/StreamVerification';

// Multiplayer
import { NetworkCore } from './network/NetworkCore';
import { PartySystem } from './network/PartySystem';

// =============================================================================
// TYPES
// =============================================================================

export interface GameConfig {
  canvas: HTMLCanvasElement;
  debug?: boolean;
  streamerMode?: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
  playerName?: string;
}

export interface AssembledGame {
  // Core
  input: InputManager;
  dimensions: DimensionManager;

  // Levels
  registry: LevelRegistry;
  loader: LevelLoader;
  proceduralGenerator: typeof ProceduralLevelGenerator;

  // Gameplay
  puzzle: PuzzleEngine;

  // Audio/Visual
  audio: AudioEngine;
  shaders: ShaderPipeline;

  // Progress
  save: typeof saveSystem;
  achievements: AchievementSystem;

  // Streaming
  streamer: StreamerMode | null;
  leaderboards: ReturnType<typeof createLeaderboardSystem> | null;

  // Network
  network: NetworkCore | null;
  party: PartySystem | null;

  // Utilities
  embedVerification: typeof VerificationEmbedder;

  // All static levels
  levels: {
    solo: typeof SOLO_LEVELS;
    duo: typeof DUO_LEVELS;
    trio: typeof TRIO_LEVELS;
    quad: typeof QUAD_LEVELS;
  };
}

// =============================================================================
// ASSEMBLER
// =============================================================================

export class GameAssembler {
  private config: GameConfig;
  private assembled: Partial<AssembledGame> = {};
  private initOrder: string[] = [];

  constructor(config: GameConfig) {
    this.config = config;
  }

  /**
   * Assemble all game components in correct order
   */
  async assemble(): Promise<AssembledGame> {
    console.log('[Assembler] Starting game assembly...');
    const startTime = performance.now();

    // Phase 1: Core systems (no dependencies)
    await this.initPhase('Core', async () => {
      this.assembled.input = new InputManager();
      this.assembled.dimensions = new DimensionManager();
      this.assembled.registry = getLevelRegistry();
    });

    // Phase 2: Audio/Visual (depends on canvas)
    await this.initPhase('Audio/Visual', async () => {
      this.assembled.audio = new AudioEngine();
      await this.assembled.audio.init();

      this.assembled.shaders = new ShaderPipeline(
        this.config.canvas.getContext('webgl2')!
      );
    });

    // Phase 3: Level systems
    await this.initPhase('Levels', async () => {
      this.assembled.loader = new LevelLoader(
        this.assembled.dimensions!,
        this.assembled.audio!
      );
      this.assembled.proceduralGenerator = ProceduralLevelGenerator;

      this.assembled.levels = {
        solo: SOLO_LEVELS,
        duo: DUO_LEVELS,
        trio: TRIO_LEVELS,
        quad: QUAD_LEVELS
      };
    });

    // Phase 4: Gameplay systems
    await this.initPhase('Gameplay', async () => {
      this.assembled.puzzle = new PuzzleEngine(
        this.assembled.dimensions!,
        this.assembled.audio!
      );
    });

    // Phase 5: Progress/Save
    await this.initPhase('Progress', async () => {
      this.assembled.save = saveSystem;
      await saveSystem.init();

      this.assembled.achievements = new AchievementSystem(saveSystem);
    });

    // Phase 6: Streaming (optional)
    await this.initPhase('Streaming', async () => {
      if (this.config.streamerMode) {
        this.assembled.streamer = new StreamerMode();
        await this.assembled.streamer.init();
      } else {
        this.assembled.streamer = null;
      }

      if (this.config.supabaseUrl && this.config.supabaseKey) {
        this.assembled.leaderboards = createLeaderboardSystem(
          this.config.supabaseUrl,
          this.config.supabaseKey
        );
      } else {
        this.assembled.leaderboards = null;
      }

      this.assembled.embedVerification = VerificationEmbedder;
    });

    // Phase 7: Network (optional)
    await this.initPhase('Network', async () => {
      if (this.config.supabaseUrl && this.config.supabaseKey) {
        this.assembled.network = new NetworkCore({
          supabaseUrl: this.config.supabaseUrl,
          supabaseKey: this.config.supabaseKey
        });

        this.assembled.party = new PartySystem(
          this.assembled.network,
          this.config.playerName || 'Player'
        );
      } else {
        this.assembled.network = null;
        this.assembled.party = null;
      }
    });

    const elapsed = performance.now() - startTime;
    console.log(`[Assembler] Assembly complete in ${elapsed.toFixed(0)}ms`);
    console.log(`[Assembler] Init order: ${this.initOrder.join(' -> ')}`);

    return this.assembled as AssembledGame;
  }

  private async initPhase(name: string, init: () => Promise<void>): Promise<void> {
    const start = performance.now();

    try {
      await init();
      this.initOrder.push(name);

      if (this.config.debug) {
        const elapsed = performance.now() - start;
        console.log(`[Assembler] ${name}: ${elapsed.toFixed(1)}ms`);
      }
    } catch (error) {
      console.error(`[Assembler] Failed to init ${name}:`, error);
      throw new Error(`Assembly failed at ${name}: ${error}`);
    }
  }
}

// =============================================================================
// QUICK ASSEMBLY FUNCTIONS
// =============================================================================

/**
 * Quick assembly for development
 */
export async function assembleGame(canvas: HTMLCanvasElement, options?: Partial<GameConfig>): Promise<AssembledGame> {
  const config: GameConfig = {
    canvas,
    debug: true,
    ...options
  };

  const assembler = new GameAssembler(config);
  return assembler.assemble();
}

/**
 * Production assembly with all features
 */
export async function assembleProductionGame(
  canvas: HTMLCanvasElement,
  supabaseUrl: string,
  supabaseKey: string,
  options?: Partial<GameConfig>
): Promise<AssembledGame> {
  const config: GameConfig = {
    canvas,
    supabaseUrl,
    supabaseKey,
    debug: false,
    streamerMode: true,
    ...options
  };

  const assembler = new GameAssembler(config);
  return assembler.assemble();
}

/**
 * Minimal assembly for testing
 */
export async function assembleTestGame(canvas: HTMLCanvasElement): Promise<AssembledGame> {
  const config: GameConfig = {
    canvas,
    debug: true,
    streamerMode: false
  };

  const assembler = new GameAssembler(config);
  return assembler.assemble();
}

// =============================================================================
// LEVEL HELPERS
// =============================================================================

/**
 * Get all available levels organized by player count
 */
export function getAllLevelsByPlayerCount(): Record<1 | 2 | 3 | 4, typeof SOLO_LEVELS[number][]> {
  return {
    1: [...SOLO_LEVELS],
    2: [...DUO_LEVELS],
    3: [...TRIO_LEVELS],
    4: [...QUAD_LEVELS]
  };
}

/**
 * Generate a procedural level for given config
 */
export function generateLevel(config: GeneratorConfig) {
  const generator = new ProceduralLevelGenerator(config);
  return generator.generate();
}

/**
 * Generate a multiplayer procedural level using patterns
 */
export function generateMultiplayerLevel(
  seed: number,
  playerCount: 2 | 3 | 4,
  difficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
) {
  const { SeededRandom } = require('./level/ProceduralLevelGenerator');
  const random = new SeededRandom(seed);

  const pattern = selectRandomPattern(random, playerCount);
  if (!pattern) {
    throw new Error(`No patterns available for ${playerCount} players`);
  }

  // Use pattern to guide generation
  const config: GeneratorConfig = {
    seed,
    difficulty,
    playerCount,
    theme: pattern.template.dimensionSplit ? 'transcendent' : 'crystalline'
  };

  const generator = new ProceduralLevelGenerator(config);
  return generator.generate();
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Level arrays
  SOLO_LEVELS,
  DUO_LEVELS,
  TRIO_LEVELS,
  QUAD_LEVELS,

  // Core classes
  ProceduralLevelGenerator,
  MultiplayerPatternGenerator,

  // Streaming
  VerificationEmbedder
};
