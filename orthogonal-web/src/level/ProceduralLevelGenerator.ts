/**
 * ProceduralLevelGenerator.ts
 *
 * Infinite procedural level generation after static levels
 * Adapts to player skill via SDPM profile
 * Creates unique, reproducible levels from seeds
 */

import { DimensionType } from '../core/DimensionManager';
import { StaticLevelDefinition, NodeDefinition, EdgeDefinition, LevelTrigger } from './StaticLevels';
import { saveSystem } from '../save/SaveSystem';

// =============================================================================
// SEEDED RANDOM
// =============================================================================

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  // Mulberry32 PRNG
  next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Random in range [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Random integer in range [min, max]
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Random choice from array
  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  // Shuffle array in place
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Weighted random choice
  weightedChoice<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  // Get current state for reproducibility
  getState(): number {
    return this.state;
  }
}

// =============================================================================
// TYPES
// =============================================================================

export type LevelTheme =
  | 'crystalline'    // Pure LATTICE, geometric
  | 'organic'        // Pure MARROW, flowing
  | 'void'           // Pure VOID, sparse
  | 'hybrid'         // Two dimensions
  | 'transcendent'   // All three dimensions
  | 'mirror'         // Heavy mirror mechanics
  | 'relay'          // Coop-focused
  | 'speedrun'       // Optimized for fast completion
  | 'puzzle'         // Complex puzzle mechanics
  | 'survival';      // Timed/dangerous

export type DifficultyTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface GeneratorConfig {
  seed: number;
  difficulty: DifficultyTier;
  theme?: LevelTheme;
  playerCount: 1 | 2 | 3 | 4;
  sdpmModifiers?: SDPMModifiers;
  preferredMechanics?: string[];
  avoidMechanics?: string[];
}

export interface SDPMModifiers {
  reactionTimeScale: number;      // 0.5-2.0, affects timing windows
  complexityPreference: number;   // 0-1, more = more complex puzzles
  explorationTendency: number;    // 0-1, more = more hidden paths
  patternRecognition: number;     // 0-1, more = more pattern-based puzzles
  witnessAffinity: number;        // 0-1, more = more witness mechanics
  voidComfort: number;            // 0-1, more = more void navigation
}

export interface GeneratedLevel extends StaticLevelDefinition {
  generatorVersion: number;
  generatorConfig: GeneratorConfig;
  fingerprint: string;
  shortCode: string;
}

// =============================================================================
// LEVEL TEMPLATES
// =============================================================================

interface LevelTemplate {
  theme: LevelTheme;
  dimensions: DimensionType[];
  nodeCountRange: [number, number];
  branchingFactor: [number, number];
  specialNodeRatio: number;
  mechanics: string[];
  visualStyle: string;
}

