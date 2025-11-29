/**
 * QuadLevels.ts
 *
 * 5 dedicated four-player cooperative levels
 * Designed for squad streams: maximum chaos, viewer engagement, epic moments
 */

import { DimensionType } from '../core/DimensionManager';
import { StaticLevelDefinition } from './StaticLevels';

// =============================================================================
// QUAD LEVEL 1: CARDINAL
// =============================================================================

export const QUAD_1_CARDINAL: StaticLevelDefinition = {
  id: 'quad-cardinal',
  seed: 0x50400001,
  name: 'Cardinal',
  subtitle: 'North. South. East. West.',
  chapter: 401,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    // Four origins - cardinal directions
    { id: 'origin-n', position: { x: 0, y: 8, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff0000', label: 'north' } },
    { id: 'origin-s', position: { x: 0, y: -8, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#00ff00', label: 'south' } },
    { id: 'origin-e', position: { x: 8, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#0000ff', label: 'east' } },
    { id: 'origin-w', position: { x: -8, y: 0, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ffff00', label: 'west' } },
    // Paths toward center
    { id: 'n1', position: { x: 0, y: 6, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'n2', position: { x: 0, y: 4, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 's1', position: { x: 0, y: -6, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 's2', position: { x: 0, y: -4, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'e1', position: { x: 6, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'e2', position: { x: 4, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'w1', position: { x: -6, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'w2', position: { x: -4, y: 0, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    // Central nexus
    { id: 'nexus', position: { x: 0, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 4, properties: { color: '#ffffff', label: 'center' } },
    // Ascension
    { id: 'ascent', position: { x: 0, y: 0, z: 4 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 500 },
    { id: 'dest', position: { x: 0, y: 0, z: 8 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    { from: 'origin-n', to: 'n1', type: 'solid', dimension: 'LATTICE' },
    { from: 'n1', to: 'n2', type: 'solid', dimension: 'LATTICE' },
    { from: 'n2', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    { from: 'origin-s', to: 's1', type: 'solid', dimension: 'LATTICE' },
    { from: 's1', to: 's2', type: 'solid', dimension: 'LATTICE' },
    { from: 's2', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    { from: 'origin-e', to: 'e1', type: 'solid', dimension: 'LATTICE' },
    { from: 'e1', to: 'e2', type: 'solid', dimension: 'LATTICE' },
    { from: 'e2', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    { from: 'origin-w', to: 'w1', type: 'solid', dimension: 'LATTICE' },
    { from: 'w1', to: 'w2', type: 'solid', dimension: 'LATTICE' },
    { from: 'w2', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    { from: 'nexus', to: 'ascent', type: 'solid', dimension: 'LATTICE' },
    { from: 'ascent', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  objectives: { primary: 'All four converge at center', hidden: ['Perfect sync within 0.5s', 'No one waits'] },
  victoryCondition: { type: 'synchronize', targets: ['nexus'] },
  mechanics: ['attention-movement', 'synchronization'],
  newMechanic: 'quad-sync',
  coopMechanics: ['synchronized-focus'],

  minPlayers: 4, maxPlayers: 4,
  difficulty: 4,
  parTime: 50,
  perfectTime: 25,
  ambience: 'crystalline',
  visualTheme: 'compass'
};

// =============================================================================
// QUAD LEVEL 2: FOUR ELEMENTS
// =============================================================================

export const QUAD_2_ELEMENTS: StaticLevelDefinition = {
  id: 'quad-elements',
  seed: 0x50400002,
  name: 'Four Elements',
  subtitle: 'Fire. Water. Earth. Air.',
  chapter: 402,

  dimensions: ['LATTICE', 'MARROW'],
  startDimension: 'LATTICE',

  nodes: [
    // Origins with elemental themes
    { id: 'origin-fire', position: { x: -6, y: 6, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff4400', label: 'fire' } },
    { id: 'origin-water', position: { x: 6, y: 6, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#0044ff', label: 'water' } },
    { id: 'origin-earth', position: { x: -6, y: -6, z: 0 }, type: 'origin', dimension: 'MARROW', properties: { color: '#884400', label: 'earth' } },
    { id: 'origin-air', position: { x: 6, y: -6, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#88ffff', label: 'air' } },
    // Elemental switches
    { id: 'fire-switch', position: { x: -4, y: 4, z: 0 }, type: 'switch', dimension: 'LATTICE', activationTime: 1000, properties: { color: '#ff4400' } },
    { id: 'water-switch', position: { x: 4, y: 4, z: 0 }, type: 'switch', dimension: 'LATTICE', activationTime: 1000, properties: { color: '#0044ff' } },
    { id: 'earth-switch', position: { x: -4, y: -4, z: 2 }, type: 'switch', dimension: 'MARROW', activationTime: 1000, properties: { color: '#884400' } },
    { id: 'air-switch', position: { x: 4, y: -4, z: 0 }, type: 'switch', dimension: 'LATTICE', activationTime: 1000, properties: { color: '#88ffff' } },
    // Elemental gates (each opens for opposite)
    { id: 'fire-gate', position: { x: -2, y: 2, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'water-gate', position: { x: 2, y: 2, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'earth-gate', position: { x: -2, y: -2, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'air-gate', position: { x: 2, y: -2, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    // Nexus
    { id: 'nexus', position: { x: 0, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 4, properties: { locked: true, color: '#ffffff' } },
    { id: 'dest', position: { x: 0, y: 0, z: 4 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    // Fire path
    { from: 'origin-fire', to: 'fire-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'fire-switch', to: 'fire-gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'fire-gate', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Water path
    { from: 'origin-water', to: 'water-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'water-switch', to: 'water-gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'water-gate', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Earth path (MARROW)
    { from: 'origin-earth', to: 'earth-switch', type: 'solid', dimension: 'MARROW' },
    { from: 'earth-switch', to: 'earth-gate', type: 'solid', dimension: 'MARROW' },
    { from: 'earth-gate', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Air path
    { from: 'origin-air', to: 'air-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'air-switch', to: 'air-gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'air-gate', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Final
    { from: 'nexus', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    // Opposite elements unlock each other
    { type: 'activate', nodeId: 'fire-switch', action: 'unlock', target: 'water-gate' },
    { type: 'activate', nodeId: 'water-switch', action: 'unlock', target: 'fire-gate' },
    { type: 'activate', nodeId: 'earth-switch', action: 'unlock', target: 'air-gate' },
    { type: 'activate', nodeId: 'air-switch', action: 'unlock', target: 'earth-gate' },
    // All gates open nexus
    { type: 'enter', nodeId: 'fire-gate', action: 'unlock', target: 'nexus', data: { partialUnlock: 1 } },
    { type: 'enter', nodeId: 'water-gate', action: 'unlock', target: 'nexus', data: { partialUnlock: 2 } },
    { type: 'enter', nodeId: 'earth-gate', action: 'unlock', target: 'nexus', data: { partialUnlock: 3 } },
    { type: 'enter', nodeId: 'air-gate', action: 'unlock', target: 'nexus', data: { partialUnlock: 4 } }
  ],

  objectives: { primary: 'Opposites attract. Fire unlocks Water. Earth unlocks Air.', hidden: ['All switches within 2s'] },
  victoryCondition: { type: 'synchronize', targets: ['nexus', 'dest'] },
  mechanics: ['attention-movement', 'node-charging', 'dimension-shifting'],
  newMechanic: 'elemental-links',
  coopMechanics: ['synchronized-focus', 'split-perception'],

  minPlayers: 4, maxPlayers: 4,
  difficulty: 6,
  parTime: 90,
  perfectTime: 50,
  ambience: 'mixed',
  visualTheme: 'elements'
};

// =============================================================================
// QUAD LEVEL 3: DIMENSION SPLIT
// =============================================================================

export const QUAD_3_DIMENSION_SPLIT: StaticLevelDefinition = {
  id: 'quad-split',
  seed: 0x50400003,
  name: 'Dimension Split',
  subtitle: 'Two and two across reality.',
  chapter: 403,

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    // Team LATTICE (2 players)
    { id: 'origin-l1', position: { x: -4, y: 4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#00ffff', label: 'L1' } },
    { id: 'origin-l2', position: { x: 4, y: 4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#00cccc', label: 'L2' } },
    // Team OTHER (1 MARROW, 1 VOID)
    { id: 'origin-m', position: { x: -4, y: -4, z: 4 }, type: 'origin', dimension: 'MARROW', properties: { color: '#ff6600', label: 'M' } },
    { id: 'origin-v', position: { x: 4, y: -4, z: -4 }, type: 'origin', dimension: 'VOID', properties: { color: '#8800ff', label: 'V' } },
    // LATTICE team paths
    { id: 'l1-path', position: { x: -4, y: 2, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'l2-path', position: { x: 4, y: 2, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'l-witness-1', position: { x: -2, y: 0, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    { id: 'l-witness-2', position: { x: 2, y: 0, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 0 },
    // MARROW player path (hidden, needs LATTICE witness)
    { id: 'm-path-1', position: { x: -2, y: -2, z: 5 }, type: 'waypoint', dimension: 'MARROW', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'm-path-2', position: { x: 0, y: -4, z: 6 }, type: 'waypoint', dimension: 'MARROW', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'm-switch', position: { x: 2, y: -2, z: 5 }, type: 'switch', dimension: 'MARROW', hiddenIn: ['LATTICE'], properties: { color: '#ff6600' } },
    // VOID player path (hidden, needs LATTICE witness)
    { id: 'v-path-1', position: { x: 2, y: -2, z: -5 }, type: 'void', dimension: 'VOID', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'v-path-2', position: { x: 0, y: -4, z: -6 }, type: 'void', dimension: 'VOID', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'v-switch', position: { x: -2, y: -2, z: -5 }, type: 'switch', dimension: 'VOID', hiddenIn: ['LATTICE'], properties: { color: '#8800ff' } },
    // Final gate
    { id: 'nexus', position: { x: 0, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 4, properties: { locked: true, color: '#ffffff' } },
    { id: 'dest', position: { x: 0, y: 4, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    // LATTICE team
    { from: 'origin-l1', to: 'l1-path', type: 'solid', dimension: 'LATTICE' },
    { from: 'l1-path', to: 'l-witness-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-witness-1', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    { from: 'origin-l2', to: 'l2-path', type: 'solid', dimension: 'LATTICE' },
    { from: 'l2-path', to: 'l-witness-2', type: 'solid', dimension: 'LATTICE' },
    { from: 'l-witness-2', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // MARROW player
    { from: 'origin-m', to: 'm-path-1', type: 'solid', dimension: 'MARROW' },
    { from: 'm-path-1', to: 'm-path-2', type: 'solid', dimension: 'MARROW' },
    { from: 'm-path-2', to: 'm-switch', type: 'solid', dimension: 'MARROW' },
    { from: 'm-switch', to: 'nexus', type: 'solid', dimension: 'MARROW' },
    // VOID player
    { from: 'origin-v', to: 'v-path-1', type: 'hidden', dimension: 'VOID' },
    { from: 'v-path-1', to: 'v-path-2', type: 'hidden', dimension: 'VOID' },
    { from: 'v-path-2', to: 'v-switch', type: 'hidden', dimension: 'VOID' },
    { from: 'v-switch', to: 'nexus', type: 'hidden', dimension: 'VOID' },
    // Final
    { from: 'nexus', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'witness', nodeId: 'l-witness-1', action: 'reveal', target: 'm-path-1' },
    { type: 'witness', nodeId: 'l-witness-2', action: 'reveal', target: 'v-path-1' },
    { type: 'activate', nodeId: 'm-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 1 } },
    { type: 'activate', nodeId: 'v-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 2 } }
  ],

  objectives: { primary: 'LATTICE team guides. Others navigate.', hidden: ['No one lost in void', 'Both guides witness continuously'] },
  victoryCondition: { type: 'synchronize', targets: ['nexus', 'dest'] },
  mechanics: ['attention-movement', 'witness-mode', 'dimension-shifting', 'void-navigation', 'relay-mechanics'],
  coopMechanics: ['relay-witness', 'split-perception'],

  minPlayers: 4, maxPlayers: 4,
  difficulty: 7,
  parTime: 120,
  perfectTime: 70,
  ambience: 'mixed',
  visualTheme: 'division'
};

// =============================================================================
// QUAD LEVEL 4: RELAY CHAIN
// =============================================================================

export const QUAD_4_RELAY_CHAIN: StaticLevelDefinition = {
  id: 'quad-relay',
  seed: 0x50400004,
  name: 'Relay Chain',
  subtitle: '1 → 2 → 3 → 4',
  chapter: 404,

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    // All start in LATTICE, staggered
    { id: 'origin-1', position: { x: 0, y: 8, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff0000', label: '1st' } },
    { id: 'origin-2', position: { x: 0, y: 4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff8800', label: '2nd' } },
    { id: 'origin-3', position: { x: 0, y: -4, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#00ff00', label: '3rd' } },
    { id: 'origin-4', position: { x: 0, y: -8, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#0000ff', label: '4th' } },
    // Player 1 path (LATTICE → activates 2's gate)
    { id: 'p1-path', position: { x: 4, y: 8, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'p1-switch', position: { x: 8, y: 8, z: 0 }, type: 'switch', dimension: 'LATTICE', activationTime: 1500, properties: { color: '#ff0000' } },
    // Player 2 waits, then MARROW
    { id: 'p2-gate', position: { x: 4, y: 4, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'p2-to-marrow', position: { x: 8, y: 4, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#ff6600' } },
    { id: 'p2-marrow', position: { x: 8, y: 4, z: 4 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'p2-switch', position: { x: 12, y: 4, z: 4 }, type: 'switch', dimension: 'MARROW', activationTime: 1500, properties: { color: '#ff8800' } },
    // Player 3 waits, then VOID
    { id: 'p3-gate', position: { x: 4, y: -4, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'p3-to-void', position: { x: 8, y: -4, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#220022' } },
    { id: 'p3-void', position: { x: 8, y: -4, z: -4 }, type: 'void', dimension: 'VOID', activationTime: 0 },
    { id: 'p3-switch', position: { x: 12, y: -4, z: -4 }, type: 'switch', dimension: 'VOID', activationTime: 1500, properties: { color: '#00ff00' } },
    // Player 4 final stretch
    { id: 'p4-gate', position: { x: 4, y: -8, z: 0 }, type: 'gate', dimension: 'LATTICE', properties: { locked: true } },
    { id: 'p4-path', position: { x: 8, y: -8, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'p4-switch', position: { x: 12, y: -8, z: 0 }, type: 'switch', dimension: 'LATTICE', activationTime: 1500, properties: { color: '#0000ff' } },
    // Final nexus
    { id: 'nexus', position: { x: 16, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 4, properties: { locked: true, color: '#ffffff' } },
    { id: 'dest', position: { x: 20, y: 0, z: 0 }, type: 'destination', dimension: 'LATTICE' }
  ],

  edges: [
    // Player 1
    { from: 'origin-1', to: 'p1-path', type: 'solid', dimension: 'LATTICE' },
    { from: 'p1-path', to: 'p1-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'p1-switch', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Player 2
    { from: 'origin-2', to: 'p2-gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'p2-gate', to: 'p2-to-marrow', type: 'solid', dimension: 'LATTICE' },
    { from: 'p2-marrow', to: 'p2-switch', type: 'solid', dimension: 'MARROW' },
    { from: 'p2-switch', to: 'nexus', type: 'solid', dimension: 'MARROW' },
    // Player 3
    { from: 'origin-3', to: 'p3-gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'p3-gate', to: 'p3-to-void', type: 'solid', dimension: 'LATTICE' },
    { from: 'p3-void', to: 'p3-switch', type: 'hidden', dimension: 'VOID' },
    { from: 'p3-switch', to: 'nexus', type: 'hidden', dimension: 'VOID' },
    // Player 4
    { from: 'origin-4', to: 'p4-gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'p4-gate', to: 'p4-path', type: 'solid', dimension: 'LATTICE' },
    { from: 'p4-path', to: 'p4-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'p4-switch', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Final
    { from: 'nexus', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'activate', nodeId: 'p1-switch', action: 'unlock', target: 'p2-gate' },
    { type: 'activate', nodeId: 'p2-to-marrow', action: 'dimension-shift', data: { to: 'MARROW' } },
    { type: 'activate', nodeId: 'p2-switch', action: 'unlock', target: 'p3-gate' },
    { type: 'activate', nodeId: 'p3-to-void', action: 'dimension-shift', data: { to: 'VOID' } },
    { type: 'activate', nodeId: 'p3-switch', action: 'unlock', target: 'p4-gate' },
    { type: 'activate', nodeId: 'p4-switch', action: 'unlock', target: 'nexus' }
  ],

  objectives: { primary: 'Pass the baton. 1 unlocks 2. 2 unlocks 3. 3 unlocks 4.', hidden: ['Chain complete in 45s', 'No fumbles'] },
  victoryCondition: { type: 'synchronize', targets: ['nexus', 'dest'] },
  mechanics: ['attention-movement', 'node-charging', 'dimension-shifting', 'void-navigation', 'chain-mechanics'],
  newMechanic: 'quad-relay',
  coopMechanics: ['sequential-focus', 'split-perception'],

  minPlayers: 4, maxPlayers: 4,
  difficulty: 8,
  parTime: 120,
  perfectTime: 60,
  ambience: 'mixed',
  visualTheme: 'relay'
};

// =============================================================================
// QUAD LEVEL 5: TETRAD ASCENSION
// =============================================================================

export const QUAD_5_TETRAD: StaticLevelDefinition = {
  id: 'quad-tetrad',
  seed: 0x50400005,
  name: 'Tetrad Ascension',
  subtitle: 'Four become one.',
  chapter: 405,

  completionText: 'Tetrad mastery achieved. The infinite procedural awaits.',

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    // Four origins at corners of a tetrahedron
    { id: 'origin-1', position: { x: 0, y: 8, z: 0 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ff0000' } },
    { id: 'origin-2', position: { x: -7, y: -4, z: 0 }, type: 'origin', dimension: 'MARROW', properties: { color: '#00ff00' } },
    { id: 'origin-3', position: { x: 7, y: -4, z: 0 }, type: 'origin', dimension: 'VOID', properties: { color: '#0000ff' } },
    { id: 'origin-4', position: { x: 0, y: 0, z: 8 }, type: 'origin', dimension: 'LATTICE', properties: { color: '#ffff00' } },
    // Player 1: LATTICE master
    { id: 'p1-path', position: { x: 0, y: 6, z: 0 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'p1-witness', position: { x: -2, y: 4, z: 0 }, type: 'witness', dimension: 'LATTICE', activationTime: 1500 },
    { id: 'p1-switch', position: { x: 2, y: 4, z: 0 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#ff0000' } },
    // Player 2: MARROW navigator
    { id: 'p2-path', position: { x: -5, y: -2, z: 2 }, type: 'waypoint', dimension: 'MARROW', activationTime: 0 },
    { id: 'p2-charge', position: { x: -3, y: 0, z: 4 }, type: 'waypoint', dimension: 'MARROW', activationTime: 2500, properties: { pulseRate: 300 } },
    { id: 'p2-switch', position: { x: -2, y: 2, z: 3 }, type: 'switch', dimension: 'MARROW', properties: { color: '#00ff00' } },
    // Player 3: VOID drifter
    { id: 'p3-path', position: { x: 5, y: -2, z: -2 }, type: 'void', dimension: 'VOID', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'p3-drift', position: { x: 3, y: 0, z: -4 }, type: 'void', dimension: 'VOID', hiddenIn: ['LATTICE'], activationTime: 0 },
    { id: 'p3-switch', position: { x: 2, y: 2, z: -3 }, type: 'switch', dimension: 'VOID', hiddenIn: ['LATTICE'], properties: { color: '#0000ff' } },
    // Player 4: Aerial connector
    { id: 'p4-path', position: { x: 0, y: 2, z: 6 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 0 },
    { id: 'p4-mirror', position: { x: 0, y: 4, z: 4 }, type: 'mirror', dimension: 'LATTICE' },
    { id: 'p4-switch', position: { x: 0, y: 6, z: 2 }, type: 'switch', dimension: 'LATTICE', properties: { color: '#ffff00' } },
    // Central nexus
    { id: 'nexus', position: { x: 0, y: 0, z: 0 }, type: 'gate', dimension: 'LATTICE', requiredPlayers: 4, properties: { locked: true, color: '#ffd700' } },
    // Ascension
    { id: 'ascent-1', position: { x: 0, y: 0, z: 4 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 500 },
    { id: 'ascent-2', position: { x: 0, y: 0, z: 8 }, type: 'waypoint', dimension: 'LATTICE', activationTime: 500 },
    { id: 'dest', position: { x: 0, y: 0, z: 12 }, type: 'destination', dimension: 'LATTICE', properties: { color: '#ffd700' } }
  ],

  edges: [
    // Player 1
    { from: 'origin-1', to: 'p1-path', type: 'solid', dimension: 'LATTICE' },
    { from: 'p1-path', to: 'p1-witness', type: 'solid', dimension: 'LATTICE' },
    { from: 'p1-witness', to: 'p1-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'p1-switch', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Player 2
    { from: 'origin-2', to: 'p2-path', type: 'solid', dimension: 'MARROW' },
    { from: 'p2-path', to: 'p2-charge', type: 'solid', dimension: 'MARROW' },
    { from: 'p2-charge', to: 'p2-switch', type: 'solid', dimension: 'MARROW' },
    { from: 'p2-switch', to: 'nexus', type: 'solid', dimension: 'MARROW' },
    // Player 3
    { from: 'origin-3', to: 'p3-path', type: 'hidden', dimension: 'VOID' },
    { from: 'p3-path', to: 'p3-drift', type: 'hidden', dimension: 'VOID' },
    { from: 'p3-drift', to: 'p3-switch', type: 'hidden', dimension: 'VOID' },
    { from: 'p3-switch', to: 'nexus', type: 'hidden', dimension: 'VOID' },
    // Player 4
    { from: 'origin-4', to: 'p4-path', type: 'solid', dimension: 'LATTICE' },
    { from: 'p4-path', to: 'p4-mirror', type: 'solid', dimension: 'LATTICE' },
    { from: 'p4-mirror', to: 'p4-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'p4-switch', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // Ascension
    { from: 'nexus', to: 'ascent-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'ascent-1', to: 'ascent-2', type: 'solid', dimension: 'LATTICE' },
    { from: 'ascent-2', to: 'dest', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    { type: 'witness', nodeId: 'p1-witness', action: 'reveal', target: 'p3-path' },
    { type: 'activate', nodeId: 'p1-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 1 } },
    { type: 'activate', nodeId: 'p2-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 2 } },
    { type: 'activate', nodeId: 'p3-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 3 } },
    { type: 'activate', nodeId: 'p4-switch', action: 'unlock', target: 'nexus', data: { partialUnlock: 4 } }
  ],

  objectives: {
    primary: 'Four paths. Four switches. One ascension.',
    hidden: ['All switches within 3 seconds', 'No one lost', 'Perfect charge', 'Under par time']
  },

  victoryCondition: { type: 'synchronize', targets: ['nexus', 'dest'] },

  mechanics: [
    'attention-movement',
    'witness-mode',
    'dimension-shifting',
    'node-charging',
    'void-navigation',
    'mirror-mechanics',
    'synchronization'
  ],
  coopMechanics: ['synchronized-focus', 'split-perception', 'relay-witness'],

  minPlayers: 4, maxPlayers: 4,
  difficulty: 10,
  parTime: 180,
  perfectTime: 100,
  ambience: 'mixed',
  visualTheme: 'ascension',
  specialEffects: ['tetrad-formation', 'dimension-merge', 'ascension-light', 'procedural-unlock']
};

// =============================================================================
// EXPORTS
// =============================================================================

export const QUAD_LEVELS = [
  QUAD_1_CARDINAL,
  QUAD_2_ELEMENTS,
  QUAD_3_DIMENSION_SPLIT,
  QUAD_4_RELAY_CHAIN,
  QUAD_5_TETRAD
];

export const QUAD_LEVEL_IDS = QUAD_LEVELS.map(l => l.id);
