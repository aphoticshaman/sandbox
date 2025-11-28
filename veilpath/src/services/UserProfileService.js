/**
 * User Profile Service
 *
 * Manages public user profiles, usernames, showcases, and profile stats.
 * Card backs serve as avatars - displayed as thumbnails next to usernames.
 *
 * Features:
 * - Username creation and validation
 * - Public profile management
 * - Showcase (up to 6 featured items)
 * - Profile stats for public display
 * - Card back as avatar (static or animated thumbnail)
 */

import { supabase } from './supabase';
import { getUnlockedTitles, getTitleById, getProgressionTitleForLevel } from '../config/titlesConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// USERNAME VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Username rules:
 * - 3-11 characters (max 11!)
 * - Starts with a letter
 * - Only ASCII letters, numbers, underscores (NO accents, NO unicode, NO symbols)
 * - LLM moderated for inappropriate content
 */
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,10}$/;

// Only allow basic ASCII - reject anything with accents, symbols, unicode
const ASCII_ONLY_REGEX = /^[\x20-\x7E]+$/;

// Reserved patterns (impersonation, staff, etc.)
const RESERVED_PATTERNS = [
  /admin/i, /mod(erator)?/i, /staff/i, /official/i,
  /veilpath/i, /vera/i, /support/i, /help/i,
  /system/i, /bot/i, /root/i, /null/i, /undefined/i,
];

// Explicit badword patterns (quick reject before LLM)
// These are obvious patterns - LLM catches subtler variations
const EXPLICIT_BADWORDS = [
  /fuck/i, /shit/i, /ass(?:hole)?/i, /bitch/i, /cunt/i, /cock/i, /dick/i,
  /pussy/i, /whore/i, /slut/i, /fag/i, /nigger/i, /nigga/i, /retard/i,
  /nazi/i, /hitler/i, /porn/i, /sex(?:y)?/i, /rape/i, /kill/i, /death/i,
  // Leet speak variations
  /f[u4]ck/i, /sh[i1]t/i, /b[i1]tch/i, /n[i1]gg/i,
];

/**
 * Check if username contains only valid ASCII characters
 * Rejects: ñ, é, ü, emojis, weird symbols, etc.
 */
function isValidASCII(str) {
  // Only allow basic printable ASCII (space to tilde)
  if (!ASCII_ONLY_REGEX.test(str)) return false;

  // Double check - no extended characters
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Only allow a-z, A-Z, 0-9, underscore
    const isLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    const isNumber = code >= 48 && code <= 57;
    const isUnderscore = code === 95;

    if (!isLetter && !isNumber && !isUnderscore) {
      return false;
    }
  }
  return true;
}

/**
 * Quick check for explicit badwords (before LLM)
 */
function containsExplicitBadword(username) {
  for (const pattern of EXPLICIT_BADWORDS) {
    if (pattern.test(username)) return true;
  }
  return false;
}

/**
 * LLM moderation for username appropriateness
 * Catches: slurs, hate speech, sexual content, variations/leet speak
 * Uses a small, fast model for quick checks
 */
export async function moderateUsernameWithLLM(username) {
  try {
    // Call edge function for LLM moderation
    const { data, error } = await supabase.functions.invoke('moderate-username', {
      body: { username },
    });

    if (error) {
      console.error('[UserProfile] LLM moderation failed:', error);
      // Fail closed - if LLM is down, don't allow potentially bad usernames
      return {
        approved: false,
        reason: 'Unable to verify username. Please try again.',
        error: true
      };
    }

    return {
      approved: data.approved,
      reason: data.reason || null,
      error: false,
    };
  } catch (error) {
    console.error('[UserProfile] LLM moderation error:', error);
    return {
      approved: false,
      reason: 'Moderation service unavailable. Please try again.',
      error: true
    };
  }
}

/**
 * Validate username format and availability
 * Full validation pipeline:
 * 1. Length check (3-11 chars)
 * 2. ASCII-only check (no accents, symbols, unicode)
 * 3. Format check (starts with letter, alphanumeric + underscore)
 * 4. Reserved patterns check
 * 5. Explicit badword check
 * 6. LLM moderation check
 * 7. Availability check (database)
 */