const TEMPLATES: Record<LevelTheme, LevelTemplate> = {
  crystalline: {
    theme: 'crystalline',
    dimensions: ['LATTICE'],
    nodeCountRange: [8, 20],
    branchingFactor: [2, 4],
    specialNodeRatio: 0.2,
    mechanics: ['path-traversal', 'node-charging', 'branching-paths'],
    visualStyle: 'geometric-clarity'
  },
  organic: {
    theme: 'organic',
    dimensions: ['MARROW'],
    nodeCountRange: [10, 25],
    branchingFactor: [2, 5],
    specialNodeRatio: 0.25,
    mechanics: ['path-traversal', 'witness-mode', 'flowing-paths'],
    visualStyle: 'organic-flow'
  },
  void: {
    theme: 'void',
    dimensions: ['VOID'],
    nodeCountRange: [5, 12],
    branchingFactor: [1, 3],
    specialNodeRatio: 0.3,
    mechanics: ['void-navigation', 'witness-mode'],
    visualStyle: 'sparse-void'
  },
  hybrid: {
    theme: 'hybrid',
    dimensions: ['LATTICE', 'MARROW'],
    nodeCountRange: [12, 30],
    branchingFactor: [2, 4],
    specialNodeRatio: 0.3,
    mechanics: ['dimension-shifting', 'path-traversal', 'witness-mode'],
    visualStyle: 'dual-realm'
  },
  transcendent: {
    theme: 'transcendent',
    dimensions: ['LATTICE', 'MARROW', 'VOID'],
    nodeCountRange: [15, 40],
    branchingFactor: [2, 5],
    specialNodeRatio: 0.35,
    mechanics: ['dimension-shifting', 'void-navigation', 'witness-mode', 'mirror-mechanics'],
    visualStyle: 'transcendence'
  },
  mirror: {
    theme: 'mirror',
    dimensions: ['LATTICE', 'MARROW'],
    nodeCountRange: [10, 25],
    branchingFactor: [2, 3],
    specialNodeRatio: 0.4,
    mechanics: ['mirror-mechanics', 'dimension-shifting', 'witness-mode'],
    visualStyle: 'reflection'
  },
  relay: {
    theme: 'relay',
    dimensions: ['LATTICE', 'MARROW'],
    nodeCountRange: [15, 35],
    branchingFactor: [2, 4],
    specialNodeRatio: 0.3,
    mechanics: ['relay-mechanics', 'synchronization', 'split-perception'],
    visualStyle: 'cooperative'
  },
  speedrun: {
    theme: 'speedrun',
    dimensions: ['LATTICE'],
    nodeCountRange: [10, 20],
    branchingFactor: [2, 3],
    specialNodeRatio: 0.15,
    mechanics: ['path-traversal', 'node-charging'],
    visualStyle: 'streamlined'
  },
  puzzle: {
    theme: 'puzzle',
    dimensions: ['LATTICE', 'MARROW'],
    nodeCountRange: [12, 28],
    branchingFactor: [2, 4],
    specialNodeRatio: 0.4,
    mechanics: ['witness-mode', 'node-charging', 'gate-mechanics', 'sequence'],
    visualStyle: 'intricate'
  },
  survival: {
    theme: 'survival',
    dimensions: ['VOID', 'LATTICE'],
    nodeCountRange: [8, 18],
    branchingFactor: [1, 3],
    specialNodeRatio: 0.25,
    mechanics: ['void-navigation', 'timed-paths', 'danger-zones'],
    visualStyle: 'perilous'
  }
};

// =============================================================================
// PROCEDURAL GENERATOR
// =============================================================================

export class ProceduralLevelGenerator {
  private random: SeededRandom;
  private config: GeneratorConfig;
  private template: LevelTemplate;

  private readonly VERSION = 1;

  constructor(config: GeneratorConfig) {
    this.config = config;
    this.random = new SeededRandom(config.seed);

    // Select template
    this.template = config.theme
      ? TEMPLATES[config.theme]
      : this.selectThemeForDifficulty(config.difficulty);
  }

  /**
   * Generate a complete level
   */
  generate(): GeneratedLevel {
    // Reset random with seed
    this.random = new SeededRandom(this.config.seed);

    // Generate structure
    const nodes = this.generateNodes();
    const edges = this.generateEdges(nodes);
    const triggers = this.generateTriggers(nodes);

    // Apply SDPM modifications
    this.applySDPMModifications(nodes, edges);

    // Calculate metadata
    const fingerprint = this.calculateFingerprint(nodes, edges);
    const shortCode = this.generateShortCode(fingerprint);

    // Determine difficulty rating
    const calculatedDifficulty = this.calculateDifficultyRating(nodes, edges);

    // Build level definition
    const level: GeneratedLevel = {
      id: `proc_${this.config.seed}`,
      seed: this.config.seed,
      name: this.generateLevelName(),
      subtitle: this.generateSubtitle(),
      chapter: 100 + this.config.difficulty,  // Procedural levels are chapter 100+

      dimensions: this.template.dimensions,
      startDimension: this.template.dimensions[0],

      nodes,
      edges,
      triggers,

      objectives: {
        primary: 'Reach the destination',
        hidden: this.generateHiddenObjectives(nodes)
      },

      victoryCondition: {
        type: 'reach',
        targets: nodes.filter(n => n.type === 'destination').map(n => n.id)
      },

      mechanics: this.template.mechanics,
      newMechanic: undefined,

      minPlayers: this.config.playerCount,
      maxPlayers: this.config.playerCount,

      difficulty: calculatedDifficulty,
      parTime: this.estimateParTime(nodes, edges),
      perfectTime: this.estimatePerfectTime(nodes, edges),

      ambience: this.getAmbience(),
      visualTheme: this.template.visualStyle,
      specialEffects: this.getSpecialEffects(),

      // Procedural-specific
      generatorVersion: this.VERSION,
      generatorConfig: this.config,
      fingerprint,
      shortCode
    };

    return level;
  }

