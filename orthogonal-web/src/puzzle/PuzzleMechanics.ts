/**
 * PuzzleMechanics.ts
 *
 * Core puzzle mechanics for Orthogonal
 * Implements all puzzle element behaviors and interactions
 */

import * as THREE from 'three';
import { LevelNode, LevelEdge, PlayableLevel, LevelRuntime } from '../level/LevelLoader';
import { DimensionType } from '../core/DimensionManager';

// =============================================================================
// TYPES
// =============================================================================

export type MechanicType =
  | 'attention-focus'       // Basic focusing on nodes
  | 'path-traversal'        // Moving along edges
  | 'witness-reveal'        // Witnessing to reveal hidden elements
  | 'node-charging'         // Holding attention to charge nodes
  | 'dimension-shift'       // Switching between dimensions
  | 'synchronization'       // Multi-player sync points
  | 'mirror-reflection'     // Mirror mechanics across dimensions
  | 'relay-chain'           // Pass information between players
  | 'void-navigation'       // Navigating sparse void space
  | 'orthogonal-jump';      // Moving perpendicular to current dimension

export interface MechanicState {
  type: MechanicType;
  active: boolean;
  progress: number;
  participants: Set<string>;
  data: Record<string, any>;
}

export interface FocusTarget {
  type: 'node' | 'edge' | 'void';
  id: string;
  position: THREE.Vector3;
  intensity: number;
  duration: number;
}

export interface WitnessState {
  active: boolean;
  startTime: number;
  duration: number;
  revealedNodes: Set<string>;
  revealedEdges: Set<string>;
  viewingDimension: DimensionType | null;
}

// =============================================================================
// PUZZLE ENGINE
// =============================================================================

export class PuzzleEngine {
  private runtime: LevelRuntime;
  private mechanics: Map<string, MechanicState> = new Map();
  private playerFocus: Map<string, FocusTarget | null> = new Map();
  private playerWitness: Map<string, WitnessState> = new Map();

  // Timing
  private lastUpdate: number = 0;
  private readonly FOCUS_THRESHOLD = 0.5;     // Seconds to lock focus
  private readonly WITNESS_REVEAL_TIME = 1.0; // Seconds to reveal hidden

  constructor(runtime: LevelRuntime) {
    this.runtime = runtime;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.runtime.on('node-activate', (data) => this.onNodeActivate(data));
    this.runtime.on('player-move', (data) => this.onPlayerMove(data));
    this.runtime.on('dimension-shift', (data) => this.onDimensionShift(data));
  }

  // ===========================================================================
  // UPDATE LOOP
  // ===========================================================================

  update(time: number): void {
    const deltaTime = time - this.lastUpdate;
    this.lastUpdate = time;

    this.updateFocus(deltaTime);
    this.updateWitness(deltaTime);
    this.updateMechanics(deltaTime);
    this.updateCharging(deltaTime);
  }

  private updateFocus(deltaTime: number): void {
    for (const [playerId, focus] of this.playerFocus) {
      if (!focus) continue;

      focus.duration += deltaTime / 1000;

      // Check if focus is locked
      if (focus.duration >= this.FOCUS_THRESHOLD) {
        this.onFocusLocked(playerId, focus);
      }
    }
  }

  private updateWitness(deltaTime: number): void {
    for (const [playerId, witness] of this.playerWitness) {
      if (!witness.active) continue;

      witness.duration += deltaTime / 1000;

      // Progressive revelation
      if (witness.duration >= this.WITNESS_REVEAL_TIME) {
        this.revealHiddenElements(playerId, witness);
      }

      // Track witness time for stats
      this.runtime.addWitnessTime(deltaTime);
    }
  }

  private updateMechanics(deltaTime: number): void {
    for (const [id, mechanic] of this.mechanics) {
      if (!mechanic.active) continue;

      switch (mechanic.type) {
        case 'synchronization':
          this.updateSynchronization(id, mechanic, deltaTime);
          break;
        case 'relay-chain':
          this.updateRelayChain(id, mechanic, deltaTime);
          break;
        case 'orthogonal-jump':
          this.updateOrthogonalJump(id, mechanic, deltaTime);
          break;
      }
    }
  }

