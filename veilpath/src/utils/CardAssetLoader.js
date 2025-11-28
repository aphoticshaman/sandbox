/**
 * Card Asset Loader
 * Handles loading and caching of three-tier card assets (common, rare, artifact)
 */

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import cardManifest from '../../assets/art/card-manifest-full.json';
import { getAssetSource } from './CardAssetMap';

/**
 * Card asset cache
 */
const assetCache = {
  common: {},
  rare: {},
  artifact: {}
};

/**
 * Get card data from manifest by ID
 * @param {number} cardId - Card ID (0-77)
 * @returns {object} Card data object
 */
export function getCardData(cardId) {
  return cardManifest.cards.find(card => card.id === cardId);
}

/**
 * Get card data by slug
 * @param {string} slug - Card slug (e.g., "fool", "acewands")
 * @returns {object} Card data object
 */
export function getCardBySlug(slug) {
  return cardManifest.cards.find(card => card.slug === slug);
}

/**
 * Check if user has unlocked a specific tier for a card
 * @param {number} cardId - Card ID
 * @param {string} tier - 'common' | 'rare' | 'artifact'
 * @param {object} userCollection - User's card collection data
 * @returns {boolean}
 */
export function hasUnlockedTier(cardId, tier, userCollection) {
  // Common tier is always available
  if (tier === 'common') return true;

  // Check user collection for unlocked tiers
  const cardUnlocks = userCollection?.[cardId];
  if (!cardUnlocks) return false;

  return cardUnlocks.unlockedTiers?.includes(tier) || false;
}

/**
 * Get the highest unlocked tier for a card
 * @param {number} cardId - Card ID
 * @param {object} userCollection - User's card collection data
 * @returns {string} 'common' | 'rare' | 'artifact'
 */
export function getHighestUnlockedTier(cardId, userCollection) {
  const cardData = getCardData(cardId);
  if (!cardData) return 'common';

  if (hasUnlockedTier(cardId, 'artifact', userCollection)) return 'artifact';
  if (hasUnlockedTier(cardId, 'rare', userCollection)) return 'rare';
  return 'common';
}

/**
 * Determine which tier to show based on drop rates
 * @param {number} cardId - Card ID
 * @param {object} userCollection - User's card collection data
 * @returns {string} Tier to display
 */
export function rollCardTier(cardId, userCollection) {
  const cardData = getCardData(cardId);
  if (!cardData) return 'common';

  const unlockedTiers = [];
  if (hasUnlockedTier(cardId, 'common', userCollection)) unlockedTiers.push('common');
  if (hasUnlockedTier(cardId, 'rare', userCollection)) unlockedTiers.push('rare');
  if (hasUnlockedTier(cardId, 'artifact', userCollection)) unlockedTiers.push('artifact');

  // If only common is unlocked, return it
  if (unlockedTiers.length === 1) return 'common';

  // Roll for tier based on drop rates
  const roll = Math.random();
  const rates = cardManifest.dropRates;

  // Artifact (5% if unlocked)
  if (unlockedTiers.includes('artifact') && roll < rates.artifact) {
    return 'artifact';
  }

  // Rare (25% if unlocked)
  if (unlockedTiers.includes('rare') && roll < (rates.artifact + rates.rare)) {
    return 'rare';
  }

  // Common (70% - fallback)
  return 'common';
}

/**
 * Preload card asset for a specific tier
 * @param {number} cardId - Card ID
 * @param {string} tier - Tier to load
 * @returns {Promise<string|null>} Local URI of loaded asset
 */
export async function preloadCardAsset(cardId, tier) {
  const cardData = getCardData(cardId);
  if (!cardData || !cardData.tiers[tier]) return null;

  const cacheKey = `${cardId}_${tier}`;
  if (assetCache[tier][cacheKey]) {
    return assetCache[tier][cacheKey];
  }

  try {
    const assetPath = cardData.tiers[tier].path;
    const assetSource = getAssetSource(assetPath);

    if (!assetSource) {
      console.error(`Asset not found for card ${cardId} tier ${tier}: ${assetPath}`);
      return null;
    }

    const asset = Asset.fromModule(assetSource);
    await asset.downloadAsync();

    assetCache[tier][cacheKey] = asset.localUri || asset.uri;
    return assetCache[tier][cacheKey];
  } catch (error) {
    console.error(`Failed to load card ${cardId} tier ${tier}:`, error);
    return null;
  }
}

