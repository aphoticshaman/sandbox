/**
 * Cooperative Puzzle System
 * Multi-player puzzle mechanics that require genuine coordination
 *
 * Philosophy: True cooperation, not just parallel play.
 * - Some elements can only be seen by certain players
 * - Some actions require synchronized attention
 * - Players complete each other's perception gaps
 * - The whole is genuinely more than the sum of parts
 */

import * as THREE from 'three';
import { NetworkCore, NetworkMessage } from '../network/NetworkCore';

// ========================================
// Cooperative Puzzle Types
// ========================================

export type CoopMechanicType =
  | 'split-perception'    // Each player sees different layers
  | 'synchronized-focus'  // Must focus on same target together
  | 'relay-witness'       // One witnesses, reveals for another to act
  | 'perspective-union'   // Combined viewpoints reveal truth
  | 'attention-bridge'    // Attention creates path for others
  | 'temporal-sync'       // Actions must happen at exact same time
  | 'complementary-roles' // Each player has unique abilities
  | 'chain-reaction';     // One's action enables another's

export interface CoopPuzzleConfig {
  id: string;
  name: string;
  playerCount: { min: number; max: number };
  mechanics: CoopMechanicType[];
  duration?: number;  // Time limit if any
  difficulty: number; // 0-1

  // Visual layers by player
  layers: PuzzleLayer[];

  // Interaction points
  nodes: CoopNode[];

  // Success conditions
  objectives: PuzzleObjective[];
}

export interface PuzzleLayer {
  id: string;
  visibleTo: 'all' | 'player1' | 'player2' | 'player3' | 'player4' | 'witnessed';
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

export interface CoopNode {
  id: string;
  type: 'focus-point' | 'witness-point' | 'sync-point' | 'relay-point' | 'bridge-anchor';
  position: THREE.Vector3;
  radius: number;
  requiredPlayers: number;  // How many must engage simultaneously
  visibleTo: 'all' | string[];  // Player IDs or 'all'
  activeState: 'inactive' | 'charging' | 'active' | 'completed';
  linkedNodes: string[];  // IDs of connected nodes
}

export interface PuzzleObjective {
  id: string;
  type: 'activate-all' | 'sequence' | 'simultaneous' | 'bridge-complete' | 'witness-reveal';
  targets: string[];  // Node IDs
  completed: boolean;
  description: string;
}

// ========================================
// Cooperative Puzzle State
// ========================================

export interface CoopPuzzleState {
  puzzleId: string;
  startTime: number;
  elapsed: number;
  phase: 'intro' | 'active' | 'completed' | 'failed';

  // Player states
  players: Map<string, PlayerPuzzleState>;

  // Node states
  nodes: Map<string, NodeState>;

  // Objective progress
  objectives: Map<string, ObjectiveState>;

  // Sync events
  pendingSyncs: SyncEvent[];
}

export interface PlayerPuzzleState {
  id: string;
  position: THREE.Vector3;
  attentionTarget: THREE.Vector3 | null;
  isFocusing: boolean;
  isWitnessing: boolean;
  focusedNode: string | null;
  revealedLayers: string[];
  role?: string;
}

export interface NodeState {
  id: string;
  activeState: 'inactive' | 'charging' | 'active' | 'completed';
  chargeLevel: number;  // 0-1
  engagedPlayers: string[];
  lastUpdate: number;
}

export interface ObjectiveState {
  id: string;
  completed: boolean;
  progress: number;  // 0-1
}

export interface SyncEvent {
  id: string;
  type: 'sync-start' | 'sync-complete' | 'sync-failed';
  nodeId: string;
  requiredPlayers: string[];
  currentPlayers: string[];
  timestamp: number;
  window: number;  // ms window for sync
}

// ========================================
// Cooperative Puzzle Controller
// ========================================

export class CooperativePuzzleController {
  private network: NetworkCore;
  private config: CoopPuzzleConfig | null = null;
  private state: CoopPuzzleState | null = null;
  private localPlayerId: string = '';

