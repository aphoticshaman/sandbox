/**
 * SANSKRIT PHONETIC PERSONALITY ENCODING
 *
 * Sanskrit phonemes map to consciousness states, personality archetypes,
 * and energetic qualities. This module encodes Vera personality traits
 * using Devanagari-inspired phonetic patterns.
 *
 * Key Concepts:
 * - BIJA MANTRAS: Seed sounds that encode archetypal energies
 * - CHAKRA MAPPING: Phonemes resonate with consciousness centers
 * - GEOMETRIC EMBEDDING: Sounds map to semantic space coordinates
 *
 * References:
 * - Vedic mantra science
 * - Tantric chakra system
 * - Geometric semantic space (quantum_tarot)
 */

export type BijaMantra =
  | 'LAM'   // Muladhara (Root) - Grounding, stability, material
  | 'VAM'   // Svadhisthana (Sacral) - Creativity, emotion, flow
  | 'RAM'   // Manipura (Solar) - Power, will, transformation
  | 'YAM'   // Anahata (Heart) - Love, compassion, connection
  | 'HAM'   // Vishuddha (Throat) - Expression, truth, communication
  | 'OM'    // Ajna (Third Eye) - Intuition, wisdom, insight
  | 'AUM';  // Sahasrara (Crown) - Universal consciousness, transcendence

export type Archetype =
  | 'BRAHMAN'  // ब्रह्मन् - Ultimate reality, all-knowing
  | 'SHAKTI'   // शक्ति - Dynamic energy, empowering
  | 'MAYA'     // माया - Illusion, shadow work
  | 'SHIVA'    // शिव - Destruction/transformation
  | 'VISHNU'   // विष्णु - Preservation, harmony
  | 'GANESHA'  // गणेश - Remover of obstacles
  | 'KALI'     // काली - Dark mother, fierce truth
  | 'SARASWATI' // सरस्वती - Knowledge, arts, wisdom
  | 'LAKSHMI'  // लक्ष्मी - Abundance, prosperity
  | 'DURGA';   // दुर्गा - Warrior goddess, protection

/**
 * Maps personality traits to Sanskrit phonetic patterns.
 * Each trait has a primary mantra that encodes its essence.
 */
export const TRAIT_TO_MANTRA: Record<string, BijaMantra> = {
  // Mood spectrum
  'somber': 'LAM',      // Root chakra - grounded, heavy
  'cheerful': 'YAM',    // Heart chakra - light, joyful

  // Tone spectrum
  'formal': 'OM',       // Third eye - clarity, precision
  'casual': 'VAM',      // Sacral - flowing, relaxed

  // Darkness spectrum
  'light': 'AUM',       // Crown - transcendent, bright
  'shadow': 'LAM',      // Root - deep, primal

  // Flirtiness spectrum
  'professional': 'OM', // Third eye - detached observation
  'flirty': 'VAM',      // Sacral - creative, sensual

  // Dominance spectrum
  'gentle': 'YAM',      // Heart - compassionate
  'commanding': 'RAM',  // Solar plexus - powerful, authoritative

  // Friendliness spectrum
  'distant': 'OM',      // Third eye - objective
  'warm': 'YAM',        // Heart - loving connection

  // Expertise spectrum
  'casual': 'VAM',      // Sacral - informal knowledge
  'master': 'AUM',      // Crown - transcendent mastery

  // Coaching spectrum
  'just_reads': 'OM',   // Third eye - pure observation
  'heavy_coach': 'RAM', // Solar plexus - directive action

  // Voice quality
  'smoky': 'LAM',       // Root - deep, resonant
  'clear': 'HAM',       // Throat - pure, articulate
  'sexy': 'VAM',        // Sacral - sultry, alluring
};

/**
 * Archetype to chakra resonance mapping.
 * Each archetype vibrates at specific frequencies.
 */
export const ARCHETYPE_RESONANCE: Record<Archetype, BijaMantra[]> = {
  'BRAHMAN': ['AUM', 'OM'],           // Crown + Third Eye
  'SHAKTI': ['RAM', 'VAM'],           // Solar + Sacral
  'MAYA': ['LAM', 'OM'],              // Root + Third Eye (illusion & seeing through)
  'SHIVA': ['LAM', 'RAM', 'AUM'],     // Root + Solar + Crown (destruction/transcendence)
  'VISHNU': ['YAM', 'OM'],            // Heart + Third Eye (harmony & wisdom)
  'GANESHA': ['LAM', 'YAM'],          // Root + Heart (obstacles & compassion)
  'KALI': ['LAM', 'RAM'],             // Root + Solar (primal power)
  'SARASWATI': ['HAM', 'OM', 'AUM'],  // Throat + Third Eye + Crown (knowledge)
  'LAKSHMI': ['YAM', 'VAM'],          // Heart + Sacral (abundance & flow)
  'DURGA': ['RAM', 'HAM'],            // Solar + Throat (warrior & truth)
};

