/**
 * INTENTION VALIDATOR: 5W+H Analysis + LLM Critique
 * Validates user intentions for depth and specificity
 * Provides feedback when context is insufficient
 * Optional LLM-powered critique for deeper analysis
 */

import { initializeLLM, isEnhancementEnabled } from './lazyLLM';

/**
 * Validate intention using 5W+H framework
 * Who, What, When, Where, Why, How
 *
 * @param {string} intention - User's typed intention
 * @returns {Object} - { valid, score, feedback, missing, details }
 */
export function validateIntention(intention) {
  if (!intention || intention.trim().length === 0) {
    return {
      valid: false,
      score: 0,
      feedback: "No intention provided. Type your question or situation to receive guidance.",
      missing: ['who', 'what', 'when', 'where', 'why', 'how'],
      details: {}
    };
  }

  const text = intention.toLowerCase();
  const analysis = {
    who: analyzeWho(text, intention),
    what: analyzeWhat(text, intention),
    when: analyzeWhen(text, intention),
    where: analyzeWhere(text, intention),
    why: analyzeWhy(text, intention),
    how: analyzeHow(text, intention)
  };

  // Calculate present elements
  const present = Object.entries(analysis).filter(([_, val]) => val.present).map(([key]) => key);
  const missing = Object.entries(analysis).filter(([_, val]) => !val.present).map(([key]) => key);

  // Weighted scoring: critical elements (who/what/why) matter more
  const weights = {
    who: 2.0,   // Critical - subject identification
    what: 2.0,  // Critical - action/topic
    why: 1.5,   // Important - motivation/context
    when: 0.5,  // Nice to have - temporal context
    where: 0.5, // Nice to have - spatial/domain context
    how: 0.5    // Nice to have - process/method
  };
  const maxScore = Object.values(weights).reduce((sum, w) => sum + w, 0); // 7.0

  // Calculate weighted score
  let weightedScore = 0;
  present.forEach(element => {
    weightedScore += weights[element] || 0;
  });

  const score = weightedScore / maxScore; // 0-1 scale
  const valid = score >= 0.43; // Need at least 3/7 weighted points (e.g., who + what)

  // Generate feedback
  const feedback = generateFeedback(analysis, present, missing, text);

  return {
    valid,
    score,
    feedback,
    missing,
    present,
    details: analysis
  };
}

/**
 * WHO: Identify subjects (people, entities, relationships)
 */
function analyzeWho(text, original) {
  const whoPatterns = [
    /\b(i|me|my|myself)\b/,
    /\b(we|us|our)\b/,
    /\b(he|she|they|him|her|them)\b/,
    // Romantic/intimate relationships
    /\b(partner|boyfriend|girlfriend|husband|wife|spouse|fianc[eé]|lover)\b/,
    /\b(ex|ex-girlfriend|ex-boyfriend|ex-wife|ex-husband|ex-partner)\b/,
    /\b(dating|crush|hookup|situationship)\b/,
    // Professional relationships
    /\b(boss|manager|supervisor|coworker|colleague|employee|subordinate)\b/,
    /\b(client|customer|vendor|supplier|contractor|freelancer)\b/,
    /\b(potential customer|prospective client|lead)\b/,
    /\b(mentor|coach|advisor|consultant|therapist|counselor)\b/,
    /\b(business partner|investor|stakeholder|shareholder)\b/,
    // Family relationships
    /\b(mother|mom|father|dad|parent|parents|stepmother|stepfather|step-parent)\b/,
    /\b(son|daughter|child|children|kid|kids|stepson|stepdaughter|stepchild)\b/,
    /\b(sibling|sister|brother|half-sister|half-brother|stepsister|stepbrother)\b/,
    /\b(grandmother|grandma|grandfather|grandpa|grandparent|grandparents)\b/,
    /\b(grandchild|grandchildren|grandson|granddaughter)\b/,
    /\b(aunt|auntie|uncle|niece|nephew)\b/,
    /\b(cousin|cousins)\b/,
    /\b(in-law|mother-in-law|father-in-law|sister-in-law|brother-in-law)\b/,
    /\b(family|relatives|extended family)\b/,
    // Social/community
    /\b(friend|best friend|close friend|old friend|childhood friend)\b/,
    /\b(acquaintance|neighbor|roommate|housemate)\b/,
    /\b(enemy|rival|competitor|adversary)\b/,
    /\b(stranger|someone|person|people)\b/,
    // Service/authority
    /\b(doctor|physician|nurse|dentist|therapist|psychiatrist|psychologist)\b/,
    /\b(teacher|professor|instructor|tutor)\b/,
    /\b(lawyer|attorney|accountant|financial advisor)\b/,
    /\b(landlord|tenant|property manager)\b/,
    /\b(police|officer|authority)\b/,
    // Contact status
    /\b(no contact|low contact|estranged)\b/,
    /\b(stay friends|stayed friends|friendly ex)\b/,
    /[A-Z][a-z]+\b/ // Proper names (must be last to avoid false positives)
  ];

  const matches = whoPatterns.filter(pattern => pattern.test(text));

  return {
    present: matches.length > 0,
    strength: matches.length > 1 ? 'strong' : matches.length === 1 ? 'weak' : 'none',
    details: matches.length > 0 ? 'Subject identified' : 'No clear subject'
  };
}

