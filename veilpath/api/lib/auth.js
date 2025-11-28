/**
 * Authentication utilities for Vercel API routes
 */

import jwt from 'jsonwebtoken';
import { sql } from './db';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

/**
 * Generate JWT token
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT and get user
 */
export async function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { error: 'NO_TOKEN', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user and subscription (Neon returns array directly)
    const result = await sql`
      SELECT u.id, u.device_id, u.email,
             s.tier, s.status, s.expires_at
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      WHERE u.id = ${decoded.userId}
    `;

    if (result.length === 0) {
      return { error: 'USER_NOT_FOUND', status: 401 };
    }

    const user = result[0];
    const isPremium = user.tier === 'premium' &&
                      user.status === 'active' &&
                      (!user.expires_at || new Date(user.expires_at) > new Date());

    // Update last_active (fire and forget)
    sql`UPDATE users SET last_active = NOW() WHERE id = ${user.id}`.catch(() => {});

    return {
      user: {
        id: user.id,
        deviceId: user.device_id,
        email: user.email,
        tier: isPremium ? 'premium' : 'free',
        isPremium
      }
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { error: 'TOKEN_EXPIRED', status: 401 };
    }
    return { error: 'INVALID_TOKEN', status: 403 };
  }
}

/**
 * Get or create user by device ID
 */
export async function getOrCreateUser(deviceId) {
  // Try to find existing (Neon returns array directly)
  let result = await sql`
    SELECT id FROM users WHERE device_id = ${deviceId}
  `;

  if (result.length === 0) {
    // Create new user
    result = await sql`
      INSERT INTO users (device_id) VALUES (${deviceId}) RETURNING id
    `;

    // Create free subscription
    await sql`
      INSERT INTO subscriptions (user_id, tier, status)
      VALUES (${result[0].id}, 'free', 'active')
    `;
  }

  return result[0].id;
}

/**
 * Check and get usage limits
 */
export async function checkUsageLimits(userId, tier) {
  const today = new Date().toISOString().split('T')[0];

  // Get or create daily usage (Neon returns array directly)
  const result = await sql`
    INSERT INTO daily_usage (user_id, date)
    VALUES (${userId}, ${today})
    ON CONFLICT (user_id, date) DO UPDATE SET user_id = ${userId}
    RETURNING readings_count, oracle_messages
  `;

  const usage = result[0];
  const limits = {
    free: { readings: 2, oracle: 5 },
    premium: { readings: 100, oracle: 500 }
  };

  const userLimits = limits[tier] || limits.free;

  return {
    readings: usage.readings_count,
    oracle: usage.oracle_messages,
    limits: userLimits,
    remaining: {
      readings: Math.max(0, userLimits.readings - usage.readings_count),
      oracle: Math.max(0, userLimits.oracle - usage.oracle_messages)
    }
  };
}

/**
 * Log API usage
 */
export async function logUsage(userId, endpoint, tokensUsed, model) {
  await sql`
    INSERT INTO api_usage (user_id, endpoint, tokens_used, model)
    VALUES (${userId}, ${endpoint}, ${tokensUsed}, ${model})
  `;
}

/**
 * Update daily reading count
 */
export async function incrementReadingCount(userId, tokensUsed) {
  await sql`
    UPDATE daily_usage
    SET readings_count = readings_count + 1, tokens_used = tokens_used + ${tokensUsed}
    WHERE user_id = ${userId} AND date = CURRENT_DATE
  `;
}

/**
 * Update daily oracle count
 */
export async function incrementOracleCount(userId, tokensUsed) {
  await sql`
    UPDATE daily_usage
    SET oracle_messages = oracle_messages + 1, tokens_used = tokens_used + ${tokensUsed}
    WHERE user_id = ${userId} AND date = CURRENT_DATE
  `;
}