  // Scene objects
  private scene: THREE.Scene;
  private layerMeshes: Map<string, THREE.Mesh> = new Map();
  private nodeMeshes: Map<string, THREE.Mesh> = new Map();

  // Sync timing
  private readonly SYNC_WINDOW = 500;  // ms
  private readonly CHARGE_RATE = 0.5;  // Per second per player
  private readonly DECAY_RATE = 0.3;   // Per second when not engaged

  // Events
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(network: NetworkCore, scene: THREE.Scene) {
    this.network = network;
    this.scene = scene;
    this.localPlayerId = network.getLocalId();
    this.setupNetworkHandlers();
  }

  private setupNetworkHandlers(): void {
    this.network.on('puzzle-state', this.handleStateUpdate.bind(this));
    this.network.on('player-action', this.handlePlayerAction.bind(this));
    this.network.on('node-update', this.handleNodeUpdate.bind(this));
    this.network.on('sync-request', this.handleSyncRequest.bind(this));
    this.network.on('objective-complete', this.handleObjectiveComplete.bind(this));
  }

  // ========================================
  // Puzzle Lifecycle
  // ========================================

  async loadPuzzle(config: CoopPuzzleConfig): Promise<void> {
    this.config = config;
    this.state = this.createInitialState(config);

    // Build visual layers
    for (const layer of config.layers) {
      this.createLayerMesh(layer);
    }

    // Build nodes
    for (const node of config.nodes) {
      this.createNodeMesh(node);
    }

    // Broadcast load to all players
    this.network.send('puzzle-load', { config });

    this.emit('puzzleLoaded', { config });
  }

  startPuzzle(): void {
    if (!this.state) return;

    this.state.phase = 'active';
    this.state.startTime = Date.now();

    this.network.send('puzzle-start', { startTime: this.state.startTime });
    this.emit('puzzleStarted', {});
  }

  update(delta: number): void {
    if (!this.state || this.state.phase !== 'active') return;

    this.state.elapsed = Date.now() - this.state.startTime;

    // Update node states
    this.updateNodes(delta);

    // Check sync events
    this.processSyncEvents();

    // Check objectives
    this.checkObjectives();

    // Update visuals
    this.updateVisuals(delta);

    // Broadcast state periodically
    this.broadcastState();
  }

  private createInitialState(config: CoopPuzzleConfig): CoopPuzzleState {
    const nodes = new Map<string, NodeState>();
    for (const node of config.nodes) {
      nodes.set(node.id, {
        id: node.id,
        activeState: 'inactive',
        chargeLevel: 0,
        engagedPlayers: [],
        lastUpdate: Date.now(),
      });
    }

    const objectives = new Map<string, ObjectiveState>();
    for (const obj of config.objectives) {
      objectives.set(obj.id, {
        id: obj.id,
        completed: false,
        progress: 0,
      });
    }

    return {
      puzzleId: config.id,
      startTime: 0,
      elapsed: 0,
      phase: 'intro',
      players: new Map(),
      nodes,
      objectives,
      pendingSyncs: [],
    };
  }

  // ========================================
  // Player Actions
  // ========================================

  reportLocalState(
    position: THREE.Vector3,
    attentionTarget: THREE.Vector3 | null,
    isFocusing: boolean,
    isWitnessing: boolean
  ): void {
    if (!this.state) return;

    // Update local player state
    let playerState = this.state.players.get(this.localPlayerId);
    if (!playerState) {
      playerState = {
        id: this.localPlayerId,
        position: position.clone(),
        attentionTarget: attentionTarget?.clone() || null,
        isFocusing,
        isWitnessing,
        focusedNode: null,
        revealedLayers: [],
      };
      this.state.players.set(this.localPlayerId, playerState);
    } else {
      playerState.position.copy(position);
      playerState.attentionTarget = attentionTarget?.clone() || null;
      playerState.isFocusing = isFocusing;
      playerState.isWitnessing = isWitnessing;
    }

    // Check if focusing on a node
    playerState.focusedNode = this.findFocusedNode(position, attentionTarget);

    // Broadcast to others
    this.network.send('player-action', {
      playerId: this.localPlayerId,
      position: position.toArray(),
      attentionTarget: attentionTarget?.toArray() || null,
      isFocusing,
      isWitnessing,
      focusedNode: playerState.focusedNode,
    }, { reliable: false });
  }

