/**
 * ENCRYPTED STORAGE SERVICE
 * Drop-in replacement for AsyncStorage with automatic encryption
 *
 * This wraps AsyncStorage to provide transparent encryption/decryption
 * for sensitive data. Non-sensitive data can be stored normally.
 *
 * USAGE:
 * Instead of:   AsyncStorage.setItem('journal', JSON.stringify(data))
 * Use:          encryptedStorage.setItem('journal', data, true)  // true = encrypt
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEncryptionStore } from '../stores/encryptionStore';

// Prefix for encrypted items (helps identify what's encrypted)
const ENCRYPTED_PREFIX = 'enc_';

/**
 * Get encryption store state
 */
function getEncryptionState() {
  return useEncryptionStore.getState();
}

/**
 * Encrypted Storage wrapper
 */
const encryptedStorage = {
  /**
   * Store data with optional encryption
   *
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   * @param {boolean} shouldEncrypt - Whether to encrypt this data
   * @returns {Promise<void>}
   */
  async setItem(key, value, shouldEncrypt = false) {
    const encState = getEncryptionState();

    // If encryption requested and enabled
    if (shouldEncrypt && encState.isEncryptionEnabled) {
      if (!encState.isUnlocked) {
        throw new Error('[EncryptedStorage] Cannot store encrypted data - vault is locked');
      }

      const encrypted = await encState.encryptData(value);
      if (encrypted === null) {
        throw new Error('[EncryptedStorage] Encryption failed');
      }

      // Store with encrypted prefix marker
      await AsyncStorage.setItem(ENCRYPTED_PREFIX + key, encrypted);
      return;
    }

    // Normal storage (no encryption)
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  },

  /**
   * Retrieve data with automatic decryption
   *
   * @param {string} key - Storage key
   * @returns {Promise<any>} - Decrypted/parsed value or null
   */
  async getItem(key) {
    const encState = getEncryptionState();

    // First try to get encrypted version
    const encryptedValue = await AsyncStorage.getItem(ENCRYPTED_PREFIX + key);

    if (encryptedValue !== null) {
      // Data is encrypted
      if (!encState.isUnlocked) {
        throw new Error('[EncryptedStorage] Cannot read encrypted data - vault is locked');
      }

      const decrypted = await encState.decryptData(encryptedValue);
      if (decrypted === null) {
        throw new Error('[EncryptedStorage] Decryption failed');
      }

      return decrypted;
    }

    // Try normal (unencrypted) storage
    const normalValue = await AsyncStorage.getItem(key);
    if (normalValue === null) {
      return null;
    }

    // Try to parse as JSON
    try {
      return JSON.parse(normalValue);
    } catch {
      return normalValue;
    }
  },

  /**
   * Remove item (both encrypted and unencrypted versions)
   *
   * @param {string} key - Storage key
   */
  async removeItem(key) {
    await AsyncStorage.multiRemove([key, ENCRYPTED_PREFIX + key]);
  },

  /**
   * Check if an item exists (encrypted or not)
   *
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async hasItem(key) {
    const keys = await AsyncStorage.getAllKeys();
    return keys.includes(key) || keys.includes(ENCRYPTED_PREFIX + key);
  },

  /**
   * Check if an item is stored encrypted
   *
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async isEncrypted(key) {
    const keys = await AsyncStorage.getAllKeys();
    return keys.includes(ENCRYPTED_PREFIX + key);
  },

  /**
   * Migrate existing data to encrypted storage
   * Call this after user enables encryption
   *
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} - Success
   */
  async migrateToEncrypted(key) {
    const encState = getEncryptionState();

    if (!encState.isEncryptionEnabled || !encState.isUnlocked) {
      console.error('[EncryptedStorage] Cannot migrate - encryption not ready');
      return false;
    }

    try {
      // Check if already encrypted
      const isAlreadyEncrypted = await this.isEncrypted(key);
      if (isAlreadyEncrypted) {
        console.log(`[EncryptedStorage] Key "${key}" already encrypted`);
        return true;
      }

      // Get unencrypted data
      const plainData = await AsyncStorage.getItem(key);
      if (plainData === null) {
        console.log(`[EncryptedStorage] Key "${key}" not found, nothing to migrate`);
        return true;
      }

      // Parse if JSON
      let data;
      try {
        data = JSON.parse(plainData);
      } catch {
        data = plainData;
      }

      // Encrypt and store
      const encrypted = await encState.encryptData(data);
      if (encrypted === null) {
        throw new Error('Encryption failed');
      }

      // Store encrypted version
      await AsyncStorage.setItem(ENCRYPTED_PREFIX + key, encrypted);

      // Remove unencrypted version
      await AsyncStorage.removeItem(key);

      console.log(`[EncryptedStorage] Migrated "${key}" to encrypted storage`);
      return true;
    } catch (error) {
      console.error(`[EncryptedStorage] Migration failed for "${key}":`, error);
      return false;
    }
  },

  /**
   * Migrate data from encrypted back to plaintext
   * Call this if user disables encryption
   *
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} - Success
   */
  async migrateToPlaintext(key) {
    const encState = getEncryptionState();

    if (!encState.isUnlocked) {
      console.error('[EncryptedStorage] Cannot migrate - vault is locked');
      return false;
    }

    try {
      // Check if encrypted
      const encryptedData = await AsyncStorage.getItem(ENCRYPTED_PREFIX + key);
      if (encryptedData === null) {
        console.log(`[EncryptedStorage] Key "${key}" not encrypted, nothing to migrate`);
        return true;
      }

      // Decrypt
      const decrypted = await encState.decryptData(encryptedData);
      if (decrypted === null) {
        throw new Error('Decryption failed');
      }

      // Store plaintext version
      const stringValue = typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted);
      await AsyncStorage.setItem(key, stringValue);

      // Remove encrypted version
      await AsyncStorage.removeItem(ENCRYPTED_PREFIX + key);

      console.log(`[EncryptedStorage] Migrated "${key}" to plaintext storage`);
      return true;
    } catch (error) {
      console.error(`[EncryptedStorage] Migration failed for "${key}":`, error);
      return false;
    }
  },

  /**
   * Re-encrypt data with new password
   * Call this after user changes encryption password
   *
   * @param {string} key - Storage key
   * @param {string} oldPassword - Old encryption password
   * @param {string} newPassword - New encryption password
   * @returns {Promise<boolean>} - Success
   */
  async reencrypt(key, oldPassword, newPassword) {
    const { reencrypt: reencryptData } = require('../services/encryptionService');

    try {
      const encryptedData = await AsyncStorage.getItem(ENCRYPTED_PREFIX + key);
      if (encryptedData === null) {
        console.log(`[EncryptedStorage] Key "${key}" not encrypted, skipping re-encryption`);
        return true;
      }

      // Re-encrypt with new password
      const reencrypted = await reencryptData(encryptedData, oldPassword, newPassword);

      // Store re-encrypted version
      await AsyncStorage.setItem(ENCRYPTED_PREFIX + key, reencrypted);

      console.log(`[EncryptedStorage] Re-encrypted "${key}" with new password`);
      return true;
    } catch (error) {
      console.error(`[EncryptedStorage] Re-encryption failed for "${key}":`, error);
      return false;
    }
  },

  /**
   * Get all keys that are encrypted
   *
   * @returns {Promise<string[]>} - Array of encrypted keys (without prefix)
   */
  async getEncryptedKeys() {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys
      .filter(k => k.startsWith(ENCRYPTED_PREFIX))
      .map(k => k.slice(ENCRYPTED_PREFIX.length));
  },

  /**
   * Migrate all sensitive data to encrypted storage
   * Call this after user enables encryption
   *
   * @param {string[]} sensitiveKeys - Keys to migrate
   * @returns {Promise<{success: number, failed: number}>}
   */
  async migrateAllToEncrypted(sensitiveKeys) {
    let success = 0;
    let failed = 0;

    for (const key of sensitiveKeys) {
      const result = await this.migrateToEncrypted(key);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`[EncryptedStorage] Migration complete: ${success} success, ${failed} failed`);
    return { success, failed };
  },

  /**
   * Migrate all data back to plaintext
   * Call this if user disables encryption
   *
   * @returns {Promise<{success: number, failed: number}>}
   */
  async migrateAllToPlaintext() {
    const encryptedKeys = await this.getEncryptedKeys();
    let success = 0;
    let failed = 0;

    for (const key of encryptedKeys) {
      const result = await this.migrateToPlaintext(key);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`[EncryptedStorage] Migration to plaintext complete: ${success} success, ${failed} failed`);
    return { success, failed };
  },

  /**
   * Re-encrypt all data with new password
   *
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<{success: number, failed: number}>}
   */
  async reencryptAll(oldPassword, newPassword) {
    const encryptedKeys = await this.getEncryptedKeys();
    let success = 0;
    let failed = 0;

    for (const key of encryptedKeys) {
      const result = await this.reencrypt(key, oldPassword, newPassword);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`[EncryptedStorage] Re-encryption complete: ${success} success, ${failed} failed`);
    return { success, failed };
  },
};

// Also export individual functions for flexibility
export const {
  setItem,
  getItem,
  removeItem,
  hasItem,
  isEncrypted,
  migrateToEncrypted,
  migrateToPlaintext,
  reencrypt,
  getEncryptedKeys,
  migrateAllToEncrypted,
  migrateAllToPlaintext,
  reencryptAll,
} = encryptedStorage;

export default encryptedStorage;
