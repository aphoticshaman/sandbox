/**
 * Settings Store - Zustand
 * Manages app settings, preferences, and configuration
 *
 * State:
 * - appearance: Theme, display preferences
 * - notifications: Notification settings
 * - privacy: Privacy and data settings
 * - accessibility: Accessibility features
 * - content: Content preferences
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/appConstants';

const STORAGE_KEY = STORAGE_KEYS.SETTINGS;

/**
 * Initial settings state
 */
const initialState = {
  // Appearance
  appearance: {
    theme: 'dark',              // 'dark' | 'light' (only dark for v1)
    reducedMotion: false,       // Accessibility: reduce animations
    textSize: 'base',           // 'sm' | 'base' | 'lg' | 'xl'
    highContrast: false,        // Accessibility: high contrast mode
  },

  // Notifications
  notifications: {
    enabled: true,
    dailyReminder: false,
    dailyReminderTime: '09:00', // HH:MM format
    streakReminder: true,
    achievementUnlocks: true,
    journalPrompts: true,
    mindfulnessReminders: false,
    mindfulnessFrequency: 'daily', // 'daily' | 'twice' | 'thrice'
  },

  // Privacy
  privacy: {
    analyticsEnabled: false,      // Opt-in analytics
    cloudSyncEnabled: false,      // Optional cloud backup (Supabase)
    aiAnalysisEnabled: false,     // Optional AI journal analysis (Claude)
    shareReadingsEnabled: false,  // Optional community features
    biometricLock: false,         // Biometric authentication
    autoLockTimeout: 300,         // Seconds (5 min default)
  },

  // Accessibility
  accessibility: {
    screenReader: false,          // VoiceOver/TalkBack support
    voiceNarration: false,        // Read card interpretations aloud
    hapticFeedback: true,         // Vibration feedback
    colorblindMode: 'none',       // 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia'
  },

  // Content Preferences
  content: {
    cardInterpretationDepth: 'detailed', // 'brief' | 'detailed' | 'academic'
    showReversedMeanings: true,           // Include reversed card meanings
    therapeuticFocus: 'balanced',         // 'cbt' | 'dbt' | 'mindfulness' | 'balanced'
    journalPromptsFrequency: 'always',    // 'always' | 'sometimes' | 'never'
    crisisResourcesVisible: true,         // Show crisis resources in settings
  },

  // Data Management
  data: {
    lastBackupDate: null,         // ISO timestamp
    totalStorageUsed: 0,          // Bytes (calculated)
    autoBackup: false,            // Auto backup to device
    backupFrequency: 'weekly',    // 'daily' | 'weekly' | 'monthly'
  },

  // Advanced
  advanced: {
    devMode: false,               // Developer mode (hidden features)
    betaFeatures: false,          // Opt-in to beta features
    performanceMode: false,       // Reduce effects for older devices
    debugLogging: false,          // Enable console logging
  },

  // App metadata
  meta: {
    version: '1.0.0',
    firstLaunchDate: null,        // ISO timestamp
    lastLaunchDate: null,         // ISO timestamp
    launchCount: 0,
    hasRatedApp: false,
    hasCompletedOnboarding: false,
  },
};

/**
 * Settings Store
 */
