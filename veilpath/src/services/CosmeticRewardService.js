/**
 * COSMETIC REWARD SERVICE
 *
 * Manages unlockable cosmetics earned through gameplay, not just purchases.
 *
 * UNLOCK SOURCES:
 * 1. Streaks - Daily login / reading streaks
 * 2. Achievements - Milestone completions
 * 3. Holidays - Seasonal limited-time unlocks
 * 4. Quests - Quest completion rewards
 * 5. Level Up - XP milestones
 * 6. Shop - Premium currency purchases
 *
 * COSMETIC TYPES:
 * - Card Backs - Deck card back designs
 * - Reading Cloths - Background themes
 * - Avatars - Profile pictures
 * - Titles - Display titles
 * - Borders - Card/profile borders
 * - Effects - Animation effects
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const COSMETICS_KEY = '@veilpath_cosmetics';
const EQUIPPED_KEY = '@veilpath_equipped_cosmetics';

// ═══════════════════════════════════════════════════════════════
// COSMETIC DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const COSMETIC_TYPES = {
  CARD_BACK: 'card_back',
  READING_CLOTH: 'reading_cloth',
  AVATAR: 'avatar',
  TITLE: 'title',
  BORDER: 'border',
  EFFECT: 'effect',
};

export const RARITY = {
  COMMON: { id: 'common', name: 'Common', color: '#9CA3AF', multiplier: 1 },
  UNCOMMON: { id: 'uncommon', name: 'Uncommon', color: '#10B981', multiplier: 1.5 },
  RARE: { id: 'rare', name: 'Rare', color: '#3B82F6', multiplier: 2 },
  EPIC: { id: 'epic', name: 'Epic', color: '#8B5CF6', multiplier: 3 },
  LEGENDARY: { id: 'legendary', name: 'Legendary', color: '#F59E0B', multiplier: 5 },
  MYTHIC: { id: 'mythic', name: 'Mythic', color: '#EC4899', multiplier: 10 },
};

export const UNLOCK_SOURCES = {
  DEFAULT: 'default',           // Available to all
  STREAK: 'streak',             // Login/reading streaks
  ACHIEVEMENT: 'achievement',   // Achievement completion
  HOLIDAY: 'holiday',           // Seasonal/holiday events
  QUEST: 'quest',               // Quest rewards
  LEVEL: 'level',               // XP level milestones
  SHOP: 'shop',                 // Premium currency purchase
  SUBSCRIPTION: 'subscription', // Tier-locked
  SECRET: 'secret',             // Hidden/easter egg
};

// ═══════════════════════════════════════════════════════════════
// COSMETIC CATALOG
// ═══════════════════════════════════════════════════════════════

export const COSMETICS_CATALOG = {
  // ─────────────────────────────────────────────────────────────
  // CARD BACKS
  // ─────────────────────────────────────────────────────────────
  card_back_default: {
    id: 'card_back_default',
    type: COSMETIC_TYPES.CARD_BACK,
    name: 'Classic Mystic',
    description: 'The timeless purple starfield design.',
    rarity: RARITY.COMMON,
    source: UNLOCK_SOURCES.DEFAULT,
    asset: 'card_back_default',
  },
  card_back_midnight: {
    id: 'card_back_midnight',
    type: COSMETIC_TYPES.CARD_BACK,
    name: 'Midnight Veil',
    description: 'Deep navy with silver moon phases.',
    rarity: RARITY.UNCOMMON,
    source: UNLOCK_SOURCES.STREAK,
    requirement: { streakDays: 7 },
    asset: 'card_back_midnight',
  },
  card_back_aurora: {
    id: 'card_back_aurora',
    type: COSMETIC_TYPES.CARD_BACK,
    name: 'Aurora Dreams',
    description: 'Shimmering northern lights effect.',
    rarity: RARITY.RARE,
    source: UNLOCK_SOURCES.STREAK,
    requirement: { streakDays: 30 },
    asset: 'card_back_aurora',
  },
  card_back_celestial: {
    id: 'card_back_celestial',
    type: COSMETIC_TYPES.CARD_BACK,
    name: 'Celestial Gold',
    description: 'Golden zodiac symbols on cosmic background.',
    rarity: RARITY.EPIC,
    source: UNLOCK_SOURCES.ACHIEVEMENT,
    requirement: { achievementId: 'reading_master' },
    asset: 'card_back_celestial',
  },
  card_back_phoenix: {
    id: 'card_back_phoenix',
    type: COSMETIC_TYPES.CARD_BACK,
    name: 'Phoenix Rising',
    description: 'Animated flames rising from ashes.',
    rarity: RARITY.LEGENDARY,
    source: UNLOCK_SOURCES.STREAK,
    requirement: { streakDays: 100 },
    asset: 'card_back_phoenix',
  },
  card_back_void: {
    id: 'card_back_void',
    type: COSMETIC_TYPES.CARD_BACK,
    name: 'The Void',
    description: 'Hypnotic swirling darkness with stars.',
    rarity: RARITY.MYTHIC,
    source: UNLOCK_SOURCES.ACHIEVEMENT,
    requirement: { achievementId: 'completionist' },
    asset: 'card_back_void',
  },

  // Holiday Card Backs
  card_back_halloween: {
    id: 'card_back_halloween',
    type: COSMETIC_TYPES.CARD_BACK,
    name: 'Samhain Spirits',
    description: 'Limited Halloween 2024 design.',
    rarity: RARITY.RARE,
    source: UNLOCK_SOURCES.HOLIDAY,
    requirement: { holiday: 'halloween_2024' },
    limited: true,
    asset: 'card_back_halloween',
  },
  card_back_winter: {
    id: 'card_back_winter',
    type: COSMETIC_TYPES.CARD_BACK,
    name: 'Winter Solstice',
    description: 'Sparkling snowflakes and frost.',
    rarity: RARITY.RARE,
    source: UNLOCK_SOURCES.HOLIDAY,
    requirement: { holiday: 'winter_2024' },
    limited: true,
    asset: 'card_back_winter',
  },

  // ─────────────────────────────────────────────────────────────
  // READING CLOTHS (Backgrounds)
  // ─────────────────────────────────────────────────────────────
  cloth_velvet: {
    id: 'cloth_velvet',
    type: COSMETIC_TYPES.READING_CLOTH,
    name: 'Royal Velvet',
    description: 'Deep purple velvet texture.',
    rarity: RARITY.COMMON,
    source: UNLOCK_SOURCES.DEFAULT,
    asset: 'cloth_velvet',
  },
  cloth_starmap: {
    id: 'cloth_starmap',
    type: COSMETIC_TYPES.READING_CLOTH,
    name: 'Star Map',
    description: 'Ancient constellation chart.',
    rarity: RARITY.UNCOMMON,
    source: UNLOCK_SOURCES.LEVEL,
    requirement: { level: 5 },
    asset: 'cloth_starmap',
  },
  cloth_forest: {
    id: 'cloth_forest',
    type: COSMETIC_TYPES.READING_CLOTH,
    name: 'Enchanted Forest',
    description: 'Mystical forest floor with moss.',
    rarity: RARITY.RARE,
    source: UNLOCK_SOURCES.QUEST,
    requirement: { questId: 'nature_walker' },
    asset: 'cloth_forest',
  },
  cloth_ocean: {
    id: 'cloth_ocean',
    type: COSMETIC_TYPES.READING_CLOTH,
    name: 'Deep Ocean',
    description: 'Underwater luminescence.',
    rarity: RARITY.EPIC,
    source: UNLOCK_SOURCES.SUBSCRIPTION,
    requirement: { tier: 'adept' },
    asset: 'cloth_ocean',
  },

  // ─────────────────────────────────────────────────────────────
  // AVATARS
  // ─────────────────────────────────────────────────────────────
  avatar_seeker: {
    id: 'avatar_seeker',
    type: COSMETIC_TYPES.AVATAR,
    name: 'The Seeker',
    description: 'Hooded figure with lantern.',
    rarity: RARITY.COMMON,
    source: UNLOCK_SOURCES.DEFAULT,
    asset: 'avatar_seeker',
  },
  avatar_moon_child: {
    id: 'avatar_moon_child',
    type: COSMETIC_TYPES.AVATAR,
    name: 'Moon Child',
    description: 'Crescent moon with starry eyes.',
    rarity: RARITY.UNCOMMON,
    source: UNLOCK_SOURCES.STREAK,
    requirement: { streakDays: 14 },
    asset: 'avatar_moon_child',
  },
  avatar_vera: {
    id: 'avatar_vera',
    type: COSMETIC_TYPES.AVATAR,
    name: 'Vera',
    description: 'Your AI guide and life coach.',
    rarity: RARITY.RARE,
    source: UNLOCK_SOURCES.ACHIEVEMENT,
    requirement: { achievementId: 'vera_friend' },
    asset: 'avatar_vera',
  },
  avatar_high_priestess: {
    id: 'avatar_high_priestess',
    type: COSMETIC_TYPES.AVATAR,
    name: 'High Priestess',
    description: 'Inspired by the Major Arcana.',
    rarity: RARITY.EPIC,
    source: UNLOCK_SOURCES.LEVEL,
    requirement: { level: 25 },
    asset: 'avatar_high_priestess',
  },
  avatar_star: {
    id: 'avatar_star',
    type: COSMETIC_TYPES.AVATAR,
    name: 'The Star',
    description: 'Radiant celestial being.',
    rarity: RARITY.LEGENDARY,
    source: UNLOCK_SOURCES.SUBSCRIPTION,
    requirement: { tier: 'mystic' },
    asset: 'avatar_star',
  },

  // ─────────────────────────────────────────────────────────────
  // TITLES
  // ─────────────────────────────────────────────────────────────
  title_newcomer: {
    id: 'title_newcomer',
    type: COSMETIC_TYPES.TITLE,
    name: 'Newcomer',
    description: 'Just beginning the journey.',
    rarity: RARITY.COMMON,
    source: UNLOCK_SOURCES.DEFAULT,
    displayText: 'Newcomer',
  },
  title_seeker: {
    id: 'title_seeker',
    type: COSMETIC_TYPES.TITLE,
    name: 'Seeker of Truth',
    description: 'Completed 10 readings.',
    rarity: RARITY.UNCOMMON,
    source: UNLOCK_SOURCES.ACHIEVEMENT,
    requirement: { achievementId: 'first_readings' },
    displayText: 'Seeker of Truth',
  },
  title_dedicated: {
    id: 'title_dedicated',
    type: COSMETIC_TYPES.TITLE,
    name: 'The Dedicated',
    description: '30-day streak achieved.',
    rarity: RARITY.RARE,
    source: UNLOCK_SOURCES.STREAK,
    requirement: { streakDays: 30 },
    displayText: 'The Dedicated',
  },
  title_seer: {
    id: 'title_seer',
    type: COSMETIC_TYPES.TITLE,
    name: 'Vera',
    description: '100 readings completed.',
    rarity: RARITY.EPIC,
    source: UNLOCK_SOURCES.ACHIEVEMENT,
    requirement: { achievementId: 'reading_century' },
    displayText: 'Vera',
  },
  title_enlightened: {
    id: 'title_enlightened',
    type: COSMETIC_TYPES.TITLE,
    name: 'The Enlightened',
    description: 'Reached level 50.',
    rarity: RARITY.LEGENDARY,
    source: UNLOCK_SOURCES.LEVEL,
    requirement: { level: 50 },
    displayText: 'The Enlightened',
  },
  title_veilwalker: {
    id: 'title_veilwalker',
    type: COSMETIC_TYPES.TITLE,
    name: 'Veilwalker',
    description: 'Found all secrets.',
    rarity: RARITY.MYTHIC,
    source: UNLOCK_SOURCES.SECRET,
    displayText: 'Veilwalker',
  },

  // ─────────────────────────────────────────────────────────────
  // BORDERS
  // ─────────────────────────────────────────────────────────────
  border_simple: {
    id: 'border_simple',
    type: COSMETIC_TYPES.BORDER,
    name: 'Simple',
    description: 'Clean minimal border.',
    rarity: RARITY.COMMON,
    source: UNLOCK_SOURCES.DEFAULT,
    asset: 'border_simple',
  },
  border_vines: {
    id: 'border_vines',
    type: COSMETIC_TYPES.BORDER,
    name: 'Mystic Vines',
    description: 'Intertwining botanical design.',
    rarity: RARITY.UNCOMMON,
    source: UNLOCK_SOURCES.LEVEL,
    requirement: { level: 10 },
    asset: 'border_vines',
  },
  border_celestial: {
    id: 'border_celestial',
    type: COSMETIC_TYPES.BORDER,
    name: 'Celestial Ring',
    description: 'Orbiting stars and moons.',
    rarity: RARITY.RARE,
    source: UNLOCK_SOURCES.ACHIEVEMENT,
    requirement: { achievementId: 'star_gazer' },
    asset: 'border_celestial',
  },
  border_flames: {
    id: 'border_flames',
    type: COSMETIC_TYPES.BORDER,
    name: 'Eternal Flame',
    description: 'Animated fire border.',
    rarity: RARITY.LEGENDARY,
    source: UNLOCK_SOURCES.STREAK,
    requirement: { streakDays: 365 },
    asset: 'border_flames',
  },
};

// ═══════════════════════════════════════════════════════════════
// COSMETICS STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Get all owned cosmetics
 */
