/**
 * VEILANALYTICS - UNIFIED ANALYTICS ENGINE
 *
 * Core analytics service integrating all VeilPath analytics subsystems:
 * - PostHog event tracking (simpleTracker)
 * - UX-SDPM archetype classification (archetypes)
 * - Casimir friction analysis (CasimirFrictionAnalyzer)
 * - Ad engagement tracking (AdEngagement)
 * - Anonymized data export for monetization
 *
 * Patents Utilized:
 * - PSAN Tri-Fork Synthesis (#63/925,504): Multi-domain integration
 * - Kuramoto Flow Detection (#63/925,467): SDPM behavioral vectors
 * - Casimir Failure-as-Signal (#544): Friction complexity analysis
 *
 * Scale Strategy:
 * - 0-1K users: PostHog free tier, local aggregation
 * - 1K-10K: PostHog growth, add Segment passthrough
 * - 10K+: Data monetization via anonymized engagement export
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { track, identify, trackScreen } from './simpleTracker';
import { computeUserArchetype, classifyArchetype, computeArchetypeVector } from './archetypes';
import { getCasimirAnalyzer, logFrictionEvent, FRICTION_TYPES, FRICTION_CONTEXTS } from './CasimirFrictionAnalyzer';
import { trackFriction, startSession, recordInteraction, getSessionDuration } from './friction';

const STORAGE_KEY = '@veilpath_analytics_state';
const AD_STORAGE_KEY = '@veilpath_ad_engagement';

// ═══════════════════════════════════════════════════════════════════════════
// AD ENGAGEMENT TYPES & CONFIG
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ad types supported in VeilPath
 */
export const AD_TYPES = {
  HOUSE_VIDEO: 'house_video',       // Our grok-generated videos with witty text
  HOUSE_STATIC: 'house_static',     // Our static promotional images
  PARTNER_NATIVE: 'partner_native', // Native partner ads (future)
  NETWORK_BANNER: 'network_banner', // Ad network banners (future)
  NETWORK_REWARD: 'network_reward', // Rewarded video ads (future)
};

/**
 * Ad placements in the app
 */
export const AD_PLACEMENTS = {
  POST_READING: 'post_reading',           // After completing a reading
  JOURNAL_PROMPT: 'journal_prompt',       // During journal prompts
  VERA_COOLDOWN: 'vera_cooldown',         // While waiting for Vera
  ACHIEVEMENT_UNLOCK: 'achievement_unlock', // After unlocking achievement
  DAILY_BONUS: 'daily_bonus',             // Daily login bonus screen
  PREMIUM_UPSELL: 'premium_upsell',       // Premium feature gates
  CARD_COLLECTION: 'card_collection',     // Card collection gallery
};

/**
 * Ad engagement levels
 */
export const ENGAGEMENT_LEVELS = {
  IMPRESSION: 'impression',     // Ad was shown
  VIEW_25: 'view_25',          // 25% of video watched
  VIEW_50: 'view_50',          // 50% of video watched
  VIEW_75: 'view_75',          // 75% of video watched
  VIEW_100: 'view_100',        // 100% of video watched
  CLICK: 'click',              // Ad was clicked
  CONVERSION: 'conversion',    // User took target action
  DISMISS: 'dismiss',          // Ad was dismissed early
  SKIP: 'skip',                // Ad was skipped (if allowed)
};

// ═══════════════════════════════════════════════════════════════════════════
// VEILANALYTICS CLASS
// ═══════════════════════════════════════════════════════════════════════════

