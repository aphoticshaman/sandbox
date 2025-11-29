/**
 * LevelLoader.ts
 *
 * Transforms static level definitions into playable level instances
 * Handles both handcrafted static levels and procedural generation
 */

import * as THREE from 'three';
import {
  StaticLevelDefinition,
  NodeDefinition,
  EdgeDefinition,
  LevelTrigger,
  LEVEL_BY_ID,
  LEVEL_BY_CHAPTER
} from './StaticLevels';
import { DimensionType } from '../core/DimensionManager';
import { SeededRandom } from './ProceduralGenerator';

// =============================================================================
// TYPES
// =============================================================================

export interface LevelNode {
  id: string;
  position: THREE.Vector3;
  type: NodeDefinition['type'];
  dimension: DimensionType;
  hiddenIn: DimensionType[];

  // State
  active: boolean;
  locked: boolean;
  visited: boolean;
  chargeProgress: number;  // 0-1 for charging nodes
  activationTime: number;  // ms required to activate

  // Multiplayer
  requiredPlayers: number;
  currentPlayers: Set<string>;  // Player IDs currently at node

  // Visual
  color: THREE.Color;
  scale: number;
  pulseRate: number;
  label?: string;

  // Connections
  edges: Set<string>;  // Edge IDs connected to this node
}

export interface LevelEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeDefinition['type'];
  dimension: DimensionType;

  // State
  active: boolean;
  visible: boolean;
  travelProgress: Map<string, number>;  // Player ID -> progress 0-1

  // Properties
  travelTime: number;
  decayRate: number;
  requiresWitness: boolean;
  activeWindows: number[];

  // Visual
  opacity: number;
  color: THREE.Color;
}

export interface LevelTriggerInstance {
  definition: LevelTrigger;
  fired: boolean;
  conditions: Map<string, boolean>;
}

export interface PlayableLevel {
  id: string;
  seed: number;
  name: string;
  subtitle: string;
  chapter: number;

  // Dimensions
  dimensions: DimensionType[];
  activeDimension: DimensionType;

  // Graph
  nodes: Map<string, LevelNode>;
  edges: Map<string, LevelEdge>;
  nodesByDimension: Map<DimensionType, LevelNode[]>;

  // Players
  originNodes: LevelNode[];
  currentPlayerPositions: Map<string, string>;  // Player ID -> Node ID

  // State
  startTime: number;
  elapsedTime: number;
  completed: boolean;
  failed: boolean;

  // Triggers
  triggers: LevelTriggerInstance[];
  partialUnlocks: Map<string, Set<number>>;  // Gate ID -> partial unlock IDs

  // Objectives
  primaryObjective: string;
  hiddenObjectives: string[];
  completedObjectives: Set<string>;

  // Victory
  victoryCondition: StaticLevelDefinition['victoryCondition'];

  // Audio/Visual
  ambience: string;
  visualTheme: string;
  specialEffects: string[];

  // Stats
  nodesVisited: Set<string>;
  backtrackCount: number;
  witnessTime: number;
  deathCount: number;
}

// =============================================================================
// LEVEL LOADER
// =============================================================================

export class LevelLoader {
  private random: SeededRandom;

  constructor() {
    this.random = new SeededRandom(Date.now());
  }

  /**
   * Load a static level by ID
   */
  loadById(levelId: string): PlayableLevel | null {
    const definition = LEVEL_BY_ID.get(levelId);
    if (!definition) return null;
    return this.loadFromDefinition(definition);
  }

  /**
   * Load a static level by chapter number
   */
  loadByChapter(chapter: number): PlayableLevel | null {
    const definition = LEVEL_BY_CHAPTER.get(chapter);
    if (!definition) return null;
    return this.loadFromDefinition(definition);
  }

