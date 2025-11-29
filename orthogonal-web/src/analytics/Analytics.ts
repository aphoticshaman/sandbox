/**
 * Analytics.ts
 *
 * Player behavior tracking and analytics for Orthogonal
 * Privacy-respecting telemetry for game improvement
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DimensionType } from '../core/DimensionManager';

// =============================================================================
// TYPES
// =============================================================================

export type EventCategory =
  | 'session'          // Session start/end
  | 'level'            // Level events
  | 'puzzle'           // Puzzle interactions
  | 'social'           // Multiplayer/spectator
  | 'ui'               // UI interactions
  | 'performance'      // Technical metrics
  | 'error';           // Errors

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface SessionData {
  sessionId: string;
  playerId: string;
  startTime: number;
  endTime?: number;
  platform: string;
  browserInfo: string;
  screenSize: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  events: AnalyticsEvent[];
}

export interface LevelAnalytics {
  levelId: string;
  attempts: number;
  completions: number;
  averageTime: number;
  medianTime: number;
  failurePoints: Record<string, number>;  // nodeId -> failure count
  heatmap: {
    position: { x: number; y: number; z: number };
    time: number;
  }[];
}

export interface PlayerBehaviorProfile {
  playerId: string;
  playStyle: {
    explorationRatio: number;      // 0-1, how much time exploring vs direct path
    witnessUsage: number;          // 0-1, how often witness mode is used
    backtrackFrequency: number;    // 0-1, how often player backtracks
    averageDecisionTime: number;   // ms, time spent at decision points
    cooperationScore: number;      // 0-1, effectiveness in coop
  };
  preferredDimension: DimensionType;
  sessionPatterns: {
    averageSessionLength: number;
    peakPlayHours: number[];
    daysActivePerWeek: number;
  };
  progressionSpeed: 'slow' | 'average' | 'fast';
}

export interface FunnelStage {
  stage: string;
  entered: number;
  completed: number;
  dropoffRate: number;
}

// =============================================================================
// ANALYTICS SYSTEM
// =============================================================================

export class AnalyticsSystem {
  private supabase: SupabaseClient | null = null;
  private session: SessionData | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;
  private flushInterval: number | null = null;

  private readonly FLUSH_INTERVAL = 10000;  // 10 seconds
  private readonly BATCH_SIZE = 50;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Start a new analytics session
   */
  startSession(playerId: string): void {
    this.session = {
      sessionId: this.generateId(),
      playerId,
      startTime: Date.now(),
      platform: this.detectPlatform(),
      browserInfo: this.getBrowserInfo(),
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceType: this.detectDeviceType(),
      events: []
    };

    this.track('session', 'start', undefined, undefined, {
      referrer: document.referrer,
      url: window.location.href
    });

    // Start flush interval
    this.flushInterval = window.setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);

    // Track session end on unload
    window.addEventListener('beforeunload', () => this.endSession());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  /**
   * End the current session
   */
  endSession(): void {
    if (!this.session) return;

    this.session.endTime = Date.now();
    const duration = this.session.endTime - this.session.startTime;

    this.track('session', 'end', undefined, duration);
    this.flush();

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.eventQueue = [];
    }
  }

  // ===========================================================================
  // EVENT TRACKING
  // ===========================================================================

  /**
   * Track a generic event
   */
  track(
    category: EventCategory,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled || !this.session) return;

    const event: AnalyticsEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      category,
      action,
      label,
      value,
      metadata
    };

    this.eventQueue.push(event);
    this.session.events.push(event);

    // Auto-flush if queue is large
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Track level start
   */
  trackLevelStart(levelId: string, seed: number): void {
    this.track('level', 'start', levelId, seed, {
      timestamp: Date.now()
    });
  }

  /**
   * Track level completion
   */
  trackLevelComplete(
    levelId: string,
    time: number,
    mastery: number,
    deathCount: number,
    backtrackCount: number
  ): void {
    this.track('level', 'complete', levelId, time, {
      mastery,
      deathCount,
      backtrackCount
    });
  }

  /**
   * Track level failure/abandon
   */
  trackLevelFail(levelId: string, reason: string, lastNodeId?: string): void {
    this.track('level', 'fail', levelId, undefined, {
      reason,
      lastNodeId
    });
  }

  /**
   * Track puzzle interaction
   */
  trackPuzzleInteraction(
    levelId: string,
    interactionType: string,
    nodeId: string,
    success: boolean
  ): void {
    this.track('puzzle', interactionType, levelId, success ? 1 : 0, {
      nodeId
    });
  }

  /**
   * Track dimension shift
   */
  trackDimensionShift(from: DimensionType, to: DimensionType): void {
    this.track('puzzle', 'dimension_shift', `${from}->${to}`);
  }

  /**
   * Track witness mode
   */
  trackWitnessMode(started: boolean, duration?: number): void {
    this.track('puzzle', started ? 'witness_start' : 'witness_end', undefined, duration);
  }

  /**
   * Track focus/attention
   */
  trackFocus(targetType: string, targetId: string, duration: number): void {
    this.track('puzzle', 'focus', targetType, duration, { targetId });
  }

  /**
   * Track multiplayer events
   */
  trackMultiplayer(action: string, partySize?: number): void {
    this.track('social', action, undefined, partySize);
  }

  /**
   * Track spectator events
   */
  trackSpectator(action: string, viewerCount?: number): void {
    this.track('social', `spectator_${action}`, undefined, viewerCount);
  }

  /**
   * Track UI interaction
   */
  trackUI(element: string, action: string): void {
    this.track('ui', action, element);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(fps: number, frameTime: number, memoryUsage?: number): void {
    this.track('performance', 'metrics', undefined, fps, {
      frameTime,
      memoryUsage
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: string): void {
    this.track('error', 'exception', context, undefined, {
      message: error.message,
      stack: error.stack?.slice(0, 500)
    });
  }

  /**
   * Track position heatmap data
   */
  trackPosition(levelId: string, x: number, y: number, z: number): void {
    // Throttle position tracking
    const now = Date.now();
    const lastTrack = (this as any)._lastPositionTrack || 0;
    if (now - lastTrack < 500) return;
    (this as any)._lastPositionTrack = now;

    this.track('level', 'position', levelId, undefined, {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      z: Math.round(z * 100) / 100
    });
  }

  // ===========================================================================
  // DATA SUBMISSION
  // ===========================================================================

  /**
   * Flush event queue to server
   */
  async flush(): Promise<void> {
    if (!this.supabase || this.eventQueue.length === 0 || !this.session) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Use Beacon API for reliability on page unload
      if (document.visibilityState === 'hidden') {
        const blob = new Blob([JSON.stringify({
          sessionId: this.session.sessionId,
          playerId: this.session.playerId,
          events
        })], { type: 'application/json' });

        navigator.sendBeacon('/api/analytics', blob);
        return;
      }

      // Normal fetch for active sessions
      const { error } = await this.supabase
        .from('analytics_events')
        .insert(events.map(e => ({
          session_id: this.session!.sessionId,
          player_id: this.session!.playerId,
          category: e.category,
          action: e.action,
          label: e.label,
          value: e.value,
          metadata: e.metadata,
          timestamp: new Date(e.timestamp).toISOString()
        })));

      if (error) {
        // Re-queue on failure
        this.eventQueue = [...events, ...this.eventQueue];
        console.error('Analytics flush failed:', error);
      }
    } catch (error) {
      // Re-queue on error
      this.eventQueue = [...events, ...this.eventQueue];
      console.error('Analytics flush error:', error);
    }
  }

  // ===========================================================================
  // AGGREGATION QUERIES (for dashboards)
  // ===========================================================================

  /**
   * Get level analytics
   */
  async getLevelAnalytics(levelId: string): Promise<LevelAnalytics | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .rpc('get_level_analytics', { level_id: levelId });

      if (error) throw error;
      return data as LevelAnalytics;
    } catch (error) {
      console.error('Failed to fetch level analytics:', error);
      return null;
    }
  }

  /**
   * Get player behavior profile
   */
  async getPlayerProfile(playerId: string): Promise<PlayerBehaviorProfile | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .rpc('get_player_behavior_profile', { player_id: playerId });

      if (error) throw error;
      return data as PlayerBehaviorProfile;
    } catch (error) {
      console.error('Failed to fetch player profile:', error);
      return null;
    }
  }

  /**
   * Get funnel analysis
   */
  async getFunnelAnalysis(): Promise<FunnelStage[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .rpc('get_funnel_analysis');

      if (error) throw error;
      return data as FunnelStage[];
    } catch (error) {
      console.error('Failed to fetch funnel analysis:', error);
      return [];
    }
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private detectPlatform(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('electron')) return 'electron';
    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    if (ua.includes('windows')) return 'windows';
    if (ua.includes('mac')) return 'macos';
    if (ua.includes('linux')) return 'linux';
    return 'unknown';
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
    return 'desktop';
  }

  /**
   * Get current session info
   */
  getSessionInfo(): Partial<SessionData> | null {
    if (!this.session) return null;

    return {
      sessionId: this.session.sessionId,
      startTime: this.session.startTime,
      platform: this.session.platform,
      deviceType: this.session.deviceType
    };
  }

  /**
   * Get event count for current session
   */
  getEventCount(): number {
    return this.session?.events.length || 0;
  }
}

