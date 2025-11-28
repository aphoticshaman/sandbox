/**
 * TEMPORARY STUBS FOR ARCHIVED COMPONENTS
 *
 * Placeholder components to replace archived cyberpunk/AGI components
 * These are NON-FUNCTIONAL stubs that prevent bundling errors
 *
 * TODO Phase 4: Replace with proper dark fantasy components or remove
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

// Archived component stubs - return simple placeholders
export const AnimatedASCIIText = ({ children, ...props }) => (
  <Text {...props}>{children}</Text>
);

export const GlitchParticles = ({ children }) => (
  <View>{children}</View>
);

export const EncryptedTextReveal = ({ text, revealed, ...props }) => (
  <Text {...props}>{revealed ? text : '***'}</Text>
);

export const AnticipationOverlay = ({ visible, children }) => (
  visible ? <View>{children || <ActivityIndicator />}</View> : null
);

export const PacManLoader = () => (
  <ActivityIndicator color="#8a2be2" />
);

export const CyberpunkCard = ({ children, style, ...props }) => (
  <View style={[{ padding: 15, borderRadius: 8, backgroundColor: '#1a1a2e' }, style]} {...props}>
    {children}
  </View>
);

export default {
  AnimatedASCIIText,
  GlitchParticles,
  EncryptedTextReveal,
  AnticipationOverlay,
  PacManLoader,
  CyberpunkCard,
};