export async function validateUsername(username) {
  const errors = [];

  // Normalize: trim whitespace
  const cleanUsername = username?.trim() || '';

  // 1. Length check (3-11 characters)
  if (!cleanUsername || cleanUsername.length < 3) {
    errors.push('Username must be at least 3 characters');
  } else if (cleanUsername.length > 11) {
    errors.push('Username must be 11 characters or less');
  }

  // 2. ASCII-only check
  if (!isValidASCII(cleanUsername)) {
    errors.push('Username can only contain letters, numbers, and underscores (no accents or symbols)');
  }

  // 3. Format check (starts with letter, alphanumeric + underscore only)
  if (!USERNAME_REGEX.test(cleanUsername)) {
    if (!errors.some(e => e.includes('at least 3') || e.includes('11 characters'))) {
      errors.push('Username must start with a letter and contain only letters, numbers, and underscores');
    }
  }

  // 4. Reserved patterns check
  for (const pattern of RESERVED_PATTERNS) {
    if (pattern.test(cleanUsername)) {
      errors.push('This username is reserved');
      break;
    }
  }

  // 5. Explicit badword check (fast, before LLM)
  if (containsExplicitBadword(cleanUsername)) {
    errors.push('This username contains inappropriate content');
  }

  // Return early if format errors (don't waste LLM call)
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 6. LLM moderation check (catches subtle variations, leet speak, etc.)
  const moderation = await moderateUsernameWithLLM(cleanUsername);
  if (!moderation.approved) {
    return {
      valid: false,
      errors: [moderation.reason || 'This username is not allowed'],
      moderationFailed: moderation.error,
    };
  }

  // 7. Availability check (database)
  try {
    const { data } = await supabase.rpc('check_username_available', {
      desired_username: cleanUsername,
    });

    if (!data) {
      return { valid: false, errors: ['Username is already taken'] };
    }
  } catch (error) {
    console.error('[UserProfile] Username availability check failed:', error);
    // Fail open for DB check - let the DB constraint catch it
  }

  return { valid: true, errors: [], username: cleanUsername };
}

/**
 * Quick format validation (no DB/LLM calls)
 * Use for real-time typing feedback
 */
export function validateUsernameFormat(username) {
  const errors = [];
  const cleanUsername = username?.trim() || '';

  if (cleanUsername.length < 3) {
    errors.push('Too short (minimum 3 characters)');
  } else if (cleanUsername.length > 11) {
    errors.push('Too long (maximum 11 characters)');
  }

  if (cleanUsername.length > 0 && !isValidASCII(cleanUsername)) {
    errors.push('Only letters, numbers, and underscores allowed');
  }

  if (cleanUsername.length > 0 && !/^[a-zA-Z]/.test(cleanUsername)) {
    errors.push('Must start with a letter');
  }

  if (containsExplicitBadword(cleanUsername)) {
    errors.push('Contains inappropriate content');
  }

  for (const pattern of RESERVED_PATTERNS) {
    if (pattern.test(cleanUsername)) {
      errors.push('This name is reserved');
      break;
    }
  }

  return {
    valid: errors.length === 0 && cleanUsername.length >= 3,
    errors,
    charCount: cleanUsername.length,
    maxChars: 11,
  };
}

/**
 * Generate username suggestions based on a base name
 * All suggestions are max 11 characters
 */
export function generateUsernameSuggestions(baseName, count = 5) {
  // Clean and truncate to leave room for numbers (max 7 chars for base)
  const clean = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 7);
  const suggestions = new Set();

  // Add random 2-3 digit numbers (keeps under 11 chars)
  for (let i = 0; i < count * 2; i++) {
    const num = Math.floor(Math.random() * 999);
    const suggestion = `${clean}${num}`.slice(0, 11);
    if (suggestion.length >= 3) suggestions.add(suggestion);
  }

  // Add underscore variations if they fit
  const shortClean = clean.slice(0, 5);
  if (`${shortClean}_veil`.length <= 11) suggestions.add(`${shortClean}_veil`);
  if (`${shortClean}_moon`.length <= 11) suggestions.add(`${shortClean}_moon`);
  if (`v_${shortClean}`.length <= 11) suggestions.add(`v_${shortClean}`);

  return Array.from(suggestions).slice(0, count);
}

