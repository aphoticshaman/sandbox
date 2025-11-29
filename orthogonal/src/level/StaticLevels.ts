/**
 * StaticLevels.ts
 *
 * The first 10 handcrafted levels of Orthogonal
 * These teach core mechanics before procedural generation unlocks
 *
 * Design Philosophy:
 * - Each level introduces ONE new concept
 * - Narrative embedded in structure, not text
 * - Difficulty curve: gentle then steep
 * - Every level has a "moment of realization"
 * - No hand-holding - discovery through play
 */

import { DimensionType } from '../core/DimensionManager';
import { PuzzleType } from '../puzzle/CooperativePuzzle';

// =============================================================================
// TYPES
// =============================================================================

export interface NodeDefinition {
  id: string;
  position: { x: number; y: number; z: number };
  type: 'origin' | 'destination' | 'waypoint' | 'witness' | 'switch' | 'gate' | 'mirror' | 'void';
  dimension: DimensionType;
  hiddenIn?: DimensionType[];  // Only visible when witnessing from these dimensions
  requiredPlayers?: number;    // For cooperative nodes
  activationTime?: number;     // Milliseconds to activate (0 = instant)
  properties?: {
    locked?: boolean;
    requiresWitness?: boolean;
    pulseRate?: number;
    color?: string;
    label?: string;  // Subtle hint, shown on hover
  };
}

export interface EdgeDefinition {
  from: string;
  to: string;
  type: 'solid' | 'dashed' | 'hidden' | 'one-way' | 'timed' | 'witness-only';
  dimension: DimensionType;
  properties?: {
    travelTime?: number;      // Base travel time in ms
    decayRate?: number;       // How fast the path fades
    requiresWitness?: boolean;
    activeDuring?: number[];  // Time windows when active
  };
}

export interface LevelTrigger {
  type: 'enter' | 'exit' | 'witness' | 'activate' | 'time';
  nodeId?: string;
  action: 'reveal' | 'hide' | 'unlock' | 'message' | 'dimension-shift' | 'spawn';
  target?: string;
  delay?: number;
  data?: any;
}

export interface StaticLevelDefinition {
  id: string;
  seed: number;              // Fixed seed for this level
  name: string;
  subtitle: string;          // Cryptic hint shown on level select
  chapter: number;           // 1-10 for static levels

  // Narrative (shown sparingly)
  introText?: string;        // Shown once, on first play only
  completionText?: string;   // Shown on completion

  // Structure
  dimensions: DimensionType[];
  startDimension: DimensionType;
  nodes: NodeDefinition[];
  edges: EdgeDefinition[];

  // Objectives
  objectives: {
    primary: string;         // What to do
    hidden?: string[];       // Bonus objectives (discovered through play)
  };

  // Victory
  victoryCondition: {
    type: 'reach' | 'activate-all' | 'sequence' | 'witness' | 'synchronize';
    targets: string[];       // Node IDs
    timeLimit?: number;      // Optional time limit
    order?: boolean;         // If sequence matters
  };

  // Mechanics
  mechanics: string[];       // List of mechanics this level uses
  newMechanic?: string;      // The ONE new thing this level teaches

  // Triggers
  triggers?: LevelTrigger[];

  // Multiplayer
  minPlayers: number;
  maxPlayers: number;
  coopMechanics?: PuzzleType[];

  // Meta
  difficulty: number;        // 1-10
  parTime: number;           // Target completion time in seconds
  perfectTime: number;       // "Flawless" completion time

  // Audio/Visual
  ambience: 'crystalline' | 'organic' | 'void' | 'mixed';
  visualTheme: string;
  specialEffects?: string[];
}

// =============================================================================
// LEVEL 0: EMERGENCE (Tutorial)
// =============================================================================

