/**
 * Orthogonal.ts
 *
 * The unified game entry point
 * Wires all systems together into a playable experience
 */

import * as THREE from 'three';

// Core systems
import { LevelScene } from './scene/LevelScene';
import { levelLoader, LevelRuntime } from './level/LevelLoader';
import { STATIC_LEVELS, canPlayLevel } from './level/StaticLevels';
import { PuzzleEngine } from './puzzle/PuzzleMechanics';
import { DimensionManager } from './core/DimensionManager';

// Player systems
import { InputManager } from './core/InputManager';
import { AwarenessController } from './core/AwarenessController';
import { SDPMProfileManager as SDPMProfiler } from './player/SDPMProfile';

// Audio/Visual
import { AudioEngine } from './audio/AudioEngine';
import { ShaderPipeline } from './shaders/ShaderPipeline';

// Persistence
import { saveSystem } from './save/SaveSystem';
import { achievementSystem } from './achievements/AchievementSystem';
import { analytics } from './analytics/Analytics';

// Meta
import { metaAwareness } from './meta/MetaAwareness';
import { ReplayRecorder, replayStorage } from './replay/ReplaySystem';

// Streaming
import { streamerSetup, viewerInteraction, quickCommands } from './streaming/StreamerMode';
import { liveLeaderboard, viewerChallenge, liveRace } from './streaming/StreamerLeaderboards';

// Network
import { NetworkCore } from './network/NetworkCore';
import { PartySystem } from './network/PartySystem';
import { initMatchmaking, getMatchmaking, MatchmakingSystem, MatchmakingUI, getMatchmakingUI } from './network/Matchmaking';

// UI
import { MainMenu } from './ui/MainMenu';

// =============================================================================
// TYPES
// =============================================================================

export type GameState =
  | 'loading'
  | 'menu'
  | 'playing'
  | 'paused'
  | 'level-complete'
  | 'game-over';

export interface OrthogonalConfig {
  canvas: HTMLCanvasElement;
  debug?: boolean;
  skipIntro?: boolean;
  startLevel?: string;
  streamerMode?: boolean;
}

export interface GameStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
}

// =============================================================================
// MAIN GAME CLASS
// =============================================================================

export class Orthogonal {
  // Config
  private config: OrthogonalConfig;
  private debug: boolean;

  // Three.js
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Core systems
  private levelScene: LevelScene;
  private inputManager: InputManager;
  private awarenessController: AwarenessController;
  private audioEngine: AudioEngine;
  private shaderPipeline: ShaderPipeline;

  // Player
  private playerId: string;
  private sdpmProfiler: SDPMProfiler;

  // State
  private state: GameState = 'loading';
  private currentLevelId: string | null = null;
  private isPaused: boolean = false;

  // Timing
  private clock: THREE.Clock;
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsTime: number = 0;

  // UI
  private mainMenu: MainMenu | null = null;
  private gameContainer: HTMLElement;
  private uiContainer: HTMLElement;

  // Network & Matchmaking
  private network: NetworkCore;
  private party: PartySystem;
  private matchmaking: MatchmakingSystem | null = null;

  // Animation
  private animationId: number = 0;
  private isRunning: boolean = false;

