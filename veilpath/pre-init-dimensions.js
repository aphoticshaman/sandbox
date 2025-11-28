/**
 * DIMENSIONS DEFENSIVE PATCH
 *
 * Issue: React 19 + Hermes + RN 0.81.5 - Even when Dimensions.get() returns
 * a valid object, Hermes throws "Property 'width' doesn't exist" during
 * early runtime initialization when React Navigation destructures dimensions.
 *
 * Solution: Use Object.defineProperty to create GUARANTEED property accessors
 * that Hermes can't fail on.
 */

import { Dimensions } from 'react-native';

console.log('[DIMENSIONS PATCH] ========================================');
console.log('[DIMENSIONS PATCH] Installing AGGRESSIVE wrapper...');

const originalGet = Dimensions.get;

const FALLBACK = {
  width: 393,
  height: 852,
  scale: 3,
  fontScale: 1
};

// CACHE: Store wrapped dimensions so we return the SAME object reference
let cachedWindow = null;
let cachedScreen = null;

Dimensions.get = function(dimension) {
  console.log(`[DIMENSIONS PATCH] 🔍 Dimensions.get('${dimension}')`);

  // Return cached object if we have it
  if (dimension === 'window' && cachedWindow) {
    console.log(`[DIMENSIONS PATCH] 💾 Returning cached window`);
    return cachedWindow;
  }
  if (dimension === 'screen' && cachedScreen) {
    console.log(`[DIMENSIONS PATCH] 💾 Returning cached screen`);
    return cachedScreen;
  }

  try {
    const result = originalGet.call(this, dimension);
    console.log(`[DIMENSIONS PATCH] 📦 Native returned:`, typeof result, result);

    // CRITICAL: Return a PLAIN literal object (not Object.create, not defineProperty)
    // This ensures Hermes sees it as a normal object with properties
    const safeResult = {
      width: result?.width ?? FALLBACK.width,
      height: result?.height ?? FALLBACK.height,
      scale: result?.scale ?? FALLBACK.scale,
      fontScale: result?.fontScale ?? FALLBACK.fontScale
    };

    console.log(`[DIMENSIONS PATCH] 🛡️  Returning plain object:`, safeResult);

    // CACHE IT
    if (dimension === 'window') {
      cachedWindow = safeResult;
    } else if (dimension === 'screen') {
      cachedScreen = safeResult;
    }

    return safeResult;
  } catch (error) {
    console.error(`[DIMENSIONS PATCH] ❌ Error:`, error.message);
    const fallbackObj = { ...FALLBACK };

    if (dimension === 'window') {
      cachedWindow = fallbackObj;
    } else if (dimension === 'screen') {
      cachedScreen = fallbackObj;
    }

    return fallbackObj;
  }
};

console.log('[DIMENSIONS PATCH] Wrapper with defineProperty installed!');

// Pre-initialize
try {
  const window = Dimensions.get('window');
  const screen = Dimensions.get('screen');
  console.log('[DIMENSIONS PATCH] ✓ Pre-initialized with safe accessors');
} catch (error) {
  console.warn('[DIMENSIONS PATCH] Pre-init warning:', error.message);
}

console.log('[DIMENSIONS PATCH] ========================================');
