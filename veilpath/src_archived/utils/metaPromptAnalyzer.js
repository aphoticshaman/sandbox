/**
 * META-AWARE PROMPT ANALYSIS SYSTEM
 *
 * 4th wall breaking, meta-analytical prompt coaching.
 * Reads user's entire history (chats, readings, profile) and provides
 * real-time suggestions to improve their Oracle prompts.
 *
 * This is hardcore - it analyzes EVERYTHING to help users get deeper,
 * more personalized answers while conserving tokens.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Load all user data for meta-analysis
 * @returns {Promise<Object>} Complete user context
 */
async function loadCompleteUserContext() {
  try {
    const [
      profilesData,
      activeProfileId,
      readingsData,
      chatHistory,
      statsData
    ] = await Promise.all([
      AsyncStorage.getItem('@lunatiq_profiles'),
      AsyncStorage.getItem('@lunatiq_active_profile'),
      AsyncStorage.getItem('@lunatiq_readings'),
      AsyncStorage.getItem('@lunatiq_oracle_chat_history'),
      AsyncStorage.getItem('@lunatiq_stats')
    ]);

    // Parse data
    const profiles = profilesData ? JSON.parse(profilesData) : [];
    const activeProfile = profiles.find(p => p.id === activeProfileId) || null;
    const readings = readingsData ? JSON.parse(readingsData) : [];
    const chats = chatHistory ? JSON.parse(chatHistory) : [];
    const stats = statsData ? JSON.parse(statsData) : {};

    return {
      profile: activeProfile,
      readings: readings,
      chats: chats,
      stats: stats,
      totalReadings: readings.length,
      totalChats: chats.length
    };
  } catch (error) {
    console.error('[MetaAnalyzer] Error loading user context:', error);
    return {
      profile: null,
      readings: [],
      chats: [],
      stats: {},
      totalReadings: 0,
      totalChats: 0
    };
  }
}

/**
 * Analyze user's draft prompt and provide meta-aware suggestions
 * @param {string} draftPrompt - User's current input
 * @param {Array} currentConversation - Current chat messages
 * @param {Object} userContext - Complete user context from loadCompleteUserContext
 * @returns {Object} Analysis with suggestions
 */
