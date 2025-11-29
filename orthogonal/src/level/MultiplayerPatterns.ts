/**
 * MultiplayerPatterns.ts
 *
 * Multiplayer level generation patterns learned from static levels
 * Used by ProceduralLevelGenerator to create proper cooperative levels
 */

import { DimensionType } from '../core/DimensionManager';
import { NodeDefinition, EdgeDefinition, LevelTrigger } from './StaticLevels';
import { SeededRandom } from './ProceduralLevelGenerator';

// =============================================================================
// TYPES
// =============================================================================

export type PlayerCount = 1 | 2 | 3 | 4;

export interface MultiplayerPattern {
  name: string;
  description: string;
  playerCount: PlayerCount;
  template: PatternTemplate;
  mechanics: string[];
  coopMechanics: string[];
}

export interface PatternTemplate {
  originLayout: 'parallel' | 'cardinal' | 'triangle' | 'stacked' | 'dimensional';
  pathStyle: 'converging' | 'split-merge' | 'relay' | 'parallel-sync' | 'chain';
  syncPoints: number;  // Number of synchronization gates
  dimensionSplit: boolean;  // Whether players go to different dimensions
  witnessRelays: boolean;  // Whether players need to witness for each other
}

// =============================================================================
// PATTERN DEFINITIONS (learned from static levels)
// =============================================================================

export const DUO_PATTERNS: MultiplayerPattern[] = [
  // Pattern from duo-partners
  {
    name: 'Parallel Convergence',
    description: 'Two players on parallel paths meeting at sync point',
    playerCount: 2,
    template: {
      originLayout: 'parallel',
      pathStyle: 'converging',
      syncPoints: 1,
      dimensionSplit: false,
      witnessRelays: false
    },
    mechanics: ['attention-movement', 'synchronization'],
    coopMechanics: ['synchronized-focus']
  },
  // Pattern from duo-relay
  {
    name: 'Watcher-Runner',
    description: 'One player witnesses, other navigates hidden paths',
    playerCount: 2,
    template: {
      originLayout: 'stacked',
      pathStyle: 'relay',
      syncPoints: 1,
      dimensionSplit: true,
      witnessRelays: true
    },
    mechanics: ['attention-movement', 'witness-mode', 'dimension-shifting'],
    coopMechanics: ['relay-witness', 'split-perception']
  },
  // Pattern from duo-mirror-twins
  {
    name: 'Mirror Movement',
    description: 'Players move in inverted sync across dimensions',
    playerCount: 2,
    template: {
      originLayout: 'dimensional',
      pathStyle: 'parallel-sync',
      syncPoints: 2,
      dimensionSplit: true,
      witnessRelays: false
    },
    mechanics: ['attention-movement', 'dimension-shifting', 'mirror-mechanics'],
    coopMechanics: ['synchronized-focus', 'split-perception']
  },
  // Pattern from duo-void-crossing
  {
    name: 'Anchor-Drifter',
    description: 'One anchors in reality, other explores void',
    playerCount: 2,
    template: {
      originLayout: 'parallel',
      pathStyle: 'relay',
      syncPoints: 1,
      dimensionSplit: true,
      witnessRelays: true
    },
    mechanics: ['attention-movement', 'witness-mode', 'void-navigation'],
    coopMechanics: ['relay-witness', 'split-perception']
  }
];

