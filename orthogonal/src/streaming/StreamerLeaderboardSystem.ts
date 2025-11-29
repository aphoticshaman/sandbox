/**
 * StreamerLeaderboardSystem.ts
 *
 * Complete leaderboard system designed for TikTok Live and Twitch streamers
 * Real-time competition, viewer engagement, cross-stream races
 */

// =============================================================================
// TYPES
// =============================================================================

export type Platform = 'tiktok' | 'twitch' | 'youtube' | 'kick' | 'unknown';
export type LeaderboardScope = 'global' | 'platform' | 'streamer' | 'session' | 'level';
export type TimeFrame = 'all-time' | 'monthly' | 'weekly' | 'daily' | 'session';
export type PlayerCount = 1 | 2 | 3 | 4;

export interface LeaderboardEntry {
  id: string;
  rank: number;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  streamerId?: string;
  streamerName?: string;
  platform: Platform;

  // Score data
  score: number;
  timeMs: number;
  levelId: string;
  playerCount: PlayerCount;

  // Metadata
  timestamp: number;
  seed?: number;
  replayId?: string;
  verified: boolean;

  // Viewer engagement
  viewerCount?: number;
  giftValue?: number;
  challengeId?: string;
}

export interface LeaderboardConfig {
  scope: LeaderboardScope;
  timeFrame: TimeFrame;
  levelId?: string;
  playerCount?: PlayerCount;
  platform?: Platform;
  streamerId?: string;
  limit: number;
}

export interface ViewerChallenge {
  id: string;
  type: 'speed' | 'no-death' | 'hidden-objectives' | 'blindfolded' | 'custom';
  title: string;
  description: string;
  levelId: string;
  playerCount: PlayerCount;
  targetScore?: number;
  targetTimeMs?: number;
  reward: string;
  contributions: ViewerContribution[];
  totalContributed: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  createdAt: number;
  expiresAt: number;
}

export interface ViewerContribution {
  viewerId: string;
  viewerName: string;
  amount: number;
  type: 'gift' | 'bits' | 'stars' | 'coins';
  message?: string;
  timestamp: number;
}

export interface LiveRace {
  id: string;
  levelId: string;
  playerCount: PlayerCount;
  seed: number;

  // Participants
  participants: RaceParticipant[];
  maxParticipants: number;

  // Timing
  status: 'lobby' | 'countdown' | 'racing' | 'finished';
  startTime?: number;
  countdownSeconds: number;

  // Results
  results: RaceResult[];

  // Platform
  platform: Platform;
  hostStreamerId: string;
}

export interface RaceParticipant {
  streamerId: string;
  streamerName: string;
  platform: Platform;
  viewerCount: number;
  ready: boolean;
  joinedAt: number;
}

export interface RaceResult {
  streamerId: string;
  streamerName: string;
  place: number;
  timeMs: number;
  score: number;
  viewerBonus: number;
}

// =============================================================================
// LEADERBOARD MANAGER
// =============================================================================

