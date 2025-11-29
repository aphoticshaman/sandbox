/**
 * Matchmaking.ts
 *
 * Automatic matchmaking for multiplayer levels
 * Finds players, creates lobbies, handles the full queue-to-game flow
 */

import { NetworkCore, PeerInfo, NetworkMessage } from './NetworkCore';
import { PartySystem, PartyMember } from './PartySystem';
import { STATIC_LEVELS, StaticLevelDefinition } from '../level/StaticLevels';

// =============================================================================
// TYPES
// =============================================================================

export type MatchmakingState =
  | 'idle'
  | 'searching'
  | 'found'
  | 'connecting'
  | 'ready'
  | 'starting'
  | 'failed';

export type MatchmakingMode =
  | 'quick'       // Any compatible level
  | 'level'       // Specific level
  | 'ranked'      // Skill-based matching
  | 'casual';     // Relaxed matching

export interface MatchmakingConfig {
  mode: MatchmakingMode;
  levelId?: string;           // For 'level' mode
  playerCount?: number;       // Preferred player count (2-4)
  maxWaitTime: number;        // Max queue time in ms
  skillRange: number;         // How far to expand skill search (0-1)
  region?: string;            // Preferred region
  allowCrossPlatform: boolean;
}

export interface QueueEntry {
  playerId: string;
  displayName: string;
  skill: number;              // 0-1 normalized skill rating
  preferredLevels: string[];
  playerCount: number;
  platform: string;
  region: string;
  queuedAt: number;
  expandedAt?: number;        // When skill range was expanded
}

export interface Match {
  matchId: string;
  levelId: string;
  players: MatchPlayer[];
  hostId: string;
  createdAt: number;
  startAt: number;
  state: 'forming' | 'ready' | 'starting' | 'active' | 'complete';
}

export interface MatchPlayer {
  id: string;
  displayName: string;
  skill: number;
  isReady: boolean;
  isConnected: boolean;
  slot: number;  // 0-3 for player assignment
}

export interface MatchmakingStats {
  averageWaitTime: number;
  playersInQueue: number;
  activeMatches: number;
  successRate: number;
}

const DEFAULT_CONFIG: MatchmakingConfig = {
  mode: 'quick',
  maxWaitTime: 120000,  // 2 minutes
  skillRange: 0.2,
  allowCrossPlatform: true
};

// =============================================================================
// MATCHMAKING SYSTEM
// =============================================================================

export class MatchmakingSystem {
  private network: NetworkCore;
  private party: PartySystem;
  private config: MatchmakingConfig;
  private state: MatchmakingState = 'idle';

  // Queue state
  private queueEntry: QueueEntry | null = null;
  private queueStartTime: number = 0;
  private estimatedWaitTime: number = 30000;
  private skillExpandTimer: number | null = null;

  // Match state
  private currentMatch: Match | null = null;
  private readyCheckTimer: number | null = null;
  private connectionAttempts: number = 0;

  // Events
  private eventListeners: Map<string, Set<Function>> = new Map();

  // Local player info
  private playerId: string = '';
  private displayName: string = 'Player';
  private skillRating: number = 0.5;
  private platform: string = 'web';
  private region: string = 'auto';

  constructor(network: NetworkCore, party: PartySystem) {
    this.network = network;
    this.party = party;
    this.config = { ...DEFAULT_CONFIG };
    this.setupNetworkHandlers();
    this.loadLocalProfile();
  }

  private loadLocalProfile(): void {
    this.playerId = localStorage.getItem('orthogonal_player_id') || this.generateId();
    this.displayName = localStorage.getItem('orthogonal_display_name') || 'Observer';

    // Load skill rating from save data
    try {
      const saveData = localStorage.getItem('orthogonal_save');
      if (saveData) {
        const parsed = JSON.parse(saveData);
        this.skillRating = parsed.skillRating || 0.5;
      }
    } catch {}

    // Detect region (simplified)
    this.region = Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto';
  }

