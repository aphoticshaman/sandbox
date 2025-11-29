/**
 * Core Game Controller
 * Manages the game loop, rendering, and high-level state
 */

import * as THREE from 'three';
import { AwarenessController } from './AwarenessController';
import { DimensionManager } from './DimensionManager';
import { InputManager } from './InputManager';
import { AudioEngine } from '../audio/AudioEngine';
import { useGameStore } from '../stores/gameStore';
import { useMetaStore } from '../stores/metaStore';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private awareness: AwarenessController;
  private dimensions: DimensionManager;
  private input: InputManager;
  private audio: AudioEngine;

  private clock: THREE.Clock;
  private running: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // Initialize Three.js
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 1);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 10;

    // Core systems
    this.input = new InputManager(canvas);
    this.audio = new AudioEngine();
    this.awareness = new AwarenessController(this.camera, this.input);
    this.dimensions = new DimensionManager(this.scene, this.awareness, this.audio);

    // Handle resize
    window.addEventListener('orthogonal:resize', this.handleResize.bind(this));
  }

  async initialize(): Promise<void> {
    console.log('[Orthogonal] Initializing...');

    // Initialize audio (requires user interaction, but we prep it)
    await this.audio.initialize();

    // Initialize input
    this.input.initialize();

    // Load first dimension (THE VOID for tutorial opening)
    await this.dimensions.loadDimension('void');

    // Initialize stores
    useGameStore.getState().setPhase('tutorial');
    useMetaStore.getState().startSession();

    console.log('[Orthogonal] Initialized');
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.loop();
  }

  stop(): void {
    this.running = false;
  }

  private loop(): void {
    if (!this.running) return;

    requestAnimationFrame(this.loop.bind(this));

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Update systems
    this.input.update();
    this.awareness.update(delta);
    this.dimensions.update(delta, elapsed);
    this.audio.update(delta);

    // Update meta-awareness tracking
    useMetaStore.getState().update(delta * 1000);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Public API
  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.Camera {
    return this.camera;
  }

  getAwareness(): AwarenessController {
    return this.awareness;
  }

  getDimensions(): DimensionManager {
    return this.dimensions;
  }
}
