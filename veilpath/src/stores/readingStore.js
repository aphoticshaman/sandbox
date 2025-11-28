/**
 * Reading Store - Zustand
 * Manages tarot readings, reading history, and current reading state
 *
 * PRIVACY: Reading data contains intentions, reflections, and card interpretations.
 * ENCRYPTION IS ALWAYS ON - NOT OPTIONAL:
 * - All reading content is ALWAYS encrypted client-side before storage
 * - Only the user can decrypt their readings with their password
 * - Server only stores encrypted blobs - can NEVER read intentions/interpretations
 * - If user forgets password, readings are PERMANENTLY LOST (by design)
 *
 * State:
 * - currentReading: Active reading in progress
 * - history: Array of past readings
 * - favorites: Starred readings
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/appConstants';
import { db } from '../services/supabase';
import encryptedStorage from '../services/encryptedStorage';
import { useEncryptionStore } from './encryptionStore';

const STORAGE_KEY = STORAGE_KEYS.READINGS;

// Fields that stay plaintext for sorting (everything else encrypted)
const READING_METADATA_FIELDS = ['id', 'startedAt', 'completedAt', 'type', 'isFavorite'];

/**
 * Initial reading state
 */
const initialState = {
  // Current reading (null when not in a reading)
  currentReading: null,
  /*
  currentReading structure:
  {
    id: string,
    type: 'single' | 'three-card' | 'celtic-cross' | 'custom',
    intention: string,
    cards: [
      {
        cardId: string,
        position: number,
        positionName: string, // e.g., "Past", "Present", "Future"
        isReversed: boolean,
      }
    ],
    startedAt: ISO timestamp,
    completedAt: ISO timestamp | null,
  }
  */

  // Reading history (most recent first)
  history: [],
  /*
  history structure: Array of completed readings with additional fields:
  {
    ...currentReading,
    reflection: string | null,      // User's journal reflection
    linkedJournalId: string | null, // Link to journal entry
    isFavorite: boolean,
    tags: string[],                 // User-added tags
  }
  */

  // Favorites (quick access)
  favorites: [],  // Array of reading IDs

  // Statistics
  stats: {
    totalReadings: 0,
    readingsByType: {
      single: 0,
      'three-card': 0,
      'celtic-cross': 0,
      custom: 0,
    },
    mostDrawnCards: {},  // { cardId: count }
    lastReadingDate: null,
  },
};

/**
 * Reading Store
 */
