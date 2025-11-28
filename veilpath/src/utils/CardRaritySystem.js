/**
 * Card Rarity/Cosmetic System
 * Different visual tiers for tarot cards (like Hearthstone card variants)
 *
 * RARITY TIERS:
 * - Common: Flat 2D, basic rendering, no effects
 * - Gilded: Metallic accents, subtle glow, some animation
 * - Artifact: Full 3D depth, animated sprites, gold filigree, particles
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════
// RARITY DEFINITIONS
// ═══════════════════════════════════════════════════════════

export const CARD_RARITY = {
  COMMON: 'common',
  GILDED: 'gilded',
  ARTIFACT: 'artifact',
};

export const RARITY_CONFIG = {
  [CARD_RARITY.COMMON]: {
    name: 'Common',
    description: 'Standard tarot cards with clean 2D artwork',
    visual: {
      hasGlow: false,
      hasParticles: false,
      hasFiligree: false,
      hasAnimation: false,
      depth: '2D',
      metallic: false,
    },
    unlockCost: {
      moonlight: 0, // Default, always owned
      veilShards: 0,
    },
  },

  [CARD_RARITY.GILDED]: {
    name: 'Gilded',
    description: 'Enhanced cards with metallic accents and subtle effects',
    visual: {
      hasGlow: true,
      hasParticles: false, // Subtle ambient only
      hasFiligree: true, // Gold borders
      hasAnimation: true, // Gentle shimmer
      depth: '2.5D', // Slight parallax
      metallic: true,
    },
    unlockCost: {
      moonlight: 500,
      veilShards: 0,
    },
  },

  [CARD_RARITY.ARTIFACT]: {
    name: 'Artifact',
    description: 'Ultra-rare legendary cards with full 3D effects and animated sprites',
    visual: {
      hasGlow: true,
      hasParticles: true, // Full particle systems
      hasFiligree: true, // Intricate gold filigree
      hasAnimation: true, // Complex animations
      depth: '3D', // Full parallax depth
      metallic: true,
      hasSprites: true, // Animated sprites on card
      hasCinematic: true, // Special flip/reveal animation
    },
    unlockCost: {
      moonlight: 0,
      veilShards: 1000, // Premium currency only
    },
  },
};

// ═══════════════════════════════════════════════════════════
// CARD COSMETIC TRACKING
// ═══════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  UNLOCKED_COSMETICS: '@veilpath_unlocked_cosmetics',
  ACTIVE_DECK: '@veilpath_active_deck',
  COLLECTION: '@veilpath_card_collection',
};

/**
 * Get all unlocked card cosmetics for a card
 */
export async function getUnlockedCosmetics(cardId) {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.UNLOCKED_COSMETICS);
    const unlocked = data ? JSON.parse(data) : {};

    // Common is always unlocked
    const cardUnlocks = unlocked[cardId] || [CARD_RARITY.COMMON];

    if (!cardUnlocks.includes(CARD_RARITY.COMMON)) {
      cardUnlocks.push(CARD_RARITY.COMMON);
    }

    return cardUnlocks;
  } catch (error) {
    console.error('[CardRarity] Error getting unlocked cosmetics:', error);
    return [CARD_RARITY.COMMON];
  }
}

/**
 * Unlock a card cosmetic variant
 */
export async function unlockCardCosmetic(cardId, rarity) {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.UNLOCKED_COSMETICS);
    const unlocked = data ? JSON.parse(data) : {};

    if (!unlocked[cardId]) {
      unlocked[cardId] = [CARD_RARITY.COMMON];
    }

    if (!unlocked[cardId].includes(rarity)) {
      unlocked[cardId].push(rarity);
      await AsyncStorage.setItem(STORAGE_KEYS.UNLOCKED_COSMETICS, JSON.stringify(unlocked));
      return true;
    }

    return false; // Already unlocked
  } catch (error) {
    console.error('[CardRarity] Error unlocking cosmetic:', error);
    return false;
  }
}

/**
 * Check if a card cosmetic is unlocked
 */
export async function isCardCosmeticUnlocked(cardId, rarity) {
  if (rarity === CARD_RARITY.COMMON) {
    return true; // Always unlocked
  }

  const unlocked = await getUnlockedCosmetics(cardId);
  return unlocked.includes(rarity);
}

/**
 * Get active deck configuration (which rarity variant for each card)
 */
export async function getActiveDeck() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_DECK);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[CardRarity] Error getting active deck:', error);
    return {};
  }
}

/**
 * Set the active rarity for a card
 */
