/**
 * VISUAL CUSTOMIZATION SYSTEM
 *
 * A highly-granular, multi-layer visual system allowing users full control
 * over every visual aspect of their VeilPath experience.
 *
 * LAYER ARCHITECTURE (bottom to top):
 * 1. Foundation Layer - Solid background color (required, non-transparent)
 * 2. Background Art Layer - PNG/MP4 with adjustable transparency (0-100%)
 * 3. Effect Layer - Particle effects with adjustable transparency (0-100%)
 * 4. UI Theme Layer - Buttons, frames, borders, panels with theme styling
 * 5. Content Layer - Cards, text, interactive elements
 *
 * USER CONTROLS:
 * - Up to 10 saved presets
 * - Template mode (quick selection) or Granular mode (full control)
 * - Per-deck card back pooling (random from owned collection)
 * - Mix-and-match card fronts from different art styles
 */

import { CosmeticCategory, Rarity } from './cosmeticsTypes';

// =============================================================================
// LAYER DEFINITIONS
// =============================================================================

export interface VisualLayer {
  id: string;
  name: string;
  zIndex: number;
  description: string;
  supportsTransparency: boolean;
  supportsAnimation: boolean;
}

export const VISUAL_LAYERS: VisualLayer[] = [
  {
    id: 'foundation',
    name: 'Foundation Color',
    zIndex: 0,
    description: 'Solid background color - the base of everything',
    supportsTransparency: false, // Never transparent
    supportsAnimation: false,
  },
  {
    id: 'background_art',
    name: 'Background Art',
    zIndex: 1,
    description: 'Background image or video (PNG/MP4)',
    supportsTransparency: true, // 0-100%
    supportsAnimation: true, // MP4 support
  },
  {
    id: 'effect_overlay',
    name: 'Effect Overlay',
    zIndex: 2,
    description: 'Particle effects, animations (fireworks, embers, etc.)',
    supportsTransparency: true, // 0-100%, default 70%
    supportsAnimation: true,
  },
  {
    id: 'ui_theme',
    name: 'UI Theme',
    zIndex: 3,
    description: 'Buttons, frames, borders, panels, navigation',
    supportsTransparency: true,
    supportsAnimation: true, // Animated buttons/icons
  },
  {
    id: 'content',
    name: 'Content',
    zIndex: 4,
    description: 'Cards, text, interactive elements',
    supportsTransparency: false,
    supportsAnimation: true,
  },
];

// =============================================================================
// FOUNDATION COLORS
// =============================================================================

export interface FoundationColor {
  id: string;
  name: string;
  hex: string;
  category: 'dark' | 'light' | 'vibrant' | 'custom';
  unlockMethod?: string; // Achievement, purchase, or free
}

export const FOUNDATION_COLORS: FoundationColor[] = [
  // Dark (Free defaults)
  { id: 'void_black', name: 'Void Black', hex: '#000000', category: 'dark' },
  { id: 'midnight_blue', name: 'Midnight Blue', hex: '#0d1b2a', category: 'dark' },
  { id: 'deep_purple', name: 'Deep Purple', hex: '#1a0a2e', category: 'dark' },
  { id: 'charcoal', name: 'Charcoal', hex: '#1a1a1a', category: 'dark' },
  { id: 'forest_night', name: 'Forest Night', hex: '#0a1f0a', category: 'dark' },

  // Light (Purchase/Achievement)
  { id: 'parchment', name: 'Ancient Parchment', hex: '#f5f0e1', category: 'light', unlockMethod: 'purchase' },
  { id: 'cream', name: 'Cream', hex: '#fffdd0', category: 'light', unlockMethod: 'purchase' },
  { id: 'soft_lavender', name: 'Soft Lavender', hex: '#e6e6fa', category: 'light', unlockMethod: 'purchase' },

  // Vibrant (Premium)
  { id: 'blood_red', name: 'Blood Moon', hex: '#4a0000', category: 'vibrant', unlockMethod: 'purchase' },
  { id: 'ocean_depth', name: 'Ocean Depth', hex: '#001133', category: 'vibrant', unlockMethod: 'purchase' },
  { id: 'cosmic_purple', name: 'Cosmic Purple', hex: '#2a0a4a', category: 'vibrant', unlockMethod: 'purchase' },
  { id: 'ember_glow', name: 'Ember Glow', hex: '#1a0500', category: 'vibrant', unlockMethod: 'celestial_fire_collection' },
];

