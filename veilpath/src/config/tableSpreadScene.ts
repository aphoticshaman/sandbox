/**
 * TABLE SPREAD SCENE SYSTEM
 *
 * Creates the immersive 2D composited "table view" for readings.
 *
 * Visual Elements (layered composition):
 * 1. Table surface with velvet cloth
 * 2. Ambient elements (candles, smoke, shadows)
 * 3. Card box (ornate wooden box that "held" the cards)
 * 4. Cards laid out according to spread pattern
 * 5. UI overlays (interpretation text, controls)
 *
 * The scene dynamically composites:
 * - User's card back cosmetics (per their settings)
 * - User's card front deck choice
 * - Face-up/face-down based on reading progress
 * - User's theme affecting ambient lighting
 */

import { CosmeticCategory, Rarity } from './cosmeticsTypes';
import { CardConfig, getCardBackForCard } from './visualCustomization';

// =============================================================================
// SCENE LAYER DEFINITIONS
// =============================================================================

export interface SceneLayer {
  id: string;
  name: string;
  zIndex: number;
  type: 'static' | 'animated' | 'dynamic' | 'interactive';
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
}

export const SCENE_LAYERS: SceneLayer[] = [
  { id: 'table_base', name: 'Table Surface', zIndex: 0, type: 'static', blendMode: 'normal' },
  { id: 'velvet_cloth', name: 'Velvet Cloth', zIndex: 1, type: 'static', blendMode: 'normal' },
  { id: 'ambient_shadows', name: 'Ambient Shadows', zIndex: 2, type: 'animated', blendMode: 'multiply' },
  { id: 'card_box', name: 'Card Box', zIndex: 3, type: 'static', blendMode: 'normal' },
  { id: 'card_spread', name: 'Card Spread', zIndex: 4, type: 'dynamic', blendMode: 'normal' },
  { id: 'candles', name: 'Candles', zIndex: 5, type: 'animated', blendMode: 'normal' },
  { id: 'candle_glow', name: 'Candle Glow', zIndex: 6, type: 'animated', blendMode: 'screen' },
  { id: 'smoke_particles', name: 'Smoke', zIndex: 7, type: 'animated', blendMode: 'soft-light' },
  { id: 'ui_overlay', name: 'UI Overlay', zIndex: 8, type: 'interactive', blendMode: 'normal' },
];

// =============================================================================
// TABLE SURFACE STYLES
// =============================================================================

export interface TableSurface {
  id: string;
  name: string;
  texturePath: string;
  thumbnailPath: string;
  woodType: 'oak' | 'mahogany' | 'walnut' | 'ebony' | 'mystical';
  rarity: Rarity;
  unlockMethod: 'free' | 'purchase' | 'achievement' | 'collection';
}

export const TABLE_SURFACES: TableSurface[] = [
  {
    id: 'table_oak_classic',
    name: 'Classic Oak',
    texturePath: '/assets/scene/tables/oak_classic.png',
    thumbnailPath: '/assets/scene/tables/thumbs/oak_classic.jpg',
    woodType: 'oak',
    rarity: 'common',
    unlockMethod: 'free',
  },
  {
    id: 'table_mahogany_ornate',
    name: 'Ornate Mahogany',
    texturePath: '/assets/scene/tables/mahogany_ornate.png',
    thumbnailPath: '/assets/scene/tables/thumbs/mahogany_ornate.jpg',
    woodType: 'mahogany',
    rarity: 'uncommon',
    unlockMethod: 'purchase',
  },
  {
    id: 'table_walnut_antique',
    name: 'Antique Walnut',
    texturePath: '/assets/scene/tables/walnut_antique.png',
    thumbnailPath: '/assets/scene/tables/thumbs/walnut_antique.jpg',
    woodType: 'walnut',
    rarity: 'rare',
    unlockMethod: 'purchase',
  },
  {
    id: 'table_ebony_midnight',
    name: 'Midnight Ebony',
    texturePath: '/assets/scene/tables/ebony_midnight.png',
    thumbnailPath: '/assets/scene/tables/thumbs/ebony_midnight.jpg',
    woodType: 'ebony',
    rarity: 'epic',
    unlockMethod: 'purchase',
  },
  {
    id: 'table_mystical_void',
    name: 'Void-Touched',
    texturePath: '/assets/scene/tables/mystical_void.png',
    thumbnailPath: '/assets/scene/tables/thumbs/mystical_void.jpg',
    woodType: 'mystical',
    rarity: 'legendary',
    unlockMethod: 'collection',
  },
];

