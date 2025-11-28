/**
 * SYNTHESIS CACHE - LRU cache for synthesis results
 *
 * Dramatically improves performance by memoizing expensive synthesis generation.
 * Uses Least Recently Used (LRU) eviction policy.
 *
 * Cache key: hash of (card combination + user profile + intention)
 * Cache hit = instant synthesis (0ms vs 1500ms+)
 */

import { generateQuantumSeed } from './quantumRNG';

// ═══════════════════════════════════════════════════════════
// LRU CACHE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map(); // key -> { value, timestamp, accessCount }
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key, value) {
    // Delete if already exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1
    });
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalAccesses: entries.reduce((sum, e) => sum + e.accessCount, 0),
      avgAccessCount: entries.length > 0
        ? entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length
        : 0,
      oldestEntry: entries.length > 0
        ? Math.min(...entries.map(e => e.timestamp))
        : null
    };
  }
}

// ═══════════════════════════════════════════════════════════
// CACHE INSTANCES
// ═══════════════════════════════════════════════════════════

const synthesisCache = new LRUCache(100); // Cache up to 100 synthesis results
const cardInterpretationCache = new LRUCache(200); // Cache up to 200 card interpretations

// ═══════════════════════════════════════════════════════════
// CACHE KEY GENERATION
// ═══════════════════════════════════════════════════════════

/**
 * Generate stable hash from reading data
 * Hash includes: cards, intention, user profile essentials
 */
function generateCacheKey(readingData) {
  const {
    cards = [],
    intention = '',
    userProfile = {},
    readingType = 'general',
    spreadType = 'three_card'
  } = readingData;

  // Build deterministic key components
  const cardKey = cards
    .map(c => `${c.cardIndex}${c.reversed ? 'R' : 'U'}${c.position || ''}`)
    .join('-');

  const profileKey = [
    userProfile.mbtiType || 'none',
    userProfile.zodiacSign || 'none',
    userProfile.birthday || 'none'
  ].join('-');

  const intentionKey = (intention || 'none')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 50); // Limit to 50 chars

  // Combine into stable key
  return `${cardKey}|${profileKey}|${intentionKey}|${readingType}|${spreadType}`;
}

/**
 * Generate cache key for single card interpretation
 */
function generateCardCacheKey(card, intention, readingType, context) {
  const cardKey = `${card.cardIndex}${card.reversed ? 'R' : 'U'}${card.position || ''}`;
  const profileKey = [
    context.mbtiType || 'none',
    context.zodiacSign || 'none'
  ].join('-');

  const intentionKey = (intention || 'none')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 30);

  return `${cardKey}|${profileKey}|${intentionKey}|${readingType}`;
}

// ═══════════════════════════════════════════════════════════
// SYNTHESIS CACHE API
// ═══════════════════════════════════════════════════════════

/**
 * Get cached synthesis if available
 */
export function getCachedSynthesis(readingData) {
  const key = generateCacheKey(readingData);
  const cached = synthesisCache.get(key);

  if (cached) {
    console.log('🎯 Cache HIT for synthesis');
    return cached;
  }

  console.log('💨 Cache MISS for synthesis');
  return null;
}

/**
 * Cache synthesis result
 */
export function cacheSynthesis(readingData, synthesis) {
  const key = generateCacheKey(readingData);
  synthesisCache.set(key, synthesis);
  console.log('💾 Cached synthesis result');
}

/**
 * Get cached card interpretation
 */
export function getCachedCardInterpretation(card, intention, readingType, context) {
  const key = generateCardCacheKey(card, intention, readingType, context);
  const cached = cardInterpretationCache.get(key);

  if (cached) {
    console.log('🎯 Cache HIT for card interpretation');
    return cached;
  }

  return null;
}

/**
 * Cache card interpretation
 */
export function cacheCardInterpretation(card, intention, readingType, context, interpretation) {
  const key = generateCardCacheKey(card, intention, readingType, context);
  cardInterpretationCache.set(key, interpretation);
  console.log('💾 Cached card interpretation');
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  synthesisCache.clear();
  cardInterpretationCache.clear();
  console.log('🗑️  All caches cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    synthesis: synthesisCache.getStats(),
    cardInterpretation: cardInterpretationCache.getStats()
  };
}

// ═══════════════════════════════════════════════════════════
// MEMOIZATION HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Memoize expensive function with custom key generator
 */
export function memoize(fn, keyGenerator = (...args) => JSON.stringify(args), maxSize = 50) {
  const cache = new LRUCache(maxSize);

  return function memoized(...args) {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    if (cached !== null) {
      return cached;
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Memoize async function
 */
export function memoizeAsync(fn, keyGenerator = (...args) => JSON.stringify(args), maxSize = 50) {
  const cache = new LRUCache(maxSize);
  const pendingPromises = new Map();

  return async function memoized(...args) {
    const key = keyGenerator(...args);

    // Check cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Check if already fetching this key
    if (pendingPromises.has(key)) {
      return pendingPromises.get(key);
    }

    // Fetch and cache
    const promise = fn.apply(this, args).then(result => {
      cache.set(key, result);
      pendingPromises.delete(key);
      return result;
    }).catch(error => {
      pendingPromises.delete(key);
      throw error;
    });

    pendingPromises.set(key, promise);
    return promise;
  };
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export {
  LRUCache,
  synthesisCache,
  cardInterpretationCache
};
