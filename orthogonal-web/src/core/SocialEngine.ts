/**
 * Social Engine
 * TikTok-style engagement algorithm + emoji reactions + friends
 *
 * Key mechanics:
 * - Streams with higher engagement get more viewers funneled in
 * - Viewers can send approved emojis
 * - Steam friends + in-game friends integration
 * - Engagement metrics drive discovery
 */

// ============================================================================
// Approved Emojis (curated set)
// ============================================================================

export const APPROVED_EMOJIS = {
  // Positive reactions
  '👁': { category: 'attention', weight: 1.0 },     // Watching closely
  '🔥': { category: 'hype', weight: 1.5 },          // Fire/impressive
  '✨': { category: 'appreciation', weight: 1.2 },  // Beautiful/magical
  '🧠': { category: 'smart', weight: 1.3 },         // Big brain move
  '💫': { category: 'transcendent', weight: 1.5 }, // Transcendent moment

  // Supportive
  '💪': { category: 'encourage', weight: 1.1 },     // You got this
  '🙏': { category: 'respect', weight: 1.2 },       // Respect/thanks

  // Reactive
  '😮': { category: 'surprise', weight: 1.0 },      // Wow
  '😱': { category: 'shock', weight: 1.3 },         // OMG moment
  '🤯': { category: 'mindblown', weight: 1.5 },     // Mind blown

  // Meta
  '🪞': { category: 'meta', weight: 1.4 },          // Meta-awareness moment
  '∞': { category: 'infinity', weight: 1.5 },       // Infinite/recursive moment

  // Dimension-specific
  '💠': { category: 'lattice', weight: 1.0 },       // Geometry/logic
  '❤️': { category: 'marrow', weight: 1.0 },        // Visceral/heart
  '🌀': { category: 'void', weight: 1.0 },          // Void/spiral
} as const;

export type ApprovedEmoji = keyof typeof APPROVED_EMOJIS;

// ============================================================================
// Engagement Metrics
// ============================================================================

export interface EngagementMetrics {
  streamId: string;

  // Watch metrics
  currentViewers: number;
  peakViewers: number;
  totalUniqueViewers: number;
  averageWatchTime: number;      // seconds
  retentionRate: number;         // 0-1, % who stay >30s

  // Interaction metrics
  emojiCount: number;
  emojiRate: number;             // per minute
  emojiDiversity: number;        // unique emoji types used
  emojiWeightedScore: number;    // considering emoji weights

  // Computed scores
  engagementScore: number;       // 0-100
  viralityScore: number;         // likelihood to grow
  qualityScore: number;          // content quality estimate

  // Time tracking
  streamDuration: number;
  lastUpdated: number;
}

export interface ViewerSession {
  viewerId: string;
  streamId: string;
  joinedAt: number;
  leftAt?: number;
  emojisUsed: ApprovedEmoji[];
  watchDuration: number;
}

// ============================================================================
// TikTok-Style Distribution Algorithm
// ============================================================================

export class DistributionAlgorithm {
  private streams: Map<string, EngagementMetrics> = new Map();
  private viewerSessions: Map<string, ViewerSession[]> = new Map();

  /**
   * Calculate stream score for distribution priority
   * Higher score = more new viewers funneled in
   */
  calculateStreamScore(metrics: EngagementMetrics): number {
    // Weights for different factors
    const weights = {
      engagement: 0.35,
      retention: 0.25,
      growth: 0.20,
      freshness: 0.10,
      quality: 0.10,
    };

    // Engagement component
    const engagementScore = Math.min(100,
      (metrics.emojiRate * 10) +
      (metrics.emojiWeightedScore * 0.5) +
      (metrics.currentViewers * 2)
    );

    // Retention component
    const retentionScore = metrics.retentionRate * 100;

    // Growth component (are viewers staying and increasing?)
    const growthScore = metrics.currentViewers > 0
      ? Math.min(100, (metrics.currentViewers / metrics.peakViewers) * 100)
      : 0;

    // Freshness (newer streams get boost)
    const ageMinutes = (Date.now() - (Date.now() - metrics.streamDuration)) / 60000;
    const freshnessScore = Math.max(0, 100 - ageMinutes);

    // Quality (derived from content signals)
    const qualityScore = metrics.qualityScore;

    // Combine
    const totalScore =
      engagementScore * weights.engagement +
      retentionScore * weights.retention +
      growthScore * weights.growth +
      freshnessScore * weights.freshness +
      qualityScore * weights.quality;

    return totalScore;
  }

