/**
 * COSMETICS STORE - Zustand
 * Manages user's visual cosmetics: card backs, frames, transitions, flip animations, THEMES
 *
 * All users get defaults assigned on first load.
 * Premium cosmetics are unlocked via achievements, purchases, or rewards.
 *
 * THEMES:
 * - Multiple theme variants (not just light/dark)
 * - Cheap and abundant pricing (50-200 shards for most)
 * - Monthly subscriber rewards
 * - Personal themes (only user sees them)
 *
 * GRANULAR RANDOMIZATION:
 * Users can build "pools" for each cosmetic type. Instead of "random" being all-or-nothing,
 * they choose which unlocked items should be in the random rotation.
 *
 * DECK VERSIONS:
 * - 'rws' - Classic Rider-Waite-Smith
 * - 'midjourney_static' - Midjourney PNG images
 * - 'midjourney_animated' - Midjourney MP4 (Major Arcana only)
 *
 * NOTE: Assets use null fallbacks to prevent build failures when assets are restructured
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FLIP_ANIMATIONS } from '../utils/cardFlipAnimations';
import { THEMES, getMonthlyRewardTheme } from '../theme/themes';

const STORAGE_KEY = '@veilpath_cosmetics';

// ============================================================
// SAFE REQUIRE HELPER - Returns null if asset doesn't exist
// ============================================================
function safeRequire(requireFn) {
  try {
    return requireFn();
  } catch (e) {
    console.warn('[CosmeticsStore] Asset not found:', e.message);
    return null;
  }
}

// ============================================================
// ASSET REGISTRY - All available cosmetics in the game
// ============================================================

// Card Back options - Assets are in assets/art/cardback/
export const CARD_BACKS = {
  // DEFAULT - Everyone gets these 3
  celestial_default: {
    id: 'celestial_default',
    name: 'Celestial',
    description: 'The classic mystic card back',
    rarity: 'common',
    assetFile: 'card_back.png',
    unlocked: true, // Default for all users
    isDefault: true,
  },
  cosmic_void: {
    id: 'cosmic_void',
    name: 'Cosmic Void',
    description: 'Deep space mystery',
    rarity: 'common',
    assetFile: 'download (40).jpg',
    unlocked: true, // Free default
    isDefault: true,
  },
  ethereal_mist: {
    id: 'ethereal_mist',
    name: 'Ethereal Mist',
    description: 'Swirling ethereal energies',
    rarity: 'common',
    assetFile: 'download (41).jpg',
    unlocked: true, // Free default
    isDefault: true,
  },
  // PURCHASABLE - Rare tier
  blood_moon: {
    id: 'blood_moon',
    name: 'Blood Moon',
    description: 'Dark crimson lunar energy',
    rarity: 'rare',
    assetFile: 'download (42).jpg',
    unlocked: false,
    unlockRequirement: { type: 'purchase', price: 300 },
  },
  astral_dream: {
    id: 'astral_dream',
    name: 'Astral Dream',
    description: 'Dreamscape visions',
    rarity: 'rare',
    assetFile: 'download (43).jpg',
    unlocked: false,
    unlockRequirement: { type: 'purchase', price: 400 },
  },
  // EPIC tier
  void_walker: {
    id: 'void_walker',
    name: 'Void Walker',
    description: 'For those who peer beyond',
    rarity: 'epic',
    assetFile: 'download (44).jpg',
    unlocked: false,
    unlockRequirement: { type: 'purchase', price: 750 },
  },
  shadow_realm: {
    id: 'shadow_realm',
    name: 'Shadow Realm',
    description: 'From the depths of darkness',
    rarity: 'epic',
    assetFile: 'download (45).jpg',
    unlocked: false,
    unlockRequirement: { type: 'level', value: 20 },
  },
  // LEGENDARY tier
  ancient_oracle: {
    id: 'ancient_oracle',
    name: 'Ancient Vera',
    description: 'Wisdom of the ages',
    rarity: 'legendary',
    assetFile: 'download (46).jpg',
    unlocked: false,
    unlockRequirement: { type: 'purchase', price: 1500 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // REFERRAL EXCLUSIVE CARD BACKS
  // ─────────────────────────────────────────────────────────────────────────────
  better_together: {
    id: 'better_together',
    name: 'Better Together',
    description: 'Awarded for referring a friend to VeilPath',
    rarity: 'rare',
    assetFile: 'better_together.png',
    unlocked: false,
    unlockRequirement: { type: 'referral', value: 'referred_someone' },
    isReferralReward: true,
  },
  better_together_animated: {
    id: 'better_together_animated',
    name: 'Better Together (Animated)',
    description: 'The animated version - awarded when your referral subscribes!',
    rarity: 'legendary',
    assetFile: 'better_together_animated.mp4',
    isAnimated: true,
    unlocked: false,
    unlockRequirement: { type: 'referral_subscription', value: 'referral_subscribed' },
    isReferralReward: true,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SEASONAL/EVENT EXCLUSIVE CARD BACKS
  // ─────────────────────────────────────────────────────────────────────────────
  samhain_spirits: {
    id: 'samhain_spirits',
    name: 'Samhain Spirits',
    description: 'Halloween seasonal quest reward',
    rarity: 'epic',
    assetFile: 'samhain_spirits.png',
    unlocked: false,
    unlockRequirement: { type: 'seasonal_quest', value: 'samhain_seeker' },
    isSeasonalReward: true,
  },
  winter_solstice: {
    id: 'winter_solstice',
    name: 'Winter Solstice',
    description: 'December seasonal quest reward',
    rarity: 'epic',
    assetFile: 'winter_solstice.png',
    unlocked: false,
    unlockRequirement: { type: 'seasonal_quest', value: 'winter_solstice' },
    isSeasonalReward: true,
  },
  community_champion: {
    id: 'community_champion',
    name: 'Community Champion',
    description: 'Referred 10 friends to VeilPath',
    rarity: 'legendary',
    assetFile: 'community_champion.png',
    unlocked: false,
    unlockRequirement: { type: 'referral', value: 10 },
    isReferralReward: true,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // GROWING CONSTELLATION - Community-Grown Card Back
  // A living, breathing card back that grows with the referral chain
  // ─────────────────────────────────────────────────────────────────────────────
  growing_constellation: {
    id: 'growing_constellation',
    name: 'Growing Constellation',
    description: 'A living sky that grows with each referral. Only referrers and referees can use this card back.',
    longDescription: `Navy black sky with a crescent moon. A meadow with fireflies at the bottom.
Each person you refer (or who referred you) adds a star to the sky. Watch the community grow.`,
    rarity: 'mythic',
    assetFile: 'growing_constellation.png', // Base image
    isDynamic: true, // Rendered dynamically based on star count
    unlocked: false,
    unlockRequirement: { type: 'referral_participant', value: true },
    isReferralReward: true,
    // Scene description for rendering
    scene: {
      skyColor: '#0A0A1F', // Navy/black
      moonType: 'crescent',
      moonPosition: { x: 0.8, y: 0.15 }, // Top right
      grassHeight: 0.111, // Bottom 1/9th of card
      grassColor: '#1A4D1A',
      fireflyCount: 7,
      // Stars are added dynamically based on referral chain
    },
  },
};

// Card Frame options - frames are optional overlays
export const CARD_FRAMES = {
  // DEFAULT - No frame / transparent
  none: {
    id: 'none',
    name: 'None',
    description: 'No frame overlay',
    rarity: 'common',
    source: null,
    unlocked: true,
  },
  // Future frames will be added as assets become available
};

// Transition effect options
export const TRANSITION_EFFECTS = {
  // DEFAULTS - All users get these
  fade: {
    id: 'fade',
    name: 'Fade',
    description: 'Classic smooth fade transition',
    rarity: 'common',
    unlocked: true,
    isDefault: true,
  },
  washout: {
    id: 'washout',
    name: 'Cosmic Washout',
    description: 'Particles and energy sweep across',
    rarity: 'common',
    unlocked: true,
    isDefault: true,
  },
  // Premium transitions (purchasable/earnable)
  portal: {
    id: 'portal',
    name: 'Portal',
    description: 'Cards emerge from a mystical portal',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: { type: 'level', value: 15 },
  },
  shatter: {
    id: 'shatter',
    name: 'Shatter',
    description: 'Reality shatters and reforms',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: { type: 'achievement', value: 'level_25' },
  },
  celestial_burst: {
    id: 'celestial_burst',
    name: 'Celestial Burst',
    description: 'Explosion of stars and light',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: { type: 'purchase', price: 500 },
  },
  void_rip: {
    id: 'void_rip',
    name: 'Void Rip',
    description: 'Tears through the fabric of space',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: { type: 'purchase', price: 1000 },
  },
};

// Background theme options - dynamically loaded
export const BACKGROUND_THEMES = {
  celestial: {
    id: 'celestial',
    name: 'Celestial',
    variants: [], // Loaded dynamically
    unlocked: true,
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic',
    variants: [], // Loaded dynamically
    unlocked: true,
  },
  ethereal: {
    id: 'ethereal',
    name: 'Ethereal',
    variants: [], // Loaded dynamically
    unlocked: true,
  },
};

// ============================================================
// DECK VERSION OPTIONS - Different card art styles
// ============================================================
export const DECK_VERSIONS = {
  rws: {
    id: 'rws',
    name: 'Rider-Waite-Smith',
    description: 'The classic 1909 deck, timeless and traditional',
    emoji: '📜',
    unlocked: true, // Everyone has this
    isDefault: true,
  },
  midjourney_static: {
    id: 'midjourney_static',
    name: 'Mystic Visions (Static)',
    description: 'AI-generated ethereal artwork',
    emoji: '🎨',
    unlocked: true, // Everyone has this too
    isDefault: true,
  },
  midjourney_animated: {
    id: 'midjourney_animated',
    name: 'Living Visions (Animated)',
    description: 'Animated MP4 cards for Major Arcana only',
    emoji: '✨',
    unlocked: true, // Free but premium feel
    isDefault: true,
    majorArcanaOnly: true, // Only works for Major Arcana
  },
};

// ============================================================
// FLIP ANIMATIONS - Wired from cardFlipAnimations.js
// Only animations marked for shop/locker appear here
// Some stay UNRELEASED (not in this registry = hidden)
// ============================================================

// SHOP ANIMATIONS - Available for purchase (mix of animal + anthro)
export const SHOP_FLIP_ANIMATIONS = {
  // ANIMALS (half)
  catPounce: { ...FLIP_ANIMATIONS.catPounce, inShop: true },
  bunnyHop: { ...FLIP_ANIMATIONS.bunnyHop, inShop: true },
  dogShake: { ...FLIP_ANIMATIONS.dogShake, inShop: true },
  frogLeap: { ...FLIP_ANIMATIONS.frogLeap, inShop: true },
  fishSplash: { ...FLIP_ANIMATIONS.fishSplash, inShop: true },
  // ANTHRO (half)
  scaredJelly: { ...FLIP_ANIMATIONS.scaredJelly, inShop: true },
  peekaboo: { ...FLIP_ANIMATIONS.peekaboo, inShop: true },
  excitedJump: { ...FLIP_ANIMATIONS.excitedJump, inShop: true },
  tipsyStumble: { ...FLIP_ANIMATIONS.tipsyStumble, inShop: true },
  dizzyTwirl: { ...FLIP_ANIMATIONS.dizzyTwirl, inShop: true },
};

// LOCKER-ONLY ANIMATIONS - Unlocked via achievements/levels (not purchasable)
export const LOCKER_FLIP_ANIMATIONS = {
  // Default free ones
  classic: { ...FLIP_ANIMATIONS.classic, inLocker: true },
  fade: { ...FLIP_ANIMATIONS.fade, inLocker: true },
  // Achievement unlocks
  owlTurn: { ...FLIP_ANIMATIONS.owlTurn, inLocker: true }, // Level 20
  sleepyYawn: { ...FLIP_ANIMATIONS.sleepyYawn, inLocker: true }, // Level 15
  butterflyMetamorphosis: { ...FLIP_ANIMATIONS.butterflyMetamorphosis, inLocker: true }, // 100 readings
  strikeVictory: { ...FLIP_ANIMATIONS.strikeVictory, inLocker: true }, // 50 readings
};

// UNRELEASED - These exist but aren't in shop or locker yet (keeping up our sleeves)
// birdFlutter, snakeSlither, sassyStrut, dramaticFaint, bowlingPinDodge
// portal, swim, stretch, shatter, spin, oscillate, vibrate, wiggle, bounce, float, dance

// Combined registry for internal use
export const ALL_FLIP_ANIMATIONS = {
  ...FLIP_ANIMATIONS, // All exist
};

// Get only released animations (shop + locker)
export const getReleasedFlipAnimations = () => ({
  ...SHOP_FLIP_ANIMATIONS,
  ...LOCKER_FLIP_ANIMATIONS,
});

// Get shop animations only
export const getShopFlipAnimations = () => Object.values(SHOP_FLIP_ANIMATIONS);

// Get locker animations only
export const getLockerFlipAnimations = () => Object.values(LOCKER_FLIP_ANIMATIONS);

// ============================================================
// DEFAULT USER COSMETICS
// ============================================================

// ============================================================
// CARD BACK ASSET MAP - Static requires for Metro bundler
// ============================================================
const CARD_BACK_ASSETS = {
  'card_back.png': require('../../assets/art/cardback/card_back.png'),
  'download (40).jpg': require('../../assets/art/cardback/download (40).jpg'),
  'download (41).jpg': require('../../assets/art/cardback/download (41).jpg'),
  'download (42).jpg': require('../../assets/art/cardback/download (42).jpg'),
  'download (43).jpg': require('../../assets/art/cardback/download (43).jpg'),
  'download (44).jpg': require('../../assets/art/cardback/download (44).jpg'),
  'download (45).jpg': require('../../assets/art/cardback/download (45).jpg'),
  'download (46).jpg': require('../../assets/art/cardback/download (46).jpg'),
};

/**
 * Get the image source for a card back
 * @param {string} cardBackId - The card back ID
 * @returns {any} Image source for React Native Image component
 */
