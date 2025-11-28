/**
 * Dimension Manager
 * Manages the three core dimensional layers and transitions between them
 *
 * THE LATTICE - Structure, logic, visible patterns
 * THE MARROW  - Emotion, intuition, hidden flows
 * THE VOID    - Pure potential, the space between
 *
 * Philosophy: Reality has layers. The player's awareness moves between them.
 * - Each dimension reveals different aspects of the same space
 * - Witness mode allows perception across dimensional boundaries
 * - Some puzzles require seeing multiple dimensions simultaneously
 * - Transitions are not instant - they are experiences
 */

import * as THREE from 'three';
import { AwarenessController } from './AwarenessController';
import { AudioEngine } from '../audio/AudioEngine';
import {
  GeneratedLevel,
  DimensionLayer,
  LevelNode,
  LevelEdge
} from '../level/ProceduralGenerator';
import {
  NodeGeometryGenerator,
  EdgeGeometryGenerator,
  EnvironmentGenerator,
  GeneratedGeometry
} from '../geometry/ProceduralGeometry';

// ========================================
// Dimension Types
// ========================================

export type DimensionType = 'LATTICE' | 'MARROW' | 'VOID';

export interface DimensionState {
  type: DimensionType;
  visibility: number;  // 0-1, how visible this dimension is
  active: boolean;     // Is this the primary dimension
}

export interface TransitionConfig {
  duration: number;    // Seconds
  curve: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut';
  visualEffect: 'fade' | 'dissolve' | 'fold' | 'shatter';
}

// ========================================
// Dimension Visual Configurations
// ========================================

const DIMENSION_CONFIGS: Record<DimensionType, {
  clearColor: number;
  fogColor: number;
  fogDensity: number;
  ambientLight: number;
  ambientIntensity: number;
  geometryStyle: 'crystalline' | 'organic' | 'void' | 'fractal';
}> = {
  LATTICE: {
    clearColor: 0x0a0a1a,
    fogColor: 0x0a0a1a,
    fogDensity: 0.015,
    ambientLight: 0x667eea,
    ambientIntensity: 0.3,
    geometryStyle: 'crystalline',
  },
  MARROW: {
    clearColor: 0x1a0a0a,
    fogColor: 0x1a0a0a,
    fogDensity: 0.02,
    ambientLight: 0xff6b6b,
    ambientIntensity: 0.4,
    geometryStyle: 'organic',
  },
  VOID: {
    clearColor: 0x000000,
    fogColor: 0x000000,
    fogDensity: 0.03,
    ambientLight: 0x2d3436,
    ambientIntensity: 0.1,
    geometryStyle: 'void',
  },
};

// ========================================
// Dimension Manager
// ========================================

export class DimensionManager {
  private scene: THREE.Scene;
  private awareness: AwarenessController;
  private audio: AudioEngine;

  // Current state
  private currentDimension: DimensionType = 'LATTICE';
  private dimensionStates: Map<DimensionType, DimensionState> = new Map();
  private transitionProgress: number = 0;
  private transitionTarget: DimensionType | null = null;
  private transitionConfig: TransitionConfig | null = null;

  // Level content
  private currentLevel: GeneratedLevel | null = null;
  private levelContent: Map<string, THREE.Object3D> = new Map();  // Layer ID -> content group
  private nodeGeometry: Map<string, GeneratedGeometry> = new Map();
  private edgeGeometry: Map<string, GeneratedGeometry> = new Map();

  // Generators
  private nodeGenerator: NodeGeometryGenerator | null = null;
  private edgeGenerator: EdgeGeometryGenerator | null = null;
  private envGenerator: EnvironmentGenerator | null = null;

  // Scene objects
  private ambientLight: THREE.AmbientLight;
  private fog: THREE.FogExp2;
  private backgrounds: Map<DimensionType, THREE.Group> = new Map();

  // Witness mode overlay
  private witnessOverlay: THREE.Group | null = null;
  private witnessActive: boolean = false;