// =============================================================================
// VELVET CLOTH STYLES
// =============================================================================

export interface VelvetCloth {
  id: string;
  name: string;
  texturePath: string;
  thumbnailPath: string;
  color: string;
  pattern: 'solid' | 'embroidered' | 'sigils' | 'celestial' | 'ornate';
  hasGoldTrim: boolean;
  hasSilverTrim: boolean;
  rarity: Rarity;
  collectionId?: string;
  unlockMethod: 'free' | 'purchase' | 'achievement' | 'collection';
}

export const VELVET_CLOTHS: VelvetCloth[] = [
  // Free defaults
  {
    id: 'velvet_deep_purple',
    name: 'Deep Purple Velvet',
    texturePath: '/assets/scene/cloths/deep_purple.png',
    thumbnailPath: '/assets/scene/cloths/thumbs/deep_purple.jpg',
    color: '#2a0a4a',
    pattern: 'solid',
    hasGoldTrim: true,
    hasSilverTrim: false,
    rarity: 'common',
    unlockMethod: 'free',
  },
  {
    id: 'velvet_midnight_blue',
    name: 'Midnight Blue Velvet',
    texturePath: '/assets/scene/cloths/midnight_blue.png',
    thumbnailPath: '/assets/scene/cloths/thumbs/midnight_blue.jpg',
    color: '#0d1b2a',
    pattern: 'solid',
    hasGoldTrim: false,
    hasSilverTrim: true,
    rarity: 'common',
    unlockMethod: 'free',
  },

  // Collection-themed
  {
    id: 'velvet_celestial_fire',
    name: 'Ember Velvet',
    texturePath: '/assets/scene/cloths/ember_velvet.png',
    thumbnailPath: '/assets/scene/cloths/thumbs/ember_velvet.jpg',
    color: '#3d0c02',
    pattern: 'embroidered',
    hasGoldTrim: true,
    hasSilverTrim: false,
    rarity: 'rare',
    collectionId: 'celestial_fire',
    unlockMethod: 'purchase',
  },
  {
    id: 'velvet_abyssal',
    name: 'Abyssal Velvet',
    texturePath: '/assets/scene/cloths/abyssal_velvet.png',
    thumbnailPath: '/assets/scene/cloths/thumbs/abyssal_velvet.jpg',
    color: '#001122',
    pattern: 'celestial',
    hasGoldTrim: false,
    hasSilverTrim: true,
    rarity: 'rare',
    collectionId: 'abyssal_depths',
    unlockMethod: 'purchase',
  },
  {
    id: 'velvet_void',
    name: 'Void Velvet',
    texturePath: '/assets/scene/cloths/void_velvet.png',
    thumbnailPath: '/assets/scene/cloths/thumbs/void_velvet.jpg',
    color: '#0a0a0a',
    pattern: 'sigils',
    hasGoldTrim: true,
    hasSilverTrim: true,
    rarity: 'legendary',
    collectionId: 'void_walker',
    unlockMethod: 'collection',
  },

  // Premium ornate
  {
    id: 'velvet_golden_dawn',
    name: 'Golden Dawn Velvet',
    texturePath: '/assets/scene/cloths/golden_dawn_velvet.png',
    thumbnailPath: '/assets/scene/cloths/thumbs/golden_dawn_velvet.jpg',
    color: '#1a1500',
    pattern: 'ornate',
    hasGoldTrim: true,
    hasSilverTrim: false,
    rarity: 'epic',
    collectionId: 'golden_dawn',
    unlockMethod: 'purchase',
  },
];