export function getCardBackAsset(cardBackId) {
  const cardBack = CARD_BACKS[cardBackId];
  if (!cardBack || !cardBack.assetFile) {
    // Return default
    return CARD_BACK_ASSETS['card_back.png'];
  }
  return CARD_BACK_ASSETS[cardBack.assetFile] || CARD_BACK_ASSETS['card_back.png'];
}

const defaultCosmetics = {
  // Equipped items (single selection OR 'random' to use pool)
  equipped: {
    cardBack: 'celestial_default', // or 'random' to pull from pool
    cardFrame: 'none',
    transitionIn: 'fade',
    transitionOut: 'fade',
    backgroundTheme: 'celestial', // or 'random'
    flipAnimation: 'classic', // or 'random' to pull from pool
    theme: 'cosmic', // App theme (from THEMES)
    themeMode: 'dark', // 'light' | 'dark' | 'system'
  },

  // Unlocked items (IDs) - 3 default card backs
  unlockedCardBacks: ['celestial_default', 'cosmic_void', 'ethereal_mist'],
  unlockedCardFrames: ['none'],
  unlockedTransitions: ['fade', 'washout'],
  unlockedFlipAnimations: ['classic', 'fade'], // Default free animations
  unlockedThemes: ['cosmic', 'forest'], // Default free themes

  // Subscriber rewards tracking
  subscriberRewards: {
    lastMonthlyThemeClaimed: null, // ISO date string of last claim
    claimedThemes: [], // IDs of themes claimed via subscription
  },

  // ============================================================
  // GRANULAR RANDOMIZATION POOLS
  // When equipped is set to 'random', we pick from these pools
  // Users toggle which of their UNLOCKED items are in each pool
  // ============================================================
  randomPools: {
    cardBacks: ['celestial_default', 'cosmic_void', 'ethereal_mist'], // All defaults in pool
    themes: ['celestial', 'cosmic', 'ethereal'],
    transitions: ['fade', 'washout'],
    flipAnimations: ['classic', 'fade'],
  },

  // ============================================================
  // DECK VERSION PREFERENCES
  // Users can enable/disable which deck versions appear in readings
  // When multiple enabled, we randomly pick (or user can set priority)
  // ============================================================
  deckVersions: {
    enabled: ['rws', 'midjourney_static', 'midjourney_animated'], // All enabled by default
    priority: 'random', // 'random' | 'rws' | 'midjourney_static' | 'midjourney_animated'
    // For Major Arcana specifically (since animated is Major only)
    majorArcanaPreference: 'random', // Can differ from general preference
  },

  // Currency for shop purchases
  cosmicDust: 0,

  // Preferences
  preferences: {
    enableParticles: true,
    enable3DCards: true,
    enableCardGlow: true,
    transitionSpeed: 'normal', // 'fast', 'normal', 'slow'
    useRandomPools: false, // Master toggle for randomization feature
  },
};

