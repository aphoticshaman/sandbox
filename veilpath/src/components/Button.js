/**
 * Button Component
 * Reusable button with variants, sizes, and states
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '../theme/theme';

/**
 * Button Component
 *
 * @param {Object} props
 * @param {Function} props.onPress - Press handler
 * @param {string} props.title - Button text
 * @param {string} props.variant - 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'
 * @param {string} props.size - 'sm' | 'base' | 'lg'
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.fullWidth - Full width button
 * @param {Object} props.style - Custom styles
 */
export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'base',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) {
  // Determine colors based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: THEME.colors.primary[600],
          borderColor: THEME.colors.primary[600],
          textColor: THEME.colors.neutral[0],
        };
      case 'secondary':
        return {
          backgroundColor: THEME.colors.secondary[600],
          borderColor: THEME.colors.secondary[600],
          textColor: THEME.colors.neutral[0],
        };
      case 'accent':
        return {
          backgroundColor: THEME.colors.accent[600],
          borderColor: THEME.colors.accent[600],
          textColor: THEME.colors.neutral[1000],
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: THEME.colors.primary[600],
          textColor: THEME.colors.primary[400],
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: THEME.colors.primary[400],
        };
      default:
        return {
          backgroundColor: THEME.colors.primary[600],
          borderColor: THEME.colors.primary[600],
          textColor: THEME.colors.neutral[0],
        };
    }
  };

  // Determine sizes
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: THEME.spacing[2],
          paddingHorizontal: THEME.spacing[4],
          fontSize: THEME.typography.sizes.sm,
          minHeight: 36,
        };
      case 'base':
        return {
          paddingVertical: THEME.spacing[3],
          paddingHorizontal: THEME.spacing[6],
          fontSize: THEME.typography.sizes.base,
          minHeight: 44,
        };
      case 'lg':
        return {
          paddingVertical: THEME.spacing[4],
          paddingHorizontal: THEME.spacing[8],
          fontSize: THEME.typography.sizes.lg,
          minHeight: 52,
        };
      default:
        return {
          paddingVertical: THEME.spacing[3],
          paddingHorizontal: THEME.spacing[6],
          fontSize: THEME.typography.sizes.base,
          minHeight: 44,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      minHeight: sizeStyles.minHeight,
    },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: variantStyles.textColor,
      fontSize: sizeStyles.fontSize,
    },
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: THEME.borderRadius.base,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadows.sm,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default Button;
