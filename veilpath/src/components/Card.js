/**
 * Card Component
 * Reusable container with elevation and styling
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { THEME } from '../theme/theme';

/**
 * Card Component
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.variant - 'default' | 'elevated' | 'outline'
 * @param {string} props.padding - 'none' | 'sm' | 'base' | 'lg'
 * @param {Object} props.style - Custom styles
 */
export function Card({
  children,
  variant = 'default',
  padding = 'base',
  style,
}) {
  // Determine variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: THEME.colors.primary[800],
          ...THEME.shadows.base,
        };
      case 'elevated':
        return {
          backgroundColor: THEME.colors.primary[800],
          ...THEME.shadows.lg,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: THEME.colors.primary[700],
          ...THEME.shadows.none,
        };
      default:
        return {
          backgroundColor: THEME.colors.primary[800],
          ...THEME.shadows.base,
        };
    }
  };

  // Determine padding
  const getPaddingStyle = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: THEME.spacing[3] };
      case 'base':
        return { padding: THEME.spacing[4] };
      case 'lg':
        return { padding: THEME.spacing[6] };
      default:
        return { padding: THEME.spacing[4] };
    }
  };

  const variantStyles = getVariantStyles();
  const paddingStyle = getPaddingStyle();

  return (
    <View
      style={[
        styles.card,
        variantStyles,
        paddingStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.base,
    overflow: 'hidden',
  },
});

export default Card;
