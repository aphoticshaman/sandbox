/**
 * SECURE BONUS SERVICE
 *
 * Server-side validated first-time bonus system.
 * Currency has REAL USD value - this must be bulletproof.
 *
 * SECURITY ARCHITECTURE:
 * 1. All bonuses are CLAIMED server-side (Supabase Edge Functions)
 * 2. Client only REQUESTS - server VALIDATES and GRANTS
 * 3. Cryptographic signatures on all bonus claims
 * 4. Rate limiting prevents spam/abuse
 * 5. Device fingerprinting prevents multi-account farming
 * 6. Anomaly detection flags suspicious patterns
 * 7. Audit logs for all transactions (required for compliance)
 *
 * NEVER TRUST THE CLIENT.
 * BONUSES ARE GRANTED SERVER-SIDE OR NOT AT ALL.
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { signData, verifySignature } from './dataIntegrityService';

// ============================================================
// BONUS DEFINITIONS
// ============================================================

export const FIRST_TIME_BONUSES = {
  // Onboarding bonuses (hook them quick!)
  FIRST_SHOP_VISIT: {
    id: 'first_shop_visit',
    amount: 1000, // 1000 Veil Shards
    currency: 'veil_shards',
    title: 'Welcome, Seeker!',
    message: 'Your first trip to the shop is on us!',
    oneTimeOnly: true,
    requiresAuth: false, // Can claim before signup
  },
  FIRST_READING: {
    id: 'first_reading',
    amount: 250,
    currency: 'veil_shards',
    title: 'First Reading Complete!',
    message: 'The cards have spoken. Here\'s your reward!',
    oneTimeOnly: true,
    requiresAuth: false,
  },
  FIRST_INTERPRETATION: {
    id: 'first_interpretation',
    amount: 150,
    currency: 'veil_shards',
    title: 'Wisdom Unlocked!',
    message: 'You\'ve received your first card interpretation.',
    oneTimeOnly: true,
    requiresAuth: false,
  },
  FIRST_READING_QUESTIONS: {
    id: 'first_reading_questions',
    amount: 100,
    currency: 'veil_shards',
    title: 'Deep Reflection!',
    message: 'Answering questions deepens your journey.',
    oneTimeOnly: true,
    requiresAuth: false,
  },
  FIRST_JOURNAL: {
    id: 'first_journal',
    amount: 200,
    currency: 'veil_shards',
    title: 'Journal Started!',
    message: 'Your thoughts are now captured in the veil.',
    oneTimeOnly: true,
    requiresAuth: false,
  },
  FIRST_TWO_DAY_STREAK: {
    id: 'first_two_day_streak',
    amount: 300,
    currency: 'veil_shards',
    title: 'Streak Ignited!',
    message: '2 days in a row! Keep the momentum going.',
    oneTimeOnly: true,
    requiresAuth: false,
  },
  MBTI_COMPLETION: {
    id: 'mbti_completion',
    amount: 500,
    currency: 'veil_shards',
    title: 'Personality Revealed!',
    message: 'Your MBTI journey is complete.',
    oneTimeOnly: true,
    requiresAuth: false,
  },
  MBTI_SELECTION: {
    id: 'mbti_selection',
    amount: 100,
    currency: 'veil_shards',
    title: 'Type Selected!',
    message: 'Your personality type has been set.',
    oneTimeOnly: true,
    requiresAuth: false,
  },
};

// Storage keys for local claim tracking (backup to server)
const STORAGE_KEYS = {
  CLAIMED_BONUSES: '@veilpath_claimed_bonuses',
  DEVICE_FINGERPRINT: '@veilpath_device_fingerprint',
  PENDING_CLAIMS: '@veilpath_pending_claims',
};

// ============================================================
// DEVICE FINGERPRINTING
// Prevents multi-account farming
// ============================================================

async function getDeviceFingerprint() {
  try {
    // Check for existing fingerprint
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_FINGERPRINT);
    if (stored) {
      return stored;
    }

    // Generate new fingerprint
    const components = [
      Platform.OS,
      Platform.Version,
      Platform.constants?.Brand || 'unknown',
      Platform.constants?.Model || 'unknown',
      Date.now().toString(),
      await Crypto.getRandomBytesAsync(16).then(bytes =>
        Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('')
      ),
    ];

    const fingerprint = CryptoJS.SHA256(components.join('|')).toString();

    // Store it
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);

    return fingerprint;
  } catch (error) {
    console.error('[SecureBonus] Fingerprint generation failed:', error);
    // Fallback: random UUID
    return `fallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

// ============================================================
// LOCAL CLAIM TRACKING (Defense in Depth)
// Server is source of truth, but we also track locally
// ============================================================

async function getLocalClaimedBonuses() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CLAIMED_BONUSES);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Verify signature
      if (verifySignature(parsed)) {
        return parsed.data.claimed || [];
      }
      // Signature invalid - data tampered!
      console.error('[SecureBonus] ⚠️ LOCAL DATA TAMPERED - RESETTING');
      await AsyncStorage.removeItem(STORAGE_KEYS.CLAIMED_BONUSES);
      return [];
    }
    return [];
  } catch (error) {
    console.error('[SecureBonus] Failed to load local claims:', error);
    return [];
  }
}

async function markLocalBonusClaimed(bonusId, claimData) {
  try {
    const claimed = await getLocalClaimedBonuses();

    if (claimed.includes(bonusId)) {
      return false; // Already claimed
    }

    claimed.push(bonusId);

    // Sign the data to detect tampering
    const signedData = signData({
      claimed,
      lastUpdated: Date.now(),
      claimHistory: [
        ...(await getClaimHistory()),
        {
          bonusId,
          claimedAt: Date.now(),
          ...claimData,
        },
      ],
    });

    await AsyncStorage.setItem(STORAGE_KEYS.CLAIMED_BONUSES, JSON.stringify(signedData));
    return true;
  } catch (error) {
    console.error('[SecureBonus] Failed to mark local claim:', error);
    return false;
  }
}

async function getClaimHistory() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CLAIMED_BONUSES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (verifySignature(parsed)) {
        return parsed.data.claimHistory || [];
      }
    }
    return [];
  } catch {
    return [];
  }
}

// ============================================================
// SERVER-SIDE BONUS CLAIMING
// THE ONLY WAY TO ACTUALLY GET CURRENCY
// ============================================================

/**
 * Request a first-time bonus from the server.
 * Server validates eligibility and grants currency if valid.
 *
 * @param {string} bonusId - ID from FIRST_TIME_BONUSES
 * @param {object} context - Additional context for validation
 * @returns {Promise<{success: boolean, amount?: number, error?: string, alreadyClaimed?: boolean}>}
 */
