/**
 * COSMETICS TYPE SYSTEM v2.0
 * Master catalog of all collectible/purchasable/unlockable cosmetics
 *
 * DESIGN PHILOSOPHY:
 * - Items that BUILD ON EACH OTHER, not disposable purchases
 * - Collections that create synergy bonuses when complete
 * - Evolution paths that reward dedication
 * - Prestige indicators that show accomplishment
 * - Lore/stories that deepen the mystical experience
 *
 * Categories:
 * 1. Card Backs - Custom backs for tarot deck
 * 2. Card Frames - Borders around revealed cards
 * 3. Flip Animations - How cards flip when revealed
 * 4. Reveal Effects - Particles/glow when cards appear
 * 5. UI Themes - Full app color schemes
 * 6. Titles - Display names under profile
 * 7. Avatars - Profile pictures
 * 8. Borders - Profile frame decorations
 * 9. Trails - Cursor/touch effects
 * 10. Sounds - Card flip and reveal sounds
 * 11. Reading Spreads - Custom spread layouts
 * 12. Journal Themes - Journal page backgrounds
 *
 * COLLECTION SYSTEM:
 * - Complete sets unlock synergy bonuses
 * - Mix-and-match creates "ensembles" with visual harmony
 * - Evolution paths: Base → Enhanced → Perfected → Transcendent
 */

export type CosmeticCategory =
  | 'card_back'
  | 'card_frame'
  | 'flip_animation'
  | 'reveal_effect'
  | 'ui_theme'
  | 'title'
  | 'avatar'
  | 'profile_border'
  | 'touch_trail'
  | 'sound_pack'
  | 'spread_layout'
  | 'journal_theme';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type UnlockMethod =
  | 'purchase'      // Buy with coins
  | 'premium'       // Buy with gems (premium currency)
  | 'achievement'   // Unlock via achievement
  | 'quest'         // Quest reward
  | 'event'         // Limited time event
  | 'subscription'  // Subscriber exclusive
  | 'founder'       // Early adopter
  | 'contest'       // Community contest winner
  | 'streak'        // Login/activity streak
  | 'level'         // Reach a certain level
  | 'secret';       // Hidden unlock condition

export interface CosmeticType {
  id: CosmeticCategory;
  name: string;
  description: string;
  slot: 'single' | 'multiple'; // Can equip one or many
  previewable: boolean;
  animated: boolean;
  assetTypes: string[]; // File types: png, mp4, json (lottie), mp3
  dimensions?: { width: number; height: number };
  promptGuide: string; // For AI generation
}

export const COSMETIC_TYPES: Record<CosmeticCategory, CosmeticType> = {
  card_back: {
    id: 'card_back',
    name: 'Card Backs',
    description: 'Customize the back design of your tarot deck',
    slot: 'single',
    previewable: true,
    animated: true,
    assetTypes: ['png', 'mp4', 'webm'],
    dimensions: { width: 750, height: 1125 },
    promptGuide: 'Tarot card back design, portrait orientation (2:3), ornate border, mystical central motif, dark fantasy aesthetic',
  },

  card_frame: {
    id: 'card_frame',
    name: 'Card Frames',
    description: 'Decorative borders around revealed cards',
    slot: 'single',
    previewable: true,
    animated: true,
    assetTypes: ['png', 'json'], // json for Lottie
    dimensions: { width: 800, height: 1200 },
    promptGuide: 'Ornate picture frame, transparent center, golden or mystical metals, ethereal glow effects',
  },

  flip_animation: {
    id: 'flip_animation',
    name: 'Flip Animations',
    description: 'How your cards flip when revealed',
    slot: 'single',
    previewable: true,
    animated: true,
    assetTypes: ['json', 'mp4'], // Lottie preferred
    promptGuide: 'Card flip motion, magical transition effect, particle burst, smooth 3D rotation',
  },

  reveal_effect: {
    id: 'reveal_effect',
    name: 'Reveal Effects',
    description: 'Particle effects when cards are revealed',
    slot: 'single',
    previewable: true,
    animated: true,
    assetTypes: ['json', 'mp4'],
    promptGuide: 'Magical particles, sparkles, ethereal energy burst, mystical reveal animation',
  },

  ui_theme: {
    id: 'ui_theme',
    name: 'App Themes',
    description: 'Change the entire app color scheme',
    slot: 'single',
    previewable: true,
    animated: false,
    assetTypes: ['json'], // Theme config
    promptGuide: 'Color palette with primary, secondary, accent, background colors. Dark fantasy aesthetic.',
  },

  title: {
    id: 'title',
    name: 'Titles',
    description: 'Display titles under your name',
    slot: 'multiple', // Can have many, display one
    previewable: false,
    animated: false,
    assetTypes: ['text'], // Just text, no asset needed
    promptGuide: 'Mystical title, 1-3 words, evokes status or achievement',
  },

  avatar: {
    id: 'avatar',
    name: 'Avatars',
    description: 'Profile picture options',
    slot: 'single',
    previewable: true,
    animated: true,
    assetTypes: ['png', 'mp4'],
    dimensions: { width: 512, height: 512 },
    promptGuide: 'Circular avatar, mystical character or symbol, works at small sizes, dark fantasy portrait',
  },

  profile_border: {
    id: 'profile_border',
    name: 'Profile Borders',
    description: 'Decorative frame around your avatar',
    slot: 'single',
    previewable: true,
    animated: true,
    assetTypes: ['png', 'json'],
    dimensions: { width: 600, height: 600 },
    promptGuide: 'Circular frame border, ornate decoration, transparent center, glowing effects',
  },

  touch_trail: {
    id: 'touch_trail',
    name: 'Touch Trails',
    description: 'Effects that follow your finger/cursor',
    slot: 'single',
    previewable: true,
    animated: true,
    assetTypes: ['json'], // Particle config
    promptGuide: 'Trailing particles, magical sparkles, ethereal wisps following movement',
  },

  sound_pack: {
    id: 'sound_pack',
    name: 'Sound Packs',
    description: 'Custom sounds for card actions',
    slot: 'single',
    previewable: true,
    animated: false,
    assetTypes: ['mp3', 'wav'],
    promptGuide: 'Mystical sound effects: card flip, reveal, shuffle, success. Ethereal and satisfying.',
  },

  spread_layout: {
    id: 'spread_layout',
    name: 'Spread Layouts',
    description: 'Custom card spread arrangements',
    slot: 'multiple',
    previewable: true,
    animated: false,
    assetTypes: ['json'], // Layout config
    promptGuide: 'Card spread arrangement, unique positioning, thematic layout design',
  },

  journal_theme: {
    id: 'journal_theme',
    name: 'Journal Themes',
    description: 'Background and styling for journal entries',
    slot: 'single',
    previewable: true,
    animated: false,
    assetTypes: ['png', 'json'],
    dimensions: { width: 1080, height: 1920 },
    promptGuide: 'Journal page background, parchment or mystical texture, subtle patterns, readable',
  },
};

