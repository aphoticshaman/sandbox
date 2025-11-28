/**
 * FEATURE FLAGS via Vercel Edge Config
 * Ultra-low-latency feature flags for A/B testing and gradual rollouts
 *
 * Vercel Pro feature - globally replicated, <1ms reads
 *
 * Usage:
 * 1. Create Edge Config in Vercel Dashboard → Storage → Edge Config
 * 2. Add EDGE_CONFIG env var (auto-added when you connect)
 * 3. Set flags in dashboard, read them here
 */

import { createClient } from '@vercel/edge-config';

// Initialize Edge Config client
const edgeConfig = process.env.EDGE_CONFIG
  ? createClient(process.env.EDGE_CONFIG)
  : null;

// Default feature flags (used when Edge Config unavailable)
const DEFAULT_FLAGS = {
  // AI Features
  enableGrok: true,           // Use xAI Grok as fallback
  enableGateway: true,        // Use Vercel AI Gateway
  maxTokensPerRequest: 2000,  // Token limit for responses

  // Rate Limiting
  globalRateLimit: 100,       // Requests per minute per IP
  aiRateLimit: 20,            // AI requests per minute per user
  veraDaily: 100,             // Vera chats per day per user

  // Features
  enableVera: true,           // Vera chat enabled
  enableJournal: true,        // Journal feature enabled
  enableCosmetics: true,      // Cosmetics shop enabled
  enableQuests: true,         // Quest system enabled

  // Maintenance
  maintenanceMode: false,     // Show maintenance screen
  maintenanceMessage: '',     // Message to show during maintenance

  // A/B Tests
  newHomeScreen: false,       // New home screen design
  darkModeDefault: true,      // Default to dark mode

  // Provider Priority (JSON string)
  providerPriority: 'anthropic,groq,google,together,xai,gateway',
} as const;

export type FeatureFlags = typeof DEFAULT_FLAGS;

/**
 * Get a single feature flag value
 */
export async function getFlag<K extends keyof FeatureFlags>(
  key: K
): Promise<FeatureFlags[K]> {
  if (!edgeConfig) {
    return DEFAULT_FLAGS[key];
  }

  try {
    const value = await edgeConfig.get(key);
    return (value ?? DEFAULT_FLAGS[key]) as FeatureFlags[K];
  } catch (error) {
    console.warn(`[EdgeConfig] Failed to get ${key}:`, error);
    return DEFAULT_FLAGS[key];
  }
}

/**
 * Get all feature flags at once
 */
export async function getAllFlags(): Promise<FeatureFlags> {
  if (!edgeConfig) {
    return { ...DEFAULT_FLAGS };
  }

  try {
    const allValues = await edgeConfig.getAll();
    return { ...DEFAULT_FLAGS, ...allValues } as FeatureFlags;
  } catch (error) {
    console.warn('[EdgeConfig] Failed to get all flags:', error);
    return { ...DEFAULT_FLAGS };
  }
}

/**
 * Check if a feature is enabled
 */
export async function isEnabled(
  key: keyof FeatureFlags
): Promise<boolean> {
  const value = await getFlag(key);
  return Boolean(value);
}

/**
 * Check maintenance mode
 */
export async function isMaintenanceMode(): Promise<{
  enabled: boolean;
  message: string;
}> {
  const [enabled, message] = await Promise.all([
    getFlag('maintenanceMode'),
    getFlag('maintenanceMessage'),
  ]);

  return {
    enabled: Boolean(enabled),
    message: String(message || 'We are performing scheduled maintenance. Please check back soon!'),
  };
}

/**
 * Get rate limit config from flags
 */
export async function getRateLimitConfig(): Promise<{
  global: number;
  ai: number;
  veraDaily: number;
}> {
  const [global, ai, veraDaily] = await Promise.all([
    getFlag('globalRateLimit'),
    getFlag('aiRateLimit'),
    getFlag('veraDaily'),
  ]);

  return {
    global: Number(global) || 100,
    ai: Number(ai) || 20,
    veraDaily: Number(veraDaily) || 100,
  };
}

/**
 * Get provider priority from flags
 */
export async function getProviderPriority(): Promise<string[]> {
  const priority = await getFlag('providerPriority');
  return String(priority).split(',').map(s => s.trim());
}

/**
 * Check if user is in A/B test group
 * Uses user ID to deterministically assign group
 */
export function isInTestGroup(
  userId: string,
  testName: string,
  percentage: number = 50
): boolean {
  // Simple hash function for deterministic assignment
  const hash = userId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  // Convert to 0-100 range
  const bucket = Math.abs(hash % 100);

  return bucket < percentage;
}

export default {
  getFlag,
  getAllFlags,
  isEnabled,
  isMaintenanceMode,
  getRateLimitConfig,
  getProviderPriority,
  isInTestGroup,
};
