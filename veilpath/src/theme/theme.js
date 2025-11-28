/**
 * VeilPath Design System
 * Mental WELLNESS platform - Dark Fantasy Therapeutic Aesthetic
 *
 * Philosophy: Calming, mystical, professional
 * Avoid: Harsh neon, overstimulation, anxiety-inducing colors
 * Embrace: Deep purples, soft golds, moonlight blues, earthy tones
 */

export const THEME = {
  /**
   * COLOR PALETTE
   * Primary: Deep purple (wisdom, spirituality, introspection)
   * Secondary: Moonlight blue (calm, clarity, night sky)
   * Accent: Soft gold (achievement, value, warmth)
   * Therapeutic: Earthy greens and warm neutrals
   */
  colors: {
    // Primary - Deep Purple (Wisdom & Spirituality)
    primary: {
      900: '#1A0B2E',     // Darkest (backgrounds)
      800: '#2D1B4E',     // Dark (cards, containers)
      700: '#40286E',     // Mid-dark
      600: '#53368E',     // Mid
      500: '#6644AE',     // Base primary
      400: '#8266BE',     // Light
      300: '#9E88CE',     // Lighter
      200: '#BAABDE',     // Very light
      100: '#D6CDEF',     // Palest
    },

    // Secondary - Moonlight Blue (Calm & Clarity)
    secondary: {
      900: '#0A1628',     // Darkest
      800: '#142844',     // Dark
      700: '#1E3A60',     // Mid-dark
      600: '#284C7C',     // Mid
      500: '#3A5E98',     // Base secondary
      400: '#5476AC',     // Light
      300: '#7592C0',     // Lighter
      200: '#9BAED4',     // Very light
      100: '#C1CAE8',     // Palest
    },

    // Accent - Soft Gold (Achievement & Warmth)
    accent: {
      900: '#3D2E1A',     // Darkest
      800: '#5C4628',     // Dark
      700: '#7A5E36',     // Mid-dark
      600: '#997644',     // Mid
      500: '#B78E52',     // Base gold
      400: '#C5A470',     // Light
      300: '#D3BA8E',     // Lighter
      200: '#E1D0AC',     // Very light
      100: '#EFE6CA',     // Palest
    },

    // Therapeutic - Earthy Greens (Growth, Healing, Balance)
    therapeutic: {
      900: '#1A2618',     // Darkest
      800: '#2A3D27',     // Dark
      700: '#3A5436',     // Mid-dark
      600: '#4A6B45',     // Mid
      500: '#5A8254',     // Base green
      400: '#759870',     // Light
      300: '#90AE8C',     // Lighter
      200: '#ABC4A8',     // Very light
      100: '#C6DAC4',     // Palest
    },

    // Neutrals - Warm Grays (Grounded, Comfortable)
    neutral: {
      1000: '#000000',    // True black
      900: '#0F0E13',     // Almost black
      800: '#1E1C24',     // Very dark
      700: '#2D2A35',     // Dark
      600: '#3C3846',     // Mid-dark
      500: '#4B4657',     // Mid
      400: '#6B657A',     // Light-mid
      300: '#8B859D',     // Light
      200: '#ABA5C0',     // Very light
      100: '#CBC5E3',     // Palest
      50: '#E5E0F5',      // Almost white
      0: '#FFFFFF',       // True white
    },

    // Semantic Colors
    semantic: {
      // Success (achievements, completed tasks, positive actions)
      success: {
        dark: '#2D5A3D',
        base: '#4A8254',
        light: '#90AE8C',
      },

      // Warning (important info, prompts to review)
      warning: {
        dark: '#5C4628',
        base: '#B78E52',
        light: '#D3BA8E',
      },

      // Error (critical info, destructive actions)
      error: {
        dark: '#5A2828',
        base: '#8A4444',
        light: '#C08888',
      },

      // Info (helpful tips, general information)
      info: {
        dark: '#1E3A60',
        base: '#3A5E98',
        light: '#7592C0',
      },
    },

    // Therapeutic State Colors (for mood tracking, etc.)
    mood: {
      calm: '#7592C0',        // Soft blue
      energized: '#B78E52',   // Warm gold
      peaceful: '#90AE8C',    // Gentle green
      focused: '#6644AE',     // Deep purple
      anxious: '#8A6B44',     // Muted amber
      sad: '#5476AC',         // Cool blue
      angry: '#8A4444',       // Muted red
      joyful: '#C5A470',      // Bright gold
    },

    // Special Effects
    effects: {
      glow: {
        purple: 'rgba(102, 68, 174, 0.4)',
        blue: 'rgba(58, 94, 152, 0.4)',
        gold: 'rgba(183, 142, 82, 0.4)',
      },
      overlay: {
        dark: 'rgba(15, 14, 19, 0.85)',
        mid: 'rgba(15, 14, 19, 0.6)',
        light: 'rgba(15, 14, 19, 0.3)',
      },
      gradient: {
        purpleBlue: ['#6644AE', '#3A5E98'],
        purpleGold: ['#6644AE', '#B78E52'],
        nightSky: ['#0A1628', '#1A0B2E', '#0F0E13'],
      },
    },
  },

  /**
   * TYPOGRAPHY
   * Custom fonts: Cinzel (display), Raleway (body), Philosopher (UI)
   * Falls back to system fonts if custom fonts aren't loaded
   *
   * Font loading handled by src/utils/fontLoader.js
   */
  typography: {
    fonts: {
      // Display font (headings, titles) - Cinzel
      display: {
        family: {
          light: 'Cinzel-Regular',
          regular: 'Cinzel-Regular',
          medium: 'Cinzel-Medium',
          semibold: 'Cinzel-SemiBold',
          bold: 'Cinzel-Bold',
        },
        fallback: { ios: 'Georgia', android: 'serif', web: 'Cinzel, Georgia, serif' },
      },

      // Body font (paragraphs, content) - Raleway
      body: {
        family: {
          light: 'Raleway-Light',
          regular: 'Raleway-Regular',
          medium: 'Raleway-Medium',
          semibold: 'Raleway-SemiBold',
          bold: 'Raleway-Bold',
        },
        fallback: { ios: 'System', android: 'Roboto', web: 'Raleway, system-ui, sans-serif' },
      },

      // UI font (buttons, labels, navigation) - Philosopher
      ui: {
        family: {
          regular: 'Philosopher-Regular',
          bold: 'Philosopher-Bold',
          italic: 'Philosopher-Italic',
          boldItalic: 'Philosopher-BoldItalic',
        },
        fallback: { ios: 'System', android: 'Roboto', web: 'Philosopher, system-ui, sans-serif' },
      },

      // Monospace (stats, numbers, data)
      mono: {
        ios: 'Courier',
        android: 'monospace',
        web: 'Consolas, monospace',
      },

      // Legacy aliases for backward compatibility
      primary: {
        ios: 'System',
        android: 'Roboto',
        weight: {
          light: '300',
          regular: '400',
          medium: '500',
          semibold: '600',
          bold: '700',
        },
      },
    },

    // Type scale (modular scale: 1.250 - major third)
    sizes: {
      xs: 12,       // Fine print, captions
      sm: 14,       // Secondary text, labels
      base: 16,     // Body text, default
      lg: 20,       // Large body, sub-headings
      xl: 25,       // H3, card titles
      '2xl': 31,    // H2, section titles
      '3xl': 39,    // H1, page titles
      '4xl': 49,    // Display, hero text
      '5xl': 61,    // Extra large display
    },

    // Line heights (for readability)
    lineHeights: {
      tight: 1.2,    // Headings
      snug: 1.375,   // Subheadings
      normal: 1.5,   // Body text
      relaxed: 1.625, // Long-form content
      loose: 1.75,   // Very relaxed reading
    },

    // Letter spacing
    letterSpacing: {
      tighter: -0.05,
      tight: -0.025,
      normal: 0,
      wide: 0.025,
      wider: 0.05,
      widest: 0.1,
    },
  },

  /**
   * SPACING
   * Base 4px grid for consistent rhythm
   */
  spacing: {
    0: 0,
    1: 4,      // 4px
    2: 8,      // 8px
    3: 12,     // 12px
    4: 16,     // 16px
    5: 20,     // 20px
    6: 24,     // 24px
    8: 32,     // 32px
    10: 40,    // 40px
    12: 48,    // 48px
    16: 64,    // 64px
    20: 80,    // 80px
    24: 96,    // 96px
    32: 128,   // 128px
  },

  /**
   * SHADOWS
   * Subtle depth for card elevation, modals
   */
  shadows: {
    none: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 2,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 15 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
    // Glow effects (for cards, special UI)
    glow: {
      purple: {
        shadowColor: '#6644AE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 8,
      },
      gold: {
        shadowColor: '#B78E52',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 6,
      },
    },
  },

  /**
   * BORDER RADIUS
   * Consistent corner rounding
   */
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    base: 12,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    full: 9999,  // Pills, circles
  },

  /**
   * ANIMATION TIMING
   * Consistent, calming motion
   */
  animation: {
    duration: {
      instant: 0,
      fast: 150,      // Quick feedback
      base: 250,      // Default transitions
      slow: 400,      // Deliberate motion
      slower: 600,    // Slow reveals
      slowest: 1000,  // Very slow, meditative
    },
    easing: {
      linear: 'linear',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      // Custom beziers for React Native Animated
      spring: { tension: 40, friction: 7 },
      bounce: { tension: 50, friction: 5 },
    },
  },

  /**
   * LAYOUT
   * Container sizes, breakpoints
   */
  layout: {
    // Container max widths
    containerPadding: 16,
    containerMaxWidth: 480,  // Mobile-first, max width for readability

    // Safe areas (account for notches, home indicators)
    safeArea: {
      top: 48,
      bottom: 34,
      horizontal: 16,
    },

    // Card dimensions (tarot cards)
    card: {
      width: 1080,      // Full image width
      height: 1920,     // Full image height
      aspectRatio: 0.5625,  // 9:16
      displayWidth: 240,    // Display size in app
      displayHeight: 427,   // Display size in app
    },
  },

  /**
   * Z-INDEX LAYERS
   * Consistent stacking order
   */
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    popover: 500,
    tooltip: 600,
    toast: 700,
  },
};

