/**
 * HIVE ORCHESTRATOR
 * Multi-provider LLM orchestration with free tier rotation
 *
 * Maximizes value from free tiers across providers:
 * - Anthropic (Claude)
 * - Google (Gemini)
 * - Groq (Llama/Mixtral)
 * - Together.ai (open models)
 * - xAI Grok (paid fallback - $100 credit)
 * - Vercel AI Gateway (unified fallback)
 * - Local (Ollama)
 */

export interface LLMProvider {
  id: string;
  name: string;
  endpoint: string;
  model: string;
  freeLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerMonth: number;
  };
  currentUsage: {
    requestsThisMinute: number;
    requestsToday: number;
    tokensThisMonth: number;
    lastRequestTime: number;
    lastResetDay: number;
    lastResetMonth: number;
  };
  capabilities: {
    maxTokens: number;
    supportsStreaming: boolean;
    supportsVision: boolean;
    speed: 'fast' | 'medium' | 'slow';
    quality: 'high' | 'medium' | 'low';
  };
  apiKeyEnv: string;
  enabled: boolean;
}

export interface HiveMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface HiveRequest {
  messages: HiveMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  preferredProvider?: string;
  taskType?: 'chat' | 'analysis' | 'creative' | 'code';
}

export interface HiveResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
  cached: boolean;
}

// Provider configurations
const PROVIDERS: LLMProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307',
    freeLimit: {
      requestsPerMinute: 5,
      requestsPerDay: 100,
      tokensPerMonth: 100000,
    },
    currentUsage: {
      requestsThisMinute: 0,
      requestsToday: 0,
      tokensThisMonth: 0,
      lastRequestTime: 0,
      lastResetDay: 0,
      lastResetMonth: 0,
    },
    capabilities: {
      maxTokens: 4096,
      supportsStreaming: true,
      supportsVision: true,
      speed: 'medium',
      quality: 'high',
    },
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    enabled: true,
  },
  {
    id: 'google',
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-pro',
    freeLimit: {
      requestsPerMinute: 15,
      requestsPerDay: 1500,
      tokensPerMonth: 1000000,
    },
    currentUsage: {
      requestsThisMinute: 0,
      requestsToday: 0,
      tokensThisMonth: 0,
      lastRequestTime: 0,
      lastResetDay: 0,
      lastResetMonth: 0,
    },
    capabilities: {
      maxTokens: 8192,
      supportsStreaming: true,
      supportsVision: true,
      speed: 'fast',
      quality: 'medium',
    },
    apiKeyEnv: 'GOOGLE_AI_API_KEY',
    enabled: true,
  },
  {
    id: 'groq',
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-70b-versatile',
    freeLimit: {
      requestsPerMinute: 30,
      requestsPerDay: 14400,
      tokensPerMonth: 500000,
    },
    currentUsage: {
      requestsThisMinute: 0,
      requestsToday: 0,
      tokensThisMonth: 0,
      lastRequestTime: 0,
      lastResetDay: 0,
      lastResetMonth: 0,
    },
    capabilities: {
      maxTokens: 8000,
      supportsStreaming: true,
      supportsVision: false,
      speed: 'fast',
      quality: 'medium',
    },
    apiKeyEnv: 'GROQ_API_KEY',
    enabled: true,
  },
  {
    id: 'together',
    name: 'Together.ai',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    freeLimit: {
      requestsPerMinute: 10,
      requestsPerDay: 1000,
      tokensPerMonth: 250000,
    },
    currentUsage: {
      requestsThisMinute: 0,
      requestsToday: 0,
      tokensThisMonth: 0,
      lastRequestTime: 0,
      lastResetDay: 0,
      lastResetMonth: 0,
    },
    capabilities: {
      maxTokens: 4096,
      supportsStreaming: true,
      supportsVision: false,
      speed: 'medium',
      quality: 'medium',
    },
    apiKeyEnv: 'TOGETHER_API_KEY',
    enabled: true,
  },
  // xAI Grok - Paid fallback with $100 credit
  {
    id: 'xai',
    name: 'xAI Grok',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-beta',
    freeLimit: {
      // Paid tier - high limits (budget-constrained by xAI console)
      requestsPerMinute: 60,
      requestsPerDay: 10000,
      tokensPerMonth: 10000000, // ~$100 worth
    },
    currentUsage: {
      requestsThisMinute: 0,
      requestsToday: 0,
      tokensThisMonth: 0,
      lastRequestTime: 0,
      lastResetDay: 0,
      lastResetMonth: 0,
    },
    capabilities: {
      maxTokens: 8192,
      supportsStreaming: true,
      supportsVision: false,
      speed: 'fast',
      quality: 'high',
    },
    apiKeyEnv: 'XAI_GROK_KEY',
    enabled: true,
  },
  // Vercel AI Gateway - Unified fallback (routes to best available)
  {
    id: 'gateway',
    name: 'Vercel AI Gateway',
    endpoint: 'https://ai-gateway.vercel.sh/v1/chat/completions',
    model: 'anthropic/claude-3-haiku', // Default model, can be overridden
    freeLimit: {
      // Uses configured providers - inherit their limits
      requestsPerMinute: 100,
      requestsPerDay: 50000,
      tokensPerMonth: 50000000,
    },
    currentUsage: {
      requestsThisMinute: 0,
      requestsToday: 0,
      tokensThisMonth: 0,
      lastRequestTime: 0,
      lastResetDay: 0,
      lastResetMonth: 0,
    },
    capabilities: {
      maxTokens: 8192,
      supportsStreaming: true,
      supportsVision: true,
      speed: 'fast',
      quality: 'high',
    },
    apiKeyEnv: 'AI_GATEWAY_API_KEY',
    enabled: true,
  },
];