  /**
   * Transform a level definition into a playable level
   */
  loadFromDefinition(definition: StaticLevelDefinition): PlayableLevel {
    this.random = new SeededRandom(definition.seed);

    const nodes = new Map<string, LevelNode>();
    const edges = new Map<string, LevelEdge>();
    const nodesByDimension = new Map<DimensionType, LevelNode[]>();
    const originNodes: LevelNode[] = [];

    // Initialize dimension arrays
    for (const dim of definition.dimensions) {
      nodesByDimension.set(dim, []);
    }

    // Create nodes
    for (const nodeDef of definition.nodes) {
      const node = this.createNode(nodeDef);
      nodes.set(node.id, node);

      // Add to dimension list
      const dimNodes = nodesByDimension.get(node.dimension) || [];
      dimNodes.push(node);
      nodesByDimension.set(node.dimension, dimNodes);

      // Track origins
      if (node.type === 'origin') {
        originNodes.push(node);
      }
    }

    // Create edges
    for (const edgeDef of definition.edges) {
      const edge = this.createEdge(edgeDef);
      edges.set(edge.id, edge);

      // Link nodes to edges
      const fromNode = nodes.get(edge.from);
      const toNode = nodes.get(edge.to);
      if (fromNode) fromNode.edges.add(edge.id);
      if (toNode) toNode.edges.add(edge.id);
    }

    // Create trigger instances
    const triggers: LevelTriggerInstance[] = (definition.triggers || []).map(trigger => ({
      definition: trigger,
      fired: false,
      conditions: new Map()
    }));

    return {
      id: definition.id,
      seed: definition.seed,
      name: definition.name,
      subtitle: definition.subtitle,
      chapter: definition.chapter,

      dimensions: definition.dimensions,
      activeDimension: definition.startDimension,

      nodes,
      edges,
      nodesByDimension,

      originNodes,
      currentPlayerPositions: new Map(),

      startTime: 0,
      elapsedTime: 0,
      completed: false,
      failed: false,

      triggers,
      partialUnlocks: new Map(),

      primaryObjective: definition.objectives.primary,
      hiddenObjectives: definition.objectives.hidden || [],
      completedObjectives: new Set(),

      victoryCondition: definition.victoryCondition,

      ambience: definition.ambience,
      visualTheme: definition.visualTheme,
      specialEffects: definition.specialEffects || [],

      nodesVisited: new Set(),
      backtrackCount: 0,
      witnessTime: 0,
      deathCount: 0
    };
  }

  /**
   * Create a LevelNode from definition
   */
  private createNode(def: NodeDefinition): LevelNode {
    const color = this.parseColor(def.properties?.color);

    return {
      id: def.id,
      position: new THREE.Vector3(def.position.x, def.position.y, def.position.z),
      type: def.type,
      dimension: def.dimension,
      hiddenIn: def.hiddenIn || [],

      active: def.type === 'origin',
      locked: def.properties?.locked || false,
      visited: false,
      chargeProgress: 0,
      activationTime: def.activationTime || 0,

      requiredPlayers: def.requiredPlayers || 1,
      currentPlayers: new Set(),

      color,
      scale: 1,
      pulseRate: def.properties?.pulseRate || 0,
      label: def.properties?.label,

      edges: new Set()
    };
  }

  /**
   * Create a LevelEdge from definition
   */
  private createEdge(def: EdgeDefinition): LevelEdge {
    const id = `${def.from}->${def.to}`;

    // Determine visibility based on type
    const visible = def.type !== 'hidden' && def.type !== 'witness-only';

    // Determine base color based on type
    let color: THREE.Color;
    switch (def.type) {
      case 'solid':
        color = new THREE.Color(0xffffff);
        break;
      case 'dashed':
        color = new THREE.Color(0xaaaaaa);
        break;
      case 'hidden':
        color = new THREE.Color(0x444444);
        break;
      case 'one-way':
        color = new THREE.Color(0x88ff88);
        break;
      case 'timed':
        color = new THREE.Color(0xffaa00);
        break;
      case 'witness-only':
        color = new THREE.Color(0xff00ff);
        break;
      default:
        color = new THREE.Color(0xffffff);
    }

    return {
      id,
      from: def.from,
      to: def.to,
      type: def.type,
      dimension: def.dimension,

      active: def.type === 'solid' || def.type === 'dashed',
      visible,
      travelProgress: new Map(),

      travelTime: def.properties?.travelTime || 1000,
      decayRate: def.properties?.decayRate || 0,
      requiresWitness: def.properties?.requiresWitness || def.type === 'witness-only',
      activeWindows: def.properties?.activeDuring || [],

      opacity: visible ? 1 : 0,
      color
    };
  }

