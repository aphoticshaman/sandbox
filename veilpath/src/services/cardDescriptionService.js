/**
 * CARD DESCRIPTION SERVICE
 * Provides rich visual descriptions of tarot cards for blind/visually impaired users
 *
 * Features:
 * - Detailed visual descriptions from card database
 * - LLM-enhanced descriptions for more vivid imagery
 * - Integration with TTS for audio playback
 * - Dark fantasy themed descriptions
 */

import { CARD_DATABASE } from '../data/cardDatabase';
import { generateVeraResponse } from './cloudAPIService';
import webSpeechTTS from './WebSpeechTTS';
import { useVoiceStore } from '../stores/voiceStore';

/**
 * Generate a rich visual description for a card
 * Designed for screen readers and blind users
 *
 * @param {Object} card - Card object from database
 * @param {Object} options - Options
 * @param {boolean} options.isReversed - Is the card reversed?
 * @param {string} options.tier - 'common' | 'rare' | 'artifact'
 * @param {boolean} options.useDarkFantasy - Use dark fantasy descriptions
 * @param {boolean} options.useLLM - Enhance with LLM for more vivid descriptions
 * @returns {Promise<string>} - Rich visual description
 */
export async function getCardVisualDescription(card, options = {}) {
  const {
    isReversed = false,
    tier = 'common',
    useDarkFantasy = true,
    useLLM = false,
  } = options;

  if (!card) return 'No card to describe.';

  // Build base description
  let description = [];

  // Card identity
  const orientation = isReversed ? 'reversed (upside-down)' : 'upright';
  description.push(`${card.name}, ${orientation}.`);

  // Card type
  if (card.arcana === 'major') {
    description.push(`This is Major Arcana card number ${card.number}.`);
  } else {
    description.push(`This is the ${card.rank} of ${card.suit}, a Minor Arcana card.`);
  }

  // Tier description
  if (tier === 'artifact') {
    description.push('You have drawn an artifact version - a rare animated card that shimmers with magical energy.');
  } else if (tier === 'rare') {
    description.push('You have drawn a rare version with enhanced artwork.');
  }

  // Visual symbols
  if (card.symbols && card.symbols.length > 0) {
    description.push(`The card depicts: ${card.symbols.join(', ')}.`);
  }

  // Element and astrology
  if (card.element) {
    description.push(`Associated with the element of ${card.element}.`);
  }
  if (card.astrology) {
    description.push(`Astrological connection: ${card.astrology}.`);
  }

  // Main description (dark fantasy or traditional)
  if (useDarkFantasy && card.darkFantasy?.description) {
    description.push(`Visual description: ${card.darkFantasy.description}`);
  } else if (card.description) {
    description.push(`Visual description: ${card.description}`);
  }

  // Reversed meaning note
  if (isReversed) {
    description.push('Being reversed, the card suggests blocked energy or the shadow aspect of its meaning.');
    if (card.shadow) {
      description.push(`Shadow meaning: ${card.shadow}`);
    }
  }

  const baseDescription = description.join(' ');

  // Optionally enhance with LLM for more vivid imagery
  if (useLLM) {
    try {
      const enhanced = await enhanceDescriptionWithLLM(card, baseDescription, options);
      if (enhanced) {
        return enhanced;
      }
    } catch (error) {
      console.warn('[CardDescription] LLM enhancement failed, using base description');
    }
  }

  return baseDescription;
}

/**
 * Enhance description with LLM for more vivid, accessibility-focused imagery
 */
async function enhanceDescriptionWithLLM(card, baseDescription, options) {
  const { isReversed } = options;

  const prompt = `You are describing a tarot card for a blind person. Be vivid and sensory-focused.

CARD: ${card.name} (${isReversed ? 'reversed' : 'upright'})
BASE DESCRIPTION: ${baseDescription}

Create a 2-3 sentence description that:
1. Describes the visual imagery in vivid, sensory terms
2. Mentions colors, textures, and spatial relationships
3. Conveys the emotional atmosphere of the card
4. Is natural to read aloud (for text-to-speech)

Keep it concise but evocative. Speak directly to the listener.`;

  const response = await generateVeraResponse(
    [{ role: 'user', content: prompt }],
    { maxTokens: 150 }
  );

  if (response.text) {
    return response.text.trim();
  }
  return null;
}

