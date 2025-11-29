/**
 * Spectator Matchmaking System
 * Match viewers to streamers based on relative difficulty
 *
 * Key insight: "Hard" means different things to different players.
 * A viewer sees players struggling with things that would be hard FOR THEM.
 */

import { InputPatterns } from './InputManager';

// ============================================================================
// Types
// ============================================================================

export interface PlayerProfile {
  playerId: string;
  playerName: string;

  // SDPM-derived vectors
  personality: PersonalityVector;

  // Skill metrics
  skillLevel: number;           // 0-100 overall
  dimensionSkills: {
    lattice: number;            // Logic/graph navigation
    marrow: number;             // Rhythm/timing
    archive: number;            // Memory/pattern
    void: number;               // Negative space
  };

  // Current state
  isLive: boolean;
  currentDimension: string;
  currentPuzzleId: string;
  currentDifficulty: number;    // Relative to THEIR skill

  // Stream metadata
  viewerCount: number;
  streamStarted: number;
}

export interface PersonalityVector {
  impulsivity: number;     // 0-1
  curiosity: number;       // 0-1
  patience: number;        // 0-1
  confidence: number;      // 0-1
  analyticalVsIntuitive: number;  // 0 = analytical, 1 = intuitive
  explorerVsOptimizer: number;    // 0 = explorer, 1 = optimizer
}

export interface DifficultyPreference {
  level: 'easy' | 'medium' | 'hard' | 'extreme' | 'any';
  dimension?: string;      // Optional dimension filter
  showStruggles: boolean;  // Prefer players who are struggling
  showFlows: boolean;      // Prefer players in flow state
}

export interface StreamMatch {
  player: PlayerProfile;
  matchScore: number;      // How well they match the preference
  matchReason: string;     // Human-readable reason
  relativeDifficulty: string;  // "Easy for you", "Similar skill", "Impressive"
}

// ============================================================================
// Matchmaking Engine
// ============================================================================

export class SpectatorMatchmaker {
  private liveStreams: Map<string, PlayerProfile> = new Map();
  private viewerProfile: PlayerProfile | null = null;

  /**
   * Set the viewer's profile for relative difficulty calculation
   */
  setViewerProfile(profile: PlayerProfile): void {
    this.viewerProfile = profile;
  }

  /**
   * Update from server - current live streams
   */
  updateLiveStreams(streams: PlayerProfile[]): void {
    this.liveStreams.clear();
    for (const stream of streams) {
      this.liveStreams.set(stream.playerId, stream);
    }
  }

  /**
   * Find streams matching viewer's preference
   */
  findMatches(preference: DifficultyPreference, limit: number = 10): StreamMatch[] {
    const matches: StreamMatch[] = [];

    for (const player of this.liveStreams.values()) {
      const match = this.scoreMatch(player, preference);
      if (match.matchScore > 0) {
        matches.push(match);
      }
    }

    // Sort by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches.slice(0, limit);
  }

  /**
   * Score how well a streamer matches the preference
   */
  private scoreMatch(player: PlayerProfile, pref: DifficultyPreference): StreamMatch {
    let score = 0;
    let reasons: string[] = [];

    // Dimension filter
    if (pref.dimension && player.currentDimension !== pref.dimension) {
      return { player, matchScore: 0, matchReason: 'Wrong dimension', relativeDifficulty: '' };
    }

    // Calculate relative difficulty
    const relativeDiff = this.calculateRelativeDifficulty(player);

    // Match difficulty preference
    switch (pref.level) {
      case 'easy':
        // Show players for whom this is easy (higher skill than content)
        if (relativeDiff.forViewer === 'easy') {
          score += 100;
          reasons.push('Puzzle easy for you');
        }
        break;

      case 'medium':
        if (relativeDiff.forViewer === 'medium') {
          score += 100;
          reasons.push('Similar skill level');
        }
        break;

      case 'hard':
        if (relativeDiff.forViewer === 'hard') {
          score += 100;
          reasons.push('Challenging for you');
        }
        break;

      case 'extreme':
        if (relativeDiff.forViewer === 'extreme') {
          score += 100;
          reasons.push('Would be very hard for you');
        }
        break;

      case 'any':
        score += 50;
        break;
    }

    // Struggle/flow preference
    if (pref.showStruggles && player.currentDifficulty > 0.7) {
      score += 30;
      reasons.push('Player is struggling');
    }

    if (pref.showFlows && player.currentDifficulty < 0.4) {
      score += 30;
      reasons.push('Player in flow state');
    }

    // Personality similarity bonus (people like watching similar players)
    if (this.viewerProfile) {
      const personalitySimilarity = this.calculatePersonalitySimilarity(
        player.personality,
        this.viewerProfile.personality
      );
      score += personalitySimilarity * 20;

      if (personalitySimilarity > 0.7) {
        reasons.push('Similar playstyle');
      }
    }

    // Viewer count factor (moderate popularity preferred)
    if (player.viewerCount >= 5 && player.viewerCount <= 50) {
      score += 10;  // Sweet spot
    } else if (player.viewerCount > 100) {
      score += 5;   // Popular but crowded
    }

    return {
      player,
      matchScore: score,
      matchReason: reasons.join(', ') || 'General match',
      relativeDifficulty: this.formatRelativeDifficulty(relativeDiff),
    };
  }