const LEVEL_0_EMERGENCE: StaticLevelDefinition = {
  id: 'emergence',
  seed: 0x00000000,
  name: 'Emergence',
  subtitle: 'You are not the body. You are the attention.',
  chapter: 0,

  introText: undefined,  // No text. The level IS the tutorial.

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    // The player appears here - a simple origin
    {
      id: 'origin',
      position: { x: 0, y: 0, z: 0 },
      type: 'origin',
      dimension: 'LATTICE',
      properties: { color: '#ffffff', label: '...' }
    },
    // First waypoint - close, obvious
    {
      id: 'first-step',
      position: { x: 3, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Second waypoint - slightly further
    {
      id: 'second-step',
      position: { x: 6, y: 1, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Third waypoint - introduces vertical
    {
      id: 'third-step',
      position: { x: 6, y: 4, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Destination - the first "goal"
    {
      id: 'destination',
      position: { x: 9, y: 4, z: 0 },
      type: 'destination',
      dimension: 'LATTICE',
      properties: { color: '#00ffff', label: 'here' }
    }
  ],

  edges: [
    { from: 'origin', to: 'first-step', type: 'solid', dimension: 'LATTICE' },
    { from: 'first-step', to: 'second-step', type: 'solid', dimension: 'LATTICE' },
    { from: 'second-step', to: 'third-step', type: 'solid', dimension: 'LATTICE' },
    { from: 'third-step', to: 'destination', type: 'solid', dimension: 'LATTICE' }
  ],

  objectives: {
    primary: 'Move your attention to the destination',
    hidden: ['Complete without pausing']
  },

  victoryCondition: {
    type: 'reach',
    targets: ['destination']
  },

  mechanics: ['attention-movement', 'path-traversal'],
  newMechanic: 'attention-movement',

  minPlayers: 1,
  maxPlayers: 1,

  difficulty: 1,
  parTime: 30,
  perfectTime: 10,

  ambience: 'crystalline',
  visualTheme: 'birth',
  specialEffects: ['gentle-pulse', 'first-light']
};

// =============================================================================
// LEVEL 1: FIRST LATTICE
// =============================================================================

const LEVEL_1_FIRST_LATTICE: StaticLevelDefinition = {
  id: 'first-lattice',
  seed: 0x00000001,
  name: 'First Lattice',
  subtitle: 'Paths branch. Choices matter.',
  chapter: 1,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    {
      id: 'origin',
      position: { x: 0, y: 0, z: 0 },
      type: 'origin',
      dimension: 'LATTICE'
    },
    // Branch point
    {
      id: 'branch',
      position: { x: 4, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 500
    },
    // Upper path (longer but teaches exploration)
    {
      id: 'upper-1',
      position: { x: 6, y: 3, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    {
      id: 'upper-2',
      position: { x: 9, y: 4, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Lower path (shorter, obvious)
    {
      id: 'lower-1',
      position: { x: 6, y: -2, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Hidden node - only visible from upper path
    {
      id: 'secret',
      position: { x: 8, y: 1, z: 2 },
      type: 'waypoint',
      dimension: 'LATTICE',
      properties: { color: '#ff00ff', label: '?' }
    },
    // Convergence
    {
      id: 'convergence',
      position: { x: 12, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 500
    },
    // Destination
    {
      id: 'destination',
      position: { x: 16, y: 0, z: 0 },
      type: 'destination',
      dimension: 'LATTICE'
    }
  ],

  edges: [
    { from: 'origin', to: 'branch', type: 'solid', dimension: 'LATTICE' },
    // Upper path
    { from: 'branch', to: 'upper-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'upper-1', to: 'upper-2', type: 'solid', dimension: 'LATTICE' },
    { from: 'upper-2', to: 'convergence', type: 'solid', dimension: 'LATTICE' },
    // Lower path
    { from: 'branch', to: 'lower-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'lower-1', to: 'convergence', type: 'solid', dimension: 'LATTICE' },
    // Secret path
    { from: 'upper-1', to: 'secret', type: 'dashed', dimension: 'LATTICE' },
    { from: 'secret', to: 'convergence', type: 'dashed', dimension: 'LATTICE' },
    // Final stretch
    { from: 'convergence', to: 'destination', type: 'solid', dimension: 'LATTICE' }
  ],

  objectives: {
    primary: 'Reach the destination',
    hidden: ['Find the hidden node', 'Complete using upper path only']
  },

  victoryCondition: {
    type: 'reach',
    targets: ['destination']
  },

  mechanics: ['attention-movement', 'path-traversal', 'branching-paths'],
  newMechanic: 'branching-paths',

  minPlayers: 1,
  maxPlayers: 1,

  difficulty: 2,
  parTime: 45,
  perfectTime: 25,

  ambience: 'crystalline',
  visualTheme: 'geometric-clarity',
  specialEffects: ['path-glow']
};

// =============================================================================
// LEVEL 2: THE WITNESS
// =============================================================================

const LEVEL_2_THE_WITNESS: StaticLevelDefinition = {
  id: 'the-witness',
  seed: 0x00000002,
  name: 'The Witness',
  subtitle: 'To see is to be still.',
  chapter: 2,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    {
      id: 'origin',
      position: { x: 0, y: 0, z: 0 },
      type: 'origin',
      dimension: 'LATTICE'
    },
    {
      id: 'pre-gate',
      position: { x: 4, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // A gate that requires witnessing
    {
      id: 'witness-gate',
      position: { x: 8, y: 0, z: 0 },
      type: 'gate',
      dimension: 'LATTICE',
      properties: {
        locked: true,
        requiresWitness: true,
        label: 'look deeper'
      }
    },
    // The node that unlocks when witnessed
    {
      id: 'hidden-key',
      position: { x: 6, y: 3, z: 3 },
      type: 'witness',
      dimension: 'LATTICE',
      hiddenIn: ['LATTICE'],  // Only visible while witnessing
      properties: { color: '#ffff00' }
    },
    {
      id: 'post-gate',
      position: { x: 12, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    {
      id: 'destination',
      position: { x: 16, y: 0, z: 0 },
      type: 'destination',
      dimension: 'LATTICE'
    }
  ],

  edges: [
    { from: 'origin', to: 'pre-gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'pre-gate', to: 'witness-gate', type: 'solid', dimension: 'LATTICE' },
    // This edge only appears when witnessing
    { from: 'pre-gate', to: 'hidden-key', type: 'witness-only', dimension: 'LATTICE' },
    // Gate opens after hidden-key is witnessed
    { from: 'witness-gate', to: 'post-gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'post-gate', to: 'destination', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    {
      type: 'witness',
      nodeId: 'hidden-key',
      action: 'unlock',
      target: 'witness-gate'
    }
  ],

  objectives: {
    primary: 'Pass through the gate',
    hidden: ['Witness for 10 seconds continuously']
  },

  victoryCondition: {
    type: 'reach',
    targets: ['destination']
  },

  mechanics: ['attention-movement', 'path-traversal', 'witness-mode'],
  newMechanic: 'witness-mode',

  minPlayers: 1,
  maxPlayers: 1,

  difficulty: 3,
  parTime: 60,
  perfectTime: 35,

  ambience: 'crystalline',
  visualTheme: 'revelation',
  specialEffects: ['witness-ripple', 'hidden-shimmer']
};

// =============================================================================
// LEVEL 3: BEYOND THE LATTICE
// =============================================================================

const LEVEL_3_BEYOND_THE_LATTICE: StaticLevelDefinition = {
  id: 'beyond-the-lattice',
  seed: 0x00000003,
  name: 'Beyond the Lattice',
  subtitle: 'Reality has layers.',
  chapter: 3,

  dimensions: ['LATTICE', 'MARROW'],
  startDimension: 'LATTICE',

  nodes: [
    // LATTICE dimension
    {
      id: 'origin',
      position: { x: 0, y: 0, z: 0 },
      type: 'origin',
      dimension: 'LATTICE'
    },
    {
      id: 'lattice-1',
      position: { x: 4, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Dimension switch point
    {
      id: 'portal',
      position: { x: 8, y: 0, z: 0 },
      type: 'switch',
      dimension: 'LATTICE',
      properties: {
        color: '#ff6600',
        label: 'shift'
      }
    },
    // MARROW dimension (same position, different dimension)
    {
      id: 'marrow-entry',
      position: { x: 8, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'MARROW',
      activationTime: 0
    },
    {
      id: 'marrow-1',
      position: { x: 10, y: 2, z: 1 },
      type: 'waypoint',
      dimension: 'MARROW',
      activationTime: 0
    },
    {
      id: 'marrow-2',
      position: { x: 12, y: 0, z: 2 },
      type: 'waypoint',
      dimension: 'MARROW',
      activationTime: 0
    },
    // Return portal
    {
      id: 'return-portal',
      position: { x: 14, y: 0, z: 0 },
      type: 'switch',
      dimension: 'MARROW',
      properties: { color: '#00ff66' }
    },
    // Back in LATTICE
    {
      id: 'lattice-return',
      position: { x: 14, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    {
      id: 'destination',
      position: { x: 18, y: 0, z: 0 },
      type: 'destination',
      dimension: 'LATTICE'
    }
  ],

  edges: [
    // LATTICE edges
    { from: 'origin', to: 'lattice-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'lattice-1', to: 'portal', type: 'solid', dimension: 'LATTICE' },
    { from: 'lattice-return', to: 'destination', type: 'solid', dimension: 'LATTICE' },
    // MARROW edges
    { from: 'marrow-entry', to: 'marrow-1', type: 'solid', dimension: 'MARROW' },
    { from: 'marrow-1', to: 'marrow-2', type: 'solid', dimension: 'MARROW' },
    { from: 'marrow-2', to: 'return-portal', type: 'solid', dimension: 'MARROW' }
  ],

  triggers: [
    {
      type: 'activate',
      nodeId: 'portal',
      action: 'dimension-shift',
      data: { from: 'LATTICE', to: 'MARROW' }
    },
    {
      type: 'activate',
      nodeId: 'return-portal',
      action: 'dimension-shift',
      data: { from: 'MARROW', to: 'LATTICE' }
    }
  ],

  objectives: {
    primary: 'Navigate through both dimensions',
    hidden: ['Spend less than 5 seconds in MARROW']
  },

  victoryCondition: {
    type: 'reach',
    targets: ['destination']
  },

  mechanics: ['attention-movement', 'path-traversal', 'dimension-shifting'],
  newMechanic: 'dimension-shifting',

  minPlayers: 1,
  maxPlayers: 1,

  difficulty: 4,
  parTime: 75,
  perfectTime: 40,

  ambience: 'mixed',
  visualTheme: 'transition',
  specialEffects: ['dimension-tear', 'organic-pulse']
};

// =============================================================================
// LEVEL 4: PERSISTENCE
// =============================================================================

const LEVEL_4_PERSISTENCE: StaticLevelDefinition = {
  id: 'persistence',
  seed: 0x00000004,
  name: 'Persistence',
  subtitle: 'Some nodes require commitment.',
  chapter: 4,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    {
      id: 'origin',
      position: { x: 0, y: 0, z: 0 },
      type: 'origin',
      dimension: 'LATTICE'
    },
    {
      id: 'path-1',
      position: { x: 4, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // First charge node - requires holding attention
    {
      id: 'charge-1',
      position: { x: 8, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 2000,  // 2 seconds to charge
      properties: {
        pulseRate: 500,
        label: 'wait'
      }
    },
    {
      id: 'path-2',
      position: { x: 10, y: 2, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Second charge node - longer
    {
      id: 'charge-2',
      position: { x: 12, y: 4, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 3500,  // 3.5 seconds
      properties: { pulseRate: 350 }
    },
    // Decoy path that looks faster but leads nowhere
    {
      id: 'decoy-1',
      position: { x: 10, y: -2, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    {
      id: 'decoy-end',
      position: { x: 14, y: -4, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0,
      properties: { label: 'patience' }
    },
    {
      id: 'destination',
      position: { x: 16, y: 4, z: 0 },
      type: 'destination',
      dimension: 'LATTICE'
    }
  ],

  edges: [
    { from: 'origin', to: 'path-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'path-1', to: 'charge-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'charge-1', to: 'path-2', type: 'solid', dimension: 'LATTICE' },
    { from: 'path-2', to: 'charge-2', type: 'solid', dimension: 'LATTICE' },
    { from: 'charge-2', to: 'destination', type: 'solid', dimension: 'LATTICE' },
    // Decoy path
    { from: 'path-1', to: 'decoy-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'decoy-1', to: 'decoy-end', type: 'solid', dimension: 'LATTICE' }
    // Note: decoy-end goes nowhere
  ],

  objectives: {
    primary: 'Charge nodes to proceed',
    hidden: ['Never visit decoy path']
  },

  victoryCondition: {
    type: 'reach',
    targets: ['destination']
  },

  mechanics: ['attention-movement', 'path-traversal', 'node-charging'],
  newMechanic: 'node-charging',

  minPlayers: 1,
  maxPlayers: 1,

  difficulty: 4,
  parTime: 60,
  perfectTime: 30,

  ambience: 'crystalline',
  visualTheme: 'patience',
  specialEffects: ['charge-buildup', 'decoy-fade']
};

// =============================================================================
// LEVEL 5: VOID TOUCH
// =============================================================================

const LEVEL_5_VOID_TOUCH: StaticLevelDefinition = {
  id: 'void-touch',
  seed: 0x00000005,
  name: 'Void Touch',
  subtitle: 'Emptiness is not nothing.',
  chapter: 5,

  dimensions: ['LATTICE', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    {
      id: 'origin',
      position: { x: 0, y: 0, z: 0 },
      type: 'origin',
      dimension: 'LATTICE'
    },
    {
      id: 'lattice-path',
      position: { x: 4, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Gap in LATTICE - no visible path forward
    {
      id: 'edge-of-void',
      position: { x: 8, y: 0, z: 0 },
      type: 'switch',
      dimension: 'LATTICE',
      properties: {
        color: '#220022',
        label: 'leap'
      }
    },
    // VOID dimension - sparse, disorienting
    {
      id: 'void-entry',
      position: { x: 8, y: 0, z: 0 },
      type: 'void',
      dimension: 'VOID',
      activationTime: 0
    },
    // Void has fewer reference points
    {
      id: 'void-drift-1',
      position: { x: 10, y: 2, z: 3 },
      type: 'void',
      dimension: 'VOID',
      activationTime: 0
    },
    {
      id: 'void-drift-2',
      position: { x: 12, y: -1, z: 5 },
      type: 'void',
      dimension: 'VOID',
      activationTime: 0
    },
    {
      id: 'void-exit',
      position: { x: 16, y: 0, z: 0 },
      type: 'switch',
      dimension: 'VOID',
      properties: { color: '#00ffff' }
    },
    // Return to LATTICE
    {
      id: 'lattice-return',
      position: { x: 16, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    {
      id: 'destination',
      position: { x: 20, y: 0, z: 0 },
      type: 'destination',
      dimension: 'LATTICE'
    }
  ],

  edges: [
    // LATTICE
    { from: 'origin', to: 'lattice-path', type: 'solid', dimension: 'LATTICE' },
    { from: 'lattice-path', to: 'edge-of-void', type: 'solid', dimension: 'LATTICE' },
    { from: 'lattice-return', to: 'destination', type: 'solid', dimension: 'LATTICE' },
    // VOID - connections are less obvious
    { from: 'void-entry', to: 'void-drift-1', type: 'hidden', dimension: 'VOID' },
    { from: 'void-drift-1', to: 'void-drift-2', type: 'hidden', dimension: 'VOID' },
    { from: 'void-drift-2', to: 'void-exit', type: 'hidden', dimension: 'VOID' }
  ],

  triggers: [
    {
      type: 'activate',
      nodeId: 'edge-of-void',
      action: 'dimension-shift',
      data: { from: 'LATTICE', to: 'VOID' }
    },
    {
      type: 'activate',
      nodeId: 'void-exit',
      action: 'dimension-shift',
      data: { from: 'VOID', to: 'LATTICE' }
    }
  ],

  objectives: {
    primary: 'Cross the void',
    hidden: ['Navigate void without pausing', 'Witness while in void']
  },

  victoryCondition: {
    type: 'reach',
    targets: ['destination']
  },

  mechanics: ['attention-movement', 'dimension-shifting', 'void-navigation'],
  newMechanic: 'void-navigation',

  minPlayers: 1,
  maxPlayers: 1,

  difficulty: 5,
  parTime: 90,
  perfectTime: 50,

  ambience: 'void',
  visualTheme: 'emptiness',
  specialEffects: ['void-static', 'reality-tear', 'disorientation']
};

// =============================================================================
// LEVEL 6: TOGETHER
// =============================================================================

const LEVEL_6_TOGETHER: StaticLevelDefinition = {
  id: 'together',
  seed: 0x00000006,
  name: 'Together',
  subtitle: 'Some doors require two keys.',
  chapter: 6,

  dimensions: ['LATTICE'],
  startDimension: 'LATTICE',

  nodes: [
    // Two origins for two players
    {
      id: 'origin-1',
      position: { x: 0, y: 2, z: 0 },
      type: 'origin',
      dimension: 'LATTICE',
      properties: { color: '#ff6666' }
    },
    {
      id: 'origin-2',
      position: { x: 0, y: -2, z: 0 },
      type: 'origin',
      dimension: 'LATTICE',
      properties: { color: '#6666ff' }
    },
    // Separate paths
    {
      id: 'path-1a',
      position: { x: 4, y: 3, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    {
      id: 'path-2a',
      position: { x: 4, y: -3, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Convergence point - requires both players
    {
      id: 'sync-gate',
      position: { x: 8, y: 0, z: 0 },
      type: 'gate',
      dimension: 'LATTICE',
      requiredPlayers: 2,
      properties: {
        color: '#ffff00',
        label: 'together'
      }
    },
    // After gate
    {
      id: 'united',
      position: { x: 12, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 500
    },
    {
      id: 'destination',
      position: { x: 16, y: 0, z: 0 },
      type: 'destination',
      dimension: 'LATTICE'
    }
  ],

  edges: [
    // Player 1 path
    { from: 'origin-1', to: 'path-1a', type: 'solid', dimension: 'LATTICE' },
    { from: 'path-1a', to: 'sync-gate', type: 'solid', dimension: 'LATTICE' },
    // Player 2 path
    { from: 'origin-2', to: 'path-2a', type: 'solid', dimension: 'LATTICE' },
    { from: 'path-2a', to: 'sync-gate', type: 'solid', dimension: 'LATTICE' },
    // Shared path after gate
    { from: 'sync-gate', to: 'united', type: 'solid', dimension: 'LATTICE' },
    { from: 'united', to: 'destination', type: 'solid', dimension: 'LATTICE' }
  ],

  objectives: {
    primary: 'Reach the gate simultaneously',
    hidden: ['Complete within 20 seconds', 'Perfect sync (< 0.5s difference)']
  },

  victoryCondition: {
    type: 'synchronize',
    targets: ['sync-gate'],
    timeLimit: undefined
  },

  mechanics: ['attention-movement', 'path-traversal', 'synchronization'],
  newMechanic: 'synchronization',
  coopMechanics: ['synchronized-focus'],

  minPlayers: 2,
  maxPlayers: 2,

  difficulty: 5,
  parTime: 45,
  perfectTime: 20,

  ambience: 'crystalline',
  visualTheme: 'duality',
  specialEffects: ['player-trails', 'sync-pulse']
};

// =============================================================================
// LEVEL 7: MIRRORS
// =============================================================================

const LEVEL_7_MIRRORS: StaticLevelDefinition = {
  id: 'mirrors',
  seed: 0x00000007,
  name: 'Mirrors',
  subtitle: 'What you see depends on where you stand.',
  chapter: 7,

  dimensions: ['LATTICE', 'MARROW'],
  startDimension: 'LATTICE',

  nodes: [
    {
      id: 'origin',
      position: { x: 0, y: 0, z: 0 },
      type: 'origin',
      dimension: 'LATTICE'
    },
    {
      id: 'mirror-approach',
      position: { x: 4, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Mirror node - shows inverted reality
    {
      id: 'mirror',
      position: { x: 8, y: 0, z: 0 },
      type: 'mirror',
      dimension: 'LATTICE',
      properties: {
        color: '#silver',
        label: 'reflection'
      }
    },
    // This node is only visible in LATTICE when viewed from MARROW
    {
      id: 'hidden-in-lattice',
      position: { x: 10, y: 3, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      hiddenIn: ['MARROW'],  // Visible when you're in MARROW looking at LATTICE
      activationTime: 0
    },
    // MARROW mirror
    {
      id: 'marrow-mirror',
      position: { x: 8, y: 0, z: 0 },
      type: 'mirror',
      dimension: 'MARROW'
    },
    {
      id: 'marrow-path',
      position: { x: 6, y: -2, z: 2 },
      type: 'waypoint',
      dimension: 'MARROW',
      activationTime: 0
    },
    // The key is in MARROW
    {
      id: 'marrow-key',
      position: { x: 4, y: -4, z: 3 },
      type: 'witness',
      dimension: 'MARROW',
      properties: { color: '#00ff00' }
    },
    {
      id: 'gate',
      position: { x: 12, y: 0, z: 0 },
      type: 'gate',
      dimension: 'LATTICE',
      properties: { locked: true }
    },
    {
      id: 'destination',
      position: { x: 16, y: 0, z: 0 },
      type: 'destination',
      dimension: 'LATTICE'
    }
  ],

  edges: [
    // LATTICE
    { from: 'origin', to: 'mirror-approach', type: 'solid', dimension: 'LATTICE' },
    { from: 'mirror-approach', to: 'mirror', type: 'solid', dimension: 'LATTICE' },
    { from: 'mirror', to: 'hidden-in-lattice', type: 'dashed', dimension: 'LATTICE' },
    { from: 'hidden-in-lattice', to: 'gate', type: 'solid', dimension: 'LATTICE' },
    { from: 'gate', to: 'destination', type: 'solid', dimension: 'LATTICE' },
    // MARROW
    { from: 'marrow-mirror', to: 'marrow-path', type: 'solid', dimension: 'MARROW' },
    { from: 'marrow-path', to: 'marrow-key', type: 'solid', dimension: 'MARROW' }
  ],

  triggers: [
    {
      type: 'activate',
      nodeId: 'mirror',
      action: 'dimension-shift',
      data: { from: 'LATTICE', to: 'MARROW' }
    },
    {
      type: 'activate',
      nodeId: 'marrow-mirror',
      action: 'dimension-shift',
      data: { from: 'MARROW', to: 'LATTICE' }
    },
    {
      type: 'witness',
      nodeId: 'marrow-key',
      action: 'reveal',
      target: 'hidden-in-lattice'
    },
    {
      type: 'activate',
      nodeId: 'hidden-in-lattice',
      action: 'unlock',
      target: 'gate'
    }
  ],

  objectives: {
    primary: 'Use mirrors to reveal the hidden path',
    hidden: ['Complete without returning to LATTICE more than once']
  },

  victoryCondition: {
    type: 'reach',
    targets: ['destination']
  },

  mechanics: ['attention-movement', 'dimension-shifting', 'witness-mode', 'mirror-mechanics'],
  newMechanic: 'mirror-mechanics',

  minPlayers: 1,
  maxPlayers: 2,

  difficulty: 6,
  parTime: 120,
  perfectTime: 60,

  ambience: 'mixed',
  visualTheme: 'reflection',
  specialEffects: ['mirror-shimmer', 'inverse-colors', 'depth-inversion']
};

// =============================================================================
// LEVEL 8: THE RELAY
// =============================================================================

const LEVEL_8_THE_RELAY: StaticLevelDefinition = {
  id: 'the-relay',
  seed: 0x00000008,
  name: 'The Relay',
  subtitle: 'One watches. One moves.',
  chapter: 8,

  dimensions: ['LATTICE', 'MARROW'],
  startDimension: 'LATTICE',

  nodes: [
    // Player 1 origin (LATTICE)
    {
      id: 'origin-watcher',
      position: { x: 0, y: 4, z: 0 },
      type: 'origin',
      dimension: 'LATTICE',
      properties: { color: '#ffff00', label: 'watcher' }
    },
    // Player 2 origin (MARROW)
    {
      id: 'origin-mover',
      position: { x: 0, y: -4, z: 0 },
      type: 'origin',
      dimension: 'MARROW',
      properties: { color: '#00ffff', label: 'mover' }
    },
    // Watcher's perch - can see into MARROW while witnessing
    {
      id: 'watcher-perch',
      position: { x: 4, y: 4, z: 0 },
      type: 'witness',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Mover's path (in MARROW, only visible to watcher)
    {
      id: 'marrow-path-1',
      position: { x: 4, y: -2, z: 2 },
      type: 'waypoint',
      dimension: 'MARROW',
      hiddenIn: ['LATTICE'],  // Only visible when LATTICE player witnesses
      activationTime: 0
    },
    {
      id: 'marrow-path-2',
      position: { x: 8, y: -1, z: 3 },
      type: 'waypoint',
      dimension: 'MARROW',
      hiddenIn: ['LATTICE'],
      activationTime: 0
    },
    {
      id: 'marrow-switch',
      position: { x: 10, y: 0, z: 2 },
      type: 'switch',
      dimension: 'MARROW',
      hiddenIn: ['LATTICE']
    },
    // Switch activates a node in LATTICE
    {
      id: 'lattice-bridge',
      position: { x: 10, y: 4, z: 0 },
      type: 'gate',
      dimension: 'LATTICE',
      properties: { locked: true }
    },
    // Watcher continues
    {
      id: 'watcher-path',
      position: { x: 14, y: 4, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    // Convergence
    {
      id: 'reunion',
      position: { x: 18, y: 0, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      requiredPlayers: 2,
      activationTime: 1000
    },
    {
      id: 'destination',
      position: { x: 22, y: 0, z: 0 },
      type: 'destination',
      dimension: 'LATTICE'
    }
  ],

  edges: [
    // Watcher path
    { from: 'origin-watcher', to: 'watcher-perch', type: 'solid', dimension: 'LATTICE' },
    { from: 'watcher-perch', to: 'lattice-bridge', type: 'dashed', dimension: 'LATTICE' },
    { from: 'lattice-bridge', to: 'watcher-path', type: 'solid', dimension: 'LATTICE' },
    { from: 'watcher-path', to: 'reunion', type: 'solid', dimension: 'LATTICE' },
    // Mover path
    { from: 'origin-mover', to: 'marrow-path-1', type: 'hidden', dimension: 'MARROW' },
    { from: 'marrow-path-1', to: 'marrow-path-2', type: 'hidden', dimension: 'MARROW' },
    { from: 'marrow-path-2', to: 'marrow-switch', type: 'hidden', dimension: 'MARROW' },
    // Mover portal to LATTICE
    { from: 'marrow-switch', to: 'reunion', type: 'solid', dimension: 'MARROW' },
    // Final
    { from: 'reunion', to: 'destination', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    {
      type: 'activate',
      nodeId: 'marrow-switch',
      action: 'unlock',
      target: 'lattice-bridge'
    },
    {
      type: 'activate',
      nodeId: 'marrow-switch',
      action: 'dimension-shift',
      data: { from: 'MARROW', to: 'LATTICE' }
    }
  ],

  objectives: {
    primary: 'Watcher guides, Mover navigates',
    hidden: ['Complete with voice chat off', 'Mover never backtracks']
  },

  victoryCondition: {
    type: 'synchronize',
    targets: ['reunion', 'destination']
  },

  mechanics: ['attention-movement', 'dimension-shifting', 'witness-mode', 'relay-mechanics'],
  newMechanic: 'relay-mechanics',
  coopMechanics: ['relay-witness', 'split-perception'],

  minPlayers: 2,
  maxPlayers: 2,

  difficulty: 7,
  parTime: 150,
  perfectTime: 75,

  ambience: 'mixed',
  visualTheme: 'guidance',
  specialEffects: ['witness-beam', 'path-reveal', 'relay-pulse']
};

// =============================================================================
// LEVEL 9: TETRAD
// =============================================================================

const LEVEL_9_TETRAD: StaticLevelDefinition = {
  id: 'tetrad',
  seed: 0x00000009,
  name: 'Tetrad',
  subtitle: 'Four points. One purpose.',
  chapter: 9,

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    // Four origins - cardinal positions
    {
      id: 'origin-north',
      position: { x: 0, y: 8, z: 0 },
      type: 'origin',
      dimension: 'LATTICE',
      properties: { color: '#ff0000' }
    },
    {
      id: 'origin-south',
      position: { x: 0, y: -8, z: 0 },
      type: 'origin',
      dimension: 'LATTICE',
      properties: { color: '#00ff00' }
    },
    {
      id: 'origin-east',
      position: { x: 8, y: 0, z: 0 },
      type: 'origin',
      dimension: 'MARROW',
      properties: { color: '#0000ff' }
    },
    {
      id: 'origin-west',
      position: { x: -8, y: 0, z: 0 },
      type: 'origin',
      dimension: 'VOID',
      properties: { color: '#ffff00' }
    },

    // North path
    {
      id: 'north-1',
      position: { x: 0, y: 6, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    {
      id: 'north-switch',
      position: { x: 0, y: 4, z: 0 },
      type: 'switch',
      dimension: 'LATTICE',
      activationTime: 1000
    },

    // South path
    {
      id: 'south-1',
      position: { x: 0, y: -6, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    {
      id: 'south-switch',
      position: { x: 0, y: -4, z: 0 },
      type: 'switch',
      dimension: 'LATTICE',
      activationTime: 1000
    },

    // East path (MARROW)
    {
      id: 'east-1',
      position: { x: 6, y: 0, z: 2 },
      type: 'waypoint',
      dimension: 'MARROW',
      activationTime: 0
    },
    {
      id: 'east-switch',
      position: { x: 4, y: 0, z: 1 },
      type: 'switch',
      dimension: 'MARROW',
      activationTime: 1000
    },

    // West path (VOID)
    {
      id: 'west-1',
      position: { x: -6, y: 0, z: -2 },
      type: 'void',
      dimension: 'VOID',
      activationTime: 0
    },
    {
      id: 'west-switch',
      position: { x: -4, y: 0, z: -1 },
      type: 'switch',
      dimension: 'VOID',
      activationTime: 1000
    },

    // Central nexus - requires all 4 players
    {
      id: 'nexus',
      position: { x: 0, y: 0, z: 0 },
      type: 'gate',
      dimension: 'LATTICE',
      requiredPlayers: 4,
      properties: {
        color: '#ffffff',
        label: 'converge'
      }
    },

    // Ascension
    {
      id: 'ascension',
      position: { x: 0, y: 0, z: 8 },
      type: 'destination',
      dimension: 'LATTICE',
      properties: { color: '#ffd700' }
    }
  ],

  edges: [
    // North
    { from: 'origin-north', to: 'north-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'north-1', to: 'north-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'north-switch', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // South
    { from: 'origin-south', to: 'south-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'south-1', to: 'south-switch', type: 'solid', dimension: 'LATTICE' },
    { from: 'south-switch', to: 'nexus', type: 'solid', dimension: 'LATTICE' },
    // East (MARROW to LATTICE nexus)
    { from: 'origin-east', to: 'east-1', type: 'solid', dimension: 'MARROW' },
    { from: 'east-1', to: 'east-switch', type: 'solid', dimension: 'MARROW' },
    { from: 'east-switch', to: 'nexus', type: 'solid', dimension: 'MARROW' },
    // West (VOID to LATTICE nexus)
    { from: 'origin-west', to: 'west-1', type: 'hidden', dimension: 'VOID' },
    { from: 'west-1', to: 'west-switch', type: 'hidden', dimension: 'VOID' },
    { from: 'west-switch', to: 'nexus', type: 'hidden', dimension: 'VOID' },
    // Ascension
    { from: 'nexus', to: 'ascension', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    // All four switches must be activated within 3 seconds of each other
    {
      type: 'activate',
      nodeId: 'north-switch',
      action: 'unlock',
      target: 'nexus',
      data: { partialUnlock: 1 }
    },
    {
      type: 'activate',
      nodeId: 'south-switch',
      action: 'unlock',
      target: 'nexus',
      data: { partialUnlock: 2 }
    },
    {
      type: 'activate',
      nodeId: 'east-switch',
      action: 'unlock',
      target: 'nexus',
      data: { partialUnlock: 3 }
    },
    {
      type: 'activate',
      nodeId: 'west-switch',
      action: 'unlock',
      target: 'nexus',
      data: { partialUnlock: 4 }
    }
  ],

  objectives: {
    primary: 'Four players, four paths, one moment',
    hidden: [
      'Activate all switches within 1 second',
      'Complete without any player backtracking',
      'All players reach nexus simultaneously'
    ]
  },

  victoryCondition: {
    type: 'synchronize',
    targets: ['nexus', 'ascension'],
    timeLimit: 180000  // 3 minute time limit
  },

  mechanics: ['attention-movement', 'dimension-shifting', 'void-navigation', 'synchronization', 'tetrad-coordination'],
  newMechanic: 'tetrad-coordination',
  coopMechanics: ['synchronized-focus', 'split-perception'],

  minPlayers: 4,
  maxPlayers: 4,

  difficulty: 8,
  parTime: 180,
  perfectTime: 90,

  ambience: 'mixed',
  visualTheme: 'convergence',
  specialEffects: ['quadrant-colors', 'sync-countdown', 'nexus-pulse', 'ascension-light']
};

// =============================================================================
// LEVEL 10: ORTHOGONAL
// =============================================================================

const LEVEL_10_ORTHOGONAL: StaticLevelDefinition = {
  id: 'orthogonal',
  seed: 0x0000000A,
  name: 'Orthogonal',
  subtitle: 'Perpendicular to reality.',
  chapter: 10,

  completionText: 'You have learned to see. The procedural infinite awaits.',

  dimensions: ['LATTICE', 'MARROW', 'VOID'],
  startDimension: 'LATTICE',

  nodes: [
    // Single origin - players can be 1-4
    {
      id: 'origin',
      position: { x: 0, y: 0, z: 0 },
      type: 'origin',
      dimension: 'LATTICE'
    },

    // The puzzle is a 3D grid where paths exist perpendicular to each dimension
    // LATTICE layer (z = 0)
    {
      id: 'L-00',
      position: { x: 2, y: 2, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 500
    },
    {
      id: 'L-01',
      position: { x: 2, y: -2, z: 0 },
      type: 'switch',
      dimension: 'LATTICE',
      properties: { color: '#ff8800' }
    },
    {
      id: 'L-10',
      position: { x: -2, y: 2, z: 0 },
      type: 'waypoint',
      dimension: 'LATTICE',
      activationTime: 0
    },
    {
      id: 'L-11',
      position: { x: -2, y: -2, z: 0 },
      type: 'witness',
      dimension: 'LATTICE'
    },

    // MARROW layer (z = 4) - organic connections
    {
      id: 'M-00',
      position: { x: 2, y: 2, z: 4 },
      type: 'waypoint',
      dimension: 'MARROW',
      activationTime: 0
    },
    {
      id: 'M-01',
      position: { x: 2, y: -2, z: 4 },
      type: 'waypoint',
      dimension: 'MARROW',
      activationTime: 0
    },
    {
      id: 'M-10',
      position: { x: -2, y: 2, z: 4 },
      type: 'switch',
      dimension: 'MARROW',
      properties: { color: '#00ff88' }
    },
    {
      id: 'M-11',
      position: { x: -2, y: -2, z: 4 },
      type: 'gate',
      dimension: 'MARROW',
      properties: { locked: true }
    },

    // VOID layer (z = -4) - hidden, sparse
    {
      id: 'V-center',
      position: { x: 0, y: 0, z: -4 },
      type: 'void',
      dimension: 'VOID',
      hiddenIn: ['LATTICE', 'MARROW']
    },
    {
      id: 'V-key',
      position: { x: 0, y: 0, z: -8 },
      type: 'witness',
      dimension: 'VOID',
      properties: { color: '#8800ff' }
    },

    // Orthogonal connections (perpendicular to all dimensions)
    {
      id: 'ortho-1',
      position: { x: 4, y: 0, z: 2 },
      type: 'mirror',
      dimension: 'LATTICE',
      properties: { label: 'perpendicular' }
    },
    {
      id: 'ortho-2',
      position: { x: -4, y: 0, z: 2 },
      type: 'mirror',
      dimension: 'MARROW'
    },

    // The final gate - requires understanding orthogonality
    {
      id: 'final-gate',
      position: { x: 0, y: 4, z: 4 },
      type: 'gate',
      dimension: 'LATTICE',
      requiredPlayers: 1,  // Can be done solo, but easier with team
      properties: {
        locked: true,
        color: '#ffffff'
      }
    },

    // Destination - exists in a dimension orthogonal to all three
    {
      id: 'destination',
      position: { x: 0, y: 0, z: 12 },
      type: 'destination',
      dimension: 'LATTICE',  // Becomes visible from any dimension
      properties: {
        color: '#ffd700',
        label: 'beyond'
      }
    }
  ],

  edges: [
    // LATTICE grid
    { from: 'origin', to: 'L-00', type: 'solid', dimension: 'LATTICE' },
    { from: 'origin', to: 'L-10', type: 'solid', dimension: 'LATTICE' },
    { from: 'L-00', to: 'L-01', type: 'solid', dimension: 'LATTICE' },
    { from: 'L-10', to: 'L-11', type: 'solid', dimension: 'LATTICE' },
    { from: 'L-00', to: 'L-10', type: 'dashed', dimension: 'LATTICE' },
    { from: 'L-01', to: 'L-11', type: 'dashed', dimension: 'LATTICE' },

    // MARROW grid
    { from: 'M-00', to: 'M-01', type: 'solid', dimension: 'MARROW' },
    { from: 'M-10', to: 'M-11', type: 'solid', dimension: 'MARROW' },
    { from: 'M-00', to: 'M-10', type: 'solid', dimension: 'MARROW' },
    { from: 'M-01', to: 'M-11', type: 'solid', dimension: 'MARROW' },

    // VOID paths
    { from: 'V-center', to: 'V-key', type: 'hidden', dimension: 'VOID' },

    // Orthogonal connections (cross-dimensional)
    { from: 'L-00', to: 'M-00', type: 'one-way', dimension: 'LATTICE' },
    { from: 'L-01', to: 'ortho-1', type: 'solid', dimension: 'LATTICE' },
    { from: 'ortho-1', to: 'M-01', type: 'solid', dimension: 'LATTICE' },
    { from: 'L-10', to: 'ortho-2', type: 'solid', dimension: 'MARROW' },
    { from: 'ortho-2', to: 'M-10', type: 'solid', dimension: 'MARROW' },
    { from: 'L-11', to: 'V-center', type: 'witness-only', dimension: 'LATTICE' },

    // Final path
    { from: 'M-11', to: 'final-gate', type: 'solid', dimension: 'MARROW' },
    { from: 'final-gate', to: 'destination', type: 'solid', dimension: 'LATTICE' }
  ],

  triggers: [
    // Witness from L-11 reveals void entrance
    {
      type: 'witness',
      nodeId: 'L-11',
      action: 'reveal',
      target: 'V-center'
    },
    // Void key unlocks marrow gate
    {
      type: 'witness',
      nodeId: 'V-key',
      action: 'unlock',
      target: 'M-11'
    },
    // Both mirror nodes must be activated
    {
      type: 'activate',
      nodeId: 'ortho-1',
      action: 'unlock',
      target: 'final-gate',
      data: { partialUnlock: 1 }
    },
    {
      type: 'activate',
      nodeId: 'ortho-2',
      action: 'unlock',
      target: 'final-gate',
      data: { partialUnlock: 2 }
    },
    // Switches reveal cross-dimensional paths
    {
      type: 'activate',
      nodeId: 'L-01',
      action: 'reveal',
      target: 'ortho-1'
    },
    {
      type: 'activate',
      nodeId: 'M-10',
      action: 'reveal',
      target: 'ortho-2'
    }
  ],

  objectives: {
    primary: 'Understand orthogonality across all dimensions',
    hidden: [
      'Complete solo',
      'Visit void without witnessing from lattice first',
      'Activate mirrors simultaneously',
      'Complete under par time'
    ]
  },

  victoryCondition: {
    type: 'reach',
    targets: ['destination']
  },

  mechanics: [
    'attention-movement',
    'path-traversal',
    'witness-mode',
    'dimension-shifting',
    'void-navigation',
    'mirror-mechanics',
    'orthogonal-thinking'
  ],
  newMechanic: 'orthogonal-thinking',
  coopMechanics: ['synchronized-focus', 'split-perception', 'relay-witness'],

  minPlayers: 1,
  maxPlayers: 4,

  difficulty: 10,
  parTime: 300,
  perfectTime: 120,

  ambience: 'mixed',
  visualTheme: 'transcendence',
  specialEffects: [
    'dimension-overlay',
    'orthogonal-grid',
    'perpendicular-paths',
    'final-revelation',
    'procedural-unlock'
  ]
};

// =============================================================================
// EXPORTS
// =============================================================================

export const STATIC_LEVELS: StaticLevelDefinition[] = [
  LEVEL_0_EMERGENCE,
  LEVEL_1_FIRST_LATTICE,
  LEVEL_2_THE_WITNESS,
  LEVEL_3_BEYOND_THE_LATTICE,
  LEVEL_4_PERSISTENCE,
  LEVEL_5_VOID_TOUCH,
  LEVEL_6_TOGETHER,
  LEVEL_7_MIRRORS,
  LEVEL_8_THE_RELAY,
  LEVEL_9_TETRAD,
  LEVEL_10_ORTHOGONAL
];

export const LEVEL_BY_ID = new Map<string, StaticLevelDefinition>(
  STATIC_LEVELS.map(level => [level.id, level])
);

export const LEVEL_BY_CHAPTER = new Map<number, StaticLevelDefinition>(
  STATIC_LEVELS.map(level => [level.chapter, level])
);

// Mechanic progression tracking
export const MECHANIC_INTRODUCTION: Record<string, number> = {
  'attention-movement': 0,
  'path-traversal': 0,
  'branching-paths': 1,
  'witness-mode': 2,
  'dimension-shifting': 3,
  'node-charging': 4,
  'void-navigation': 5,
  'synchronization': 6,
  'mirror-mechanics': 7,
  'relay-mechanics': 8,
  'tetrad-coordination': 9,
  'orthogonal-thinking': 10
};

// Level unlock requirements
export function canPlayLevel(chapter: number, completedLevels: Set<string>): boolean {
  if (chapter === 0) return true;  // Tutorial always available

  const previousLevel = LEVEL_BY_CHAPTER.get(chapter - 1);
  if (!previousLevel) return false;

  return completedLevels.has(previousLevel.id);
}

// Get all levels playable with N players
export function getLevelsForPlayerCount(playerCount: number): StaticLevelDefinition[] {
  return STATIC_LEVELS.filter(
    level => playerCount >= level.minPlayers && playerCount <= level.maxPlayers
  );
}

// Calculate mastery score for a level
export interface LevelResult {
  levelId: string;
  completionTime: number;
  hiddenObjectivesCompleted: string[];
  nodesVisited: string[];
  witnessTime: number;
  backtrackCount: number;
  deathCount: number;
}

export function calculateMasteryScore(result: LevelResult): number {
  const level = LEVEL_BY_ID.get(result.levelId);
  if (!level) return 0;

  let score = 0;

  // Base completion: 50 points
  score += 50;

  // Time bonus: up to 30 points
  if (result.completionTime <= level.perfectTime * 1000) {
    score += 30;
  } else if (result.completionTime <= level.parTime * 1000) {
    const ratio = (level.parTime * 1000 - result.completionTime) /
                  (level.parTime * 1000 - level.perfectTime * 1000);
    score += Math.floor(ratio * 20) + 10;
  } else {
    const overTime = result.completionTime - level.parTime * 1000;
    const penalty = Math.min(10, Math.floor(overTime / 10000));
    score += Math.max(0, 10 - penalty);
  }

  // Hidden objectives: 5 points each
  const hiddenCount = level.objectives.hidden?.length || 0;
  if (hiddenCount > 0) {
    const completed = result.hiddenObjectivesCompleted.length;
    score += (completed / hiddenCount) * 20;
  }

  // Efficiency bonus (minimal backtracking)
  if (result.backtrackCount === 0) {
    score += 5;
  }

  // No death bonus
  if (result.deathCount === 0) {
    score += 5;
  }

  return Math.round(Math.min(100, score));
}
