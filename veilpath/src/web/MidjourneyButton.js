/**
 * STYLED BUTTON COMPONENTS
 * Premium-looking buttons using CSS styling
 * (Button assets not yet available - using styled fallback)
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';

/**
 * Button Variants:
 * - goddess: Gold gradient (primary CTA)
 * - wolf: Gold gradient (strength/power actions)
 * - sun: Gold gradient (enlightenment/wisdom)
 * - crystal: Cyan gradient (secondary actions)
 * - portal: Cyan gradient (navigation)
 * - star: Blue gradient (achievements)
 */

const BUTTON_STYLES = {
  goddess: {
    gradient: ['#FFD700', '#B8860B'],
    text: '#1A0A2E',
    shadow: '#FFD700',
    border: '#FFD700',
  },
  wolf: {
    gradient: ['#FFD700', '#B8860B'],
    text: '#1A0A2E',
    shadow: '#FFD700',
    border: '#FFD700',
  },
  sun: {
    gradient: ['#FFD700', '#B8860B'],
    text: '#1A0A2E',
    shadow: '#FFD700',
    border: '#FFD700',
  },
  triangle: {
    gradient: ['#FFD700', '#B8860B'],
    text: '#1A0A2E',
    shadow: '#FFD700',
    border: '#FFD700',
  },
  crystal: {
    gradient: ['#00CED1', '#008B8B'],
    text: '#FFFFFF',
    shadow: '#00FFFF',
    border: '#00FFFF',
  },
  portal: {
    gradient: ['#00CED1', '#008B8B'],
    text: '#FFFFFF',
    shadow: '#00FFFF',
    border: '#00FFFF',
  },
  star: {
    gradient: ['#4169E1', '#191970'],
    text: '#FFFFFF',
    shadow: '#4169E1',
    border: '#6495ED',
  },
  diamond: {
    gradient: ['#00CED1', '#008B8B'],
    text: '#FFFFFF',
    shadow: '#00FFFF',
    border: '#00FFFF',
  },
};

export function MidjourneyButton({
  variant = 'goddess',
  title,
  onPress,
  disabled = false,
  size = 'medium',
  style,
}) {
  const colorStyle = BUTTON_STYLES[variant] || BUTTON_STYLES.goddess;

  const sizeStyles = {
    small: { paddingVertical: 10, paddingHorizontal: 20, fontSize: 12 },
    medium: { paddingVertical: 14, paddingHorizontal: 30, fontSize: 16 },
    large: { paddingVertical: 18, paddingHorizontal: 40, fontSize: 20 },
  };

  const dimensions = sizeStyles[size];

  const webGradient = Platform.OS === 'web'
    ? { background: `linear-gradient(135deg, ${colorStyle.gradient[0]} 0%, ${colorStyle.gradient[1]} 100%)` }
    : { backgroundColor: colorStyle.gradient[0] };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          paddingVertical: dimensions.paddingVertical,
          paddingHorizontal: dimensions.paddingHorizontal,
          borderColor: disabled ? '#666' : colorStyle.border,
          shadowColor: colorStyle.shadow,
          opacity: disabled ? 0.5 : 1,
        },
        webGradient,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          {
            fontSize: dimensions.fontSize,
            color: disabled ? '#999' : colorStyle.text,
            textShadowColor: disabled ? 'transparent' : colorStyle.shadow,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// Convenience components for common button types
export function PrimaryButton(props) {
  return <MidjourneyButton variant="goddess" {...props} />;
}

export function SecondaryButton(props) {
  return <MidjourneyButton variant="crystal" {...props} />;
}

export function ActionButton(props) {
  return <MidjourneyButton variant="wolf" {...props} />;
}

export function NavigationButton(props) {
  return <MidjourneyButton variant="portal" size="small" {...props} />;
}

export function AchievementButton(props) {
  return <MidjourneyButton variant="star" size="small" {...props} />;
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    fontWeight: '800',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    textTransform: 'uppercase',
  },
});

export default MidjourneyButton;
