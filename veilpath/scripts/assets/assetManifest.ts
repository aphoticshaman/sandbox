/**
 * ASSET PRODUCTION MANIFEST
 *
 * This file defines ALL cosmetic assets that need to be generated.
 * Used by the procedural generation pipeline to create 200+ unique items.
 *
 * Organization:
 * 1. Collection assets (matching sets)
 * 2. Standalone premium items
 * 3. Achievement rewards
 * 4. Seasonal/Event items
 * 5. Evolution variants
 *
 * Total planned: 250+ assets
 */

import {
  CosmeticCategory,
  Rarity,
  CollectionTier,
} from '../../src/config/cosmeticsTypes';

export interface AssetDefinition {
  id: string;
  name: string;
  category: CosmeticCategory;
  rarity: Rarity;
  collectionId?: string;
  evolutionTier?: CollectionTier;
  eventId?: string;
  achievementId?: string;
  prompt: AssetPrompt;
  metadata: AssetMetadata;
}

export interface AssetPrompt {
  base: string;
  style: string[];
  colors: string[];
  elements: string[];
  negativePrompt: string;
}

export interface AssetMetadata {
  releaseDate?: string;
  isExclusive: boolean;
  canEvolve: boolean;
  tradeable: boolean;
  lore?: string;
}

// Standard negative prompt for all assets
const STANDARD_NEGATIVE = 'blurry, low quality, text, watermark, signature, ugly, distorted, amateur, cropped, out of frame, nsfw';

// =============================================================================
// CELESTIAL FIRE COLLECTION (32 assets)
// =============================================================================

