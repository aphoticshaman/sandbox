/**
 * VeilPath Theme Context
 *
 * Provides app-wide theming with:
 * - Multiple theme variants (not just light/dark)
 * - Light/dark mode toggle per theme
 * - Gradient support
 * - Integration with cosmetics store for unlocking
 * - Subscriber rewards integration
 *
 * Personal themes - only the user sees their theme choice
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, getTheme, getThemeColors, isThemeAvailable, getMonthlyRewardTheme } from '../theme/themes';
import { useCosmeticsStore } from '../stores/cosmeticsStore';

const STORAGE_KEY = '@veilpath_theme_preferences';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const ThemeContext = createContext(null);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function ThemeProvider({ children }) {
  // System color scheme detection
  const systemColorScheme = useColorScheme();

  // State
  const [currentThemeId, setCurrentThemeId] = useState('cosmic');
  const [mode, setMode] = useState('dark'); // 'light' | 'dark' | 'system'
  const [isInitialized, setIsInitialized] = useState(false);

  // Cosmetics store integration
  const unlockedThemes = useCosmeticsStore((state) => state.unlockedThemes);
  const unlockTheme = useCosmeticsStore((state) => state.unlockCosmetic);

  // ─────────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadThemePreferences();
  }, []);

  const loadThemePreferences = async () => {
    try {
      const stored = Platform.OS === 'web'
        ? localStorage.getItem(STORAGE_KEY)
        : await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const data = JSON.parse(stored);
        setCurrentThemeId(data.themeId || 'cosmic');
        setMode(data.mode || 'dark');
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('[ThemeContext] Failed to load preferences:', error);
      setIsInitialized(true);
    }
  };

  const saveThemePreferences = useCallback(async (themeId, themeMode) => {
    try {
      const data = JSON.stringify({ themeId, mode: themeMode });

      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, data);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, data);
      }
    } catch (error) {
      console.error('[ThemeContext] Failed to save preferences:', error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────────────────────

  // Resolve actual mode based on system preference
  const resolvedMode = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme || 'dark';
    }
    return mode;
  }, [mode, systemColorScheme]);

  // Current theme object
  const theme = useMemo(() => {
    return getTheme(currentThemeId);
  }, [currentThemeId]);

  // Current colors based on theme + mode
  const colors = useMemo(() => {
    return getThemeColors(currentThemeId, resolvedMode);
  }, [currentThemeId, resolvedMode]);

  // Check if current theme is unlocked
  const isCurrentThemeUnlocked = useMemo(() => {
    const themeData = THEMES[currentThemeId];
    if (!themeData) return false;

    // Default/free themes always unlocked
    if (themeData.isDefault || themeData.price === 0) return true;

    // Check cosmetics store
    return unlockedThemes?.includes(currentThemeId) || false;
  }, [currentThemeId, unlockedThemes]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Set the current theme
   */
  const setTheme = useCallback((themeId) => {
    const themeData = THEMES[themeId];
    if (!themeData) {
      console.warn(`[ThemeContext] Unknown theme: ${themeId}`);
      return false;
    }

    // Check if unlocked
    const isUnlocked = themeData.isDefault ||
      themeData.price === 0 ||
      unlockedThemes?.includes(themeId);

    if (!isUnlocked) {
      console.warn(`[ThemeContext] Theme not unlocked: ${themeId}`);
      return false;
    }

    // Check if available (for event themes)
    if (!isThemeAvailable(themeId)) {
      console.warn(`[ThemeContext] Theme not currently available: ${themeId}`);
      return false;
    }

    setCurrentThemeId(themeId);
    saveThemePreferences(themeId, mode);
    return true;
  }, [unlockedThemes, mode, saveThemePreferences]);

  /**
   * Set the color mode
   */
  const setColorMode = useCallback((newMode) => {
    if (!['light', 'dark', 'system'].includes(newMode)) {
      console.warn(`[ThemeContext] Invalid mode: ${newMode}`);
      return;
    }

    setMode(newMode);
    saveThemePreferences(currentThemeId, newMode);
  }, [currentThemeId, saveThemePreferences]);

  /**
   * Toggle between light and dark mode
   */
  const toggleMode = useCallback(() => {
    const newMode = resolvedMode === 'dark' ? 'light' : 'dark';
    setColorMode(newMode);
  }, [resolvedMode, setColorMode]);

  /**
   * Check if a theme is unlocked
   */
  const isThemeUnlocked = useCallback((themeId) => {
    const themeData = THEMES[themeId];
    if (!themeData) return false;

    // Default/free themes always unlocked
    if (themeData.isDefault || themeData.price === 0) return true;

    // Level unlock
    if (themeData.unlockMethod === 'level') {
      // This would need to check userStore - for now assume not unlocked
      return unlockedThemes?.includes(themeId) || false;
    }

    // Achievement unlock
    if (themeData.unlockMethod === 'achievement') {
      return unlockedThemes?.includes(themeId) || false;
    }

    // Event unlock
    if (themeData.unlockMethod === 'event') {
      return unlockedThemes?.includes(themeId) || false;
    }

    // Purchased themes
    return unlockedThemes?.includes(themeId) || false;
  }, [unlockedThemes]);

  /**
   * Get all unlocked themes
   */
  const getUnlockedThemes = useCallback(() => {
    return Object.values(THEMES).filter(t => isThemeUnlocked(t.id));
  }, [isThemeUnlocked]);

  /**
   * Get themes available for purchase
   */
  const getPurchasableThemes = useCallback(() => {
    return Object.values(THEMES).filter(t =>
      t.unlockMethod === 'purchase' &&
      t.price > 0 &&
      !isThemeUnlocked(t.id) &&
      isThemeAvailable(t.id)
    );
  }, [isThemeUnlocked]);

  /**
   * Award subscriber monthly theme reward
   */
  const claimMonthlyThemeReward = useCallback(() => {
    const rewardThemeId = getMonthlyRewardTheme();
    const themeData = THEMES[rewardThemeId];

    if (!themeData) {
      console.error('[ThemeContext] Monthly reward theme not found:', rewardThemeId);
      return { success: false, error: 'Theme not found' };
    }

    // Check if already unlocked
    if (isThemeUnlocked(rewardThemeId)) {
      return { success: false, error: 'Already owned', themeId: rewardThemeId };
    }

    // Unlock via cosmetics store
    const result = unlockTheme?.('theme', rewardThemeId);
    if (result) {
      return { success: true, themeId: rewardThemeId, theme: themeData };
    }

    return { success: false, error: 'Failed to unlock' };
  }, [isThemeUnlocked, unlockTheme]);

  // ─────────────────────────────────────────────────────────────────────────────
  // LEGACY COMPATIBILITY
  // Maps to old COSMIC constant structure for gradual migration
  // ─────────────────────────────────────────────────────────────────────────────

  const COSMIC = useMemo(() => ({
    // Core colors - map to theme colors
    midnightVoid: colors.background,
    deepAmethyst: colors.primary,
    shadowPurple: colors.primaryDark,
    moonGlow: colors.text,
    crystalPink: colors.textSecondary,
    candleFlame: colors.accent,
    brassVictorian: colors.accentSecondary,
    starlight: colors.warning,
    bloodMoon: colors.error,
    sageGreen: colors.success,
    etherealCyan: colors.glow,

    // Gradients (for web)
    gradientCosmic: colors.gradientBackground,
    gradientCard: colors.surface,

    // Glassmorphism
    blur: 'blur(20px) saturate(1.5)',

    // Shadows
    shadowGlow: (color) => ({
      shadowColor: color || colors.glow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 30,
      elevation: 15,
    }),
  }), [colors]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────────

  const value = useMemo(() => ({
    // State
    isInitialized,
    currentThemeId,
    mode,
    resolvedMode,

    // Theme data
    theme,
    colors,
    COSMIC, // Legacy compatibility

    // Status
    isDark: resolvedMode === 'dark',
    isLight: resolvedMode === 'light',
    isCurrentThemeUnlocked,

    // Actions
    setTheme,
    setColorMode,
    toggleMode,

    // Queries
    isThemeUnlocked,
    getUnlockedThemes,
    getPurchasableThemes,
    claimMonthlyThemeReward,

    // All themes reference
    allThemes: THEMES,
  }), [
    isInitialized,
    currentThemeId,
    mode,
    resolvedMode,
    theme,
    colors,
    COSMIC,
    isCurrentThemeUnlocked,
    setTheme,
    setColorMode,
    toggleMode,
    isThemeUnlocked,
    getUnlockedThemes,
    getPurchasableThemes,
    claimMonthlyThemeReward,
  ]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get just the colors (performance optimization)
 */
export function useThemeColors() {
  const { colors } = useTheme();
  return colors;
}

/**
 * Get COSMIC-compatible object for legacy components
 */
export function useCOSMIC() {
  const { COSMIC } = useTheme();
  return COSMIC;
}

/**
 * Check if dark mode is active
 */
export function useIsDarkMode() {
  const { isDark } = useTheme();
  return isDark;
}

export default ThemeContext;
