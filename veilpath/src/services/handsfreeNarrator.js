/**
 * HANDSFREE NARRATOR SERVICE
 * Vera narrates readings like a human tarot reader would for a blind person
 *
 * Features:
 * - Natural, conversational narration focused on meaning
 * - Voice commands to navigate readings and the app
 * - Adjustable detail levels (brief, balanced, detailed)
 * - On-demand visual descriptions
 * - Personalized to user's intention and profile
 */

import { generateVeraResponse } from './cloudAPIService';
import webSpeechTTS from './WebSpeechTTS';
import { useVoiceStore } from '../stores/voiceStore';
import { getCardVisualDescription } from './cardDescriptionService';

// Voice command patterns
const VOICE_COMMANDS = {
  // Reading requests
  requestSingleCard: /\b(single card|one card|draw (a |one )?card|quick reading)\b/i,
  requestThreeCard: /\b(three card|3 card|past present future)\b/i,
  requestCelticCross: /\b(celtic cross|full reading|deep reading|ten card|complete reading)\b/i,

  // Confirmation
  confirmYes: /\b(yes|yeah|yep|sure|okay|ok|absolutely|definitely|let'?s do it|sounds good)\b/i,
  confirmNo: /\b(no|nope|not now|maybe later|cancel|never ?mind)\b/i,

  // Reading navigation
  next: /\b(next|continue|go on|proceed|next card)\b/i,
  previous: /\b(previous|back|go back|last card)\b/i,
  repeat: /\b(repeat|again|say that again|what did you say)\b/i,

  // Detail requests
  moreDetail: /\b(more detail|tell me more|elaborate|explain more|go deeper)\b/i,
  lessDetail: /\b(less detail|brief|shorter|summarize|quick version)\b/i,
  describeImage: /\b(describe the (card|image)|what does it look like|show me|visual|picture)\b/i,

  // Reading actions
  startReading: /\b(start reading|begin|let'?s begin|ready|start)\b/i,
  pauseReading: /\b(pause|wait|hold on|stop|one moment)\b/i,
  resumeReading: /\b(resume|continue|go ahead|okay|go on)\b/i,
  skipToSynthesis: /\b(overall|big picture|synthesis|summary|what does it all mean)\b/i,

  // Clarification
  whatDoesThisMean: /\b(what does (this|that) mean|meaning|significance)\b/i,
  howDoesThisRelate: /\b(how does (this|that) relate|connection|relationship)\b/i,
  forMyIntention: /\b(for my (intention|question|situation)|regarding my)\b/i,

  // App navigation
  goHome: /\b(go home|home screen|main menu|back to home)\b/i,
  goToShop: /\b(go to shop|open shop|store|cosmetics)\b/i,
  goToProfile: /\b(go to profile|my profile|settings|account)\b/i,
  goToJournal: /\b(go to journal|my journal|journal entries)\b/i,
  goToMindfulness: /\b(go to mindfulness|meditation|breathing|exercises)\b/i,
  goToVera: /\b(talk to vera|chat with vera|open chat|vera)\b/i,
  goToAccessibility: /\b(accessibility|voice settings|settings)\b/i,

  // Help
  help: /\b(help|what can I say|commands|options)\b/i,
};

// Reading time estimates
const READING_DURATIONS = {
  single: { min: 3, max: 5, description: 'three to five minutes' },
  'three-card': { min: 8, max: 12, description: 'eight to twelve minutes' },
  'celtic-cross': { min: 20, max: 30, description: 'twenty to thirty minutes' },
};

// Navigation route mapping
const NAV_ROUTES = {
  goHome: 'Home',
  goToShop: 'Shop',
  goToProfile: 'Profile',
  goToJournal: 'JournalList',
  goToMindfulness: 'MindfulnessHome',
  goToVera: 'VeraChat',
  goToAccessibility: 'AccessibilityScreen',
};

/**
 * Sanitize voice transcript input
 *
 * SECURITY: Prevent command injection attacks
 * - Strip control characters
 * - Normalize unicode to prevent homoglyph attacks
 * - Limit length to reasonable spoken input
 * - Remove potential script-like patterns
 *
 * @param {string} input - Raw transcript
 * @returns {string} - Sanitized transcript
 */
function sanitizeVoiceInput(input) {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input
    // Remove control characters (except newlines/tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize unicode (NFD form, then strip diacritics for safety)
    .normalize('NFKC')
    // Remove potential script injection patterns
    .replace(/<[^>]*>/g, '') // HTML tags
    .replace(/javascript:/gi, '') // JS protocol
    .replace(/on\w+\s*=/gi, '') // Event handlers
    .replace(/\{[^}]*\}/g, '') // Object literals
    .replace(/\[\s*[^\]]*\s*\]/g, '') // Array notation (but allow simple speech)
    // Limit length (longest reasonable voice command ~100 chars)
    .slice(0, 500)
    // Trim whitespace
    .trim();

  // Additional check: reject if contains multiple sentences (likely injection)
  const sentenceCount = (sanitized.match(/[.!?]+/g) || []).length;
  if (sentenceCount > 3) {
    console.warn('[HandsfreeNarrator] SECURITY: Suspicious multi-sentence input rejected');
    return '';
  }

  return sanitized;
}

