/**
 * API Middleware
 * Rate limiting, auth, and request validation
 */

// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map();

export function rateLimit(config = {}) {
  const {
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
  } = config;

  return (req, res, next) => {
    // Get client identifier (IP or user ID)
    const identifier = req.headers['x-forwarded-for'] ||
                      req.connection.remoteAddress ||
                      'unknown';

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request log for this identifier
    if (!requestCounts.has(identifier)) {
      requestCounts.set(identifier, []);
    }

    const requests = requestCounts.get(identifier);

    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    requestCounts.set(identifier, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Rate limit exceeded',
          code: 429,
          retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
        }
      });
    }

    // Add current request
    recentRequests.push(now);
    requestCounts.set(identifier, recentRequests);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - recentRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
}

// SECURITY: Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://veilpath.app',
  'https://www.veilpath.app',
  'https://veilpath.vercel.app',
  // Add production Vercel preview URLs pattern if needed
];

// Development origins (only active in development)
if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
  ALLOWED_ORIGINS.push(
    'http://localhost:19006',
    'http://localhost:8081',
    'http://localhost:3000'
  );
}

export function cors(req, res, next) {
  const origin = req.headers.origin;

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests with no origin (mobile apps, server-to-server)
    // But don't set a wildcard - just don't set the header
  } else {
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    // Don't set CORS header - browser will block the request
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
}

export function validateApiKey(req, res, next) {
  // Optional: Add API key validation for client requests
  // For now, we'll skip this since it's a mobile app
  next();
}

// Helper to chain middleware
export function chain(...middlewares) {
  return (req, res) => {
    let index = 0;

    function next(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { message: err.message, code: 500 }
        });
      }

      if (index >= middlewares.length) {
        return;
      }

      const middleware = middlewares[index++];
      middleware(req, res, next);
    }

    next();
  };
}
