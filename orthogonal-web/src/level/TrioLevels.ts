/**
 * TrioLevels.ts
 *
 * 5 dedicated three-player cooperative levels
 * Designed for trio streamers: triangle dynamics, trust mechanics
 */

import { DimensionType } from '../core/DimensionManager';
import { StaticLevelDefinition } from './StaticLevels';

// =============================================================================
// TRIO LEVEL 1: TRIANGLE
// =============================================================================

export const TRIO_1_TRIANGLE: StaticLevelDefinition = {
  id: 'trio-triangle',
  seed: 0x50300001,
  name: 'Triangle',
  subtitle: 'Three points define a plane.',
  chapter: 301,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    // Three origins - triangle formation
    { id: 'origin-1', position: { x: 0, y: 4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff0000' } },
    { id: 'origin-2', position: { x: -4, y: -3, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#00ff00' } },
    { id: 'origin-3', position: { x: 4, y: -3, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#0000ff' } },
    // Individual paths
    { id: 'p1-w1', position: { x: 2, y: 4, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'p2-w1', position: { x: -4, y: -1, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'p3-w1', position: { x: 4, y: -1, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    // Convergence point - requires all 3
    { id: 'nexus', position: { x: 0, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 3, properties: { color: '#ffffff', label: 'converge' } },
    // After nexus
    { id: 'ascent', position: { x: 0, y: 0, z: 4 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 500 },
    { id: 'dest', position: { x: 0, y: 0, z: 8 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin-1', to: 'p1-w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'p1-w1', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    { from: 'origin-2', to: 'p2-w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'p2-w1', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    { from: 'origin-3', to: 'p3-w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'p3-w1', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    { from: 'nexus', to: 'ascent', type: 'solid', dimension: 'LATTICE' },
    { from: 'ascent', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  objectives: { primary: 'All three converge at the nexus', hidden: ['Sync within 1 second', 'No backtracking'] },
  victoryCondition: { type: 'synchronize', targets: ['nexus'] },
  mechanics: ['attention-movement', 'synchronization'],
  newMechanic: 'trio-sync',
  coopMechanics: ['synchronized-focus'],

  minPlayers: 3, maxPlayers: 3,
  difficulty: 4,
  parTime: 45,
  perfectTime: 20,
  ambience: 'crystalline',
  visualTheme: 'geometry'
};

// =============================================================================
// TRIO LEVEL 2: CHAIN REACTION
// =============================================================================

export const TRIO_2_CHAIN: StaticLevelDefinition = {
  id: 'trio-chain',
  seed: 0x50300002,
  name: 'Chain Reaction',
  subtitle: 'Each unlocks the next.',
  chapter: 302,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    // Staggered starts
    { id: 'origin-1', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff0000', label: 'first' } },
    { id: 'origin-2', position: { x: 0, y: 4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#00ff00', label: 'second' } },
    { id: 'origin-3', position: { x: 0, y: -4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#0000ff', label: 'third' } },
    // Player 1 goes first
    { id: 'p1-w1', position: { x: 4, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'switch-1', position: { x: 8, y: 0, z: 0 }, type: 'switch', dimension: 'LATTICE', activationTime: 1000, properties: { color: '#ff0000' } },
    // Player 2 waits for switch-1
    { id: 'gate-2', position: { x: 4, y: 4, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'p2-w1', position: { x: 8, y: 4, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'switch-2', position: { x: 12, y: 4, z: 0 }, type: 'switch', dimension: 'LATTICE', activationTime: 1000, properties: { color: '#00ff00' } },
    // Player 3 waits for switch-2
    { id: 'gate-3', position: { x: 4, y: -4, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'p3-w1', position: { x: 8, y: -4, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'switch-3', position: { x: 12, y: -4, z: 0 }, type: 'switch', dimension: 'LATTICE', activationTime: 1000, properties: { color: '#0000ff' } },
    // Final convergence
    { id: 'final-gate', position: { x: 16, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 3, properties: { locked: true } },
    { id: 'dest', position: { x: 20, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    // Player 1 path
    { from: 'origin-1', to: 'p1-w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'p1-w1', to: 'switch-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'switch-1', to: 'final-gate', type: 'solid', dimension: 'LATTICE' },
    // Player 2 path
    { from: 'origin-2', to: 'gate-2', type: 'solid', dimension: 'LATTICE' },
    { from: 'gate-2', to: 'p2-w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'p2-w1', to: 'switch-2', type: 'solid', dimension: 'LATTICE' },
    { from: 'switch-2', to: 'final-gate', type: 'solid', dimension: 'LATTICE' },
    // Player 3 path
    { from: 'origin-3', to: 'gate-3', type: 'solid', dimension: 'LATTICE' },
    { from: 'gate-3', to: 'p3-w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'p3-w1', to: 'switch-3', type: 'solid', dimension: 'LATTICE' },
    { from: 'switch-3', to: 'final-gate', type: 'solid', dimension: 'LATTICE' },
    // Final
    { from: 'final-gate', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'switch-1', action: 'unlock', target: 'gate-2' },
    { type: 'activate', nodeId: 'switch-2', action: 'unlock', target: 'gate-3' },
    { type: 'activate', nodeId: 'switch-3', action: 'unlock', target: 'final-gate' }
  ],

  objectives: { primary: 'Chain your actions: 1 → 2 → 3', hidden: ['Complete chain in 30 seconds', 'No wasted movement'] },
  victoryCondition: { type: 'synchronize', targets: ['final-gate', 'dest'] },
  mechanics: ['attention-movement', 'node-charging', 'chain-mechanics'],
  newMechanic: 'chain-mechanics',
  coopMechanics: ['sequential-focus'],

  minPlayers: 3, maxPlayers: 3,
  difficulty: 5,
  parTime: 60,
  perfectTime: 35,
  ambience: 'crystalline',
  visualTheme: 'sequence'
};

// =============================================================================
// TRIO LEVEL 3: THREE DIMENSIONS
// =============================================================================

export const TRIO_3_THREE_DIMENSIONS: StaticLevelDefinition = {
  id: 'trio-dimensions',
  seed: 0x50300003,
  name: 'Three Dimensions',
  subtitle: 'One per reality.',
  chapter: 303,

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    // Each player starts in different dimension
    { id: 'origin-lattice', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#00ffff', label: 'lattice' } },
    { id: 'origin-marrow', position: { x: 0, y: 0, z: 4 }, type: 'origin', dimension: 'MARROW', properties: { color: '#ff6600', label: 'marrow' } },
    { id: 'origin-void', position: { x: 0, y: 0, z: -4 }, type: 'origin', dimension: 'VOID', properties: { color: '#8800ff', label: 'void' } },
    // LATTICE path
    { id: 'l1', position: { x: 4, y: 2, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'l-switch', position: { x: 8, y: 0, z: 0 }, type: 'switch', dimension: 'LATTICE', activationTime: 1000, properties: { color: '#00ffff' } },
    // MARROW path
    { id: 'm1', position: { x: 4, y: -2, z: 5 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'm-switch', position: { x: 8, y: 0, z: 4 }, type: 'switch', dimension: 'MARROW', activationTime: 1000, properties: { color: '#ff6600' } },
    // VOID path
    { id: 'v1', position: { x: 4, y: 0, z: -6 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'v-switch', position: { x: 8, y: 0, z: -4 }, type: 'switch', dimension: 'VOID', activationTime: 1000, properties: { color: '#8800ff' } },
    // Nexus - all dimensions meet
    { id: 'nexus', position: { x: 12, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 3, properties: { locked: true, color: '#ffffff' } },
    { id: 'dest', position: { x: 16, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    // LATTICE
    { from: 'origin-lattice', to: 'l1', type: 'solid', dimension: 'LATTICE' },
    { from: 'l1', to: 'l-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-switch', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // MARROW
    { from: 'origin-marrow', to: 'm1', type: 'solid', dimension: 'MARROW' },
    { from: 'm1', to: 'm-switch', type: 'solid', dimension: 'MARROW' },
    { from: 'm-switch', to: 'nexus', type: 'solid', dimension: 'MARROW' },
    // VOID
    { from: 'origin-void', to: 'v1', type: 'hidden', dimension: 'VOID' },
    { from: 'v1', to: 'v-switch', type: 'hidden', dimension: 'VOID' },
    { from: 'v-switch', to: 'nexus', type: 'hidden', dimension: 'VOID' },
    // Final
    { from: 'nexus', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'l-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 1 } },
    { type: 'activate', nodeId: 'm-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 2 } },
    { type: 'activate', nodeId: 'v-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 3 } }
  ],

  objectives: { primary: 'Three switches. Three dimensions. One moment.', hidden: ['All switches within 2 seconds'] },
  victoryCondition: { type: 'synchronize', targets: ['nexus'] },
  mechanics: ['attention-movement', 'dimension-shifting', 'void-navigation', 'synchronization'],
  coopMechanics: ['synchronized-focus', 'split-perception'],

  minPlayers: 3, maxPlayers: 3,
  difficulty: 6,
  parTime: 75,
  perfectTime: 40,
  ambience: 'mixed',
  visualTheme: 'trinity'
};

// =============================================================================
// TRIO LEVEL 4: WITNESS TRIANGLE
// =============================================================================

export const TRIO_4_WITNESS_TRIANGLE: StaticLevelDefinition = {
  id: 'trio-witness',
  seed: 0x50300004,
  name: 'Witness Triangle',
  subtitle: 'Each sees what others cannot.',
  chapter: 304,

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    // Three origins in LATTICE
    { id: 'origin-1', position: { x: 0, y: 6, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff0000', label: 'seer-1' } },
    { id: 'origin-2', position: { x: -5, y: -3, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#00ff00', label: 'seer-2' } },
    { id: 'origin-3', position: { x: 5, y: -3, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#0000ff', label: 'seer-3' } },
    // Each player has a witness perch and hidden path to reveal for others
    { id: 'perch-1', position: { x: 4, y: 6, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    { id: 'perch-2', position: { x: -5, y: 0, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    { id: 'perch-3', position: { x: 5, y: 0, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    // Hidden paths (each revealed by different player)
    { id: 'hidden-1', position: { x: 0, y: 4, z: 2 }, type: 'waypoint', dimension: 'LATTICE', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'hidden-2', position: { x: -3, y: -2, z: 2 }, type: 'waypoint', dimension: 'LATTICE', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'hidden-3', position: { x: 3, y: -2, z: 2 }, type: 'waypoint', dimension: 'LATTICE', hiddenIn: ['LATTICE'], activationTime: 0 },
    // Nexus
    { id: 'nexus', position: { x: 0, y: 0, z: 4 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 3, properties: { locked: true } },
    { id: 'dest', position: { x: 0, y: 0, z: 8 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    // Player 1 path
    { from: 'origin-1', to: 'perch-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'perch-1', to: 'hidden-1', type: 'dashed', dimension: 'LATTICE' },
    { from: 'hidden-1', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Player 2 path
    { from: 'origin-2', to: 'perch-2', type: 'solid', dimension: 'LATTICE' },
    { from: 'perch-2', to: 'hidden-2', type: 'dashed', dimension: 'LATTICE' },
    { from: 'hidden-2', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Player 3 path
    { from: 'origin-3', to: 'perch-3', type: 'solid', dimension: 'LATTICE' },
    { from: 'perch-3', to: 'hidden-3', type: 'dashed', dimension: 'LATTICE' },
    { from: 'hidden-3', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Final
    { from: 'nexus', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    // Player 1 witnesses to reveal Player 2's path
    { type: 'witness', nodeId: 'perch-1', action: 'reveal', target: 'hidden-2' },
    // Player 2 witnesses to reveal Player 3's path
    { type: 'witness', nodeId: 'perch-2', action: 'reveal', target: 'hidden-3' },
    // Player 3 witnesses to reveal Player 1's path
    { type: 'witness', nodeId: 'perch-3', action: 'reveal', target: 'hidden-1' },
    // All hidden nodes visited unlocks nexus
    { type: 'enter', nodeId: 'hidden-1', action: 'unlock', target: 'nexus', data: { partialUnlock: 1 } },
    { type: 'enter', nodeId: 'hidden-2', action: 'unlock', target: 'nexus', data: { partialUnlock: 2 } },
    { type: 'enter', nodeId: 'hidden-3', action: 'unlock', target: 'nexus', data: { partialUnlock: 3 } }
  ],

  objectives: { primary: 'Each reveals the path for another', hidden: ['All reveal simultaneously', 'No one waits more than 5s'] },
  victoryCondition: { type: 'synchronize', targets: ['nexus', 'dest'] },
  mechanics: ['attention-movement', 'witness-mode', 'relay-mechanics'],
  newMechanic: 'circular-witness',
  coopMechanics: ['relay-witness', 'split-perception'],

  minPlayers: 3, maxPlayers: 3,
  difficulty: 7,
  parTime: 90,
  perfectTime: 50,
  ambience: 'crystalline',
  visualTheme: 'revelation'
};

// =============================================================================
// TRIO LEVEL 5: TRIAD ASCENSION
// =============================================================================

export const TRIO_5_TRIAD: StaticLevelDefinition = {
  id: 'trio-triad',
  seed: 0x50300005,
  name: 'Triad Ascension',
  subtitle: 'Three become one.',
  chapter: 305,

  completionText: 'Trio mastery achieved. The tetrad awaits.',

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    // All start together, then split
    { id: 'origin-1', position: { x: 0, y: 2, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff0000' } },
    { id: 'origin-2', position: { x: -2, y: -1, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#00ff00' } },
    { id: 'origin-3', position: { x: 2, y: -1, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#0000ff' } },
    // Split point
    { id: 'split', position: { x: 0, y: 0, z: 2 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    // Player 1 goes to LATTICE challenges
    { id: 'l-path', position: { x: -4, y: 4, z: 2 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'l-witness', position: { x: -6, y: 6, z: 2 }, type: 'witness', dimension: 'LATTICE', activationTime: 1500 },
    { id: 'l-switch', position: { x: -8, y: 4, z: 2 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#ff0000' } },
    // Player 2 portal to MARROW
    { id: 'to-marrow', position: { x: 0, y: -4, z: 2 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#ff6600' } },
    { id: 'm-entry', position: { x: 0, y: -4, z: 6 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'm-charge', position: { x: 2, y: -6, z: 8 }, type: 'waypoint', dimension: 'MARROW', activationTime: 2500, properties: { pulseRate: 300 } },
    { id: 'm-switch', position: { x: 4, y: -4, z: 6 }, type: 'switch', dimension: 'MARROW', properties: { color: '#00ff00' } },
    // Player 3 portal to VOID
    { id: 'to-void', position: { x: 4, y: 0, z: 2 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#220022' } },
    { id: 'v-entry', position: { x: 4, y: 0, z: -2 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'v-drift', position: { x: 6, y: 2, z: -4 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'v-switch', position: { x: 8, y: 0, z: -2 }, type: 'switch', dimension: 'VOID', properties: { color: '#0000ff' } },
    // Final convergence
    { id: 'nexus', position: { x: 0, y: 0, z: 10 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 3, properties: { locked: true, color: '#ffd700' } },
    { id: 'dest', position: { x: 0, y: 0, z: 14 }, type: 'destination', dimension: 'LATTICE', properties: { color: '#ffd700' } }
  ],

  edges: [
    // Initial convergence
    { from: 'origin-1', to: 'split', type: 'solid', dimension: 'LATTICE' },
    { from: 'origin-2', to: 'split', type: 'solid', dimension: 'LATTICE' },
    { from: 'origin-3', to: 'split', type: 'solid', dimension: 'LATTICE' },
    // Player 1 LATTICE path
    { from: 'split', to: 'l-path', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-path', to: 'l-witness', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-witness', to: 'l-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-switch', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Player 2 MARROW path
    { from: 'split', to: 'to-marrow', type: 'solid', dimension: 'LATTICE' },
    { from: 'm-entry', to: 'm-charge', type: 'solid', dimension: 'MARROW' },
    { from: 'm-charge', to: 'm-switch', type: 'solid', dimension: 'MARROW' },
    { from: 'm-switch', to: 'nexus', type: 'solid', dimension: 'MARROW' },
    // Player 3 VOID path
    { from: 'split', to: 'to-void', type: 'solid', dimension: 'LATTICE' },
    { from: 'v-entry', to: 'v-drift', type: 'hidden', dimension: 'VOID' },
    { from: 'v-drift', to: 'v-switch', type: 'hidden', dimension: 'VOID' },
    { from: 'v-switch', to: 'nexus', type: 'hidden', dimension: 'VOID' },
    // Final
    { from: 'nexus', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'to-marrow', action: 'dimension-shift', data: { to: 'MARROW' } },
    { type: 'activate', nodeId: 'to-void', action: 'dimension-shift', data: { to: 'VOID' } },
    { type: 'activate', nodeId: 'l-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 1 } },
    { type: 'activate', nodeId: 'm-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 2 } },
    { type: 'activate', nodeId: 'v-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 3 } }
  ],

  objectives: {
    primary: 'Each master a dimension, then reunite',
    hidden: ['All switches within 3 seconds', 'No dimension revisits', 'Under par time']
  },

  victoryCondition: { type: 'synchronize', targets: ['nexus', 'dest'] },

  mechanics: [
    'attention-movement',
    'witness-mode',
    'dimension-shifting',
    'node-charging',
    'void-navigation',
    'synchronization'
  ],
  coopMechanics: ['synchronized-focus', 'split-perception'],

  minPlayers: 3, maxPlayers: 3,
  difficulty: 8,
  parTime: 120,
  perfectTime: 70,
  ambience: 'mixed',
  visualTheme: 'ascension',
  specialEffects: ['triad-glow', 'dimension-merge']
};

// =============================================================================
// EXPORTS
// =============================================================================

export const TRIO_LEVELS = [
  TRIO_1_TRIANGLE,
  TRIO_2_CHAIN,
  TRIO_3_THREE_DIMENSIONS,
  TRIO_4_WITNESS_TRIANGLE,
  TRIO_5_TRIAD
];

export const TRIO_LEVEL_IDS = TRIO_LEVELS.map(l => l.id);
