/**
 * Lunatiq Backend Server
 *
 * Proxy server for Claude API with authentication, rate limiting,
 * and subscription management via RevenueCat webhooks.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');
const crypto = require('crypto');

const {
  authenticateToken,
  requirePremium,
  checkUsageLimits,
  generateToken,
  getOrCreateUser,
  pool
} = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// CORS Configuration - SECURITY: Only allow specific origins
const ALLOWED_ORIGINS = [
  'https://veilpath.app',
  'https://www.veilpath.app',
  'https://veilpath.vercel.app',
  // Development origins (remove in production)
  process.env.NODE_ENV === 'development' && 'http://localhost:19006',
  process.env.NODE_ENV === 'development' && 'http://localhost:8081',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Rate limiting by tier
const createRateLimiter = (windowMs, max) => rateLimit({
  windowMs,
  max,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false
});

const freeLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  parseInt(process.env.RATE_LIMIT_MAX_FREE) || 10
);

const premiumLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  parseInt(process.env.RATE_LIMIT_MAX_PREMIUM) || 100
);

// Apply rate limiting based on tier
const tierBasedRateLimit = (req, res, next) => {
  if (req.user?.isPremium) {
    return premiumLimiter(req, res, next);
  }
  return freeLimiter(req, res, next);
};

// ==================== PUBLIC ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Register device and get JWT
app.post('/auth/register', async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        error: 'Device ID required',
        code: 'MISSING_DEVICE_ID'
      });
    }

    const userId = await getOrCreateUser(deviceId);
    const token = generateToken(userId);

    res.json({
      token,
      userId,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// RevenueCat webhook
app.post('/webhooks/revenuecat', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-revenuecat-signature'];
    if (process.env.REVENUECAT_WEBHOOK_SECRET) {
      const expectedSig = crypto
        .createHmac('sha256', process.env.REVENUECAT_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSig) {
        console.warn('Invalid RevenueCat webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    const eventType = event.event?.type;
    const appUserId = event.event?.app_user_id;

    console.log(`RevenueCat webhook: ${eventType} for user ${appUserId}`);

    if (!appUserId) {
      return res.status(400).json({ error: 'Missing app_user_id' });
    }

    // Find user by device ID (RevenueCat app_user_id = our device_id)
    const userResult = await pool.query(
      'SELECT id FROM users WHERE device_id = $1',
      [appUserId]
    );

    if (userResult.rows.length === 0) {
      console.warn(`User not found for device_id: ${appUserId}`);
      return res.status(200).json({ received: true, warning: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Handle different event types
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        // Activate/renew premium
        await pool.query(`
          INSERT INTO subscriptions (user_id, revenuecat_id, tier, status, expires_at)
          VALUES ($1, $2, 'premium', 'active', $3)
          ON CONFLICT (user_id)
          DO UPDATE SET
            tier = 'premium',
            status = 'active',
            expires_at = $3,
            updated_at = NOW()
        `, [
          userId,
          event.event?.transaction_id,
          event.event?.expiration_at_ms ? new Date(event.event.expiration_at_ms) : null
        ]);
        console.log(`Premium activated for user ${userId}`);
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        // Mark subscription as cancelled/expired
        await pool.query(`
          UPDATE subscriptions
          SET status = $1, cancelled_at = NOW(), updated_at = NOW()
          WHERE user_id = $2
        `, [eventType === 'CANCELLATION' ? 'cancelled' : 'expired', userId]);
        console.log(`Subscription ${eventType.toLowerCase()} for user ${userId}`);
        break;

      case 'BILLING_ISSUE':
        // Log billing issue but keep active for grace period
        console.warn(`Billing issue for user ${userId}`);
        break;

      default:
        console.log(`Unhandled RevenueCat event type: ${eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('RevenueCat webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ==================== PROTECTED ROUTES ====================

// Get user status and usage
app.get('/user/status', authenticateToken, checkUsageLimits, (req, res) => {
  res.json({
    user: req.user,
    usage: req.usage
  });
});

// ==================== CLAUDE API PROXY ====================

// Card interpretation
app.post('/api/interpret',
  authenticateToken,
  tierBasedRateLimit,
  checkUsageLimits,
  async (req, res) => {
    try {
      // Check reading limit
      if (req.usage.remaining.readings <= 0 && !req.user.isPremium) {
        return res.status(429).json({
          error: 'Daily reading limit reached',
          code: 'READING_LIMIT',
          upgrade: true
        });
      }

      const { prompt, maxTokens = 500 } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt required' });
      }

      const startTime = Date.now();

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: Math.min(maxTokens, 800),
        messages: [{ role: 'user', content: prompt }]
      });

      const inferenceTime = Date.now() - startTime;
      const tokensUsed = response.usage.output_tokens;

      // Log usage
      await pool.query(`
        INSERT INTO api_usage (user_id, endpoint, tokens_used, model)
        VALUES ($1, $2, $3, $4)
      `, [req.user.id, 'interpret', tokensUsed, 'haiku']);

      // Update daily usage
      await pool.query(`
        UPDATE daily_usage
        SET readings_count = readings_count + 1, tokens_used = tokens_used + $1
        WHERE user_id = $2 AND date = CURRENT_DATE
      `, [tokensUsed, req.user.id]);

      res.json({
        text: response.content[0].text,
        tokens: tokensUsed,
        inferenceTime,
        model: 'haiku'
      });
    } catch (error) {
      console.error('Interpretation error:', error);
      res.status(500).json({
        error: 'Interpretation failed',
        code: 'API_ERROR'
      });
    }
  }
);

// Reading synthesis
app.post('/api/synthesize',
  authenticateToken,
  requirePremium,
  tierBasedRateLimit,
  async (req, res) => {
    try {
      const { prompt, maxTokens = 1200 } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt required' });
      }

      const startTime = Date.now();

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: Math.min(maxTokens, 1500),
        messages: [{ role: 'user', content: prompt }]
      });

      const inferenceTime = Date.now() - startTime;
      const tokensUsed = response.usage.output_tokens;

      // Log usage
      await pool.query(`
        INSERT INTO api_usage (user_id, endpoint, tokens_used, model)
        VALUES ($1, $2, $3, $4)
      `, [req.user.id, 'synthesize', tokensUsed, 'haiku']);

      res.json({
        text: response.content[0].text,
        tokens: tokensUsed,
        inferenceTime,
        model: 'haiku'
      });
    } catch (error) {
      console.error('Synthesis error:', error);
      res.status(500).json({
        error: 'Synthesis failed',
        code: 'API_ERROR'
      });
    }
  }
);

// Oracle chat
app.post('/api/oracle',
  authenticateToken,
  requirePremium,
  tierBasedRateLimit,
  checkUsageLimits,
  async (req, res) => {
    try {
      // Check oracle message limit
      if (req.usage.remaining.oracle <= 0) {
        return res.status(429).json({
          error: 'Daily oracle message limit reached',
          code: 'ORACLE_LIMIT'
        });
      }

      const { systemPrompt, messages, maxTokens = 600 } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array required' });
      }

      const startTime = Date.now();

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: Math.min(maxTokens, 800),
        system: systemPrompt || 'You are a wise tarot oracle.',
        messages: messages.slice(-10) // Keep last 10 messages for context
      });

      const inferenceTime = Date.now() - startTime;
      const tokensUsed = response.usage.output_tokens;

      // Log usage
      await pool.query(`
        INSERT INTO api_usage (user_id, endpoint, tokens_used, model)
        VALUES ($1, $2, $3, $4)
      `, [req.user.id, 'oracle', tokensUsed, 'haiku']);

      // Update daily oracle count
      await pool.query(`
        UPDATE daily_usage
        SET oracle_messages = oracle_messages + 1, tokens_used = tokens_used + $1
        WHERE user_id = $2 AND date = CURRENT_DATE
      `, [tokensUsed, req.user.id]);

      res.json({
        text: response.content[0].text,
        tokens: tokensUsed,
        inferenceTime,
        model: 'haiku'
      });
    } catch (error) {
      console.error('Oracle error:', error);
      res.status(500).json({
        error: 'Oracle response failed',
        code: 'API_ERROR'
      });
    }
  }
);

// AI Insights (Sonnet for complex analysis)
app.post('/api/insights',
  authenticateToken,
  requirePremium,
  tierBasedRateLimit,
  async (req, res) => {
    try {
      const { prompt, maxTokens = 1000 } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt required' });
      }

      const startTime = Date.now();

      // Use Sonnet for complex pattern analysis
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: Math.min(maxTokens, 1500),
        messages: [{ role: 'user', content: prompt }]
      });

      const inferenceTime = Date.now() - startTime;
      const tokensUsed = response.usage.output_tokens;

      // Log usage
      await pool.query(`
        INSERT INTO api_usage (user_id, endpoint, tokens_used, model)
        VALUES ($1, $2, $3, $4)
      `, [req.user.id, 'insights', tokensUsed, 'sonnet']);

      res.json({
        text: response.content[0].text,
        tokens: tokensUsed,
        inferenceTime,
        model: 'sonnet'
      });
    } catch (error) {
      console.error('Insights error:', error);
      res.status(500).json({
        error: 'Insights generation failed',
        code: 'API_ERROR'
      });
    }
  }
);

// Intention analysis
app.post('/api/analyze-intention',
  authenticateToken,
  tierBasedRateLimit,
  async (req, res) => {
    try {
      const { prompt, maxTokens = 400 } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt required' });
      }

      const startTime = Date.now();

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: Math.min(maxTokens, 500),
        messages: [{ role: 'user', content: prompt }]
      });

      const inferenceTime = Date.now() - startTime;
      const tokensUsed = response.usage.output_tokens;

      // Log usage
      await pool.query(`
        INSERT INTO api_usage (user_id, endpoint, tokens_used, model)
        VALUES ($1, $2, $3, $4)
      `, [req.user.id, 'analyze-intention', tokensUsed, 'haiku']);

      res.json({
        text: response.content[0].text,
        tokens: tokensUsed,
        inferenceTime,
        model: 'haiku'
      });
    } catch (error) {
      console.error('Intention analysis error:', error);
      res.status(500).json({
        error: 'Intention analysis failed',
        code: 'API_ERROR'
      });
    }
  }
);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'SERVER_ERROR'
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     Lunatiq Backend Server v1.0.0          ║
║     Running on port ${PORT}                    ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