  /**
   * Get recommended streams for a viewer
   * Mix of high-engagement and discovery
   */
  getRecommendedStreams(
    viewerProfile: any,
    count: number = 10
  ): { streamId: string; score: number; reason: string }[] {
    const recommendations: { streamId: string; score: number; reason: string }[] = [];

    // Get all active streams
    const activeStreams = Array.from(this.streams.entries())
      .filter(([_, m]) => m.currentViewers > 0);

    // Calculate scores
    for (const [streamId, metrics] of activeStreams) {
      const baseScore = this.calculateStreamScore(metrics);

      // Boost for matching difficulty/style (from matchmaker)
      const matchBoost = 0; // Would integrate with SpectatorMatchmaker

      recommendations.push({
        streamId,
        score: baseScore + matchBoost,
        reason: this.getRecommendationReason(metrics),
      });
    }

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    // Add some randomization for discovery (TikTok-style)
    const topStreams = recommendations.slice(0, Math.ceil(count * 0.7));
    const randomStreams = this.selectRandom(
      recommendations.slice(Math.ceil(count * 0.7)),
      Math.floor(count * 0.3)
    );

    return [...topStreams, ...randomStreams].slice(0, count);
  }

  private getRecommendationReason(metrics: EngagementMetrics): string {
    if (metrics.emojiRate > 5) return '🔥 High energy';
    if (metrics.retentionRate > 0.8) return '👁 Viewers hooked';
    if (metrics.currentViewers > 50) return '📈 Popular now';
    if (metrics.qualityScore > 80) return '✨ Quality content';
    return '🎲 Discover';
  }

  private selectRandom<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Record emoji usage and update metrics
   */
  recordEmoji(streamId: string, viewerId: string, emoji: ApprovedEmoji): void {
    const metrics = this.streams.get(streamId);
    if (!metrics) return;

    const emojiData = APPROVED_EMOJIS[emoji];
    if (!emojiData) return;

    metrics.emojiCount++;
    metrics.emojiWeightedScore += emojiData.weight;

    // Update emoji rate (rolling window)
    const windowMs = 60000; // 1 minute
    metrics.emojiRate = metrics.emojiCount / (metrics.streamDuration / windowMs);

    // Update viewer session
    const sessions = this.viewerSessions.get(viewerId) || [];
    const currentSession = sessions.find(s => s.streamId === streamId && !s.leftAt);
    if (currentSession) {
      currentSession.emojisUsed.push(emoji);
    }

    this.streams.set(streamId, metrics);
  }

  /**
   * Update metrics when viewer joins
   */
  viewerJoined(streamId: string, viewerId: string): void {
    const metrics = this.streams.get(streamId) || this.createMetrics(streamId);

    metrics.currentViewers++;
    metrics.totalUniqueViewers++;
    if (metrics.currentViewers > metrics.peakViewers) {
      metrics.peakViewers = metrics.currentViewers;
    }

    // Track session
    const session: ViewerSession = {
      viewerId,
      streamId,
      joinedAt: Date.now(),
      emojisUsed: [],
      watchDuration: 0,
    };
    const sessions = this.viewerSessions.get(viewerId) || [];
    sessions.push(session);
    this.viewerSessions.set(viewerId, sessions);

    this.streams.set(streamId, metrics);
  }

  /**
   * Update metrics when viewer leaves
   */
  viewerLeft(streamId: string, viewerId: string): void {
    const metrics = this.streams.get(streamId);
    if (!metrics) return;

    metrics.currentViewers = Math.max(0, metrics.currentViewers - 1);

    // Update session
    const sessions = this.viewerSessions.get(viewerId) || [];
    const session = sessions.find(s => s.streamId === streamId && !s.leftAt);
    if (session) {
      session.leftAt = Date.now();
      session.watchDuration = session.leftAt - session.joinedAt;

      // Update average watch time
      const allSessions = Array.from(this.viewerSessions.values()).flat()
        .filter(s => s.streamId === streamId && s.leftAt);
      const totalWatch = allSessions.reduce((sum, s) => sum + s.watchDuration, 0);
      metrics.averageWatchTime = totalWatch / allSessions.length;

      // Update retention (stayed >30s)
      const retained = allSessions.filter(s => s.watchDuration > 30000);
      metrics.retentionRate = retained.length / allSessions.length;
    }

    this.streams.set(streamId, metrics);
  }