  private setupNetworkHandlers(): void {
    this.network.on('mm-queue-update', this.handleQueueUpdate.bind(this));
    this.network.on('mm-match-found', this.handleMatchFound.bind(this));
    this.network.on('mm-player-joined', this.handlePlayerJoined.bind(this));
    this.network.on('mm-player-left', this.handlePlayerLeft.bind(this));
    this.network.on('mm-player-ready', this.handlePlayerReady.bind(this));
    this.network.on('mm-match-start', this.handleMatchStart.bind(this));
    this.network.on('mm-match-cancel', this.handleMatchCancel.bind(this));
  }

  // ========================================
  // PUBLIC API
  // ========================================

  /**
   * Start searching for a match
   */
  async startMatchmaking(config: Partial<MatchmakingConfig> = {}): Promise<void> {
    if (this.state !== 'idle') {
      throw new Error('Already in matchmaking');
    }

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = 'searching';
    this.queueStartTime = Date.now();
    this.emit('stateChange', this.state);

    // Determine which levels to search for
    const preferredLevels = this.getPreferredLevels();
    if (preferredLevels.length === 0) {
      this.state = 'failed';
      this.emit('error', { code: 'NO_LEVELS', message: 'No multiplayer levels available' });
      return;
    }

    // Create queue entry
    this.queueEntry = {
      playerId: this.playerId,
      displayName: this.displayName,
      skill: this.skillRating,
      preferredLevels,
      playerCount: this.config.playerCount || 2,
      platform: this.platform,
      region: this.region,
      queuedAt: Date.now()
    };

    // Connect to matchmaking server
    try {
      await this.network.connect('matchmaking-global');
      this.sendToServer('queue-join', this.queueEntry);
      this.startSkillExpansion();
      this.emit('queueJoined', { entry: this.queueEntry });
    } catch (error) {
      this.state = 'failed';
      this.emit('error', { code: 'CONNECTION_FAILED', message: 'Failed to connect to matchmaking' });
    }
  }

  /**
   * Cancel matchmaking
   */
  cancelMatchmaking(): void {
    if (this.state === 'idle') return;

    this.stopSkillExpansion();
    this.sendToServer('queue-leave', { playerId: this.playerId });
    this.network.disconnect();

    this.state = 'idle';
    this.queueEntry = null;
    this.currentMatch = null;
    this.emit('stateChange', this.state);
    this.emit('cancelled', {});
  }

  /**
   * Accept a found match
   */
  acceptMatch(): void {
    if (this.state !== 'found' || !this.currentMatch) return;

    this.state = 'connecting';
    this.emit('stateChange', this.state);

    this.sendToServer('match-accept', {
      matchId: this.currentMatch.matchId,
      playerId: this.playerId
    });

    this.startConnectionTimer();
  }

  /**
   * Decline a found match (back to queue)
   */
  declineMatch(): void {
    if (this.state !== 'found' || !this.currentMatch) return;

    this.sendToServer('match-decline', {
      matchId: this.currentMatch.matchId,
      playerId: this.playerId
    });

    this.currentMatch = null;
    this.state = 'searching';
    this.emit('stateChange', this.state);
  }

  /**
   * Mark as ready to start
   */
  setReady(ready: boolean = true): void {
    if (this.state !== 'ready' || !this.currentMatch) return;

    this.sendToServer('player-ready', {
      matchId: this.currentMatch.matchId,
      playerId: this.playerId,
      ready
    });

    // Update local state
    const player = this.currentMatch.players.find(p => p.id === this.playerId);
    if (player) {
      player.isReady = ready;
      this.emit('playerUpdated', { player });
    }
  }

  /**
   * Get current state
   */
  getState(): MatchmakingState {
    return this.state;
  }

  /**
   * Get current match info
   */
  getMatch(): Match | null {
    return this.currentMatch;
  }

  /**
   * Get queue time in ms
   */
  getQueueTime(): number {
    if (this.state === 'idle') return 0;
    return Date.now() - this.queueStartTime;
  }

  /**
   * Get estimated wait time
   */
  getEstimatedWait(): number {
    return this.estimatedWaitTime;
  }

