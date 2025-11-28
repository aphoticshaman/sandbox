/**
 * CLIENT-SIDE HEURISTIC CARD SEARCH
 *
 * Fast, free, safe significator search using:
 * - Pre-built inverted index
 * - Fuzzy matching with Levenshtein distance
 * - TF-IDF scoring for relevance
 * - Synonym expansion
 * - Phonetic matching (Soundex)
 * - Guardian input validation
 *
 * All runs client-side - no API calls, no cost, instant results.
 */

import { TarotCard, FULL_DECK, Suit } from './significatorSystem';

// =============================================================================
// SEARCH INDEX TYPES
// =============================================================================

export interface SearchIndex {
  // Inverted index: term -> card IDs with positions
  termIndex: Map<string, TermEntry[]>;

  // Document frequency: term -> number of cards containing it
  documentFrequency: Map<string, number>;

  // Card lookup
  cardById: Map<string, TarotCard>;

  // Synonym mapping
  synonyms: Map<string, string[]>;

  // Soundex index for phonetic matching
  soundexIndex: Map<string, string[]>; // soundex code -> card IDs

  // Total cards in index
  totalDocuments: number;
}

export interface TermEntry {
  cardId: string;
  field: SearchField;
  position: number;
  boost: number; // Field-specific importance boost
}

export type SearchField =
  | 'name'
  | 'keywords'
  | 'themes'
  | 'archetypes'
  | 'elements'
  | 'zodiac'
  | 'planets'
  | 'uprightMeaning'
  | 'reversedMeaning'
  | 'persona';

// Field boosts - name matches are most important
const FIELD_BOOSTS: Record<SearchField, number> = {
  name: 10.0,
  keywords: 5.0,
  archetypes: 4.0,
  themes: 3.0,
  elements: 2.5,
  zodiac: 2.5,
  planets: 2.0,
  persona: 1.5,
  uprightMeaning: 1.0,
  reversedMeaning: 0.8,
};

// =============================================================================
// GUARDIAN INPUT VALIDATION
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  warnings: string[];
  blocked: boolean;
  blockReason?: string;
}

// Patterns that should be blocked (injection attempts, etc.)
const BLOCKED_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onerror=, etc.
  /data:/i,
  /vbscript:/i,
  /expression\s*\(/i,
  /url\s*\(/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /\{\{.*\}\}/,  // Template injection
  /\$\{.*\}/,    // Template literal injection
  /__proto__/i,
  /constructor\s*\[/i,
];

// Suspicious but not blocked (log for analysis)
const WARNING_PATTERNS = [
  /[<>]/,
  /['"]/,
  /[\\/]/,
  /[\x00-\x1f]/,  // Control characters
];

// Max query length
const MAX_QUERY_LENGTH = 200;

export function validateSearchInput(input: string): ValidationResult {
  const warnings: string[] = [];

  // Null/undefined check
  if (input == null) {
    return {
      isValid: false,
      sanitized: '',
      warnings: ['Empty input'],
      blocked: false,
    };
  }

  // Length check
  if (input.length > MAX_QUERY_LENGTH) {
    return {
      isValid: false,
      sanitized: input.slice(0, MAX_QUERY_LENGTH),
      warnings: [`Input truncated to ${MAX_QUERY_LENGTH} characters`],
      blocked: false,
    };
  }

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        sanitized: '',
        warnings: [],
        blocked: true,
        blockReason: 'Input contains disallowed patterns',
      };
    }
  }

  // Check warning patterns
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(input)) {
      warnings.push('Input contains potentially unsafe characters');
      break;
    }
  }

  // Sanitize: remove control characters, normalize whitespace
  let sanitized = input
    .replace(/[\x00-\x1f\x7f]/g, '') // Remove control chars
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim()
    .toLowerCase();

  // Remove any HTML entities
  sanitized = sanitized
    .replace(/&[#\w]+;/g, '')
    .replace(/[<>]/g, '');

  return {
    isValid: sanitized.length > 0,
    sanitized,
    warnings,
    blocked: false,
  };
}

// =============================================================================
// TEXT PROCESSING
// =============================================================================

// Stop words to ignore in indexing/searching
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'what', 'which', 'who', 'whom', 'when', 'where', 'why',
  'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'also',
]);