// Rarity configuration
export const RARITY_CONFIG: Record<Rarity, {
  name: string;
  color: string;
  glowColor: string;
  dropRate: number;
  priceMultiplier: number;
  xpBonus: number;
}> = {
  common: {
    name: 'Common',
    color: '#9CA3AF',
    glowColor: 'rgba(156, 163, 175, 0.3)',
    dropRate: 0.45,
    priceMultiplier: 1,
    xpBonus: 0,
  },
  uncommon: {
    name: 'Uncommon',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    dropRate: 0.30,
    priceMultiplier: 1.5,
    xpBonus: 25,
  },
  rare: {
    name: 'Rare',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    dropRate: 0.15,
    priceMultiplier: 2.5,
    xpBonus: 50,
  },
  epic: {
    name: 'Epic',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    dropRate: 0.07,
    priceMultiplier: 4,
    xpBonus: 100,
  },
  legendary: {
    name: 'Legendary',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    dropRate: 0.025,
    priceMultiplier: 8,
    xpBonus: 250,
  },
  mythic: {
    name: 'Mythic',
    color: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    dropRate: 0.005,
    priceMultiplier: 20,
    xpBonus: 500,
  },
};

// Base prices by category (in coins)
export const BASE_PRICES: Record<CosmeticCategory, number> = {
  card_back: 200,
  card_frame: 150,
  flip_animation: 300,
  reveal_effect: 250,
  ui_theme: 500,
  title: 100,
  avatar: 150,
  profile_border: 175,
  touch_trail: 200,
  sound_pack: 250,
  spread_layout: 400,
  journal_theme: 175,
};

// Calculate final price
export function calculatePrice(category: CosmeticCategory, rarity: Rarity): number {
  const base = BASE_PRICES[category];
  const multiplier = RARITY_CONFIG[rarity].priceMultiplier;
  return Math.round(base * multiplier);
}

// Showcase slots - what users see on profile
export interface ShowcaseConfig {
  maxSlots: number;
  categories: CosmeticCategory[];
}

export const SHOWCASE_CONFIG: ShowcaseConfig = {
  maxSlots: 6,
  categories: ['card_back', 'avatar', 'profile_border', 'title', 'flip_animation', 'ui_theme'],
};

// Generation themes for procedural creation
export const GENERATION_THEMES = {
  // Nature themes
  nature: [
    'ancient forest', 'deep ocean', 'starlit mountain', 'desert oasis',
    'enchanted garden', 'thunderstorm', 'northern lights', 'moonlit grove',
    'crystal cave', 'volcanic', 'frozen tundra', 'jungle temple',
  ],

  // Cosmic themes
  cosmic: [
    'nebula', 'black hole', 'constellation', 'solar eclipse',
    'meteor shower', 'galactic spiral', 'void between stars', 'supernova',
    'planetary rings', 'cosmic web', 'dark matter', 'quantum foam',
  ],

  // Mystical themes
  mystical: [
    'ancient runes', 'sacred geometry', 'alchemical', 'ethereal spirits',
    'dimensional rift', 'time vortex', 'soul mirror', 'dream realm',
    'shadow realm', 'celestial choir', 'elemental fusion', 'fate threads',
  ],

  // Aesthetic themes
  aesthetic: [
    'art nouveau', 'gothic cathedral', 'steampunk clockwork', 'vaporwave',
    'dark academia', 'cottagecore witch', 'cyber mystical', 'baroque gold',
    'minimalist zen', 'maximalist chaos', 'romantic dark', 'eldritch',
  ],

  // Creature themes
  creatures: [
    'phoenix rebirth', 'dragon awakening', 'serpent wisdom', 'wolf spirit',
    'raven messenger', 'owl guardian', 'butterfly transformation', 'moth seeker',
    'unicorn pure', 'griffin noble', 'kraken depths', 'sphinx riddle',
  ],

  // Tarot specific themes
  tarot: [
    'major arcana', 'cups emotion', 'wands passion', 'swords intellect',
    'pentacles earth', 'fool journey', 'death transformation', 'tower revelation',
    'star hope', 'moon mystery', 'sun joy', 'world completion',
  ],
};

