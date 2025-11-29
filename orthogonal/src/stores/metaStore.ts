/**
 * metaStore.ts
 *
 * Zustand store for meta-awareness tracking
 */

import { create } from 'zustand';

export interface MetaState {
  // Awareness tracking
  awarenessLevel: number;  // 0-1
  witnessTime: number;     // Total time in witness mode (ms)
  focusTime: number;       // Total focus time (ms)

  // Session metrics
  dimensionShifts: number;
  backtrackCount: number;
  pauseCount: number;

  // Meta-awareness triggers
  hasSeenFirstMetaMessage: boolean;
  metaMessagesSeen: number;
  lastMetaMessageTime: number;

  // Behavior patterns
  averageFocusDuration: number;
  averageWitnessDuration: number;
  hesitationEvents: number;

  // Actions
  setAwareness: (level: number) => void;
  addWitnessTime: (ms: number) => void;
  addFocusTime: (ms: number) => void;
  recordDimensionShift: () => void;
  recordBacktrack: () => void;
  recordPause: () => void;
  recordMetaMessage: () => void;
  recordHesitation: () => void;
  updateFocusDuration: (duration: number) => void;
  updateWitnessDuration: (duration: number) => void;
  reset: () => void;
  // Additional methods for compatibility
  onWitness: (callback: () => void) => void;
  engageWitness: () => void;
  update: (delta: number) => void;
  startSession: () => void;
}

export const useMetaStore = create<MetaState>((set, get) => ({
  // Initial state
  awarenessLevel: 0,
  witnessTime: 0,
  focusTime: 0,
  dimensionShifts: 0,
  backtrackCount: 0,
  pauseCount: 0,
  hasSeenFirstMetaMessage: false,
  metaMessagesSeen: 0,
  lastMetaMessageTime: 0,
  averageFocusDuration: 0,
  averageWitnessDuration: 0,
  hesitationEvents: 0,

  // Actions
  setAwareness: (level) => set({ awarenessLevel: Math.max(0, Math.min(1, level)) }),

  addWitnessTime: (ms) => set((state) => ({
    witnessTime: state.witnessTime + ms
  })),

  addFocusTime: (ms) => set((state) => ({
    focusTime: state.focusTime + ms
  })),

  recordDimensionShift: () => set((state) => ({
    dimensionShifts: state.dimensionShifts + 1
  })),

  recordBacktrack: () => set((state) => ({
    backtrackCount: state.backtrackCount + 1
  })),

  recordPause: () => set((state) => ({
    pauseCount: state.pauseCount + 1
  })),

  recordMetaMessage: () => set((state) => ({
    hasSeenFirstMetaMessage: true,
    metaMessagesSeen: state.metaMessagesSeen + 1,
    lastMetaMessageTime: Date.now()
  })),

  recordHesitation: () => set((state) => ({
    hesitationEvents: state.hesitationEvents + 1
  })),

  updateFocusDuration: (duration) => {
    const state = get();
    const count = Math.max(1, state.focusTime / 1000);  // Rough count
    set({
      averageFocusDuration: (state.averageFocusDuration * (count - 1) + duration) / count
    });
  },

  updateWitnessDuration: (duration) => {
    const state = get();
    const count = Math.max(1, state.witnessTime / 1000);
    set({
      averageWitnessDuration: (state.averageWitnessDuration * (count - 1) + duration) / count
    });
  },

  reset: () => set({
    awarenessLevel: 0,
    witnessTime: 0,
    focusTime: 0,
    dimensionShifts: 0,
    backtrackCount: 0,
    pauseCount: 0,
    hesitationEvents: 0
  }),

  // Additional methods for compatibility
  onWitness: (_callback: () => void) => {
    // Register witness callback (no-op for now, events handled elsewhere)
  },

  engageWitness: () => set((state) => ({
    awarenessLevel: Math.min(1, state.awarenessLevel + 0.1)
  })),

  update: (_delta: number) => {
    // Per-frame update (awareness decay handled here if needed)
    const state = get();
    if (state.awarenessLevel > 0) {
      set({ awarenessLevel: Math.max(0, state.awarenessLevel - 0.001) });
    }
  },

  startSession: () => set({
    awarenessLevel: 0,
    witnessTime: 0,
    focusTime: 0,
    dimensionShifts: 0,
    backtrackCount: 0,
    pauseCount: 0,
    hesitationEvents: 0
  })
}));

// Non-hook access
export const metaStore = {
  getState: () => useMetaStore.getState(),
  setAwareness: useMetaStore.getState().setAwareness,
  addWitnessTime: useMetaStore.getState().addWitnessTime,
  addFocusTime: useMetaStore.getState().addFocusTime,
  recordDimensionShift: useMetaStore.getState().recordDimensionShift,
  subscribe: useMetaStore.subscribe
};