  /**
   * Quick match for a specific level
   */
  async quickMatchLevel(levelId: string): Promise<void> {
    const level = STATIC_LEVELS.find(l => l.id === levelId);
    if (!level || level.minPlayers < 2) {
      throw new Error('Invalid multiplayer level');
    }

    await this.startMatchmaking({
      mode: 'level',
      levelId,
      playerCount: level.minPlayers
    });
  }

  /**
   * Quick match for any 2-player level
   */
  async quickMatchDuo(): Promise<void> {
    await this.startMatchmaking({
      mode: 'quick',
      playerCount: 2
    });
  }

  /**
   * Quick match for any 4-player level
   */
  async quickMatchQuad(): Promise<void> {
    await this.startMatchmaking({
      mode: 'quick',
      playerCount: 4
    });
  }

  // ========================================
  // LEVEL SELECTION
  // ========================================

  private getPreferredLevels(): string[] {
    const mpLevels = STATIC_LEVELS.filter(l => l.minPlayers >= 2);

    if (this.config.mode === 'level' && this.config.levelId) {
      const level = mpLevels.find(l => l.id === this.config.levelId);
      return level ? [level.id] : [];
    }

    // Filter by player count preference
    const targetCount = this.config.playerCount || 2;
    const matchingLevels = mpLevels.filter(l =>
      l.minPlayers <= targetCount && l.maxPlayers >= targetCount
    );

    return matchingLevels.map(l => l.id);
  }

  /**
   * Get available multiplayer levels
   */
  static getMultiplayerLevels(): StaticLevelDefinition[] {
    return STATIC_LEVELS.filter(l => l.minPlayers >= 2);
  }

  /**
   * Get levels for specific player count
   */
  static getLevelsForPlayerCount(count: number): StaticLevelDefinition[] {
    return STATIC_LEVELS.filter(l =>
      l.minPlayers <= count && l.maxPlayers >= count
    );
  }

  // ========================================
  // SKILL EXPANSION
  // ========================================

  private startSkillExpansion(): void {
    // Expand skill range every 15 seconds to find more matches
    this.skillExpandTimer = window.setInterval(() => {
      if (!this.queueEntry) return;

      const elapsed = Date.now() - this.queueEntry.queuedAt;
      const expansions = Math.floor(elapsed / 15000);
      const newRange = Math.min(1.0, this.config.skillRange + (expansions * 0.1));

      if (!this.queueEntry.expandedAt || Date.now() - this.queueEntry.expandedAt > 15000) {
        this.queueEntry.expandedAt = Date.now();
        this.sendToServer('queue-expand', {
          playerId: this.playerId,
          skillRange: newRange
        });
        this.emit('skillExpanded', { range: newRange });
      }

      // Check max wait time
      if (elapsed > this.config.maxWaitTime) {
        this.cancelMatchmaking();
        this.emit('timeout', { elapsed });
      }
    }, 5000);
  }

  private stopSkillExpansion(): void {
    if (this.skillExpandTimer) {
      clearInterval(this.skillExpandTimer);
      this.skillExpandTimer = null;
    }
  }

  // ========================================
  // CONNECTION HANDLING
  // ========================================

  private startConnectionTimer(): void {
    this.connectionAttempts = 0;

    // Timeout after 30 seconds
    this.readyCheckTimer = window.setTimeout(() => {
      if (this.state === 'connecting') {
        this.emit('connectionTimeout', {});
        this.cancelMatchmaking();
      }
    }, 30000);
  }

  private clearConnectionTimer(): void {
    if (this.readyCheckTimer) {
      clearTimeout(this.readyCheckTimer);
      this.readyCheckTimer = null;
    }
  }

  // ========================================
  // SERVER MESSAGE HANDLERS
  // ========================================

  private handleQueueUpdate(msg: NetworkMessage): void {
    const { playersInQueue, estimatedWait, position } = msg.payload;

    this.estimatedWaitTime = estimatedWait || 30000;
    this.emit('queueUpdate', {
      playersInQueue,
      estimatedWait: this.estimatedWaitTime,
      position
    });
  }

