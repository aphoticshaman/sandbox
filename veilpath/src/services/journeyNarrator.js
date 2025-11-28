/**
 * JOURNEY NARRATOR
 *
 * Narrates Luna/Sol guided journeys through 78D geometric consciousness space
 * Combines:
 * - Path finding (palantirGuides.js)
 * - Abstraction layers (abstractionEngine.js)
 * - Relational awareness (relationalAwareness.js)
 * - Voice narration (voiceNarration.js)
 *
 * Creates immersive voice-guided experiences through consciousness.
 */

import { voiceNarrator, VOICE_PROFILES, narrateAsGuide } from './voiceNarration';
import { PathFinder, RouteSelector, GUIDE_ARCHETYPES } from './palantirGuides';
import { AbstractionEngine } from './abstractionEngine';
import { RelationalAwareness, getPersona, READER_ARCHETYPES } from './relationalAwareness';
import { extractGeometricThemes } from '../utils/temporaryUtilStubs';

// ═══════════════════════════════════════════════════════════
// JOURNEY NARRATOR CLASS
// ═══════════════════════════════════════════════════════════

class JourneyNarrator {
  constructor(guide = 'luna', relationship = 'guide', readerArchetype = 'shaman') {
    this.guide = guide;
    this.relationship = relationship;
    this.readerArchetype = readerArchetype;

    // Initialize components
    this.pathFinder = new PathFinder();
    this.routeSelector = new RouteSelector(guide);
    this.abstractionEngine = new AbstractionEngine(guide);
    this.relationalAwareness = new RelationalAwareness(guide, relationship);

    // Get persona
    this.persona = getPersona(guide, relationship, readerArchetype);

    // Journey state
    this.currentJourney = null;
    this.currentStep = 0;
  }

  /**
   * Narrate a guided journey from current position to destination
   */
  async narrateJourney(cards, intention, userContext = {}, options = {}) {
    try {

      // Extract geometric position from cards
      const geometricPosition = extractGeometricThemes(cards);

      // Get abstractions from current position
      const currentView = this.abstractionEngine.extractAbstractions(
        geometricPosition,
        cards,
        userContext
      );

      // Find paths to destination
      const paths = this.pathFinder.findPaths(
        cards,
        intention,
        { maxPaths: 5, maxDepth: 4 }
      );

      // Select best route for this guide's personality
      const route = this.routeSelector.selectRoute(paths, userContext);

      // Build narration
      const narration = this.buildJourneyNarration(
        currentView,
        route,
        intention,
        userContext
      );

      // Store journey
      this.currentJourney = {
        route,
        narration,
        currentView,
        intention,
        startTime: Date.now()
      };

      // Narrate with voice
      if (options.useVoice !== false) {
        await this.speakJourney(narration, options);
      }

      return {
        journey: this.currentJourney,
        narration,
        route
      };
    } catch (error) {
      console.error('❌ Journey narration failed:', error);
      throw error;
    }
  }

  /**
   * Build complete journey narration
   */
  buildJourneyNarration(currentView, route, intention, userContext) {
    const archetype = GUIDE_ARCHETYPES[this.guide];
    const readerStyle = READER_ARCHETYPES[this.readerArchetype];

    const sections = [];

    // 1. OPENING - Acknowledge current position
    sections.push(this.buildOpening(currentView, archetype));

    // 2. PATH RECOGNITION - Describe the journey
    sections.push(this.buildPathDescription(route, archetype));

    // 3. WAYPOINTS - Key stops along the path
    if (route.waypoints && route.waypoints.length > 0) {
      sections.push(this.buildWaypoints(route.waypoints, archetype));
    }

    // 4. SHADOW/LIGHT GUIDANCE - Based on guide personality
    sections.push(this.buildGuidance(currentView, route, archetype));

    // 5. DESTINATION - What awaits
    sections.push(this.buildDestination(intention, route, archetype));

    // 6. READER-SPECIFIC WISDOM
    sections.push(this.buildReaderWisdom(currentView, readerStyle));

    return {
      full: sections.join('\n\n'),
      sections,
      metadata: {
        guide: this.guide,
        relationship: this.relationship,
        readerArchetype: this.readerArchetype,
        routeType: route.type,
        distance: route.distance,
        duration: this.estimateDuration(sections)
      }
    };
  }