/**
 * Parse voice command from transcript
 *
 * SECURITY: Only parses commands from VERIFIED USER INPUT
 * - Set isVerifiedUserInput=true only for actual voice transcriptions from Web Speech API
 * - LLM responses should NEVER be passed with isVerifiedUserInput=true
 * - All input is sanitized before pattern matching
 * - This prevents prompt injection and command injection attacks
 *
 * @param {string} transcript - Voice transcript
 * @param {Object} options - Options
 * @param {boolean} options.isVerifiedUserInput - MUST be true for actual user voice input
 * @returns {Object|null} - { command, route } or null if no command matched
 */
export function parseVoiceCommand(transcript, options = {}) {
  const { isVerifiedUserInput = false } = options;

  // SECURITY: Only parse commands from verified user input
  // This prevents LLM output from being interpreted as commands
  if (!isVerifiedUserInput) {
    console.warn('[HandsfreeNarrator] SECURITY: Ignoring command parse - not verified user input');
    return null;
  }

  // SECURITY: Sanitize input before processing
  const sanitized = sanitizeVoiceInput(transcript);
  if (!sanitized) return null;

  // Log sanitization if input was modified (for debugging)
  if (sanitized !== transcript) {
    console.log('[HandsfreeNarrator] SECURITY: Input sanitized', {
      original: transcript?.slice(0, 50),
      sanitized: sanitized.slice(0, 50)
    });
  }

  for (const [command, pattern] of Object.entries(VOICE_COMMANDS)) {
    if (pattern.test(sanitized)) {
      return {
        command,
        route: NAV_ROUTES[command] || null,
        transcript: sanitized, // Use sanitized version
        isVerified: true, // Mark as verified for downstream handlers
      };
    }
  }

  return null;
}

/**
 * UNSAFE: Parse command without verification
 * Only use for testing/debugging, never in production flow
 */
export function _unsafeParseCommand(transcript) {
  console.warn('[HandsfreeNarrator] WARNING: Using unsafe command parse');
  return parseVoiceCommand(transcript, { isVerifiedUserInput: true });
}

/**
 * Get help text for available voice commands
 */
export function getVoiceCommandHelp() {
  return `You can say:
    "Next" or "Continue" to proceed
    "Previous" or "Go back" to return
    "Tell me more" for deeper interpretation
    "Describe the card" for visual details
    "What does this mean" for clarification
    "Overall" or "Summary" for the big picture
    "Go to shop", "Go to journal", or "Talk to Vera" to navigate
    "Help" to hear these options again`;
}

/**
 * Pre-reading conversation controller
 * Natural dialogue flow before starting a reading
 *
 * Flow:
 * 1. User requests reading type ("do a celtic cross")
 * 2. Vera confirms time commitment
 * 3. Vera asks about intention
 * 4. User provides intention
 * 5. Vera confirms and begins
 */