export async function setCardRarity(cardId, rarity) {
  try {
    // Check if unlocked
    const unlocked = await isCardCosmeticUnlocked(cardId, rarity);
    if (!unlocked) {
      return { success: false, error: 'Cosmetic not unlocked' };
    }

    const deck = await getActiveDeck();
    deck[cardId] = rarity;

    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_DECK, JSON.stringify(deck));
    return { success: true };
  } catch (error) {
    console.error('[CardRarity] Error setting card rarity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get the active rarity for a card
 */
export async function getCardRarity(cardId) {
  const deck = await getActiveDeck();
  return deck[cardId] || CARD_RARITY.COMMON;
}

// ═══════════════════════════════════════════════════════════
// COLLECTION MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Get collection progress (how many cards/rarities unlocked)
 */
export async function getCollectionProgress() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.UNLOCKED_COSMETICS);
    const unlocked = data ? JSON.parse(data) : {};

    const totalCards = 78; // Full tarot deck
    const totalRarities = Object.keys(CARD_RARITY).length;
    const totalPossible = totalCards * (totalRarities - 1); // Exclude common (default)

    let unlockedCount = 0;
    let gildedCount = 0;
    let artifactCount = 0;

    Object.values(unlocked).forEach(cardRarities => {
      cardRarities.forEach(rarity => {
        if (rarity === CARD_RARITY.GILDED) {
          gildedCount++;
          unlockedCount++;
        } else if (rarity === CARD_RARITY.ARTIFACT) {
          artifactCount++;
          unlockedCount++;
        }
      });
    });

    return {
      totalCards,
      totalPossible,
      unlockedCount,
      gildedCount,
      artifactCount,
      percentage: Math.round((unlockedCount / totalPossible) * 100),
    };
  } catch (error) {
    console.error('[CardRarity] Error getting collection progress:', error);
    return {
      totalCards: 78,
      totalPossible: 156,
      unlockedCount: 0,
      gildedCount: 0,
      artifactCount: 0,
      percentage: 0,
    };
  }
}

/**
 * Award a random card cosmetic (for rewards)
 */
export async function awardRandomCardCosmetic(rarity = CARD_RARITY.GILDED) {
  try {
    const totalCards = 78;

    // Find cards that don't have this rarity yet
    const data = await AsyncStorage.getItem(STORAGE_KEYS.UNLOCKED_COSMETICS);
    const unlocked = data ? JSON.parse(data) : {};

    const eligibleCards = [];
    for (let i = 0; i < totalCards; i++) {
      const cardId = `card_${i}`;
      const cardRarities = unlocked[cardId] || [CARD_RARITY.COMMON];

      if (!cardRarities.includes(rarity)) {
        eligibleCards.push(cardId);
      }
    }

    if (eligibleCards.length === 0) {
      return { success: false, error: 'All cards already unlocked at this rarity' };
    }

    // Pick random
    const randomCard = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
    const unlocked_cosmetic = await unlockCardCosmetic(randomCard, rarity);

    return {
      success: true,
      cardId: randomCard,
      rarity,
    };
  } catch (error) {
    console.error('[CardRarity] Error awarding random cosmetic:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════
// PURCHASE SYSTEM
// ═══════════════════════════════════════════════════════════

/**
 * Purchase a specific card cosmetic
 */
export async function purchaseCardCosmetic(cardId, rarity, currencyManager) {
  try {
    // Check if already unlocked
    const alreadyUnlocked = await isCardCosmeticUnlocked(cardId, rarity);
    if (alreadyUnlocked) {
      return { success: false, error: 'Already unlocked' };
    }

    // Get cost
    const config = RARITY_CONFIG[rarity];
    if (!config) {
      return { success: false, error: 'Invalid rarity' };
    }

    // Check if can afford
    const { moonlight, veilShards } = config.unlockCost;

    if (moonlight > 0) {
      const canAfford = await currencyManager.canAfford('moonlight', moonlight);
      if (!canAfford) {
        return { success: false, error: 'Insufficient Moonlight' };
      }

      // Spend currency
      await currencyManager.spendMoonlight(moonlight, `Unlock ${rarity} ${cardId}`);
    }

    if (veilShards > 0) {
      const canAfford = await currencyManager.canAfford('veilShards', veilShards);
      if (!canAfford) {
        return { success: false, error: 'Insufficient Veil Shards' };
      }

      // Spend currency
      await currencyManager.spendVeilShards(veilShards, `Unlock ${rarity} ${cardId}`);
    }

    // Unlock
    await unlockCardCosmetic(cardId, rarity);

    return { success: true };
  } catch (error) {
    console.error('[CardRarity] Error purchasing cosmetic:', error);
    return { success: false, error: error.message };
  }
}

export default {
  CARD_RARITY,
  RARITY_CONFIG,
  getUnlockedCosmetics,
  unlockCardCosmetic,
  isCardCosmeticUnlocked,
  getActiveDeck,
  setCardRarity,
  getCardRarity,
  getCollectionProgress,
  awardRandomCardCosmetic,
  purchaseCardCosmetic,
};
