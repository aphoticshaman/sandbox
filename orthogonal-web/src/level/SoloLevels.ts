/**
 * SoloLevels.ts
 *
 * 10 dedicated single-player levels for Orthogonal
 * Designed for streamers: quick rounds, clear moments, viewer predictions
 */

import { DimensionType } from '../core/DimensionManager';
import { StaticLevelDefinition, NodeDefinition, EdgeDefinition } from './StaticLevels';

// =============================================================================
// SOLO LEVEL 1: AWAKENING
// =============================================================================

export const SOLO_1_AWAKENING: StaticLevelDefinition = {
  id: 'solo-awakening',
  seed: 0x50100001,
  name: 'Awakening',
  subtitle: 'First breath of attention.',
  chapter: 101,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    { id: 'origin', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE' },
    { id: 'w1', position: { x: 3, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'w2', position: { x: 6, y: 2, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'w3', position: { x: 9, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'dest', position: { x: 12, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin', to: 'w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'w1', to: 'w2', type: 'solid', dimension: 'LATTICE' },
    { from: 'w2', to: 'w3', type: 'solid', dimension: 'LATTICE' },
    { from: 'w3', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  objectives: { primary: 'Reach the destination', hidden: ['Complete in under 10 seconds'] },
  victoryCondition: { type: 'reach', targets: ['dest'] },
  mechanics: ['attention-movement'],
  newMechanic: 'attention-movement',

  minPlayers: 1, maxPlayers: 1,
  difficulty: 1,
  parTime: 20,
  perfectTime: 8,
  ambience: 'crystalline',
  visualTheme: 'dawn'
};

// =============================================================================
// SOLO LEVEL 2: FORK
// =============================================================================

export const SOLO_2_FORK: StaticLevelDefinition = {
  id: 'solo-fork',
  seed: 0x50100002,
  name: 'Fork',
  subtitle: 'Two paths. One choice.',
  chapter: 102,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    { id: 'origin', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE' },
    { id: 'branch', position: { x: 4, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 300 },
    // Upper path - scenic
    { id: 'up1', position: { x: 6, y: 3, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'up2', position: { x: 10, y: 4, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    // Lower path - direct
    { id: 'down1', position: { x: 8, y: -2, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    // Merge
    { id: 'merge', position: { x: 14, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'dest', position: { x: 18, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin', to: 'branch', type: 'solid', dimension: 'LATTICE' },
    { from: 'branch', to: 'up1', type: 'solid', dimension: 'LATTICE' },
    { from: 'up1', to: 'up2', type: 'solid', dimension: 'LATTICE' },
    { from: 'up2', to: 'merge', type: 'solid', dimension: 'LATTICE' },
    { from: 'branch', to: 'down1', type: 'solid', dimension: 'LATTICE' },
    { from: 'down1', to: 'merge', type: 'solid', dimension: 'LATTICE' },
    { from: 'merge', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  objectives: { primary: 'Choose your path', hidden: ['Take upper path', 'Take lower path'] },
  victoryCondition: { type: 'reach', targets: ['dest'] },
  mechanics: ['attention-movement', 'branching-paths'],
  newMechanic: 'branching-paths',

  minPlayers: 1, maxPlayers: 1,
  difficulty: 2,
  parTime: 30,
  perfectTime: 15,
  ambience: 'crystalline',
  visualTheme: 'choice'
};

// =============================================================================
// SOLO LEVEL 3: STILLNESS
// =============================================================================

export const SOLO_3_STILLNESS: StaticLevelDefinition = {
  id: 'solo-stillness',
  seed: 0x50100003,
  name: 'Stillness',
  subtitle: 'Hold your gaze.',
  chapter: 103,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    { id: 'origin', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE' },
    { id: 'w1', position: { x: 4, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'witness-point', position: { x: 8, y: 0, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 2000, properties: { label: 'observe' } },
    { id: 'hidden', position: { x: 8, y: 4, z: 2 }, type: 'waypoint', dimension: 'LATTICE', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'gate', position: { x: 12, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'dest', position: { x: 16, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin', to: 'w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'w1', to: 'witness-point', type: 'solid', dimension: 'LATTICE' },
    { from: 'witness-point', to: 'hidden', type: 'witness-only', dimension: 'LATTICE' },
    { from: 'witness-point', to: 'gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'gate', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'witness', nodeId: 'hidden', action: 'unlock', target: 'gate' }
  ],

  objectives: { primary: 'Witness to unlock', hidden: ['Witness for 5+ seconds'] },
  victoryCondition: { type: 'reach', targets: ['dest'] },
  mechanics: ['attention-movement', 'witness-mode'],
  newMechanic: 'witness-mode',

  minPlayers: 1, maxPlayers: 1,
  difficulty: 3,
  parTime: 45,
  perfectTime: 25,
  ambience: 'crystalline',
  visualTheme: 'revelation'
};

// =============================================================================
// SOLO LEVEL 4: BETWEEN
// =============================================================================

export const SOLO_4_BETWEEN: StaticLevelDefinition = {
  id: 'solo-between',
  seed: 0x50100004,
  name: 'Between',
  subtitle: 'Reality has layers.',
  chapter: 104,

  dimensions: ['LATTICE', 'MARROW'],
  startDimension: 'LATTICE',

  nodes: [
    { id: 'origin', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE' },
    { id: 'l1', position: { x: 4, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'portal1', position: { x: 8, y: 0, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#ff6600' } },
    // MARROW
    { id: 'm-entry', position: { x: 8, y: 0, z: 0 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'm1', position: { x: 10, y: 2, z: 2 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'm2', position: { x: 12, y: 0, z: 3 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'portal2', position: { x: 14, y: 0, z: 0 }, type: 'switch', dimension: 'MARROW', properties: { color: '#00ff66' } },
    // Back to LATTICE
    { id: 'l-return', position: { x: 14, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'dest', position: { x: 18, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin', to: 'l1', type: 'solid', dimension: 'LATTICE' },
    { from: 'l1', to: 'portal1', type: 'solid', dimension: 'LATTICE' },
    { from: 'm-entry', to: 'm1', type: 'solid', dimension: 'MARROW' },
    { from: 'm1', to: 'm2', type: 'solid', dimension: 'MARROW' },
    { from: 'm2', to: 'portal2', type: 'solid', dimension: 'MARROW' },
    { from: 'l-return', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'portal1', action: 'dimension-shift', data: { to: 'MARROW' } },
    { type: 'activate', nodeId: 'portal2', action: 'dimension-shift', data: { to: 'LATTICE' } }
  ],

  objectives: { primary: 'Cross through MARROW', hidden: ['Spend under 10s in MARROW'] },
  victoryCondition: { type: 'reach', targets: ['dest'] },
  mechanics: ['attention-movement', 'dimension-shifting'],
  newMechanic: 'dimension-shifting',

  minPlayers: 1, maxPlayers: 1,
  difficulty: 4,
  parTime: 50,
  perfectTime: 28,
  ambience: 'mixed',
  visualTheme: 'transition'
};

// =============================================================================
// SOLO LEVEL 5: PATIENCE
// =============================================================================

export const SOLO_5_PATIENCE: StaticLevelDefinition = {
  id: 'solo-patience',
  seed: 0x50100005,
  name: 'Patience',
  subtitle: 'Some things take time.',
  chapter: 105,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    { id: 'origin', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE' },
    { id: 'charge1', position: { x: 4, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 1500, properties: { pulseRate: 400 } },
    { id: 'charge2', position: { x: 8, y: 2, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 2500, properties: { pulseRate: 300 } },
    { id: 'charge3', position: { x: 12, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 3000, properties: { pulseRate: 250 } },
    { id: 'dest', position: { x: 16, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin', to: 'charge1', type: 'solid', dimension: 'LATTICE' },
    { from: 'charge1', to: 'charge2', type: 'solid', dimension: 'LATTICE' },
    { from: 'charge2', to: 'charge3', type: 'solid', dimension: 'LATTICE' },
    { from: 'charge3', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  objectives: { primary: 'Charge each node fully', hidden: ['Never release early'] },
  victoryCondition: { type: 'reach', targets: ['dest'] },
  mechanics: ['attention-movement', 'node-charging'],
  newMechanic: 'node-charging',

  minPlayers: 1, maxPlayers: 1,
  difficulty: 4,
  parTime: 40,
  perfectTime: 22,
  ambience: 'crystalline',
  visualTheme: 'patience'
};

// =============================================================================
// SOLO LEVEL 6: ABYSS
// =============================================================================

export const SOLO_6_ABYSS: StaticLevelDefinition = {
  id: 'solo-abyss',
  seed: 0x50100006,
  name: 'Abyss',
  subtitle: 'The void stares back.',
  chapter: 106,

  dimensions: ['LATTICE', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    { id: 'origin', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE' },
    { id: 'edge', position: { x: 6, y: 0, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#220022', label: 'leap' } },
    // VOID
    { id: 'v-entry', position: { x: 6, y: 0, z: 0 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'v1', position: { x: 8, y: 3, z: 4 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'v2', position: { x: 10, y: -2, z: 6 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'v3', position: { x: 14, y: 1, z: 3 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'v-exit', position: { x: 18, y: 0, z: 0 }, type: 'switch', dimension: 'VOID', properties: { color: '#00ffff' } },
    // Return
    { id: 'l-return', position: { x: 18, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'dest', position: { x: 22, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin', to: 'edge', type: 'solid', dimension: 'LATTICE' },
    { from: 'v-entry', to: 'v1', type: 'hidden', dimension: 'VOID' },
    { from: 'v1', to: 'v2', type: 'hidden', dimension: 'VOID' },
    { from: 'v2', to: 'v3', type: 'hidden', dimension: 'VOID' },
    { from: 'v3', to: 'v-exit', type: 'hidden', dimension: 'VOID' },
    { from: 'l-return', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'edge', action: 'dimension-shift', data: { to: 'VOID' } },
    { type: 'activate', nodeId: 'v-exit', action: 'dimension-shift', data: { to: 'LATTICE' } }
  ],

  objectives: { primary: 'Navigate the void', hidden: ['No hesitation', 'Witness in void'] },
  victoryCondition: { type: 'reach', targets: ['dest'] },
  mechanics: ['attention-movement', 'dimension-shifting', 'void-navigation'],
  newMechanic: 'void-navigation',

  minPlayers: 1, maxPlayers: 1,
  difficulty: 5,
  parTime: 60,
  perfectTime: 35,
  ambience: 'void',
  visualTheme: 'emptiness'
};

// =============================================================================
// SOLO LEVEL 7: REFLECTION
// =============================================================================

export const SOLO_7_REFLECTION: StaticLevelDefinition = {
  id: 'solo-reflection',
  seed: 0x50100007,
  name: 'Reflection',
  subtitle: 'See yourself seeing.',
  chapter: 107,

  dimensions: ['LATTICE', 'MARROW'],
  startDimension: 'LATTICE',

  nodes: [
    { id: 'origin', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE' },
    { id: 'l1', position: { x: 4, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'mirror1', position: { x: 8, y: 0, z: 0 }, type: 'mirror', dimension: 'LATTICE', properties: { label: 'reflect' } },
    // Hidden until witnessed from MARROW
    { id: 'hidden-path', position: { x: 10, y: 3, z: 0 }, type: 'waypoint', dimension: 'LATTICE', hiddenIn: ['MARROW'], activationTime: 0 },
    // MARROW side
    { id: 'm-mirror', position: { x: 8, y: 0, z: 0 }, type: 'mirror', dimension: 'MARROW' },
    { id: 'm1', position: { x: 6, y: -2, z: 2 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'm-witness', position: { x: 4, y: -4, z: 3 }, type: 'witness', dimension: 'MARROW', properties: { color: '#00ff00' } },
    // Gate and dest
    { id: 'gate', position: { x: 14, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'dest', position: { x: 18, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin', to: 'l1', type: 'solid', dimension: 'LATTICE' },
    { from: 'l1', to: 'mirror1', type: 'solid', dimension: 'LATTICE' },
    { from: 'mirror1', to: 'hidden-path', type: 'dashed', dimension: 'LATTICE' },
    { from: 'hidden-path', to: 'gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'gate', to: 'dest', type: 'solid', dimension: 'LATTICE' },
    { from: 'm-mirror', to: 'm1', type: 'solid', dimension: 'MARROW' },
    { from: 'm1', to: 'm-witness', type: 'solid', dimension: 'MARROW' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'mirror1', action: 'dimension-shift', data: { to: 'MARROW' } },
    { type: 'activate', nodeId: 'm-mirror', action: 'dimension-shift', data: { to: 'LATTICE' } },
    { type: 'witness', nodeId: 'm-witness', action: 'reveal', target: 'hidden-path' },
    { type: 'enter', nodeId: 'hidden-path', action: 'unlock', target: 'gate' }
  ],

  objectives: { primary: 'Use mirrors to reveal the path', hidden: ['Single mirror transition'] },
  victoryCondition: { type: 'reach', targets: ['dest'] },
  mechanics: ['attention-movement', 'dimension-shifting', 'mirror-mechanics', 'witness-mode'],
  newMechanic: 'mirror-mechanics',

  minPlayers: 1, maxPlayers: 1,
  difficulty: 6,
  parTime: 90,
  perfectTime: 50,
  ambience: 'mixed',
  visualTheme: 'reflection'
};

// =============================================================================
// SOLO LEVEL 8: SEQUENCE
// =============================================================================

export const SOLO_8_SEQUENCE: StaticLevelDefinition = {
  id: 'solo-sequence',
  seed: 0x50100008,
  name: 'Sequence',
  subtitle: 'Order matters.',
  chapter: 108,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    { id: 'origin', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE' },
    { id: 'hub', position: { x: 6, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    // Three switches - must be hit in order
    { id: 'sw-a', position: { x: 4, y: 4, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#ff0000', label: 'A' } },
    { id: 'sw-b', position: { x: 8, y: 4, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#00ff00', label: 'B' } },
    { id: 'sw-c', position: { x: 6, y: -4, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#0000ff', label: 'C' } },
    // Gate
    { id: 'gate', position: { x: 12, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'dest', position: { x: 16, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin', to: 'hub', type: 'solid', dimension: 'LATTICE' },
    { from: 'hub', to: 'sw-a', type: 'solid', dimension: 'LATTICE' },
    { from: 'hub', to: 'sw-b', type: 'solid', dimension: 'LATTICE' },
    { from: 'hub', to: 'sw-c', type: 'solid', dimension: 'LATTICE' },
    { from: 'sw-a', to: 'hub', type: 'solid', dimension: 'LATTICE' },
    { from: 'sw-b', to: 'hub', type: 'solid', dimension: 'LATTICE' },
    { from: 'sw-c', to: 'hub', type: 'solid', dimension: 'LATTICE' },
    { from: 'hub', to: 'gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'gate', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'sw-c', action: 'unlock', target: 'gate', data: { requireSequence: ['sw-a', 'sw-b', 'sw-c'] } }
  ],

  objectives: { primary: 'Activate switches in order: A → B → C', hidden: ['Perfect sequence first try'] },
  victoryCondition: { type: 'sequence', targets: ['sw-a', 'sw-b', 'sw-c'], order: true },
  mechanics: ['attention-movement', 'sequence-solving'],
  newMechanic: 'sequence-solving',

  minPlayers: 1, maxPlayers: 1,
  difficulty: 5,
  parTime: 60,
  perfectTime: 30,
  ambience: 'crystalline',
  visualTheme: 'logic'
};

// =============================================================================
// SOLO LEVEL 9: TRINITY
// =============================================================================

export const SOLO_9_TRINITY: StaticLevelDefinition = {
  id: 'solo-trinity',
  seed: 0x50100009,
  name: 'Trinity',
  subtitle: 'Three dimensions. One path.',
  chapter: 109,

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    { id: 'origin', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE' },
    { id: 'l1', position: { x: 4, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'to-marrow', position: { x: 8, y: 0, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#ff6600' } },
    // MARROW section
    { id: 'm-entry', position: { x: 8, y: 0, z: 0 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'm1', position: { x: 10, y: 2, z: 2 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'to-void', position: { x: 12, y: 0, z: 4 }, type: 'switch', dimension: 'MARROW', properties: { color: '#220022' } },
    // VOID section
    { id: 'v-entry', position: { x: 12, y: 0, z: 4 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'v1', position: { x: 14, y: -2, z: 6 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'to-lattice', position: { x: 16, y: 0, z: 0 }, type: 'switch', dimension: 'VOID', properties: { color: '#00ffff' } },
    // Back to LATTICE
    { id: 'l-return', position: { x: 16, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'dest', position: { x: 20, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin', to: 'l1', type: 'solid', dimension: 'LATTICE' },
    { from: 'l1', to: 'to-marrow', type: 'solid', dimension: 'LATTICE' },
    { from: 'm-entry', to: 'm1', type: 'solid', dimension: 'MARROW' },
    { from: 'm1', to: 'to-void', type: 'solid', dimension: 'MARROW' },
    { from: 'v-entry', to: 'v1', type: 'hidden', dimension: 'VOID' },
    { from: 'v1', to: 'to-lattice', type: 'hidden', dimension: 'VOID' },
    { from: 'l-return', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'to-marrow', action: 'dimension-shift', data: { to: 'MARROW' } },
    { type: 'activate', nodeId: 'to-void', action: 'dimension-shift', data: { to: 'VOID' } },
    { type: 'activate', nodeId: 'to-lattice', action: 'dimension-shift', data: { to: 'LATTICE' } }
  ],

  objectives: { primary: 'Traverse all three dimensions', hidden: ['Under 45 seconds', 'No backtracking'] },
  victoryCondition: { type: 'reach', targets: ['dest'] },
  mechanics: ['attention-movement', 'dimension-shifting', 'void-navigation'],

  minPlayers: 1, maxPlayers: 1,
  difficulty: 7,
  parTime: 75,
  perfectTime: 40,
  ambience: 'mixed',
  visualTheme: 'convergence'
};

// =============================================================================
// SOLO LEVEL 10: TRANSCENDENCE
// =============================================================================

export const SOLO_10_TRANSCENDENCE: StaticLevelDefinition = {
  id: 'solo-transcendence',
  seed: 0x5010000A,
  name: 'Transcendence',
  subtitle: 'Beyond dimensions.',
  chapter: 110,

  completionText: 'Solo mastery achieved. The infinite awaits.',

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    { id: 'origin', position: { x: 0, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE' },
    // Complex multi-dimensional puzzle
    { id: 'l-hub', position: { x: 4, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'l-witness', position: { x: 2, y: 4, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 1000 },
    { id: 'l-mirror', position: { x: 6, y: 4, z: 0 }, type: 'mirror', dimension: 'LATTICE' },
    { id: 'l-charge', position: { x: 4, y: -4, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 3000, properties: { pulseRate: 200 } },
    // MARROW layer
    { id: 'm-hub', position: { x: 6, y: 4, z: 0 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'm-path', position: { x: 8, y: 6, z: 2 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'm-key', position: { x: 10, y: 4, z: 3 }, type: 'switch', dimension: 'MARROW', properties: { color: '#00ff88' } },
    { id: 'm-to-void', position: { x: 12, y: 2, z: 4 }, type: 'switch', dimension: 'MARROW', properties: { color: '#220022' } },
    // VOID layer
    { id: 'v-entry', position: { x: 12, y: 2, z: 4 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'v-hidden', position: { x: 10, y: 0, z: 6 }, type: 'void', dimension: 'VOID', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'v-gate-key', position: { x: 8, y: -2, z: 8 }, type: 'witness', dimension: 'VOID', properties: { color: '#8800ff' } },
    { id: 'v-exit', position: { x: 14, y: 0, z: 0 }, type: 'switch', dimension: 'VOID', properties: { color: '#00ffff' } },
    // Final section
    { id: 'l-final', position: { x: 14, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'final-gate', position: { x: 18, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true, color: '#ffffff' } },
    { id: 'dest', position: { x: 22, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE', properties: { color: '#ffd700' } }
  ],

  edges: [
    // LATTICE
    { from: 'origin', to: 'l-hub', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-hub', to: 'l-witness', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-hub', to: 'l-mirror', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-hub', to: 'l-charge', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-charge', to: 'l-hub', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-final', to: 'final-gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'final-gate', to: 'dest', type: 'solid', dimension: 'LATTICE' },
    // MARROW
    { from: 'm-hub', to: 'm-path', type: 'solid', dimension: 'MARROW' },
    { from: 'm-path', to: 'm-key', type: 'solid', dimension: 'MARROW' },
    { from: 'm-key', to: 'm-to-void', type: 'solid', dimension: 'MARROW' },
    // VOID
    { from: 'v-entry', to: 'v-hidden', type: 'hidden', dimension: 'VOID' },
    { from: 'v-hidden', to: 'v-gate-key', type: 'hidden', dimension: 'VOID' },
    { from: 'v-gate-key', to: 'v-exit', type: 'hidden', dimension: 'VOID' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'l-mirror', action: 'dimension-shift', data: { to: 'MARROW' } },
    { type: 'activate', nodeId: 'm-to-void', action: 'dimension-shift', data: { to: 'VOID' } },
    { type: 'activate', nodeId: 'v-exit', action: 'dimension-shift', data: { to: 'LATTICE' } },
    { type: 'witness', nodeId: 'l-witness', action: 'reveal', target: 'v-hidden' },
    { type: 'activate', nodeId: 'm-key', action: 'unlock', target: 'final-gate', data: { partialUnlock: 1 } },
    { type: 'witness', nodeId: 'v-gate-key', action: 'unlock', target: 'final-gate', data: { partialUnlock: 2 } },
    { type: 'activate', nodeId: 'l-charge', action: 'unlock', target: 'final-gate', data: { partialUnlock: 3 } }
  ],

  objectives: {
    primary: 'Unlock all three seals and transcend',
    hidden: ['Complete under par', 'No dimension revisits', 'Perfect charge timing']
  },

  victoryCondition: { type: 'reach', targets: ['dest'] },

  mechanics: [
    'attention-movement',
    'witness-mode',
    'dimension-shifting',
    'mirror-mechanics',
    'node-charging',
    'void-navigation'
  ],

  minPlayers: 1, maxPlayers: 1,
  difficulty: 9,
  parTime: 180,
  perfectTime: 90,
  ambience: 'mixed',
  visualTheme: 'transcendence',
  specialEffects: ['dimension-overlay', 'final-revelation']
};

// =============================================================================
// EXPORTS
// =============================================================================

export const SOLO_LEVELS = [
  SOLO_1_AWAKENING,
  SOLO_2_FORK,
  SOLO_3_STILLNESS,
  SOLO_4_BETWEEN,
  SOLO_5_PATIENCE,
  SOLO_6_ABYSS,
  SOLO_7_REFLECTION,
  SOLO_8_SEQUENCE,
  SOLO_9_TRINITY,
  SOLO_10_TRANSCENDENCE
];

export const SOLO_LEVEL_IDS = SOLO_LEVELS.map(l => l.id);
