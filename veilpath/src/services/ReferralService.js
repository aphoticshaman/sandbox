/**
 * Referral System Service
 *
 * Generates unique referral links for users to share
 * Tracks when referred users sign up
 * Awards both referrer AND referee when someone joins
 *
 * Flow:
 * 1. User generates their referral link (or copies from profile)
 * 2. They share it with friends
 * 3. Friend clicks link, lands on signup page with referral code in URL
 * 4. Friend signs up (just age verify, username, account - that's it)
 * 5. BOTH users get the "Better Together" achievement + rewards
 */

import { supabase } from './supabase';
import { Platform, Share, Clipboard } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

// Base URL for referral links (customize for production)
const REFERRAL_BASE_URL = Platform.OS === 'web'
  ? window.location.origin
  : 'https://veilpath.app';

// Rate limiting: Max link generations per day per user
const MAX_LINK_GENERATIONS_PER_DAY = 3;

// Referral rewards
const REFERRAL_REWARDS = {
  referrer: {
    shards: 500,
    achievement: 'better_together',
    titlePrefix: 'friendly', // "The Friendly ___"
    titleSuffix: 'friend',   // "___ Friend"
  },
  referee: {
    shards: 250,
    achievement: 'better_together',
    titlePrefix: 'friendly',
    titleSuffix: 'friend',
  },
  // Milestone bonuses for referrers
  milestones: {
    5: { shards: 1000, titlePrefix: 'welcoming', titleSuffix: 'connector' },
    10: { shards: 2500, titlePrefix: 'champion', titleSuffix: 'herald', cosmetic: 'community_champion_back' },
    25: { shards: 5000, titlePrefix: 'ambassador', titleSuffix: 'envoy', cosmetic: 'ambassador_aura' },
    50: { shards: 10000, achievement: 'legendary_recruiter' },
    100: { shards: 25000, achievement: 'veilpath_legend', cosmetic: 'legend_card_back' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRAL LINK GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a unique referral code for a user
 * Uses their user ID + a random suffix for uniqueness
 */
function generateReferralCode(userId) {
  // Take first 8 chars of user ID + random 4 chars
  const userPart = userId.replace(/-/g, '').substring(0, 8);
  const randomPart = Math.random().toString(36).substring(2, 6);
  return `${userPart}${randomPart}`.toUpperCase();
}

/**
 * Get or create referral code for current user
 * Rate limited to 3 link generations per day
 */
export async function getReferralCode() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Check if user already has a referral code
    let { data: existing } = await supabase
      .from('user_referrals')
      .select('referral_code, generation_count, last_generation_date')
      .eq('user_id', user.id)
      .single();

    if (existing?.referral_code) {
      return {
        success: true,
        code: existing.referral_code,
        url: `${REFERRAL_BASE_URL}/join?ref=${existing.referral_code}`,
        generationsToday: existing.generation_count || 0,
        maxGenerations: MAX_LINK_GENERATIONS_PER_DAY,
      };
    }

    // Check rate limiting for new code generation
    const today = new Date().toISOString().split('T')[0];
    let generationCount = 0;

    if (existing?.last_generation_date === today) {
      generationCount = existing.generation_count || 0;
      if (generationCount >= MAX_LINK_GENERATIONS_PER_DAY) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          message: `You can only generate ${MAX_LINK_GENERATIONS_PER_DAY} referral links per day. Try again tomorrow!`,
          generationsToday: generationCount,
          maxGenerations: MAX_LINK_GENERATIONS_PER_DAY,
        };
      }
    }

    // Generate new code
    const code = generateReferralCode(user.id);

    // Save it with generation tracking
    await supabase
      .from('user_referrals')
      .upsert({
        user_id: user.id,
        referral_code: code,
        created_at: new Date().toISOString(),
        generation_count: generationCount + 1,
        last_generation_date: today,
      });

    return {
      success: true,
      code,
      url: `${REFERRAL_BASE_URL}/join?ref=${code}`,
      generationsToday: generationCount + 1,
      maxGenerations: MAX_LINK_GENERATIONS_PER_DAY,
    };
  } catch (error) {
    console.error('[ReferralService] Failed to get referral code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get the full shareable referral URL
 */
export async function getReferralUrl() {
  const result = await getReferralCode();
  if (!result.success) return result;

  return {
    success: true,
    url: result.url,
    code: result.code,
  };
}

/**
 * Copy referral link to clipboard
 */
export async function copyReferralLink() {
  const result = await getReferralUrl();
  if (!result.success) return result;

  try {
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(result.url);
    } else {
      Clipboard.setString(result.url);
    }

    return { success: true, url: result.url, message: 'Link copied!' };
  } catch (error) {
    return { success: false, error: 'Failed to copy' };
  }
}

/**
 * Share referral link via native share sheet
 */
export async function shareReferralLink() {
  const result = await getReferralUrl();
  if (!result.success) return result;

  try {
    await Share.share({
      message: `Join me on VeilPath! Get your free tarot readings and explore your mystic journey. ${result.url}`,
      url: result.url,
      title: 'Join VeilPath',
    });

    return { success: true };
  } catch (error) {
    if (error.message !== 'User did not share') {
      console.error('[ReferralService] Share failed:', error);
    }
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRAL TRACKING & REDEMPTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Look up who owns a referral code
 */
export async function lookupReferralCode(code) {
  if (!code) return { success: false, error: 'No code provided' };

  try {
    const { data, error } = await supabase
      .from('user_referrals')
      .select('user_id, referral_code')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid referral code' };
    }

    return { success: true, referrerId: data.user_id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Record that a new user was referred
 * Called after signup completes
 */
export async function recordReferral(referralCode, newUserId) {
  if (!referralCode || !newUserId) {
    return { success: false, error: 'Missing data' };
  }

  try {
    // Look up the referrer
    const lookupResult = await lookupReferralCode(referralCode);
    if (!lookupResult.success) {
      return lookupResult;
    }

    const referrerId = lookupResult.referrerId;

    // Don't allow self-referral
    if (referrerId === newUserId) {
      return { success: false, error: 'Cannot refer yourself' };
    }

    // Check if this user was already referred
    const { data: existing } = await supabase
      .from('referral_completions')
      .select('id')
      .eq('referee_id', newUserId)
      .single();

    if (existing) {
      return { success: false, error: 'User already referred' };
    }

    // Record the referral
    const { error: insertError } = await supabase
      .from('referral_completions')
      .insert({
        referrer_id: referrerId,
        referee_id: newUserId,
        referral_code: referralCode.toUpperCase(),
        completed_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // Get referrer's total referral count for milestone checking
    const { count } = await supabase
      .from('referral_completions')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', referrerId);

    return {
      success: true,
      referrerId,
      refereeId: newUserId,
      referrerTotalReferrals: count,
      rewards: {
        referrer: REFERRAL_REWARDS.referrer,
        referee: REFERRAL_REWARDS.referee,
        milestone: REFERRAL_REWARDS.milestones[count] || null,
      },
    };
  } catch (error) {
    console.error('[ReferralService] Failed to record referral:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get referral stats for current user
 */
export async function getReferralStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get referral code
    const codeResult = await getReferralCode();

    // Get completed referrals
    const { data: referrals, count } = await supabase
      .from('referral_completions')
      .select('referee_id, completed_at', { count: 'exact' })
      .eq('referrer_id', user.id)
      .order('completed_at', { ascending: false });

    // Check who referred this user (if anyone)
    const { data: referredBy } = await supabase
      .from('referral_completions')
      .select('referrer_id, completed_at')
      .eq('referee_id', user.id)
      .single();

    // Calculate next milestone
    let nextMilestone = null;
    const milestoneKeys = Object.keys(REFERRAL_REWARDS.milestones).map(Number).sort((a, b) => a - b);
    for (const milestone of milestoneKeys) {
      if (count < milestone) {
        nextMilestone = {
          target: milestone,
          current: count,
          remaining: milestone - count,
          rewards: REFERRAL_REWARDS.milestones[milestone],
        };
        break;
      }
    }

    return {
      success: true,
      code: codeResult.code,
      url: codeResult.url,
      totalReferrals: count || 0,
      recentReferrals: referrals || [],
      referredBy: referredBy?.referrer_id || null,
      nextMilestone,
    };
  } catch (error) {
    console.error('[ReferralService] Failed to get stats:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get top referrers leaderboard
 */
export async function getReferralLeaderboard(limit = 10) {
  try {
    const { data, error } = await supabase
      .rpc('get_referral_leaderboard', { limit_count: limit });

    if (error) throw error;

    return { success: true, leaderboard: data };
  } catch (error) {
    console.error('[ReferralService] Leaderboard fetch failed:', error);
    return { success: false, error: error.message, leaderboard: [] };
  }
}

export default {
  // Link generation
  getReferralCode,
  getReferralUrl,
  copyReferralLink,
  shareReferralLink,

  // Tracking
  lookupReferralCode,
  recordReferral,
  getReferralStats,
  getReferralLeaderboard,

  // Constants
  REFERRAL_REWARDS,
};
