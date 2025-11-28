/**
 * LunatIQ Tarot - Color Palette System
 *
 * Base palette + suit-specific themes matching elemental symbolism
 */

// ============================================================================
// BASE PALETTE (UI, backgrounds, general elements)
// ============================================================================
export const BASE_PALETTE = {
  // Primary colors
  violet: '#8b5cf6',           // Rich violet (primary UI accent)
  cyan: '#00ffff',             // Bright cyan (highlights, glow)
  azure: '#1e90ff',            // Azure blue (secondary accent)
  navyBlue: '#001f3f',         // Deep navy (dark backgrounds)
  voidBlack: '#0a0a0f',        // Pure black (darkest backgrounds)
  gold: '#d4af37',             // Rich gold (text, borders, mystical elements)

  // Supporting colors
  mysticGold: '#f4e4b8',       // Light gold (readable text)
  amberGlow: '#ffb347',        // Orange-gold (warm glow)
  shadowViolet: '#4c1d95',     // Dark violet (shadows)
  deepPurple: '#2a1a4a',       // Deep purple (card backs)
};

// ============================================================================
// SUIT-SPECIFIC PALETTES (Tarot cards by suit + element)
// ============================================================================

// WANDS - Fire Element
export const WANDS_PALETTE = {
  primary: '#8b0000',          // Deep dark red (fire, passion)
  secondary: '#dc143c',        // Crimson (flames)
  accent: '#ff4500',           // Orange-red (embers)
  glow: '#ff6347',             // Tomato red (fire glow)
  shadow: '#4a0000',           // Very dark red (shadow)

  // Gradients for card backgrounds
  gradient: ['#8b0000', '#dc143c', '#4a0000'],
};

// PENTACLES - Earth Element
export const PENTACLES_PALETTE = {
  primary: '#228b22',          // Forest green (earth, growth)
  secondary: '#39ff14',        // Phosphor green (mystical earth magic)
  accent: '#2e8b57',           // Sea green (nature)
  glow: '#7cfc00',             // Bright phosphor (glowing earth)
  shadow: '#0d3d0d',           // Very dark green (shadow)

  // Gradients for card backgrounds
  gradient: ['#0d3d0d', '#228b22', '#2e8b57'],
};

// SWORDS - Air Element
export const SWORDS_PALETTE = {
  primary: '#2f4f4f',          // Dark slate grey (steel, intellect)
  secondary: '#c0c0c0',        // Silver (blade shine)
  accent: '#ffffff',           // White (clarity, truth)
  glow: '#e8e8e8',             // Off-white glow (cold light)
  shadow: '#000000',           // Pure black (shadow, void)

  // Gradients for card backgrounds
  gradient: ['#000000', '#2f4f4f', '#696969'],
};

// CUPS - Water Element
export const CUPS_PALETTE = {
  primary: '#4682b4',          // Steel blue (water)
  secondary: '#00ffff',        // Aqua blue (flowing water)
  accent: '#ffd700',           // Gold (chalice, divine light)
  waterGlow: '#87ceeb',        // Sky blue (water reflection)
  goldGlow: '#ffec8b',         // Light gold (sunlight on water)
  shadow: '#003366',           // Deep water blue (shadow)

  // Gradients for card backgrounds (with water)
  gradientWithWater: ['#003366', '#4682b4', '#00ffff'],
  // Gradients for card backgrounds (golden chalice focus)
  gradientGolden: ['#4682b4', '#ffd700', '#00ffff'],
};