  /**
   * Parse color from string
   */
  private parseColor(colorStr?: string): THREE.Color {
    if (!colorStr) return new THREE.Color(0xffffff);

    // Handle named colors
    const namedColors: Record<string, number> = {
      'silver': 0xc0c0c0,
      'gold': 0xffd700
    };

    if (namedColors[colorStr]) {
      return new THREE.Color(namedColors[colorStr]);
    }

    // Handle hex colors
    if (colorStr.startsWith('#')) {
      return new THREE.Color(colorStr);
    }

    return new THREE.Color(0xffffff);
  }
}

// =============================================================================
// LEVEL RUNTIME
// =============================================================================

export class LevelRuntime {
  private level: PlayableLevel;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(level: PlayableLevel) {
    this.level = level;
  }

  /**
   * Start the level
   */
  start(): void {
    this.level.startTime = performance.now();
    this.emit('level-start', { level: this.level });
  }

  /**
   * Update the level state
   */
  update(deltaTime: number): void {
    if (this.level.completed || this.level.failed) return;

    this.level.elapsedTime += deltaTime;

    // Update node charge progress
    for (const node of this.level.nodes.values()) {
      if (node.activationTime > 0 && node.currentPlayers.size >= node.requiredPlayers) {
        const chargeRate = deltaTime / node.activationTime;
        node.chargeProgress = Math.min(1, node.chargeProgress + chargeRate);

        if (node.chargeProgress >= 1 && !node.active) {
          this.activateNode(node.id);
        }
      } else if (node.currentPlayers.size < node.requiredPlayers && node.chargeProgress > 0) {
        // Decay charge if players leave
        node.chargeProgress = Math.max(0, node.chargeProgress - deltaTime / 2000);
      }
    }

    // Check victory conditions
    this.checkVictory();
  }

  /**
   * Move a player to a node
   */
  movePlayer(playerId: string, targetNodeId: string): boolean {
    const currentNodeId = this.level.currentPlayerPositions.get(playerId);
    const targetNode = this.level.nodes.get(targetNodeId);

    if (!targetNode) return false;
    if (targetNode.locked) return false;

    // Check if path exists
    if (currentNodeId) {
      const currentNode = this.level.nodes.get(currentNodeId);
      if (!currentNode) return false;

      // Check for valid edge
      const hasPath = this.hasPathBetween(currentNodeId, targetNodeId);
      if (!hasPath) return false;

      // Track backtracking
      if (targetNode.visited) {
        this.level.backtrackCount++;
      }

      // Remove from current node
      currentNode.currentPlayers.delete(playerId);
    }

    // Add to target node
    targetNode.currentPlayers.add(playerId);
    targetNode.visited = true;
    this.level.nodesVisited.add(targetNodeId);
    this.level.currentPlayerPositions.set(playerId, targetNodeId);

    // Check triggers
    this.checkTriggers('enter', targetNodeId);

    this.emit('player-move', { playerId, from: currentNodeId, to: targetNodeId });

    return true;
  }

  /**
   * Player starts witnessing
   */
  startWitness(playerId: string): void {
    const nodeId = this.level.currentPlayerPositions.get(playerId);
    if (!nodeId) return;

    this.emit('witness-start', { playerId, nodeId });

    // Reveal hidden edges and nodes
    for (const edge of this.level.edges.values()) {
      if (edge.requiresWitness && edge.from === nodeId) {
        edge.visible = true;
        edge.opacity = 0.7;
      }
    }

    // Check triggers
    this.checkTriggers('witness', nodeId);
  }