/**
 * WHAT: Identify action, situation, decision, or topic
 */
function analyzeWhat(text, original) {
  const whatPatterns = [
    /\b(should|can|could|would|will)\s+(i|we)\s+\w+/,
    /\b(quit|leave|start|join|move|apply|ask|tell|confront|end|begin|change)\b/,
    /\b(job|career|work|business|startup|project|relationship|marriage|house|apartment)\b/,
    /\b(decision|choice|opportunity|offer|problem|issue|situation|question)\b/,
    /\b(want|need|trying|hoping|planning|considering)\s+to\b/
  ];

  const matches = whatPatterns.filter(pattern => pattern.test(text));

  return {
    present: matches.length > 0,
    strength: matches.length > 1 ? 'strong' : matches.length === 1 ? 'weak' : 'none',
    details: matches.length > 0 ? 'Action/topic identified' : 'No clear action or topic'
  };
}

/**
 * WHEN: Identify timeframe or temporal context
 */
function analyzeWhen(text, original) {
  const whenPatterns = [
    /\b(now|today|tomorrow|tonight|this week|this month|this year|soon|eventually|immediately)\b/,
    /\b(next|last|past|future|current|recent|upcoming)\b/,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/,
    /\b(within|by|before|after|until|during)\s+\w+/,
    /\b\d+\s+(days?|weeks?|months?|years?)\b/
  ];

  const matches = whenPatterns.filter(pattern => pattern.test(text));

  return {
    present: matches.length > 0,
    strength: matches.length > 1 ? 'strong' : matches.length === 1 ? 'weak' : 'none',
    details: matches.length > 0 ? 'Timeframe mentioned' : 'No timeframe specified'
  };
}

/**
 * WHERE: Identify location, context, or domain
 */
function analyzeWhere(text, original) {
  const wherePatterns = [
    /\b(at|in|to|from)\s+(work|home|school|office|city|country|place)\b/,
    /\b(here|there|everywhere|nowhere|anywhere)\b/,
    /\b(relationship|career|business|family|workplace|community)\b/,
    /\b(online|remote|virtual|physical|in-person)\b/,
    /\b[A-Z][a-z]+\s+(city|state|country|university|company|corporation)\b/ // Place names
  ];

  const matches = wherePatterns.filter(pattern => pattern.test(text));

  return {
    present: matches.length > 0,
    strength: matches.length > 1 ? 'strong' : matches.length === 1 ? 'weak' : 'none',
    details: matches.length > 0 ? 'Location/context mentioned' : 'No location or context'
  };
}