// ============================================================================
// MAJOR ARCANA PALETTE (Symbolism-driven, card-specific)
// ============================================================================
export const MAJOR_ARCANA_PALETTE = {
  // The Fool (0) - New beginnings, innocence
  theFool: {
    primary: '#87ceeb',        // Sky blue (infinite possibility)
    accent: '#ffd700',         // Gold (divine light)
    glow: '#ffffff',           // White (purity)
  },

  // The Magician (I) - Manifestation, power
  theMagician: {
    primary: '#8b5cf6',        // Violet (spiritual power)
    accent: '#ffd700',         // Gold (alchemy)
    glow: '#ff4500',           // Orange-red (elemental fire)
  },

  // The High Priestess (II) - Mystery, intuition
  theHighPriestess: {
    primary: '#4b0082',        // Indigo (deep mystery)
    accent: '#c0c0c0',         // Silver (moon)
    glow: '#e6e6fa',           // Lavender (intuition)
  },

  // The Empress (III) - Fertility, nature
  theEmpress: {
    primary: '#228b22',        // Forest green (nature)
    accent: '#ffd700',         // Gold (abundance)
    glow: '#ff69b4',           // Pink (love, fertility)
  },

  // The Emperor (IV) - Authority, structure
  theEmperor: {
    primary: '#8b0000',        // Deep red (power)
    accent: '#ffd700',         // Gold (throne)
    glow: '#ff4500',           // Orange (authority)
  },

  // The Hierophant (V) - Tradition, spirituality
  theHierophant: {
    primary: '#4c1d95',        // Deep violet (spirituality)
    accent: '#ffd700',         // Gold (divine knowledge)
    glow: '#ffffff',           // White (sacred light)
  },

  // The Lovers (VI) - Union, choice
  theLovers: {
    primary: '#ff69b4',        // Pink (love)
    accent: '#ffd700',         // Gold (divine blessing)
    glow: '#87ceeb',           // Sky blue (harmony)
  },

  // The Chariot (VII) - Willpower, victory
  theChariot: {
    primary: '#4682b4',        // Steel blue (determination)
    accent: '#c0c0c0',         // Silver (armor)
    glow: '#ffd700',           // Gold (triumph)
  },

  // Strength (VIII) - Courage, compassion
  strength: {
    primary: '#ff8c00',        // Dark orange (inner fire)
    accent: '#ffd700',         // Gold (divine strength)
    glow: '#ffec8b',           // Light gold (gentle power)
  },

  // The Hermit (IX) - Introspection, solitude
  theHermit: {
    primary: '#696969',        // Dim grey (solitude)
    accent: '#ffd700',         // Gold (lantern light)
    glow: '#f4e4b8',           // Pale gold (inner wisdom)
  },

  // Wheel of Fortune (X) - Cycles, destiny
  wheelOfFortune: {
    primary: '#8b5cf6',        // Violet (fate)
    accent: '#ffd700',         // Gold (fortune)
    glow: '#00ffff',           // Cyan (cosmic wheel)
  },

  // Justice (XI) - Balance, fairness
  justice: {
    primary: '#4b0082',        // Indigo (judgment)
    accent: '#ffd700',         // Gold (scales)
    glow: '#ffffff',           // White (truth)
  },

  // The Hanged Man (XII) - Sacrifice, new perspective
  theHangedMan: {
    primary: '#4682b4',        // Blue (suspension)
    accent: '#ffd700',         // Gold (halo, enlightenment)
    glow: '#87ceeb',           // Sky blue (reversal)
  },

  // Death (XIII) - Transformation, endings
  death: {
    primary: '#000000',        // Black (void)
    accent: '#ffffff',         // White (rebirth)
    glow: '#8b5cf6',           // Violet (transformation)
  },

  // Temperance (XIV) - Balance, moderation
  temperance: {
    primary: '#4682b4',        // Blue (water)
    accent: '#ffd700',         // Gold (angel)
    glow: '#ff69b4',           // Pink (harmony)
  },

  // The Devil (XV) - Bondage, materialism
  theDevil: {
    primary: '#8b0000',        // Deep red (temptation)
    accent: '#000000',         // Black (darkness)
    glow: '#ff4500',           // Orange-red (hellfire)
  },

  // The Tower (XVI) - Upheaval, revelation
  theTower: {
    primary: '#2f4f4f',        // Dark grey (stone)
    accent: '#ffff00',         // Yellow (lightning)
    glow: '#ff4500',           // Orange-red (destruction)
  },

  // The Star (XVII) - Hope, inspiration
  theStar: {
    primary: '#001f3f',        // Navy blue (night sky)
    accent: '#ffd700',         // Gold (stars)
    glow: '#00ffff',           // Cyan (cosmic hope)
  },

  // The Moon (XVIII) - Illusion, subconscious
  theMoon: {
    primary: '#191970',        // Midnight blue (night)
    accent: '#c0c0c0',         // Silver (moonlight)
    glow: '#e6e6fa',           // Lavender (mystery)
  },

  // The Sun (XIX) - Joy, success
  theSun: {
    primary: '#ffd700',        // Gold (sunlight)
    accent: '#ff8c00',         // Dark orange (warmth)
    glow: '#ffff00',           // Yellow (radiance)
  },

  // Judgement (XX) - Rebirth, reckoning
  judgement: {
    primary: '#87ceeb',        // Sky blue (heaven)
    accent: '#ffd700',         // Gold (angel trumpets)
    glow: '#ffffff',           // White (resurrection)
  },

  // The World (XXI) - Completion, accomplishment
  theWorld: {
    primary: '#4b0082',        // Indigo (cosmic)
    accent: '#ffd700',         // Gold (achievement)
    glow: '#8b5cf6',           // Violet (universal)
  },
};

