/**
 * PERMISSIONS MANAGER
 *
 * Automatically checks and requests necessary permissions with clear explanations.
 * Deep links to system settings for permissions that require it.
 *
 * Features:
 * - File system access (for backup/export)
 * - Notifications (for streak reminders)
 * - Clear explanations before each request
 * - Direct deep links to iOS/Android settings
 * - Tracks permission status to avoid repeat prompts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform, Linking, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

// Simple stubs - notifications not critical for MVP
const Notifications = {
  getPermissionsAsync: async () => ({ status: 'granted' }),
  requestPermissionsAsync: async () => ({ status: 'granted' })
};

const PERMISSIONS_STATUS_KEY = '@veilpath_permissions_status';
const PERMISSIONS_EXPLAINED_KEY = '@veilpath_permissions_explained';

/**
 * Permission definitions with explanations
 */
export const PERMISSIONS = {
  FILE_SYSTEM: {
    id: 'file_system',
    name: 'File System Access',
    description: 'VeilPath needs file system access to save encrypted backups of your profile and readings to your device.\n\n' +
                 'This allows you to:\n' +
                 '• Export readings to PDF/text\n' +
                 '• Save encrypted profile backups to Downloads folder\n' +
                 '• Restore your data if you switch devices\n\n' +
                 'All data stays on YOUR device - we never upload anything to our servers.',
    required: false,
    platforms: ['android', 'ios']
  },

  NOTIFICATIONS: {
    id: 'notifications',
    name: 'Notifications',
    description: 'Enable notifications to receive gentle reminders for:\n\n' +
                 '• Daily reading streaks (stay consistent!)\n' +
                 '• Saved readings you wanted to revisit\n' +
                 '• New features and updates\n\n' +
                 'You can customize notification frequency in Settings anytime.',
    required: false,
    platforms: ['android', 'ios']
  }
};

/**
 * Check if we've already explained permissions to user
 */
async function hasExplainedPermissions() {
  try {
    const explained = await AsyncStorage.getItem(PERMISSIONS_EXPLAINED_KEY);
    return explained === 'true';
  } catch (error) {
    console.error('[Permissions] Error checking explanation status:', error);
    return false;
  }
}

/**
 * Mark that we've explained permissions
 */
async function markPermissionsExplained() {
  try {
    await AsyncStorage.setItem(PERMISSIONS_EXPLAINED_KEY, 'true');
  } catch (error) {
    console.error('[Permissions] Error marking explained:', error);
  }
}

/**
 * Get current permissions status from AsyncStorage
 */
async function getPermissionsStatus() {
  try {
    const statusJson = await AsyncStorage.getItem(PERMISSIONS_STATUS_KEY);
    if (!statusJson) {
      return {};
    }
    return JSON.parse(statusJson);
  } catch (error) {
    console.error('[Permissions] Error loading status:', error);
    return {};
  }
}

/**
 * Save permissions status to AsyncStorage
 */
async function savePermissionsStatus(status) {
  try {
    await AsyncStorage.setItem(PERMISSIONS_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('[Permissions] Error saving status:', error);
  }
}

/**
 * Check file system permission
 * Uses MediaLibrary for storage access on Android
 */
async function checkFileSystemPermission() {
  try {
    if (Platform.OS === 'android') {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return status;
    } else {
      // iOS: File system access is automatic for app's own documents directory
      return 'granted';
    }
  } catch (error) {
    console.error('[Permissions] File system check error:', error);
    return 'denied';
  }
}

/**
 * Request file system permission
 */
async function requestFileSystemPermission() {
  try {
    if (Platform.OS === 'android') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status;
    } else {
      // iOS: No explicit permission needed
      return 'granted';
    }
  } catch (error) {
    console.error('[Permissions] File system request error:', error);
    return 'denied';
  }
}

/**
 * Check notification permission
 */
async function checkNotificationPermission() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('[Permissions] Notification check error:', error);
    return 'denied';
  }
}

/**
 * Request notification permission
 */
async function requestNotificationPermission() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  } catch (error) {
    console.error('[Permissions] Notification request error:', error);
    return 'denied';
  }
}

/**
 * Open system settings for the app
 */