export const TRIO_PATTERNS: MultiplayerPattern[] = [
  // Pattern from trio-triangle
  {
    name: 'Triangle Convergence',
    description: 'Three players from triangle positions meet at center',
    playerCount: 3,
    template: {
      originLayout: 'triangle',
      pathStyle: 'converging',
      syncPoints: 1,
      dimensionSplit: false,
      witnessRelays: false
    },
    mechanics: ['attention-movement', 'synchronization'],
    coopMechanics: ['synchronized-focus']
  },
  // Pattern from trio-chain
  {
    name: 'Chain Relay',
    description: 'Each player unlocks the next in sequence',
    playerCount: 3,
    template: {
      originLayout: 'stacked',
      pathStyle: 'chain',
      syncPoints: 3,
      dimensionSplit: false,
      witnessRelays: false
    },
    mechanics: ['attention-movement', 'node-charging', 'chain-mechanics'],
    coopMechanics: ['sequential-focus']
  },
  // Pattern from trio-dimensions
  {
    name: 'Dimensional Trinity',
    description: 'Each player in different dimension, converge at nexus',
    playerCount: 3,
    template: {
      originLayout: 'dimensional',
      pathStyle: 'converging',
      syncPoints: 1,
      dimensionSplit: true,
      witnessRelays: false
    },
    mechanics: ['attention-movement', 'dimension-shifting', 'void-navigation'],
    coopMechanics: ['synchronized-focus', 'split-perception']
  },
  // Pattern from trio-witness
  {
    name: 'Circular Witness',
    description: 'Each player reveals path for another in circular pattern',
    playerCount: 3,
    template: {
      originLayout: 'triangle',
      pathStyle: 'relay',
      syncPoints: 1,
      dimensionSplit: false,
      witnessRelays: true
    },
    mechanics: ['attention-movement', 'witness-mode'],
    coopMechanics: ['relay-witness', 'split-perception']
  }
];

export const QUAD_PATTERNS: MultiplayerPattern[] = [
  // Pattern from quad-cardinal
  {
    name: 'Cardinal Convergence',
    description: 'Four players from N/S/E/W meet at center',
    playerCount: 4,
    template: {
      originLayout: 'cardinal',
      pathStyle: 'converging',
      syncPoints: 1,
      dimensionSplit: false,
      witnessRelays: false
    },
    mechanics: ['attention-movement', 'synchronization'],
    coopMechanics: ['synchronized-focus']
  },
  // Pattern from quad-elements
  {
    name: 'Elemental Links',
    description: 'Opposite elements unlock each other',
    playerCount: 4,
    template: {
      originLayout: 'cardinal',
      pathStyle: 'split-merge',
      syncPoints: 4,
      dimensionSplit: true,
      witnessRelays: false
    },
    mechanics: ['attention-movement', 'node-charging', 'dimension-shifting'],
    coopMechanics: ['synchronized-focus', 'split-perception']
  },
  // Pattern from quad-split
  {
    name: 'Team Split',
    description: 'Two teams in different dimensions, relay between them',
    playerCount: 4,
    template: {
      originLayout: 'parallel',
      pathStyle: 'relay',
      syncPoints: 2,
      dimensionSplit: true,
      witnessRelays: true
    },
    mechanics: ['attention-movement', 'witness-mode', 'dimension-shifting', 'void-navigation'],
    coopMechanics: ['relay-witness', 'split-perception']
  },
  // Pattern from quad-relay
  {
    name: 'Four-Way Relay',
    description: 'Sequential unlock chain: 1→2→3→4',
    playerCount: 4,
    template: {
      originLayout: 'stacked',
      pathStyle: 'chain',
      syncPoints: 4,
      dimensionSplit: true,
      witnessRelays: false
    },
    mechanics: ['attention-movement', 'node-charging', 'dimension-shifting', 'void-navigation'],
    coopMechanics: ['sequential-focus', 'split-perception']
  }
];

// =============================================================================
// PATTERN GENERATOR
// =============================================================================

export class MultiplayerPatternGenerator {
  private random: SeededRandom;
  private playerCount: PlayerCount;
  private difficulty: number;

  constructor(random: SeededRandom, playerCount: PlayerCount, difficulty: number) {
    this.random = random;
    this.playerCount = playerCount;
    this.difficulty = difficulty;
  }

  selectPattern(): MultiplayerPattern {
    const patterns = this.getPatternsForPlayerCount();
    return this.random.choice(patterns);
  }

  private getPatternsForPlayerCount(): MultiplayerPattern[] {
    switch (this.playerCount) {
      case 2: return DUO_PATTERNS;
      case 3: return TRIO_PATTERNS;
      case 4: return QUAD_PATTERNS;
      default: return [];
    }
  }

  // ---------------------------------------------------------------------------
  // ORIGIN GENERATION
  // ---------------------------------------------------------------------------

