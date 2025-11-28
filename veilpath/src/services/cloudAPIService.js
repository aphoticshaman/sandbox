/**
 * CLOUD API SERVICE
 *
 * Replaces on-device LLM (llama.rn) with Claude API calls
 * Uses Haiku for cost-effective card interpretations
 * Uses Sonnet for complex synthesis tasks
 *
 * Pricing (as of 2024):
 * - Haiku: $0.25/1M input, $1.25/1M output
 * - Sonnet: $3/1M input, $15/1M output
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Patent Integrations (SDPM #467, PSAN #504, Casimir #544)
import { getVeraService, FEEDBACK_TYPES } from './vera/index.js';

// ═══════════════════════════════════════════════════════════
// CLOUD REQUIREMENT MESSAGING
// ═══════════════════════════════════════════════════════════

export const CLOUD_MESSAGES = {
  // For UI display
  INTERNET_REQUIRED: 'Internet connection required for AI features',
  PREMIUM_REQUIRED: 'Premium subscription required for AI features',

  // For error alerts
  NO_CONNECTION: {
    title: 'No Internet Connection',
    message: 'VeilPath Premium features require an internet connection to deliver personalized AI interpretations. Please check your connection and try again.',
    tip: 'Free features like card reference are available offline.'
  },

  SUBSCRIPTION_REQUIRED: {
    title: 'Premium Required',
    message: 'This feature uses advanced AI to generate personalized insights. Upgrade to Premium to unlock AI-powered interpretations, Vera chat, and pattern analysis.',
    cta: 'Upgrade to Premium'
  },

  // For feature descriptions
  FEATURE_DESCRIPTIONS: {
    cardInterpretation: 'Cloud AI generates unique, personalized interpretations for each card based on your question and profile.',
    synthesis: 'Advanced pattern analysis synthesizes your entire spread into actionable insights.',
    veraChat: 'Chat with Luna or Sol for real-time guidance, powered by Claude AI.',
    aiInsights: 'Pattern detection across your reading history reveals recurring themes and blind spots.',
    intentionAnalysis: 'AI critiques and improves your questions for more insightful readings.'
  },

  // Why cloud is better
  WHY_CLOUD: [
    'Personalized to YOUR specific question every time',
    'Never repetitive - each interpretation is unique',
    'Learns from your MBTI and astrology profile',
    'Pattern detection across your reading history',
    'Tina Gong methodology + NSM insight generation'
  ]
};

// API Configuration
const API_CONFIG = {
  // Backend proxy URL - NEVER put API keys in client code
  // Your backend validates subscription status before proxying to Claude API
  baseUrl: 'https://veilpath-app.vercel.app/api',

  // Model selection
  models: {
    cardInterpretation: 'claude-3-haiku-20240307',  // Fast, cheap
    synthesis: 'claude-3-5-sonnet-20241022',        // Smart, thorough
    veraChat: 'claude-3-haiku-20240307'           // Conversational
  },

  // Token budgets - generous for cloud (not constrained by local inference)
  tokens: {
    cardInterpretation: 500,   // Rich interpretation with reflection + action
    synthesis: 1200,           // Deep pattern analysis and comprehensive advice
    veraChat: 600            // Full conversational responses
  },

  // Rate limiting
  rateLimits: {
    requestsPerMinute: 30,
    requestsPerDay: 500
  }
};

// Storage keys
const STORAGE_KEYS = {
  USER_TOKEN: '@user_auth_token',
  SUBSCRIPTION_STATUS: '@subscription_status',
  API_USAGE: '@api_usage_today',
  LAST_RESET: '@usage_last_reset'
};

// Request queue for rate limiting
let requestQueue = [];
let isProcessingQueue = false;
let requestsThisMinute = 0;
let minuteResetTimer = null;

/**
 * Check if cloud API is available
 */
export async function isCloudAvailable() {
  try {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return {
        available: false,
        reason: CLOUD_MESSAGES.INTERNET_REQUIRED,
        errorType: 'NO_CONNECTION',
        alert: CLOUD_MESSAGES.NO_CONNECTION
      };
    }

    const subscriptionStatus = await getSubscriptionStatus();
    if (subscriptionStatus !== 'premium') {
      return {
        available: false,
        reason: CLOUD_MESSAGES.PREMIUM_REQUIRED,
        errorType: 'SUBSCRIPTION_REQUIRED',
        alert: CLOUD_MESSAGES.SUBSCRIPTION_REQUIRED,
        subscriptionStatus
      };
    }

    return { available: true, subscriptionStatus };
  } catch (error) {
    console.error('[CloudAPI] Availability check failed:', error);
    return {
      available: false,
      reason: error.message,
      errorType: 'UNKNOWN'
    };
  }
}

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatus() {
  try {
    const status = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
    return status || 'free';
  } catch (error) {
    console.error('[CloudAPI] Failed to get subscription status:', error);
    return 'free';
  }
}