// =============================================================================
// CARD BOX STYLES
// =============================================================================

export interface CardBox {
  id: string;
  name: string;
  modelPath: string; // 3D or 2D layered asset
  thumbnailPath: string;
  material: 'wood' | 'metal' | 'bone' | 'crystal' | 'mystical';
  hasInlay: boolean;
  inlayMaterial?: 'gold' | 'silver' | 'pearl' | 'gem' | 'rune';
  isAnimated: boolean;
  rarity: Rarity;
  collectionId?: string;
  unlockMethod: 'free' | 'purchase' | 'achievement' | 'collection';
  lore?: string;
}

export const CARD_BOXES: CardBox[] = [
  // Free default
  {
    id: 'box_weathered_oak',
    name: 'Weathered Oak Box',
    modelPath: '/assets/scene/boxes/weathered_oak.png',
    thumbnailPath: '/assets/scene/boxes/thumbs/weathered_oak.jpg',
    material: 'wood',
    hasInlay: false,
    isAnimated: false,
    rarity: 'common',
    unlockMethod: 'free',
    lore: 'An ancient box, worn smooth by countless hands.',
  },

  // Purchasable
  {
    id: 'box_mahogany_gold',
    name: 'Golden Inlay Box',
    modelPath: '/assets/scene/boxes/mahogany_gold.png',
    thumbnailPath: '/assets/scene/boxes/thumbs/mahogany_gold.jpg',
    material: 'wood',
    hasInlay: true,
    inlayMaterial: 'gold',
    isAnimated: false,
    rarity: 'rare',
    unlockMethod: 'purchase',
    lore: 'Mahogany darkened with age, gold that never tarnishes.',
  },
  {
    id: 'box_silver_runes',
    name: 'Runic Silver Box',
    modelPath: '/assets/scene/boxes/silver_runes.png',
    thumbnailPath: '/assets/scene/boxes/thumbs/silver_runes.jpg',
    material: 'metal',
    hasInlay: true,
    inlayMaterial: 'rune',
    isAnimated: true, // Runes glow
    rarity: 'epic',
    unlockMethod: 'purchase',
    lore: 'The runes shift when no one watches.',
  },

  // Collection-themed
  {
    id: 'box_celestial_fire',
    name: 'Phoenix Nest Box',
    modelPath: '/assets/scene/boxes/phoenix_nest.png',
    thumbnailPath: '/assets/scene/boxes/thumbs/phoenix_nest.jpg',
    material: 'mystical',
    hasInlay: true,
    inlayMaterial: 'gem',
    isAnimated: true, // Embers flicker
    rarity: 'epic',
    collectionId: 'celestial_fire',
    unlockMethod: 'purchase',
    lore: 'Carved from wood that burned but never turned to ash.',
  },
  {
    id: 'box_abyssal',
    name: 'Leviathan Bone Box',
    modelPath: '/assets/scene/boxes/leviathan_bone.png',
    thumbnailPath: '/assets/scene/boxes/thumbs/leviathan_bone.jpg',
    material: 'bone',
    hasInlay: true,
    inlayMaterial: 'pearl',
    isAnimated: true, // Bioluminescent glow
    rarity: 'epic',
    collectionId: 'abyssal_depths',
    unlockMethod: 'purchase',
    lore: 'Crafted from the rib of something ancient and vast.',
  },
  {
    id: 'box_void',
    name: 'Void Crystal Box',
    modelPath: '/assets/scene/boxes/void_crystal.png',
    thumbnailPath: '/assets/scene/boxes/thumbs/void_crystal.jpg',
    material: 'crystal',
    hasInlay: false,
    isAnimated: true, // Stars swirl inside
    rarity: 'legendary',
    collectionId: 'void_walker',
    unlockMethod: 'collection',
    lore: 'Look too long and you see other places.',
  },
];

// =============================================================================
// CANDLE CONFIGURATIONS
// =============================================================================

