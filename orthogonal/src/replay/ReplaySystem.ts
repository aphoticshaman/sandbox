/**
 * ReplaySystem.ts
 *
 * Records and replays gameplay for sharing, spectating, and ghost races
 */

import { DimensionType } from '../core/DimensionManager';

// =============================================================================
// TYPES
// =============================================================================

export interface ReplayFrame {
  timestamp: number;       // ms since recording start
  position: {
    x: number;
    y: number;
    z: number;
  };
  currentNode: string;
  dimension: DimensionType;
  witnessing: boolean;
  focusTarget?: string;
  chargeProgress?: number;
}

export interface ReplayEvent {
  timestamp: number;
  type: ReplayEventType;
  data: Record<string, any>;
}

export type ReplayEventType =
  | 'node_enter'
  | 'node_leave'
  | 'dimension_shift'
  | 'witness_start'
  | 'witness_end'
  | 'focus_start'
  | 'focus_end'
  | 'node_activate'
  | 'level_complete'
  | 'death'
  | 'checkpoint';

export interface ReplayMetadata {
  id: string;
  levelId: string;
  levelSeed: number;
  playerId: string;
  playerName: string;
  recordedAt: string;
  duration: number;        // Total duration in ms
  version: number;         // Replay format version
  completionTime?: number;
  mastery?: number;
  isGhost?: boolean;       // For ghost race mode
}

export interface ReplayData {
  metadata: ReplayMetadata;
  frames: ReplayFrame[];
  events: ReplayEvent[];
  compressed?: boolean;
}

// =============================================================================
// REPLAY RECORDER
// =============================================================================

export class ReplayRecorder {
  private recording: boolean = false;
  private startTime: number = 0;
  private frames: ReplayFrame[] = [];
  private events: ReplayEvent[] = [];
  private metadata: Partial<ReplayMetadata> = {};

  private frameInterval: number = 50;  // Record every 50ms (20fps)
  private lastFrameTime: number = 0;
  private currentFrame: Partial<ReplayFrame> = {};

  private readonly MAX_FRAMES = 36000;  // 30 minutes at 20fps
  private readonly VERSION = 1;

  /**
   * Start recording
   */
  start(levelId: string, levelSeed: number, playerId: string, playerName: string): void {
    this.recording = true;
    this.startTime = performance.now();
    this.frames = [];
    this.events = [];
    this.lastFrameTime = 0;

    this.metadata = {
      id: this.generateId(),
      levelId,
      levelSeed,
      playerId,
      playerName,
      recordedAt: new Date().toISOString(),
      version: this.VERSION
    };

    this.currentFrame = {
      timestamp: 0,
      position: { x: 0, y: 0, z: 0 },
      currentNode: '',
      dimension: 'LATTICE',
      witnessing: false
    };
  }

  /**
   * Stop recording
   */
  stop(completionTime?: number, mastery?: number): ReplayData | null {
    if (!this.recording) return null;

    this.recording = false;
    const duration = performance.now() - this.startTime;

    const metadata: ReplayMetadata = {
      ...this.metadata as ReplayMetadata,
      duration,
      completionTime,
      mastery
    };

    const data: ReplayData = {
      metadata,
      frames: this.frames,
      events: this.events
    };

    return data;
  }

  /**
   * Update - call every frame
   */
  update(state: {
    position: { x: number; y: number; z: number };
    currentNode: string;
    dimension: DimensionType;
    witnessing: boolean;
    focusTarget?: string;
    chargeProgress?: number;
  }): void {
    if (!this.recording) return;

    const now = performance.now() - this.startTime;

    // Update current frame data
    this.currentFrame = {
      timestamp: now,
      ...state
    };

    // Record frame at interval
    if (now - this.lastFrameTime >= this.frameInterval) {
      this.recordFrame();
      this.lastFrameTime = now;
    }
  }

  private recordFrame(): void {
    if (this.frames.length >= this.MAX_FRAMES) {
      console.warn('Replay max frames reached');
      return;
    }

    // Delta compression: only record if changed significantly
    const lastFrame = this.frames[this.frames.length - 1];
    if (lastFrame && this.framesAreSimilar(lastFrame, this.currentFrame as ReplayFrame)) {
      return;
    }

    this.frames.push({ ...this.currentFrame } as ReplayFrame);
  }

  private framesAreSimilar(a: ReplayFrame, b: ReplayFrame): boolean {
    // Check position difference
    const posDiff = Math.abs(a.position.x - b.position.x) +
                   Math.abs(a.position.y - b.position.y) +
                   Math.abs(a.position.z - b.position.z);

    if (posDiff > 0.1) return false;
    if (a.currentNode !== b.currentNode) return false;
    if (a.dimension !== b.dimension) return false;
    if (a.witnessing !== b.witnessing) return false;

    return true;
  }

  /**
   * Record an event
   */
  recordEvent(type: ReplayEventType, data: Record<string, any> = {}): void {
    if (!this.recording) return;

    this.events.push({
      timestamp: performance.now() - this.startTime,
      type,
      data
    });
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recording;
  }

