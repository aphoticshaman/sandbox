/**
 * useBehavioralSignals - Behavioral Micro-Signal Collector
 *
 * Captures behavioral signals for Kuramoto coherence measurement:
 *
 * - Scroll velocity and direction (phase signal 1)
 * - Touch/tap patterns (phase signal 2)
 * - Dwell time on content (phase signal 3)
 * - Navigation rhythm (phase signal 4)
 *
 * These 4 oscillators feed the CoherenceEngine's Kuramoto R computation.
 * The phase coupling reveals psychological synchronization with the interface.
 *
 * Patent Reference: 63/925,467 - Behavioral Micro-Signals
 */

import { useRef, useCallback, useEffect } from 'react';
import { PHI } from '../core/PhiTiming';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

// φ-scaled sampling intervals (golden ratio timing)
const SAMPLE_INTERVAL_MS = 618; // φ × 382 ≈ 618ms
const PHASE_DECAY = 0.95; // Exponential decay for stale signals

// Natural frequencies for each oscillator (Hz)
// These represent expected human rhythm baselines
const NATURAL_FREQUENCIES = {
  scroll: 0.5,      // ~2 second scroll cycles
  tap: 1.2,         // ~0.8 second tap rhythm
  dwell: 0.3,       // ~3 second reading cadence
  navigation: 0.1,  // ~10 second screen transitions
};

// ═══════════════════════════════════════════════════════════
// PHASE COMPUTATION UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Normalize a value to phase angle [0, 2π]
 * @param {number} value - Raw signal value
 * @param {number} min - Expected minimum
 * @param {number} max - Expected maximum
 * @returns {number} Phase in radians
 */
function valueToPhase(value, min, max) {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return normalized * 2 * Math.PI;
}

/**
 * Compute phase velocity from consecutive phases
 * @param {number} currentPhase - Current phase angle
 * @param {number} previousPhase - Previous phase angle
 * @param {number} dt - Time delta in seconds
 * @returns {number} Phase velocity (rad/s)
 */
function computePhaseVelocity(currentPhase, previousPhase, dt) {
  if (dt <= 0) return 0;

  // Handle wraparound at 2π
  let delta = currentPhase - previousPhase;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;

  return delta / dt;
}

// ═══════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * useBehavioralSignals Hook
 *
 * Returns event handlers and phase data for coherence measurement.
 *
 * Usage:
 *   const { handlers, getPhases, getPhaseData } = useBehavioralSignals();
 *   <ScrollView {...handlers.scroll}>
 *   <Pressable {...handlers.touch}>
 */