export const useSettingsStore = create((set, get) => ({
  ...initialState,

  /**
   * Initialize settings (load from storage)
   */
  initializeSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const settingsData = JSON.parse(stored);

        // Merge with initial state (in case new settings were added)
        const mergedSettings = deepMerge(initialState, settingsData);

        set(mergedSettings);
      } else {
        // First launch
        const firstLaunchSettings = {
          ...initialState,
          meta: {
            ...initialState.meta,
            firstLaunchDate: new Date().toISOString(),
            lastLaunchDate: new Date().toISOString(),
            launchCount: 1,
          },
        };

        set(firstLaunchSettings);
        await get().saveSettings();
      }

      // Update launch metadata
      get().updateLaunchMetadata();
    } catch (error) {
      console.error('[SettingsStore] Failed to initialize settings:', error);
    }
  },

  /**
   * Save settings to AsyncStorage
   */
  saveSettings: async () => {
    try {
      const state = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[SettingsStore] Failed to save settings:', error);
    }
  },

  /**
   * Update appearance settings
   */
  updateAppearance: (updates) => {
    const state = get();
    set({
      appearance: {
        ...state.appearance,
        ...updates,
      },
    });
    get().saveSettings();
  },

  /**
   * Update notification settings
   */
  updateNotifications: (updates) => {
    const state = get();
    set({
      notifications: {
        ...state.notifications,
        ...updates,
      },
    });
    get().saveSettings();
  },

  /**
   * Update privacy settings
   */
  updatePrivacy: (updates) => {
    const state = get();
    set({
      privacy: {
        ...state.privacy,
        ...updates,
      },
    });
    get().saveSettings();
  },

  /**
   * Update accessibility settings
   */
  updateAccessibility: (updates) => {
    const state = get();
    set({
      accessibility: {
        ...state.accessibility,
        ...updates,
      },
    });
    get().saveSettings();
  },

  /**
   * Update content preferences
   */
  updateContent: (updates) => {
    const state = get();
    set({
      content: {
        ...state.content,
        ...updates,
      },
    });
    get().saveSettings();
  },

  /**
   * Update data management settings
   */
  updateData: (updates) => {
    const state = get();
    set({
      data: {
        ...state.data,
        ...updates,
      },
    });
    get().saveSettings();
  },

  /**
   * Update advanced settings
   */
  updateAdvanced: (updates) => {
    const state = get();
    set({
      advanced: {
        ...state.advanced,
        ...updates,
      },
    });
    get().saveSettings();
  },

  /**
   * Toggle biometric lock
   */
  toggleBiometricLock: async () => {
    const state = get();

    // In real implementation, would check biometric availability
    // For now, just toggle
    set({
      privacy: {
        ...state.privacy,
        biometricLock: !state.privacy.biometricLock,
      },
    });

    get().saveSettings();
    return !state.privacy.biometricLock;
  },

  /**
   * Update launch metadata
   */
  updateLaunchMetadata: () => {
    const state = get();
    set({
      meta: {
        ...state.meta,
        lastLaunchDate: new Date().toISOString(),
        launchCount: state.meta.launchCount + 1,
      },
    });
    get().saveSettings();
  },

  /**
   * Mark onboarding complete
   */
  completeOnboarding: () => {
    const state = get();
    set({
      meta: {
        ...state.meta,
        hasCompletedOnboarding: true,
      },
    });
    get().saveSettings();
  },

  /**
   * Mark app as rated
   */
  markAppRated: () => {
    const state = get();
    set({
      meta: {
        ...state.meta,
        hasRatedApp: true,
      },
    });
    get().saveSettings();
  },

  /**
   * Calculate storage used
   */
  calculateStorageUsed: async () => {
    try {
      // Get all storage keys and calculate total size
      const keys = [
        '@veilpath_user',
        '@veilpath_readings',
        '@veilpath_journal',
        '@veilpath_settings',
      ];

      let totalSize = 0;

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      }

      set({
        data: {
          ...get().data,
          totalStorageUsed: totalSize,
        },
      });

      get().saveSettings();
      return totalSize;
    } catch (error) {
      console.error('[SettingsStore] Failed to calculate storage:', error);
      return 0;
    }
  },

  /**
   * Export all app data
   */
  exportAllData: async () => {
    try {
      const keys = [
        '@veilpath_user',
        '@veilpath_readings',
        '@veilpath_journal',
        '@veilpath_settings',
      ];

      const exportData = {};

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          exportData[key] = JSON.parse(data);
        }
      }

      exportData.exportDate = new Date().toISOString();
      exportData.version = get().meta.version;

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('[SettingsStore] Failed to export data:', error);
      return null;
    }
  },

  /**
   * Import all app data
   */
  importAllData: async (jsonData) => {
    try {
      const importData = JSON.parse(jsonData);

      for (const key in importData) {
        if (key.startsWith('@veilpath_')) {
          await AsyncStorage.setItem(key, JSON.stringify(importData[key]));
        }
      }

      // Reload all stores
      await get().initializeSettings();
      return true;
    } catch (error) {
      console.error('[SettingsStore] Failed to import data:', error);
      return false;
    }
  },

  /**
   * Reset all settings (keep user data)
   */
  resetSettings: async () => {
    const state = get();
    set({
      ...initialState,
      meta: state.meta, // Keep metadata
    });
    await get().saveSettings();
  },

  /**
   * Clear all app data (DANGER: cannot be undone)
   */
  clearAllData: async () => {
    try {
      const keys = [
        '@veilpath_user',
        '@veilpath_readings',
        '@veilpath_journal',
        '@veilpath_settings',
      ];

      for (const key of keys) {
        await AsyncStorage.removeItem(key);
      }

      set(initialState);
      return true;
    } catch (error) {
      console.error('[SettingsStore] Failed to clear data:', error);
      return false;
    }
  },
}));

/**
 * HELPER FUNCTIONS
 */

/**
 * Deep merge two objects (for settings migration)
 */
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

export default useSettingsStore;