// Achievement-locked cosmetics
export const ACHIEVEMENT_COSMETICS: Array<{
  cosmeticId: string;
  achievementId: string;
  category: CosmeticCategory;
  name: string;
  rarity: Rarity;
}> = [
  { cosmeticId: 'title_first_steps', achievementId: 'first_reading', category: 'title', name: 'Seeker', rarity: 'common' },
  { cosmeticId: 'title_dedicated', achievementId: 'readings_100', category: 'title', name: 'Dedicated Reader', rarity: 'rare' },
  { cosmeticId: 'border_streak_7', achievementId: 'streak_7', category: 'profile_border', name: 'Weekly Devotion', rarity: 'uncommon' },
  { cosmeticId: 'border_streak_30', achievementId: 'streak_30', category: 'profile_border', name: 'Monthly Mastery', rarity: 'epic' },
  { cosmeticId: 'avatar_enlightened', achievementId: 'level_50', category: 'avatar', name: 'Enlightened One', rarity: 'legendary' },
  { cosmeticId: 'effect_transcendent', achievementId: 'all_cards_seen', category: 'reveal_effect', name: 'Transcendent Reveal', rarity: 'legendary' },
  { cosmeticId: 'back_completionist', achievementId: 'all_achievements', category: 'card_back', name: 'The Completionist', rarity: 'mythic' },
];

// Level-locked cosmetics
export const LEVEL_COSMETICS: Array<{
  cosmeticId: string;
  levelRequired: number;
  category: CosmeticCategory;
  name: string;
  rarity: Rarity;
}> = [
  { cosmeticId: 'title_apprentice', levelRequired: 5, category: 'title', name: 'Apprentice', rarity: 'common' },
  { cosmeticId: 'title_adept', levelRequired: 15, category: 'title', name: 'Adept', rarity: 'uncommon' },
  { cosmeticId: 'title_master', levelRequired: 30, category: 'title', name: 'Master', rarity: 'rare' },
  { cosmeticId: 'title_archmage', levelRequired: 50, category: 'title', name: 'Archmage', rarity: 'epic' },
  { cosmeticId: 'title_elder', levelRequired: 75, category: 'title', name: 'Elder', rarity: 'legendary' },
  { cosmeticId: 'title_ascended', levelRequired: 100, category: 'title', name: 'Ascended', rarity: 'mythic' },
];

// Subscriber exclusive cosmetics (rotates monthly)
export const SUBSCRIBER_COSMETICS = {
  monthlyDropCount: 3, // 3 exclusive items per month
  categories: ['card_back', 'avatar', 'profile_border', 'flip_animation'] as CosmeticCategory[],
  rarityPool: ['rare', 'epic', 'legendary'] as Rarity[],
};

// =============================================================================
// COLLECTION SYSTEM - Items that build on each other
// =============================================================================

export type CollectionTier = 'base' | 'enhanced' | 'perfected' | 'transcendent';

export interface Collection {
  id: string;
  name: string;
  description: string;
  lore: string; // Mystical backstory
  theme: string;
  items: CollectionItem[];
  setBonus: SetBonus;
  evolutionPath?: EvolutionPath;
}

export interface CollectionItem {
  cosmeticId: string;
  category: CosmeticCategory;
  requiredForBonus: boolean;
}

export interface SetBonus {
  minItems: number; // Items needed to activate bonus
  effects: SetEffect[];
}

export interface SetEffect {
  itemCount: number; // Activate at this count
  effect: string; // Effect ID
  description: string;
  visualModifier?: string; // CSS/animation modifier
}

export interface EvolutionPath {
  baseCosmeticId: string;
  tiers: EvolutionTier[];
}

export interface EvolutionTier {
  tier: CollectionTier;
  cosmeticId: string;
  requirements: EvolutionRequirement[];
  bonuses: string[];
}

export interface EvolutionRequirement {
  type: 'shards' | 'duplicates' | 'achievement' | 'streak' | 'readings' | 'collection';
  amount: number;
  itemId?: string;
}

