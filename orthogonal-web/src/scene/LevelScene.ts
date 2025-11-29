/**
 * LevelScene.ts
 *
 * Connects level definitions to Three.js rendering
 * Creates the visual representation of playable levels
 */

import * as THREE from 'three';
import { PlayableLevel, LevelNode, LevelEdge, levelLoader, LevelRuntime } from '../level/LevelLoader';
import { DimensionType } from '../core/DimensionManager';
import { ShaderPipeline, NodeShaders, EdgeShaders } from '../shaders/ShaderPipeline';
import { PuzzleEngine } from '../puzzle/PuzzleMechanics';
import { AudioEngine } from '../audio/AudioEngine';
import { ReplayRecorder } from '../replay/ReplaySystem';
import { metaAwareness } from '../meta/MetaAwareness';
import { achievementSystem } from '../achievements/AchievementSystem';
import { analytics } from '../analytics/Analytics';

// =============================================================================
// TYPES
// =============================================================================

export interface NodeMesh {
  node: LevelNode;
  mesh: THREE.Mesh;
  outline: THREE.Mesh;
  label?: THREE.Sprite;
  particles?: THREE.Points;
}

export interface EdgeMesh {
  edge: LevelEdge;
  line: THREE.Line;
  particles?: THREE.Points;
}

export interface LevelSceneConfig {
  antialias: boolean;
  shadows: boolean;
  postProcessing: boolean;
  particleCount: number;
}

// =============================================================================
// LEVEL SCENE
// =============================================================================

export class LevelScene {
  // Three.js
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Systems
  private shaderPipeline: ShaderPipeline;
  private audioEngine: AudioEngine;
  private puzzleEngine: PuzzleEngine | null = null;
  private runtime: LevelRuntime | null = null;
  private recorder: ReplayRecorder;

  // Level
  private level: PlayableLevel | null = null;
  private nodeMeshes: Map<string, NodeMesh> = new Map();
  private edgeMeshes: Map<string, EdgeMesh> = new Map();

  // Groups
  private nodeGroup: THREE.Group;
  private edgeGroup: THREE.Group;
  private particleGroup: THREE.Group;
  private environmentGroup: THREE.Group;

  // State
  private time: number = 0;
  private config: LevelSceneConfig;
  private currentPlayerId: string = 'local_player';
  private playerPosition: THREE.Vector3 = new THREE.Vector3();

  // Materials (cached)
  private nodeMaterials: Map<string, THREE.ShaderMaterial> = new Map();
  private edgeMaterials: Map<string, THREE.ShaderMaterial> = new Map();

