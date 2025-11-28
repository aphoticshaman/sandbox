/**
 * VeilPath Screen Design System
 * WitchTok x Victorian Gothic - Consistent AAA Design
 *
 * This provides the cosmic wrapper, cards, and components
 * to make every screen match the dope landing page.
 *
 * THEME INTEGRATION:
 * - Components can use useTheme() for dynamic theming
 * - COSMIC export is still available for backward compatibility
 * - useDynamicCOSMIC() hook returns theme-aware COSMIC object
 */

import React, { useState, useEffect, useRef, useMemo, useContext, createContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Detect Android Chrome to disable backdrop-filter (causes severe flashing on scroll)
const isAndroidChrome = Platform.OS === 'web' && typeof navigator !== 'undefined' &&
  /Android/i.test(navigator.userAgent) && /Chrome/i.test(navigator.userAgent);

// ═══════════════════════════════════════════════════════════
// VEILPATH COSMIC THEME
// ═══════════════════════════════════════════════════════════

export const COSMIC = {
  // Core colors
  midnightVoid: '#0a0514',
  deepAmethyst: '#4a148c',
  shadowPurple: '#311b92',
  moonGlow: '#e1bee7',
  crystalPink: '#f8bbd0',
  candleFlame: '#ffa726',
  brassVictorian: '#b8860b',
  starlight: '#fff9c4',
  bloodMoon: '#8b0000',
  sageGreen: '#87a96b',
  etherealCyan: '#00FFFF',

  // Gradients (for web)
  gradientCosmic: 'linear-gradient(135deg, #4a148c 0%, #0a0514 50%, #311b92 100%)',
  gradientCard: 'rgba(74, 20, 140, 0.25)',

  // Glassmorphism
  blur: 'blur(20px) saturate(1.5)',

  // Shadows
  shadowGlow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  }),
};

// ═══════════════════════════════════════════════════════════
// FLOATING CRYSTAL COMPONENT
// ═══════════════════════════════════════════════════════════