  private findFocusedNode(position: THREE.Vector3, target: THREE.Vector3 | null): string | null {
    if (!target || !this.config) return null;

    for (const node of this.config.nodes) {
      const dist = target.distanceTo(node.position);
      if (dist < node.radius) {
        return node.id;
      }
    }

    return null;
  }

  // ========================================
  // Node Mechanics
  // ========================================

  private updateNodes(delta: number): void {
    if (!this.state || !this.config) return;

    for (const node of this.config.nodes) {
      const nodeState = this.state.nodes.get(node.id);
      if (!nodeState || nodeState.activeState === 'completed') continue;

      // Count engaged players
      const engaged: string[] = [];
      for (const [playerId, playerState] of this.state.players) {
        if (playerState.focusedNode === node.id && playerState.isFocusing) {
          engaged.push(playerId);
        }
      }

      nodeState.engagedPlayers = engaged;

      // Update charge based on engagement
      if (engaged.length >= node.requiredPlayers) {
        // Charging
        nodeState.activeState = 'charging';
        nodeState.chargeLevel = Math.min(1, nodeState.chargeLevel + this.CHARGE_RATE * delta);

        if (nodeState.chargeLevel >= 1) {
          this.activateNode(node.id);
        }
      } else if (engaged.length > 0) {
        // Partial engagement - slower charge
        nodeState.activeState = 'charging';
        nodeState.chargeLevel = Math.min(
          1,
          nodeState.chargeLevel + (this.CHARGE_RATE * 0.3 * delta)
        );
      } else {
        // Decay
        nodeState.activeState = 'inactive';
        nodeState.chargeLevel = Math.max(0, nodeState.chargeLevel - this.DECAY_RATE * delta);
      }

      nodeState.lastUpdate = Date.now();
    }
  }

  private activateNode(nodeId: string): void {
    if (!this.state || !this.config) return;

    const nodeState = this.state.nodes.get(nodeId);
    if (!nodeState) return;

    nodeState.activeState = 'active';

    // Check if this triggers a sync event
    const node = this.config.nodes.find(n => n.id === nodeId);
    if (node?.type === 'sync-point') {
      this.triggerSyncEvent(nodeId);
    }

    // Activate linked nodes in chain reactions
    if (node?.linkedNodes) {
      for (const linkedId of node.linkedNodes) {
        // Enable the linked node for interaction
        this.enableNode(linkedId);
      }
    }

    // Broadcast
    this.network.send('node-update', {
      nodeId,
      state: 'active',
      chargeLevel: 1,
    });

    this.emit('nodeActivated', { nodeId });
  }

  private enableNode(nodeId: string): void {
    // Make a node available for interaction (visual feedback)
    const mesh = this.nodeMeshes.get(nodeId);
    if (mesh) {
      (mesh.material as THREE.MeshBasicMaterial).opacity = 1;
    }
  }

  // ========================================
  // Sync Mechanics
  // ========================================

  private triggerSyncEvent(nodeId: string): void {
    if (!this.state || !this.config) return;

    const node = this.config.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Find all players who need to sync
    const requiredPlayers = Array.from(this.state.players.keys())
      .slice(0, node.requiredPlayers);

    const syncEvent: SyncEvent = {
      id: `sync-${Date.now()}`,
      type: 'sync-start',
      nodeId,
      requiredPlayers,
      currentPlayers: [],
      timestamp: Date.now(),
      window: this.SYNC_WINDOW,
    };

    this.state.pendingSyncs.push(syncEvent);

    // Broadcast sync request
    this.network.send('sync-request', { syncEvent });

    this.emit('syncRequired', { syncEvent });
  }

