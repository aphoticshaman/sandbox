/**
 * VeilPath Premium Theme - WitchTok x Victorian Gothic
 *
 * A luxurious, mystical design system blending:
 * - TikTok's dark aesthetic with vertical scroll rhythm
 * - Victorian Gothic ornate elegance
 * - Occult mysticism with therapeutic grounding
 *
 * This theme is coherence-aware: colors and animations adapt
 * based on the user's current coherence state.
 */

import { THEME as BASE_THEME } from './theme';

// ═══════════════════════════════════════════════════════════
// PREMIUM COLOR PALETTE
// ═══════════════════════════════════════════════════════════

const PREMIUM_COLORS = {
  // Midnight Velvet - Rich blacks with purple undertones
  midnight: {
    void: '#050208',      // True void black
    abyss: '#0A0510',     // Deep abyss
    shadow: '#120A1F',    // Purple shadow
    dusk: '#1A0F2E',      // Velvet dusk
    twilight: '#241540',  // Twilight purple
  },

  // Antique Gold - Victorian elegance
  gold: {
    aged: '#8B7355',      // Aged patina
    burnished: '#B8860B', // Burnished gold
    bright: '#DAA520',    // Goldenrod
    pale: '#ECD39D',      // Pale gold
    glint: '#FFD700',     // Pure gold (accents)
  },

  // Crimson Velvet - Blood red Victorian
  crimson: {
    dark: '#4A0E0E',      // Dried blood
    blood: '#8B0000',     // Dark red
    rose: '#C41E3A',      // Cardinal red
    blush: '#DC143C',     // Crimson
    pale: '#F4C2C2',      // Pale blush
  },

  // Mystic Violet - Occult purple
  violet: {
    deep: '#1F0A3D',      // Deepest violet
    royal: '#4B0082',     // Indigo
    amethyst: '#9966CC',  // Amethyst
    lavender: '#B57EDC',  // Lavender
    mist: '#E6E6FA',      // Lavender mist
  },

  // Moonlight Silver - Ethereal whites
  silver: {
    tarnish: '#3D3D3D',   // Tarnished silver
    antique: '#C0C0C0',   // Antique silver
    bright: '#D3D3D3',    // Light silver
    pearl: '#ECECEC',     // Pearl
    moonbeam: '#FAFAFA',  // Pure moonbeam
  },

  // Coherence State Colors (enhanced for premium)
  coherence: {
    crystalline: '#00FFFF', // Cyan crystal
    fluid: '#9370DB',       // Medium purple
    turbulent: '#FF6347',   // Tomato
    collapse: '#CD5C5C',    // Indian red
  },
};

// ═══════════════════════════════════════════════════════════
// PREMIUM GRADIENTS
// ═══════════════════════════════════════════════════════════

const GRADIENTS = {
  // Card backgrounds
  cardMystic: ['#1A0F2E', '#0A0510', '#050208'],
  cardGolden: ['#241540', '#1A0F2E', '#120A1F'],

  // Overlays
  voidOverlay: ['rgba(5, 2, 8, 0.95)', 'rgba(5, 2, 8, 0.8)', 'rgba(5, 2, 8, 0.6)'],
  velvetOverlay: ['rgba(26, 15, 46, 0.9)', 'rgba(18, 10, 31, 0.85)', 'rgba(10, 5, 16, 0.8)'],

  // Accent glows
  goldGlow: ['rgba(218, 165, 32, 0.4)', 'rgba(218, 165, 32, 0.1)', 'transparent'],
  crimsonGlow: ['rgba(196, 30, 58, 0.4)', 'rgba(196, 30, 58, 0.1)', 'transparent'],
  violetGlow: ['rgba(153, 102, 204, 0.4)', 'rgba(153, 102, 204, 0.1)', 'transparent'],

  // Coherence-adaptive glow
  coherenceGlow: {
    crystalline: ['rgba(0, 255, 255, 0.5)', 'rgba(0, 255, 255, 0.1)', 'transparent'],
    fluid: ['rgba(147, 112, 219, 0.5)', 'rgba(147, 112, 219, 0.1)', 'transparent'],
    turbulent: ['rgba(255, 99, 71, 0.4)', 'rgba(255, 99, 71, 0.1)', 'transparent'],
    collapse: ['rgba(205, 92, 92, 0.3)', 'rgba(205, 92, 92, 0.1)', 'transparent'],
  },
};

// ═══════════════════════════════════════════════════════════
// PREMIUM TYPOGRAPHY
// ═══════════════════════════════════════════════════════════