  generateOrigins(pattern: MultiplayerPattern, dimensions: DimensionType[]): NodeDefinition[] {
    const origins: NodeDefinition[] = [];
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
    const labels = ['P1', 'P2', 'P3', 'P4'];

    const positions = this.getOriginPositions(pattern.template.originLayout);

    for (let i = 0; i < this.playerCount; i++) {
      const dimension = pattern.template.dimensionSplit && dimensions.length > 1
        ? dimensions[i % dimensions.length]
        : dimensions[0];

      origins.push({
        id: `origin-${i + 1}`,
        position: positions[i],
        type: 'origin',
        dimension,
        properties: {
          color: colors[i],
          label: labels[i]
        }
      });
    }

    return origins;
  }

  private getOriginPositions(layout: PatternTemplate['originLayout']): { x: number; y: number; z: number }[] {
    switch (layout) {
      case 'parallel':
        return [
          { x: 0, y: 4, z: 0 },
          { x: 0, y: -4, z: 0 },
          { x: 0, y: 8, z: 0 },
          { x: 0, y: -8, z: 0 }
        ].slice(0, this.playerCount);

      case 'cardinal':
        return [
          { x: 0, y: 8, z: 0 },   // North
          { x: 0, y: -8, z: 0 },  // South
          { x: 8, y: 0, z: 0 },   // East
          { x: -8, y: 0, z: 0 }   // West
        ].slice(0, this.playerCount);

      case 'triangle':
        const triRadius = 6;
        return [
          { x: 0, y: triRadius, z: 0 },
          { x: -triRadius * Math.cos(Math.PI / 6), y: -triRadius * Math.sin(Math.PI / 6), z: 0 },
          { x: triRadius * Math.cos(Math.PI / 6), y: -triRadius * Math.sin(Math.PI / 6), z: 0 },
          { x: 0, y: 0, z: triRadius }  // Fourth above if needed
        ].slice(0, this.playerCount);

      case 'stacked':
        return [
          { x: 0, y: 8, z: 0 },
          { x: 0, y: 4, z: 0 },
          { x: 0, y: -4, z: 0 },
          { x: 0, y: -8, z: 0 }
        ].slice(0, this.playerCount);

      case 'dimensional':
        // Each in different dimension at same position
        return Array(this.playerCount).fill({ x: 0, y: 0, z: 0 }).map((_, i) => ({
          x: 0,
          y: 0,
          z: i * 4 - (this.playerCount - 1) * 2
        }));

      default:
        return [{ x: 0, y: 0, z: 0 }];
    }
  }

  // ---------------------------------------------------------------------------
  // PATH GENERATION
  // ---------------------------------------------------------------------------

  generatePlayerPaths(
    pattern: MultiplayerPattern,
    origins: NodeDefinition[],
    nexusPosition: { x: number; y: number; z: number },
    dimensions: DimensionType[]
  ): { nodes: NodeDefinition[]; edges: EdgeDefinition[]; triggers: LevelTrigger[] } {
    const nodes: NodeDefinition[] = [];
    const edges: EdgeDefinition[] = [];
    const triggers: LevelTrigger[] = [];

    switch (pattern.template.pathStyle) {
      case 'converging':
        return this.generateConvergingPaths(origins, nexusPosition, dimensions);

      case 'split-merge':
        return this.generateSplitMergePaths(origins, nexusPosition, dimensions, pattern);

      case 'relay':
        return this.generateRelayPaths(origins, nexusPosition, dimensions, pattern);

      case 'parallel-sync':
        return this.generateParallelSyncPaths(origins, nexusPosition, dimensions);

      case 'chain':
        return this.generateChainPaths(origins, nexusPosition, dimensions);

      default:
        return { nodes, edges, triggers };
    }
  }

