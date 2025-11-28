/**
 * ZERO-KNOWLEDGE ENCRYPTION SERVICE
 * Client-side encryption for user privacy
 *
 * SECURITY GUARANTEES:
 * - All data is encrypted BEFORE leaving the device
 * - Encryption keys are derived from user's password (never stored)
 * - Server (Supabase) only ever sees encrypted blobs
 * - NO ONE can read user data: not admins, not hackers, not the app owner
 * - Uses AES-256-GCM (authenticated encryption)
 * - PBKDF2 for key derivation (600,000 iterations)
 *
 * ARCHITECTURE:
 * User Password → PBKDF2 → Master Key → Encrypt Data → Store Encrypted Blob
 *
 * The ONLY way to decrypt is with the user's password.
 * If they forget it, data is PERMANENTLY LOST (that's the point).
 */

// Check for Web Crypto API availability
const getCrypto = () => {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto;
  }
  // React Native / Node.js fallback
  if (typeof global !== 'undefined' && global.crypto?.subtle) {
    return global.crypto;
  }
  // Try require for Node.js
  try {
    const nodeCrypto = require('crypto');
    if (nodeCrypto.webcrypto) {
      return nodeCrypto.webcrypto;
    }
  } catch (e) {
    // Not in Node.js environment
  }
  return null;
};

const crypto = getCrypto();

// Constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // bytes (96 bits recommended for GCM)
const SALT_LENGTH = 32; // bytes (256 bits)
const TAG_LENGTH = 128; // bits (authentication tag)
const PBKDF2_ITERATIONS = 600000; // OWASP recommended minimum for 2023+

// Version byte for future-proofing encrypted data format
const ENCRYPTION_VERSION = 1;

/**
 * Convert string to Uint8Array
 */
