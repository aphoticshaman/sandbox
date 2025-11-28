/**
 * API Response Utilities
 * Standardized response format for all API endpoints
 */

export function success(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

export function error(message, code = 500, details = null) {
  return {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    }
  };
}

export function handleError(res, err, context = '') {
  console.error(`[API Error] ${context}:`, err);

  // Anthropic API errors
  if (err.status) {
    return res.status(err.status).json(
      error(err.message || 'API request failed', err.status, {
        type: err.type,
        context
      })
    );
  }

  // Database errors
  if (err.code) {
    return res.status(500).json(
      error('Database error', 500, {
        code: err.code,
        context
      })
    );
  }

  // Generic errors
  return res.status(500).json(
    error(err.message || 'Internal server error', 500, { context })
  );
}

export function validateRequest(req, requiredFields = []) {
  const missing = [];

  for (const field of requiredFields) {
    if (!req.body || req.body[field] === undefined) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`
    };
  }

  return { valid: true };
}
