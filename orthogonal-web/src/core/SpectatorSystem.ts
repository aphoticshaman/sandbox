/**
 * Spectator System
 * Live viewing of other players with eye count indicator
 * Adds social pressure/excitement to gameplay
 */

export interface SpectatorState {
  isStreaming: boolean;         // Are we being watched?
  viewerCount: number;          // How many eyes on us
  isSpectating: boolean;        // Are we watching someone?
  spectatingPlayerId: string | null;
}

export interface ViewerInfo {
  id: string;
  joinedAt: number;
  isAnonymous: boolean;
  username?: string;
}

export interface StreamableState {
  position: { x: number; y: number; z: number };
  witnessLevel: number;
  currentDimension: string;
  focusProgress: number;
  attentionDirection: { x: number; y: number };
  timestamp: number;
}

type SpectatorEventType =
  | 'viewer_joined'
  | 'viewer_left'
  | 'viewer_count_changed'
  | 'stream_started'
  | 'stream_ended'
  | 'spectate_started'
  | 'spectate_ended'
  | 'state_update';

type SpectatorCallback = (data: any) => void;

export class SpectatorSystem {
  private state: SpectatorState;
  private viewers: Map<string, ViewerInfo> = new Map();
  private socket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private listeners: Map<SpectatorEventType, SpectatorCallback[]> = new Map();

  // Streaming config
  private streamInterval: number | null = null;
  private readonly STREAM_RATE = 50; // ms between state updates (20 fps)

  // Player identity
  private playerId: string;
  private playerName: string;

  constructor(playerId: string, playerName: string = 'Anonymous') {
    this.playerId = playerId;
    this.playerName = playerName;

    this.state = {
      isStreaming: false,
      viewerCount: 0,
      isSpectating: false,
      spectatingPlayerId: null,
    };
  }

  // ========================================================================
  // Connection
  // ========================================================================

  async connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(serverUrl);

        this.socket.onopen = () => {
          console.log('[Spectator] Connected to server');
          this.reconnectAttempts = 0;

          // Register with server
          this.send({
            type: 'register',
            playerId: this.playerId,
            playerName: this.playerName,
          });

          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.socket.onclose = () => {
          console.log('[Spectator] Disconnected');
          this.handleDisconnect();
        };

        this.socket.onerror = (error) => {
          console.error('[Spectator] Error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      console.log(`[Spectator] Reconnecting in ${delay}ms...`);
      setTimeout(() => this.reconnect(), delay);
    }
  }

  private async reconnect(): Promise<void> {
    // Would need to store server URL for reconnection
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.stopStreaming();
  }

  // ========================================================================
  // Streaming (Being Watched)
  // ========================================================================

  startStreaming(getState: () => StreamableState): void {
    if (this.state.isStreaming) return;

    this.state.isStreaming = true;

    // Notify server
    this.send({
      type: 'start_stream',
      playerId: this.playerId,
    });

    // Start sending state updates
    this.streamInterval = window.setInterval(() => {
      const gameState = getState();
      this.send({
        type: 'state_update',
        playerId: this.playerId,
        state: gameState,
      });
    }, this.STREAM_RATE);

    this.emit('stream_started', {});
    console.log('[Spectator] Started streaming');
  }

  stopStreaming(): void {
    if (!this.state.isStreaming) return;

    this.state.isStreaming = false;

    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }

    this.send({
      type: 'stop_stream',
      playerId: this.playerId,
    });

    this.emit('stream_ended', {});
    console.log('[Spectator] Stopped streaming');
  }

  // ========================================================================
  // Spectating (Watching Others)
  // ========================================================================

  async spectate(targetPlayerId: string): Promise<void> {
    this.send({
      type: 'spectate',
      playerId: this.playerId,
      targetId: targetPlayerId,
    });

    this.state.isSpectating = true;
    this.state.spectatingPlayerId = targetPlayerId;

    this.emit('spectate_started', { targetId: targetPlayerId });
  }

  stopSpectating(): void {
    if (!this.state.isSpectating) return;

    this.send({
      type: 'stop_spectate',
      playerId: this.playerId,
    });

    this.state.isSpectating = false;
    this.state.spectatingPlayerId = null;

    this.emit('spectate_ended', {});
  }

  // ========================================================================
  // Message Handling
  // ========================================================================

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'viewer_joined':
        this.handleViewerJoined(message);
        break;

      case 'viewer_left':
        this.handleViewerLeft(message);
        break;

      case 'state_update':
        // Received state from player we're spectating
        this.emit('state_update', message.state);
        break;

      case 'stream_list':
        // List of available streams
        this.emit('stream_list', message.streams);
        break;

