/**
 * VeilPath Theme System
 *
 * Multiple theme variants beyond just light/dark:
 * - Base themes (Cosmic, Forest, Ocean, Ember, Twilight, etc.)
 * - Each theme has light/dark mode variants
 * - Gradients built-in for web and native
 * - Personal themes (only the user sees them)
 *
 * MONETIZATION:
 * - Cheap and abundant (not heavily monetized)
 * - Monthly rewards for subscribers
 * - Most themes 50-200 shards
 */

// ═══════════════════════════════════════════════════════════════════════════════
// THEME DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const THEMES = {
  // ─────────────────────────────────────────────────────────────────────────────
  // COSMIC (Default) - Victorian Gothic, Deep Purple
  // ─────────────────────────────────────────────────────────────────────────────
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Void',
    description: 'The classic VeilPath aesthetic - deep space mystery',
    icon: '🌌',
    rarity: 'common',
    price: 0,
    unlockMethod: 'default',
    isDefault: true,

    dark: {
      // Core backgrounds
      background: '#0a0514',
      backgroundSecondary: '#120820',
      backgroundTertiary: '#1a0d2e',
      surface: 'rgba(74, 20, 140, 0.25)',
      surfaceElevated: 'rgba(74, 20, 140, 0.4)',

      // Primary palette
      primary: '#4a148c',
      primaryLight: '#7c43bd',
      primaryDark: '#311b92',

      // Accent colors
      accent: '#ffa726',
      accentSecondary: '#b8860b',
      accentMuted: 'rgba(255, 167, 38, 0.6)',

      // Text colors
      text: '#e1bee7',
      textSecondary: '#f8bbd0',
      textMuted: 'rgba(225, 190, 231, 0.6)',
      textInverse: '#0a0514',

      // Semantic colors
      success: '#87a96b',
      error: '#8b0000',
      warning: '#ffa726',
      info: '#00FFFF',

      // Effects
      glow: '#00FFFF',
      glowSecondary: '#ffa726',
      border: '#b8860b',
      borderMuted: 'rgba(184, 134, 11, 0.3)',

      // Gradients
      gradientPrimary: ['#4a148c', '#0a0514', '#311b92'],
      gradientAccent: ['#ffa726', '#b8860b'],
      gradientBackground: 'linear-gradient(135deg, #4a148c 0%, #0a0514 50%, #311b92 100%)',
    },

    light: {
      background: '#f5f0fa',
      backgroundSecondary: '#ebe0f5',
      backgroundTertiary: '#e1d5ef',
      surface: 'rgba(74, 20, 140, 0.08)',
      surfaceElevated: 'rgba(74, 20, 140, 0.15)',

      primary: '#6a1b9a',
      primaryLight: '#9c4dcc',
      primaryDark: '#4a148c',

      accent: '#e65100',
      accentSecondary: '#8d6e63',
      accentMuted: 'rgba(230, 81, 0, 0.6)',

      text: '#1a0033',
      textSecondary: '#4a148c',
      textMuted: 'rgba(26, 0, 51, 0.6)',
      textInverse: '#f5f0fa',

      success: '#2e7d32',
      error: '#c62828',
      warning: '#e65100',
      info: '#0277bd',

      glow: '#9c4dcc',
      glowSecondary: '#e65100',
      border: '#8d6e63',
      borderMuted: 'rgba(141, 110, 99, 0.3)',

      gradientPrimary: ['#9c4dcc', '#f5f0fa', '#6a1b9a'],
      gradientAccent: ['#e65100', '#8d6e63'],
      gradientBackground: 'linear-gradient(135deg, #e1d5ef 0%, #f5f0fa 50%, #ebe0f5 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FOREST - Emerald greens, earthy tones
  // ─────────────────────────────────────────────────────────────────────────────
  forest: {
    id: 'forest',
    name: 'Enchanted Forest',
    description: 'Deep woods mysticism with emerald energy',
    icon: '🌲',
    rarity: 'common',
    price: 0, // Free default
    unlockMethod: 'default',
    isDefault: true,

    dark: {
      background: '#0a1208',
      backgroundSecondary: '#0f1a0d',
      backgroundTertiary: '#152213',
      surface: 'rgba(27, 94, 32, 0.25)',
      surfaceElevated: 'rgba(27, 94, 32, 0.4)',

      primary: '#1b5e20',
      primaryLight: '#4c8c4a',
      primaryDark: '#003300',

      accent: '#8bc34a',
      accentSecondary: '#689f38',
      accentMuted: 'rgba(139, 195, 74, 0.6)',

      text: '#c8e6c9',
      textSecondary: '#a5d6a7',
      textMuted: 'rgba(200, 230, 201, 0.6)',
      textInverse: '#0a1208',

      success: '#43a047',
      error: '#6d4c41',
      warning: '#ffc107',
      info: '#4fc3f7',

      glow: '#8bc34a',
      glowSecondary: '#4fc3f7',
      border: '#689f38',
      borderMuted: 'rgba(104, 159, 56, 0.3)',

      gradientPrimary: ['#1b5e20', '#0a1208', '#003300'],
      gradientAccent: ['#8bc34a', '#689f38'],
      gradientBackground: 'linear-gradient(135deg, #1b5e20 0%, #0a1208 50%, #003300 100%)',
    },

    light: {
      background: '#f1f8e9',
      backgroundSecondary: '#e8f5e9',
      backgroundTertiary: '#dcedc8',
      surface: 'rgba(27, 94, 32, 0.08)',
      surfaceElevated: 'rgba(27, 94, 32, 0.15)',

      primary: '#2e7d32',
      primaryLight: '#60ad5e',
      primaryDark: '#005005',

      accent: '#558b2f',
      accentSecondary: '#33691e',
      accentMuted: 'rgba(85, 139, 47, 0.6)',

      text: '#1b5e20',
      textSecondary: '#2e7d32',
      textMuted: 'rgba(27, 94, 32, 0.6)',
      textInverse: '#f1f8e9',

      success: '#2e7d32',
      error: '#bf360c',
      warning: '#f57f17',
      info: '#0288d1',

      glow: '#689f38',
      glowSecondary: '#558b2f',
      border: '#689f38',
      borderMuted: 'rgba(104, 159, 56, 0.3)',

      gradientPrimary: ['#81c784', '#f1f8e9', '#a5d6a7'],
      gradientAccent: ['#558b2f', '#33691e'],
      gradientBackground: 'linear-gradient(135deg, #dcedc8 0%, #f1f8e9 50%, #e8f5e9 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // OCEAN - Deep blues, aqua highlights
  // ─────────────────────────────────────────────────────────────────────────────
  ocean: {
    id: 'ocean',
    name: 'Abyssal Ocean',
    description: 'The deep sea holds ancient secrets',
    icon: '🌊',
    rarity: 'common',
    price: 50, // Very cheap
    unlockMethod: 'purchase',

    dark: {
      background: '#051118',
      backgroundSecondary: '#0a1929',
      backgroundTertiary: '#0d2137',
      surface: 'rgba(13, 71, 161, 0.25)',
      surfaceElevated: 'rgba(13, 71, 161, 0.4)',

      primary: '#0d47a1',
      primaryLight: '#5472d3',
      primaryDark: '#002171',

      accent: '#00bcd4',
      accentSecondary: '#0097a7',
      accentMuted: 'rgba(0, 188, 212, 0.6)',

      text: '#b3e5fc',
      textSecondary: '#81d4fa',
      textMuted: 'rgba(179, 229, 252, 0.6)',
      textInverse: '#051118',

      success: '#26a69a',
      error: '#ef5350',
      warning: '#ffca28',
      info: '#00bcd4',

      glow: '#00bcd4',
      glowSecondary: '#26c6da',
      border: '#0097a7',
      borderMuted: 'rgba(0, 151, 167, 0.3)',

      gradientPrimary: ['#0d47a1', '#051118', '#002171'],
      gradientAccent: ['#00bcd4', '#0097a7'],
      gradientBackground: 'linear-gradient(135deg, #0d47a1 0%, #051118 50%, #002171 100%)',
    },

    light: {
      background: '#e1f5fe',
      backgroundSecondary: '#e0f7fa',
      backgroundTertiary: '#b2ebf2',
      surface: 'rgba(13, 71, 161, 0.08)',
      surfaceElevated: 'rgba(13, 71, 161, 0.15)',

      primary: '#1565c0',
      primaryLight: '#5e92f3',
      primaryDark: '#003c8f',

      accent: '#00838f',
      accentSecondary: '#006064',
      accentMuted: 'rgba(0, 131, 143, 0.6)',

      text: '#01579b',
      textSecondary: '#0277bd',
      textMuted: 'rgba(1, 87, 155, 0.6)',
      textInverse: '#e1f5fe',

      success: '#00897b',
      error: '#d32f2f',
      warning: '#ffa000',
      info: '#0288d1',

      glow: '#0097a7',
      glowSecondary: '#00838f',
      border: '#0097a7',
      borderMuted: 'rgba(0, 151, 167, 0.3)',

      gradientPrimary: ['#64b5f6', '#e1f5fe', '#81d4fa'],
      gradientAccent: ['#00838f', '#006064'],
      gradientBackground: 'linear-gradient(135deg, #b2ebf2 0%, #e1f5fe 50%, #e0f7fa 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EMBER - Warm oranges, fire energy
  // ─────────────────────────────────────────────────────────────────────────────
  ember: {
    id: 'ember',
    name: 'Sacred Ember',
    description: 'The transformative power of fire',
    icon: '🔥',
    rarity: 'common',
    price: 50,
    unlockMethod: 'purchase',

    dark: {
      background: '#1a0a00',
      backgroundSecondary: '#2d1400',
      backgroundTertiary: '#3e1c00',
      surface: 'rgba(191, 54, 12, 0.25)',
      surfaceElevated: 'rgba(191, 54, 12, 0.4)',

      primary: '#bf360c',
      primaryLight: '#f9683a',
      primaryDark: '#870000',

      accent: '#ff9800',
      accentSecondary: '#f57c00',
      accentMuted: 'rgba(255, 152, 0, 0.6)',

      text: '#ffccbc',
      textSecondary: '#ffab91',
      textMuted: 'rgba(255, 204, 188, 0.6)',
      textInverse: '#1a0a00',

      success: '#8bc34a',
      error: '#ff5252',
      warning: '#ffc107',
      info: '#29b6f6',

      glow: '#ff9800',
      glowSecondary: '#ff5722',
      border: '#f57c00',
      borderMuted: 'rgba(245, 124, 0, 0.3)',

      gradientPrimary: ['#bf360c', '#1a0a00', '#870000'],
      gradientAccent: ['#ff9800', '#f57c00'],
      gradientBackground: 'linear-gradient(135deg, #bf360c 0%, #1a0a00 50%, #870000 100%)',
    },

    light: {
      background: '#fff8e1',
      backgroundSecondary: '#ffecb3',
      backgroundTertiary: '#ffe082',
      surface: 'rgba(191, 54, 12, 0.08)',
      surfaceElevated: 'rgba(191, 54, 12, 0.15)',

      primary: '#e65100',
      primaryLight: '#ff833a',
      primaryDark: '#ac1900',

      accent: '#ef6c00',
      accentSecondary: '#d84315',
      accentMuted: 'rgba(239, 108, 0, 0.6)',

      text: '#bf360c',
      textSecondary: '#d84315',
      textMuted: 'rgba(191, 54, 12, 0.6)',
      textInverse: '#fff8e1',

      success: '#558b2f',
      error: '#c62828',
      warning: '#f9a825',
      info: '#0288d1',

      glow: '#ff9800',
      glowSecondary: '#ff5722',
      border: '#f57c00',
      borderMuted: 'rgba(245, 124, 0, 0.3)',

      gradientPrimary: ['#ffcc80', '#fff8e1', '#ffe0b2'],
      gradientAccent: ['#ef6c00', '#d84315'],
      gradientBackground: 'linear-gradient(135deg, #ffe082 0%, #fff8e1 50%, #ffecb3 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TWILIGHT - Purple/pink dusk aesthetic
  // ─────────────────────────────────────────────────────────────────────────────
  twilight: {
    id: 'twilight',
    name: 'Twilight Veil',
    description: 'The magical hour between worlds',
    icon: '🌆',
    rarity: 'rare',
    price: 100,
    unlockMethod: 'purchase',

    dark: {
      background: '#1a0a1f',
      backgroundSecondary: '#2d1438',
      backgroundTertiary: '#3d1f4a',
      surface: 'rgba(136, 14, 79, 0.25)',
      surfaceElevated: 'rgba(136, 14, 79, 0.4)',

      primary: '#880e4f',
      primaryLight: '#bc477b',
      primaryDark: '#560027',

      accent: '#ff4081',
      accentSecondary: '#f50057',
      accentMuted: 'rgba(255, 64, 129, 0.6)',

      text: '#f8bbd9',
      textSecondary: '#f48fb1',
      textMuted: 'rgba(248, 187, 217, 0.6)',
      textInverse: '#1a0a1f',

      success: '#66bb6a',
      error: '#ef5350',
      warning: '#ffca28',
      info: '#ce93d8',

      glow: '#ff4081',
      glowSecondary: '#ce93d8',
      border: '#ad1457',
      borderMuted: 'rgba(173, 20, 87, 0.3)',

      gradientPrimary: ['#880e4f', '#1a0a1f', '#560027'],
      gradientAccent: ['#ff4081', '#f50057'],
      gradientBackground: 'linear-gradient(135deg, #880e4f 0%, #1a0a1f 50%, #560027 100%)',
    },

    light: {
      background: '#fce4ec',
      backgroundSecondary: '#f8bbd9',
      backgroundTertiary: '#f48fb1',
      surface: 'rgba(136, 14, 79, 0.08)',
      surfaceElevated: 'rgba(136, 14, 79, 0.15)',

      primary: '#ad1457',
      primaryLight: '#e35183',
      primaryDark: '#78002e',

      accent: '#c2185b',
      accentSecondary: '#880e4f',
      accentMuted: 'rgba(194, 24, 91, 0.6)',

      text: '#880e4f',
      textSecondary: '#ad1457',
      textMuted: 'rgba(136, 14, 79, 0.6)',
      textInverse: '#fce4ec',

      success: '#43a047',
      error: '#c62828',
      warning: '#f9a825',
      info: '#8e24aa',

      glow: '#ec407a',
      glowSecondary: '#f06292',
      border: '#ad1457',
      borderMuted: 'rgba(173, 20, 87, 0.3)',

      gradientPrimary: ['#f48fb1', '#fce4ec', '#f8bbd9'],
      gradientAccent: ['#c2185b', '#880e4f'],
      gradientBackground: 'linear-gradient(135deg, #f48fb1 0%, #fce4ec 50%, #f8bbd9 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MIDNIGHT - Pure dark, silver accents
  // ─────────────────────────────────────────────────────────────────────────────
  midnight: {
    id: 'midnight',
    name: 'Midnight Silver',
    description: 'Elegant darkness with moonlit highlights',
    icon: '🌙',
    rarity: 'rare',
    price: 100,
    unlockMethod: 'purchase',

    dark: {
      background: '#0d0d0d',
      backgroundSecondary: '#1a1a1a',
      backgroundTertiary: '#262626',
      surface: 'rgba(66, 66, 66, 0.4)',
      surfaceElevated: 'rgba(97, 97, 97, 0.5)',

      primary: '#424242',
      primaryLight: '#6d6d6d',
      primaryDark: '#1b1b1b',

      accent: '#e0e0e0',
      accentSecondary: '#bdbdbd',
      accentMuted: 'rgba(224, 224, 224, 0.6)',

      text: '#fafafa',
      textSecondary: '#e0e0e0',
      textMuted: 'rgba(250, 250, 250, 0.6)',
      textInverse: '#0d0d0d',

      success: '#66bb6a',
      error: '#ef5350',
      warning: '#ffca28',
      info: '#90caf9',

      glow: '#e0e0e0',
      glowSecondary: '#9e9e9e',
      border: '#616161',
      borderMuted: 'rgba(97, 97, 97, 0.3)',

      gradientPrimary: ['#424242', '#0d0d0d', '#1b1b1b'],
      gradientAccent: ['#e0e0e0', '#bdbdbd'],
      gradientBackground: 'linear-gradient(135deg, #262626 0%, #0d0d0d 50%, #1a1a1a 100%)',
    },

    light: {
      background: '#fafafa',
      backgroundSecondary: '#f5f5f5',
      backgroundTertiary: '#eeeeee',
      surface: 'rgba(66, 66, 66, 0.08)',
      surfaceElevated: 'rgba(66, 66, 66, 0.15)',

      primary: '#616161',
      primaryLight: '#8e8e8e',
      primaryDark: '#373737',

      accent: '#424242',
      accentSecondary: '#212121',
      accentMuted: 'rgba(66, 66, 66, 0.6)',

      text: '#212121',
      textSecondary: '#424242',
      textMuted: 'rgba(33, 33, 33, 0.6)',
      textInverse: '#fafafa',

      success: '#43a047',
      error: '#c62828',
      warning: '#f9a825',
      info: '#1976d2',

      glow: '#9e9e9e',
      glowSecondary: '#757575',
      border: '#9e9e9e',
      borderMuted: 'rgba(158, 158, 158, 0.3)',

      gradientPrimary: ['#e0e0e0', '#fafafa', '#eeeeee'],
      gradientAccent: ['#616161', '#424242'],
      gradientBackground: 'linear-gradient(135deg, #eeeeee 0%, #fafafa 50%, #f5f5f5 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AURORA - Northern lights, iridescent
  // ─────────────────────────────────────────────────────────────────────────────
  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Dancing lights of the north',
    icon: '🌌',
    rarity: 'rare',
    price: 150,
    unlockMethod: 'purchase',

    dark: {
      background: '#050814',
      backgroundSecondary: '#0a1020',
      backgroundTertiary: '#10182d',
      surface: 'rgba(26, 117, 159, 0.25)',
      surfaceElevated: 'rgba(26, 117, 159, 0.4)',

      primary: '#1a759f',
      primaryLight: '#4dc9b0',
      primaryDark: '#0d3d53',

      accent: '#64ffda',
      accentSecondary: '#18ffff',
      accentMuted: 'rgba(100, 255, 218, 0.6)',

      text: '#b2dfdb',
      textSecondary: '#80cbc4',
      textMuted: 'rgba(178, 223, 219, 0.6)',
      textInverse: '#050814',

      success: '#69f0ae',
      error: '#ff5252',
      warning: '#ffd740',
      info: '#40c4ff',

      glow: '#64ffda',
      glowSecondary: '#18ffff',
      border: '#26a69a',
      borderMuted: 'rgba(38, 166, 154, 0.3)',

      gradientPrimary: ['#1a759f', '#050814', '#0d3d53'],
      gradientAccent: ['#64ffda', '#18ffff', '#69f0ae'],
      gradientBackground: 'linear-gradient(135deg, #1a759f 0%, #050814 40%, #4dc9b0 80%, #69f0ae 100%)',
    },

    light: {
      background: '#e0f2f1',
      backgroundSecondary: '#b2dfdb',
      backgroundTertiary: '#80cbc4',
      surface: 'rgba(26, 117, 159, 0.08)',
      surfaceElevated: 'rgba(26, 117, 159, 0.15)',

      primary: '#00796b',
      primaryLight: '#48a999',
      primaryDark: '#004c40',

      accent: '#00897b',
      accentSecondary: '#00695c',
      accentMuted: 'rgba(0, 137, 123, 0.6)',

      text: '#004d40',
      textSecondary: '#00695c',
      textMuted: 'rgba(0, 77, 64, 0.6)',
      textInverse: '#e0f2f1',

      success: '#00c853',
      error: '#d50000',
      warning: '#ffab00',
      info: '#00b8d4',

      glow: '#1de9b6',
      glowSecondary: '#00bfa5',
      border: '#26a69a',
      borderMuted: 'rgba(38, 166, 154, 0.3)',

      gradientPrimary: ['#80cbc4', '#e0f2f1', '#b2dfdb'],
      gradientAccent: ['#1de9b6', '#00bfa5'],
      gradientBackground: 'linear-gradient(135deg, #80cbc4 0%, #e0f2f1 50%, #b2dfdb 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ROSE - Romantic pinks and reds
  // ─────────────────────────────────────────────────────────────────────────────
  rose: {
    id: 'rose',
    name: 'Rose Garden',
    description: 'Romantic elegance in bloom',
    icon: '🌹',
    rarity: 'rare',
    price: 100,
    unlockMethod: 'purchase',

    dark: {
      background: '#1a0810',
      backgroundSecondary: '#2d101a',
      backgroundTertiary: '#401824',
      surface: 'rgba(183, 28, 28, 0.2)',
      surfaceElevated: 'rgba(183, 28, 28, 0.35)',

      primary: '#b71c1c',
      primaryLight: '#f05545',
      primaryDark: '#7f0000',

      accent: '#ff8a80',
      accentSecondary: '#ff5252',
      accentMuted: 'rgba(255, 138, 128, 0.6)',

      text: '#ffcdd2',
      textSecondary: '#ef9a9a',
      textMuted: 'rgba(255, 205, 210, 0.6)',
      textInverse: '#1a0810',

      success: '#81c784',
      error: '#ff5252',
      warning: '#ffca28',
      info: '#f48fb1',

      glow: '#ff8a80',
      glowSecondary: '#f48fb1',
      border: '#c62828',
      borderMuted: 'rgba(198, 40, 40, 0.3)',

      gradientPrimary: ['#b71c1c', '#1a0810', '#7f0000'],
      gradientAccent: ['#ff8a80', '#ff5252'],
      gradientBackground: 'linear-gradient(135deg, #b71c1c 0%, #1a0810 50%, #7f0000 100%)',
    },

    light: {
      background: '#fce4ec',
      backgroundSecondary: '#f8bbd9',
      backgroundTertiary: '#f48fb1',
      surface: 'rgba(183, 28, 28, 0.08)',
      surfaceElevated: 'rgba(183, 28, 28, 0.15)',

      primary: '#c62828',
      primaryLight: '#ff5f52',
      primaryDark: '#8e0000',

      accent: '#d32f2f',
      accentSecondary: '#b71c1c',
      accentMuted: 'rgba(211, 47, 47, 0.6)',

      text: '#b71c1c',
      textSecondary: '#c62828',
      textMuted: 'rgba(183, 28, 28, 0.6)',
      textInverse: '#fce4ec',

      success: '#43a047',
      error: '#c62828',
      warning: '#f9a825',
      info: '#ad1457',

      glow: '#ef5350',
      glowSecondary: '#e57373',
      border: '#c62828',
      borderMuted: 'rgba(198, 40, 40, 0.3)',

      gradientPrimary: ['#f48fb1', '#fce4ec', '#f8bbd9'],
      gradientAccent: ['#ef5350', '#e57373'],
      gradientBackground: 'linear-gradient(135deg, #f48fb1 0%, #fce4ec 50%, #f8bbd9 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AMETHYST - Royal purple, crystal energy
  // ─────────────────────────────────────────────────────────────────────────────
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst Crystal',
    description: 'Royal purple crystalline energy',
    icon: '💜',
    rarity: 'epic',
    price: 200,
    unlockMethod: 'purchase',

    dark: {
      background: '#12071c',
      backgroundSecondary: '#1a0d2e',
      backgroundTertiary: '#23133d',
      surface: 'rgba(103, 58, 183, 0.25)',
      surfaceElevated: 'rgba(103, 58, 183, 0.4)',

      primary: '#673ab7',
      primaryLight: '#9a67ea',
      primaryDark: '#320b86',

      accent: '#b388ff',
      accentSecondary: '#7c4dff',
      accentMuted: 'rgba(179, 136, 255, 0.6)',

      text: '#e1d5f5',
      textSecondary: '#d1c4e9',
      textMuted: 'rgba(225, 213, 245, 0.6)',
      textInverse: '#12071c',

      success: '#69f0ae',
      error: '#ff5252',
      warning: '#ffd740',
      info: '#b388ff',

      glow: '#b388ff',
      glowSecondary: '#ea80fc',
      border: '#7e57c2',
      borderMuted: 'rgba(126, 87, 194, 0.3)',

      gradientPrimary: ['#673ab7', '#12071c', '#320b86'],
      gradientAccent: ['#b388ff', '#7c4dff'],
      gradientBackground: 'linear-gradient(135deg, #673ab7 0%, #12071c 50%, #320b86 100%)',
    },

    light: {
      background: '#ede7f6',
      backgroundSecondary: '#d1c4e9',
      backgroundTertiary: '#b39ddb',
      surface: 'rgba(103, 58, 183, 0.08)',
      surfaceElevated: 'rgba(103, 58, 183, 0.15)',

      primary: '#512da8',
      primaryLight: '#8559da',
      primaryDark: '#140078',

      accent: '#651fff',
      accentSecondary: '#6200ea',
      accentMuted: 'rgba(101, 31, 255, 0.6)',

      text: '#311b92',
      textSecondary: '#512da8',
      textMuted: 'rgba(49, 27, 146, 0.6)',
      textInverse: '#ede7f6',

      success: '#00c853',
      error: '#d50000',
      warning: '#ffab00',
      info: '#651fff',

      glow: '#7c4dff',
      glowSecondary: '#651fff',
      border: '#7e57c2',
      borderMuted: 'rgba(126, 87, 194, 0.3)',

      gradientPrimary: ['#b39ddb', '#ede7f6', '#d1c4e9'],
      gradientAccent: ['#7c4dff', '#651fff'],
      gradientBackground: 'linear-gradient(135deg, #b39ddb 0%, #ede7f6 50%, #d1c4e9 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // GOLD - Luxury gold and warm tones
  // ─────────────────────────────────────────────────────────────────────────────
  gold: {
    id: 'gold',
    name: 'Golden Sanctuary',
    description: 'Luxurious warmth and prosperity',
    icon: '✨',
    rarity: 'epic',
    price: 200,
    unlockMethod: 'purchase',

    dark: {
      background: '#1a1400',
      backgroundSecondary: '#2d2200',
      backgroundTertiary: '#403000',
      surface: 'rgba(255, 193, 7, 0.15)',
      surfaceElevated: 'rgba(255, 193, 7, 0.25)',

      primary: '#ffc107',
      primaryLight: '#fff350',
      primaryDark: '#c79100',

      accent: '#ffab00',
      accentSecondary: '#ff8f00',
      accentMuted: 'rgba(255, 171, 0, 0.6)',

      text: '#fff8e1',
      textSecondary: '#ffecb3',
      textMuted: 'rgba(255, 248, 225, 0.6)',
      textInverse: '#1a1400',

      success: '#8bc34a',
      error: '#ff5252',
      warning: '#ffc107',
      info: '#29b6f6',

      glow: '#ffc107',
      glowSecondary: '#ffab00',
      border: '#c79100',
      borderMuted: 'rgba(199, 145, 0, 0.3)',

      gradientPrimary: ['#ffc107', '#1a1400', '#c79100'],
      gradientAccent: ['#ffc107', '#ffab00'],
      gradientBackground: 'linear-gradient(135deg, #403000 0%, #1a1400 50%, #2d2200 100%)',
    },

    light: {
      background: '#fffde7',
      backgroundSecondary: '#fff9c4',
      backgroundTertiary: '#fff59d',
      surface: 'rgba(255, 160, 0, 0.08)',
      surfaceElevated: 'rgba(255, 160, 0, 0.15)',

      primary: '#ffa000',
      primaryLight: '#ffd149',
      primaryDark: '#c67100',

      accent: '#ff8f00',
      accentSecondary: '#ff6f00',
      accentMuted: 'rgba(255, 143, 0, 0.6)',

      text: '#e65100',
      textSecondary: '#f57c00',
      textMuted: 'rgba(230, 81, 0, 0.6)',
      textInverse: '#fffde7',

      success: '#558b2f',
      error: '#c62828',
      warning: '#ff8f00',
      info: '#0288d1',

      glow: '#ffb300',
      glowSecondary: '#ffa000',
      border: '#ffa000',
      borderMuted: 'rgba(255, 160, 0, 0.3)',

      gradientPrimary: ['#fff59d', '#fffde7', '#fff9c4'],
      gradientAccent: ['#ffc107', '#ffab00'],
      gradientBackground: 'linear-gradient(135deg, #fff59d 0%, #fffde7 50%, #fff9c4 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SHADOW - Deep blacks with purple hints
  // ─────────────────────────────────────────────────────────────────────────────
  shadow: {
    id: 'shadow',
    name: 'Shadow Realm',
    description: 'Embrace the darkness within',
    icon: '🖤',
    rarity: 'epic',
    price: 0, // Level unlock
    unlockMethod: 'level',
    unlockRequirement: { level: 15 },

    dark: {
      background: '#050505',
      backgroundSecondary: '#0a0a0a',
      backgroundTertiary: '#121212',
      surface: 'rgba(30, 30, 30, 0.6)',
      surfaceElevated: 'rgba(40, 40, 40, 0.7)',

      primary: '#1a1a2e',
      primaryLight: '#2d2d44',
      primaryDark: '#0d0d17',

      accent: '#9d4edd',
      accentSecondary: '#7b2cbf',
      accentMuted: 'rgba(157, 78, 221, 0.6)',

      text: '#c9c9c9',
      textSecondary: '#9a9a9a',
      textMuted: 'rgba(201, 201, 201, 0.6)',
      textInverse: '#050505',

      success: '#4ade80',
      error: '#f87171',
      warning: '#fbbf24',
      info: '#9d4edd',

      glow: '#9d4edd',
      glowSecondary: '#7b2cbf',
      border: '#333333',
      borderMuted: 'rgba(51, 51, 51, 0.5)',

      gradientPrimary: ['#1a1a2e', '#050505', '#0d0d17'],
      gradientAccent: ['#9d4edd', '#7b2cbf'],
      gradientBackground: 'linear-gradient(135deg, #121212 0%, #050505 50%, #0a0a0a 100%)',
    },

    light: {
      background: '#f5f5f5',
      backgroundSecondary: '#e8e8e8',
      backgroundTertiary: '#d5d5d5',
      surface: 'rgba(30, 30, 30, 0.08)',
      surfaceElevated: 'rgba(30, 30, 30, 0.15)',

      primary: '#2d2d44',
      primaryLight: '#4a4a66',
      primaryDark: '#1a1a2e',

      accent: '#7b2cbf',
      accentSecondary: '#5a189a',
      accentMuted: 'rgba(123, 44, 191, 0.6)',

      text: '#1a1a1a',
      textSecondary: '#333333',
      textMuted: 'rgba(26, 26, 26, 0.6)',
      textInverse: '#f5f5f5',

      success: '#22c55e',
      error: '#dc2626',
      warning: '#f59e0b',
      info: '#7b2cbf',

      glow: '#9d4edd',
      glowSecondary: '#7b2cbf',
      border: '#9e9e9e',
      borderMuted: 'rgba(158, 158, 158, 0.3)',

      gradientPrimary: ['#d5d5d5', '#f5f5f5', '#e8e8e8'],
      gradientAccent: ['#9d4edd', '#7b2cbf'],
      gradientBackground: 'linear-gradient(135deg, #d5d5d5 0%, #f5f5f5 50%, #e8e8e8 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CELESTIAL - Stars and constellations
  // ─────────────────────────────────────────────────────────────────────────────
  celestial: {
    id: 'celestial',
    name: 'Celestial Map',
    description: 'Navigate by the stars',
    icon: '⭐',
    rarity: 'legendary',
    price: 0, // Achievement unlock
    unlockMethod: 'achievement',
    unlockRequirement: { achievement: 'readings_100' },

    dark: {
      background: '#0a0a1a',
      backgroundSecondary: '#101025',
      backgroundTertiary: '#181833',
      surface: 'rgba(63, 81, 181, 0.2)',
      surfaceElevated: 'rgba(63, 81, 181, 0.35)',

      primary: '#3f51b5',
      primaryLight: '#7986cb',
      primaryDark: '#1a237e',

      accent: '#ffd700',
      accentSecondary: '#ffeb3b',
      accentMuted: 'rgba(255, 215, 0, 0.6)',

      text: '#e8eaf6',
      textSecondary: '#c5cae9',
      textMuted: 'rgba(232, 234, 246, 0.6)',
      textInverse: '#0a0a1a',

      success: '#4caf50',
      error: '#f44336',
      warning: '#ffc107',
      info: '#2196f3',

      glow: '#ffd700',
      glowSecondary: '#7986cb',
      border: '#5c6bc0',
      borderMuted: 'rgba(92, 107, 192, 0.3)',

      gradientPrimary: ['#3f51b5', '#0a0a1a', '#1a237e'],
      gradientAccent: ['#ffd700', '#ffeb3b'],
      gradientBackground: 'linear-gradient(135deg, #1a237e 0%, #0a0a1a 50%, #3f51b5 100%)',
    },

    light: {
      background: '#e8eaf6',
      backgroundSecondary: '#c5cae9',
      backgroundTertiary: '#9fa8da',
      surface: 'rgba(63, 81, 181, 0.08)',
      surfaceElevated: 'rgba(63, 81, 181, 0.15)',

      primary: '#303f9f',
      primaryLight: '#666ad1',
      primaryDark: '#001970',

      accent: '#ffa000',
      accentSecondary: '#ff8f00',
      accentMuted: 'rgba(255, 160, 0, 0.6)',

      text: '#1a237e',
      textSecondary: '#303f9f',
      textMuted: 'rgba(26, 35, 126, 0.6)',
      textInverse: '#e8eaf6',

      success: '#388e3c',
      error: '#d32f2f',
      warning: '#f57c00',
      info: '#1976d2',

      glow: '#ffb300',
      glowSecondary: '#5c6bc0',
      border: '#5c6bc0',
      borderMuted: 'rgba(92, 107, 192, 0.3)',

      gradientPrimary: ['#9fa8da', '#e8eaf6', '#c5cae9'],
      gradientAccent: ['#ffa000', '#ff8f00'],
      gradientBackground: 'linear-gradient(135deg, #9fa8da 0%, #e8eaf6 50%, #c5cae9 100%)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // HALLOWEEN (Seasonal/Event)
  // ─────────────────────────────────────────────────────────────────────────────
  halloween: {
    id: 'halloween',
    name: 'Samhain Night',
    description: 'October exclusive - The veil is thin',
    icon: '🎃',
    rarity: 'legendary',
    price: 0,
    unlockMethod: 'event',
    event: 'halloween',
    limitedTime: true,

    dark: {
      background: '#0d0705',
      backgroundSecondary: '#1a0e0a',
      backgroundTertiary: '#261410',
      surface: 'rgba(230, 81, 0, 0.2)',
      surfaceElevated: 'rgba(230, 81, 0, 0.35)',

      primary: '#e65100',
      primaryLight: '#ff833a',
      primaryDark: '#ac1900',

      accent: '#7c4dff',
      accentSecondary: '#651fff',
      accentMuted: 'rgba(124, 77, 255, 0.6)',

      text: '#ffccbc',
      textSecondary: '#ffab91',
      textMuted: 'rgba(255, 204, 188, 0.6)',
      textInverse: '#0d0705',

      success: '#66bb6a',
      error: '#ff1744',
      warning: '#ffc400',
      info: '#7c4dff',

      glow: '#e65100',
      glowSecondary: '#7c4dff',
      border: '#bf360c',
      borderMuted: 'rgba(191, 54, 12, 0.3)',

      gradientPrimary: ['#e65100', '#0d0705', '#ac1900'],
      gradientAccent: ['#7c4dff', '#651fff'],
      gradientBackground: 'linear-gradient(135deg, #e65100 0%, #0d0705 50%, #7c4dff 100%)',
    },

    light: {
      background: '#fff3e0',
      backgroundSecondary: '#ffe0b2',
      backgroundTertiary: '#ffcc80',
      surface: 'rgba(230, 81, 0, 0.08)',
      surfaceElevated: 'rgba(230, 81, 0, 0.15)',

      primary: '#e65100',
      primaryLight: '#ff833a',
      primaryDark: '#ac1900',

      accent: '#6200ea',
      accentSecondary: '#651fff',
      accentMuted: 'rgba(98, 0, 234, 0.6)',

      text: '#bf360c',
      textSecondary: '#e65100',
      textMuted: 'rgba(191, 54, 12, 0.6)',
      textInverse: '#fff3e0',

      success: '#43a047',
      error: '#d50000',
      warning: '#ff6f00',
      info: '#6200ea',

      glow: '#ff6d00',
      glowSecondary: '#7c4dff',
      border: '#e65100',
      borderMuted: 'rgba(230, 81, 0, 0.3)',

      gradientPrimary: ['#ffcc80', '#fff3e0', '#ffe0b2'],
      gradientAccent: ['#7c4dff', '#651fff'],
      gradientBackground: 'linear-gradient(135deg, #ffcc80 0%, #fff3e0 50%, #ffe0b2 100%)',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get theme by ID
 */
export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.cosmic;
}

/**
 * Get theme colors for current mode
 */
export function getThemeColors(themeId, mode = 'dark') {
  const theme = getTheme(themeId);
  return theme[mode] || theme.dark;
}

/**
 * Get all available themes
 */
export function getAllThemes() {
  return Object.values(THEMES);
}

/**
 * Get themes by rarity
 */
export function getThemesByRarity(rarity) {
  return Object.values(THEMES).filter(t => t.rarity === rarity);
}

/**
 * Get purchasable themes
 */
export function getPurchasableThemes() {
  return Object.values(THEMES).filter(t => t.unlockMethod === 'purchase' && t.price > 0);
}

/**
 * Get default (free) themes
 */
export function getDefaultThemes() {
  return Object.values(THEMES).filter(t => t.isDefault || t.price === 0);
}

/**
 * Get event themes
 */
export function getEventThemes() {
  return Object.values(THEMES).filter(t => t.unlockMethod === 'event');
}

/**
 * Check if theme is currently available (for limited-time themes)
 */
export function isThemeAvailable(themeId) {
  const theme = THEMES[themeId];
  if (!theme) return false;

  // Check if it's a limited-time event theme
  if (theme.limitedTime && theme.event) {
    const now = new Date();
    const month = now.getMonth();

    // Halloween: October
    if (theme.event === 'halloween') {
      return month === 9; // October = 9 (0-indexed)
    }

    // Winter: December-January
    if (theme.event === 'winter') {
      return month === 11 || month === 0;
    }

    // Valentine: February
    if (theme.event === 'valentine') {
      return month === 1;
    }

    // Spring: March-April
    if (theme.event === 'spring') {
      return month === 2 || month === 3;
    }

    // Summer: June-August
    if (theme.event === 'summer') {
      return month >= 5 && month <= 7;
    }
  }

  return true;
}

/**
 * Get CSS gradient string from theme
 */
export function getGradientCSS(themeId, mode = 'dark', type = 'background') {
  const colors = getThemeColors(themeId, mode);

  if (type === 'background') {
    return colors.gradientBackground;
  }

  const gradient = type === 'accent' ? colors.gradientAccent : colors.gradientPrimary;
  return `linear-gradient(135deg, ${gradient.join(', ')})`;
}

/**
 * Get React Native gradient array from theme
 */
export function getGradientColors(themeId, mode = 'dark', type = 'primary') {
  const colors = getThemeColors(themeId, mode);

  switch (type) {
    case 'accent':
      return colors.gradientAccent;
    case 'background':
    case 'primary':
    default:
      return colors.gradientPrimary;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBER MONTHLY REWARDS THEMES
// These rotate each month for subscribers
// ═══════════════════════════════════════════════════════════════════════════════

export const SUBSCRIBER_MONTHLY_THEMES = [
  'ocean',     // January - New beginnings, clarity
  'rose',      // February - Valentine's
  'forest',    // March - Spring awakening
  'twilight',  // April - Spring magic
  'ember',     // May - Beltane fire
  'gold',      // June - Summer solstice
  'aurora',    // July - Northern lights
  'amethyst',  // August - Crystal energy
  'midnight',  // September - Autumn darkness
  'shadow',    // October - Shadow work (if not already owned)
  'cosmic',    // November - Original aesthetic
  'celestial', // December - Holiday stars
];

/**
 * Get the subscriber reward theme for current month
 */
export function getMonthlyRewardTheme() {
  const month = new Date().getMonth(); // 0-11
  return SUBSCRIBER_MONTHLY_THEMES[month];
}

export default THEMES;