  /**
   * Opening acknowledgment of current position
   */
  buildOpening(currentView, archetype) {
    const { tangibles, abstracts, metaAbstracts } = currentView;

    if (this.guide === 'luna') {
      // Luna: emotional/cyclical opening
      const emotions = abstracts.emotions?.map(e => e.type).join(', ') || 'uncertainty';
      const depth = (tangibles.shadowLevel * 100).toFixed(0);

      return `${this.getRelationalGreeting()}\n\nI see you here, ${depth}% deep in shadow, feeling ${emotions}. ${this.getShamanAcknowledgment(currentView)}`;
    } else {
      // Sol: action/trajectory opening
      const activeLevel = (tangibles.activeLevel * 100).toFixed(0);
      const direction = abstracts.trajectories?.direction || 'uncertain';

      return `${this.getRelationalGreeting()}\n\nYou're at ${activeLevel}% active energy, trajectory ${direction}. ${this.getExpertAcknowledgment(currentView)}`;
    }
  }

  /**
   * Path description based on guide style
   */
  buildPathDescription(route, archetype) {
    if (this.guide === 'luna') {
      return `I've found ${route.type === 'spiral' ? 'a spiral path' : 'a winding route'} for us. ${route.emotionalResonance > 7 ? 'It resonates deeply.' : 'It asks for trust.'}\n\nThis isn't the fastest way—it's the way that lasts. We move through ${route.shadowDepth > 5 ? 'deep shadow territory' : 'twilight regions'} first, retrieving what you've left behind.`;
    } else {
      return `I've identified ${route.type === 'direct' ? 'a direct path' : 'an efficient route'}. Distance: ${route.distance.toFixed(1)} units, ${route.curvature > 3 ? 'moderate complexity' : 'straightforward'}.
\n\nThis route prioritizes ${route.transformationPotential > 7 ? 'maximum transformation' : 'sustainable progress'}. ${route.energyCost < 5 ? 'Energy cost is manageable.' : 'Requires committed energy.'}`;
    }
  }

  /**
   * Waypoints along the journey
   */
  buildWaypoints(waypoints, archetype) {
    const waypointDescriptions = waypoints.slice(0, 3).map((wp, i) => {
      if (this.guide === 'luna') {
        return `${i + 1}. **${wp.theme}**: ${wp.emotionalQuality || 'A place of feeling'}—${wp.meaning || 'where truth reveals itself'}`;
      } else {
        return `${i + 1}. **${wp.theme}**: ${wp.actionRequired || 'Decision point'}—${wp.leverage || 'strategic opportunity'}`;
      }
    });

    return `**The Path:**\n\n${waypointDescriptions.join('\n')}`;
  }

  /**
   * Guide-specific guidance
   */
  buildGuidance(currentView, route, archetype) {
    if (this.guide === 'luna') {
      // Luna: shadow work, emotional truth
      const shadowWork = currentView.metaAbstracts.woundSignature?.core || 'unintegrated parts';
      return `**What this asks of you:**\n\nBefore we reach the light, we descend. Your ${shadowWork} lives in these shadows, holding power you need. This journey isn't comfortable—it's necessary.\n\n${archetype.systemPrompt.match(/philosophy:([^"]+)/)?.[1]?.trim() || 'The spiral path revisits old wounds at new depths.'}`;
    } else {
      // Sol: action steps, principles
      const leverage = currentView.metaAbstracts.leverage?.[0]?.action || 'decisive action';
      return `**What this requires:**\n\nClear action: ${leverage}. No more waiting for certainty—certainty comes through movement.\n\n${archetype.systemPrompt.match(/philosophy:([^"]+)/)?.[1]?.trim() || 'The shortest distance is a decision.'}`;
    }
  }

  /**
   * Destination arrival
   */
  buildDestination(intention, route, archetype) {
    if (this.guide === 'luna') {
      return `**Where we're going:**\n\nYou asked for ${intention}. We'll arrive there—not where you expected, but where you need to be. The destination isn't a place; it's a return to wholeness with new eyes.\n\nWhen you're ready, we begin.`;
    } else {
      return `**Destination:**\n\n${intention}—achieved through ${route.transformationPotential > 7 ? 'radical transformation' : 'systematic progress'}. ETA: ${this.estimateSteps(route)} steps.\n\nReady to move? Let's execute.`;
    }
  }