export async function analyzePrompt(draftPrompt, currentConversation = [], userContext = null) {
  // Load context if not provided
  if (!userContext) {
    userContext = await loadCompleteUserContext();
  }

  const suggestions = [];
  const warnings = [];
  const opportunities = [];

  // Skip analysis if prompt is too short
  if (!draftPrompt || draftPrompt.trim().length < 3) {
    return {
      suggestions: [],
      warnings: [],
      opportunities: [],
      score: 0,
      canImprove: false
    };
  }

  const promptLower = draftPrompt.toLowerCase();
  const { profile, readings, chats } = userContext;

  // === TOKEN CONSERVATION CHECKS ===

  // CRITICAL: Check total context size and warn if approaching limits
  const MAX_CONTEXT_LIMIT = 4096; // Phi-3 context window
  const DANGER_THRESHOLD = 0.8; // 80% of limit
  const WARNING_THRESHOLD = 0.6; // 60% of limit

  // Rough token estimation for full conversation
  const conversationTokens = currentConversation.reduce((sum, msg) => {
    return sum + Math.ceil(msg.content.length / 4);
  }, 0);
  const systemTokens = 1000; // Approximate system prompt size
  const currentInputTokens = Math.ceil(draftPrompt.length / 4);
  const totalContextTokens = conversationTokens + systemTokens + currentInputTokens;
  const contextUsagePercent = totalContextTokens / MAX_CONTEXT_LIMIT;

  if (contextUsagePercent >= DANGER_THRESHOLD) {
    warnings.push({
      type: 'context_critical',
      message: `🚨 CRITICAL: Context at ${Math.round(contextUsagePercent * 100)}%! Oracle may not be able to reply. CLEAR CHAT NOW!`,
      severity: 'critical',
      action: 'clear_chat'
    });
  } else if (contextUsagePercent >= WARNING_THRESHOLD) {
    warnings.push({
      type: 'context_high',
      message: `⚠️ Context at ${Math.round(contextUsagePercent * 100)}%. Consider starting a new chat soon.`,
      severity: 'high',
      action: 'recommend_clear'
    });
  }

  // Check for redundant context
  if (currentConversation.length > 0) {
    const lastMessage = currentConversation[currentConversation.length - 1];
    if (lastMessage && lastMessage.role === 'oracle') {
      // Check if user is repeating what Oracle just said
      const similarity = checkTextSimilarity(draftPrompt, lastMessage.content);
      if (similarity > 0.5) {
        warnings.push({
          type: 'redundant',
          message: '🔁 You\'re repeating what Oracle just said. Ask a NEW question instead.',
          severity: 'medium'
        });
      }
    }
  }

  // Check for excessive length
  if (draftPrompt.length > 300) {
    warnings.push({
      type: 'length',
      message: '📏 Long prompt = more tokens. Try breaking this into 2-3 shorter questions.',
      severity: 'high'
    });
  }

  // === PERSONALIZATION OPPORTUNITIES ===

  // Check if user is asking generic questions that could use their profile
  const hasProfileData = profile && (profile.zodiacSign || profile.mbtiType || profile.birthdate);
  const genericKeywords = ['my', 'me', 'i', 'should i', 'what about'];
  const hasGenericLanguage = genericKeywords.some(kw => promptLower.includes(kw));

  if (hasGenericLanguage && hasProfileData && !mentionsProfileData(promptLower, profile)) {
    opportunities.push({
      type: 'profile',
      message: `✨ Oracle knows you're ${profile.zodiacSign}${profile.mbtiType ? ` ${profile.mbtiType}` : ''}. You don't need to repeat this!`,
      tip: 'Just ask your question - Oracle already has your context.'
    });
  }

  // === READING HISTORY INTEGRATION ===

  if (readings.length > 0) {
    // Check if asking about cards that appeared in recent readings
    const recentReadings = readings.slice(-5); // Last 5 readings
    const cardMentioned = checkForCardMentions(promptLower);

    if (cardMentioned && recentReadings.length > 0) {
      const readingWithCard = recentReadings.find(r =>
        r.cards && r.cards.some(c =>
          c.name.toLowerCase().includes(cardMentioned.toLowerCase())
        )
      );

      if (readingWithCard) {
        opportunities.push({
          type: 'reading_history',
          message: `🔮 ${cardMentioned} appeared in your ${readingWithCard.readingType || 'reading'} on ${new Date(readingWithCard.timestamp).toLocaleDateString()}`,
          tip: 'Ask Oracle to connect this to that past reading!'
        });
      }
    }

    // Suggest referencing recent readings for context
    if (hasGenericLanguage && !promptLower.includes('reading') && !promptLower.includes('last time')) {
      opportunities.push({
        type: 'context',
        message: `📚 You have ${readings.length} saved readings. Reference them for deeper insights!`,
        tip: 'Try: "How does this relate to my last reading?"'
      });
    }
  }

  // === CHAT EFFICIENCY ===

  // Check if asking yes/no questions (inefficient for Oracle)
  const yesNoPatterns = ['should i', 'will i', 'is it', 'am i', 'can i', 'do i'];
  if (yesNoPatterns.some(pattern => promptLower.includes(pattern))) {
    suggestions.push({
      type: 'question_quality',
      message: '❓ Yes/no questions get shallow answers. Ask "how" or "why" instead.',
      example: 'Instead of "Should I?", try "What should I consider about...?"'
    });
  }

  // Check for vague language
  const vagueWords = ['thing', 'stuff', 'it', 'this', 'that'];
  const hasVagueLanguage = vagueWords.filter(word =>
    new RegExp(`\\b${word}\\b`, 'i').test(draftPrompt)
  ).length >= 2;

  if (hasVagueLanguage) {
    suggestions.push({
      type: 'clarity',
      message: '💭 Vague words = vague answers. Be specific!',
      example: 'Name the actual thing you\'re asking about.'
    });
  }

  // === TOPIC APPROPRIATENESS ===

  // Check if asking off-topic questions
  const oracleTopics = ['card', 'tarot', 'zodiac', 'astrology', 'mbti', 'reading', 'energy', 'shadow', 'spiritual'];
  const hasOracleTopic = oracleTopics.some(topic => promptLower.includes(topic));

  if (!hasOracleTopic && draftPrompt.length > 20) {
    // Check for off-topic keywords
    const offTopicKeywords = ['weather', 'sports', 'recipe', 'code', 'programming', 'math', 'politics'];
    const isOffTopic = offTopicKeywords.some(kw => promptLower.includes(kw));

    if (isOffTopic) {
      warnings.push({
        type: 'off_topic',
        message: '⚠️ Oracle focuses on tarot, astrology, MBTI, and personal growth.',
        severity: 'high'
      });
    }
  }

  // === CHAT HISTORY PATTERNS ===

  if (chats.length > 0) {
    // Check if user tends to ask similar questions repeatedly
    const userMessages = chats.filter(m => m.role === 'user');
    const repetitionScore = checkRepetitivePatterns(draftPrompt, userMessages);

    if (repetitionScore > 0.6) {
      suggestions.push({
        type: 'repetition',
        message: '🔄 You\'ve asked similar questions before. Try a new angle!',
        tip: 'Check your chat history for Oracle\'s previous answer.'
      });
    }
  }

  // === CALCULATE PROMPT QUALITY SCORE ===

  let score = 50; // Base score

  // Positive factors
  if (hasOracleTopic) score += 15;
  if (draftPrompt.length >= 20 && draftPrompt.length <= 200) score += 15; // Sweet spot
  if (draftPrompt.includes('?')) score += 5;
  if (!yesNoPatterns.some(p => promptLower.includes(p))) score += 10;
  if (!hasVagueLanguage) score += 10;

  // Negative factors
  if (warnings.length > 0) score -= warnings.length * 10;
  if (draftPrompt.length > 300) score -= 20;

  // Cap between 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    suggestions: suggestions,
    warnings: warnings,
    opportunities: opportunities,
    score: score,
    canImprove: score < 80 || suggestions.length > 0 || opportunities.length > 0
  };
}