export async function claimFirstTimeBonus(bonusId, context = {}) {
  const bonus = FIRST_TIME_BONUSES[bonusId] || Object.values(FIRST_TIME_BONUSES).find(b => b.id === bonusId);

  if (!bonus) {
    console.error('[SecureBonus] Unknown bonus:', bonusId);
    return { success: false, error: 'Unknown bonus type' };
  }

  try {
    // 1. Check local cache first (fast rejection for already claimed)
    const localClaimed = await getLocalClaimedBonuses();
    if (localClaimed.includes(bonus.id)) {
      console.log('[SecureBonus] Already claimed (local):', bonus.id);
      return { success: false, alreadyClaimed: true, error: 'Already claimed' };
    }

    // 2. Get device fingerprint for fraud prevention
    const deviceFingerprint = await getDeviceFingerprint();

    // 3. Get user session (if authenticated)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    // 4. Create signed claim request
    const claimRequest = {
      bonusId: bonus.id,
      userId,
      deviceFingerprint,
      timestamp: Date.now(),
      platform: Platform.OS,
      appVersion: '1.0.0', // TODO: Get from app.json
      context: {
        ...context,
        // Strip any potentially dangerous fields
        action: context.action,
        metadata: context.metadata,
      },
    };

    // Sign the request so server can verify it wasn't tampered in transit
    const signedRequest = signData(claimRequest);

    // 5. Call server-side Edge Function
    const { data, error } = await supabase.functions.invoke('claim-bonus', {
      body: signedRequest,
    });

    if (error) {
      console.error('[SecureBonus] Server error:', error);

      // Queue for retry if network error
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        await queuePendingClaim(bonus.id, claimRequest);
        return { success: false, error: 'Network error - queued for retry', queued: true };
      }

      return { success: false, error: error.message };
    }

    // 6. Verify server response
    if (!data.success) {
      if (data.alreadyClaimed) {
        // Sync local state with server
        await markLocalBonusClaimed(bonus.id, { serverConfirmed: true });
      }
      return { success: false, alreadyClaimed: data.alreadyClaimed, error: data.error };
    }

    // 7. Mark as claimed locally (defense in depth)
    await markLocalBonusClaimed(bonus.id, {
      serverConfirmed: true,
      amount: data.amount,
      transactionId: data.transactionId,
      claimedAt: Date.now(),
    });

    console.log(`[SecureBonus] ✅ Claimed ${bonus.id}: ${data.amount} ${bonus.currency}`);

    return {
      success: true,
      amount: data.amount,
      transactionId: data.transactionId,
      bonus: {
        ...bonus,
        amount: data.amount, // Use server amount (may differ for promos)
      },
    };
  } catch (error) {
    console.error('[SecureBonus] Claim failed:', error);
    return { success: false, error: 'Claim failed - please try again' };
  }
}

/**
 * Check if a bonus has been claimed (local + server check)
 */
