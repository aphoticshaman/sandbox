/**
 * Journal Store - Zustand
 * Manages journal entries, prompts, and therapeutic insights
 *
 * PRIVACY: Journal entries are the MOST sensitive data in the app.
 * ENCRYPTION IS ALWAYS ON - NOT OPTIONAL:
 * - All entry content is ALWAYS encrypted client-side before storage
 * - Only the user can decrypt their journals with their password
 * - Not even app admins, hackers, or the app owner can read the content
 * - If user forgets password, journals are PERMANENTLY LOST (by design)
 *
 * State:
 * - entries: Array of journal entries
 * - currentDraft: Entry being written
 * - prompts: Available prompts from library
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/appConstants';
import { db } from '../services/supabase';
import encryptedStorage from '../services/encryptedStorage';
import { useEncryptionStore } from './encryptionStore';

const STORAGE_KEY = STORAGE_KEYS.JOURNAL;

// Fields that stay plaintext for search/sort (everything else encrypted)
const JOURNAL_METADATA_FIELDS = ['id', 'createdAt', 'updatedAt', 'isFavorite'];

/**
 * Initial journal state
 */
const initialState = {
  // Journal entries (most recent first)
  entries: [],
  /*
  entry structure:
  {
    id: string,
    content: string,               // Markdown text
    createdAt: ISO timestamp,
    updatedAt: ISO timestamp,

    // Metadata
    mood: string | null,           // Pre-write mood
    moodAfter: string | null,      // Post-write mood
    linkedReadingId: string | null,
    linkedCardIds: string[],       // Cards this entry references

    // Therapeutic metadata
    promptId: string | null,       // Which prompt was used
    cbtDistortions: string[],      // Identified distortions
    dbtSkills: string[],           // DBT skills practiced
    tags: string[],                // User tags

    // Gamification
    xpAwarded: number,             // XP earned for this entry
    wordCount: number,
    depthScore: number,            // 1-5 (how deep/therapeutic)

    // Privacy
    isPrivate: boolean,            // Exclude from optional cloud sync
    isFavorite: boolean,
  }
  */

  // Current draft (auto-saved)
  currentDraft: null,
  /*
  currentDraft structure:
  {
    content: string,
    mood: string | null,
    linkedReadingId: string | null,
    promptId: string | null,
    startedAt: ISO timestamp,
  }
  */

  // Statistics
  stats: {
    totalEntries: 0,
    totalWords: 0,
    longestEntry: 0,
    averageWordsPerEntry: 0,
    entriesByMood: {},         // { mood: count }
    cbtDistortionsIdentified: 0,
    dbtSkillsPracticed: 0,
    lastEntryDate: null,
  },
};

/**
 * Journal Store
 */