  private generateConvergingPaths(
    origins: NodeDefinition[],
    nexusPosition: { x: number; y: number; z: number },
    dimensions: DimensionType[]
  ): { nodes: NodeDefinition[]; edges: EdgeDefinition[]; triggers: LevelTrigger[] } {
    const nodes: NodeDefinition[] = [];
    const edges: EdgeDefinition[] = [];

    // Each player gets 2-3 waypoints leading to nexus
    for (let p = 0; p < origins.length; p++) {
      const origin = origins[p];
      const pathLength = 2 + this.random.int(0, 1);
      let lastNodeId = origin.id;

      for (let i = 0; i < pathLength; i++) {
        const t = (i + 1) / (pathLength + 1);
        const nodeId = `p${p + 1}-w${i + 1}`;

        const pos = {
          x: origin.position.x + (nexusPosition.x - origin.position.x) * t + this.random.range(-2, 2),
          y: origin.position.y + (nexusPosition.y - origin.position.y) * t + this.random.range(-1, 1),
          z: origin.position.z + (nexusPosition.z - origin.position.z) * t
        };

        nodes.push({
          id: nodeId,
          position: pos,
          type: 'waypoint',
          dimension: origin.dimension,
          activationTime: i === pathLength - 1 ? 500 : 0
        });

        edges.push({
          from: lastNodeId,
          to: nodeId,
          type: 'solid',
          dimension: origin.dimension
        });

        lastNodeId = nodeId;
      }

      // Connect to nexus
      edges.push({
        from: lastNodeId,
        to: 'nexus',
        type: 'solid',
        dimension: origin.dimension
      });
    }

    return { nodes, edges, triggers: [] };
  }

  private generateSplitMergePaths(
    origins: NodeDefinition[],
    nexusPosition: { x: number; y: number; z: number },
    dimensions: DimensionType[],
    pattern: MultiplayerPattern
  ): { nodes: NodeDefinition[]; edges: EdgeDefinition[]; triggers: LevelTrigger[] } {
    const nodes: NodeDefinition[] = [];
    const edges: EdgeDefinition[] = [];
    const triggers: LevelTrigger[] = [];

    // Each player has a switch that unlocks another's gate
    for (let p = 0; p < origins.length; p++) {
      const origin = origins[p];
      const targetPlayer = (p + origins.length / 2) % origins.length;  // Opposite player

      // Switch node
      const switchPos = {
        x: origin.position.x + (nexusPosition.x - origin.position.x) * 0.4,
        y: origin.position.y + (nexusPosition.y - origin.position.y) * 0.4,
        z: origin.position.z
      };

      nodes.push({
        id: `p${p + 1}-switch`,
        position: switchPos,
        type: 'switch',
        dimension: origin.dimension,
        activationTime: 1000,
        properties: { color: origin.properties?.color }
      });

      // Gate node (unlocked by another player)
      const gatePos = {
        x: origin.position.x + (nexusPosition.x - origin.position.x) * 0.6,
        y: origin.position.y + (nexusPosition.y - origin.position.y) * 0.6,
        z: origin.position.z
      };

      nodes.push({
        id: `p${p + 1}-gate`,
        position: gatePos,
        type: 'gate',
        dimension: origin.dimension,
        properties: { locked: true }
      });

      // Edges
      edges.push(
        { from: origin.id, to: `p${p + 1}-switch`, type: 'solid', dimension: origin.dimension },
        { from: `p${p + 1}-switch`, to: `p${p + 1}-gate`, type: 'solid', dimension: origin.dimension },
        { from: `p${p + 1}-gate`, to: 'nexus', type: 'solid', dimension: origin.dimension }
      );

      // Trigger: this switch unlocks target player's gate
      triggers.push({
        type: 'activate',
        nodeId: `p${p + 1}-switch`,
        action: 'unlock',
        target: `p${Math.floor(targetPlayer) + 1}-gate`
      });
    }

    return { nodes, edges, triggers };
  }