  private updateCharging(deltaTime: number): void {
    const level = this.runtime.getLevel();

    for (const node of level.nodes.values()) {
      if (node.activationTime <= 0) continue;
      if (node.active) continue;

      // Check if enough players are focused
      const focusedPlayers = this.getPlayersFocusedOn(node.id);
      if (focusedPlayers.size >= node.requiredPlayers) {
        // Charge the node
        const chargeRate = (deltaTime / 1000) / (node.activationTime / 1000);
        node.chargeProgress = Math.min(1, node.chargeProgress + chargeRate);

        if (node.chargeProgress >= 1) {
          this.runtime.activateNode(node.id);
        }
      } else {
        // Decay charge
        node.chargeProgress = Math.max(0, node.chargeProgress - (deltaTime / 2000));
      }
    }
  }

  // ===========================================================================
  // FOCUS MECHANICS
  // ===========================================================================

  /**
   * Player starts focusing on a target
   */
  startFocus(playerId: string, target: FocusTarget): void {
    this.playerFocus.set(playerId, {
      ...target,
      duration: 0
    });
  }

  /**
   * Player stops focusing
   */
  stopFocus(playerId: string): void {
    this.playerFocus.set(playerId, null);
  }

  /**
   * Get current focus target for a player
   */
  getFocus(playerId: string): FocusTarget | null {
    return this.playerFocus.get(playerId) || null;
  }

  /**
   * Handle focus lock (player has focused long enough)
   */
  private onFocusLocked(playerId: string, focus: FocusTarget): void {
    if (focus.type === 'node') {
      // Try to move to this node
      const success = this.runtime.movePlayer(playerId, focus.id);
      if (success) {
        this.stopFocus(playerId);
      }
    }
  }

  /**
   * Get all players focused on a specific target
   */
  private getPlayersFocusedOn(targetId: string): Set<string> {
    const players = new Set<string>();
    for (const [playerId, focus] of this.playerFocus) {
      if (focus && focus.id === targetId && focus.duration >= this.FOCUS_THRESHOLD) {
        players.add(playerId);
      }
    }
    return players;
  }

  // ===========================================================================
  // WITNESS MECHANICS
  // ===========================================================================

  /**
   * Player enters witness mode
   */
  enterWitness(playerId: string, viewDimension?: DimensionType): void {
    const level = this.runtime.getLevel();
    const playerNode = level.currentPlayerPositions.get(playerId);

    this.playerWitness.set(playerId, {
      active: true,
      startTime: performance.now(),
      duration: 0,
      revealedNodes: new Set(),
      revealedEdges: new Set(),
      viewingDimension: viewDimension || null
    });

    this.runtime.startWitness(playerId);
  }

  /**
   * Player exits witness mode
   */
  exitWitness(playerId: string): void {
    const witness = this.playerWitness.get(playerId);
    if (!witness) return;

    witness.active = false;
    this.runtime.stopWitness(playerId);
  }

  /**
   * Check if player is in witness mode
   */
  isWitnessing(playerId: string): boolean {
    return this.playerWitness.get(playerId)?.active || false;
  }

  /**
   * Reveal hidden elements during witness
   */
  private revealHiddenElements(playerId: string, witness: WitnessState): void {
    const level = this.runtime.getLevel();
    const playerNodeId = level.currentPlayerPositions.get(playerId);
    if (!playerNodeId) return;

    const playerNode = level.nodes.get(playerNodeId);
    if (!playerNode) return;

    // Find nodes hidden in current dimension that should be revealed
    for (const node of level.nodes.values()) {
      if (witness.revealedNodes.has(node.id)) continue;

      // Check if this node should be revealed
      const shouldReveal = node.hiddenIn.includes(level.activeDimension) ||
                          (witness.viewingDimension && node.dimension === witness.viewingDimension);

      if (shouldReveal) {
        // Check distance
        const distance = playerNode.position.distanceTo(node.position);
        if (distance < 15) {
          witness.revealedNodes.add(node.id);
          this.runtime.reveal(node.id);
        }
      }
    }

    // Find hidden edges to reveal
    for (const edge of level.edges.values()) {
      if (witness.revealedEdges.has(edge.id)) continue;
      if (!edge.requiresWitness) continue;

      // Check if connected to player's current node
      if (edge.from === playerNodeId || edge.to === playerNodeId) {
        witness.revealedEdges.add(edge.id);
        this.runtime.reveal(edge.id);
      }
    }
  }

