/**
 * SkiaAnimationHelpers - Common animation patterns for Skia + Reanimated
 *
 * This file provides reusable animation functions that work with Reanimated shared values
 * and can be used with Skia components.
 *
 * STATUS: ACTIVE - Dependencies installed ✅
 */

import {
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn = (sharedValue, duration = 300, delay = 0) => {
  'worklet';
  sharedValue.value = withDelay(
    delay,
    withTiming(1, { duration, easing: Easing.inOut(Easing.ease) })
  );
};

export const fadeOut = (sharedValue, duration = 300, delay = 0) => {
  'worklet';
  sharedValue.value = withDelay(
    delay,
    withTiming(0, { duration, easing: Easing.inOut(Easing.ease) })
  );
};

export const fadePulse = (sharedValue, fromValue = 0.3, toValue = 1, duration = 1500) => {
  'worklet';
  sharedValue.value = fromValue;
  sharedValue.value = withRepeat(
    withSequence(
      withTiming(toValue, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
      withTiming(fromValue, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
    ),
    -1, // Infinite
    false
  );
};

// ============================================================================
// MOVEMENT ANIMATIONS
// ============================================================================

export const floatUp = (sharedValue, startY, endY, duration = 15000, delay = 0) => {
  'worklet';
  sharedValue.value = startY;
  sharedValue.value = withDelay(
    delay,
    withRepeat(
      withTiming(endY, { duration, easing: Easing.linear }),
      -1, // Infinite
      false
    )
  );
};

export const floatDown = (sharedValue, startY, endY, duration = 15000, delay = 0) => {
  'worklet';
  sharedValue.value = startY;
  sharedValue.value = withDelay(
    delay,
    withRepeat(
      withTiming(endY, { duration, easing: Easing.linear }),
      -1,
      false
    )
  );
};

export const slideInFromLeft = (sharedValue, screenWidth, duration = 500, delay = 0) => {
  'worklet';
  sharedValue.value = -screenWidth;
  sharedValue.value = withDelay(
    delay,
    withTiming(0, { duration, easing: Easing.out(Easing.ease) })
  );
};

export const slideInFromRight = (sharedValue, screenWidth, duration = 500, delay = 0) => {
  'worklet';
  sharedValue.value = screenWidth;
  sharedValue.value = withDelay(
    delay,
    withTiming(0, { duration, easing: Easing.out(Easing.ease) })
  );
};

export const bounce = (sharedValue, startValue, endValue, duration = 1000) => {
  'worklet';
  sharedValue.value = startValue;
  sharedValue.value = withRepeat(
    withSpring(endValue, {
      damping: 2,
      stiffness: 100,
    }),
    -1,
    true // Reverse
  );
};

// ============================================================================
// ROTATION ANIMATIONS
// ============================================================================

export const rotate360 = (sharedValue, duration = 2000, delay = 0) => {
  'worklet';
  sharedValue.value = 0;
  sharedValue.value = withDelay(
    delay,
    withRepeat(
      withTiming(360, { duration, easing: Easing.linear }),
      -1,
      false
    )
  );
};

export const rotateSwing = (sharedValue, fromAngle = -15, toAngle = 15, duration = 2000) => {
  'worklet';
  sharedValue.value = fromAngle;
  sharedValue.value = withRepeat(
    withSequence(
      withTiming(toAngle, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
      withTiming(fromAngle, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    false
  );
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleIn = (sharedValue, duration = 300, delay = 0) => {
  'worklet';
  sharedValue.value = 0;
  sharedValue.value = withDelay(
    delay,
    withSpring(1, { damping: 10, stiffness: 100 })
  );
};

export const scaleOut = (sharedValue, duration = 300, delay = 0) => {
  'worklet';
  sharedValue.value = 1;
  sharedValue.value = withDelay(
    delay,
    withTiming(0, { duration, easing: Easing.inOut(Easing.ease) })
  );
};

export const scalePulse = (sharedValue, fromScale = 0.95, toScale = 1.05, duration = 1000) => {
  'worklet';
  sharedValue.value = fromScale;
  sharedValue.value = withRepeat(
    withSequence(
      withTiming(toScale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
      withTiming(fromScale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    false
  );
};

// ============================================================================
// COMPOSITE ANIMATIONS
// ============================================================================

export const rippleEffect = (scaleValue, opacityValue, duration = 600) => {
  'worklet';
  scaleValue.value = 0;
  opacityValue.value = 0.6;

  scaleValue.value = withTiming(2, { duration, easing: Easing.out(Easing.ease) });
  opacityValue.value = withTiming(0, { duration, easing: Easing.out(Easing.ease) });
};

export const shimmer = (positionValue, containerWidth, duration = 2000) => {
  'worklet';
  positionValue.value = -containerWidth;
  positionValue.value = withRepeat(
    withSequence(
      withTiming(containerWidth * 2, { duration, easing: Easing.linear }),
      withDelay(500, withTiming(containerWidth * 2, { duration: 0 }))
    ),
    -1,
    false
  );
};

// ============================================================================
// UTILITIES
// ============================================================================

export const stopAnimation = (sharedValue, finalValue = 0) => {
  'worklet';
  cancelAnimation(sharedValue);
  sharedValue.value = finalValue;
};

export const resetAnimation = (sharedValue, initialValue = 0) => {
  'worklet';
  cancelAnimation(sharedValue);
  sharedValue.value = initialValue;
};

// ============================================================================
// EASING PRESETS
// ============================================================================

export const easings = {
  // Standard easings
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),

  // Bezier easings (material design)
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),

  // Bounce
  bounce: Easing.bounce,

  // Elastic
  elastic: Easing.elastic(1),

  // Back
  back: Easing.back(1.5),
};

// ============================================================================
// DURATION PRESETS
// ============================================================================

export const durations = {
  instant: 0,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};