// Master collection definitions
export const COLLECTIONS: Collection[] = [
  // ============================================
  // ELEMENTAL COLLECTIONS - Core gameplay themes
  // ============================================
  {
    id: 'celestial_fire',
    name: 'Celestial Fire',
    description: 'Harness the power of cosmic flames',
    lore: 'Born from the death of ancient stars, the Celestial Fire collection channels the primal energy that sparked all creation. Those who master its flames walk the path between destruction and rebirth.',
    theme: 'fire',
    items: [
      { cosmeticId: 'back_celestial_fire', category: 'card_back', requiredForBonus: true },
      { cosmeticId: 'frame_celestial_fire', category: 'card_frame', requiredForBonus: true },
      { cosmeticId: 'flip_celestial_fire', category: 'flip_animation', requiredForBonus: true },
      { cosmeticId: 'reveal_celestial_fire', category: 'reveal_effect', requiredForBonus: true },
      { cosmeticId: 'theme_celestial_fire', category: 'ui_theme', requiredForBonus: false },
      { cosmeticId: 'avatar_celestial_fire', category: 'avatar', requiredForBonus: false },
      { cosmeticId: 'border_celestial_fire', category: 'profile_border', requiredForBonus: false },
      { cosmeticId: 'trail_celestial_fire', category: 'touch_trail', requiredForBonus: false },
    ],
    setBonus: {
      minItems: 2,
      effects: [
        { itemCount: 2, effect: 'ember_particles', description: 'Subtle embers float around equipped items' },
        { itemCount: 4, effect: 'flame_aura', description: 'Your profile radiates a warm glow' },
        { itemCount: 6, effect: 'phoenix_trail', description: 'Phoenix feathers trail your actions' },
        { itemCount: 8, effect: 'celestial_crown', description: 'Crown of stars appears on your avatar', visualModifier: 'celestial-fire-crown' },
      ],
    },
    evolutionPath: {
      baseCosmeticId: 'back_celestial_fire',
      tiers: [
        {
          tier: 'base',
          cosmeticId: 'back_celestial_fire',
          requirements: [],
          bonuses: ['Standard ember effects'],
        },
        {
          tier: 'enhanced',
          cosmeticId: 'back_celestial_fire_enhanced',
          requirements: [
            { type: 'duplicates', amount: 3 },
            { type: 'readings', amount: 50 },
          ],
          bonuses: ['Animated flames', 'Subtle particle effects'],
        },
        {
          tier: 'perfected',
          cosmeticId: 'back_celestial_fire_perfected',
          requirements: [
            { type: 'shards', amount: 500 },
            { type: 'streak', amount: 30 },
            { type: 'collection', amount: 4, itemId: 'celestial_fire' },
          ],
          bonuses: ['Dynamic flame intensity', 'Reactive to card meanings'],
        },
        {
          tier: 'transcendent',
          cosmeticId: 'back_celestial_fire_transcendent',
          requirements: [
            { type: 'shards', amount: 2000 },
            { type: 'achievement', amount: 1, itemId: 'master_of_wands' },
            { type: 'collection', amount: 8, itemId: 'celestial_fire' },
          ],
          bonuses: ['Living flame animation', 'Unique flip sound', 'Profile title "Phoenix Ascended"'],
        },
      ],
    },
  },

  {
    id: 'abyssal_depths',
    name: 'Abyssal Depths',
    description: 'Embrace the mysteries of the deep',
    lore: 'In the lightless depths where pressure crushes stone, ancient wisdom waits for those brave enough to descend. The Abyssal collection grants sight in darkness and calm in chaos.',
    theme: 'water',
    items: [
      { cosmeticId: 'back_abyssal_depths', category: 'card_back', requiredForBonus: true },
      { cosmeticId: 'frame_abyssal_depths', category: 'card_frame', requiredForBonus: true },
      { cosmeticId: 'flip_abyssal_depths', category: 'flip_animation', requiredForBonus: true },
      { cosmeticId: 'reveal_abyssal_depths', category: 'reveal_effect', requiredForBonus: true },
      { cosmeticId: 'theme_abyssal_depths', category: 'ui_theme', requiredForBonus: false },
      { cosmeticId: 'avatar_abyssal_depths', category: 'avatar', requiredForBonus: false },
      { cosmeticId: 'border_abyssal_depths', category: 'profile_border', requiredForBonus: false },
      { cosmeticId: 'trail_abyssal_depths', category: 'touch_trail', requiredForBonus: false },
    ],
    setBonus: {
      minItems: 2,
      effects: [
        { itemCount: 2, effect: 'bubble_particles', description: 'Gentle bubbles rise from equipped items' },
        { itemCount: 4, effect: 'bioluminescent_glow', description: 'Soft blue glow emanates from your profile' },
        { itemCount: 6, effect: 'current_flow', description: 'Flowing water currents animate your cards' },
        { itemCount: 8, effect: 'leviathan_presence', description: 'A massive shadow swims behind your profile', visualModifier: 'abyssal-leviathan' },
      ],
    },
  },

  {
    id: 'verdant_grove',
    name: 'Verdant Grove',
    description: 'Channel the eternal cycle of growth',
    lore: 'Where the oldest trees stand, their roots touch memories of the first seed. The Verdant Grove collection connects the seeker to the living web of all growing things.',
    theme: 'earth',
    items: [
      { cosmeticId: 'back_verdant_grove', category: 'card_back', requiredForBonus: true },
      { cosmeticId: 'frame_verdant_grove', category: 'card_frame', requiredForBonus: true },
      { cosmeticId: 'flip_verdant_grove', category: 'flip_animation', requiredForBonus: true },
      { cosmeticId: 'reveal_verdant_grove', category: 'reveal_effect', requiredForBonus: true },
      { cosmeticId: 'theme_verdant_grove', category: 'ui_theme', requiredForBonus: false },
      { cosmeticId: 'avatar_verdant_grove', category: 'avatar', requiredForBonus: false },
      { cosmeticId: 'border_verdant_grove', category: 'profile_border', requiredForBonus: false },
      { cosmeticId: 'trail_verdant_grove', category: 'touch_trail', requiredForBonus: false },
    ],
    setBonus: {
      minItems: 2,
      effects: [
        { itemCount: 2, effect: 'falling_leaves', description: 'Leaves gently fall around equipped items' },
        { itemCount: 4, effect: 'vine_accent', description: 'Decorative vines frame your profile' },
        { itemCount: 6, effect: 'bloom_effect', description: 'Flowers bloom when cards are revealed' },
        { itemCount: 8, effect: 'world_tree', description: 'The World Tree rises behind your avatar', visualModifier: 'verdant-world-tree' },
      ],
    },
  },

  {
    id: 'ethereal_winds',
    name: 'Ethereal Winds',
    description: 'Ride the currents between worlds',
    lore: 'The wind carries whispers from realms unseen. Those who attune to the Ethereal Winds hear messages from past, present, and futures yet unwritten.',
    theme: 'air',
    items: [
      { cosmeticId: 'back_ethereal_winds', category: 'card_back', requiredForBonus: true },
      { cosmeticId: 'frame_ethereal_winds', category: 'card_frame', requiredForBonus: true },
      { cosmeticId: 'flip_ethereal_winds', category: 'flip_animation', requiredForBonus: true },
      { cosmeticId: 'reveal_ethereal_winds', category: 'reveal_effect', requiredForBonus: true },
      { cosmeticId: 'theme_ethereal_winds', category: 'ui_theme', requiredForBonus: false },
      { cosmeticId: 'avatar_ethereal_winds', category: 'avatar', requiredForBonus: false },
      { cosmeticId: 'border_ethereal_winds', category: 'profile_border', requiredForBonus: false },
      { cosmeticId: 'trail_ethereal_winds', category: 'touch_trail', requiredForBonus: false },
    ],
    setBonus: {
      minItems: 2,
      effects: [
        { itemCount: 2, effect: 'wind_wisps', description: 'Ethereal wisps swirl around equipped items' },
        { itemCount: 4, effect: 'cloud_drift', description: 'Soft clouds drift across your profile' },
        { itemCount: 6, effect: 'feather_fall', description: 'Mystical feathers descend during readings' },
        { itemCount: 8, effect: 'sky_sovereign', description: 'Wings of light extend from your avatar', visualModifier: 'ethereal-wings' },
      ],
    },
  },

  // ============================================
  // COSMIC COLLECTIONS - Premium/Prestige themes
  // ============================================
  {
    id: 'void_walker',
    name: 'Void Walker',
    description: 'Step between the spaces that are not',
    lore: 'Beyond the stars lies the Void—not emptiness, but the canvas upon which reality is painted. Void Walkers have glimpsed what lies beneath existence itself.',
    theme: 'cosmic',
    items: [
      { cosmeticId: 'back_void_walker', category: 'card_back', requiredForBonus: true },
      { cosmeticId: 'frame_void_walker', category: 'card_frame', requiredForBonus: true },
      { cosmeticId: 'flip_void_walker', category: 'flip_animation', requiredForBonus: true },
      { cosmeticId: 'reveal_void_walker', category: 'reveal_effect', requiredForBonus: true },
      { cosmeticId: 'theme_void_walker', category: 'ui_theme', requiredForBonus: true },
      { cosmeticId: 'avatar_void_walker', category: 'avatar', requiredForBonus: true },
      { cosmeticId: 'border_void_walker', category: 'profile_border', requiredForBonus: true },
      { cosmeticId: 'trail_void_walker', category: 'touch_trail', requiredForBonus: true },
      { cosmeticId: 'sound_void_walker', category: 'sound_pack', requiredForBonus: false },
      { cosmeticId: 'spread_void_walker', category: 'spread_layout', requiredForBonus: false },
    ],
    setBonus: {
      minItems: 3,
      effects: [
        { itemCount: 3, effect: 'void_ripple', description: 'Reality ripples around your actions' },
        { itemCount: 5, effect: 'star_field', description: 'A personal constellation surrounds you' },
        { itemCount: 8, effect: 'dimensional_tear', description: 'Glimpses of other dimensions appear' },
        { itemCount: 10, effect: 'void_ascension', description: 'You become one with the cosmic void', visualModifier: 'void-ascended' },
      ],
    },
  },

  {
    id: 'golden_dawn',
    name: 'Golden Dawn',
    description: 'Illuminate the path to enlightenment',
    lore: 'When the sun first rose over the primordial world, it blessed certain souls with fragments of its light. The Golden Dawn collection reunites these scattered rays.',
    theme: 'celestial',
    items: [
      { cosmeticId: 'back_golden_dawn', category: 'card_back', requiredForBonus: true },
      { cosmeticId: 'frame_golden_dawn', category: 'card_frame', requiredForBonus: true },
      { cosmeticId: 'flip_golden_dawn', category: 'flip_animation', requiredForBonus: true },
      { cosmeticId: 'reveal_golden_dawn', category: 'reveal_effect', requiredForBonus: true },
      { cosmeticId: 'theme_golden_dawn', category: 'ui_theme', requiredForBonus: true },
      { cosmeticId: 'avatar_golden_dawn', category: 'avatar', requiredForBonus: true },
      { cosmeticId: 'border_golden_dawn', category: 'profile_border', requiredForBonus: true },
      { cosmeticId: 'trail_golden_dawn', category: 'touch_trail', requiredForBonus: true },
    ],
    setBonus: {
      minItems: 3,
      effects: [
        { itemCount: 3, effect: 'sunbeam', description: 'Warm light radiates from your cards' },
        { itemCount: 5, effect: 'halo_glow', description: 'A soft halo surrounds your avatar' },
        { itemCount: 8, effect: 'dawn_herald', description: 'The light of dawn follows your every action', visualModifier: 'golden-dawn-herald' },
      ],
    },
  },

  // ============================================
  // ARCANA COLLECTIONS - Tarot-specific themes
  // ============================================
  {
    id: 'major_arcana_mastery',
    name: 'Major Arcana Mastery',
    description: 'Command the 22 keys of fate',
    lore: 'The Major Arcana are not merely cards—they are doorways to the fundamental forces that shape existence. Those who master all 22 keys hold the universe in their hands.',
    theme: 'tarot',
    items: [
      { cosmeticId: 'back_major_arcana', category: 'card_back', requiredForBonus: true },
      { cosmeticId: 'frame_arcana_gold', category: 'card_frame', requiredForBonus: true },
      { cosmeticId: 'title_arcana_master', category: 'title', requiredForBonus: true },
      { cosmeticId: 'avatar_fool_journey', category: 'avatar', requiredForBonus: false },
      { cosmeticId: 'avatar_world_complete', category: 'avatar', requiredForBonus: false },
      { cosmeticId: 'border_22_keys', category: 'profile_border', requiredForBonus: false },
    ],
    setBonus: {
      minItems: 2,
      effects: [
        { itemCount: 2, effect: 'arcana_shimmer', description: 'Major Arcana cards shimmer with extra power' },
        { itemCount: 4, effect: 'key_rotation', description: 'The 22 keys rotate around your profile' },
        { itemCount: 6, effect: 'fate_weaver', description: 'Threads of fate visibly connect your readings', visualModifier: 'arcana-fate-weaver' },
      ],
    },
  },

  // ============================================
  // SEASONAL COLLECTIONS - Time-limited themes
  // ============================================
  {
    id: 'winter_solstice_2025',
    name: 'Winter Solstice 2025',
    description: 'Celebrate the return of light',
    lore: 'On the longest night, when darkness seems eternal, a single candle can remind us that light always returns. This collection commemorates our first Winter Solstice together.',
    theme: 'seasonal',
    items: [
      { cosmeticId: 'back_solstice_2025', category: 'card_back', requiredForBonus: true },
      { cosmeticId: 'frame_frost_crystal', category: 'card_frame', requiredForBonus: true },
      { cosmeticId: 'reveal_snowfall', category: 'reveal_effect', requiredForBonus: true },
      { cosmeticId: 'avatar_winter_spirit', category: 'avatar', requiredForBonus: false },
      { cosmeticId: 'border_ice_crown', category: 'profile_border', requiredForBonus: false },
      { cosmeticId: 'trail_aurora', category: 'touch_trail', requiredForBonus: false },
    ],
    setBonus: {
      minItems: 2,
      effects: [
        { itemCount: 2, effect: 'gentle_snow', description: 'Soft snow falls around your cards' },
        { itemCount: 4, effect: 'frost_patterns', description: 'Beautiful frost patterns form on your profile' },
        { itemCount: 6, effect: 'aurora_borealis', description: 'The northern lights dance behind you', visualModifier: 'solstice-aurora' },
      ],
    },
  },
];