// =============================================================================
// BACKGROUND ART TYPES
// =============================================================================

export type BackgroundArtType = 'static' | 'animated' | 'parallax';

export interface BackgroundArt {
  id: string;
  name: string;
  type: BackgroundArtType;
  assetPath: string;
  thumbnailPath: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | 'fill';
  rarity: Rarity;
  collectionId?: string;
  eventId?: string;
  unlockMethod: 'free' | 'purchase' | 'achievement' | 'event' | 'subscription';
  defaultTransparency: number; // 0-100
  lore?: string;
}

export const BACKGROUND_ART: BackgroundArt[] = [
  // Free defaults (from beta/ad_assets)
  {
    id: 'bg_cosmic_swirl',
    name: 'Cosmic Swirl',
    type: 'animated',
    assetPath: '/assets/backgrounds/cosmic_swirl.mp4',
    thumbnailPath: '/assets/backgrounds/thumbs/cosmic_swirl.jpg',
    aspectRatio: '16:9',
    rarity: 'common',
    unlockMethod: 'free',
    defaultTransparency: 80,
    lore: 'A gift to all who walk the Veil Path.',
  },
  {
    id: 'bg_starfield',
    name: 'Starfield',
    type: 'animated',
    assetPath: '/assets/backgrounds/starfield.mp4',
    thumbnailPath: '/assets/backgrounds/thumbs/starfield.jpg',
    aspectRatio: '16:9',
    rarity: 'common',
    unlockMethod: 'free',
    defaultTransparency: 85,
  },
  {
    id: 'bg_mystical_fog',
    name: 'Mystical Fog',
    type: 'animated',
    assetPath: '/assets/backgrounds/mystical_fog.mp4',
    thumbnailPath: '/assets/backgrounds/thumbs/mystical_fog.jpg',
    aspectRatio: '16:9',
    rarity: 'uncommon',
    unlockMethod: 'free',
    defaultTransparency: 70,
  },

  // Beta player exclusive
  {
    id: 'bg_beta_nebula',
    name: 'Beta Nebula',
    type: 'animated',
    assetPath: '/assets/backgrounds/beta_nebula.mp4',
    thumbnailPath: '/assets/backgrounds/thumbs/beta_nebula.jpg',
    aspectRatio: '16:9',
    rarity: 'epic',
    unlockMethod: 'achievement',
    defaultTransparency: 75,
    lore: 'Awarded to beta testers. There will never be more.',
  },

  // Collection-themed
  {
    id: 'bg_celestial_fire',
    name: 'Celestial Fire Sky',
    type: 'animated',
    assetPath: '/assets/backgrounds/celestial_fire_sky.mp4',
    thumbnailPath: '/assets/backgrounds/thumbs/celestial_fire_sky.jpg',
    aspectRatio: '16:9',
    rarity: 'rare',
    collectionId: 'celestial_fire',
    unlockMethod: 'purchase',
    defaultTransparency: 75,
  },
  {
    id: 'bg_abyssal_depths',
    name: 'Abyssal Depths',
    type: 'animated',
    assetPath: '/assets/backgrounds/abyssal_depths.mp4',
    thumbnailPath: '/assets/backgrounds/thumbs/abyssal_depths.jpg',
    aspectRatio: '16:9',
    rarity: 'rare',
    collectionId: 'abyssal_depths',
    unlockMethod: 'purchase',
    defaultTransparency: 80,
  },
];

// =============================================================================
// EFFECT OVERLAYS (Particle Systems)
// =============================================================================

export type EffectType = 'particle' | 'shader' | '3d' | 'lottie';

