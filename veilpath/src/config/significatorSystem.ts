/**
 * SIGNIFICATOR SELECTION SYSTEM
 *
 * The significator is a card chosen by the user to represent themselves
 * and their intent in the reading. It's placed on the table FIRST,
 * then EXCLUDED from the deck for the actual reading.
 *
 * Features:
 * - LLM-powered card recommendation based on keywords + intent
 * - Smart search with fuzzy matching
 * - Significator intro animations (unlockable, selectable)
 * - Deck exclusion logic
 * - Animation reward pipeline integration
 */

import { Rarity } from './cosmeticsTypes';

// =============================================================================
// TAROT DECK DEFINITION (All 78 Cards)
// =============================================================================

export type Suit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
export type MajorArcanaNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21;
export type MinorArcanaNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // Ace through King

export interface TarotCard {
  id: string;
  name: string;
  suit: Suit;
  number: MajorArcanaNumber | MinorArcanaNumber;

  // For search/matching
  keywords: string[];
  themes: string[];
  archetypes: string[];
  elements: string[];
  zodiacSigns: string[];
  planetaryRulers: string[];

  // For LLM context
  uprightMeaning: string;
  reversedMeaning: string;
  personaDescription: string; // Who this card represents as a person

  // Asset paths
  frontAssetId: string;
  thumbnailPath: string;
}

// =============================================================================
// MAJOR ARCANA (22 cards, 0-21)
// =============================================================================