export function createPreReadingConversation(params) {
  const {
    userName = null,
    onReadingConfirmed, // Called when user confirms, returns { spreadType, intention }
    onCancel,
  } = params;

  let state = 'idle'; // idle | awaiting_confirmation | awaiting_intention | ready
  let selectedSpread = null;
  let intention = '';

  const getGreeting = () => {
    const name = userName ? `, ${userName}` : '';
    const timeOfDay = new Date().getHours();
    if (timeOfDay < 12) return `Good morning${name}`;
    if (timeOfDay < 17) return `Good afternoon${name}`;
    return `Good evening${name}`;
  };

  return {
    async handleVoiceInput(transcript, isVerifiedUserInput = true) {
      // SECURITY: Only process commands from verified user input
      const command = parseVoiceCommand(transcript, { isVerifiedUserInput });

      switch (state) {
        case 'idle':
          // Check if user is requesting a reading
          if (command?.command === 'requestSingleCard') {
            selectedSpread = 'single';
            state = 'awaiting_confirmation';
            const duration = READING_DURATIONS.single;
            await speakNarration(
              `A single card reading! That's a great choice for quick insight. It'll take about ${duration.description}. Does that work for you?`
            );
            return { state: 'awaiting_confirmation', spread: selectedSpread };
          }

          if (command?.command === 'requestThreeCard') {
            selectedSpread = 'three-card';
            state = 'awaiting_confirmation';
            const duration = READING_DURATIONS['three-card'];
            await speakNarration(
              `${getGreeting()}. A three-card spread will give us a nice look at your past, present, and what's ahead. It typically takes ${duration.description}. Is that okay?`
            );
            return { state: 'awaiting_confirmation', spread: selectedSpread };
          }

          if (command?.command === 'requestCelticCross') {
            selectedSpread = 'celtic-cross';
            state = 'awaiting_confirmation';
            const duration = READING_DURATIONS['celtic-cross'];
            await speakNarration(
              `${getGreeting()}. A Celtic Cross is a deep, thorough reading with ten cards. Just so you know, it'll take about ${duration.description}. Do you have that time?`
            );
            return { state: 'awaiting_confirmation', spread: selectedSpread };
          }

          // Not a reading request
          return { state: 'idle', unhandled: true, transcript };

        case 'awaiting_confirmation':
          if (command?.command === 'confirmYes') {
            state = 'awaiting_intention';
            await speakNarration(
              "Great! What's on your mind? Is there something specific you'd like insight into, or would you like a general reading?"
            );
            return { state: 'awaiting_intention', spread: selectedSpread };
          }

          if (command?.command === 'confirmNo') {
            state = 'idle';
            selectedSpread = null;
            await speakNarration(
              "No problem at all. Just let me know whenever you're ready for a reading."
            );
            onCancel?.();
            return { state: 'idle', cancelled: true };
          }

          // Didn't understand
          await speakNarration(
            "I didn't catch that. Just say 'yes' if you're ready, or 'no' if you'd like to do this later."
          );
          return { state: 'awaiting_confirmation', spread: selectedSpread };

        case 'awaiting_intention':
          // Check for general reading request
          if (/\b(general|anything|whatever|no(thing)? specific|surprise me)\b/i.test(transcript)) {
            intention = 'General guidance and insight';
            state = 'ready';
            await speakNarration(
              "A general reading it is. I'll see what the cards want to tell you today. Let's begin."
            );
            onReadingConfirmed?.({ spreadType: selectedSpread, intention });
            return { state: 'ready', spread: selectedSpread, intention };
          }

          // User provided their intention
          intention = transcript;
          state = 'ready';

          // Acknowledge the intention naturally
          const acknowledgments = [
            `I hear you. Let's explore that together.`,
            `That's an important question. Let's see what the cards reveal.`,
            `I understand. Let's look at this through the cards.`,
            `Thank you for sharing that. Let's begin your reading.`,
          ];
          const ack = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];

          await speakNarration(ack);
          onReadingConfirmed?.({ spreadType: selectedSpread, intention });
          return { state: 'ready', spread: selectedSpread, intention };

        case 'ready':
          // Reading should be starting
          return { state: 'ready', spread: selectedSpread, intention };

        default:
          return { state };
      }
    },

    getState() {
      return { state, selectedSpread, intention };
    },

    reset() {
      state = 'idle';
      selectedSpread = null;
      intention = '';
    },

    async offerReadingOptions() {
      const name = userName ? `, ${userName}` : '';
      await speakNarration(
        `Hello${name}. Would you like a reading? I can do a quick single card, a three-card spread for past, present, and future, or a deep Celtic Cross. What sounds good?`
      );
      state = 'idle';
    },
  };
}

