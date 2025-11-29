/**
 * gameStore.ts
 *
 * Zustand store for game state
 */

import { create } from 'zustand';
import { DimensionType } from '../core/DimensionManager';

export interface GameState {
  // Current state
  state: 'menu' | 'loading' | 'playing' | 'paused' | 'level-complete';
  currentLevel: string | null;
  currentDimension: DimensionType;

  // Player
  playerId: string;
  playerPosition: { x: number; y: number; z: number };
  currentNodeId: string | null;

  // Session
  sessionStartTime: number;
  totalPlayTime: number;
  levelStartTime: number;

  // Actions
  setState: (state: GameState['state']) => void;
  setLevel: (levelId: string | null) => void;
  setDimension: (dimension: DimensionType) => void;
  setPlayerPosition: (pos: { x: number; y: number; z: number }) => void;
  setCurrentNode: (nodeId: string | null) => void;
  addPlayTime: (ms: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  state: 'menu',
  currentLevel: null,
  currentDimension: 'LATTICE',
  playerId: '',
  playerPosition: { x: 0, y: 0, z: 0 },
  currentNodeId: null,
  sessionStartTime: Date.now(),
  totalPlayTime: 0,
  levelStartTime: 0,

  // Actions
  setState: (state) => set({ state }),
  setLevel: (levelId) => set({ currentLevel: levelId, levelStartTime: Date.now() }),
  setDimension: (dimension) => set({ currentDimension: dimension }),
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),
  addPlayTime: (ms) => set((state) => ({ totalPlayTime: state.totalPlayTime + ms })),
  reset: () => set({
    state: 'menu',
    currentLevel: null,
    currentDimension: 'LATTICE',
    currentNodeId: null,
    levelStartTime: 0
  })
}));

// Non-hook access for class components
export const gameStore = {
  getState: () => useGameStore.getState(),
  setState: useGameStore.getState().setState,
  setLevel: useGameStore.getState().setLevel,
  setDimension: useGameStore.getState().setDimension,
  subscribe: useGameStore.subscribe
};
