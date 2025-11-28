/**
 * NEON TEXT COMPONENT
 * Renders text with neon glow effect for cyberpunk aesthetic
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';

export default function NeonText({ children, color = '#00F0FF', style, ...props }) {
  return (
    <Text
      style={[
        styles.neonText,
        { color },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  neonText: {
    fontFamily: 'monospace',
    fontSize: 16,
    textShadowColor: 'currentColor',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
});