export class HiveOrchestrator {
  private providers: LLMProvider[];
  private responseCache: Map<string, { response: HiveResponse; timestamp: number }>;
  private cacheMaxAge = 1000 * 60 * 5; // 5 minutes

  constructor() {
    this.providers = PROVIDERS.map(p => ({ ...p }));
    this.responseCache = new Map();

    // Reset usage counters on init
    this.resetUsageCounters();
  }

  /**
   * Main entry point - generate completion
   * Robust error handling: tries ALL available providers before failing
   */
  async generate(request: HiveRequest): Promise<HiveResponse> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.getCacheKey(request);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Track failed providers for fallback chain
    const failedProviders: string[] = [];
    const errors: Array<{ provider: string; error: string; code?: number }> = [];

    // Try providers until one succeeds or all fail
    while (true) {
      const provider = this.selectProvider(request, failedProviders);

      if (!provider) {
        // All providers exhausted - build detailed error message
        const errorSummary = errors.map(e => `${e.provider}: ${e.error}`).join('; ');
        console.error('[Hive] All providers failed:', errorSummary);
        throw new Error(`All AI providers unavailable. Tried: ${errorSummary}`);
      }

      try {
        const response = await this.callProvider(provider, request);

        // Update usage
        this.updateUsage(provider, response.tokensUsed);

        // Cache response
        this.setCache(cacheKey, response);

        // Log if we had to fallback
        if (failedProviders.length > 0) {
          console.log(`[Hive] Succeeded with ${provider.id} after ${failedProviders.length} failures`);
        }

        return {
          ...response,
          latencyMs: Date.now() - startTime,
          cached: false,
        };
      } catch (error: any) {
        // Parse error for better handling
        const errorInfo = this.parseProviderError(error, provider.id);
        errors.push(errorInfo);
        failedProviders.push(provider.id);

        console.warn(`[Hive] Provider ${provider.id} failed (${errorInfo.code || 'unknown'}): ${errorInfo.error}`);

        // Temporarily disable provider based on error type
        this.handleProviderError(provider, errorInfo);

        // Continue to next provider (loop will select next best)
      }
    }
  }

  /**
   * Parse provider error into structured format
   */
  private parseProviderError(error: any, providerId: string): { provider: string; error: string; code?: number } {
    const message = error?.message || String(error);

    // Extract HTTP status code if present
    const codeMatch = message.match(/(\d{3})/);
    const code = codeMatch ? parseInt(codeMatch[1]) : undefined;

    // Friendly error messages
    let friendlyError = message;
    if (code === 401) friendlyError = 'Invalid API key';
    else if (code === 403) friendlyError = 'Access forbidden';
    else if (code === 404) friendlyError = 'Model not found';
    else if (code === 429) friendlyError = 'Rate limited';
    else if (code === 500) friendlyError = 'Server error';
    else if (code === 502 || code === 503) friendlyError = 'Service unavailable';
    else if (message.includes('timeout')) friendlyError = 'Request timeout';
    else if (message.includes('network')) friendlyError = 'Network error';

    return { provider: providerId, error: friendlyError, code };
  }

  /**
   * Handle provider errors - temporarily disable or adjust quotas
   */
  private handleProviderError(provider: LLMProvider, errorInfo: { code?: number }): void {
    // Rate limited (429) - mark as quota exhausted for this minute
    if (errorInfo.code === 429) {
      provider.currentUsage.requestsThisMinute = provider.freeLimit.requestsPerMinute;
      console.log(`[Hive] Provider ${provider.id} rate limited, marking quota exhausted`);
    }

    // Server errors (500-503) - temporarily reduce score by marking heavy usage
    if (errorInfo.code && errorInfo.code >= 500) {
      provider.currentUsage.requestsToday += 100; // Artificial penalty
      console.log(`[Hive] Provider ${provider.id} server error, temporarily deprioritized`);
    }

    // Auth errors (401/403) - disable provider for this session
    if (errorInfo.code === 401 || errorInfo.code === 403) {
      provider.enabled = false;
      console.error(`[Hive] Provider ${provider.id} auth failed, disabled for session`);
    }
  }

  /**
   * Select best available provider based on request and quotas
   */
  private selectProvider(request: HiveRequest, exclude: string[] = []): LLMProvider | null {
    // Reset counters if needed
    this.resetUsageCounters();

    // Filter available providers
    const available = this.providers.filter(p => {
      if (!p.enabled) return false;
      if (exclude.includes(p.id)) return false;
      if (!this.hasApiKey(p)) return false;
      if (!this.hasQuota(p)) return false;
      return true;
    });

    if (available.length === 0) return null;

    // If preferred provider specified and available, use it
    if (request.preferredProvider) {
      const preferred = available.find(p => p.id === request.preferredProvider);
      if (preferred) return preferred;
    }

    // Score providers based on task type and availability
    const scored = available.map(p => ({
      provider: p,
      score: this.scoreProvider(p, request),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored[0].provider;
  }

  /**
   * Score provider for a given request
   * Priority: Free tiers first, then paid (xAI), then gateway as last resort
   * All providers still go through Guardian for input/output validation at API layer
   */
  private scoreProvider(provider: LLMProvider, request: HiveRequest): number {
    let score = 0;

    // FREE TIER PRIORITY - Prefer free providers over paid
    const freeProviders = ['anthropic', 'google', 'groq', 'together'];
    if (freeProviders.includes(provider.id)) {
      score += 50; // Strong preference for free tiers
    }

    // PAID FALLBACK PENALTY - Use xAI only when free tiers exhausted
    if (provider.id === 'xai') {
      score -= 30; // Deprioritize paid provider (but still available)
    }

    // GATEWAY LAST RESORT - Only use when all else fails
    if (provider.id === 'gateway') {
      score -= 50; // Strong penalty - last resort only
    }

    // Quota availability (more quota = higher score)
    const minuteQuotaRemaining = provider.freeLimit.requestsPerMinute - provider.currentUsage.requestsThisMinute;
    const dayQuotaRemaining = provider.freeLimit.requestsPerDay - provider.currentUsage.requestsToday;
    score += (minuteQuotaRemaining / provider.freeLimit.requestsPerMinute) * 30;
    score += (dayQuotaRemaining / provider.freeLimit.requestsPerDay) * 20;

    // Quality preference based on task
    if (request.taskType === 'analysis' || request.taskType === 'creative') {
      if (provider.capabilities.quality === 'high') score += 25;
      else if (provider.capabilities.quality === 'medium') score += 15;
    }

    // Speed preference for chat
    if (request.taskType === 'chat') {
      if (provider.capabilities.speed === 'fast') score += 20;
      else if (provider.capabilities.speed === 'medium') score += 10;
    }

    // Anthropic bonus for quality-sensitive tasks
    if (provider.id === 'anthropic' && (request.taskType === 'analysis' || request.taskType === 'creative')) {
      score += 15;
    }

    // Groq bonus for speed
    if (provider.id === 'groq' && request.taskType === 'chat') {
      score += 15;
    }

    // xAI Grok bonus for quality when used as fallback (still goes through Guardian)
    if (provider.id === 'xai' && request.taskType === 'creative') {
      score += 10;
    }

    return score;
  }

  /**
   * Check if provider has API key configured
   */
  private hasApiKey(provider: LLMProvider): boolean {
    const key = process.env[provider.apiKeyEnv];
    return !!key && key.length > 0;
  }

  /**
   * Check if provider has remaining quota
   */
  private hasQuota(provider: LLMProvider): boolean {
    const usage = provider.currentUsage;
    const limits = provider.freeLimit;

    return (
      usage.requestsThisMinute < limits.requestsPerMinute &&
      usage.requestsToday < limits.requestsPerDay &&
      usage.tokensThisMonth < limits.tokensPerMonth
    );
  }

  /**
   * Call the selected provider
   */
  private async callProvider(provider: LLMProvider, request: HiveRequest): Promise<HiveResponse> {
    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey) {
      throw new Error(`No API key for ${provider.id}`);
    }

    switch (provider.id) {
      case 'anthropic':
        return this.callAnthropic(provider, request, apiKey);
      case 'google':
        return this.callGoogle(provider, request, apiKey);
      case 'groq':
      case 'together':
      case 'xai':
        return this.callOpenAICompatible(provider, request, apiKey);
      case 'gateway':
        return this.callAIGateway(provider, request, apiKey);
      default:
        throw new Error(`Unknown provider: ${provider.id}`);
    }
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    provider: LLMProvider,
    request: HiveRequest,
    apiKey: string
  ): Promise<HiveResponse> {
    const systemMessage = request.messages.find(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: request.maxTokens || 1024,
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      provider: provider.id,
      model: provider.model,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
      latencyMs: 0,
      cached: false,
    };
  }

  /**
   * Call Google Gemini API
   */
  private async callGoogle(
    provider: LLMProvider,
    request: HiveRequest,
    apiKey: string
  ): Promise<HiveResponse> {
    const url = `${provider.endpoint}/${provider.model}:generateContent?key=${apiKey}`;

    // Convert messages to Gemini format
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Add system message as first user message if present
    const systemMessage = request.messages.find(m => m.role === 'system');
    if (systemMessage) {
      contents.unshift({
        role: 'user',
        parts: [{ text: `Instructions: ${systemMessage.content}` }],
      });
      contents.splice(1, 0, {
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }],
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: request.maxTokens || 1024,
          temperature: request.temperature || 0.7,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.candidates[0].content.parts[0].text,
      provider: provider.id,
      model: provider.model,
      tokensUsed: data.usageMetadata?.totalTokenCount || 500, // Estimate if not provided
      latencyMs: 0,
      cached: false,
    };
  }

  /**
   * Call OpenAI-compatible API (Groq, Together, etc.)
   */
  private async callOpenAICompatible(
    provider: LLMProvider,
    request: HiveRequest,
    apiKey: string
  ): Promise<HiveResponse> {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: request.messages,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${provider.id} error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      provider: provider.id,
      model: provider.model,
      tokensUsed: data.usage?.total_tokens || 500,
      latencyMs: 0,
      cached: false,
    };
  }

  /**
   * Call Vercel AI Gateway (unified fallback)
   * Routes through Gateway which handles provider selection/fallback
   * Note: All requests still go through Guardian at API layer for validation
   */
  private async callAIGateway(
    provider: LLMProvider,
    request: HiveRequest,
    apiKey: string
  ): Promise<HiveResponse> {
    // Select model based on task type
    let model = 'anthropic/claude-3-haiku'; // Default
    if (request.taskType === 'creative' || request.taskType === 'analysis') {
      model = 'anthropic/claude-sonnet-4-5-20250929';
    } else if (request.taskType === 'chat') {
      model = 'xai/grok-beta'; // Fast responses for chat
    }

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Gateway error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      provider: `gateway:${model}`,
      model,
      tokensUsed: data.usage?.total_tokens || 500,
      latencyMs: 0,
      cached: false,
    };
  }

  /**
   * Update usage counters
   */
  private updateUsage(provider: LLMProvider, tokens: number): void {
    provider.currentUsage.requestsThisMinute++;
    provider.currentUsage.requestsToday++;
    provider.currentUsage.tokensThisMonth += tokens;
    provider.currentUsage.lastRequestTime = Date.now();
  }

  /**
   * Reset usage counters based on time
   */
  private resetUsageCounters(): void {
    const now = Date.now();
    const today = new Date().getDate();
    const thisMonth = new Date().getMonth();

    for (const provider of this.providers) {
      // Reset per-minute counter after 1 minute
      if (now - provider.currentUsage.lastRequestTime > 60000) {
        provider.currentUsage.requestsThisMinute = 0;
      }

      // Reset daily counter at midnight
      if (provider.currentUsage.lastResetDay !== today) {
        provider.currentUsage.requestsToday = 0;
        provider.currentUsage.lastResetDay = today;
      }

      // Reset monthly counter
      if (provider.currentUsage.lastResetMonth !== thisMonth) {
        provider.currentUsage.tokensThisMonth = 0;
        provider.currentUsage.lastResetMonth = thisMonth;
      }
    }
  }

  /**
   * Cache helpers
   */
  private getCacheKey(request: HiveRequest): string {
    const key = JSON.stringify({
      messages: request.messages,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
    });
    return Buffer.from(key).toString('base64').slice(0, 64);
  }

  private getFromCache(key: string): HiveResponse | null {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.response;
    }
    return null;
  }

  private setCache(key: string, response: HiveResponse): void {
    this.responseCache.set(key, { response, timestamp: Date.now() });

    // Cleanup old cache entries
    if (this.responseCache.size > 1000) {
      const cutoff = Date.now() - this.cacheMaxAge;
      for (const [k, v] of this.responseCache.entries()) {
        if (v.timestamp < cutoff) {
          this.responseCache.delete(k);
        }
      }
    }
  }

  /**
   * Get current provider status (for monitoring)
   */
  getProviderStatus(): Array<{ id: string; available: boolean; quotaPercent: number }> {
    return this.providers.map(p => ({
      id: p.id,
      available: this.hasApiKey(p) && this.hasQuota(p) && p.enabled,
      quotaPercent: Math.round(
        (1 - p.currentUsage.requestsToday / p.freeLimit.requestsPerDay) * 100
      ),
    }));
  }
}

// Singleton instance
let hiveInstance: HiveOrchestrator | null = null;

export function getHive(): HiveOrchestrator {
  if (!hiveInstance) {
    hiveInstance = new HiveOrchestrator();
  }
  return hiveInstance;
}

export default HiveOrchestrator;
