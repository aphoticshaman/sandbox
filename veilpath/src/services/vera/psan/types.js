/**
 * PSAN (Predictive Scaffold Attention Networks) - Patent #504
 * Type definitions for Tri-Fork multi-stream synthesis
 *
 * Processes three parallel data streams:
 * 1. Temporal: Time-series patterns (mood, engagement over time)
 * 2. Symbolic: Discrete tokens (tarot cards, tags, archetypes)
 * 3. Contextual: Dense text (journal entries, chat history)
 */

/**
 * Temporal signal - timestamped user state data
 *
 * @typedef {Object} TemporalSignal
 * @property {number} timestamp - Unix timestamp
 * @property {number} moodScore - -1.0 to 1.0
 * @property {number} engagementScore - 0.0 to 1.0
 * @property {string} activityType - 'reading' | 'journal' | 'vera' | 'passive'
 */

/**
 * Symbolic token - discrete semantic element
 *
 * @typedef {Object} SymbolicToken
 * @property {string} type - 'card' | 'tag' | 'archetype' | 'theme'
 * @property {string} value - The token value (e.g., "The Tower", "anxiety")
 * @property {number} weight - Frequency/recency weight (0.0 to 1.0)
 * @property {number} [timestamp] - When this token appeared
 */

/**
 * Major Arcana cards for pattern detection
 */
export const MAJOR_ARCANA = [
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
  'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
  'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
  'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun',
  'Judgement', 'The World'
];

/**
 * Card suit to element mapping
 */
export const SUIT_ELEMENTS = {
  wands: 'fire',
  cups: 'water',
  swords: 'air',
  pentacles: 'earth'
};

/**
 * Element meanings for synthesis
 */
export const ELEMENT_MEANINGS = {
  fire: {
    theme: 'passion, action, creativity',
    excess: 'burnout, aggression, impatience',
    lack: 'stagnation, lack of motivation'
  },
  water: {
    theme: 'emotion, intuition, relationships',
    excess: 'overwhelm, codependency, avoidance',
    lack: 'emotional disconnection, numbness'
  },
  air: {
    theme: 'thought, communication, analysis',
    excess: 'overthinking, anxiety, detachment',
    lack: 'confusion, poor communication'
  },
  earth: {
    theme: 'material, practical, grounded',
    excess: 'materialism, stubbornness, rigidity',
    lack: 'instability, impracticality, ungrounded'
  }
};

/**
 * Common therapeutic keywords for contextual analysis
 */
export const THERAPEUTIC_KEYWORDS = {
  positive: [
    'grateful', 'happy', 'peaceful', 'hopeful', 'excited', 'proud',
    'growth', 'healing', 'progress', 'clarity', 'love', 'joy',
    'confident', 'empowered', 'free', 'calm', 'centered', 'present'
  ],
  negative: [
    'anxious', 'sad', 'angry', 'fear', 'stuck', 'lost', 'confused',
    'overwhelmed', 'hopeless', 'lonely', 'depressed', 'worried',
    'frustrated', 'exhausted', 'numb', 'disconnected', 'trapped'
  ],
  action: [
    'need', 'want', 'should', 'must', 'will', 'decide', 'change',
    'start', 'stop', 'try', 'help', 'learn', 'grow', 'let go'
  ],
  relationship: [
    'they', 'them', 'partner', 'friend', 'family', 'mother', 'father',
    'relationship', 'together', 'apart', 'trust', 'betrayal', 'love'
  ]
};

/**
 * Stop words to filter from contextual analysis
 */
export const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'were', 'they',
  'will', 'when', 'what', 'this', 'from', 'that', 'with', 'about', 'into',
  'just', 'also', 'than', 'them', 'then', 'only', 'come', 'could', 'its',
  'over', 'such', 'your', 'very', 'after', 'most', 'being', 'would',
  'like', 'really', 'know', 'think', 'feel', 'going', 'something',
  'today', 'still', 'maybe', 'because', 'didn', 'don', 'isn', 'wasn'
]);

/**
 * Cross-stream pattern types
 */
export const PATTERN_TYPES = {
  TRANSFORMATION: 'transformation',       // Death/Tower + positive sentiment
  RESISTANCE: 'resistance',               // Recurring block + avoidance keywords
  BREAKTHROUGH: 'breakthrough',           // Mood uptick + action language
  OVERWHELM: 'overwhelm',                 // High volatility + negative sentiment
  SEEKING_CLARITY: 'seeking_clarity',     // Many questions + Swords
  RELATIONSHIP_FOCUS: 'relationship',     // Cups dominance + relationship keywords
  GROUNDING_NEEDED: 'grounding_needed',   // No earth + scattered activity
  CREATIVE_SURGE: 'creative_surge',       // Wands + positive + new projects
};

/**
 * Attention weight configuration
 */
export const DEFAULT_ATTENTION_WEIGHTS = {
  temporal: 0.33,
  symbolic: 0.33,
  contextual: 0.34
};

export default {
  MAJOR_ARCANA,
  SUIT_ELEMENTS,
  ELEMENT_MEANINGS,
  THERAPEUTIC_KEYWORDS,
  STOP_WORDS,
  PATTERN_TYPES,
  DEFAULT_ATTENTION_WEIGHTS
};
