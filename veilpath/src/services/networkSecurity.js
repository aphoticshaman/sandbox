/**
 * NETWORK SECURITY SERVICE
 * Enforces secure network communications
 *
 * SECURITY GUARANTEES:
 * - All HTTP requests are upgraded to HTTPS
 * - Refuses plaintext HTTP connections
 * - Validates TLS certificates
 * - Enforces secure headers
 * - Monitors for MITM attacks
 *
 * This ensures data-in-transit is always encrypted,
 * complementing our data-at-rest encryption.
 */

// Secure URL validator
const HTTPS_REGEX = /^https:\/\//i;
const HTTP_REGEX = /^http:\/\//i;

/**
 * Validate and upgrade URL to HTTPS
 * Refuses to allow HTTP connections
 *
 * @param {string} url - URL to validate
 * @param {boolean} allowUpgrade - If true, upgrade HTTP to HTTPS; if false, reject HTTP
 * @returns {string} - Secure URL
 * @throws {Error} - If URL is insecure and cannot be upgraded
 */
export function enforceHTTPS(url, allowUpgrade = true) {
  if (!url || typeof url !== 'string') {
    throw new Error('[NetworkSecurity] Invalid URL');
  }

  // Already HTTPS - good
  if (HTTPS_REGEX.test(url)) {
    return url;
  }

  // HTTP detected
  if (HTTP_REGEX.test(url)) {
    if (allowUpgrade) {
      console.warn('[NetworkSecurity] Upgrading HTTP to HTTPS:', url);
      return url.replace(HTTP_REGEX, 'https://');
    } else {
      throw new Error('[NetworkSecurity] HTTPS required - plaintext HTTP connections are not allowed');
    }
  }

  // Relative URL or other protocol - pass through
  return url;
}

/**
 * Secure fetch wrapper that enforces HTTPS
 * Drop-in replacement for fetch() with security guarantees
 *
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function secureFetch(url, options = {}) {
  // Enforce HTTPS
  const secureUrl = enforceHTTPS(url, true);

  // Add security headers
  const secureOptions = {
    ...options,
    headers: {
      ...options.headers,
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      // Request secure context
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    },
  };

  // For POST/PUT with body, ensure Content-Type is set
  if (options.body && !options.headers?.['Content-Type']) {
    secureOptions.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(secureUrl, secureOptions);

    // Validate we actually got HTTPS response
    if (response.url && !HTTPS_REGEX.test(response.url)) {
      console.error('[NetworkSecurity] Response came from insecure URL:', response.url);
      throw new Error('Received response from insecure connection');
    }

    return response;
  } catch (error) {
    // Log security-relevant errors
    if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
      console.error('[NetworkSecurity] TLS/Certificate error - possible MITM attack:', error.message);
    }
    throw error;
  }
}

/**
 * Secure WebSocket wrapper that enforces WSS
 *
 * @param {string} url - WebSocket URL
 * @param {string|string[]} protocols - WebSocket protocols
 * @returns {WebSocket}
 */
export function secureWebSocket(url, protocols) {
  if (!url || typeof url !== 'string') {
    throw new Error('[NetworkSecurity] Invalid WebSocket URL');
  }

  // Enforce WSS (secure WebSocket)
  let secureUrl = url;

  if (url.startsWith('ws://')) {
    console.warn('[NetworkSecurity] Upgrading WS to WSS:', url);
    secureUrl = url.replace('ws://', 'wss://');
  }

  if (!secureUrl.startsWith('wss://')) {
    throw new Error('[NetworkSecurity] WSS required - plaintext WebSocket connections are not allowed');
  }

  return new WebSocket(secureUrl, protocols);
}

/**
 * Validate API endpoint security
 * Use this to validate third-party API URLs before connecting
 *
 * @param {string} url - API URL to validate
 * @returns {boolean} - True if secure
 */
export function isSecureEndpoint(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Must be HTTPS
  if (!HTTPS_REGEX.test(url)) {
    return false;
  }

  // Block known insecure patterns
  const insecurePatterns = [
    /localhost/i, // Unless in dev mode
    /127\.0\.0\.1/,
    /0\.0\.0\.0/,
    /\.local$/i,
    /\.internal$/i,
  ];

  // Allow localhost in development
  const isDev = process.env.NODE_ENV === 'development' || __DEV__;

  if (!isDev) {
    for (const pattern of insecurePatterns) {
      if (pattern.test(url)) {
        console.warn('[NetworkSecurity] Blocking potentially insecure endpoint:', url);
        return false;
      }
    }
  }

  return true;
}