export async function getOwnedCosmetics() {
  try {
    const data = await AsyncStorage.getItem(COSMETICS_KEY);
    if (data) {
      return JSON.parse(data);
    }

    // Initialize with default cosmetics
    const defaults = Object.values(COSMETICS_CATALOG)
      .filter(c => c.source === UNLOCK_SOURCES.DEFAULT)
      .reduce((acc, c) => {
        acc[c.id] = {
          id: c.id,
          unlockedAt: new Date().toISOString(),
          source: 'default',
        };
        return acc;
      }, {});

    await AsyncStorage.setItem(COSMETICS_KEY, JSON.stringify(defaults));
    return defaults;

  } catch (error) {
    console.error('[CosmeticReward] Error loading cosmetics:', error);
    return {};
  }
}

/**
 * Get currently equipped cosmetics
 */
export async function getEquippedCosmetics() {
  try {
    const data = await AsyncStorage.getItem(EQUIPPED_KEY);
    if (data) {
      return JSON.parse(data);
    }

    // Default equipped items
    const defaults = {
      [COSMETIC_TYPES.CARD_BACK]: 'card_back_default',
      [COSMETIC_TYPES.READING_CLOTH]: 'cloth_velvet',
      [COSMETIC_TYPES.AVATAR]: 'avatar_seeker',
      [COSMETIC_TYPES.TITLE]: 'title_newcomer',
      [COSMETIC_TYPES.BORDER]: 'border_simple',
      [COSMETIC_TYPES.EFFECT]: null,
    };

    await AsyncStorage.setItem(EQUIPPED_KEY, JSON.stringify(defaults));
    return defaults;

  } catch (error) {
    console.error('[CosmeticReward] Error loading equipped:', error);
    return {};
  }
}

