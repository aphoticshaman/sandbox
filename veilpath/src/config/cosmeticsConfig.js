/**
 * Cosmetics Configuration
 *
 * Unified rarity/pricing/quality tier system for ALL purchasable assets.
 * Price MUST match perceived visual quality.
 *
 * QUALITY GUIDELINES:
 * - Common: Simple, static, single-color or basic patterns
 * - Rare: More detail, subtle effects, 2-3 colors, slight glow
 * - Epic: Animated elements OR complex art, particle hints, premium feel
 * - Legendary: Full animation, unique effects, "wow factor", must feel WORTH IT
 * - Mythic: Ultra-rare, event exclusives, most impressive visuals in the game
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RARITY TIERS - Price ranges and quality expectations
// ═══════════════════════════════════════════════════════════════════════════════

export const RARITY_TIERS = {
  common: {
    id: 'common',
    name: 'Common',
    color: '#9E9E9E', // Gray
    glowColor: null,
    priceRange: { min: 0, max: 250 },
    quality: {
      description: 'Simple, clean designs. Static images only.',
      animation: false,
      particleEffects: false,
      glowEffects: false,
      complexity: 'low',
    },
  },

  rare: {
    id: 'rare',
    name: 'Rare',
    color: '#2196F3', // Blue
    glowColor: 'rgba(33, 150, 243, 0.3)',
    priceRange: { min: 250, max: 500 },
    quality: {
      description: 'More detailed art. May have subtle glow or shimmer.',
      animation: false,
      particleEffects: false,
      glowEffects: true,
      complexity: 'medium',
    },
  },

  epic: {
    id: 'epic',
    name: 'Epic',
    color: '#9C27B0', // Purple
    glowColor: 'rgba(156, 39, 176, 0.4)',
    priceRange: { min: 500, max: 1000 },
    quality: {
      description: 'Premium quality. Animated elements OR exceptional static art.',
      animation: 'subtle', // loops, pulses, gentle movement
      particleEffects: 'minimal',
      glowEffects: true,
      complexity: 'high',
    },
  },

  legendary: {
    id: 'legendary',
    name: 'Legendary',
    color: '#FF9800', // Orange/Gold
    glowColor: 'rgba(255, 152, 0, 0.5)',
    priceRange: { min: 1000, max: 2500 },
    quality: {
      description: 'Full animation, unique effects. Must feel WORTH the price.',
      animation: 'full', // complex, multi-element, fluid
      particleEffects: 'integrated',
      glowEffects: true,
      complexity: 'very_high',
    },
  },

  mythic: {
    id: 'mythic',
    name: 'Mythic',
    color: '#E91E63', // Pink/Magenta
    glowColor: 'rgba(233, 30, 99, 0.6)',
    priceRange: { min: 2500, max: 5000 },
    quality: {
      description: 'Ultra-rare. Event exclusives. Best visuals in the game.',
      animation: 'cinematic',
      particleEffects: 'heavy',
      glowEffects: true,
      complexity: 'maximum',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COSMETIC CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const COSMETIC_CATEGORIES = {
  cardBacks: {
    id: 'cardBacks',
    name: 'Card Backs',
    icon: '🎴',
    description: 'Customize the back of your tarot cards',
    shopSection: 'featured',
  },

  particles: {
    id: 'particles',
    name: 'Ambient Effects',
    icon: '✨',
    description: 'Background particle effects for your readings',
    shopSection: 'featured',
  },

  flipAnimations: {
    id: 'flipAnimations',
    name: 'Flip Animations',
    icon: '🔄',
    description: 'How your cards reveal themselves',
    shopSection: 'animations',
  },

  transitions: {
    id: 'transitions',
    name: 'Transitions',
    icon: '🌀',
    description: 'Screen transition effects',
    shopSection: 'animations',
  },

  readingCloths: {
    id: 'readingCloths',
    name: 'Reading Cloths',
    icon: '🎨',
    description: 'Background surface for your spreads',
    shopSection: 'backgrounds',
  },

  avatars: {
    id: 'avatars',
    name: 'Avatars',
    icon: '👤',
    description: 'Your profile picture',
    shopSection: 'profile',
  },

  borders: {
    id: 'borders',
    name: 'Borders',
    icon: '🖼️',
    description: 'Frame around your avatar',
    shopSection: 'profile',
  },

  titles: {
    id: 'titles',
    name: 'Titles',
    icon: '📜',
    description: 'Display name prefix',
    shopSection: 'profile',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARD BACKS CATALOG (with proper rarity pricing)
// ═══════════════════════════════════════════════════════════════════════════════

export const CARD_BACKS = {
  // ─────────────────────────────────────────────────────────────────────────────
  // COMMON (Free defaults + cheap purchases)
  // ─────────────────────────────────────────────────────────────────────────────
  celestial: {
    id: 'celestial',
    name: 'Celestial',
    description: 'Classic mystic design with stars',
    rarity: 'common',
    price: 0, // Free default
    asset: 'card_back.png',
    animated: false,
    unlockMethod: 'default',
  },

  cosmic_void: {
    id: 'cosmic_void',
    name: 'Cosmic Void',
    description: 'Deep space emptiness',
    rarity: 'common',
    price: 0,
    asset: 'card_back_void.png',
    animated: false,
    unlockMethod: 'default',
  },

  ethereal_mist: {
    id: 'ethereal_mist',
    name: 'Ethereal Mist',
    description: 'Soft swirling fog',
    rarity: 'common',
    price: 0,
    asset: 'card_back_mist.png',
    animated: false,
    unlockMethod: 'default',
  },

  moonlight: {
    id: 'moonlight',
    name: 'Moonlight',
    description: 'Pale lunar glow',
    rarity: 'common',
    price: 150,
    asset: 'card_back_moon.png',
    animated: false,
    unlockMethod: 'purchase',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // RARE (Detailed static art, subtle glow)
  // ─────────────────────────────────────────────────────────────────────────────
  blood_moon: {
    id: 'blood_moon',
    name: 'Blood Moon',
    description: 'Dark crimson lunar energy with soft pulsing glow',
    rarity: 'rare',
    price: 350,
    asset: 'card_back_blood.png',
    animated: false,
    glowEffect: true,
    glowColor: '#8B0000',
    unlockMethod: 'purchase',
  },

  astral_dream: {
    id: 'astral_dream',
    name: 'Astral Dream',
    description: 'Dreamscape visions with starfield depth',
    rarity: 'rare',
    price: 400,
    asset: 'card_back_astral.png',
    animated: false,
    glowEffect: true,
    glowColor: '#9370DB',
    unlockMethod: 'purchase',
  },

  crystal_cave: {
    id: 'crystal_cave',
    name: 'Crystal Cave',
    description: 'Amethyst crystals catch ethereal light',
    rarity: 'rare',
    price: 450,
    asset: 'card_back_crystal.png',
    animated: false,
    glowEffect: true,
    glowColor: '#00FFFF',
    unlockMethod: 'purchase',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EPIC (Animated OR exceptional static)
  // ─────────────────────────────────────────────────────────────────────────────
  void_walker: {
    id: 'void_walker',
    name: 'Void Walker',
    description: 'Tendrils of darkness reach from beyond',
    rarity: 'epic',
    price: 750,
    asset: 'card_back_voidwalker.png',
    animated: false, // Exceptional static art
    glowEffect: true,
    glowColor: '#4B0082',
    particles: 'void_wisps', // Subtle particle overlay
    unlockMethod: 'purchase',
  },

  shadow_realm: {
    id: 'shadow_realm',
    name: 'Shadow Realm',
    description: 'Shadows dance eternally',
    rarity: 'epic',
    price: 0, // Achievement unlock
    asset: 'card_back_shadow.png',
    animated: false,
    unlockMethod: 'level',
    unlockRequirement: { level: 20 },
  },

  blood_moon_rising: {
    id: 'blood_moon_rising',
    name: 'Blood Moon Rising',
    description: 'The moon awakens - ANIMATED',
    rarity: 'epic',
    price: 0,
    asset: 'card_back_bloodmoon.mp4',
    animated: true,
    animationType: 'loop',
    unlockMethod: 'streak',
    unlockRequirement: { streak: 30 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEGENDARY (Full animation, must feel WORTH 1500+ shards)
  // ─────────────────────────────────────────────────────────────────────────────
  ancient_oracle: {
    id: 'ancient_oracle',
    name: 'Ancient Vera',
    description: 'Eyes that pierce through time itself - ANIMATED with ambient particles',
    rarity: 'legendary',
    price: 1500,
    asset: 'card_back_oracle.mp4',
    animated: true,
    animationType: 'complex', // Multiple animated elements
    particles: 'oracle_wisps',
    soundEffect: 'whispers', // Optional audio cue
    unlockMethod: 'purchase',
  },

  living_mystic: {
    id: 'living_mystic',
    name: 'Living Mystic',
    description: 'Cosmic energy flows and swirls endlessly - FULLY ANIMATED',
    rarity: 'legendary',
    price: 2000,
    asset: 'card_back_mystic.mp4',
    animated: true,
    animationType: 'cinematic',
    particles: 'cosmic_flow',
    unlockMethod: 'purchase',
  },

  shadow_dance: {
    id: 'shadow_dance',
    name: 'Shadow Dance',
    description: 'Shadows move with hypnotic grace - FULLY ANIMATED',
    rarity: 'legendary',
    price: 0,
    asset: 'card_back_shadowdance.mp4',
    animated: true,
    animationType: 'cinematic',
    unlockMethod: 'level',
    unlockRequirement: { level: 25 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MYTHIC (Event exclusives, ultra-rare rotations)
  // ─────────────────────────────────────────────────────────────────────────────
  samhain_spirits: {
    id: 'samhain_spirits',
    name: 'Samhain Spirits',
    description: 'Halloween 2024 Exclusive - Spirits rise from the veil',
    rarity: 'mythic',
    price: 3000,
    asset: 'card_back_samhain.mp4',
    animated: true,
    animationType: 'cinematic',
    particles: 'spirit_orbs',
    event: 'halloween_2024',
    limitedTime: true,
    unlockMethod: 'event',
  },

  winter_solstice: {
    id: 'winter_solstice',
    name: 'Winter Solstice',
    description: 'December 2024 Exclusive - Aurora and snowfall',
    rarity: 'mythic',
    price: 3000,
    asset: 'card_back_solstice.mp4',
    animated: true,
    animationType: 'cinematic',
    particles: 'snow_aurora',
    event: 'winter_2024',
    limitedTime: true,
    unlockMethod: 'event',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FLIP ANIMATIONS CATALOG (mirrors cardFlipAnimations.js with shop metadata)
// ═══════════════════════════════════════════════════════════════════════════════

export const FLIP_ANIMATIONS_CATALOG = {
  // ─────────────────────────────────────────────────────────────────────────────
  // COMMON (Free defaults)
  // ─────────────────────────────────────────────────────────────────────────────
  classic: { id: 'classic', name: 'Classic Flip', emoji: '🎴', rarity: 'common', price: 0, unlockMethod: 'default' },
  fade: { id: 'fade', name: 'Mystic Fade', emoji: '🌫️', rarity: 'common', price: 0, unlockMethod: 'default' },

  // ─────────────────────────────────────────────────────────────────────────────
  // RARE (200-400 shards)
  // ─────────────────────────────────────────────────────────────────────────────
  wiggle: { id: 'wiggle', name: 'Playful Wiggle', emoji: '💃', rarity: 'rare', price: 200, unlockMethod: 'purchase' },
  bounce: { id: 'bounce', name: 'Bouncy Reveal', emoji: '🏀', rarity: 'rare', price: 250, unlockMethod: 'purchase' },
  excitedJump: { id: 'excitedJump', name: 'Excited Jump', emoji: '🤩', rarity: 'rare', price: 280, unlockMethod: 'purchase' },
  peekaboo: { id: 'peekaboo', name: 'Peek-a-Boo', emoji: '🙈', rarity: 'rare', price: 300, unlockMethod: 'purchase' },
  scaredJelly: { id: 'scaredJelly', name: 'Scared Jelly', emoji: '😰', rarity: 'rare', price: 320, unlockMethod: 'purchase' },
  bunnyHop: { id: 'bunnyHop', name: 'Bunny Hop', emoji: '🐰', rarity: 'rare', price: 350, unlockMethod: 'purchase' },
  frogLeap: { id: 'frogLeap', name: 'Frog Leap', emoji: '🐸', rarity: 'rare', price: 380, unlockMethod: 'purchase' },
  dogShake: { id: 'dogShake', name: 'Wet Dog Shake', emoji: '🐕', rarity: 'rare', price: 400, unlockMethod: 'purchase' },
  float: { id: 'float', name: 'Ethereal Float', emoji: '🎈', rarity: 'rare', price: 0, unlockMethod: 'level', unlockRequirement: { level: 10 } },
  sleepyYawn: { id: 'sleepyYawn', name: 'Sleepy Yawn', emoji: '😴', rarity: 'rare', price: 0, unlockMethod: 'level', unlockRequirement: { level: 15 } },

  // ─────────────────────────────────────────────────────────────────────────────
  // EPIC (500-750 shards)
  // ─────────────────────────────────────────────────────────────────────────────
  dance: { id: 'dance', name: 'Cosmic Dance', emoji: '💫', rarity: 'epic', price: 500, unlockMethod: 'purchase' },
  dizzyTwirl: { id: 'dizzyTwirl', name: 'Dizzy Twirl', emoji: '😵‍💫', rarity: 'epic', price: 500, unlockMethod: 'purchase' },
  vibrate: { id: 'vibrate', name: 'Trembling Vera', emoji: '⚡', rarity: 'epic', price: 550, unlockMethod: 'purchase' },
  tipsyStumble: { id: 'tipsyStumble', name: 'Tipsy Stumble', emoji: '🍷', rarity: 'epic', price: 550, unlockMethod: 'purchase' },
  sassyStrut: { id: 'sassyStrut', name: 'Sassy Strut', emoji: '💅', rarity: 'epic', price: 580, unlockMethod: 'purchase' },
  spin: { id: 'spin', name: 'Gyrating Spiral', emoji: '🌀', rarity: 'epic', price: 600, unlockMethod: 'purchase' },
  birdFlutter: { id: 'birdFlutter', name: 'Bird Flutter', emoji: '🐦', rarity: 'epic', price: 600, unlockMethod: 'purchase' },
  dramaticFaint: { id: 'dramaticFaint', name: 'Dramatic Faint', emoji: '🎭', rarity: 'epic', price: 620, unlockMethod: 'purchase' },
  catPounce: { id: 'catPounce', name: 'Cat Pounce', emoji: '🐱', rarity: 'epic', price: 650, unlockMethod: 'purchase' },
  fishSplash: { id: 'fishSplash', name: 'Fish Splash', emoji: '🐟', rarity: 'epic', price: 700, unlockMethod: 'purchase' },
  oscillate: { id: 'oscillate', name: 'Pendulum Swing', emoji: '🕰️', rarity: 'epic', price: 0, unlockMethod: 'achievement', unlockRequirement: { achievement: 'daily_streak_14' } },
  owlTurn: { id: 'owlTurn', name: 'Owl Wisdom Turn', emoji: '🦉', rarity: 'epic', price: 0, unlockMethod: 'level', unlockRequirement: { level: 20 } },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEGENDARY (900-1500 shards)
  // ─────────────────────────────────────────────────────────────────────────────
  bowlingPinDodge: { id: 'bowlingPinDodge', name: 'Pin Dodge', emoji: '🎳', rarity: 'legendary', price: 900, unlockMethod: 'purchase' },
  portal: { id: 'portal', name: 'Void Portal', emoji: '🕳️', rarity: 'legendary', price: 1000, unlockMethod: 'purchase' },
  snakeSlither: { id: 'snakeSlither', name: 'Snake Slither', emoji: '🐍', rarity: 'legendary', price: 1100, unlockMethod: 'purchase' },
  swim: { id: 'swim', name: 'Oceanic Wave', emoji: '🌊', rarity: 'legendary', price: 1200, unlockMethod: 'purchase' },
  shatter: { id: 'shatter', name: 'Crystal Shatter', emoji: '💎', rarity: 'legendary', price: 1500, unlockMethod: 'purchase' },
  stretch: { id: 'stretch', name: 'Reality Warp', emoji: '🪄', rarity: 'legendary', price: 0, unlockMethod: 'achievement', unlockRequirement: { achievement: 'level_30' } },
  butterflyMetamorphosis: { id: 'butterflyMetamorphosis', name: 'Butterfly Emergence', emoji: '🦋', rarity: 'legendary', price: 0, unlockMethod: 'achievement', unlockRequirement: { achievement: 'readings_100' } },
  strikeVictory: { id: 'strikeVictory', name: 'Strike Victory', emoji: '🏆', rarity: 'legendary', price: 0, unlockMethod: 'achievement', unlockRequirement: { achievement: 'readings_50' } },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHOP SECTIONS & FEATURED ROTATION
// ═══════════════════════════════════════════════════════════════════════════════

export const SHOP_SECTIONS = {
  featured: {
    id: 'featured',
    name: 'Featured',
    description: 'Limited time deals and seasonal items',
    rotates: true,
  },
  cardBacks: {
    id: 'cardBacks',
    name: 'Card Backs',
    description: 'Customize your deck',
    rotates: false,
  },
  particles: {
    id: 'particles',
    name: 'Ambient Effects',
    description: 'Screen particle effects',
    rotates: true, // Seasonal
  },
  animations: {
    id: 'animations',
    name: 'Animations',
    description: 'Flip effects and transitions',
    rotates: false,
  },
  profile: {
    id: 'profile',
    name: 'Profile',
    description: 'Avatars, borders, and titles',
    rotates: false,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get rarity config by ID
 */