export interface EffectOverlay {
  id: string;
  name: string;
  type: EffectType;
  assetPath: string; // Lottie JSON, shader config, or particle config
  thumbnailPath: string;
  rarity: Rarity;
  eventId?: string;
  collectionId?: string;
  unlockMethod: 'free' | 'purchase' | 'achievement' | 'event' | 'subscription';
  defaultTransparency: number;
  performanceImpact: 'low' | 'medium' | 'high';
  description: string;
}

export const EFFECT_OVERLAYS: EffectOverlay[] = [
  // Free effects
  {
    id: 'effect_gentle_stars',
    name: 'Gentle Stars',
    type: 'particle',
    assetPath: '/assets/effects/gentle_stars.json',
    thumbnailPath: '/assets/effects/thumbs/gentle_stars.jpg',
    rarity: 'common',
    unlockMethod: 'free',
    defaultTransparency: 60,
    performanceImpact: 'low',
    description: 'Subtle twinkling stars',
  },
  {
    id: 'effect_dust_motes',
    name: 'Dust Motes',
    type: 'particle',
    assetPath: '/assets/effects/dust_motes.json',
    thumbnailPath: '/assets/effects/thumbs/dust_motes.jpg',
    rarity: 'common',
    unlockMethod: 'free',
    defaultTransparency: 50,
    performanceImpact: 'low',
    description: 'Floating particles catching light',
  },

  // Seasonal event - 4th of July
  {
    id: 'effect_fireworks_usa',
    name: 'Independence Day Fireworks',
    type: '3d',
    assetPath: '/assets/effects/fireworks_usa.json',
    thumbnailPath: '/assets/effects/thumbs/fireworks_usa.jpg',
    rarity: 'epic',
    eventId: 'independence_day_2026',
    unlockMethod: 'event',
    defaultTransparency: 70,
    performanceImpact: 'high',
    description: 'Spectacular 3D fireworks in red, white, and blue',
  },

  // Collection effects
  {
    id: 'effect_ember_rain',
    name: 'Ember Rain',
    type: 'particle',
    assetPath: '/assets/effects/ember_rain.json',
    thumbnailPath: '/assets/effects/thumbs/ember_rain.jpg',
    rarity: 'rare',
    collectionId: 'celestial_fire',
    unlockMethod: 'purchase',
    defaultTransparency: 65,
    performanceImpact: 'medium',
    description: 'Gentle embers falling like rain',
  },
  {
    id: 'effect_rising_bubbles',
    name: 'Rising Bubbles',
    type: 'particle',
    assetPath: '/assets/effects/rising_bubbles.json',
    thumbnailPath: '/assets/effects/thumbs/rising_bubbles.jpg',
    rarity: 'rare',
    collectionId: 'abyssal_depths',
    unlockMethod: 'purchase',
    defaultTransparency: 55,
    performanceImpact: 'low',
    description: 'Bioluminescent bubbles rising slowly',
  },
  {
    id: 'effect_void_particles',
    name: 'Void Particles',
    type: 'shader',
    assetPath: '/assets/effects/void_particles.glsl',
    thumbnailPath: '/assets/effects/thumbs/void_particles.jpg',
    rarity: 'legendary',
    collectionId: 'void_walker',
    unlockMethod: 'purchase',
    defaultTransparency: 70,
    performanceImpact: 'high',
    description: 'Reality-distorting void energy',
  },

  // Winter seasonal
  {
    id: 'effect_snowfall',
    name: 'Gentle Snowfall',
    type: 'particle',
    assetPath: '/assets/effects/snowfall.json',
    thumbnailPath: '/assets/effects/thumbs/snowfall.jpg',
    rarity: 'rare',
    eventId: 'winter_solstice_2025',
    unlockMethod: 'event',
    defaultTransparency: 60,
    performanceImpact: 'low',
    description: 'Soft snow falling gently',
  },
  {
    id: 'effect_aurora',
    name: 'Aurora Borealis',
    type: 'shader',
    assetPath: '/assets/effects/aurora.glsl',
    thumbnailPath: '/assets/effects/thumbs/aurora.jpg',
    rarity: 'epic',
    eventId: 'winter_solstice_2025',
    unlockMethod: 'event',
    defaultTransparency: 75,
    performanceImpact: 'medium',
    description: 'Northern lights dancing across the sky',
  },
];

