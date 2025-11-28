/**
 * Store Index
 * Centralized export for all Zustand stores
 */

// Named exports
export { useUserStore } from './userStore';
export { useReadingStore } from './readingStore';
export { useJournalStore } from './journalStore';
export { useSettingsStore } from './settingsStore';

/**
 * Initialize all stores
 * Call this once on app start
 */
export const initializeAllStores = async () => {
  const { useUserStore } = require('./userStore');
  const { useReadingStore } = require('./readingStore');
  const { useJournalStore } = require('./journalStore');
  const { useSettingsStore } = require('./settingsStore');

  // Get current user session (if any)
  let userId = null;
  try {
    const { supabase } = require('../services/supabase');
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;

    if (userId) {
      console.log('[Stores] Initializing with user session:', userId);
    } else {
      console.log('[Stores] Initializing in offline mode (no user session)');
    }
  } catch (error) {
    console.warn('[Stores] Could not check auth status:', error);
  }

  await Promise.all([
    useSettingsStore.getState().initializeSettings(),
    useUserStore.getState().initializeUser(),
    useReadingStore.getState().initializeReadings(userId),
    useJournalStore.getState().initializeJournal(userId),
  ]);

};

// Import for default export
import { useUserStore as UserStore } from './userStore';
import { useReadingStore as ReadingStore } from './readingStore';
import { useJournalStore as JournalStore } from './journalStore';
import { useSettingsStore as SettingsStore } from './settingsStore';

export default {
  useUserStore: UserStore,
  useReadingStore: ReadingStore,
  useJournalStore: JournalStore,
  useSettingsStore: SettingsStore,
  initializeAllStores,
};