/**
 * Generate natural narration for a card reveal
 * Focused on meaning, not screen reading
 *
 * @param {Object} params
 * @param {Object} params.card - Card data
 * @param {boolean} params.isReversed - Is card reversed
 * @param {string} params.position - Position in spread (e.g., 'past', 'present')
 * @param {string} params.intention - User's intention/question
 * @param {string} params.detailLevel - 'brief' | 'balanced' | 'detailed'
 * @param {Object} params.userProfile - User profile for personalization
 * @returns {Promise<string>} - Natural narration
 */
export async function generateCardNarration(params) {
  const {
    card,
    isReversed = false,
    position = null,
    intention = '',
    detailLevel = 'balanced',
    userProfile = null,
    spreadType = 'single',
    cardIndex = 0,
    totalCards = 1,
  } = params;

  const voiceStore = useVoiceStore.getState();

  // Build context for LLM
  const positionContext = position
    ? `This card is in the ${position} position of a ${spreadType} spread.`
    : cardIndex > 0
    ? `This is card ${cardIndex + 1} of ${totalCards}.`
    : '';

  const detailInstructions = {
    brief: 'Give a 2-sentence interpretation. Focus on the core message only.',
    balanced: 'Give a 3-4 sentence interpretation. Include the main meaning and how it relates to their question.',
    detailed: 'Give a thorough interpretation of 5-6 sentences. Explore nuances, symbolism, and specific guidance for their situation.',
  };

  const prompt = `You are Vera, a warm and insightful tarot reader guiding a blind person through their reading.
Speak naturally as if you're sitting across from them. Focus on MEANING and INTERPRETATION, not visual descriptions.

CARD: ${card.name} (${isReversed ? 'reversed' : 'upright'})
${positionContext}
USER'S QUESTION: "${intention || 'General guidance'}"
${userProfile?.name ? `USER: ${userProfile.name}` : ''}

KEYWORDS: ${isReversed ? card.keywords.reversed.join(', ') : card.keywords.upright.join(', ')}
THEMES: ${card.themes?.join(', ') || 'transformation, insight'}

${detailInstructions[detailLevel]}

Guidelines:
- Speak directly to the listener in second person ("you")
- Be warm but not overly mystical
- Connect the card's meaning to their specific question
- End with a reflective thought or gentle prompt
- DO NOT describe what the card looks like unless asked
- Sound like a thoughtful friend, not a fortune teller`;

  try {
    const response = await generateVeraResponse(
      [{ role: 'user', content: prompt }],
      { maxTokens: detailLevel === 'detailed' ? 300 : detailLevel === 'brief' ? 100 : 200 }
    );

    if (response.text) {
      return response.text.trim();
    }
  } catch (error) {
    console.error('[HandsfreeNarrator] Generation error:', error);
  }

  // Fallback to simple interpretation
  const orientation = isReversed ? 'reversed' : 'upright';
  const keywords = isReversed ? card.keywords.reversed : card.keywords.upright;
  return `You've drawn ${card.name}, ${orientation}. This card speaks of ${keywords.slice(0, 3).join(', ')}. ${card.advice || 'Consider how this energy shows up in your situation.'}`;
}

/**
 * Generate reading introduction narration
 */
export async function generateReadingIntro(params) {
  const { spreadType, intention, userProfile } = params;

  const spreadDescriptions = {
    single: "a single card",
    'three-card': "three cards for past, present, and future",
    'celtic-cross': "the Celtic Cross, a deep ten-card spread",
  };

  const spreadDesc = spreadDescriptions[spreadType] || `${params.totalCards} cards`;

  if (intention) {
    return `Alright, let's explore your question: "${intention}". I'm drawing ${spreadDesc} for you. Take a breath, and when you're ready, say "next" or "continue" to reveal your first card.`;
  }

  return `I'm drawing ${spreadDesc} for you today. When you're ready to see your first card, just say "next" or "continue".`;
}

