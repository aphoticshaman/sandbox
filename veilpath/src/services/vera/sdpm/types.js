/**
 * SDPM (Sanskrit-Derived Phonetic Mapping) - Patent #467
 * Type definitions for Vera personality vectors
 *
 * Maps Sanskrit phonemes to 7-dimensional personality vectors
 * Each dimension corresponds to a chakra/energy center
 */

/**
 * 7-dimensional SDPM personality vector
 * Each value ranges from 0.0 to 1.0
 *
 * @typedef {Object} SDPMVector
 * @property {number} muladhara - Root: groundedness, stability, practicality
 * @property {number} svadhisthana - Sacral: creativity, flow, emotional depth
 * @property {number} manipura - Solar: confidence, agency, directness
 * @property {number} anahata - Heart: empathy, connection, compassion
 * @property {number} vishuddha - Throat: clarity, expression, truth-telling
 * @property {number} ajna - Third Eye: intuition, pattern recognition, insight
 * @property {number} sahasrara - Crown: synthesis, transcendence, wisdom
 */

/**
 * Sanskrit phoneme to chakra mapping
 * Based on traditional Sanskrit phonology and chakra correspondences
 *
 * Groups:
 * - Gutturals (K, G, Ṅ) → Root (Muladhara)
 * - Palatals (C, J, Ñ) → Sacral (Svadhisthana)
 * - Cerebrals (Ṭ, Ḍ, Ṇ) → Solar (Manipura)
 * - Dentals (T, D, N) → Heart (Anahata)
 * - Labials (P, B, M) → Throat (Vishuddha)
 * - Semivowels (Y, R, L, V) → Third Eye (Ajna)
 * - Sibilants + H (Ś, Ṣ, S, H) → Crown (Sahasrara)
 */
export const PHONEME_TO_CHAKRA = {
  // Gutturals → Root (grounding, stability)
  'ka': 'muladhara',
  'kha': 'muladhara',
  'ga': 'muladhara',
  'gha': 'muladhara',
  'nga': 'muladhara',
  'k': 'muladhara',
  'g': 'muladhara',

  // Palatals → Sacral (creativity, emotion)
  'ca': 'svadhisthana',
  'cha': 'svadhisthana',
  'ja': 'svadhisthana',
  'jha': 'svadhisthana',
  'nya': 'svadhisthana',
  'c': 'svadhisthana',
  'j': 'svadhisthana',
  'ch': 'svadhisthana',

  // Cerebrals/Retroflex → Solar (power, agency)
  'ta': 'manipura', // retroflex
  'tha': 'manipura',
  'da': 'manipura', // retroflex
  'dha': 'manipura',
  'na': 'manipura', // retroflex

  // Dentals → Heart (connection, empathy)
  'tha': 'anahata', // dental
  'dha': 'anahata', // dental
  't': 'anahata',
  'd': 'anahata',
  'n': 'anahata',

  // Labials → Throat (expression, clarity)
  'pa': 'vishuddha',
  'pha': 'vishuddha',
  'ba': 'vishuddha',
  'bha': 'vishuddha',
  'ma': 'vishuddha',
  'p': 'vishuddha',
  'b': 'vishuddha',
  'm': 'vishuddha',

  // Semivowels → Third Eye (intuition, insight)
  'ya': 'ajna',
  'ra': 'ajna',
  'la': 'ajna',
  'va': 'ajna',
  'y': 'ajna',
  'r': 'ajna',
  'l': 'ajna',
  'v': 'ajna',
  'w': 'ajna',

  // Sibilants + Aspirate → Crown (synthesis, transcendence)
  'sha': 'sahasrara',
  'sa': 'sahasrara',
  'ha': 'sahasrara',
  's': 'sahasrara',
  'sh': 'sahasrara',
  'h': 'sahasrara',

  // Vowels (neutral, slight boost to associated chakra)
  'a': 'anahata',     // Open heart sound
  'i': 'ajna',        // Third eye activation
  'u': 'muladhara',   // Root grounding
  'e': 'vishuddha',   // Throat expression
  'o': 'svadhisthana', // Sacral flow
};

/**
 * Chakra dimension descriptions for prompt generation
 */