  /**
   * Calculate how difficult the streamer's current puzzle would be for the viewer
   */
  private calculateRelativeDifficulty(player: PlayerProfile): RelativeDifficulty {
    if (!this.viewerProfile) {
      return { forViewer: 'unknown', forPlayer: 'unknown', delta: 0 };
    }

    // Get relevant skill
    const dimension = player.currentDimension as keyof typeof player.dimensionSkills;
    const playerSkill = player.dimensionSkills[dimension] || player.skillLevel;
    const viewerSkill = this.viewerProfile.dimensionSkills[dimension] || this.viewerProfile.skillLevel;

    // Puzzle base difficulty (from player's current content)
    const puzzleBaseDifficulty = player.currentDifficulty * playerSkill;

    // How hard would this be for viewer?
    const viewerDifficulty = puzzleBaseDifficulty / Math.max(1, viewerSkill);
    const playerDifficulty = player.currentDifficulty;

    const delta = viewerDifficulty - playerDifficulty;

    return {
      forViewer: this.difficultyCategory(viewerDifficulty),
      forPlayer: this.difficultyCategory(playerDifficulty),
      delta,
    };
  }

  private difficultyCategory(difficulty: number): 'easy' | 'medium' | 'hard' | 'extreme' | 'unknown' {
    if (difficulty < 0.3) return 'easy';
    if (difficulty < 0.5) return 'medium';
    if (difficulty < 0.7) return 'hard';
    if (difficulty <= 1.0) return 'extreme';
    return 'unknown';
  }

  private formatRelativeDifficulty(rel: RelativeDifficulty): string {
    if (rel.delta < -0.3) return 'Easy for you';
    if (rel.delta < 0.1) return 'Similar to your level';
    if (rel.delta < 0.3) return 'Would challenge you';
    return 'Impressive skill display';
  }

  /**
   * Calculate personality similarity (0-1)
   */
  private calculatePersonalitySimilarity(a: PersonalityVector, b: PersonalityVector): number {
    const dimensions = ['impulsivity', 'curiosity', 'patience', 'confidence', 'analyticalVsIntuitive', 'explorerVsOptimizer'] as const;

    let totalDiff = 0;
    for (const dim of dimensions) {
      totalDiff += Math.abs(a[dim] - b[dim]);
    }

    const avgDiff = totalDiff / dimensions.length;
    return 1 - avgDiff;
  }
}

interface RelativeDifficulty {
  forViewer: 'easy' | 'medium' | 'hard' | 'extreme' | 'unknown';
  forPlayer: 'easy' | 'medium' | 'hard' | 'extreme' | 'unknown';
  delta: number;
}

// ============================================================================
// Spectator Browse UI
// ============================================================================

export class SpectatorBrowser {
  private container: HTMLDivElement;
  private matchmaker: SpectatorMatchmaker;
  private onSelect: (playerId: string) => void;

  constructor(matchmaker: SpectatorMatchmaker, onSelect: (playerId: string) => void) {
    this.matchmaker = matchmaker;
    this.onSelect = onSelect;
    this.container = this.createContainer();
  }