class VeilAnalytics {
  constructor() {
    this.initialized = false;
    this.userId = null;
    this.sessionId = null;
    this.sessionStart = null;
    this.archetype = null;
    this.frictionAnalyzer = null;

    // Ad engagement state
    this.adEngagementLog = [];
    this.adSessionStats = {
      impressions: 0,
      clicks: 0,
      completions: 0,
      revenue: 0, // Estimated in cents
    };

    // User behavior aggregates (for archetype calculation)
    this.userMetrics = {
      totalSessions: 0,
      sessionConsistency: 0,
      journalEntriesCreated: 0,
      readingsStarted: 0,
      readingsCompleted: 0,
      shareCount: 0,
      referralsSent: 0,
      feedbackGiven: 0,
      analyticsViews: 0,
      featuresUsed: 0,
    };

    // Interaction tracking
    this.interactions = [];
    this.screenHistory = [];
    this.dwellTimes = {};

    // Data export queue (for monetization)
    this.exportQueue = [];
    this.lastExport = null;
  }

  /**
   * Initialize VeilAnalytics - call once on app start
   */
  async initialize(userId = null) {
    if (this.initialized) return this;

    try {
      // Load persisted state
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.userMetrics = { ...this.userMetrics, ...data.userMetrics };
        this.archetype = data.archetype;
        this.lastExport = data.lastExport;
      }

      // Load ad engagement history
      const adData = await AsyncStorage.getItem(AD_STORAGE_KEY);
      if (adData) {
        const parsed = JSON.parse(adData);
        this.adEngagementLog = parsed.adEngagementLog || [];
      }

      // Initialize Casimir
      this.frictionAnalyzer = getCasimirAnalyzer();
      await this.frictionAnalyzer.initialize();

      // Set user ID
      if (userId) {
        this.userId = userId;
        identify(userId, { archetype: this.archetype?.archetype });
      }

      // Start session
      this.startNewSession();

      this.initialized = true;
      console.log('[VeilAnalytics] Initialized');
      return this;
    } catch (error) {
      console.error('[VeilAnalytics] Init error:', error);
      this.initialized = true;
      return this;
    }
  }

  /**
   * Start a new session
   */
  startNewSession() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStart = Date.now();
    this.userMetrics.totalSessions++;
    this.screenHistory = [];
    this.dwellTimes = {};
    this.adSessionStats = {
      impressions: 0,
      clicks: 0,
      completions: 0,
      revenue: 0,
    };

    startSession();
    track('session_start', {
      session_id: this.sessionId,
      archetype: this.archetype?.archetype,
    });

    this.persist();
  }

  /**
   * End current session
   */
  async endSession() {
    const duration = Date.now() - this.sessionStart;

    track('session_end', {
      session_id: this.sessionId,
      duration_seconds: Math.round(duration / 1000),
      screens_visited: this.screenHistory.length,
      ad_impressions: this.adSessionStats.impressions,
      ad_clicks: this.adSessionStats.clicks,
      ad_completions: this.adSessionStats.completions,
      archetype: this.archetype?.archetype,
    });

    // Recalculate archetype
    await this.recalculateArchetype();

    // Queue export data if threshold met
    this.queueExportData();

    await this.persist();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CORE TRACKING METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Track screen view with dwell time calculation
   */
  trackScreenView(screenName, metadata = {}) {
    const now = Date.now();

    // Calculate dwell time for previous screen
    const lastScreen = this.screenHistory[this.screenHistory.length - 1];
    if (lastScreen) {
      const dwellTime = now - lastScreen.timestamp;
      this.dwellTimes[lastScreen.screen] = (this.dwellTimes[lastScreen.screen] || 0) + dwellTime;

      // Check for rapid navigation (friction signal)
      if (dwellTime < 2000) {
        logFrictionEvent(FRICTION_TYPES.RAPID_EXIT, lastScreen.screen, {
          timeOnScreen: dwellTime,
        });
      }
    }

    // Record this screen
    this.screenHistory.push({
      screen: screenName,
      timestamp: now,
      metadata,
    });

    trackScreen(screenName, {
      ...metadata,
      session_id: this.sessionId,
      screens_visited: this.screenHistory.length,
      archetype: this.archetype?.archetype,
    });

    recordInteraction();
  }

  /**
   * Track generic event with enrichment
   */
  trackEvent(eventName, properties = {}) {
    const enriched = {
      ...properties,
      session_id: this.sessionId,
      session_duration_seconds: getSessionDuration(),
      archetype: this.archetype?.archetype,
      friction_level: this.frictionAnalyzer?.getFrictionContext() || 'unknown',
    };

    track(eventName, enriched);
    recordInteraction();

    // Add to interactions log for analysis
    this.interactions.push({
      event: eventName,
      timestamp: Date.now(),
      properties: enriched,
    });
  }

  /**
   * Track user interaction (button press, tap, etc.)
   */
  trackInteraction(interactionType, context, metadata = {}) {
    this.trackEvent('user_interaction', {
      interaction_type: interactionType,
      context,
      ...metadata,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AD ENGAGEMENT TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Track ad impression
   * @param {string} adId - Unique ad identifier
   * @param {string} adType - Type from AD_TYPES
   * @param {string} placement - Placement from AD_PLACEMENTS
   * @param {object} adMeta - Additional ad metadata
   */
  trackAdImpression(adId, adType, placement, adMeta = {}) {
    const event = {
      adId,
      adType,
      placement,
      level: ENGAGEMENT_LEVELS.IMPRESSION,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      archetype: this.archetype?.archetype,
      meta: adMeta,
    };

    this.adEngagementLog.push(event);
    this.adSessionStats.impressions++;

    this.trackEvent('ad_impression', {
      ad_id: adId,
      ad_type: adType,
      placement,
      is_house_ad: adType.startsWith('house_'),
    });

    this.persistAdEngagement();
  }

  /**
   * Track video ad progress
   * @param {string} adId - Unique ad identifier
   * @param {number} percentWatched - 0-100
   */
  trackAdVideoProgress(adId, percentWatched) {
    let level = null;
    if (percentWatched >= 100) level = ENGAGEMENT_LEVELS.VIEW_100;
    else if (percentWatched >= 75) level = ENGAGEMENT_LEVELS.VIEW_75;
    else if (percentWatched >= 50) level = ENGAGEMENT_LEVELS.VIEW_50;
    else if (percentWatched >= 25) level = ENGAGEMENT_LEVELS.VIEW_25;

    if (!level) return;

    // Find the impression event for this ad
    const impression = this.adEngagementLog.find(
      e => e.adId === adId && e.level === ENGAGEMENT_LEVELS.IMPRESSION
    );

    if (impression) {
      // Add progress event
      this.adEngagementLog.push({
        ...impression,
        level,
        timestamp: Date.now(),
        watchDuration: Date.now() - impression.timestamp,
      });

      if (level === ENGAGEMENT_LEVELS.VIEW_100) {
        this.adSessionStats.completions++;
      }

      this.trackEvent('ad_video_progress', {
        ad_id: adId,
        percent_watched: percentWatched,
        engagement_level: level,
        is_completion: level === ENGAGEMENT_LEVELS.VIEW_100,
      });
    }

    this.persistAdEngagement();
  }

  /**
   * Track ad click
   * @param {string} adId - Unique ad identifier
   * @param {string} clickTarget - What was clicked (cta, image, etc.)
   */
  trackAdClick(adId, clickTarget = 'cta') {
    const impression = this.adEngagementLog.find(
      e => e.adId === adId && e.level === ENGAGEMENT_LEVELS.IMPRESSION
    );

    if (impression) {
      this.adEngagementLog.push({
        ...impression,
        level: ENGAGEMENT_LEVELS.CLICK,
        timestamp: Date.now(),
        clickTarget,
        timeToClick: Date.now() - impression.timestamp,
      });

      this.adSessionStats.clicks++;

      this.trackEvent('ad_click', {
        ad_id: adId,
        ad_type: impression.adType,
        placement: impression.placement,
        click_target: clickTarget,
        time_to_click_ms: Date.now() - impression.timestamp,
      });
    }

    this.persistAdEngagement();
  }

  /**
   * Track ad conversion (user took desired action)
   * @param {string} adId - Unique ad identifier
   * @param {string} conversionType - Type of conversion
   * @param {number} value - Conversion value in cents (if applicable)
   */
  trackAdConversion(adId, conversionType, value = 0) {
    const impression = this.adEngagementLog.find(
      e => e.adId === adId && e.level === ENGAGEMENT_LEVELS.IMPRESSION
    );

    if (impression) {
      this.adEngagementLog.push({
        ...impression,
        level: ENGAGEMENT_LEVELS.CONVERSION,
        timestamp: Date.now(),
        conversionType,
        value,
      });

      this.adSessionStats.revenue += value;

      this.trackEvent('ad_conversion', {
        ad_id: adId,
        ad_type: impression.adType,
        placement: impression.placement,
        conversion_type: conversionType,
        value_cents: value,
      });
    }

    this.persistAdEngagement();
  }

  /**
   * Track ad dismiss/skip
   * @param {string} adId - Unique ad identifier
   * @param {string} reason - Why dismissed (skip, close, etc.)
   * @param {number} percentWatched - How much was watched before dismiss
   */
  trackAdDismiss(adId, reason = 'close', percentWatched = 0) {
    const impression = this.adEngagementLog.find(
      e => e.adId === adId && e.level === ENGAGEMENT_LEVELS.IMPRESSION
    );

    if (impression) {
      this.adEngagementLog.push({
        ...impression,
        level: reason === 'skip' ? ENGAGEMENT_LEVELS.SKIP : ENGAGEMENT_LEVELS.DISMISS,
        timestamp: Date.now(),
        reason,
        percentWatched,
        timeOnAd: Date.now() - impression.timestamp,
      });

      // Track as friction if dismissed very early
      if (percentWatched < 25) {
        trackFriction('ad_skip_early', impression.placement, {
          ad_id: adId,
          percent_watched: percentWatched,
        });
      }

      this.trackEvent('ad_dismiss', {
        ad_id: adId,
        ad_type: impression.adType,
        placement: impression.placement,
        reason,
        percent_watched: percentWatched,
      });
    }

    this.persistAdEngagement();
  }

  /**
   * Get ad engagement stats for current session
   */
  getAdSessionStats() {
    return { ...this.adSessionStats };
  }

  /**
   * Get ad engagement summary for export/monetization
   */
  getAdEngagementSummary() {
    const now = Date.now();
    const last24h = this.adEngagementLog.filter(e => now - e.timestamp < 86400000);
    const last7d = this.adEngagementLog.filter(e => now - e.timestamp < 604800000);

    // Calculate metrics
    const calcMetrics = (events) => {
      const impressions = events.filter(e => e.level === ENGAGEMENT_LEVELS.IMPRESSION).length;
      const clicks = events.filter(e => e.level === ENGAGEMENT_LEVELS.CLICK).length;
      const completions = events.filter(e => e.level === ENGAGEMENT_LEVELS.VIEW_100).length;
      const conversions = events.filter(e => e.level === ENGAGEMENT_LEVELS.CONVERSION).length;
      const dismissals = events.filter(
        e => e.level === ENGAGEMENT_LEVELS.DISMISS || e.level === ENGAGEMENT_LEVELS.SKIP
      ).length;

      return {
        impressions,
        clicks,
        completions,
        conversions,
        dismissals,
        ctr: impressions > 0 ? (clicks / impressions * 100).toFixed(2) : 0,
        completionRate: impressions > 0 ? (completions / impressions * 100).toFixed(2) : 0,
        conversionRate: clicks > 0 ? (conversions / clicks * 100).toFixed(2) : 0,
      };
    };

    // Break down by placement
    const byPlacement = {};
    for (const placement of Object.values(AD_PLACEMENTS)) {
      const placementEvents = this.adEngagementLog.filter(e => e.placement === placement);
      if (placementEvents.length > 0) {
        byPlacement[placement] = calcMetrics(placementEvents);
      }
    }

    // Break down by ad type
    const byType = {};
    for (const adType of Object.values(AD_TYPES)) {
      const typeEvents = this.adEngagementLog.filter(e => e.adType === adType);
      if (typeEvents.length > 0) {
        byType[adType] = calcMetrics(typeEvents);
      }
    }

    // Break down by archetype (for targeting insights)
    const byArchetype = {};
    const archetypes = ['power_user', 'social_butterfly', 'at_risk', 'casual_user'];
    for (const arch of archetypes) {
      const archEvents = this.adEngagementLog.filter(e => e.archetype === arch);
      if (archEvents.length > 0) {
        byArchetype[arch] = calcMetrics(archEvents);
      }
    }

    return {
      totals: calcMetrics(this.adEngagementLog),
      last24h: calcMetrics(last24h),
      last7d: calcMetrics(last7d),
      byPlacement,
      byType,
      byArchetype,
      totalEvents: this.adEngagementLog.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ARCHETYPE & BEHAVIORAL ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Recalculate user archetype based on accumulated metrics
   */
  async recalculateArchetype() {
    const vector = computeArchetypeVector(this.userMetrics);
    const archetype = classifyArchetype(vector);

    this.archetype = {
      vector,
      archetype,
      lastUpdated: Date.now(),
    };

    // Update PostHog identity with archetype
    if (this.userId) {
      identify(this.userId, {
        archetype,
        archetype_vector: vector,
      });
    }

    this.trackEvent('archetype_updated', {
      new_archetype: archetype,
      vector,
    });

    await this.persist();
    return this.archetype;
  }

  /**
   * Get current archetype
   */
  getArchetype() {
    return this.archetype;
  }

  /**
   * Update user metrics for archetype calculation
   */
  updateMetrics(metricUpdates) {
    this.userMetrics = {
      ...this.userMetrics,
      ...metricUpdates,
    };
    this.persist();
  }

  /**
   * Increment a specific metric
   */
  incrementMetric(metricName, amount = 1) {
    if (this.userMetrics.hasOwnProperty(metricName)) {
      this.userMetrics[metricName] += amount;
      this.persist();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FRICTION TRACKING INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Log friction event through Casimir
   */
  async logFriction(type, context, sessionData = {}) {
    const result = await this.frictionAnalyzer.logFriction({
      type,
      context,
      sessionData: {
        ...sessionData,
        archetype: this.archetype?.archetype,
      },
    });

    // Also track via PostHog
    trackFriction(type, context, {
      ...sessionData,
      complexity: result.complexityScore,
    });

    return result;
  }

  /**
   * Get friction context string for Vera/SDPM
   */
  getFrictionContext() {
    return this.frictionAnalyzer?.getFrictionContext() || '';
  }

  /**
   * Get SDPM adaptation suggestions based on friction
   */
  getSDPMAdaptation() {
    return this.frictionAnalyzer?.getSDPMAdaptation() || null;
  }

  /**
   * Register callback for friction-triggered adaptations
   */
  onFrictionAdaptation(callback) {
    if (this.frictionAnalyzer) {
      this.frictionAnalyzer.onAdaptation(callback);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DATA EXPORT & MONETIZATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Queue anonymized data for export
   * Called periodically to batch data for monetization
   */
  queueExportData() {
    // Only queue if we have enough data
    if (this.adEngagementLog.length < 10) return;

    const exportRecord = {
      timestamp: Date.now(),
      // Anonymized user segment (not individual ID)
      segment: this.archetype?.archetype || 'unknown',
      // Aggregated ad engagement
      adEngagement: this.getAdEngagementSummary(),
      // Behavioral patterns (anonymized)
      behaviorPatterns: {
        avgSessionDuration: this.calculateAvgSessionDuration(),
        screenPreferences: this.getTopScreens(5),
        engagementLevel: this.calculateEngagementLevel(),
        frictionProfile: this.frictionAnalyzer?.getAnalyticsSummary() || {},
      },
      // Device/context info (non-PII)
      context: {
        platform: 'react-native',
        appVersion: '1.0.0', // Get from config
      },
    };

    this.exportQueue.push(exportRecord);

    // Trim queue to last 100 records
    if (this.exportQueue.length > 100) {
      this.exportQueue = this.exportQueue.slice(-100);
    }
  }

  /**
   * Get exportable anonymized data package
   * For sale to ad networks/data brokers (10K+ users)
   */
  getAnonymizedDataExport() {
    return {
      exportTimestamp: Date.now(),
      dataVersion: '1.0',
      totalRecords: this.exportQueue.length,
      records: this.exportQueue.map(record => ({
        ...record,
        // Double-check no PII leaks
        userId: undefined,
        sessionId: undefined,
      })),
      aggregates: {
        archetypeDistribution: this.calculateArchetypeDistribution(),
        adPerformance: this.getAdEngagementSummary(),
        engagementTrends: this.calculateEngagementTrends(),
      },
    };
  }

  /**
   * Calculate average session duration
   */
  calculateAvgSessionDuration() {
    const sessionDurations = this.interactions
      .filter(i => i.event === 'session_end')
      .map(i => i.properties?.duration_seconds || 0);

    if (sessionDurations.length === 0) return 0;
    return Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length);
  }

  /**
   * Get top visited screens
   */
  getTopScreens(limit = 5) {
    const screenCounts = {};
    this.screenHistory.forEach(s => {
      screenCounts[s.screen] = (screenCounts[s.screen] || 0) + 1;
    });

    return Object.entries(screenCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([screen, count]) => ({ screen, count }));
  }

  /**
   * Calculate overall engagement level (0-1)
   */
  calculateEngagementLevel() {
    const factors = [
      this.userMetrics.sessionConsistency,
      Math.min(1, this.userMetrics.readingsCompleted / Math.max(1, this.userMetrics.readingsStarted)),
      Math.min(1, this.userMetrics.journalEntriesCreated / 10),
      Math.min(1, this.userMetrics.featuresUsed / 15),
    ];

    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  /**
   * Calculate archetype distribution (for data export)
   */
  calculateArchetypeDistribution() {
    // This would normally aggregate across all users
    // For single user, just return current archetype
    return {
      [this.archetype?.archetype || 'unknown']: 1,
    };
  }

  /**
   * Calculate engagement trends over time
   */
  calculateEngagementTrends() {
    const now = Date.now();
    const dayMs = 86400000;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = now - (i + 1) * dayMs;
      const dayEnd = now - i * dayMs;

      const dayEvents = this.interactions.filter(
        e => e.timestamp >= dayStart && e.timestamp < dayEnd
      );

      last7Days.push({
        day: new Date(dayStart).toISOString().split('T')[0],
        events: dayEvents.length,
        sessions: dayEvents.filter(e => e.event === 'session_start').length,
        adImpressions: dayEvents.filter(e => e.event === 'ad_impression').length,
      });
    }

    return last7Days;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONVENIENCE TRACKING METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Track reading started
   */
  trackReadingStarted(spreadType, intention = '') {
    this.userMetrics.readingsStarted++;
    this.trackEvent('reading_started', {
      spread_type: spreadType,
      has_intention: intention.length > 0,
      intention_length: intention.length,
    });
  }

  /**
   * Track reading completed
   */
  trackReadingCompleted(spreadType, cardCount, durationMs) {
    this.userMetrics.readingsCompleted++;
    this.trackEvent('reading_completed', {
      spread_type: spreadType,
      card_count: cardCount,
      duration_seconds: Math.round(durationMs / 1000),
    });
    this.persist();
  }

  /**
   * Track reading abandoned
   */
  trackReadingAbandoned(spreadType, cardsRevealed, durationMs) {
    this.trackEvent('reading_abandoned', {
      spread_type: spreadType,
      cards_revealed: cardsRevealed,
      duration_seconds: Math.round(durationMs / 1000),
    });

    this.logFriction(FRICTION_TYPES.ABANDON, FRICTION_CONTEXTS.READING, {
      readingType: spreadType,
      timeOnScreen: durationMs,
    });
  }

  /**
   * Track journal entry created
   */
  trackJournalCreated(wordCount, hasMood, hasPrompt) {
    this.userMetrics.journalEntriesCreated++;
    this.trackEvent('journal_entry_created', {
      word_count: wordCount,
      has_mood: hasMood,
      has_prompt: hasPrompt,
    });
    this.persist();
  }

  /**
   * Track journal abandoned
   */
  trackJournalAbandoned(wordCount, durationMs) {
    this.trackEvent('journal_entry_abandoned', {
      word_count: wordCount,
      duration_seconds: Math.round(durationMs / 1000),
    });

    this.logFriction(FRICTION_TYPES.ABANDON, FRICTION_CONTEXTS.JOURNALING, {
      draftContent: { length: wordCount },
      timeOnScreen: durationMs,
    });
  }

  /**
   * Track Vera message
   */
  trackVeraMessage(messageLength, personality) {
    this.trackEvent('vera_message_sent', {
      message_length: messageLength,
      personality,
    });
  }

  /**
   * Track share action
   */
  trackShare(contentType, destination) {
    this.userMetrics.shareCount++;
    this.trackEvent('content_shared', {
      content_type: contentType,
      destination,
    });
    this.persist();
  }

  /**
   * Track feature usage
   */
  trackFeatureUsed(featureName) {
    this.userMetrics.featuresUsed++;
    this.trackEvent('feature_used', {
      feature_name: featureName,
    });
    this.persist();
  }

  /**
   * Track subscription event
   */
  trackSubscription(action, tier, metadata = {}) {
    this.trackEvent(`subscription_${action}`, {
      tier,
      ...metadata,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Persist analytics state to storage
   */
  async persist() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        userMetrics: this.userMetrics,
        archetype: this.archetype,
        lastExport: this.lastExport,
      }));
    } catch (error) {
      console.error('[VeilAnalytics] Persist error:', error);
    }
  }

  /**
   * Persist ad engagement data
   */
  async persistAdEngagement() {
    try {
      // Only keep last 1000 ad events
      const trimmedLog = this.adEngagementLog.slice(-1000);
      await AsyncStorage.setItem(AD_STORAGE_KEY, JSON.stringify({
        adEngagementLog: trimmedLog,
      }));
    } catch (error) {
      console.error('[VeilAnalytics] Ad persist error:', error);
    }
  }

  /**
   * Get full analytics summary
   */
  getAnalyticsSummary() {
    return {
      session: {
        id: this.sessionId,
        duration: getSessionDuration(),
        screensVisited: this.screenHistory.length,
        interactions: this.interactions.length,
      },
      user: {
        id: this.userId,
        archetype: this.archetype,
        metrics: this.userMetrics,
        engagementLevel: this.calculateEngagementLevel(),
      },
      ads: this.getAdEngagementSummary(),
      friction: this.frictionAnalyzer?.getAnalyticsSummary() || {},
    };
  }

  /**
   * Reset all analytics (for testing/logout)
   */
  async reset() {
    this.userMetrics = {
      totalSessions: 0,
      sessionConsistency: 0,
      journalEntriesCreated: 0,
      readingsStarted: 0,
      readingsCompleted: 0,
      shareCount: 0,
      referralsSent: 0,
      feedbackGiven: 0,
      analyticsViews: 0,
      featuresUsed: 0,
    };
    this.archetype = null;
    this.adEngagementLog = [];
    this.exportQueue = [];
    this.interactions = [];
    this.screenHistory = [];

    await AsyncStorage.multiRemove([STORAGE_KEY, AD_STORAGE_KEY]);

    if (this.frictionAnalyzer) {
      await this.frictionAnalyzer.clearLog();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

let instance = null;

/**
 * Get VeilAnalytics singleton instance
 */
export function getVeilAnalytics() {
  if (!instance) {
    instance = new VeilAnalytics();
  }
  return instance;
}

/**
 * Initialize VeilAnalytics (convenience function)
 */
export async function initVeilAnalytics(userId = null) {
  const analytics = getVeilAnalytics();
  await analytics.initialize(userId);
  return analytics;
}

// Re-export types
export { FRICTION_TYPES, FRICTION_CONTEXTS };

export default VeilAnalytics;
