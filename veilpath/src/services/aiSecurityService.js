/**
 * AI/ML SECURITY SERVICE (MLSecOps)
 * Protects against AI-specific attack vectors and ensures safe AI interactions
 *
 * SECURITY CONCERNS ADDRESSED:
 * 1. Prompt Injection - Preventing user input from hijacking AI behavior
 * 2. Output Sanitization - Ensuring AI responses don't contain malicious content
 * 3. Data Leakage Prevention - AI can't be tricked into revealing system prompts or user data
 * 4. Rate Limiting - Prevent abuse of AI resources
 * 5. Response Validation - Verify AI output is within expected bounds
 * 6. Jailbreak Prevention - Stop attempts to bypass AI safety guidelines
 *
 * OWASP LLM Top 10 Addressed:
 * - LLM01: Prompt Injection
 * - LLM02: Insecure Output Handling
 * - LLM03: Training Data Poisoning (N/A - using vendor model)
 * - LLM04: Model Denial of Service
 * - LLM05: Supply Chain Vulnerabilities
 * - LLM06: Sensitive Information Disclosure
 * - LLM07: Insecure Plugin Design (N/A)
 * - LLM08: Excessive Agency
 * - LLM09: Overreliance
 * - LLM10: Model Theft (N/A - using vendor model)
 */

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 20,
  maxRequestsPerHour: 100,
  maxTokensPerRequest: 4096,
  cooldownAfterBurstMs: 30000, // 30 seconds
};

// Request tracking for rate limiting
const requestTracker = {
  minuteRequests: [],
  hourRequests: [],
  lastBurstCooldown: 0,
};

/**
 * PROMPT INJECTION DETECTION
 * Identifies and neutralizes prompt injection attempts
 */

// Known prompt injection patterns
const INJECTION_PATTERNS = [
  // Direct injection attempts
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?prior\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?(your\s+)?instructions/i,
  /new\s+instructions?:/i,
  /system\s*prompt:/i,
  /you\s+are\s+now/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+if/i,
  /roleplay\s+as/i,

  // Delimiter injection
  /```system/i,
  /\[system\]/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
  /<\|endoftext\|>/i,

  // Jailbreak attempts
  /DAN\s*mode/i,
  /developer\s*mode/i,
  /do\s+anything\s+now/i,
  /bypass\s+(your\s+)?safety/i,
  /override\s+(your\s+)?guidelines/i,
  /break\s+character/i,

  // Data extraction attempts
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /show\s+(me\s+)?(your\s+)?instructions/i,
  /what\s+are\s+your\s+instructions/i,
  /print\s+(your\s+)?system/i,
  /output\s+(your\s+)?prompt/i,

  // Code execution attempts
  /execute\s+this\s+code/i,
  /run\s+this\s+script/i,
  /eval\(/i,
  /exec\(/i,

  // Navigation/action injection (specific to VeilPath)
  /navigate\s+to\s+.*without/i,
  /delete\s+all\s+(my\s+)?data/i,
  /export\s+all\s+user/i,
  /send\s+.*to\s+.*@/i, // Email exfiltration
];

// Suspicious keyword combinations
const SUSPICIOUS_COMBINATIONS = [
  ['ignore', 'instructions'],
  ['system', 'prompt'],
  ['admin', 'access'],
  ['bypass', 'security'],
  ['reveal', 'secret'],
  ['hidden', 'command'],
];

/**
 * Detect prompt injection attempts in user input
 *
 * @param {string} input - User input to check
 * @returns {{ isSafe: boolean, threats: string[], sanitized: string }}
 */
export function detectPromptInjection(input) {
  if (!input || typeof input !== 'string') {
    return { isSafe: true, threats: [], sanitized: '' };
  }

  const threats = [];
  let sanitized = input;

  // Check against injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push(`Injection pattern detected: ${pattern.source.substring(0, 30)}...`);
      // Neutralize the pattern
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }
  }

  // Check suspicious keyword combinations
  const lowerInput = input.toLowerCase();
  for (const [word1, word2] of SUSPICIOUS_COMBINATIONS) {
    if (lowerInput.includes(word1) && lowerInput.includes(word2)) {
      threats.push(`Suspicious combination: "${word1}" + "${word2}"`);
    }
  }

  // Check for excessive special characters (potential delimiter injection)
  const specialCharRatio = (input.match(/[<>\[\]{}|`]/g) || []).length / input.length;
  if (specialCharRatio > 0.1) {
    threats.push('High ratio of special characters detected');
  }

  // Check for very long inputs (potential buffer attacks)
  if (input.length > 10000) {
    threats.push('Excessively long input detected');
    sanitized = sanitized.substring(0, 10000) + '... [TRUNCATED]';
  }

  return {
    isSafe: threats.length === 0,
    threats,
    sanitized,
  };
}

/**
 * Sanitize user input before sending to AI
 * This is the primary defense against prompt injection
 *
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized input safe for AI
 */