export const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 'major_00_fool',
    name: 'The Fool',
    suit: 'major',
    number: 0,
    keywords: ['beginner', 'innocent', 'spontaneous', 'free spirit', 'leap of faith'],
    themes: ['new beginnings', 'adventure', 'potential', 'trust'],
    archetypes: ['the innocent', 'the wanderer', 'the child'],
    elements: ['air'],
    zodiacSigns: [],
    planetaryRulers: ['uranus'],
    uprightMeaning: 'New beginnings, innocence, spontaneity, free spirit',
    reversedMeaning: 'Recklessness, risk-taking, holding back',
    personaDescription: 'Someone starting a new journey, young at heart, optimistic and carefree',
    frontAssetId: 'card_major_00',
    thumbnailPath: '/assets/cards/thumbs/major_00.jpg',
  },
  {
    id: 'major_01_magician',
    name: 'The Magician',
    suit: 'major',
    number: 1,
    keywords: ['manifestation', 'power', 'action', 'resourceful', 'skilled'],
    themes: ['willpower', 'creation', 'mastery', 'concentration'],
    archetypes: ['the creator', 'the trickster', 'the alchemist'],
    elements: ['air'],
    zodiacSigns: [],
    planetaryRulers: ['mercury'],
    uprightMeaning: 'Manifestation, resourcefulness, power, inspired action',
    reversedMeaning: 'Manipulation, poor planning, untapped talents',
    personaDescription: 'Someone with all the tools they need, creative and capable',
    frontAssetId: 'card_major_01',
    thumbnailPath: '/assets/cards/thumbs/major_01.jpg',
  },
  {
    id: 'major_02_high_priestess',
    name: 'The High Priestess',
    suit: 'major',
    number: 2,
    keywords: ['intuition', 'mystery', 'subconscious', 'inner voice', 'wisdom'],
    themes: ['secrets', 'higher power', 'feminine divine', 'hidden knowledge'],
    archetypes: ['the mystic', 'the oracle', 'the wise woman'],
    elements: ['water'],
    zodiacSigns: [],
    planetaryRulers: ['moon'],
    uprightMeaning: 'Intuition, sacred knowledge, divine feminine, the subconscious mind',
    reversedMeaning: 'Secrets, disconnected from intuition, withdrawal',
    personaDescription: 'Someone deeply intuitive, keeper of secrets, spiritually connected',
    frontAssetId: 'card_major_02',
    thumbnailPath: '/assets/cards/thumbs/major_02.jpg',
  },
  {
    id: 'major_03_empress',
    name: 'The Empress',
    suit: 'major',
    number: 3,
    keywords: ['fertility', 'beauty', 'nature', 'abundance', 'nurturing'],
    themes: ['motherhood', 'creation', 'sensuality', 'growth'],
    archetypes: ['the mother', 'the nurturer', 'the goddess'],
    elements: ['earth'],
    zodiacSigns: [],
    planetaryRulers: ['venus'],
    uprightMeaning: 'Femininity, beauty, nature, nurturing, abundance',
    reversedMeaning: 'Creative block, dependence on others, emptiness',
    personaDescription: 'Someone nurturing and creative, connected to nature and beauty',
    frontAssetId: 'card_major_03',
    thumbnailPath: '/assets/cards/thumbs/major_03.jpg',
  },
  {
    id: 'major_04_emperor',
    name: 'The Emperor',
    suit: 'major',
    number: 4,
    keywords: ['authority', 'structure', 'control', 'father', 'leadership'],
    themes: ['stability', 'power', 'protection', 'discipline'],
    archetypes: ['the father', 'the ruler', 'the protector'],
    elements: ['fire'],
    zodiacSigns: ['aries'],
    planetaryRulers: ['mars'],
    uprightMeaning: 'Authority, establishment, structure, father figure',
    reversedMeaning: 'Domination, excessive control, lack of discipline',
    personaDescription: 'Someone in authority, structured and disciplined, a leader',
    frontAssetId: 'card_major_04',
    thumbnailPath: '/assets/cards/thumbs/major_04.jpg',
  },
  {
    id: 'major_05_hierophant',
    name: 'The Hierophant',
    suit: 'major',
    number: 5,
    keywords: ['tradition', 'conformity', 'morality', 'beliefs', 'teacher'],
    themes: ['religion', 'institutions', 'guidance', 'wisdom'],
    archetypes: ['the teacher', 'the priest', 'the mentor'],
    elements: ['earth'],
    zodiacSigns: ['taurus'],
    planetaryRulers: ['venus'],
    uprightMeaning: 'Spiritual wisdom, religious beliefs, conformity, tradition',
    reversedMeaning: 'Personal beliefs, freedom, challenging the status quo',
    personaDescription: 'Someone traditional, a teacher or mentor, spiritually grounded',
    frontAssetId: 'card_major_05',
    thumbnailPath: '/assets/cards/thumbs/major_05.jpg',
  },
  {
    id: 'major_06_lovers',
    name: 'The Lovers',
    suit: 'major',
    number: 6,
    keywords: ['love', 'harmony', 'relationships', 'choices', 'alignment'],
    themes: ['partnership', 'values', 'union', 'duality'],
    archetypes: ['the lover', 'the partner', 'the soulmate'],
    elements: ['air'],
    zodiacSigns: ['gemini'],
    planetaryRulers: ['mercury'],
    uprightMeaning: 'Love, harmony, relationships, values alignment, choices',
    reversedMeaning: 'Self-love, disharmony, imbalance, misalignment',
    personaDescription: 'Someone in love or seeking partnership, facing important choices',
    frontAssetId: 'card_major_06',
    thumbnailPath: '/assets/cards/thumbs/major_06.jpg',
  },
  {
    id: 'major_07_chariot',
    name: 'The Chariot',
    suit: 'major',
    number: 7,
    keywords: ['control', 'willpower', 'success', 'determination', 'victory'],
    themes: ['triumph', 'direction', 'ambition', 'drive'],
    archetypes: ['the warrior', 'the conqueror', 'the driver'],
    elements: ['water'],
    zodiacSigns: ['cancer'],
    planetaryRulers: ['moon'],
    uprightMeaning: 'Control, willpower, success, action, determination',
    reversedMeaning: 'Self-discipline, opposition, lack of direction',
    personaDescription: 'Someone driven and determined, overcoming obstacles through will',
    frontAssetId: 'card_major_07',
    thumbnailPath: '/assets/cards/thumbs/major_07.jpg',
  },
  {
    id: 'major_08_strength',
    name: 'Strength',
    suit: 'major',
    number: 8,
    keywords: ['courage', 'patience', 'control', 'compassion', 'inner strength'],
    themes: ['bravery', 'influence', 'gentle power', 'resilience'],
    archetypes: ['the gentle warrior', 'the tamer', 'the healer'],
    elements: ['fire'],
    zodiacSigns: ['leo'],
    planetaryRulers: ['sun'],
    uprightMeaning: 'Strength, courage, persuasion, influence, compassion',
    reversedMeaning: 'Inner strength, self-doubt, raw emotion, insecurity',
    personaDescription: 'Someone with quiet inner strength, patient and compassionate',
    frontAssetId: 'card_major_08',
    thumbnailPath: '/assets/cards/thumbs/major_08.jpg',
  },
  {
    id: 'major_09_hermit',
    name: 'The Hermit',
    suit: 'major',
    number: 9,
    keywords: ['soul-searching', 'introspection', 'solitude', 'guidance', 'wisdom'],
    themes: ['inner journey', 'contemplation', 'enlightenment', 'retreat'],
    archetypes: ['the sage', 'the seeker', 'the wise elder'],
    elements: ['earth'],
    zodiacSigns: ['virgo'],
    planetaryRulers: ['mercury'],
    uprightMeaning: 'Soul-searching, introspection, being alone, inner guidance',
    reversedMeaning: 'Isolation, loneliness, withdrawal',
    personaDescription: 'Someone on a spiritual quest, seeking wisdom through solitude',
    frontAssetId: 'card_major_09',
    thumbnailPath: '/assets/cards/thumbs/major_09.jpg',
  },
  {
    id: 'major_10_wheel',
    name: 'Wheel of Fortune',
    suit: 'major',
    number: 10,
    keywords: ['change', 'cycles', 'fate', 'destiny', 'turning point'],
    themes: ['luck', 'karma', 'life cycles', 'fortune'],
    archetypes: ['the gambler', 'the fated one'],
    elements: ['fire'],
    zodiacSigns: [],
    planetaryRulers: ['jupiter'],
    uprightMeaning: 'Good luck, karma, life cycles, destiny, a turning point',
    reversedMeaning: 'Bad luck, resistance to change, breaking cycles',
    personaDescription: 'Someone at a crossroads, experiencing major life changes',
    frontAssetId: 'card_major_10',
    thumbnailPath: '/assets/cards/thumbs/major_10.jpg',
  },
  {
    id: 'major_11_justice',
    name: 'Justice',
    suit: 'major',
    number: 11,
    keywords: ['fairness', 'truth', 'law', 'cause and effect', 'balance'],
    themes: ['karma', 'accountability', 'honesty', 'objectivity'],
    archetypes: ['the judge', 'the arbiter', 'the balanced one'],
    elements: ['air'],
    zodiacSigns: ['libra'],
    planetaryRulers: ['venus'],
    uprightMeaning: 'Justice, fairness, truth, cause and effect, law',
    reversedMeaning: 'Unfairness, lack of accountability, dishonesty',
    personaDescription: 'Someone fair-minded, seeking truth and balance',
    frontAssetId: 'card_major_11',
    thumbnailPath: '/assets/cards/thumbs/major_11.jpg',
  },
  {
    id: 'major_12_hanged_man',
    name: 'The Hanged Man',
    suit: 'major',
    number: 12,
    keywords: ['pause', 'surrender', 'letting go', 'new perspective', 'sacrifice'],
    themes: ['suspension', 'restriction', 'waiting', 'enlightenment'],
    archetypes: ['the martyr', 'the mystic', 'the suspended one'],
    elements: ['water'],
    zodiacSigns: [],
    planetaryRulers: ['neptune'],
    uprightMeaning: 'Pause, surrender, letting go, new perspectives',
    reversedMeaning: 'Delays, resistance, stalling, indecision',
    personaDescription: 'Someone in a period of waiting, gaining new perspective through sacrifice',
    frontAssetId: 'card_major_12',
    thumbnailPath: '/assets/cards/thumbs/major_12.jpg',
  },
  {
    id: 'major_13_death',
    name: 'Death',
    suit: 'major',
    number: 13,
    keywords: ['endings', 'change', 'transformation', 'transition', 'release'],
    themes: ['rebirth', 'letting go', 'closure', 'metamorphosis'],
    archetypes: ['the transformer', 'the reaper', 'the phoenix'],
    elements: ['water'],
    zodiacSigns: ['scorpio'],
    planetaryRulers: ['pluto'],
    uprightMeaning: 'Endings, change, transformation, transition',
    reversedMeaning: 'Resistance to change, personal transformation, inner purging',
    personaDescription: 'Someone undergoing major transformation, leaving the old behind',
    frontAssetId: 'card_major_13',
    thumbnailPath: '/assets/cards/thumbs/major_13.jpg',
  },
  {
    id: 'major_14_temperance',
    name: 'Temperance',
    suit: 'major',
    number: 14,
    keywords: ['balance', 'moderation', 'patience', 'purpose', 'harmony'],
    themes: ['middle path', 'tranquility', 'healing', 'blending'],
    archetypes: ['the healer', 'the alchemist', 'the diplomat'],
    elements: ['fire'],
    zodiacSigns: ['sagittarius'],
    planetaryRulers: ['jupiter'],
    uprightMeaning: 'Balance, moderation, patience, purpose',
    reversedMeaning: 'Imbalance, excess, self-healing, re-alignment',
    personaDescription: 'Someone seeking balance, patient and moderate in approach',
    frontAssetId: 'card_major_14',
    thumbnailPath: '/assets/cards/thumbs/major_14.jpg',
  },
  {
    id: 'major_15_devil',
    name: 'The Devil',
    suit: 'major',
    number: 15,
    keywords: ['shadow self', 'attachment', 'addiction', 'restriction', 'materialism'],
    themes: ['bondage', 'temptation', 'ignorance', 'obsession'],
    archetypes: ['the shadow', 'the tempter', 'the bound one'],
    elements: ['earth'],
    zodiacSigns: ['capricorn'],
    planetaryRulers: ['saturn'],
    uprightMeaning: 'Shadow self, attachment, addiction, restriction, sexuality',
    reversedMeaning: 'Releasing limiting beliefs, exploring dark thoughts, detachment',
    personaDescription: 'Someone dealing with attachments or addictions, facing their shadow',
    frontAssetId: 'card_major_15',
    thumbnailPath: '/assets/cards/thumbs/major_15.jpg',
  },
  {
    id: 'major_16_tower',
    name: 'The Tower',
    suit: 'major',
    number: 16,
    keywords: ['sudden change', 'upheaval', 'chaos', 'revelation', 'awakening'],
    themes: ['destruction', 'liberation', 'crisis', 'breakthrough'],
    archetypes: ['the awakened one', 'the survivor', 'the rebuilder'],
    elements: ['fire'],
    zodiacSigns: [],
    planetaryRulers: ['mars'],
    uprightMeaning: 'Sudden change, upheaval, chaos, revelation, awakening',
    reversedMeaning: 'Personal transformation, fear of change, averting disaster',
    personaDescription: 'Someone experiencing sudden upheaval, being shaken to their foundation',
    frontAssetId: 'card_major_16',
    thumbnailPath: '/assets/cards/thumbs/major_16.jpg',
  },
  {
    id: 'major_17_star',
    name: 'The Star',
    suit: 'major',
    number: 17,
    keywords: ['hope', 'faith', 'renewal', 'serenity', 'inspiration'],
    themes: ['healing', 'spirituality', 'peace', 'optimism'],
    archetypes: ['the healer', 'the hopeful one', 'the star child'],
    elements: ['air'],
    zodiacSigns: ['aquarius'],
    planetaryRulers: ['uranus'],
    uprightMeaning: 'Hope, faith, purpose, renewal, spirituality',
    reversedMeaning: 'Lack of faith, despair, self-trust, disconnection',
    personaDescription: 'Someone hopeful and healing, connected to higher purpose',
    frontAssetId: 'card_major_17',
    thumbnailPath: '/assets/cards/thumbs/major_17.jpg',
  },
  {
    id: 'major_18_moon',
    name: 'The Moon',
    suit: 'major',
    number: 18,
    keywords: ['illusion', 'fear', 'anxiety', 'subconscious', 'intuition'],
    themes: ['dreams', 'mystery', 'deception', 'the unknown'],
    archetypes: ['the dreamer', 'the mystic', 'the shadow walker'],
    elements: ['water'],
    zodiacSigns: ['pisces'],
    planetaryRulers: ['neptune'],
    uprightMeaning: 'Illusion, fear, anxiety, subconscious, intuition',
    reversedMeaning: 'Release of fear, repressed emotion, inner confusion',
    personaDescription: 'Someone navigating uncertainty, dealing with fears or illusions',
    frontAssetId: 'card_major_18',
    thumbnailPath: '/assets/cards/thumbs/major_18.jpg',
  },
  {
    id: 'major_19_sun',
    name: 'The Sun',
    suit: 'major',
    number: 19,
    keywords: ['positivity', 'fun', 'warmth', 'success', 'vitality'],
    themes: ['joy', 'celebration', 'truth', 'optimism'],
    archetypes: ['the child', 'the radiant one', 'the victor'],
    elements: ['fire'],
    zodiacSigns: [],
    planetaryRulers: ['sun'],
    uprightMeaning: 'Positivity, fun, warmth, success, vitality',
    reversedMeaning: 'Inner child, feeling down, overly optimistic',
    personaDescription: 'Someone joyful and successful, radiating positivity',
    frontAssetId: 'card_major_19',
    thumbnailPath: '/assets/cards/thumbs/major_19.jpg',
  },
  {
    id: 'major_20_judgement',
    name: 'Judgement',
    suit: 'major',
    number: 20,
    keywords: ['judgement', 'rebirth', 'inner calling', 'absolution', 'reflection'],
    themes: ['awakening', 'renewal', 'reckoning', 'evaluation'],
    archetypes: ['the reborn', 'the called', 'the awakened'],
    elements: ['fire'],
    zodiacSigns: [],
    planetaryRulers: ['pluto'],
    uprightMeaning: 'Judgement, rebirth, inner calling, absolution',
    reversedMeaning: 'Self-doubt, inner critic, ignoring the call',
    personaDescription: 'Someone hearing their calling, undergoing spiritual awakening',
    frontAssetId: 'card_major_20',
    thumbnailPath: '/assets/cards/thumbs/major_20.jpg',
  },
  {
    id: 'major_21_world',
    name: 'The World',
    suit: 'major',
    number: 21,
    keywords: ['completion', 'integration', 'accomplishment', 'travel', 'wholeness'],
    themes: ['fulfillment', 'achievement', 'closure', 'unity'],
    archetypes: ['the completed one', 'the dancer', 'the world traveler'],
    elements: ['earth'],
    zodiacSigns: [],
    planetaryRulers: ['saturn'],
    uprightMeaning: 'Completion, integration, accomplishment, travel',
    reversedMeaning: 'Seeking personal closure, short-cuts, delays',
    personaDescription: 'Someone who has achieved wholeness, completing a major cycle',
    frontAssetId: 'card_major_21',
    thumbnailPath: '/assets/cards/thumbs/major_21.jpg',
  },
];