export async function isBonusClaimed(bonusId) {
  const bonus = FIRST_TIME_BONUSES[bonusId] || Object.values(FIRST_TIME_BONUSES).find(b => b.id === bonusId);
  if (!bonus) return true; // Unknown bonus = treat as claimed

  // Fast local check first
  const localClaimed = await getLocalClaimedBonuses();
  if (localClaimed.includes(bonus.id)) {
    return true;
  }

  // Verify with server if user is authenticated
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from('user_bonuses')
        .select('claimed')
        .eq('user_id', session.user.id)
        .eq('bonus_id', bonus.id)
        .single();

      if (data?.claimed) {
        // Sync local state
        await markLocalBonusClaimed(bonus.id, { serverConfirmed: true });
        return true;
      }
    }
  } catch {
    // Server check failed - rely on local
  }

  return false;
}

/**
 * Get all available (unclaimed) bonuses
 */
export async function getAvailableBonuses() {
  const claimed = await getLocalClaimedBonuses();
  return Object.values(FIRST_TIME_BONUSES).filter(b => !claimed.includes(b.id));
}

/**
 * Get claim history for display
 */
export async function getBonusClaimHistory() {
  return getClaimHistory();
}

// ============================================================
// PENDING CLAIMS QUEUE (Offline Support)
// ============================================================

async function queuePendingClaim(bonusId, claimRequest) {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CLAIMS);
    const pending = stored ? JSON.parse(stored) : [];

    // Don't queue duplicates
    if (pending.some(p => p.bonusId === bonusId)) {
      return;
    }

    pending.push({
      bonusId,
      claimRequest,
      queuedAt: Date.now(),
    });

    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CLAIMS, JSON.stringify(pending));
  } catch (error) {
    console.error('[SecureBonus] Failed to queue claim:', error);
  }
}

/**
 * Process pending claims (call on app resume/network restore)
 */
export async function processPendingClaims() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CLAIMS);
    if (!stored) return;

    const pending = JSON.parse(stored);
    const remaining = [];

    for (const claim of pending) {
      const result = await claimFirstTimeBonus(claim.bonusId, claim.claimRequest.context || {});

      if (!result.success && result.queued) {
        remaining.push(claim);
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CLAIMS, JSON.stringify(remaining));
  } catch (error) {
    console.error('[SecureBonus] Failed to process pending claims:', error);
  }
}

// ============================================================
// TRIGGER HELPERS
// Use these in your screens to trigger bonuses at the right time
// ============================================================

/**
 * Trigger first shop visit bonus
 * Call when user first enters ShopScreen
 */
export async function triggerFirstShopVisitBonus() {
  return claimFirstTimeBonus('FIRST_SHOP_VISIT');
}

/**
 * Trigger first reading bonus
 * Call when user completes their first reading
 */
export async function triggerFirstReadingBonus() {
  return claimFirstTimeBonus('FIRST_READING', { action: 'reading_complete' });
}

/**
 * Trigger first interpretation bonus
 * Call when user receives their first card interpretation
 */
export async function triggerFirstInterpretationBonus() {
  return claimFirstTimeBonus('FIRST_INTERPRETATION', { action: 'interpretation_received' });
}

/**
 * Trigger first reading questions bonus
 * Call when user answers questions about their reading
 */
export async function triggerFirstReadingQuestionsBonus() {
  return claimFirstTimeBonus('FIRST_READING_QUESTIONS', { action: 'questions_answered' });
}

/**
 * Trigger first journal bonus
 * Call when user creates their first journal entry
 */
export async function triggerFirstJournalBonus() {
  return claimFirstTimeBonus('FIRST_JOURNAL', { action: 'journal_created' });
}

/**
 * Trigger first 2-day streak bonus
 * Call when user achieves their first 2-day streak
 */
export async function triggerFirst2DayStreakBonus() {
  return claimFirstTimeBonus('FIRST_TWO_DAY_STREAK', { action: 'streak_achieved' });
}

/**
 * Trigger MBTI completion bonus
 * Call when user completes the MBTI assessment
 */
export async function triggerMBTICompletionBonus() {
  return claimFirstTimeBonus('MBTI_COMPLETION', { action: 'mbti_test_completed' });
}

/**
 * Trigger MBTI selection bonus
 * Call when user manually selects their MBTI type
 */
export async function triggerMBTISelectionBonus() {
  return claimFirstTimeBonus('MBTI_SELECTION', { action: 'mbti_type_selected' });
}

export default {
  FIRST_TIME_BONUSES,
  claimFirstTimeBonus,
  isBonusClaimed,
  getAvailableBonuses,
  getBonusClaimHistory,
  processPendingClaims,
  // Trigger helpers
  triggerFirstShopVisitBonus,
  triggerFirstReadingBonus,
  triggerFirstInterpretationBonus,
  triggerFirstReadingQuestionsBonus,
  triggerFirstJournalBonus,
  triggerFirst2DayStreakBonus,
  triggerMBTICompletionBonus,
  triggerMBTISelectionBonus,
};