  private processSyncEvents(): void {
    if (!this.state) return;

    const now = Date.now();
    const completed: SyncEvent[] = [];

    for (const sync of this.state.pendingSyncs) {
      // Check if window expired
      if (now - sync.timestamp > sync.window) {
        if (sync.currentPlayers.length >= sync.requiredPlayers.length) {
          // Success!
          sync.type = 'sync-complete';
          this.completeNode(sync.nodeId);
          this.emit('syncSuccess', { sync });
        } else {
          // Failed
          sync.type = 'sync-failed';
          this.resetNode(sync.nodeId);
          this.emit('syncFailed', { sync });
        }
        completed.push(sync);
      }
    }

    // Remove completed syncs
    this.state.pendingSyncs = this.state.pendingSyncs.filter(s => !completed.includes(s));
  }

  respondToSync(syncId: string): void {
    if (!this.state) return;

    const sync = this.state.pendingSyncs.find(s => s.id === syncId);
    if (!sync) return;

    if (!sync.currentPlayers.includes(this.localPlayerId)) {
      sync.currentPlayers.push(this.localPlayerId);
    }

    this.network.send('sync-response', {
      syncId,
      playerId: this.localPlayerId,
    });
  }

  private completeNode(nodeId: string): void {
    const nodeState = this.state?.nodes.get(nodeId);
    if (nodeState) {
      nodeState.activeState = 'completed';
      this.network.send('node-update', {
        nodeId,
        state: 'completed',
      });
    }
  }

  private resetNode(nodeId: string): void {
    const nodeState = this.state?.nodes.get(nodeId);
    if (nodeState) {
      nodeState.activeState = 'inactive';
      nodeState.chargeLevel = 0;
    }
  }

  // ========================================
  // Objectives
  // ========================================

  private checkObjectives(): void {
    if (!this.state || !this.config) return;

    for (const objective of this.config.objectives) {
      const objState = this.state.objectives.get(objective.id);
      if (!objState || objState.completed) continue;

      let completed = false;

      switch (objective.type) {
        case 'activate-all':
          completed = objective.targets.every(nodeId => {
            const nodeState = this.state!.nodes.get(nodeId);
            return nodeState?.activeState === 'completed' || nodeState?.activeState === 'active';
          });
          break;

        case 'simultaneous':
          // All targets must be active at the same time
          completed = objective.targets.every(nodeId => {
            const nodeState = this.state!.nodes.get(nodeId);
            return nodeState?.activeState === 'active';
          });
          break;

        case 'sequence':
          // Check if nodes were completed in order
          // (Would need to track completion order)
          break;
      }

      if (completed && !objState.completed) {
        objState.completed = true;
        this.network.send('objective-complete', { objectiveId: objective.id });
        this.emit('objectiveCompleted', { objective });
        this.checkPuzzleComplete();
      }
    }
  }

  private checkPuzzleComplete(): void {
    if (!this.state || !this.config) return;

    const allComplete = this.config.objectives.every(obj => {
      const state = this.state!.objectives.get(obj.id);
      return state?.completed;
    });

    if (allComplete) {
      this.state.phase = 'completed';
      this.emit('puzzleCompleted', {
        elapsed: this.state.elapsed,
        players: Array.from(this.state.players.keys()),
      });
    }
  }

  // ========================================
  // Visuals
  // ========================================

  private createLayerMesh(layer: PuzzleLayer): void {
    const mesh = new THREE.Mesh(layer.geometry, layer.material);
    mesh.position.copy(layer.position);
    mesh.rotation.copy(layer.rotation);
    mesh.userData.layerId = layer.id;
    mesh.userData.visibleTo = layer.visibleTo;

    // Initially hide layers that aren't for all players
    if (layer.visibleTo !== 'all') {
      mesh.visible = false;
    }

    this.layerMeshes.set(layer.id, mesh);
    this.scene.add(mesh);
  }

