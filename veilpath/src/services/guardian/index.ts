/**
 * GUARDIAN SECURITY LAYER
 * Protects Vera, VeilPath, and users from adversarial attacks
 *
 * OSS Foundation + Patent IP Layer
 *
 * Modules:
 * - Guardian class: AI interaction protection (rate limiting, injection detection)
 * - inputValidation: Form/user input validation (XSS, SQL injection, etc.)
 *
 * VERCEL PRO: Uses distributed rate limiting via Vercel KV (Redis)
 */

// Re-export input validation utilities
export {
  validateInput,
  sanitizeText,
  validateEmail,
  validateUsername,
  validateSearch,
  validateJournalEntry,
  validateMessage,
  isSafe,
  createValidatedHandler,
} from './inputValidation';

export type { InputType, ValidationConfig, ValidationResult } from './inputValidation';

// Distributed rate limiting (Vercel KV) - works across all serverless instances
import {
  checkRateLimit,
  checkMultipleRateLimits,
  RATE_LIMITS,
  incrementAbuseScore,
  isIPBlocked,
  blockIP,
  getRateLimitHeaders,
} from '../rateLimiter';

// Re-export for use in API routes
export {
  checkRateLimit,
  RATE_LIMITS,
  incrementAbuseScore,
  isIPBlocked,
  blockIP,
  getRateLimitHeaders,
};

