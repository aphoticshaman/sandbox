/**
 * VeilPath Tarot - Asset Manifest
 * Comprehensive categorization of all available art assets
 *
 * NOTE: This manifest reflects the current asset structure.
 * Only references assets that actually exist.
 */

// ═══════════════════════════════════════════════════════════
// AVAILABLE ASSETS - Verified to exist
// ═══════════════════════════════════════════════════════════

export const ASSET_MANIFEST = {
  // ═══════════════════════════════════════════════════════════
  // BACKGROUNDS (backgrounds/)
  // ═══════════════════════════════════════════════════════════
  backgrounds: {
    cosmic_0: {
      path: require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__6452324a-78d8-48ee-9228-85601e1010ef_0.png'),
      usage: 'App background',
      resizeMode: 'cover',
    },
    cosmic_1: {
      path: require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__6452324a-78d8-48ee-9228-85601e1010ef_2.png'),
      usage: 'App background variant',
      resizeMode: 'cover',
    },
    cosmic_2: {
      path: require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__6452324a-78d8-48ee-9228-85601e1010ef_3.png'),
      usage: 'App background variant',
      resizeMode: 'cover',
    },
    cosmic_3: {
      path: require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__786aa9ce-8a40-4bc2-9cdd-38d228b0c091_0.png'),
      usage: 'Auth background',
      resizeMode: 'cover',
    },
    cosmic_4: {
      path: require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__786aa9ce-8a40-4bc2-9cdd-38d228b0c091_2.png'),
      usage: 'Auth background variant',
      resizeMode: 'cover',
    },
    cosmic_5: {
      path: require('../../assets/art/backgrounds/aphoticshaman_dark_elegant_cosmic_background_deep_space_navy__b97a019c-43b3-4cd1-bffd-01320588e3ae_2.png'),
      usage: 'Onboarding background',
      resizeMode: 'cover',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // CARD ELEMENTS (cardback/)
  // ═══════════════════════════════════════════════════════════
  cards: {
    card_back: {
      path: require('../../assets/art/cardback/card_back.png'),
      usage: 'Default tarot card back',
      resizeMode: 'contain',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // CARD VIDEOS - Not currently available (empty placeholder)
  // ═══════════════════════════════════════════════════════════
  cardVideos: {},

  // ═══════════════════════════════════════════════════════════
  // ICONS - Not currently available (using text/emoji fallbacks)
  // ═══════════════════════════════════════════════════════════
  icons: {},

  // ═══════════════════════════════════════════════════════════
  // BUTTONS - Not currently available (using styled components)
  // ═══════════════════════════════════════════════════════════
  buttons: {},

  // ═══════════════════════════════════════════════════════════
  // ANIMATED - Not currently available
  // ═══════════════════════════════════════════════════════════
  animated: {},
};

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Get background asset by key
 */
export function getBackground(key) {
  return ASSET_MANIFEST.backgrounds[key]?.path || null;
}

/**
 * Get random background
 */
export function getRandomBackground() {
  const keys = Object.keys(ASSET_MANIFEST.backgrounds);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return ASSET_MANIFEST.backgrounds[randomKey]?.path || null;
}

/**
 * Get card video by name - returns null since videos not available
 */
export function getCardVideo(cardName) {
  return null;
}

/**
 * Get button asset by key - returns null since button assets not available
 */
export function getButton(key) {
  return null;
}

/**
 * Get icon asset by key - returns null since icon assets not available
 */
export function getIcon(key) {
  return null;
}

/**
 * Get card back
 */
export function getCardBack() {
  return ASSET_MANIFEST.cards.card_back?.path || null;
}

export default ASSET_MANIFEST;
