/**
 * READING INTERPRETATION - PRODUCTION
 * Real Claude API integration, no stubs
 */

import { generateReading } from '../services/anthropic';

/**
 * Generate tarot reading interpretation using Claude API
 * @param {Array} cards - Array of {cardIndex, reversed, position}
 * @param {string} spreadType - Type of spread
 * @param {string} intention - User's intention
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} - Full reading interpretation
 */
export async function interpretReading(cards, spreadType, intention, context) {
  try {
    console.log('[interpretReading] Calling Claude API...');
    const reading = await generateReading(cards, spreadType, intention, context);
    console.log('[interpretReading] Success');
    return reading;
  } catch (error) {
    console.error('[interpretReading] Claude API failed:', error);
    throw error; // Let caller handle error
  }
}

export default interpretReading;