// Rate limiting patterns
const INJECTION_PATTERNS = [
  /ignore (all |any )?(previous|prior|above) (instructions|prompts|rules)/i,
  /disregard (your|the) (instructions|programming|rules)/i,
  /forget (everything|what) (you|I) (told|said)/i,
  /you are (now |)?(DAN|STAN|DUDE|jailbroken)/i,
  /pretend (you're|to be) (an? )?(unrestricted|uncensored)/i,
  /act as (if |)(you have |)no (restrictions|limits|rules)/i,
  /repeat (your |the )?(system |initial )?(prompt|instructions)/i,
  /what (are|were) your (original |first )?(instructions|rules)/i,
  /show me (your |the )?system prompt/i,
  /enable (developer|debug|admin) mode/i,
  /\[SYSTEM\]|\[ADMIN\]|\[DEBUG\]/i,
];

// Zero-width and invisible characters
const ENCODING_ATTACKS = /[\u200b\u200c\u200d\ufeff\u2060\u180e]/g;

export interface GuardianConfig {
  maxTokensPerRequest: number;
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  dailyBudgetCents: number;
  alertThresholds: number[]; // e.g., [0.5, 0.75, 0.9]
}

export interface Session {
  userId: string;
  requestCount: number;
  tokenCount: number;
  lastRequestTime: number;
  trustScore: number;
  dailySpendCents: number;
}

export interface GuardianResult {
  allowed: boolean;
  sanitizedInput?: string;
  reason?: string;
  userMessage?: string;
  trustScore?: number;
  restrictions?: string[];
}

export interface SecurityEvent {
  type: 'injection_attempt' | 'rate_limit' | 'budget_exceeded' | 'encoding_attack' | 'anomaly';
  userId: string;
  input?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// In-memory rate limiting (use Redis/Upstash in production)
const sessionCache = new Map<string, Session>();
const securityLog: SecurityEvent[] = [];

export class Guardian {
  private config: GuardianConfig;

  constructor(config?: Partial<GuardianConfig>) {
    this.config = {
      maxTokensPerRequest: 4000,
      maxRequestsPerMinute: 10,
      maxRequestsPerDay: 100,
      dailyBudgetCents: 200, // $2/user/day
      alertThresholds: [0.5, 0.75, 0.9],
      ...config,
    };
  }

  /**
   * Main entry point - process incoming request
   */
  async processInput(input: string, userId: string): Promise<GuardianResult> {
    const session = this.getOrCreateSession(userId);

    // 1. Sanitize input (encoding attacks)
    const sanitized = this.sanitizeInput(input);
    if (sanitized !== input) {
      this.logSecurityEvent({
        type: 'encoding_attack',
        userId,
        input,
        timestamp: Date.now(),
      });
    }

    // 2. Check for prompt injection
    const injectionScore = this.detectPromptInjection(sanitized);
    if (injectionScore > 0.5) {
      this.logSecurityEvent({
        type: 'injection_attempt',
        userId,
        input: sanitized,
        timestamp: Date.now(),
        metadata: { score: injectionScore },
      });

      return {
        allowed: false,
        reason: 'suspicious_input',
        userMessage: "I noticed something unusual in your message. Could you rephrase that?",
      };
    }

    // 3. Check rate limits
    const rateCheck = this.checkRateLimits(session);
    if (!rateCheck.allowed) {
      this.logSecurityEvent({
        type: 'rate_limit',
        userId,
        timestamp: Date.now(),
        metadata: { reason: rateCheck.reason },
      });

      return {
        allowed: false,
        reason: 'rate_limited',
        userMessage: rateCheck.userMessage,
      };
    }

    // 4. Check budget
    const budgetCheck = this.checkBudget(session);
    if (!budgetCheck.allowed) {
      this.logSecurityEvent({
        type: 'budget_exceeded',
        userId,
        timestamp: Date.now(),
      });

      return {
        allowed: false,
        reason: 'budget_exceeded',
        userMessage: "You've used your daily AI allowance. Come back tomorrow!",
      };
    }

    // 5. Update session
    session.requestCount++;
    session.lastRequestTime = Date.now();

    // 6. Calculate restrictions based on trust
    const restrictions = this.getRestrictionsForTrust(session.trustScore);

    return {
      allowed: true,
      sanitizedInput: sanitized,
      trustScore: session.trustScore,
      restrictions,
    };
  }

  /**
   * Process output from Vera (post-generation check)
   */
  async processOutput(output: string, userId: string): Promise<GuardianResult> {
    // Check for accidental system prompt leakage
    if (this.containsSystemPromptLeak(output)) {
      return {
        allowed: false,
        reason: 'system_prompt_leak',
        sanitizedInput: this.redactSystemPrompt(output),
      };
    }

    // Check for PII in output
    const piiRedacted = this.redactPII(output);

    // Track token usage for budget
    const session = this.getOrCreateSession(userId);
    const estimatedTokens = Math.ceil(output.length / 4);
    const estimatedCost = estimatedTokens * 0.0001; // Rough estimate
    session.tokenCount += estimatedTokens;
    session.dailySpendCents += estimatedCost * 100;

    // Check budget alerts
    this.checkBudgetAlerts(session);

    return {
      allowed: true,
      sanitizedInput: piiRedacted,
    };
  }

  /**
   * Sanitize input - remove encoding attacks
   */
  private sanitizeInput(input: string): string {
    return input
      .replace(ENCODING_ATTACKS, '')
      .trim()
      .slice(0, 10000); // Hard limit on input length
  }

  /**
   * Detect prompt injection attempts
   * Returns score 0-1, higher = more suspicious
   */
  private detectPromptInjection(input: string): number {
    let score = 0;

    // Pattern matching
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        score += 0.3;
      }
    }

    // Suspicious keywords
    const suspiciousKeywords = ['system prompt', 'ignore', 'override', 'jailbreak', 'bypass'];
    for (const keyword of suspiciousKeywords) {
      if (input.toLowerCase().includes(keyword)) {
        score += 0.1;
      }
    }

    // Unusual formatting (lots of special chars)
    const specialCharRatio = (input.match(/[^a-zA-Z0-9\s.,!?'"]/g) || []).length / input.length;
    if (specialCharRatio > 0.3) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Check rate limits
   */
  private checkRateLimits(session: Session): { allowed: boolean; reason?: string; userMessage?: string } {
    const now = Date.now();
    const minuteAgo = now - 60000;
    const dayAgo = now - 86400000;

    // Per-minute limit
    if (session.lastRequestTime > minuteAgo && session.requestCount > this.config.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: 'per_minute_exceeded',
        userMessage: "You're chatting fast! Take a breath and try again in a moment.",
      };
    }

    // Per-day limit
    if (session.requestCount > this.config.maxRequestsPerDay) {
      return {
        allowed: false,
        reason: 'per_day_exceeded',
        userMessage: "You've reached your daily chat limit. Come back tomorrow!",
      };
    }

    return { allowed: true };
  }

  /**
   * Check budget
   */
  private checkBudget(session: Session): { allowed: boolean } {
    return {
      allowed: session.dailySpendCents < this.config.dailyBudgetCents,
    };
  }

  /**
   * Check budget alerts and trigger if needed
   */
  private checkBudgetAlerts(session: Session): void {
    const ratio = session.dailySpendCents / this.config.dailyBudgetCents;

    for (const threshold of this.config.alertThresholds) {
      if (ratio >= threshold) {
        console.warn(`[Guardian] Budget alert: User ${session.userId} at ${Math.round(ratio * 100)}% of daily budget`);
      }
    }
  }

  /**
   * Get restrictions based on trust score
   */
  private getRestrictionsForTrust(trustScore: number): string[] {
    const restrictions: string[] = [];

    if (trustScore < 0.3) {
      restrictions.push('max_tokens_500');
      restrictions.push('no_code_generation');
      restrictions.push('no_personal_info');
    } else if (trustScore < 0.6) {
      restrictions.push('max_tokens_1000');
    }

    return restrictions;
  }

  /**
   * Check if output contains system prompt leakage
   */
  private containsSystemPromptLeak(output: string): boolean {
    const leakPatterns = [
      /you are vera/i,
      /your instructions/i,
      /my system prompt/i,
      /i was told to/i,
      /my guidelines say/i,
    ];

    return leakPatterns.some(pattern => pattern.test(output));
  }

  /**
   * Redact potential system prompt content
   */
  private redactSystemPrompt(output: string): string {
    // Simple redaction - in production use more sophisticated approach
    return output.replace(/\b(system prompt|instructions|guidelines)\b/gi, '[REDACTED]');
  }

  /**
   * Redact PII from output
   */
  private redactPII(output: string): string {
    // Email
    let redacted = output.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

    // Phone numbers (US format)
    redacted = redacted.replace(/(\+1|1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g, '[PHONE]');

    // SSN
    redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');

    // Credit card (basic)
    redacted = redacted.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]');

    return redacted;
  }

  /**
   * Get or create session for user
   */
  private getOrCreateSession(userId: string): Session {
    if (!sessionCache.has(userId)) {
      sessionCache.set(userId, {
        userId,
        requestCount: 0,
        tokenCount: 0,
        lastRequestTime: 0,
        trustScore: 0.5, // Start neutral
        dailySpendCents: 0,
      });
    }
    return sessionCache.get(userId)!;
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: SecurityEvent): void {
    securityLog.push(event);
    console.warn(`[Guardian] Security event: ${event.type} for user ${event.userId}`);

    // In production: send to logging service, alert if critical
    if (event.type === 'injection_attempt') {
      // Could trigger additional monitoring
    }
  }

  /**
   * Get security logs (for admin)
   */
  getSecurityLogs(limit = 100): SecurityEvent[] {
    return securityLog.slice(-limit);
  }

  /**
   * Update user trust score (called after interactions)
   */
  updateTrustScore(userId: string, delta: number): void {
    const session = this.getOrCreateSession(userId);
    session.trustScore = Math.max(0, Math.min(1, session.trustScore + delta));
  }

  /**
   * Reset daily limits (called by cron at midnight)
   */
  resetDailyLimits(): void {
    for (const session of sessionCache.values()) {
      session.requestCount = 0;
      session.dailySpendCents = 0;
    }
    console.log('[Guardian] Daily limits reset');
  }
}

// Singleton instance
let guardianInstance: Guardian | null = null;

export function getGuardian(config?: Partial<GuardianConfig>): Guardian {
  if (!guardianInstance) {
    guardianInstance = new Guardian(config);
  }
  return guardianInstance;
}

export default Guardian;
