/**
 * PROFILE SECURITY - Biometric & PIN Authentication
 *
 * Protects sensitive user data:
 * - Personal readings and intentions
 * - Birth data and zodiac signs
 * - MBTI personality profiles
 * - Reading history
 *
 * Features:
 * - Biometric authentication (Face ID, Touch ID, Fingerprint)
 * - PIN fallback (6-digit)
 * - Per-profile security settings
 * - Optional - enabled during profile creation or in settings
 * - Auto-lock on app background/close
 * - Configurable auto-lock timeout
 *
 * Technical:
 * - expo-local-authentication for biometrics
 * - AsyncStorage for security settings
 * - SHA-256 hashed PIN storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { AppState, Platform } from 'react-native';

// AsyncStorage keys
const SECURITY_SETTINGS_KEY = '@veilpath_security_settings';
const PROFILE_PIN_KEY = '@veilpath_profile_pin'; // Stores hashed PINs per profile
const LAST_UNLOCK_KEY = '@veilpath_last_unlock';

/**
 * Default security settings
 */
const DEFAULT_SECURITY = {
  enabled: false,
  useBiometrics: true,
  requirePIN: false,
  autoLockMinutes: 5, // Auto-lock after 5 minutes in background
  lockOnBackground: true,
  lockOnExit: true
};

/**
 * Check if device supports biometric authentication
 * @returns {Promise<Object>} { hasHardware, isEnrolled, types: Array }
 */
export async function checkBiometricSupport() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const biometricTypes = [];
    types.forEach(type => {
      if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) {
        biometricTypes.push('Fingerprint');
      } else if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
        biometricTypes.push(Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition');
      } else if (type === LocalAuthentication.AuthenticationType.IRIS) {
        biometricTypes.push('Iris');
      }
    });

    return {
      hasHardware,
      isEnrolled,
      types: biometricTypes,
      available: hasHardware && isEnrolled
    };

  } catch (error) {
    console.error('[ProfileSecurity] Error checking biometric support:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      types: [],
      available: false
    };
  }
}

/**
 * Get security settings for a profile
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>}
 */
export async function getSecuritySettings(profileId) {
  try {
    const settingsStr = await AsyncStorage.getItem(`${SECURITY_SETTINGS_KEY}_${profileId}`);

    if (!settingsStr) {
      return DEFAULT_SECURITY;
    }

    return { ...DEFAULT_SECURITY, ...JSON.parse(settingsStr) };

  } catch (error) {
    console.error('[ProfileSecurity] Error loading security settings:', error);
    return DEFAULT_SECURITY;
  }
}

/**
 * Save security settings for a profile
 * @param {string} profileId - Profile ID
 * @param {Object} settings - Security settings
 * @returns {Promise<boolean>}
 */
export async function saveSecuritySettings(profileId, settings) {
  try {
    const merged = { ...DEFAULT_SECURITY, ...settings };
    await AsyncStorage.setItem(
      `${SECURITY_SETTINGS_KEY}_${profileId}`,
      JSON.stringify(merged)
    );

    return true;

  } catch (error) {
    console.error('[ProfileSecurity] Error saving security settings:', error);
    return false;
  }
}

/**
 * Hash PIN using SHA-256
 * @param {string} pin - 6-digit PIN
 * @returns {Promise<string>} Hashed PIN
 */
async function hashPIN(pin) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + 'MINDPATH_SALT_2024' // Add salt for additional security
  );
}

/**
 * Set PIN for a profile
 * @param {string} profileId - Profile ID
 * @param {string} pin - 6-digit PIN
 * @returns {Promise<boolean>}
 */