// =============================================================================
// MINOR ARCANA GENERATOR (56 cards)
// =============================================================================

const SUIT_METADATA: Record<Exclude<Suit, 'major'>, {
  element: string;
  themes: string[];
  courtPersonas: Record<string, string>;
}> = {
  wands: {
    element: 'fire',
    themes: ['passion', 'creativity', 'ambition', 'energy', 'action'],
    courtPersonas: {
      page: 'A young, enthusiastic person full of creative ideas',
      knight: 'An adventurous, passionate person charging forward',
      queen: 'A charismatic, confident leader who inspires others',
      king: 'A visionary leader with bold entrepreneurial spirit',
    },
  },
  cups: {
    element: 'water',
    themes: ['emotions', 'relationships', 'intuition', 'creativity', 'love'],
    courtPersonas: {
      page: 'A sensitive, romantic dreamer with artistic inclinations',
      knight: 'A charming, idealistic person following their heart',
      queen: 'A nurturing, emotionally intelligent and compassionate person',
      king: 'A wise, emotionally balanced person with deep empathy',
    },
  },
  swords: {
    element: 'air',
    themes: ['intellect', 'conflict', 'truth', 'communication', 'decisions'],
    courtPersonas: {
      page: 'A curious, mentally agile person seeking truth',
      knight: 'A determined, ambitious person who fights for justice',
      queen: 'An independent, perceptive person with sharp intellect',
      king: 'An authoritative, clear-thinking leader of principle',
    },
  },
  pentacles: {
    element: 'earth',
    themes: ['material', 'career', 'money', 'health', 'security'],
    courtPersonas: {
      page: 'A diligent student, focused on developing skills',
      knight: 'A reliable, hardworking person pursuing goals methodically',
      queen: 'A generous, practical nurturer who creates abundance',
      king: 'A successful, wealthy person with business acumen',
    },
  },
};

