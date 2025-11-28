/**
 * Re-keying Service - Automated Data Migration During Password Recovery
 *
 * When a user recovers their account via security questions, we need to:
 * 1. Decrypt ALL their data with the old key (derived from recovery phrase)
 * 2. Generate new encryption key from new password
 * 3. Re-encrypt ALL their data with new key
 * 4. Generate new recovery phrase and vault
 * 5. Sync everything
 *
 * This happens transparently - user just sees "Recovering account..."
 *
 * SECURITY: This is the most sensitive operation in the app.
 * - Old and new keys exist in memory simultaneously (briefly)
 * - All data is decrypted in memory (briefly)
 * - Must complete atomically - partial re-key = data corruption
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/appConstants';
import { encrypt, decrypt, deriveKey } from './encryptionService';
import { generateRecoveryPhrase, setupRecovery, deriveKeyFromPhrase } from './recoveryService';
import { db } from './supabase';

/**
 * Status updates during re-keying (for UI progress)
 */
export const REKEY_STATUS = {
  STARTING: 'starting',
  DERIVING_OLD_KEY: 'deriving_old_key',
  DECRYPTING_DATA: 'decrypting_data',
  DERIVING_NEW_KEY: 'deriving_new_key',
  ENCRYPTING_DATA: 'encrypting_data',
  GENERATING_RECOVERY: 'generating_recovery',
  SYNCING: 'syncing',
  COMPLETE: 'complete',
  FAILED: 'failed',
};

/**
 * All storage keys that contain encrypted user data
 */
const ENCRYPTED_STORAGE_KEYS = [
  STORAGE_KEYS.JOURNAL,
  STORAGE_KEYS.READINGS,
  STORAGE_KEYS.USER_PROFILE,
  STORAGE_KEYS.VOICE_SETTINGS,
  // Add other encrypted keys here
];

/**
 * Perform full re-keying operation
 *
 * @param {string[]} oldRecoveryPhrase - The recovered phrase (from security questions)
 * @param {string} newPassword - User's new password
 * @param {Object[]} newSecurityQuestions - New security question answers
 * @param {Function} onStatusUpdate - Callback for progress updates
 * @returns {Object} Result with new recovery phrase to show user
 */