export const CELESTIAL_FIRE_ASSETS: AssetDefinition[] = [
  // Card Backs - Base to Transcendent
  {
    id: 'back_celestial_fire',
    name: 'Celestial Flame',
    category: 'card_back',
    rarity: 'rare',
    collectionId: 'celestial_fire',
    evolutionTier: 'base',
    prompt: {
      base: 'Tarot card back design, 750x1125px, cosmic flames emanating from center',
      style: ['ethereal glow', 'mystical fire', 'dark fantasy', 'ornate border'],
      colors: ['#FF4500 orange-red', '#FFD700 gold', '#8B0000 dark red', '#1a0a00 deep black'],
      elements: ['central phoenix silhouette', 'spiral flame pattern', 'star particles', 'golden filigree border'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: true,
      tradeable: true,
      lore: 'The first flames of creation, captured in eternal form.',
    },
  },
  {
    id: 'back_celestial_fire_enhanced',
    name: 'Blazing Celestial',
    category: 'card_back',
    rarity: 'epic',
    collectionId: 'celestial_fire',
    evolutionTier: 'enhanced',
    prompt: {
      base: 'Tarot card back design, 750x1125px, intensified cosmic flames with animated feel',
      style: ['dynamic flames', 'particle effects', 'premium feel', 'intricate detail'],
      colors: ['#FF6347 tomato', '#FFA500 orange', '#FFD700 gold', '#8B0000 dark red'],
      elements: ['rising phoenix', 'solar flare tendrils', 'ember particles', 'double golden border'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: true,
      tradeable: true,
      lore: 'The flames grow stronger. The phoenix stirs.',
    },
  },
  {
    id: 'back_celestial_fire_perfected',
    name: 'Perfected Inferno',
    category: 'card_back',
    rarity: 'legendary',
    collectionId: 'celestial_fire',
    evolutionTier: 'perfected',
    prompt: {
      base: 'Tarot card back design, 750x1125px, perfect cosmic fire masterpiece',
      style: ['museum quality', 'hyper detailed', 'premium luxury', 'magical realism'],
      colors: ['#FF4500 intense orange', '#FFFFFF white hot', '#FFD700 pure gold', '#330000 ember glow'],
      elements: ['fully formed phoenix', 'reality-warping heat', 'crystallized flames', 'platinum border with gems'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: true,
      tradeable: true,
      lore: 'Perfection achieved through dedication. The flames obey your will.',
    },
  },
  {
    id: 'back_celestial_fire_transcendent',
    name: 'Transcendent Phoenix',
    category: 'card_back',
    rarity: 'mythic',
    collectionId: 'celestial_fire',
    evolutionTier: 'transcendent',
    prompt: {
      base: 'Tarot card back design, 750x1125px, ultimate transcendent fire, phoenix ascension',
      style: ['divine quality', 'otherworldly', 'breathing fire effect', 'legendary artifact'],
      colors: ['#FFFFFF pure white', '#FFD700 divine gold', '#FF4500 cosmic fire', '#9400D3 soul purple'],
      elements: ['ascending phoenix transformation', 'cosmic fire corona', 'reality tears', 'mythic runes'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
      lore: 'You have become the flame itself. Rebirth is now your nature.',
    },
  },

  // Card Frame
  {
    id: 'frame_celestial_fire',
    name: 'Ember Frame',
    category: 'card_frame',
    rarity: 'rare',
    collectionId: 'celestial_fire',
    prompt: {
      base: 'Ornate card frame, transparent center, flame motifs wrapping edges',
      style: ['golden fire accents', 'animated flame corners', 'warm glow'],
      colors: ['#FF4500 orange', '#FFD700 gold', '#8B0000 deep red'],
      elements: ['corner flame flourishes', 'ember particles along edges', 'heat shimmer effect'],
      negativePrompt: STANDARD_NEGATIVE + ', solid center',
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
      lore: 'Frames forged in starfire.',
    },
  },

  // Flip Animation
  {
    id: 'flip_celestial_fire',
    name: 'Phoenix Flip',
    category: 'flip_animation',
    rarity: 'epic',
    collectionId: 'celestial_fire',
    prompt: {
      base: 'Card flip animation sequence, fire burst effect, phoenix silhouette mid-flip',
      style: ['smooth 3D rotation', 'particle explosion', 'satisfying motion'],
      colors: ['#FF4500 orange', '#FFD700 gold', '#FFFFFF white flash'],
      elements: ['fire trail', 'feather particles', 'heat distortion'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },

  // Reveal Effect
  {
    id: 'reveal_celestial_fire',
    name: 'Flame Reveal',
    category: 'reveal_effect',
    rarity: 'rare',
    collectionId: 'celestial_fire',
    prompt: {
      base: 'Card reveal particle effect, flames erupting outward from card center',
      style: ['particle burst', 'ethereal fire', 'magical'],
      colors: ['#FF4500 orange', '#FFD700 gold', '#FF6347 coral'],
      elements: ['spiral flames', 'ember shower', 'warm light bloom'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },

  // UI Theme
  {
    id: 'theme_celestial_fire',
    name: 'Celestial Fire Theme',
    category: 'ui_theme',
    rarity: 'epic',
    collectionId: 'celestial_fire',
    prompt: {
      base: 'Mobile app UI color scheme, dark background with warm fire accents',
      style: ['dark mode', 'warm highlights', 'premium feel'],
      colors: ['#1a0a00 background', '#FF4500 primary', '#FFD700 accent', '#FF6347 secondary'],
      elements: ['subtle ember particles in background', 'warm gradient headers', 'golden buttons'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },

  // Avatar
  {
    id: 'avatar_celestial_fire',
    name: 'Flame Spirit',
    category: 'avatar',
    rarity: 'epic',
    collectionId: 'celestial_fire',
    prompt: {
      base: 'Circular avatar portrait, mystical fire elemental being, dark fantasy style',
      style: ['ethereal', 'glowing eyes', 'mystical creature'],
      colors: ['#FF4500 orange', '#FFD700 gold', '#8B0000 deep red'],
      elements: ['flame hair flowing upward', 'ember skin texture', 'phoenix symbol on forehead'],
      negativePrompt: STANDARD_NEGATIVE + ', human face',
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
      lore: 'A spirit born of the first sunrise.',
    },
  },

  // Profile Border
  {
    id: 'border_celestial_fire',
    name: 'Phoenix Border',
    category: 'profile_border',
    rarity: 'rare',
    collectionId: 'celestial_fire',
    prompt: {
      base: 'Circular profile border frame, phoenix wings wrapping around, transparent center',
      style: ['ornate', 'animated flames', 'premium'],
      colors: ['#FF4500 orange', '#FFD700 gold', '#8B0000 deep red'],
      elements: ['phoenix wing tips meeting at top', 'ember particles', 'warm glow effect'],
      negativePrompt: STANDARD_NEGATIVE + ', solid center',
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },

  // Touch Trail
  {
    id: 'trail_celestial_fire',
    name: 'Ember Trail',
    category: 'touch_trail',
    rarity: 'uncommon',
    collectionId: 'celestial_fire',
    prompt: {
      base: 'Touch/cursor trail effect, small embers and flame wisps following movement',
      style: ['particle effect', 'smooth fade', 'magical'],
      colors: ['#FF4500 orange', '#FFD700 gold', '#FF6347 coral'],
      elements: ['tiny ember particles', 'smoke wisps', 'warm glow'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },
];

// =============================================================================
// ABYSSAL DEPTHS COLLECTION (32 assets)
// =============================================================================

export const ABYSSAL_DEPTHS_ASSETS: AssetDefinition[] = [
  // Card Backs - Base to Transcendent
  {
    id: 'back_abyssal_depths',
    name: 'Abyssal Depths',
    category: 'card_back',
    rarity: 'rare',
    collectionId: 'abyssal_depths',
    evolutionTier: 'base',
    prompt: {
      base: 'Tarot card back design, 750x1125px, deep ocean abyss, bioluminescent creatures',
      style: ['underwater atmosphere', 'dark and mysterious', 'ethereal glow'],
      colors: ['#000033 deep blue', '#001166 navy', '#00FFFF cyan bioluminescence', '#003366 ocean'],
      elements: ['deep sea creatures silhouettes', 'bioluminescent particles', 'pressure waves', 'coral border'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: true,
      tradeable: true,
      lore: 'In the depths, wisdom waits for those who dare to sink.',
    },
  },
  {
    id: 'back_abyssal_depths_enhanced',
    name: 'Luminous Abyss',
    category: 'card_back',
    rarity: 'epic',
    collectionId: 'abyssal_depths',
    evolutionTier: 'enhanced',
    prompt: {
      base: 'Tarot card back design, 750x1125px, enhanced bioluminescent abyss, more creatures visible',
      style: ['increased glow', 'flowing currents', 'mystical depth'],
      colors: ['#000044 darker blue', '#00FFFF bright cyan', '#00FF00 green glow', '#4169E1 royal blue'],
      elements: ['jellyfish lanterns', 'anglerfish lights', 'swirling current patterns'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: true,
      tradeable: true,
    },
  },
  {
    id: 'back_abyssal_depths_perfected',
    name: 'Leviathan\'s Domain',
    category: 'card_back',
    rarity: 'legendary',
    collectionId: 'abyssal_depths',
    evolutionTier: 'perfected',
    prompt: {
      base: 'Tarot card back design, 750x1125px, leviathan partially visible in depths, ancient underwater temple',
      style: ['awe-inspiring scale', 'ancient mystery', 'premium quality'],
      colors: ['#000022 void blue', '#00FFFF cyan', '#FFD700 ancient gold', '#008B8B dark cyan'],
      elements: ['massive eye of leviathan', 'ruined temple columns', 'treasure glow'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: true,
      tradeable: true,
      lore: 'The leviathan acknowledges your presence.',
    },
  },
  {
    id: 'back_abyssal_depths_transcendent',
    name: 'Ocean\'s Heart',
    category: 'card_back',
    rarity: 'mythic',
    collectionId: 'abyssal_depths',
    evolutionTier: 'transcendent',
    prompt: {
      base: 'Tarot card back design, 750x1125px, transcendent ocean consciousness, merging with the deep',
      style: ['divine underwater', 'cosmic ocean', 'mythic quality'],
      colors: ['#000011 void', '#00FFFF divine cyan', '#FF00FF ocean magic', '#FFFFFF pure light'],
      elements: ['ocean soul manifestation', 'infinite depth', 'leviathan blessing', 'reality merging'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
      lore: 'You have become one with the eternal depths.',
    },
  },

  // Card Frame
  {
    id: 'frame_abyssal_depths',
    name: 'Coral Frame',
    category: 'card_frame',
    rarity: 'rare',
    collectionId: 'abyssal_depths',
    prompt: {
      base: 'Ornate card frame, transparent center, deep sea coral and tentacles wrapping edges',
      style: ['bioluminescent accents', 'flowing seaweed', 'underwater feel'],
      colors: ['#000033 deep blue', '#00FFFF cyan glow', '#FF6B6B coral pink'],
      elements: ['coral formations', 'bubble particles', 'tentacle flourishes at corners'],
      negativePrompt: STANDARD_NEGATIVE + ', solid center',
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },

  // Flip Animation
  {
    id: 'flip_abyssal_depths',
    name: 'Tide Flip',
    category: 'flip_animation',
    rarity: 'epic',
    collectionId: 'abyssal_depths',
    prompt: {
      base: 'Card flip animation, water splash effect, bubbles rising, underwater transition',
      style: ['fluid motion', 'water physics', 'satisfying splash'],
      colors: ['#00FFFF cyan', '#4169E1 royal blue', '#FFFFFF bubble white'],
      elements: ['water droplets', 'bubble burst', 'wave ripple'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },

  // Reveal Effect
  {
    id: 'reveal_abyssal_depths',
    name: 'Deep Reveal',
    category: 'reveal_effect',
    rarity: 'rare',
    collectionId: 'abyssal_depths',
    prompt: {
      base: 'Card reveal particle effect, bioluminescent particles erupting, bubble cascade',
      style: ['underwater magic', 'glowing particles', 'mysterious'],
      colors: ['#00FFFF cyan', '#00FF00 green glow', '#4169E1 blue'],
      elements: ['bioluminescent dots', 'rising bubbles', 'water shimmer'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },

  // UI Theme
  {
    id: 'theme_abyssal_depths',
    name: 'Abyssal Theme',
    category: 'ui_theme',
    rarity: 'epic',
    collectionId: 'abyssal_depths',
    prompt: {
      base: 'Mobile app UI color scheme, dark ocean depths with bioluminescent accents',
      style: ['deep sea atmosphere', 'calming darkness', 'cyan highlights'],
      colors: ['#000022 background', '#00FFFF primary', '#4169E1 secondary', '#00FF00 accent'],
      elements: ['subtle bubble particles', 'wave patterns', 'coral textures'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },

  // Avatar
  {
    id: 'avatar_abyssal_depths',
    name: 'Deep One',
    category: 'avatar',
    rarity: 'epic',
    collectionId: 'abyssal_depths',
    prompt: {
      base: 'Circular avatar portrait, deep sea creature/spirit, bioluminescent features',
      style: ['ethereal underwater being', 'glowing eyes', 'mystical'],
      colors: ['#000033 deep blue', '#00FFFF cyan glow', '#00FF00 green'],
      elements: ['flowing tentacle hair', 'glowing markings', 'pearl eyes'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
      lore: 'A guardian of the lightless depths.',
    },
  },

  // Profile Border
  {
    id: 'border_abyssal_depths',
    name: 'Kraken Border',
    category: 'profile_border',
    rarity: 'rare',
    collectionId: 'abyssal_depths',
    prompt: {
      base: 'Circular profile border frame, tentacles wrapping around, transparent center',
      style: ['ornate', 'bioluminescent', 'mysterious'],
      colors: ['#000033 deep blue', '#00FFFF cyan', '#FF6B6B coral'],
      elements: ['kraken tentacles', 'suction cups', 'glowing particles'],
      negativePrompt: STANDARD_NEGATIVE + ', solid center',
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },

  // Touch Trail
  {
    id: 'trail_abyssal_depths',
    name: 'Bubble Trail',
    category: 'touch_trail',
    rarity: 'uncommon',
    collectionId: 'abyssal_depths',
    prompt: {
      base: 'Touch/cursor trail effect, bubbles and bioluminescent particles following movement',
      style: ['underwater feel', 'floating particles', 'calming'],
      colors: ['#00FFFF cyan', '#FFFFFF bubble white', '#00FF00 glow'],
      elements: ['rising bubbles', 'glowing dots', 'water ripples'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },
];

// =============================================================================
// VOID WALKER COLLECTION (40 assets - Premium)
// =============================================================================

export const VOID_WALKER_ASSETS: AssetDefinition[] = [
  // Card Backs with full evolution tree
  {
    id: 'back_void_walker',
    name: 'Void Gate',
    category: 'card_back',
    rarity: 'epic',
    collectionId: 'void_walker',
    evolutionTier: 'base',
    prompt: {
      base: 'Tarot card back design, 750x1125px, cosmic void portal, reality tear',
      style: ['reality distortion', 'cosmic horror', 'premium dark fantasy'],
      colors: ['#000000 void black', '#330066 deep purple', '#9900FF neon purple', '#FF00FF magenta'],
      elements: ['central void portal', 'reality cracks', 'star field background', 'eldritch symbols'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: true,
      tradeable: true,
      lore: 'A doorway to spaces that should not exist.',
    },
  },
  {
    id: 'back_void_walker_transcendent',
    name: 'Void Sovereign',
    category: 'card_back',
    rarity: 'mythic',
    collectionId: 'void_walker',
    evolutionTier: 'transcendent',
    prompt: {
      base: 'Tarot card back design, 750x1125px, ultimate void entity, becoming the cosmos',
      style: ['cosmic deity', 'reality manipulation', 'mythic artifact'],
      colors: ['#000000 absolute void', '#FF00FF cosmic magenta', '#FFFFFF star white', '#9400D3 divine purple'],
      elements: ['user becoming void', 'infinite dimensions visible', 'creation and destruction balance'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
      lore: 'You do not walk the void. You ARE the void.',
    },
  },

  // Additional Void Walker items
  {
    id: 'frame_void_walker',
    name: 'Void Tear Frame',
    category: 'card_frame',
    rarity: 'epic',
    collectionId: 'void_walker',
    prompt: {
      base: 'Ornate card frame, reality tears and void energy crackling at edges',
      style: ['cosmic horror', 'dimensional instability', 'premium'],
      colors: ['#000000 void', '#9900FF purple energy', '#FF00FF magenta cracks'],
      elements: ['reality fractures', 'void tentacles at corners', 'star particles'],
      negativePrompt: STANDARD_NEGATIVE + ', solid center',
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },

  {
    id: 'avatar_void_walker',
    name: 'Void Entity',
    category: 'avatar',
    rarity: 'legendary',
    collectionId: 'void_walker',
    prompt: {
      base: 'Circular avatar portrait, cosmic void being, reality-defying form',
      style: ['eldritch', 'cosmic horror', 'ethereal'],
      colors: ['#000000 void', '#9900FF purple', '#FF00FF magenta', '#FFFFFF star eyes'],
      elements: ['void body with stars inside', 'reality-warping outline', 'cosmic eyes'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
      lore: 'What looks back is not human. It never was.',
    },
  },
];

// =============================================================================
// GOLDEN DAWN COLLECTION (32 assets)
// =============================================================================

export const GOLDEN_DAWN_ASSETS: AssetDefinition[] = [
  {
    id: 'back_golden_dawn',
    name: 'Divine Light',
    category: 'card_back',
    rarity: 'epic',
    collectionId: 'golden_dawn',
    evolutionTier: 'base',
    prompt: {
      base: 'Tarot card back design, 750x1125px, sacred golden light, divine illumination',
      style: ['sacred geometry', 'divine radiance', 'spiritual'],
      colors: ['#FFD700 pure gold', '#FFA500 warm orange', '#FFFAF0 divine white', '#DAA520 golden rod'],
      elements: ['sun disk center', 'radiating light beams', 'sacred symbols', 'ornate gold border'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: true,
      tradeable: true,
      lore: 'The first light of creation preserved in gold.',
    },
  },
  {
    id: 'avatar_golden_dawn',
    name: 'Sun Herald',
    category: 'avatar',
    rarity: 'legendary',
    collectionId: 'golden_dawn',
    prompt: {
      base: 'Circular avatar portrait, divine being of light, angelic solar entity',
      style: ['divine', 'radiant', 'celestial'],
      colors: ['#FFD700 gold', '#FFFFFF pure white', '#FFA500 warm light'],
      elements: ['halo of light', 'golden eyes', 'sun symbols'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
      lore: 'A herald of the eternal dawn.',
    },
  },
];

// =============================================================================
// STANDALONE PREMIUM ITEMS (50 assets)
// =============================================================================

export const STANDALONE_PREMIUM_ASSETS: AssetDefinition[] = [
  // Legendary standalone items that don't belong to collections
  {
    id: 'back_midnight_oracle',
    name: 'Midnight Oracle',
    category: 'card_back',
    rarity: 'legendary',
    prompt: {
      base: 'Tarot card back design, 750x1125px, mystical oracle under midnight sky',
      style: ['mysterious', 'elegant', 'dark blue night'],
      colors: ['#191970 midnight blue', '#C0C0C0 silver', '#FFD700 gold stars', '#4B0082 indigo'],
      elements: ['crystal ball center', 'star constellations', 'crescent moon', 'silver filigree'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
      lore: 'Crafted by oracles who read the stars.',
    },
  },
  {
    id: 'back_blood_moon',
    name: 'Blood Moon Rising',
    category: 'card_back',
    rarity: 'epic',
    prompt: {
      base: 'Tarot card back design, 750x1125px, blood red moon over dark landscape',
      style: ['ominous', 'gothic', 'dark fantasy'],
      colors: ['#8B0000 blood red', '#2F4F4F dark slate', '#DC143C crimson', '#000000 void'],
      elements: ['massive red moon', 'silhouetted dead trees', 'wolves howling', 'gothic border'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },
  {
    id: 'back_enchanted_forest',
    name: 'Enchanted Woods',
    category: 'card_back',
    rarity: 'rare',
    prompt: {
      base: 'Tarot card back design, 750x1125px, magical forest at twilight',
      style: ['whimsical', 'mystical nature', 'fairy tale'],
      colors: ['#228B22 forest green', '#9370DB medium purple', '#FFD700 firefly gold', '#2E8B57 sea green'],
      elements: ['ancient trees', 'glowing mushrooms', 'fairy lights', 'hidden path'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: false,
      canEvolve: false,
      tradeable: true,
    },
  },
];

// =============================================================================
// ACHIEVEMENT REWARD ASSETS (30 assets)
// =============================================================================

export const ACHIEVEMENT_ASSETS: AssetDefinition[] = [
  {
    id: 'back_veil_master',
    name: "Veil Master's Deck",
    category: 'card_back',
    rarity: 'legendary',
    achievementId: 'journey_1000_readings',
    prompt: {
      base: 'Tarot card back design, 750x1125px, mastery achievement, ultimate reader',
      style: ['prestigious', 'earned through dedication', 'premium'],
      colors: ['#FFD700 gold', '#4B0082 royal purple', '#000000 void', '#C0C0C0 silver'],
      elements: ['1000 reading symbol', 'mastery crown', 'veil pattern', 'achievement laurels'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: true,
      canEvolve: false,
      tradeable: false,
      lore: 'Only those who have completed 1000 readings may bear this mark.',
    },
  },
  {
    id: 'border_eternal',
    name: 'Eternal Devotion',
    category: 'profile_border',
    rarity: 'legendary',
    achievementId: 'dedication_streak_365',
    prompt: {
      base: 'Circular profile border, 365-day streak achievement, eternal flame concept',
      style: ['prestigious', 'dedication reward', 'eternal flame'],
      colors: ['#FFD700 gold', '#FF4500 eternal flame', '#4B0082 royal purple'],
      elements: ['365 days symbol', 'never-ending flame', 'time symbols'],
      negativePrompt: STANDARD_NEGATIVE + ', solid center',
    },
    metadata: {
      isExclusive: true,
      canEvolve: false,
      tradeable: false,
      lore: 'A year of unbroken devotion. Eternal.',
    },
  },
  {
    id: 'avatar_enlightened',
    name: 'The Enlightened',
    category: 'avatar',
    rarity: 'legendary',
    achievementId: 'journey_1000_readings',
    prompt: {
      base: 'Circular avatar portrait, enlightened being, achieved ultimate wisdom',
      style: ['transcendent', 'divine wisdom', 'achievement portrait'],
      colors: ['#FFFFFF divine white', '#FFD700 wisdom gold', '#4B0082 mystic purple'],
      elements: ['third eye open', 'crown of light', 'reading symbols'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: true,
      canEvolve: false,
      tradeable: false,
    },
  },
];

// =============================================================================
// SEASONAL/EVENT ASSETS (40+ assets per year)
// =============================================================================

export const SEASONAL_ASSETS: AssetDefinition[] = [
  // Winter Solstice 2025
  {
    id: 'back_solstice_2025',
    name: 'Winter Solstice 2025',
    category: 'card_back',
    rarity: 'epic',
    collectionId: 'winter_solstice_2025',
    eventId: 'winter_solstice_2025',
    prompt: {
      base: 'Tarot card back design, 750x1125px, winter solstice celebration, return of light',
      style: ['winter magic', 'celebration', 'limited edition'],
      colors: ['#E6E6FA lavender', '#00BFFF deep sky blue', '#FFFFFF snow white', '#C0C0C0 silver'],
      elements: ['solstice sun symbol', 'snow crystals', 'northern lights', 'evergreen border'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      releaseDate: '2025-12-21',
      isExclusive: true,
      canEvolve: false,
      tradeable: true,
      lore: 'Commemorating the first Winter Solstice of VeilPath.',
    },
  },
  {
    id: 'avatar_winter_spirit',
    name: 'Winter Spirit',
    category: 'avatar',
    rarity: 'rare',
    collectionId: 'winter_solstice_2025',
    eventId: 'winter_solstice_2025',
    prompt: {
      base: 'Circular avatar portrait, winter spirit entity, snow and ice magic',
      style: ['ethereal winter', 'frost magic', 'seasonal'],
      colors: ['#E6E6FA lavender', '#00BFFF ice blue', '#FFFFFF snow'],
      elements: ['frost crown', 'snowflake markings', 'ice crystal eyes'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      releaseDate: '2025-12-21',
      isExclusive: true,
      canEvolve: false,
      tradeable: true,
    },
  },
  {
    id: 'trail_aurora',
    name: 'Aurora Trail',
    category: 'touch_trail',
    rarity: 'rare',
    collectionId: 'winter_solstice_2025',
    eventId: 'winter_solstice_2025',
    prompt: {
      base: 'Touch/cursor trail effect, aurora borealis colors flowing',
      style: ['northern lights', 'magical', 'winter'],
      colors: ['#00FF00 green aurora', '#FF00FF magenta', '#00FFFF cyan', '#FFD700 gold'],
      elements: ['aurora waves', 'star sparkles', 'color blending'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      releaseDate: '2025-12-21',
      isExclusive: true,
      canEvolve: false,
      tradeable: true,
    },
  },

  // Spring Equinox 2026
  {
    id: 'back_spring_equinox_2026',
    name: 'Spring Awakening 2026',
    category: 'card_back',
    rarity: 'epic',
    eventId: 'spring_equinox_2026',
    prompt: {
      base: 'Tarot card back design, 750x1125px, spring rebirth, balance of light and dark',
      style: ['renewal', 'blooming', 'equinox balance'],
      colors: ['#90EE90 light green', '#FFB6C1 pink blossom', '#FFD700 sunlight', '#98FB98 spring'],
      elements: ['blooming flowers', 'yin yang day/night', 'butterflies', 'new growth'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      releaseDate: '2026-03-20',
      isExclusive: true,
      canEvolve: false,
      tradeable: true,
      lore: 'The moment of perfect balance between darkness and light.',
    },
  },
];

// =============================================================================
// FOUNDER EXCLUSIVE ASSETS
// =============================================================================

export const FOUNDER_ASSETS: AssetDefinition[] = [
  {
    id: 'back_genesis',
    name: 'Genesis Deck',
    category: 'card_back',
    rarity: 'mythic',
    achievementId: 'founder_pioneer',
    prompt: {
      base: 'Tarot card back design, 750x1125px, the first deck, genesis creation',
      style: ['legendary', 'one of 100', 'genesis mythology'],
      colors: ['#FFD700 creation gold', '#000000 primordial void', '#FFFFFF divine light', '#9400D3 royal purple'],
      elements: ['first 100 symbol', 'creation mandala', 'pioneer badge', 'genesis runes'],
      negativePrompt: STANDARD_NEGATIVE,
    },
    metadata: {
      isExclusive: true,
      canEvolve: false,
      tradeable: false,
      lore: 'Reserved for the first 100 seekers. There will never be more.',
    },
  },
  {
    id: 'border_pioneer',
    name: 'Pioneer\'s Mark',
    category: 'profile_border',
    rarity: 'mythic',
    achievementId: 'founder_pioneer',
    prompt: {
      base: 'Circular profile border, pioneer/founder exclusive, first 100 users',
      style: ['legendary prestige', 'founding member', 'mythic quality'],
      colors: ['#FFD700 gold', '#9400D3 royal purple', '#000000 void', '#FFFFFF divine'],
      elements: ['pioneer badge integration', 'first 100 symbols', 'creation marks'],
      negativePrompt: STANDARD_NEGATIVE + ', solid center',
    },
    metadata: {
      isExclusive: true,
      canEvolve: false,
      tradeable: false,
      lore: 'The mark of a pioneer. Forever.',
    },
  },
];

// =============================================================================
// ASSET TOTALS AND GENERATION ORDER
// =============================================================================

export const ALL_ASSETS: AssetDefinition[] = [
  ...CELESTIAL_FIRE_ASSETS,
  ...ABYSSAL_DEPTHS_ASSETS,
  ...VOID_WALKER_ASSETS,
  ...GOLDEN_DAWN_ASSETS,
  ...STANDALONE_PREMIUM_ASSETS,
  ...ACHIEVEMENT_ASSETS,
  ...SEASONAL_ASSETS,
  ...FOUNDER_ASSETS,
];

// Generation priority order
export const GENERATION_PRIORITY = {
  // Phase 1: Core collections (launch essentials)
  phase1: [
    'CELESTIAL_FIRE_ASSETS',    // 10 assets
    'ABYSSAL_DEPTHS_ASSETS',    // 10 assets
    'STANDALONE_PREMIUM_ASSETS', // 10 assets
  ],

  // Phase 2: Complete collections
  phase2: [
    'CELESTIAL_FIRE_ASSETS',    // Evolution variants
    'ABYSSAL_DEPTHS_ASSETS',    // Evolution variants
    'GOLDEN_DAWN_ASSETS',       // Full collection
    'VOID_WALKER_ASSETS',       // Full collection
  ],

  // Phase 3: Achievement and seasonal
  phase3: [
    'ACHIEVEMENT_ASSETS',
    'SEASONAL_ASSETS',
    'FOUNDER_ASSETS',
  ],
};

// Summary stats
export const ASSET_SUMMARY = {
  totalAssets: ALL_ASSETS.length,
  byCategory: {
    card_back: ALL_ASSETS.filter(a => a.category === 'card_back').length,
    card_frame: ALL_ASSETS.filter(a => a.category === 'card_frame').length,
    flip_animation: ALL_ASSETS.filter(a => a.category === 'flip_animation').length,
    reveal_effect: ALL_ASSETS.filter(a => a.category === 'reveal_effect').length,
    ui_theme: ALL_ASSETS.filter(a => a.category === 'ui_theme').length,
    avatar: ALL_ASSETS.filter(a => a.category === 'avatar').length,
    profile_border: ALL_ASSETS.filter(a => a.category === 'profile_border').length,
    touch_trail: ALL_ASSETS.filter(a => a.category === 'touch_trail').length,
  },
  byRarity: {
    common: ALL_ASSETS.filter(a => a.rarity === 'common').length,
    uncommon: ALL_ASSETS.filter(a => a.rarity === 'uncommon').length,
    rare: ALL_ASSETS.filter(a => a.rarity === 'rare').length,
    epic: ALL_ASSETS.filter(a => a.rarity === 'epic').length,
    legendary: ALL_ASSETS.filter(a => a.rarity === 'legendary').length,
    mythic: ALL_ASSETS.filter(a => a.rarity === 'mythic').length,
  },
  exclusive: ALL_ASSETS.filter(a => a.metadata.isExclusive).length,
  evolvable: ALL_ASSETS.filter(a => a.metadata.canEvolve).length,
};

export default {
  ALL_ASSETS,
  CELESTIAL_FIRE_ASSETS,
  ABYSSAL_DEPTHS_ASSETS,
  VOID_WALKER_ASSETS,
  GOLDEN_DAWN_ASSETS,
  STANDALONE_PREMIUM_ASSETS,
  ACHIEVEMENT_ASSETS,
  SEASONAL_ASSETS,
  FOUNDER_ASSETS,
  GENERATION_PRIORITY,
  ASSET_SUMMARY,
};