/**
 * WHY: Identify motivation, reasoning, or emotional context
 */
function analyzeWhy(text, original) {
  const whyPatterns = [
    /\bbecause\b/,
    /\b(feel|feeling|felt)\s+\w+/,
    /\b(afraid|scared|worried|anxious|excited|hopeful|confused|stuck|lost|hurt|angry|frustrated)\b/,
    /\b(want|need|desire|wish|hope|fear|love|hate)\b/,
    /\b(in order to|so that|to)\b/,
    /\b(reason|purpose|goal|motivation|drive)\b/
  ];

  const matches = whyPatterns.filter(pattern => pattern.test(text));

  return {
    present: matches.length > 0,
    strength: matches.length > 1 ? 'strong' : matches.length === 1 ? 'weak' : 'none',
    details: matches.length > 0 ? 'Motivation/emotion present' : 'No clear motivation or emotion'
  };
}

/**
 * HOW: Identify process, method, or manner
 */
function analyzeHow(text, original) {
  const howPatterns = [
    /\bhow\s+(do|can|should|could|would|will)\b/,
    /\b(by|through|via|using|with)\s+\w+/,
    /\b(way|method|approach|strategy|process|plan)\b/,
    /\b(step|action|move|decision)\b/
  ];

  const matches = howPatterns.filter(pattern => pattern.test(text));

  return {
    present: matches.length > 0,
    strength: matches.length > 1 ? 'strong' : matches.length === 1 ? 'weak' : 'none',
    details: matches.length > 0 ? 'Process/method mentioned' : 'No process or method'
  };
}

/**
 * Generate human-readable feedback (max 100 words)
 */
function generateFeedback(analysis, present, missing, text) {
  // Check if critical elements (who, what, why) are present
  const hasCritical = present.includes('who') && present.includes('what');
  const hasWhy = present.includes('why');

  // Perfect - has who, what, why (achievable 100% with weighted scoring)
  if (hasCritical && hasWhy) {
    return "Perfect! Your intention has all critical elements (who, what, why). The cards will provide precise, actionable guidance.";
  }

  // Excellent - has who and what (achievable ~57% weighted score)
  if (hasCritical) {
    if (missing.length > 0) {
      return `Excellent foundation with who and what. Adding WHY (motivation/emotion) would unlock deeper insights: ${getMissingHelp('why')}`;
    }
    return "Excellent! Your intention is clear and specific. The cards will provide detailed guidance.";
  }

  // Good - has either who or what, plus others
  if (present.length >= 2 && (present.includes('who') || present.includes('what'))) {
    const critical = ['who', 'what'].filter(w => !present.includes(w));
    return `Good start. Missing critical element: ${critical[0].toUpperCase()} - ${getMissingHelp(critical[0])}. This will make your reading much more specific.`;
  }

  // Weak - missing critical elements
  const criticalMissing = ['who', 'what'].filter(w => !present.includes(w));
  if (criticalMissing.length > 0) {
    return `Too vague. Your intention needs ${criticalMissing.map(e => e.toUpperCase()).join(' and ')} to be answerable. Example: "Should I (WHO) quit my job (WHAT) because I'm burned out (WHY)?" Be specific.`;
  }

  // Very weak - 0-1 elements or no critical ones
  return `Too vague. Your intention needs WHO (you? someone else?), WHAT (what action/decision?), and WHY (what's the motivation?). Example: "Should I ask my boss for a raise because I've exceeded targets this quarter?" Be specific.`;
}

/**
 * Get specific help for missing element
 */
function getMissingHelp(element) {
  const help = {
    who: "Who is involved? You? Someone else?",
    what: "What's the specific action, decision, or situation?",
    when: "When is this happening? What's the timeframe?",
    where: "Where or in what context? Career, relationship, etc.?",
    why: "Why does this matter? What are you feeling?",
    how: "How are you approaching this? What's the process?"
  };
  return help[element] || "Add more context.";
}

