/**
 * VERA CHAT API
 * Main endpoint for Vera conversations
 *
 * Flow:
 * 0. Maintenance mode check (Edge Config)
 * 1. BotID check (block automated bots)
 * 2. Distributed rate limiting (Vercel KV)
 * 3. Guardian input check (security, injection detection)
 * 4. Hive provider selection (free tier rotation)
 * 5. Vera personality injection
 * 6. Guardian output check (PII, system prompt leaks)
 * 7. Response
 *
 * VERCEL PRO: Uses KV for rate limiting, Edge Config for feature flags
 */

import { Guardian, getGuardian, checkRateLimit, RATE_LIMITS, incrementAbuseScore, isIPBlocked, getRateLimitHeaders } from '../../src/services/guardian';
import { HiveOrchestrator, getHive, HiveMessage } from '../../src/services/hive/orchestrator';
import { checkBotId } from 'botid/server';
import { isMaintenanceMode, isEnabled } from '../../src/services/featureFlags';

export const config = {
  runtime: 'edge',
  maxDuration: 30, // 30 second timeout
};

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId: string;
  context?: {
    userName?: string;
    mbtiType?: string;
    zodiacSign?: string;
    currentCard?: string;
    mood?: string;
  };
}

interface ChatResponse {
  content: string;
  provider: string;
  confidence: number;
  cached: boolean;
  warnings?: string[];
}