export function useBehavioralSignals(options = {}) {
  const { onPhasesUpdate } = options;

  // ─────────────────────────────────────────────────────
  // STATE REFS (avoid re-renders for high-frequency updates)
  // ─────────────────────────────────────────────────────

  // Raw signal accumulators
  const scrollRef = useRef({
    velocity: 0,
    direction: 1,
    lastY: 0,
    lastTimestamp: 0,
    samples: [],
  });

  const touchRef = useRef({
    tapCount: 0,
    lastTapTime: 0,
    dwellStart: 0,
    currentDwell: 0,
    tapIntervals: [],
  });

  const navigationRef = useRef({
    screenChanges: 0,
    lastScreenChange: 0,
    screenDurations: [],
  });

  // Phase state (4 oscillators)
  const phasesRef = useRef({
    scroll: 0,
    tap: 0,
    dwell: 0,
    navigation: 0,
    lastUpdate: Date.now(),
  });

  // Phase history for velocity computation
  const phaseHistoryRef = useRef({
    scroll: 0,
    tap: 0,
    dwell: 0,
    navigation: 0,
  });

  // ─────────────────────────────────────────────────────
  // SCROLL HANDLERS
  // ─────────────────────────────────────────────────────

  const handleScroll = useCallback((event) => {
    const now = Date.now();
    const { contentOffset } = event.nativeEvent;
    const y = contentOffset.y;

    const scroll = scrollRef.current;
    const dt = (now - scroll.lastTimestamp) / 1000; // seconds

    if (dt > 0 && scroll.lastTimestamp > 0) {
      // Compute instantaneous velocity (px/s)
      const velocity = Math.abs(y - scroll.lastY) / dt;
      scroll.velocity = velocity;
      scroll.direction = y > scroll.lastY ? 1 : -1;

      // Keep last 10 samples for averaging
      scroll.samples.push({ velocity, direction: scroll.direction, t: now });
      if (scroll.samples.length > 10) scroll.samples.shift();
    }

    scroll.lastY = y;
    scroll.lastTimestamp = now;

    // Convert to phase: slow scroll = low phase, fast scroll = high phase
    // Range: 0-2000 px/s maps to 0-2π
    phasesRef.current.scroll = valueToPhase(scroll.velocity, 0, 2000);
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    // Mark active scrolling
    scrollRef.current.lastTimestamp = Date.now();
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    // Decay scroll velocity
    scrollRef.current.velocity *= 0.5;
    phasesRef.current.scroll = valueToPhase(scrollRef.current.velocity, 0, 2000);
  }, []);

  // ─────────────────────────────────────────────────────
  // TOUCH/TAP HANDLERS
  // ─────────────────────────────────────────────────────

  const handlePressIn = useCallback(() => {
    const now = Date.now();
    touchRef.current.dwellStart = now;
  }, []);

  const handlePressOut = useCallback(() => {
    const now = Date.now();
    const touch = touchRef.current;

    // Compute dwell time
    if (touch.dwellStart > 0) {
      touch.currentDwell = now - touch.dwellStart;

      // Map dwell to phase: 0-5000ms = 0-2π
      phasesRef.current.dwell = valueToPhase(touch.currentDwell, 0, 5000);
    }

    // Compute tap interval
    if (touch.lastTapTime > 0) {
      const interval = now - touch.lastTapTime;
      touch.tapIntervals.push(interval);
      if (touch.tapIntervals.length > 10) touch.tapIntervals.shift();

      // Map tap rhythm to phase: fast taps (200ms) = high phase
      // Slow taps (2000ms) = low phase (inverted)
      const avgInterval = touch.tapIntervals.reduce((a, b) => a + b, 0) / touch.tapIntervals.length;
      phasesRef.current.tap = valueToPhase(2000 - avgInterval, 0, 1800);
    }

    touch.tapCount++;
    touch.lastTapTime = now;
    touch.dwellStart = 0;
  }, []);

  // ─────────────────────────────────────────────────────
  // NAVIGATION HANDLERS
  // ─────────────────────────────────────────────────────

  const recordScreenChange = useCallback((screenName) => {
    const now = Date.now();
    const nav = navigationRef.current;

    if (nav.lastScreenChange > 0) {
      const duration = now - nav.lastScreenChange;
      nav.screenDurations.push(duration);
      if (nav.screenDurations.length > 10) nav.screenDurations.shift();

      // Map screen duration to phase: quick switches = high phase
      // Long viewing = low phase
      const avgDuration = nav.screenDurations.reduce((a, b) => a + b, 0) / nav.screenDurations.length;
      phasesRef.current.navigation = valueToPhase(30000 - avgDuration, 0, 30000);
    }

    nav.screenChanges++;
    nav.lastScreenChange = now;
  }, []);

  // ─────────────────────────────────────────────────────
  // PHASE RETRIEVAL
  // ─────────────────────────────────────────────────────

  /**
   * Get current phase angles for all 4 oscillators
   * @returns {number[]} Array of 4 phase angles in radians
   */
  const getPhases = useCallback(() => {
    const phases = phasesRef.current;
    return [
      phases.scroll,
      phases.tap,
      phases.dwell,
      phases.navigation,
    ];
  }, []);

  /**
   * Get detailed phase data including velocities
   * @returns {Object} Full phase state with metadata
   */
  const getPhaseData = useCallback(() => {
    const now = Date.now();
    const phases = phasesRef.current;
    const history = phaseHistoryRef.current;
    const dt = (now - phases.lastUpdate) / 1000;

    // Compute phase velocities
    const velocities = {
      scroll: computePhaseVelocity(phases.scroll, history.scroll, dt),
      tap: computePhaseVelocity(phases.tap, history.tap, dt),
      dwell: computePhaseVelocity(phases.dwell, history.dwell, dt),
      navigation: computePhaseVelocity(phases.navigation, history.navigation, dt),
    };

    // Update history
    phaseHistoryRef.current = { ...phases };
    phases.lastUpdate = now;

    return {
      phases: [phases.scroll, phases.tap, phases.dwell, phases.navigation],
      velocities,
      rawSignals: {
        scrollVelocity: scrollRef.current.velocity,
        tapCount: touchRef.current.tapCount,
        lastDwell: touchRef.current.currentDwell,
        screenChanges: navigationRef.current.screenChanges,
      },
      timestamp: now,
    };
  }, []);

  // ─────────────────────────────────────────────────────
  // PERIODIC PHASE DECAY
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    // Decay phases toward natural frequencies when idle
    const decayInterval = setInterval(() => {
      const phases = phasesRef.current;
      const now = Date.now();

      // If no activity for 2 seconds, decay toward baseline
      if (now - phases.lastUpdate > 2000) {
        phases.scroll *= PHASE_DECAY;
        phases.tap *= PHASE_DECAY;
        // Dwell and navigation decay slower
        phases.dwell *= 0.98;
        phases.navigation *= 0.99;
      }

      // Emit update to coherence engine if callback provided
      if (onPhasesUpdate) {
        onPhasesUpdate(getPhaseData());
      }
    }, SAMPLE_INTERVAL_MS);

    return () => clearInterval(decayInterval);
  }, [onPhasesUpdate, getPhaseData]);

  // ─────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────

  const reset = useCallback(() => {
    scrollRef.current = {
      velocity: 0,
      direction: 1,
      lastY: 0,
      lastTimestamp: 0,
      samples: [],
    };
    touchRef.current = {
      tapCount: 0,
      lastTapTime: 0,
      dwellStart: 0,
      currentDwell: 0,
      tapIntervals: [],
    };
    navigationRef.current = {
      screenChanges: 0,
      lastScreenChange: 0,
      screenDurations: [],
    };
    phasesRef.current = {
      scroll: 0,
      tap: 0,
      dwell: 0,
      navigation: 0,
      lastUpdate: Date.now(),
    };
  }, []);

  // ─────────────────────────────────────────────────────
  // RETURN INTERFACE
  // ─────────────────────────────────────────────────────

  return {
    // Event handlers to spread onto components
    handlers: {
      scroll: {
        onScroll: handleScroll,
        onScrollBeginDrag: handleScrollBeginDrag,
        onScrollEndDrag: handleScrollEndDrag,
        scrollEventThrottle: 16, // 60fps
      },
      touch: {
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
      },
    },

    // Phase retrieval functions
    getPhases,
    getPhaseData,

    // Navigation tracking (call manually on screen focus)
    recordScreenChange,

    // Reset all signals
    reset,
  };
}

export default useBehavioralSignals;