const NUMBER_MEANINGS: Record<number, { keywords: string[]; theme: string }> = {
  1: { keywords: ['beginning', 'potential', 'opportunity', 'seed'], theme: 'New beginnings' },
  2: { keywords: ['balance', 'partnership', 'duality', 'choice'], theme: 'Choices and balance' },
  3: { keywords: ['growth', 'creativity', 'expression', 'collaboration'], theme: 'Growth and creativity' },
  4: { keywords: ['stability', 'foundation', 'structure', 'security'], theme: 'Stability and structure' },
  5: { keywords: ['conflict', 'change', 'challenge', 'instability'], theme: 'Conflict and change' },
  6: { keywords: ['harmony', 'balance', 'giving', 'communication'], theme: 'Harmony and giving' },
  7: { keywords: ['reflection', 'assessment', 'patience', 'perseverance'], theme: 'Reflection and patience' },
  8: { keywords: ['movement', 'action', 'change', 'power'], theme: 'Movement and power' },
  9: { keywords: ['attainment', 'satisfaction', 'near completion', 'culmination'], theme: 'Near completion' },
  10: { keywords: ['completion', 'ending', 'fulfillment', 'cycle end'], theme: 'Completion of cycle' },
  11: { keywords: ['page', 'message', 'student', 'curiosity'], theme: 'New messages, study' },
  12: { keywords: ['knight', 'action', 'pursuit', 'movement'], theme: 'Active pursuit' },
  13: { keywords: ['queen', 'mastery', 'nurturing', 'inward'], theme: 'Inward mastery' },
  14: { keywords: ['king', 'authority', 'mastery', 'outward'], theme: 'Outward mastery' },
};

