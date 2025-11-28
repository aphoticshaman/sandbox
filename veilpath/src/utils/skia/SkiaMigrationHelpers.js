/**
 * SkiaMigrationHelpers - Utilities for migrating from React Native Animated to Skia
 *
 * This file provides helper functions to make migration easier:
 * - Convert Animated.Value patterns to Reanimated shared values
 * - Map Animated timing configurations to Reanimated equivalents
 * - Debug utilities to compare old vs new animations
 *
 * STATUS: PARTIAL - Some utilities don't require Skia
 *
 * TODO: Add Skia-specific helpers when dependencies installed
 */

// ============================================================================
// TIMING CONFIGURATION CONVERTERS
// ============================================================================

/**
 * Convert React Native Animated.timing config to Reanimated withTiming config
 *
 * Usage:
 * ```
 * // OLD:
 * Animated.timing(value, {
 *   toValue: 1,
 *   duration: 300,
 *   easing: Easing.inOut(Easing.ease),
 *   useNativeDriver: true,
 * }).start();
 *
 * // NEW:
 * value.value = withTiming(1, convertTimingConfig({
 *   duration: 300,
 *   easing: Easing.inOut(Easing.ease),
 * }));
 * ```
 */
export function convertTimingConfig(animatedConfig) {
  const reanimatedConfig = {
    duration: animatedConfig.duration || 300,
  };

  if (animatedConfig.easing) {
    reanimatedConfig.easing = animatedConfig.easing;
  }

  // Note: useNativeDriver is implicit in Reanimated (always true)
  // delay is handled with withDelay wrapper

  return reanimatedConfig;
}

/**
 * Convert React Native Animated.spring config to Reanimated withSpring config
 */
export function convertSpringConfig(animatedConfig) {
  const reanimatedConfig = {};

  // Map property names
  if (animatedConfig.friction !== undefined) {
    reanimatedConfig.damping = animatedConfig.friction;
  }
  if (animatedConfig.tension !== undefined) {
    reanimatedConfig.stiffness = animatedConfig.tension;
  }
  if (animatedConfig.velocity !== undefined) {
    reanimatedConfig.velocity = animatedConfig.velocity;
  }
  if (animatedConfig.mass !== undefined) {
    reanimatedConfig.mass = animatedConfig.mass;
  }

  return reanimatedConfig;
}

// ============================================================================
// ANIMATION PATTERN MAPPERS
// ============================================================================

/**
 * Migration checklist for a component
 *
 * Usage:
 * ```
 * const checklist = createMigrationChecklist('FloatingParticle');
 * checklist.check('Replace Animated.Value with useSharedValue');
 * checklist.check('Replace Animated.timing with withTiming');
 * checklist.report();
 * ```
 */
export function createMigrationChecklist(componentName) {
  const items = [];

  return {
    check: (item) => {
      items.push({ item, checked: true });
    },
    skip: (item, reason) => {
      items.push({ item, checked: false, reason });
    },
    report: () => {
      const total = items.length;
      const completed = items.filter(i => i.checked).length;
      return { total, completed, percentage: completed/total };
    },
    items,
  };
}

/**
 * Common animation patterns and their Skia equivalents
 */
export const migrationPatterns = {
  fadeIn: {
    old: `
      const opacity = useRef(new Animated.Value(0)).current;
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // ... <Animated.View style={{ opacity }} />
    `,
    new: `
      const opacity = useSharedValue(0);
      opacity.value = withTiming(1, { duration: 300 });
      // ... <Circle opacity={opacity} />
    `,
  },

  float: {
    old: `
      const translateY = useRef(new Animated.Value(0)).current;
      Animated.loop(
        Animated.timing(translateY, {
          toValue: -100,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      // ... <Animated.View style={{ transform: [{ translateY }] }} />
    `,
    new: `
      const y = useSharedValue(startY);
      y.value = withRepeat(
        withTiming(endY, { duration: 15000, easing: Easing.linear }),
        -1,
        false
      );
      // ... <Circle cy={y} />
    `,
  },

  pulse: {
    old: `
      const scale = useRef(new Animated.Value(1)).current;
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.2, duration: 750 }),
          Animated.timing(scale, { toValue: 1, duration: 750 }),
        ])
      ).start();
      // ... <Animated.View style={{ transform: [{ scale }] }} />
    `,
    new: `
      const scale = useSharedValue(1);
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 750 }),
          withTiming(1, { duration: 750 })
        ),
        -1,
        false
      );
      // ... <Group transform={[{ scale }]}><Circle /></Group>
    `,
  },
};

