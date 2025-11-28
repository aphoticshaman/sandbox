/**
 * ENCRYPTION STORE
 * Manages encryption keys and secure data access
 *
 * ZERO-KNOWLEDGE ARCHITECTURE:
 * - ENCRYPTION IS ALWAYS ON. Not optional. Your data is YOUR data.
 * - User sets encryption password on first use
 * - Password is used to derive encryption key via PBKDF2
 * - Key is held IN MEMORY ONLY during session (never persisted)
 * - When user logs out or closes app, key is wiped
 * - ALL sensitive data is ALWAYS encrypted before storage
 *
 * RECOVERY SYSTEM (Weighted Threshold with Keystone):
 * - 5 security questions protect overlapping chunks of recovery phrase
 * - Q3 is the KEYSTONE (always required, worth 3 of 7 shares)
 * - Need Q3 + any 2 others (3 questions, 5 shares minimum)
 * - Side-channel hardened: constant-time compare, random delays, decoy computation
 * - Without Q3, even all 4 other answers = FAIL (only 4 shares)
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  encrypt,
  decrypt,
  encryptWithMetadata,
  decryptWithMetadata,
  generateKeyVerificationHash,
  verifyPassword,
  isEncryptionAvailable,
} from '../services/encryptionService';
import {
  generateRecoveryPhrase,
  setupRecovery,
  recoverPhrase,
  performFullRecovery,
  deriveKeyFromPhrase,
  DEFAULT_SECURITY_QUESTIONS,
} from '../services/recoveryService';
import { performRekey } from '../services/rekeyingService';

// Storage keys
const STORAGE_KEYS = {
  KEY_VERIFICATION_HASH: 'veilpath_key_verification',
  ENCRYPTED_DATA_VERSION: 'veilpath_encrypted_data_version',
  HAS_SETUP_ENCRYPTION: 'veilpath_encryption_setup_complete',
  RECOVERY_VAULT: 'veilpath_recovery_vault',
  HAS_RECOVERY_SETUP: 'veilpath_recovery_setup_complete',
};

/**
 * Encryption Store
 * ENCRYPTION IS MANDATORY - NOT OPTIONAL
 */