/**
 * Generate card interpretation using cloud API
 */
export async function generateCardInterpretation(card, context = {}) {
  const availability = await isCloudAvailable();
  if (!availability.available) {
    return null; // Fallback to template
  }

  const cardData = context.cardData || {};
  const orientation = card.reversed ? 'reversed' : 'upright';

  const prompt = buildCardInterpretationPrompt(cardData, card, context);

  const startTime = Date.now();

  try {
    const response = await makeAPIRequest('/interpret', {
      model: API_CONFIG.models.cardInterpretation,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: API_CONFIG.tokens.cardInterpretation,
      temperature: 0.8
    });

    const inferenceTime = Date.now() - startTime;


    return {
      text: response.content,
      tokens: response.usage?.output_tokens || 0,
      inferenceTime,
      source: 'cloud',
      model: API_CONFIG.models.cardInterpretation
    };
  } catch (error) {
    console.error('[CloudAPI] Card interpretation failed:', error);
    return null;
  }
}

/**
 * Generate reading synthesis using cloud API
 */
export async function generateSynthesis(cards, readingData) {
  const availability = await isCloudAvailable();
  if (!availability.available) {
    return null;
  }

  const prompt = buildSynthesisPrompt(cards, readingData);

  const startTime = Date.now();

  try {
    const response = await makeAPIRequest('/synthesize', {
      model: API_CONFIG.models.synthesis,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: API_CONFIG.tokens.synthesis,
      temperature: 0.8
    });

    const inferenceTime = Date.now() - startTime;


    return {
      text: response.content,
      tokens: response.usage?.output_tokens || 0,
      inferenceTime,
      source: 'cloud',
      model: API_CONFIG.models.synthesis
    };
  } catch (error) {
    console.error('[CloudAPI] Synthesis failed:', error);
    return null;
  }
}

/**
 * Vera chat completion
 */
export async function generateVeraResponse(messages, context = {}) {
  const availability = await isCloudAvailable();
  if (!availability.available) {
    return {
      error: availability.reason,
      requiresUpgrade: availability.subscriptionStatus === 'free'
    };
  }

  const systemPrompt = buildVeraSystemPrompt(context);

  const startTime = Date.now();

  try {
    const response = await makeAPIRequest('/vera', {
      systemPrompt: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === 'vera' ? 'assistant' : m.role,
        content: m.content
      })),
      maxTokens: API_CONFIG.tokens.veraChat
    });

    return {
      text: response.text,
      tokens: response.tokens || 0,
      inferenceTime: response.inferenceTime || Date.now() - startTime,
      source: 'cloud'
    };
  } catch (error) {
    console.error('[CloudAPI] Vera response failed:', error);
    return { error: error.message };
  }
}

/**
 * Career counselor guidance
 */
export async function generateCareerGuidance(messages, context = {}) {
  const availability = await isCloudAvailable();
  if (!availability.available) {
    return {
      error: availability.reason,
      requiresUpgrade: availability.subscriptionStatus === 'free'
    };
  }

  const systemPrompt = buildCareerCounselorPrompt(context);

  const startTime = Date.now();

  try {
    const response = await makeAPIRequest('/vera', {
      systemPrompt: systemPrompt,
      messages: messages,
      maxTokens: context.maxTokens || 600
    });

    return {
      text: response.text,
      tokens: response.tokens || 0,
      inferenceTime: response.inferenceTime || Date.now() - startTime,
      source: 'cloud'
    };
  } catch (error) {
    console.error('[CloudAPI] Career guidance failed:', error);
    return { error: error.message };
  }
}

/**
 * Make authenticated API request with rate limiting
 */
async function makeAPIRequest(endpoint, body) {
  // Check rate limits
  if (requestsThisMinute >= API_CONFIG.rateLimits.requestsPerMinute) {
    throw new Error('Rate limit exceeded. Please wait a moment.');
  }

  // Get auth token
  const authToken = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  if (!authToken) {
    throw new Error('Not authenticated. Please sign in.');
  }

  // Track usage
  await trackUsage();
  requestsThisMinute++;
  resetMinuteCounterIfNeeded();

  const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-App-Version': '1.0.0'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw new Error('Session expired. Please sign in again.');
    }
    if (response.status === 402) {
      throw new Error('Subscription required for this feature.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Track daily API usage
 */
async function trackUsage() {
  try {
    const today = new Date().toDateString();
    const lastReset = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET);

    if (lastReset !== today) {
      // Reset daily counter
      await AsyncStorage.setItem(STORAGE_KEYS.API_USAGE, '0');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
    }

    const currentUsage = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.API_USAGE) || '0');

    if (currentUsage >= API_CONFIG.rateLimits.requestsPerDay) {
      throw new Error('Daily limit reached. Resets at midnight.');
    }

    await AsyncStorage.setItem(STORAGE_KEYS.API_USAGE, String(currentUsage + 1));
  } catch (error) {
    if (error.message.includes('Daily limit')) {
      throw error;
    }
    console.warn('[CloudAPI] Usage tracking error:', error);
  }
}