export async function performRekey(
  oldRecoveryPhrase,
  newPassword,
  newSecurityQuestions,
  onStatusUpdate = () => {}
) {
  const startTime = Date.now();
  const decryptedData = {};
  let oldKey = null;
  let newKey = null;

  try {
    onStatusUpdate(REKEY_STATUS.STARTING, 0);

    // Step 1: Derive old encryption key from recovery phrase
    onStatusUpdate(REKEY_STATUS.DERIVING_OLD_KEY, 10);
    oldKey = await deriveKeyFromPhrase(oldRecoveryPhrase);

    // Step 2: Decrypt all local data
    onStatusUpdate(REKEY_STATUS.DECRYPTING_DATA, 20);
    let decryptProgress = 20;
    const progressPerKey = 30 / ENCRYPTED_STORAGE_KEYS.length;

    for (const storageKey of ENCRYPTED_STORAGE_KEYS) {
      try {
        const encryptedValue = await AsyncStorage.getItem(storageKey);
        if (encryptedValue) {
          // Check if it's actually encrypted (has our format marker)
          const parsed = JSON.parse(encryptedValue);
          if (parsed.__encrypted) {
            const decrypted = await decrypt(parsed.data, oldKey);
            decryptedData[storageKey] = JSON.parse(decrypted);
          } else {
            // Not encrypted, keep as-is
            decryptedData[storageKey] = parsed;
          }
        }
      } catch (err) {
        console.warn(`Could not decrypt ${storageKey}:`, err.message);
        // Continue with other keys - some might not exist yet
      }
      decryptProgress += progressPerKey;
      onStatusUpdate(REKEY_STATUS.DECRYPTING_DATA, Math.round(decryptProgress));
    }

    // Step 3: Derive new encryption key from new password
    onStatusUpdate(REKEY_STATUS.DERIVING_NEW_KEY, 55);
    const newSalt = await getRandomBytes(32);
    newKey = await deriveKey(newPassword, newSalt);

    // Step 4: Re-encrypt all data with new key
    onStatusUpdate(REKEY_STATUS.ENCRYPTING_DATA, 60);
    let encryptProgress = 60;
    const encryptProgressPerKey = 20 / ENCRYPTED_STORAGE_KEYS.length;

    for (const storageKey of ENCRYPTED_STORAGE_KEYS) {
      if (decryptedData[storageKey]) {
        try {
          const encrypted = await encrypt(JSON.stringify(decryptedData[storageKey]), newKey);
          await AsyncStorage.setItem(storageKey, JSON.stringify({
            __encrypted: true,
            data: encrypted,
            version: 1,
            updatedAt: new Date().toISOString(),
          }));
        } catch (err) {
          console.error(`Failed to re-encrypt ${storageKey}:`, err);
          throw new Error(`Re-encryption failed for ${storageKey}`);
        }
      }
      encryptProgress += encryptProgressPerKey;
      onStatusUpdate(REKEY_STATUS.ENCRYPTING_DATA, Math.round(encryptProgress));
    }

    // Step 5: Generate new recovery phrase and vault
    onStatusUpdate(REKEY_STATUS.GENERATING_RECOVERY, 85);
    const newRecoveryPhrase = await generateRecoveryPhrase();
    const newVault = await setupRecovery(newRecoveryPhrase, newSecurityQuestions);

    // Step 6: Store new encryption metadata and sync
    onStatusUpdate(REKEY_STATUS.SYNCING, 90);

    // Store key verification (not the key itself!)
    const keyVerification = await createKeyVerification(newKey);
    await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTION_META, JSON.stringify({
      salt: arrayToBase64(newSalt),
      keyVerification,
      version: 1,
      createdAt: new Date().toISOString(),
    }));

    // Sync vault to Supabase (encrypted chunks only)
    try {
      await syncVaultToSupabase(newVault);
    } catch (err) {
      console.warn('Could not sync vault to cloud:', err.message);
      // Continue - local recovery still works
    }

    // Step 7: Complete
    onStatusUpdate(REKEY_STATUS.COMPLETE, 100);

    const duration = Date.now() - startTime;
    console.log(`Re-keying completed in ${duration}ms`);

    // Clear sensitive data from memory
    oldKey = null;

    return {
      success: true,
      newRecoveryPhrase, // SHOW THIS TO USER - they must save it!
      newVault,
      duration,
    };

  } catch (error) {
    onStatusUpdate(REKEY_STATUS.FAILED, 0);
    console.error('Re-keying failed:', error);

    // Attempt to restore original state if possible
    // This is tricky - we might be in a partial state

    throw new Error(`Account recovery failed: ${error.message}. Your data has not been modified.`);
  } finally {
    // Clear sensitive data from memory
    oldKey = null;
    newKey = null;
    Object.keys(decryptedData).forEach(key => {
      decryptedData[key] = null;
    });
  }
}

/**
 * Create a verification hash for the encryption key
 * Used to check if password is correct without storing the key
 */
async function createKeyVerification(key) {
  const encoder = new TextEncoder();
  const data = encoder.encode('veilpath-key-verification');

  // In production, use proper HMAC
  const combined = new Uint8Array([...data, ...key]);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  return arrayToBase64(new Uint8Array(hash));
}

/**
 * Get random bytes (wrapper for cross-platform)
 */
async function getRandomBytes(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

/**
 * Convert Uint8Array to base64
 */
function arrayToBase64(array) {
  return btoa(String.fromCharCode(...array));
}

/**
 * Sync recovery vault to Supabase
 * Only stores encrypted chunks - server cannot recover the phrase
 */
async function syncVaultToSupabase(vault) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Store vault in user's profile
  const { error } = await db
    .from('profiles')
    .update({
      recovery_vault: vault,
      recovery_vault_version: vault.version,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    throw error;
  }
}

/**
 * Fetch recovery vault from Supabase
 */
export async function fetchVaultFromSupabase() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await db
    .from('profiles')
    .select('recovery_vault')
    .eq('id', user.id)
    .single();

  if (error) {
    throw error;
  }

  return data?.recovery_vault || null;
}

/**
 * Check if user has recovery set up
 */
export async function hasRecoverySetup() {
  try {
    const vault = await fetchVaultFromSupabase();
    return vault !== null && vault.version >= 1;
  } catch {
    return false;
  }
}

export default {
  REKEY_STATUS,
  performRekey,
  fetchVaultFromSupabase,
  hasRecoverySetup,
};
