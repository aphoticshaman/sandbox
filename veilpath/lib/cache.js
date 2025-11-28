/**
 * LLM Response Caching
 * Reduces API costs by caching responses in Neon
 */

import crypto from 'crypto';
import { query } from './db.js';

const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '604800'); // 7 days default

/**
 * Generate SHA-256 hash of prompt for cache key
 */
export function hashPrompt(prompt) {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}

/**
 * Get cached response for a prompt
 */
export async function getCachedResponse(prompt) {
  const hash = hashPrompt(prompt);

  try {
    const result = await query(
      `SELECT response, model, tokens_used, created_at
       FROM llm_cache
       WHERE prompt_hash = $1 AND expires_at > NOW()
       LIMIT 1`,
      [hash]
    );

    if (result.rows.length > 0) {
      // Increment hit count asynchronously
      query(
        `UPDATE llm_cache
         SET hit_count = hit_count + 1, last_accessed_at = NOW()
         WHERE prompt_hash = $1`,
        [hash]
      ).catch(err => console.error('[Cache] Failed to increment hit count:', err));

      console.log(`[Cache] HIT for hash ${hash.substring(0, 16)}...`);
      return result.rows[0].response;
    }

    console.log(`[Cache] MISS for hash ${hash.substring(0, 16)}...`);
    return null;
  } catch (error) {
    console.error('[Cache] Error getting cached response:', error);
    return null; // Fail gracefully, don't block API call
  }
}

/**
 * Cache a response
 */
export async function cacheResponse(prompt, response, model, tokensUsed) {
  const hash = hashPrompt(prompt);
  const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000);

  try {
    await query(
      `INSERT INTO llm_cache (prompt_hash, response, model, tokens_used, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (prompt_hash) DO UPDATE
       SET response = $2, tokens_used = $4, expires_at = $5, hit_count = 0`,
      [hash, JSON.stringify(response), model, tokensUsed, expiresAt]
    );

    console.log(`[Cache] STORED hash ${hash.substring(0, 16)}... (TTL: ${CACHE_TTL_SECONDS}s)`);
  } catch (error) {
    console.error('[Cache] Error caching response:', error);
    // Don't throw - caching failure shouldn't break the API
  }
}

/**
 * Clear expired cache entries
 * Call this periodically (e.g., daily cron job)
 */
export async function cleanupExpiredCache() {
  try {
    const result = await query('SELECT cleanup_expired_cache() as deleted_count');
    const deletedCount = result.rows[0].deleted_count;
    console.log(`[Cache] Cleaned up ${deletedCount} expired entries`);
    return deletedCount;
  } catch (error) {
    console.error('[Cache] Error cleaning up expired cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const result = await query('SELECT * FROM cache_stats');
    return result.rows[0];
  } catch (error) {
    console.error('[Cache] Error getting cache stats:', error);
    return null;
  }
}

export default {
  getCachedResponse,
  cacheResponse,
  cleanupExpiredCache,
  getCacheStats,
  hashPrompt
};