const TYPOGRAPHY = {
  // Premium font families (would need to be loaded)
  fonts: {
    display: 'Cinzel',           // Victorian display
    displayAlt: 'Playfair Display', // Alternative serif
    body: 'Cormorant Garamond',  // Elegant serif body
    accent: 'Crimson Text',      // Accent serif
    mono: 'JetBrains Mono',      // Modern mono for stats
    // Fallbacks to system
    systemSerif: 'Georgia',
    systemSans: 'System',
  },

  // Refined type scale
  sizes: {
    micro: 10,     // Tiny labels
    xs: 12,        // Fine print
    sm: 14,        // Secondary text
    base: 16,      // Body
    lg: 18,        // Large body
    xl: 22,        // Subheadings
    '2xl': 28,     // Section titles
    '3xl': 36,     // Page titles
    '4xl': 48,     // Hero text
    '5xl': 64,     // Display
    '6xl': 80,     // Mega display
  },

  // Victorian letter spacing
  letterSpacing: {
    tight: -0.02,
    normal: 0,
    wide: 0.05,
    wider: 0.1,
    widest: 0.2,   // For small caps
    display: 0.15, // Display titles
  },
};

// ═══════════════════════════════════════════════════════════
// PREMIUM SHADOWS & GLOWS
// ═══════════════════════════════════════════════════════════

const SHADOWS = {
  // Deep shadows for depth
  void: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },

  // Gold glow
  goldGlow: {
    shadowColor: PREMIUM_COLORS.gold.bright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },

  // Crimson glow (for warnings, alerts)
  crimsonGlow: {
    shadowColor: PREMIUM_COLORS.crimson.rose,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },

  // Violet mystic glow
  violetGlow: {
    shadowColor: PREMIUM_COLORS.violet.amethyst,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },

  // Inner shadow effect (iOS only)
  innerVoid: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 0,
  },

  // Coherence-adaptive shadow
  coherenceShadow: (state) => {
    const color = PREMIUM_COLORS.coherence[state] || PREMIUM_COLORS.coherence.fluid;
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
    };
  },
};

// ═══════════════════════════════════════════════════════════
// PREMIUM BORDERS & ORNAMENTS
// ═══════════════════════════════════════════════════════════

const BORDERS = {
  // Victorian ornate borders
  ornateGold: {
    borderWidth: 1,
    borderColor: PREMIUM_COLORS.gold.aged,
    borderStyle: 'solid',
  },

  doubleGold: {
    borderWidth: 2,
    borderColor: PREMIUM_COLORS.gold.burnished,
    borderStyle: 'solid',
  },

  // Glowing borders
  glowGold: {
    borderWidth: 1,
    borderColor: PREMIUM_COLORS.gold.bright,
    // Pair with goldGlow shadow
  },

  glowViolet: {
    borderWidth: 1,
    borderColor: PREMIUM_COLORS.violet.amethyst,
    // Pair with violetGlow shadow
  },

  // Coherence-adaptive border
  coherenceBorder: (state) => ({
    borderWidth: 1,
    borderColor: PREMIUM_COLORS.coherence[state] || PREMIUM_COLORS.coherence.fluid,
  }),
};

// ═══════════════════════════════════════════════════════════
// PREMIUM ORNAMENTAL ELEMENTS
// ═══════════════════════════════════════════════════════════

const ORNAMENTS = {
  // Unicode ornaments for headers/dividers
  dividers: {
    simple: '─────',
    ornate: '═══════',
    mystic: '✦ ─── ✦',
    victorian: '❧ ═══ ❧',
    stars: '★ ─── ★',
    moons: '☽ ─── ☾',
    flourish: '⚜ ═══ ⚜',
  },

  // Corner ornaments
  corners: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    ornateTopLeft: '╭',
    ornateTopRight: '╮',
  },

  // Card suit symbols
  suits: {
    wands: '♣',    // Clubs represent wands
    cups: '♥',     // Hearts represent cups
    swords: '♠',   // Spades represent swords
    pentacles: '♦', // Diamonds represent pentacles
  },

  // Astrological symbols
  astro: {
    sun: '☀',
    moon: '☽',
    star: '★',
    mercury: '☿',
    venus: '♀',
    mars: '♂',
    jupiter: '♃',
    saturn: '♄',
  },
};

// ═══════════════════════════════════════════════════════════
// PREMIUM ANIMATION TIMING
// ═══════════════════════════════════════════════════════════

const ANIMATION = {
  // φ-scaled durations (golden ratio)
  duration: {
    instant: 0,
    quick: 100,
    fast: 162,          // φ × 100
    base: 262,          // φ × 162
    slow: 424,          // φ × 262
    slower: 686,        // φ × 424
    slowest: 1109,      // φ × 686
    meditative: 1795,   // φ × 1109
    breathing: 2618,    // φ × 1618 (full breath cycle)
  },

  // Victorian-style easing (dramatic entrances)
  easing: {
    // Smooth reveals
    revealIn: 'cubic-bezier(0.16, 1, 0.3, 1)',     // Expo out
    revealOut: 'cubic-bezier(0.7, 0, 0.84, 0)',    // Expo in
    reveal: 'cubic-bezier(0.87, 0, 0.13, 1)',      // Expo in-out

    // Mystical float
    float: 'cubic-bezier(0.4, 0, 0.2, 1)',         // Material standard
    floatUp: 'cubic-bezier(0, 0.55, 0.45, 1)',     // Out cubic

    // Dramatic impact
    impact: 'cubic-bezier(0.22, 1, 0.36, 1)',      // Out quint
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Back in-out
  },

  // Spring configs for React Native Animated
  spring: {
    gentle: { tension: 40, friction: 7 },
    mystic: { tension: 30, friction: 6 },
    dramatic: { tension: 60, friction: 8 },
    bounce: { tension: 80, friction: 5 },
  },
};