// =============================================================================
// PRESTIGE SYSTEM - Show off dedication and mastery
// =============================================================================

export interface PrestigeIndicator {
  id: string;
  name: string;
  type: 'badge' | 'frame_accent' | 'title_prefix' | 'particle_effect';
  requirements: PrestigeRequirement[];
  rarity: Rarity;
}

export interface PrestigeRequirement {
  type: 'collection_complete' | 'evolution_max' | 'spending' | 'playtime' | 'readings' | 'streak_max' | 'early_adopter';
  value: number;
  collectionId?: string;
}

export const PRESTIGE_INDICATORS: PrestigeIndicator[] = [
  // Collection completion prestige
  {
    id: 'prestige_collector_bronze',
    name: 'Bronze Collector',
    type: 'badge',
    requirements: [{ type: 'collection_complete', value: 1 }],
    rarity: 'uncommon',
  },
  {
    id: 'prestige_collector_silver',
    name: 'Silver Collector',
    type: 'badge',
    requirements: [{ type: 'collection_complete', value: 3 }],
    rarity: 'rare',
  },
  {
    id: 'prestige_collector_gold',
    name: 'Gold Collector',
    type: 'badge',
    requirements: [{ type: 'collection_complete', value: 5 }],
    rarity: 'epic',
  },
  {
    id: 'prestige_collector_platinum',
    name: 'Platinum Collector',
    type: 'frame_accent',
    requirements: [{ type: 'collection_complete', value: 10 }],
    rarity: 'legendary',
  },

  // Evolution mastery
  {
    id: 'prestige_transcendent',
    name: 'Transcendent',
    type: 'title_prefix',
    requirements: [{ type: 'evolution_max', value: 1 }],
    rarity: 'legendary',
  },
  {
    id: 'prestige_ultimate',
    name: 'Ultimate Seeker',
    type: 'particle_effect',
    requirements: [{ type: 'evolution_max', value: 5 }],
    rarity: 'mythic',
  },

  // Early adopter
  {
    id: 'prestige_founder',
    name: 'Founding Seeker',
    type: 'badge',
    requirements: [{ type: 'early_adopter', value: 1 }], // First 1000 users
    rarity: 'legendary',
  },
  {
    id: 'prestige_pioneer',
    name: 'Pioneer',
    type: 'frame_accent',
    requirements: [{ type: 'early_adopter', value: 100 }], // First 100 users
    rarity: 'mythic',
  },

  // Dedication indicators
  {
    id: 'prestige_devoted',
    name: 'Devoted',
    type: 'badge',
    requirements: [{ type: 'streak_max', value: 100 }],
    rarity: 'epic',
  },
  {
    id: 'prestige_eternal',
    name: 'Eternal',
    type: 'title_prefix',
    requirements: [{ type: 'streak_max', value: 365 }],
    rarity: 'mythic',
  },
];