export interface CandleSet {
  id: string;
  name: string;
  count: number;
  positions: CandlePosition[];
  flameColor: string;
  glowColor: string;
  glowIntensity: number; // 0.5 - 2.0
  smokeEnabled: boolean;
  modelPath: string;
  rarity: Rarity;
  collectionId?: string;
  unlockMethod: 'free' | 'purchase' | 'collection';
}

export interface CandlePosition {
  x: number; // Percentage of scene width
  y: number; // Percentage of scene height
  scale: number;
  rotation: number; // Degrees
}

export const CANDLE_SETS: CandleSet[] = [
  {
    id: 'candles_classic_4',
    name: 'Classic Four Corners',
    count: 4,
    positions: [
      { x: 5, y: 5, scale: 1, rotation: 0 },
      { x: 95, y: 5, scale: 1, rotation: 0 },
      { x: 5, y: 95, scale: 1, rotation: 0 },
      { x: 95, y: 95, scale: 1, rotation: 0 },
    ],
    flameColor: '#FFA500',
    glowColor: '#FFD700',
    glowIntensity: 1.0,
    smokeEnabled: true,
    modelPath: '/assets/scene/candles/classic_white.png',
    rarity: 'common',
    unlockMethod: 'free',
  },
  {
    id: 'candles_ritual_6',
    name: 'Ritual Circle',
    count: 6,
    positions: [
      { x: 50, y: 2, scale: 1.2, rotation: 0 },
      { x: 10, y: 25, scale: 1, rotation: -10 },
      { x: 90, y: 25, scale: 1, rotation: 10 },
      { x: 10, y: 75, scale: 1, rotation: -10 },
      { x: 90, y: 75, scale: 1, rotation: 10 },
      { x: 50, y: 98, scale: 1.2, rotation: 0 },
    ],
    flameColor: '#FF6B35',
    glowColor: '#FFA07A',
    glowIntensity: 1.2,
    smokeEnabled: true,
    modelPath: '/assets/scene/candles/ritual_red.png',
    rarity: 'uncommon',
    unlockMethod: 'purchase',
  },
  {
    id: 'candles_celestial_fire',
    name: 'Phoenix Flames',
    count: 4,
    positions: [
      { x: 5, y: 5, scale: 1.3, rotation: 0 },
      { x: 95, y: 5, scale: 1.3, rotation: 0 },
      { x: 5, y: 95, scale: 1.3, rotation: 0 },
      { x: 95, y: 95, scale: 1.3, rotation: 0 },
    ],
    flameColor: '#FF4500',
    glowColor: '#FFD700',
    glowIntensity: 1.8,
    smokeEnabled: false, // Pure flame
    modelPath: '/assets/scene/candles/phoenix_brazier.png',
    rarity: 'epic',
    collectionId: 'celestial_fire',
    unlockMethod: 'collection',
  },
  {
    id: 'candles_abyssal',
    name: 'Bioluminescent Orbs',
    count: 5,
    positions: [
      { x: 50, y: 3, scale: 1, rotation: 0 },
      { x: 15, y: 30, scale: 0.8, rotation: 0 },
      { x: 85, y: 30, scale: 0.8, rotation: 0 },
      { x: 25, y: 85, scale: 0.9, rotation: 0 },
      { x: 75, y: 85, scale: 0.9, rotation: 0 },
    ],
    flameColor: '#00FFFF',
    glowColor: '#00FF88',
    glowIntensity: 1.5,
    smokeEnabled: false,
    modelPath: '/assets/scene/candles/bio_orb.png',
    rarity: 'epic',
    collectionId: 'abyssal_depths',
    unlockMethod: 'collection',
  },
  {
    id: 'candles_void',
    name: 'Void Flames',
    count: 4,
    positions: [
      { x: 5, y: 5, scale: 1, rotation: 0 },
      { x: 95, y: 5, scale: 1, rotation: 0 },
      { x: 5, y: 95, scale: 1, rotation: 0 },
      { x: 95, y: 95, scale: 1, rotation: 0 },
    ],
    flameColor: '#9400D3',
    glowColor: '#FF00FF',
    glowIntensity: 2.0,
    smokeEnabled: true, // Void smoke
    modelPath: '/assets/scene/candles/void_flame.png',
    rarity: 'legendary',
    collectionId: 'void_walker',
    unlockMethod: 'collection',
  },
];