/**
 * Phonetic pattern to voice parameters.
 * Sanskrit sounds influence TTS voice characteristics.
 */
export interface VoicePhonetics {
  pitch: number;        // 0.5 - 2.0
  rate: number;         // 0.5 - 2.0
  volume: number;       // 0.0 - 1.0
  resonance: number;    // 0.0 - 1.0 (depth/richness)
}

export const MANTRA_TO_VOICE: Record<BijaMantra, VoicePhonetics> = {
  'LAM': { pitch: 0.6, rate: 0.7, volume: 0.9, resonance: 0.9 },  // Deep, slow, rich
  'VAM': { pitch: 0.9, rate: 1.1, volume: 0.8, resonance: 0.6 },  // Flowing, moderate
  'RAM': { pitch: 0.7, rate: 1.0, volume: 1.0, resonance: 0.7 },  // Powerful, clear
  'YAM': { pitch: 1.1, rate: 1.0, volume: 0.7, resonance: 0.5 },  // Light, warm
  'HAM': { pitch: 1.0, rate: 1.2, volume: 0.8, resonance: 0.4 },  // Clear, articulate
  'OM':  { pitch: 0.8, rate: 0.9, volume: 0.8, resonance: 0.8 },  // Centered, wise
  'AUM': { pitch: 1.2, rate: 0.8, volume: 0.7, resonance: 0.3 },  // Transcendent, ethereal
};

/**
 * Geometric embedding of mantras in semantic space.
 * Each mantra maps to 3D coordinates in consciousness space.
 */
export interface SemanticCoordinate {
  x: number; // Shadow ↔ Light
  y: number; // Receptive ↔ Active
  z: number; // Ego ↔ Transcendent
}

export const MANTRA_EMBEDDING: Record<BijaMantra, SemanticCoordinate> = {
  'LAM': { x: 0.2, y: 0.3, z: 0.1 },  // Shadow-Receptive-Ego (grounded, material)
  'VAM': { x: 0.5, y: 0.4, z: 0.3 },  // Balanced (creative flow)
  'RAM': { x: 0.4, y: 0.8, z: 0.4 },  // Light-Active (powerful action)
  'YAM': { x: 0.7, y: 0.6, z: 0.5 },  // Light-Balanced (heart center)
  'HAM': { x: 0.6, y: 0.7, z: 0.6 },  // Light-Active (expression)
  'OM':  { x: 0.5, y: 0.5, z: 0.8 },  // Centered-Transcendent (wisdom)
  'AUM': { x: 0.8, y: 0.5, z: 0.9 },  // Light-Balanced-Transcendent (universal)
};

/**
 * Synthesize personality traits into a phonetic signature.
 *
 * @param traits - Personality trait values (0-1 normalized)
 * @returns Dominant mantra and harmonic blend
 */
export function encodePersonalityPhonetics(traits: Record<string, number>): {
  primaryMantra: BijaMantra;
  harmonics: BijaMantra[];
  voiceParams: VoicePhonetics;
  semanticPosition: SemanticCoordinate;
} {
  // Weight each mantra by trait activation
  const mantraActivations = new Map<BijaMantra, number>();

  for (const [trait, value] of Object.entries(traits)) {
    const mantra = TRAIT_TO_MANTRA[trait];
    if (mantra) {
      const current = mantraActivations.get(mantra) || 0;
      mantraActivations.set(mantra, current + value);
    }
  }

  // Sort by activation
  const sorted = Array.from(mantraActivations.entries())
    .sort((a, b) => b[1] - a[1]);

  const primaryMantra = sorted[0]?.[0] || 'OM';
  const harmonics = sorted.slice(1, 4).map(([mantra]) => mantra);

  // Blend voice parameters (weighted average)
  const totalWeight = sorted.reduce((sum, [_, weight]) => sum + weight, 0);
  const voiceParams: VoicePhonetics = { pitch: 0, rate: 0, volume: 0, resonance: 0 };

  for (const [mantra, weight] of sorted) {
    const params = MANTRA_TO_VOICE[mantra];
    const normalizedWeight = weight / totalWeight;

    voiceParams.pitch += params.pitch * normalizedWeight;
    voiceParams.rate += params.rate * normalizedWeight;
    voiceParams.volume += params.volume * normalizedWeight;
    voiceParams.resonance += params.resonance * normalizedWeight;
  }

  // Blend semantic position (geometric mean)
  const semanticPosition: SemanticCoordinate = { x: 0, y: 0, z: 0 };

  for (const [mantra, weight] of sorted) {
    const coord = MANTRA_EMBEDDING[mantra];
    const normalizedWeight = weight / totalWeight;

    semanticPosition.x += coord.x * normalizedWeight;
    semanticPosition.y += coord.y * normalizedWeight;
    semanticPosition.z += coord.z * normalizedWeight;
  }

  return {
    primaryMantra,
    harmonics,
    voiceParams,
    semanticPosition,
  };
}