/**
 * Preload multiple cards
 * @param {number[]} cardIds - Array of card IDs
 * @param {string} tier - Tier to load
 * @returns {Promise<void>}
 */
export async function preloadCards(cardIds, tier = 'common') {
  const promises = cardIds.map(id => preloadCardAsset(id, tier));
  await Promise.all(promises);
}

/**
 * Get card asset source for Image/Video component
 * @param {number} cardId - Card ID
 * @param {string} tier - Tier to get
 * @returns {object|null} Asset source object
 */
export function getCardAssetSource(cardId, tier) {
  const cardData = getCardData(cardId);
  if (!cardData || !cardData.tiers[tier]) return null;

  const assetPath = cardData.tiers[tier].path;
  const assetSource = getAssetSource(assetPath);

  if (!assetSource) {
    console.error(`Asset not found for card ${cardId} tier ${tier}: ${assetPath}`);
    return null;
  }

  try {
    // For artifacts (videos), return special video source
    if (tier === 'artifact') {
      return {
        uri: assetSource,
        isVideo: true
      };
    }

    // For images (common/rare)
    return assetSource;
  } catch (error) {
    console.error(`Failed to get asset source for card ${cardId} tier ${tier}:`, error);
    return null;
  }
}

/**
 * Award a tier unlock to user
 * @param {number} cardId - Card ID
 * @param {string} tier - Tier to unlock
 * @param {object} userCollection - Current user collection
 * @returns {object} Updated collection
 */
export function unlockCardTier(cardId, tier, userCollection) {
  const updated = { ...userCollection };

  if (!updated[cardId]) {
    updated[cardId] = {
      unlockedTiers: ['common'], // Common always available
      timesDrawn: 0,
      firstDrawnAt: null
    };
  }

  if (!updated[cardId].unlockedTiers.includes(tier)) {
    updated[cardId].unlockedTiers.push(tier);
    updated[cardId].lastUnlockAt = new Date().toISOString();
  }

  return updated;
}

/**
 * Record a card draw
 * @param {number} cardId - Card ID
 * @param {string} tier - Tier drawn
 * @param {object} userCollection - Current user collection
 * @returns {object} Updated collection
 */
export function recordCardDraw(cardId, tier, userCollection) {
  const updated = { ...userCollection };

  if (!updated[cardId]) {
    updated[cardId] = {
      unlockedTiers: ['common'],
      timesDrawn: 0,
      firstDrawnAt: new Date().toISOString()
    };
  }

  updated[cardId].timesDrawn = (updated[cardId].timesDrawn || 0) + 1;
  updated[cardId].lastDrawnAt = new Date().toISOString();
  updated[cardId].lastTierDrawn = tier;

  if (!updated[cardId].firstDrawnAt) {
    updated[cardId].firstDrawnAt = new Date().toISOString();
  }

  return updated;
}

/**
 * Get collection completion stats
 * @param {object} userCollection - User's collection
 * @returns {object} Stats object
 */
export function getCollectionStats(userCollection) {
  const stats = {
    totalCards: 78,
    commonUnlocked: 78, // Always all available
    rareUnlocked: 0,
    artifactUnlocked: 0,
    cardsSeen: 0,
    majorArcanaArtifacts: 0
  };

  Object.keys(userCollection || {}).forEach(cardId => {
    const card = userCollection[cardId];
    if (card.timesDrawn > 0) stats.cardsSeen++;

    if (card.unlockedTiers?.includes('rare')) stats.rareUnlocked++;
    if (card.unlockedTiers?.includes('artifact')) {
      stats.artifactUnlocked++;
      if (parseInt(cardId) < 22) stats.majorArcanaArtifacts++;
    }
  });

  return stats;
}

export default {
  getCardData,
  getCardBySlug,
  hasUnlockedTier,
  getHighestUnlockedTier,
  rollCardTier,
  preloadCardAsset,
  preloadCards,
  getCardAssetSource,
  unlockCardTier,
  recordCardDraw,
  getCollectionStats
};
