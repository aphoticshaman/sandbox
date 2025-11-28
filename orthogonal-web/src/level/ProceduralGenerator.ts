/**
 * Procedural Level Generator
 * Creates unique levels based on SDPM player profile
 *
 * Philosophy: Every player's experience is genuinely different.
 * - Levels are tailored to challenge YOUR specific patterns
 * - Seeds ensure reproducibility for leaderboards and sharing
 * - Difficulty emerges from the match between you and the puzzle
 * - No two players at the same "difficulty" see the same thing
 */

import * as THREE from 'three';
import { SDPMProfile, DifficultyModifiers, SDPMProfileManager } from '../player/SDPMProfile';
import { LevelParameters, LevelFingerprint, generateLevelFingerprint } from './LevelRegistry';

// ========================================
// Seeded Random Number Generator
// ========================================

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Mulberry32 PRNG
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Range helpers
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  gaussian(mean: number = 0, stddev: number = 1): number {
    const u = 1 - this.next();
    const v = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stddev + mean;
  }

  // Get reproducible sub-seed
  subSeed(salt: string): number {
    let hash = this.seed;
    for (let i = 0; i < salt.length; i++) {
      hash = ((hash << 5) - hash) + salt.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// ========================================
// Level Structure Types
// ========================================

export interface GeneratedLevel {
  fingerprint: LevelFingerprint;
  parameters: LevelParameters;

  // Structure
  graph: LevelGraph;

  // Dimensions
  layers: DimensionLayer[];

  // Objectives
  objectives: LevelObjective[];

  // Spawn/Exit
  spawnPoint: THREE.Vector3;
  exitPoint: THREE.Vector3;

  // Multiplayer zones (for cooperative)
  multiplayerZones?: MultiplayerZone[];
}

export interface LevelGraph {
  nodes: LevelNode[];
  edges: LevelEdge[];
  portals: LevelPortal[];
}

export interface LevelNode {
  id: string;
  position: THREE.Vector3;
  type: 'anchor' | 'transit' | 'puzzle' | 'witness' | 'hidden' | 'nexus';
  radius: number;
  layer: string;  // Which dimension layer
  connections: string[];
  data: any;  // Type-specific data
}

export interface LevelEdge {
  id: string;
  from: string;
  to: string;
  type: 'path' | 'bridge' | 'conditional' | 'one-way' | 'witness-only';
  length: number;
  data: any;
}

export interface LevelPortal {
  id: string;
  position: THREE.Vector3;
  destination: string;  // Node ID or dimension ID
  type: 'inter-dimension' | 'intra-dimension' | 'exit';
  revealedBy: 'attention' | 'witness' | 'puzzle' | 'always';
}

export interface DimensionLayer {
  id: string;
  name: string;
  type: 'LATTICE' | 'MARROW' | 'VOID';
  nodes: string[];
  visualStyle: LayerStyle;
}

export interface LayerStyle {
  primaryColor: THREE.Color;
  secondaryColor: THREE.Color;
  fogDensity: number;
  particleDensity: number;
  geometryStyle: 'crystalline' | 'organic' | 'void' | 'fractal';
}

export interface LevelObjective {
  id: string;
  type: 'reach' | 'activate' | 'collect' | 'witness' | 'synchronize';
  targets: string[];
  required: boolean;
  description: string;
  completed: boolean;
}

export interface MultiplayerZone {
  id: string;
  center: THREE.Vector3;
  radius: number;
  requiredPlayers: number;
  mechanic: string;
}

// ========================================
// Generator Configuration
// ========================================

export interface GeneratorConfig {
  baseNodeCount: number;
  baseDimensionCount: number;
  difficultyScale: number;  // 0-1 overall difficulty
  playerCount: number;
  levelProgression: number;  // Which level in sequence
}

const DEFAULT_CONFIG: GeneratorConfig = {
  baseNodeCount: 15,
  baseDimensionCount: 1,
  difficultyScale: 0.5,
  playerCount: 1,
  levelProgression: 0,
};

// ========================================
// Procedural Level Generator
// ========================================

export class ProceduralLevelGenerator {
  private profileManager: SDPMProfileManager;

  constructor(profileManager: SDPMProfileManager) {
    this.profileManager = profileManager;
  }

  /**
   * Generate a level tailored to the player's SDPM profile
   */
  generate(baseSeed: number, config: Partial<GeneratorConfig> = {}): GeneratedLevel {
    const cfg: GeneratorConfig = { ...DEFAULT_CONFIG, ...config };
    const profile = this.profileManager.getProfile();
    const modifiers = this.profileManager.getDifficultyModifiers();

    // Initialize random generators with sub-seeds
    const rng = new SeededRandom(baseSeed);
    const geomRng = new SeededRandom(rng.subSeed('geometry'));
    const patternRng = new SeededRandom(rng.subSeed('pattern'));
    const colorRng = new SeededRandom(rng.subSeed('color'));

    // Calculate adapted parameters
    const params = this.calculateParameters(cfg, modifiers, rng);

    // Generate structure
    const graph = this.generateGraph(params, modifiers, geomRng);

    // Generate dimension layers
    const layers = this.generateLayers(params, graph, colorRng);

    // Generate objectives
    const objectives = this.generateObjectives(params, graph, modifiers, patternRng);

    // Place spawn and exit
    const { spawnPoint, exitPoint } = this.placeSpawnAndExit(graph, geomRng);

    // Generate multiplayer zones if needed
    const multiplayerZones = cfg.playerCount > 1
      ? this.generateMultiplayerZones(graph, cfg.playerCount, geomRng)
      : undefined;

    // Create fingerprint
    const fingerprint = generateLevelFingerprint(params);

    return {
      fingerprint,
      parameters: params,
      graph,
      layers,
      objectives,
      spawnPoint,
      exitPoint,
      multiplayerZones,
    };
  }

  /**
   * Calculate level parameters based on SDPM profile
   */
  private calculateParameters(
    cfg: GeneratorConfig,
    modifiers: DifficultyModifiers,
    rng: SeededRandom
  ): LevelParameters {

    // Base complexity scales with progression
    const progressionScale = 1 + cfg.levelProgression * 0.2;

    // Node count affected by complexity tolerance
    const nodeCount = Math.round(
      cfg.baseNodeCount * progressionScale * (0.8 + modifiers.complexityTolerance * 0.4)
    );

    // Edge density based on exploration bias
    const edgeMultiplier = 1.2 + modifiers.explorationBias * 0.6;
    const edgeCount = Math.round(nodeCount * edgeMultiplier);

    // Portals increase with witness affinity
    const portalCount = Math.round(2 + modifiers.witnessAffinity * 4);

    // Dimensions based on progression
    const dimensionLayers = Math.min(3, cfg.baseDimensionCount + Math.floor(cfg.levelProgression / 3));

    // Complexity score
    const complexityScore =
      (nodeCount / 30) * 0.3 +
      (edgeCount / nodeCount / 2) * 0.3 +
      (dimensionLayers / 3) * 0.4;

    return {
      nodeCount,
      edgeCount,
      portalCount,
      dimensionLayers,
      complexityScore: Math.min(1, complexityScore),
      perceptionDemand: modifiers.perceptionDemand,
      timePressure: modifiers.timePressure,
      coordinationDemand: cfg.playerCount > 1 ? 0.5 + cfg.playerCount * 0.1 : 0,
      sdpmSeed: this.profileManager.getProfile()?.id || 'default',
      adaptationLevel: this.profileManager.getProfile()?.confidence || 0,
      geometrySeed: rng.subSeed('geometry'),
      patternSeed: rng.subSeed('pattern'),
      colorSeed: rng.subSeed('color'),
    };
  }

  /**
   * Generate the level graph structure
   */
  private generateGraph(
    params: LevelParameters,
    modifiers: DifficultyModifiers,
    rng: SeededRandom
  ): LevelGraph {

    const nodes: LevelNode[] = [];
    const edges: LevelEdge[] = [];
    const portals: LevelPortal[] = [];

    // Generate node positions using poisson disk sampling for nice distribution
    const positions = this.poissonDiskSample(params.nodeCount, 5, 50, rng);

    // Assign node types based on modifiers
    const nodeTypes = this.distributeNodeTypes(params.nodeCount, modifiers, rng);

    // Create nodes
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const type = nodeTypes[i];

      nodes.push({
        id: `node-${i}`,
        position: new THREE.Vector3(pos.x, pos.y, rng.range(-2, 2)),
        type,
        radius: this.getNodeRadius(type, rng),
        layer: 'LATTICE',  // Default, will be assigned later
        connections: [],
        data: this.generateNodeData(type, modifiers, rng),
      });
    }

    // Generate edges using Delaunay-like triangulation with randomization
    const baseEdges = this.generateEdges(nodes, rng);

    // Prune to target edge count
    const prunedEdges = this.pruneEdges(baseEdges, params.edgeCount, nodes, rng);

    // Assign edge types
    for (const edge of prunedEdges) {
      const type = this.assignEdgeType(edge, nodes, modifiers, rng);
      edges.push({
        ...edge,
        type,
        data: {},
      });

      // Update node connections
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (fromNode && !fromNode.connections.includes(edge.to)) {
        fromNode.connections.push(edge.to);
      }
      if (toNode && !toNode.connections.includes(edge.from)) {
        toNode.connections.push(edge.from);
      }
    }

    // Generate portals
    for (let i = 0; i < params.portalCount; i++) {
      const node = rng.pick(nodes.filter(n => n.type !== 'hidden'));
      portals.push({
        id: `portal-${i}`,
        position: node.position.clone().add(new THREE.Vector3(0, 0, 1)),
        destination: `dimension-${i % params.dimensionLayers}`,
        type: 'inter-dimension',
        revealedBy: rng.pick(['attention', 'witness', 'puzzle']),
      });
    }

    return { nodes, edges, portals };
  }

  private poissonDiskSample(
    count: number,
    minDist: number,
    maxDist: number,
    rng: SeededRandom
  ): { x: number; y: number }[] {

    const points: { x: number; y: number }[] = [];
    const cellSize = minDist / Math.sqrt(2);
    const gridSize = Math.ceil(maxDist / cellSize);
    const grid: (number | null)[][] = Array(gridSize).fill(null)
      .map(() => Array(gridSize).fill(null));

    // Start with center point
    const first = { x: maxDist / 2, y: maxDist / 2 };
    points.push(first);
    grid[Math.floor(first.x / cellSize)][Math.floor(first.y / cellSize)] = 0;

    const active = [0];

    while (active.length > 0 && points.length < count) {
      const idx = rng.int(0, active.length - 1);
      const point = points[active[idx]];

      let found = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        const angle = rng.next() * Math.PI * 2;
        const dist = rng.range(minDist, minDist * 2);
        const newX = point.x + Math.cos(angle) * dist;
        const newY = point.y + Math.sin(angle) * dist;

        if (newX < 0 || newX >= maxDist || newY < 0 || newY >= maxDist) continue;

        const gridX = Math.floor(newX / cellSize);
        const gridY = Math.floor(newY / cellSize);

        let valid = true;
        for (let dx = -2; dx <= 2 && valid; dx++) {
          for (let dy = -2; dy <= 2 && valid; dy++) {
            const checkX = gridX + dx;
            const checkY = gridY + dy;
            if (checkX >= 0 && checkX < gridSize && checkY >= 0 && checkY < gridSize) {
              const neighbor = grid[checkX][checkY];
              if (neighbor !== null) {
                const np = points[neighbor];
                const dist = Math.sqrt((newX - np.x) ** 2 + (newY - np.y) ** 2);
                if (dist < minDist) valid = false;
              }
            }
          }
        }

        if (valid) {
          points.push({ x: newX, y: newY });
          grid[gridX][gridY] = points.length - 1;
          active.push(points.length - 1);
          found = true;
          break;
        }
      }

      if (!found) {
        active.splice(idx, 1);
      }
    }

    return points;
  }

  private distributeNodeTypes(
    count: number,
    modifiers: DifficultyModifiers,
    rng: SeededRandom
  ): LevelNode['type'][] {

    const types: LevelNode['type'][] = [];

    // Distribution based on modifiers
    const hiddenRatio = 0.1 + modifiers.explorationBias * 0.15;
    const witnessRatio = 0.1 + modifiers.witnessAffinity * 0.15;
    const puzzleRatio = 0.2 + modifiers.complexityTolerance * 0.1;

    for (let i = 0; i < count; i++) {
      const r = rng.next();

      if (i === 0) {
        types.push('anchor');  // Start point
      } else if (i === count - 1) {
        types.push('nexus');  // End point
      } else if (r < hiddenRatio) {
        types.push('hidden');
      } else if (r < hiddenRatio + witnessRatio) {
        types.push('witness');
      } else if (r < hiddenRatio + witnessRatio + puzzleRatio) {
        types.push('puzzle');
      } else {
        types.push('transit');
      }
    }

    return rng.shuffle(types);
  }

  private getNodeRadius(type: LevelNode['type'], rng: SeededRandom): number {
    const baseRadius: Record<LevelNode['type'], number> = {
      anchor: 2,
      transit: 1,
      puzzle: 1.5,
      witness: 1.2,
      hidden: 0.8,
      nexus: 2.5,
    };
    return baseRadius[type] * rng.range(0.9, 1.1);
  }

  private generateNodeData(
    type: LevelNode['type'],
    modifiers: DifficultyModifiers,
    rng: SeededRandom
  ): any {
    switch (type) {
      case 'puzzle':
        return {
          puzzleType: rng.pick(['pattern', 'sequence', 'spatial', 'rhythm']),
          difficulty: modifiers.complexityTolerance,
        };
      case 'witness':
        return {
          revealRadius: 5 + modifiers.witnessAffinity * 5,
          duration: 1 + modifiers.perceptionDemand * 2,
        };
      case 'hidden':
        return {
          revealCondition: rng.pick(['witness', 'proximity', 'puzzle-complete']),
        };
      default:
        return {};
    }
  }

  private generateEdges(
    nodes: LevelNode[],
    rng: SeededRandom
  ): Omit<LevelEdge, 'type' | 'data'>[] {

    const edges: Omit<LevelEdge, 'type' | 'data'>[] = [];

    // Simple approach: connect each node to nearest neighbors
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Sort other nodes by distance
      const sorted = nodes
        .map((other, j) => ({ node: other, index: j, dist: node.position.distanceTo(other.position) }))
        .filter(item => item.index !== i)
        .sort((a, b) => a.dist - b.dist);

      // Connect to 2-4 nearest
      const connectionCount = rng.int(2, 4);
      for (let j = 0; j < Math.min(connectionCount, sorted.length); j++) {
        const edgeId = [i, sorted[j].index].sort().join('-');
        if (!edges.some(e => e.id === `edge-${edgeId}`)) {
          edges.push({
            id: `edge-${edgeId}`,
            from: node.id,
            to: sorted[j].node.id,
            length: sorted[j].dist,
          });
        }
      }
    }

    return edges;
  }

  private pruneEdges(
    edges: Omit<LevelEdge, 'type' | 'data'>[],
    targetCount: number,
    nodes: LevelNode[],
    rng: SeededRandom
  ): Omit<LevelEdge, 'type' | 'data'>[] {

    // Ensure graph connectivity first
    const connected = new Set<string>();
    const mstEdges: Omit<LevelEdge, 'type' | 'data'>[] = [];

    connected.add(nodes[0].id);

    while (connected.size < nodes.length) {
      let bestEdge: Omit<LevelEdge, 'type' | 'data'> | null = null;
      let bestDist = Infinity;

      for (const edge of edges) {
        const hasFrom = connected.has(edge.from);
        const hasTo = connected.has(edge.to);

        if ((hasFrom && !hasTo) || (!hasFrom && hasTo)) {
          if (edge.length < bestDist) {
            bestDist = edge.length;
            bestEdge = edge;
          }
        }
      }

      if (bestEdge) {
        mstEdges.push(bestEdge);
        connected.add(bestEdge.from);
        connected.add(bestEdge.to);
      } else {
        break;
      }
    }

    // Add random additional edges up to target
    const remaining = edges.filter(e => !mstEdges.includes(e));
    const shuffled = rng.shuffle(remaining);
    const additional = shuffled.slice(0, Math.max(0, targetCount - mstEdges.length));

    return [...mstEdges, ...additional];
  }

  private assignEdgeType(
    edge: Omit<LevelEdge, 'type' | 'data'>,
    nodes: LevelNode[],
    modifiers: DifficultyModifiers,
    rng: SeededRandom
  ): LevelEdge['type'] {

    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);

    if (!fromNode || !toNode) return 'path';

    // Hidden nodes require special edges
    if (fromNode.type === 'hidden' || toNode.type === 'hidden') {
      return rng.next() < modifiers.witnessAffinity ? 'witness-only' : 'conditional';
    }

    // Witness nodes more likely to have witness-only paths
    if (fromNode.type === 'witness' || toNode.type === 'witness') {
      if (rng.next() < modifiers.witnessAffinity * 0.5) {
        return 'witness-only';
      }
    }

    // Random edge types
    const r = rng.next();
    if (r < 0.1) return 'bridge';
    if (r < 0.15) return 'one-way';
    if (r < 0.2) return 'conditional';

    return 'path';
  }

  /**
   * Generate dimension layers
   */
  private generateLayers(
    params: LevelParameters,
    graph: LevelGraph,
    rng: SeededRandom
  ): DimensionLayer[] {

    const layers: DimensionLayer[] = [];
    const dimensionTypes: DimensionLayer['type'][] = ['LATTICE', 'MARROW', 'VOID'];

    // Distribute nodes across dimensions
    const nodesPerLayer = Math.ceil(graph.nodes.length / params.dimensionLayers);

    for (let i = 0; i < params.dimensionLayers; i++) {
      const type = dimensionTypes[i % dimensionTypes.length];
      const layerNodes = graph.nodes
        .slice(i * nodesPerLayer, (i + 1) * nodesPerLayer)
        .map(n => n.id);

      // Update node layer assignments
      for (const nodeId of layerNodes) {
        const node = graph.nodes.find(n => n.id === nodeId);
        if (node) node.layer = `dimension-${i}`;
      }

      layers.push({
        id: `dimension-${i}`,
        name: `${type} ${i + 1}`,
        type,
        nodes: layerNodes,
        visualStyle: this.generateLayerStyle(type, rng),
      });
    }

    return layers;
  }

  private generateLayerStyle(type: DimensionLayer['type'], rng: SeededRandom): LayerStyle {
    const styles: Record<DimensionLayer['type'], Partial<LayerStyle>> = {
      LATTICE: {
        primaryColor: new THREE.Color(0x667eea),
        secondaryColor: new THREE.Color(0x764ba2),
        fogDensity: 0.02,
        geometryStyle: 'crystalline',
      },
      MARROW: {
        primaryColor: new THREE.Color(0xff6b6b),
        secondaryColor: new THREE.Color(0xfeca57),
        fogDensity: 0.05,
        geometryStyle: 'organic',
      },
      VOID: {
        primaryColor: new THREE.Color(0x2d3436),
        secondaryColor: new THREE.Color(0x636e72),
        fogDensity: 0.1,
        geometryStyle: 'void',
      },
    };

    const base = styles[type];
    return {
      primaryColor: base.primaryColor!,
      secondaryColor: base.secondaryColor!,
      fogDensity: base.fogDensity! * rng.range(0.8, 1.2),
      particleDensity: rng.range(0.5, 1.5),
      geometryStyle: base.geometryStyle!,
    };
  }

  /**
   * Generate objectives
   */
  private generateObjectives(
    params: LevelParameters,
    graph: LevelGraph,
    modifiers: DifficultyModifiers,
    rng: SeededRandom
  ): LevelObjective[] {

    const objectives: LevelObjective[] = [];

    // Primary objective: reach the nexus
    const nexusNode = graph.nodes.find(n => n.type === 'nexus');
    if (nexusNode) {
      objectives.push({
        id: 'reach-nexus',
        type: 'reach',
        targets: [nexusNode.id],
        required: true,
        description: 'Reach the nexus',
        completed: false,
      });
    }

    // Secondary objectives based on node types
    const puzzleNodes = graph.nodes.filter(n => n.type === 'puzzle');
    if (puzzleNodes.length > 0) {
      const requiredPuzzles = Math.ceil(puzzleNodes.length * 0.5);
      objectives.push({
        id: 'solve-puzzles',
        type: 'activate',
        targets: puzzleNodes.slice(0, requiredPuzzles).map(n => n.id),
        required: false,
        description: `Solve ${requiredPuzzles} puzzles`,
        completed: false,
      });
    }

    const witnessNodes = graph.nodes.filter(n => n.type === 'witness');
    if (witnessNodes.length > 0 && modifiers.witnessAffinity > 0.5) {
      objectives.push({
        id: 'witness-all',
        type: 'witness',
        targets: witnessNodes.map(n => n.id),
        required: false,
        description: 'Witness all observation points',
        completed: false,
      });
    }

    return objectives;
  }

  /**
   * Place spawn and exit points
   */
  private placeSpawnAndExit(
    graph: LevelGraph,
    rng: SeededRandom
  ): { spawnPoint: THREE.Vector3; exitPoint: THREE.Vector3 } {

    const anchor = graph.nodes.find(n => n.type === 'anchor');
    const nexus = graph.nodes.find(n => n.type === 'nexus');

    return {
      spawnPoint: anchor?.position.clone() || new THREE.Vector3(0, 0, 0),
      exitPoint: nexus?.position.clone() || new THREE.Vector3(10, 10, 0),
    };
  }

  /**
   * Generate multiplayer zones
   */
  private generateMultiplayerZones(
    graph: LevelGraph,
    playerCount: number,
    rng: SeededRandom
  ): MultiplayerZone[] {

    const zones: MultiplayerZone[] = [];
    const puzzleNodes = graph.nodes.filter(n => n.type === 'puzzle');

    for (let i = 0; i < Math.min(3, puzzleNodes.length); i++) {
      const node = puzzleNodes[i];
      zones.push({
        id: `coop-zone-${i}`,
        center: node.position.clone(),
        radius: 8,
        requiredPlayers: Math.min(playerCount, rng.int(2, 4)),
        mechanic: rng.pick([
          'split-perception',
          'synchronized-focus',
          'relay-witness',
          'perspective-union',
        ]),
      });
    }

    return zones;
  }
}