  private generateRelayPaths(
    origins: NodeDefinition[],
    nexusPosition: { x: number; y: number; z: number },
    dimensions: DimensionType[],
    pattern: MultiplayerPattern
  ): { nodes: NodeDefinition[]; edges: EdgeDefinition[]; triggers: LevelTrigger[] } {
    const nodes: NodeDefinition[] = [];
    const edges: EdgeDefinition[] = [];
    const triggers: LevelTrigger[] = [];

    // Determine watchers and movers
    const watchers = origins.filter((_, i) => i % 2 === 0);
    const movers = origins.filter((_, i) => i % 2 === 1);

    // Watcher paths (witness perches)
    for (let w = 0; w < watchers.length; w++) {
      const watcher = watchers[w];
      const perchPos = {
        x: watcher.position.x + 4,
        y: watcher.position.y,
        z: watcher.position.z
      };

      nodes.push({
        id: `watcher-${w + 1}-perch`,
        position: perchPos,
        type: 'witness',
        dimension: watcher.dimension,
        activationTime: 0
      });

      edges.push({
        from: watcher.id,
        to: `watcher-${w + 1}-perch`,
        type: 'solid',
        dimension: watcher.dimension
      });
    }

    // Mover paths (hidden until witnessed)
    for (let m = 0; m < movers.length; m++) {
      const mover = movers[m];
      const pathDim = dimensions.length > 1 ? dimensions[1] : dimensions[0];

      for (let i = 1; i <= 3; i++) {
        const nodePos = {
          x: mover.position.x + i * 4,
          y: mover.position.y + this.random.range(-2, 2),
          z: mover.position.z + i * 2
        };

        nodes.push({
          id: `mover-${m + 1}-path-${i}`,
          position: nodePos,
          type: 'waypoint',
          dimension: pathDim,
          hiddenIn: [dimensions[0]],  // Hidden in watcher's dimension
          activationTime: 0
        });

        edges.push({
          from: i === 1 ? mover.id : `mover-${m + 1}-path-${i - 1}`,
          to: `mover-${m + 1}-path-${i}`,
          type: 'hidden',
          dimension: pathDim
        });
      }

      // Witness trigger
      if (watchers.length > m) {
        triggers.push({
          type: 'witness',
          nodeId: `watcher-${m + 1}-perch`,
          action: 'reveal',
          target: `mover-${m + 1}-path-1`
        });
      }

      // Connect to nexus
      edges.push({
        from: `mover-${m + 1}-path-3`,
        to: 'nexus',
        type: 'solid',
        dimension: pathDim
      });
    }

    // Connect watchers to nexus
    for (let w = 0; w < watchers.length; w++) {
      edges.push({
        from: `watcher-${w + 1}-perch`,
        to: 'nexus',
        type: 'solid',
        dimension: watchers[w].dimension
      });
    }

    return { nodes, edges, triggers };
  }

  private generateParallelSyncPaths(
    origins: NodeDefinition[],
    nexusPosition: { x: number; y: number; z: number },
    dimensions: DimensionType[]
  ): { nodes: NodeDefinition[]; edges: EdgeDefinition[]; triggers: LevelTrigger[] } {
    const nodes: NodeDefinition[] = [];
    const edges: EdgeDefinition[] = [];
    const triggers: LevelTrigger[] = [];

    // Mirror paths - same positions, different dimensions
    const pathLength = 3;

    for (let p = 0; p < origins.length; p++) {
      const origin = origins[p];
      const yMirror = p % 2 === 0 ? 1 : -1;  // Invert Y for mirroring

      let lastNodeId = origin.id;

      for (let i = 1; i <= pathLength; i++) {
        const nodeId = `p${p + 1}-sync-${i}`;
        const pos = {
          x: origin.position.x + i * 4,
          y: yMirror * (2 + i),
          z: origin.position.z
        };

        nodes.push({
          id: nodeId,
          position: pos,
          type: i === pathLength ? 'switch' : 'waypoint',
          dimension: origin.dimension,
          activationTime: i === pathLength ? 500 : 0,
          properties: i === pathLength ? { color: origin.properties?.color } : undefined
        });

        edges.push({
          from: lastNodeId,
          to: nodeId,
          type: 'solid',
          dimension: origin.dimension
        });

        lastNodeId = nodeId;
      }

      edges.push({
        from: lastNodeId,
        to: 'nexus',
        type: 'solid',
        dimension: origin.dimension
      });

      // Sync triggers - must hit switches together
      triggers.push({
        type: 'activate',
        nodeId: `p${p + 1}-sync-${pathLength}`,
        action: 'unlock',
        target: 'nexus',
        data: { partialUnlock: p + 1, syncWindow: 1000 }
      });
    }

    return { nodes, edges, triggers };
  }