export class StreamerLeaderboardManager {
  private supabaseUrl: string;
  private supabaseKey: string;
  private cache: Map<string, { data: LeaderboardEntry[]; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds
  private listeners: Map<string, Set<(entries: LeaderboardEntry[]) => void>> = new Map();
  private realtimeChannel: any = null;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  // ---------------------------------------------------------------------------
  // FETCH LEADERBOARDS
  // ---------------------------------------------------------------------------

  async getLeaderboard(config: LeaderboardConfig): Promise<LeaderboardEntry[]> {
    const cacheKey = this.getCacheKey(config);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const entries = await this.fetchFromSupabase(config);
    this.cache.set(cacheKey, { data: entries, timestamp: Date.now() });
    return entries;
  }

  private getCacheKey(config: LeaderboardConfig): string {
    return JSON.stringify(config);
  }

  private async fetchFromSupabase(config: LeaderboardConfig): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams();
    params.set('scope', config.scope);
    params.set('timeFrame', config.timeFrame);
    params.set('limit', config.limit.toString());

    if (config.levelId) params.set('levelId', config.levelId);
    if (config.playerCount) params.set('playerCount', config.playerCount.toString());
    if (config.platform) params.set('platform', config.platform);
    if (config.streamerId) params.set('streamerId', config.streamerId);

    const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/get_leaderboard?${params}`, {
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Leaderboard fetch failed:', response.statusText);
      return [];
    }

    return response.json();
  }

  // ---------------------------------------------------------------------------
  // SUBMIT SCORES
  // ---------------------------------------------------------------------------

  async submitScore(entry: Omit<LeaderboardEntry, 'id' | 'rank' | 'timestamp' | 'verified'>): Promise<{ success: boolean; rank?: number; isPersonalBest?: boolean }> {
    const submission = {
      ...entry,
      timestamp: Date.now(),
      verified: false // Will be verified server-side
    };

    const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/submit_score`, {
      method: 'POST',
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submission)
    });

    if (!response.ok) {
      return { success: false };
    }

    const result = await response.json();

    // Invalidate relevant caches
    this.invalidateCaches(entry.levelId, entry.playerCount);

    return {
      success: true,
      rank: result.rank,
      isPersonalBest: result.isPersonalBest
    };
  }

  private invalidateCaches(levelId: string, playerCount: PlayerCount): void {
    for (const key of this.cache.keys()) {
      if (key.includes(levelId) || key.includes(`"playerCount":${playerCount}`)) {
        this.cache.delete(key);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // REALTIME SUBSCRIPTIONS
  // ---------------------------------------------------------------------------

  subscribeToLeaderboard(config: LeaderboardConfig, callback: (entries: LeaderboardEntry[]) => void): () => void {
    const key = this.getCacheKey(config);

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(callback);

    // Initial fetch
    this.getLeaderboard(config).then(callback);

    // Setup realtime if not already
    this.setupRealtime();

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  private setupRealtime(): void {
    if (this.realtimeChannel) return;

    // Supabase realtime subscription
    // In production, use proper Supabase client
    const ws = new WebSocket(`${this.supabaseUrl.replace('https://', 'wss://')}/realtime/v1/websocket?apikey=${this.supabaseKey}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'INSERT' && data.table === 'leaderboard_entries') {
          this.handleNewEntry(data.new);
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    this.realtimeChannel = ws;
  }

  private handleNewEntry(entry: LeaderboardEntry): void {
    // Notify relevant listeners
    for (const [key, listeners] of this.listeners) {
      const config = JSON.parse(key) as LeaderboardConfig;

      if (this.entryMatchesConfig(entry, config)) {
        this.getLeaderboard(config).then(entries => {
          listeners.forEach(cb => cb(entries));
        });
      }
    }
  }

  private entryMatchesConfig(entry: LeaderboardEntry, config: LeaderboardConfig): boolean {
    if (config.levelId && entry.levelId !== config.levelId) return false;
    if (config.playerCount && entry.playerCount !== config.playerCount) return false;
    if (config.platform && entry.platform !== config.platform) return false;
    if (config.streamerId && entry.streamerId !== config.streamerId) return false;
    return true;
  }
}

// =============================================================================
// VIEWER CHALLENGE SYSTEM
// =============================================================================

export class ViewerChallengeSystem {
  private supabaseUrl: string;
  private supabaseKey: string;
  private activeChallenges: Map<string, ViewerChallenge> = new Map();
  private listeners: Set<(challenge: ViewerChallenge) => void> = new Set();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  // ---------------------------------------------------------------------------
  // CHALLENGE CREATION
  // ---------------------------------------------------------------------------

  async createChallenge(
    type: ViewerChallenge['type'],
    levelId: string,
    playerCount: PlayerCount,
    options: {
      title?: string;
      targetScore?: number;
      targetTimeMs?: number;
      durationMinutes?: number;
    } = {}
  ): Promise<ViewerChallenge> {
    const challenge: ViewerChallenge = {
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: options.title || this.generateChallengeTitle(type),
      description: this.generateChallengeDescription(type, options),
      levelId,
      playerCount,
      targetScore: options.targetScore,
      targetTimeMs: options.targetTimeMs,
      reward: this.calculateReward(type),
      contributions: [],
      totalContributed: 0,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (options.durationMinutes || 30) * 60 * 1000
    };

    this.activeChallenges.set(challenge.id, challenge);
    this.notifyListeners(challenge);

    return challenge;
  }

  private generateChallengeTitle(type: ViewerChallenge['type']): string {
    const titles: Record<ViewerChallenge['type'], string[]> = {
      'speed': ['Speed Demon', 'Lightning Run', 'Time Attack', 'Rush Hour'],
      'no-death': ['Deathless', 'Perfect Run', 'Untouchable', 'Flawless'],
      'hidden-objectives': ['Secret Hunter', 'Easter Egg Hunt', 'Hidden Master'],
      'blindfolded': ['Blind Faith', 'No Peeking', 'Pure Instinct'],
      'custom': ['Viewer Challenge', 'Community Test', 'Special Request']
    };
    const options = titles[type];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateChallengeDescription(type: ViewerChallenge['type'], options: any): string {
    switch (type) {
      case 'speed':
        return options.targetTimeMs
          ? `Complete in under ${(options.targetTimeMs / 1000).toFixed(1)}s`
          : 'Beat the current best time';
      case 'no-death':
        return 'Complete without dying once';
      case 'hidden-objectives':
        return 'Find and complete all hidden objectives';
      case 'blindfolded':
        return 'Complete with screen covered (honor system)';
      case 'custom':
        return 'Custom viewer challenge';
      default:
        return 'Complete the challenge';
    }
  }

  private calculateReward(type: ViewerChallenge['type']): string {
    const rewards: Record<ViewerChallenge['type'], string> = {
      'speed': '🏆 Speed Crown',
      'no-death': '💀 Deathless Badge',
      'hidden-objectives': '🔮 Secret Finder',
      'blindfolded': '🎭 Blind Master',
      'custom': '⭐ Viewer Champion'
    };
    return rewards[type];
  }

  // ---------------------------------------------------------------------------
  // CONTRIBUTIONS
  // ---------------------------------------------------------------------------

  async addContribution(
    challengeId: string,
    contribution: Omit<ViewerContribution, 'timestamp'>
  ): Promise<boolean> {
    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge || challenge.status !== 'active') {
      return false;
    }

    const fullContribution: ViewerContribution = {
      ...contribution,
      timestamp: Date.now()
    };

    challenge.contributions.push(fullContribution);
    challenge.totalContributed += contribution.amount;

    this.notifyListeners(challenge);
    return true;
  }

  // ---------------------------------------------------------------------------
  // CHALLENGE LIFECYCLE
  // ---------------------------------------------------------------------------

  async startChallenge(challengeId: string): Promise<boolean> {
    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge || challenge.status !== 'pending') {
      return false;
    }

    challenge.status = 'active';
    this.notifyListeners(challenge);
    return true;
  }

  async completeChallenge(challengeId: string, success: boolean): Promise<boolean> {
    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge || challenge.status !== 'active') {
      return false;
    }

    challenge.status = success ? 'completed' : 'failed';
    this.notifyListeners(challenge);

    // Persist to database
    await this.persistChallenge(challenge);

    return true;
  }

  private async persistChallenge(challenge: ViewerChallenge): Promise<void> {
    await fetch(`${this.supabaseUrl}/rest/v1/viewer_challenges`, {
      method: 'POST',
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(challenge)
    });
  }

  // ---------------------------------------------------------------------------
  // SUBSCRIPTIONS
  // ---------------------------------------------------------------------------

  subscribe(callback: (challenge: ViewerChallenge) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(challenge: ViewerChallenge): void {
    this.listeners.forEach(cb => cb(challenge));
  }

  getActiveChallenge(): ViewerChallenge | undefined {
    for (const challenge of this.activeChallenges.values()) {
      if (challenge.status === 'active' || challenge.status === 'pending') {
        return challenge;
      }
    }
    return undefined;
  }
}

// =============================================================================
// LIVE RACE SYSTEM
// =============================================================================

export class LiveRaceSystem {
  private supabaseUrl: string;
  private supabaseKey: string;
  private activeRaces: Map<string, LiveRace> = new Map();
  private listeners: Map<string, Set<(race: LiveRace) => void>> = new Map();
  private websocket: WebSocket | null = null;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  // ---------------------------------------------------------------------------
  // RACE CREATION
  // ---------------------------------------------------------------------------

  async createRace(
    levelId: string,
    playerCount: PlayerCount,
    hostStreamerId: string,
    platform: Platform,
    options: {
      maxParticipants?: number;
      countdownSeconds?: number;
      seed?: number;
    } = {}
  ): Promise<LiveRace> {
    const race: LiveRace = {
      id: `race-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      levelId,
      playerCount,
      seed: options.seed || Math.floor(Math.random() * 0xFFFFFFFF),
      participants: [],
      maxParticipants: options.maxParticipants || 8,
      status: 'lobby',
      countdownSeconds: options.countdownSeconds || 5,
      results: [],
      platform,
      hostStreamerId
    };

    // Add host as first participant
    race.participants.push({
      streamerId: hostStreamerId,
      streamerName: 'Host',
      platform,
      viewerCount: 0,
      ready: false,
      joinedAt: Date.now()
    });

    this.activeRaces.set(race.id, race);
    await this.broadcastRace(race);

    return race;
  }

  // ---------------------------------------------------------------------------
  // RACE PARTICIPATION
  // ---------------------------------------------------------------------------

  async joinRace(
    raceId: string,
    streamerId: string,
    streamerName: string,
    platform: Platform,
    viewerCount: number
  ): Promise<boolean> {
    const race = this.activeRaces.get(raceId);
    if (!race || race.status !== 'lobby') {
      return false;
    }

    if (race.participants.length >= race.maxParticipants) {
      return false;
    }

    if (race.participants.some(p => p.streamerId === streamerId)) {
      return false; // Already joined
    }

    race.participants.push({
      streamerId,
      streamerName,
      platform,
      viewerCount,
      ready: false,
      joinedAt: Date.now()
    });

    await this.broadcastRace(race);
    return true;
  }

  async setReady(raceId: string, streamerId: string, ready: boolean): Promise<boolean> {
    const race = this.activeRaces.get(raceId);
    if (!race || race.status !== 'lobby') {
      return false;
    }

    const participant = race.participants.find(p => p.streamerId === streamerId);
    if (!participant) {
      return false;
    }

    participant.ready = ready;
    await this.broadcastRace(race);

    // Check if all ready
    if (race.participants.length >= 2 && race.participants.every(p => p.ready)) {
      this.startCountdown(raceId);
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // RACE LIFECYCLE
  // ---------------------------------------------------------------------------

  private async startCountdown(raceId: string): Promise<void> {
    const race = this.activeRaces.get(raceId);
    if (!race) return;

    race.status = 'countdown';
    await this.broadcastRace(race);

    // Countdown timer
    setTimeout(() => {
      this.startRace(raceId);
    }, race.countdownSeconds * 1000);
  }

  private async startRace(raceId: string): Promise<void> {
    const race = this.activeRaces.get(raceId);
    if (!race) return;

    race.status = 'racing';
    race.startTime = Date.now();
    await this.broadcastRace(race);
  }

  async submitResult(
    raceId: string,
    streamerId: string,
    timeMs: number,
    score: number
  ): Promise<{ place: number; viewerBonus: number } | null> {
    const race = this.activeRaces.get(raceId);
    if (!race || race.status !== 'racing') {
      return null;
    }

    const participant = race.participants.find(p => p.streamerId === streamerId);
    if (!participant) {
      return null;
    }

    // Calculate viewer bonus (more viewers = more bonus points)
    const viewerBonus = Math.floor(Math.log10(Math.max(1, participant.viewerCount)) * 100);

    const result: RaceResult = {
      streamerId,
      streamerName: participant.streamerName,
      place: race.results.length + 1,
      timeMs,
      score: score + viewerBonus,
      viewerBonus
    };

    race.results.push(result);
    await this.broadcastRace(race);

    // Check if all finished
    if (race.results.length === race.participants.length) {
      race.status = 'finished';
      // Sort by time
      race.results.sort((a, b) => a.timeMs - b.timeMs);
      race.results.forEach((r, i) => r.place = i + 1);
      await this.broadcastRace(race);
      await this.persistRaceResults(race);
    }

    return { place: result.place, viewerBonus };
  }

  private async persistRaceResults(race: LiveRace): Promise<void> {
    await fetch(`${this.supabaseUrl}/rest/v1/live_races`, {
      method: 'POST',
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(race)
    });
  }

  // ---------------------------------------------------------------------------
  // BROADCASTING
  // ---------------------------------------------------------------------------

  private async broadcastRace(race: LiveRace): Promise<void> {
    const listeners = this.listeners.get(race.id);
    if (listeners) {
      listeners.forEach(cb => cb(race));
    }

    // Also broadcast to global race channel
    const globalListeners = this.listeners.get('global');
    if (globalListeners) {
      globalListeners.forEach(cb => cb(race));
    }
  }

  subscribeToRace(raceId: string, callback: (race: LiveRace) => void): () => void {
    if (!this.listeners.has(raceId)) {
      this.listeners.set(raceId, new Set());
    }
    this.listeners.get(raceId)!.add(callback);

    // Send current state
    const race = this.activeRaces.get(raceId);
    if (race) {
      callback(race);
    }

    return () => this.listeners.get(raceId)?.delete(callback);
  }

  subscribeToAllRaces(callback: (race: LiveRace) => void): () => void {
    if (!this.listeners.has('global')) {
      this.listeners.set('global', new Set());
    }
    this.listeners.get('global')!.add(callback);
    return () => this.listeners.get('global')?.delete(callback);
  }

  // ---------------------------------------------------------------------------
  // DISCOVERY
  // ---------------------------------------------------------------------------

  async getOpenRaces(platform?: Platform): Promise<LiveRace[]> {
    const races: LiveRace[] = [];

    for (const race of this.activeRaces.values()) {
      if (race.status === 'lobby') {
        if (!platform || race.platform === platform) {
          races.push(race);
        }
      }
    }

    return races;
  }
}

// =============================================================================
// LEADERBOARD UI COMPONENTS (HTML/CSS generation)
// =============================================================================

export class LeaderboardUI {
  private container: HTMLElement;
  private manager: StreamerLeaderboardManager;
  private currentConfig: LeaderboardConfig | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(container: HTMLElement, manager: StreamerLeaderboardManager) {
    this.container = container;
    this.manager = manager;
    this.injectStyles();
  }

  private injectStyles(): void {
    if (document.getElementById('leaderboard-styles')) return;

    const style = document.createElement('style');
    style.id = 'leaderboard-styles';
    style.textContent = `
      .ortho-leaderboard {
        background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,20,40,0.95) 100%);
        border: 1px solid rgba(0,255,255,0.3);
        border-radius: 12px;
        padding: 16px;
        font-family: 'Inter', -apple-system, sans-serif;
        color: #fff;
        max-height: 400px;
        overflow-y: auto;
      }

      .ortho-lb-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }

      .ortho-lb-title {
        font-size: 18px;
        font-weight: 700;
        background: linear-gradient(90deg, #00ffff, #ff00ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .ortho-lb-filters {
        display: flex;
        gap: 8px;
      }

      .ortho-lb-filter {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 6px;
        padding: 4px 8px;
        color: #fff;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ortho-lb-filter:hover, .ortho-lb-filter.active {
        background: rgba(0,255,255,0.2);
        border-color: #00ffff;
      }

      .ortho-lb-entry {
        display: flex;
        align-items: center;
        padding: 10px;
        margin-bottom: 6px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        transition: all 0.2s;
      }

      .ortho-lb-entry:hover {
        background: rgba(0,255,255,0.1);
        transform: translateX(4px);
      }

      .ortho-lb-entry.top-3 {
        border-left: 3px solid;
      }

      .ortho-lb-entry.rank-1 { border-color: #ffd700; }
      .ortho-lb-entry.rank-2 { border-color: #c0c0c0; }
      .ortho-lb-entry.rank-3 { border-color: #cd7f32; }

      .ortho-lb-rank {
        width: 32px;
        font-size: 16px;
        font-weight: 700;
        text-align: center;
      }

      .ortho-lb-rank.gold { color: #ffd700; }
      .ortho-lb-rank.silver { color: #c0c0c0; }
      .ortho-lb-rank.bronze { color: #cd7f32; }

      .ortho-lb-player {
        flex: 1;
        margin-left: 12px;
      }

      .ortho-lb-name {
        font-weight: 600;
        font-size: 14px;
      }

      .ortho-lb-meta {
        font-size: 11px;
        color: rgba(255,255,255,0.6);
        display: flex;
        gap: 8px;
        margin-top: 2px;
      }

      .ortho-lb-score {
        text-align: right;
      }

      .ortho-lb-time {
        font-size: 16px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
      }

      .ortho-lb-points {
        font-size: 11px;
        color: rgba(255,255,255,0.6);
      }

      .ortho-lb-platform {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 8px;
      }

      .ortho-lb-platform.tiktok { background: #ff0050; }
      .ortho-lb-platform.twitch { background: #9146ff; }
      .ortho-lb-platform.youtube { background: #ff0000; }
      .ortho-lb-platform.kick { background: #53fc18; color: #000; }

      .ortho-lb-empty {
        text-align: center;
        padding: 40px;
        color: rgba(255,255,255,0.5);
      }

      .ortho-lb-loading {
        display: flex;
        justify-content: center;
        padding: 40px;
      }

      .ortho-lb-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(0,255,255,0.2);
        border-top-color: #00ffff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  async show(config: LeaderboardConfig): Promise<void> {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.currentConfig = config;
    this.renderLoading();

    this.unsubscribe = this.manager.subscribeToLeaderboard(config, (entries) => {
      this.renderEntries(entries);
    });
  }

  private renderLoading(): void {
    this.container.innerHTML = `
      <div class="ortho-leaderboard">
        <div class="ortho-lb-loading">
          <div class="ortho-lb-spinner"></div>
        </div>
      </div>
    `;
  }

  private renderEntries(entries: LeaderboardEntry[]): void {
    const title = this.getTitle();

    this.container.innerHTML = `
      <div class="ortho-leaderboard">
        <div class="ortho-lb-header">
          <div class="ortho-lb-title">${title}</div>
          <div class="ortho-lb-filters">
            <button class="ortho-lb-filter ${this.currentConfig?.timeFrame === 'daily' ? 'active' : ''}" data-timeframe="daily">Today</button>
            <button class="ortho-lb-filter ${this.currentConfig?.timeFrame === 'weekly' ? 'active' : ''}" data-timeframe="weekly">Week</button>
            <button class="ortho-lb-filter ${this.currentConfig?.timeFrame === 'all-time' ? 'active' : ''}" data-timeframe="all-time">All</button>
          </div>
        </div>
        <div class="ortho-lb-entries">
          ${entries.length === 0
            ? '<div class="ortho-lb-empty">No entries yet. Be the first!</div>'
            : entries.map((e, i) => this.renderEntry(e, i)).join('')
          }
        </div>
      </div>
    `;

    // Bind filter clicks
    this.container.querySelectorAll('.ortho-lb-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const timeFrame = (e.target as HTMLElement).dataset.timeframe as TimeFrame;
        if (this.currentConfig) {
          this.show({ ...this.currentConfig, timeFrame });
        }
      });
    });
  }

  private renderEntry(entry: LeaderboardEntry, index: number): string {
    const rankClass = index < 3 ? `rank-${index + 1} top-3` : '';
    const rankColor = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
    const time = this.formatTime(entry.timeMs);

    return `
      <div class="ortho-lb-entry ${rankClass}">
        <div class="ortho-lb-rank ${rankColor}">${entry.rank}</div>
        <div class="ortho-lb-player">
          <div class="ortho-lb-name">
            ${entry.playerName}
            ${entry.streamerName ? `<span class="ortho-lb-platform ${entry.platform}">${entry.platform}</span>` : ''}
          </div>
          <div class="ortho-lb-meta">
            ${entry.streamerName ? `<span>@${entry.streamerName}</span>` : ''}
            <span>${this.formatDate(entry.timestamp)}</span>
          </div>
        </div>
        <div class="ortho-lb-score">
          <div class="ortho-lb-time">${time}</div>
          <div class="ortho-lb-points">${entry.score.toLocaleString()} pts</div>
        </div>
      </div>
    `;
  }

  private getTitle(): string {
    if (!this.currentConfig) return 'Leaderboard';

    const parts: string[] = [];

    if (this.currentConfig.levelId) {
      parts.push(this.currentConfig.levelId);
    }

    if (this.currentConfig.playerCount) {
      parts.push(`${this.currentConfig.playerCount}P`);
    }

    parts.push('Leaderboard');

    return parts.join(' ');
  }

  private formatTime(ms: number): string {
    const seconds = ms / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`;
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  hide(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.container.innerHTML = '';
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createLeaderboardSystem(supabaseUrl: string, supabaseKey: string) {
  return {
    manager: new StreamerLeaderboardManager(supabaseUrl, supabaseKey),
    challenges: new ViewerChallengeSystem(supabaseUrl, supabaseKey),
    races: new LiveRaceSystem(supabaseUrl, supabaseKey)
  };
}