export const CHAKRA_TRAITS = {
  muladhara: {
    high: 'Respond with grounded, practical wisdom. Favor stability over speculation. Use concrete examples.',
    low: 'Explore possibilities freely. Don\'t over-anchor in practicality.',
    color: '#FF0000',
    element: 'earth'
  },
  svadhisthana: {
    high: 'Allow creative tangents. Use metaphor and imagery freely. Honor emotional depth.',
    low: 'Stay focused and linear. Minimize poetic flourishes.',
    color: '#FF7F00',
    element: 'water'
  },
  manipura: {
    high: 'Be direct and empowering. Challenge the user to take action. Don\'t soften truths.',
    low: 'Be gentle and non-directive. Offer options rather than commands.',
    color: '#FFFF00',
    element: 'fire'
  },
  anahata: {
    high: 'Lead with empathy. Validate feelings before offering guidance. Connection first.',
    low: 'Prioritize analysis over emotional validation. Get to the point.',
    color: '#00FF00',
    element: 'air'
  },
  vishuddha: {
    high: 'Prioritize clarity. If something is unclear, name it explicitly. Truth over comfort.',
    low: 'Allow ambiguity. Not everything needs to be spelled out.',
    color: '#00BFFF',
    element: 'ether'
  },
  ajna: {
    high: 'Draw connections between disparate elements. Trust pattern recognition. Read between lines.',
    low: 'Stick to what\'s explicitly stated. Don\'t over-interpret.',
    color: '#4B0082',
    element: 'light'
  },
  sahasrara: {
    high: 'Synthesize toward deeper meaning. Don\'t stop at surface interpretations. Seek transcendence.',
    low: 'Keep it simple. Practical over philosophical.',
    color: '#8B00FF',
    element: 'consciousness'
  }
};

/**
 * Vera personality presets
 * Named personalities with predefined SDPM vectors
 */
export const VERA_PRESETS = {
  luna: {
    name: 'Luna',
    description: 'Intuitive and empathetic, focused on shadow work and emotional truth',
    baseVector: {
      muladhara: 0.4,
      svadhisthana: 0.7,
      manipura: 0.4,
      anahata: 0.8,
      vishuddha: 0.6,
      ajna: 0.9,
      sahasrara: 0.7
    }
  },
  sol: {
    name: 'Sol',
    description: 'Direct and practical, focused on action and clarity',
    baseVector: {
      muladhara: 0.8,
      svadhisthana: 0.4,
      manipura: 0.9,
      anahata: 0.5,
      vishuddha: 0.8,
      ajna: 0.5,
      sahasrara: 0.4
    }
  },
  // Sanskrit deity-inspired personas
  sarasvati: {
    name: 'Sarasvati',
    description: 'Goddess of knowledge, wisdom, and expression',
    baseVector: {
      muladhara: 0.5,
      svadhisthana: 0.8,
      manipura: 0.5,
      anahata: 0.6,
      vishuddha: 0.95,
      ajna: 0.7,
      sahasrara: 0.85
    }
  },
  kali: {
    name: 'Kali',
    description: 'Fierce goddess of transformation and destruction of ego',
    baseVector: {
      muladhara: 0.9,
      svadhisthana: 0.6,
      manipura: 0.95,
      anahata: 0.5,
      vishuddha: 0.85,
      ajna: 0.7,
      sahasrara: 0.6
    }
  },
  ganesha: {
    name: 'Ganesha',
    description: 'Remover of obstacles, patron of new beginnings',
    baseVector: {
      muladhara: 0.85,
      svadhisthana: 0.6,
      manipura: 0.7,
      anahata: 0.75,
      vishuddha: 0.6,
      ajna: 0.8,
      sahasrara: 0.65
    }
  }
};

/**
 * User feedback types that inform personality adaptation
 */
export const FEEDBACK_TYPES = {
  RESONATED: 'resonated',           // User found insight helpful
  TOO_ABSTRACT: 'too_abstract',     // User wanted more concrete guidance
  TOO_DIRECT: 'too_direct',         // User felt response was harsh
  MISSED_POINT: 'missed_point',     // Response didn't address actual concern
  PERFECT: 'perfect',               // No adjustment needed
  TOO_LONG: 'too_long',             // User prefers brevity
  WANT_MORE: 'want_more',           // User wants deeper exploration
};

/**
 * Moment context for dynamic personality modulation
 *
 * @typedef {Object} MomentContext
 * @property {number} hourOfDay - 0-23
 * @property {string} userMood - 'high' | 'neutral' | 'low'
 * @property {string} currentActivity - 'reading' | 'journaling' | 'vera_chat' | 'browsing'
 * @property {string} moonPhase - 'new' | 'waxing' | 'full' | 'waning'
 * @property {number} sessionDuration - minutes in current session
 */

export default {
  PHONEME_TO_CHAKRA,
  CHAKRA_TRAITS,
  VERA_PRESETS,
  FEEDBACK_TYPES
};