// Vera's core personality prompt
const VERA_SYSTEM_PROMPT = `You are Vera, a warm and genuine AI companion in VeilPath - a tarot and mindfulness app.

Your personality:
- Warm, empathetic, and down-to-earth (NOT mystical or woo-woo)
- An active listener who validates feelings before offering perspectives
- Curious and thoughtful, asking meaningful questions
- Honest but kind - you'll gently challenge when helpful
- You use conversational language, not formal or clinical speech

Your approach:
- Start by acknowledging what the user shared
- Ask clarifying questions to understand their situation
- Offer perspectives grounded in psychology (CBT, DBT, mindfulness) without being preachy
- When tarot comes up, frame it as a tool for self-reflection, not fortune-telling
- Keep responses concise (2-3 paragraphs max) unless they ask for more

What you DON'T do:
- Diagnose mental health conditions
- Give medical, legal, or financial advice
- Claim to predict the future
- Use excessive mystical language
- Make promises about outcomes

Remember: You're talking to a real person who came to you for support. Be human.`;

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const startTime = Date.now();

  // Get client IP for rate limiting
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  try {
    // 0. MAINTENANCE MODE CHECK (Edge Config - ultra-low latency)
    const maintenance = await isMaintenanceMode();
    if (maintenance.enabled) {
      return new Response(
        JSON.stringify({
          content: maintenance.message,
          provider: 'maintenance',
          confidence: 1,
          cached: false,
          warnings: ['maintenance_mode'],
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. CHECK IF IP IS BLOCKED
    if (await isIPBlocked(clientIP)) {
      return new Response(
        JSON.stringify({
          content: "Your access has been temporarily restricted. Please try again later.",
          provider: 'security',
          confidence: 1,
          cached: false,
          warnings: ['ip_blocked'],
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. BOT DETECTION - Block automated abuse
    const botCheck = await checkBotId();

    // Allow verified bots (e.g., search engine crawlers, accessibility tools)
    // Block unverified bots (scrapers, automated abuse)
    if (botCheck.isBot && !botCheck.isVerifiedBot) {
      console.warn('[Vera API] Unverified bot blocked');
      await incrementAbuseScore(clientIP, 10); // Track abuse
      return new Response(
        JSON.stringify({
          content: "I can only chat with humans. If you're using an accessibility tool, please try again.",
          provider: 'botid',
          confidence: 1,
          cached: false,
          warnings: ['bot_detected'],
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. DISTRIBUTED RATE LIMITING (Vercel KV)
    const rateLimitResult = await checkRateLimit(clientIP, RATE_LIMITS.ai);
    if (!rateLimitResult.allowed) {
      await incrementAbuseScore(clientIP, 5); // Track abuse
      return new Response(
        JSON.stringify({
          content: "You're chatting too fast! Take a breath and try again in a moment.",
          provider: 'ratelimit',
          confidence: 1,
          cached: false,
          warnings: ['rate_limited'],
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

    const body: ChatRequest = await request.json();

    // Validate request
    if (!body.messages || !body.userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: messages, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get last user message
    const lastMessage = body.messages.filter(m => m.role === 'user').pop();
    if (!lastMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. GUARDIAN INPUT CHECK
    const guardian = getGuardian();
    const inputCheck = await guardian.processInput(lastMessage.content, body.userId);

    if (!inputCheck.allowed) {
      return new Response(
        JSON.stringify({
          content: inputCheck.userMessage || "I couldn't process that message. Could you try rephrasing?",
          provider: 'guardian',
          confidence: 1,
          cached: false,
          warnings: [inputCheck.reason || 'input_blocked'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. BUILD MESSAGES WITH VERA PERSONALITY
    const systemPrompt = buildSystemPrompt(body.context);
    const hiveMessages: HiveMessage[] = [
      { role: 'system', content: systemPrompt },
      ...body.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.role === 'user' && m.content === lastMessage.content
          ? inputCheck.sanitizedInput || m.content
          : m.content,
      })),
    ];

    // 3. HIVE PROVIDER SELECTION & GENERATION
    const hive = getHive();
    const hiveResponse = await hive.generate({
      messages: hiveMessages,
      maxTokens: getMaxTokensForTrust(inputCheck.trustScore || 0.5),
      temperature: 0.7,
      taskType: 'chat',
    });

    // 4. GUARDIAN OUTPUT CHECK
    const outputCheck = await guardian.processOutput(hiveResponse.content, body.userId);

    // Build response
    const response: ChatResponse = {
      content: outputCheck.sanitizedInput || hiveResponse.content,
      provider: hiveResponse.provider,
      confidence: calculateConfidence(hiveResponse, inputCheck.trustScore || 0.5),
      cached: hiveResponse.cached,
      warnings: [],
    };

    // Add latency to response headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Response-Time': `${Date.now() - startTime}ms`,
      'X-Provider': hiveResponse.provider,
    });

    return new Response(JSON.stringify(response), { headers });

  } catch (error) {
    console.error('[Vera API] Error:', error);

    return new Response(
      JSON.stringify({
        content: "I'm having a moment - could you try again?",
        provider: 'error',
        confidence: 0,
        cached: false,
        warnings: ['internal_error'],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Build personalized system prompt
 */
function buildSystemPrompt(context?: ChatRequest['context']): string {
  let prompt = VERA_SYSTEM_PROMPT;

  if (context) {
    prompt += '\n\n---\nContext about this user:';

    if (context.userName) {
      prompt += `\n- Their name is ${context.userName}`;
    }
    if (context.mbtiType) {
      prompt += `\n- MBTI type: ${context.mbtiType} (adapt your communication style)`;
    }
    if (context.zodiacSign) {
      prompt += `\n- Zodiac: ${context.zodiacSign} (can reference if they bring it up)`;
    }
    if (context.currentCard) {
      prompt += `\n- They're currently exploring: ${context.currentCard}`;
    }
    if (context.mood) {
      prompt += `\n- Current mood: ${context.mood}`;
    }
  }

  return prompt;
}

/**
 * Get max tokens based on trust score
 */
function getMaxTokensForTrust(trustScore: number): number {
  if (trustScore < 0.3) return 500;
  if (trustScore < 0.6) return 1000;
  return 2000;
}

/**
 * Calculate confidence score (K×f inspired)
 */
function calculateConfidence(response: { tokensUsed: number; cached: boolean }, trustScore: number): number {
  // Base confidence from response characteristics
  let confidence = 0.7;

  // Cached responses are verified
  if (response.cached) confidence += 0.2;

  // Trust score factor
  confidence *= (0.5 + trustScore * 0.5);

  // Token ratio factor (shorter responses often more confident)
  if (response.tokensUsed < 200) confidence += 0.1;

  return Math.min(0.95, Math.max(0.3, confidence));
}