/**
 * Check if a cosmetic is owned
 */
export async function isOwned(cosmeticId) {
  const owned = await getOwnedCosmetics();
  return !!owned[cosmeticId];
}

/**
 * Unlock a cosmetic
 */
export async function unlockCosmetic(cosmeticId, source = 'unknown') {
  const cosmetic = COSMETICS_CATALOG[cosmeticId];
  if (!cosmetic) {
    console.warn(`[CosmeticReward] Unknown cosmetic: ${cosmeticId}`);
    return { success: false, error: 'unknown_cosmetic' };
  }

  const owned = await getOwnedCosmetics();

  // Already owned
  if (owned[cosmeticId]) {
    return { success: false, error: 'already_owned', cosmetic };
  }

  // Unlock it
  owned[cosmeticId] = {
    id: cosmeticId,
    unlockedAt: new Date().toISOString(),
    source,
  };

  await AsyncStorage.setItem(COSMETICS_KEY, JSON.stringify(owned));

  return {
    success: true,
    cosmetic,
    message: `Unlocked: ${cosmetic.name}!`,
    rarity: cosmetic.rarity,
  };
}

/**
 * Equip a cosmetic
 */
export async function equipCosmetic(cosmeticId) {
  const cosmetic = COSMETICS_CATALOG[cosmeticId];
  if (!cosmetic) {
    return { success: false, error: 'unknown_cosmetic' };
  }

  // Check if owned
  const isOwnedCheck = await isOwned(cosmeticId);
  if (!isOwnedCheck) {
    return { success: false, error: 'not_owned' };
  }

  // Equip it
  const equipped = await getEquippedCosmetics();
  equipped[cosmetic.type] = cosmeticId;

  await AsyncStorage.setItem(EQUIPPED_KEY, JSON.stringify(equipped));

  return { success: true, type: cosmetic.type, cosmetic };
}