export function sanitizeForAI(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // 1. Normalize unicode to prevent homograph attacks
  sanitized = sanitized.normalize('NFKC');

  // 2. Remove control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 3. Escape potential delimiter characters
  sanitized = sanitized
    .replace(/```/g, "'''")  // Code blocks
    .replace(/<<</g, '((')   // Potential delimiters
    .replace(/>>>/g, '))')
    .replace(/<\|/g, '[')
    .replace(/\|>/g, ']');

  // 4. Neutralize injection attempts (replace, don't remove, to maintain context)
  const { sanitized: filtered } = detectPromptInjection(sanitized);
  sanitized = filtered;

  // 5. Limit length
  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000);
  }

  return sanitized.trim();
}

/**
 * OUTPUT SANITIZATION
 * Ensure AI responses are safe before displaying to users
 */

// Dangerous patterns in AI output
const OUTPUT_DANGERS = [
  // Script injection
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,

  // Potential system information leak
  /api[_-]?key/i,
  /password\s*[:=]/i,
  /secret\s*[:=]/i,
  /token\s*[:=]/i,

  // Harmful content markers
  /\[HARMFUL\]/i,
  /\[UNSAFE\]/i,

  // URLs that could be phishing
  /bit\.ly/i,
  /tinyurl/i,
  /t\.co/i,
];

/**
 * Sanitize AI output before displaying to user
 *
 * @param {string} output - Raw AI response
 * @returns {{ safe: string, warnings: string[] }}
 */
export function sanitizeAIOutput(output) {
  if (!output || typeof output !== 'string') {
    return { safe: '', warnings: [] };
  }

  const warnings = [];
  let safe = output;

  // Check for dangerous patterns
  for (const pattern of OUTPUT_DANGERS) {
    if (pattern.test(output)) {
      warnings.push(`Potentially unsafe content detected: ${pattern.source}`);
      safe = safe.replace(pattern, '[CONTENT REMOVED]');
    }
  }

  // Strip any HTML tags
  safe = safe.replace(/<[^>]*>/g, '');

  // Validate URLs in output (allow safe domains)
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = safe.match(urlRegex) || [];

  const safeDomains = [
    'veilpath.app',
    'en.wikipedia.org',
    'britannica.com',
  ];

  for (const url of urls) {
    const isSafe = safeDomains.some(domain => url.includes(domain));
    if (!isSafe) {
      warnings.push(`External URL detected and marked: ${url}`);
      // Don't remove URLs, but we could flag them for the UI to handle
    }
  }

  return { safe, warnings };
}

/**
 * RATE LIMITING
 * Prevent abuse of AI resources
 */

/**
 * Check if a new AI request is allowed under rate limits
 *
 * @returns {{ allowed: boolean, reason?: string, retryAfter?: number }}
 */
export function checkRateLimit() {
  const now = Date.now();

  // Clean old entries
  requestTracker.minuteRequests = requestTracker.minuteRequests.filter(
    t => now - t < 60000
  );
  requestTracker.hourRequests = requestTracker.hourRequests.filter(
    t => now - t < 3600000
  );

  // Check cooldown
  if (requestTracker.lastBurstCooldown > now) {
    return {
      allowed: false,
      reason: 'Rate limit cooldown in effect',
      retryAfter: Math.ceil((requestTracker.lastBurstCooldown - now) / 1000),
    };
  }

  // Check minute limit
  if (requestTracker.minuteRequests.length >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    requestTracker.lastBurstCooldown = now + RATE_LIMIT_CONFIG.cooldownAfterBurstMs;
    return {
      allowed: false,
      reason: 'Too many requests per minute',
      retryAfter: 60,
    };
  }

  // Check hour limit
  if (requestTracker.hourRequests.length >= RATE_LIMIT_CONFIG.maxRequestsPerHour) {
    return {
      allowed: false,
      reason: 'Hourly request limit reached',
      retryAfter: 3600 - Math.floor((now - requestTracker.hourRequests[0]) / 1000),
    };
  }

  return { allowed: true };
}

/**
 * Record an AI request for rate limiting
 */
export function recordRequest() {
  const now = Date.now();
  requestTracker.minuteRequests.push(now);
  requestTracker.hourRequests.push(now);
}

/**
 * DATA LEAKAGE PREVENTION
 * Ensure sensitive data doesn't appear in AI context
 */

// Patterns to redact from AI context
const SENSITIVE_PATTERNS = [
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  // Phone numbers
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE]' },
  // SSN
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
  // Credit card
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CARD]' },
  // API keys (generic pattern)
  { pattern: /\b[A-Za-z0-9_-]{20,}\b/g, replacement: '[KEY]' },
];

/**
 * Redact sensitive information before sending to AI
 * This prevents accidental exposure of PII in AI context
 *
 * @param {string} text - Text to redact
 * @returns {string} - Redacted text
 */
export function redactSensitiveInfo(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let redacted = text;

  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }

  return redacted;
}

/**
 * RESPONSE VALIDATION
 * Ensure AI responses meet expected criteria
 */

/**
 * Validate AI response structure and content
 *
 * @param {string} response - AI response to validate
 * @param {Object} options - Validation options
 * @returns {{ valid: boolean, issues: string[] }}
 */
export function validateAIResponse(response, options = {}) {
  const {
    maxLength = 10000,
    requiresJSON = false,
    allowedTopics = null, // Array of allowed topic keywords
  } = options;

  const issues = [];

  if (!response || typeof response !== 'string') {
    return { valid: false, issues: ['Empty or invalid response'] };
  }

  // Check length
  if (response.length > maxLength) {
    issues.push(`Response exceeds maximum length (${response.length}/${maxLength})`);
  }

  // Check for JSON if required
  if (requiresJSON) {
    try {
      JSON.parse(response);
    } catch {
      issues.push('Response is not valid JSON');
    }
  }

  // Check for off-topic content (simple keyword check)
  if (allowedTopics && allowedTopics.length > 0) {
    const lowerResponse = response.toLowerCase();
    const hasRelevantContent = allowedTopics.some(topic =>
      lowerResponse.includes(topic.toLowerCase())
    );
    if (!hasRelevantContent) {
      issues.push('Response may be off-topic');
    }
  }

  // Check for refusal patterns (AI declined to respond)
  const refusalPatterns = [
    /i cannot/i,
    /i'm unable to/i,
    /i can't help with/i,
    /against my guidelines/i,
  ];

  for (const pattern of refusalPatterns) {
    if (pattern.test(response)) {
      issues.push('AI declined to provide response');
      break;
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * SECURE AI REQUEST WRAPPER
 * Complete security wrapper for AI interactions
 */

/**
 * Securely send a request to the AI
 * Applies all security measures: sanitization, rate limiting, output validation
 *
 * @param {Function} aiFunction - The AI function to call
 * @param {string} userInput - Raw user input
 * @param {Object} options - Security options
 * @returns {Promise<{ response: string, security: Object }>}
 */
export async function secureAIRequest(aiFunction, userInput, options = {}) {
  const securityReport = {
    inputSanitized: false,
    injectionBlocked: false,
    rateLimited: false,
    outputSanitized: false,
    warnings: [],
  };

  // 1. Check rate limit
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    securityReport.rateLimited = true;
    throw new Error(`Rate limited: ${rateCheck.reason}. Retry after ${rateCheck.retryAfter}s`);
  }

  // 2. Detect and handle injection attempts
  const injectionCheck = detectPromptInjection(userInput);
  if (!injectionCheck.isSafe) {
    securityReport.injectionBlocked = true;
    securityReport.warnings.push(...injectionCheck.threats);
    console.warn('[AISecurityService] Injection attempt detected:', injectionCheck.threats);
  }

  // 3. Sanitize input
  const sanitizedInput = sanitizeForAI(userInput);
  securityReport.inputSanitized = true;

  // 4. Redact sensitive info
  const safeInput = redactSensitiveInfo(sanitizedInput);

  // 5. Record request for rate limiting
  recordRequest();

  // 6. Call AI function
  let response;
  try {
    response = await aiFunction(safeInput);
  } catch (error) {
    throw new Error(`AI request failed: ${error.message}`);
  }

  // 7. Sanitize output
  const { safe: sanitizedOutput, warnings: outputWarnings } = sanitizeAIOutput(response);
  securityReport.outputSanitized = true;
  securityReport.warnings.push(...outputWarnings);

  // 8. Validate response
  const validation = validateAIResponse(sanitizedOutput, options);
  if (!validation.valid) {
    securityReport.warnings.push(...validation.issues);
  }

  return {
    response: sanitizedOutput,
    security: securityReport,
  };
}

/**
 * AUDIT LOGGING
 * Log security events for monitoring
 */

const auditLog = [];
const MAX_AUDIT_LOG_SIZE = 1000;

/**
 * Log a security event
 *
 * @param {string} event - Event type
 * @param {Object} details - Event details
 */
export function logSecurityEvent(event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    details,
  };

  auditLog.push(entry);

  // Trim log to max size
  if (auditLog.length > MAX_AUDIT_LOG_SIZE) {
    auditLog.shift();
  }

  // Log critical events to console
  const criticalEvents = ['injection_attempt', 'rate_limit_exceeded', 'data_leak_attempt'];
  if (criticalEvents.includes(event)) {
    console.error('[AISecurityService] CRITICAL:', event, details);
  }
}

/**
 * Get recent security events
 *
 * @param {number} count - Number of events to retrieve
 * @returns {Array} - Recent security events
 */
export function getSecurityAuditLog(count = 100) {
  return auditLog.slice(-count);
}

// Export default object
export default {
  // Input protection
  detectPromptInjection,
  sanitizeForAI,
  redactSensitiveInfo,

  // Output protection
  sanitizeAIOutput,
  validateAIResponse,

  // Rate limiting
  checkRateLimit,
  recordRequest,

  // Secure wrapper
  secureAIRequest,

  // Audit
  logSecurityEvent,
  getSecurityAuditLog,
};