export async function setPIN(profileId, pin) {
  try {
    // Validate PIN (must be 6 digits)
    if (!/^\d{6}$/.test(pin)) {
      console.error('[ProfileSecurity] Invalid PIN format (must be 6 digits)');
      return false;
    }

    // Hash PIN
    const hashedPIN = await hashPIN(pin);

    // Store hashed PIN
    const pinsStr = await AsyncStorage.getItem(PROFILE_PIN_KEY);
    const pins = pinsStr ? JSON.parse(pinsStr) : {};
    pins[profileId] = hashedPIN;

    await AsyncStorage.setItem(PROFILE_PIN_KEY, JSON.stringify(pins));

    return true;

  } catch (error) {
    console.error('[ProfileSecurity] Error setting PIN:', error);
    return false;
  }
}

/**
 * Verify PIN for a profile
 * @param {string} profileId - Profile ID
 * @param {string} pin - 6-digit PIN to verify
 * @returns {Promise<boolean>}
 */
export async function verifyPIN(profileId, pin) {
  try {
    // Get stored hashed PIN
    const pinsStr = await AsyncStorage.getItem(PROFILE_PIN_KEY);
    if (!pinsStr) {
      console.error('[ProfileSecurity] No PIN set for this profile');
      return false;
    }

    const pins = JSON.parse(pinsStr);
    const storedHash = pins[profileId];

    if (!storedHash) {
      console.error('[ProfileSecurity] No PIN set for this profile');
      return false;
    }

    // Hash provided PIN and compare
    const providedHash = await hashPIN(pin);
    const isValid = providedHash === storedHash;

    if (isValid) {
      await updateLastUnlock(profileId);
    } else {
    }

    return isValid;

  } catch (error) {
    console.error('[ProfileSecurity] Error verifying PIN:', error);
    return false;
  }
}

/**
 * Authenticate using biometrics
 * @param {string} profileId - Profile ID
 * @param {string} promptMessage - Message to show user
 * @returns {Promise<Object>} { success: boolean, error: string }
 */