/**
 * Unequip a cosmetic type (revert to default)
 */
export async function unequipCosmetic(type) {
  const equipped = await getEquippedCosmetics();

  // Find default for this type
  const defaultCosmetic = Object.values(COSMETICS_CATALOG)
    .find(c => c.type === type && c.source === UNLOCK_SOURCES.DEFAULT);

  equipped[type] = defaultCosmetic?.id || null;

  await AsyncStorage.setItem(EQUIPPED_KEY, JSON.stringify(equipped));

  return { success: true, type };
}

// ═══════════════════════════════════════════════════════════════
// UNLOCK CHECKERS
// ═══════════════════════════════════════════════════════════════

/**
 * Check and unlock streak-based cosmetics
 */
export async function checkStreakUnlocks(currentStreak) {
  const unlocked = [];

  for (const cosmetic of Object.values(COSMETICS_CATALOG)) {
    if (cosmetic.source !== UNLOCK_SOURCES.STREAK) continue;
    if (!cosmetic.requirement?.streakDays) continue;

    if (currentStreak >= cosmetic.requirement.streakDays) {
      const result = await unlockCosmetic(cosmetic.id, 'streak');
      if (result.success) {
        unlocked.push(result);
      }
    }
  }

  return unlocked;
}

/**
 * Check and unlock level-based cosmetics
 */