export const useJournalStore = create((set, get) => ({
  ...initialState,

  /**
   * Initialize journal (load from storage and sync with Supabase)
   * Handles encrypted storage transparently
   */
  initializeJournal: async (userId) => {
    try {
      // Load from encrypted storage (handles decryption automatically)
      const journalData = await encryptedStorage.getItem(STORAGE_KEY);

      if (journalData) {
        set(journalData);
      }

      // Then sync from Supabase in background (if user is logged in)
      if (userId) {
        const { entries: supabaseEntries } = await db.getJournalEntries(userId);

        if (supabaseEntries && supabaseEntries.length > 0) {
          // Merge Supabase entries with local entries
          const state = get();
          const localIds = new Set(state.entries.map(e => e.id));
          const newEntries = supabaseEntries.filter(e => !localIds.has(e.id));

          if (newEntries.length > 0) {
            console.log(`[JournalStore] Synced ${newEntries.length} entries from Supabase`);
            set({
              entries: [...newEntries, ...state.entries].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              ),
            });
            get().saveJournal();
          }
        }
      }
    } catch (error) {
      console.error('[JournalStore] Failed to initialize journal:', error);
    }
  },

  /**
   * Save journal to encrypted storage
   * ALWAYS encrypts - encryption is mandatory
   */
  saveJournal: async () => {
    try {
      const state = get();

      // ALWAYS encrypt - encryption is not optional
      await encryptedStorage.setItem(STORAGE_KEY, state, true);
    } catch (error) {
      console.error('[JournalStore] Failed to save journal:', error);
    }
  },

  /**
   * Start new draft
   */
  startDraft: (promptId = null, linkedReadingId = null, mood = null) => {
    const draft = {
      content: '',
      mood,
      linkedReadingId,
      promptId,
      startedAt: new Date().toISOString(),
    };

    set({ currentDraft: draft });
  },

  /**
   * Update draft content (auto-save)
   */
  updateDraft: (content) => {
    const state = get();

    if (!state.currentDraft) {
      // No draft started, create one
      get().startDraft();
    }

    set({
      currentDraft: {
        ...state.currentDraft,
        content,
      },
    });

    // Auto-save to storage (debounced in real implementation)
    get().saveJournal();
  },

  /**
   * Update draft metadata
   */
  updateDraftMetadata: (metadata) => {
    const state = get();

    if (!state.currentDraft) {
      console.warn('[JournalStore] No draft to update metadata');
      return;
    }

    set({
      currentDraft: {
        ...state.currentDraft,
        ...metadata,
      },
    });

    get().saveJournal();
  },

  /**
   * Save draft as entry
   */
  saveDraft: (metadata = {}) => {
    const state = get();

    if (!state.currentDraft) {
      console.warn('[JournalStore] No draft to save');
      return null;
    }

    const {
      content,
      mood,
      linkedReadingId,
      promptId,
      startedAt,
    } = state.currentDraft;

    // Calculate metrics
    const wordCount = content.trim().split(/\s+/).length;
    const depthScore = calculateDepthScore(content);

    // Detect CBT distortions (simplified, real version uses NLP)
    const cbtDistortions = metadata.cbtDistortions || [];

    // DBT skills practiced
    const dbtSkills = metadata.dbtSkills || [];

    // Calculate XP
    let xp = 15; // Base XP for journal entry
    if (wordCount > 200) xp += 10;
    if (depthScore >= 4) xp = Math.floor(xp * 1.3);
    if (cbtDistortions.length > 0) xp = Math.floor(xp * 1.5);
    if (dbtSkills.length > 0) xp = Math.floor(xp * 1.5);

    const entry = {
      id: generateEntryId(),
      content,
      createdAt: startedAt,
      updatedAt: new Date().toISOString(),
      mood,
      moodAfter: metadata.moodAfter || null,
      linkedReadingId,
      linkedCardIds: metadata.linkedCardIds || [],
      promptId,
      cbtDistortions,
      dbtSkills,
      tags: metadata.tags || [],
      xpAwarded: xp,
      wordCount,
      depthScore,
      isPrivate: metadata.isPrivate || false,
      isFavorite: false,
    };

    // Update stats
    const newStats = {
      ...state.stats,
      totalEntries: state.stats.totalEntries + 1,
      totalWords: state.stats.totalWords + wordCount,
      longestEntry: Math.max(state.stats.longestEntry, wordCount),
      averageWordsPerEntry: Math.floor((state.stats.totalWords + wordCount) / (state.stats.totalEntries + 1)),
      cbtDistortionsIdentified: state.stats.cbtDistortionsIdentified + cbtDistortions.length,
      dbtSkillsPracticed: state.stats.dbtSkillsPracticed + dbtSkills.length,
      lastEntryDate: entry.createdAt,
    };

    if (mood) {
      newStats.entriesByMood = {
        ...state.stats.entriesByMood,
        [mood]: (state.stats.entriesByMood[mood] || 0) + 1,
      };
    }

    // Add to entries (most recent first)
    set({
      entries: [entry, ...state.entries],
      currentDraft: null,
      stats: newStats,
    });

    get().saveJournal();

    // Sync to Supabase in background (don't block UI)
    get().syncEntryToSupabase(entry).catch(err =>
      console.warn('[JournalStore] Background sync failed:', err)
    );

    return entry;
  },

  /**
   * Sync entry to Supabase (background operation)
   * ALWAYS sends ENCRYPTED data - server only stores encrypted blobs
   * The server can NEVER read journal content. Period.
   */
  syncEntryToSupabase: async (entry) => {
    try {
      const { supabase } = require('../services/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('[JournalStore] No user session, skipping Supabase sync');
        return;
      }

      // Don't sync private entries
      if (entry.isPrivate) {
        console.log('[JournalStore] Skipping private entry sync');
        return;
      }

      const encState = useEncryptionStore.getState();

      // MUST be unlocked to sync (need key to encrypt)
      if (!encState.isUnlocked) {
        console.warn('[JournalStore] Cannot sync - vault is locked');
        return;
      }

      // ALWAYS encrypt - server only sees encrypted blob
      const encryptedEntry = await encState.encryptWithMetadata(entry, JOURNAL_METADATA_FIELDS);

      if (!encryptedEntry) {
        console.error('[JournalStore] Failed to encrypt entry for sync');
        return;
      }

      const syncData = {
        id: entry.id,
        // Plaintext metadata for server-side sorting
        created_at: entry.createdAt,
        updated_at: entry.updatedAt,
        // ENCRYPTED blob - server cannot read this
        encrypted_content: encryptedEntry._encrypted,
        encryption_version: encryptedEntry._encryptionVersion,
        // NO plaintext content ever sent to server
        content: null,
        title: null,
        mood_before: null,
        mood_after: null,
        tags: null,
      };

      const { error } = await db.saveJournalEntry(user.id, syncData);

      if (error) {
        console.error('[JournalStore] Supabase sync failed:', error);
      } else {
        console.log('[JournalStore] Entry synced (ENCRYPTED) to Supabase:', entry.id);
      }
    } catch (error) {
      console.error('[JournalStore] Sync error:', error);
    }
  },

  /**
   * Discard draft
   */
  discardDraft: () => {
    set({ currentDraft: null });
    get().saveJournal();
  },

  /**
   * Update entry
   */
  updateEntry: (entryId, updates) => {
    const state = get();
    const entries = state.entries.map((entry) => {
      if (entry.id === entryId) {
        return {
          ...entry,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return entry;
    });

    set({ entries });
    get().saveJournal();
  },

  /**
   * Delete entry
   */
  deleteEntry: (entryId) => {
    const state = get();
    const entries = state.entries.filter((entry) => entry.id !== entryId);

    set({ entries });
    get().saveJournal();
  },

  /**
   * Toggle favorite
   */
  toggleFavorite: (entryId) => {
    const state = get();
    const entries = state.entries.map((entry) => {
      if (entry.id === entryId) {
        return { ...entry, isFavorite: !entry.isFavorite };
      }
      return entry;
    });

    set({ entries });
    get().saveJournal();
  },

  /**
   * Add tags to entry
   */
  addTagsToEntry: (entryId, tags) => {
    const state = get();
    const entries = state.entries.map((entry) => {
      if (entry.id === entryId) {
        return {
          ...entry,
          tags: [...new Set([...entry.tags, ...tags])],
        };
      }
      return entry;
    });

    set({ entries });
    get().saveJournal();
  },

  /**
   * Get entry by ID
   */
  getEntryById: (entryId) => {
    const state = get();
    return state.entries.find((entry) => entry.id === entryId) || null;
  },

  /**
   * Get entries by date range
   */
  getEntriesByDateRange: (startDate, endDate) => {
    const state = get();
    return state.entries.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= startDate && entryDate <= endDate;
    });
  },

  /**
   * Get entries by mood
   */
  getEntriesByMood: (mood) => {
    const state = get();
    return state.entries.filter((entry) => entry.mood === mood || entry.moodAfter === mood);
  },

  /**
   * Get entries by tag
   */
  getEntriesByTag: (tag) => {
    const state = get();
    return state.entries.filter((entry) => entry.tags.includes(tag));
  },

  /**
   * Search entries
   */
  searchEntries: (query) => {
    const state = get();
    const lowerQuery = query.toLowerCase();

    return state.entries.filter((entry) =>
      entry.content.toLowerCase().includes(lowerQuery) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  },

  /**
   * Get favorites
   */
  getFavorites: () => {
    const state = get();
    return state.entries.filter((entry) => entry.isFavorite);
  },

  /**
   * Export entries (for backup/sharing)
   */
  exportEntries: (format = 'json') => {
    const state = get();

    if (format === 'json') {
      return JSON.stringify(state.entries, null, 2);
    }

    if (format === 'markdown') {
      return state.entries
        .map((entry) => {
          const date = new Date(entry.createdAt).toLocaleDateString();
          const mood = entry.mood ? `**Mood**: ${entry.mood}\n\n` : '';
          const tags = entry.tags.length > 0 ? `**Tags**: ${entry.tags.join(', ')}\n\n` : '';
          return `# ${date}\n\n${mood}${tags}${entry.content}\n\n---\n\n`;
        })
        .join('');
    }

    return state.entries;
  },

  /**
   * Clear all entries (for testing/reset)
   */
  clearAllEntries: async () => {
    set(initialState);
    await get().saveJournal();
  },
}));

/**
 * HELPER FUNCTIONS
 */

/**
 * Generate unique entry ID
 */
function generateEntryId() {
  return `entry_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculate depth score (1-5)
 * Simple heuristic: word count + therapeutic keywords
 */
function calculateDepthScore(content) {
  const wordCount = content.trim().split(/\s+/).length;

  // Therapeutic keywords
  const therapeuticKeywords = [
    'feel', 'feeling', 'emotion', 'thought', 'thinking',
    'realize', 'notice', 'aware', 'mindful', 'present',
    'challenge', 'reframe', 'evidence', 'distortion',
    'cope', 'regulate', 'skill', 'practice', 'grateful',
  ];

  const keywordCount = therapeuticKeywords.reduce((count, keyword) => {
    const regex = new RegExp(`\\b${keyword}`, 'gi');
    const matches = content.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);

  // Score calculation
  let score = 1;
  if (wordCount >= 50) score++;
  if (wordCount >= 150) score++;
  if (keywordCount >= 3) score++;
  if (keywordCount >= 7) score++;

  return Math.min(score, 5);
}

export default useJournalStore;