  private createMetrics(streamId: string): EngagementMetrics {
    return {
      streamId,
      currentViewers: 0,
      peakViewers: 0,
      totalUniqueViewers: 0,
      averageWatchTime: 0,
      retentionRate: 0,
      emojiCount: 0,
      emojiRate: 0,
      emojiDiversity: 0,
      emojiWeightedScore: 0,
      engagementScore: 0,
      viralityScore: 0,
      qualityScore: 50,
      streamDuration: 0,
      lastUpdated: Date.now(),
    };
  }
}

// ============================================================================
// Emoji Stream UI
// ============================================================================

export class EmojiStream {
  private container: HTMLDivElement;
  private enabled: boolean = true;
  private emojiQueue: { emoji: ApprovedEmoji; timestamp: number }[] = [];
  private readonly MAX_VISIBLE = 20;

  constructor() {
    this.container = this.createContainer();
    this.startAnimation();
  }

  private createContainer(): HTMLDivElement {
    const div = document.createElement('div');
    div.id = 'emoji-stream';
    div.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 100px;
      width: 60px;
      height: 300px;
      pointer-events: none;
      overflow: hidden;
      z-index: 1000;
    `;
    return div;
  }

  toggle(enabled: boolean): void {
    this.enabled = enabled;
    this.container.style.display = enabled ? 'block' : 'none';
  }

  addEmoji(emoji: ApprovedEmoji): void {
    if (!this.enabled) return;

    this.emojiQueue.push({ emoji, timestamp: Date.now() });

    // Create floating emoji element
    const el = document.createElement('div');
    el.textContent = emoji;
    el.style.cssText = `
      position: absolute;
      bottom: 0;
      right: ${Math.random() * 40}px;
      font-size: 24px;
      opacity: 1;
      animation: floatUp 2s ease-out forwards;
      pointer-events: none;
    `;
    this.container.appendChild(el);

    // Remove after animation
    setTimeout(() => el.remove(), 2000);

    // Trim queue
    if (this.emojiQueue.length > this.MAX_VISIBLE) {
      this.emojiQueue.shift();
    }
  }

  private startAnimation(): void {
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floatUp {
        0% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translateY(-300px) scale(1.2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}

// ============================================================================
// Emoji Picker (for viewers)
// ============================================================================

export class EmojiPicker {
  private container: HTMLDivElement;
  private onSelect: (emoji: ApprovedEmoji) => void;
  private cooldown: boolean = false;
  private cooldownMs: number = 500; // Anti-spam

  constructor(onSelect: (emoji: ApprovedEmoji) => void) {
    this.onSelect = onSelect;
    this.container = this.createContainer();
  }

  private createContainer(): HTMLDivElement {
    const div = document.createElement('div');
    div.id = 'emoji-picker';
    div.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      max-width: 200px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 12px;
      z-index: 1001;
    `;

    // Create emoji buttons
    for (const emoji of Object.keys(APPROVED_EMOJIS) as ApprovedEmoji[]) {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.style.cssText = `
        width: 36px;
        height: 36px;
        border: none;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        font-size: 20px;
        cursor: pointer;
        transition: transform 0.1s, background 0.2s;
      `;

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(255,255,255,0.2)';
        btn.style.transform = 'scale(1.1)';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(255,255,255,0.1)';
        btn.style.transform = 'scale(1)';
      });

      btn.addEventListener('click', () => this.selectEmoji(emoji));

      div.appendChild(btn);
    }

    return div;
  }

  private selectEmoji(emoji: ApprovedEmoji): void {
    if (this.cooldown) return;

    this.onSelect(emoji);

    // Apply cooldown
    this.cooldown = true;
    setTimeout(() => {
      this.cooldown = false;
    }, this.cooldownMs);
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  show(): void {
    this.container.style.display = 'flex';
  }
}

// ============================================================================
// Friends System
// ============================================================================

export interface Friend {
  id: string;
  name: string;
  source: 'steam' | 'game' | 'both';
  isOnline: boolean;
  isPlaying: boolean;
  isStreaming: boolean;
  currentDimension?: string;
}

export class FriendsManager {
  private friends: Map<string, Friend> = new Map();
  private listeners: Map<string, ((friends: Friend[]) => void)[]> = new Map();

  /**
   * Sync with Steam friends (via Steamworks SDK / Electron bridge)
   */
  async syncSteamFriends(): Promise<void> {
    // In Electron, this would call the Steam API
    // For web, we'd need a backend bridge

    // Placeholder: would get from Steam
    console.log('[Friends] Steam sync would happen here');
  }

