/**
 * DuoLevels.ts
 *
 * 5 dedicated two-player cooperative levels
 * Designed for streamer duos: communication required, viewer can pick sides
 */

import { DimensionType } from '../core/DimensionManager';
import { StaticLevelDefinition } from './StaticLevels';

// =============================================================================
// DUO LEVEL 1: PARTNERS
// =============================================================================

export const DUO_1_PARTNERS: StaticLevelDefinition = {
  id: 'duo-partners',
  seed: 0x50200001,
  name: 'Partners',
  subtitle: 'Two keys. One door.',
  chapter: 201,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    // Player 1 origin (top)
    { id: 'origin-1', position: { x: 0, y: 4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff6666' } },
    // Player 2 origin (bottom)
    { id: 'origin-2', position: { x: 0, y: -4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#6666ff' } },
    // Parallel paths
    { id: 'p1-w1', position: { x: 4, y: 4, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'p2-w1', position: { x: 4, y: -4, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'p1-w2', position: { x: 8, y: 3, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'p2-w2', position: { x: 8, y: -3, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    // Sync gate - requires both players
    { id: 'sync-gate', position: { x: 12, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 2, properties: { color: '#ffff00', label: 'together' } },
    // After gate
    { id: 'together', position: { x: 16, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 500 },
    { id: 'dest', position: { x: 20, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    // Player 1 path
    { from: 'origin-1', to: 'p1-w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'p1-w1', to: 'p1-w2', type: 'solid', dimension: 'LATTICE' },
    { from: 'p1-w2', to: 'sync-gate', type: 'solid', dimension: 'LATTICE' },
    // Player 2 path
    { from: 'origin-2', to: 'p2-w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'p2-w1', to: 'p2-w2', type: 'solid', dimension: 'LATTICE' },
    { from: 'p2-w2', to: 'sync-gate', type: 'solid', dimension: 'LATTICE' },
    // After gate
    { from: 'sync-gate', to: 'together', type: 'solid', dimension: 'LATTICE' },
    { from: 'together', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  objectives: { primary: 'Reach the gate together', hidden: ['Sync within 0.5 seconds', 'No backtracking'] },
  victoryCondition: { type: 'synchronize', targets: ['sync-gate'] },
  mechanics: ['attention-movement', 'synchronization'],
  newMechanic: 'synchronization',
  coopMechanics: ['synchronized-focus'],

  minPlayers: 2, maxPlayers: 2,
  difficulty: 3,
  parTime: 40,
  perfectTime: 18,
  ambience: 'crystalline',
  visualTheme: 'duality'
};

// =============================================================================
// DUO LEVEL 2: RELAY RACE
// =============================================================================

export const DUO_2_RELAY: StaticLevelDefinition = {
  id: 'duo-relay',
  seed: 0x50200002,
  name: 'Relay Race',
  subtitle: 'One watches. One runs.',
  chapter: 202,

  dimensions: ['LATTICE', 'MARROW'],
  startDimension: 'LATTICE',

  nodes: [
    // Watcher starts in LATTICE
    { id: 'origin-watcher', position: { x: 0, y: 6, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ffff00', label: 'watcher' } },
    // Runner starts in MARROW
    { id: 'origin-runner', position: { x: 0, y: -4, z: 2 }, type: 'origin', dimension: 'MARROW', properties: { color: '#00ffff', label: 'runner' } },
    // Watcher perch - can see into MARROW
    { id: 'perch', position: { x: 4, y: 6, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    // Runner's hidden path (only visible when witnessed)
    { id: 'r1', position: { x: 4, y: -2, z: 3 }, type: 'waypoint', dimension: 'MARROW', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'r2', position: { x: 8, y: 0, z: 4 }, type: 'waypoint', dimension: 'MARROW', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'r3', position: { x: 12, y: -2, z: 3 }, type: 'waypoint', dimension: 'MARROW', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'runner-switch', position: { x: 16, y: 0, z: 2 }, type: 'switch', dimension: 'MARROW', hiddenIn: ['LATTICE'] },
    // Watcher continues after switch
    { id: 'w-gate', position: { x: 10, y: 6, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'w-path', position: { x: 16, y: 6, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    // Reunion
    { id: 'reunion', position: { x: 20, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', requiredPlayers: 2, activationTime: 500 },
    { id: 'dest', position: { x: 24, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    // Watcher path
    { from: 'origin-watcher', to: 'perch', type: 'solid', dimension: 'LATTICE' },
    { from: 'perch', to: 'w-gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'w-gate', to: 'w-path', type: 'solid', dimension: 'LATTICE' },
    { from: 'w-path', to: 'reunion', type: 'solid', dimension: 'LATTICE' },
    // Runner path
    { from: 'origin-runner', to: 'r1', type: 'hidden', dimension: 'MARROW' },
    { from: 'r1', to: 'r2', type: 'hidden', dimension: 'MARROW' },
    { from: 'r2', to: 'r3', type: 'hidden', dimension: 'MARROW' },
    { from: 'r3', to: 'runner-switch', type: 'hidden', dimension: 'MARROW' },
    { from: 'runner-switch', to: 'reunion', type: 'solid', dimension: 'MARROW' },
    // Final
    { from: 'reunion', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'runner-switch', action: 'unlock', target: 'w-gate' },
    { type: 'activate', nodeId: 'runner-switch', action: 'dimension-shift', data: { to: 'LATTICE' } }
  ],

  objectives: { primary: 'Watcher guides Runner through the dark', hidden: ['Runner never stops', 'Complete under par'] },
  victoryCondition: { type: 'synchronize', targets: ['reunion', 'dest'] },
  mechanics: ['attention-movement', 'witness-mode', 'dimension-shifting', 'relay-mechanics'],
  newMechanic: 'relay-mechanics',
  coopMechanics: ['relay-witness', 'split-perception'],

  minPlayers: 2, maxPlayers: 2,
  difficulty: 5,
  parTime: 90,
  perfectTime: 50,
  ambience: 'mixed',
  visualTheme: 'guidance'
};

// =============================================================================
// DUO LEVEL 3: MIRROR TWINS
// =============================================================================

export const DUO_3_MIRROR_TWINS: StaticLevelDefinition = {
  id: 'duo-mirror-twins',
  seed: 0x50200003,
  name: 'Mirror Twins',
  subtitle: 'Move in sync. Move inverted.',
  chapter: 203,

  dimensions: ['LATTICE', 'MARROW'],
  startDimension: 'LATTICE',

  nodes: [
    // Player 1 in LATTICE
    { id: 'origin-1', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff6666' } },
    // Player 2 in MARROW (mirrored position)
    { id: 'origin-2', position: { x: 0, y: 0, z: 4 }, type: 'origin', dimension: 'MARROW', properties: { color: '#6666ff' } },
    // Mirrored paths - must move together
    { id: 'l1', position: { x: 4, y: 2, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'm1', position: { x: 4, y: -2, z: 4 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 }, // Inverted Y
    { id: 'l2', position: { x: 8, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'm2', position: { x: 8, y: 0, z: 4 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    // Sync switches - must hit simultaneously
    { id: 'l-switch', position: { x: 12, y: 2, z: 0 }, type: 'switch', dimension: 'LATTICE', activationTime: 500, properties: { color: '#ff0000' } },
    { id: 'm-switch', position: { x: 12, y: -2, z: 4 }, type: 'switch', dimension: 'MARROW', activationTime: 500, properties: { color: '#0000ff' } },
    // Gate opens when both hit within 1 second
    { id: 'gate', position: { x: 16, y: 0, z: 2 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 2, properties: { locked: true } },
    { id: 'dest', position: { x: 20, y: 0, z: 2 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    // LATTICE path
    { from: 'origin-1', to: 'l1', type: 'solid', dimension: 'LATTICE' },
    { from: 'l1', to: 'l2', type: 'solid', dimension: 'LATTICE' },
    { from: 'l2', to: 'l-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-switch', to: 'gate', type: 'solid', dimension: 'LATTICE' },
    // MARROW path (mirrored)
    { from: 'origin-2', to: 'm1', type: 'solid', dimension: 'MARROW' },
    { from: 'm1', to: 'm2', type: 'solid', dimension: 'MARROW' },
    { from: 'm2', to: 'm-switch', type: 'solid', dimension: 'MARROW' },
    { from: 'm-switch', to: 'gate', type: 'solid', dimension: 'MARROW' },
    // Final
    { from: 'gate', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'l-switch', action: 'unlock', target: 'gate', data: { partialUnlock: 1, syncWindow: 1000 } },
    { type: 'activate', nodeId: 'm-switch', action: 'unlock', target: 'gate', data: { partialUnlock: 2, syncWindow: 1000 } }
  ],

  objectives: { primary: 'Move as mirror images', hidden: ['Perfect sync on switches', 'No position mismatch'] },
  victoryCondition: { type: 'synchronize', targets: ['gate', 'dest'] },
  mechanics: ['attention-movement', 'dimension-shifting', 'mirror-mechanics', 'synchronization'],
  newMechanic: 'mirror-sync',
  coopMechanics: ['synchronized-focus', 'split-perception'],

  minPlayers: 2, maxPlayers: 2,
  difficulty: 6,
  parTime: 75,
  perfectTime: 40,
  ambience: 'mixed',
  visualTheme: 'reflection'
};

// =============================================================================
// DUO LEVEL 4: VOID CROSSING
// =============================================================================

export const DUO_4_VOID_CROSSING: StaticLevelDefinition = {
  id: 'duo-void-crossing',
  seed: 0x50200004,
  name: 'Void Crossing',
  subtitle: 'One anchors. One drifts.',
  chapter: 204,

  dimensions: ['LATTICE', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    // Both start in LATTICE
    { id: 'origin-1', position: { x: 0, y: 2, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ffff00', label: 'anchor' } },
    { id: 'origin-2', position: { x: 0, y: -2, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#00ffff', label: 'drifter' } },
    // Anchor stays in LATTICE to witness
    { id: 'anchor-perch', position: { x: 4, y: 4, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    { id: 'anchor-2', position: { x: 8, y: 4, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    { id: 'anchor-3', position: { x: 12, y: 4, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    // Drifter enters void
    { id: 'void-portal', position: { x: 4, y: -2, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#220022' } },
    // Void path (only visible when witnessed from LATTICE)
    { id: 'v1', position: { x: 6, y: 0, z: 4 }, type: 'void', dimension: 'VOID', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'v2', position: { x: 8, y: -2, z: 6 }, type: 'void', dimension: 'VOID', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'v3', position: { x: 10, y: 1, z: 5 }, type: 'void', dimension: 'VOID', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'v-exit', position: { x: 14, y: 0, z: 0 }, type: 'switch', dimension: 'VOID', hiddenIn: ['LATTICE'], properties: { color: '#00ffff' } },
    // Reunion
    { id: 'reunion', position: { x: 18, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', requiredPlayers: 2, activationTime: 500 },
    { id: 'dest', position: { x: 22, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    // Anchor path
    { from: 'origin-1', to: 'anchor-perch', type: 'solid', dimension: 'LATTICE' },
    { from: 'anchor-perch', to: 'anchor-2', type: 'solid', dimension: 'LATTICE' },
    { from: 'anchor-2', to: 'anchor-3', type: 'solid', dimension: 'LATTICE' },
    { from: 'anchor-3', to: 'reunion', type: 'solid', dimension: 'LATTICE' },
    // Drifter path
    { from: 'origin-2', to: 'void-portal', type: 'solid', dimension: 'LATTICE' },
    { from: 'void-portal', to: 'v1', type: 'hidden', dimension: 'VOID' },
    { from: 'v1', to: 'v2', type: 'hidden', dimension: 'VOID' },
    { from: 'v2', to: 'v3', type: 'hidden', dimension: 'VOID' },
    { from: 'v3', to: 'v-exit', type: 'hidden', dimension: 'VOID' },
    { from: 'v-exit', to: 'reunion', type: 'solid', dimension: 'LATTICE' },
    // Final
    { from: 'reunion', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'void-portal', action: 'dimension-shift', data: { to: 'VOID' } },
    { type: 'activate', nodeId: 'v-exit', action: 'dimension-shift', data: { to: 'LATTICE' } }
  ],

  objectives: { primary: 'Anchor guides Drifter through void', hidden: ['Anchor never stops witnessing', 'Drifter no backtracking'] },
  victoryCondition: { type: 'synchronize', targets: ['reunion', 'dest'] },
  mechanics: ['attention-movement', 'witness-mode', 'void-navigation', 'relay-mechanics'],
  coopMechanics: ['relay-witness', 'split-perception'],

  minPlayers: 2, maxPlayers: 2,
  difficulty: 7,
  parTime: 120,
  perfectTime: 65,
  ambience: 'void',
  visualTheme: 'trust'
};

// =============================================================================
// DUO LEVEL 5: ORTHOGONAL PAIR
// =============================================================================

export const DUO_5_ORTHOGONAL_PAIR: StaticLevelDefinition = {
  id: 'duo-orthogonal',
  seed: 0x50200005,
  name: 'Orthogonal Pair',
  subtitle: 'Perpendicular paths. One goal.',
  chapter: 205,

  completionText: 'Duo mastery achieved. Three awaits.',

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    // Player 1: Dimensional traveler
    { id: 'origin-1', position: { x: 0, y: 4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff6666', label: 'traveler' } },
    // Player 2: Witness guardian
    { id: 'origin-2', position: { x: 0, y: -4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#6666ff', label: 'guardian' } },
    // Traveler path
    { id: 't1', position: { x: 4, y: 4, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 't-to-marrow', position: { x: 8, y: 4, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#ff6600' } },
    { id: 't-m1', position: { x: 8, y: 4, z: 4 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 't-m2', position: { x: 12, y: 2, z: 5 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 't-switch', position: { x: 14, y: 0, z: 4 }, type: 'switch', dimension: 'MARROW', properties: { color: '#00ff88' } },
    // Guardian path (witness stations)
    { id: 'g1', position: { x: 4, y: -4, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    { id: 'g2', position: { x: 8, y: -4, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    { id: 'g-to-void', position: { x: 12, y: -4, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#220022' } },
    { id: 'g-v1', position: { x: 12, y: -2, z: -4 }, type: 'void', dimension: 'VOID', hiddenIn: ['MARROW'], activationTime: 0 },
    { id: 'g-v-key', position: { x: 14, y: 0, z: -6 }, type: 'witness', dimension: 'VOID', hiddenIn: ['MARROW'], properties: { color: '#8800ff' } },
    // Hidden nodes (traveler reveals for guardian)
    { id: 'hidden-1', position: { x: 10, y: 0, z: 2 }, type: 'waypoint', dimension: 'MARROW', hiddenIn: ['LATTICE'], activationTime: 0 },
    // Final gate and destination
    { id: 'final-gate', position: { x: 18, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 2, properties: { locked: true } },
    { id: 'dest', position: { x: 22, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE', properties: { color: '#ffd700' } }
  ],

  edges: [
    // Traveler LATTICE
    { from: 'origin-1', to: 't1', type: 'solid', dimension: 'LATTICE' },
    { from: 't1', to: 't-to-marrow', type: 'solid', dimension: 'LATTICE' },
    // Traveler MARROW
    { from: 't-m1', to: 't-m2', type: 'solid', dimension: 'MARROW' },
    { from: 't-m2', to: 'hidden-1', type: 'dashed', dimension: 'MARROW' },
    { from: 'hidden-1', to: 't-switch', type: 'solid', dimension: 'MARROW' },
    { from: 't-switch', to: 'final-gate', type: 'solid', dimension: 'MARROW' },
    // Guardian LATTICE
    { from: 'origin-2', to: 'g1', type: 'solid', dimension: 'LATTICE' },
    { from: 'g1', to: 'g2', type: 'solid', dimension: 'LATTICE' },
    { from: 'g2', to: 'g-to-void', type: 'solid', dimension: 'LATTICE' },
    // Guardian VOID
    { from: 'g-v1', to: 'g-v-key', type: 'hidden', dimension: 'VOID' },
    { from: 'g-v-key', to: 'final-gate', type: 'hidden', dimension: 'VOID' },
    // Final
    { from: 'final-gate', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 't-to-marrow', action: 'dimension-shift', data: { to: 'MARROW' } },
    { type: 'activate', nodeId: 'g-to-void', action: 'dimension-shift', data: { to: 'VOID' } },
    { type: 'witness', nodeId: 'g1', action: 'reveal', target: 'hidden-1' },
    { type: 'activate', nodeId: 't-switch', action: 'unlock', target: 'final-gate', data: { partialUnlock: 1 } },
    { type: 'witness', nodeId: 'g-v-key', action: 'unlock', target: 'final-gate', data: { partialUnlock: 2 } }
  ],

  objectives: {
    primary: 'Traveler and Guardian unlock the final gate',
    hidden: ['Both keys within 5 seconds', 'Guardian witnesses all hidden nodes', 'Under par time']
  },

  victoryCondition: { type: 'synchronize', targets: ['final-gate', 'dest'] },

  mechanics: [
    'attention-movement',
    'witness-mode',
    'dimension-shifting',
    'void-navigation',
    'relay-mechanics',
    'synchronization'
  ],
  coopMechanics: ['synchronized-focus', 'split-perception', 'relay-witness'],

  minPlayers: 2, maxPlayers: 2,
  difficulty: 8,
  parTime: 150,
  perfectTime: 80,
  ambience: 'mixed',
  visualTheme: 'convergence',
  specialEffects: ['dual-trails', 'sync-pulse', 'orthogonal-grid']
};

// =============================================================================
// EXPORTS
// =============================================================================

export const DUO_LEVELS = [
  DUO_1_PARTNERS,
  DUO_2_RELAY,
  DUO_3_MIRROR_TWINS,
  DUO_4_VOID_CROSSING,
  DUO_5_ORTHOGONAL_PAIR
];

export const DUO_LEVEL_IDS = DUO_LEVELS.map(l => l.id);