export const useEncryptionStore = create((set, get) => ({
  // State
  isInitialized: false,
  isSetupComplete: false, // Has user set their encryption password?
  isUnlocked: false, // True when user has provided correct password this session
  encryptionKey: null, // In-memory only! This is the user's password

  // Capability check
  isSupported: isEncryptionAvailable(),

  // Error state
  lastError: null,

  /**
   * Initialize encryption store
   * Checks if user has completed encryption setup
   */
  initialize: async () => {
    try {
      const setupComplete = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SETUP_ENCRYPTION);

      set({
        isInitialized: true,
        isSetupComplete: setupComplete === 'true',
        isUnlocked: false, // Always locked on init
        encryptionKey: null,
      });

      console.log('[EncryptionStore] Initialized, setup complete:', setupComplete === 'true');
    } catch (error) {
      console.error('[EncryptionStore] Init failed:', error);
      set({
        isInitialized: true,
        isSetupComplete: false,
        lastError: error.message,
      });
    }
  },

  /**
   * Setup encryption for the first time (REQUIRED for new users)
   * This is NOT optional - users MUST set an encryption password
   *
   * @param {string} password - User's chosen encryption password
   * @returns {Promise<boolean>} - Success
   */
  setupEncryption: async (password) => {
    if (!isEncryptionAvailable()) {
      set({ lastError: 'Encryption not supported on this device' });
      return false;
    }

    if (!password || password.length < 8) {
      set({ lastError: 'Password must be at least 8 characters' });
      return false;
    }

    try {
      // Generate verification hash (NOT the key - just to verify password later)
      const verificationHash = await generateKeyVerificationHash(password);

      // Store settings
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.HAS_SETUP_ENCRYPTION, 'true'],
        [STORAGE_KEYS.KEY_VERIFICATION_HASH, verificationHash],
        [STORAGE_KEYS.ENCRYPTED_DATA_VERSION, '1'],
      ]);

      set({
        isSetupComplete: true,
        isUnlocked: true,
        encryptionKey: password,
        lastError: null,
      });

      console.log('[EncryptionStore] Encryption setup complete - vault created');
      return true;
    } catch (error) {
      console.error('[EncryptionStore] Setup encryption failed:', error);
      set({ lastError: error.message });
      return false;
    }
  },

  /**
   * Unlock the vault with password
   * Call this after user logs in or when app resumes
   *
   * @param {string} password - User's encryption password
   * @returns {Promise<boolean>} - True if password is correct
   */
  unlock: async (password) => {
    const state = get();

    if (!state.isSetupComplete) {
      // New user - needs to setup encryption first
      set({ lastError: 'Encryption not setup - please create a password' });
      return false;
    }

    try {
      const storedHash = await AsyncStorage.getItem(STORAGE_KEYS.KEY_VERIFICATION_HASH);

      if (!storedHash) {
        set({ lastError: 'Encryption setup corrupted - no verification hash' });
        return false;
      }

      const isValid = await verifyPassword(password, storedHash);

      if (!isValid) {
        set({
          isUnlocked: false,
          encryptionKey: null,
          lastError: 'Incorrect password',
        });
        return false;
      }

      set({
        isUnlocked: true,
        encryptionKey: password,
        lastError: null,
      });

      console.log('[EncryptionStore] Vault unlocked');
      return true;
    } catch (error) {
      console.error('[EncryptionStore] Unlock failed:', error);
      set({ lastError: error.message });
      return false;
    }
  },

  /**
   * Lock the vault (clear key from memory)
   * Call on logout or app background
   */
  lock: () => {
    set({
      isUnlocked: false,
      encryptionKey: null,
    });
    console.log('[EncryptionStore] Vault locked - key cleared from memory');
  },

  /**
   * Change encryption password
   *
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success
   */
  changePassword: async (currentPassword, newPassword) => {
    if (newPassword.length < 8) {
      set({ lastError: 'New password must be at least 8 characters' });
      return false;
    }

    try {
      // Verify current password
      const storedHash = await AsyncStorage.getItem(STORAGE_KEYS.KEY_VERIFICATION_HASH);
      const isValid = await verifyPassword(currentPassword, storedHash);

      if (!isValid) {
        set({ lastError: 'Current password is incorrect' });
        return false;
      }

      // Generate new verification hash
      const newVerificationHash = await generateKeyVerificationHash(newPassword);

      // Store new hash
      await AsyncStorage.setItem(STORAGE_KEYS.KEY_VERIFICATION_HASH, newVerificationHash);

      // Update in-memory key
      set({
        encryptionKey: newPassword,
        lastError: null,
      });

      console.log('[EncryptionStore] Password changed - existing data needs re-encryption');
      return true;
    } catch (error) {
      console.error('[EncryptionStore] Change password failed:', error);
      set({ lastError: error.message });
      return false;
    }
  },

  /**
   * Encrypt data using current session key
   * ALWAYS encrypts - this is not optional
   *
   * @param {any} data - Data to encrypt
   * @returns {Promise<string|null>} - Encrypted base64 string or null if vault locked
   */
  encryptData: async (data) => {
    const state = get();

    if (!state.isUnlocked || !state.encryptionKey) {
      console.error('[EncryptionStore] Cannot encrypt - vault is locked');
      return null;
    }

    try {
      return await encrypt(data, state.encryptionKey);
    } catch (error) {
      console.error('[EncryptionStore] Encryption failed:', error);
      set({ lastError: error.message });
      return null;
    }
  },

  /**
   * Decrypt data using current session key
   *
   * @param {string} encryptedData - Encrypted base64 string
   * @returns {Promise<any|null>} - Decrypted data or null if failed
   */
  decryptData: async (encryptedData) => {
    const state = get();

    if (!state.isUnlocked || !state.encryptionKey) {
      console.error('[EncryptionStore] Cannot decrypt - vault is locked');
      return null;
    }

    try {
      return await decrypt(encryptedData, state.encryptionKey);
    } catch (error) {
      console.error('[EncryptionStore] Decryption failed:', error);
      set({ lastError: error.message });
      return null;
    }
  },

  /**
   * Encrypt data with some fields as plaintext metadata
   * Useful for data that needs to be searchable/sortable by timestamp
   *
   * @param {object} data - Object to encrypt
   * @param {string[]} metadataFields - Fields to keep as plaintext
   * @returns {Promise<object|null>} - Encrypted object with metadata
   */
  encryptWithMetadata: async (data, metadataFields = ['id', 'createdAt', 'updatedAt']) => {
    const state = get();

    if (!state.isUnlocked || !state.encryptionKey) {
      console.error('[EncryptionStore] Cannot encrypt - vault is locked');
      return null;
    }

    try {
      return await encryptWithMetadata(data, state.encryptionKey, metadataFields);
    } catch (error) {
      console.error('[EncryptionStore] Encrypt with metadata failed:', error);
      set({ lastError: error.message });
      return null;
    }
  },

  /**
   * Decrypt data that was encrypted with metadata
   *
   * @param {object} encryptedData - Encrypted object with _encrypted field
   * @returns {Promise<object|null>} - Decrypted object
   */
  decryptWithMetadata: async (encryptedData) => {
    const state = get();

    if (!encryptedData?._encrypted) {
      return encryptedData; // Not encrypted data, return as-is
    }

    if (!state.isUnlocked || !state.encryptionKey) {
      console.error('[EncryptionStore] Cannot decrypt - vault is locked');
      return null;
    }

    try {
      return await decryptWithMetadata(encryptedData, state.encryptionKey);
    } catch (error) {
      console.error('[EncryptionStore] Decrypt with metadata failed:', error);
      set({ lastError: error.message });
      return null;
    }
  },

  /**
   * Check if data is encrypted
   *
   * @param {any} data - Data to check
   * @returns {boolean} - True if data is encrypted
   */
  isEncrypted: (data) => {
    if (typeof data === 'object' && data !== null) {
      return '_encrypted' in data;
    }
    // Check if it's a base64 encrypted string (starts with version byte)
    if (typeof data === 'string' && data.length > 50) {
      try {
        // Our encrypted format starts with version 1 (0x01 in base64)
        return data.startsWith('AQ'); // Base64 of [0x01]
      } catch {
        return false;
      }
    }
    return false;
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ lastError: null });
  },

  // ===========================================================================
  // RECOVERY SYSTEM (Weighted Threshold with Keystone)
  // ===========================================================================

  /**
   * Check if user has set up recovery questions
   */
  hasRecoverySetup: async () => {
    const hasSetup = await AsyncStorage.getItem(STORAGE_KEYS.HAS_RECOVERY_SETUP);
    return hasSetup === 'true';
  },

  /**
   * Get default security questions
   */
  getSecurityQuestions: () => DEFAULT_SECURITY_QUESTIONS,

  /**
   * Setup recovery system with security questions
   * Call this after user sets up encryption password
   *
   * @param {Object[]} questionsWithAnswers - Array of {questionId, answer}
   * @returns {Promise<{success: boolean, recoveryPhrase: string[]}>}
   */
  setupRecoveryQuestions: async (questionsWithAnswers) => {
    try {
      // Generate recovery phrase
      const recoveryPhrase = await generateRecoveryPhrase();

      // Create encrypted vault from security questions
      const vault = await setupRecovery(recoveryPhrase, questionsWithAnswers);

      // Store vault locally (also synced to Supabase by rekeyingService)
      await AsyncStorage.setItem(STORAGE_KEYS.RECOVERY_VAULT, JSON.stringify(vault));
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_RECOVERY_SETUP, 'true');

      console.log('[EncryptionStore] Recovery system configured');

      // Return the phrase - USER MUST SAVE THIS!
      return {
        success: true,
        recoveryPhrase, // Show this to user once, they must write it down
      };
    } catch (error) {
      console.error('[EncryptionStore] Recovery setup failed:', error);
      set({ lastError: error.message });
      return { success: false, recoveryPhrase: null };
    }
  },

  /**
   * Recover account using security questions
   * Requires Q3 (keystone) + any 2 other correct answers
   *
   * @param {Object[]} answeredQuestions - Array of {questionId, answer}
   * @param {string} newPassword - New password to set
   * @param {Object[]} newQuestionsWithAnswers - New security question answers
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<{success: boolean, newRecoveryPhrase: string[]}>}
   */
  recoverAccount: async (answeredQuestions, newPassword, newQuestionsWithAnswers, onProgress = () => {}) => {
    try {
      // Load vault
      const vaultJson = await AsyncStorage.getItem(STORAGE_KEYS.RECOVERY_VAULT);
      if (!vaultJson) {
        throw new Error('No recovery vault found. Recovery not set up.');
      }
      const vault = JSON.parse(vaultJson);

      // Perform full recovery (decrypt old data, re-encrypt with new password)
      const result = await performFullRecovery(
        answeredQuestions,
        vault,
        newPassword,
        newQuestionsWithAnswers
      );

      if (!result.success) {
        throw new Error('Recovery failed. Please verify your security question answers.');
      }

      // Perform re-keying (decrypt all data with old key, re-encrypt with new)
      const rekeyResult = await performRekey(
        result.recoveredPhrase,
        newPassword,
        newQuestionsWithAnswers,
        onProgress
      );

      // Update local storage with new verification hash and vault
      const newVerificationHash = await generateKeyVerificationHash(newPassword);
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.KEY_VERIFICATION_HASH, newVerificationHash],
        [STORAGE_KEYS.RECOVERY_VAULT, JSON.stringify(result.newVault)],
      ]);

      // Unlock with new password
      set({
        isUnlocked: true,
        encryptionKey: newPassword,
        lastError: null,
      });

      console.log('[EncryptionStore] Account recovered successfully');

      return {
        success: true,
        newRecoveryPhrase: rekeyResult.newRecoveryPhrase, // User must save this!
      };
    } catch (error) {
      console.error('[EncryptionStore] Account recovery failed:', error);
      set({ lastError: error.message });
      return { success: false, newRecoveryPhrase: null };
    }
  },

  /**
   * Update security questions (requires current password)
   *
   * @param {string} currentPassword - Current password to verify
   * @param {Object[]} newQuestionsWithAnswers - New security question answers
   * @returns {Promise<{success: boolean, newRecoveryPhrase: string[]}>}
   */
  updateSecurityQuestions: async (currentPassword, newQuestionsWithAnswers) => {
    const state = get();

    if (!state.isUnlocked) {
      set({ lastError: 'Vault must be unlocked to update security questions' });
      return { success: false };
    }

    try {
      // Verify current password
      const storedHash = await AsyncStorage.getItem(STORAGE_KEYS.KEY_VERIFICATION_HASH);
      const isValid = await verifyPassword(currentPassword, storedHash);

      if (!isValid) {
        set({ lastError: 'Incorrect password' });
        return { success: false };
      }

      // Generate new recovery phrase and vault
      const newRecoveryPhrase = await generateRecoveryPhrase();
      const newVault = await setupRecovery(newRecoveryPhrase, newQuestionsWithAnswers);

      // Store new vault
      await AsyncStorage.setItem(STORAGE_KEYS.RECOVERY_VAULT, JSON.stringify(newVault));

      console.log('[EncryptionStore] Security questions updated');

      return {
        success: true,
        newRecoveryPhrase, // User must save this!
      };
    } catch (error) {
      console.error('[EncryptionStore] Update security questions failed:', error);
      set({ lastError: error.message });
      return { success: false };
    }
  },
}));

/**
 * Hook for components to check encryption status
 */
export function useEncryptionReady() {
  const { isInitialized, isSetupComplete, isUnlocked, isSupported } = useEncryptionStore();

  return {
    // App is ready when initialized AND unlocked (or new user who needs setup)
    ready: isInitialized && isUnlocked,
    // User needs to set up encryption password (new user)
    needsSetup: isInitialized && !isSetupComplete,
    // User has setup but needs to unlock (returning user)
    needsUnlock: isInitialized && isSetupComplete && !isUnlocked,
    // Device supports encryption
    supported: isSupported,
  };
}

export default useEncryptionStore;