// =============================================================================
// SPREAD LAYOUTS (Card Positions)
// =============================================================================

export interface SpreadLayout {
  id: string;
  name: string;
  cardCount: number;
  positions: CardPosition[];
  description: string;
  category: 'basic' | 'celtic' | 'relationship' | 'career' | 'spiritual' | 'custom';
}

export interface CardPosition {
  index: number;
  x: number; // Percentage
  y: number; // Percentage
  rotation: number; // Degrees
  scale: number;
  meaning: string; // What this position represents
  flipDelay: number; // MS delay before this card flips
}

export const SPREAD_LAYOUTS: SpreadLayout[] = [
  {
    id: 'spread_single',
    name: 'Single Card',
    cardCount: 1,
    positions: [
      { index: 0, x: 50, y: 50, rotation: 0, scale: 1.2, meaning: 'The Answer', flipDelay: 0 },
    ],
    description: 'A single card for quick guidance',
    category: 'basic',
  },
  {
    id: 'spread_three_card',
    name: 'Past, Present, Future',
    cardCount: 3,
    positions: [
      { index: 0, x: 25, y: 50, rotation: 0, scale: 1, meaning: 'Past', flipDelay: 0 },
      { index: 1, x: 50, y: 50, rotation: 0, scale: 1.1, meaning: 'Present', flipDelay: 500 },
      { index: 2, x: 75, y: 50, rotation: 0, scale: 1, meaning: 'Future', flipDelay: 1000 },
    ],
    description: 'Classic three-card timeline spread',
    category: 'basic',
  },
  {
    id: 'spread_celtic_cross',
    name: 'Celtic Cross',
    cardCount: 10,
    positions: [
      { index: 0, x: 30, y: 50, rotation: 0, scale: 1, meaning: 'Present Situation', flipDelay: 0 },
      { index: 1, x: 30, y: 50, rotation: 90, scale: 0.9, meaning: 'Challenge', flipDelay: 400 },
      { index: 2, x: 30, y: 80, rotation: 0, scale: 0.9, meaning: 'Foundation', flipDelay: 800 },
      { index: 3, x: 10, y: 50, rotation: 0, scale: 0.9, meaning: 'Recent Past', flipDelay: 1200 },
      { index: 4, x: 30, y: 20, rotation: 0, scale: 0.9, meaning: 'Potential', flipDelay: 1600 },
      { index: 5, x: 50, y: 50, rotation: 0, scale: 0.9, meaning: 'Near Future', flipDelay: 2000 },
      { index: 6, x: 75, y: 85, rotation: 0, scale: 0.85, meaning: 'Your Attitude', flipDelay: 2400 },
      { index: 7, x: 75, y: 62, rotation: 0, scale: 0.85, meaning: 'Environment', flipDelay: 2800 },
      { index: 8, x: 75, y: 38, rotation: 0, scale: 0.85, meaning: 'Hopes & Fears', flipDelay: 3200 },
      { index: 9, x: 75, y: 15, rotation: 0, scale: 0.9, meaning: 'Outcome', flipDelay: 3600 },
    ],
    description: 'The classic 10-card Celtic Cross spread',
    category: 'celtic',
  },
  {
    id: 'spread_relationship',
    name: 'Relationship Spread',
    cardCount: 5,
    positions: [
      { index: 0, x: 25, y: 50, rotation: 0, scale: 1, meaning: 'You', flipDelay: 0 },
      { index: 1, x: 75, y: 50, rotation: 0, scale: 1, meaning: 'Them', flipDelay: 400 },
      { index: 2, x: 50, y: 30, rotation: 0, scale: 0.9, meaning: 'Connection', flipDelay: 800 },
      { index: 3, x: 50, y: 70, rotation: 0, scale: 0.9, meaning: 'Challenge', flipDelay: 1200 },
      { index: 4, x: 50, y: 50, rotation: 0, scale: 1.1, meaning: 'Potential', flipDelay: 1600 },
    ],
    description: 'Explore a relationship dynamic',
    category: 'relationship',
  },
];

