/**
 * Tarot Deck Adapter
 * Adapts existing cardDatabase.js to work with new reading system
 *
 * TIERED DROP SYSTEM:
 * - 85% chance: Common tier (PNG from card_art/common)
 * - 15% chance: Rare tier (PNG from card_art/rare)
 * - If Rare + Major Arcana: 10% additional chance of MP4 loop (artifact)
 */

import { CARD_DATABASE } from './cardDatabase';
import { getAssetSource } from '../utils/CardAssetMap';

/**
 * TIER DROP RATES
 */
const TIER_CONFIG = {
  COMMON_CHANCE: 0.85,  // 85% common
  RARE_CHANCE: 0.15,    // 15% rare
  MP4_CHANCE: 0.10,     // 10% chance of MP4 if rare + major arcana
};

/**
 * Roll tier for a drawn card
 * @param {Object} card - Card data
 * @returns {{ tier: 'common'|'rare', assetType: 'png'|'mp4' }}
 */
function rollCardTier(card) {
  const tierRoll = Math.random();

  // 85% common, 15% rare
  if (tierRoll < TIER_CONFIG.COMMON_CHANCE) {
    return { tier: 'common', assetType: 'png' };
  }

  // Rare tier (15%)
  // If major arcana, 10% chance of MP4 artifact
  if (card.arcana === 'major') {
    const mp4Roll = Math.random();
    if (mp4Roll < TIER_CONFIG.MP4_CHANCE) {
      return { tier: 'artifact', assetType: 'mp4' };
    }
  }

  // Rare PNG
  return { tier: 'rare', assetType: 'png' };
}

/**
 * Card slug mapping - converts card name to asset slug
 */
function getCardSlug(card) {
  // Handle major arcana
  const majorArcanaMap = {
    'The Fool': 'fool',
    'The Magician': 'magician',
    'The High Priestess': 'highpriestess',
    'The Empress': 'empress',
    'The Emperor': 'emperor',
    'The Hierophant': 'hierophant',
    'The Lovers': 'lovers',
    'The Chariot': 'chariot',
    'Strength': 'strength',
    'The Hermit': 'hermit',
    'Wheel of Fortune': 'wheeloffortune',
    'Justice': 'justice',
    'The Hanged Man': 'hangedman',
    'Death': 'death',
    'Temperance': 'temperance',
    'The Devil': 'devil',
    'The Tower': 'tower',
    'The Star': 'star',
    'The Moon': 'moon',
    'The Sun': 'sun',
    'Judgement': 'judgment',
    'The World': 'world',
  };

  if (majorArcanaMap[card.name]) {
    return majorArcanaMap[card.name];
  }

  // Handle minor arcana (e.g., "Ace of Wands" -> "acewands")
  if (card.suit && card.rank) {
    const rankMap = {
      'ace': 'ace',
      '2': 'two', '3': 'three', '4': 'four', '5': 'five',
      '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
      'page': 'page', 'knight': 'knight', 'queen': 'queen', 'king': 'king',
    };
    const rank = rankMap[card.rank] || card.rank;
    return `${rank}${card.suit}`;
  }

  // Fallback: convert name to slug
  return card.name.toLowerCase().replace(/\s+/g, '').replace('the', '');
}

/**
 * Get card image source using CardAssetMap
 * @param {Object} card - Card object from database
 * @param {string} tier - 'common', 'rare', or 'artifact'
 * @returns {any} Image source for React Native Image component
 */
export function getCardImage(card, tier = 'common') {
  if (!card) return null;

  const slug = getCardSlug(card);

  // Build asset path based on tier
  let assetPath;
  switch (tier) {
    case 'rare':
      assetPath = `assets/art/card_art/rare/${slug}2.png`;
      break;
    case 'artifact':
      // Artifacts are only for major arcana (videos)
      if (card.arcana === 'major') {
        const artifactSlug = slug === 'fool' ? 'thefool' : slug;
        assetPath = `assets/art/curated/${artifactSlug}_loop.mp4`;
      } else {
        // Fall back to rare for minor arcana
        assetPath = `assets/art/card_art/rare/${slug}2.png`;
      }
      break;
    default:
      assetPath = `assets/art/card_art/common/${slug}.png`;
  }

  const source = getAssetSource(assetPath);

  // If not found, try common tier as fallback
  if (!source && tier !== 'common') {
    return getAssetSource(`assets/art/card_art/common/${slug}.png`);
  }

  return source;
}

/**
 * Get card image by ID
 * @param {number} cardId - Card ID (0-77)
 * @param {string} tier - 'common', 'rare', or 'artifact'
 */
export function getCardImageById(cardId, tier = 'common') {
  const card = CARD_DATABASE.find(c => c.id === cardId);
  return card ? getCardImage(card, tier) : null;
}

/**
 * Enhanced deck with images and therapeutic connections
 */