// ═══════════════════════════════════════════════════════════
// PREMIUM CARD STYLES
// ═══════════════════════════════════════════════════════════

const CARD_STYLES = {
  // Standard card
  base: {
    backgroundColor: PREMIUM_COLORS.midnight.dusk,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.void,
    ...BORDERS.ornateGold,
  },

  // Elevated card (modals, important content)
  elevated: {
    backgroundColor: PREMIUM_COLORS.midnight.twilight,
    borderRadius: 20,
    padding: 24,
    ...SHADOWS.violetGlow,
    ...BORDERS.glowViolet,
  },

  // Gold accent card (achievements, rewards)
  golden: {
    backgroundColor: PREMIUM_COLORS.midnight.dusk,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.goldGlow,
    ...BORDERS.doubleGold,
  },

  // Tarot card frame
  tarot: {
    backgroundColor: PREMIUM_COLORS.midnight.void,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: PREMIUM_COLORS.gold.burnished,
    ...SHADOWS.void,
  },

  // Coherence-adaptive card
  coherenceCard: (state) => ({
    backgroundColor: PREMIUM_COLORS.midnight.dusk,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.coherenceShadow(state),
    ...BORDERS.coherenceBorder(state),
  }),
};

// ═══════════════════════════════════════════════════════════
// COHERENCE-ADAPTIVE THEMING
// ═══════════════════════════════════════════════════════════

/**
 * Get theme adjustments based on coherence state
 * @param {string} state - Current coherence state
 * @returns {Object} Theme overrides for the state
 */
const getCoherenceTheme = (state) => {
  const themes = {
    crystalline: {
      accentColor: PREMIUM_COLORS.coherence.crystalline,
      glowIntensity: 1.0,
      animationSpeed: 1.0,
      complexity: 'high',
      ornamentLevel: 'full',
    },
    fluid: {
      accentColor: PREMIUM_COLORS.coherence.fluid,
      glowIntensity: 0.8,
      animationSpeed: 1.0,
      complexity: 'medium',
      ornamentLevel: 'standard',
    },
    turbulent: {
      accentColor: PREMIUM_COLORS.coherence.turbulent,
      glowIntensity: 0.6,
      animationSpeed: 0.8,
      complexity: 'reduced',
      ornamentLevel: 'minimal',
    },
    collapse: {
      accentColor: PREMIUM_COLORS.coherence.collapse,
      glowIntensity: 0.4,
      animationSpeed: 0.6,
      complexity: 'minimal',
      ornamentLevel: 'none',
    },
  };

  return themes[state] || themes.fluid;
};

// ═══════════════════════════════════════════════════════════
// COMBINED PREMIUM THEME
// ═══════════════════════════════════════════════════════════

export const PREMIUM_THEME = {
  // Inherit base theme
  ...BASE_THEME,

  // Override with premium colors
  colors: {
    ...BASE_THEME.colors,
    premium: PREMIUM_COLORS,
    gradients: GRADIENTS,
    coherence: PREMIUM_COLORS.coherence,
  },

  // Override typography
  typography: {
    ...BASE_THEME.typography,
    fonts: TYPOGRAPHY.fonts,
    sizes: TYPOGRAPHY.sizes,
    letterSpacing: TYPOGRAPHY.letterSpacing,
  },

  // Override shadows
  shadows: {
    ...BASE_THEME.shadows,
    premium: SHADOWS,
  },

  // Add premium-specific
  borders: BORDERS,
  ornaments: ORNAMENTS,
  animation: ANIMATION,
  cardStyles: CARD_STYLES,

  // Coherence integration
  getCoherenceTheme,

  // Theme metadata
  meta: {
    name: 'WitchTok Victorian Gothic',
    version: '1.0.0',
    variant: 'premium',
    coherenceAware: true,
  },
};

// ═══════════════════════════════════════════════════════════
// THEME CONTEXT HELPER
// ═══════════════════════════════════════════════════════════

/**
 * Create a coherence-aware style object
 * @param {string} coherenceState - Current coherence state
 * @param {Object} baseStyles - Base style object
 * @returns {Object} Merged styles with coherence adaptations
 */
export const createCoherenceStyle = (coherenceState, baseStyles = {}) => {
  const coherenceTheme = getCoherenceTheme(coherenceState);

  return {
    ...baseStyles,
    // Add coherence-specific accent colors
    borderColor: coherenceTheme.accentColor,
    // Reduce visual complexity in low coherence states
    ...(coherenceTheme.complexity === 'minimal' && {
      borderWidth: 1,
      shadowOpacity: 0.2,
    }),
    ...(coherenceTheme.complexity === 'reduced' && {
      borderWidth: 1,
      shadowOpacity: 0.4,
    }),
  };
};

export default PREMIUM_THEME;