/**
 * Get examples for improving intention
 */
export function getIntentionExamples() {
  return [
    {
      weak: "Should I quit?",
      strong: "Should I quit my job at Microsoft to start a coffee shop because I'm burned out and unfulfilled?",
      reason: "Added: WHO (I), WHAT (quit job at Microsoft, start coffee shop), WHERE (Microsoft, coffee shop), WHY (burned out, unfulfilled)"
    },
    {
      weak: "What about my relationship?",
      strong: "Should I have a difficult conversation with my partner Sarah about our lack of intimacy this weekend?",
      reason: "Added: WHO (my partner Sarah), WHAT (difficult conversation about intimacy), WHEN (this weekend)"
    },
    {
      weak: "Help with my career",
      strong: "How can I negotiate a 20% raise with my manager before my annual review in March given that I exceeded all Q4 targets?",
      reason: "Added: WHO (my manager), WHAT (negotiate 20% raise), WHEN (before annual review in March), WHY (exceeded Q4 targets), HOW (negotiate)"
    }
  ];
}

/**
 * LLM-powered intention critique
 * Provides deeper, more nuanced feedback than regex validation
 *
 * @param {string} intention - User's typed intention
 * @param {Object} context - Additional context (readingType, userProfile)
 * @returns {Object|null} - { critique, suggestions, improvedVersion } or null if LLM unavailable
 */
export async function critiqueIntentionWithLLM(intention, context = {}) {
  try {
    // Check if LLM is enabled
    const llmEnabled = await isEnhancementEnabled();
    if (!llmEnabled) {
      return null;
    }

    // Initialize LLM context
    const llmContext = await initializeLLM();
    if (!llmContext) {
      console.warn('[IntentionValidator] LLM not available, skipping critique');
      return null;
    }

    const { readingType = 'general' } = context;

    const prompt = `You are a tarot reader's assistant helping users refine their questions for better readings.

USER'S INTENTION: "${intention}"
READING TYPE: ${readingType}

Analyze this intention and provide:
1. CRITIQUE (2-3 sentences): What's missing or unclear? Be specific and direct.
2. SUGGESTIONS (bullet points): What specific details would make this question more answerable?
3. IMPROVED VERSION: Rewrite their intention with proper context (who, what, why, when).

Format your response EXACTLY like this:
CRITIQUE: [your critique here]

SUGGESTIONS:
• [suggestion 1]
• [suggestion 2]
• [suggestion 3]

IMPROVED: [improved intention here]

Be direct and helpful. Don't be overly positive - if the intention is vague, say so clearly.`;

    const startTime = Date.now();

    const response = await llmContext.completion({
      prompt,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 250,
      stop: ['\n\n---', 'USER:', 'READING:']
    });

    const inferenceTime = Date.now() - startTime;
    const output = response.text.trim();


    // Parse the response
    const critiqueMatch = output.match(/CRITIQUE:\s*([^\n]+(?:\n(?!SUGGESTIONS:|IMPROVED:)[^\n]+)*)/i);
    const suggestionsMatch = output.match(/SUGGESTIONS:\s*((?:•[^\n]+\n?)+)/i);
    const improvedMatch = output.match(/IMPROVED:\s*([^\n]+)/i);

    return {
      critique: critiqueMatch ? critiqueMatch[1].trim() : output,
      suggestions: suggestionsMatch
        ? suggestionsMatch[1].split('•').filter(s => s.trim()).map(s => s.trim())
        : [],
      improvedVersion: improvedMatch ? improvedMatch[1].trim() : null,
      inferenceTime,
      tokens: response.tokens_predicted
    };

  } catch (error) {
    console.error('[IntentionValidator] LLM critique error:', error);
    return null;
  }
}