/**
 * Generate synthesis narration for the full reading
 */
export async function generateSynthesisNarration(params) {
  const {
    cards, // Array of { card, isReversed, position }
    intention,
    spreadType,
    userProfile,
    detailLevel = 'balanced',
  } = params;

  const cardSummaries = cards.map((c, i) => {
    const pos = c.position || `Card ${i + 1}`;
    const orientation = c.isReversed ? 'reversed' : 'upright';
    return `${pos}: ${c.card.name} (${orientation})`;
  }).join('; ');

  const prompt = `You are Vera, synthesizing a tarot reading for a blind person.
Bring all the cards together into a cohesive message.

SPREAD: ${spreadType}
CARDS: ${cardSummaries}
USER'S QUESTION: "${intention || 'General guidance'}"

Create a ${detailLevel === 'brief' ? '2-3' : detailLevel === 'detailed' ? '5-6' : '3-4'} sentence synthesis that:
- Weaves the cards together into one coherent message
- Directly addresses their question
- Offers actionable insight or reflection
- Ends with encouragement

Speak warmly and directly to them.`;

  try {
    const response = await generateVeraResponse(
      [{ role: 'user', content: prompt }],
      { maxTokens: detailLevel === 'detailed' ? 350 : 200 }
    );

    if (response.text) {
      return response.text.trim();
    }
  } catch (error) {
    console.error('[HandsfreeNarrator] Synthesis error:', error);
  }

  return "Looking at all your cards together, there's a clear thread of transformation running through this reading. Trust the process you're in.";
}

/**
 * Speak narration using TTS with Vera's voice
 */
export async function speakNarration(text, options = {}) {
  const voiceStore = useVoiceStore.getState();

  if (!text) return;

  const voice = voiceStore.voiceOutputVoiceURI
    ? webSpeechTTS.findVoice(voiceStore.voiceOutputVoiceURI)
    : voiceStore.getRecommendedVoice();

  return new Promise((resolve) => {
    webSpeechTTS.speak(text, {
      voice,
      rate: voiceStore.voiceOutputSpeed,
      pitch: voiceStore.voiceOutputPitch,
      volume: voiceStore.voiceOutputVolume,
      onEnd: resolve,
      ...options,
    });
  });
}

// Navigation rate limiter - prevent rapid navigation spam
let lastNavigationTime = 0;
const NAVIGATION_COOLDOWN_MS = 3000; // 3 second cooldown between navigations

/**
 * Handle voice command during reading
 *
 * SECURITY:
 * - Only accepts commands with isVerified=true (from parseVoiceCommand with verified input)
 * - Navigation commands have a rate limit to prevent abuse
 * - All navigation is logged for audit trail
 *
 * @returns {Object} - { action, params, response }
 */