  constructor(
    scene: THREE.Scene,
    awareness: AwarenessController,
    audio: AudioEngine
  ) {
    this.scene = scene;
    this.awareness = awareness;
    this.audio = audio;

    // Initialize dimension states
    for (const type of ['LATTICE', 'MARROW', 'VOID'] as DimensionType[]) {
      this.dimensionStates.set(type, {
        type,
        visibility: type === 'LATTICE' ? 1 : 0,
        active: type === 'LATTICE',
      });
    }

    // Scene setup
    this.ambientLight = new THREE.AmbientLight(0x667eea, 0.3);
    this.scene.add(this.ambientLight);

    this.fog = new THREE.FogExp2(0x0a0a1a, 0.015);
    this.scene.fog = this.fog;
  }

  // ========================================
  // Level Loading
  // ========================================

  async loadLevel(level: GeneratedLevel): Promise<void> {
    // Clear previous level
    this.unloadLevel();

    this.currentLevel = level;

    // Initialize generators with level seeds
    this.nodeGenerator = new NodeGeometryGenerator(level.parameters.geometrySeed);
    this.edgeGenerator = new EdgeGeometryGenerator(level.parameters.geometrySeed);
    this.envGenerator = new EnvironmentGenerator(level.parameters.patternSeed);

    // Build geometry for each layer
    for (const layer of level.layers) {
      await this.buildLayerContent(layer, level);
    }

    // Generate backgrounds for each dimension type
    for (const dimType of ['LATTICE', 'MARROW', 'VOID'] as DimensionType[]) {
      const config = DIMENSION_CONFIGS[dimType];
      const background = this.envGenerator.generateBackground({
        primaryColor: new THREE.Color(config.ambientLight),
        secondaryColor: new THREE.Color(config.fogColor),
        fogDensity: config.fogDensity,
        particleDensity: 1,
        geometryStyle: config.geometryStyle,
      });

      background.visible = dimType === this.currentDimension;
      this.backgrounds.set(dimType, background);
      this.scene.add(background);
    }

    // Set initial dimension
    this.setDimension('LATTICE', false);

    // Set interactable objects for awareness controller
    const interactables = this.getInteractableObjects();
    this.awareness.setInteractableObjects(interactables);

    // Add awareness visual to scene
    this.awareness.addToScene(this.scene);

    // Set spawn position
    this.awareness.setPosition(level.spawnPoint);

    console.log('[Dimension] Level loaded:', level.fingerprint.shortCode);
  }

  private async buildLayerContent(layer: DimensionLayer, level: GeneratedLevel): Promise<void> {
    const group = new THREE.Group();
    group.name = `layer-${layer.id}`;

    const style = this.getGeometryStyle(layer.type);

    // Build nodes in this layer
    for (const nodeId of layer.nodes) {
      const node = level.graph.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      const geometry = this.nodeGenerator!.generate(node, style);
      this.nodeGeometry.set(nodeId, geometry);

      group.add(geometry.mesh);
      if (geometry.outlineMesh) group.add(geometry.outlineMesh);
      if (geometry.particleSystem) group.add(geometry.particleSystem);

      // Store reference for interaction
      geometry.mesh.userData.nodeId = nodeId;
      geometry.mesh.userData.interactionType = 'node';
    }

    // Build edges connected to nodes in this layer
    for (const edge of level.graph.edges) {
      const fromNode = level.graph.nodes.find(n => n.id === edge.from);
      const toNode = level.graph.nodes.find(n => n.id === edge.to);

      if (!fromNode || !toNode) continue;

      // Only build if at least one endpoint is in this layer
      if (layer.nodes.includes(fromNode.id) || layer.nodes.includes(toNode.id)) {
        const geometry = this.edgeGenerator!.generate(
          edge,
          fromNode.position,
          toNode.position,
          style
        );
        this.edgeGeometry.set(edge.id, geometry);
        group.add(geometry.mesh);
      }
    }

    // Build portals
    for (const portal of level.graph.portals) {
      const portalMesh = this.createPortalMesh(portal);
      group.add(portalMesh);
    }

    // Initial visibility based on dimension
    group.visible = layer.type === this.currentDimension;

    this.levelContent.set(layer.id, group);
    this.scene.add(group);
  }

