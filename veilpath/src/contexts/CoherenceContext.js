/**
 * CoherenceContext - Central Coherence State Provider
 *
 * Wraps the app and provides:
 * - Real-time Kuramoto R measurement from behavioral signals
 * - Momentum-gated state classification (κ=1.0)
 * - Adaptive AI persona based on coherence state
 * - KGANIS noise level for exploration/exploitation balance
 *
 * All screens can access coherence via useCoherence() hook.
 *
 * Patent References:
 * - 63/925,467: Kuramoto phase synchronization
 * - CIP: Momentum-gated thresholds, KGANIS, RRBR
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { AppState } from 'react-native';

// Core coherence engine
import {
  coherenceEngine,
  COHERENCE_STATES,
  KAPPA,
  THRESHOLD_BASE,
} from '../core/CoherenceEngine';

// Adaptive AI for persona selection
import { adaptiveAI, AI_PROFILES } from '../core/AdaptiveAI';

// KGANIS noise computation
import { computeKGANISNoise, NOISE_BASE_BY_STATE } from '../core/PSANTriFork';

// φ-timing for update intervals
import { TIMING } from '../core/PhiTiming';

// ═══════════════════════════════════════════════════════════
// CONTEXT CREATION
// ═══════════════════════════════════════════════════════════

const CoherenceContext = createContext(null);

// ═══════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════

export function CoherenceProvider({ children }) {
  // ─────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────

  // Core coherence metrics
  const [R, setR] = useState(0.5); // Kuramoto order parameter [0, 1]
  const [momentum, setMomentum] = useState(0); // dR/dt
  const [state, setState] = useState('fluid'); // Current coherence state
  const [previousState, setPreviousState] = useState('fluid');

  // Dynamic thresholds (momentum-gated)
  const [thresholds, setThresholds] = useState({ ...THRESHOLD_BASE });

  // AI adaptation
  const [persona, setPersona] = useState('guide'); // Current AI persona
  const [noiseLevel, setNoiseLevel] = useState(0.15); // KGANIS ξ

  // Session metrics
  const [sessionStats, setSessionStats] = useState({
    stateChanges: 0,
    avgR: 0.5,
    peakR: 0.5,
    timeInCrystalline: 0,
    sessionStart: Date.now(),
  });

  // Refs for high-frequency updates
  const rHistoryRef = useRef([0.5, 0.5, 0.5, 0.5]);
  const updateCountRef = useRef(0);
  const rSumRef = useRef(0);

  // ─────────────────────────────────────────────────────
  // COHERENCE ENGINE SUBSCRIPTION
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    // Subscribe to coherence engine updates
    const unsubscribe = coherenceEngine.subscribe((update) => {
      const { R: newR, state: newState, momentum: newMomentum, thresholds: newThresholds } = update;

      // Update core state
      setR(newR);
      setMomentum(newMomentum);
      setThresholds(newThresholds);

      // Track state changes
      if (newState !== state) {
        setPreviousState(state);
        setState(newState);
        setSessionStats((prev) => ({
          ...prev,
          stateChanges: prev.stateChanges + 1,
        }));
      }

      // Update persona based on state
      const newPersona = getPersonaForState(newState);
      if (newPersona !== persona) {
        setPersona(newPersona);
      }

      // Compute KGANIS noise level
      const xiBase = NOISE_BASE_BY_STATE[newState] || 0.15;
      const xi = computeKGANISNoise(newR, newMomentum, xiBase);
      setNoiseLevel(xi);

      // Update running stats
      updateCountRef.current++;
      rSumRef.current += newR;

      setSessionStats((prev) => ({
        ...prev,
        avgR: rSumRef.current / updateCountRef.current,
        peakR: Math.max(prev.peakR, newR),
        timeInCrystalline:
          newState === 'crystalline'
            ? prev.timeInCrystalline + TIMING.breathCycle
            : prev.timeInCrystalline,
      }));
    });

    // Start the engine
    coherenceEngine.start();

    return () => {
      unsubscribe();
      coherenceEngine.stop();
    };
  }, [state, persona]);

  // ─────────────────────────────────────────────────────
  // APP STATE HANDLING
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Resume coherence sampling
        coherenceEngine.start();
      } else if (nextAppState === 'background') {
        // Pause to save battery
        coherenceEngine.stop();
      }
    });

    return () => subscription.remove();
  }, []);

  // ─────────────────────────────────────────────────────
  // PHASE INJECTION (from behavioral signals)
  // ─────────────────────────────────────────────────────

  const injectPhases = useCallback((phases) => {
    // Forward behavioral signal phases to coherence engine
    if (coherenceEngine && coherenceEngine.injectPhases) {
      coherenceEngine.injectPhases(phases);
    }
  }, []);

  // ─────────────────────────────────────────────────────
  // MANUAL STATE OVERRIDE (for testing/admin)
  // ─────────────────────────────────────────────────────

  const overrideState = useCallback((newState) => {
    if (COHERENCE_STATES[newState.toUpperCase()]) {
      setState(newState.toLowerCase());
    }
  }, []);

  // ─────────────────────────────────────────────────────
  // PERSONA MAPPING
  // ─────────────────────────────────────────────────────

  const getPersonaForState = (coherenceState) => {
    switch (coherenceState) {
      case 'crystalline':
        return 'sage'; // Deep, nuanced responses
      case 'fluid':
        return 'guide'; // Balanced, supportive
      case 'turbulent':
        return 'mentor'; // Structured, grounding
      case 'collapse':
        return 'companion'; // Simple, warm, present
      default:
        return 'guide';
    }
  };

  // ─────────────────────────────────────────────────────
  // AI PARAMETERS FOR CURRENT STATE
  // ─────────────────────────────────────────────────────

  const getAIParameters = useCallback(() => {
    const profile = AI_PROFILES[persona] || AI_PROFILES.guide;

    return {
      ...profile,
      // Add noise-adjusted temperature
      temperature: profile.temperature + noiseLevel * 0.5,
      // KGANIS exploration factor
      explorationFactor: noiseLevel,
      // Current coherence for context
      coherence: R,
      coherenceState: state,
      momentum,
    };
  }, [persona, noiseLevel, R, state, momentum]);

  // ─────────────────────────────────────────────────────
  // SESSION RESET
  // ─────────────────────────────────────────────────────

  const resetSession = useCallback(() => {
    updateCountRef.current = 0;
    rSumRef.current = 0;
    setSessionStats({
      stateChanges: 0,
      avgR: 0.5,
      peakR: 0.5,
      timeInCrystalline: 0,
      sessionStart: Date.now(),
    });
    coherenceEngine.reset?.();
  }, []);

  // ─────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────

  const value = {
    // Core coherence metrics
    R,
    momentum,
    state,
    previousState,
    thresholds,

    // AI adaptation
    persona,
    noiseLevel,
    getAIParameters,

    // Session stats
    sessionStats,

    // Actions
    injectPhases,
    overrideState,
    resetSession,

    // Constants for consumers
    COHERENCE_STATES,
    KAPPA,
    THRESHOLD_BASE,
  };

  return (
    <CoherenceContext.Provider value={value}>
      {children}
    </CoherenceContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════

/**
 * useCoherence - Access coherence state from any component
 *
 * Usage:
 *   const { R, state, persona, getAIParameters } = useCoherence();
 *
 * @returns {Object} Coherence context value
 */
export function useCoherence() {
  const context = useContext(CoherenceContext);

  if (!context) {
    throw new Error('useCoherence must be used within a CoherenceProvider');
  }

  return context;
}

// ═══════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * useCoherenceState - Just the state string
 */
export function useCoherenceState() {
  const { state } = useCoherence();
  return state;
}

/**
 * useCoherenceR - Just the R value
 */
export function useCoherenceR() {
  const { R } = useCoherence();
  return R;
}

/**
 * usePersona - Just the current persona
 */
export function usePersona() {
  const { persona, getAIParameters } = useCoherence();
  return { persona, getAIParameters };
}

/**
 * useIsCoherent - Boolean for high coherence (CRYSTALLINE or FLUID)
 */
export function useIsCoherent() {
  const { state } = useCoherence();
  return state === 'crystalline' || state === 'fluid';
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export default CoherenceProvider;
