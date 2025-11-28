/**
 * Loading Screen Component
 * Full-screen loading indicator with optional message
 *
 * Usage:
 * <LoadingScreen message="Loading your data..." />
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { THEME } from '../theme/theme';

export default function LoadingScreen({ message = 'Loading...', size = 'large' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={THEME.colors.accent[400]} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.neutral[1000],
    padding: THEME.spacing[4],
  },
  message: {
    marginTop: THEME.spacing[4],
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.neutral[400],
    textAlign: 'center',
  },
});
