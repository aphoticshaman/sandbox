/**
 * JWT Authentication Middleware
 * Validates tokens and attaches user/subscription info to request
 */

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Verify JWT and attach user to request
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user and subscription from database
    const userResult = await pool.query(`
      SELECT u.id, u.device_id, u.email,
             s.tier, s.status, s.expires_at
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      WHERE u.id = $1
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // Check subscription status
    const isPremium = user.tier === 'premium' &&
                      user.status === 'active' &&
                      (!user.expires_at || new Date(user.expires_at) > new Date());

    req.user = {
      id: user.id,
      deviceId: user.device_id,
      email: user.email,
      tier: isPremium ? 'premium' : 'free',
      isPremium
    };

    // Update last_active
    pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [user.id])
      .catch(err => console.error('Failed to update last_active:', err));

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Require premium subscription
 */
function requirePremium(req, res, next) {
  if (!req.user.isPremium) {
    return res.status(403).json({
      error: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED',
      upgrade: true
    });
  }
  next();
}

/**
 * Check daily usage limits
 */
async function checkUsageLimits(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get or create daily usage record
    const usageResult = await pool.query(`
      INSERT INTO daily_usage (user_id, date)
      VALUES ($1, $2)
      ON CONFLICT (user_id, date) DO UPDATE SET user_id = $1
      RETURNING readings_count, oracle_messages
    `, [req.user.id, today]);

    const usage = usageResult.rows[0];

    // Define limits by tier
    const limits = {
      free: { readings: 2, oracle: 5 },
      premium: { readings: 100, oracle: 500 }
    };

    const userLimits = limits[req.user.tier];

    req.usage = {
      readings: usage.readings_count,
      oracle: usage.oracle_messages,
      limits: userLimits,
      remaining: {
        readings: Math.max(0, userLimits.readings - usage.readings_count),
        oracle: Math.max(0, userLimits.oracle - usage.oracle_messages)
      }
    };

    next();
  } catch (error) {
    console.error('Error checking usage limits:', error);
    next(); // Don't block on usage check errors
  }
}

/**
 * Generate JWT for user
 */
function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
}

/**
 * Register or get existing user by device ID
 */
async function getOrCreateUser(deviceId) {
  try {
    // Try to find existing user
    let result = await pool.query(
      'SELECT id FROM users WHERE device_id = $1',
      [deviceId]
    );

    if (result.rows.length === 0) {
      // Create new user
      result = await pool.query(
        'INSERT INTO users (device_id) VALUES ($1) RETURNING id',
        [deviceId]
      );

      // Create free subscription
      await pool.query(
        'INSERT INTO subscriptions (user_id, tier, status) VALUES ($1, $2, $3)',
        [result.rows[0].id, 'free', 'active']
      );
    }

    return result.rows[0].id;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
}

module.exports = {
  authenticateToken,
  requirePremium,
  checkUsageLimits,
  generateToken,
  getOrCreateUser,
  pool
};
