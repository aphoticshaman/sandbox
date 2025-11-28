/**
 * PhiTiming.js - Golden Ratio Timing Utilities
 *
 * The golden ratio (φ = 1.618033988749895) creates aesthetically pleasing
 * and neurologically harmonious timing intervals. This module provides
 * timing constants and utilities for animations, breathing exercises,
 * and UI interactions that feel natural and flowing.
 *
 * Research basis: Golden ratio proportions appear throughout nature and
 * are processed more efficiently by human perception systems.
 */

// ═══════════════════════════════════════════════════════════
// CORE CONSTANTS
// ═══════════════════════════════════════════════════════════

export const PHI = 1.618033988749895;
export const PHI_INVERSE = 0.618033988749895; // 1/φ = φ - 1
export const PHI_SQUARED = 2.618033988749895; // φ²

// ═══════════════════════════════════════════════════════════
// TIMING INTERVALS (milliseconds)
// ═══════════════════════════════════════════════════════════

export const TIMING = {
  // Micro-interactions (instant feedback)
  HAPTIC_PULSE: Math.round(1000 * Math.pow(PHI_INVERSE, 5)),    // ~90ms
  BUTTON_PRESS: Math.round(1000 * Math.pow(PHI_INVERSE, 4)),    // ~146ms

  // Quick transitions
  MICRO_TRANSITION: Math.round(1000 * Math.pow(PHI_INVERSE, 3)), // ~236ms
  TOOLTIP_DELAY: Math.round(1000 * Math.pow(PHI_INVERSE, 2)),    // ~382ms

  // Standard animations
  CARD_FLIP: Math.round(1000 * PHI_INVERSE),                     // 618ms
  SCREEN_TRANSITION: Math.round(1000 * 1),                       // 1000ms
  CARD_REVEAL: Math.round(1000 * PHI),                           // 1618ms

  // Breathing/meditation (longer intervals)
  BREATHE_IN: Math.round(1000 * PHI),                            // 1618ms
  BREATHE_HOLD: Math.round(1000 * 1),                            // 1000ms
  BREATHE_OUT: Math.round(1000 * PHI * PHI),                     // 2618ms

  // Contemplative pauses
  READING_PAUSE: Math.round(1000 * PHI * PHI),                   // 2618ms
  DEEP_REFLECTION: Math.round(1000 * PHI * PHI * PHI),           // 4236ms

  // Session rhythms
  COHERENCE_SAMPLE_INTERVAL: Math.round(1000 * PHI),             // 1618ms
  STATE_DEBOUNCE: Math.round(1000 * PHI_INVERSE),                // 618ms
};

// ═══════════════════════════════════════════════════════════
// ANIMATION EASING BASED ON φ
// ═══════════════════════════════════════════════════════════

/**
 * Golden ratio easing curve - starts fast, settles slowly
 * Feels natural because it mirrors organic deceleration
 */
export function phiEaseOut(t) {
  return 1 - Math.pow(1 - t, PHI);
}

/**
 * Golden ratio easing curve - starts slow, accelerates
 */
export function phiEaseIn(t) {
  return Math.pow(t, PHI);
}

/**
 * Golden ratio ease in-out - smooth at both ends
 */
export function phiEaseInOut(t) {
  return t < 0.5
    ? Math.pow(2 * t, PHI) / 2
    : 1 - Math.pow(2 * (1 - t), PHI) / 2;
}

/**
 * Spring-like oscillation with φ decay
 * @param {number} t - Progress [0, 1]
 * @param {number} oscillations - Number of oscillations (default: 3)
 */
export function phiSpring(t, oscillations = 3) {
  const decay = Math.exp(-t * PHI * 2);
  const frequency = oscillations * Math.PI * 2;
  return 1 - decay * Math.cos(t * frequency);
}

// ═══════════════════════════════════════════════════════════
// BREATHING PATTERN GENERATOR
// ═══════════════════════════════════════════════════════════

/**
 * Generates a breathing cycle with φ-proportioned phases
 * @param {number} cycleProgress - Progress through current cycle [0, 1]
 * @returns {{ phase: string, intensity: number, phaseProgress: number }}
 */
export function getBreathingState(cycleProgress) {
  const totalCycle = TIMING.BREATHE_IN + TIMING.BREATHE_HOLD + TIMING.BREATHE_OUT;

  // Phase boundaries as proportions
  const inhaleEnd = TIMING.BREATHE_IN / totalCycle;
  const holdEnd = (TIMING.BREATHE_IN + TIMING.BREATHE_HOLD) / totalCycle;

  if (cycleProgress < inhaleEnd) {
    // Inhale phase
    const phaseProgress = cycleProgress / inhaleEnd;
    return {
      phase: 'inhale',
      intensity: phiEaseOut(phaseProgress),
      phaseProgress,
    };
  } else if (cycleProgress < holdEnd) {
    // Hold phase
    const phaseProgress = (cycleProgress - inhaleEnd) / (holdEnd - inhaleEnd);
    return {
      phase: 'hold',
      intensity: 1,
      phaseProgress,
    };
  } else {
    // Exhale phase
    const phaseProgress = (cycleProgress - holdEnd) / (1 - holdEnd);
    return {
      phase: 'exhale',
      intensity: 1 - phiEaseIn(phaseProgress),
      phaseProgress,
    };
  }
}