  // ===========================================================================
  // DIMENSION MECHANICS
  // ===========================================================================

  /**
   * Attempt to shift dimensions at a switch node
   */
  tryDimensionShift(playerId: string): boolean {
    const level = this.runtime.getLevel();
    const playerNodeId = level.currentPlayerPositions.get(playerId);
    if (!playerNodeId) return false;

    const node = level.nodes.get(playerNodeId);
    if (!node || node.type !== 'switch') return false;

    // Find the target dimension
    const currentDim = level.activeDimension;
    const availableDims = level.dimensions.filter(d => d !== currentDim);
    if (availableDims.length === 0) return false;

    // Default to first available
    const targetDim = availableDims[0];
    this.runtime.shiftDimension(currentDim, targetDim);
    return true;
  }

  // ===========================================================================
  // SYNCHRONIZATION MECHANICS
  // ===========================================================================

  /**
   * Start a synchronization mechanic
   */
  startSynchronization(mechanicId: string, requiredPlayers: string[], timeWindow: number): void {
    this.mechanics.set(mechanicId, {
      type: 'synchronization',
      active: true,
      progress: 0,
      participants: new Set(),
      data: {
        required: new Set(requiredPlayers),
        timeWindow,
        startTime: 0,
        synced: false
      }
    });
  }

  /**
   * Player joins synchronization
   */
  joinSynchronization(mechanicId: string, playerId: string): void {
    const mechanic = this.mechanics.get(mechanicId);
    if (!mechanic || mechanic.type !== 'synchronization') return;

    if (mechanic.data.startTime === 0) {
      mechanic.data.startTime = performance.now();
    }

    mechanic.participants.add(playerId);

    // Check if all required players are in
    const required = mechanic.data.required as Set<string>;
    const allIn = [...required].every(p => mechanic.participants.has(p));

    if (allIn) {
      const elapsed = performance.now() - mechanic.data.startTime;
      if (elapsed <= mechanic.data.timeWindow) {
        mechanic.data.synced = true;
        mechanic.progress = 1;
      }
    }
  }

  private updateSynchronization(id: string, mechanic: MechanicState, deltaTime: number): void {
    if (mechanic.data.synced) return;

    const elapsed = performance.now() - mechanic.data.startTime;
    if (mechanic.data.startTime > 0 && elapsed > mechanic.data.timeWindow) {
      // Failed - reset
      mechanic.data.startTime = 0;
      mechanic.participants.clear();
      mechanic.progress = 0;
    }
  }

  // ===========================================================================
  // RELAY MECHANICS
  // ===========================================================================

  /**
   * Start a relay chain mechanic
   */
  startRelayChain(mechanicId: string, sequence: string[]): void {
    this.mechanics.set(mechanicId, {
      type: 'relay-chain',
      active: true,
      progress: 0,
      participants: new Set(),
      data: {
        sequence,
        currentIndex: 0,
        completed: false
      }
    });
  }

  /**
   * Player activates their part of the relay
   */
  activateRelay(mechanicId: string, playerId: string): boolean {
    const mechanic = this.mechanics.get(mechanicId);
    if (!mechanic || mechanic.type !== 'relay-chain') return false;

    const sequence = mechanic.data.sequence as string[];
    const expectedPlayer = sequence[mechanic.data.currentIndex];

    if (playerId === expectedPlayer) {
      mechanic.participants.add(playerId);
      mechanic.data.currentIndex++;
      mechanic.progress = mechanic.data.currentIndex / sequence.length;

      if (mechanic.data.currentIndex >= sequence.length) {
        mechanic.data.completed = true;
      }
      return true;
    }

    // Wrong player - reset
    mechanic.data.currentIndex = 0;
    mechanic.participants.clear();
    mechanic.progress = 0;
    return false;
  }

  private updateRelayChain(id: string, mechanic: MechanicState, deltaTime: number): void {
    // Relay mechanics are event-driven, no continuous update needed
  }

  // ===========================================================================
  // ORTHOGONAL JUMP MECHANICS
  // ===========================================================================