  private createNodeMesh(node: CoopNode): void {
    const geometry = new THREE.SphereGeometry(node.radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: this.getNodeColor(node.type),
      transparent: true,
      opacity: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(node.position);
    mesh.userData.nodeId = node.id;
    mesh.userData.type = node.type;

    this.nodeMeshes.set(node.id, mesh);
    this.scene.add(mesh);
  }

  private getNodeColor(type: CoopNode['type']): number {
    const colors: Record<string, number> = {
      'focus-point': 0x667eea,
      'witness-point': 0x00ffff,
      'sync-point': 0xffff00,
      'relay-point': 0xff00ff,
      'bridge-anchor': 0x00ff00,
    };
    return colors[type] || 0xffffff;
  }

  private updateVisuals(delta: number): void {
    if (!this.state) return;

    // Update node visuals based on state
    for (const [nodeId, nodeState] of this.state.nodes) {
      const mesh = this.nodeMeshes.get(nodeId);
      if (!mesh) continue;

      const material = mesh.material as THREE.MeshBasicMaterial;

      switch (nodeState.activeState) {
        case 'inactive':
          material.opacity = 0.3;
          break;
        case 'charging':
          material.opacity = 0.3 + nodeState.chargeLevel * 0.5;
          mesh.scale.setScalar(1 + nodeState.chargeLevel * 0.2);
          break;
        case 'active':
          material.opacity = 1;
          mesh.scale.setScalar(1.3);
          break;
        case 'completed':
          material.opacity = 0.8;
          material.color.setHex(0x00ff00);
          break;
      }
    }

    // Update layer visibility based on witness reveals
    this.updateLayerVisibility();
  }

  private updateLayerVisibility(): void {
    if (!this.state) return;

    const localPlayer = this.state.players.get(this.localPlayerId);
    if (!localPlayer) return;

    for (const [layerId, mesh] of this.layerMeshes) {
      const visibleTo = mesh.userData.visibleTo;

      if (visibleTo === 'all') {
        mesh.visible = true;
      } else if (visibleTo === 'witnessed') {
        mesh.visible = localPlayer.revealedLayers.includes(layerId);
      } else {
        // Player-specific layer
        mesh.visible = visibleTo.includes(this.localPlayerId);
      }
    }
  }

  // ========================================
  // Network Handlers
  // ========================================

  private handleStateUpdate(msg: NetworkMessage): void {
    // Full state sync from host
    if (!this.state) return;
    // Merge incoming state
  }

  private handlePlayerAction(msg: NetworkMessage): void {
    if (!this.state) return;

    const { playerId, position, attentionTarget, isFocusing, isWitnessing, focusedNode } = msg.payload;

    if (playerId === this.localPlayerId) return;

    let playerState = this.state.players.get(playerId);
    if (!playerState) {
      playerState = {
        id: playerId,
        position: new THREE.Vector3(),
        attentionTarget: null,
        isFocusing: false,
        isWitnessing: false,
        focusedNode: null,
        revealedLayers: [],
      };
      this.state.players.set(playerId, playerState);
    }

    playerState.position.fromArray(position);
    playerState.attentionTarget = attentionTarget ? new THREE.Vector3().fromArray(attentionTarget) : null;
    playerState.isFocusing = isFocusing;
    playerState.isWitnessing = isWitnessing;
    playerState.focusedNode = focusedNode;
  }

  private handleNodeUpdate(msg: NetworkMessage): void {
    if (!this.state) return;

    const { nodeId, state, chargeLevel } = msg.payload;
    const nodeState = this.state.nodes.get(nodeId);

    if (nodeState) {
      nodeState.activeState = state;
      if (chargeLevel !== undefined) {
        nodeState.chargeLevel = chargeLevel;
      }
    }
  }

  private handleSyncRequest(msg: NetworkMessage): void {
    const { syncEvent } = msg.payload;
    this.emit('syncRequired', { syncEvent });
  }

  private handleObjectiveComplete(msg: NetworkMessage): void {
    if (!this.state) return;

    const { objectiveId } = msg.payload;
    const objState = this.state.objectives.get(objectiveId);
    if (objState) {
      objState.completed = true;
    }
  }

  private broadcastState(): void {
    // Only host broadcasts full state
    // For now, per-element updates handle sync
  }

  // ========================================
  // Events
  // ========================================

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  // ========================================
  // Cleanup
  // ========================================

  cleanup(): void {
    for (const mesh of this.layerMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.layerMeshes.clear();

    for (const mesh of this.nodeMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.nodeMeshes.clear();
  }
}