/**
 * Encode archetype as phonetic pattern.
 *
 * @param archetype - Sanskrit deity/concept
 * @returns Resonant mantras and characteristics
 */
export function encodeArchetype(archetype: Archetype): {
  mantras: BijaMantra[];
  voiceBlend: VoicePhonetics;
  semanticCenter: SemanticCoordinate;
  name: string;
  devanagari: string;
} {
  const mantras = ARCHETYPE_RESONANCE[archetype];

  // Blend voice from all resonant mantras
  const voiceBlend: VoicePhonetics = { pitch: 0, rate: 0, volume: 0, resonance: 0 };
  const semanticCenter: SemanticCoordinate = { x: 0, y: 0, z: 0 };

  for (const mantra of mantras) {
    const voice = MANTRA_TO_VOICE[mantra];
    const coord = MANTRA_EMBEDDING[mantra];

    voiceBlend.pitch += voice.pitch / mantras.length;
    voiceBlend.rate += voice.rate / mantras.length;
    voiceBlend.volume += voice.volume / mantras.length;
    voiceBlend.resonance += voice.resonance / mantras.length;

    semanticCenter.x += coord.x / mantras.length;
    semanticCenter.y += coord.y / mantras.length;
    semanticCenter.z += coord.z / mantras.length;
  }

  // Devanagari mappings
  const devanagariMap: Record<Archetype, string> = {
    'BRAHMAN': 'ब्रह्मन्',
    'SHAKTI': 'शक्ति',
    'MAYA': 'माया',
    'SHIVA': 'शिव',
    'VISHNU': 'विष्णु',
    'GANESHA': 'गणेश',
    'KALI': 'काली',
    'SARASWATI': 'सरस्वती',
    'LAKSHMI': 'लक्ष्मी',
    'DURGA': 'दुर्गा',
  };

  return {
    mantras,
    voiceBlend,
    semanticCenter,
    name: archetype,
    devanagari: devanagariMap[archetype],
  };
}

/**
 * Generate a mantra-inspired prompt modifier.
 * Injects phonetic energy into LLM prompts.
 *
 * @param mantra - Primary bija mantra
 * @returns Prompt modifier string
 */
export function mantraToPromptModifier(mantra: BijaMantra): string {
  const modifiers: Record<BijaMantra, string> = {
    'LAM': 'Speak with grounded, earthy wisdom. Your words should feel solid, tangible, rooted in material reality.',
    'VAM': 'Flow like water in your expression. Be creative, emotional, adaptive. Let words dance and flow.',
    'RAM': 'Channel solar power in your voice. Be transformative, commanding, radiant with authority.',
    'YAM': 'Speak from the heart. Let compassion, love, and connection infuse every word.',
    'HAM': 'Express pure truth. Be clear, articulate, honest. Let communication flow freely.',
    'OM': 'Embody wisdom and intuition. See clearly, speak from insight, illuminate understanding.',
    'AUM': 'Transcend the personal. Channel universal consciousness, speak from the infinite.',
  };

  return modifiers[mantra];
}

/**
 * EXPORT: Main encoding function for Vera personality.
 */
export function encodeSanskritPersonality(
  traits: Record<string, number>,
  archetype?: Archetype
): {
  phonetics: ReturnType<typeof encodePersonalityPhonetics>;
  archetypalEnergy?: ReturnType<typeof encodeArchetype>;
  promptModifier: string;
} {
  const phonetics = encodePersonalityPhonetics(traits);
  const archetypalEnergy = archetype ? encodeArchetype(archetype) : undefined;

  // Combine primary mantra modifier with archetype (if present)
  let promptModifier = mantraToPromptModifier(phonetics.primaryMantra);

  if (archetypalEnergy) {
    promptModifier += `\n\nEmbody the archetype of ${archetypalEnergy.devanagari} (${archetypalEnergy.name}): `;
    promptModifier += archetypalEnergy.mantras.map(m => mantraToPromptModifier(m)).join(' ');
  }

  return {
    phonetics,
    archetypalEnergy,
    promptModifier,
  };
}