// =============================================================================
// CARD DECK CONFIGURATION
// =============================================================================

export type CardArtStyle = 'rider_waite' | 'smith_waite' | 'midjourney' | 'custom';

export interface CardDeckConfig {
  id: string;
  name: string;
  artStyle: CardArtStyle;
  cardFrontPath: string; // Base path for card images
  format: 'png' | 'mp4' | 'webp';
  animated: boolean;
  rarity: Rarity;
  unlockMethod: 'free' | 'purchase' | 'achievement' | 'subscription';
  description: string;
}

export const CARD_DECKS: CardDeckConfig[] = [
  {
    id: 'deck_rider_waite',
    name: 'Rider-Waite Classic',
    artStyle: 'rider_waite',
    cardFrontPath: '/assets/cards/rider_waite/',
    format: 'png',
    animated: false,
    rarity: 'common',
    unlockMethod: 'free',
    description: 'The timeless classic Rider-Waite-Smith deck',
  },
  {
    id: 'deck_smith_waite',
    name: 'Smith-Waite Centennial',
    artStyle: 'smith_waite',
    cardFrontPath: '/assets/cards/smith_waite/',
    format: 'png',
    animated: false,
    rarity: 'uncommon',
    unlockMethod: 'free',
    description: 'Pamela Colman Smith\'s original artwork restored',
  },
  {
    id: 'deck_veilpath_static',
    name: 'VeilPath Mystical',
    artStyle: 'midjourney',
    cardFrontPath: '/assets/cards/veilpath_static/',
    format: 'png',
    animated: false,
    rarity: 'rare',
    unlockMethod: 'purchase',
    description: 'AI-generated mystical artwork exclusive to VeilPath',
  },
  {
    id: 'deck_veilpath_animated',
    name: 'VeilPath Living Cards',
    artStyle: 'midjourney',
    cardFrontPath: '/assets/cards/veilpath_animated/',
    format: 'mp4',
    animated: true,
    rarity: 'epic',
    unlockMethod: 'purchase',
    description: 'Animated cards that breathe with mystical energy',
  },
  {
    id: 'deck_celestial_fire',
    name: 'Celestial Fire Deck',
    artStyle: 'midjourney',
    cardFrontPath: '/assets/cards/celestial_fire/',
    format: 'mp4',
    animated: true,
    rarity: 'legendary',
    unlockMethod: 'purchase',
    description: 'Each card burns with cosmic flames',
  },
];

// =============================================================================
// USER PRESET CONFIGURATION
// =============================================================================

export const MAX_PRESETS = 10;

export interface VisualPreset {
  id: string;
  name: string;
  isTemplate: boolean; // Template mode or granular mode
  userId?: string; // null for system templates

  // Layer configurations
  foundation: FoundationConfig;
  backgroundArt: BackgroundArtConfig | null;
  effectOverlay: EffectOverlayConfig | null;
  uiTheme: UIThemeConfig;

  // Card configuration
  cardConfig: CardConfig;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface FoundationConfig {
  colorId: string;
  customHex?: string; // For custom colors
}

export interface BackgroundArtConfig {
  artId: string;
  transparency: number; // 0-100
  positionX: number; // -100 to 100 (percentage offset)
  positionY: number; // -100 to 100
  scale: number; // 0.5 to 2.0
  blur: number; // 0-20px
}

export interface EffectOverlayConfig {
  effectId: string;
  transparency: number; // 0-100
  intensity: number; // 0.1 to 2.0
  speed: number; // 0.5 to 2.0
  color?: string; // Optional tint
}

export interface UIThemeConfig {
  themeId: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  buttonStyle?: 'solid' | 'gradient' | 'glass' | 'animated';
  borderStyle?: 'none' | 'subtle' | 'ornate' | 'animated';
  transparency: number; // 0-100 for glass effects
}

export interface CardConfig {
  // Card front (deck) selection
  primaryDeckId: string;
  mixedDecks: boolean; // Allow multiple decks
  deckPool: string[]; // If mixed, which decks to pull from