/**
 * Check if current user has a username set
 */
export async function checkUserHasUsername() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { hasUsername: false, needsSetup: true };

    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile exists
      return { hasUsername: false, needsSetup: true, noProfile: true };
    }

    if (error) {
      console.error('[UserProfile] Check username failed:', error);
      return { hasUsername: false, needsSetup: true, error: true };
    }

    const hasUsername = data?.username && data.username.length > 0;
    return { hasUsername, needsSetup: !hasUsername, username: data?.username };
  } catch (error) {
    console.error('[UserProfile] Check username error:', error);
    return { hasUsername: false, needsSetup: true, error: true };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

class UserProfileServiceClass {
  /**
   * Get current user's profile
   */
  async getMyProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        stats:profile_stats(*),
        showcase:profile_showcase(*)
      `)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[UserProfile] Failed to get profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Get public profile by username
   */
  async getProfileByUsername(username) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_card_back_id,
        primary_title_id,
        secondary_title_id,
        profile_theme,
        is_public,
        show_stats,
        show_showcase,
        show_achievements,
        created_at,
        last_active_at,
        stats:profile_stats(
          total_readings,
          favorite_card,
          total_journal_entries,
          longest_streak,
          current_streak,
          total_posts,
          total_likes_received,
          level,
          xp,
          title,
          card_backs_owned,
          flip_animations_owned,
          achievements_earned,
          legendary_items,
          mythic_items
        ),
        showcase:profile_showcase(
          slot_number,
          item_type,
          item_id,
          display_order
        )
      `)
      .eq('username', username)
      .eq('is_public', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data;
  }

  /**
   * Set username (one-time or with cooldown)
   */
  async setUsername(username) {
    const validation = await validateUsername(username);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, errors: ['Not authenticated'] };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        username,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, errors: ['Username is already taken'] };
      }
      return { success: false, errors: [error.message] };
    }

    return { success: true };
  }

  /**
   * Update profile info
   */
  async updateProfile({ displayName, bio, isPublic, showStats, showShowcase, showAchievements, profileTheme }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (displayName !== undefined) updates.display_name = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (isPublic !== undefined) updates.is_public = isPublic;
    if (showStats !== undefined) updates.show_stats = showStats;
    if (showShowcase !== undefined) updates.show_showcase = showShowcase;
    if (showAchievements !== undefined) updates.show_achievements = showAchievements;
    if (profileTheme !== undefined) updates.profile_theme = profileTheme;

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Update avatar (card back ID)
   */
  async setAvatarCardBack(cardBackId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        avatar_card_back_id: cardBackId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TITLE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get all titles unlocked by the current user
   */
  async getMyUnlockedTitles() {
    const profile = await this.getMyProfile();
    if (!profile?.stats) return [];

    return getUnlockedTitles(profile.stats);
  }

  /**
   * Set the user's selected title(s)
   * @param {string} primaryTitleId - Main title to display
   * @param {string|null} secondaryTitleId - Optional second title
   */
  async setTitles(primaryTitleId, secondaryTitleId = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate titles exist
    const primary = getTitleById(primaryTitleId);
    if (!primary) {
      return { success: false, error: 'Invalid primary title' };
    }

    if (secondaryTitleId) {
      const secondary = getTitleById(secondaryTitleId);
      if (!secondary) {
        return { success: false, error: 'Invalid secondary title' };
      }
    }

    // Validate user has unlocked these titles
    const unlockedTitles = await this.getMyUnlockedTitles();
    const unlockedIds = unlockedTitles.map(t => t.id);

    if (!unlockedIds.includes(primaryTitleId)) {
      return { success: false, error: 'Primary title not unlocked' };
    }

    if (secondaryTitleId && !unlockedIds.includes(secondaryTitleId)) {
      return { success: false, error: 'Secondary title not unlocked' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        primary_title_id: primaryTitleId,
        secondary_title_id: secondaryTitleId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get title display for a profile (resolves IDs to title objects)
   */
  getTitleDisplay(primaryTitleId, secondaryTitleId = null) {
    const primary = getTitleById(primaryTitleId);
    const secondary = secondaryTitleId ? getTitleById(secondaryTitleId) : null;

    return {
      primary,
      secondary,
      formatted: primary
        ? (secondary ? `${primary.name} \u00B7 ${secondary.name}` : primary.name)
        : null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SHOWCASE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Set showcase item in a slot
   */
  async setShowcaseItem(slotNumber, itemType, itemId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (slotNumber < 1 || slotNumber > 6) {
      return { success: false, error: 'Invalid slot number (1-6)' };
    }

    const validTypes = ['card_back', 'flip_animation', 'achievement', 'badge', 'card'];
    if (!validTypes.includes(itemType)) {
      return { success: false, error: 'Invalid item type' };
    }

    const { error } = await supabase
      .from('profile_showcase')
      .upsert({
        user_id: user.id,
        slot_number: slotNumber,
        item_type: itemType,
        item_id: itemId,
        display_order: slotNumber,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Remove showcase item
   */
  async removeShowcaseItem(slotNumber) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('profile_showcase')
      .delete()
      .eq('user_id', user.id)
      .eq('slot_number', slotNumber);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get showcase for a user
   */
  async getShowcase(userId) {
    const { data, error } = await supabase
      .from('profile_showcase')
      .select('*')
      .eq('user_id', userId)
      .order('display_order');

    if (error) {
      throw error;
    }

    return data || [];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Update profile stats (called by other services)
   */
  async updateStats(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profile_stats')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }

  /**
   * Increment a stat counter
   */
  async incrementStat(statName, amount = 1) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.rpc('increment_profile_stat', {
      p_user_id: user.id,
      p_stat_name: statName,
      p_amount: amount,
    });
  }

  /**
   * Sync cosmetics ownership to profile stats
   */
  async syncCosmeticsStats(ownedCardBacks, ownedFlipAnimations) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Count legendaries and mythics
    const legendaryCount = [...ownedCardBacks, ...ownedFlipAnimations]
      .filter(id => {
        // Would need rarity lookup here
        return false;
      }).length;

    await this.updateStats({
      card_backs_owned: ownedCardBacks.length,
      flip_animations_owned: ownedFlipAnimations.length,
    });
  }
}

export const UserProfileService = new UserProfileServiceClass();
export default UserProfileService;

// ═══════════════════════════════════════════════════════════════════════════════
// ENGAGEMENT TRACKING (Anonymized)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Track an engagement event (for aggregated analytics only)
 * IMPORTANT: Never include PII or personal content
 */
export async function trackEngagement({
  eventType,
  eventCategory,
  eventAction,
  itemType,
  itemRarity,
  durationMs,
  metadata = {},
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Generate session ID (non-identifying)
    const sessionId = sessionStorage?.getItem('vp_session_id') ||
      Math.random().toString(36).substring(2);
    sessionStorage?.setItem('vp_session_id', sessionId);

    await supabase.from('engagement_events').insert({
      user_id: user?.id, // Will be null for anonymous users
      session_id: sessionId,
      event_type: eventType,
      event_category: eventCategory,
      event_action: eventAction,
      item_type: itemType,
      item_rarity: itemRarity,
      duration_ms: durationMs,
      metadata: {
        // ONLY safe, non-PII metadata
        screen: metadata.screen,
        section: metadata.section,
        platform: metadata.platform,
        // Never include: content, questions, journal text, chat, etc.
      },
    });
  } catch (error) {
    // Silent fail - analytics should never break the app
    console.debug('[Analytics] Track failed:', error.message);
  }
}

/**
 * Event categories for consistent tracking
 */
export const ENGAGEMENT_CATEGORIES = {
  SHOP: 'shop',
  READING: 'reading',
  JOURNAL: 'journal',
  COMMUNITY: 'community',
  NAVIGATION: 'navigation',
  COSMETICS: 'cosmetics',
  PROFILE: 'profile',
};

export const ENGAGEMENT_ACTIONS = {
  VIEW: 'view',
  CLICK: 'click',
  PURCHASE: 'purchase',
  COMPLETE: 'complete',
  SHARE: 'share',
  EQUIP: 'equip',
  SAVE: 'save',
};