/**
 * Check text similarity (basic Jaccard similarity)
 */
function checkTextSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Check if prompt mentions profile data
 */
function mentionsProfileData(promptLower, profile) {
  if (!profile) return false;

  const mentions = [
    profile.zodiacSign?.toLowerCase(),
    profile.mbtiType?.toLowerCase(),
    profile.chineseZodiac?.toLowerCase()
  ].filter(Boolean);

  return mentions.some(mention => promptLower.includes(mention));
}

/**
 * Extract card mentions from prompt
 */
function checkForCardMentions(promptLower) {
  // Common major arcana
  const majorArcana = [
    'fool', 'magician', 'high priestess', 'empress', 'emperor',
    'hierophant', 'lovers', 'chariot', 'strength', 'hermit',
    'wheel of fortune', 'justice', 'hanged man', 'death',
    'temperance', 'devil', 'tower', 'star', 'moon', 'sun',
    'judgement', 'world'
  ];

  return majorArcana.find(card => promptLower.includes(card)) || null;
}

/**
 * Check for repetitive question patterns
 */
function checkRepetitivePatterns(currentPrompt, previousMessages) {
  if (previousMessages.length === 0) return 0;

  const currentWords = new Set(currentPrompt.toLowerCase().split(/\s+/));
  let maxSimilarity = 0;

  previousMessages.slice(-10).forEach(msg => { // Check last 10 user messages
    const msgWords = new Set(msg.content.toLowerCase().split(/\s+/));
    const similarity = checkTextSimilarity(currentPrompt, msg.content);
    maxSimilarity = Math.max(maxSimilarity, similarity);
  });

  return maxSimilarity;
}

/**
 * Get meta-coaching message based on analysis
 * This is the 4th-wall-breaking, brutally honest feedback
 */
export function getMetaCoachingMessage(analysis) {
  if (!analysis.canImprove && analysis.score >= 80) {
    return {
      tone: 'positive',
      message: '✅ Solid prompt. Oracle will give you good shit.',
      color: '#00ff00'
    };
  }

  if (analysis.warnings.length > 0) {
    const topWarning = analysis.warnings[0];
    return {
      tone: 'warning',
      message: topWarning.message,
      color: '#ff8800'
    };
  }

  if (analysis.suggestions.length > 0) {
    const topSuggestion = analysis.suggestions[0];
    return {
      tone: 'suggestion',
      message: topSuggestion.message,
      color: '#ffff00'
    };
  }

  if (analysis.opportunities.length > 0) {
    const topOpportunity = analysis.opportunities[0];
    return {
      tone: 'opportunity',
      message: topOpportunity.message,
      color: '#00ffff'
    };
  }

  return {
    tone: 'neutral',
    message: '💬 Type your question for Oracle...',
    color: '#888888'
  };
}

export { loadCompleteUserContext };