  // Card back pooling
  cardBackMode: 'single' | 'random' | 'per_suit' | 'per_card';
  primaryCardBackId: string;
  cardBackPool: string[]; // All owned card backs in rotation
  cardBackBySuit?: { // For per_suit mode
    wands: string[];
    cups: string[];
    swords: string[];
    pentacles: string[];
    major: string[];
  };

  // Card animations
  flipAnimationId: string;
  revealEffectId: string;
}

// =============================================================================
// SYSTEM TEMPLATES (Pre-made presets)
// =============================================================================

export const SYSTEM_TEMPLATES: VisualPreset[] = [
  {
    id: 'template_classic_dark',
    name: 'Classic Dark',
    isTemplate: true,
    foundation: { colorId: 'void_black' },
    backgroundArt: {
      artId: 'bg_starfield',
      transparency: 85,
      positionX: 0,
      positionY: 0,
      scale: 1,
      blur: 0,
    },
    effectOverlay: {
      effectId: 'effect_gentle_stars',
      transparency: 60,
      intensity: 1,
      speed: 1,
    },
    uiTheme: {
      themeId: 'theme_default_dark',
      buttonStyle: 'gradient',
      borderStyle: 'subtle',
      transparency: 90,
    },
    cardConfig: {
      primaryDeckId: 'deck_rider_waite',
      mixedDecks: false,
      deckPool: ['deck_rider_waite'],
      cardBackMode: 'single',
      primaryCardBackId: 'back_default',
      cardBackPool: [],
      flipAnimationId: 'flip_default',
      revealEffectId: 'reveal_default',
    },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'template_celestial_fire',
    name: 'Celestial Fire',
    isTemplate: true,
    foundation: { colorId: 'ember_glow' },
    backgroundArt: {
      artId: 'bg_celestial_fire',
      transparency: 75,
      positionX: 0,
      positionY: 0,
      scale: 1,
      blur: 2,
    },
    effectOverlay: {
      effectId: 'effect_ember_rain',
      transparency: 65,
      intensity: 1.2,
      speed: 0.8,
    },
    uiTheme: {
      themeId: 'theme_celestial_fire',
      primaryColor: '#FF4500',
      accentColor: '#FFD700',
      buttonStyle: 'animated',
      borderStyle: 'ornate',
      transparency: 85,
    },
    cardConfig: {
      primaryDeckId: 'deck_celestial_fire',
      mixedDecks: false,
      deckPool: ['deck_celestial_fire'],
      cardBackMode: 'single',
      primaryCardBackId: 'back_celestial_fire',
      cardBackPool: [],
      flipAnimationId: 'flip_celestial_fire',
      revealEffectId: 'reveal_celestial_fire',
    },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'template_collectors_showcase',
    name: "Collector's Random",
    isTemplate: true,
    foundation: { colorId: 'deep_purple' },
    backgroundArt: {
      artId: 'bg_cosmic_swirl',
      transparency: 80,
      positionX: 0,
      positionY: 0,
      scale: 1.1,
      blur: 3,
    },
    effectOverlay: {
      effectId: 'effect_dust_motes',
      transparency: 50,
      intensity: 1,
      speed: 0.7,
    },
    uiTheme: {
      themeId: 'theme_default_dark',
      buttonStyle: 'glass',
      borderStyle: 'subtle',
      transparency: 95,
    },
    cardConfig: {
      primaryDeckId: 'deck_veilpath_static',
      mixedDecks: true, // Mix multiple decks!
      deckPool: ['deck_rider_waite', 'deck_veilpath_static', 'deck_veilpath_animated'],
      cardBackMode: 'random', // Random from entire collection!
      primaryCardBackId: 'back_default',
      cardBackPool: [], // Populated with ALL owned backs
      flipAnimationId: 'flip_default',
      revealEffectId: 'reveal_default',
    },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// =============================================================================
// CONFIGURATION DEFAULTS & LIMITS
// =============================================================================

export const CUSTOMIZATION_LIMITS = {
  maxPresets: 10,
  maxCardBacksInPool: 200,
  maxDecksInPool: 10,
  transparencyMin: 0,
  transparencyMax: 100,
  intensityMin: 0.1,
  intensityMax: 2.0,
  speedMin: 0.5,
  speedMax: 2.0,
  scaleMin: 0.5,
  scaleMax: 2.0,
  blurMax: 20,
};

export const DEFAULT_VALUES = {
  backgroundTransparency: 80,
  effectTransparency: 70,
  uiTransparency: 90,
  effectIntensity: 1.0,
  effectSpeed: 1.0,
  backgroundScale: 1.0,
  backgroundBlur: 0,
};

// =============================================================================
// UTILITY TYPES & FUNCTIONS
// =============================================================================

export function createDefaultPreset(
  userId: string,
  presetName: string
): VisualPreset {
  return {
    id: `preset_${userId}_${Date.now()}`,
    name: presetName,
    isTemplate: false,
    userId,
    foundation: { colorId: 'void_black' },
    backgroundArt: {
      artId: 'bg_starfield',
      transparency: DEFAULT_VALUES.backgroundTransparency,
      positionX: 0,
      positionY: 0,
      scale: 1,
      blur: 0,
    },
    effectOverlay: null, // No effect by default
    uiTheme: {
      themeId: 'theme_default_dark',
      buttonStyle: 'gradient',
      borderStyle: 'subtle',
      transparency: DEFAULT_VALUES.uiTransparency,
    },
    cardConfig: {
      primaryDeckId: 'deck_rider_waite',
      mixedDecks: false,
      deckPool: ['deck_rider_waite'],
      cardBackMode: 'single',
      primaryCardBackId: 'back_default',
      cardBackPool: [],
      flipAnimationId: 'flip_default',
      revealEffectId: 'reveal_default',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function validateTransparency(value: number): number {
  return Math.max(
    CUSTOMIZATION_LIMITS.transparencyMin,
    Math.min(CUSTOMIZATION_LIMITS.transparencyMax, value)
  );
}

export function validateIntensity(value: number): number {
  return Math.max(
    CUSTOMIZATION_LIMITS.intensityMin,
    Math.min(CUSTOMIZATION_LIMITS.intensityMax, value)
  );
}

// Get card back for a specific card in a reading
export function getCardBackForCard(
  config: CardConfig,
  cardId: string,
  suit: 'wands' | 'cups' | 'swords' | 'pentacles' | 'major',
  ownedCardBacks: string[]
): string {
  switch (config.cardBackMode) {
    case 'single':
      return config.primaryCardBackId;

    case 'random':
      const pool = config.cardBackPool.length > 0
        ? config.cardBackPool
        : ownedCardBacks;
      return pool[Math.floor(Math.random() * pool.length)] || config.primaryCardBackId;

    case 'per_suit':
      if (config.cardBackBySuit && config.cardBackBySuit[suit]) {
        const suitPool = config.cardBackBySuit[suit];
        return suitPool[Math.floor(Math.random() * suitPool.length)] || config.primaryCardBackId;
      }
      return config.primaryCardBackId;

    case 'per_card':
      // Future: Allow specific card -> back mapping
      return config.primaryCardBackId;

    default:
      return config.primaryCardBackId;
  }
}

export default {
  VISUAL_LAYERS,
  FOUNDATION_COLORS,
  BACKGROUND_ART,
  EFFECT_OVERLAYS,
  CARD_DECKS,
  SYSTEM_TEMPLATES,
  CUSTOMIZATION_LIMITS,
  DEFAULT_VALUES,
  createDefaultPreset,
  validateTransparency,
  validateIntensity,
  getCardBackForCard,
};