// Synonyms for tarot-specific terms
const SYNONYMS: Record<string, string[]> = {
  // Numbers
  'one': ['1', 'ace', 'first', 'beginning'],
  'two': ['2', 'second', 'pair', 'duality'],
  'three': ['3', 'third', 'trinity', 'triad'],
  'four': ['4', 'fourth', 'stability', 'foundation'],
  'five': ['5', 'fifth', 'challenge', 'change'],
  'six': ['6', 'sixth', 'harmony', 'balance'],
  'seven': ['7', 'seventh', 'reflection', 'assessment'],
  'eight': ['8', 'eighth', 'movement', 'power'],
  'nine': ['9', 'ninth', 'culmination', 'completion'],
  'ten': ['10', 'tenth', 'ending', 'cycle'],

  // Court cards
  'page': ['student', 'messenger', 'youth', 'beginner', 'child'],
  'knight': ['warrior', 'action', 'pursuit', 'seeker', 'adventurer'],
  'queen': ['mother', 'feminine', 'nurturing', 'inward', 'receptive'],
  'king': ['father', 'masculine', 'authority', 'outward', 'active'],

  // Suits
  'wands': ['fire', 'passion', 'creativity', 'energy', 'will', 'rods', 'staves'],
  'cups': ['water', 'emotions', 'feelings', 'love', 'heart', 'chalices'],
  'swords': ['air', 'mind', 'intellect', 'thought', 'conflict', 'truth'],
  'pentacles': ['earth', 'material', 'money', 'work', 'body', 'coins', 'disks'],

  // Elements
  'fire': ['passion', 'energy', 'will', 'action', 'spirit'],
  'water': ['emotion', 'feeling', 'intuition', 'heart', 'soul'],
  'air': ['mind', 'thought', 'intellect', 'communication', 'logic'],
  'earth': ['material', 'physical', 'body', 'money', 'practical'],

  // Common concepts
  'love': ['romance', 'relationship', 'heart', 'passion', 'connection'],
  'money': ['wealth', 'finance', 'prosperity', 'abundance', 'riches'],
  'career': ['work', 'job', 'profession', 'business', 'vocation'],
  'death': ['transformation', 'change', 'ending', 'transition', 'rebirth'],
  'strength': ['courage', 'power', 'fortitude', 'resilience', 'bravery'],
  'justice': ['fairness', 'truth', 'law', 'balance', 'karma'],
  'fool': ['beginner', 'innocent', 'new', 'journey', 'leap'],
  'magician': ['manifestation', 'power', 'skill', 'will', 'creation'],
  'priestess': ['intuition', 'mystery', 'wisdom', 'secrets', 'subconscious'],
  'empress': ['fertility', 'abundance', 'nature', 'mother', 'nurturing'],
  'emperor': ['authority', 'structure', 'father', 'control', 'leadership'],
  'hierophant': ['tradition', 'religion', 'teacher', 'conformity', 'beliefs'],
  'lovers': ['choice', 'partnership', 'union', 'harmony', 'values'],
  'chariot': ['victory', 'willpower', 'determination', 'control', 'success'],
  'hermit': ['solitude', 'wisdom', 'introspection', 'guidance', 'seeking'],
  'wheel': ['fate', 'destiny', 'cycles', 'change', 'fortune', 'luck'],
  'hanged': ['sacrifice', 'surrender', 'waiting', 'perspective', 'pause'],
  'temperance': ['balance', 'moderation', 'patience', 'harmony', 'healing'],
  'devil': ['shadow', 'addiction', 'bondage', 'materialism', 'temptation'],
  'tower': ['upheaval', 'chaos', 'revelation', 'destruction', 'awakening'],
  'star': ['hope', 'inspiration', 'faith', 'renewal', 'serenity'],
  'moon': ['illusion', 'fear', 'subconscious', 'dreams', 'intuition'],
  'sun': ['joy', 'success', 'vitality', 'positivity', 'happiness'],
  'judgement': ['rebirth', 'calling', 'awakening', 'reckoning', 'absolution'],
  'world': ['completion', 'achievement', 'wholeness', 'fulfillment', 'travel'],
};

/**
 * Tokenize and normalize text
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove punctuation
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Stem a word (simple suffix stripping)
 */
export function stem(word: string): string {
  // Simple Porter-like stemming
  return word
    .replace(/ies$/, 'y')
    .replace(/es$/, '')
    .replace(/s$/, '')
    .replace(/ing$/, '')
    .replace(/ed$/, '')
    .replace(/ly$/, '')
    .replace(/ness$/, '')
    .replace(/ment$/, '')
    .replace(/tion$/, 't')
    .replace(/sion$/, 's');
}

/**
 * Generate Soundex code for phonetic matching
 */