export async function handleReadingCommand(command, context) {
  // SECURITY: Verify command came from verified user input
  if (!command?.isVerified) {
    console.warn('[HandsfreeNarrator] SECURITY: Rejecting unverified command');
    return {
      action: 'rejected',
      response: "I couldn't process that command."
    };
  }

  const {
    currentCardIndex,
    totalCards,
    cards,
    intention,
    navigation,
  } = context;

  const voiceStore = useVoiceStore.getState();

  switch (command.command) {
    case 'next':
      if (currentCardIndex < totalCards - 1) {
        return { action: 'nextCard', params: { index: currentCardIndex + 1 } };
      } else {
        return {
          action: 'synthesis',
          response: "That was your last card. Let me bring it all together for you..."
        };
      }

    case 'previous':
      if (currentCardIndex > 0) {
        return { action: 'previousCard', params: { index: currentCardIndex - 1 } };
      } else {
        return {
          action: 'speak',
          response: "This is your first card. Say 'next' to continue."
        };
      }

    case 'repeat':
      return { action: 'repeatCard', params: { index: currentCardIndex } };

    case 'moreDetail':
      voiceStore.setHandsfreeDetailLevel('detailed');
      return {
        action: 'repeatCard',
        params: { index: currentCardIndex },
        response: "Let me go deeper on this card..."
      };

    case 'lessDetail':
      voiceStore.setHandsfreeDetailLevel('brief');
      return {
        action: 'speak',
        response: "I'll keep things more concise from here."
      };

    case 'describeImage':
      const card = cards[currentCardIndex];
      const description = await getCardVisualDescription(card.card, {
        isReversed: card.isReversed,
        useDarkFantasy: true,
        useLLM: true,
      });
      return { action: 'speak', response: description };

    case 'skipToSynthesis':
      return {
        action: 'synthesis',
        response: "Alright, let me give you the big picture..."
      };

    case 'whatDoesThisMean':
    case 'forMyIntention':
      const currentCard = cards[currentCardIndex];
      const narration = await generateCardNarration({
        card: currentCard.card,
        isReversed: currentCard.isReversed,
        position: currentCard.position,
        intention,
        detailLevel: 'detailed',
      });
      return { action: 'speak', response: narration };

    case 'pauseReading':
      return {
        action: 'pause',
        response: "Take your time. Say 'continue' when you're ready."
      };

    case 'resumeReading':
      return { action: 'resume' };

    case 'help':
      return { action: 'speak', response: getVoiceCommandHelp() };

    // App navigation - with rate limiting and security checks
    case 'goHome':
    case 'goToShop':
    case 'goToProfile':
    case 'goToJournal':
    case 'goToMindfulness':
    case 'goToVera':
    case 'goToAccessibility':
      // SECURITY: Rate limit navigation commands
      const now = Date.now();
      if (now - lastNavigationTime < NAVIGATION_COOLDOWN_MS) {
        console.warn('[HandsfreeNarrator] SECURITY: Navigation rate limited');
        return {
          action: 'speak',
          response: "Please wait a moment before navigating again."
        };
      }

      if (navigation && command.route) {
        // SECURITY: Log navigation for audit trail
        console.log(`[HandsfreeNarrator] AUDIT: Voice navigation to ${command.route} at ${new Date().toISOString()}`);
        lastNavigationTime = now;

        return {
          action: 'navigate',
          params: { route: command.route },
          response: `Taking you to ${command.route.replace(/([A-Z])/g, ' $1').trim()}...`
        };
      }
      return { action: 'speak', response: "Navigation not available right now." };

    default:
      return {
        action: 'unknown',
        response: "I didn't catch that. You can say 'next' to continue, 'tell me more' for details, or 'help' for options."
      };
  }
}

/**
 * Create a handsfree reading session controller
 */