  /**
   * Add in-game friend
   */
  addGameFriend(friend: Omit<Friend, 'source'>): void {
    const existing = this.friends.get(friend.id);

    if (existing) {
      existing.source = 'both';
      this.friends.set(friend.id, existing);
    } else {
      this.friends.set(friend.id, { ...friend, source: 'game' });
    }

    this.emit('friends_updated');
  }

  /**
   * Remove in-game friend
   */
  removeGameFriend(friendId: string): void {
    const friend = this.friends.get(friendId);
    if (!friend) return;

    if (friend.source === 'both') {
      friend.source = 'steam';
      this.friends.set(friendId, friend);
    } else if (friend.source === 'game') {
      this.friends.delete(friendId);
    }

    this.emit('friends_updated');
  }

  /**
   * Get online friends
   */
  getOnlineFriends(): Friend[] {
    return Array.from(this.friends.values())
      .filter(f => f.isOnline);
  }

  /**
   * Get friends currently streaming
   */
  getStreamingFriends(): Friend[] {
    return Array.from(this.friends.values())
      .filter(f => f.isStreaming);
  }

  /**
   * Get friends in same dimension
   */
  getFriendsInDimension(dimension: string): Friend[] {
    return Array.from(this.friends.values())
      .filter(f => f.isPlaying && f.currentDimension === dimension);
  }

  // Events
  on(event: string, callback: (friends: Friend[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const friends = Array.from(this.friends.values());
      callbacks.forEach(cb => cb(friends));
    }
  }
}

// ============================================================================
// Friends Panel UI
// ============================================================================

export class FriendsPanel {
  private container: HTMLDivElement;
  private manager: FriendsManager;
  private onWatch: (friendId: string) => void;

  constructor(manager: FriendsManager, onWatch: (friendId: string) => void) {
    this.manager = manager;
    this.onWatch = onWatch;
    this.container = this.createContainer();

    // Update when friends change
    this.manager.on('friends_updated', () => this.render());
  }

  private createContainer(): HTMLDivElement {
    const div = document.createElement('div');
    div.id = 'friends-panel';
    div.style.cssText = `
      position: fixed;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 250px;
      max-height: 400px;
      background: rgba(0, 0, 0, 0.9);
      border-radius: 12px;
      padding: 16px;
      color: white;
      font-family: system-ui, sans-serif;
      overflow-y: auto;
      z-index: 1000;
      display: none;
    `;
    return div;
  }

  private render(): void {
    const streaming = this.manager.getStreamingFriends();
    const online = this.manager.getOnlineFriends().filter(f => !f.isStreaming);

    this.container.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 14px; opacity: 0.7;">FRIENDS</h3>

      ${streaming.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; opacity: 0.5; margin-bottom: 8px;">STREAMING</div>
          ${streaming.map(f => this.renderFriend(f, true)).join('')}
        </div>
      ` : ''}

      ${online.length > 0 ? `
        <div>
          <div style="font-size: 12px; opacity: 0.5; margin-bottom: 8px;">ONLINE</div>
          ${online.map(f => this.renderFriend(f, false)).join('')}
        </div>
      ` : ''}

      ${streaming.length === 0 && online.length === 0 ? `
        <div style="text-align: center; opacity: 0.5; padding: 20px;">
          No friends online
        </div>
      ` : ''}
    `;

    // Bind watch buttons
    this.container.querySelectorAll('.watch-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const friendId = (e.target as HTMLElement).dataset.friendId;
        if (friendId) this.onWatch(friendId);
      });
    });
  }

  private renderFriend(friend: Friend, streaming: boolean): string {
    const sourceIcon = friend.source === 'steam' ? '🎮' : friend.source === 'game' ? '⭐' : '🎮⭐';

    return `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        margin-bottom: 4px;
        background: rgba(255,255,255,0.05);
        border-radius: 6px;
      ">
        <div>
          <span style="margin-right: 4px;">${sourceIcon}</span>
          <span>${friend.name}</span>
          ${friend.currentDimension ? `
            <span style="font-size: 10px; opacity: 0.5; margin-left: 4px;">
              ${friend.currentDimension.toUpperCase()}
            </span>
          ` : ''}
        </div>

        ${streaming ? `
          <button
            class="watch-btn"
            data-friend-id="${friend.id}"
            style="
              padding: 4px 8px;
              background: rgba(255,255,255,0.2);
              border: none;
              border-radius: 4px;
              color: white;
              font-size: 12px;
              cursor: pointer;
            "
          >Watch</button>
        ` : ''}
      </div>
    `;
  }

  toggle(): void {
    const isVisible = this.container.style.display !== 'none';
    this.container.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) this.render();
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