export async function checkLevelUnlocks(currentLevel) {
  const unlocked = [];

  for (const cosmetic of Object.values(COSMETICS_CATALOG)) {
    if (cosmetic.source !== UNLOCK_SOURCES.LEVEL) continue;
    if (!cosmetic.requirement?.level) continue;

    if (currentLevel >= cosmetic.requirement.level) {
      const result = await unlockCosmetic(cosmetic.id, 'level');
      if (result.success) {
        unlocked.push(result);
      }
    }
  }

  return unlocked;
}

/**
 * Check and unlock achievement-based cosmetics
 */
export async function checkAchievementUnlock(achievementId) {
  const unlocked = [];

  for (const cosmetic of Object.values(COSMETICS_CATALOG)) {
    if (cosmetic.source !== UNLOCK_SOURCES.ACHIEVEMENT) continue;
    if (cosmetic.requirement?.achievementId !== achievementId) continue;

    const result = await unlockCosmetic(cosmetic.id, 'achievement');
    if (result.success) {
      unlocked.push(result);
    }
  }

  return unlocked;
}

/**
 * Check and unlock subscription-tier cosmetics
 */
export async function checkSubscriptionUnlocks(tierName) {
  const tierOrder = ['free', 'seeker', 'adept', 'mystic'];
  const userTierIndex = tierOrder.indexOf(tierName);
  const unlocked = [];

  for (const cosmetic of Object.values(COSMETICS_CATALOG)) {
    if (cosmetic.source !== UNLOCK_SOURCES.SUBSCRIPTION) continue;
    if (!cosmetic.requirement?.tier) continue;

    const requiredTierIndex = tierOrder.indexOf(cosmetic.requirement.tier);
    if (userTierIndex >= requiredTierIndex) {
      const result = await unlockCosmetic(cosmetic.id, 'subscription');
      if (result.success) {
        unlocked.push(result);
      }
    }
  }

  return unlocked;
}

/**
 * Unlock holiday cosmetic (call during holiday events)
 */