export function getRarityConfig(rarityId) {
  return RARITY_TIERS[rarityId] || RARITY_TIERS.common;
}

/**
 * Get rarity color for display
 */
export function getRarityColor(rarityId) {
  return RARITY_TIERS[rarityId]?.color || '#9E9E9E';
}

/**
 * Check if price is appropriate for rarity
 */
export function validatePricing(rarity, price) {
  const tier = RARITY_TIERS[rarity];
  if (!tier) return false;

  // Free items (achievements, defaults) are always valid
  if (price === 0) return true;

  return price >= tier.priceRange.min && price <= tier.priceRange.max;
}

/**
 * Get all items of a specific rarity
 */
export function getItemsByRarity(catalog, rarity) {
  return Object.values(catalog).filter(item => item.rarity === rarity);
}

/**
 * Get purchasable items (excludes achievements/defaults)
 */
export function getPurchasableItems(catalog) {
  return Object.values(catalog).filter(item =>
    item.unlockMethod === 'purchase' && item.price > 0
  );
}

/**
 * Sort items by rarity (mythic first)
 */
export function sortByRarity(items) {
  const order = ['mythic', 'legendary', 'epic', 'rare', 'common'];
  return [...items].sort((a, b) =>
    order.indexOf(a.rarity) - order.indexOf(b.rarity)
  );
}

export default {
  RARITY_TIERS,
  COSMETIC_CATEGORIES,
  CARD_BACKS,
  SHOP_SECTIONS,
  getRarityConfig,
  getRarityColor,
  validatePricing,
  getItemsByRarity,
  getPurchasableItems,
  sortByRarity,
};
