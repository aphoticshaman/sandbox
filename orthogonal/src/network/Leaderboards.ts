/**
 * Leaderboards System
 * Global, friends, difficulty-specific, streamer rankings
 * Backed by Supabase for persistence
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export type LeaderboardType = 'global' | 'friends' | 'difficulty' | 'streamers' | 'weekly' | 'daily';
export type DifficultyTier = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'transcendent';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  avatar?: string;
  score: number;
  puzzlesSolved: number;
  averageTime: number;
  streakDays: number;
  difficulty: DifficultyTier;
  platform: string;
  isStreamer: boolean;
  viewerPeak?: number;
  updatedAt: number;
}

export interface PlayerStats {
  playerId: string;
  displayName: string;
  totalScore: number;
  puzzlesSolved: number;
  averageTime: number;
  bestTime: number;
  currentStreak: number;
  longestStreak: number;
  difficulty: DifficultyTier;
  rank: {
    global: number;
    difficulty: number;
    friends: number;
  };
  achievements: string[];
}

export interface LeaderboardFilter {
  type: LeaderboardType;
  difficulty?: DifficultyTier;
  timeframe?: 'all' | 'weekly' | 'daily';
  limit?: number;
  offset?: number;
}

export class LeaderboardService {
  private supabase: SupabaseClient;
  private realtimeChannel: RealtimeChannel | null = null;
  private localPlayerId: string = '';

  // Cache
  private cache: Map<string, { data: LeaderboardEntry[]; fetchedAt: number }> = new Map();
  private readonly CACHE_TTL = 60000;  // 1 minute

  // Events
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async initialize(playerId: string): Promise<void> {
    this.localPlayerId = playerId;

    // Subscribe to realtime updates
    this.realtimeChannel = this.supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leaderboards',
      }, (payload) => {
        this.handleRealtimeUpdate(payload);
      })
      .subscribe();

    console.log('[Leaderboards] Initialized');
  }

  // ========================================
  // Fetch Leaderboards
  // ========================================

  async getLeaderboard(filter: LeaderboardFilter): Promise<LeaderboardEntry[]> {
    const cacheKey = this.getCacheKey(filter);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.fetchedAt < this.CACHE_TTL) {
      return cached.data;
    }

    let query = this.supabase
      .from('leaderboards')
      .select('*')
      .order('score', { ascending: false })
      .limit(filter.limit || 100);

    // Apply filters
    if (filter.difficulty) {
      query = query.eq('difficulty', filter.difficulty);
    }

    if (filter.type === 'streamers') {
      query = query.eq('is_streamer', true);
    }

    if (filter.type === 'weekly') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      query = query.gte('updated_at', new Date(weekAgo).toISOString());
    }

    if (filter.type === 'daily') {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      query = query.gte('updated_at', new Date(dayAgo).toISOString());
    }

    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Leaderboards] Fetch error:', error);
      throw error;
    }

    const entries = this.transformEntries(data || []);
    this.cache.set(cacheKey, { data: entries, fetchedAt: Date.now() });

    return entries;
  }

  async getFriendsLeaderboard(friendIds: string[]): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.supabase
      .from('leaderboards')
      .select('*')
      .in('player_id', [...friendIds, this.localPlayerId])
      .order('score', { ascending: false });

    if (error) {
      console.error('[Leaderboards] Friends fetch error:', error);
      throw error;
    }

    return this.transformEntries(data || []);
  }

  async getPlayerStats(playerId?: string): Promise<PlayerStats | null> {
    const id = playerId || this.localPlayerId;

    const { data, error } = await this.supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;  // Not found
      console.error('[Leaderboards] Stats fetch error:', error);
      throw error;
    }

    return this.transformStats(data);
  }

  async getPlayerRank(playerId?: string): Promise<{ global: number; difficulty: number }> {
    const id = playerId || this.localPlayerId;

    const { data: globalRank } = await this.supabase
      .rpc('get_player_rank', { p_player_id: id });

    const stats = await this.getPlayerStats(id);
    const difficulty = stats?.difficulty || 'beginner';

    const { data: difficultyRank } = await this.supabase
      .rpc('get_player_rank_by_difficulty', {
        p_player_id: id,
        p_difficulty: difficulty,
      });

    return {
      global: globalRank || 0,
      difficulty: difficultyRank || 0,
    };
  }

  // ========================================
  // Update Scores
  // ========================================

  async submitScore(puzzleId: string, score: number, time: number): Promise<void> {
    const { error } = await this.supabase
      .from('puzzle_completions')
      .insert({
        player_id: this.localPlayerId,
        puzzle_id: puzzleId,
        score,
        completion_time: time,
        completed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Leaderboards] Submit error:', error);
      throw error;
    }

    // Update aggregate stats (done via database trigger, but we can invalidate cache)
    this.invalidateCache();

    this.emit('scoreSubmitted', { puzzleId, score, time });
  }

  async updateStreamerStats(viewerPeak: number): Promise<void> {
    const { error } = await this.supabase
      .from('leaderboards')
      .update({
        is_streamer: true,
        viewer_peak: viewerPeak,
        updated_at: new Date().toISOString(),
      })
      .eq('player_id', this.localPlayerId);

    if (error) {
      console.error('[Leaderboards] Streamer update error:', error);
    }
  }

  // ========================================
  // Realtime
  // ========================================

  private handleRealtimeUpdate(payload: any): void {
    this.invalidateCache();
    this.emit('leaderboardUpdated', payload);
  }

  // ========================================
  // Helpers
  // ========================================

  private transformEntries(data: any[]): LeaderboardEntry[] {
    return data.map((row, index) => ({
      rank: index + 1,
      playerId: row.player_id,
      displayName: row.display_name,
      avatar: row.avatar_url,
      score: row.score,
      puzzlesSolved: row.puzzles_solved,
      averageTime: row.average_time,
      streakDays: row.streak_days,
      difficulty: row.difficulty as DifficultyTier,
      platform: row.platform,
      isStreamer: row.is_streamer,
      viewerPeak: row.viewer_peak,
      updatedAt: new Date(row.updated_at).getTime(),
    }));
  }

  private transformStats(data: any): PlayerStats {
    return {
      playerId: data.player_id,
      displayName: data.display_name,
      totalScore: data.total_score,
      puzzlesSolved: data.puzzles_solved,
      averageTime: data.average_time,
      bestTime: data.best_time,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      difficulty: data.difficulty as DifficultyTier,
      rank: {
        global: data.global_rank,
        difficulty: data.difficulty_rank,
        friends: data.friends_rank,
      },
      achievements: data.achievements || [],
    };
  }

  private getCacheKey(filter: LeaderboardFilter): string {
    return `${filter.type}-${filter.difficulty || 'all'}-${filter.timeframe || 'all'}`;
  }

  private invalidateCache(): void {
    this.cache.clear();
  }

  // ========================================
  // Events
  // ========================================

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  async cleanup(): Promise<void> {
    if (this.realtimeChannel) {
      await this.supabase.removeChannel(this.realtimeChannel);
    }
  }
}

// ========================================
// Leaderboard UI
// ========================================

export class LeaderboardUI {
  private container: HTMLDivElement;
  private service: LeaderboardService;
  private currentFilter: LeaderboardFilter = { type: 'global', limit: 50 };

  constructor(service: LeaderboardService) {
    this.service = service;
    this.container = this.createUI();
    this.setupEventListeners();
  }

  private createUI(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'leaderboard-container';
    container.innerHTML = `
      <div class="leaderboard-panel">
        <div class="leaderboard-header">
          <h2 class="leaderboard-title">LEADERBOARDS</h2>
          <button class="leaderboard-close">×</button>
        </div>

        <div class="leaderboard-tabs">
          <button class="tab active" data-type="global">Global</button>
          <button class="tab" data-type="friends">Friends</button>
          <button class="tab" data-type="difficulty">Difficulty</button>
          <button class="tab" data-type="streamers">Streamers</button>
          <button class="tab" data-type="weekly">Weekly</button>
        </div>

        <div class="difficulty-filter" style="display: none;">
          <button class="diff-btn active" data-diff="beginner">Beginner</button>
          <button class="diff-btn" data-diff="intermediate">Intermediate</button>
          <button class="diff-btn" data-diff="advanced">Advanced</button>
          <button class="diff-btn" data-diff="expert">Expert</button>
          <button class="diff-btn" data-diff="transcendent">Transcendent</button>
        </div>

        <div class="player-summary">
          <div class="player-rank">
            <span class="rank-label">Your Rank</span>
            <span class="rank-value">#--</span>
          </div>
          <div class="player-score">
            <span class="score-label">Total Score</span>
            <span class="score-value">--</span>
          </div>
        </div>

        <div class="leaderboard-list">
          <div class="loading-spinner"></div>
        </div>

        <div class="leaderboard-footer">
          <button class="load-more">Load More</button>
        </div>
      </div>
    `;

    this.applyStyles();
    return container;
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .leaderboard-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .leaderboard-container.visible {
        opacity: 1;
        visibility: visible;
      }

      .leaderboard-panel {
        width: 600px;
        max-height: 80vh;
        background: rgba(20, 20, 30, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .leaderboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .leaderboard-title {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 3px;
        color: white;
        margin: 0;
      }

      .leaderboard-close {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 20px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .leaderboard-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .leaderboard-tabs {
        display: flex;
        gap: 4px;
        padding: 12px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        overflow-x: auto;
      }

      .leaderboard-tabs .tab {
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: rgba(255, 255, 255, 0.5);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
      }

      .leaderboard-tabs .tab:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .leaderboard-tabs .tab.active {
        background: rgba(102, 126, 234, 0.3);
        color: #667eea;
      }

      .difficulty-filter {
        display: flex;
        gap: 4px;
        padding: 8px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        overflow-x: auto;
      }

      .diff-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.4);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .diff-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .diff-btn.active {
        background: rgba(102, 126, 234, 0.2);
        color: #667eea;
      }

      .player-summary {
        display: flex;
        gap: 24px;
        padding: 16px 24px;
        background: rgba(102, 126, 234, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .player-rank, .player-score {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .rank-label, .score-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .rank-value, .score-value {
        font-size: 24px;
        font-weight: 600;
        color: white;
      }

      .leaderboard-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        min-height: 300px;
      }

      .leaderboard-entry {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        border-radius: 10px;
        transition: background 0.2s;
      }

      .leaderboard-entry:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .leaderboard-entry.self {
        background: rgba(102, 126, 234, 0.15);
        border: 1px solid rgba(102, 126, 234, 0.3);
      }

      .entry-rank {
        width: 40px;
        font-size: 18px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        text-align: center;
      }

      .entry-rank.top-3 {
        color: #ffd700;
      }

      .entry-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .entry-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .entry-name {
        font-weight: 500;
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .streamer-badge {
        font-size: 10px;
        padding: 2px 6px;
        background: #ff0000;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .entry-meta {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
      }

      .entry-score {
        font-size: 18px;
        font-weight: 600;
        color: #667eea;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 40px auto;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .leaderboard-footer {
        padding: 12px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        text-align: center;
      }

      .load-more {
        padding: 10px 24px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: transparent;
        color: white;
        cursor: pointer;
        transition: all 0.2s;
      }

      .load-more:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    // Close button
    const closeBtn = this.container.querySelector('.leaderboard-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Click outside to close
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });

    // Tab buttons
    const tabs = this.container.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const type = (tab as HTMLElement).dataset.type as LeaderboardType;
        this.currentFilter = { ...this.currentFilter, type };

        // Show/hide difficulty filter
        const diffFilter = this.container.querySelector('.difficulty-filter') as HTMLElement;
        diffFilter.style.display = type === 'difficulty' ? 'flex' : 'none';

        this.refresh();
      });
    });

    // Difficulty buttons
    const diffBtns = this.container.querySelectorAll('.diff-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const diff = (btn as HTMLElement).dataset.diff as DifficultyTier;
        this.currentFilter = { ...this.currentFilter, difficulty: diff };
        this.refresh();
      });
    });

    // Load more
    const loadMore = this.container.querySelector('.load-more');
    loadMore?.addEventListener('click', () => this.loadMore());

    // Realtime updates
    this.service.on('leaderboardUpdated', () => this.refresh());
  }

  async refresh(): Promise<void> {
    const listEl = this.container.querySelector('.leaderboard-list') as HTMLElement;
    listEl.innerHTML = '<div class="loading-spinner"></div>';

    try {
      const entries = await this.service.getLeaderboard(this.currentFilter);
      const stats = await this.service.getPlayerStats();

      this.renderEntries(entries);
      this.renderPlayerSummary(stats);
    } catch (error) {
      listEl.innerHTML = '<div class="error">Failed to load leaderboard</div>';
    }
  }

  private renderEntries(entries: LeaderboardEntry[]): void {
    const listEl = this.container.querySelector('.leaderboard-list') as HTMLElement;

    if (entries.length === 0) {
      listEl.innerHTML = '<div class="empty">No entries yet. Be the first!</div>';
      return;
    }

    listEl.innerHTML = entries.map(entry => `
      <div class="leaderboard-entry ${entry.playerId === 'local' ? 'self' : ''}">
        <div class="entry-rank ${entry.rank <= 3 ? 'top-3' : ''}">#${entry.rank}</div>
        <div class="entry-avatar" style="${entry.avatar ? `background-image: url(${entry.avatar})` : ''}"></div>
        <div class="entry-info">
          <div class="entry-name">
            ${this.escapeHtml(entry.displayName)}
            ${entry.isStreamer ? '<span class="streamer-badge">LIVE</span>' : ''}
          </div>
          <div class="entry-meta">
            ${entry.puzzlesSolved} puzzles · ${entry.streakDays} day streak
          </div>
        </div>
        <div class="entry-score">${entry.score.toLocaleString()}</div>
      </div>
    `).join('');
  }

  private renderPlayerSummary(stats: PlayerStats | null): void {
    const rankEl = this.container.querySelector('.rank-value');
    const scoreEl = this.container.querySelector('.score-value');

    if (stats) {
      rankEl!.textContent = `#${stats.rank.global.toLocaleString()}`;
      scoreEl!.textContent = stats.totalScore.toLocaleString();
    }
  }

  private async loadMore(): Promise<void> {
    this.currentFilter.offset = (this.currentFilter.offset || 0) + (this.currentFilter.limit || 50);
    const entries = await this.service.getLeaderboard(this.currentFilter);

    const listEl = this.container.querySelector('.leaderboard-list') as HTMLElement;
    entries.forEach(entry => {
      const html = `
        <div class="leaderboard-entry">
          <div class="entry-rank">#${entry.rank}</div>
          <div class="entry-avatar"></div>
          <div class="entry-info">
            <div class="entry-name">${this.escapeHtml(entry.displayName)}</div>
            <div class="entry-meta">${entry.puzzlesSolved} puzzles</div>
          </div>
          <div class="entry-score">${entry.score.toLocaleString()}</div>
        </div>
      `;
      listEl.insertAdjacentHTML('beforeend', html);
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  show(): void {
    this.container.classList.add('visible');
    this.refresh();
  }

  hide(): void {
    this.container.classList.remove('visible');
  }

  toggle(): void {
    if (this.container.classList.contains('visible')) {
      this.hide();
    } else {
      this.show();
    }
  }
}