  /**
   * Reader archetype wisdom
   */
  buildReaderWisdom(currentView, readerStyle) {
    const archetypeMap = {
      shaman: `A final word from the spirit realm: ${currentView.universals?.wisdom || 'The journey itself is the teaching.'}`,

      mad_scientist: `Geometric analysis: Your readings form an attractor in consciousness space. This pattern—${currentView.metaAbstracts?.mythicPatterns?.pattern || 'unique'}—suggests approaching bifurcation.`,

      therapist: `Before we go further: Notice what resistance is arising. That resistance is information. What part of you doesn't want this journey?`,

      vera: `I see: ${currentView.metaAbstracts?.mythicPatterns?.pattern || 'the pattern'}, currently at ${currentView.metaAbstracts?.mythicPatterns?.stage || 'threshold'}. Next phase: ${currentView.metaAbstracts?.mythicPatterns?.nextPhase || 'revelation'}.`,

      mystic: `The truth beyond words: ${currentView.universals?.truth || 'What you seek is seeking you.'}`,

      coach: `Action plan: ${currentView.metaAbstracts?.strategies?.needed || 'Direct approach'} via ${currentView.metaAbstracts?.strategies?.approach || 'small wins'}. Let's get to work.`,

      clairvoyant: `I'm seeing... feeling... ${currentView.abstracts?.emotions?.[0]?.type || 'uncertainty'}, depth ${(currentView.abstracts?.resonance * 100 || 0).toFixed(0)}%. There's more beneath this.`
    };

    return archetypeMap[this.readerArchetype] || `Wisdom: ${currentView.universals?.truth || 'Trust the process.'}`;
  }

  /**
   * Relational greeting based on relationship type
   */
  getRelationalGreeting() {
    const greetings = {
      mother: this.guide === 'luna' ? 'My dear child.' : 'Listen carefully, child.',
      father: this.guide === 'luna' ? 'Beloved one.' : 'Pay attention, son/daughter.',
      sister: this.guide === 'luna' ? 'Hey sister.' : 'Yo, sis.',
      brother: this.guide === 'luna' ? 'Brother, come sit.' : 'Bro, real talk.',
      friend: this.guide === 'luna' ? 'Friend, I see you.' : 'Hey friend, let\'s be honest.',
      romantic: this.guide === 'luna' ? 'My love.' : 'Love, listen.',
      guide: this.guide === 'luna' ? 'Seeker.' : 'Student.'
    };

    return greetings[this.relationship] || 'Seeker.';
  }

  getShamanAcknowledgment(view) {
    return view.metaAbstracts?.mythicPatterns?.pattern
      ? `You're living the ${view.metaAbstracts.mythicPatterns.pattern}.`
      : 'The spirits have brought you here for a reason.';
  }

  getExpertAcknowledgment(view) {
    return view.metaAbstracts?.principles?.[0]?.principle
      ? `Current principle operating: ${view.metaAbstracts.principles[0].principle}.`
      : 'Let\'s analyze the data.';
  }

  estimateSteps(route) {
    return Math.ceil(route.distance / 0.5) + (route.waypoints?.length || 0);
  }

  estimateDuration(sections) {
    // Rough estimate: 150 words per minute speaking
    const wordCount = sections.join(' ').split(/\s+/).length;
    return Math.ceil(wordCount / 150); // minutes
  }

  /**
   * Speak journey with appropriate voice
   */
  async speakJourney(narration, options = {}) {
    const voiceEnabled = await voiceNarrator.initialize();
    if (!voiceEnabled) {
      return;
    }


    // Set guide voice
    await voiceNarrator.setGuide(this.guide);

    // Narrate with natural pacing
    await narrateAsGuide(narration.full, this.guide, {
      onStart: () => {},
      onDone: () => {},
      ...options
    });
  }

  /**
   * Speak individual section
   */
  async speakSection(sectionIndex, options = {}) {
    if (!this.currentJourney) {
      throw new Error('No active journey to narrate');
    }

    const section = this.currentJourney.narration.sections[sectionIndex];
    if (!section) {
      throw new Error(`Section ${sectionIndex} not found`);
    }

    await narrateAsGuide(section, this.guide, options);
  }