  // ===========================================================================
  // NODE GENERATION
  // ===========================================================================

  private generateNodes(): NodeDefinition[] {
    const nodes: NodeDefinition[] = [];
    const [minNodes, maxNodes] = this.template.nodeCountRange;

    // Adjust for difficulty
    const difficultyScale = 0.5 + (this.config.difficulty / 10) * 0.8;
    const targetNodeCount = Math.floor(
      minNodes + (maxNodes - minNodes) * difficultyScale
    );

    // Always have origin and destination
    const originPos = this.generateStartPosition();
    nodes.push({
      id: 'origin',
      position: originPos,
      type: 'origin',
      dimension: this.template.dimensions[0],
      activationTime: 0
    });

    // Generate waypoints using spatial distribution
    const positions = this.generateNodePositions(targetNodeCount - 2, originPos);

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const dimension = this.selectDimensionForNode(i, positions.length);
      const nodeType = this.selectNodeType(i, positions.length);

      nodes.push({
        id: `node_${i}`,
        position: pos,
        type: nodeType,
        dimension,
        activationTime: this.getActivationTime(nodeType),
        properties: this.getNodeProperties(nodeType, dimension),
        hiddenIn: this.shouldBeHidden(nodeType) ? [this.getHidingDimension(dimension)] : undefined,
        requiredPlayers: this.getRequiredPlayers(nodeType)
      });
    }

    // Add destination at furthest point
    const destPos = this.findFurthestPosition(positions, originPos);
    nodes.push({
      id: 'destination',
      position: destPos,
      type: 'destination',
      dimension: this.template.dimensions[0],
      activationTime: 0,
      properties: { color: '#00ffff' }
    });