export async function authenticateWithBiometrics(profileId, promptMessage = 'Unlock your profile') {
  try {
    // Check if biometrics available
    const support = await checkBiometricSupport();

    if (!support.available) {
      return {
        success: false,
        error: 'Biometric authentication not available on this device'
      };
    }

    // Attempt biometric authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true, // Don't use device passcode, use our PIN
      fallbackLabel: 'Use PIN instead'
    });

    if (result.success) {
      await updateLastUnlock(profileId);
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed'
      };
    }

  } catch (error) {
    console.error('[ProfileSecurity] Biometric auth error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update last unlock timestamp
 * @param {string} profileId - Profile ID
 */
async function updateLastUnlock(profileId) {
  try {
    const unlocks = await AsyncStorage.getItem(LAST_UNLOCK_KEY);
    const unlocksObj = unlocks ? JSON.parse(unlocks) : {};
    unlocksObj[profileId] = new Date().toISOString();
    await AsyncStorage.setItem(LAST_UNLOCK_KEY, JSON.stringify(unlocksObj));
  } catch (error) {
    console.error('[ProfileSecurity] Error updating last unlock:', error);
  }
}

/**
 * Check if profile needs to be unlocked
 * @param {string} profileId - Profile ID
 * @returns {Promise<boolean>}
 */
export async function needsUnlock(profileId) {
  try {
    const settings = await getSecuritySettings(profileId);

    // If security not enabled, no unlock needed
    if (!settings.enabled) {
      return false;
    }

    // Get last unlock time
    const unlocksStr = await AsyncStorage.getItem(LAST_UNLOCK_KEY);
    if (!unlocksStr) {
      return true; // Never unlocked before
    }

    const unlocks = JSON.parse(unlocksStr);
    const lastUnlock = unlocks[profileId];

    if (!lastUnlock) {
      return true; // Never unlocked before
    }

    // Check if auto-lock timeout has passed
    const lastUnlockTime = new Date(lastUnlock);
    const now = new Date();
    const minutesSinceUnlock = (now - lastUnlockTime) / (1000 * 60);

    const needsAuth = minutesSinceUnlock >= settings.autoLockMinutes;


    return needsAuth;

  } catch (error) {
    console.error('[ProfileSecurity] Error checking unlock status:', error);
    return true; // Fail secure - require unlock on error
  }
}

/**
 * Full authentication flow (biometric + PIN fallback)
 * @param {string} profileId - Profile ID
 * @param {Function} onSuccess - Called on successful auth
 * @param {Function} onCancel - Called if user cancels
 * @returns {Promise<Object>} { success: boolean, method: 'biometric'|'pin', error: string }
 */
export async function authenticate(profileId, onSuccess = null, onCancel = null) {
  try {
    const settings = await getSecuritySettings(profileId);

    // If security not enabled, auto-succeed
    if (!settings.enabled) {
      if (onSuccess) onSuccess();
      return { success: true, method: 'none' };
    }

    // Try biometrics first (if enabled and available)
    if (settings.useBiometrics) {
      const biometricResult = await authenticateWithBiometrics(profileId);

      if (biometricResult.success) {
        if (onSuccess) onSuccess();
        return { success: true, method: 'biometric' };
      }

      // Biometric failed - fall through to PIN
    }

    // PIN authentication (handled by UI component)
    // Return info that PIN is needed
    return {
      success: false,
      needsPIN: true,
      method: 'pin'
    };

  } catch (error) {
    console.error('[ProfileSecurity] Authentication error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lock profile (clear unlock timestamp)
 * @param {string} profileId - Profile ID
 */
export async function lockProfile(profileId) {
  try {
    const unlocksStr = await AsyncStorage.getItem(LAST_UNLOCK_KEY);
    if (!unlocksStr) return;

    const unlocks = JSON.parse(unlocksStr);
    delete unlocks[profileId];
    await AsyncStorage.setItem(LAST_UNLOCK_KEY, JSON.stringify(unlocks));


  } catch (error) {
    console.error('[ProfileSecurity] Error locking profile:', error);
  }
}

/**
 * Lock all profiles
 */
export async function lockAllProfiles() {
  try {
    await AsyncStorage.removeItem(LAST_UNLOCK_KEY);
  } catch (error) {
    console.error('[ProfileSecurity] Error locking all profiles:', error);
  }
}

/**
 * Remove PIN for a profile
 * @param {string} profileId - Profile ID
 */
export async function removePIN(profileId) {
  try {
    const pinsStr = await AsyncStorage.getItem(PROFILE_PIN_KEY);
    if (!pinsStr) return true;

    const pins = JSON.parse(pinsStr);
    delete pins[profileId];
    await AsyncStorage.setItem(PROFILE_PIN_KEY, JSON.stringify(pins));

    return true;

  } catch (error) {
    console.error('[ProfileSecurity] Error removing PIN:', error);
    return false;
  }
}

/**
 * Disable security for a profile
 * @param {string} profileId - Profile ID
 */
export async function disableSecurity(profileId) {
  try {
    // Update settings
    await saveSecuritySettings(profileId, { enabled: false });

    // Remove PIN
    await removePIN(profileId);

    // Clear unlock timestamp
    await lockProfile(profileId);

    return true;

  } catch (error) {
    console.error('[ProfileSecurity] Error disabling security:', error);
    return false;
  }
}

/**
 * AppState listener for auto-lock on background
 * Call this in your main App.js
 */
let appStateSubscription = null;

export function setupAutoLock() {
  if (appStateSubscription) {
    return; // Already set up
  }

  appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {

      // Lock all profiles that have lockOnBackground enabled
      try {
        const currentProfileId = await AsyncStorage.getItem('@veilpath_current_profile');
        if (currentProfileId) {
          const settings = await getSecuritySettings(currentProfileId);
          if (settings.enabled && settings.lockOnBackground) {
            await lockProfile(currentProfileId);
          }
        }
      } catch (error) {
        console.error('[ProfileSecurity] Error in auto-lock:', error);
      }
    }
  });

}

/**
 * Clean up auto-lock listener
 */
export function cleanupAutoLock() {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}
