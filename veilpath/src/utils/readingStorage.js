/**
 * READING STORAGE UTILITY
 * Save and load in-progress readings (premium feature)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const IN_PROGRESS_READINGS_KEY = '@veilpath_in_progress_readings';

/**
 * Save an in-progress reading
 * @param {Object} readingData - Complete reading state
 * @returns {Promise<string>} readingId
 */
export async function saveInProgressReading(readingData) {
  try {
    const readingId = `reading_${Date.now()}`;

    const savedReading = {
      id: readingId,
      ...readingData,
      savedAt: Date.now(),
      status: 'in_progress'
    };

    // Get existing in-progress readings
    const existing = await AsyncStorage.getItem(IN_PROGRESS_READINGS_KEY);
    const readings = existing ? JSON.parse(existing) : [];

    // Add new reading
    readings.push(savedReading);

    // Save back to storage
    await AsyncStorage.setItem(IN_PROGRESS_READINGS_KEY, JSON.stringify(readings));

    return readingId;
  } catch (error) {
    console.error('[ReadingStorage] Error saving reading:', error);
    throw error;
  }
}

/**
 * Get all in-progress readings
 * @returns {Promise<Array>} Array of saved readings
 */
export async function getInProgressReadings() {
  try {
    const data = await AsyncStorage.getItem(IN_PROGRESS_READINGS_KEY);
    const readings = data ? JSON.parse(data) : [];

    // Sort by most recent first
    readings.sort((a, b) => b.savedAt - a.savedAt);

    return readings;
  } catch (error) {
    console.error('[ReadingStorage] Error loading readings:', error);
    return [];
  }
}

/**
 * Delete an in-progress reading
 * @param {string} readingId - ID of reading to delete
 */
export async function deleteInProgressReading(readingId) {
  try {
    const existing = await AsyncStorage.getItem(IN_PROGRESS_READINGS_KEY);
    if (!existing) return;

    const readings = JSON.parse(existing);
    const filtered = readings.filter(r => r.id !== readingId);

    await AsyncStorage.setItem(IN_PROGRESS_READINGS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[ReadingStorage] Error deleting reading:', error);
    throw error;
  }
}

/**
 * Get a specific in-progress reading
 * @param {string} readingId - ID of reading to retrieve
 * @returns {Promise<Object|null>} Reading data or null
 */
export async function getInProgressReading(readingId) {
  try {
    const readings = await getInProgressReadings();
    return readings.find(r => r.id === readingId) || null;
  } catch (error) {
    console.error('[ReadingStorage] Error getting reading:', error);
    return null;
  }
}

/**
 * Clear all in-progress readings
 */
export async function clearInProgressReadings() {
  try {
    await AsyncStorage.removeItem(IN_PROGRESS_READINGS_KEY);
  } catch (error) {
    console.error('[ReadingStorage] Error clearing readings:', error);
    throw error;
  }
}

/**
 * Format reading for display
 * @param {Object} reading - Saved reading object
 * @returns {Object} Formatted display info
 */
export function formatReadingForDisplay(reading) {
  const savedDate = new Date(reading.savedAt);
  const timeAgo = getTimeAgo(reading.savedAt);

  const spreadName = reading.spreadType ?
    reading.spreadType.replace('_', ' ').toUpperCase() :
    'UNKNOWN';

  const progress = reading.currentCardIndex && reading.cards ?
    `${reading.currentCardIndex + 1}/${reading.cards.length}` :
    '0/0';

  return {
    id: reading.id,
    spreadName,
    readingType: reading.readingType?.toUpperCase() || 'GENERAL',
    intention: reading.intention || 'No intention set',
    progress,
    timeAgo,
    savedDate: savedDate.toLocaleDateString(),
  };
}

/**
 * Get human-readable time ago
 */
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