// =============================================================================
// SCENE CONFIGURATION (User's complete scene setup)
// =============================================================================

export interface TableSceneConfig {
  // Scene elements
  tableSurfaceId: string;
  velvetClothId: string;
  cardBoxId: string;
  candleSetId: string;

  // Visual settings
  ambientLightColor: string;
  ambientLightIntensity: number; // 0.3 - 1.5
  vignetteIntensity: number; // 0 - 1
  depthOfFieldEnabled: boolean;

  // Card display settings (from user's CardConfig)
  cardConfig: CardConfig;

  // Current spread
  spreadLayoutId: string;
}

// =============================================================================
// SCENE COMPOSITION ENGINE
// =============================================================================

export interface ComposedScene {
  layers: ComposedLayer[];
  totalWidth: number;
  totalHeight: number;
  aspectRatio: string;
}

export interface ComposedLayer {
  layerId: string;
  assetPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blendMode: string;
  isAnimated: boolean;
  animationConfig?: any;
}

export interface ReadingState {
  spreadId: string;
  cards: ReadingCard[];
  currentPhase: 'dealing' | 'revealing' | 'complete';
  revealedCount: number;
}

export interface ReadingCard {
  index: number;
  cardId: string;
  suit: 'wands' | 'cups' | 'swords' | 'pentacles' | 'major';
  isReversed: boolean;
  isRevealed: boolean;
  cardBackAssetId: string; // User's chosen back for this card
  cardFrontAssetPath: string; // Path to front image
}

/**
 * Compose a complete table spread scene
 */