  private handleMatchFound(msg: NetworkMessage): void {
    if (this.state !== 'searching') return;

    this.stopSkillExpansion();
    this.currentMatch = msg.payload.match;
    this.state = 'found';
    this.emit('stateChange', this.state);
    this.emit('matchFound', { match: this.currentMatch });

    // Auto-accept after 1 second (can be overridden by UI)
    setTimeout(() => {
      if (this.state === 'found') {
        this.acceptMatch();
      }
    }, 1000);
  }

  private handlePlayerJoined(msg: NetworkMessage): void {
    if (!this.currentMatch) return;

    const player: MatchPlayer = msg.payload.player;
    this.currentMatch.players.push(player);
    this.emit('playerJoined', { player });

    // Check if all players connected
    const allConnected = this.currentMatch.players.every(p => p.isConnected);
    if (allConnected && this.state === 'connecting') {
      this.clearConnectionTimer();
      this.state = 'ready';
      this.emit('stateChange', this.state);
      this.emit('allConnected', {});
    }
  }

  private handlePlayerLeft(msg: NetworkMessage): void {
    if (!this.currentMatch) return;

    const { playerId } = msg.payload;
    this.currentMatch.players = this.currentMatch.players.filter(p => p.id !== playerId);
    this.emit('playerLeft', { playerId });

    // If in ready state and someone leaves, cancel
    if (this.state === 'ready' || this.state === 'starting') {
      this.emit('matchCancelled', { reason: 'player_left' });
      this.cancelMatchmaking();
    }
  }

  private handlePlayerReady(msg: NetworkMessage): void {
    if (!this.currentMatch) return;

    const { playerId, ready } = msg.payload;
    const player = this.currentMatch.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = ready;
      this.emit('playerUpdated', { player });

      // Check if all ready
      const allReady = this.currentMatch.players.every(p => p.isReady);
      if (allReady) {
        this.state = 'starting';
        this.emit('stateChange', this.state);
        this.emit('allReady', {});
      }
    }
  }

  private handleMatchStart(msg: NetworkMessage): void {
    if (!this.currentMatch) return;

    const { levelId, startAt } = msg.payload;
    this.currentMatch.levelId = levelId;
    this.currentMatch.startAt = startAt;
    this.currentMatch.state = 'starting';

    this.emit('matchStarting', {
      levelId,
      startAt,
      countdown: startAt - Date.now()
    });

    // Transition to party system for actual gameplay
    setTimeout(() => {
      this.transitionToParty();
    }, Math.max(0, startAt - Date.now()));
  }

  private handleMatchCancel(msg: NetworkMessage): void {
    const { reason } = msg.payload;
    this.emit('matchCancelled', { reason });

    // Return to queue
    this.currentMatch = null;
    this.state = 'searching';
    this.emit('stateChange', this.state);
    this.startSkillExpansion();
  }

  // ========================================
  // TRANSITION TO GAMEPLAY
  // ========================================

  private async transitionToParty(): Promise<void> {
    if (!this.currentMatch) return;

    // Create party from match
    try {
      // Leader creates the party
      const isHost = this.currentMatch.hostId === this.playerId;

      if (isHost) {
        await this.party.createParty(this.displayName, {
          maxSize: this.currentMatch.players.length
        });

        // Invite all other players
        for (const player of this.currentMatch.players) {
          if (player.id !== this.playerId) {
            // Send P2P invite via network
            this.network.send({
              type: 'party-invite-direct',
              payload: {
                matchId: this.currentMatch.matchId,
                partyCode: this.party.getInviteCode()
              },
              senderId: this.playerId,
              timestamp: Date.now(),
              reliable: true
            }, player.id);
          }
        }
      }

      this.emit('transitionComplete', {
        levelId: this.currentMatch.levelId,
        isHost
      });

      // Clean up matchmaking state
      this.state = 'idle';
      this.currentMatch = null;

    } catch (error) {
      this.emit('error', {
        code: 'TRANSITION_FAILED',
        message: 'Failed to start game session'
      });
    }
  }

  // ========================================
  // UTILITY
  // ========================================

  private sendToServer(type: string, payload: any): void {
    this.network.send({
      type: `mm-${type}`,
      payload,
      senderId: this.playerId,
      timestamp: Date.now(),
      reliable: true
    });
  }

  private generateId(): string {
    return 'mm-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(fn => fn(data));
    }
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // ========================================
  // DISPOSE
  // ========================================

  dispose(): void {
    this.cancelMatchmaking();
    this.eventListeners.clear();
  }
}