// =============================================================================
// SYNERGY SYSTEM - Combining items creates bonus effects
// =============================================================================

export interface Synergy {
  id: string;
  name: string;
  description: string;
  requirements: SynergyRequirement[];
  effect: string;
  visualEffect?: string;
}

export interface SynergyRequirement {
  type: 'category' | 'collection' | 'rarity' | 'theme';
  value: string;
  count?: number;
}

export const SYNERGIES: Synergy[] = [
  // Same-collection synergies
  {
    id: 'synergy_elemental_harmony',
    name: 'Elemental Harmony',
    description: 'Equip 4+ items from any elemental collection',
    requirements: [
      { type: 'collection', value: 'celestial_fire|abyssal_depths|verdant_grove|ethereal_winds', count: 4 },
    ],
    effect: 'elemental_harmony',
    visualEffect: 'Elemental particles swirl in harmony',
  },

  // Cross-collection synergies
  {
    id: 'synergy_cosmic_convergence',
    name: 'Cosmic Convergence',
    description: 'Equip items from 3 different cosmic collections',
    requirements: [
      { type: 'collection', value: 'void_walker', count: 1 },
      { type: 'collection', value: 'golden_dawn', count: 1 },
      { type: 'theme', value: 'cosmic', count: 1 },
    ],
    effect: 'cosmic_convergence',
    visualEffect: 'Stars and light merge in your profile',
  },

  // Rarity synergies
  {
    id: 'synergy_legendary_ensemble',
    name: 'Legendary Ensemble',
    description: 'Equip 5+ legendary items simultaneously',
    requirements: [
      { type: 'rarity', value: 'legendary', count: 5 },
    ],
    effect: 'legendary_aura',
    visualEffect: 'Golden legendary aura surrounds your profile',
  },

  // Matching synergies
  {
    id: 'synergy_perfect_match',
    name: 'Perfect Match',
    description: 'Equip card back, frame, and flip animation from the same collection',
    requirements: [
      { type: 'category', value: 'card_back', count: 1 },
      { type: 'category', value: 'card_frame', count: 1 },
      { type: 'category', value: 'flip_animation', count: 1 },
    ],
    effect: 'perfect_match',
    visualEffect: 'Card animations are enhanced with extra flair',
  },
];

