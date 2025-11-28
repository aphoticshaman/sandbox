/**
 * Neon Database Connection Utilities
 * Serverless Postgres with connection pooling
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for serverless
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('DATABASE_URL not set - database functions will fail');
}

// Create SQL client
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

/**
 * Execute a SQL query
 */
export async function query(text, params = []) {
  if (!sql) {
    throw new Error('Database not configured - missing DATABASE_URL');
  }

  try {
    const result = await sql(text, params);
    return {
      rows: Array.isArray(result) ? result : result.rows,
      rowCount: result.length || result.rowCount || 0
    };
  } catch (error) {
    console.error('[Database Error]', error);
    throw error;
  }
}

/**
 * Get or create user (anonymous auth)
 */
export async function getOrCreateUser(userId, deviceId = null) {
  let result = await query(
    'SELECT * FROM users WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length > 0) {
    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  // Create new user
  result = await query(
    `INSERT INTO users (user_id, device_id)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, deviceId]
  );

  // Also create progression record
  await query(
    'INSERT INTO user_progression (user_id) VALUES ($1)',
    [userId]
  );

  return result.rows[0];
}

/**
 * Get user progression (server-authoritative)
 */
export async function getUserProgression(userId) {
  const result = await query(
    'SELECT * FROM user_progression WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    // Create if doesn't exist
    const newProg = await query(
      'INSERT INTO user_progression (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    return newProg.rows[0];
  }

  return result.rows[0];
}

/**
 * Award currency (server-authoritative)
 */
export async function awardCurrency(userId, currencyType, amount, reason) {
  const result = await query(
    'SELECT award_currency($1, $2, $3, $4) as result',
    [userId, currencyType, amount, reason]
  );
  return result.rows[0].result;
}

/**
 * Spend currency (server-authoritative with validation)
 */
export async function spendCurrency(userId, currencyType, amount, reason) {
  const result = await query(
    'SELECT spend_currency($1, $2, $3, $4) as result',
    [userId, currencyType, amount, reason]
  );
  return result.rows[0].result;
}

/**
 * Award XP and handle level ups (server-authoritative)
 */
export async function awardXP(userId, amount, reason) {
  const result = await query(
    'SELECT award_xp($1, $2, $3) as result',
    [userId, amount, reason]
  );
  return result.rows[0].result;
}

/**
 * Get user profile (preferences only, no tracking)
 */
export async function getUserProfile(userId) {
  let result = await query(
    'SELECT * FROM user_profiles WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    // Create new profile
    result = await query(
      `INSERT INTO user_profiles (user_id)
       VALUES ($1)
       RETURNING *`,
      [userId]
    );
  }

  return result.rows[0];
}

/**
 * Update user profile (preferences only)
 */
export async function updateUserProfile(userId, updates) {
  const fields = [];
  const values = [userId];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  const result = await query(
    `UPDATE user_profiles
     SET ${fields.join(', ')}
     WHERE user_id = $1
     RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * Complete a reading (metadata only, no content)
 */
export async function completeReading(userId, spreadType, journaled, reflected) {
  await query(
    `UPDATE user_progression
     SET total_readings = total_readings + 1,
         total_journal_entries = total_journal_entries + $2::int,
         total_reflections = total_reflections + $3::int,
         last_reading_date = CURRENT_DATE,
         current_streak = CASE
           WHEN last_reading_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
           WHEN last_reading_date = CURRENT_DATE THEN current_streak
           ELSE 1
         END
     WHERE user_id = $1`,
    [userId, journaled ? 1 : 0, reflected ? 1 : 0]
  );
}

export default {
  query,
  getOrCreateUser,
  getUserProgression,
  awardCurrency,
  spendCurrency,
  awardXP,
  getUserProfile,
  updateUserProfile,
  completeReading
};

// Note: We do NOT store readings content for privacy.
// Readings, journals, and reflections stay client-side only.