  private generateChainPaths(
    origins: NodeDefinition[],
    nexusPosition: { x: number; y: number; z: number },
    dimensions: DimensionType[]
  ): { nodes: NodeDefinition[]; edges: EdgeDefinition[]; triggers: LevelTrigger[] } {
    const nodes: NodeDefinition[] = [];
    const edges: EdgeDefinition[] = [];
    const triggers: LevelTrigger[] = [];

    // Sequential chain: Player 1 unlocks Player 2, etc.
    for (let p = 0; p < origins.length; p++) {
      const origin = origins[p];
      const dimension = dimensions[Math.min(p, dimensions.length - 1)];

      // Gate (locked except for first player)
      if (p > 0) {
        const gatePos = {
          x: origin.position.x + 4,
          y: origin.position.y,
          z: origin.position.z
        };

        nodes.push({
          id: `p${p + 1}-gate`,
          position: gatePos,
          type: 'gate',
          dimension,
          properties: { locked: true }
        });

        edges.push({
          from: origin.id,
          to: `p${p + 1}-gate`,
          type: 'solid',
          dimension
        });
      }

      // Path and switch
      const pathStart = p > 0 ? `p${p + 1}-gate` : origin.id;
      const pathPos = {
        x: origin.position.x + 8,
        y: origin.position.y,
        z: origin.position.z
      };

      nodes.push({
        id: `p${p + 1}-path`,
        position: pathPos,
        type: 'waypoint',
        dimension,
        activationTime: 0
      });

      const switchPos = {
        x: origin.position.x + 12,
        y: origin.position.y,
        z: origin.position.z
      };

      nodes.push({
        id: `p${p + 1}-switch`,
        position: switchPos,
        type: 'switch',
        dimension,
        activationTime: 1500,
        properties: { color: origin.properties?.color }
      });

      edges.push(
        { from: pathStart, to: `p${p + 1}-path`, type: 'solid', dimension },
        { from: `p${p + 1}-path`, to: `p${p + 1}-switch`, type: 'solid', dimension },
        { from: `p${p + 1}-switch`, to: 'nexus', type: 'solid', dimension }
      );

      // Chain trigger
      if (p < origins.length - 1) {
        triggers.push({
          type: 'activate',
          nodeId: `p${p + 1}-switch`,
          action: 'unlock',
          target: `p${p + 2}-gate`
        });
      } else {
        // Last player unlocks nexus
        triggers.push({
          type: 'activate',
          nodeId: `p${p + 1}-switch`,
          action: 'unlock',
          target: 'nexus'
        });
      }
    }

    return { nodes, edges, triggers };
  }

  // ---------------------------------------------------------------------------
  // SYNC POINT GENERATION
  // ---------------------------------------------------------------------------

  generateSyncPoints(
    pattern: MultiplayerPattern,
    mainNexusPosition: { x: number; y: number; z: number }
  ): NodeDefinition[] {
    const nodes: NodeDefinition[] = [];

    // Main nexus
    nodes.push({
      id: 'nexus',
      position: mainNexusPosition,
      type: 'gate',
      dimension: 'LATTICE',
      requiredPlayers: this.playerCount,
      properties: {
        locked: pattern.template.pathStyle !== 'converging',
        color: '#ffffff',
        label: 'converge'
      }
    });

    return nodes;
  }

  // ---------------------------------------------------------------------------
  // DESTINATION GENERATION
  // ---------------------------------------------------------------------------

  generateDestination(nexusPosition: { x: number; y: number; z: number }): NodeDefinition {
    return {
      id: 'destination',
      position: {
        x: nexusPosition.x + 4,
        y: nexusPosition.y,
        z: nexusPosition.z + 4
      },
      type: 'destination',
      dimension: 'LATTICE',
      properties: { color: '#ffd700' }
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function getPatternForPlayerCount(playerCount: PlayerCount): MultiplayerPattern[] {
  switch (playerCount) {
    case 2: return DUO_PATTERNS;
    case 3: return TRIO_PATTERNS;
    case 4: return QUAD_PATTERNS;
    default: return [];
  }
}

export function selectRandomPattern(random: SeededRandom, playerCount: PlayerCount): MultiplayerPattern | null {
  const patterns = getPatternForPlayerCount(playerCount);
  if (patterns.length === 0) return null;
  return random.choice(patterns);
}