  /**
   * Get current recording duration
   */
  getDuration(): number {
    if (!this.recording) return 0;
    return performance.now() - this.startTime;
  }

  private generateId(): string {
    return `replay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

// =============================================================================
// REPLAY PLAYER
// =============================================================================

export class ReplayPlayer {
  private replay: ReplayData | null = null;
  private playing: boolean = false;
  private paused: boolean = false;
  private currentTime: number = 0;
  private playbackSpeed: number = 1.0;

  private frameIndex: number = 0;
  private eventIndex: number = 0;

  private onFrameCallback: ((frame: ReplayFrame) => void) | null = null;
  private onEventCallback: ((event: ReplayEvent) => void) | null = null;
  private onCompleteCallback: (() => void) | null = null;

  /**
   * Load a replay
   */
  load(replay: ReplayData): void {
    this.replay = replay;
    this.reset();
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.replay) return;
    this.playing = true;
    this.paused = false;
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume playback
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.playing = false;
    this.paused = false;
    this.reset();
  }

  /**
   * Reset to beginning
   */
  reset(): void {
    this.currentTime = 0;
    this.frameIndex = 0;
    this.eventIndex = 0;
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    if (!this.replay) return;

    this.currentTime = Math.max(0, Math.min(time, this.replay.metadata.duration));

    // Find nearest frame
    this.frameIndex = this.findNearestFrameIndex(time);
    this.eventIndex = this.findNearestEventIndex(time);
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, Math.min(4.0, speed));
  }

  /**
   * Update - call every frame
   */
  update(deltaTime: number): void {
    if (!this.replay || !this.playing || this.paused) return;

    this.currentTime += deltaTime * this.playbackSpeed;

    // Process frames
    while (this.frameIndex < this.replay.frames.length) {
      const frame = this.replay.frames[this.frameIndex];
      if (frame.timestamp > this.currentTime) break;

      if (this.onFrameCallback) {
        this.onFrameCallback(frame);
      }
      this.frameIndex++;
    }

    // Process events
    while (this.eventIndex < this.replay.events.length) {
      const event = this.replay.events[this.eventIndex];
      if (event.timestamp > this.currentTime) break;

      if (this.onEventCallback) {
        this.onEventCallback(event);
      }
      this.eventIndex++;
    }

    // Check completion
    if (this.currentTime >= this.replay.metadata.duration) {
      this.playing = false;
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }
  }

  /**
   * Get current frame
   */
  getCurrentFrame(): ReplayFrame | null {
    if (!this.replay || this.frameIndex === 0) return null;
    return this.replay.frames[Math.max(0, this.frameIndex - 1)];
  }

  /**
   * Get interpolated position between frames
   */
  getInterpolatedPosition(): { x: number; y: number; z: number } | null {
    if (!this.replay || this.frameIndex === 0) return null;

    const prevFrame = this.replay.frames[this.frameIndex - 1];
    const nextFrame = this.replay.frames[this.frameIndex];

    if (!nextFrame) return prevFrame.position;

    const t = (this.currentTime - prevFrame.timestamp) /
              (nextFrame.timestamp - prevFrame.timestamp);

    return {
      x: prevFrame.position.x + (nextFrame.position.x - prevFrame.position.x) * t,
      y: prevFrame.position.y + (nextFrame.position.y - prevFrame.position.y) * t,
      z: prevFrame.position.z + (nextFrame.position.z - prevFrame.position.z) * t
    };
  }

  private findNearestFrameIndex(time: number): number {
    if (!this.replay) return 0;

    // Binary search
    let low = 0;
    let high = this.replay.frames.length - 1;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.replay.frames[mid].timestamp < time) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low;
  }

  private findNearestEventIndex(time: number): number {
    if (!this.replay) return 0;

    // Binary search
    let low = 0;
    let high = this.replay.events.length - 1;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.replay.events[mid].timestamp < time) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low;
  }

  // ===========================================================================
  // CALLBACKS
  // ===========================================================================

  onFrame(callback: (frame: ReplayFrame) => void): void {
    this.onFrameCallback = callback;
  }

  onEvent(callback: (event: ReplayEvent) => void): void {
    this.onEventCallback = callback;
  }

  onComplete(callback: () => void): void {
    this.onCompleteCallback = callback;
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  isPlaying(): boolean {
    return this.playing;
  }

  isPaused(): boolean {
    return this.paused;
  }

  getProgress(): number {
    if (!this.replay) return 0;
    return this.currentTime / this.replay.metadata.duration;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getDuration(): number {
    return this.replay?.metadata.duration || 0;
  }

  getMetadata(): ReplayMetadata | null {
    return this.replay?.metadata || null;
  }

  getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }
}

// =============================================================================
// GHOST SYSTEM
// =============================================================================

export class GhostSystem {
  private ghosts: Map<string, {
    replay: ReplayData;
    player: ReplayPlayer;
    visible: boolean;
  }> = new Map();

  private onGhostFrameCallback: ((ghostId: string, frame: ReplayFrame) => void) | null = null;

  /**
   * Add a ghost
   */
  addGhost(replay: ReplayData): string {
    const ghostId = replay.metadata.id;

    const player = new ReplayPlayer();
    player.load(replay);

    player.onFrame((frame) => {
      if (this.onGhostFrameCallback) {
        this.onGhostFrameCallback(ghostId, frame);
      }
    });

    this.ghosts.set(ghostId, {
      replay,
      player,
      visible: true
    });

    return ghostId;
  }

  /**
   * Remove a ghost
   */
  removeGhost(ghostId: string): void {
    this.ghosts.delete(ghostId);
  }

  /**
   * Start all ghosts
   */
  startAll(): void {
    for (const ghost of this.ghosts.values()) {
      ghost.player.play();
    }
  }

  /**
   * Stop all ghosts
   */
  stopAll(): void {
    for (const ghost of this.ghosts.values()) {
      ghost.player.stop();
    }
  }

  /**
   * Reset all ghosts
   */
  resetAll(): void {
    for (const ghost of this.ghosts.values()) {
      ghost.player.reset();
    }
  }

  /**
   * Update all ghosts
   */
  update(deltaTime: number): void {
    for (const ghost of this.ghosts.values()) {
      if (ghost.visible) {
        ghost.player.update(deltaTime);
      }
    }
  }

  /**
   * Set ghost visibility
   */
  setVisible(ghostId: string, visible: boolean): void {
    const ghost = this.ghosts.get(ghostId);
    if (ghost) {
      ghost.visible = visible;
    }
  }

  /**
   * Get ghost position
   */
  getGhostPosition(ghostId: string): { x: number; y: number; z: number } | null {
    const ghost = this.ghosts.get(ghostId);
    if (!ghost) return null;
    return ghost.player.getInterpolatedPosition();
  }

  /**
   * Get all ghost positions
   */
  getAllGhostPositions(): Map<string, { x: number; y: number; z: number } | null> {
    const positions = new Map();
    for (const [id, ghost] of this.ghosts) {
      if (ghost.visible) {
        positions.set(id, ghost.player.getInterpolatedPosition());
      }
    }
    return positions;
  }

  /**
   * Set callback for ghost frames
   */
  onGhostFrame(callback: (ghostId: string, frame: ReplayFrame) => void): void {
    this.onGhostFrameCallback = callback;
  }

  /**
   * Get ghost count
   */
  getGhostCount(): number {
    return this.ghosts.size;
  }

  /**
   * Get ghost metadata
   */
  getGhostMetadata(ghostId: string): ReplayMetadata | null {
    return this.ghosts.get(ghostId)?.replay.metadata || null;
  }
}

// =============================================================================
// REPLAY STORAGE
// =============================================================================

export class ReplayStorage {
  private readonly DB_NAME = 'orthogonal_replays';
  private readonly STORE_NAME = 'replays';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'metadata.id' });
        store.createIndex('levelId', 'metadata.levelId');
        store.createIndex('playerId', 'metadata.playerId');
        store.createIndex('recordedAt', 'metadata.recordedAt');
      };
    });
  }

  /**
   * Save a replay
   */
  async save(replay: ReplayData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(replay);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Load a replay by ID
   */
  async load(replayId: string): Promise<ReplayData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(replayId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Get replays for a level
   */
  async getByLevel(levelId: string): Promise<ReplayData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('levelId');
      const request = index.getAll(levelId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Get personal best replay for a level
   */
  async getPersonalBest(levelId: string, playerId: string): Promise<ReplayData | null> {
    const replays = await this.getByLevel(levelId);
    const playerReplays = replays
      .filter(r => r.metadata.playerId === playerId && r.metadata.completionTime)
      .sort((a, b) => (a.metadata.completionTime || Infinity) - (b.metadata.completionTime || Infinity));

    return playerReplays[0] || null;
  }

  /**
   * Delete a replay
   */
  async delete(replayId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(replayId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get all replays
   */
  async getAll(): Promise<ReplayData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Export replay as JSON
   */
  exportReplay(replay: ReplayData): string {
    return JSON.stringify(replay);
  }

  /**
   * Import replay from JSON
   */
  importReplay(json: string): ReplayData | null {
    try {
      return JSON.parse(json) as ReplayData;
    } catch {
      return null;
    }
  }

  /**
   * Compress replay for sharing (removes some frame data)
   */
  compressForSharing(replay: ReplayData): ReplayData {
    // Sample frames at lower rate
    const sampledFrames: ReplayFrame[] = [];
    const sampleInterval = 5;  // Keep every 5th frame

    for (let i = 0; i < replay.frames.length; i += sampleInterval) {
      sampledFrames.push(replay.frames[i]);
    }

    return {
      metadata: replay.metadata,
      frames: sampledFrames,
      events: replay.events,
      compressed: true
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const replayStorage = new ReplayStorage();