  constructor(canvas: HTMLCanvasElement, config: Partial<LevelSceneConfig> = {}) {
    this.config = {
      antialias: true,
      shadows: false,
      postProcessing: true,
      particleCount: 1000,
      ...config
    };

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 20);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.config.antialias,
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.width, canvas.height);

    // Groups
    this.nodeGroup = new THREE.Group();
    this.edgeGroup = new THREE.Group();
    this.particleGroup = new THREE.Group();
    this.environmentGroup = new THREE.Group();

    this.scene.add(this.environmentGroup);
    this.scene.add(this.edgeGroup);
    this.scene.add(this.nodeGroup);
    this.scene.add(this.particleGroup);

    // Systems
    this.shaderPipeline = new ShaderPipeline(this.renderer, this.scene, this.camera);
    this.audioEngine = new AudioEngine();
    this.recorder = new ReplayRecorder();

    // Lighting
    this.setupLighting();

    // Materials
    this.createMaterials();
  }

  // ===========================================================================
  // SETUP
  // ===========================================================================

  private setupLighting(): void {
    // Ambient
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);

    // Point lights for dimension-specific colors
    const latticeLight = new THREE.PointLight(0x4488ff, 1, 50);
    latticeLight.position.set(0, 10, 10);
    this.scene.add(latticeLight);

    const marrowLight = new THREE.PointLight(0xff8844, 0.5, 50);
    marrowLight.position.set(-10, -5, 5);
    this.scene.add(marrowLight);
  }

  private createMaterials(): void {
    // Node materials by type
    const nodeTypes = ['origin', 'destination', 'waypoint', 'witness', 'switch', 'gate', 'mirror', 'void'];

    for (const type of nodeTypes) {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0xffffff) },
          opacity: { value: 1 },
          active: { value: 0 },
          locked: { value: 0 },
          chargeProgress: { value: 0 },
          pulse: { value: 0 }
        },
        vertexShader: type === 'void' ? NodeShaders.void.vertexShader : NodeShaders.base.vertexShader,
        fragmentShader: type === 'void' ? NodeShaders.void.fragmentShader : NodeShaders.base.fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
      });

      this.nodeMaterials.set(type, material);
    }

    // Edge materials
    const edgeTypes = ['solid', 'dashed', 'hidden', 'one-way', 'timed', 'witness-only'];

    for (const type of edgeTypes) {
      const isHidden = type === 'hidden' || type === 'witness-only';

      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xffffff) },
          opacity: { value: isHidden ? 0 : 1 },
          time: { value: 0 },
          flowSpeed: { value: 0.5 },
          dashed: { value: type === 'dashed' ? 1 : 0 },
          revealProgress: { value: 0 }
        },
        vertexShader: isHidden ? EdgeShaders.hidden.vertexShader : EdgeShaders.base.vertexShader,
        fragmentShader: isHidden ? EdgeShaders.hidden.fragmentShader : EdgeShaders.base.fragmentShader,
        transparent: true
      });

      this.edgeMaterials.set(type, material);
    }
  }

  // ===========================================================================
  // LEVEL LOADING
  // ===========================================================================

  /**
   * Load a level by ID
   */
  loadLevel(levelId: string): boolean {
    const level = levelLoader.loadById(levelId);
    if (!level) return false;

    this.setLevel(level);
    return true;
  }

  /**
   * Load a level by chapter
   */
  loadChapter(chapter: number): boolean {
    const level = levelLoader.loadByChapter(chapter);
    if (!level) return false;

    this.setLevel(level);
    return true;
  }

  /**
   * Set the level to render
   */
  private setLevel(level: PlayableLevel): void {
    this.clearLevel();

    this.level = level;
    this.runtime = new LevelRuntime(level);
    this.puzzleEngine = new PuzzleEngine(this.runtime);

    // Create visual representation
    this.createNodes();
    this.createEdges();
    this.createEnvironment();

    // Set dimension
    this.shaderPipeline.setDimension(level.activeDimension);
    this.audioEngine.setDimension(level.activeDimension);

    // Setup event listeners
    this.setupLevelEvents();

    // Start recording
    this.recorder.start(
      level.id,
      level.seed,
      this.currentPlayerId,
      'Player'  // Should come from save system
    );

    // Track analytics
    analytics.trackLevelStart(level.id, level.seed);

    // Start runtime
    this.runtime.start();
  }

  /**
   * Clear current level
   */
  private clearLevel(): void {
    // Stop recording
    if (this.recorder.isRecording()) {
      this.recorder.stop();
    }

    // Clear meshes
    for (const nodeMesh of this.nodeMeshes.values()) {
      this.nodeGroup.remove(nodeMesh.mesh);
      if (nodeMesh.outline) this.nodeGroup.remove(nodeMesh.outline);
      if (nodeMesh.label) this.nodeGroup.remove(nodeMesh.label);
    }
    this.nodeMeshes.clear();

    for (const edgeMesh of this.edgeMeshes.values()) {
      this.edgeGroup.remove(edgeMesh.line);
    }
    this.edgeMeshes.clear();

    // Clear environment
    while (this.environmentGroup.children.length > 0) {
      this.environmentGroup.remove(this.environmentGroup.children[0]);
    }

    this.level = null;
    this.runtime = null;
    this.puzzleEngine = null;
  }

  // ===========================================================================
  // NODE CREATION
  // ===========================================================================

  private createNodes(): void {
    if (!this.level) return;

    for (const node of this.level.nodes.values()) {
      this.createNodeMesh(node);
    }
  }

  private createNodeMesh(node: LevelNode): void {
    // Geometry based on node type
    let geometry: THREE.BufferGeometry;

    switch (node.type) {
      case 'origin':
        geometry = new THREE.OctahedronGeometry(0.5, 0);
        break;
      case 'destination':
        geometry = new THREE.IcosahedronGeometry(0.6, 1);
        break;
      case 'witness':
        geometry = new THREE.TorusGeometry(0.4, 0.15, 8, 24);
        break;
      case 'switch':
        geometry = new THREE.ConeGeometry(0.4, 0.8, 6);
        break;
      case 'gate':
        geometry = new THREE.BoxGeometry(0.8, 0.8, 0.2);
        break;
      case 'mirror':
        geometry = new THREE.PlaneGeometry(0.8, 1.2, 1, 1);
        break;
      case 'void':
        geometry = new THREE.SphereGeometry(0.4, 16, 12);
        break;
      default:
        geometry = new THREE.SphereGeometry(0.3, 16, 12);
    }

    // Material
    const material = this.nodeMaterials.get(node.type)?.clone() ||
                     this.nodeMaterials.get('waypoint')!.clone();

    material.uniforms.color.value.copy(node.color);
    material.uniforms.pulse.value = node.pulseRate > 0 ? 1 : 0;

    // Mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(node.position);
    mesh.userData = { nodeId: node.id };

    // Outline for selection
    const outlineGeo = geometry.clone();
    outlineGeo.scale(1.1, 1.1, 1.1);
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide
    });
    const outline = new THREE.Mesh(outlineGeo, outlineMat);
    outline.position.copy(node.position);

    // Label sprite
    let label: THREE.Sprite | undefined;
    if (node.label) {
      label = this.createLabelSprite(node.label);
      label.position.copy(node.position);
      label.position.y += 1;
      this.nodeGroup.add(label);
    }

    // Add to scene
    this.nodeGroup.add(mesh);
    this.nodeGroup.add(outline);

    // Store reference
    this.nodeMeshes.set(node.id, { node, mesh, outline, label });

    // Initial visibility based on dimension
    this.updateNodeVisibility(node.id);
  }

  private createLabelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '24px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);

    return sprite;
  }

  // ===========================================================================
  // EDGE CREATION
  // ===========================================================================

  private createEdges(): void {
    if (!this.level) return;

    for (const edge of this.level.edges.values()) {
      this.createEdgeMesh(edge);
    }
  }

  private createEdgeMesh(edge: LevelEdge): void {
    const fromNode = this.level?.nodes.get(edge.from);
    const toNode = this.level?.nodes.get(edge.to);
    if (!fromNode || !toNode) return;

    // Create curve between nodes
    const midPoint = new THREE.Vector3()
      .addVectors(fromNode.position, toNode.position)
      .multiplyScalar(0.5);

    // Add some curve offset
    const offset = new THREE.Vector3(0, 0.5, 0);
    midPoint.add(offset);

    const curve = new THREE.QuadraticBezierCurve3(
      fromNode.position,
      midPoint,
      toNode.position
    );

    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Add progress attribute for flow animation
    const progress = new Float32Array(points.length);
    for (let i = 0; i < points.length; i++) {
      progress[i] = i / (points.length - 1);
    }
    geometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1));

    // Material
    const material = this.edgeMaterials.get(edge.type)?.clone() ||
                     this.edgeMaterials.get('solid')!.clone();

    material.uniforms.color.value.copy(edge.color);
    material.uniforms.opacity.value = edge.opacity;

    // Line
    const line = new THREE.Line(geometry, material);
    line.userData = { edgeId: edge.id };

    this.edgeGroup.add(line);
    this.edgeMeshes.set(edge.id, { edge, line });

    // Initial visibility
    this.updateEdgeVisibility(edge.id);
  }

  // ===========================================================================
  // ENVIRONMENT
  // ===========================================================================

  private createEnvironment(): void {
    if (!this.level) return;

    // Create dimension-specific background
    switch (this.level.activeDimension) {
      case 'LATTICE':
        this.createLatticeEnvironment();
        break;
      case 'MARROW':
        this.createMarrowEnvironment();
        break;
      case 'VOID':
        this.createVoidEnvironment();
        break;
    }
  }

  private createLatticeEnvironment(): void {
    // Grid lines
    const gridHelper = new THREE.GridHelper(50, 50, 0x222244, 0x111122);
    gridHelper.position.y = -5;
    this.environmentGroup.add(gridHelper);

    // Floating particles
    const particleCount = this.config.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x4488ff,
      size: 0.05,
      transparent: true,
      opacity: 0.5
    });

    const particles = new THREE.Points(geometry, material);
    this.particleGroup.add(particles);
  }

  private createMarrowEnvironment(): void {
    // Organic flowing lines
    for (let i = 0; i < 20; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40
        ),
        new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40
        ),
        new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40
        )
      ]);

      const geometry = new THREE.TubeGeometry(curve, 20, 0.02, 8, false);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff6644,
        transparent: true,
        opacity: 0.2
      });

      const tube = new THREE.Mesh(geometry, material);
      this.environmentGroup.add(tube);
    }
  }

  private createVoidEnvironment(): void {
    // Sparse, eerie points
    const particleCount = this.config.particleCount / 10;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x8800ff,
      size: 0.1,
      transparent: true,
      opacity: 0.3
    });

    const particles = new THREE.Points(geometry, material);
    this.particleGroup.add(particles);
  }

  // ===========================================================================
  // VISIBILITY
  // ===========================================================================

  private updateNodeVisibility(nodeId: string): void {
    const nodeMesh = this.nodeMeshes.get(nodeId);
    if (!nodeMesh || !this.level) return;

    const node = nodeMesh.node;

    // Check if hidden in current dimension
    const isHidden = node.hiddenIn.includes(this.level.activeDimension);

    // Check if in correct dimension
    const isInDimension = node.dimension === this.level.activeDimension;

    // Combine visibility
    const visible = !isHidden && isInDimension;

    nodeMesh.mesh.visible = visible;
    nodeMesh.outline.visible = visible;
    if (nodeMesh.label) nodeMesh.label.visible = visible;
  }

  private updateEdgeVisibility(edgeId: string): void {
    const edgeMesh = this.edgeMeshes.get(edgeId);
    if (!edgeMesh || !this.level) return;

    const edge = edgeMesh.edge;

    // Check if in correct dimension
    const isInDimension = edge.dimension === this.level.activeDimension;

    edgeMesh.line.visible = isInDimension && edge.visible;
  }

  // ===========================================================================
  // EVENTS
  // ===========================================================================

  private setupLevelEvents(): void {
    if (!this.runtime) return;

    this.runtime.on('node-activate', ({ nodeId }) => {
      const nodeMesh = this.nodeMeshes.get(nodeId);
      if (nodeMesh) {
        const material = nodeMesh.mesh.material as THREE.ShaderMaterial;
        material.uniforms.active.value = 1;
      }
      this.audioEngine.playSound('nodeActivate');
    });

    this.runtime.on('node-unlock', ({ nodeId }) => {
      const nodeMesh = this.nodeMeshes.get(nodeId);
      if (nodeMesh) {
        const material = nodeMesh.mesh.material as THREE.ShaderMaterial;
        material.uniforms.locked.value = 0;
      }
      this.audioEngine.playSound('uiConfirm');
    });

    this.runtime.on('dimension-shift', ({ from, to }) => {
      this.shaderPipeline.startTransition(from, to);
      this.audioEngine.setDimension(to);
      achievementSystem.trackDimensionVisit(to);

      // Update all visibilities
      for (const nodeId of this.nodeMeshes.keys()) {
        this.updateNodeVisibility(nodeId);
      }
      for (const edgeId of this.edgeMeshes.keys()) {
        this.updateEdgeVisibility(edgeId);
      }

      // Recreate environment
      while (this.environmentGroup.children.length > 0) {
        this.environmentGroup.remove(this.environmentGroup.children[0]);
      }
      while (this.particleGroup.children.length > 0) {
        this.particleGroup.remove(this.particleGroup.children[0]);
      }
      this.createEnvironment();
    });

    this.runtime.on('reveal', ({ type, id }) => {
      if (type === 'node') {
        this.updateNodeVisibility(id);
      } else if (type === 'edge') {
        this.updateEdgeVisibility(id);
      }
    });

    this.runtime.on('level-complete', (data) => {
      this.onLevelComplete(data);
    });

    this.runtime.on('player-move', ({ playerId, to }) => {
      if (playerId === this.currentPlayerId) {
        const node = this.level?.nodes.get(to);
        if (node) {
          this.playerPosition.copy(node.position);
        }
      }
      this.recorder.recordEvent('node_enter', { nodeId: to });
    });
  }

  private onLevelComplete(data: {
    time: number;
    nodesVisited: number;
    backtrackCount: number;
    witnessTime: number;
  }): void {
    if (!this.level) return;

    // Stop recording
    const replay = this.recorder.stop(data.time, data.nodesVisited);

    // Track achievements
    achievementSystem.trackLevelComplete(
      this.level.id,
      100, // mastery calculation would go here
      data.time,
      data.backtrackCount > 0
    );

    // Track analytics
    analytics.trackLevelComplete(
      this.level.id,
      data.time,
      100,
      0,
      data.backtrackCount
    );

    // Audio feedback
    this.audioEngine.playSound('uiConfirm');
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  /**
   * Update the scene
   */
  update(deltaTime: number): void {
    this.time += deltaTime;

    // Update runtime
    this.runtime?.update(deltaTime);

    // Update puzzle engine
    this.puzzleEngine?.update(this.time);

    // Update shader uniforms
    for (const nodeMesh of this.nodeMeshes.values()) {
      const material = nodeMesh.mesh.material as THREE.ShaderMaterial;
      material.uniforms.time.value = this.time / 1000;
      material.uniforms.chargeProgress.value = nodeMesh.node.chargeProgress;
    }

    for (const edgeMesh of this.edgeMeshes.values()) {
      const material = edgeMesh.line.material as THREE.ShaderMaterial;
      material.uniforms.time.value = this.time / 1000;
    }

    // Update shader pipeline
    this.shaderPipeline.update(deltaTime);

    // Update audio
    this.audioEngine.update(this.time, this.playerPosition);

    // Update meta-awareness
    metaAwareness.update(deltaTime);

    // Record frame
    if (this.recorder.isRecording() && this.level) {
      this.recorder.update({
        position: this.playerPosition,
        currentNode: this.level.currentPlayerPositions.get(this.currentPlayerId) || '',
        dimension: this.level.activeDimension,
        witnessing: this.puzzleEngine?.isWitnessing(this.currentPlayerId) || false
      });
    }
  }

  /**
   * Render the scene
   */
  render(): void {
    if (this.config.postProcessing) {
      this.shaderPipeline.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // ===========================================================================
  // CAMERA
  // ===========================================================================

  /**
   * Set camera position
   */
  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  /**
   * Look at position
   */
  lookAt(x: number, y: number, z: number): void {
    this.camera.lookAt(x, y, z);
  }

  /**
   * Follow player smoothly
   */
  followPlayer(speed: number = 0.1): void {
    const target = this.playerPosition.clone();
    target.z += 15;  // Camera offset

    this.camera.position.lerp(target, speed);
    this.camera.lookAt(this.playerPosition);
  }

  // ===========================================================================
  // RESIZE
  // ===========================================================================

  /**
   * Handle resize
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.shaderPipeline.resize(width, height);
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getLevel(): PlayableLevel | null {
    return this.level;
  }

  getRuntime(): LevelRuntime | null {
    return this.runtime;
  }

  getPuzzleEngine(): PuzzleEngine | null {
    return this.puzzleEngine;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.clearLevel();
    this.shaderPipeline.dispose();
    this.audioEngine.dispose();
    this.renderer.dispose();
  }
}