function stringToBytes(str) {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to string
 */
function bytesToString(bytes) {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert Uint8Array to base64
 */
function bytesToBase64(bytes) {
  if (typeof btoa !== 'undefined') {
    // Browser
    return btoa(String.fromCharCode(...bytes));
  }
  // Node.js / React Native
  return Buffer.from(bytes).toString('base64');
}

/**
 * Convert base64 to Uint8Array
 */
function base64ToBytes(base64) {
  if (typeof atob !== 'undefined') {
    // Browser
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  // Node.js / React Native
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Generate cryptographically secure random bytes
 */
function generateRandomBytes(length) {
  if (!crypto) {
    throw new Error('[Encryption] Web Crypto API not available');
  }
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Derive encryption key from password using PBKDF2
 * This is the core of zero-knowledge: the key NEVER leaves the client
 *
 * @param {string} password - User's password
 * @param {Uint8Array} salt - Random salt (stored with encrypted data)
 * @returns {Promise<CryptoKey>} - Derived encryption key
 */
async function deriveKey(password, salt) {
  if (!crypto?.subtle) {
    throw new Error('[Encryption] Web Crypto API not available');
  }

  // Import password as raw key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    stringToBytes(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    false, // Not extractable (security)
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypt data with user's password
 * Returns base64 string containing: version || salt || iv || ciphertext
 *
 * @param {string|object} data - Data to encrypt (will be JSON stringified if object)
 * @param {string} password - User's password
 * @returns {Promise<string>} - Base64 encoded encrypted data
 */
export async function encrypt(data, password) {
  if (!crypto?.subtle) {
    throw new Error('[Encryption] Web Crypto API not available. Cannot encrypt.');
  }

  if (!password || typeof password !== 'string' || password.length < 1) {
    throw new Error('[Encryption] Password is required for encryption');
  }

  // Convert data to string if object
  const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);

  // Generate random salt and IV
  const salt = generateRandomBytes(SALT_LENGTH);
  const iv = generateRandomBytes(IV_LENGTH);

  // Derive key from password
  const key = await deriveKey(password, salt);

  // Encrypt data
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    stringToBytes(plaintext)
  );

  // Combine version + salt + iv + ciphertext
  const combined = new Uint8Array(1 + SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
  combined[0] = ENCRYPTION_VERSION;
  combined.set(salt, 1);
  combined.set(iv, 1 + SALT_LENGTH);
  combined.set(new Uint8Array(ciphertext), 1 + SALT_LENGTH + IV_LENGTH);

  // Return as base64
  return bytesToBase64(combined);
}

/**
 * Decrypt data with user's password
 *
 * @param {string} encryptedBase64 - Base64 encoded encrypted data
 * @param {string} password - User's password
 * @returns {Promise<string|object>} - Decrypted data (parsed as JSON if valid)
 */
export async function decrypt(encryptedBase64, password) {
  if (!crypto?.subtle) {
    throw new Error('[Encryption] Web Crypto API not available. Cannot decrypt.');
  }

  if (!password || typeof password !== 'string') {
    throw new Error('[Encryption] Password is required for decryption');
  }

  if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
    throw new Error('[Encryption] Invalid encrypted data');
  }

  try {
    // Decode base64
    const combined = base64ToBytes(encryptedBase64);

    // Extract version
    const version = combined[0];
    if (version !== ENCRYPTION_VERSION) {
      throw new Error(`[Encryption] Unsupported encryption version: ${version}`);
    }

    // Extract salt, IV, and ciphertext
    const salt = combined.slice(1, 1 + SALT_LENGTH);
    const iv = combined.slice(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(1 + SALT_LENGTH + IV_LENGTH);

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH,
      },
      key,
      ciphertext
    );

    const decryptedString = bytesToString(new Uint8Array(plaintext));

    // Try to parse as JSON, return raw string if not valid JSON
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    // Don't reveal specific error details (security)
    if (error.name === 'OperationError') {
      throw new Error('[Encryption] Decryption failed - incorrect password or corrupted data');
    }
    throw error;
  }
}

/**
 * Check if Web Crypto API is available
 */
export function isEncryptionAvailable() {
  return !!(crypto?.subtle);
}

/**
 * Generate a secure encryption key verification hash
 * This is stored to verify the user entered the correct password
 * WITHOUT storing the password itself
 *
 * @param {string} password - User's password
 * @returns {Promise<string>} - Base64 encoded verification hash
 */
export async function generateKeyVerificationHash(password) {
  if (!crypto?.subtle) {
    throw new Error('[Encryption] Web Crypto API not available');
  }

  // Use a fixed "verification" salt (different from encryption salt)
  // This is safe because we're just verifying the key, not encrypting data
  const verificationSalt = stringToBytes('VeilPath_KeyVerification_v1');

  const key = await crypto.subtle.importKey(
    'raw',
    stringToBytes(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive verification bits
  const verificationBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: verificationSalt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256 // 256 bits = 32 bytes
  );

  return bytesToBase64(new Uint8Array(verificationBits));
}

/**
 * Verify that the provided password matches the stored verification hash
 *
 * @param {string} password - Password to verify
 * @param {string} storedHash - Previously generated verification hash
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, storedHash) {
  try {
    const computedHash = await generateKeyVerificationHash(password);
    // Constant-time comparison to prevent timing attacks
    return constantTimeEqual(computedHash, storedHash);
  } catch {
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Encrypt an object, preserving some fields as plaintext metadata
 * Useful for storing encrypted data with searchable metadata
 *
 * @param {object} data - Object to encrypt
 * @param {string} password - User's password
 * @param {string[]} metadataFields - Fields to keep as plaintext (e.g., ['id', 'createdAt'])
 * @returns {Promise<object>} - Object with encrypted payload and plaintext metadata
 */
export async function encryptWithMetadata(data, password, metadataFields = []) {
  if (typeof data !== 'object' || data === null) {
    throw new Error('[Encryption] Data must be an object');
  }

  // Extract metadata (plaintext)
  const metadata = {};
  const sensitiveData = { ...data };

  for (const field of metadataFields) {
    if (field in data) {
      metadata[field] = data[field];
      delete sensitiveData[field];
    }
  }

  // Encrypt sensitive data
  const encryptedPayload = await encrypt(sensitiveData, password);

  return {
    ...metadata,
    _encrypted: encryptedPayload,
    _encryptionVersion: ENCRYPTION_VERSION,
  };
}

/**
 * Decrypt an object that was encrypted with encryptWithMetadata
 *
 * @param {object} encryptedData - Object with _encrypted field
 * @param {string} password - User's password
 * @returns {Promise<object>} - Fully decrypted object
 */
export async function decryptWithMetadata(encryptedData, password) {
  if (!encryptedData?._encrypted) {
    throw new Error('[Encryption] Invalid encrypted data format');
  }

  // Decrypt payload
  const decryptedPayload = await decrypt(encryptedData._encrypted, password);

  // Merge with metadata
  const result = { ...decryptedPayload };

  // Add back metadata fields
  for (const [key, value] of Object.entries(encryptedData)) {
    if (key !== '_encrypted' && key !== '_encryptionVersion') {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Re-encrypt data with a new password (for password changes)
 *
 * @param {string} encryptedBase64 - Currently encrypted data
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<string>} - Re-encrypted data with new password
 */
export async function reencrypt(encryptedBase64, oldPassword, newPassword) {
  // Decrypt with old password
  const decrypted = await decrypt(encryptedBase64, oldPassword);

  // Re-encrypt with new password
  return encrypt(decrypted, newPassword);
}

/**
 * Encrypt multiple items in batch (for migrating existing data)
 *
 * @param {Array} items - Array of items to encrypt
 * @param {string} password - User's password
 * @param {string[]} metadataFields - Fields to keep as plaintext
 * @returns {Promise<Array>} - Array of encrypted items
 */
export async function encryptBatch(items, password, metadataFields = []) {
  const encrypted = [];

  for (const item of items) {
    try {
      const encryptedItem = await encryptWithMetadata(item, password, metadataFields);
      encrypted.push(encryptedItem);
    } catch (error) {
      console.error('[Encryption] Failed to encrypt item:', error);
      // Continue with other items
    }
  }

  return encrypted;
}

/**
 * Decrypt multiple items in batch
 *
 * @param {Array} items - Array of encrypted items
 * @param {string} password - User's password
 * @returns {Promise<Array>} - Array of decrypted items
 */
export async function decryptBatch(items, password) {
  const decrypted = [];

  for (const item of items) {
    try {
      if (item._encrypted) {
        const decryptedItem = await decryptWithMetadata(item, password);
        decrypted.push(decryptedItem);
      } else {
        // Item is not encrypted, pass through
        decrypted.push(item);
      }
    } catch (error) {
      console.error('[Encryption] Failed to decrypt item:', error);
      // Continue with other items
    }
  }

  return decrypted;
}

// Export for testing and direct use
export default {
  encrypt,
  decrypt,
  encryptWithMetadata,
  decryptWithMetadata,
  reencrypt,
  encryptBatch,
  decryptBatch,
  generateKeyVerificationHash,
  verifyPassword,
  isEncryptionAvailable,
  ENCRYPTION_VERSION,
};
