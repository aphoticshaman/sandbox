/**
 * Awareness Controller
 * The player IS attention. Movement = attention shift.
 * No avatar, no body. Just where you focus.
 */

import * as THREE from 'three';
import { InputManager } from './InputManager';
import { useMetaStore } from '../stores/metaStore';

export interface AttentionTarget {
  object: THREE.Object3D;
  point: THREE.Vector3;
  distance: number;
  type: 'node' | 'edge' | 'portal' | 'fragment' | 'void';
}

export class AwarenessController {
  private camera: THREE.PerspectiveCamera;
  private input: InputManager;

  // Current state
  private position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private targetPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Attention
  private attentionRay: THREE.Raycaster = new THREE.Raycaster();
  private attentionDirection: THREE.Vector2 = new THREE.Vector2(0, 0);
  private currentTarget: AttentionTarget | null = null;
  private focusedTarget: AttentionTarget | null = null;
  private focusProgress: number = 0;

  // Witness mode
  private witnessActive: boolean = false;
  private witnessLevel: number = 0;
  private readonly WITNESS_RISE_RATE = 0.5;  // Per second
  private readonly WITNESS_FALL_RATE = 1.0;

  // Movement
  private readonly MOVE_SPEED = 3.0;
  private readonly MOVE_DAMPING = 0.92;
  private readonly FOCUS_DURATION = 0.5;  // Seconds to focus before traverse

  // Visual representation (the attention point)
  private attentionPoint: THREE.Mesh;
  private attentionTrail: THREE.Points;
  private trailPositions: Float32Array;
  private trailIndex: number = 0;

  // Interaction tracking
  private interactableObjects: THREE.Object3D[] = [];

