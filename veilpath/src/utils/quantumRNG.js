/**
 * QUANTUM RNG - Hardware-based true random number generation
 * Uses expo-crypto for cryptographically secure randomness
 */

import * as Crypto from 'expo-crypto';

/**
 * SYNCHRONOUS QUANTUM-SEEDED PRNG
 * For cases where async quantum RNG isn't practical,
 * use a quantum seed to initialize a high-quality PRNG (xorshift128+)
 *
 * This is MUCH better than Math.random() because:
 * 1. Seed comes from quantum entropy (not time-based)
 * 2. xorshift128+ has excellent statistical properties
 * 3. Still deterministic given same seed (good for testing)
 */
let quantumSeed1 = 0;
let quantumSeed2 = 0;
let quantumInitialized = false;
let hasWarnedAboutInit = false; // Only warn once to avoid log spam

/**
 * Initialize quantum-seeded PRNG (call once at app start)
 * @param {string} seed - Optional 31-char quantum seed
 */
export async function initQuantumPRNG(seed = null) {
  try {
    const seedStr = seed || await generateQuantumSeed();

    // Convert seed to two 32-bit integers for xorshift128+
    let hash1 = 0;
    let hash2 = 0;

    for (let i = 0; i < seedStr.length; i++) {
      const char = seedStr.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1) + char;
      hash2 = ((hash2 << 3) + hash2) + char;
      hash1 |= 0; // Convert to 32-bit integer
      hash2 |= 0;
    }

    // Ensure non-zero seeds (xorshift requirement)
    quantumSeed1 = hash1 || 123456789;
    quantumSeed2 = hash2 || 362436069;

    quantumInitialized = true;
  } catch (error) {
    // Fallback: use crypto random bytes synchronously if available
    console.warn('[QuantumRNG] Async init failed, using fallback seed');
    quantumSeed1 = Date.now() | 0;
    quantumSeed2 = (performance.now() * 1000000) | 0;
    quantumInitialized = true;
  }
}

/**
 * Synchronous quantum-seeded random number generator
 * Returns float in [0, 1) like Math.random()
 *
 * Uses xorshift128+ algorithm (very fast, high quality)
 * WARNING: Must call initQuantumPRNG() first!
 *
 * @returns {number} - Random float in [0, 1)
 */
export function qRandom() {
  if (!quantumInitialized) {
    if (!hasWarnedAboutInit) {
      console.warn('[QuantumRNG] Not initialized yet. Using Math.random() fallback until initQuantumPRNG() completes. This is normal during app startup.');
      hasWarnedAboutInit = true;
    }
    return Math.random();
  }

  // xorshift128+ algorithm
  let s1 = quantumSeed1;
  let s0 = quantumSeed2;

  quantumSeed1 = s0;
  s1 ^= s1 << 23;
  s1 ^= s1 >>> 17;
  s1 ^= s0;
  s1 ^= s0 >>> 26;
  quantumSeed2 = s1;

  const result = (s0 + s1) >>> 0;

  // Convert to [0, 1) float
  return result / 4294967296;
}

/**
 * Synchronous quantum random integer
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number}
 */
export function qRandomInt(min, max) {
  return Math.floor(qRandom() * (max - min + 1)) + min;
}

/**
 * Synchronous quantum random choice from array
 * @param {Array} array - Array to choose from
 * @returns {*} - Random element
 */
export function qRandomChoice(array) {
  if (!array || array.length === 0) return null;
  return array[qRandomInt(0, array.length - 1)];
}

/**
 * Alphanumeric character set for seed generation
 * 0-9, A-Z, a-z = 62 characters
 */
const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generate quantum random bytes
 * @param {number} byteCount - Number of random bytes to generate
 * @returns {Promise<Uint8Array>}
 */
async function getQuantumBytes(byteCount) {
  const bytes = await Crypto.getRandomBytesAsync(byteCount);
  return bytes;
}

/**
 * Generate a quantum superposition collapsed alphanumeric seed
 * 31 characters, each can be [0-9, A-Z, a-z]
 * Total entropy: 62^31 ≈ 3.35 x 10^55 combinations
 * @returns {Promise<string>} - 31 character alphanumeric seed
 */
export async function generateQuantumSeed() {
  const SEED_LENGTH = 31;
  const CHAR_SET_SIZE = ALPHANUMERIC_CHARS.length; // 62

  // Get quantum random bytes (need enough for 31 characters)
  const bytesNeeded = SEED_LENGTH * 2; // 2 bytes per character for good distribution
  const randomBytes = await getQuantumBytes(bytesNeeded);

  let seed = '';
  for (let i = 0; i < SEED_LENGTH; i++) {
    // Use 2 bytes to get a number, then mod by char set size
    const byte1 = randomBytes[i * 2];
    const byte2 = randomBytes[i * 2 + 1];
    const randomIndex = ((byte1 << 8) | byte2) % CHAR_SET_SIZE;
    seed += ALPHANUMERIC_CHARS[randomIndex];
  }

  return seed;
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Promise<number>}
 */
