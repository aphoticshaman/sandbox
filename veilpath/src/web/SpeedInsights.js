/**
 * VERCEL SPEED INSIGHTS
 * Real User Monitoring (RUM) for web performance
 *
 * Vercel Pro feature - tracks Core Web Vitals:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';

// Only load on web
let injectSpeedInsights = null;
if (Platform.OS === 'web') {
  try {
    const speedInsights = require('@vercel/speed-insights');
    injectSpeedInsights = speedInsights.injectSpeedInsights;
  } catch (e) {
    console.warn('[SpeedInsights] Failed to load:', e);
  }
}

/**
 * Speed Insights component - add to app root
 * Only renders on web, no-op on native
 */
export function SpeedInsights() {
  useEffect(() => {
    if (Platform.OS === 'web' && injectSpeedInsights) {
      try {
        injectSpeedInsights({
          // Enable debug mode in development
          debug: process.env.NODE_ENV === 'development',
        });
        console.log('[SpeedInsights] Initialized');
      } catch (e) {
        console.warn('[SpeedInsights] Init failed:', e);
      }
    }
  }, []);

  // No visual component needed
  return null;
}

export default SpeedInsights;
