/**
 * TEMPORARY TEXT COMPONENTS
 *
 * Placeholder components to replace archived TerminalEffects
 * These provide basic colored text until Phase 4 when we apply
 * the full dark fantasy aesthetic.
 *
 * TODO Phase 4: Replace with proper dark fantasy styled components
 */

import React from 'react';
import { Text, View } from 'react-native';

// Temporary colors (will replace with dark fantasy palette from styles/colors.js)
export const NEON_COLORS = {
  primary: '#8a2be2',      // Violet
  secondary: '#00ffff',    // Cyan
  accent: '#d4af37',       // Gold
  success: '#00ff00',      // Green
  error: '#ff0000',        // Red
  warning: '#ffa500',      // Orange
};

// Basic colored text components
export const NeonText = ({ children, style, ...props }) => (
  <Text style={[{ color: NEON_COLORS.primary }, style]} {...props}>
    {children}
  </Text>
);

export const LPMUDText = ({ children, style, ...props }) => (
  <Text style={[{ color: NEON_COLORS.secondary }, style]} {...props}>
    {children}
  </Text>
);

export const GlitchText = ({ children, style, ...props }) => (
  <Text style={[{ color: '#ff00ff' }, style]} {...props}>
    {children}
  </Text>
);

export const FlickerText = ({ children, style, ...props }) => (
  <Text style={[{ color: NEON_COLORS.accent }, style]} {...props}>
    {children}
  </Text>
);

export const ScanLines = ({ children }) => (
  <View>{children}</View>
);

export const MatrixRain = ({ children }) => (
  <View>{children}</View>
);

export const CRTEffect = ({ children }) => (
  <View>{children}</View>
);