/**
 * Get the total duration of one complete breath cycle
 */
export function getBreathCycleDuration() {
  return TIMING.BREATHE_IN + TIMING.BREATHE_HOLD + TIMING.BREATHE_OUT;
}

// ═══════════════════════════════════════════════════════════
// FIBONACCI SEQUENCE UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Generate Fibonacci sequence (converges to φ ratio)
 * @param {number} n - Number of terms
 */
export function fibonacci(n) {
  const sequence = [0, 1];
  for (let i = 2; i < n; i++) {
    sequence[i] = sequence[i - 1] + sequence[i - 2];
  }
  return sequence.slice(0, n);
}

/**
 * Get nth Fibonacci number
 * Uses Binet's formula for O(1) computation
 */
export function fibonacciN(n) {
  const sqrt5 = Math.sqrt(5);
  return Math.round((Math.pow(PHI, n) - Math.pow(-PHI_INVERSE, n)) / sqrt5);
}

// ═══════════════════════════════════════════════════════════
// TIMING UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Scale a duration by φ
 * @param {number} baseDuration - Base duration in ms
 * @param {number} power - Power of φ to multiply by (can be negative)
 */
export function scaleByPhi(baseDuration, power = 1) {
  return Math.round(baseDuration * Math.pow(PHI, power));
}

/**
 * Create a sequence of φ-scaled delays
 * Useful for staggered animations
 * @param {number} baseDelay - Starting delay in ms
 * @param {number} count - Number of delays to generate
 * @param {boolean} ascending - If true, delays increase; if false, decrease
 */
export function phiDelaySequence(baseDelay, count, ascending = true) {
  const delays = [];
  for (let i = 0; i < count; i++) {
    const power = ascending ? i : -i;
    delays.push(Math.round(baseDelay * Math.pow(PHI, power * 0.5)));
  }
  return delays;
}

/**
 * Calculate optimal stagger delay for N items
 * Total animation time stays constant regardless of item count
 * @param {number} totalDuration - Desired total animation time
 * @param {number} itemCount - Number of items to animate
 */
export function calculateStagger(totalDuration, itemCount) {
  if (itemCount <= 1) return 0;

  // Use φ to create pleasant spacing
  const stagger = totalDuration / (itemCount * PHI);
  return Math.round(stagger);
}

// ═══════════════════════════════════════════════════════════
// RHYTHM & PACING
// ═══════════════════════════════════════════════════════════

/**
 * Create a rhythm pattern based on φ proportions
 * Useful for card dealing, notification timing, etc.
 * @param {number} baseInterval - Base timing in ms
 * @param {number} beats - Number of beats in the pattern
 */
export function createPhiRhythm(baseInterval, beats) {
  const rhythm = [];
  let accumulated = 0;

  for (let i = 0; i < beats; i++) {
    // Alternate between φ and φ^-1 scaled intervals
    const scale = i % 2 === 0 ? PHI_INVERSE : PHI;
    const interval = Math.round(baseInterval * scale);
    accumulated += interval;
    rhythm.push({
      delay: accumulated,
      interval,
      beat: i + 1,
    });
  }

  return rhythm;
}

/**
 * Determine if enough time has passed for a coherent state change
 * Prevents jittery state switching by requiring φ-proportioned minimums
 * @param {number} lastChangeTime - Timestamp of last state change
 * @param {number} minInterval - Minimum interval (default: STATE_DEBOUNCE)
 */
export function isStateChangeAllowed(lastChangeTime, minInterval = TIMING.STATE_DEBOUNCE) {
  return Date.now() - lastChangeTime >= minInterval;
}

// ═══════════════════════════════════════════════════════════
// REACT NATIVE ANIMATION HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Get spring config optimized for φ-feeling motion
 * Compatible with React Native Animated.spring()
 */
export function getPhiSpringConfig(intensity = 'normal') {
  const configs = {
    gentle: {
      tension: 40 * PHI_INVERSE,
      friction: 7,
      useNativeDriver: true,
    },
    normal: {
      tension: 40,
      friction: 7 * PHI_INVERSE,
      useNativeDriver: true,
    },
    snappy: {
      tension: 40 * PHI,
      friction: 7 * PHI_INVERSE,
      useNativeDriver: true,
    },
  };

  return configs[intensity] || configs.normal;
}

/**
 * Get timing config for React Native Animated.timing()
 */
export function getPhiTimingConfig(duration, easing = 'easeOut') {
  // Note: Actual Easing functions would be imported from react-native
  // This returns the config object
  return {
    duration,
    useNativeDriver: true,
    // easing would be: Easing.bezier(0.4, 0, 0.2, 1) for material-like
    // or custom φ-based easing
  };
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export default {
  // Constants
  PHI,
  PHI_INVERSE,
  PHI_SQUARED,
  TIMING,

  // Easing functions
  phiEaseIn,
  phiEaseOut,
  phiEaseInOut,
  phiSpring,

  // Breathing
  getBreathingState,
  getBreathCycleDuration,

  // Fibonacci
  fibonacci,
  fibonacciN,

  // Timing utilities
  scaleByPhi,
  phiDelaySequence,
  calculateStagger,
  createPhiRhythm,
  isStateChangeAllowed,

  // Animation configs
  getPhiSpringConfig,
  getPhiTimingConfig,
};