// =============================================================================
// SHOWCASE SYSTEM - Display items prominently to others
// =============================================================================

export interface ShowcaseSlot {
  position: number;
  category: CosmeticCategory | 'any';
  size: 'small' | 'medium' | 'large' | 'featured';
  animated: boolean;
}

export interface ShowcaseLayout {
  id: string;
  name: string;
  slots: ShowcaseSlot[];
  unlockRequirement?: string;
}

export const SHOWCASE_LAYOUTS: ShowcaseLayout[] = [
  {
    id: 'showcase_basic',
    name: 'Basic Showcase',
    slots: [
      { position: 1, category: 'avatar', size: 'large', animated: true },
      { position: 2, category: 'card_back', size: 'medium', animated: true },
      { position: 3, category: 'title', size: 'small', animated: false },
    ],
  },
  {
    id: 'showcase_collector',
    name: "Collector's Display",
    slots: [
      { position: 1, category: 'avatar', size: 'featured', animated: true },
      { position: 2, category: 'card_back', size: 'large', animated: true },
      { position: 3, category: 'card_frame', size: 'medium', animated: true },
      { position: 4, category: 'profile_border', size: 'medium', animated: true },
      { position: 5, category: 'title', size: 'small', animated: false },
      { position: 6, category: 'any', size: 'small', animated: true },
    ],
    unlockRequirement: 'prestige_collector_bronze',
  },
  {
    id: 'showcase_master',
    name: 'Master Showcase',
    slots: [
      { position: 1, category: 'avatar', size: 'featured', animated: true },
      { position: 2, category: 'card_back', size: 'featured', animated: true },
      { position: 3, category: 'card_frame', size: 'large', animated: true },
      { position: 4, category: 'flip_animation', size: 'large', animated: true },
      { position: 5, category: 'reveal_effect', size: 'medium', animated: true },
      { position: 6, category: 'profile_border', size: 'medium', animated: true },
      { position: 7, category: 'touch_trail', size: 'medium', animated: true },
      { position: 8, category: 'title', size: 'small', animated: false },
    ],
    unlockRequirement: 'prestige_collector_gold',
  },
];