      case 'error':
        console.error('[Spectator] Server error:', message.error);
        break;
    }
  }

  private handleViewerJoined(message: any): void {
    const viewer: ViewerInfo = {
      id: message.viewerId,
      joinedAt: Date.now(),
      isAnonymous: message.isAnonymous ?? true,
      username: message.username,
    };

    this.viewers.set(viewer.id, viewer);
    this.state.viewerCount = this.viewers.size;

    this.emit('viewer_joined', viewer);
    this.emit('viewer_count_changed', { count: this.state.viewerCount });

    console.log(`[Spectator] Viewer joined. Count: ${this.state.viewerCount}`);
  }

  private handleViewerLeft(message: any): void {
    this.viewers.delete(message.viewerId);
    this.state.viewerCount = this.viewers.size;

    this.emit('viewer_left', { viewerId: message.viewerId });
    this.emit('viewer_count_changed', { count: this.state.viewerCount });

    console.log(`[Spectator] Viewer left. Count: ${this.state.viewerCount}`);
  }

  // ========================================================================
  // Communication
  // ========================================================================

  private send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  // ========================================================================
  // Events
  // ========================================================================

  on(event: SpectatorEventType, callback: SpectatorCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: SpectatorEventType, callback: SpectatorCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index >= 0) callbacks.splice(index, 1);
    }
  }

  private emit(event: SpectatorEventType, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  // ========================================================================
  // Public API
  // ========================================================================

  getState(): SpectatorState {
    return { ...this.state };
  }

  getViewerCount(): number {
    return this.state.viewerCount;
  }

  getViewers(): ViewerInfo[] {
    return Array.from(this.viewers.values());
  }

  isStreaming(): boolean {
    return this.state.isStreaming;
  }

  isSpectating(): boolean {
    return this.state.isSpectating;
  }
}

// ============================================================================
// Eye Indicator UI Component
// ============================================================================

export class EyeIndicator {
  private container: HTMLDivElement;
  private countElement: HTMLSpanElement;
  private eyeElement: HTMLDivElement;
  private currentCount: number = 0;
  private displayCount: number = 0;
  private animationFrame: number | null = null;

  constructor() {
    this.container = this.createContainer();
    this.eyeElement = this.createEye();
    this.countElement = this.createCount();

    this.container.appendChild(this.eyeElement);
    this.container.appendChild(this.countElement);

    // Initially hidden
    this.container.style.opacity = '0';
  }

  private createContainer(): HTMLDivElement {
    const div = document.createElement('div');
    div.id = 'eye-indicator';
    div.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 20px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 16px;
      z-index: 1000;
      transition: opacity 0.3s ease, transform 0.2s ease;
      pointer-events: none;
    `;
    return div;
  }

  private createEye(): HTMLDivElement {
    const eye = document.createElement('div');
    eye.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    `;
    eye.style.display = 'flex';
    eye.style.alignItems = 'center';
    return eye;
  }

  private createCount(): HTMLSpanElement {
    const span = document.createElement('span');
    span.textContent = '0';
    span.style.fontWeight = 'bold';
    span.style.minWidth = '20px';
    return span;
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }

  setCount(count: number): void {
    this.currentCount = count;

    // Show/hide based on count
    if (count > 0 && this.container.style.opacity === '0') {
      this.container.style.opacity = '1';
      this.pulse();
    } else if (count === 0) {
      this.container.style.opacity = '0';
    }

    // Animate count change
    this.animateCount();
  }

  private animateCount(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const animate = () => {
      if (this.displayCount < this.currentCount) {
        this.displayCount++;
        this.countElement.textContent = this.displayCount.toString();
        this.pulse();
        this.animationFrame = requestAnimationFrame(animate);
      } else if (this.displayCount > this.currentCount) {
        this.displayCount--;
        this.countElement.textContent = this.displayCount.toString();
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private pulse(): void {
    this.container.style.transform = 'scale(1.1)';
    setTimeout(() => {
      this.container.style.transform = 'scale(1)';
    }, 150);
  }

  // Heat effect - more viewers = more intense visual
  updateHeat(count: number): void {
    const heat = Math.min(1, count / 10); // Max heat at 10 viewers

    // Color shifts from white to red-orange with more viewers
    const r = 255;
    const g = Math.round(255 - heat * 100);
    const b = Math.round(255 - heat * 200);

    this.container.style.color = `rgb(${r}, ${g}, ${b})`;

    // Glow effect
    if (heat > 0.5) {
      this.container.style.boxShadow = `0 0 ${10 + heat * 20}px rgba(255, 100, 50, ${heat * 0.5})`;
    } else {
      this.container.style.boxShadow = 'none';
    }
  }
}

// ============================================================================
// Offline Mode (for development/testing)
// ============================================================================

export class MockSpectatorSystem extends SpectatorSystem {
  private mockViewerCount: number = 0;
  private mockInterval: number | null = null;

  constructor(playerId: string) {
    super(playerId, 'TestPlayer');
  }

  async connect(_serverUrl: string): Promise<void> {
    console.log('[Spectator] Mock mode - simulating viewers');

    // Simulate random viewer joins/leaves
    this.mockInterval = window.setInterval(() => {
      if (Math.random() > 0.7) {
        // Someone joined
        this.mockViewerCount++;
        (this as any).state.viewerCount = this.mockViewerCount;
        (this as any).emit('viewer_count_changed', { count: this.mockViewerCount });
      } else if (Math.random() > 0.8 && this.mockViewerCount > 0) {
        // Someone left
        this.mockViewerCount--;
        (this as any).state.viewerCount = this.mockViewerCount;
        (this as any).emit('viewer_count_changed', { count: this.mockViewerCount });
      }
    }, 5000);
  }

  disconnect(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }
  }
}
