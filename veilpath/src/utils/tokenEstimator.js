/**
 * TOKEN ESTIMATION UTILITY
 *
 * Provides rough token count estimation for LLM inputs.
 * Helps users understand their token usage before sending messages.
 *
 * IMPORTANT: These are ESTIMATES, not exact counts.
 * Different LLMs tokenize differently (GPT vs Llama vs Phi-3).
 * We use a conservative approximation: ~4 characters = 1 token.
 */

/**
 * Estimate token count from text
 * @param {string} text - The text to estimate tokens for
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;

  // Remove extra whitespace
  const cleanText = text.trim();
  if (cleanText.length === 0) return 0;

  // Conservative estimation: ~4 characters per token
  // This accounts for:
  // - English text averages 4-5 chars/token
  // - Code/technical text can be 2-3 chars/token
  // - Whitespace and punctuation
  const charCount = cleanText.length;
  const baseTokens = Math.ceil(charCount / 4);

  // Add token overhead for:
  // - Whitespace (words are typically 1 token each minimum)
  const words = cleanText.split(/\s+/).length;
  const wordTokens = words * 0.3; // ~30% overhead for word boundaries

  return Math.ceil(baseTokens + wordTokens);
}

/**
 * Estimate total prompt size including system prompt and context
 * @param {string} userInput - Current user input
 * @param {Array} contextMessages - Previous messages in conversation
 * @param {string} systemPrompt - System prompt text
 * @param {Object} userProfile - User profile data
 * @returns {Object} Token breakdown { input, context, system, total }
 */
export function estimatePromptSize(userInput, contextMessages = [], systemPrompt = '', userProfile = null) {
  // User input tokens
  const inputTokens = estimateTokens(userInput);

  // System prompt tokens
  const systemTokens = estimateTokens(systemPrompt);

  // User profile context tokens
  let profileTokens = 0;
  if (userProfile) {
    const profileText = `Name: ${userProfile.name || 'Seeker'}\nZodiac: ${userProfile.zodiacSign || 'Unknown'}\nMBTI: ${userProfile.mbtiType || 'Unknown'}`;
    profileTokens = estimateTokens(profileText);
  }

  // Context messages tokens
  const contextText = contextMessages
    .map(msg => msg.content || '')
    .join('\n\n');
  const contextTokens = estimateTokens(contextText);

  // Total estimated tokens
  const total = inputTokens + systemTokens + profileTokens + contextTokens;

  return {
    input: inputTokens,
    context: contextTokens,
    system: systemTokens + profileTokens,
    total: total
  };
}

/**
 * Calculate complexity level based on token count and context size
 * @param {number} tokenCount - Total estimated tokens
 * @param {number} contextMessageCount - Number of context messages
 * @returns {Object} { level: 'low'|'medium'|'high'|'extreme', color, label }
 */
export function calculateComplexity(tokenCount, contextMessageCount) {
  // Complexity factors:
  // 1. Total token count
  // 2. Number of context messages (more context = higher complexity)

  const contextWeight = contextMessageCount * 50; // Each message adds ~50 tokens of "complexity"
  const effectiveComplexity = tokenCount + contextWeight;

  if (effectiveComplexity < 500) {
    return {
      level: 'low',
      color: '#00ff00', // Green
      label: 'SIMPLE',
      description: 'Quick response expected'
    };
  } else if (effectiveComplexity < 1000) {
    return {
      level: 'medium',
      color: '#ffff00', // Yellow
      label: 'MODERATE',
      description: 'Standard complexity'
    };
  } else if (effectiveComplexity < 2000) {
    return {
      level: 'high',
      color: '#ff8800', // Orange
      label: 'COMPLEX',
      description: 'Longer processing time'
    };
  } else {
    return {
      level: 'extreme',
      color: '#ff0000', // Red
      label: 'HEAVY',
      description: 'Very high token usage'
    };
  }
}

/**
 * Get token usage warning based on limits
 * @param {number} tokenCount - Current token count
 * @param {number} maxTokens - Maximum token limit (e.g., 4096 for Phi-3)
 * @returns {Object|null} Warning object or null if no warning
 */
export function getTokenWarning(tokenCount, maxTokens) {
  const percentage = (tokenCount / maxTokens) * 100;

  if (percentage >= 90) {
    return {
      level: 'critical',
      color: '#ff0000',
      message: 'CRITICAL: Near token limit! Response may fail.',
      percentage: Math.round(percentage)
    };
  } else if (percentage >= 75) {
    return {
      level: 'warning',
      color: '#ff8800',
      message: 'WARNING: High token usage. Consider shortening.',
      percentage: Math.round(percentage)
    };
  } else if (percentage >= 60) {
    return {
      level: 'caution',
      color: '#ffff00',
      message: 'CAUTION: Moderate token usage.',
      percentage: Math.round(percentage)
    };
  }

  return null; // No warning needed
}

/**
 * Get tips for reducing token usage
 * @param {string} level - Complexity level
 * @returns {Array<string>} Tips for the user
 */
export function getTokenTips(level) {
  const commonTips = [
    'Shorter messages = faster responses',
    'Vera has limited memory (last 5 messages)',
    'Clear chat to reset token count'
  ];

  const levelTips = {
    low: [
      'You\'re good! Keep messages concise.',
      ...commonTips
    ],
    medium: [
      'Consider breaking complex questions into parts',
      ...commonTips
    ],
    high: [
      'Try shortening your message',
      'Clear chat history to reduce context',
      ...commonTips
    ],
    extreme: [
      '⚠️ Clear chat history NOW',
      'Break your question into smaller parts',
      'Remove unnecessary details',
      ...commonTips
    ]
  };

  return levelTips[level] || commonTips;
}