  private createContainer(): HTMLDivElement {
    const div = document.createElement('div');
    div.id = 'spectator-browser';
    div.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 24px;
      color: white;
      font-family: system-ui, sans-serif;
      z-index: 2000;
      overflow-y: auto;
      display: none;
    `;
    return div;
  }

  show(preference?: DifficultyPreference): void {
    const pref = preference || { level: 'any', showStruggles: false, showFlows: false };
    const matches = this.matchmaker.findMatches(pref);

    this.container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px;">Watch Others Play</h2>

        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          ${this.renderDifficultyButtons(pref.level)}
        </div>

        <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; opacity: 0.8;">
          <input type="checkbox" id="show-struggles" ${pref.showStruggles ? 'checked' : ''}>
          Show players struggling
        </label>
      </div>

      <div id="stream-list">
        ${matches.length > 0 ? matches.map(m => this.renderMatch(m)).join('') : this.renderEmpty()}
      </div>

      <button id="close-browser" style="
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        opacity: 0.7;
      ">×</button>
    `;

    // Bind events
    this.bindEvents(pref);

    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  private renderDifficultyButtons(current: string): string {
    const levels = ['any', 'easy', 'medium', 'hard', 'extreme'];
    return levels.map(level => `
      <button
        class="diff-btn"
        data-level="${level}"
        style="
          padding: 8px 16px;
          background: ${level === current ? 'rgba(255,255,255,0.2)' : 'transparent'};
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          text-transform: capitalize;
        "
      >${level}</button>
    `).join('');
  }

  private renderMatch(match: StreamMatch): string {
    const player = match.player;
    const heatColor = this.getHeatColor(player.viewerCount);

    return `
      <div
        class="stream-card"
        data-player-id="${player.playerId}"
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          margin-bottom: 8px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        "
        onmouseover="this.style.background='rgba(255,255,255,0.1)'"
        onmouseout="this.style.background='rgba(255,255,255,0.05)'"
      >
        <div>
          <div style="font-weight: bold; margin-bottom: 4px;">${player.playerName}</div>
          <div style="font-size: 12px; opacity: 0.7;">
            ${player.currentDimension.toUpperCase()} • ${match.relativeDifficulty}
          </div>
          <div style="font-size: 11px; opacity: 0.5; margin-top: 4px;">
            ${match.matchReason}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: ${heatColor};">👁 ${player.viewerCount}</span>
        </div>
      </div>
    `;
  }

  private renderEmpty(): string {
    return `
      <div style="text-align: center; padding: 40px; opacity: 0.5;">
        No streams match your criteria.<br>
        Try a different difficulty level.
      </div>
    `;
  }

  private getHeatColor(viewerCount: number): string {
    if (viewerCount === 0) return '#666';
    if (viewerCount < 5) return '#fff';
    if (viewerCount < 20) return '#ffcc00';
    if (viewerCount < 50) return '#ff9900';
    return '#ff3300';
  }

  private bindEvents(currentPref: DifficultyPreference): void {
    // Difficulty buttons
    this.container.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const level = (e.target as HTMLElement).dataset.level as DifficultyPreference['level'];
        this.show({ ...currentPref, level });
      });
    });

    // Struggles checkbox
    const strugglesCheckbox = this.container.querySelector('#show-struggles') as HTMLInputElement;
    if (strugglesCheckbox) {
      strugglesCheckbox.addEventListener('change', () => {
        this.show({ ...currentPref, showStruggles: strugglesCheckbox.checked });
      });
    }

    // Stream cards
    this.container.querySelectorAll('.stream-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const playerId = (e.currentTarget as HTMLElement).dataset.playerId;
        if (playerId) {
          this.onSelect(playerId);
          this.hide();
        }
      });
    });

    // Close button
    const closeBtn = this.container.querySelector('#close-browser');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}

// ============================================================================
// Profile Builder (from gameplay patterns)
// ============================================================================

export function buildProfileFromPatterns(
  playerId: string,
  playerName: string,
  patterns: InputPatterns,
  gameStats: GameStats
): PlayerProfile {
  return {
    playerId,
    playerName,

    personality: {
      impulsivity: patterns.impulsivity,
      curiosity: patterns.curiosity,
      patience: patterns.patience,
      confidence: patterns.confidence,
      analyticalVsIntuitive: patterns.witnessUtilization > 0.5 ? 0.3 : 0.7,
      explorerVsOptimizer: patterns.explorationScore,
    },

    skillLevel: gameStats.overallSkill,
    dimensionSkills: gameStats.dimensionSkills,

    isLive: false,
    currentDimension: 'lattice',
    currentPuzzleId: '',
    currentDifficulty: 0.5,

    viewerCount: 0,
    streamStarted: 0,
  };
}

interface GameStats {
  overallSkill: number;
  dimensionSkills: {
    lattice: number;
    marrow: number;
    archive: number;
    void: number;
  };
}
