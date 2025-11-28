/**
 * Insights Pipeline - Unified Data Integration Layer
 * ===================================================
 *
 * Shared memory space for LLM outputs, 3D semantic data, and pattern analysis.
 * Enables efficient broadcasting between components and optimized caching.
 *
 * Architecture:
 * - Singleton pattern for global access
 * - Event-based pub/sub for cross-component communication
 * - Tiered caching (memory -> AsyncStorage)
 * - Semantic awareness from geometricSemanticSpace
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CARD_EMBEDDINGS, getSemanticDistance, findNearestCards, extractThemes, extractGeometricThemes } from './temporaryUtilStubs';
import { CARD_DATABASE } from '../data/cardDatabase';

// Storage keys
const CACHE_KEYS = {
  PATTERN_CACHE: '@insights_pattern_cache',
  WEEKLY_CACHE: '@insights_weekly_cache',
  SEMANTIC_CACHE: '@insights_semantic_cache',
  LLM_OUTPUTS: '@insights_llm_outputs',
};

// Cache TTL (time-to-live) in milliseconds
const CACHE_TTL = {
  PATTERN: 30 * 60 * 1000,      // 30 minutes
  WEEKLY: 60 * 60 * 1000,       // 1 hour
  SEMANTIC: 5 * 60 * 1000,      // 5 minutes
  LLM_OUTPUT: 10 * 60 * 1000,   // 10 minutes
};

class InsightsPipeline {
  constructor() {
    // In-memory cache for fast access
    this.memoryCache = new Map();

    // Event listeners for broadcasting
    this.listeners = new Map();

    // Current context (shared between LLM and 3D)
    this.context = {
      recentCards: [],          // Last N cards drawn
      activeThemes: [],         // Current semantic themes
      patternSignals: [],       // Detected patterns
      userProfile: null,        // MBTI, zodiac, etc.
      readingHistory: [],       // Recent readings
      semanticClusters: [],     // Cards grouped by meaning
    };

    // Performance metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      llmCalls: 0,
      broadcastCount: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PUB/SUB SYSTEM
  // ═══════════════════════════════════════════════════════════

  /**
   * Subscribe to context updates
   * @param {string} event - Event name (e.g., 'patterns', 'themes', 'llm_output')
   * @param {function} callback - Handler function
   * @returns {function} Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Broadcast update to all subscribers
   * @param {string} event - Event name
   * @param {any} data - Data to broadcast
   */
  broadcast(event, data) {
    this.metrics.broadcastCount++;
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Pipeline] Broadcast error for ${event}:`, error);
        }
      });
    }

    // Also broadcast to wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(callback => {
        try {
          callback({ event, data });
        } catch (error) {
          console.error(`[Pipeline] Wildcard broadcast error:`, error);
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CONTEXT MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Update user profile context
   */
  setUserProfile(profile) {
    this.context.userProfile = profile;
    this.broadcast('profile_update', profile);
  }

  /**
   * Add cards to recent history and update semantic analysis
   */
  addCards(cards) {
    // Add to recent cards (keep last 30)
    this.context.recentCards = [
      ...cards,
      ...this.context.recentCards.slice(0, 30 - cards.length)
    ];

    // Update semantic analysis
    this.updateSemanticAnalysis(cards);

    this.broadcast('cards_added', cards);
  }

  /**
   * Add reading to history
   */
  addReading(reading) {
    this.context.readingHistory = [
      reading,
      ...this.context.readingHistory.slice(0, 49) // Keep last 50
    ];
    this.broadcast('reading_added', reading);
  }

  /**
   * Get current unified context for LLM prompts
   */
  getUnifiedContext() {
    return {
      ...this.context,
      metrics: this.metrics,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SEMANTIC ANALYSIS (3D Space Integration)
  // ═══════════════════════════════════════════════════════════

  /**
   * Analyze cards in semantic space and extract themes
   */
  updateSemanticAnalysis(newCards) {
    if (!newCards || newCards.length === 0) return;

    // Extract card indices
    const cardIndices = newCards.map(c => c.cardIndex).filter(idx => idx !== undefined);

    if (cardIndices.length === 0) return;

    // Get embeddings for these cards
    const embeddings = cardIndices
      .map(idx => CARD_EMBEDDINGS[idx])
      .filter(e => e);

    if (embeddings.length === 0) return;

    // Calculate centroid (average position)
    const centroid = {
      x: embeddings.reduce((sum, e) => sum + e.position[0], 0) / embeddings.length,
      y: embeddings.reduce((sum, e) => sum + e.position[1], 0) / embeddings.length,
      z: embeddings.reduce((sum, e) => sum + e.position[2], 0) / embeddings.length,
    };

    // Extract themes based on positions
    const themes = [];

    // X-axis: Elemental polarity
    if (centroid.x > 0.3) {
      themes.push('Active/Fire energy');
    } else if (centroid.x < -0.3) {
      themes.push('Receptive/Water energy');
    }

    // Y-axis: Consciousness depth
    if (centroid.y > 0.3) {
      themes.push('Light/conscious themes');
    } else if (centroid.y < -0.3) {
      themes.push('Shadow/unconscious themes');
    }

    // Z-axis: Temporal focus
    if (centroid.z > 0.3) {
      themes.push('Future-oriented');
    } else if (centroid.z < -0.3) {
      themes.push('Past-focused');
    }

    // Find semantically related cards
    const relatedCards = [];
    cardIndices.forEach(idx => {
      const nearest = findNearestCards(idx, 3);
      nearest.forEach(n => {
        if (!cardIndices.includes(n.cardIndex) && !relatedCards.find(r => r.cardIndex === n.cardIndex)) {
          relatedCards.push(n);
        }
      });
    });

    // Update context
    this.context.activeThemes = themes;
    this.context.semanticClusters = {
      centroid,
      cards: embeddings,
      relatedCards: relatedCards.slice(0, 5),
    };

    // Broadcast semantic update
    this.broadcast('semantic_update', {
      themes,
      centroid,
      relatedCards,
    });
  }

  /**
   * Get semantic context for a specific card
   */
  getCardSemanticContext(cardIndex) {
    const embedding = CARD_EMBEDDINGS[cardIndex];
    if (!embedding) return null;

    const nearest = findNearestCards(cardIndex, 5);
    const position = embedding.position;

    return {
      cardName: embedding.name,
      position: {
        elemental: position[0],      // X: Fire/Air + , Water/Earth -
        consciousness: position[1],  // Y: Shadow -, Light +
        temporal: position[2],       // Z: Past -, Future +
      },
      nearestCards: nearest.map(n => ({
        name: CARD_DATABASE[n.cardIndex]?.name,
        distance: n.distance,
      })),
      themes: this.positionToThemes(position),
    };
  }

  /**
   * Convert 3D position to human-readable themes
   */
  positionToThemes(position) {
    const themes = [];

    // X-axis interpretation
    if (position[0] > 0.5) themes.push('highly active/fiery');
    else if (position[0] > 0.2) themes.push('active');
    else if (position[0] < -0.5) themes.push('deeply receptive/watery');
    else if (position[0] < -0.2) themes.push('receptive');

    // Y-axis interpretation
    if (position[1] > 0.5) themes.push('conscious/illuminated');
    else if (position[1] > 0.2) themes.push('awareness-oriented');
    else if (position[1] < -0.5) themes.push('deep shadow work');
    else if (position[1] < -0.2) themes.push('unconscious/shadow');

    // Z-axis interpretation
    if (position[2] > 0.5) themes.push('strongly future-focused');
    else if (position[2] > 0.2) themes.push('forward-looking');
    else if (position[2] < -0.5) themes.push('deeply past-connected');
    else if (position[2] < -0.2) themes.push('past-oriented');

    return themes;
  }

  // ═══════════════════════════════════════════════════════════
  // CACHING SYSTEM
  // ═══════════════════════════════════════════════════════════

  /**
   * Get from cache (memory first, then AsyncStorage)
   */
  async getFromCache(key) {
    // Check memory cache first
    const memCached = this.memoryCache.get(key);
    if (memCached && Date.now() - memCached.timestamp < memCached.ttl) {
      this.metrics.cacheHits++;
      return memCached.data;
    }

    // Check AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < parsed.ttl) {
          // Restore to memory cache
          this.memoryCache.set(key, parsed);
          this.metrics.cacheHits++;
          return parsed.data;
        }
      }
    } catch (error) {
      console.error(`[Pipeline] Cache read error for ${key}:`, error);
    }

    this.metrics.cacheMisses++;
    return null;
  }

  /**
   * Save to cache (both memory and AsyncStorage)
   */
  async saveToCache(key, data, ttl) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Save to memory
    this.memoryCache.set(key, cacheEntry);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error(`[Pipeline] Cache write error for ${key}:`, error);
    }
  }

  /**
   * Invalidate cache entry
   */
  async invalidateCache(key) {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[Pipeline] Cache invalidation error for ${key}:`, error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LLM OUTPUT MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Store LLM output with semantic tagging
   */
  async storeLLMOutput(type, input, output) {
    this.metrics.llmCalls++;

    const entry = {
      type,
      input,
      output,
      timestamp: Date.now(),
      themes: this.context.activeThemes,
      profile: this.context.userProfile?.mbtiType,
    };

    // Add to recent outputs in context
    const outputs = await this.getFromCache(CACHE_KEYS.LLM_OUTPUTS) || [];
    outputs.unshift(entry);
    await this.saveToCache(
      CACHE_KEYS.LLM_OUTPUTS,
      outputs.slice(0, 20), // Keep last 20
      CACHE_TTL.LLM_OUTPUT
    );

    // Broadcast for components that want to react to LLM outputs
    this.broadcast('llm_output', entry);

    return entry;
  }

  /**
   * Get recent LLM outputs for context
   */
  async getRecentLLMOutputs(type = null, limit = 5) {
    const outputs = await this.getFromCache(CACHE_KEYS.LLM_OUTPUTS) || [];
    if (type) {
      return outputs.filter(o => o.type === type).slice(0, limit);
    }
    return outputs.slice(0, limit);
  }

  /**
   * Generate context string for LLM prompts
   * Includes semantic space info and recent patterns
   */
  generateLLMContextString() {
    const parts = [];

    // User context
    if (this.context.userProfile) {
      parts.push(`User: ${this.context.userProfile.mbtiType || 'Unknown MBTI'}, ${this.context.userProfile.zodiacSign || 'Unknown zodiac'}`);
    }

    // Active themes from semantic analysis
    if (this.context.activeThemes.length > 0) {
      parts.push(`Current themes: ${this.context.activeThemes.join(', ')}`);
    }

    // Pattern signals
    if (this.context.patternSignals.length > 0) {
      parts.push(`Patterns: ${this.context.patternSignals.join(', ')}`);
    }

    // Recent card energy
    if (this.context.recentCards.length > 0) {
      const recentNames = this.context.recentCards
        .slice(0, 5)
        .map(c => CARD_DATABASE[c.cardIndex]?.name)
        .filter(n => n);
      if (recentNames.length > 0) {
        parts.push(`Recent cards: ${recentNames.join(', ')}`);
      }
    }

    return parts.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // PATTERN DETECTION
  // ═══════════════════════════════════════════════════════════

  /**
   * Analyze patterns in reading history
   */
  async analyzePatterns(readings) {
    // Check cache first
    const cacheKey = `${CACHE_KEYS.PATTERN_CACHE}_${readings.length}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    const analysis = {
      cardFrequency: {},
      suitBalance: { Wands: 0, Cups: 0, Swords: 0, Pentacles: 0, Major: 0 },
      reversalRate: 0,
      semanticCentroid: null,
      dominantThemes: [],
      patternSignals: [],
    };

    let totalCards = 0;
    let reversedCards = 0;
    const allPositions = [];

    readings.forEach(reading => {
      if (reading.cards) {
        reading.cards.forEach(card => {
          const cardData = CARD_DATABASE[card.cardIndex];
          const embedding = CARD_EMBEDDINGS[card.cardIndex];

          if (cardData) {
            // Frequency
            analysis.cardFrequency[cardData.name] = (analysis.cardFrequency[cardData.name] || 0) + 1;

            // Suit balance
            if (cardData.arcana === 'Major') {
              analysis.suitBalance.Major++;
            } else if (cardData.suit) {
              analysis.suitBalance[cardData.suit]++;
            }

            // Reversals
            totalCards++;
            if (card.reversed) reversedCards++;
          }

          // Collect positions for semantic centroid
          if (embedding) {
            allPositions.push(embedding.position);
          }
        });
      }
    });

    // Calculate reversal rate
    analysis.reversalRate = totalCards > 0 ? Math.round((reversedCards / totalCards) * 100) : 0;

    // Calculate semantic centroid
    if (allPositions.length > 0) {
      analysis.semanticCentroid = {
        x: allPositions.reduce((sum, p) => sum + p[0], 0) / allPositions.length,
        y: allPositions.reduce((sum, p) => sum + p[1], 0) / allPositions.length,
        z: allPositions.reduce((sum, p) => sum + p[2], 0) / allPositions.length,
      };
      analysis.dominantThemes = this.positionToThemes([
        analysis.semanticCentroid.x,
        analysis.semanticCentroid.y,
        analysis.semanticCentroid.z,
      ]);
    }

    // Detect pattern signals
    const sortedCards = Object.entries(analysis.cardFrequency).sort((a, b) => b[1] - a[1]);
    if (sortedCards.length > 0 && sortedCards[0][1] >= 3) {
      analysis.patternSignals.push(`${sortedCards[0][0]} appearing frequently (${sortedCards[0][1]}x)`);
    }

    const dominantSuit = Object.entries(analysis.suitBalance).sort((a, b) => b[1] - a[1])[0];
    if (dominantSuit[1] > totalCards * 0.4) {
      analysis.patternSignals.push(`Strong ${dominantSuit[0]} energy`);
    }

    if (analysis.reversalRate > 40) {
      analysis.patternSignals.push('High reversal rate - internal/blocked themes');
    }

    // Update context
    this.context.patternSignals = analysis.patternSignals;

    // Cache and broadcast
    await this.saveToCache(cacheKey, analysis, CACHE_TTL.PATTERN);
    this.broadcast('patterns_analyzed', analysis);

    return analysis;
  }

  // ═══════════════════════════════════════════════════════════
  // METRICS & DIAGNOSTICS
  // ═══════════════════════════════════════════════════════════

  getMetrics() {
    return {
      ...this.metrics,
      memoryCacheSize: this.memoryCache.size,
      listenerCount: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
      contextRecentCards: this.context.recentCards.length,
      contextReadings: this.context.readingHistory.length,
    };
  }

  resetMetrics() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      llmCalls: 0,
      broadcastCount: 0,
    };
  }

  /**
   * Clear all caches and reset state
   */
  async reset() {
    this.memoryCache.clear();
    this.context = {
      recentCards: [],
      activeThemes: [],
      patternSignals: [],
      userProfile: null,
      readingHistory: [],
      semanticClusters: [],
    };

    // Clear AsyncStorage caches
    await Promise.all(
      Object.values(CACHE_KEYS).map(key => AsyncStorage.removeItem(key))
    );

    this.broadcast('reset', null);
  }
}

// Singleton instance
const insightsPipeline = new InsightsPipeline();

export default insightsPipeline;

// Named exports for convenience
export const {
  subscribe,
  broadcast,
  setUserProfile,
  addCards,
  addReading,
  getUnifiedContext,
  getCardSemanticContext,
  getFromCache,
  saveToCache,
  storeLLMOutput,
  getRecentLLMOutputs,
  generateLLMContextString,
  analyzePatterns,
  getMetrics,
} = insightsPipeline;