  /**
   * Start an orthogonal jump (perpendicular dimension movement)
   */
  startOrthogonalJump(playerId: string, fromDimension: DimensionType, toDimension: DimensionType): void {
    const mechanicId = `ortho-${playerId}-${Date.now()}`;

    this.mechanics.set(mechanicId, {
      type: 'orthogonal-jump',
      active: true,
      progress: 0,
      participants: new Set([playerId]),
      data: {
        from: fromDimension,
        to: toDimension,
        chargeTime: 2000,  // 2 seconds to charge
        charged: false
      }
    });
  }

  private updateOrthogonalJump(id: string, mechanic: MechanicState, deltaTime: number): void {
    if (mechanic.data.charged) return;

    mechanic.progress += deltaTime / mechanic.data.chargeTime;

    if (mechanic.progress >= 1) {
      mechanic.data.charged = true;
      mechanic.progress = 1;

      // Execute the jump
      const playerId = [...mechanic.participants][0];
      this.runtime.shiftDimension(mechanic.data.from, mechanic.data.to);
      mechanic.active = false;
    }
  }

  // ===========================================================================
  // VOID NAVIGATION
  // ===========================================================================

  /**
   * Get void drift vector (in void, nodes pull attention)
   */
  getVoidDrift(position: THREE.Vector3): THREE.Vector3 {
    const level = this.runtime.getLevel();
    if (level.activeDimension !== 'VOID') {
      return new THREE.Vector3();
    }

    const drift = new THREE.Vector3();
    const voidNodes = level.nodesByDimension.get('VOID') || [];

    for (const node of voidNodes) {
      const direction = new THREE.Vector3().subVectors(node.position, position);
      const distance = direction.length();

      if (distance < 0.1) continue;
      if (distance > 20) continue;

      // Inverse square attraction
      const strength = 1 / (distance * distance);
      direction.normalize().multiplyScalar(strength * 0.5);
      drift.add(direction);
    }

    return drift;
  }

  /**
   * Check if position is in void "safe zone" (near a node)
   */
  isInVoidSafeZone(position: THREE.Vector3): boolean {
    const level = this.runtime.getLevel();
    const voidNodes = level.nodesByDimension.get('VOID') || [];

    for (const node of voidNodes) {
      if (position.distanceTo(node.position) < 3) {
        return true;
      }
    }

    return false;
  }

  // ===========================================================================
  // MIRROR MECHANICS
  // ===========================================================================

  /**
   * Get mirrored position across dimensions
   */
  getMirroredPosition(position: THREE.Vector3, fromDim: DimensionType, toDim: DimensionType): THREE.Vector3 {
    // Different mirror transformations based on dimension pair
    const mirrored = position.clone();

    if ((fromDim === 'LATTICE' && toDim === 'MARROW') ||
        (fromDim === 'MARROW' && toDim === 'LATTICE')) {
      // X-axis mirror
      mirrored.x = -mirrored.x;
    } else if ((fromDim === 'LATTICE' && toDim === 'VOID') ||
               (fromDim === 'VOID' && toDim === 'LATTICE')) {
      // Y-axis mirror
      mirrored.y = -mirrored.y;
    } else if ((fromDim === 'MARROW' && toDim === 'VOID') ||
               (fromDim === 'VOID' && toDim === 'MARROW')) {
      // Z-axis mirror
      mirrored.z = -mirrored.z;
    }

    return mirrored;
  }