/**
 * HELPER FUNCTIONS
 */

/**
 * Get platform-specific font family
 */
export const getPlatformFont = (fontType = 'primary', Platform) => {
  const isIOS = Platform.OS === 'ios';
  return THEME.typography.fonts[fontType][isIOS ? 'ios' : 'android'];
};

/**
 * Create text style object
 */
export const createTextStyle = (size, weight = 'regular', color = 'neutral.0', Platform) => ({
  fontFamily: getPlatformFont('primary', Platform),
  fontSize: THEME.typography.sizes[size] || THEME.typography.sizes.base,
  fontWeight: THEME.typography.fonts.primary.weight[weight] || '400',
  color: getColorByPath(color),
  lineHeight: (THEME.typography.sizes[size] || THEME.typography.sizes.base) * THEME.typography.lineHeights.normal,
});

/**
 * Get color by path (e.g., 'primary.500', 'semantic.success.base')
 */
export const getColorByPath = (path) => {
  const keys = path.split('.');
  let value = THEME.colors;

  for (const key of keys) {
    if (value[key] !== undefined) {
      value = value[key];
    } else {
      console.warn(`[Theme] Color path not found: ${path}`);
      return THEME.colors.neutral[0]; // Default to white
    }
  }

  return value;
};

/**
 * Create card style with shadow
 */
export const createCardStyle = (shadowLevel = 'base', backgroundColor = 'primary.800') => ({
  backgroundColor: getColorByPath(backgroundColor),
  borderRadius: THEME.borderRadius.base,
  ...THEME.shadows[shadowLevel],
});

export default THEME;