export async function openAppSettings() {
  try {

    // Use Linking.openSettings() for both iOS and Android
    // This is simpler and works without expo-intent-launcher
    await Linking.openSettings();

  } catch (error) {
    console.error('[Permissions] Error opening settings:', error);
    Alert.alert(
      'Unable to Open Settings',
      'Please manually open:\nSettings > Apps > VeilPath Tarot\n\nThen enable:\n• Storage permissions\n• Media access',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Show permission explanation with option to grant
 * Returns: Promise<'granted' | 'denied' | 'cancelled'>
 */
export async function explainAndRequestPermission(permission, onShowModal) {
  return new Promise((resolve) => {
    // Show modal with explanation
    onShowModal({
      title: permission.name,
      description: permission.description,
      onGrant: async () => {
        // Request the actual permission
        let status = 'denied';

        if (permission.id === 'notifications') {
          status = await requestNotificationPermission();
        } else if (permission.id === 'file_system') {
          status = await requestFileSystemPermission();
        }

        // Save status
        const currentStatus = await getPermissionsStatus();
        currentStatus[permission.id] = status;
        await savePermissionsStatus(currentStatus);

        // If still denied, offer to open settings
        if (status === 'denied' || status === 'undetermined') {
          Alert.alert(
            'Permission Required',
            'Storage permission is needed to export your readings and backups. Would you like to open Settings to enable it manually?',
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => openAppSettings()
              }
            ]
          );
        }

        resolve(status);
      },
      onDeny: () => {
        // User declined
        const saveDecline = async () => {
          const currentStatus = await getPermissionsStatus();
          currentStatus[permission.id] = 'denied';
          await savePermissionsStatus(currentStatus);
        };
        saveDecline();
        resolve('denied');
      },
      onCancel: () => {
        // User wants to decide later
        resolve('cancelled');
      }
    });
  });
}

/**
 * Check all permissions and return status
 */
export async function checkAllPermissions() {

  const status = {
    file_system: await checkFileSystemPermission(),
    notifications: await checkNotificationPermission()
  };


  return status;
}

/**
 * Main initialization - check and request permissions if needed
 *
 * @param {Function} onShowModal - Callback to show permission explanation modal
 *   Signature: ({ title, description, onGrant, onDeny, onCancel }) => void
 * @param {boolean} forceExplanation - Force showing explanations even if already shown
 */
export async function initializePermissions(onShowModal, forceExplanation = false) {

  // Check if we've already explained permissions
  const alreadyExplained = await hasExplainedPermissions();

  if (alreadyExplained && !forceExplanation) {
    return await checkAllPermissions();
  }

  // Get current status
  const currentStatus = await getPermissionsStatus();

  // Check each permission
  for (const [key, permission] of Object.entries(PERMISSIONS)) {
    // Skip if already granted
    if (currentStatus[permission.id] === 'granted') {
      continue;
    }

    // Skip if not for this platform
    if (!permission.platforms.includes(Platform.OS)) {
      continue;
    }

    // Explain and request
    const status = await explainAndRequestPermission(permission, onShowModal);


    // If denied, offer to open settings
    if (status === 'denied' && !permission.required) {
      // Optional permission denied - that's okay
    } else if (status === 'denied' && permission.required) {
      // Required permission denied - show settings prompt
      Alert.alert(
        'Permission Required',
        `${permission.name} is required for VeilPath to function properly. Would you like to open Settings to enable it?`,
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => openAppSettings()
          }
        ]
      );
    }
  }

  // Mark as explained
  await markPermissionsExplained();


  return await checkAllPermissions();
}

/**
 * Reset permissions explained flag (for testing or settings)
 */
export async function resetPermissionsExplained() {
  try {
    await AsyncStorage.removeItem(PERMISSIONS_EXPLAINED_KEY);
  } catch (error) {
    console.error('[Permissions] Error resetting explained flag:', error);
  }
}

/**
 * Check if a specific permission is granted
 */
export async function hasPermission(permissionId) {
  const status = await getPermissionsStatus();
  return status[permissionId] === 'granted';
}

/**
 * Request a single permission (for settings screen)
 */
export async function requestSinglePermission(permissionId, onShowModal) {
  const permission = Object.values(PERMISSIONS).find(p => p.id === permissionId);

  if (!permission) {
    console.error(`[Permissions] Unknown permission: ${permissionId}`);
    return 'denied';
  }

  return await explainAndRequestPermission(permission, onShowModal);
}
