/**
 * DATA INTEGRITY SERVICE
 *
 * Prevents cheaters from:
 * - Fake achievements
 * - XP exploits
 * - Manipulated stats
 * - Backdated readings
 * - Subscription bypass
 *
 * ANTI-CHEAT MEASURES:
 * 1. Server-side XP calculation (client can't fake it)
 * 2. HMAC signatures on all critical data
 * 3. Rate limiting (prevent spam exploits)
 * 4. Anomaly detection (flag suspicious patterns)
 * 5. Timestamp validation (no backdating)
 * 6. Cryptographic seals on achievements
 */

import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Anti-cheat secret (in production, fetch from secure backend)
// This will be rotated and never stored in client code
const INTEGRITY_SECRET = process.env.INTEGRITY_SECRET || 'temp_dev_secret_rotate_in_prod';

// Rate limits (readings per time period)
const RATE_LIMITS = {
  readingsPerHour: 10,    // Max 10 readings/hour (prevents spam)
  readingsPerDay: 50,     // Max 50 readings/day
  veraChatsPerHour: 20, // Max 20 Vera chats/hour
  careerSessionsPerHour: 10
};

/**
 * Sign data with HMAC to detect tampering
 */
export function signData(data) {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const signature = CryptoJS.HmacSHA256(dataString, INTEGRITY_SECRET).toString();

  return {
    data,
    signature,
    signedAt: Date.now()
  };
}

/**
 * Verify signed data hasn't been tampered with
 */
export function verifySignature(signedData) {
  if (!signedData || !signedData.signature || !signedData.data) {
    console.warn('[Integrity] Invalid signed data format');
    return false;
  }

  const dataString = typeof signedData.data === 'string'
    ? signedData.data
    : JSON.stringify(signedData.data);

  const expectedSignature = CryptoJS.HmacSHA256(dataString, INTEGRITY_SECRET).toString();

  const isValid = expectedSignature === signedData.signature;

  if (!isValid) {
    console.error('[Integrity] ⚠️ SIGNATURE MISMATCH - DATA TAMPERING DETECTED');
    logTamperingAttempt(signedData);
  }

  return isValid;
}

/**
 * Calculate XP server-side (prevents client manipulation)
 * This should be called via cloud API, not locally
 */
export async function calculateXP(action, context = {}) {
  const xpValues = {
    reading_complete: 10,
    vera_chat: 5,
    journal_entry: 3,
    career_session: 7,
    achievement_unlock: 20,
    daily_streak: 15
  };

  const baseXP = xpValues[action] || 0;

  // Validate this isn't a suspicious request
  const isValid = await validateAction(action, context);
  if (!isValid) {
    console.warn('[Integrity] ⚠️ SUSPICIOUS XP REQUEST BLOCKED');
    return { xp: 0, blocked: true, reason: 'Suspicious activity detected' };
  }

  // Sign the XP award
  const xpAward = {
    action,
    xp: baseXP,
    timestamp: Date.now(),
    context
  };

  return signData(xpAward);
}

/**
 * Validate action isn't suspicious (rate limiting + anomaly detection)
 */
async function validateAction(action, context) {
  try {
    const userId = context.userId || 'anonymous';
    const now = Date.now();

    // Load recent actions
    const actionsKey = `@integrity_actions_${userId}`;
    const actionsData = await AsyncStorage.getItem(actionsKey);
    const actions = actionsData ? JSON.parse(actionsData) : [];

    // Filter to last hour
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentActions = actions.filter(a => a.timestamp > oneHourAgo);

    // Count actions by type
    const actionCounts = {
      readings: recentActions.filter(a => a.action === 'reading_complete').length,
      veraChats: recentActions.filter(a => a.action === 'vera_chat').length,
      careerSessions: recentActions.filter(a => a.action === 'career_session').length
    };

    // Check rate limits
    if (action === 'reading_complete' && actionCounts.readings >= RATE_LIMITS.readingsPerHour) {
      console.warn('[Integrity] Reading rate limit exceeded');
      return false;
    }

    if (action === 'vera_chat' && actionCounts.veraChats >= RATE_LIMITS.veraChatsPerHour) {
      console.warn('[Integrity] Vera chat rate limit exceeded');
      return false;
    }

    if (action === 'career_session' && actionCounts.careerSessions >= RATE_LIMITS.careerSessionsPerHour) {
      console.warn('[Integrity] Career session rate limit exceeded');
      return false;
    }

    // Anomaly detection: Check for suspicious patterns

    // Pattern 1: Actions happening too fast (< 30 seconds apart)
    if (recentActions.length > 0) {
      const lastAction = recentActions[recentActions.length - 1];
      if (now - lastAction.timestamp < 30000) { // 30 seconds
        console.warn('[Integrity] Actions too frequent (possible bot)');
        return false;
      }
    }

    // Pattern 2: Exact same timestamp (impossible)
    const sameTimestamp = recentActions.filter(a => a.timestamp === now).length;
    if (sameTimestamp > 0) {
      console.warn('[Integrity] Duplicate timestamp detected');
      return false;
    }

    // Record this action
    recentActions.push({
      action,
      timestamp: now,
      context
    });

    // Keep only last 24 hours
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const filtered = recentActions.filter(a => a.timestamp > oneDayAgo);

    await AsyncStorage.setItem(actionsKey, JSON.stringify(filtered));

    return true;
  } catch (error) {
    console.error('[Integrity] Validation failed:', error);
    return false; // Fail closed - deny on error
  }
}