  /**
   * Check if a mirror node can be activated
   */
  canActivateMirror(nodeId: string, playerId: string): boolean {
    const level = this.runtime.getLevel();
    const node = level.nodes.get(nodeId);
    if (!node || node.type !== 'mirror') return false;

    // Player must be at the mirror
    const playerNodeId = level.currentPlayerPositions.get(playerId);
    return playerNodeId === nodeId;
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  private onNodeActivate(data: { nodeId: string; node: LevelNode }): void {
    const { nodeId, node } = data;

    // Handle special node types
    switch (node.type) {
      case 'switch':
        // Auto-shift if standing on switch
        for (const [playerId, pNodeId] of this.runtime.getLevel().currentPlayerPositions) {
          if (pNodeId === nodeId) {
            this.tryDimensionShift(playerId);
          }
        }
        break;

      case 'mirror':
        // Mirror activation logic handled separately
        break;
    }
  }

  private onPlayerMove(data: { playerId: string; from?: string; to: string }): void {
    const { playerId, to } = data;
    const level = this.runtime.getLevel();
    const node = level.nodes.get(to);

    if (!node) return;

    // Auto-enter witness mode at witness nodes
    if (node.type === 'witness') {
      this.enterWitness(playerId);
    }

    // Clear focus on move
    this.stopFocus(playerId);
  }

  private onDimensionShift(data: { from: DimensionType; to: DimensionType }): void {
    // Exit all witness modes on dimension shift
    for (const [playerId] of this.playerWitness) {
      this.exitWitness(playerId);
    }
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Get state for serialization
   */
  getState(): object {
    return {
      mechanics: Object.fromEntries(
        [...this.mechanics].map(([id, m]) => [id, {
          type: m.type,
          active: m.active,
          progress: m.progress,
          participants: [...m.participants]
        }])
      ),
      playerFocus: Object.fromEntries(
        [...this.playerFocus].map(([id, f]) => [id, f ? {
          type: f.type,
          id: f.id,
          duration: f.duration
        } : null])
      ),
      playerWitness: Object.fromEntries(
        [...this.playerWitness].map(([id, w]) => [id, {
          active: w.active,
          duration: w.duration,
          revealedNodes: [...w.revealedNodes]
        }])
      )
    };
  }

  /**
   * Restore state from serialization
   */
  restoreState(state: any): void {
    // Implementation for save/load
  }
}

// =============================================================================
// PUZZLE ELEMENT BEHAVIORS
// =============================================================================

export class PuzzleElementBehavior {
  /**
   * Origin node behavior - spawn point
   */
  static origin = {
    canEnter: () => false,  // Can't re-enter origin
    canLeave: () => true,
    onEnter: () => {},
    onLeave: () => {}
  };

  /**
   * Destination node behavior - victory point
   */
  static destination = {
    canEnter: (node: LevelNode) => !node.locked,
    canLeave: () => true,
    onEnter: () => {},
    onLeave: () => {}
  };

  /**
   * Waypoint node behavior - standard traversal
   */
  static waypoint = {
    canEnter: (node: LevelNode) => !node.locked,
    canLeave: () => true,
    onEnter: () => {},
    onLeave: () => {}
  };

  /**
   * Witness node behavior - auto-witness
   */
  static witness = {
    canEnter: () => true,
    canLeave: () => true,
    onEnter: (node: LevelNode, playerId: string, engine: PuzzleEngine) => {
      engine.enterWitness(playerId);
    },
    onLeave: (node: LevelNode, playerId: string, engine: PuzzleEngine) => {
      engine.exitWitness(playerId);
    }
  };

  /**
   * Switch node behavior - dimension shift
   */
  static switch = {
    canEnter: (node: LevelNode) => !node.locked,
    canLeave: () => true,
    onEnter: (node: LevelNode, playerId: string, engine: PuzzleEngine) => {
      engine.tryDimensionShift(playerId);
    },
    onLeave: () => {}
  };

  /**
   * Gate node behavior - locked until conditions met
   */
  static gate = {
    canEnter: (node: LevelNode) => !node.locked,
    canLeave: () => true,
    onEnter: () => {},
    onLeave: () => {}
  };

  /**
   * Mirror node behavior - cross-dimensional reflection
   */
  static mirror = {
    canEnter: () => true,
    canLeave: () => true,
    onEnter: () => {},
    onLeave: () => {}
  };

  /**
   * Void node behavior - sparse void navigation
   */
  static void = {
    canEnter: () => true,
    canLeave: () => true,
    onEnter: () => {},
    onLeave: () => {}
  };
}

// Get behavior for node type
export function getBehavior(type: LevelNode['type']): typeof PuzzleElementBehavior.waypoint {
  switch (type) {
    case 'origin': return PuzzleElementBehavior.origin;
    case 'destination': return PuzzleElementBehavior.destination;
    case 'witness': return PuzzleElementBehavior.witness;
    case 'switch': return PuzzleElementBehavior.switch;
    case 'gate': return PuzzleElementBehavior.gate;
    case 'mirror': return PuzzleElementBehavior.mirror;
    case 'void': return PuzzleElementBehavior.void;
    default: return PuzzleElementBehavior.waypoint;
  }
}