// =============================================================================
// A/B TESTING
// =============================================================================

export class ABTesting {
  private experiments: Map<string, {
    variants: string[];
    weights: number[];
    assignment: string;
  }> = new Map();

  private supabase: SupabaseClient | null = null;
  private playerId: string = '';

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Set player ID for consistent assignments
   */
  setPlayerId(playerId: string): void {
    this.playerId = playerId;
  }

  /**
   * Get variant for an experiment
   */
  getVariant(experimentId: string, variants: string[], weights?: number[]): string {
    // Check if already assigned
    const existing = this.experiments.get(experimentId);
    if (existing) return existing.assignment;

    // Assign based on player ID hash for consistency
    const hash = this.hashString(this.playerId + experimentId);
    const normalizedWeights = weights || variants.map(() => 1 / variants.length);

    let cumulative = 0;
    const roll = hash % 100 / 100;

    let assignment = variants[0];
    for (let i = 0; i < variants.length; i++) {
      cumulative += normalizedWeights[i];
      if (roll < cumulative) {
        assignment = variants[i];
        break;
      }
    }

    this.experiments.set(experimentId, {
      variants,
      weights: normalizedWeights,
      assignment
    });

    // Track assignment
    this.trackAssignment(experimentId, assignment);

    return assignment;
  }

  /**
   * Track experiment conversion
   */
  async trackConversion(experimentId: string, conversionType: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !this.supabase) return;

    await this.supabase.from('ab_conversions').insert({
      experiment_id: experimentId,
      player_id: this.playerId,
      variant: experiment.assignment,
      conversion_type: conversionType,
      timestamp: new Date().toISOString()
    });
  }

  private async trackAssignment(experimentId: string, variant: string): Promise<void> {
    if (!this.supabase) return;

    await this.supabase.from('ab_assignments').upsert({
      experiment_id: experimentId,
      player_id: this.playerId,
      variant,
      assigned_at: new Date().toISOString()
    }, {
      onConflict: 'experiment_id,player_id'
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

export const analytics = new AnalyticsSystem(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const abTesting = new ABTesting(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