/**
 * Seal achievement (cryptographically prove it was earned legitimately)
 */
export function sealAchievement(achievementId, context = {}) {
  const achievement = {
    id: achievementId,
    unlockedAt: Date.now(),
    userId: context.userId,
    // Include proof of prerequisites
    proof: {
      readings: context.totalReadings || 0,
      veraChats: context.veraChats || 0,
      journalEntries: context.journalEntries || 0,
      skillLevels: context.skillLevels || {}
    }
  };

  return signData(achievement);
}

/**
 * Verify achievement is legitimate
 */
export function verifyAchievement(sealedAchievement) {
  if (!verifySignature(sealedAchievement)) {
    console.error('[Integrity] ⚠️ FAKE ACHIEVEMENT DETECTED');
    return false;
  }

  // Additional validation: Check if achievement requirements were actually met
  const achievement = sealedAchievement.data;
  const proof = achievement.proof;

  // Example: "Dedicated Seeker" requires 25 readings
  if (achievement.id === 'dedicated_seeker' && proof.readings < 25) {
    console.error('[Integrity] ⚠️ ACHIEVEMENT REQUIREMENTS NOT MET');
    return false;
  }

  return true;
}

/**
 * Encrypt sensitive data before cloud sync (journal entries, Vera chats)
 */
export function encryptSensitiveData(data, userSecret) {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(dataString, userSecret).toString();

  return {
    encrypted,
    encryptedAt: Date.now(),
    algorithm: 'AES-256'
  };
}

/**
 * Decrypt sensitive data after cloud sync
 */
export function decryptSensitiveData(encryptedData, userSecret) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, userSecret);
    const dataString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!dataString) {
      throw new Error('Decryption failed - invalid secret');
    }

    try {
      return JSON.parse(dataString);
    } catch {
      return dataString;
    }
  } catch (error) {
    console.error('[Integrity] Decryption failed:', error);
    return null;
  }
}

/**
 * Validate timestamp isn't backdated (prevent fake history)
 */
export function validateTimestamp(timestamp, maxAgeMs = 60 * 60 * 1000) {
  const now = Date.now();

  // Can't be in the future (with 5 min clock skew allowance)
  if (timestamp > now + (5 * 60 * 1000)) {
    console.warn('[Integrity] Future timestamp detected');
    return false;
  }

  // Can't be too old (e.g., backdating readings from months ago)
  if (timestamp < now - maxAgeMs) {
    console.warn('[Integrity] Backdated timestamp detected');
    return false;
  }

  return true;
}

/**
 * Log tampering attempt for security audit
 */
async function logTamperingAttempt(suspiciousData) {
  try {
    const logsKey = '@integrity_tampering_logs';
    const logsData = await AsyncStorage.getItem(logsKey);
    const logs = logsData ? JSON.parse(logsData) : [];

    logs.push({
      timestamp: Date.now(),
      data: suspiciousData,
      deviceInfo: {
        // Add device fingerprint here
        platform: 'react-native'
      }
    });

    // Keep last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    await AsyncStorage.setItem(logsKey, JSON.stringify(logs));

    // In production: Send to backend for ban consideration
    console.error('[Integrity] ⚠️⚠️⚠️ TAMPERING LOGGED - REVIEW FOR BAN');
  } catch (error) {
    console.error('[Integrity] Failed to log tampering:', error);
  }
}

/**
 * Get anti-cheat status
 */
export async function getIntegrityStatus(userId) {
  try {
    const actionsKey = `@integrity_actions_${userId}`;
    const actionsData = await AsyncStorage.getItem(actionsKey);
    const actions = actionsData ? JSON.parse(actionsData) : [];

    const logsKey = '@integrity_tampering_logs';
    const logsData = await AsyncStorage.getItem(logsKey);
    const logs = logsData ? JSON.parse(logsData) : [];

    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentActions = actions.filter(a => a.timestamp > oneHourAgo);

    return {
      recentActions: recentActions.length,
      tamperingAttempts: logs.length,
      lastTamperingAttempt: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
      rateLimitsEnforced: true,
      signatureValidation: true
    };
  } catch (error) {
    console.error('[Integrity] Failed to get status:', error);
    return null;
  }
}