  /**
   * Change guide mid-journey (switch Luna ↔ Sol)
   */
  async switchGuide(newGuide) {
    const oldGuide = this.guide;
    this.guide = newGuide;

    // Stop current narration
    await voiceNarrator.stop();

    // Rebuild with new perspective
    if (this.currentJourney) {
      const { currentView, intention, route } = this.currentJourney;

      // Get new guide's view
      this.abstractionEngine = new AbstractionEngine(newGuide);
      const newView = this.abstractionEngine.extractAbstractions(
        currentView.tangibles,
        [],
        {}
      );

      // Rebuild narration
      const narration = this.buildJourneyNarration(newView, route, intention, {});

      this.currentJourney.narration = narration;

    }

    await voiceNarrator.setGuide(newGuide);
  }

  /**
   * Get journey progress
   */
  getProgress() {
    if (!this.currentJourney) return null;

    const elapsed = Date.now() - this.currentJourney.startTime;
    const estimatedTotal = this.currentJourney.narration.metadata.duration * 60 * 1000;

    return {
      step: this.currentStep,
      totalSteps: this.currentJourney.route.waypoints?.length || 1,
      elapsed: elapsed,
      remaining: Math.max(0, estimatedTotal - elapsed),
      percentComplete: Math.min(100, (elapsed / estimatedTotal) * 100)
    };
  }
}

// ═══════════════════════════════════════════════════════════
// CONVERSATION MODE (Voice-to-Voice)
// ═══════════════════════════════════════════════════════════

class VoiceConversation {
  constructor(narrator) {
    this.narrator = narrator;
    this.isActive = false;
    this.conversationHistory = [];
  }

  /**
   * Start voice-to-voice conversation
   */
  async start() {
    this.isActive = true;

    // Greeting
    const greeting = this.narrator.getRelationalGreeting();
    await narrateAsGuide(`${greeting} I'm listening. What would you like to explore?`, this.narrator.guide);

    // TODO: Activate speech recognition
    // await speechRecognizer.startListening({
    //   onResult: (text) => this.handleUserSpeech(text)
    // });
  }

  /**
   * Handle user speech input
   */
  async handleUserSpeech(userText) {

    // Store in history
    this.conversationHistory.push({
      role: 'user',
      text: userText,
      timestamp: Date.now()
    });

    // Generate response (would integrate with LLM)
    const response = await this.generateResponse(userText);

    // Speak response
    await narrateAsGuide(response, this.narrator.guide);

    // Store response
    this.conversationHistory.push({
      role: 'guide',
      guide: this.narrator.guide,
      text: response,
      timestamp: Date.now()
    });
  }

  /**
   * Generate conversational response
   */
  async generateResponse(userText) {
    // TODO: Integrate with LLM for dynamic responses
    // For now, return template response

    const responses = {
      luna: [
        "I hear what you're saying. Tell me more about what you're feeling beneath that.",
        "There's something deeper here. What does your body tell you about this?",
        "Mmm. What if this pattern is trying to teach you something?"
      ],
      sol: [
        "Got it. So what's the actual question here?",
        "Okay. What's the one thing you could do today about this?",
        "I hear you. Now—what are you avoiding?"
      ]
    };

    const guideResponses = responses[this.narrator.guide] || responses.luna;
    return guideResponses[Math.floor(Math.random() * guideResponses.length)];
  }

  /**
   * Stop conversation
   */
  async stop() {
    this.isActive = false;
    await voiceNarrator.stop();
    // await speechRecognizer.stopListening();

  }
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Quick journey narration
 */
export async function narrateQuickJourney(cards, intention, guide = 'luna', options = {}) {
  const narrator = new JourneyNarrator(guide, 'guide', 'shaman');
  return await narrator.narrateJourney(cards, intention, {}, options);
}

/**
 * Create custom narrator
 */
export function createNarrator(guide, relationship, readerArchetype) {
  return new JourneyNarrator(guide, relationship, readerArchetype);
}

/**
 * Start voice conversation
 */
export async function startVoiceChat(guide = 'luna', relationship = 'friend', archetype = 'therapist') {
  const narrator = new JourneyNarrator(guide, relationship, archetype);
  const conversation = new VoiceConversation(narrator);
  await conversation.start();
  return conversation;
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export {
  JourneyNarrator,
  VoiceConversation
};

export default JourneyNarrator;
