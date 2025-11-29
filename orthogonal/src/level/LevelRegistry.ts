/**
 * Level Registry
 * Dynamic scoring for procedurally generated levels
 * Each unique level configuration gets its own leaderboard
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ========================================
// Level Fingerprinting
// ========================================

export interface LevelParameters {
  // Core structure
  nodeCount: number;
  edgeCount: number;
  portalCount: number;
  dimensionLayers: number;

  // Difficulty factors
  complexityScore: number;      // 0-1, derived from graph structure
  perceptionDemand: number;     // 0-1, witness mode requirements
  timePressure: number;         // 0-1, dynamic elements speed
  coordinationDemand: number;   // 0-1, for multiplayer

  // SDPM adaptation seeds
  sdpmSeed: string;             // Hash of player's profile at generation time
  adaptationLevel: number;      // How much it adapted (0 = base, 1 = fully personalized)

  // Geometry seeds (for exact recreation)
  geometrySeed: number;
  patternSeed: number;
  colorSeed: number;
}

export interface LevelFingerprint {
  id: string;                   // Unique level identifier (hash of params)
  shortCode: string;            // Human-readable short code for sharing
  parameters: LevelParameters;
  difficultyRating: number;     // 0-100, computed rating
  difficultyTier: DifficultyTier;
  createdAt: number;
  playCount: number;
  averageCompletionTime: number;
  completionRate: number;       // % of players who beat it
}

export type DifficultyTier = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'transcendent';

// ========================================
// Difficulty Rating Algorithm
// ========================================

export function computeDifficultyRating(params: LevelParameters): number {
  // Base difficulty from structure
  const structuralComplexity =
    (params.nodeCount / 50) * 15 +          // Max 15 points
    (params.edgeCount / 100) * 15 +         // Max 15 points
    (params.dimensionLayers / 5) * 10;      // Max 10 points

  // Perception/skill demands
  const skillDemand =
    params.complexityScore * 20 +           // Max 20 points
    params.perceptionDemand * 15 +          // Max 15 points
    params.timePressure * 15;               // Max 15 points

  // Personalization can increase or decrease
  // Highly adapted levels for your weaknesses are harder for YOU
  const adaptationModifier = params.adaptationLevel * 10;

  const raw = structuralComplexity + skillDemand + adaptationModifier;

  // Clamp to 0-100
  return Math.min(100, Math.max(0, raw));
}

export function ratingToTier(rating: number): DifficultyTier {
  if (rating < 20) return 'beginner';
  if (rating < 40) return 'intermediate';
  if (rating < 60) return 'advanced';
  if (rating < 80) return 'expert';
  return 'transcendent';
}

// ========================================
// Level Fingerprint Generation
// ========================================

export function generateLevelFingerprint(params: LevelParameters): LevelFingerprint {
  const id = hashLevelParameters(params);
  const shortCode = generateShortCode(id);
  const difficultyRating = computeDifficultyRating(params);

  return {
    id,
    shortCode,
    parameters: params,
    difficultyRating,
    difficultyTier: ratingToTier(difficultyRating),
    createdAt: Date.now(),
    playCount: 0,
    averageCompletionTime: 0,
    completionRate: 0,
  };
}

function hashLevelParameters(params: LevelParameters): string {
  // Create deterministic hash from parameters
  const data = JSON.stringify({
    nc: params.nodeCount,
    ec: params.edgeCount,
    pc: params.portalCount,
    dl: params.dimensionLayers,
    cs: Math.round(params.complexityScore * 100),
    pd: Math.round(params.perceptionDemand * 100),
    tp: Math.round(params.timePressure * 100),
    cd: Math.round(params.coordinationDemand * 100),
    gs: params.geometrySeed,
    ps: params.patternSeed,
  });

  // Simple hash (would use crypto.subtle in production)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return 'lvl-' + Math.abs(hash).toString(36);
}

function generateShortCode(levelId: string): string {
  // Generate shareable short code: XXXX-XXXX
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash = 0;
  for (let i = 0; i < levelId.length; i++) {
    hash = ((hash << 5) - hash) + levelId.charCodeAt(i);
  }

  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.abs(hash >> (i * 4)) % chars.length];
  }

  return code;
}

// ========================================
// Level Registry Service
// ========================================

export interface LevelScore {
  levelId: string;
  playerId: string;
  playerName: string;
  score: number;
  completionTime: number;
  completedAt: number;
  rank?: number;
}

export interface LevelStats {
  levelId: string;
  playCount: number;
  uniquePlayers: number;
  completionRate: number;
  averageTime: number;
  fastestTime: number;
  averageScore: number;
  topScore: number;
}

export class LevelRegistry {
  private supabase: SupabaseClient;
  private cache: Map<string, LevelFingerprint> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ========================================
  // Level Registration
  // ========================================

  async registerLevel(params: LevelParameters): Promise<LevelFingerprint> {
    const fingerprint = generateLevelFingerprint(params);

    // Check if already exists
    const existing = await this.getLevel(fingerprint.id);
    if (existing) {
      return existing;
    }

    // Insert new level
    const { error } = await this.supabase
      .from('levels')
      .insert({
        id: fingerprint.id,
        short_code: fingerprint.shortCode,
        parameters: fingerprint.parameters,
        difficulty_rating: fingerprint.difficultyRating,
        difficulty_tier: fingerprint.difficultyTier,
        created_at: new Date(fingerprint.createdAt).toISOString(),
        play_count: 0,
        completion_rate: 0,
        average_time: 0,
      });

    if (error && error.code !== '23505') {  // Ignore duplicate key
      console.error('[LevelRegistry] Insert error:', error);
    }

    this.cache.set(fingerprint.id, fingerprint);
    return fingerprint;
  }

  async getLevel(levelId: string): Promise<LevelFingerprint | null> {
    // Check cache
    if (this.cache.has(levelId)) {
      return this.cache.get(levelId)!;
    }

    const { data, error } = await this.supabase
      .from('levels')
      .select('*')
      .eq('id', levelId)
      .single();

    if (error || !data) return null;

    const fingerprint: LevelFingerprint = {
      id: data.id,
      shortCode: data.short_code,
      parameters: data.parameters,
      difficultyRating: data.difficulty_rating,
      difficultyTier: data.difficulty_tier,
      createdAt: new Date(data.created_at).getTime(),
      playCount: data.play_count,
      averageCompletionTime: data.average_time,
      completionRate: data.completion_rate,
    };

    this.cache.set(levelId, fingerprint);
    return fingerprint;
  }

  async getLevelByShortCode(shortCode: string): Promise<LevelFingerprint | null> {
    const { data, error } = await this.supabase
      .from('levels')
      .select('*')
      .eq('short_code', shortCode.toUpperCase())
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      shortCode: data.short_code,
      parameters: data.parameters,
      difficultyRating: data.difficulty_rating,
      difficultyTier: data.difficulty_tier,
      createdAt: new Date(data.created_at).getTime(),
      playCount: data.play_count,
      averageCompletionTime: data.average_time,
      completionRate: data.completion_rate,
    };
  }

  // ========================================
  // Score Submission
  // ========================================

  async submitScore(
    levelId: string,
    playerId: string,
    playerName: string,
    score: number,
    completionTime: number
  ): Promise<{ rank: number; isNewRecord: boolean }> {

    // Insert score
    await this.supabase
      .from('level_scores')
      .insert({
        level_id: levelId,
        player_id: playerId,
        player_name: playerName,
        score,
        completion_time: completionTime,
        completed_at: new Date().toISOString(),
      });

    // Get rank
    const { count } = await this.supabase
      .from('level_scores')
      .select('*', { count: 'exact', head: true })
      .eq('level_id', levelId)
      .gt('score', score);

    const rank = (count || 0) + 1;

    // Check if personal record
    const { data: personalBest } = await this.supabase
      .from('level_scores')
      .select('score')
      .eq('level_id', levelId)
      .eq('player_id', playerId)
      .order('score', { ascending: false })
      .limit(2);

    const isNewRecord = !personalBest || personalBest.length <= 1 ||
                        personalBest[0].score === score;

    // Update level stats
    await this.updateLevelStats(levelId, completionTime, true);

    return { rank, isNewRecord };
  }

  async recordAttempt(levelId: string, completed: boolean): Promise<void> {
    await this.updateLevelStats(levelId, 0, completed);
  }

  private async updateLevelStats(
    levelId: string,
    completionTime: number,
    completed: boolean
  ): Promise<void> {

    // Get current stats
    const { data } = await this.supabase
      .from('levels')
      .select('play_count, average_time, completion_rate')
      .eq('id', levelId)
      .single();

    if (!data) return;

    const newPlayCount = data.play_count + 1;
    const completedCount = Math.round(data.completion_rate * data.play_count);
    const newCompletedCount = completedCount + (completed ? 1 : 0);
    const newCompletionRate = newCompletedCount / newPlayCount;

    let newAverageTime = data.average_time;
    if (completed && completionTime > 0) {
      newAverageTime = data.average_time > 0
        ? (data.average_time * completedCount + completionTime) / newCompletedCount
        : completionTime;
    }

    await this.supabase
      .from('levels')
      .update({
        play_count: newPlayCount,
        completion_rate: newCompletionRate,
        average_time: newAverageTime,
      })
      .eq('id', levelId);

    // Update cache
    const cached = this.cache.get(levelId);
    if (cached) {
      cached.playCount = newPlayCount;
      cached.completionRate = newCompletionRate;
      cached.averageCompletionTime = newAverageTime;
    }
  }

  // ========================================
  // Leaderboards
  // ========================================

  async getLevelLeaderboard(levelId: string, limit: number = 50): Promise<LevelScore[]> {
    const { data, error } = await this.supabase
      .from('level_scores')
      .select('*')
      .eq('level_id', levelId)
      .order('score', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row: any, index: number) => ({
      levelId: row.level_id,
      playerId: row.player_id,
      playerName: row.player_name,
      score: row.score,
      completionTime: row.completion_time,
      completedAt: new Date(row.completed_at).getTime(),
      rank: index + 1,
    }));
  }

  async getPlayerBestScore(levelId: string, playerId: string): Promise<LevelScore | null> {
    const { data, error } = await this.supabase
      .from('level_scores')
      .select('*')
      .eq('level_id', levelId)
      .eq('player_id', playerId)
      .order('score', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      levelId: data.level_id,
      playerId: data.player_id,
      playerName: data.player_name,
      score: data.score,
      completionTime: data.completion_time,
      completedAt: new Date(data.completed_at).getTime(),
    };
  }

  // ========================================
  // Level Discovery
  // ========================================

  async getSimilarLevels(levelId: string, limit: number = 10): Promise<LevelFingerprint[]> {
    // Get source level
    const source = await this.getLevel(levelId);
    if (!source) return [];

    // Find levels with similar difficulty rating
    const minRating = Math.max(0, source.difficultyRating - 10);
    const maxRating = Math.min(100, source.difficultyRating + 10);

    const { data, error } = await this.supabase
      .from('levels')
      .select('*')
      .gte('difficulty_rating', minRating)
      .lte('difficulty_rating', maxRating)
      .neq('id', levelId)
      .order('play_count', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      shortCode: row.short_code,
      parameters: row.parameters,
      difficultyRating: row.difficulty_rating,
      difficultyTier: row.difficulty_tier,
      createdAt: new Date(row.created_at).getTime(),
      playCount: row.play_count,
      averageCompletionTime: row.average_time,
      completionRate: row.completion_rate,
    }));
  }

  async getPopularLevels(tier?: DifficultyTier, limit: number = 20): Promise<LevelFingerprint[]> {
    let query = this.supabase
      .from('levels')
      .select('*')
      .order('play_count', { ascending: false })
      .limit(limit);

    if (tier) {
      query = query.eq('difficulty_tier', tier);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      shortCode: row.short_code,
      parameters: row.parameters,
      difficultyRating: row.difficulty_rating,
      difficultyTier: row.difficulty_tier,
      createdAt: new Date(row.created_at).getTime(),
      playCount: row.play_count,
      averageCompletionTime: row.average_time,
      completionRate: row.completion_rate,
    }));
  }

  async getNewLevels(limit: number = 20): Promise<LevelFingerprint[]> {
    const { data, error } = await this.supabase
      .from('levels')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      shortCode: row.short_code,
      parameters: row.parameters,
      difficultyRating: row.difficulty_rating,
      difficultyTier: row.difficulty_tier,
      createdAt: new Date(row.created_at).getTime(),
      playCount: row.play_count,
      averageCompletionTime: row.average_time,
      completionRate: row.completion_rate,
    }));
  }

  // ========================================
  // Level Sharing
  // ========================================

  getLevelShareLink(shortCode: string): string {
    return `https://orthogonal.game/level/${shortCode}`;
  }

  getLevelQRData(shortCode: string): string {
    return this.getLevelShareLink(shortCode);
  }
}

// ========================================
// Level Leaderboard UI
// ========================================

export class LevelLeaderboardUI {
  private container: HTMLDivElement;
  private registry: LevelRegistry;
  private currentLevel: LevelFingerprint | null = null;

  constructor(registry: LevelRegistry) {
    this.registry = registry;
    this.container = this.createUI();
  }

  private createUI(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'level-leaderboard';
    container.innerHTML = `
      <div class="level-panel">
        <div class="level-header">
          <div class="level-info">
            <span class="level-code"></span>
            <span class="level-tier"></span>
          </div>
          <div class="level-stats">
            <div class="stat">
              <span class="stat-value plays">--</span>
              <span class="stat-label">Plays</span>
            </div>
            <div class="stat">
              <span class="stat-value completion">--</span>
              <span class="stat-label">Clear Rate</span>
            </div>
            <div class="stat">
              <span class="stat-value avg-time">--</span>
              <span class="stat-label">Avg Time</span>
            </div>
          </div>
          <button class="share-btn" title="Share level">
            <span>📤</span>
          </button>
        </div>

        <div class="leaderboard-entries">
          <div class="loading">Loading...</div>
        </div>

        <div class="similar-levels">
          <h4>Similar Levels</h4>
          <div class="similar-list"></div>
        </div>
      </div>
    `;

    this.applyStyles();
    this.setupEventListeners();
    return container;
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .level-leaderboard {
        position: fixed;
        top: 80px;
        left: 20px;
        width: 320px;
        background: rgba(0, 0, 0, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        font-family: 'Inter', sans-serif;
        z-index: 900;
        overflow: hidden;
        display: none;
      }

      .level-leaderboard.visible {
        display: block;
      }

      .level-header {
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .level-info {
        flex: 1;
      }

      .level-code {
        font-size: 14px;
        font-family: monospace;
        color: white;
        font-weight: 600;
        letter-spacing: 1px;
      }

      .level-tier {
        display: inline-block;
        margin-left: 8px;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .level-tier.beginner { background: #4ade80; color: black; }
      .level-tier.intermediate { background: #60a5fa; color: black; }
      .level-tier.advanced { background: #f59e0b; color: black; }
      .level-tier.expert { background: #ef4444; color: white; }
      .level-tier.transcendent { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }

      .level-stats {
        display: flex;
        gap: 16px;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .stat-value {
        font-size: 16px;
        font-weight: 600;
        color: white;
      }

      .stat-label {
        font-size: 9px;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .share-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
      }

      .share-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .leaderboard-entries {
        max-height: 250px;
        overflow-y: auto;
        padding: 8px;
      }

      .lb-entry {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .lb-entry:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .lb-entry.self {
        background: rgba(102, 126, 234, 0.15);
      }

      .lb-rank {
        width: 28px;
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
      }

      .lb-rank.gold { color: #ffd700; }
      .lb-rank.silver { color: #c0c0c0; }
      .lb-rank.bronze { color: #cd7f32; }

      .lb-player {
        flex: 1;
        font-size: 13px;
        color: white;
      }

      .lb-score {
        font-size: 14px;
        font-weight: 600;
        color: #667eea;
      }

      .lb-time {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
        width: 50px;
        text-align: right;
      }

      .similar-levels {
        padding: 12px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }

      .similar-levels h4 {
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0 0 12px;
      }

      .similar-list {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
      }

      .similar-level {
        flex-shrink: 0;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .similar-level:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .similar-code {
        font-size: 11px;
        font-family: monospace;
        color: white;
        letter-spacing: 0.5px;
      }

      .similar-meta {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.4);
        margin-top: 4px;
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    const shareBtn = this.container.querySelector('.share-btn');
    shareBtn?.addEventListener('click', () => {
      if (this.currentLevel) {
        const link = this.registry.getLevelShareLink(this.currentLevel.shortCode);
        navigator.clipboard.writeText(link);
        // Show feedback
        const span = shareBtn.querySelector('span');
        if (span) {
          span.textContent = '✓';
          setTimeout(() => { span.textContent = '📤'; }, 1500);
        }
      }
    });

    // Click similar level
    this.container.addEventListener('click', async (e) => {
      const target = (e.target as HTMLElement).closest('.similar-level');
      if (target) {
        const code = target.dataset.code;
        if (code) {
          const level = await this.registry.getLevelByShortCode(code);
          if (level) {
            this.showLevel(level.id);
            // Emit event for game to load this level
            window.dispatchEvent(new CustomEvent('orthogonal:loadLevel', {
              detail: { level }
            }));
          }
        }
      }
    });
  }

  async showLevel(levelId: string): Promise<void> {
    const level = await this.registry.getLevel(levelId);
    if (!level) return;

    this.currentLevel = level;
    this.container.classList.add('visible');

    // Update header
    const codeEl = this.container.querySelector('.level-code');
    const tierEl = this.container.querySelector('.level-tier');
    const playsEl = this.container.querySelector('.plays');
    const completionEl = this.container.querySelector('.completion');
    const avgTimeEl = this.container.querySelector('.avg-time');

    if (codeEl) codeEl.textContent = level.shortCode;
    if (tierEl) {
      tierEl.textContent = level.difficultyTier;
      tierEl.className = `level-tier ${level.difficultyTier}`;
    }
    if (playsEl) playsEl.textContent = level.playCount.toLocaleString();
    if (completionEl) completionEl.textContent = `${Math.round(level.completionRate * 100)}%`;
    if (avgTimeEl) avgTimeEl.textContent = this.formatTime(level.averageCompletionTime);

    // Load leaderboard
    await this.loadLeaderboard(levelId);

    // Load similar levels
    await this.loadSimilarLevels(levelId);
  }

  private async loadLeaderboard(levelId: string): Promise<void> {
    const entriesEl = this.container.querySelector('.leaderboard-entries') as HTMLElement;
    entriesEl.innerHTML = '<div class="loading">Loading...</div>';

    const scores = await this.registry.getLevelLeaderboard(levelId, 20);

    if (scores.length === 0) {
      entriesEl.innerHTML = '<div class="empty" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.4);">No scores yet. Be the first!</div>';
      return;
    }

    entriesEl.innerHTML = scores.map(score => {
      const rankClass = score.rank === 1 ? 'gold' : score.rank === 2 ? 'silver' : score.rank === 3 ? 'bronze' : '';
      return `
        <div class="lb-entry">
          <div class="lb-rank ${rankClass}">#${score.rank}</div>
          <div class="lb-player">${this.escapeHtml(score.playerName)}</div>
          <div class="lb-score">${score.score.toLocaleString()}</div>
          <div class="lb-time">${this.formatTime(score.completionTime)}</div>
        </div>
      `;
    }).join('');
  }

  private async loadSimilarLevels(levelId: string): Promise<void> {
    const listEl = this.container.querySelector('.similar-list') as HTMLElement;
    const similar = await this.registry.getSimilarLevels(levelId, 5);

    if (similar.length === 0) {
      listEl.innerHTML = '<div style="color: rgba(255,255,255,0.3); font-size: 12px;">No similar levels yet</div>';
      return;
    }

    listEl.innerHTML = similar.map(level => `
      <div class="similar-level" data-code="${level.shortCode}">
        <div class="similar-code">${level.shortCode}</div>
        <div class="similar-meta">${level.playCount} plays</div>
      </div>
    `).join('');
  }

  private formatTime(ms: number): string {
    if (!ms) return '--:--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  hide(): void {
    this.container.classList.remove('visible');
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }
}