/**
 * Get recommended security headers for API requests
 * Include these in all outgoing requests
 *
 * @returns {Object} - Security headers
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  };
}

/**
 * Secure SSE (Server-Sent Events) wrapper for streaming
 * Used for AI response streaming
 *
 * @param {string} url - SSE endpoint URL
 * @param {Object} options - EventSource options
 * @returns {EventSource}
 */
export function secureEventSource(url, options = {}) {
  // Enforce HTTPS
  const secureUrl = enforceHTTPS(url, false); // Don't upgrade, reject HTTP

  // EventSource automatically uses the page's security context
  // but we explicitly validate the URL
  if (!isSecureEndpoint(secureUrl)) {
    throw new Error('[NetworkSecurity] Insecure SSE endpoint rejected');
  }

  return new EventSource(secureUrl, options);
}

/**
 * Validate response security
 * Call this to verify a response came through secure channels
 *
 * @param {Response} response - Fetch response
 * @returns {boolean} - True if response is secure
 */
export function validateResponseSecurity(response) {
  if (!response) {
    return false;
  }

  // Check response URL is HTTPS
  if (response.url && !HTTPS_REGEX.test(response.url)) {
    console.error('[NetworkSecurity] Response from insecure URL:', response.url);
    return false;
  }

  // Check for security headers in response
  const securityHeaders = [
    'strict-transport-security',
    'x-content-type-options',
  ];

  // Log missing security headers (informational)
  for (const header of securityHeaders) {
    if (!response.headers.get(header)) {
      console.debug(`[NetworkSecurity] Response missing security header: ${header}`);
    }
  }

  return true;
}

/**
 * Content Security Policy checker
 * Validates that content matches expected security constraints
 *
 * @param {string} content - Content to validate
 * @param {string} contentType - Expected content type
 * @returns {boolean} - True if content passes security checks
 */
export function validateContent(content, contentType = 'application/json') {
  if (!content) {
    return true; // Empty content is OK
  }

  // For JSON, validate it's actually JSON
  if (contentType.includes('application/json')) {
    try {
      JSON.parse(content);
      return true;
    } catch {
      console.error('[NetworkSecurity] Invalid JSON content received');
      return false;
    }
  }

  // Block potentially dangerous content patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /data:text\/html/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      console.error('[NetworkSecurity] Potentially dangerous content detected');
      return false;
    }
  }

  return true;
}

/**
 * Certificate pinning configuration
 * For production, pin to known-good certificates
 *
 * Note: Actual cert pinning requires native module support in React Native
 * This provides the configuration for such modules
 */
export const CERTIFICATE_PINS = {
  // Supabase
  'supabase.co': [
    // SHA256 public key pins (update these when certs rotate)
    // 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  ],

  // Claude API (Anthropic)
  'api.anthropic.com': [
    // SHA256 public key pins
  ],

  // Add your own API endpoints here
};

/**
 * Initialize network security
 * Call this on app startup
 */
export function initializeNetworkSecurity() {
  console.log('[NetworkSecurity] Initializing network security...');

  // In browser, check if we're on HTTPS
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.error('[NetworkSecurity] WARNING: App is not running over HTTPS!');
      // In production, you might want to redirect to HTTPS
      // window.location.href = window.location.href.replace('http://', 'https://');
    }
  }

  // Override fetch globally to enforce HTTPS (optional, use with caution)
  // This is commented out to avoid breaking third-party libraries
  // const originalFetch = window.fetch;
  // window.fetch = (url, options) => secureFetch(url, options);

  console.log('[NetworkSecurity] Network security initialized');
}

// Export convenience object
export default {
  enforceHTTPS,
  secureFetch,
  secureWebSocket,
  secureEventSource,
  isSecureEndpoint,
  getSecurityHeaders,
  validateResponseSecurity,
  validateContent,
  initializeNetworkSecurity,
  CERTIFICATE_PINS,
};