export const useReadingStore = create((set, get) => ({
  ...initialState,

  /**
   * Initialize readings (load from storage and sync with Supabase)
   * Handles encrypted storage transparently
   */
  initializeReadings: async (userId) => {
    try {
      // Load from encrypted storage (handles decryption automatically)
      const readingData = await encryptedStorage.getItem(STORAGE_KEY);

      if (readingData) {
        set(readingData);
      }

      // Then sync from Supabase in background (if user is logged in)
      if (userId) {
        const { readings: supabaseReadings } = await db.getReadings(userId);

        if (supabaseReadings && supabaseReadings.length > 0) {
          // Merge Supabase readings with local readings
          const state = get();
          const localIds = new Set(state.history.map(r => r.id));
          const newReadings = supabaseReadings.filter(r => !localIds.has(r.id));

          if (newReadings.length > 0) {
            console.log(`[ReadingStore] Synced ${newReadings.length} readings from Supabase`);
            set({
              history: [...newReadings, ...state.history].sort(
                (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
              ),
            });
            get().saveReadings();
          }
        }
      }
    } catch (error) {
      console.error('[ReadingStore] Failed to initialize readings:', error);
    }
  },

  /**
   * Save readings to encrypted storage
   * ALWAYS encrypts - encryption is mandatory
   */
  saveReadings: async () => {
    try {
      const state = get();

      // ALWAYS encrypt - encryption is not optional
      await encryptedStorage.setItem(STORAGE_KEY, state, true);
    } catch (error) {
      console.error('[ReadingStore] Failed to save readings:', error);
    }
  },

  /**
   * Start a new reading
   */
  startReading: (type, intention = '') => {
    const reading = {
      id: generateReadingId(),
      type,
      intention,
      cards: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    set({ currentReading: reading });
  },

  /**
   * Add card to current reading
   */
  addCardToReading: (cardId, position, positionName, isReversed = false) => {
    const state = get();

    if (!state.currentReading) {
      console.warn('[ReadingStore] No active reading to add card to');
      return;
    }

    const card = {
      cardId,
      position,
      positionName,
      isReversed,
    };

    set({
      currentReading: {
        ...state.currentReading,
        cards: [...state.currentReading.cards, card],
      },
    });

  },

  /**
   * Complete current reading (save to history)
   */
  completeReading: (reflection = null) => {
    const state = get();

    if (!state.currentReading) {
      console.warn('[ReadingStore] No active reading to complete');
      return;
    }

    const completedReading = {
      ...state.currentReading,
      completedAt: new Date().toISOString(),
      reflection,
      linkedJournalId: null,
      isFavorite: false,
      tags: [],
    };

    // Update stats
    const newStats = {
      ...state.stats,
      totalReadings: state.stats.totalReadings + 1,
      readingsByType: {
        ...state.stats.readingsByType,
        [completedReading.type]: (state.stats.readingsByType[completedReading.type] || 0) + 1,
      },
      lastReadingDate: completedReading.completedAt,
    };

    // Update most drawn cards
    const mostDrawnCards = { ...state.stats.mostDrawnCards };
    completedReading.cards.forEach((card) => {
      mostDrawnCards[card.cardId] = (mostDrawnCards[card.cardId] || 0) + 1;
    });
    newStats.mostDrawnCards = mostDrawnCards;

    // Add to history (most recent first)
    set({
      history: [completedReading, ...state.history],
      currentReading: null,
      stats: newStats,
    });

    get().saveReadings();

    // Sync to Supabase in background (don't block UI)
    get().syncReadingToSupabase(completedReading).catch(err =>
      console.warn('[ReadingStore] Background sync failed:', err)
    );

    return completedReading;
  },

  /**
   * Sync reading to Supabase (background operation)
   * ALWAYS sends ENCRYPTED data - server can NEVER read intentions/interpretations
   */
  syncReadingToSupabase: async (reading) => {
    try {
      const { supabase } = require('../services/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('[ReadingStore] No user session, skipping Supabase sync');
        return;
      }

      const encState = useEncryptionStore.getState();

      // MUST be unlocked to sync
      if (!encState.isUnlocked) {
        console.warn('[ReadingStore] Cannot sync - vault is locked');
        return;
      }

      // ALWAYS encrypt - server only sees encrypted blob
      const encryptedReading = await encState.encryptWithMetadata(reading, READING_METADATA_FIELDS);

      if (!encryptedReading) {
        console.error('[ReadingStore] Failed to encrypt reading for sync');
        return;
      }

      const syncData = {
        id: reading.id,
        // Only timestamps and type in plaintext for sorting
        spread_type: reading.type,
        created_at: reading.startedAt,
        completed_at: reading.completedAt,
        // ENCRYPTED blob - server cannot read this
        encrypted_content: encryptedReading._encrypted,
        encryption_version: encryptedReading._encryptionVersion,
        // NO plaintext content ever sent to server
        intention: null,
        interpretation: null,
        cards: null,
      };

      const { error } = await db.saveReading(user.id, syncData);

      if (error) {
        console.error('[ReadingStore] Supabase sync failed:', error);
      } else {
        console.log('[ReadingStore] Reading synced (ENCRYPTED) to Supabase:', reading.id);
      }
    } catch (error) {
      console.error('[ReadingStore] Sync error:', error);
    }
  },

  /**
   * Cancel current reading (discard without saving)
   */
  cancelReading: () => {
    set({ currentReading: null });
  },

  /**
   * Toggle favorite on a reading
   */
  toggleFavorite: (readingId) => {
    const state = get();
    const history = state.history.map((reading) => {
      if (reading.id === readingId) {
        return { ...reading, isFavorite: !reading.isFavorite };
      }
      return reading;
    });

    const favorites = history
      .filter((r) => r.isFavorite)
      .map((r) => r.id);

    set({ history, favorites });
    get().saveReadings();
  },

  /**
   * Add tags to a reading
   */
  addTagsToReading: (readingId, tags) => {
    const state = get();
    const history = state.history.map((reading) => {
      if (reading.id === readingId) {
        return {
          ...reading,
          tags: [...new Set([...reading.tags, ...tags])],
        };
      }
      return reading;
    });

    set({ history });
    get().saveReadings();
  },

  /**
   * Link journal entry to reading
   */
  linkJournalToReading: (readingId, journalId) => {
    const state = get();
    const history = state.history.map((reading) => {
      if (reading.id === readingId) {
        return { ...reading, linkedJournalId: journalId };
      }
      return reading;
    });

    set({ history });
    get().saveReadings();
  },

  /**
   * Delete a reading
   */
  deleteReading: (readingId) => {
    const state = get();
    const history = state.history.filter((reading) => reading.id !== readingId);
    const favorites = state.favorites.filter((id) => id !== readingId);

    set({ history, favorites });
    get().saveReadings();
  },

  /**
   * Get reading by ID
   */
  getReadingById: (readingId) => {
    const state = get();
    return state.history.find((reading) => reading.id === readingId) || null;
  },

  /**
   * Get readings by date range
   */
  getReadingsByDateRange: (startDate, endDate) => {
    const state = get();
    return state.history.filter((reading) => {
      const readingDate = new Date(reading.completedAt);
      return readingDate >= startDate && readingDate <= endDate;
    });
  },

  /**
   * Get readings by card
   */
  getReadingsByCard: (cardId) => {
    const state = get();
    return state.history.filter((reading) =>
      reading.cards.some((card) => card.cardId === cardId)
    );
  },

  /**
   * Search readings (by intention, reflection, tags)
   */
  searchReadings: (query) => {
    const state = get();
    const lowerQuery = query.toLowerCase();

    return state.history.filter((reading) => {
      const intentionMatch = reading.intention?.toLowerCase().includes(lowerQuery);
      const reflectionMatch = reading.reflection?.toLowerCase().includes(lowerQuery);
      const tagsMatch = reading.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));

      return intentionMatch || reflectionMatch || tagsMatch;
    });
  },

  /**
   * Clear all readings (for testing/reset)
   */
  clearAllReadings: async () => {
    set(initialState);
    await get().saveReadings();
  },
}));

/**
 * HELPER FUNCTIONS
 */

/**
 * Generate unique reading ID
 */
function generateReadingId() {
  return `reading_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export default useReadingStore;
