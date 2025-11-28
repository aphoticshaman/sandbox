/**
 * DATA BACKUP & RESTORE
 *
 * ⚠️  CRITICAL: All user data is stored LOCALLY ONLY
 * No cloud backup exists. If user uninstalls app, ALL DATA IS LOST FOREVER.
 *
 * This module provides export/import functionality to save user data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

// ALL storage keys used across the app
const STORAGE_KEYS = {
  // Profiles
  PROFILES: '@veilpath_profiles',
  ACTIVE_PROFILE: '@veilpath_active_profile',
  SELECTED_PROFILE: '@veilpath_selected_profile',

  // Readings
  READINGS: '@veilpath_readings',
  IN_PROGRESS_READINGS: '@veilpath_in_progress_readings',
  USER_READING_HISTORY: '@veilpath_user_reading_history',
  READING_HISTORY: '@veilpath_reading_history',

  // Engagement & Progress
  READINGS_HISTORY: '@veilpath_readings_history',
  CARD_TRACKER: '@veilpath_card_tracker',
  STREAK_DATA: '@veilpath_streak_data',
  USER_TIER: '@veilpath_user_tier',
  INSIGHTS: '@veilpath_insights',

  // Achievements
  ACHIEVEMENTS: '@veilpath_achievements',

  // Configuration
  DEEP_AGI_CONFIG: '@veilpath_deep_agi_config',
  LLM_CONFIG: '@veilpath_llm_config',
  LLM_CACHE: '@veilpath_llm_cache',

  // UI State
  UPGRADE_PROMPT_COUNT: '@veilpath_upgrade_prompt_count',
};

/**
 * Export ALL user data to JSON file
 * @returns {Object} { success: boolean, filePath: string, error: string }
 */