    return nodes;
  }

  private generateStartPosition(): { x: number; y: number; z: number } {
    return { x: 0, y: 0, z: 0 };
  }

  private generateNodePositions(count: number, origin: { x: number; y: number; z: number }): { x: number; y: number; z: number }[] {
    const positions: { x: number; y: number; z: number }[] = [];

    // Use Poisson disk sampling for nice distribution
    const minDistance = 3 + this.config.difficulty * 0.3;
    const maxAttempts = 30;
    const bounds = {
      x: [-20, 40],
      y: [-15, 15],
      z: [-10, 10]
    };

    // Add some positions along a general path
    const pathLength = count * 0.7;
    let currentPos = { ...origin };

    for (let i = 0; i < pathLength; i++) {
      // Move generally forward with some variation
      const angle = this.random.range(-Math.PI / 4, Math.PI / 4);
      const distance = this.random.range(4, 8);

      currentPos = {
        x: currentPos.x + Math.cos(angle) * distance,
        y: currentPos.y + Math.sin(angle) * distance * 0.5,
        z: currentPos.z + this.random.range(-2, 2)
      };

      // Clamp to bounds
      currentPos.x = Math.max(bounds.x[0], Math.min(bounds.x[1], currentPos.x));
      currentPos.y = Math.max(bounds.y[0], Math.min(bounds.y[1], currentPos.y));
      currentPos.z = Math.max(bounds.z[0], Math.min(bounds.z[1], currentPos.z));

      positions.push({ ...currentPos });
    }

    // Add some branch nodes
    const branchCount = count - positions.length;
    for (let i = 0; i < branchCount; i++) {
      const basePos = this.random.choice(positions);

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const newPos = {
          x: basePos.x + this.random.range(-6, 6),
          y: basePos.y + this.random.range(-4, 4),
          z: basePos.z + this.random.range(-3, 3)
        };

        // Check distance from all existing positions
        const tooClose = positions.some(p =>
          this.distance3D(p, newPos) < minDistance
        );

        if (!tooClose) {
          positions.push(newPos);
          break;
        }
      }
    }

    return positions;
  }

  private distance3D(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    return Math.sqrt(
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2 +
      (a.z - b.z) ** 2
    );
  }

  private findFurthestPosition(positions: { x: number; y: number; z: number }[], from: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    let maxDist = 0;
    let furthest = positions[0] || { x: 10, y: 0, z: 0 };

    for (const pos of positions) {
      const dist = this.distance3D(pos, from);
      if (dist > maxDist) {
        maxDist = dist;
        furthest = pos;
      }
    }

    // Push it a bit further
    const dir = {
      x: furthest.x - from.x,
      y: furthest.y - from.y,
      z: furthest.z - from.z
    };
    const len = Math.sqrt(dir.x ** 2 + dir.y ** 2 + dir.z ** 2);

    return {
      x: furthest.x + (dir.x / len) * 4,
      y: furthest.y + (dir.y / len) * 2,
      z: furthest.z
    };
  }

  private selectDimensionForNode(index: number, total: number): DimensionType {
    if (this.template.dimensions.length === 1) {
      return this.template.dimensions[0];
    }

    // Distribute across dimensions
    const dimensionIndex = Math.floor(
      (index / total) * this.template.dimensions.length * this.random.range(0.8, 1.2)
    ) % this.template.dimensions.length;

    return this.template.dimensions[dimensionIndex];
  }

  private selectNodeType(index: number, total: number): NodeDefinition['type'] {
    // Determine if this should be a special node
    if (this.random.next() > this.template.specialNodeRatio) {
      return 'waypoint';
    }

    // Select special type based on mechanics
    const specialTypes: NodeDefinition['type'][] = [];

    if (this.template.mechanics.includes('witness-mode')) {
      specialTypes.push('witness');
    }
    if (this.template.mechanics.includes('dimension-shifting')) {
      specialTypes.push('switch');
    }
    if (this.template.mechanics.includes('gate-mechanics')) {
      specialTypes.push('gate');
    }
    if (this.template.mechanics.includes('mirror-mechanics')) {
      specialTypes.push('mirror');
    }
    if (this.template.mechanics.includes('void-navigation')) {
      specialTypes.push('void');
    }

    if (specialTypes.length === 0) {
      return 'waypoint';
    }

    return this.random.choice(specialTypes);
  }

  private getActivationTime(type: NodeDefinition['type']): number {
    const baseTimes: Record<string, number> = {
      waypoint: 0,
      witness: 0,
      switch: 500,
      gate: 0,
      mirror: 0,
      void: 0
    };

    const base = baseTimes[type] || 0;

    // Add charging time based on difficulty
    if (type === 'waypoint' && this.random.next() < 0.2 * this.config.difficulty / 10) {
      return 1000 + this.config.difficulty * 200;
    }

    return base;
  }

  private getNodeProperties(type: NodeDefinition['type'], dimension: DimensionType): NodeDefinition['properties'] {
    const colors: Record<DimensionType, string> = {
      LATTICE: '#4488ff',
      MARROW: '#ff8844',
      VOID: '#8844ff'
    };

    const props: NodeDefinition['properties'] = {
      color: colors[dimension]
    };

    if (type === 'gate') {
      props.locked = true;
    }

    if (type === 'witness') {
      props.color = '#ffff00';
    }

    if (type === 'switch') {
      props.color = '#00ff88';
    }

    return props;
  }

  private shouldBeHidden(type: NodeDefinition['type']): boolean {
    if (type === 'witness') return true;
    return this.random.next() < 0.1 * this.config.difficulty / 10;
  }

  private getHidingDimension(currentDimension: DimensionType): DimensionType {
    const others = this.template.dimensions.filter(d => d !== currentDimension);
    return others.length > 0 ? this.random.choice(others) : currentDimension;
  }

  private getRequiredPlayers(type: NodeDefinition['type']): number | undefined {
    if (this.config.playerCount === 1) return undefined;

    // Some nodes require multiple players
    if (type === 'gate' && this.random.next() < 0.3) {
      return Math.min(this.config.playerCount, 2);
    }

    return undefined;
  }

  // ===========================================================================
  // EDGE GENERATION
  // ===========================================================================

  private generateEdges(nodes: NodeDefinition[]): EdgeDefinition[] {
    const edges: EdgeDefinition[] = [];
    const [minBranching, maxBranching] = this.template.branchingFactor;

    // Build MST first to ensure connectivity
    const mstEdges = this.generateMST(nodes);
    edges.push(...mstEdges);

    // Add additional edges for branching
    const additionalEdges = this.generateAdditionalEdges(nodes, mstEdges);
    edges.push(...additionalEdges);

    return edges;
  }

  private generateMST(nodes: NodeDefinition[]): EdgeDefinition[] {
    const edges: EdgeDefinition[] = [];
    const visited = new Set<string>();
    const available = new Set(nodes.map(n => n.id));

    // Start from origin
    visited.add('origin');
    available.delete('origin');

    while (available.size > 0) {
      let bestEdge: { from: string; to: string; distance: number } | null = null;

      // Find shortest edge from visited to unvisited
      for (const fromId of visited) {
        const fromNode = nodes.find(n => n.id === fromId)!;

        for (const toId of available) {
          const toNode = nodes.find(n => n.id === toId)!;
          const distance = this.distance3D(fromNode.position, toNode.position);

          if (!bestEdge || distance < bestEdge.distance) {
            bestEdge = { from: fromId, to: toId, distance };
          }
        }
      }

      if (bestEdge) {
        const fromNode = nodes.find(n => n.id === bestEdge!.from)!;
        const toNode = nodes.find(n => n.id === bestEdge!.to)!;

        edges.push({
          from: bestEdge.from,
          to: bestEdge.to,
          type: this.selectEdgeType(fromNode, toNode),
          dimension: fromNode.dimension
        });

        visited.add(bestEdge.to);
        available.delete(bestEdge.to);
      }
    }

    return edges;
  }

  private generateAdditionalEdges(nodes: NodeDefinition[], existingEdges: EdgeDefinition[]): EdgeDefinition[] {
    const edges: EdgeDefinition[] = [];
    const existingPairs = new Set(existingEdges.map(e => `${e.from}-${e.to}`));

    const [minBranching, maxBranching] = this.template.branchingFactor;
    const targetAdditional = Math.floor(nodes.length * (maxBranching - 1) * 0.3);

    for (let i = 0; i < targetAdditional; i++) {
      // Pick random node
      const fromNode = this.random.choice(nodes);

      // Find nearby nodes
      const nearby = nodes
        .filter(n => n.id !== fromNode.id)
        .filter(n => this.distance3D(n.position, fromNode.position) < 10)
        .filter(n => !existingPairs.has(`${fromNode.id}-${n.id}`) &&
                     !existingPairs.has(`${n.id}-${fromNode.id}`));

      if (nearby.length > 0) {
        const toNode = this.random.choice(nearby);

        edges.push({
          from: fromNode.id,
          to: toNode.id,
          type: this.selectEdgeType(fromNode, toNode),
          dimension: fromNode.dimension
        });

        existingPairs.add(`${fromNode.id}-${toNode.id}`);
      }
    }

    return edges;
  }

  private selectEdgeType(from: NodeDefinition, to: NodeDefinition): EdgeDefinition['type'] {
    // Cross-dimension edges
    if (from.dimension !== to.dimension) {
      return 'one-way';
    }

    // Hidden edges to witness nodes
    if (to.type === 'witness' || to.hiddenIn) {
      return this.random.next() < 0.5 ? 'witness-only' : 'hidden';
    }

    // Random dashed for variety
    if (this.random.next() < 0.15) {
      return 'dashed';
    }

    return 'solid';
  }

  // ===========================================================================
  // TRIGGER GENERATION
  // ===========================================================================

  private generateTriggers(nodes: NodeDefinition[]): LevelTrigger[] {
    const triggers: LevelTrigger[] = [];

    // Witness nodes reveal hidden things
    const witnessNodes = nodes.filter(n => n.type === 'witness');
    const hiddenNodes = nodes.filter(n => n.hiddenIn && n.hiddenIn.length > 0);
    const gateNodes = nodes.filter(n => n.type === 'gate');

    for (const witness of witnessNodes) {
      // Find a hidden node or gate to unlock
      if (hiddenNodes.length > 0) {
        const target = this.random.choice(hiddenNodes);
        triggers.push({
          type: 'witness',
          nodeId: witness.id,
          action: 'reveal',
          target: target.id
        });
      } else if (gateNodes.length > 0) {
        const target = this.random.choice(gateNodes);
        triggers.push({
          type: 'witness',
          nodeId: witness.id,
          action: 'unlock',
          target: target.id
        });
      }
    }

    // Switch nodes shift dimensions
    const switchNodes = nodes.filter(n => n.type === 'switch');
    for (const switchNode of switchNodes) {
      const currentDim = switchNode.dimension;
      const otherDims = this.template.dimensions.filter(d => d !== currentDim);

      if (otherDims.length > 0) {
        triggers.push({
          type: 'activate',
          nodeId: switchNode.id,
          action: 'dimension-shift',
          data: { from: currentDim, to: this.random.choice(otherDims) }
        });
      }
    }

    return triggers;
  }

  // ===========================================================================
  // SDPM MODIFICATIONS
  // ===========================================================================

  private applySDPMModifications(nodes: NodeDefinition[], edges: EdgeDefinition[]): void {
    const mods = this.config.sdpmModifiers;
    if (!mods) return;

    // Adjust activation times based on reaction time
    for (const node of nodes) {
      if (node.activationTime && node.activationTime > 0) {
        node.activationTime = Math.floor(node.activationTime * mods.reactionTimeScale);
      }
    }

    // Add more hidden nodes for explorers
    if (mods.explorationTendency > 0.6) {
      const additionalHidden = Math.floor(nodes.length * (mods.explorationTendency - 0.5) * 0.3);
      const waypoints = nodes.filter(n => n.type === 'waypoint' && !n.hiddenIn);

      for (let i = 0; i < Math.min(additionalHidden, waypoints.length); i++) {
        const node = waypoints[i];
        node.hiddenIn = [this.getHidingDimension(node.dimension)];
      }
    }

    // Adjust edge visibility for witness-heavy players
    if (mods.witnessAffinity > 0.7) {
      const visibleEdges = edges.filter(e => e.type === 'solid');
      const toHide = Math.floor(visibleEdges.length * (mods.witnessAffinity - 0.5) * 0.2);

      for (let i = 0; i < toHide; i++) {
        visibleEdges[i].type = 'witness-only';
      }
    }
  }

  // ===========================================================================
  // METADATA
  // ===========================================================================

  private selectThemeForDifficulty(difficulty: DifficultyTier): LevelTemplate {
    const themeWeights: Record<LevelTheme, number[]> = {
      crystalline: [3, 2, 1, 1, 0, 0, 0, 0, 0, 0],
      organic: [2, 3, 2, 1, 1, 0, 0, 0, 0, 0],
      void: [0, 1, 2, 2, 2, 2, 1, 1, 1, 1],
      hybrid: [0, 1, 2, 3, 3, 2, 2, 2, 2, 2],
      transcendent: [0, 0, 0, 1, 2, 3, 3, 3, 3, 3],
      mirror: [0, 0, 1, 2, 2, 3, 2, 2, 2, 2],
      relay: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2],
      speedrun: [1, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      puzzle: [0, 1, 2, 2, 3, 3, 3, 3, 3, 3],
      survival: [0, 0, 0, 1, 2, 2, 3, 3, 3, 3]
    };

    const themes = Object.keys(themeWeights) as LevelTheme[];
    const weights = themes.map(t => themeWeights[t][difficulty - 1] || 1);

    const theme = this.random.weightedChoice(themes, weights);
    return TEMPLATES[theme];
  }

  private calculateDifficultyRating(nodes: NodeDefinition[], edges: EdgeDefinition[]): number {
    let rating = this.config.difficulty;

    // Adjust based on actual complexity
    const specialRatio = nodes.filter(n => n.type !== 'waypoint').length / nodes.length;
    rating += specialRatio * 2;

    // Hidden nodes add difficulty
    const hiddenCount = nodes.filter(n => n.hiddenIn && n.hiddenIn.length > 0).length;
    rating += hiddenCount * 0.3;

    // Multiple dimensions add difficulty
    rating += (this.template.dimensions.length - 1) * 0.5;

    return Math.min(10, Math.max(1, Math.round(rating)));
  }

  private estimateParTime(nodes: NodeDefinition[], edges: EdgeDefinition[]): number {
    // Base time per node
    const baseTimePerNode = 5000;  // 5 seconds

    // Add for special mechanics
    let total = nodes.length * baseTimePerNode;

    // Add activation times
    for (const node of nodes) {
      if (node.activationTime) {
        total += node.activationTime;
      }
    }

    // Add for dimension shifts
    const shifts = nodes.filter(n => n.type === 'switch').length;
    total += shifts * 3000;

    // Scale by difficulty
    total *= 1 + (this.config.difficulty - 5) * 0.1;

    return Math.floor(total);
  }

  private estimatePerfectTime(nodes: NodeDefinition[], edges: EdgeDefinition[]): number {
    return Math.floor(this.estimateParTime(nodes, edges) * 0.5);
  }

  private calculateFingerprint(nodes: NodeDefinition[], edges: EdgeDefinition[]): string {
    const data = JSON.stringify({
      seed: this.config.seed,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      dimensions: this.template.dimensions
    });

    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private generateShortCode(fingerprint: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      const index = parseInt(fingerprint.slice(i, i + 2), 16) % chars.length;
      code += chars[index];
    }

    return code;
  }

  private generateLevelName(): string {
    const prefixes = ['The', 'Beyond', 'Through', 'Within', 'Beneath', 'Above'];
    const adjectives = ['Crystalline', 'Endless', 'Shifting', 'Hidden', 'Broken', 'Infinite', 'Silent', 'Folded'];
    const nouns = ['Path', 'Lattice', 'Void', 'Mirror', 'Gate', 'Threshold', 'Boundary', 'Depths'];

    const usePrefix = this.random.next() < 0.5;
    const prefix = usePrefix ? this.random.choice(prefixes) + ' ' : '';
    const adj = this.random.choice(adjectives);
    const noun = this.random.choice(nouns);

    return `${prefix}${adj} ${noun}`;
  }

  private generateSubtitle(): string {
    const subtitles = [
      'Reality bends around you.',
      'The path is not what it seems.',
      'Watch where you cannot go.',
      'Between dimensions, truth waits.',
      'Attention is the key.',
      'What you seek also seeks you.',
      'The void remembers.',
      'Mirrors within mirrors.',
      'Time flows differently here.',
      'Your reflection watches back.'
    ];

    return this.random.choice(subtitles);
  }

  private generateHiddenObjectives(nodes: NodeDefinition[]): string[] {
    const objectives: string[] = [];

    objectives.push('Complete under par time');

    if (nodes.some(n => n.hiddenIn && n.hiddenIn.length > 0)) {
      objectives.push('Find all hidden nodes');
    }

    if (this.template.dimensions.length > 1) {
      objectives.push('Visit all dimensions');
    }

    objectives.push('Complete without backtracking');

    return objectives;
  }

  private getAmbience(): 'crystalline' | 'organic' | 'void' | 'mixed' {
    if (this.template.dimensions.length === 1) {
      return this.template.dimensions[0].toLowerCase() as 'crystalline' | 'organic' | 'void';
    }
    return 'mixed';
  }

  private getSpecialEffects(): string[] {
    const effects: string[] = [];

    if (this.template.dimensions.includes('LATTICE')) {
      effects.push('crystalline-particles');
    }
    if (this.template.dimensions.includes('MARROW')) {
      effects.push('organic-pulse');
    }
    if (this.template.dimensions.includes('VOID')) {
      effects.push('void-static');
    }

    return effects;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a level from a seed
 */
export function generateLevel(seed: number, difficulty: DifficultyTier = 5): GeneratedLevel {
  const sdpm = saveSystem.getSDPM();

  const config: GeneratorConfig = {
    seed,
    difficulty,
    playerCount: 1,
    sdpmModifiers: sdpm.difficultyModifiers as SDPMModifiers
  };

  const generator = new ProceduralLevelGenerator(config);
  return generator.generate();
}

/**
 * Generate a random level
 */
export function generateRandomLevel(difficulty?: DifficultyTier): GeneratedLevel {
  const seed = Math.floor(Math.random() * 0xFFFFFFFF);
  return generateLevel(seed, difficulty || 5);
}

/**
 * Generate a daily challenge level
 */
export function generateDailyLevel(): GeneratedLevel {
  // Seed based on date
  const now = new Date();
  const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

  // Daily difficulty cycles through the week
  const dayOfWeek = now.getDay();
  const difficulty = (Math.floor(dayOfWeek * 1.5) + 3) as DifficultyTier;

  return generateLevel(dateSeed, Math.min(10, difficulty) as DifficultyTier);
}

/**
 * Parse a short code back to a seed
 */
export function shortCodeToSeed(code: string): number | null {
  // This is a simplified version - in production you'd look up the seed from a database
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = 0;

  for (const char of code.toUpperCase()) {
    const index = chars.indexOf(char);
    if (index === -1) return null;
    value = value * chars.length + index;
  }

  return value;
}