// =============================================================================
// MATCHMAKING UI HELPER
// =============================================================================

export class MatchmakingUI {
  private container: HTMLElement;
  private matchmaking: MatchmakingSystem;
  private updateInterval: number | null = null;

  constructor(matchmaking: MatchmakingSystem) {
    this.matchmaking = matchmaking;
    this.container = this.createContainer();
    this.setupEventListeners();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'matchmaking-ui';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(10, 10, 15, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2rem 3rem;
      color: white;
      font-family: system-ui, sans-serif;
      text-align: center;
      min-width: 300px;
      z-index: 10000;
      display: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  private setupEventListeners(): void {
    this.matchmaking.on('stateChange', (data: { state: MatchmakingState }) => {
      this.updateUI(data.state);
    });

    this.matchmaking.on('queueUpdate', (data: any) => {
      this.updateQueueInfo(data);
    });

    this.matchmaking.on('matchFound', (data: any) => {
      this.showMatchFound(data.match);
    });

    this.matchmaking.on('allConnected', () => {
      this.showReadyCheck();
    });

    this.matchmaking.on('matchStarting', (data: any) => {
      this.showCountdown(data.countdown);
    });

    this.matchmaking.on('error', (data: any) => {
      this.showError(data.message);
    });
  }

  show(): void {
    this.container.style.display = 'block';
    this.startTimer();
  }

  hide(): void {
    this.container.style.display = 'none';
    this.stopTimer();
  }

  private startTimer(): void {
    this.updateInterval = window.setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private updateUI(state: MatchmakingState): void {
    switch (state) {
      case 'searching':
        this.showSearching();
        break;
      case 'found':
        // Handled by matchFound event
        break;
      case 'connecting':
        this.showConnecting();
        break;
      case 'ready':
        this.showReadyCheck();
        break;
      case 'starting':
        // Handled by matchStarting event
        break;
      case 'idle':
        this.hide();
        break;
      case 'failed':
        this.showError('Matchmaking failed');
        break;
    }
  }

  private showSearching(): void {
    this.show();
    this.container.innerHTML = `
      <div class="mm-searching">
        <div class="mm-title">Finding Players</div>
        <div class="mm-spinner">
          <div class="mm-dot"></div>
        </div>
        <div class="mm-time" id="mm-queue-time">0:00</div>
        <div class="mm-info" id="mm-queue-info">Searching...</div>
        <button class="mm-cancel" id="mm-cancel-btn">Cancel</button>
      </div>
      <style>
        .mm-title { font-size: 1.5rem; font-weight: 300; letter-spacing: 0.1em; margin-bottom: 1.5rem; }
        .mm-spinner { width: 40px; height: 40px; margin: 1rem auto; position: relative; }
        .mm-dot {
          width: 100%; height: 100%;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .mm-time { font-size: 2rem; font-weight: 100; margin: 1rem 0; }
        .mm-info { opacity: 0.6; font-size: 0.9rem; margin-bottom: 1.5rem; }
        .mm-cancel {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.6);
          padding: 0.6rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .mm-cancel:hover { border-color: white; color: white; }
      </style>
    `;

    document.getElementById('mm-cancel-btn')?.addEventListener('click', () => {
      this.matchmaking.cancelMatchmaking();
    });
  }

  private showConnecting(): void {
    this.container.innerHTML = `
      <div class="mm-connecting">
        <div class="mm-title">Match Found!</div>
        <div class="mm-subtitle">Connecting to players...</div>
        <div class="mm-spinner"><div class="mm-dot"></div></div>
      </div>
    `;
  }

  private showMatchFound(match: Match): void {
    const players = match.players.map(p =>
      `<div class="mm-player">${p.displayName}</div>`
    ).join('');

    this.container.innerHTML = `
      <div class="mm-found">
        <div class="mm-title">Match Found!</div>
        <div class="mm-level">${match.levelId}</div>
        <div class="mm-players">${players}</div>
      </div>
      <style>
        .mm-level { opacity: 0.7; margin-bottom: 1rem; }
        .mm-player {
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          margin: 0.3rem 0;
        }
      </style>
    `;
  }

  private showReadyCheck(): void {
    this.container.innerHTML = `
      <div class="mm-ready">
        <div class="mm-title">Ready?</div>
        <div class="mm-players" id="mm-ready-players"></div>
        <button class="mm-ready-btn" id="mm-ready-btn">READY</button>
      </div>
      <style>
        .mm-ready-btn {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
          border: 1px solid rgba(102, 126, 234, 0.5);
          color: white;
          padding: 1rem 3rem;
          font-size: 1.2rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 1.5rem;
          transition: all 0.2s;
        }
        .mm-ready-btn:hover {
          transform: scale(1.05);
          border-color: rgba(102, 126, 234, 0.8);
        }
        .mm-ready-btn.ready {
          background: rgba(80, 200, 120, 0.3);
          border-color: rgba(80, 200, 120, 0.5);
        }
      </style>
    `;

    const btn = document.getElementById('mm-ready-btn');
    btn?.addEventListener('click', () => {
      const isReady = btn.classList.toggle('ready');
      btn.textContent = isReady ? 'WAITING...' : 'READY';
      this.matchmaking.setReady(isReady);
    });
  }

  private showCountdown(ms: number): void {
    const seconds = Math.ceil(ms / 1000);
    this.container.innerHTML = `
      <div class="mm-countdown">
        <div class="mm-title">Starting in</div>
        <div class="mm-count" id="mm-count">${seconds}</div>
      </div>
      <style>
        .mm-count {
          font-size: 4rem;
          font-weight: 100;
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `;

    // Countdown animation
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining--;
      const countEl = document.getElementById('mm-count');
      if (countEl) {
        countEl.textContent = remaining.toString();
      }
      if (remaining <= 0) {
        clearInterval(interval);
        this.hide();
      }
    }, 1000);
  }

  private showError(message: string): void {
    this.container.innerHTML = `
      <div class="mm-error">
        <div class="mm-title">Error</div>
        <div class="mm-message">${message}</div>
        <button class="mm-cancel" id="mm-close-btn">Close</button>
      </div>
      <style>
        .mm-message { opacity: 0.7; margin: 1rem 0 1.5rem; }
      </style>
    `;

    document.getElementById('mm-close-btn')?.addEventListener('click', () => {
      this.hide();
    });
  }

  private updateTimer(): void {
    const timeEl = document.getElementById('mm-queue-time');
    if (timeEl) {
      const elapsed = this.matchmaking.getQueueTime();
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  private updateQueueInfo(data: any): void {
    const infoEl = document.getElementById('mm-queue-info');
    if (infoEl) {
      const estSeconds = Math.ceil(data.estimatedWait / 1000);
      infoEl.textContent = `${data.playersInQueue} players in queue • ~${estSeconds}s`;
    }
  }

  dispose(): void {
    this.hide();
    this.container.remove();
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let matchmakingInstance: MatchmakingSystem | null = null;
let matchmakingUI: MatchmakingUI | null = null;

export function initMatchmaking(network: NetworkCore, party: PartySystem): MatchmakingSystem {
  if (!matchmakingInstance) {
    matchmakingInstance = new MatchmakingSystem(network, party);
    matchmakingUI = new MatchmakingUI(matchmakingInstance);
  }
  return matchmakingInstance;
}

export function getMatchmaking(): MatchmakingSystem | null {
  return matchmakingInstance;
}

export function getMatchmakingUI(): MatchmakingUI | null {
  return matchmakingUI;
}