export const TAROT_DECK = CARD_DATABASE.map((card) => ({
  ...card,
  image: getCardImage(card, 'common'),
  // Add string ID for consistency
  stringId: generateStringId(card),
}));

/**
 * Generate string ID from card data
 */
function generateStringId(card) {
  const name = card.name.toLowerCase().replace(/\s+/g, '_');
  const prefix = String(card.id).padStart(2, '0');
  return `${prefix}_${name}`;
}

/**
 * Get card by ID (number)
 */
export function getCardById(id) {
  return TAROT_DECK.find((card) => card.id === id) || null;
}

/**
 * Get card by string ID
 */
export function getCardByStringId(stringId) {
  return TAROT_DECK.find((card) => card.stringId === stringId) || null;
}

/**
 * Get card by name
 */
export function getCardByName(name) {
  const lowerName = name.toLowerCase();
  return TAROT_DECK.find((card) => card.name.toLowerCase() === lowerName) || null;
}

/**
 * Get random card with tiered drop system
 * Returns { card, tier, assetType, image } or null if no cards available
 */
export function getRandomCard(excludeIds = []) {
  const available = TAROT_DECK.filter((card) => !excludeIds.includes(card.id));
  if (available.length === 0) return null;

  const card = available[Math.floor(Math.random() * available.length)];
  const { tier, assetType } = rollCardTier(card);
  const image = getCardImage(card, tier);

  return { card, tier, assetType, image };
}

/**
 * Get shuffled deck
 * Uses Fisher-Yates shuffle algorithm
 */
export function getShuffledDeck() {
  const deck = [...TAROT_DECK];

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * Draw N cards from shuffled deck with tiered drop system
 *
 * DROP RATES:
 * - All 78 cards have equal chance of being drawn
 * - After draw, RNG determines tier:
 *   - 85% Common (PNG from card_art/common)
 *   - 15% Rare (PNG from card_art/rare)
 *   - If Rare + Major Arcana: 10% chance of MP4 artifact
 *
 * Returns array of { card, isReversed, tier, assetType, image }
 */
export function drawCards(count = 1, allowReversed = true) {
  const shuffled = getShuffledDeck();
  const drawn = shuffled.slice(0, count);

  return drawn.map((card) => {
    // Roll tier for this card
    const { tier, assetType } = rollCardTier(card);

    // Get the appropriate image/video asset based on tier
    const image = getCardImage(card, tier);

    return {
      card,
      isReversed: allowReversed ? Math.random() < 0.3 : false, // 30% chance of reversal
      tier,
      assetType,
      image,
    };
  });
}

/**
 * Draw a single card with tiered drop system
 * Convenience wrapper for single card draws
 */
export function drawSingleCard(allowReversed = true) {
  const result = drawCards(1, allowReversed);
  return result[0];
}

/**
 * Get cards by arcana type
 */
export function getCardsByArcana(arcana) {
  return TAROT_DECK.filter((card) => card.arcana === arcana);
}

/**
 * Get cards by suit
 */
export function getCardsBySuit(suit) {
  return TAROT_DECK.filter((card) => card.suit === suit);
}

/**
 * Get major arcana cards
 */
export function getMajorArcana() {
  return getCardsByArcana('major');
}

/**
 * Get minor arcana cards
 */
export function getMinorArcana() {
  return getCardsByArcana('minor');
}

/**
 * Get card interpretation (upright or reversed)
 * Now includes full symbolism data from cardDatabase
 */
export function getInterpretation(card, isReversed = false) {
  const keywords = isReversed ? card.keywords.reversed : card.keywords.upright;

  return {
    keywords,
    description: card.description,
    advice: card.advice,
    questions: card.questions || [],
    shadow: isReversed ? card.shadow : null,
    light: !isReversed ? card.light : null,
    // Deep symbolism data
    symbols: card.symbols || [],
    archetypes: card.archetypes || [],
    themes: card.themes || [],
    element: card.element,
    astrology: card.astrology,
    numerology: card.numerology,
    chakra: card.chakra,
    jungian: card.jungian,
    kabbalah: card.kabbalah,
    seasonality: card.seasonality,
    timeframe: card.timeframe,
    // Dark fantasy lore (if available)
    darkFantasy: card.darkFantasy || null,
  };
}

/**
 * Search cards by keyword
 */
export function searchCards(query) {
  const lowerQuery = query.toLowerCase();

  return TAROT_DECK.filter((card) => {
    const nameMatch = card.name.toLowerCase().includes(lowerQuery);
    const keywordsMatch =
      card.keywords.upright.some((kw) => kw.toLowerCase().includes(lowerQuery)) ||
      card.keywords.reversed.some((kw) => kw.toLowerCase().includes(lowerQuery));
    const themesMatch = card.themes?.some((theme) => theme.toLowerCase().includes(lowerQuery));

    return nameMatch || keywordsMatch || themesMatch;
  });
}

export default TAROT_DECK;
