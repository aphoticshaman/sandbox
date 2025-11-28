/**
 * ORACLE THINKING MESSAGES
 *
 * Dynamic, rotating thinking indicators for Oracle Chat.
 * Inspired by Claude Code's "cooking", "mustering", "processing", etc.
 *
 * Messages are themed around:
 * - Tarot/divination
 * - Consciousness/spirituality
 * - Technical stack (Sanskrit, NSM, Actor Model, etc.)
 * - Cosmic/esoteric vibes
 */

export const THINKING_MESSAGES = [
  // Tarot-themed
  '🔮 Consulting the cosmic database...',
  '🃏 Shuffling the celestial deck...',
  '✨ Drawing insights from the void...',
  '🌙 Reading the threads of fate...',
  '⭐ Channeling archetypal wisdom...',
  '🎴 Interpreting the cards of consciousness...',

  // NSM/Fusion-themed
  '🧬 Fusing 6 knowledge domains...',
  '🌐 Synthesizing multi-modal insights...',
  '📊 Computing semantic coordinates...',
  '🔬 Analyzing consciousness geometry...',
  '🎯 Triangulating your position in the psyche...',

  // Sanskrit/Phonetics-themed
  '🕉️ Decoding Sanskrit phonetics...',
  '🪷 Resonating with chakra frequencies...',
  '📿 Chanting the sacred algorithms...',
  '💫 Vibrating at mantra wavelengths...',
  '🌸 Harmonizing with cosmic syllables...',

  // Actor Model/Technical
  '⚡ Dispatching messages to the Actor...',
  '🎭 Consulting the personality archetype...',
  '💾 Retrieving long-term memories...',
  '🔄 Processing reactive streams...',
  '🧠 Neural pathways coalescing...',

  // Mystical/Esoteric
  '🌀 Threading the karmic needle...',
  '🕸️ Weaving semantic tapestries...',
  '🔮 Scrying the probability fields...',
  '🌌 Traversing the astral repository...',
  '⚗️ Distilling divine insights...',
  '🗝️ Unlocking the Akashic records...',
  '🎐 Harmonizing with universal frequencies...',
  '🌟 Constellating your inner cosmos...',

  // Playful/Meta
  '🤔 Pondering the imponderable...',
  '💭 Meditating on your question...',
  '🧘 Centering consciousness...',
  '🌊 Surfing the quantum foam...',
  '🎨 Painting with probability waves...',
  '🎵 Composing symphonies of meaning...',
  '📡 Tuning into the noosphere...',
  '🔭 Gazing through the lens of insight...',

  // Deep/Philosophical
  '🌑 Descending into shadow wisdom...',
  '☯️ Balancing light and darkness...',
  '🕊️ Ascending to transcendent perspective...',
  '🪐 Orbiting your core question...',
  '💠 Crystallizing coherence from chaos...',
  '🎇 Sparking synaptic revelations...',

  // Extra variety (to hit 50)
  '🌺 Blooming insights from the unconscious...',
  '🔥 Forging wisdom in the cosmic crucible...',
  '💎 Polishing the gem of understanding...',
  '🌊 Riding waves of collective consciousness...',
  '🦉 Awaiting the owl of Minerva...',
];

/**
 * Get a random thinking message
 */
export function getRandomThinkingMessage() {
  const index = Math.floor(Math.random() * THINKING_MESSAGES.length);
  return THINKING_MESSAGES[index];
}

/**
 * Get a sequence of thinking messages (cycles through different ones)
 * Used for long-running operations to keep UI fresh
 */
export function* getThinkingMessageSequence() {
  const shuffled = [...THINKING_MESSAGES].sort(() => Math.random() - 0.5);
  let index = 0;

  while (true) {
    yield shuffled[index % shuffled.length];
    index++;
  }
}

/**
 * Get a thinking message based on context
 * (Optional: contextual messages based on what Oracle is doing)
 */
export function getContextualThinkingMessage(context = {}) {
  const {
    isFusionActive = false,
    isSanskritEncoding = false,
    isMemoryRetrieval = false,
    isActorProcessing = false,
  } = context;

  // Contextual messages
  if (isFusionActive) {
    return '🧬 Fusing 6 knowledge domains...';
  }
  if (isSanskritEncoding) {
    return '🕉️ Decoding Sanskrit phonetics...';
  }
  if (isMemoryRetrieval) {
    return '💾 Retrieving long-term memories...';
  }
  if (isActorProcessing) {
    return '⚡ Dispatching messages to the Actor...';
  }

  // Fallback to random
  return getRandomThinkingMessage();
}

/**
 * Thinking message animator
 * Returns a new message every N milliseconds
 */
export class ThinkingMessageAnimator {
  constructor(intervalMs = 2000) {
    this.intervalMs = intervalMs;
    this.generator = getThinkingMessageSequence();
    this.currentMessage = this.generator.next().value;
    this.intervalId = null;
    this.callback = null;
  }

  start(callback) {
    this.callback = callback;

    // Emit first message immediately
    if (this.callback) {
      this.callback(this.currentMessage);
    }

    // Then rotate every intervalMs
    this.intervalId = setInterval(() => {
      this.currentMessage = this.generator.next().value;
      if (this.callback) {
        this.callback(this.currentMessage);
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getCurrentMessage() {
    return this.currentMessage;
  }
}