function generateMinorArcana(): TarotCard[] {
  const cards: TarotCard[] = [];
  const suits: Exclude<Suit, 'major'>[] = ['wands', 'cups', 'swords', 'pentacles'];

  for (const suit of suits) {
    const meta = SUIT_METADATA[suit];

    for (let num = 1; num <= 14; num++) {
      const numMeta = NUMBER_MEANINGS[num];
      const isCourtCard = num > 10;

      let name: string;
      let personaDesc: string;

      if (num === 1) {
        name = `Ace of ${capitalize(suit)}`;
        personaDesc = `Someone at a new beginning in ${meta.themes[0]}`;
      } else if (num <= 10) {
        name = `${num} of ${capitalize(suit)}`;
        personaDesc = `Someone experiencing ${numMeta.theme.toLowerCase()} in ${meta.themes[0]}`;
      } else {
        const courtRank = num === 11 ? 'Page' : num === 12 ? 'Knight' : num === 13 ? 'Queen' : 'King';
        name = `${courtRank} of ${capitalize(suit)}`;
        personaDesc = meta.courtPersonas[courtRank.toLowerCase()];
      }

      cards.push({
        id: `${suit}_${num.toString().padStart(2, '0')}`,
        name,
        suit,
        number: num as MinorArcanaNumber,
        keywords: [...numMeta.keywords, ...meta.themes.slice(0, 2)],
        themes: meta.themes,
        archetypes: isCourtCard ? [name.split(' ')[0].toLowerCase()] : [],
        elements: [meta.element],
        zodiacSigns: [],
        planetaryRulers: [],
        uprightMeaning: `${numMeta.theme} in matters of ${meta.themes.join(', ')}`,
        reversedMeaning: `Blocked or reversed ${numMeta.theme.toLowerCase()} in ${meta.themes[0]}`,
        personaDescription: personaDesc,
        frontAssetId: `card_${suit}_${num.toString().padStart(2, '0')}`,
        thumbnailPath: `/assets/cards/thumbs/${suit}_${num.toString().padStart(2, '0')}.jpg`,
      });
    }
  }

  return cards;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Complete 78-card deck
export const FULL_DECK: TarotCard[] = [...MAJOR_ARCANA, ...generateMinorArcana()];

// =============================================================================
// SIGNIFICATOR SEARCH & LLM RECOMMENDATION
// =============================================================================

export interface SignificatorSearchQuery {
  keywords: string;          // User-typed keywords
  intentPrompt?: string;     // The reading's intent/question
  zodiacSign?: string;       // User's zodiac sign (optional filter)
  preferredElement?: string; // User's elemental preference
}

export interface SignificatorRecommendation {
  cardId: string;
  card: TarotCard;
  matchScore: number;        // 0-100
  matchReasons: string[];    // Why this card matches
  llmExplanation?: string;   // LLM-generated explanation
}

/**
 * Local fuzzy search for immediate results before LLM responds
 */
export function searchCardsLocally(
  query: string,
  deck: TarotCard[] = FULL_DECK
): SignificatorRecommendation[] {
  const queryLower = query.toLowerCase().trim();
  const queryTerms = queryLower.split(/\s+/);

  const results: SignificatorRecommendation[] = [];

  for (const card of deck) {
    let score = 0;
    const reasons: string[] = [];

    // Exact name match (highest)
    if (card.name.toLowerCase().includes(queryLower)) {
      score += 50;
      reasons.push('Name match');
    }

    // Number match (for "3", "three", etc.)
    const numberWords: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'ace': 1, 'page': 11, 'knight': 12, 'queen': 13, 'king': 14,
    };

    for (const term of queryTerms) {
      const num = parseInt(term) || numberWords[term];
      if (num && card.number === num) {
        score += 30;
        reasons.push('Number match');
      }
    }

    // Keyword matches
    for (const keyword of card.keywords) {
      for (const term of queryTerms) {
        if (keyword.toLowerCase().includes(term)) {
          score += 15;
          reasons.push(`Keyword: ${keyword}`);
        }
      }
    }

    // Theme matches
    for (const theme of card.themes) {
      for (const term of queryTerms) {
        if (theme.toLowerCase().includes(term)) {
          score += 10;
          reasons.push(`Theme: ${theme}`);
        }
      }
    }

    // Archetype matches
    for (const archetype of card.archetypes) {
      for (const term of queryTerms) {
        if (archetype.toLowerCase().includes(term)) {
          score += 20;
          reasons.push(`Archetype: ${archetype}`);
        }
      }
    }

    // Element matches
    for (const element of card.elements) {
      for (const term of queryTerms) {
        if (element.toLowerCase() === term) {
          score += 10;
          reasons.push(`Element: ${element}`);
        }
      }
    }

    // Zodiac matches
    for (const sign of card.zodiacSigns) {
      for (const term of queryTerms) {
        if (sign.toLowerCase() === term) {
          score += 15;
          reasons.push(`Zodiac: ${sign}`);
        }
      }
    }

    // Suit match
    for (const term of queryTerms) {
      if (card.suit === term || (card.suit !== 'major' && card.suit.includes(term))) {
        score += 10;
        reasons.push(`Suit: ${card.suit}`);
      }
    }

    if (score > 0) {
      results.push({
        cardId: card.id,
        card,
        matchScore: Math.min(100, score),
        matchReasons: [...new Set(reasons)], // Dedupe
      });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
}

/**
 * Build prompt for LLM to recommend significators
 */
export function buildSignificatorPrompt(query: SignificatorSearchQuery): string {
  return `You are helping a user choose a significator card for a tarot reading.

USER'S SEARCH: "${query.keywords}"
${query.intentPrompt ? `READING INTENT: "${query.intentPrompt}"` : ''}
${query.zodiacSign ? `USER'S ZODIAC: ${query.zodiacSign}` : ''}
${query.preferredElement ? `PREFERRED ELEMENT: ${query.preferredElement}` : ''}

Based on the user's search and intent, recommend 3-5 tarot cards that would make excellent significators.
Consider both the literal meaning of their keywords AND the deeper symbolic/archetypal resonance.

Return a JSON array with this structure:
[
  {
    "cardId": "major_01_magician", // exact card ID
    "explanation": "Brief explanation of why this card fits as their significator",
    "matchScore": 85 // 0-100 confidence
  }
]

Available card IDs follow these patterns:
- Major Arcana: major_00_fool through major_21_world
- Minor Arcana: wands_01 through wands_14, cups_01 through cups_14, swords_01 through swords_14, pentacles_01 through pentacles_14

Focus on cards that represent WHO THE QUERENT IS or WHO THEY WANT TO BE in this reading.`;
}

// =============================================================================
// SIGNIFICATOR INTRO ANIMATIONS
// =============================================================================

export interface SignificatorAnimation {
  id: string;
  name: string;
  description: string;

  // Unlock requirements
  rarity: Rarity;
  isDefault: boolean;
  unlockMethod: 'free' | 'achievement' | 'quest' | 'purchase' | 'contest' | 'seasonal';
  unlockRequirementId?: string; // Achievement/quest/etc. ID

  // Animation definition
  duration: number;          // Total ms
  phases: AnimationPhase[];
  soundEffects: SoundEffect[];
  particleEffects: ParticleEffect[];

  // Preview
  previewPath: string;       // Video/gif preview
  thumbnailPath: string;
}

export interface AnimationPhase {
  name: string;
  startTime: number;         // ms from start
  duration: number;          // ms

  // Card transform
  cardTransform: {
    startX: number;          // % of scene
    startY: number;
    endX: number;
    endY: number;
    startRotation: number;   // degrees
    endRotation: number;
    startScale: number;
    endScale: number;
    startOpacity: number;
    endOpacity: number;
  };

  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce';
}

export interface SoundEffect {
  id: string;
  path: string;
  startTime: number;         // ms from animation start
  volume: number;            // 0-1
}

export interface ParticleEffect {
  id: string;
  type: 'sparkle' | 'smoke' | 'fire' | 'water' | 'leaves' | 'stars' | 'void' | 'custom';
  configPath?: string;       // For custom particle configs
  startTime: number;
  duration: number;
  intensity: number;         // 0-1
}

// =============================================================================
// DEFAULT SIGNIFICATOR ANIMATIONS
// =============================================================================

export const SIGNIFICATOR_ANIMATIONS: SignificatorAnimation[] = [
  // FREE DEFAULTS
  {
    id: 'sig_anim_classic_place',
    name: 'Classic Placement',
    description: 'A simple, elegant placement from deck to table',
    rarity: 'common',
    isDefault: true,
    unlockMethod: 'free',
    duration: 1200,
    phases: [
      {
        name: 'lift_from_deck',
        startTime: 0,
        duration: 400,
        cardTransform: {
          startX: 10, startY: 50, endX: 30, endY: 40,
          startRotation: 0, endRotation: -5,
          startScale: 0.8, endScale: 1.0,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'ease-out',
      },
      {
        name: 'float_to_position',
        startTime: 400,
        duration: 500,
        cardTransform: {
          startX: 30, startY: 40, endX: 50, endY: 50,
          startRotation: -5, endRotation: 0,
          startScale: 1.0, endScale: 1.0,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'ease-in-out',
      },
      {
        name: 'settle',
        startTime: 900,
        duration: 300,
        cardTransform: {
          startX: 50, startY: 50, endX: 50, endY: 50,
          startRotation: 0, endRotation: 0,
          startScale: 1.0, endScale: 0.95,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'bounce',
      },
    ],
    soundEffects: [
      { id: 'card_slide', path: '/assets/sounds/card_slide.mp3', startTime: 0, volume: 0.6 },
      { id: 'card_place', path: '/assets/sounds/card_place.mp3', startTime: 900, volume: 0.7 },
    ],
    particleEffects: [],
    previewPath: '/assets/animations/previews/sig_classic.mp4',
    thumbnailPath: '/assets/animations/thumbs/sig_classic.jpg',
  },
  {
    id: 'sig_anim_gentle_float',
    name: 'Gentle Float',
    description: 'Card floats gently from the deck with a soft glow',
    rarity: 'common',
    isDefault: true,
    unlockMethod: 'free',
    duration: 1800,
    phases: [
      {
        name: 'rise',
        startTime: 0,
        duration: 600,
        cardTransform: {
          startX: 10, startY: 55, endX: 25, endY: 30,
          startRotation: -10, endRotation: 5,
          startScale: 0.7, endScale: 1.1,
          startOpacity: 0.8, endOpacity: 1,
        },
        easing: 'ease-out',
      },
      {
        name: 'glide',
        startTime: 600,
        duration: 800,
        cardTransform: {
          startX: 25, startY: 30, endX: 50, endY: 50,
          startRotation: 5, endRotation: 0,
          startScale: 1.1, endScale: 1.0,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'ease-in-out',
      },
      {
        name: 'land',
        startTime: 1400,
        duration: 400,
        cardTransform: {
          startX: 50, startY: 50, endX: 50, endY: 50,
          startRotation: 0, endRotation: 0,
          startScale: 1.0, endScale: 0.95,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'spring',
      },
    ],
    soundEffects: [
      { id: 'whoosh_soft', path: '/assets/sounds/whoosh_soft.mp3', startTime: 0, volume: 0.4 },
      { id: 'shimmer', path: '/assets/sounds/shimmer.mp3', startTime: 300, volume: 0.5 },
      { id: 'card_place', path: '/assets/sounds/card_place.mp3', startTime: 1400, volume: 0.6 },
    ],
    particleEffects: [
      { id: 'soft_glow', type: 'sparkle', startTime: 200, duration: 1200, intensity: 0.3 },
    ],
    previewPath: '/assets/animations/previews/sig_float.mp4',
    thumbnailPath: '/assets/animations/thumbs/sig_float.jpg',
  },

  // ACHIEVEMENT UNLOCKS
  {
    id: 'sig_anim_mystic_reveal',
    name: 'Mystic Reveal',
    description: 'Card emerges from mystical smoke with ethereal glow',
    rarity: 'rare',
    isDefault: false,
    unlockMethod: 'achievement',
    unlockRequirementId: 'ach_first_celtic_cross',
    duration: 2200,
    phases: [
      {
        name: 'smoke_gather',
        startTime: 0,
        duration: 500,
        cardTransform: {
          startX: 50, startY: 50, endX: 50, endY: 50,
          startRotation: 0, endRotation: 0,
          startScale: 0, endScale: 0.3,
          startOpacity: 0, endOpacity: 0.5,
        },
        easing: 'ease-in',
      },
      {
        name: 'emerge',
        startTime: 500,
        duration: 800,
        cardTransform: {
          startX: 50, startY: 50, endX: 50, endY: 45,
          startRotation: 0, endRotation: 360,
          startScale: 0.3, endScale: 1.2,
          startOpacity: 0.5, endOpacity: 1,
        },
        easing: 'ease-out',
      },
      {
        name: 'settle_glow',
        startTime: 1300,
        duration: 900,
        cardTransform: {
          startX: 50, startY: 45, endX: 50, endY: 50,
          startRotation: 360, endRotation: 360,
          startScale: 1.2, endScale: 1.0,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'spring',
      },
    ],
    soundEffects: [
      { id: 'mystical_whoosh', path: '/assets/sounds/mystical_whoosh.mp3', startTime: 0, volume: 0.6 },
      { id: 'magic_reveal', path: '/assets/sounds/magic_reveal.mp3', startTime: 500, volume: 0.8 },
      { id: 'shimmer_long', path: '/assets/sounds/shimmer_long.mp3', startTime: 800, volume: 0.5 },
    ],
    particleEffects: [
      { id: 'smoke', type: 'smoke', startTime: 0, duration: 1500, intensity: 0.8 },
      { id: 'sparkles', type: 'sparkle', startTime: 500, duration: 1700, intensity: 0.6 },
    ],
    previewPath: '/assets/animations/previews/sig_mystic.mp4',
    thumbnailPath: '/assets/animations/thumbs/sig_mystic.jpg',
  },
  {
    id: 'sig_anim_phoenix_rise',
    name: 'Phoenix Rise',
    description: 'Card rises from flames in a burst of fiery energy',
    rarity: 'epic',
    isDefault: false,
    unlockMethod: 'achievement',
    unlockRequirementId: 'ach_streak_30',
    duration: 2800,
    phases: [
      {
        name: 'flames_ignite',
        startTime: 0,
        duration: 600,
        cardTransform: {
          startX: 50, startY: 80, endX: 50, endY: 70,
          startRotation: 0, endRotation: -15,
          startScale: 0.5, endScale: 0.7,
          startOpacity: 0.3, endOpacity: 0.7,
        },
        easing: 'ease-in',
      },
      {
        name: 'rise_through_fire',
        startTime: 600,
        duration: 1000,
        cardTransform: {
          startX: 50, startY: 70, endX: 50, endY: 35,
          startRotation: -15, endRotation: 15,
          startScale: 0.7, endScale: 1.3,
          startOpacity: 0.7, endOpacity: 1,
        },
        easing: 'ease-out',
      },
      {
        name: 'burst',
        startTime: 1600,
        duration: 400,
        cardTransform: {
          startX: 50, startY: 35, endX: 50, endY: 45,
          startRotation: 15, endRotation: 0,
          startScale: 1.3, endScale: 1.5,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'ease-out',
      },
      {
        name: 'settle',
        startTime: 2000,
        duration: 800,
        cardTransform: {
          startX: 50, startY: 45, endX: 50, endY: 50,
          startRotation: 0, endRotation: 0,
          startScale: 1.5, endScale: 1.0,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'spring',
      },
    ],
    soundEffects: [
      { id: 'fire_ignite', path: '/assets/sounds/fire_ignite.mp3', startTime: 0, volume: 0.7 },
      { id: 'fire_roar', path: '/assets/sounds/fire_roar.mp3', startTime: 400, volume: 0.8 },
      { id: 'phoenix_cry', path: '/assets/sounds/phoenix_cry.mp3', startTime: 1600, volume: 0.6 },
      { id: 'shimmer_warm', path: '/assets/sounds/shimmer_warm.mp3', startTime: 2000, volume: 0.5 },
    ],
    particleEffects: [
      { id: 'flames', type: 'fire', startTime: 0, duration: 2000, intensity: 1.0 },
      { id: 'embers', type: 'sparkle', startTime: 1600, duration: 1200, intensity: 0.8 },
    ],
    previewPath: '/assets/animations/previews/sig_phoenix.mp4',
    thumbnailPath: '/assets/animations/thumbs/sig_phoenix.jpg',
  },

  // QUEST UNLOCKS
  {
    id: 'sig_anim_ocean_wave',
    name: 'Ocean Wave',
    description: 'Card surfaces from gentle waves, carried by the tide',
    rarity: 'rare',
    isDefault: false,
    unlockMethod: 'quest',
    unlockRequirementId: 'quest_cups_mastery',
    duration: 2500,
    phases: [
      {
        name: 'beneath_waves',
        startTime: 0,
        duration: 700,
        cardTransform: {
          startX: 30, startY: 80, endX: 40, endY: 60,
          startRotation: -20, endRotation: -10,
          startScale: 0.6, endScale: 0.9,
          startOpacity: 0.4, endOpacity: 0.8,
        },
        easing: 'ease-in-out',
      },
      {
        name: 'surface',
        startTime: 700,
        duration: 600,
        cardTransform: {
          startX: 40, startY: 60, endX: 50, endY: 45,
          startRotation: -10, endRotation: 5,
          startScale: 0.9, endScale: 1.1,
          startOpacity: 0.8, endOpacity: 1,
        },
        easing: 'ease-out',
      },
      {
        name: 'float_and_settle',
        startTime: 1300,
        duration: 1200,
        cardTransform: {
          startX: 50, startY: 45, endX: 50, endY: 50,
          startRotation: 5, endRotation: 0,
          startScale: 1.1, endScale: 1.0,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'spring',
      },
    ],
    soundEffects: [
      { id: 'underwater', path: '/assets/sounds/underwater.mp3', startTime: 0, volume: 0.5 },
      { id: 'wave_crash', path: '/assets/sounds/wave_crash.mp3', startTime: 600, volume: 0.7 },
      { id: 'water_drip', path: '/assets/sounds/water_drip.mp3', startTime: 1300, volume: 0.4 },
    ],
    particleEffects: [
      { id: 'water', type: 'water', startTime: 0, duration: 1500, intensity: 0.7 },
      { id: 'bubbles', type: 'sparkle', startTime: 0, duration: 800, intensity: 0.4 },
    ],
    previewPath: '/assets/animations/previews/sig_ocean.mp4',
    thumbnailPath: '/assets/animations/thumbs/sig_ocean.jpg',
  },

  // CONTEST/SEASONAL UNLOCKS
  {
    id: 'sig_anim_void_emergence',
    name: 'Void Emergence',
    description: 'Card tears through reality from the void between worlds',
    rarity: 'legendary',
    isDefault: false,
    unlockMethod: 'contest',
    unlockRequirementId: 'contest_halloween_2025',
    duration: 3200,
    phases: [
      {
        name: 'reality_crack',
        startTime: 0,
        duration: 800,
        cardTransform: {
          startX: 50, startY: 50, endX: 50, endY: 50,
          startRotation: 0, endRotation: 0,
          startScale: 0, endScale: 0.1,
          startOpacity: 0, endOpacity: 0.3,
        },
        easing: 'ease-in',
      },
      {
        name: 'tear_open',
        startTime: 800,
        duration: 600,
        cardTransform: {
          startX: 50, startY: 50, endX: 50, endY: 50,
          startRotation: 0, endRotation: 720,
          startScale: 0.1, endScale: 1.4,
          startOpacity: 0.3, endOpacity: 1,
        },
        easing: 'ease-out',
      },
      {
        name: 'stabilize',
        startTime: 1400,
        duration: 1000,
        cardTransform: {
          startX: 50, startY: 50, endX: 50, endY: 50,
          startRotation: 720, endRotation: 720,
          startScale: 1.4, endScale: 1.0,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'spring',
      },
      {
        name: 'void_close',
        startTime: 2400,
        duration: 800,
        cardTransform: {
          startX: 50, startY: 50, endX: 50, endY: 50,
          startRotation: 720, endRotation: 720,
          startScale: 1.0, endScale: 1.0,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'ease-out',
      },
    ],
    soundEffects: [
      { id: 'reality_tear', path: '/assets/sounds/reality_tear.mp3', startTime: 0, volume: 0.8 },
      { id: 'void_rumble', path: '/assets/sounds/void_rumble.mp3', startTime: 400, volume: 0.6 },
      { id: 'void_emerge', path: '/assets/sounds/void_emerge.mp3', startTime: 800, volume: 0.9 },
      { id: 'reality_seal', path: '/assets/sounds/reality_seal.mp3', startTime: 2400, volume: 0.7 },
    ],
    particleEffects: [
      { id: 'void', type: 'void', startTime: 0, duration: 2800, intensity: 1.0 },
      { id: 'stars', type: 'stars', startTime: 800, duration: 1600, intensity: 0.9 },
    ],
    previewPath: '/assets/animations/previews/sig_void.mp4',
    thumbnailPath: '/assets/animations/thumbs/sig_void.jpg',
  },

  // SEASONAL
  {
    id: 'sig_anim_winter_frost',
    name: 'Winter Frost',
    description: 'Card crystallizes from falling snowflakes',
    rarity: 'epic',
    isDefault: false,
    unlockMethod: 'seasonal',
    unlockRequirementId: 'seasonal_winter_2025',
    duration: 2600,
    phases: [
      {
        name: 'snowfall',
        startTime: 0,
        duration: 800,
        cardTransform: {
          startX: 50, startY: 10, endX: 50, endY: 30,
          startRotation: 15, endRotation: 5,
          startScale: 0.3, endScale: 0.7,
          startOpacity: 0.5, endOpacity: 0.8,
        },
        easing: 'ease-in',
      },
      {
        name: 'crystallize',
        startTime: 800,
        duration: 1000,
        cardTransform: {
          startX: 50, startY: 30, endX: 50, endY: 50,
          startRotation: 5, endRotation: 0,
          startScale: 0.7, endScale: 1.2,
          startOpacity: 0.8, endOpacity: 1,
        },
        easing: 'ease-out',
      },
      {
        name: 'settle_frost',
        startTime: 1800,
        duration: 800,
        cardTransform: {
          startX: 50, startY: 50, endX: 50, endY: 50,
          startRotation: 0, endRotation: 0,
          startScale: 1.2, endScale: 1.0,
          startOpacity: 1, endOpacity: 1,
        },
        easing: 'spring',
      },
    ],
    soundEffects: [
      { id: 'wind_cold', path: '/assets/sounds/wind_cold.mp3', startTime: 0, volume: 0.5 },
      { id: 'ice_form', path: '/assets/sounds/ice_form.mp3', startTime: 800, volume: 0.7 },
      { id: 'crystal_chime', path: '/assets/sounds/crystal_chime.mp3', startTime: 1800, volume: 0.6 },
    ],
    particleEffects: [
      { id: 'snow', type: 'sparkle', startTime: 0, duration: 2000, intensity: 0.8 },
    ],
    previewPath: '/assets/animations/previews/sig_winter.mp4',
    thumbnailPath: '/assets/animations/thumbs/sig_winter.jpg',
  },
];

// =============================================================================
// DECK WITH SIGNIFICATOR EXCLUSION
// =============================================================================

export interface ReadingDeck {
  allCards: TarotCard[];
  significatorId: string | null;
  availableCards: TarotCard[]; // Deck minus significator
}

export function createReadingDeck(significatorId?: string): ReadingDeck {
  const allCards = [...FULL_DECK];

  if (!significatorId) {
    return {
      allCards,
      significatorId: null,
      availableCards: allCards,
    };
  }

  // Remove significator from available pool
  const availableCards = allCards.filter(c => c.id !== significatorId);

  return {
    allCards,
    significatorId,
    availableCards, // 77 cards (or 78 if no significator)
  };
}

export function getSignificatorCard(deck: ReadingDeck): TarotCard | null {
  if (!deck.significatorId) return null;
  return deck.allCards.find(c => c.id === deck.significatorId) || null;
}

export function drawCards(deck: ReadingDeck, count: number): TarotCard[] {
  if (count > deck.availableCards.length) {
    throw new Error(`Cannot draw ${count} cards from deck with ${deck.availableCards.length} available`);
  }

  // Shuffle and draw
  const shuffled = [...deck.availableCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// =============================================================================
// ANIMATION REWARD PIPELINE
// =============================================================================

export interface AnimationUnlockEvent {
  animationId: string;
  unlockMethod: SignificatorAnimation['unlockMethod'];
  requirementId: string;
  unlockedAt: Date;
  userId: string;
}

export interface AnimationRewardDefinition {
  animationId: string;
  rewardType: 'achievement' | 'quest' | 'contest' | 'seasonal' | 'purchase';
  requirementId: string;
  description: string;
}

export const ANIMATION_REWARDS: AnimationRewardDefinition[] = [
  {
    animationId: 'sig_anim_mystic_reveal',
    rewardType: 'achievement',
    requirementId: 'ach_first_celtic_cross',
    description: 'Complete your first Celtic Cross reading',
  },
  {
    animationId: 'sig_anim_phoenix_rise',
    rewardType: 'achievement',
    requirementId: 'ach_streak_30',
    description: 'Maintain a 30-day reading streak',
  },
  {
    animationId: 'sig_anim_ocean_wave',
    rewardType: 'quest',
    requirementId: 'quest_cups_mastery',
    description: 'Complete the Cups Mastery quest chain',
  },
  {
    animationId: 'sig_anim_void_emergence',
    rewardType: 'contest',
    requirementId: 'contest_halloween_2025',
    description: 'Participate in Halloween 2025 community event',
  },
  {
    animationId: 'sig_anim_winter_frost',
    rewardType: 'seasonal',
    requirementId: 'seasonal_winter_2025',
    description: 'Log in during Winter Solstice 2025 event',
  },
];

// =============================================================================
// USER ANIMATION PREFERENCES
// =============================================================================

export interface UserAnimationPreferences {
  userId: string;
  selectedSignificatorAnimationId: string;
  unlockedAnimationIds: string[];
  previewedAnimationIds: string[];
  favoriteAnimationIds: string[];
}

export function getAvailableAnimations(
  allAnimations: SignificatorAnimation[],
  unlockedIds: string[]
): SignificatorAnimation[] {
  return allAnimations.filter(
    anim => anim.isDefault || unlockedIds.includes(anim.id)
  );
}

export function canUnlockAnimation(
  animation: SignificatorAnimation,
  userAchievements: string[],
  userQuests: string[],
  userContests: string[],
  userSeasonals: string[]
): boolean {
  if (animation.isDefault) return true;
  if (!animation.unlockRequirementId) return false;

  switch (animation.unlockMethod) {
    case 'achievement':
      return userAchievements.includes(animation.unlockRequirementId);
    case 'quest':
      return userQuests.includes(animation.unlockRequirementId);
    case 'contest':
      return userContests.includes(animation.unlockRequirementId);
    case 'seasonal':
      return userSeasonals.includes(animation.unlockRequirementId);
    case 'purchase':
      return false; // Handled separately
    default:
      return false;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  FULL_DECK,
  MAJOR_ARCANA,
  SIGNIFICATOR_ANIMATIONS,
  ANIMATION_REWARDS,
  searchCardsLocally,
  buildSignificatorPrompt,
  createReadingDeck,
  getSignificatorCard,
  drawCards,
  getAvailableAnimations,
  canUnlockAnimation,
};