export function soundex(word: string): string {
  if (!word) return '';

  const a = word.toLowerCase().split('');
  const firstLetter = a[0];

  const codes: Record<string, string> = {
    a: '', e: '', i: '', o: '', u: '', h: '', w: '', y: '',
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  };

  const coded = a
    .map(char => codes[char] || '')
    .join('')
    .replace(/(.)\1+/g, '$1'); // Remove consecutive duplicates

  return (firstLetter + coded.slice(1) + '000').slice(0, 4).toUpperCase();
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// =============================================================================
// INDEX BUILDING
// =============================================================================

/**
 * Build the complete search index from the card deck
 */
export function buildSearchIndex(cards: TarotCard[] = FULL_DECK): SearchIndex {
  const termIndex = new Map<string, TermEntry[]>();
  const documentFrequency = new Map<string, number>();
  const cardById = new Map<string, TarotCard>();
  const soundexIndex = new Map<string, string[]>();
  const synonymMap = new Map<string, string[]>();

  // Build synonym map
  for (const [term, syns] of Object.entries(SYNONYMS)) {
    synonymMap.set(term, syns);
    // Also map synonyms back to the main term
    for (const syn of syns) {
      const existing = synonymMap.get(syn) || [];
      if (!existing.includes(term)) {
        synonymMap.set(syn, [...existing, term]);
      }
    }
  }

  // Index each card
  for (const card of cards) {
    cardById.set(card.id, card);

    const fieldsToIndex: Array<{ field: SearchField; text: string | string[] }> = [
      { field: 'name', text: card.name },
      { field: 'keywords', text: card.keywords },
      { field: 'themes', text: card.themes },
      { field: 'archetypes', text: card.archetypes },
      { field: 'elements', text: card.elements },
      { field: 'zodiac', text: card.zodiacSigns },
      { field: 'planets', text: card.planetaryRulers },
      { field: 'uprightMeaning', text: card.uprightMeaning },
      { field: 'reversedMeaning', text: card.reversedMeaning },
      { field: 'persona', text: card.personaDescription },
    ];

    const termsInCard = new Set<string>();

    for (const { field, text } of fieldsToIndex) {
      const textArray = Array.isArray(text) ? text : [text];
      let position = 0;

      for (const t of textArray) {
        const tokens = tokenize(t);

        for (const token of tokens) {
          const stemmed = stem(token);

          // Add to term index
          const entries = termIndex.get(stemmed) || [];
          entries.push({
            cardId: card.id,
            field,
            position: position++,
            boost: FIELD_BOOSTS[field],
          });
          termIndex.set(stemmed, entries);

          termsInCard.add(stemmed);

          // Add to soundex index
          const code = soundex(token);
          const soundexCards = soundexIndex.get(code) || [];
          if (!soundexCards.includes(card.id)) {
            soundexCards.push(card.id);
            soundexIndex.set(code, soundexCards);
          }
        }
      }
    }

    // Update document frequency
    for (const term of termsInCard) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }

  return {
    termIndex,
    documentFrequency,
    cardById,
    synonyms: synonymMap,
    soundexIndex,
    totalDocuments: cards.length,
  };
}

// Pre-built index (initialized on module load)
let _searchIndex: SearchIndex | null = null;

export function getSearchIndex(): SearchIndex {
  if (!_searchIndex) {
    _searchIndex = buildSearchIndex();
  }
  return _searchIndex;
}

// =============================================================================
// SEARCH EXECUTION
// =============================================================================

export interface SearchResult {
  cardId: string;
  card: TarotCard;
  score: number;
  matchedTerms: string[];
  matchedFields: SearchField[];
  highlights: Record<string, string[]>;
}

export interface SearchOptions {
  limit?: number;
  fuzzyThreshold?: number; // Max Levenshtein distance (0 = exact only)
  expandSynonyms?: boolean;
  usePhonetic?: boolean;
  boostExactMatch?: number;
  filterBySuit?: Suit;
  filterByType?: 'major' | 'minor' | 'court' | 'pip';
}

const DEFAULT_OPTIONS: SearchOptions = {
  limit: 10,
  fuzzyThreshold: 2,
  expandSynonyms: true,
  usePhonetic: true,
  boostExactMatch: 2.0,
};

/**
 * Search cards with TF-IDF scoring and fuzzy matching
 */
export function searchCards(
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const index = getSearchIndex();

  // Validate input
  const validation = validateSearchInput(query);
  if (!validation.isValid || validation.blocked) {
    return [];
  }

  const queryTerms = tokenize(validation.sanitized).map(stem);
  if (queryTerms.length === 0) {
    return [];
  }

  // Expand query with synonyms
  let expandedTerms = [...queryTerms];
  if (opts.expandSynonyms) {
    for (const term of queryTerms) {
      const syns = index.synonyms.get(term) || [];
      expandedTerms.push(...syns.map(stem));
    }
  }
  expandedTerms = [...new Set(expandedTerms)]; // Dedupe

  // Find matching cards
  const cardScores = new Map<string, {
    score: number;
    matchedTerms: Set<string>;
    matchedFields: Set<SearchField>;
    highlights: Map<string, Set<string>>;
  }>();

  for (const queryTerm of expandedTerms) {
    // Exact matches
    const exactEntries = index.termIndex.get(queryTerm) || [];
    for (const entry of exactEntries) {
      updateCardScore(cardScores, entry, queryTerm, index, opts.boostExactMatch || 1);
    }

    // Fuzzy matches
    if (opts.fuzzyThreshold && opts.fuzzyThreshold > 0) {
      for (const [indexTerm, entries] of index.termIndex) {
        if (indexTerm === queryTerm) continue; // Already handled
        const distance = levenshteinDistance(queryTerm, indexTerm);
        if (distance <= opts.fuzzyThreshold) {
          const fuzzyBoost = 1 - (distance / (opts.fuzzyThreshold + 1));
          for (const entry of entries) {
            updateCardScore(cardScores, entry, indexTerm, index, fuzzyBoost);
          }
        }
      }
    }

    // Phonetic matches
    if (opts.usePhonetic) {
      const queryCode = soundex(queryTerm);
      const phoneticCards = index.soundexIndex.get(queryCode) || [];
      for (const cardId of phoneticCards) {
        if (!cardScores.has(cardId)) {
          const card = index.cardById.get(cardId);
          if (card) {
            cardScores.set(cardId, {
              score: 0.5, // Low base score for phonetic-only matches
              matchedTerms: new Set([queryTerm]),
              matchedFields: new Set(['name'] as SearchField[]),
              highlights: new Map(),
            });
          }
        }
      }
    }
  }

  // Convert to results and apply filters
  let results: SearchResult[] = [];

  for (const [cardId, data] of cardScores) {
    const card = index.cardById.get(cardId);
    if (!card) continue;

    // Apply filters
    if (opts.filterBySuit && card.suit !== opts.filterBySuit) continue;
    if (opts.filterByType) {
      const isMajor = card.suit === 'major';
      const isCourt = card.number >= 11 && card.number <= 14;
      const isPip = !isMajor && !isCourt;

      if (opts.filterByType === 'major' && !isMajor) continue;
      if (opts.filterByType === 'minor' && isMajor) continue;
      if (opts.filterByType === 'court' && !isCourt) continue;
      if (opts.filterByType === 'pip' && !isPip) continue;
    }

    // Convert highlights map
    const highlights: Record<string, string[]> = {};
    for (const [field, terms] of data.highlights) {
      highlights[field] = [...terms];
    }

    results.push({
      cardId,
      card,
      score: data.score,
      matchedTerms: [...data.matchedTerms],
      matchedFields: [...data.matchedFields],
      highlights,
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Limit results
  if (opts.limit) {
    results = results.slice(0, opts.limit);
  }

  return results;
}

function updateCardScore(
  cardScores: Map<string, {
    score: number;
    matchedTerms: Set<string>;
    matchedFields: Set<SearchField>;
    highlights: Map<string, Set<string>>;
  }>,
  entry: TermEntry,
  term: string,
  index: SearchIndex,
  boost: number
): void {
  // Calculate TF-IDF score
  const tf = 1; // Simplified: presence = 1
  const df = index.documentFrequency.get(term) || 1;
  const idf = Math.log(index.totalDocuments / df);
  const tfidf = tf * idf * entry.boost * boost;

  const existing = cardScores.get(entry.cardId);
  if (existing) {
    existing.score += tfidf;
    existing.matchedTerms.add(term);
    existing.matchedFields.add(entry.field);

    const fieldHighlights = existing.highlights.get(entry.field) || new Set();
    fieldHighlights.add(term);
    existing.highlights.set(entry.field, fieldHighlights);
  } else {
    const highlights = new Map<string, Set<string>>();
    highlights.set(entry.field, new Set([term]));

    cardScores.set(entry.cardId, {
      score: tfidf,
      matchedTerms: new Set([term]),
      matchedFields: new Set([entry.field]),
      highlights,
    });
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick search for autocomplete dropdown
 */
export function quickSearch(query: string, limit: number = 5): SearchResult[] {
  return searchCards(query, {
    limit,
    fuzzyThreshold: 1,
    expandSynonyms: true,
    usePhonetic: false,
  });
}

/**
 * Search by card number
 */
export function searchByNumber(num: number): TarotCard[] {
  return FULL_DECK.filter(card => card.number === num);
}

/**
 * Search by suit
 */
export function searchBySuit(suit: Suit): TarotCard[] {
  return FULL_DECK.filter(card => card.suit === suit);
}

/**
 * Get card by exact ID
 */
export function getCardById(id: string): TarotCard | undefined {
  return FULL_DECK.find(card => card.id === id);
}

/**
 * Get card by exact name (case-insensitive)
 */
export function getCardByName(name: string): TarotCard | undefined {
  const lower = name.toLowerCase().trim();
  return FULL_DECK.find(card => card.name.toLowerCase() === lower);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  buildSearchIndex,
  getSearchIndex,
  searchCards,
  quickSearch,
  searchByNumber,
  searchBySuit,
  getCardById,
  getCardByName,
  validateSearchInput,
  tokenize,
  stem,
  soundex,
  levenshteinDistance,
};