// =============================================================================
// ASSET GENERATION CATALOG - For procedural generation pipeline
// =============================================================================

export interface GenerationSpec {
  collectionId: string;
  category: CosmeticCategory;
  basePrompt: string;
  styleModifiers: string[];
  colorPalette: string[];
  motifs: string[];
}

export const GENERATION_CATALOG: GenerationSpec[] = [
  // Celestial Fire collection
  {
    collectionId: 'celestial_fire',
    category: 'card_back',
    basePrompt: 'Tarot card back design, cosmic flames, celestial fire, dark background',
    styleModifiers: ['ethereal glow', 'dynamic flames', 'star particles', 'ornate border'],
    colorPalette: ['#FF4500', '#FFD700', '#8B0000', '#1a0a00', '#FFA500'],
    motifs: ['phoenix', 'solar flare', 'fire mandala', 'burning star'],
  },
  {
    collectionId: 'celestial_fire',
    category: 'card_frame',
    basePrompt: 'Ornate card frame, flame motifs, transparent center, golden fire accents',
    styleModifiers: ['animated flames', 'ember particles', 'warm glow'],
    colorPalette: ['#FF4500', '#FFD700', '#8B0000'],
    motifs: ['flame border', 'sun rays', 'fire serpent'],
  },
  {
    collectionId: 'celestial_fire',
    category: 'avatar',
    basePrompt: 'Mystical portrait, fire elemental, cosmic flames, dark fantasy style',
    styleModifiers: ['glowing eyes', 'flame hair', 'ember skin'],
    colorPalette: ['#FF4500', '#FFD700', '#8B0000', '#1a0a00'],
    motifs: ['phoenix person', 'fire spirit', 'solar deity'],
  },

  // Abyssal Depths collection
  {
    collectionId: 'abyssal_depths',
    category: 'card_back',
    basePrompt: 'Tarot card back design, deep ocean, bioluminescent creatures, abyss',
    styleModifiers: ['underwater glow', 'bubble effects', 'current flow', 'dark blue gradient'],
    colorPalette: ['#000033', '#001166', '#0066CC', '#00FFFF', '#003366'],
    motifs: ['leviathan', 'deep sea creature', 'underwater temple', 'kraken'],
  },
  {
    collectionId: 'abyssal_depths',
    category: 'card_frame',
    basePrompt: 'Ornate card frame, ocean coral, seaweed border, transparent center',
    styleModifiers: ['bioluminescent accents', 'bubble particles', 'flowing water'],
    colorPalette: ['#000033', '#00FFFF', '#0066CC'],
    motifs: ['coral frame', 'tentacle border', 'pearl accents'],
  },

  // Verdant Grove collection
  {
    collectionId: 'verdant_grove',
    category: 'card_back',
    basePrompt: 'Tarot card back design, ancient forest, world tree, nature magic',
    styleModifiers: ['leaf particles', 'vine growth', 'forest glow', 'bark texture'],
    colorPalette: ['#228B22', '#006400', '#8B4513', '#FFD700', '#2E8B57'],
    motifs: ['world tree', 'forest spirit', 'growth spiral', 'ancient oak'],
  },

  // Ethereal Winds collection
  {
    collectionId: 'ethereal_winds',
    category: 'card_back',
    basePrompt: 'Tarot card back design, ethereal winds, cloud realm, air elemental',
    styleModifiers: ['wispy clouds', 'feather particles', 'wind currents', 'sky gradient'],
    colorPalette: ['#E6E6FA', '#B0C4DE', '#87CEEB', '#FFFFFF', '#DDA0DD'],
    motifs: ['wind spirit', 'cloud palace', 'feather mandala', 'sky serpent'],
  },

  // Void Walker collection
  {
    collectionId: 'void_walker',
    category: 'card_back',
    basePrompt: 'Tarot card back design, cosmic void, reality tear, dimensional rift',
    styleModifiers: ['void particles', 'star field', 'reality distortion', 'dark energy'],
    colorPalette: ['#000000', '#1a0033', '#330066', '#9900FF', '#FF00FF'],
    motifs: ['void portal', 'cosmic tear', 'dimension gate', 'entropy spiral'],
  },

  // Golden Dawn collection
  {
    collectionId: 'golden_dawn',
    category: 'card_back',
    basePrompt: 'Tarot card back design, golden dawn, sacred geometry, divine light',
    styleModifiers: ['golden rays', 'sacred symbols', 'celestial glow', 'ornate gold'],
    colorPalette: ['#FFD700', '#FFA500', '#FFFAF0', '#DAA520', '#B8860B'],
    motifs: ['sun disk', 'eye of providence', 'sacred geometry', 'divine mandala'],
  },
];

// Export comprehensive module
export default {
  COSMETIC_TYPES,
  RARITY_CONFIG,
  BASE_PRICES,
  GENERATION_THEMES,
  ACHIEVEMENT_COSMETICS,
  LEVEL_COSMETICS,
  SUBSCRIBER_COSMETICS,
  // New v2.0 exports
  COLLECTIONS,
  PRESTIGE_INDICATORS,
  SYNERGIES,
  SHOWCASE_LAYOUTS,
  GENERATION_CATALOG,
};