/**
 * Print migration pattern
 */
export function printMigrationPattern(patternName) {
  const pattern = migrationPatterns[patternName];
  if (!pattern) {
    console.error(`Pattern "${patternName}" not found`);
    return;
  }

}

// ============================================================================
// PERFORMANCE COMPARISON UTILITIES
// ============================================================================

/**
 * Measure animation performance
 *
 * Usage:
 * ```
 * const perf = createPerformanceMonitor('FloatingParticle');
 * perf.startFrame();
 * // ... render code
 * perf.endFrame();
 * perf.report(); // After N frames
 * ```
 */
export function createPerformanceMonitor(componentName) {
  const frameTimes = [];
  let startTime = null;

  return {
    startFrame: () => {
      startTime = performance.now();
    },
    endFrame: () => {
      if (startTime) {
        const frameTime = performance.now() - startTime;
        frameTimes.push(frameTime);
        startTime = null;
      }
    },
    report: () => {
      if (frameTimes.length === 0) {
        return;
      }

      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = 1000 / avgFrameTime;
      const minFrameTime = Math.min(...frameTimes);
      const maxFrameTime = Math.max(...frameTimes);


      return { avgFrameTime, fps, minFrameTime, maxFrameTime };
    },
    reset: () => {
      frameTimes.length = 0;
      startTime = null;
    },
  };
}

// ============================================================================
// DEBUGGING UTILITIES
// ============================================================================

/**
 * Log animation value changes for debugging
 */
export function debugAnimationValue(name, value, interval = 100) {
  let lastLog = 0;

  return () => {
    const now = Date.now();
    if (now - lastLog >= interval) {
      lastLog = now;
    }
  };
}

/**
 * Compare old vs new implementation side-by-side
 */
export function createComparisonTest(componentName, oldComponent, newComponent) {

  return {
    old: oldComponent,
    new: newComponent,
  };
}

// ============================================================================
// MIGRATION CHECKLIST TEMPLATES
// ============================================================================

export const migrationSteps = {
  visualEffect: [
    'Replace Animated.Value with useSharedValue',
    'Replace Animated.timing with withTiming',
    'Replace Animated.spring with withSpring',
    'Replace Animated.loop with withRepeat',
    'Replace Animated.sequence with withSequence',
    'Replace Animated.View with Skia components (Circle, Rect, Path, etc.)',
    'Update style props to Skia props (transform → transform array, etc.)',
    'Import useSkiaDimensions instead of useSafeDimensions',
    'Wrap component in Canvas (if not already)',
    'Test animation smoothness',
    'Verify no Hermes errors',
    'Performance profiling (target 60 FPS)',
  ],

  simpleComponent: [
    'Update import from useSafeDimensions to useSkiaDimensions',
    'Update import path to SkiaDimensionsContext',
    'Test responsive behavior',
    'Verify no console errors',
  ],

  cardAnimation: [
    'Replace Animated.Value with useSharedValue',
    'Convert 3D transforms to 2D Skia equivalents (or use hybrid approach)',
    'Replace card images with Skia Image components',
    'Update timing/spring configs',
    'Test card flip/shuffle animations',
    'Verify card interaction gestures work',
    'Performance profiling',
  ],
};

/**
 * Generate migration checklist for a component type
 */
export function generateChecklist(componentName, componentType = 'visualEffect') {
  const steps = migrationSteps[componentType];
  if (!steps) {
    console.error(`Component type "${componentType}" not found`);
    return null;
  }

  const checklist = createMigrationChecklist(componentName);

  steps.forEach((step, index) => {
  });

  return checklist;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  convertTimingConfig,
  convertSpringConfig,
  createMigrationChecklist,
  migrationPatterns,
  printMigrationPattern,
  createPerformanceMonitor,
  debugAnimationValue,
  createComparisonTest,
  migrationSteps,
  generateChecklist,
};
