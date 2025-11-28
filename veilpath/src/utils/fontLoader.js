/**
 * VeilPath Font Loader
 *
 * Handles loading custom fonts for the application.
 * Uses expo-font for cross-platform font loading.
 *
 * FONTS USED:
 * - Cinzel: Elegant serif for titles and headings (mystical, ancient feel)
 * - Raleway: Clean sans-serif for body text (modern, readable)
 * - Philosopher: Semi-serif for UI labels (balanced, mystical)
 *
 * Font files should be placed in /assets/fonts/ with these names:
 * - Cinzel-Regular.ttf
 * - Cinzel-Medium.ttf
 * - Cinzel-SemiBold.ttf
 * - Cinzel-Bold.ttf
 * - Raleway-Light.ttf
 * - Raleway-Regular.ttf
 * - Raleway-Medium.ttf
 * - Raleway-SemiBold.ttf
 * - Raleway-Bold.ttf
 * - Philosopher-Regular.ttf
 * - Philosopher-Bold.ttf
 * - Philosopher-Italic.ttf
 * - Philosopher-BoldItalic.ttf
 *
 * Download from Google Fonts:
 * - https://fonts.google.com/specimen/Cinzel
 * - https://fonts.google.com/specimen/Raleway
 * - https://fonts.google.com/specimen/Philosopher
 */

import * as Font from 'expo-font';
import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// FONT MANIFEST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Font file mappings for expo-font
 * Keys become the font family names used in styles
 *
 * NOTE: Uses try-catch for each require to gracefully handle missing fonts.
 * If a font file is missing, it will be skipped and fallbacks will be used.
 */
const FONT_MAP = {};

// Safely require a font file - returns null if not found
function safeRequireFont(path, name) {
  try {
    // Using dynamic require for optional fonts
    const fontModule = require('../../assets/fonts/' + name + '.ttf');
    return fontModule;
  } catch (e) {
    // Font file not found - will use fallback
    return null;
  }
}

// Build font map with available fonts
const FONT_FILES = [
  // Cinzel - Display/Title font (elegant serif)
  'Cinzel-Regular',
  'Cinzel-Medium',
  'Cinzel-SemiBold',
  'Cinzel-Bold',
  // Raleway - Body font (clean sans-serif)
  'Raleway-Light',
  'Raleway-Regular',
  'Raleway-Medium',
  'Raleway-SemiBold',
  'Raleway-Bold',
  // Philosopher - UI Label font (mystical semi-serif)
  'Philosopher-Regular',
  'Philosopher-Bold',
  'Philosopher-Italic',
  'Philosopher-BoldItalic',
];

// Check which fonts are available
let fontsAvailable = false;

// Try to load each font (will be populated at load time)
function buildFontMap() {
  const map = {};
  let hasAnyFont = false;

  for (const fontName of FONT_FILES) {
    const font = safeRequireFont('../../assets/fonts/', fontName);
    if (font) {
      map[fontName] = font;
      hasAnyFont = true;
    }
  }

  fontsAvailable = hasAnyFont;
  return map;
}

// ═══════════════════════════════════════════════════════════════════════════
// FONT FAMILY CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Font family names for use in styles
 */
export const FONTS = {
  // Cinzel variants
  CINZEL: 'Cinzel-Regular',
  CINZEL_MEDIUM: 'Cinzel-Medium',
  CINZEL_SEMIBOLD: 'Cinzel-SemiBold',
  CINZEL_BOLD: 'Cinzel-Bold',

  // Raleway variants
  RALEWAY_LIGHT: 'Raleway-Light',
  RALEWAY: 'Raleway-Regular',
  RALEWAY_MEDIUM: 'Raleway-Medium',
  RALEWAY_SEMIBOLD: 'Raleway-SemiBold',
  RALEWAY_BOLD: 'Raleway-Bold',

  // Philosopher variants
  PHILOSOPHER: 'Philosopher-Regular',
  PHILOSOPHER_BOLD: 'Philosopher-Bold',
  PHILOSOPHER_ITALIC: 'Philosopher-Italic',
  PHILOSOPHER_BOLD_ITALIC: 'Philosopher-BoldItalic',
};