  constructor(config: OrthogonalConfig) {
    this.config = config;
    this.debug = config.debug || false;
    this.playerId = this.generatePlayerId();
    this.clock = new THREE.Clock();

    // Create containers
    this.gameContainer = this.createGameContainer();
    this.uiContainer = this.createUIContainer();

    // Initialize Three.js
    this.renderer = this.createRenderer(config.canvas);
    this.scene = new THREE.Scene();
    this.camera = this.createCamera();

    // Initialize systems (order matters)
    this.inputManager = new InputManager(config.canvas);
    this.audioEngine = new AudioEngine();
    this.shaderPipeline = new ShaderPipeline(this.renderer, this.scene, this.camera);
    this.levelScene = new LevelScene(config.canvas);
    this.awarenessController = new AwarenessController(this.camera, this.inputManager);
    this.sdpmProfiler = new SDPMProfiler();

    // Initialize network and matchmaking
    this.network = new NetworkCore();
    this.party = new PartySystem(this.network);
    this.matchmaking = initMatchmaking(this.network, this.party);
    this.setupMatchmakingEvents();

    // Setup event listeners
    this.setupEventListeners();
    this.setupWindowEvents();
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize and start the game
   */
  async init(): Promise<void> {
    this.setState('loading');

    try {
      // Show loading screen
      this.showLoadingScreen();

      // Initialize save system
      await saveSystem.init();

      // Initialize achievements
      achievementSystem.init();

      // Initialize meta-awareness
      metaAwareness.init();

      // Initialize analytics
      const progress = saveSystem.getProgress();
      analytics.startSession(progress.playerId || this.playerId);

      // Initialize audio (requires user interaction)
      await this.audioEngine.init();

      // Check for streamer mode
      if (this.config.streamerMode) {
        await streamerSetup.oneClickSetup();
      }

      // Load SDPM profile
      const sdpmData = saveSystem.getSDPM();
      if (sdpmData.archetype !== 'unknown') {
        this.sdpmProfiler.loadProfile(sdpmData);
      }

      // Hide loading, show menu or start level
      this.hideLoadingScreen();

      if (this.config.startLevel) {
        await this.startLevel(this.config.startLevel);
      } else if (this.config.skipIntro) {
        this.showMainMenu();
      } else {
        await this.playIntro();
      }

      // Start game loop
      this.start();

    } catch (error) {
      console.error('[Orthogonal] Init failed:', error);
      this.showError('Failed to initialize game');
    }
  }

  private createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    return renderer;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 20);
    return camera;
  }

  private createGameContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.cssText = `
      position: fixed;
      inset: 0;
      overflow: hidden;
    `;
    document.body.appendChild(container);
    return container;
  }

  private createUIContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'ui-container';
    container.className = 'game-ui';
    container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 100;
    `;
    document.body.appendChild(container);
    return container;
  }

  private generatePlayerId(): string {
    let id = localStorage.getItem('orthogonal_player_id');
    if (!id) {
      id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem('orthogonal_player_id', id);
    }
    return id;
  }

  // ===========================================================================
  // GAME LOOP
  // ===========================================================================

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.clock.start();
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(() => this.gameLoop());

    // Calculate delta time
    const now = performance.now();
    this.deltaTime = now - this.lastTime;
    this.lastTime = now;

    // Cap delta time to prevent spiral of death
    const dt = Math.min(this.deltaTime, 33.33);  // Max ~30fps minimum

    // Update FPS counter
    this.updateFPS(now);

    // Update game
    if (!this.isPaused) {
      this.update(dt);
    }

    // Render
    this.render();
  }

  private updateFPS(now: number): void {
    this.frameCount++;
    if (now - this.fpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = now;

      if (this.debug) {
        console.log(`[FPS] ${this.fps}`);
      }
    }
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  private update(deltaTime: number): void {
    switch (this.state) {
      case 'menu':
        this.updateMenu(deltaTime);
        break;

      case 'playing':
        this.updatePlaying(deltaTime);
        break;

      case 'paused':
        // Minimal updates when paused
        break;

      case 'level-complete':
        this.updateLevelComplete(deltaTime);
        break;
    }

    // Always update these
    this.inputManager.update();
    this.audioEngine.update(performance.now(), this.awarenessController.getPosition());
  }

  private updateMenu(deltaTime: number): void {
    // Menu has its own awareness-based reveal
    if (this.mainMenu) {
      this.mainMenu.update(deltaTime, this.inputManager.getMousePosition());
    }
  }

  private updatePlaying(deltaTime: number): void {
    // Update awareness controller with input
    const mousePos = this.inputManager.getMousePosition();
    const isWitnessing = this.inputManager.isKeyDown('Space') ||
                         this.inputManager.isMouseButtonDown(1);

    this.awarenessController.update(deltaTime);

    // Feed input to SDPM profiler
    this.sdpmProfiler.recordInput({
      mousePosition: mousePos,
      mouseVelocity: this.inputManager.getMouseVelocity(),
      isWitnessing,
      timestamp: performance.now()
    });

    // Update level scene
    this.levelScene.update(deltaTime);

    // Update meta-awareness
    metaAwareness.update(deltaTime);

    // Track play time
    saveSystem.addPlayTime(deltaTime);

    // Camera follow
    this.levelScene.followPlayer(0.05);
  }

  private updateLevelComplete(deltaTime: number): void {
    // Celebration animations, etc.
  }

  // ===========================================================================
  // RENDER
  // ===========================================================================

  private render(): void {
    // Clear
    this.renderer.setClearColor(0x0a0a0f);
    this.renderer.clear();

    switch (this.state) {
      case 'menu':
        // Render menu background
        this.renderer.render(this.scene, this.camera);
        break;

      case 'playing':
      case 'paused':
      case 'level-complete':
        // Render level with post-processing
        this.levelScene.render();
        break;

      default:
        this.renderer.render(this.scene, this.camera);
    }
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  private setState(state: GameState): void {
    const prevState = this.state;
    this.state = state;

    console.log(`[Orthogonal] State: ${prevState} -> ${state}`);

    // State transition logic
    switch (state) {
      case 'playing':
        this.onEnterPlaying();
        break;
      case 'paused':
        this.onEnterPaused();
        break;
      case 'level-complete':
        this.onEnterLevelComplete();
        break;
      case 'menu':
        this.onEnterMenu();
        break;
    }
  }

  private onEnterPlaying(): void {
    this.isPaused = false;
    this.hidePauseMenu();
    this.audioEngine.resume();
  }

  private onEnterPaused(): void {
    this.isPaused = true;
    this.showPauseMenu();
    this.audioEngine.pause();
  }

  private onEnterLevelComplete(): void {
    // Save progress
    if (this.currentLevelId) {
      const runtime = this.levelScene.getRuntime();
      if (runtime) {
        const state = runtime.getState() as any;
        saveSystem.completeLevel(this.currentLevelId, 100);  // TODO: Calculate actual mastery
      }
    }
  }

  private onEnterMenu(): void {
    this.currentLevelId = null;
  }

  // ===========================================================================
  // LEVEL MANAGEMENT
  // ===========================================================================

  /**
   * Start a level by ID
   */
  async startLevel(levelId: string): Promise<boolean> {
    // Check if level is unlocked
    const completedLevels = new Set(saveSystem.getProgress().completedLevels);
    const levelDef = STATIC_LEVELS.find(l => l.id === levelId);

    if (levelDef && !canPlayLevel(levelDef.chapter, completedLevels)) {
      this.showMessage('Level locked. Complete previous levels first.');
      return false;
    }

    // Load the level
    const success = this.levelScene.loadLevel(levelId);
    if (!success) {
      this.showError(`Failed to load level: ${levelId}`);
      return false;
    }

    this.currentLevelId = levelId;
    this.setState('playing');

    // Setup level-specific event handlers
    this.setupLevelEvents();

    // Track analytics
    analytics.trackLevelStart(levelId, 0);

    // Check for meta-awareness triggers
    metaAwareness.checkCompletionTriggers(
      completedLevels.size,
      STATIC_LEVELS.length
    );

    return true;
  }

  /**
   * Restart current level
   */
  restartLevel(): void {
    if (this.currentLevelId) {
      this.startLevel(this.currentLevelId);
    }
  }

  /**
   * Exit to main menu
   */
  exitToMenu(): void {
    this.levelScene.getRuntime();  // Stop any running level
    this.showMainMenu();
  }

  private setupLevelEvents(): void {
    const runtime = this.levelScene.getRuntime();
    if (!runtime) return;

    runtime.on('level-complete', (data) => {
      this.onLevelComplete(data);
    });

    runtime.on('level-fail', (data) => {
      this.onLevelFail(data);
    });
  }

  private onLevelComplete(data: any): void {
    this.setState('level-complete');

    // Show completion UI
    this.showLevelCompleteUI(data);

    // Achievement tracking
    if (this.currentLevelId) {
      achievementSystem.trackLevelComplete(
        this.currentLevelId,
        data.mastery || 100,
        data.time,
        data.backtrackCount > 0
      );
    }

    // Audio celebration
    this.audioEngine.playSound('uiConfirm');
  }

  private onLevelFail(data: any): void {
    this.setState('game-over');
    this.showGameOverUI(data.reason);
  }

  // ===========================================================================
  // UI
  // ===========================================================================

  private showLoadingScreen(): void {
    const loading = document.createElement('div');
    loading.id = 'loading-screen';
    loading.innerHTML = `
      <style>
        #loading-screen {
          position: fixed;
          inset: 0;
          background: #0a0a0f;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: system-ui, sans-serif;
          color: white;
        }
        .loading-title {
          font-size: 3rem;
          font-weight: 200;
          letter-spacing: 0.5em;
          margin-bottom: 2rem;
        }
        .loading-bar {
          width: 200px;
          height: 2px;
          background: rgba(255,255,255,0.1);
          border-radius: 1px;
          overflow: hidden;
        }
        .loading-progress {
          height: 100%;
          width: 30%;
          background: white;
          animation: loading-slide 1.5s ease-in-out infinite;
        }
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      </style>
      <div class="loading-title">ORTHOGONAL</div>
      <div class="loading-bar">
        <div class="loading-progress"></div>
      </div>
    `;
    document.body.appendChild(loading);
  }

  private hideLoadingScreen(): void {
    const loading = document.getElementById('loading-screen');
    if (loading) {
      loading.style.transition = 'opacity 0.5s';
      loading.style.opacity = '0';
      setTimeout(() => loading.remove(), 500);
    }
  }

  private async playIntro(): Promise<void> {
    // Simple intro sequence
    return new Promise((resolve) => {
      const intro = document.createElement('div');
      intro.id = 'intro-screen';
      intro.innerHTML = `
        <style>
          #intro-screen {
            position: fixed;
            inset: 0;
            background: #0a0a0f;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: system-ui, sans-serif;
            color: white;
            animation: intro-fade 4s ease-in-out forwards;
          }
          @keyframes intro-fade {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }
          .intro-text {
            font-size: 1.5rem;
            font-weight: 200;
            letter-spacing: 0.2em;
            opacity: 0;
            animation: text-reveal 3s ease-out 0.5s forwards;
          }
          @keyframes text-reveal {
            0% { opacity: 0; transform: translateY(20px); }
            50% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        </style>
        <div class="intro-text">You are not the body.</div>
      `;
      document.body.appendChild(intro);

      setTimeout(() => {
        intro.remove();
        this.showMainMenu();
        resolve();
      }, 4000);
    });
  }

  private showMainMenu(): void {
    this.setState('menu');

    // Create menu UI
    const menuHtml = `
      <div id="main-menu" style="
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, sans-serif;
        color: white;
        pointer-events: auto;
      ">
        <div style="font-size: 4rem; font-weight: 100; letter-spacing: 0.3em; margin-bottom: 3rem;">
          ORTHOGONAL
        </div>
        <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center;">
          <button class="menu-btn" data-action="play" style="
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 1rem 3rem;
            font-size: 1.2rem;
            font-weight: 300;
            letter-spacing: 0.2em;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 4px;
          ">PLAY</button>
          <button class="menu-btn" data-action="multiplayer" style="
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
            border: 1px solid rgba(102, 126, 234, 0.3);
            color: white;
            padding: 0.8rem 2rem;
            font-size: 1rem;
            letter-spacing: 0.1em;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 4px;
          ">MULTIPLAYER</button>
          <button class="menu-btn" data-action="levels" style="
            background: transparent;
            border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.7);
            padding: 0.8rem 2rem;
            font-size: 1rem;
            letter-spacing: 0.1em;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 4px;
          ">LEVEL SELECT</button>
          <button class="menu-btn" data-action="settings" style="
            background: transparent;
            border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.7);
            padding: 0.8rem 2rem;
            font-size: 1rem;
            letter-spacing: 0.1em;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 4px;
          ">SETTINGS</button>
        </div>
        <div style="position: absolute; bottom: 2rem; opacity: 0.3; font-size: 0.8rem;">
          Move your attention. Focus to proceed.
        </div>
      </div>
    `;

    this.uiContainer.innerHTML = menuHtml;

    // Add hover effects
    this.uiContainer.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        (btn as HTMLElement).style.background = 'rgba(255,255,255,0.2)';
        (btn as HTMLElement).style.borderColor = 'rgba(255,255,255,0.4)';
      });
      btn.addEventListener('mouseleave', () => {
        (btn as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
        (btn as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
      });
    });

    // Handle clicks
    this.uiContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      switch (action) {
        case 'play':
          this.startNextLevel();
          break;
        case 'multiplayer':
          this.showMultiplayerMenu();
          break;
        case 'levels':
          this.showLevelSelect();
          break;
        case 'settings':
          this.showSettings();
          break;
      }
    });
  }

  private showMultiplayerMenu(): void {
    const menuHtml = `
      <div id="multiplayer-menu" style="
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, sans-serif;
        color: white;
        pointer-events: auto;
        background: rgba(10, 10, 15, 0.9);
      ">
        <div style="font-size: 2rem; font-weight: 100; letter-spacing: 0.2em; margin-bottom: 2rem;">
          MULTIPLAYER
        </div>
        <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center;">
          <button class="mm-btn" data-mm-action="quick-duo" style="
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
            border: 1px solid rgba(102, 126, 234, 0.4);
            color: white;
            padding: 1rem 2.5rem;
            font-size: 1.1rem;
            font-weight: 400;
            letter-spacing: 0.15em;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 8px;
            min-width: 220px;
          ">QUICK MATCH (2P)</button>
          <button class="mm-btn" data-mm-action="quick-quad" style="
            background: linear-gradient(135deg, rgba(234, 102, 126, 0.3), rgba(162, 75, 118, 0.3));
            border: 1px solid rgba(234, 102, 126, 0.4);
            color: white;
            padding: 1rem 2.5rem;
            font-size: 1.1rem;
            font-weight: 400;
            letter-spacing: 0.15em;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 8px;
            min-width: 220px;
          ">QUICK MATCH (4P)</button>
          <button class="mm-btn" data-mm-action="browse" style="
            background: transparent;
            border: 1px solid rgba(255,255,255,0.2);
            color: rgba(255,255,255,0.8);
            padding: 0.8rem 2rem;
            font-size: 1rem;
            letter-spacing: 0.1em;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 6px;
            min-width: 220px;
          ">BROWSE LEVELS</button>
          <button class="mm-btn" data-mm-action="back" style="
            background: transparent;
            border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.5);
            padding: 0.6rem 1.5rem;
            font-size: 0.9rem;
            letter-spacing: 0.1em;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 4px;
            margin-top: 1rem;
          ">← BACK</button>
        </div>
        <div style="position: absolute; bottom: 2rem; opacity: 0.3; font-size: 0.8rem;">
          Cooperative puzzles require true coordination
        </div>
      </div>
    `;

    this.uiContainer.innerHTML = menuHtml;

    // Handle clicks
    this.uiContainer.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.mmAction;

      switch (action) {
        case 'quick-duo':
          this.startQuickMatchDuo();
          break;
        case 'quick-quad':
          this.startQuickMatchQuad();
          break;
        case 'browse':
          this.showMultiplayerLevelSelect();
          break;
        case 'back':
          this.showMainMenu();
          break;
      }
    });
  }

  private async startQuickMatchDuo(): Promise<void> {
    if (!this.matchmaking) return;

    try {
      const mmUI = getMatchmakingUI();
      if (mmUI) mmUI.show();
      await this.matchmaking.quickMatchDuo();
    } catch (error) {
      this.showMessage('Failed to start matchmaking');
    }
  }

  private async startQuickMatchQuad(): Promise<void> {
    if (!this.matchmaking) return;

    try {
      const mmUI = getMatchmakingUI();
      if (mmUI) mmUI.show();
      await this.matchmaking.quickMatchQuad();
    } catch (error) {
      this.showMessage('Failed to start matchmaking');
    }
  }

  private showMultiplayerLevelSelect(): void {
    const mpLevels = STATIC_LEVELS.filter(l => l.minPlayers >= 2);

    const levelButtons = mpLevels.map(level => `
      <button class="level-btn" data-level="${level.id}" style="
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        color: white;
        padding: 1rem 2rem;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s;
        border-radius: 8px;
        text-align: left;
        width: 100%;
        max-width: 400px;
      ">
        <div style="font-weight: 500; margin-bottom: 0.3rem;">${level.name}</div>
        <div style="font-size: 0.8rem; opacity: 0.6;">${level.minPlayers}-${level.maxPlayers} players • ${level.subtitle}</div>
      </button>
    `).join('');

    const menuHtml = `
      <div id="mp-level-select" style="
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, sans-serif;
        color: white;
        pointer-events: auto;
        background: rgba(10, 10, 15, 0.95);
        padding: 2rem;
        overflow-y: auto;
      ">
        <div style="font-size: 1.5rem; font-weight: 100; letter-spacing: 0.2em; margin-bottom: 2rem;">
          MULTIPLAYER LEVELS
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.8rem; align-items: center; max-height: 60vh; overflow-y: auto; padding: 1rem;">
          ${levelButtons}
        </div>
        <button class="back-btn" data-action="back" style="
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          padding: 0.6rem 1.5rem;
          font-size: 0.9rem;
          cursor: pointer;
          border-radius: 4px;
          margin-top: 1.5rem;
        ">← BACK</button>
      </div>
    `;

    this.uiContainer.innerHTML = menuHtml;

    // Handle level clicks
    this.uiContainer.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const levelId = (btn as HTMLElement).dataset.level;
        if (levelId && this.matchmaking) {
          const mmUI = getMatchmakingUI();
          if (mmUI) mmUI.show();
          await this.matchmaking.quickMatchLevel(levelId);
        }
      });
    });

    // Handle back
    this.uiContainer.querySelector('.back-btn')?.addEventListener('click', () => {
      this.showMultiplayerMenu();
    });
  }

  private startNextLevel(): void {
    const progress = saveSystem.getProgress();
    const completed = new Set(progress.completedLevels);

    // Find first incomplete level
    for (const level of STATIC_LEVELS) {
      if (!completed.has(level.id)) {
        this.hideMainMenu();
        this.startLevel(level.id);
        return;
      }
    }

    // All complete - start procedural
    this.hideMainMenu();
    this.showMessage('All static levels complete! Procedural mode coming soon.');
  }

  private hideMainMenu(): void {
    const menu = document.getElementById('main-menu');
    if (menu) {
      menu.style.transition = 'opacity 0.3s';
      menu.style.opacity = '0';
      setTimeout(() => menu.remove(), 300);
    }
  }

  private showLevelSelect(): void {
    const progress = saveSystem.getProgress();
    const completed = new Set(progress.completedLevels);

    const html = `
      <div id="level-select" style="
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4rem;
        overflow-y: auto;
        font-family: system-ui, sans-serif;
        color: white;
        pointer-events: auto;
      ">
        <div style="font-size: 2rem; font-weight: 200; margin-bottom: 2rem;">LEVELS</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; max-width: 900px; width: 100%;">
          ${STATIC_LEVELS.map(level => {
            const isCompleted = completed.has(level.id);
            const isLocked = !canPlayLevel(level.chapter, completed);
            const mastery = progress.levelMastery[level.id] || 0;

            return `
              <div class="level-card" data-level="${level.id}" style="
                background: ${isCompleted ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)'};
                border: 1px solid ${isCompleted ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'};
                border-radius: 8px;
                padding: 1.5rem;
                cursor: ${isLocked ? 'not-allowed' : 'pointer'};
                opacity: ${isLocked ? '0.4' : '1'};
                transition: all 0.2s;
              ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span style="font-size: 0.8rem; opacity: 0.5;">Chapter ${level.chapter}</span>
                  ${isCompleted ? '<span style="color: #00ff88;">✓</span>' : ''}
                  ${isLocked ? '<span>🔒</span>' : ''}
                </div>
                <div style="font-size: 1.2rem; font-weight: 500; margin-bottom: 0.5rem;">${level.name}</div>
                <div style="font-size: 0.9rem; opacity: 0.6; font-style: italic;">${level.subtitle}</div>
                ${isCompleted ? `<div style="margin-top: 0.5rem; font-size: 0.8rem;">Mastery: ${mastery}%</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        <button id="back-to-menu" style="
          margin-top: 2rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.8rem 2rem;
          cursor: pointer;
          border-radius: 4px;
        ">BACK</button>
      </div>
    `;

    this.uiContainer.innerHTML = html;

    // Handle level clicks
    this.uiContainer.querySelectorAll('.level-card').forEach(card => {
      card.addEventListener('click', () => {
        const levelId = (card as HTMLElement).dataset.level;
        if (levelId && !card.classList.contains('locked')) {
          this.hideLevelSelect();
          this.hideMainMenu();
          this.startLevel(levelId);
        }
      });

      card.addEventListener('mouseenter', () => {
        if ((card as HTMLElement).style.opacity !== '0.4') {
          (card as HTMLElement).style.transform = 'scale(1.02)';
        }
      });
      card.addEventListener('mouseleave', () => {
        (card as HTMLElement).style.transform = 'scale(1)';
      });
    });

    // Back button
    document.getElementById('back-to-menu')?.addEventListener('click', () => {
      this.hideLevelSelect();
    });
  }

  private hideLevelSelect(): void {
    document.getElementById('level-select')?.remove();
  }

  private showSettings(): void {
    const settings = saveSystem.getSettings();

    const html = `
      <div id="settings-panel" style="
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4rem;
        overflow-y: auto;
        font-family: system-ui, sans-serif;
        color: white;
        pointer-events: auto;
      ">
        <div style="font-size: 2rem; font-weight: 200; margin-bottom: 2rem;">SETTINGS</div>
        <div style="max-width: 500px; width: 100%;">
          <div style="margin-bottom: 2rem;">
            <div style="font-weight: 500; margin-bottom: 1rem;">Audio</div>
            <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span>Master Volume</span>
              <input type="range" min="0" max="100" value="${settings.audio.masterVolume * 100}" data-setting="audio.masterVolume" style="width: 150px;">
            </label>
            <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span>Music</span>
              <input type="range" min="0" max="100" value="${settings.audio.musicVolume * 100}" data-setting="audio.musicVolume" style="width: 150px;">
            </label>
            <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span>Effects</span>
              <input type="range" min="0" max="100" value="${settings.audio.sfxVolume * 100}" data-setting="audio.sfxVolume" style="width: 150px;">
            </label>
          </div>
          <div style="margin-bottom: 2rem;">
            <div style="font-weight: 500; margin-bottom: 1rem;">Graphics</div>
            <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span>Quality</span>
              <select data-setting="graphics.quality" style="background: #222; color: white; border: 1px solid #444; padding: 0.3rem;">
                <option value="low" ${settings.graphics.quality === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${settings.graphics.quality === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${settings.graphics.quality === 'high' ? 'selected' : ''}>High</option>
                <option value="ultra" ${settings.graphics.quality === 'ultra' ? 'selected' : ''}>Ultra</option>
              </select>
            </label>
            <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span>Post Processing</span>
              <input type="checkbox" ${settings.graphics.postProcessing ? 'checked' : ''} data-setting="graphics.postProcessing">
            </label>
          </div>
        </div>
        <button id="close-settings" style="
          margin-top: 2rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.8rem 2rem;
          cursor: pointer;
          border-radius: 4px;
        ">SAVE & CLOSE</button>
      </div>
    `;

    this.uiContainer.innerHTML = html;

    // Handle input changes
    this.uiContainer.querySelectorAll('[data-setting]').forEach(input => {
      input.addEventListener('change', () => {
        const path = (input as HTMLElement).dataset.setting!.split('.');
        const value = (input as HTMLInputElement).type === 'checkbox'
          ? (input as HTMLInputElement).checked
          : (input as HTMLInputElement).type === 'range'
            ? parseInt((input as HTMLInputElement).value) / 100
            : (input as HTMLInputElement).value;

        // Update settings
        const update: any = {};
        update[path[0]] = { [path[1]]: value };
        saveSystem.updateSettings(update);

        // Apply immediately for audio
        if (path[0] === 'audio') {
          this.audioEngine.setVolume(path[1], value as number);
        }
      });
    });

    document.getElementById('close-settings')?.addEventListener('click', () => {
      document.getElementById('settings-panel')?.remove();
    });
  }

  private showPauseMenu(): void {
    const html = `
      <div id="pause-menu" style="
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, sans-serif;
        color: white;
        pointer-events: auto;
        z-index: 1000;
      ">
        <div style="font-size: 2rem; font-weight: 200; margin-bottom: 2rem;">PAUSED</div>
        <button class="pause-btn" data-action="resume" style="
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 1rem 2rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          border-radius: 4px;
          width: 200px;
        ">Resume</button>
        <button class="pause-btn" data-action="restart" style="
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          padding: 0.8rem 2rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          border-radius: 4px;
          width: 200px;
        ">Restart Level</button>
        <button class="pause-btn" data-action="exit" style="
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          padding: 0.8rem 2rem;
          cursor: pointer;
          border-radius: 4px;
          width: 200px;
        ">Exit to Menu</button>
      </div>
    `;

    this.uiContainer.insertAdjacentHTML('beforeend', html);

    this.uiContainer.querySelectorAll('.pause-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = (btn as HTMLElement).dataset.action;
        switch (action) {
          case 'resume':
            this.resume();
            break;
          case 'restart':
            this.hidePauseMenu();
            this.restartLevel();
            break;
          case 'exit':
            this.hidePauseMenu();
            this.exitToMenu();
            break;
        }
      });
    });
  }

  private hidePauseMenu(): void {
    document.getElementById('pause-menu')?.remove();
  }

  private showLevelCompleteUI(data: any): void {
    const html = `
      <div id="level-complete" style="
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, sans-serif;
        color: white;
        pointer-events: auto;
        z-index: 1000;
      ">
        <div style="font-size: 3rem; margin-bottom: 1rem;">✨</div>
        <div style="font-size: 2rem; font-weight: 200; margin-bottom: 2rem;">LEVEL COMPLETE</div>
        <div style="margin-bottom: 2rem; text-align: center; opacity: 0.7;">
          <div>Time: ${this.formatTime(data.time)}</div>
          <div>Nodes Visited: ${data.nodesVisited}</div>
        </div>
        <button id="next-level-btn" style="
          background: rgba(0,255,136,0.2);
          border: 1px solid rgba(0,255,136,0.4);
          color: white;
          padding: 1rem 2rem;
          cursor: pointer;
          border-radius: 4px;
          font-size: 1.1rem;
        ">CONTINUE</button>
      </div>
    `;

    this.uiContainer.insertAdjacentHTML('beforeend', html);

    document.getElementById('next-level-btn')?.addEventListener('click', () => {
      document.getElementById('level-complete')?.remove();
      this.startNextLevel();
    });
  }

  private showGameOverUI(reason: string): void {
    const html = `
      <div id="game-over" style="
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, sans-serif;
        color: white;
        pointer-events: auto;
        z-index: 1000;
      ">
        <div style="font-size: 2rem; font-weight: 200; margin-bottom: 1rem;">LOST IN THE VOID</div>
        <div style="opacity: 0.5; margin-bottom: 2rem;">${reason}</div>
        <button id="retry-btn" style="
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 1rem 2rem;
          cursor: pointer;
          border-radius: 4px;
        ">TRY AGAIN</button>
      </div>
    `;

    this.uiContainer.insertAdjacentHTML('beforeend', html);

    document.getElementById('retry-btn')?.addEventListener('click', () => {
      document.getElementById('game-over')?.remove();
      this.restartLevel();
    });
  }

  private showMessage(text: string, duration: number = 3000): void {
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-family: system-ui;
      z-index: 2000;
      animation: fade-in-up 0.3s ease-out;
    `;
    msg.textContent = text;
    document.body.appendChild(msg);

    setTimeout(() => {
      msg.style.animation = 'fade-out 0.3s ease-out';
      setTimeout(() => msg.remove(), 300);
    }, duration);
  }

  private showError(text: string): void {
    console.error('[Orthogonal]', text);
    this.showMessage(`Error: ${text}`, 5000);
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // ===========================================================================
  // EVENTS
  // ===========================================================================

  private setupEventListeners(): void {
    // Initialize input manager
    this.inputManager.initialize();

    // Pause/Resume
    window.addEventListener('orthogonal:toggle-pause', () => {
      if (this.state === 'playing') {
        this.pause();
      } else if (this.state === 'paused') {
        this.resume();
      }
    });

    // Restart
    window.addEventListener('orthogonal:restart', () => {
      this.restartLevel();
    });

    // Meta-awareness messages
    metaAwareness.onMessage((message) => {
      this.showMetaMessage(message);
    });
  }

  private setupMatchmakingEvents(): void {
    if (!this.matchmaking) return;

    this.matchmaking.on('transitionComplete', (data: { levelId: string; isHost: boolean }) => {
      // Start the multiplayer level
      this.startLevel(data.levelId);
    });

    this.matchmaking.on('error', (data: { code: string; message: string }) => {
      this.showMessage(`Matchmaking error: ${data.message}`);
    });

    this.matchmaking.on('timeout', () => {
      this.showMessage('Matchmaking timed out. Try again later.');
    });
  }

  private setupWindowEvents(): void {
    // Resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') {
        this.pause();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.state === 'playing') {
          this.pause();
        } else if (this.state === 'paused') {
          this.resume();
        }
      }
    });

    // Prevent context menu
    document.addEventListener('contextmenu', (e) => {
      if (this.state === 'playing') {
        e.preventDefault();
      }
    });
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.shaderPipeline.resize(width, height);
    this.levelScene.resize(width, height);
  }

  private showMetaMessage(message: any): void {
    const el = document.createElement('div');
    el.className = 'meta-message';
    el.style.cssText = `
      position: fixed;
      ${message.position === 'center' ? 'top: 50%; left: 50%; transform: translate(-50%, -50%);' :
        message.position === 'corner' ? 'bottom: 80px; right: 20px;' :
        'bottom: 150px; left: 50%; transform: translateX(-50%);'}
      color: ${message.style === 'emphatic' ? '#ffd700' : 'rgba(255,255,255,0.8)'};
      font-family: system-ui;
      font-size: ${message.style === 'emphatic' ? '1.3rem' : '1rem'};
      font-style: ${message.style === 'subtle' ? 'italic' : 'normal'};
      max-width: 400px;
      text-align: center;
      z-index: 500;
      pointer-events: none;
      animation: meta-fade ${message.duration / 1000}s ease-in-out;
    `;
    el.textContent = message.text;

    if (!document.querySelector('#meta-message-styles')) {
      const style = document.createElement('style');
      style.id = 'meta-message-styles';
      style.textContent = `
        @keyframes meta-fade {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(el);
    setTimeout(() => el.remove(), message.duration);
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  pause(): void {
    if (this.state === 'playing') {
      this.setState('paused');
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.setState('playing');
    }
  }

  getState(): GameState {
    return this.state;
  }

  getStats(): GameStats {
    return {
      fps: this.fps,
      frameTime: this.deltaTime,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles
    };
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.stop();

    // Save before exit
    saveSystem.saveLocal();

    // Dispose systems
    this.levelScene.dispose();
    this.audioEngine.dispose();
    this.shaderPipeline.dispose();
    this.renderer.dispose();

    // Remove containers
    this.gameContainer.remove();
    this.uiContainer.remove();
  }
}

// =============================================================================
// BOOTSTRAP
// =============================================================================

/**
 * Create and initialize the game
 */
export async function createGame(canvas: HTMLCanvasElement, options: Partial<OrthogonalConfig> = {}): Promise<Orthogonal> {
  const game = new Orthogonal({
    canvas,
    ...options
  });

  await game.init();
  return game;
}

// Auto-start if canvas exists
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) {
      createGame(canvas).catch(console.error);
    }
  });
}