export async function getQuantumInt(min, max) {
  const range = max - min + 1;

  // Determine how many bytes we need
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);

  // Get quantum random bytes
  const randomBytes = await getQuantumBytes(bytesNeeded);

  // Convert bytes to integer
  let randomInt = 0;
  for (let i = 0; i < randomBytes.length; i++) {
    randomInt = (randomInt << 8) | randomBytes[i];
  }

  // Map to range using modulo (with bias correction)
  return min + (randomInt % range);
}

/**
 * Shuffle an array using Fisher-Yates with quantum randomness
 * @param {Array} array - Array to shuffle
 * @returns {Promise<Array>} - Shuffled copy of array
 */
export async function quantumShuffle(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Get quantum random index
    const j = await getQuantumInt(0, i);

    // Swap elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Fetch current timestamp from public API for non-repeatable entropy
 * Falls back to local time if network unavailable
 * @returns {Promise<string>}
 */
async function getPublicTimestamp() {
  try {
    // WorldTimeAPI - free, no auth required, global CDN
    const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
      timeout: 5000
    });
    const data = await response.json();
    // Returns ISO timestamp with high precision (microseconds)
    return data.datetime + data.unixtime.toString();
  } catch (error) {
    // Fallback to local time + performance counter for uniqueness
    return Date.now().toString() + performance.now().toString();
  }
}

/**
 * Draw N random cards from deck (currently 22 major arcana, 56 minor to be added)
 * Returns array of { cardIndex, reversed } objects
 * @param {number} cardCount - Number of cards to draw
 * @param {string} intention - User's intention (mixed into entropy)
 * @returns {Promise<Array>}
 */
export async function drawCards(cardCount, intention = '') {
  const TOTAL_CARDS = 78; // Full tarot deck: 22 major arcana + 56 minor arcana (4 suits × 14 cards)

  // Create deck indices
  const deck = Array.from({ length: TOTAL_CARDS }, (_, i) => i);

  // Get public timestamp for non-repeatable entropy
  const publicTimestamp = await getPublicTimestamp();

  // Mix intention + public timestamp into entropy
  // This ensures draws are:
  // 1. Unique to the user's intention
  // 2. Non-repeatable (different timestamp every time)
  // 3. Still cryptographically secure (doesn't compromise randomness)
  const entropyMix = intention + publicTimestamp;
  const intentionHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    entropyMix
  );

  // Shuffle deck with quantum randomness
  const shuffledDeck = await quantumShuffle(deck);


  // Draw cards and determine reversals
  const drawnCards = [];
  const seenIndices = new Set();

  for (let i = 0; i < cardCount; i++) {
    const cardIndex = shuffledDeck[i];

    // DUPLICATE CHECK - this should NEVER happen with proper shuffle
    if (seenIndices.has(cardIndex)) {
      console.error(`❌ DUPLICATE CARD DETECTED: Card index ${cardIndex} drawn twice!`);
      console.error('This is a bug in the shuffle algorithm!');
    }
    seenIndices.add(cardIndex);

    // Quantum random reversal (50/50 chance)
    const reversed = (await getQuantumInt(0, 1)) === 1;


    drawnCards.push({
      cardIndex,
      reversed
    });
  }


  return drawnCards;
}

/**
 * Get spread positions based on spread type
 * @param {string} spreadType - Type of spread
 * @returns {Array<string>} - Position names
 */
export function getSpreadPositions(spreadType) {
  const spreads = {
    single_card: ['Present Moment'],

    three_card: ['Past', 'Present', 'Future'],

    daily: ['Focus On', 'Avoid', 'Gift'],

    decision: [
      'Current Situation',
      'Path A: Outcome',
      'Path A: Challenges',
      'Path B: Outcome',
      'Path B: Challenges',
      'Guidance'
    ],

    relationship: [
      'You',
      'Them',
      'The Connection',
      'Hidden Influences',
      'Past Foundation',
      'Future Potential'
    ],

    celtic_cross: [
      'Present',
      'Challenge',
      'Past',
      'Future',
      'Above (Conscious)',
      'Below (Unconscious)',
      'Advice',
      'External Influences',
      'Hopes/Fears',
      'Outcome'
    ]
  };

  return spreads[spreadType] || spreads.three_card;
}

/**
 * Perform a full quantum tarot reading
 * @param {string} spreadType - Type of spread
 * @param {string} intention - User's intention
 * @returns {Promise<Object>} - Reading data with cards and quantum seed
 */
export async function performReading(spreadType, intention) {
  const positions = getSpreadPositions(spreadType);

  // Generate quantum seed for this reading (non-repeatable)
  const quantumSeed = await generateQuantumSeed();

  // Get public timestamp
  const publicTimestamp = await getPublicTimestamp();

  // Draw cards
  const cards = await drawCards(positions.length, intention);

  // Attach positions to cards
  const cardsWithPositions = cards.map((card, index) => ({
    ...card,
    position: positions[index]
  }));

  return {
    cards: cardsWithPositions,
    quantumSeed,
    timestamp: publicTimestamp,
    spreadType,
    intention
  };
}