export async function unlockHolidayCosmetic(holidayId) {
  const unlocked = [];

  for (const cosmetic of Object.values(COSMETICS_CATALOG)) {
    if (cosmetic.source !== UNLOCK_SOURCES.HOLIDAY) continue;
    if (cosmetic.requirement?.holiday !== holidayId) continue;

    const result = await unlockCosmetic(cosmetic.id, 'holiday');
    if (result.success) {
      unlocked.push(result);
    }
  }

  return unlocked;
}

// ═══════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get cosmetics by type for inventory display
 */
export async function getCosmeticsByType(type) {
  const owned = await getOwnedCosmetics();
  const equipped = await getEquippedCosmetics();

  return Object.values(COSMETICS_CATALOG)
    .filter(c => c.type === type)
    .map(c => ({
      ...c,
      owned: !!owned[c.id],
      equipped: equipped[type] === c.id,
      unlockedAt: owned[c.id]?.unlockedAt,
    }))
    .sort((a, b) => {
      // Sort: Equipped first, then owned, then by rarity
      if (a.equipped) return -1;
      if (b.equipped) return 1;
      if (a.owned && !b.owned) return -1;
      if (!a.owned && b.owned) return 1;
      return b.rarity.multiplier - a.rarity.multiplier;
    });
}

/**
 * Get full inventory for locker screen
 */
export async function getFullInventory() {
  const inventory = {};

  for (const type of Object.values(COSMETIC_TYPES)) {
    inventory[type] = await getCosmeticsByType(type);
  }

  return inventory;
}

/**
 * Get unlock progress for cosmetics
 */
export async function getUnlockProgress() {
  const owned = await getOwnedCosmetics();
  const total = Object.keys(COSMETICS_CATALOG).length;
  const ownedCount = Object.keys(owned).length;

  // Count by rarity
  const byRarity = {};
  for (const rarity of Object.values(RARITY)) {
    const totalOfRarity = Object.values(COSMETICS_CATALOG).filter(c => c.rarity.id === rarity.id).length;
    const ownedOfRarity = Object.values(COSMETICS_CATALOG)
      .filter(c => c.rarity.id === rarity.id && owned[c.id]).length;
    byRarity[rarity.id] = { owned: ownedOfRarity, total: totalOfRarity };
  }

  return {
    total,
    owned: ownedCount,
    percent: Math.round((ownedCount / total) * 100),
    byRarity,
  };
}

/**
 * Get next cosmetics to unlock (for motivation)
 */
export async function getNextUnlockableCosmetics(userData) {
  const owned = await getOwnedCosmetics();
  const suggestions = [];

  for (const cosmetic of Object.values(COSMETICS_CATALOG)) {
    if (owned[cosmetic.id]) continue;

    // Check progress toward unlock
    let progress = null;
    let canUnlock = false;

    if (cosmetic.source === UNLOCK_SOURCES.STREAK && cosmetic.requirement?.streakDays) {
      const currentStreak = userData.streak || 0;
      progress = {
        current: currentStreak,
        required: cosmetic.requirement.streakDays,
        percent: Math.min(100, Math.round((currentStreak / cosmetic.requirement.streakDays) * 100)),
      };
      canUnlock = currentStreak >= cosmetic.requirement.streakDays;
    }

    if (cosmetic.source === UNLOCK_SOURCES.LEVEL && cosmetic.requirement?.level) {
      const currentLevel = userData.level || 1;
      progress = {
        current: currentLevel,
        required: cosmetic.requirement.level,
        percent: Math.min(100, Math.round((currentLevel / cosmetic.requirement.level) * 100)),
      };
      canUnlock = currentLevel >= cosmetic.requirement.level;
    }

    if (progress && progress.percent > 0) {
      suggestions.push({
        ...cosmetic,
        progress,
        canUnlock,
      });
    }
  }

  // Sort by closest to unlock
  return suggestions.sort((a, b) => b.progress.percent - a.progress.percent).slice(0, 5);
}

/**
 * Reset cosmetics for testing
 */
export async function resetCosmeticsForTesting() {
  await AsyncStorage.removeItem(COSMETICS_KEY);
  await AsyncStorage.removeItem(EQUIPPED_KEY);
}