// ============================================================
// COSMETICS STORE
// ============================================================

export const useCosmeticsStore = create((set, get) => ({
  ...defaultCosmetics,
  isInitialized: false,

  /**
   * Initialize cosmetics (called on app start)
   * Loads from storage or creates defaults
   * ALWAYS ensures defaults are present and equipped
   */
  initializeCosmetics: async () => {
    try {
      const stored = Platform.OS === 'web'
        ? localStorage.getItem(STORAGE_KEY)
        : await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const data = JSON.parse(stored);
        // Merge with defaults to ensure new fields are present
        // Also FORCE defaults to always be in unlocked arrays
        const merged = {
          ...defaultCosmetics,
          ...data,
          // Ensure defaults are always unlocked (all 3 default card backs)
          unlockedCardBacks: [...new Set([...(data.unlockedCardBacks || []), 'celestial_default', 'cosmic_void', 'ethereal_mist'])],
          unlockedCardFrames: [...new Set([...(data.unlockedCardFrames || []), 'none'])],
          unlockedTransitions: [...new Set([...(data.unlockedTransitions || []), 'fade', 'washout'])],
          unlockedFlipAnimations: [...new Set([...(data.unlockedFlipAnimations || []), 'classic', 'fade'])],
          // Default themes: cosmic and forest are free
          unlockedThemes: [...new Set([...(data.unlockedThemes || []), 'cosmic', 'forest'])],
          // Ensure equipped items exist in unlocked
          equipped: {
            cardBack: data.equipped?.cardBack || 'celestial_default',
            cardFrame: data.equipped?.cardFrame || 'none',
            transitionIn: data.equipped?.transitionIn || 'fade',
            transitionOut: data.equipped?.transitionOut || 'fade',
            backgroundTheme: data.equipped?.backgroundTheme || 'celestial',
            flipAnimation: data.equipped?.flipAnimation || 'classic',
            // New theme fields
            theme: data.equipped?.theme || 'cosmic',
            themeMode: data.equipped?.themeMode || 'dark',
          },
          // Merge randomization pools (ensure defaults exist)
          randomPools: {
            cardBacks: data.randomPools?.cardBacks || defaultCosmetics.randomPools.cardBacks,
            themes: data.randomPools?.themes || defaultCosmetics.randomPools.themes,
            transitions: data.randomPools?.transitions || defaultCosmetics.randomPools.transitions,
            flipAnimations: data.randomPools?.flipAnimations || defaultCosmetics.randomPools.flipAnimations,
          },
          // Merge deck version preferences
          deckVersions: {
            enabled: data.deckVersions?.enabled || defaultCosmetics.deckVersions.enabled,
            priority: data.deckVersions?.priority || defaultCosmetics.deckVersions.priority,
            majorArcanaPreference: data.deckVersions?.majorArcanaPreference || defaultCosmetics.deckVersions.majorArcanaPreference,
          },
          // Subscriber rewards tracking
          subscriberRewards: {
            lastMonthlyThemeClaimed: data.subscriberRewards?.lastMonthlyThemeClaimed || null,
            claimedThemes: data.subscriberRewards?.claimedThemes || [],
          },
          isInitialized: true,
        };
        set(merged);
        await get().saveCosmetics();
      } else {
        // First time - set defaults
        set({ ...defaultCosmetics, isInitialized: true });
        await get().saveCosmetics();
      }

      console.log('[CosmeticsStore] Initialized with defaults enforced');
    } catch (error) {
      console.error('[CosmeticsStore] Failed to initialize:', error);
      set({ ...defaultCosmetics, isInitialized: true });
    }
  },

  /**
   * Save cosmetics to storage
   */
  saveCosmetics: async () => {
    try {
      const state = get();
      const data = {
        equipped: state.equipped,
        unlockedCardBacks: state.unlockedCardBacks,
        unlockedCardFrames: state.unlockedCardFrames,
        unlockedTransitions: state.unlockedTransitions,
        unlockedFlipAnimations: state.unlockedFlipAnimations,
        unlockedThemes: state.unlockedThemes,
        randomPools: state.randomPools,
        deckVersions: state.deckVersions,
        cosmicDust: state.cosmicDust,
        preferences: state.preferences,
        subscriberRewards: state.subscriberRewards,
      };

      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('[CosmeticsStore] Failed to save:', error);
    }
  },

  // ============================================================
  // GETTERS - Get actual assets for equipped cosmetics
  // ============================================================

  /**
   * Get equipped card back asset
   */
  getEquippedCardBack: () => {
    const state = get();
    const cardBackId = state.equipped.cardBack;
    return CARD_BACKS[cardBackId] || CARD_BACKS.celestial_default;
  },

  /**
   * Get equipped card frame asset
   */
  getEquippedCardFrame: () => {
    const state = get();
    const frameId = state.equipped.cardFrame;
    return CARD_FRAMES[frameId] || CARD_FRAMES.none;
  },

  /**
   * Get equipped transition (in)
   */
  getEquippedTransitionIn: () => {
    const state = get();
    const transitionId = state.equipped.transitionIn;
    return TRANSITION_EFFECTS[transitionId] || TRANSITION_EFFECTS.fade;
  },

  /**
   * Get equipped transition (out)
   */
  getEquippedTransitionOut: () => {
    const state = get();
    const transitionId = state.equipped.transitionOut;
    return TRANSITION_EFFECTS[transitionId] || TRANSITION_EFFECTS.fade;
  },

  /**
   * Get background image for current theme
   * Returns null if no background is available
   */
  getBackgroundImage: (variant = 0) => {
    const state = get();
    const theme = BACKGROUND_THEMES[state.equipped.backgroundTheme];
    if (!theme || !theme.variants || theme.variants.length === 0) {
      return null;
    }
    return theme.variants[variant % theme.variants.length];
  },

  /**
   * Get all unlocked card backs with full data
   */
  getUnlockedCardBacks: () => {
    const state = get();
    return state.unlockedCardBacks.map(id => CARD_BACKS[id]).filter(Boolean);
  },

  /**
   * Get all unlocked card frames with full data
   */
  getUnlockedCardFrames: () => {
    const state = get();
    return state.unlockedCardFrames.map(id => CARD_FRAMES[id]).filter(Boolean);
  },

  /**
   * Get all unlocked transitions with full data
   */
  getUnlockedTransitions: () => {
    const state = get();
    return state.unlockedTransitions.map(id => TRANSITION_EFFECTS[id]).filter(Boolean);
  },

  // ============================================================
  // SETTERS - Equip cosmetics
  // ============================================================

  /**
   * Equip card back
   */
  equipCardBack: (cardBackId) => {
    const state = get();
    if (!state.unlockedCardBacks.includes(cardBackId)) {
      console.warn(`[CosmeticsStore] Card back not unlocked: ${cardBackId}`);
      return false;
    }

    set({
      equipped: {
        ...state.equipped,
        cardBack: cardBackId,
      },
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Equip card frame
   */
  equipCardFrame: (frameId) => {
    const state = get();
    if (!state.unlockedCardFrames.includes(frameId)) {
      console.warn(`[CosmeticsStore] Card frame not unlocked: ${frameId}`);
      return false;
    }

    set({
      equipped: {
        ...state.equipped,
        cardFrame: frameId,
      },
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Equip transition effect
   */
  equipTransition: (transitionId, direction = 'both') => {
    const state = get();
    if (!state.unlockedTransitions.includes(transitionId)) {
      console.warn(`[CosmeticsStore] Transition not unlocked: ${transitionId}`);
      return false;
    }

    const updates = {};
    if (direction === 'in' || direction === 'both') {
      updates.transitionIn = transitionId;
    }
    if (direction === 'out' || direction === 'both') {
      updates.transitionOut = transitionId;
    }

    set({
      equipped: {
        ...state.equipped,
        ...updates,
      },
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Set background theme
   */
  setBackgroundTheme: (themeId) => {
    const state = get();
    if (!BACKGROUND_THEMES[themeId]) {
      console.warn(`[CosmeticsStore] Unknown theme: ${themeId}`);
      return false;
    }

    set({
      equipped: {
        ...state.equipped,
        backgroundTheme: themeId,
      },
    });
    get().saveCosmetics();
    return true;
  },

  // ============================================================
  // UNLOCK - Grant new cosmetics
  // ============================================================

  /**
   * Unlock a cosmetic item
   */
  unlockCosmetic: (type, itemId) => {
    const state = get();
    let field;
    let registry;

    switch (type) {
      case 'cardBack':
        field = 'unlockedCardBacks';
        registry = CARD_BACKS;
        break;
      case 'cardFrame':
        field = 'unlockedCardFrames';
        registry = CARD_FRAMES;
        break;
      case 'transition':
        field = 'unlockedTransitions';
        registry = TRANSITION_EFFECTS;
        break;
      default:
        console.warn(`[CosmeticsStore] Unknown cosmetic type: ${type}`);
        return false;
    }

    // Check if item exists
    if (!registry[itemId]) {
      console.warn(`[CosmeticsStore] Unknown item: ${itemId}`);
      return false;
    }

    // Check if already unlocked
    if (state[field].includes(itemId)) {
      return false; // Already has it
    }

    // Unlock it
    set({
      [field]: [...state[field], itemId],
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Purchase a cosmetic with cosmic dust
   */
  purchaseCosmetic: (type, itemId) => {
    const state = get();
    let registry;

    switch (type) {
      case 'cardBack':
        registry = CARD_BACKS;
        break;
      case 'cardFrame':
        registry = CARD_FRAMES;
        break;
      case 'transition':
        registry = TRANSITION_EFFECTS;
        break;
      default:
        return { success: false, error: 'Unknown type' };
    }

    const item = registry[itemId];
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    if (!item.unlockRequirement || item.unlockRequirement.type !== 'purchase') {
      return { success: false, error: 'Item is not purchasable' };
    }

    const price = item.unlockRequirement.price;
    if (state.cosmicDust < price) {
      return { success: false, error: 'Not enough cosmic dust' };
    }

    // Deduct currency and unlock
    set({ cosmicDust: state.cosmicDust - price });
    get().unlockCosmetic(type, itemId);

    return { success: true };
  },

  /**
   * Award cosmic dust
   */
  awardCosmicDust: (amount) => {
    const state = get();
    set({ cosmicDust: state.cosmicDust + amount });
    get().saveCosmetics();
  },

  // ============================================================
  // PREFERENCES
  // ============================================================

  /**
   * Update visual preferences
   */
  setPreference: (key, value) => {
    const state = get();
    set({
      preferences: {
        ...state.preferences,
        [key]: value,
      },
    });
    get().saveCosmetics();
  },

  /**
   * Check all unlock requirements against user progress
   * Called when user levels up, completes readings, etc.
   */
  checkUnlockRequirements: (userProgress) => {
    const state = get();
    const { level, totalReadings, currentStreak, totalJournalEntries, unlockedAchievements } = userProgress;

    // Check all frames
    Object.values(CARD_FRAMES).forEach(frame => {
      if (state.unlockedCardFrames.includes(frame.id)) return;
      if (!frame.unlockRequirement) return;

      const req = frame.unlockRequirement;
      let shouldUnlock = false;

      switch (req.type) {
        case 'level':
          shouldUnlock = level >= req.value;
          break;
        case 'readings':
          shouldUnlock = totalReadings >= req.value;
          break;
        case 'streak':
          shouldUnlock = currentStreak >= req.value;
          break;
        case 'journal':
          shouldUnlock = totalJournalEntries >= req.value;
          break;
        case 'achievement':
          shouldUnlock = unlockedAchievements?.includes(req.value);
          break;
      }

      if (shouldUnlock) {
        get().unlockCosmetic('cardFrame', frame.id);
        console.log(`[CosmeticsStore] Unlocked frame: ${frame.name}`);
      }
    });

    // Check all transitions
    Object.values(TRANSITION_EFFECTS).forEach(transition => {
      if (state.unlockedTransitions.includes(transition.id)) return;
      if (!transition.unlockRequirement) return;
      if (transition.unlockRequirement.type === 'purchase') return; // Skip purchasables

      const req = transition.unlockRequirement;
      let shouldUnlock = false;

      switch (req.type) {
        case 'level':
          shouldUnlock = level >= req.value;
          break;
        case 'achievement':
          shouldUnlock = unlockedAchievements?.includes(req.value);
          break;
      }

      if (shouldUnlock) {
        get().unlockCosmetic('transition', transition.id);
        console.log(`[CosmeticsStore] Unlocked transition: ${transition.name}`);
      }
    });

    // Check flip animations
    Object.values(LOCKER_FLIP_ANIMATIONS).forEach(anim => {
      if (!anim.unlockRequirement) return;
      if (state.unlockedFlipAnimations?.includes(anim.id)) return;
      if (anim.unlockRequirement.type === 'purchase') return;

      const req = anim.unlockRequirement;
      let shouldUnlock = false;

      switch (req.type) {
        case 'level':
          shouldUnlock = level >= req.value;
          break;
        case 'achievement':
          shouldUnlock = unlockedAchievements?.includes(req.value);
          break;
      }

      if (shouldUnlock) {
        get().unlockFlipAnimation(anim.id);
        console.log(`[CosmeticsStore] Unlocked flip animation: ${anim.name}`);
      }
    });
  },

  // ============================================================
  // FLIP ANIMATIONS
  // ============================================================

  /**
   * Equip a flip animation
   */
  equipFlipAnimation: (animationId) => {
    const state = get();
    // 'random' is always valid
    if (animationId !== 'random' && !state.unlockedFlipAnimations?.includes(animationId)) {
      console.warn(`[CosmeticsStore] Flip animation not unlocked: ${animationId}`);
      return false;
    }

    set({
      equipped: {
        ...state.equipped,
        flipAnimation: animationId,
      },
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Unlock a flip animation
   */
  unlockFlipAnimation: (animationId) => {
    const state = get();
    if (state.unlockedFlipAnimations?.includes(animationId)) {
      return false; // Already unlocked
    }

    set({
      unlockedFlipAnimations: [...(state.unlockedFlipAnimations || []), animationId],
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Purchase a flip animation
   */
  purchaseFlipAnimation: (animationId) => {
    const state = get();
    const anim = SHOP_FLIP_ANIMATIONS[animationId];

    if (!anim) {
      return { success: false, error: 'Animation not found in shop' };
    }

    if (!anim.unlockRequirement || anim.unlockRequirement.type !== 'purchase') {
      return { success: false, error: 'Animation is not purchasable' };
    }

    const price = anim.unlockRequirement.price;
    if (state.cosmicDust < price) {
      return { success: false, error: 'Not enough cosmic dust' };
    }

    set({ cosmicDust: state.cosmicDust - price });
    get().unlockFlipAnimation(animationId);
    return { success: true };
  },

  /**
   * Get equipped flip animation (resolves 'random' to actual pick)
   */
  getEquippedFlipAnimation: () => {
    const state = get();
    const animId = state.equipped.flipAnimation;

    if (animId === 'random') {
      return get().getRandomFromPool('flipAnimations');
    }

    return ALL_FLIP_ANIMATIONS[animId] || ALL_FLIP_ANIMATIONS.classic;
  },

  /**
   * Get all unlocked flip animations
   */
  getUnlockedFlipAnimations: () => {
    const state = get();
    return (state.unlockedFlipAnimations || [])
      .map(id => ALL_FLIP_ANIMATIONS[id])
      .filter(Boolean);
  },

  // ============================================================
  // GRANULAR RANDOMIZATION POOLS
  // ============================================================

  /**
   * Toggle item in/out of a random pool
   */
  togglePoolItem: (poolType, itemId) => {
    const state = get();
    const pool = state.randomPools?.[poolType] || [];

    let newPool;
    if (pool.includes(itemId)) {
      // Remove from pool (but must keep at least 1)
      if (pool.length <= 1) {
        console.warn(`[CosmeticsStore] Cannot remove last item from pool`);
        return false;
      }
      newPool = pool.filter(id => id !== itemId);
    } else {
      // Add to pool
      newPool = [...pool, itemId];
    }

    set({
      randomPools: {
        ...state.randomPools,
        [poolType]: newPool,
      },
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Set entire pool at once
   */
  setPool: (poolType, itemIds) => {
    const state = get();
    if (!itemIds || itemIds.length === 0) {
      console.warn(`[CosmeticsStore] Pool must have at least one item`);
      return false;
    }

    set({
      randomPools: {
        ...state.randomPools,
        [poolType]: itemIds,
      },
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Get random item from a pool
   */
  getRandomFromPool: (poolType) => {
    const state = get();
    const pool = state.randomPools?.[poolType] || [];

    if (pool.length === 0) {
      // Fallback to defaults
      switch (poolType) {
        case 'cardBacks': return CARD_BACKS.celestial_default;
        case 'themes': return BACKGROUND_THEMES.celestial;
        case 'transitions': return TRANSITION_EFFECTS.fade;
        case 'flipAnimations': return ALL_FLIP_ANIMATIONS.classic;
        default: return null;
      }
    }

    const randomId = pool[Math.floor(Math.random() * pool.length)];

    switch (poolType) {
      case 'cardBacks': return CARD_BACKS[randomId];
      case 'themes': return BACKGROUND_THEMES[randomId];
      case 'transitions': return TRANSITION_EFFECTS[randomId];
      case 'flipAnimations': return ALL_FLIP_ANIMATIONS[randomId];
      default: return null;
    }
  },

  /**
   * Check if item is in pool
   */
  isInPool: (poolType, itemId) => {
    const state = get();
    return state.randomPools?.[poolType]?.includes(itemId) || false;
  },

  // ============================================================
  // DECK VERSION PREFERENCES
  // ============================================================

  /**
   * Toggle a deck version on/off
   */
  toggleDeckVersion: (versionId) => {
    const state = get();
    const enabled = state.deckVersions?.enabled || ['rws'];

    let newEnabled;
    if (enabled.includes(versionId)) {
      // Disable (but must keep at least 1)
      if (enabled.length <= 1) {
        console.warn(`[CosmeticsStore] Must have at least one deck version enabled`);
        return false;
      }
      newEnabled = enabled.filter(id => id !== versionId);
    } else {
      // Enable
      newEnabled = [...enabled, versionId];
    }

    set({
      deckVersions: {
        ...state.deckVersions,
        enabled: newEnabled,
      },
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Set deck version priority
   */
  setDeckPriority: (priority) => {
    const state = get();
    set({
      deckVersions: {
        ...state.deckVersions,
        priority,
      },
    });
    get().saveCosmetics();
  },

  /**
   * Set Major Arcana specific preference
   */
  setMajorArcanaPreference: (preference) => {
    const state = get();
    set({
      deckVersions: {
        ...state.deckVersions,
        majorArcanaPreference: preference,
      },
    });
    get().saveCosmetics();
  },

  /**
   * Get the deck version to use for a specific card
   * @param {boolean} isMajorArcana - Whether the card is Major Arcana
   * @returns {string} The deck version ID to use
   */
  getDeckVersionForCard: (isMajorArcana = false) => {
    const state = get();
    const { enabled, priority, majorArcanaPreference } = state.deckVersions || {};

    // Use major arcana preference if applicable
    const effectivePriority = isMajorArcana ? majorArcanaPreference : priority;

    // If specific version is prioritized and enabled, use it
    if (effectivePriority !== 'random' && enabled?.includes(effectivePriority)) {
      // For animated, only works with Major Arcana
      if (effectivePriority === 'midjourney_animated' && !isMajorArcana) {
        // Fall back to static for minor arcana
        return enabled.includes('midjourney_static') ? 'midjourney_static' : 'rws';
      }
      return effectivePriority;
    }

    // Random from enabled
    const validVersions = (enabled || ['rws']).filter(v => {
      // Animated only valid for Major Arcana
      if (v === 'midjourney_animated' && !isMajorArcana) return false;
      return true;
    });

    if (validVersions.length === 0) return 'rws';
    return validVersions[Math.floor(Math.random() * validVersions.length)];
  },

  // ============================================================
  // THEME SYSTEM
  // ============================================================

  /**
   * Set the app theme
   */
  setAppTheme: (themeId) => {
    const state = get();
    const themeData = THEMES[themeId];

    if (!themeData) {
      console.warn(`[CosmeticsStore] Unknown theme: ${themeId}`);
      return false;
    }

    // Check if unlocked
    const isUnlocked = themeData.isDefault ||
      themeData.price === 0 ||
      state.unlockedThemes?.includes(themeId);

    if (!isUnlocked) {
      console.warn(`[CosmeticsStore] Theme not unlocked: ${themeId}`);
      return false;
    }

    set({
      equipped: {
        ...state.equipped,
        theme: themeId,
      },
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Set theme mode (light/dark/system)
   */
  setThemeMode: (mode) => {
    const state = get();
    if (!['light', 'dark', 'system'].includes(mode)) {
      console.warn(`[CosmeticsStore] Invalid theme mode: ${mode}`);
      return false;
    }

    set({
      equipped: {
        ...state.equipped,
        themeMode: mode,
      },
    });
    get().saveCosmetics();
    return true;
  },

  /**
   * Get current theme data
   */
  getCurrentTheme: () => {
    const state = get();
    const themeId = state.equipped?.theme || 'cosmic';
    return THEMES[themeId] || THEMES.cosmic;
  },

  /**
   * Purchase a theme with cosmic dust
   */
  purchaseTheme: (themeId) => {
    const state = get();
    const themeData = THEMES[themeId];

    if (!themeData) {
      return { success: false, error: 'Theme not found' };
    }

    // Check if already unlocked
    if (state.unlockedThemes?.includes(themeId)) {
      return { success: false, error: 'Already owned' };
    }

    // Check if purchasable
    if (themeData.unlockMethod !== 'purchase' || themeData.price <= 0) {
      return { success: false, error: 'Theme is not purchasable' };
    }

    // Check price
    const price = themeData.price;
    if (state.cosmicDust < price) {
      return { success: false, error: 'Not enough cosmic dust', needed: price, have: state.cosmicDust };
    }

    // Deduct and unlock
    set({
      cosmicDust: state.cosmicDust - price,
      unlockedThemes: [...(state.unlockedThemes || []), themeId],
    });
    get().saveCosmetics();

    return { success: true, theme: themeData };
  },

  /**
   * Unlock a theme (for achievements, levels, events)
   */
  unlockTheme: (themeId) => {
    const state = get();
    const themeData = THEMES[themeId];

    if (!themeData) {
      return false;
    }

    // Check if already unlocked
    if (state.unlockedThemes?.includes(themeId)) {
      return false;
    }

    set({
      unlockedThemes: [...(state.unlockedThemes || []), themeId],
    });
    get().saveCosmetics();
    console.log(`[CosmeticsStore] Unlocked theme: ${themeData.name}`);
    return true;
  },

  /**
   * Get all unlocked themes
   */
  getUnlockedThemes: () => {
    const state = get();
    const unlocked = state.unlockedThemes || [];

    return Object.values(THEMES).filter(t =>
      t.isDefault || t.price === 0 || unlocked.includes(t.id)
    );
  },

  /**
   * Check theme unlock requirements (for level/achievement unlocks)
   */
  checkThemeUnlockRequirements: (userProgress) => {
    const state = get();
    const { level, unlockedAchievements } = userProgress;

    Object.values(THEMES).forEach(theme => {
      // Skip if already unlocked
      if (state.unlockedThemes?.includes(theme.id)) return;
      if (theme.isDefault || theme.price === 0) return;

      let shouldUnlock = false;

      // Level unlock
      if (theme.unlockMethod === 'level' && theme.unlockRequirement?.level) {
        shouldUnlock = level >= theme.unlockRequirement.level;
      }

      // Achievement unlock
      if (theme.unlockMethod === 'achievement' && theme.unlockRequirement?.achievement) {
        shouldUnlock = unlockedAchievements?.includes(theme.unlockRequirement.achievement);
      }

      if (shouldUnlock) {
        get().unlockTheme(theme.id);
      }
    });
  },

  // ============================================================
  // SUBSCRIBER MONTHLY REWARDS
  // ============================================================

  /**
   * Check if user can claim this month's theme reward
   */
  canClaimMonthlyTheme: () => {
    const state = get();
    const lastClaim = state.subscriberRewards?.lastMonthlyThemeClaimed;

    if (!lastClaim) return true;

    // Check if it's a new month
    const lastClaimDate = new Date(lastClaim);
    const now = new Date();

    return lastClaimDate.getMonth() !== now.getMonth() ||
           lastClaimDate.getFullYear() !== now.getFullYear();
  },

  /**
   * Get the current month's reward theme
   */
  getMonthlyRewardTheme: () => {
    const themeId = getMonthlyRewardTheme();
    return THEMES[themeId] || null;
  },

  /**
   * Claim the monthly subscriber theme reward
   * Returns the theme if successful
   */
  claimMonthlyThemeReward: () => {
    const state = get();

    // Check if can claim
    if (!get().canClaimMonthlyTheme()) {
      return { success: false, error: 'Already claimed this month' };
    }

    const themeId = getMonthlyRewardTheme();
    const themeData = THEMES[themeId];

    if (!themeData) {
      return { success: false, error: 'Reward theme not found' };
    }

    // If already unlocked, give bonus cosmic dust instead
    if (state.unlockedThemes?.includes(themeId)) {
      const bonusDust = 100; // Compensation for duplicate
      set({
        cosmicDust: state.cosmicDust + bonusDust,
        subscriberRewards: {
          ...state.subscriberRewards,
          lastMonthlyThemeClaimed: new Date().toISOString(),
        },
      });
      get().saveCosmetics();
      return {
        success: true,
        alreadyOwned: true,
        bonusDust,
        themeId,
        theme: themeData,
      };
    }

    // Unlock the theme
    set({
      unlockedThemes: [...(state.unlockedThemes || []), themeId],
      subscriberRewards: {
        ...state.subscriberRewards,
        lastMonthlyThemeClaimed: new Date().toISOString(),
        claimedThemes: [...(state.subscriberRewards?.claimedThemes || []), themeId],
      },
    });
    get().saveCosmetics();

    return {
      success: true,
      themeId,
      theme: themeData,
    };
  },

  /**
   * Get subscriber rewards history
   */
  getSubscriberRewardsHistory: () => {
    const state = get();
    return {
      lastClaimed: state.subscriberRewards?.lastMonthlyThemeClaimed,
      claimedThemes: (state.subscriberRewards?.claimedThemes || [])
        .map(id => THEMES[id])
        .filter(Boolean),
      canClaim: get().canClaimMonthlyTheme(),
      currentReward: get().getMonthlyRewardTheme(),
    };
  },

  /**
   * Reset to defaults (for testing)
   */
  resetCosmetics: async () => {
    set({ ...defaultCosmetics, isInitialized: true });
    await get().saveCosmetics();
  },
}));

export default useCosmeticsStore;