export async function exportAllData() {
  try {

    // Collect all data from AsyncStorage
    const exportData = {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0',
      platform: Platform.OS,
      data: {}
    };

    // Read each key
    for (const [keyName, storageKey] of Object.entries(STORAGE_KEYS)) {
      try {
        const value = await AsyncStorage.getItem(storageKey);
        if (value !== null) {
          exportData.data[keyName] = JSON.parse(value);
        }
      } catch (error) {
        console.warn(`[DataBackup] Failed to export ${keyName}:`, error);
        // Continue with other keys
      }
    }

    // Create file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `quantum-tarot-backup-${timestamp}.json`;
    const jsonString = JSON.stringify(exportData, null, 2);

    let finalPath = '';
    let shareUri = '';

    if (Platform.OS === 'android') {
      // Android: Save directly to Downloads folder
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Storage permission denied. Cannot save to Downloads.');
      }

      // Write to temp location first
      const tempPath = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(tempPath, jsonString, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Move to Downloads using MediaLibrary
      const asset = await MediaLibrary.createAssetAsync(tempPath);
      const album = await MediaLibrary.getAlbumAsync('Download');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      }

      finalPath = `Downloads/${filename}`;
      shareUri = tempPath; // Share from temp since Downloads isn't directly accessible

    } else {
      // iOS: Save to Documents (user can access via Files app)
      finalPath = `${FileSystem.documentDirectory}${filename}`;
      shareUri = finalPath;
      await FileSystem.writeAsStringAsync(finalPath, jsonString, {
        encoding: FileSystem.EncodingType.UTF8
      });
    }


    // Also offer to share (email, Drive, iCloud, text, etc)
    const shareAvailable = await Sharing.isAvailableAsync();
    if (shareAvailable) {
      await Sharing.shareAsync(shareUri, {
        mimeType: 'application/json',
        dialogTitle: 'Share/Save Quantum Tarot Backup',
        UTI: 'public.json'
      });
    }

    return {
      success: true,
      filePath: finalPath,
      filename,
      size: jsonString.length,
      dataKeys: Object.keys(exportData.data).length
    };

  } catch (error) {
    console.error('[DataBackup] Export failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Import data from JSON backup file
 * @param {string} fileUri - URI to backup file
 * @param {boolean} merge - If true, merge with existing data. If false, replace all.
 * @returns {Object} { success: boolean, imported: number, error: string }
 */
export async function importData(fileUri, merge = false) {
  try {

    // Read file
    const jsonString = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8
    });

    const importData = JSON.parse(jsonString);

    // Validate format
    if (!importData.exportVersion || !importData.data) {
      throw new Error('Invalid backup file format');
    }


    // If not merging, clear existing data first
    if (!merge) {
      await clearAllData();
    }

    // Import each key
    let imported = 0;
    for (const [keyName, value] of Object.entries(importData.data)) {
      try {
        const storageKey = STORAGE_KEYS[keyName];
        if (storageKey) {
          if (merge) {
            // Merge logic for arrays/objects
            const existing = await AsyncStorage.getItem(storageKey);
            if (existing) {
              const existingData = JSON.parse(existing);
              const mergedData = mergeData(existingData, value, keyName);
              await AsyncStorage.setItem(storageKey, JSON.stringify(mergedData));
            } else {
              await AsyncStorage.setItem(storageKey, JSON.stringify(value));
            }
          } else {
            // Direct replace
            await AsyncStorage.setItem(storageKey, JSON.stringify(value));
          }
          imported++;
        } else {
          console.warn(`[DataBackup] Unknown key ${keyName}, skipping`);
        }
      } catch (error) {
        console.warn(`[DataBackup] Failed to import ${keyName}:`, error);
      }
    }


    return {
      success: true,
      imported,
      exportDate: importData.exportDate,
      totalKeys: Object.keys(importData.data).length
    };

  } catch (error) {
    console.error('[DataBackup] Import failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Merge two data objects intelligently
 */
function mergeData(existing, imported, keyName) {
  // For arrays (readings, history, etc), concatenate and deduplicate
  if (Array.isArray(existing) && Array.isArray(imported)) {
    const merged = [...existing, ...imported];
    // Deduplicate by id or timestamp if available
    const unique = merged.filter((item, index, self) => {
      if (item.id) {
        return index === self.findIndex(i => i.id === item.id);
      }
      if (item.timestamp) {
        return index === self.findIndex(i => i.timestamp === item.timestamp);
      }
      return true;
    });
    return unique;
  }

  // For objects, merge properties
  if (typeof existing === 'object' && typeof imported === 'object' && !Array.isArray(existing)) {
    return { ...existing, ...imported };
  }

  // For primitives, imported wins
  return imported;
}

/**
 * Clear ALL user data (DANGEROUS!)
 */
export async function clearAllData() {
  try {

    const keys = await AsyncStorage.getAllKeys();
    const veilpathKeys = keys.filter(key => key.includes('@veilpath'));

    await AsyncStorage.multiRemove(veilpathKeys);


    return {
      success: true,
      cleared: veilpathKeys.length
    };
  } catch (error) {
    console.error('[DataBackup] Clear failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get summary of stored data
 */
export async function getDataSummary() {
  try {
    const summary = {
      totalKeys: 0,
      dataSize: 0,
      categories: {}
    };

    for (const [keyName, storageKey] of Object.entries(STORAGE_KEYS)) {
      const value = await AsyncStorage.getItem(storageKey);
      if (value !== null) {
        summary.totalKeys++;
        summary.dataSize += value.length;

        // Categorize
        const category = keyName.includes('READING') ? 'readings' :
                        keyName.includes('PROFILE') ? 'profiles' :
                        keyName.includes('AGI') || keyName.includes('LLM') ? 'config' :
                        keyName.includes('ACHIEVEMENT') || keyName.includes('STREAK') || keyName.includes('TIER') ? 'progress' :
                        'other';

        if (!summary.categories[category]) {
          summary.categories[category] = { count: 0, size: 0 };
        }
        summary.categories[category].count++;
        summary.categories[category].size += value.length;
      }
    }

    return summary;
  } catch (error) {
    console.error('[DataBackup] Summary failed:', error);
    return null;
  }
}