  /**
   * Player stops witnessing
   */
  stopWitness(playerId: string): void {
    const nodeId = this.level.currentPlayerPositions.get(playerId);
    if (!nodeId) return;

    this.emit('witness-stop', { playerId, nodeId });

    // Hide witness-only edges
    for (const edge of this.level.edges.values()) {
      if (edge.type === 'witness-only') {
        edge.visible = false;
        edge.opacity = 0;
      }
    }
  }

  /**
   * Add witness time
   */
  addWitnessTime(deltaTime: number): void {
    this.level.witnessTime += deltaTime;
  }

  /**
   * Activate a node
   */
  activateNode(nodeId: string): void {
    const node = this.level.nodes.get(nodeId);
    if (!node) return;

    node.active = true;
    this.emit('node-activate', { nodeId, node });
    this.checkTriggers('activate', nodeId);
  }

  /**
   * Unlock a node/gate
   */
  unlockNode(nodeId: string): void {
    const node = this.level.nodes.get(nodeId);
    if (!node) return;

    node.locked = false;
    this.emit('node-unlock', { nodeId, node });
  }

  /**
   * Handle partial unlocks (for gates requiring multiple conditions)
   */
  partialUnlock(gateId: string, unlockId: number, requiredCount: number): void {
    if (!this.level.partialUnlocks.has(gateId)) {
      this.level.partialUnlocks.set(gateId, new Set());
    }

    const unlocks = this.level.partialUnlocks.get(gateId)!;
    unlocks.add(unlockId);

    if (unlocks.size >= requiredCount) {
      this.unlockNode(gateId);
    }

    this.emit('partial-unlock', { gateId, unlockId, current: unlocks.size, required: requiredCount });
  }

  /**
   * Change dimension
   */
  shiftDimension(from: DimensionType, to: DimensionType): void {
    if (!this.level.dimensions.includes(to)) return;

    this.level.activeDimension = to;
    this.emit('dimension-shift', { from, to });
  }

  /**
   * Reveal a hidden node or edge
   */
  reveal(targetId: string): void {
    const node = this.level.nodes.get(targetId);
    if (node) {
      node.hiddenIn = [];
      this.emit('reveal', { type: 'node', id: targetId });
      return;
    }

    const edge = this.level.edges.get(targetId);
    if (edge) {
      edge.visible = true;
      edge.opacity = 1;
      this.emit('reveal', { type: 'edge', id: targetId });
    }
  }

  /**
   * Check if path exists between nodes
   */
  private hasPathBetween(fromId: string, toId: string): boolean {
    // Check direct edges
    for (const edge of this.level.edges.values()) {
      if (!edge.active && !edge.visible) continue;

      if (edge.from === fromId && edge.to === toId) return true;
      if (edge.type !== 'one-way' && edge.from === toId && edge.to === fromId) return true;
    }

    return false;
  }

  /**
   * Check and fire triggers
   */
  private checkTriggers(eventType: LevelTrigger['type'], nodeId?: string): void {
    for (const trigger of this.level.triggers) {
      if (trigger.fired) continue;
      if (trigger.definition.type !== eventType) continue;
      if (trigger.definition.nodeId && trigger.definition.nodeId !== nodeId) continue;

      // Fire the trigger
      trigger.fired = true;
      this.executeTrigger(trigger.definition);
    }
  }

