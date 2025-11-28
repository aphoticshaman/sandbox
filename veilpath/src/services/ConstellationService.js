/**
 * Constellation Card Back Service
 *
 * Manages the "Growing Constellation" community card back that grows with referrals.
 *
 * The constellation:
 * - Starts with a blank navy/black sky, crescent moon, meadow with fireflies
 * - Each referral in the community adds a star to the sky
 * - Only referrers and referees can use this card back
 * - Updated nightly at 12:01 AM via cron job
 *
 * Flow:
 * 1. User refers someone → both become constellation participants
 * 2. Nightly cron job counts new referrals, generates star positions
 * 3. AI/Image service regenerates the constellation image with new stars
 * 4. Asset URL is updated, users see the new sky on their next card flip
 */

import { supabase } from './supabase';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTELLATION STATE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the current constellation state
 * Returns total stars, last update time, and asset URL
 */
export async function getConstellationState() {
  try {
    const { data, error } = await supabase
      .from('constellation_state')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;

    return {
      success: true,
      totalStars: data.total_stars,
      lastUpdated: data.last_updated,
      assetVersion: data.asset_version,
      assetUrl: data.asset_url,
    };
  } catch (error) {
    console.error('[ConstellationService] Failed to get state:', error);
    return {
      success: false,
      error: error.message,
      totalStars: 0,
      assetUrl: '/assets/cosmetics/cardbacks/growing_constellation_v1.png',
    };
  }
}

/**
 * Get all star positions for rendering (if doing client-side rendering)
 */
export async function getStarPositions(limit = 1000) {
  try {
    const { data, error } = await supabase
      .from('constellation_stars')
      .select('star_position, added_at')
      .order('added_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      stars: data.map(s => ({
        ...s.star_position,
        addedAt: s.added_at,
      })),
      count: data.length,
    };
  } catch (error) {
    console.error('[ConstellationService] Failed to get stars:', error);
    return { success: false, error: error.message, stars: [], count: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER ELIGIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if current user can use the constellation card back
 * Must be a referrer OR referee to be eligible
 */
export async function canUseConstellation() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, eligible: false, error: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase
      .rpc('can_use_constellation', { p_user_id: user.id });

    if (error) throw error;

    return {
      success: true,
      eligible: data === true,
    };
  } catch (error) {
    console.error('[ConstellationService] Eligibility check failed:', error);
    return { success: false, eligible: false, error: error.message };
  }
}

/**
 * Get user's constellation participation details
 */
export async function getUserConstellationStatus() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const { data: participation } = await supabase
      .from('constellation_participants')
      .select('participation_type, first_participation_at, cosmetic_unlocked')
      .eq('user_id', user.id)
      .single();

    const stateResult = await getConstellationState();

    return {
      success: true,
      isParticipant: !!participation,
      participationType: participation?.participation_type || null,
      firstParticipation: participation?.first_participation_at || null,
      cosmeticUnlocked: participation?.cosmetic_unlocked || false,
      totalCommunityStars: stateResult.totalStars,
      assetUrl: stateResult.assetUrl,
    };
  } catch (error) {
    console.error('[ConstellationService] Status check failed:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRON/ADMIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Trigger nightly constellation update (admin only)
 * This is normally called by cron, but can be triggered manually
 */
export async function triggerNightlyUpdate() {
  try {
    const { data, error } = await supabase
      .rpc('update_constellation_nightly');

    if (error) throw error;

    return {
      success: true,
      result: data,
    };
  } catch (error) {
    console.error('[ConstellationService] Nightly update failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get recent cron run history (for admin dashboard)
 */
export async function getCronHistory(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('constellation_cron_runs')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, runs: data };
  } catch (error) {
    console.error('[ConstellationService] Cron history fetch failed:', error);
    return { success: false, error: error.message, runs: [] };
  }
}

/**
 * Mark asset as regenerated (called after AI service generates new image)
 */
export async function markAssetRegenerated(batchId, newAssetUrl) {
  try {
    // Update cron run record
    await supabase
      .from('constellation_cron_runs')
      .update({ asset_regenerated: true })
      .eq('batch_id', batchId);

    // Update constellation state with new asset URL
    await supabase
      .from('constellation_state')
      .update({
        asset_url: newAssetUrl,
        last_updated: new Date().toISOString(),
      });

    return { success: true };
  } catch (error) {
    console.error('[ConstellationService] Asset update failed:', error);
    return { success: false, error: error.message };
  }
}

export default {
  // State
  getConstellationState,
  getStarPositions,

  // User eligibility
  canUseConstellation,
  getUserConstellationStatus,

  // Admin/Cron
  triggerNightlyUpdate,
  getCronHistory,
  markAssetRegenerated,
};