  private createPortalMesh(portal: any): THREE.Mesh {
    const geometry = new THREE.RingGeometry(0.8, 1.2, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(portal.position);
    mesh.userData.portalId = portal.id;
    mesh.userData.interactionType = 'portal';

    return mesh;
  }

  private getGeometryStyle(layerType: DimensionType): 'crystalline' | 'organic' | 'void' | 'fractal' {
    return DIMENSION_CONFIGS[layerType].geometryStyle;
  }

  private getInteractableObjects(): THREE.Object3D[] {
    const objects: THREE.Object3D[] = [];

    for (const [, geometry] of this.nodeGeometry) {
      if (geometry.mesh instanceof THREE.Group) {
        geometry.mesh.traverse(child => {
          if (child instanceof THREE.Mesh) {
            objects.push(child);
          }
        });
      } else {
        objects.push(geometry.mesh);
      }
    }

    return objects;
  }

  unloadLevel(): void {
    // Remove all level content
    for (const [, group] of this.levelContent) {
      this.scene.remove(group);
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    this.levelContent.clear();
    this.nodeGeometry.clear();
    this.edgeGeometry.clear();

    // Remove backgrounds
    for (const [, bg] of this.backgrounds) {
      this.scene.remove(bg);
    }
    this.backgrounds.clear();

    // Remove awareness visuals
    this.awareness.removeFromScene(this.scene);

    this.currentLevel = null;
  }

  // ========================================
  // Dimension Transitions
  // ========================================

  async transitionTo(
    target: DimensionType,
    config: Partial<TransitionConfig> = {}
  ): Promise<void> {

    if (target === this.currentDimension) return;
    if (this.transitionTarget) return;  // Already transitioning

    this.transitionTarget = target;
    this.transitionConfig = {
      duration: config.duration ?? 1.5,
      curve: config.curve ?? 'easeInOut',
      visualEffect: config.visualEffect ?? 'dissolve',
    };
    this.transitionProgress = 0;

    // Start audio transition
    this.audio.startDimensionTransition?.(this.currentDimension, target);

    console.log(`[Dimension] Transitioning: ${this.currentDimension} -> ${target}`);
  }

  private setDimension(type: DimensionType, animate: boolean = true): void {
    const config = DIMENSION_CONFIGS[type];

    if (animate) {
      // Animated transition handled by update
    } else {
      // Instant switch
      this.scene.background = new THREE.Color(config.clearColor);
      this.fog.color.setHex(config.fogColor);
      this.fog.density = config.fogDensity;
      this.ambientLight.color.setHex(config.ambientLight);
      this.ambientLight.intensity = config.ambientIntensity;
    }

    // Update layer visibility
    for (const [layerId, group] of this.levelContent) {
      const layer = this.currentLevel?.layers.find(l => l.id === layerId);
      if (layer) {
        group.visible = layer.type === type;
      }
    }

    // Update background visibility
    for (const [dimType, bg] of this.backgrounds) {
      bg.visible = dimType === type;
    }

    // Update dimension states
    for (const [dimType, state] of this.dimensionStates) {
      state.active = dimType === type;
      state.visibility = dimType === type ? 1 : 0;
    }

    this.currentDimension = type;
  }

  // ========================================
  // Witness Mode
  // ========================================

  private updateWitnessMode(witnessLevel: number): void {
    const isWitnessing = witnessLevel > 0.1;

    if (isWitnessing && !this.witnessActive) {
      this.activateWitnessMode();
    } else if (!isWitnessing && this.witnessActive) {
      this.deactivateWitnessMode();
    }

    if (this.witnessActive) {
      this.updateWitnessVisibility(witnessLevel);
    }
  }

  private activateWitnessMode(): void {
    this.witnessActive = true;

    // Create witness overlay - shows hints of other dimensions
    this.witnessOverlay = new THREE.Group();

    // Show faded versions of other dimension content
    for (const [layerId, group] of this.levelContent) {
      const layer = this.currentLevel?.layers.find(l => l.id === layerId);
      if (layer && layer.type !== this.currentDimension) {
        // Clone visible but very faded
        const clone = group.clone();
        clone.traverse(child => {
          if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshBasicMaterial;
            if (mat.clone) {
              child.material = mat.clone();
              (child.material as THREE.MeshBasicMaterial).transparent = true;
              (child.material as THREE.MeshBasicMaterial).opacity = 0;
            }
          }
        });
        this.witnessOverlay.add(clone);
      }
    }

    this.scene.add(this.witnessOverlay);
    console.log('[Dimension] Witness mode activated');
  }

  private deactivateWitnessMode(): void {
    this.witnessActive = false;

    if (this.witnessOverlay) {
      this.scene.remove(this.witnessOverlay);
      this.witnessOverlay = null;
    }

    console.log('[Dimension] Witness mode deactivated');
  }

  private updateWitnessVisibility(witnessLevel: number): void {
    if (!this.witnessOverlay) return;

    // Fade in other dimension content based on witness level
    const opacity = witnessLevel * 0.4;

    this.witnessOverlay.traverse(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        if (mat.opacity !== undefined) {
          mat.opacity = opacity;
        }
      }
    });
  }

  // ========================================
  // Update Loop
  // ========================================

  update(delta: number, elapsed: number): void {
    // Update transition
    if (this.transitionTarget && this.transitionConfig) {
      this.updateTransition(delta);
    }

    // Update witness mode based on awareness
    const witnessLevel = this.awareness.getWitnessLevel();
    this.updateWitnessMode(witnessLevel);

    // Animate geometry
    this.animateGeometry(delta, elapsed);

    // Update particle systems
    this.updateParticles(delta);
  }

  private updateTransition(delta: number): void {
    if (!this.transitionTarget || !this.transitionConfig) return;

    const { duration, curve } = this.transitionConfig;

    this.transitionProgress += delta / duration;

    if (this.transitionProgress >= 1) {
      // Complete transition
      this.transitionProgress = 1;
      this.setDimension(this.transitionTarget, false);

      this.transitionTarget = null;
      this.transitionConfig = null;

      console.log(`[Dimension] Transition complete: ${this.currentDimension}`);
      return;
    }

    // Apply easing
    const t = this.applyEasing(this.transitionProgress, curve);

    // Interpolate visual properties
    const fromConfig = DIMENSION_CONFIGS[this.currentDimension];
    const toConfig = DIMENSION_CONFIGS[this.transitionTarget];

    // Lerp colors
    const fromColor = new THREE.Color(fromConfig.clearColor);
    const toColor = new THREE.Color(toConfig.clearColor);
    const currentColor = fromColor.lerp(toColor, t);
    this.scene.background = currentColor;

    const fromFog = new THREE.Color(fromConfig.fogColor);
    const toFog = new THREE.Color(toConfig.fogColor);
    this.fog.color = fromFog.lerp(toFog, t);

    // Lerp fog density
    this.fog.density = fromConfig.fogDensity + (toConfig.fogDensity - fromConfig.fogDensity) * t;

    // Lerp ambient light
    const fromAmbient = new THREE.Color(fromConfig.ambientLight);
    const toAmbient = new THREE.Color(toConfig.ambientLight);
    this.ambientLight.color = fromAmbient.lerp(toAmbient, t);
    this.ambientLight.intensity =
      fromConfig.ambientIntensity + (toConfig.ambientIntensity - fromConfig.ambientIntensity) * t;

    // Cross-fade layers
    for (const [layerId, group] of this.levelContent) {
      const layer = this.currentLevel?.layers.find(l => l.id === layerId);
      if (!layer) continue;

      if (layer.type === this.currentDimension) {
        // Fade out
        this.setGroupOpacity(group, 1 - t);
        group.visible = t < 1;
      } else if (layer.type === this.transitionTarget) {
        // Fade in
        group.visible = true;
        this.setGroupOpacity(group, t);
      }
    }

    // Cross-fade backgrounds
    for (const [dimType, bg] of this.backgrounds) {
      if (dimType === this.currentDimension) {
        bg.visible = t < 1;
      } else if (dimType === this.transitionTarget) {
        bg.visible = true;
      }
    }
  }

  private setGroupOpacity(group: THREE.Object3D, opacity: number): void {
    group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.Material;
        if ('opacity' in mat) {
          (mat as any).opacity = opacity;
          (mat as any).transparent = opacity < 1;
        }
      }
    });
  }

  private applyEasing(t: number, curve: TransitionConfig['curve']): number {
    switch (curve) {
      case 'linear':
        return t;
      case 'ease':
      case 'easeInOut':
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      case 'easeIn':
        return t * t * t;
      case 'easeOut':
        return 1 - Math.pow(1 - t, 3);
      default:
        return t;
    }
  }

  private animateGeometry(delta: number, elapsed: number): void {
    for (const [, geometry] of this.nodeGeometry) {
      if (!geometry.animationData) continue;

      const { type, speed, amplitude, phase } = geometry.animationData;
      const mesh = geometry.mesh;

      switch (type) {
        case 'rotate':
          mesh.rotation.y = elapsed * speed + phase;
          mesh.rotation.x = Math.sin(elapsed * speed * 0.5 + phase) * 0.1;
          break;

        case 'pulse':
          const scale = 1 + Math.sin(elapsed * speed * Math.PI * 2 + phase) * amplitude;
          mesh.scale.setScalar(scale);
          break;

        case 'float':
          mesh.position.y += Math.sin(elapsed * speed + phase) * amplitude * delta;
          break;

        case 'morph':
          // Would require morph targets
          mesh.rotation.y = elapsed * speed * 0.5;
          break;
      }
    }
  }

  private updateParticles(delta: number): void {
    for (const [, geometry] of this.nodeGeometry) {
      if (!geometry.particleSystem) continue;

      const positions = geometry.particleSystem.geometry.getAttribute('position');
      const velocities = geometry.particleSystem.geometry.getAttribute('velocity');

      if (!positions || !velocities) continue;

      const center = geometry.mesh.position;

      for (let i = 0; i < positions.count; i++) {
        let x = positions.getX(i);
        let y = positions.getY(i);
        let z = positions.getZ(i);

        // Apply velocity
        x += velocities.getX(i) * delta;
        y += velocities.getY(i) * delta;
        z += velocities.getZ(i) * delta;

        // Pull toward center (void absorption)
        const dx = center.x - x;
        const dy = center.y - y;
        const dz = center.z - z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > 0.5) {
          x += dx / dist * delta * 0.5;
          y += dy / dist * delta * 0.5;
          z += dz / dist * delta * 0.5;
        } else {
          // Reset far away
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const r = 3 + Math.random() * 3;

          x = center.x + r * Math.sin(phi) * Math.cos(theta);
          y = center.y + r * Math.sin(phi) * Math.sin(theta);
          z = center.z + r * Math.cos(phi);
        }

        positions.setXYZ(i, x, y, z);
      }

      positions.needsUpdate = true;
    }
  }

  // ========================================
  // Public API
  // ========================================

  getCurrentDimension(): DimensionType {
    return this.currentDimension;
  }

  getDimensionState(type: DimensionType): DimensionState | undefined {
    return this.dimensionStates.get(type);
  }

  isTransitioning(): boolean {
    return this.transitionTarget !== null;
  }

  getTransitionProgress(): number {
    return this.transitionProgress;
  }

  getCurrentLevel(): GeneratedLevel | null {
    return this.currentLevel;
  }

  // Quick dimension loading for development
  async loadDimension(name: string): Promise<void> {
    // This would load predefined levels or generate based on name
    console.log(`[Dimension] Loading dimension: ${name}`);

    // For now, just set up empty scene
    this.setDimension('VOID', false);
  }
}