  constructor(camera: THREE.PerspectiveCamera, input: InputManager) {
    this.camera = camera;
    this.input = input;

    // Create attention point visual
    this.attentionPoint = this.createAttentionPoint();

    // Create trail
    const trailCount = 50;
    this.trailPositions = new Float32Array(trailCount * 3);
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    const trailMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
    });
    this.attentionTrail = new THREE.Points(trailGeometry, trailMaterial);
  }

  private createAttentionPoint(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    return new THREE.Mesh(geometry, material);
  }

  update(delta: number): void {
    // Update attention direction from input
    this.updateAttentionDirection();

    // Update witness mode
    this.updateWitnessMode(delta);

    // Cast attention ray
    this.updateAttentionRay();

    // Update focus progress if focusing
    this.updateFocus(delta);

    // Update position (smooth follow of target)
    this.updatePosition(delta);

    // Update visuals
    this.updateVisuals(delta);

    // Update camera to follow attention point
    this.updateCamera(delta);

    // Report to meta-awareness
    if (this.witnessActive && this.currentTarget) {
      useMetaStore.getState().onWitness(
        { id: this.currentTarget.object.uuid, type: this.currentTarget.type },
        delta
      );
    }
  }

  private updateAttentionDirection(): void {
    // Get normalized mouse/touch position
    const pointer = this.input.getPointer();
    this.attentionDirection.set(pointer.x, pointer.y);
  }

  private updateWitnessMode(delta: number): void {
    const witnessing = this.input.isWitnessing();

    if (witnessing) {
      this.witnessActive = true;
      this.witnessLevel = Math.min(1, this.witnessLevel + this.WITNESS_RISE_RATE * delta);
    } else {
      this.witnessLevel = Math.max(0, this.witnessLevel - this.WITNESS_FALL_RATE * delta);
      if (this.witnessLevel === 0) {
        this.witnessActive = false;
      }
    }

    // Update meta store
    useMetaStore.getState().engageWitness(witnessing);
  }

  private updateAttentionRay(): void {
    // Set up raycaster from camera through attention direction
    this.attentionRay.setFromCamera(this.attentionDirection, this.camera);

    // Find intersections with interactable objects
    const intersects = this.attentionRay.intersectObjects(this.interactableObjects, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const userData = hit.object.userData;

      this.currentTarget = {
        object: hit.object,
        point: hit.point,
        distance: hit.distance,
        type: userData.interactionType || 'node',
      };
    } else {
      this.currentTarget = null;
    }
  }

  private updateFocus(delta: number): void {
    const focusing = this.input.isFocusing();

    if (focusing && this.currentTarget && !this.witnessActive) {
      // Can't focus while witnessing (witness = observe, not interact)
      if (this.focusedTarget?.object !== this.currentTarget.object) {
        // New target
        this.focusedTarget = this.currentTarget;
        this.focusProgress = 0;
      }

      this.focusProgress += delta / this.FOCUS_DURATION;

      if (this.focusProgress >= 1) {
        // Focus complete - traverse!
        this.traverseTo(this.focusedTarget);
        this.focusProgress = 0;
        this.focusedTarget = null;
      }
    } else {
      // Not focusing, reset
      this.focusProgress = 0;
      if (!focusing) {
        this.focusedTarget = null;
      }
    }
  }

  private traverseTo(target: AttentionTarget): void {
    if (target.type === 'node' || target.type === 'portal') {
      // Set target position to node position
      this.targetPosition.copy(target.object.position);

      // Emit event
      const event = new CustomEvent('orthogonal:traverse', {
        detail: { target, from: this.position.clone() },
      });
      window.dispatchEvent(event);
    }
  }

  private updatePosition(delta: number): void {
    // Smooth movement toward target
    const direction = new THREE.Vector3()
      .subVectors(this.targetPosition, this.position);

    const distance = direction.length();

    if (distance > 0.01) {
      direction.normalize();
      const speed = Math.min(this.MOVE_SPEED * delta, distance);
      this.velocity.add(direction.multiplyScalar(speed));
    }

    // Apply velocity
    this.position.add(this.velocity);

    // Damping
    this.velocity.multiplyScalar(this.MOVE_DAMPING);

    // Update attention point position
    this.attentionPoint.position.copy(this.position);
  }

  private updateVisuals(delta: number): void {
    // Update attention point size based on witness level
    const baseScale = 1;
    const witnessScale = 1 + this.witnessLevel * 0.5;
    this.attentionPoint.scale.setScalar(baseScale * witnessScale);

    // Update attention point color based on state
    const material = this.attentionPoint.material as THREE.MeshBasicMaterial;
    if (this.witnessActive) {
      material.color.setHex(0x00ffff);  // Cyan when witnessing
    } else if (this.focusProgress > 0) {
      material.color.setHex(0xffff00);  // Yellow when focusing
    } else {
      material.color.setHex(0xffffff);  // White default
    }

    // Update trail
    this.updateTrail();

    // Focus indicator
    if (this.focusedTarget && this.focusProgress > 0) {
      // Could add a visual indicator between attention point and target
    }
  }

  private updateTrail(): void {
    // Add current position to trail
    const i = this.trailIndex * 3;
    this.trailPositions[i] = this.position.x;
    this.trailPositions[i + 1] = this.position.y;
    this.trailPositions[i + 2] = this.position.z;

    this.trailIndex = (this.trailIndex + 1) % (this.trailPositions.length / 3);

    // Mark for update
    const attr = this.attentionTrail.geometry.getAttribute('position');
    attr.needsUpdate = true;
  }

  private updateCamera(delta: number): void {
    // Camera follows attention point with offset
    const cameraOffset = new THREE.Vector3(0, 0, 10);
    const targetCameraPos = this.position.clone().add(cameraOffset);

    this.camera.position.lerp(targetCameraPos, 0.05);
    this.camera.lookAt(this.position);
  }

  // Public API

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getTargetPosition(): THREE.Vector3 {
    return this.targetPosition.clone();
  }

  getWitnessLevel(): number {
    return this.witnessLevel;
  }

  isWitnessing(): boolean {
    return this.witnessActive;
  }

  getCurrentTarget(): AttentionTarget | null {
    return this.currentTarget;
  }

  getFocusProgress(): number {
    return this.focusProgress;
  }

  setInteractableObjects(objects: THREE.Object3D[]): void {
    this.interactableObjects = objects;
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.attentionPoint);
    scene.add(this.attentionTrail);
  }

  removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.attentionPoint);
    scene.remove(this.attentionTrail);
  }

  // Teleport without animation (for level loads)
  setPosition(pos: THREE.Vector3): void {
    this.position.copy(pos);
    this.targetPosition.copy(pos);
    this.velocity.set(0, 0, 0);
  }
}