export function composeTableScene(
  config: TableSceneConfig,
  readingState: ReadingState,
  ownedCardBacks: string[],
  sceneWidth: number = 1920,
  sceneHeight: number = 1080
): ComposedScene {
  const layers: ComposedLayer[] = [];

  // Layer 0: Table surface
  const table = TABLE_SURFACES.find(t => t.id === config.tableSurfaceId) || TABLE_SURFACES[0];
  layers.push({
    layerId: 'table_base',
    assetPath: table.texturePath,
    x: 0,
    y: 0,
    width: sceneWidth,
    height: sceneHeight,
    rotation: 0,
    opacity: 1,
    blendMode: 'normal',
    isAnimated: false,
  });

  // Layer 1: Velvet cloth
  const cloth = VELVET_CLOTHS.find(c => c.id === config.velvetClothId) || VELVET_CLOTHS[0];
  layers.push({
    layerId: 'velvet_cloth',
    assetPath: cloth.texturePath,
    x: sceneWidth * 0.1,
    y: sceneHeight * 0.1,
    width: sceneWidth * 0.8,
    height: sceneHeight * 0.8,
    rotation: 0,
    opacity: 1,
    blendMode: 'normal',
    isAnimated: false,
  });

  // Layer 2: Ambient shadows (vignette effect)
  layers.push({
    layerId: 'ambient_shadows',
    assetPath: '/assets/scene/effects/vignette.png',
    x: 0,
    y: 0,
    width: sceneWidth,
    height: sceneHeight,
    rotation: 0,
    opacity: config.vignetteIntensity,
    blendMode: 'multiply',
    isAnimated: false,
  });

  // Layer 3: Card box
  const box = CARD_BOXES.find(b => b.id === config.cardBoxId) || CARD_BOXES[0];
  layers.push({
    layerId: 'card_box',
    assetPath: box.modelPath,
    x: sceneWidth * 0.05,
    y: sceneHeight * 0.35,
    width: sceneWidth * 0.12,
    height: sceneHeight * 0.3,
    rotation: -5,
    opacity: 1,
    blendMode: 'normal',
    isAnimated: box.isAnimated,
    animationConfig: box.isAnimated ? { type: 'glow', color: box.inlayMaterial } : undefined,
  });

  // Layer 4: Cards
  const spread = SPREAD_LAYOUTS.find(s => s.id === readingState.spreadId) || SPREAD_LAYOUTS[0];

  readingState.cards.forEach((card, index) => {
    const position = spread.positions[index];
    if (!position) return;

    // Determine which asset to show (back or front)
    const assetPath = card.isRevealed
      ? card.cardFrontAssetPath
      : `/assets/cosmetics/card_backs/${card.cardBackAssetId}.png`;

    layers.push({
      layerId: `card_${index}`,
      assetPath,
      x: (position.x / 100) * sceneWidth - (sceneWidth * 0.08),
      y: (position.y / 100) * sceneHeight - (sceneHeight * 0.12),
      width: sceneWidth * 0.16,
      height: sceneHeight * 0.24,
      rotation: position.rotation + (card.isReversed && card.isRevealed ? 180 : 0),
      opacity: 1,
      blendMode: 'normal',
      isAnimated: false,
    });
  });

  // Layer 5: Candles
  const candles = CANDLE_SETS.find(c => c.id === config.candleSetId) || CANDLE_SETS[0];
  candles.positions.forEach((pos, index) => {
    layers.push({
      layerId: `candle_${index}`,
      assetPath: candles.modelPath,
      x: (pos.x / 100) * sceneWidth,
      y: (pos.y / 100) * sceneHeight,
      width: sceneWidth * 0.05 * pos.scale,
      height: sceneHeight * 0.15 * pos.scale,
      rotation: pos.rotation,
      opacity: 1,
      blendMode: 'normal',
      isAnimated: true,
      animationConfig: {
        type: 'flame',
        flameColor: candles.flameColor,
        intensity: candles.glowIntensity,
      },
    });
  });

  // Layer 6: Candle glow
  layers.push({
    layerId: 'candle_glow',
    assetPath: '/assets/scene/effects/radial_glow.png',
    x: 0,
    y: 0,
    width: sceneWidth,
    height: sceneHeight,
    rotation: 0,
    opacity: 0.3 * candles.glowIntensity,
    blendMode: 'screen',
    isAnimated: true,
    animationConfig: {
      type: 'pulse',
      color: candles.glowColor,
      speed: 0.5,
    },
  });

  // Layer 7: Smoke (if enabled)
  if (candles.smokeEnabled) {
    layers.push({
      layerId: 'smoke_particles',
      assetPath: '/assets/scene/effects/smoke_particles.json',
      x: 0,
      y: 0,
      width: sceneWidth,
      height: sceneHeight,
      rotation: 0,
      opacity: 0.2,
      blendMode: 'soft-light',
      isAnimated: true,
      animationConfig: { type: 'particle', particleType: 'smoke' },
    });
  }

  return {
    layers,
    totalWidth: sceneWidth,
    totalHeight: sceneHeight,
    aspectRatio: '16:9',
  };
}

/**
 * Get card back for each card in reading based on user's settings
 */
export function assignCardBacks(
  cards: Omit<ReadingCard, 'cardBackAssetId'>[],
  cardConfig: CardConfig,
  ownedCardBacks: string[]
): ReadingCard[] {
  return cards.map(card => ({
    ...card,
    cardBackAssetId: getCardBackForCard(cardConfig, card.cardId, card.suit, ownedCardBacks),
  }));
}

// Default scene configuration
export function createDefaultSceneConfig(): TableSceneConfig {
  return {
    tableSurfaceId: 'table_oak_classic',
    velvetClothId: 'velvet_deep_purple',
    cardBoxId: 'box_weathered_oak',
    candleSetId: 'candles_classic_4',
    ambientLightColor: '#FFA500',
    ambientLightIntensity: 0.8,
    vignetteIntensity: 0.4,
    depthOfFieldEnabled: false,
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
    spreadLayoutId: 'spread_three_card',
  };
}

export default {
  SCENE_LAYERS,
  TABLE_SURFACES,
  VELVET_CLOTHS,
  CARD_BOXES,
  CANDLE_SETS,
  SPREAD_LAYOUTS,
  composeTableScene,
  assignCardBacks,
  createDefaultSceneConfig,
};