  /**
   * Execute a trigger action
   */
  private executeTrigger(trigger: LevelTrigger): void {
    const delay = trigger.delay || 0;

    setTimeout(() => {
      switch (trigger.action) {
        case 'reveal':
          if (trigger.target) this.reveal(trigger.target);
          break;

        case 'unlock':
          if (trigger.target) {
            if (trigger.data?.partialUnlock !== undefined) {
              // Count how many partial unlocks are needed
              const requiredCount = this.level.triggers.filter(
                t => t.definition.action === 'unlock' &&
                     t.definition.target === trigger.target &&
                     t.definition.data?.partialUnlock !== undefined
              ).length;
              this.partialUnlock(trigger.target, trigger.data.partialUnlock, requiredCount);
            } else {
              this.unlockNode(trigger.target);
            }
          }
          break;

        case 'hide':
          // Hide a node
          if (trigger.target) {
            const node = this.level.nodes.get(trigger.target);
            if (node) {
              node.hiddenIn = this.level.dimensions;
            }
          }
          break;

        case 'message':
          this.emit('message', { text: trigger.data?.message || '' });
          break;

        case 'dimension-shift':
          if (trigger.data?.from && trigger.data?.to) {
            this.shiftDimension(trigger.data.from, trigger.data.to);
          }
          break;

        case 'spawn':
          // Spawn a new node at runtime
          this.emit('spawn', { nodeData: trigger.data });
          break;
      }
    }, delay);
  }

  /**
   * Check victory conditions
   */
  private checkVictory(): void {
    const vc = this.level.victoryCondition;
    let won = false;

    switch (vc.type) {
      case 'reach':
        // All players must reach target nodes
        const playersAtTargets = new Set<string>();
        for (const [playerId, nodeId] of this.level.currentPlayerPositions) {
          if (vc.targets.includes(nodeId)) {
            playersAtTargets.add(playerId);
          }
        }
        won = playersAtTargets.size >= this.level.currentPlayerPositions.size &&
              playersAtTargets.size > 0;
        break;

      case 'activate-all':
        // All target nodes must be activated
        won = vc.targets.every(targetId => {
          const node = this.level.nodes.get(targetId);
          return node?.active;
        });
        break;

      case 'sequence':
        // Nodes must be activated in order
        // Track this separately
        break;

      case 'witness':
        // Must witness specific nodes
        won = vc.targets.every(targetId => {
          const node = this.level.nodes.get(targetId);
          return node?.visited;
        });
        break;

      case 'synchronize':
        // All players at targets simultaneously
        const targetPlayers = new Map<string, Set<string>>();
        for (const targetId of vc.targets) {
          const node = this.level.nodes.get(targetId);
          if (node) {
            targetPlayers.set(targetId, node.currentPlayers);
          }
        }

        // Check if all players are at any of the targets
        const allPlayers = this.level.currentPlayerPositions.size;
        if (allPlayers === 0) break;

        let synchronizedPlayers = 0;
        for (const players of targetPlayers.values()) {
          synchronizedPlayers += players.size;
        }
        won = synchronizedPlayers >= allPlayers;
        break;
    }

    // Check time limit
    if (vc.timeLimit && this.level.elapsedTime > vc.timeLimit) {
      this.level.failed = true;
      this.emit('level-fail', { reason: 'time' });
      return;
    }

    if (won) {
      this.level.completed = true;
      this.emit('level-complete', {
        time: this.level.elapsedTime,
        nodesVisited: this.level.nodesVisited.size,
        backtrackCount: this.level.backtrackCount,
        witnessTime: this.level.witnessTime
      });
    }
  }

  /**
   * Get level state for serialization
   */
  getState(): object {
    return {
      id: this.level.id,
      elapsedTime: this.level.elapsedTime,
      completed: this.level.completed,
      failed: this.level.failed,
      playerPositions: Object.fromEntries(this.level.currentPlayerPositions),
      nodesVisited: Array.from(this.level.nodesVisited),
      completedObjectives: Array.from(this.level.completedObjectives)
    };
  }

  /**
   * Event system
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach(cb => cb(data));
  }

  /**
   * Get level reference
   */
  getLevel(): PlayableLevel {
    return this.level;
  }
}

// =============================================================================
// SINGLETON LOADER
// =============================================================================

export const levelLoader = new LevelLoader();