// ============================================================================
// UI COMPONENT COLORS
// ============================================================================
export const UI_COLORS = {
  // Buttons
  buttonPrimary: BASE_PALETTE.gold,
  buttonSecondary: BASE_PALETTE.violet,
  buttonDisabled: '#4a4a4a',
  buttonText: '#ffffff',

  // Text
  textPrimary: BASE_PALETTE.mysticGold,
  textSecondary: '#e0e0e0',
  textAccent: BASE_PALETTE.cyan,
  textDisabled: '#808080',

  // Backgrounds
  backgroundDark: BASE_PALETTE.voidBlack,
  backgroundMedium: BASE_PALETTE.navyBlue,
  backgroundLight: BASE_PALETTE.deepPurple,

  // Borders & Dividers
  borderGold: BASE_PALETTE.gold,
  borderViolet: BASE_PALETTE.violet,
  borderCyan: BASE_PALETTE.cyan,

  // Effects
  glowGold: BASE_PALETTE.amberGlow,
  glowCyan: BASE_PALETTE.cyan,
  glowViolet: BASE_PALETTE.violet,
  shadowDark: 'rgba(0, 0, 0, 0.8)',
};

// ============================================================================
// PARTICLE EFFECT COLORS
// ============================================================================
export const PARTICLE_COLORS = {
  // Sparkles
  sparkleGold: '#ffe55c',
  sparkleCyan: '#00ffff',
  sparkleViolet: '#8b5cf6',

  // Glitter bubbles
  glitterGold: BASE_PALETTE.gold,
  glitterPhosphor: PENTACLES_PALETTE.secondary, // Phosphor green

  // Fae trails
  faeMistGold: 'rgba(212, 175, 55, 0.3)',
  faeMistViolet: 'rgba(139, 92, 246, 0.3)',
  faeMistCyan: 'rgba(0, 255, 255, 0.2)',

  // Mist overlays
  mistDark: 'rgba(26, 13, 46, 0.7)',
  mistLight: 'rgba(212, 175, 55, 0.2)',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color palette for a specific tarot card
 */
export function getCardPalette(card) {
  // Major Arcana - use card-specific palette
  if (card.arcana === 'Major') {
    const cardKey = card.name.toLowerCase().replace(/\s+/g, '');
    // Convert "The Fool" → "theFool"
    const camelKey = cardKey.replace(/^the/, 'the').replace(/^(.)/, (m) => m.toLowerCase());
    return MAJOR_ARCANA_PALETTE[camelKey] || BASE_PALETTE;
  }

  // Minor Arcana - use suit palette
  switch (card.suit) {
    case 'wands':
      return WANDS_PALETTE;
    case 'cups':
      return CUPS_PALETTE;
    case 'swords':
      return SWORDS_PALETTE;
    case 'pentacles':
      return PENTACLES_PALETTE;
    default:
      return BASE_PALETTE;
  }
}

/**
 * Get gradient for card background
 */
export function getCardGradient(card) {
  const palette = getCardPalette(card);
  return palette.gradient || [palette.primary, palette.accent, palette.shadow];
}

/**
 * Get glow color for card
 */
export function getCardGlow(card) {
  const palette = getCardPalette(card);
  return palette.glow || BASE_PALETTE.gold;
}

/**
 * Convert hex to rgba
 */
export function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default {
  BASE_PALETTE,
  WANDS_PALETTE,
  PENTACLES_PALETTE,
  SWORDS_PALETTE,
  CUPS_PALETTE,
  MAJOR_ARCANA_PALETTE,
  UI_COLORS,
  PARTICLE_COLORS,
  getCardPalette,
  getCardGradient,
  getCardGlow,
  hexToRgba,
};
