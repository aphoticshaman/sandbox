/**
 * AssetButton - Animated button component with CSS-based styling
 * No external image assets required - uses styled fallbacks
 * Supports press animations, glow effects, and haptic feedback
 */

import React, { useRef } from 'react';
import { TouchableOpacity, View, Text, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

// Button style configurations (replaces image assets)
const BUTTON_STYLES = {
  // Main action buttons
  gold_sun: { bg: '#FFD700', border: '#B8860B', icon: '☀️', glow: '#FFD700' },
  purple_crystal: { bg: '#9B59B6', border: '#6C3483', icon: '💎', glow: '#9B59B6' },
  cyan_tech: { bg: '#00CED1', border: '#008B8B', icon: '⚡', glow: '#00CED1' },
  purple_moon: { bg: '#8E44AD', border: '#5B2C6F', icon: '🌙', glow: '#8E44AD' },
  purple_skull: { bg: '#6C3483', border: '#4A235A', icon: '💀', glow: '#6C3483' },
  gold_goddess: { bg: '#DAA520', border: '#B8860B', icon: '👑', glow: '#DAA520' },
  gold_wolf: { bg: '#CD853F', border: '#8B4513', icon: '🐺', glow: '#CD853F' },
  cyan_diamond: { bg: '#00FFFF', border: '#00CED1', icon: '◆', glow: '#00FFFF' },
  cyan_portal: { bg: '#20B2AA', border: '#008080', icon: '🌀', glow: '#20B2AA' },
  gold_blank: { bg: '#FFD700', border: '#B8860B', icon: '', glow: '#FFD700' },
  cyan_crystal: { bg: '#00CED1', border: '#008B8B', icon: '🔮', glow: '#00CED1' },
  purple_flame: { bg: '#9932CC', border: '#6B238E', icon: '🔥', glow: '#9932CC' },
  purple_circuit: { bg: '#8A2BE2', border: '#5B2C6F', icon: '⚙️', glow: '#8A2BE2' },
  gold_triangle: { bg: '#FFD700', border: '#B8860B', icon: '△', glow: '#FFD700' },
  blue_star: { bg: '#4169E1', border: '#27408B', icon: '⭐', glow: '#4169E1' },
  purple_eye: { bg: '#9400D3', border: '#6B238E', icon: '👁️', glow: '#9400D3' },

  // Navigation icons
  hex_star: { bg: '#8A2BE2', border: '#5B2C6F', icon: '✦', glow: '#8A2BE2' },
  diamond_star: { bg: '#00FFFF', border: '#00CED1', icon: '✧', glow: '#00FFFF' },
  circle_target: { bg: '#FF4500', border: '#CC3700', icon: '◎', glow: '#FF4500' },
  wind: { bg: '#87CEEB', border: '#5F9EA0', icon: '💨', glow: '#87CEEB' },
  gear_hex: { bg: '#708090', border: '#4A5568', icon: '⚙️', glow: '#708090' },
  compass: { bg: '#DAA520', border: '#B8860B', icon: '🧭', glow: '#DAA520' },
  target: { bg: '#FF4500', border: '#CC3700', icon: '🎯', glow: '#FF4500' },
  close_x: { bg: '#DC143C', border: '#8B0000', icon: '✕', glow: '#DC143C' },
  infinity: { bg: '#8A2BE2', border: '#5B2C6F', icon: '∞', glow: '#8A2BE2' },
  heart: { bg: '#FF69B4', border: '#DB7093', icon: '♥', glow: '#FF69B4' },
  hourglass: { bg: '#DAA520', border: '#B8860B', icon: '⏳', glow: '#DAA520' },
  crystal: { bg: '#E6E6FA', border: '#9370DB', icon: '💠', glow: '#E6E6FA' },
  crosshair: { bg: '#00FF7F', border: '#00CD66', icon: '⊕', glow: '#00FF7F' },
  star_burst: { bg: '#FFD700', border: '#B8860B', icon: '✴', glow: '#FFD700' },
  clover: { bg: '#228B22', border: '#006400', icon: '☘️', glow: '#228B22' },
  scroll: { bg: '#DEB887', border: '#8B4513', icon: '📜', glow: '#DEB887' },
};

export default function AssetButton({
  buttonId, // e.g. 'gold_sun', 'gear_hex'
  onPress,
  size = 80,
  disabled = false,
  enableHaptics = true,
  glowColor, // Optional custom glow color
  style,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  const buttonStyle = BUTTON_STYLES[buttonId];

  if (!buttonStyle) {
    console.warn(`[AssetButton] Button "${buttonId}" not found, using default`);
    // Fallback style
  }

  const { bg, border, icon, glow } = buttonStyle || {
    bg: '#8A2BE2',
    border: '#5B2C6F',
    icon: '•',
    glow: '#8A2BE2',
  };

  const handlePressIn = () => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale down + glow up animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(glowAnim, {
        toValue: 1.5,
        useNativeDriver: true,
        speed: 50,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    // Return to normal
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 100,
      }),
      Animated.spring(glowAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 100,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (onPress && !disabled) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: glowColor || glow,
            transform: [{ scale: glowAnim }],
            opacity: glowAnim.interpolate({
              inputRange: [1, 1.5],
              outputRange: [0, 0.5],
            }),
          },
        ]}
      />

      {/* Main button */}
      <Animated.View
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            borderColor: border,
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <Text style={[styles.buttonIcon, { fontSize: size * 0.4 }]}>
          {icon}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonIcon: {
    textAlign: 'center',
  },
});

// ═══════════════════════════════════════════════════════════
// PRE-CONFIGURED BUTTON COMPONENTS
// ═══════════════════════════════════════════════════════════

// Primary action buttons
export function StartReadingButton({ onPress, size = 90, style }) {
  return (
    <AssetButton
      buttonId="gold_sun"
      onPress={onPress}
      size={size}
      style={style}
    />
  );
}

export function MagicActionButton({ onPress, size = 80, style }) {
  return (
    <AssetButton
      buttonId="purple_crystal"
      onPress={onPress}
      size={size}
      style={style}
    />
  );
}

export function MoonlightButton({ onPress, size = 60, style }) {
  return (
    <AssetButton
      buttonId="purple_moon"
      onPress={onPress}
      size={size}
      style={style}
    />
  );
}

export function VeilShardsButton({ onPress, size = 60, style }) {
  return (
    <AssetButton
      buttonId="cyan_diamond"
      onPress={onPress}
      size={size}
      style={style}
    />
  );
}

// Navigation buttons
export function SettingsButton({ onPress, size = 50, style }) {
  return (
    <AssetButton
      buttonId="gear_hex"
      onPress={onPress}
      size={size}
      style={style}
    />
  );
}

export function BackButton({ onPress, size = 40, style }) {
  return (
    <AssetButton
      buttonId="close_x"
      onPress={onPress}
      size={size}
      style={style}
    />
  );
}

export function AchievementsButton({ onPress, size = 50, style }) {
  return (
    <AssetButton
      buttonId="diamond_star"
      onPress={onPress}
      size={size}
      style={style}
    />
  );
}

export function JournalButton({ onPress, size = 50, style }) {
  return (
    <AssetButton
      buttonId="scroll"
      onPress={onPress}
      size={size}
      style={style}
    />
  );
}