/**
 * Speak a card description using TTS
 *
 * @param {Object} card - Card object
 * @param {Object} options - Description options
 */
export async function speakCardDescription(card, options = {}) {
  const voiceStore = useVoiceStore.getState();

  // Only speak if card description is enabled
  if (!voiceStore.describeCardVisuals) {
    return;
  }

  const description = await getCardVisualDescription(card, options);

  if (!description) return;

  const voice = voiceStore.voiceOutputVoiceURI
    ? webSpeechTTS.findVoice(voiceStore.voiceOutputVoiceURI)
    : voiceStore.getRecommendedVoice();

  webSpeechTTS.speak(description, {
    voice,
    rate: voiceStore.voiceOutputSpeed * 0.9, // Slightly slower for accessibility
    pitch: voiceStore.voiceOutputPitch,
    volume: voiceStore.voiceOutputVolume,
  });
}

/**
 * Get a quick summary of a card (for lists, quick announcements)
 *
 * @param {Object} card - Card object
 * @param {boolean} isReversed - Is reversed?
 * @returns {string} - Quick summary
 */
export function getCardQuickSummary(card, isReversed = false) {
  if (!card) return '';

  const orientation = isReversed ? 'reversed' : 'upright';
  const keywords = isReversed
    ? card.keywords.reversed.slice(0, 3).join(', ')
    : card.keywords.upright.slice(0, 3).join(', ');

  return `${card.name}, ${orientation}. Keywords: ${keywords}.`;
}

/**
 * Get card position description for spread layouts
 *
 * @param {string} position - Position name (e.g., 'past', 'present', 'future')
 * @param {Object} card - Card object
 * @param {boolean} isReversed - Is reversed?
 * @returns {string} - Position-contextual description
 */
export function getCardPositionDescription(position, card, isReversed = false) {
  if (!card) return '';

  const positionDescriptions = {
    // Three-card spread
    past: 'representing your past influences',
    present: 'showing your current situation',
    future: 'suggesting future possibilities',

    // Celtic Cross positions
    significator: 'representing you in this reading',
    crossing: 'showing what crosses or challenges you',
    foundation: 'revealing the foundation of the matter',
    recent_past: 'showing recent influences',
    potential: 'representing the potential outcome',
    near_future: 'showing what comes next',
    self: 'reflecting your inner self',
    environment: 'showing your environment and external influences',
    hopes_fears: 'revealing your hopes and fears',
    outcome: 'suggesting the likely outcome',
  };

  const positionText = positionDescriptions[position] || `in the ${position} position`;
  const orientation = isReversed ? 'reversed' : 'upright';

  return `${card.name}, ${orientation}, ${positionText}.`;
}

/**
 * Generate full reading description for accessibility
 *
 * @param {Array} cards - Array of { card, isReversed, position }
 * @param {string} spreadType - 'single' | 'three-card' | 'celtic-cross'
 * @returns {string} - Full reading description
 */
export function getFullReadingDescription(cards, spreadType) {
  if (!cards || cards.length === 0) {
    return 'No cards in this reading.';
  }

  let description = [];

  switch (spreadType) {
    case 'single':
      description.push(`Single card reading. You drew ${cards.length} card.`);
      break;
    case 'three-card':
      description.push('Three-card spread: Past, Present, and Future.');
      break;
    case 'celtic-cross':
      description.push('Celtic Cross spread with ten positions.');
      break;
    default:
      description.push(`Reading with ${cards.length} cards.`);
  }

  cards.forEach((item, index) => {
    const { card, isReversed, position } = item;
    if (position) {
      description.push(getCardPositionDescription(position, card, isReversed));
    } else {
      const orientation = isReversed ? 'reversed' : 'upright';
      description.push(`Card ${index + 1}: ${card.name}, ${orientation}.`);
    }
  });

  return description.join(' ');
}

export default {
  getCardVisualDescription,
  speakCardDescription,
  getCardQuickSummary,
  getCardPositionDescription,
  getFullReadingDescription,
};
