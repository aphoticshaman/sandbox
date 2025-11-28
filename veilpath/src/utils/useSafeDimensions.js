/**
 * useSafeDimensions - Simple wrapper for useWindowDimensions
 *
 * Provides responsive screen dimensions for the app.
 * Works with React 19 thanks to dimension pre-initialization in App.js.
 */

import { useWindowDimensions } from 'react-native';

export function useSafeDimensions() {
  // Dimensions are pre-initialized before React Navigation loads (see pre-init-dimensions.js)
  return useWindowDimensions();
}