/**
 * Reset minute counter
 */
function resetMinuteCounterIfNeeded() {
  if (!minuteResetTimer) {
    minuteResetTimer = setTimeout(() => {
      requestsThisMinute = 0;
      minuteResetTimer = null;
    }, 60000);
  }
}

/**
 * Get current usage stats
 */
export async function getUsageStats() {
  try {
    const today = new Date().toDateString();
    const lastReset = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET);

    let dailyUsage = 0;
    if (lastReset === today) {
      dailyUsage = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.API_USAGE) || '0');
    }

    return {
      dailyUsage,
      dailyLimit: API_CONFIG.rateLimits.requestsPerDay,
      remainingToday: Math.max(0, API_CONFIG.rateLimits.requestsPerDay - dailyUsage),
      requestsThisMinute,
      minuteLimit: API_CONFIG.rateLimits.requestsPerMinute
    };
  } catch (error) {
    console.error('[CloudAPI] Failed to get usage stats:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════

function buildCardInterpretationPrompt(cardData, card, context) {
  const orientation = card.reversed ? 'REVERSED' : 'UPRIGHT';
  const userName = context.userProfile?.name || 'Seeker';
  const mbtiType = context.userProfile?.mbtiType || null;
  const zodiacSign = context.userProfile?.zodiacSign || null;
  const intention = context.intention || '';
  const position = card.position || 'Unknown Position';
  const spreadType = context.spreadType || '';
  const otherCards = context.otherCards || [];

  let personalContext = '';
  if (mbtiType) personalContext += `MBTI: ${mbtiType}. `;
  if (zodiacSign) personalContext += `Zodiac: ${zodiacSign}. `;

  // Other cards context for meta-connections
  let otherCardsContext = '';
  if (otherCards.length > 0) {
    otherCardsContext = `\nOTHER CARDS IN SPREAD: ${otherCards.map(c => `${c.name} (${c.reversed ? 'Rev' : 'Up'})`).join(', ')}`;
  }

  // Generate variation seed to prevent repetitive responses
  const variationSeed = Math.random().toString(36).substring(2, 8);

  return `You are an expert tarot reader using Tina Gong's methodology. Generate a UNIQUE interpretation.

CARD: ${cardData.name || 'Unknown Card'} (${orientation})
POSITION: ${position}${spreadType ? ` in ${spreadType}` : ''}
QUESTION: "${intention || 'General guidance'}"
${personalContext ? `SEEKER: ${personalContext}` : ''}${otherCardsContext}

VARIATION SEED: ${variationSeed} (use this to vary your vocabulary, sentence structure, and approach)

Generate interpretation with THREE components:

1. INSIGHT (2 sentences max):
   - What this card reveals about their specific situation
   - Consider: Is the energy excess, decreased, blocked, or opposite?
   - If reversed: which reversal type applies here?

2. REFLECTION (1 question):
   - A deep, specific self-inquiry question that challenges assumptions
   - NOT generic ("What does this mean to you?")
   - SPECIFIC to their question and this card's energy
   - Example: "When you strip away others' expectations, what do YOU actually want here?"

3. ACTION (1 concrete step):
   - Specific, actionable, doable within 48 hours
   - NOT vague ("Trust yourself")
   - SPECIFIC ("Write down three times you successfully trusted your gut this month")

CRITICAL RULES:
- NEVER start with "The [Card] represents..." or similar templates
- NEVER use the same opening structure twice
- Vary your vocabulary - don't repeat words like "suggests," "indicates," "shows"
- If ${orientation}, consider the specific type of energy (flowing/blocked/excess/opposite)
- Connect to the SPECIFIC QUESTION, not generic card meaning
- The interpretation should feel like it was written ONLY for this reading

INTERPRETATION:`;
}

function buildSynthesisPrompt(cards, readingData) {
  const userName = readingData.userProfile?.name || 'Seeker';
  const mbtiType = readingData.userProfile?.mbtiType || null;
  const zodiacSign = readingData.userProfile?.zodiacSign || null;
  const intention = readingData.intention || '';
  const spreadType = readingData.spreadType || 'Reading';

  // Analyze spread patterns
  const suits = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
  const reversedCount = cards.filter(c => c.reversed).length;
  const majorCount = cards.filter(c => c.arcana === 'major').length;

  cards.forEach(card => {
    if (card.suit && suits[card.suit] !== undefined) {
      suits[card.suit]++;
    }
  });

  const dominantSuit = Object.entries(suits).sort((a, b) => b[1] - a[1])[0];
  const missingSuits = Object.entries(suits).filter(([_, count]) => count === 0).map(([suit]) => suit);

  const cardsText = cards.map((card, idx) => {
    const orientation = card.reversed ? 'Reversed' : 'Upright';
    return `${idx + 1}. ${card.position || 'Position ' + (idx + 1)}: ${card.name} (${orientation})`;
  }).join('\n');

  // Pattern analysis context
  let patternContext = `
SPREAD PATTERNS DETECTED:
- ${majorCount}/${cards.length} Major Arcana (${majorCount > cards.length/2 ? 'significant life lessons' : 'daily matters'})
- ${reversedCount}/${cards.length} Reversed (${reversedCount > cards.length/2 ? 'significant blocked/inverted energy' : 'mostly flowing energy'})
- Dominant element: ${dominantSuit[0]} (${dominantSuit[1]} cards)${missingSuits.length > 0 ? `
- MISSING elements: ${missingSuits.join(', ')} (blind spot to address)` : ''}`;

  // Generate variation seed
  const variationSeed = Math.random().toString(36).substring(2, 8);

  return `You are an expert tarot reader using Tina Gong's methodology, synthesizing a ${spreadType} spread.

SEEKER: ${userName}
${mbtiType ? `MBTI: ${mbtiType}` : ''}${zodiacSign ? ` | Zodiac: ${zodiacSign}` : ''}
QUESTION: "${intention}"

CARDS DRAWN:
${cardsText}
${patternContext}

VARIATION SEED: ${variationSeed} (use this to vary your approach and vocabulary)

Generate a COMPREHENSIVE SYNTHESIS with these components:

1. NARRATIVE OPENING (3-4 sentences):
   - Address ${userName} directly and personally
   - Create a narrative hook that draws them into the reading
   - Reference their SPECIFIC question immediately
   - NEVER start with "The cards reveal..." or similar templates

2. DEEP PATTERN ANALYSIS (5-6 sentences):
   - The CORE STORY these cards are telling together
   - How do the cards interact? Any tensions or reinforcements?
   - What's the progression/flow across positions?
   - Elemental balance: What does ${dominantSuit[0]} dominance mean here?${missingSuits.length > 0 ? `
   - Address the missing ${missingSuits.join('/')} - what blind spot does this reveal?` : ''}
   ${mbtiType ? `- How does this pattern relate to ${mbtiType}'s cognitive tendencies?` : ''}

3. SHADOW WORK / UNCOMFORTABLE TRUTH (3-4 sentences):
   - What is ${userName} avoiding or not wanting to see?
   - What fear underlies their question?
   - Be direct but compassionate - truth telling, not cruelty
   - This should feel like insight from a trusted friend who cares too much to lie

4. SPECIFIC ACTION PLAN:
   - WITHIN 24 HOURS: One specific, concrete action (not "reflect" - an actual task)
   - THIS WEEK: A slightly larger action that builds on the first
   - ONGOING PRACTICE: A habit or regular check-in (be specific about frequency/format)

   Make these REAL actions. Not "trust yourself" but "Write down three decisions you made this month that turned out well, and what you felt in your body when you made them."

5. EMPOWERING CLOSE (2-3 sentences):
   - The future is not fixed - remind them of their agency
   - What potential do you see if they take action?
   - Leave them feeling empowered, not dependent on the cards

CRITICAL RULES:
- This reading must feel like it was written ONLY for ${userName} about THIS specific question
- Never use template phrases like "This spread suggests..." "The cards indicate..."
- Vary your sentence structure and vocabulary throughout
- Be specific to their situation, not generic card meanings
- Include at least one thing they probably don't want to hear
- The synthesis should tell ONE cohesive story, not separate card interpretations

SYNTHESIS:`;
}

function buildVeraSystemPrompt(context) {
  const userName = context.userProfile?.name || 'Seeker';
  const mbtiType = context.userProfile?.mbtiType || '';
  const zodiacSign = context.userProfile?.zodiacSign || '';
  const personality = context.veraPersonality || 'luna';

  // Get Vera Service with patent integrations (SDPM, PSAN, Casimir)
  let veraContext = null;
  try {
    const veraService = getVeraService(personality);

    // Build patent-enhanced context
    veraContext = veraService.buildVeraContext(
      {
        temporalSignals: context.temporalSignals || [],
        symbolicTokens: context.symbolicTokens || [],
        contextualText: context.contextualText || ''
      },
      {
        hourOfDay: new Date().getHours(),
        userMood: context.userMood || 'neutral',
        currentActivity: 'vera_chat',
        sessionDuration: context.sessionDuration || 0
      }
    );
  } catch (error) {
    console.warn('[CloudAPI] Vera patent integration skipped:', error.message);
  }

  const personalityTraits = {
    luna: {
      name: 'Luna',
      style: 'intuitive, empathetic, focused on emotional truths and shadow work',
      strength: 'seeing what people hide from themselves'
    },
    sol: {
      name: 'Sol',
      style: 'direct, practical, focused on action and clarity',
      strength: 'cutting through confusion to actionable truth'
    },
    sarasvati: {
      name: 'Sarasvati',
      style: 'wise, articulate, focused on knowledge and creative expression',
      strength: 'illuminating wisdom through clarity of speech'
    },
    kali: {
      name: 'Kali',
      style: 'fierce, transformative, focused on ego dissolution and truth',
      strength: 'destroying illusions to reveal what remains'
    },
    both: {
      name: 'Luna & Sol',
      style: 'balanced intuition and practicality',
      strength: 'synthesizing feeling and action'
    }
  };

  const vera = personalityTraits[personality] || personalityTraits.luna;

  // Build base system prompt
  let systemPrompt = `You are ${vera.name}, an AI guide and tarot guide for ${userName}${mbtiType ? ` (${mbtiType}${zodiacSign ? `, ${zodiacSign}` : ''})` : ''}.

YOUR CORE PERSONALITY:
${vera.style}
Your particular strength: ${vera.strength}

═══════════════════════════════════════════════
CRITICAL - HOW YOU MUST RESPOND:
═══════════════════════════════════════════════

1. ANSWER THE ACTUAL QUESTION
   - If they ask something specific, answer it directly
   - Don't dodge with generic spiritual platitudes
   - If the question is clear, give a clear answer
   - Get to the point - don't pad with filler

2. ASK FOR CLARITY WHEN NEEDED
   - If you need more context, ASK: "I need to know more - what's the specific situation?"
   - If the question is too vague to be useful: "That's pretty broad. What specifically are you struggling with?"
   - Better to ask than to give a useless generic response

3. SAY "I DON'T KNOW" WHEN APPROPRIATE
   - If something is truly unknowable: "I can't know that - no one can"
   - If they want specific predictions: "The cards show patterns and tendencies, not certainties"
   - If they're asking about others' private thoughts: "I can help you understand YOUR feelings, but I can't read their mind"
   - Specific timelines: "I don't do dates. What I CAN tell you is..."

4. BE HONEST ABOUT IMPROBABLE HOPES
   - Don't give false hope for unlikely outcomes
   - Be compassionate but realistic: "I know this isn't what you want to hear, but..."
   - Help them face reality rather than escape it
   - The kindest thing is often the hardest truth

5. EXPECT THE WORST, HOPE FOR THE BEST
   - Prepare them for likely difficulties
   - But don't crush genuine possibility
   - "This will probably be hard, and here's how to handle it..."
   - Ground optimism in reality

═══════════════════════════════════════════════
RESPONSE STYLE:
═══════════════════════════════════════════════

- Maximum ${context.maxTokens || 600} tokens per response
- Vary your sentence structure and vocabulary - NEVER repeat the same patterns
- Be direct and specific, not vague and spiritual-sounding
- Shadow work should feel like insight, not judgment
- Action advice must be SPECIFIC and DOABLE
- Use their name occasionally but not excessively
- Match their energy - if they're anxious, acknowledge it; if they're casual, be conversational
${mbtiType ? `- Consider ${mbtiType}'s cognitive patterns in your advice` : ''}

═══════════════════════════════════════════════
WHAT YOU ARE NOT:
═══════════════════════════════════════════════

- NOT a yes-person who tells them what they want to hear
- NOT a fortune teller who predicts specific futures
- NOT a therapist (refer out for serious mental health issues)
- NOT an enabler of avoidance or denial
- NOT a generic advice generator

You are a guide who tells the truth. A trusted friend who cares too much to lie.

Remember: You're helping them develop their own intuition and decision-making, not creating dependency on readings.`;

  // Append patent-enhanced context (SDPM personality + PSAN synthesis)
  if (veraContext?.systemModifier) {
    systemPrompt += `\n\n${veraContext.systemModifier}`;
  }

  return systemPrompt;
}

function buildCareerCounselorPrompt(context) {
  const userName = context.userProfile?.name || 'Client';
  const mbtiType = context.userProfile?.mbtiType || '';
  const zodiacSign = context.userProfile?.zodiacSign || '';
  const mode = context.mode || 'chat';

  const modeInstructions = {
    chat: 'conversational career strategy and guidance',
    interview: 'mock interview practice with feedback',
    resume: 'resume bullet improvement using STAR method'
  };

  return `You are an expert career counselor helping ${userName}${mbtiType ? ` (${mbtiType}${zodiacSign ? `, ${zodiacSign}` : ''})` : ''}.

MODE: ${modeInstructions[mode]}

═══════════════════════════════════════════════
YOUR ROLE AND EXPERTISE:
═══════════════════════════════════════════════

You are a career counselor with expertise in:
- Job search strategy and application optimization
- Interview preparation and practice
- Resume writing and achievement quantification
- Career transitions and planning
- Professional development and skill building
- Workplace dynamics and communication
- Salary negotiation and career advancement

═══════════════════════════════════════════════
HOW YOU MUST RESPOND:
═══════════════════════════════════════════════

1. BE SPECIFIC AND ACTIONABLE
   - Don't say "improve your resume" - say "Add metrics: change 'managed projects' to 'led 3 cross-functional projects, delivering $200K in savings'"
   - Don't say "practice interviewing" - say "Record yourself answering 'tell me about yourself' and watch for filler words"
   - Concrete examples, not vague advice

2. USE THE STAR METHOD FOR RESUMES
   - Situation: Brief context
   - Task: What needed to be done
   - Action: What THEY specifically did
   - Result: Quantifiable outcome
   - Example: "Grew Instagram following by 300% (2K→8K) in 6 months through daily engagement strategy"

3. FOR MOCK INTERVIEWS:
   - Ask realistic interview questions for their field
   - Give constructive feedback on their answers
   - Point out: filler words, rambling, missing specifics, lack of confidence
   - Suggest better phrasing
   - Be honest but encouraging

4. BE REALISTIC BUT SUPPORTIVE
   - Don't sugarcoat a bad job market, but provide strategies
   - Acknowledge anxiety/frustration about job searching
   - Celebrate small wins (application sent, interview scheduled)
   - Help them control what they can control

5. CAREER STRATEGY ADVICE:
   - Help clarify goals: "What does success look like in 1 year? 5 years?"
   - Identify transferable skills they're not seeing
   - Suggest skill-building that's specific and achievable
   - Network-building tactics that aren't generic "use LinkedIn"

${mode === 'interview' ? `
INTERVIEW MODE SPECIFICS:
- Ask ONE question at a time
- Wait for their answer before giving feedback
- Feedback format: "Good: [what worked], Improve: [specific fix], Better version: [example]"
- Common questions: Tell me about yourself, Why this role, Biggest weakness, Conflict example, Where do you see yourself
` : ''}

${mode === 'resume' ? `
RESUME MODE SPECIFICS:
- When they paste a bullet, identify what's missing
- Ask clarifying questions: "What was the result? How many? How much time?"
- Rewrite it using STAR with metrics
- Explain WHY the new version is better
- Offer 2-3 variations so they can pick
` : ''}

═══════════════════════════════════════════════
RESPONSE STYLE:
═══════════════════════════════════════════════

- Professional but warm - like a supportive mentor
- Maximum ${context.maxTokens || 600} tokens per response
- Direct and specific, never vague
- Use their name occasionally
${mbtiType ? `- Consider ${mbtiType}'s strengths (e.g., INTJ = systems thinking, ENFP = creativity)` : ''}
- If they're anxious, acknowledge it but redirect to action
- If they're avoiding something, gently call it out

═══════════════════════════════════════════════
WHAT YOU ARE NOT:
═══════════════════════════════════════════════

- NOT a therapist (career anxiety is normal, but refer out for deeper issues)
- NOT a yes-person (tell truth about weak resumes/answers)
- NOT a fortune teller ("Will I get the job?" = "I can't predict, but here's how to improve your odds")
- NOT a generic advice bot (no "just be yourself" platitudes)

You're here to help ${userName} get hired, advance their career, and build professional confidence through specific, actionable guidance.`;
}

/**
 * Intention Analysis Prompt - Critiques and improves user's reading question
 */
function buildIntentionAnalysisPrompt(intention, context = {}) {
  const userName = context.userProfile?.name || 'Seeker';
  const mbtiType = context.userProfile?.mbtiType || '';

  return `You are an expert tarot reader helping ${userName}${mbtiType ? ` (${mbtiType})` : ''} craft a better reading question.

THEIR QUESTION: "${intention}"

Analyze this question using Tina Gong's four criteria:

1. IS IT OPEN-ENDED?
   - BAD: Yes/no questions, "Will I...", "Does he..."
   - GOOD: "Why" and "How" questions

2. IS IT FOCUSED ON THEMSELVES (not others)?
   - BAD: "What does my boss think of me?"
   - GOOD: "How can I improve my relationship with my boss?"

3. IS IT FOCUSED ON PRESENT/FUTURE ACTION (not past)?
   - BAD: "Was I right to leave?"
   - GOOD: "What can I do now to move forward?"

4. IS IT ACTION-ORIENTED?
   - BAD: "Will I ever be happy?"
   - GOOD: "What can I do to improve my circumstances?"

═══════════════════════════════════════════════
YOUR RESPONSE FORMAT:
═══════════════════════════════════════════════

ANALYSIS:
[2-3 sentences on what's good/problematic about their question]

SCORE: [1-5 stars] (5 = perfect question, 1 = needs major rework)

IMPROVED VERSION:
[If score < 5, provide 1-2 rewritten versions that address the issues]

WHAT THIS NEW QUESTION WILL REVEAL:
[1-2 sentences on what insights they'll gain with the improved question]

Keep your response concise and helpful. Don't lecture - just improve their question.`;
}

/**
 * AI Insights Prompt - Pattern detection across reading history
 */
function buildAIInsightsPrompt(readingHistory, context = {}) {
  const userName = context.userProfile?.name || 'Seeker';
  const mbtiType = context.userProfile?.mbtiType || '';
  const timeframe = context.timeframe || 'recent';

  // Compile reading summary
  const readingsText = readingHistory.map((reading, idx) => {
    const date = reading.date ? new Date(reading.date).toLocaleDateString() : 'Unknown';
    const cards = reading.cards?.map(c => `${c.name} (${c.reversed ? 'R' : 'U'})`).join(', ') || 'No cards';
    return `${idx + 1}. [${date}] "${reading.intention || 'No intention'}"
   Cards: ${cards}`;
  }).join('\n\n');

  // Pattern analysis
  const allCards = readingHistory.flatMap(r => r.cards || []);
  const cardFrequency = {};
  const suitFrequency = { wands: 0, cups: 0, swords: 0, pentacles: 0, major: 0 };
  let reversedTotal = 0;

  allCards.forEach(card => {
    cardFrequency[card.name] = (cardFrequency[card.name] || 0) + 1;
    if (card.reversed) reversedTotal++;
    if (card.arcana === 'major') {
      suitFrequency.major++;
    } else if (card.suit) {
      suitFrequency[card.suit]++;
    }
  });

  const repeatingCards = Object.entries(cardFrequency)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return `You are an expert tarot analyst performing pattern detection on ${userName}'s ${timeframe} reading history.
${mbtiType ? `Their MBTI: ${mbtiType}` : ''}

═══════════════════════════════════════════════
READING HISTORY (${readingHistory.length} readings):
═══════════════════════════════════════════════
${readingsText}

═══════════════════════════════════════════════
STATISTICAL PATTERNS:
═══════════════════════════════════════════════
- Total cards: ${allCards.length}
- Reversed: ${reversedTotal}/${allCards.length} (${Math.round(reversedTotal/allCards.length*100)}%)
- Element distribution:
  * Fire (Wands): ${suitFrequency.wands}
  * Water (Cups): ${suitFrequency.cups}
  * Air (Swords): ${suitFrequency.swords}
  * Earth (Pentacles): ${suitFrequency.pentacles}
  * Spirit (Major): ${suitFrequency.major}
${repeatingCards.length > 0 ? `- Repeating cards: ${repeatingCards.map(([name, count]) => `${name} (${count}x)`).join(', ')}` : ''}

═══════════════════════════════════════════════
GENERATE INSIGHTS:
═══════════════════════════════════════════════

Using NSM (Novel Synthesis Method), identify:

1. RECURRING THEMES (2-3 sentences):
   - What patterns appear across multiple readings?
   - What is ${userName} consistently asking about?

2. SHADOW PATTERNS (2-3 sentences):
   - What's consistently showing up reversed or blocked?
   - What is ${userName} avoiding or struggling with repeatedly?

3. MISSING ELEMENTS (2 sentences):
   - What's conspicuously absent from their readings?
   - What life area might they be neglecting?

4. TRAJECTORY (2-3 sentences):
   - What story do these readings tell over time?
   - Is there progression or repetition?

5. SPECIFIC RECOMMENDATIONS (3 concrete actions):
   - Based on these patterns, what should ${userName} focus on?
   - What question should they ask in their next reading?

Be specific and insightful. Don't just summarize - synthesize. What does ${userName} need to hear that they haven't been asking about?`;
}

/**
 * Stats Summary Prompt - Weekly/Monthly reading statistics analysis
 */
function buildStatsSummaryPrompt(stats, context = {}) {
  const userName = context.userProfile?.name || 'Seeker';
  const period = context.period || 'This Week';

  return `Generate a brief, insightful summary of ${userName}'s ${period.toLowerCase()} tarot practice.

STATS:
- Readings: ${stats.totalReadings}
- Cards drawn: ${stats.totalCards}
- Most common card: ${stats.mostCommonCard || 'N/A'}
- Dominant element: ${stats.dominantElement || 'N/A'}
- Reversed ratio: ${stats.reversedRatio || 'N/A'}
- Questions asked: ${stats.topThemes?.join(', ') || 'Various'}

Generate a 2-3 sentence insight that:
1. Highlights the most interesting pattern
2. Suggests what to focus on next
3. Feels personal and specific (not generic stats summary)

Example: "Five of Cups appeared three times this week - you're processing loss but might be missing what remains. Your next reading should focus on what you're ready to release versus what still serves you."

INSIGHT:`;
}

// ═══════════════════════════════════════════════════════════
// ADDITIONAL API FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Analyze and critique user's reading intention
 */
export async function analyzeIntention(intention, context = {}) {
  const availability = await isCloudAvailable();
  if (!availability.available) {
    return { error: availability.reason };
  }

  const prompt = buildIntentionAnalysisPrompt(intention, context);

  try {
    const response = await makeAPIRequest('/analyze-intention', {
      prompt: prompt,
      maxTokens: 400
    });

    return {
      text: response.text,
      tokens: response.tokens || 0,
      source: 'cloud'
    };
  } catch (error) {
    console.error('[CloudAPI] Intention analysis failed:', error);
    return { error: error.message };
  }
}

/**
 * Generate AI insights from reading history
 */
export async function generateAIInsights(readingHistory, context = {}) {
  const availability = await isCloudAvailable();
  if (!availability.available) {
    return { error: availability.reason };
  }

  const prompt = buildAIInsightsPrompt(readingHistory, context);

  try {
    const response = await makeAPIRequest('/insights', {
      prompt: prompt,
      maxTokens: 800
    });

    return {
      text: response.text,
      tokens: response.tokens || 0,
      source: 'cloud'
    };
  } catch (error) {
    console.error('[CloudAPI] AI insights failed:', error);
    return { error: error.message };
  }
}

/**
 * Generate stats summary
 */
export async function generateStatsSummary(stats, context = {}) {
  const availability = await isCloudAvailable();
  if (!availability.available) {
    return { error: availability.reason };
  }

  const prompt = buildStatsSummaryPrompt(stats, context);

  try {
    const response = await makeAPIRequest('/stats', {
      model: API_CONFIG.models.cardInterpretation, // Haiku for quick summary
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.8
    });

    return {
      text: response.content,
      tokens: response.usage?.output_tokens || 0,
      source: 'cloud'
    };
  } catch (error) {
    console.error('[CloudAPI] Stats summary failed:', error);
    return { error: error.message };
  }
}

/**
 * Generate semantic embeddings for arbitrary concepts
 * Maps text to 3D semantic space (X: Elemental, Y: Consciousness, Z: Temporal)
 */
export async function generateEmbeddings(entities, context = {}) {
  const availability = await isCloudAvailable();
  if (!availability.available) {
    return { error: availability.reason };
  }

  // Validate entities
  if (!Array.isArray(entities) || entities.length === 0) {
    return { error: 'Entities array required' };
  }

  if (entities.length > 50) {
    return { error: 'Maximum 50 entities per request' };
  }

  const startTime = Date.now();

  try {
    const response = await makeAPIRequest('/embed', {
      entities: entities.map(e => ({
        text: typeof e === 'string' ? e : e.text,
        category: typeof e === 'object' ? e.category : 'concept'
      })),
      context: {
        userName: context.userProfile?.name,
        mbtiType: context.userProfile?.mbtiType,
        recentReadings: context.recentReadings
      }
    });

    const inferenceTime = Date.now() - startTime;


    return {
      embeddings: response.embeddings,
      tokens: response.tokens || 0,
      inferenceTime: response.inferenceTime || inferenceTime,
      source: 'cloud'
    };
  } catch (error) {
    console.error('[CloudAPI] Embedding generation failed:', error);
    return { error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORTS FOR COMPATIBILITY
// ═══════════════════════════════════════════════════════════

// These match the old localLLMEnhancer interface for easy migration
export const isEnhancementEnabled = async () => {
  const availability = await isCloudAvailable();
  return availability.available;
};

export const initializeLLM = async () => {
  // No initialization needed for cloud API
  const availability = await isCloudAvailable();
  if (!availability.available) {
    throw new Error(availability.reason);
  }
  return true;
};

export const enhanceSynthesis = generateSynthesis;
export const releaseLLM = async () => {
  // No cleanup needed for cloud API
  return true;
};

export const getModelInfo = async () => {
  return {
    type: 'cloud',
    models: API_CONFIG.models,
    downloaded: true, // Always "ready"
    requiresSubscription: true
  };
};