/**
 * Semantic font assignments for design system
 */
export const FONT_FAMILIES = {
  // Display text (titles, headings, hero)
  display: {
    light: FONTS.CINZEL,
    regular: FONTS.CINZEL,
    medium: FONTS.CINZEL_MEDIUM,
    semibold: FONTS.CINZEL_SEMIBOLD,
    bold: FONTS.CINZEL_BOLD,
  },

  // Body text (paragraphs, content)
  body: {
    light: FONTS.RALEWAY_LIGHT,
    regular: FONTS.RALEWAY,
    medium: FONTS.RALEWAY_MEDIUM,
    semibold: FONTS.RALEWAY_SEMIBOLD,
    bold: FONTS.RALEWAY_BOLD,
  },

  // UI text (buttons, labels, navigation)
  ui: {
    regular: FONTS.PHILOSOPHER,
    bold: FONTS.PHILOSOPHER_BOLD,
    italic: FONTS.PHILOSOPHER_ITALIC,
    boldItalic: FONTS.PHILOSOPHER_BOLD_ITALIC,
  },

  // Fallbacks for each category (used when custom fonts fail to load)
  fallback: {
    display: Platform.select({ ios: 'Georgia', android: 'serif', web: 'Cinzel, Georgia, serif' }),
    body: Platform.select({ ios: 'System', android: 'Roboto', web: 'Raleway, system-ui, sans-serif' }),
    ui: Platform.select({ ios: 'System', android: 'Roboto', web: 'Philosopher, system-ui, sans-serif' }),
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════

let fontsLoaded = false;
let loadError = null;

/**
 * Check if fonts have been loaded
 * @returns {boolean}
 */
export function areFontsLoaded() {
  return fontsLoaded;
}

/**
 * Get font loading error if any
 * @returns {Error|null}
 */
export function getFontLoadError() {
  return loadError;
}

// ═══════════════════════════════════════════════════════════════════════════
// FONT LOADING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load all custom fonts asynchronously
 * Should be called during app initialization (before rendering)
 *
 * @returns {Promise<boolean>} True if fonts loaded successfully
 */
export async function loadFonts() {
  if (fontsLoaded) {
    return true;
  }

  try {
    // Build font map from available fonts
    const fontMap = buildFontMap();

    // If no fonts are available, skip loading
    if (Object.keys(fontMap).length === 0) {
      console.log('[FontLoader] No custom font files found, using system fallbacks');
      console.log('[FontLoader] Add font files to /assets/fonts/ - see README.md');
      fontsLoaded = false;
      return false;
    }

    // Load available fonts
    await Font.loadAsync(fontMap);
    fontsLoaded = true;
    loadError = null;
    console.log(`[FontLoader] Loaded ${Object.keys(fontMap).length} custom fonts`);
    return true;
  } catch (error) {
    loadError = error;
    fontsLoaded = false;
    console.warn('[FontLoader] Failed to load custom fonts, using fallbacks:', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FONT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the appropriate font family for a given category and weight
 * Falls back to system fonts if custom fonts aren't loaded
 *
 * @param {'display' | 'body' | 'ui'} category - Font category
 * @param {'light' | 'regular' | 'medium' | 'semibold' | 'bold'} weight - Font weight
 * @returns {string} Font family name
 */
export function getFont(category = 'body', weight = 'regular') {
  // If fonts aren't loaded, use fallbacks
  if (!fontsLoaded) {
    return FONT_FAMILIES.fallback[category] || FONT_FAMILIES.fallback.body;
  }

  const fonts = FONT_FAMILIES[category];
  if (!fonts) {
    return FONT_FAMILIES.body.regular;
  }

  return fonts[weight] || fonts.regular;
}

/**
 * Get font family for display text (titles, headings)
 * @param {'light' | 'regular' | 'medium' | 'semibold' | 'bold'} weight
 * @returns {string}
 */
export function getDisplayFont(weight = 'regular') {
  return getFont('display', weight);
}

/**
 * Get font family for body text (paragraphs, content)
 * @param {'light' | 'regular' | 'medium' | 'semibold' | 'bold'} weight
 * @returns {string}
 */
export function getBodyFont(weight = 'regular') {
  return getFont('body', weight);
}

/**
 * Get font family for UI elements (buttons, labels)
 * @param {'regular' | 'bold' | 'italic' | 'boldItalic'} variant
 * @returns {string}
 */
export function getUIFont(variant = 'regular') {
  if (!fontsLoaded) {
    return FONT_FAMILIES.fallback.ui;
  }
  return FONT_FAMILIES.ui[variant] || FONT_FAMILIES.ui.regular;
}

/**
 * Create a complete font style object
 * @param {'display' | 'body' | 'ui'} category
 * @param {'light' | 'regular' | 'medium' | 'semibold' | 'bold'} weight
 * @returns {object} Style object with fontFamily
 */
export function createFontStyle(category = 'body', weight = 'regular') {
  return {
    fontFamily: getFont(category, weight),
  };
}

/**
 * Get web-safe CSS font stack for a category
 * @param {'display' | 'body' | 'ui'} category
 * @returns {string} CSS font-family value
 */
export function getWebFontStack(category = 'body') {
  switch (category) {
    case 'display':
      return "'Cinzel', Georgia, 'Times New Roman', serif";
    case 'ui':
      return "'Philosopher', 'Segoe UI', system-ui, sans-serif";
    case 'body':
    default:
      return "'Raleway', 'Segoe UI', system-ui, sans-serif";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pre-built text style presets for common use cases
 */
export const TEXT_PRESETS = {
  // Headings
  h1: () => ({ fontFamily: getDisplayFont('bold'), fontSize: 32, lineHeight: 40 }),
  h2: () => ({ fontFamily: getDisplayFont('semibold'), fontSize: 28, lineHeight: 36 }),
  h3: () => ({ fontFamily: getDisplayFont('medium'), fontSize: 24, lineHeight: 32 }),
  h4: () => ({ fontFamily: getDisplayFont('regular'), fontSize: 20, lineHeight: 28 }),

  // Body text
  bodyLarge: () => ({ fontFamily: getBodyFont('regular'), fontSize: 18, lineHeight: 28 }),
  body: () => ({ fontFamily: getBodyFont('regular'), fontSize: 16, lineHeight: 24 }),
  bodySmall: () => ({ fontFamily: getBodyFont('regular'), fontSize: 14, lineHeight: 20 }),

  // UI elements
  button: () => ({ fontFamily: getUIFont('bold'), fontSize: 16, letterSpacing: 0.5 }),
  buttonSmall: () => ({ fontFamily: getUIFont('bold'), fontSize: 14, letterSpacing: 0.5 }),
  label: () => ({ fontFamily: getUIFont('regular'), fontSize: 14 }),
  caption: () => ({ fontFamily: getBodyFont('regular'), fontSize: 12, lineHeight: 16 }),

  // Special
  cardTitle: () => ({ fontFamily: getDisplayFont('semibold'), fontSize: 20, lineHeight: 26 }),
  cardName: () => ({ fontFamily: getDisplayFont('bold'), fontSize: 16, letterSpacing: 1 }),
  quote: () => ({ fontFamily: getUIFont('italic'), fontSize: 16, lineHeight: 24 }),
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  FONTS,
  FONT_FAMILIES,
  loadFonts,
  areFontsLoaded,
  getFontLoadError,
  getFont,
  getDisplayFont,
  getBodyFont,
  getUIFont,
  createFontStyle,
  getWebFontStack,
  TEXT_PRESETS,
};