export function FloatingCrystal({ delay = 0, left = '50%', size = 'sm' }) {
  const [animValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const startAnimation = () => {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 18000 + Math.random() * 6000,
        useNativeDriver: true,
      }).start(() => startAnimation());
    };

    const timeout = setTimeout(startAnimation, delay * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height + 50, -100],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.7, 0.7, 0],
  });

  const rotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${360 + Math.random() * 180}deg`],
  });

  const sizeMap = { sm: 4, md: 6, lg: 8 };
  const w = sizeMap[size] || 4;

  return (
    <Animated.View
      style={[
        styles.crystal,
        {
          left,
          width: w,
          height: w * 2,
          opacity,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// FLOATING HERB/EMOJI COMPONENT
// ═══════════════════════════════════════════════════════════

export function FloatingEmoji({ emoji = '🌿', delay = 0, left = '50%' }) {
  const [animValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const startAnimation = () => {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 15000 + Math.random() * 5000,
        useNativeDriver: true,
      }).start(() => startAnimation());
    };

    const timeout = setTimeout(startAnimation, delay * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height + 50, -100],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 0.5, 0.5, 0],
  });

  const rotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.floatingEmoji,
        {
          left,
          opacity,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

// ═══════════════════════════════════════════════════════════
// CANDLE GLOW COMPONENT
// ═══════════════════════════════════════════════════════════

export function CandleGlow({ top, left, right, bottom, size = 200 }) {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.candleGlow,
        {
          top,
          left,
          right,
          bottom,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// MOON PHASES HEADER
// ═══════════════════════════════════════════════════════════

export function MoonPhases({ style }) {
  const moons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

  return (
    <View style={[styles.moonPhases, style]}>
      {moons.map((moon, i) => (
        <Text key={i} style={styles.moonEmoji}>{moon}</Text>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// COSMIC BACKGROUND COMPONENT
// ═══════════════════════════════════════════════════════════

export function CosmicBackground({ children, intensity = 'full' }) {
  const crystalCount = intensity === 'full' ? 8 : intensity === 'medium' ? 5 : 3;
  const emojiSets = {
    full: ['🌿', '🌾', '🌱', '🍃', '✨', '⭐'],
    medium: ['🌿', '✨', '⭐'],
    light: ['✨'],
  };
  const emojis = emojiSets[intensity] || emojiSets.light;

  return (
    <View style={styles.cosmicBackground}>
      {/* Crystals */}
      {[...Array(crystalCount)].map((_, i) => (
        <FloatingCrystal
          key={`crystal-${i}`}
          delay={i * 2.5}
          left={`${10 + i * (80 / crystalCount)}%`}
          size={['sm', 'md', 'lg'][i % 3]}
        />
      ))}

      {/* Floating emojis */}
      {emojis.map((emoji, i) => (
        <FloatingEmoji
          key={`emoji-${i}`}
          emoji={emoji}
          delay={i * 3}
          left={`${15 + i * (70 / emojis.length)}%`}
        />
      ))}

      {/* Candle glows */}
      {intensity !== 'light' && (
        <>
          <CandleGlow top="10%" left="5%" size={180} />
          <CandleGlow bottom="20%" right="10%" size={150} />
          {intensity === 'full' && <CandleGlow top="40%" right="5%" size={120} />}
        </>
      )}

      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// VICTORIAN CARD FRAME
// ═══════════════════════════════════════════════════════════

export function VictorianCard({ children, style, showCorners = true, glowColor }) {
  return (
    <View style={[styles.victorianCard, glowColor && COSMIC.shadowGlow(glowColor), style]}>
      {showCorners && (
        <>
          <View style={[styles.cornerOrnament, styles.topLeft]} />
          <View style={[styles.cornerOrnament, styles.topRight]} />
          <View style={[styles.cornerOrnament, styles.bottomLeft]} />
          <View style={[styles.cornerOrnament, styles.bottomRight]} />
        </>
      )}
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// VEILPATH SCREEN WRAPPER
// ═══════════════════════════════════════════════════════════

export function VeilPathScreen({
  children,
  showMoonPhases = true,
  intensity = 'medium',
  scrollable = true,
  style,
  contentStyle,
}) {
  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? {
        style: styles.scrollView,
        contentContainerStyle: [styles.scrollContent, contentStyle],
        showsVerticalScrollIndicator: false,
      }
    : { style: [styles.screenContent, contentStyle] };

  return (
    <SafeAreaView style={[styles.screen, style]}>
      <CosmicBackground intensity={intensity}>
        {showMoonPhases && <MoonPhases />}
        <Container {...containerProps}>
          {children}
        </Container>
      </CosmicBackground>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════
// COSMIC BUTTON
// ═══════════════════════════════════════════════════════════

export function CosmicButton({
  title,
  onPress,
  variant = 'primary', // primary, secondary, ghost
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  icon,
}) {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (variant === 'primary' && !disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [variant, disabled]);

  const variantStyles = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    ghost: styles.buttonGhost,
  };

  const sizeStyles = {
    sm: styles.buttonSm,
    md: styles.buttonMd,
    lg: styles.buttonLg,
  };

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.buttonBase,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && styles.buttonFullWidth,
          disabled && styles.buttonDisabled,
          style,
        ]}
      >
        <View style={styles.buttonShine} />
        {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
        <Text style={[
          styles.buttonText,
          variant === 'ghost' && styles.buttonTextGhost,
        ]}>
          {loading ? '...' : title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════

export function SectionHeader({ title, subtitle, icon, style }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      {icon && <Text style={styles.sectionIcon}>{icon}</Text>}
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// FEATURE PILL
// ═══════════════════════════════════════════════════════════

export function FeaturePill({ icon, text, style }) {
  return (
    <View style={[styles.pill, style]}>
      {icon && <Text style={styles.pillIcon}>{icon}</Text>}
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// COSMIC DIVIDER
// ═══════════════════════════════════════════════════════════

export function CosmicDivider({ style }) {
  return (
    <View style={[styles.divider, style]}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerSymbol}>✦</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Screen wrapper
  screen: {
    flex: 1,
    backgroundColor: COSMIC.midnightVoid,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 80,
  },
  screenContent: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
  },

  // Cosmic background
  cosmicBackground: {
    flex: 1,
    position: 'relative',
    ...(Platform.OS === 'web' ? {
      background: COSMIC.gradientCosmic,
    } : {
      backgroundColor: COSMIC.midnightVoid,
    }),
  },

  // Floating elements
  crystal: {
    position: 'absolute',
    backgroundColor: COSMIC.crystalPink,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 20,
  },
  candleGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 167, 38, 0.12)',
  },

  // Moon phases
  moonPhases: {
    position: 'absolute',
    top: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    zIndex: 5,
    opacity: 0.5,
  },
  moonEmoji: {
    fontSize: 18,
  },

  // Victorian card - disable backdrop-filter on Android Chrome (causes flashing)
  victorianCard: {
    backgroundColor: isAndroidChrome ? 'rgba(74, 20, 140, 0.85)' : COSMIC.gradientCard,
    ...(Platform.OS === 'web' && !isAndroidChrome ? {
      backdropFilter: COSMIC.blur,
      WebkitBackdropFilter: COSMIC.blur,
    } : {}),
    borderWidth: 1,
    borderColor: COSMIC.brassVictorian,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    marginBottom: 16,
  },
  cornerOrnament: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
    opacity: 0.5,
  },
  topLeft: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },

  // Buttons
  buttonBase: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonPrimary: {
    backgroundColor: COSMIC.candleFlame,
    ...COSMIC.shadowGlow(COSMIC.candleFlame),
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COSMIC.brassVictorian,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonSm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonMd: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonLg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttonIcon: {
    fontSize: 18,
  },
  buttonText: {
    color: '#1a1f3a',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  buttonTextGhost: {
    color: COSMIC.etherealCyan,
  },

  // Section header
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 3,
    color: COSMIC.moonGlow,
    fontFamily: Platform.OS === 'web' ? 'Cinzel, serif' : 'System',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 12,
    letterSpacing: 2,
    color: COSMIC.crystalPink,
    textTransform: 'uppercase',
    marginTop: 4,
    opacity: 0.7,
  },

  // Feature pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
  },
  pillIcon: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 12,
    color: COSMIC.moonGlow,
    opacity: 0.8,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COSMIC.brassVictorian,
    opacity: 0.3,
  },
  dividerSymbol: {
    marginHorizontal: 15,
    fontSize: 12,
    color: COSMIC.brassVictorian,
    opacity: 0.6,
  },
});

// ═══════════════════════════════════════════════════════════
// DYNAMIC THEME HOOK
// Provides COSMIC-compatible object based on current theme
// ═══════════════════════════════════════════════════════════

/**
 * Hook to get theme-aware COSMIC colors
 * Falls back to static COSMIC if ThemeContext is not available
 *
 * Usage:
 * const { colors, COSMIC } = useDynamicCOSMIC();
 */
export function useDynamicCOSMIC() {
  // Try to import ThemeContext dynamically
  // This allows components to work even without the provider
  try {
    // Dynamic require to avoid circular dependency
    const { useTheme } = require('../contexts/ThemeContext');
    const theme = useTheme();

    if (theme && theme.COSMIC) {
      return {
        colors: theme.colors,
        COSMIC: theme.COSMIC,
        isDark: theme.isDark,
        theme: theme.theme,
        currentThemeId: theme.currentThemeId,
      };
    }
  } catch (e) {
    // ThemeContext not available, fall back to static
  }

  // Fallback to static COSMIC
  return {
    colors: null,
    COSMIC,
    isDark: true,
    theme: null,
    currentThemeId: 'cosmic',
  };
}

/**
 * Create dynamic styles based on theme colors
 * @param {object} colors - Theme colors from useDynamicCOSMIC
 * @returns {object} StyleSheet-compatible styles
 */
export function createThemedStyles(colors) {
  if (!colors) {
    // Return default styles using static COSMIC
    return {
      background: COSMIC.midnightVoid,
      surface: COSMIC.gradientCard,
      text: COSMIC.moonGlow,
      textSecondary: COSMIC.crystalPink,
      accent: COSMIC.candleFlame,
      border: COSMIC.brassVictorian,
      glow: COSMIC.etherealCyan,
    };
  }

  return {
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    textSecondary: colors.textSecondary,
    accent: colors.accent,
    border: colors.border,
    glow: colors.glow,
  };
}

// ═══════════════════════════════════════════════════════════
// THEMED COMPONENTS
// Versions of components that use dynamic theming
// ═══════════════════════════════════════════════════════════

/**
 * Theme-aware VeilPathScreen
 * Automatically uses current theme colors
 */
export function ThemedVeilPathScreen(props) {
  const { COSMIC: themeColors } = useDynamicCOSMIC();

  return (
    <VeilPathScreen
      {...props}
      style={[{ backgroundColor: themeColors.midnightVoid }, props.style]}
    />
  );
}

/**
 * Theme-aware VictorianCard
 */
export function ThemedVictorianCard({ children, style, showCorners = true, glowColor, ...props }) {
  const { COSMIC: themeColors } = useDynamicCOSMIC();

  const themedStyle = {
    backgroundColor: isAndroidChrome ? 'rgba(74, 20, 140, 0.85)' : themeColors.gradientCard,
    borderColor: themeColors.brassVictorian,
  };

  return (
    <VictorianCard
      style={[themedStyle, style]}
      showCorners={showCorners}
      glowColor={glowColor || themeColors.etherealCyan}
      {...props}
    >
      {children}
    </VictorianCard>
  );
}

/**
 * Theme-aware CosmicButton
 */
export function ThemedCosmicButton(props) {
  const { COSMIC: themeColors } = useDynamicCOSMIC();

  // Override default colors with theme colors
  const buttonStyle = props.variant === 'primary'
    ? { backgroundColor: themeColors.candleFlame }
    : props.variant === 'secondary'
    ? { borderColor: themeColors.brassVictorian }
    : {};

  return (
    <CosmicButton
      {...props}
      style={[buttonStyle, props.style]}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export default {
  // Static (backward compatible)
  COSMIC,
  VeilPathScreen,
  VictorianCard,
  CosmicBackground,
  CosmicButton,
  CosmicDivider,
  SectionHeader,
  FeaturePill,
  FloatingCrystal,
  FloatingEmoji,
  CandleGlow,
  MoonPhases,

  // Dynamic (theme-aware)
  useDynamicCOSMIC,
  createThemedStyles,
  ThemedVeilPathScreen,
  ThemedVictorianCard,
  ThemedCosmicButton,
};
