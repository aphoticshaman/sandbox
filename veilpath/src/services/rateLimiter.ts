/**
 * DISTRIBUTED RATE LIMITER
 * Uses Upstash Redis for rate limiting across all serverless instances
 *
 * Works with either:
 * - Vercel KV integration (KV_REST_API_URL, KV_REST_API_TOKEN)
 * - Direct Upstash (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
 *
 * Vercel Pro feature - works globally, no cold start issues
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client - supports both Vercel KV and direct Upstash env vars
const getRedisClient = (): Redis | null => {
  // Try Upstash direct env vars first
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  // Try Vercel KV env vars (also Upstash under the hood)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }

  console.warn('[RateLimit] No Redis credentials found - falling back to in-memory');
  return null;
};

const redis = getRedisClient();

// In-memory fallback for development/testing
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  // Requests per window
  limit: number;
  // Window size in seconds
  windowSeconds: number;
  // Identifier prefix (e.g., 'api', 'auth', 'ai')
  prefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
  retryAfter?: number; // Seconds until reset
}

// Default configs for different endpoint types
export const RATE_LIMITS = {
  // General API - generous
  api: { limit: 100, windowSeconds: 60, prefix: 'rl:api' },

  // Auth endpoints - stricter (prevent brute force)
  auth: { limit: 10, windowSeconds: 60, prefix: 'rl:auth' },

  // AI endpoints - very strict (expensive)
  ai: { limit: 20, windowSeconds: 60, prefix: 'rl:ai' },

  // Vera chat - per user daily limit
  vera: { limit: 100, windowSeconds: 86400, prefix: 'rl:vera' },

  // Global per-IP (DDoS protection)
  global: { limit: 1000, windowSeconds: 60, prefix: 'rl:global' },
} as const;

/**
 * Check rate limit using sliding window algorithm
 * Returns whether request is allowed + remaining quota
 */
export async function checkRateLimit(
  identifier: string, // IP address or user ID
  config: RateLimitConfig = RATE_LIMITS.api
): Promise<RateLimitResult> {
  const key = `${config.prefix}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.windowSeconds;

  // Use in-memory fallback if Redis not configured
  if (!redis) {
    return checkRateLimitInMemory(key, config, now);
  }

  try {
    // Use Redis sorted set for sliding window
    // Score = timestamp, member = unique request ID
    const pipeline = redis.pipeline();

    // Remove old entries outside window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    pipeline.zcard(key);

    // Add current request
    const requestId = `${now}:${Math.random().toString(36).slice(2)}`;
    pipeline.zadd(key, { score: now, member: requestId });

    // Set TTL to auto-cleanup
    pipeline.expire(key, config.windowSeconds);

    const results = await pipeline.exec();
    const currentCount = (results[1] as number) || 0;

    const allowed = currentCount < config.limit;
    const remaining = Math.max(0, config.limit - currentCount - 1);
    const resetAt = now + config.windowSeconds;

    if (!allowed) {
      // Remove the request we just added since it's denied
      await redis.zrem(key, requestId);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: config.windowSeconds,
      };
    }

    return {
      allowed: true,
      remaining,
      resetAt,
    };
  } catch (error) {
    // If Redis fails, fall back to in-memory
    console.error('[RateLimit] Redis error, using in-memory fallback:', error);
    return checkRateLimitInMemory(key, config, now);
  }
}

/**
 * In-memory rate limiting fallback (per-instance, not distributed)
 * Used when Redis is not configured or fails
 */
function checkRateLimitInMemory(
  key: string,
  config: RateLimitConfig,
  now: number
): RateLimitResult {
  const resetAt = now + config.windowSeconds;
  const existing = memoryStore.get(key);

  // Reset if window expired
  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  // Check if over limit
  if (existing.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: existing.resetAt - now,
    };
  }

  // Increment and allow
  existing.count++;
  return {
    allowed: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Check multiple rate limits at once (e.g., per-IP + per-user)
 * All must pass for request to be allowed
 */
export async function checkMultipleRateLimits(
  checks: Array<{ identifier: string; config: RateLimitConfig }>
): Promise<{ allowed: boolean; results: RateLimitResult[]; failedAt?: string }> {
  const results = await Promise.all(
    checks.map(({ identifier, config }) => checkRateLimit(identifier, config))
  );

  const failedIndex = results.findIndex(r => !r.allowed);

  if (failedIndex !== -1) {
    return {
      allowed: false,
      results,
      failedAt: checks[failedIndex].config.prefix,
    };
  }

  return { allowed: true, results };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + 1),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
  };
}

// In-memory blocked IPs (fallback when Redis unavailable)
const blockedIPs = new Map<string, number>(); // IP -> unblock timestamp
const abuseScores = new Map<string, { score: number; resetAt: number }>();

/**
 * Block an IP temporarily (abuse detection)
 */
export async function blockIP(ip: string, durationSeconds: number = 3600): Promise<void> {
  const key = `blocked:${ip}`;

  if (redis) {
    try {
      await redis.set(key, { blockedAt: Date.now(), reason: 'abuse' }, { ex: durationSeconds });
      console.warn(`[RateLimit] Blocked IP ${ip} for ${durationSeconds}s (Redis)`);
      return;
    } catch (error) {
      console.error('[RateLimit] Redis blockIP error:', error);
    }
  }

  // In-memory fallback
  blockedIPs.set(ip, Date.now() + durationSeconds * 1000);
  console.warn(`[RateLimit] Blocked IP ${ip} for ${durationSeconds}s (in-memory)`);
}

/**
 * Check if IP is blocked
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
  const key = `blocked:${ip}`;

  if (redis) {
    try {
      const blocked = await redis.get(key);
      return !!blocked;
    } catch (error) {
      console.error('[RateLimit] Redis isIPBlocked error:', error);
    }
  }

  // In-memory fallback
  const unblockAt = blockedIPs.get(ip);
  if (unblockAt) {
    if (Date.now() >= unblockAt) {
      blockedIPs.delete(ip);
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Track abuse score for progressive rate limiting
 */
export async function incrementAbuseScore(
  identifier: string,
  points: number = 1
): Promise<number> {
  const key = `abuse:${identifier}`;

  if (redis) {
    try {
      const newScore = await redis.incrby(key, points);
      await redis.expire(key, 86400);

      if (newScore >= 100) {
        await blockIP(identifier, 3600);
      }
      return newScore;
    } catch (error) {
      console.error('[RateLimit] Redis incrementAbuseScore error:', error);
    }
  }

  // In-memory fallback
  const now = Date.now();
  const existing = abuseScores.get(identifier);

  if (!existing || existing.resetAt <= now) {
    abuseScores.set(identifier, { score: points, resetAt: now + 86400000 });
    return points;
  }

  existing.score += points;

  if (existing.score >= 100) {
    await blockIP(identifier, 3600);
  }

  return existing.score;
}