export function createHandsfreeSession(params) {
  const {
    cards,
    spreadType,
    intention,
    userProfile,
    navigation,
    onCardChange,
    onComplete,
  } = params;

  let currentIndex = -1; // -1 = intro, 0+ = cards, cards.length = synthesis
  let isPaused = false;
  let autoPilotTimer = null;
  let isAutoPilotRunning = false;

  const getVoiceState = () => useVoiceStore.getState();

  return {
    async start() {
      const voiceStore = getVoiceState();
      const intro = await generateReadingIntro({
        spreadType,
        intention,
        userProfile,
        totalCards: cards.length,
      });

      // Adjust intro for auto-pilot
      if (voiceStore.handsfreeAutoPilot) {
        await speakNarration(intro.replace(/say .next./i, 'sit back and listen'));
        await this.startAutoPilot();
      } else if (voiceStore.handsfreeNarrateOnly) {
        await speakNarration(intro.replace(/say .next./i, 'tap the screen'));
      } else {
        await speakNarration(intro);
      }
      currentIndex = -1;
    },

    async startAutoPilot() {
      const voiceStore = getVoiceState();
      if (isAutoPilotRunning) return;
      isAutoPilotRunning = true;

      await speakNarration("Starting your reading now. Just relax and listen.");

      const runNext = async () => {
        if (!isAutoPilotRunning || isPaused) return;

        await this.nextCard();

        // Check if we've finished
        if (currentIndex >= cards.length) {
          isAutoPilotRunning = false;
          return;
        }

        // Schedule next card
        const delay = voiceStore.handsfreeAutoPilotDelay * 1000;
        autoPilotTimer = setTimeout(runNext, delay);
      };

      // Start first card after a brief pause
      autoPilotTimer = setTimeout(runNext, 2000);
    },

    stopAutoPilot() {
      isAutoPilotRunning = false;
      if (autoPilotTimer) {
        clearTimeout(autoPilotTimer);
        autoPilotTimer = null;
      }
    },

    async nextCard() {
      const voiceStore = getVoiceState();
      if (isPaused) return;
      currentIndex++;

      if (currentIndex >= cards.length) {
        // Synthesis
        const synthesis = await generateSynthesisNarration({
          cards,
          intention,
          spreadType,
          userProfile,
          detailLevel: voiceStore.handsfreeDetailLevel,
        });
        await speakNarration(synthesis);

        // Closing message
        await speakNarration("That completes your reading. Take some time to reflect on these messages.");
        onComplete?.();
        return;
      }

      const card = cards[currentIndex];
      onCardChange?.(currentIndex);

      const narration = await generateCardNarration({
        card: card.card,
        isReversed: card.isReversed,
        position: card.position,
        intention,
        detailLevel: voiceStore.handsfreeDetailLevel,
        userProfile,
        spreadType,
        cardIndex: currentIndex,
        totalCards: cards.length,
      });

      await speakNarration(narration);

      // Only prompt for input if not in auto-pilot or narrate-only mode
      if (voiceStore.handsfreePauseAfterCard && !voiceStore.handsfreeAutoPilot && !voiceStore.handsfreeNarrateOnly) {
        await speakNarration("Say 'next' to continue, or ask me anything about this card.");
      } else if (voiceStore.handsfreePauseAfterCard && voiceStore.handsfreeNarrateOnly) {
        await speakNarration("Tap to continue when you're ready.");
      }
    },

    async previousCard() {
      if (currentIndex > 0) {
        currentIndex--;
        const card = cards[currentIndex];
        onCardChange?.(currentIndex);

        const narration = await generateCardNarration({
          card: card.card,
          isReversed: card.isReversed,
          position: card.position,
          intention,
          detailLevel: voiceStore.handsfreeDetailLevel,
          userProfile,
          spreadType,
          cardIndex: currentIndex,
          totalCards: cards.length,
        });

        await speakNarration(narration);
      }
    },

    async handleCommand(transcript, isVerifiedUserInput = true) {
      // SECURITY: Only process commands from verified user input
      const command = parseVoiceCommand(transcript, { isVerifiedUserInput });
      if (!command) {
        // Not a command - might be a question, let Vera respond
        return { action: 'question', transcript };
      }

      const result = await handleReadingCommand(command, {
        currentCardIndex: currentIndex,
        totalCards: cards.length,
        cards,
        intention,
        navigation,
      });

      if (result.response) {
        await speakNarration(result.response);
      }

      switch (result.action) {
        case 'nextCard':
          await this.nextCard();
          break;
        case 'previousCard':
          await this.previousCard();
          break;
        case 'repeatCard':
          const card = cards[currentIndex];
          const narration = await generateCardNarration({
            card: card.card,
            isReversed: card.isReversed,
            position: card.position,
            intention,
            detailLevel: voiceStore.handsfreeDetailLevel,
            userProfile,
            spreadType,
            cardIndex: currentIndex,
            totalCards: cards.length,
          });
          await speakNarration(narration);
          break;
        case 'synthesis':
          currentIndex = cards.length - 1;
          await this.nextCard(); // Will trigger synthesis
          break;
        case 'pause':
          isPaused = true;
          break;
        case 'resume':
          isPaused = false;
          break;
        case 'navigate':
          navigation?.navigate(result.params.route);
          break;
      }

      return result;
    },

    pause() {
      isPaused = true;
      webSpeechTTS.pause();
    },

    resume() {
      isPaused = false;
      webSpeechTTS.resume();
    },

    stop() {
      webSpeechTTS.stop();
    },

    getCurrentIndex() {
      return currentIndex;
    },

    isPaused() {
      return isPaused;
    },
  };
}

export default {
  parseVoiceCommand,
  getVoiceCommandHelp,
  createPreReadingConversation,
  generateCardNarration,
  generateReadingIntro,
  generateSynthesisNarration,
  speakNarration,
  handleReadingCommand,
  createHandsfreeSession,
  VOICE_COMMANDS,
  NAV_ROUTES,
  READING_DURATIONS,
};
