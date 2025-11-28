/**
 * Procedural Geometry System
 * Generates unique 3D structures for nodes, edges, and dimensions
 *
 * Philosophy: No pre-made assets. Everything emerges from mathematics.
 * - Nodes are crystalline structures, organic growths, or void anomalies
 * - Edges are flowing connections that breathe with the level
 * - Fractals create infinite detail at any zoom level
 * - Each geometry type matches its dimensional layer
 */

import * as THREE from 'three';
import { SeededRandom } from '../level/ProceduralGenerator';
import { LevelNode, LevelEdge, DimensionLayer, LayerStyle } from '../level/ProceduralGenerator';

// ========================================
// Geometry Types
// ========================================

export type GeometryStyle = 'crystalline' | 'organic' | 'void' | 'fractal';

export interface GeneratedGeometry {
  mesh: THREE.Mesh | THREE.Group;
  outlineMesh?: THREE.LineSegments;
  particleSystem?: THREE.Points;
  animationData?: AnimationData;
}

export interface AnimationData {
  type: 'rotate' | 'pulse' | 'float' | 'morph' | 'dissolve';
  speed: number;
  amplitude: number;
  phase: number;
}

// ========================================
// Node Geometry Generator
// ========================================

export class NodeGeometryGenerator {
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  generate(node: LevelNode, style: GeometryStyle): GeneratedGeometry {
    switch (style) {
      case 'crystalline':
        return this.generateCrystalline(node);
      case 'organic':
        return this.generateOrganic(node);
      case 'void':
        return this.generateVoid(node);
      case 'fractal':
        return this.generateFractal(node);
      default:
        return this.generateCrystalline(node);
    }
  }

  private generateCrystalline(node: LevelNode): GeneratedGeometry {
    const group = new THREE.Group();

    // Main crystal body
    const crystalGeo = this.createCrystalGeometry(node.radius);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: this.getNodeColor(node.type),
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    group.add(crystal);

    // Inner glow
    const glowGeo = new THREE.IcosahedronGeometry(node.radius * 0.6, 1);
    const glowMat = new THREE.MeshBasicMaterial({
      color: this.getNodeColor(node.type),
      transparent: true,
      opacity: 0.4,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    // Floating shards
    for (let i = 0; i < 5; i++) {
      const shardGeo = this.createShardGeometry(node.radius * 0.2);
      const shardMat = crystalMat.clone();
      shardMat.opacity = 0.6;

      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = (i / 5) * Math.PI * 2;
      const distance = node.radius * 1.5;
      shard.position.set(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        this.rng.range(-0.5, 0.5)
      );
      shard.rotation.set(
        this.rng.range(0, Math.PI),
        this.rng.range(0, Math.PI),
        this.rng.range(0, Math.PI)
      );
      group.add(shard);
    }

    group.position.copy(node.position);

    // Outline for wireframe effect
    const outlineGeo = new THREE.EdgesGeometry(crystalGeo, 15);
    const outlineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const outline = new THREE.LineSegments(outlineGeo, outlineMat);
    outline.position.copy(node.position);

    return {
      mesh: group,
      outlineMesh: outline,
      animationData: {
        type: 'rotate',
        speed: 0.2 + this.rng.next() * 0.3,
        amplitude: 1,
        phase: this.rng.next() * Math.PI * 2,
      },
    };
  }

  private createCrystalGeometry(radius: number): THREE.BufferGeometry {
    // Elongated octahedron shape
    const vertices = new Float32Array([
      // Top point
      0, radius * 1.5, 0,
      // Middle ring
      radius, 0, 0,
      0, 0, radius,
      -radius, 0, 0,
      0, 0, -radius,
      // Bottom point
      0, -radius * 1.5, 0,
    ]);

    const indices = [
      0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1,
      5, 2, 1, 5, 3, 2, 5, 4, 3, 5, 1, 4,
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private createShardGeometry(size: number): THREE.BufferGeometry {
    const vertices = new Float32Array([
      0, size, 0,
      size * 0.5, 0, size * 0.3,
      -size * 0.3, 0, size * 0.5,
      0, -size * 0.5, 0,
    ]);

    const indices = [0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private generateOrganic(node: LevelNode): GeneratedGeometry {
    const group = new THREE.Group();

    // Blob-like organic shape using displaced sphere
    const geometry = new THREE.IcosahedronGeometry(node.radius, 4);
    const positions = geometry.getAttribute('position');

    // Apply noise displacement
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      const noise = this.simplex3D(x * 2, y * 2, z * 2) * 0.3;
      const len = Math.sqrt(x * x + y * y + z * z);
      const factor = 1 + noise;

      positions.setX(i, x * factor);
      positions.setY(i, y * factor);
      positions.setZ(i, z * factor);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: this.getNodeColor(node.type),
      metalness: 0.1,
      roughness: 0.8,
      transparent: true,
      opacity: 0.85,
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Tendrils
    for (let i = 0; i < 3; i++) {
      const tendril = this.createTendril(node.radius);
      tendril.rotation.set(
        this.rng.range(-0.5, 0.5),
        this.rng.range(0, Math.PI * 2),
        0
      );
      group.add(tendril);
    }

    group.position.copy(node.position);

    return {
      mesh: group,
      animationData: {
        type: 'pulse',
        speed: 0.5 + this.rng.next() * 0.5,
        amplitude: 0.1,
        phase: this.rng.next() * Math.PI * 2,
      },
    };
  }

  private createTendril(baseRadius: number): THREE.Mesh {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(this.rng.range(-1, 1), baseRadius * 0.5, this.rng.range(-1, 1)),
      new THREE.Vector3(this.rng.range(-2, 2), baseRadius * 1, this.rng.range(-2, 2)),
      new THREE.Vector3(this.rng.range(-3, 3), baseRadius * 1.5, this.rng.range(-3, 3)),
    ]);

    const geometry = new THREE.TubeGeometry(curve, 20, baseRadius * 0.1, 8, false);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      metalness: 0.1,
      roughness: 0.8,
    });

    return new THREE.Mesh(geometry, material);
  }

  private generateVoid(node: LevelNode): GeneratedGeometry {
    const group = new THREE.Group();

    // Inverted sphere (appears as hole)
    const geometry = new THREE.SphereGeometry(node.radius, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x2d3436) },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          vec3 finalColor = mix(vec3(0.0), color, fresnel);

          // Swirling void pattern
          float swirl = sin(vPosition.x * 5.0 + vPosition.y * 5.0 + time) * 0.5 + 0.5;
          finalColor += swirl * 0.1;

          gl_FragColor = vec4(finalColor, 0.9 - fresnel * 0.5);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Event horizon ring
    const ringGeo = new THREE.TorusGeometry(node.radius * 1.2, node.radius * 0.05, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x636e72,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.position.copy(node.position);

    // Particle system for absorption effect
    const particleSystem = this.createVoidParticles(node);

    return {
      mesh: group,
      particleSystem,
      animationData: {
        type: 'morph',
        speed: 0.3,
        amplitude: 1,
        phase: 0,
      },
    };
  }

  private createVoidParticles(node: LevelNode): THREE.Points {
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = this.rng.next() * Math.PI * 2;
      const phi = this.rng.next() * Math.PI;
      const r = node.radius * 2 + this.rng.next() * node.radius * 2;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      velocities[i * 3] = (this.rng.next() - 0.5) * 0.1;
      velocities[i * 3 + 1] = (this.rng.next() - 0.5) * 0.1;
      velocities[i * 3 + 2] = (this.rng.next() - 0.5) * 0.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: 0x636e72,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    points.position.copy(node.position);

    return points;
  }

  private generateFractal(node: LevelNode): GeneratedGeometry {
    const group = new THREE.Group();

    // Sierpinski-like fractal structure
    const depth = 3;
    this.addSierpinskiTetrahedron(group, node.radius, depth, node.position);

    return {
      mesh: group,
      animationData: {
        type: 'float',
        speed: 0.3,
        amplitude: 0.2,
        phase: this.rng.next() * Math.PI * 2,
      },
    };
  }

  private addSierpinskiTetrahedron(
    parent: THREE.Group,
    size: number,
    depth: number,
    position: THREE.Vector3
  ): void {
    if (depth === 0) {
      const geometry = new THREE.TetrahedronGeometry(size);
      const material = new THREE.MeshStandardMaterial({
        color: 0x667eea,
        metalness: 0.5,
        roughness: 0.3,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      parent.add(mesh);
      return;
    }

    const halfSize = size / 2;
    const h = size * Math.sqrt(2 / 3);
    const offsets = [
      new THREE.Vector3(0, h / 2, 0),
      new THREE.Vector3(halfSize, -h / 4, halfSize * 0.577),
      new THREE.Vector3(-halfSize, -h / 4, halfSize * 0.577),
      new THREE.Vector3(0, -h / 4, -halfSize * 1.155),
    ];

    for (const offset of offsets) {
      this.addSierpinskiTetrahedron(
        parent,
        halfSize,
        depth - 1,
        position.clone().add(offset.multiplyScalar(0.5))
      );
    }
  }

  private getNodeColor(type: LevelNode['type']): number {
    const colors: Record<LevelNode['type'], number> = {
      anchor: 0x00ff88,
      transit: 0x667eea,
      puzzle: 0xffaa00,
      witness: 0x00ffff,
      hidden: 0xff00ff,
      nexus: 0xffffff,
    };
    return colors[type] || 0x667eea;
  }

  // Simple 3D noise function
  private simplex3D(x: number, y: number, z: number): number {
    const seed = this.rng.next() * 1000;
    return Math.sin(x * seed + y) * Math.cos(y * seed + z) * Math.sin(z * seed + x);
  }
}

// ========================================
// Edge Geometry Generator
// ========================================

export class EdgeGeometryGenerator {
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  generate(
    edge: LevelEdge,
    fromPos: THREE.Vector3,
    toPos: THREE.Vector3,
    style: GeometryStyle
  ): GeneratedGeometry {

    switch (style) {
      case 'crystalline':
        return this.generateCrystallinePath(edge, fromPos, toPos);
      case 'organic':
        return this.generateOrganicPath(edge, fromPos, toPos);
      case 'void':
        return this.generateVoidPath(edge, fromPos, toPos);
      default:
        return this.generateCrystallinePath(edge, fromPos, toPos);
    }
  }

  private generateCrystallinePath(
    edge: LevelEdge,
    from: THREE.Vector3,
    to: THREE.Vector3
  ): GeneratedGeometry {

    // Segmented crystal bridge
    const segments = Math.ceil(edge.length / 2) + 2;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = from.clone().lerp(to, t);

      // Add some variation
      if (i > 0 && i < segments) {
        point.x += this.rng.range(-0.3, 0.3);
        point.y += this.rng.range(-0.3, 0.3);
        point.z += this.rng.range(-0.1, 0.1);
      }

      points.push(point);
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, segments * 4, 0.1, 6, false);

    const material = new THREE.MeshStandardMaterial({
      color: this.getEdgeColor(edge.type),
      metalness: 0.4,
      roughness: 0.3,
      transparent: true,
      opacity: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);

    return {
      mesh,
      animationData: {
        type: 'pulse',
        speed: 0.8,
        amplitude: 0.05,
        phase: this.rng.next() * Math.PI * 2,
      },
    };
  }

  private generateOrganicPath(
    edge: LevelEdge,
    from: THREE.Vector3,
    to: THREE.Vector3
  ): GeneratedGeometry {

    // Vine-like organic connection
    const mainCurve = new THREE.CatmullRomCurve3([
      from,
      from.clone().lerp(to, 0.3).add(new THREE.Vector3(
        this.rng.range(-1, 1),
        this.rng.range(-1, 1),
        this.rng.range(-0.5, 0.5)
      )),
      from.clone().lerp(to, 0.7).add(new THREE.Vector3(
        this.rng.range(-1, 1),
        this.rng.range(-1, 1),
        this.rng.range(-0.5, 0.5)
      )),
      to,
    ]);

    const geometry = new THREE.TubeGeometry(mainCurve, 32, 0.15, 8, false);
    const material = new THREE.MeshStandardMaterial({
      color: this.getEdgeColor(edge.type),
      metalness: 0.1,
      roughness: 0.8,
    });

    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, material));

    // Add secondary vines
    for (let i = 0; i < 2; i++) {
      const offset = new THREE.Vector3(
        this.rng.range(-0.3, 0.3),
        this.rng.range(-0.3, 0.3),
        0
      );
      const secondaryCurve = new THREE.CatmullRomCurve3([
        from.clone().add(offset),
        from.clone().lerp(to, 0.5).add(offset.clone().multiplyScalar(2)),
        to.clone().add(offset),
      ]);

      const secondaryGeo = new THREE.TubeGeometry(secondaryCurve, 20, 0.05, 6, false);
      group.add(new THREE.Mesh(secondaryGeo, material));
    }

    return { mesh: group };
  }

  private generateVoidPath(
    edge: LevelEdge,
    from: THREE.Vector3,
    to: THREE.Vector3
  ): GeneratedGeometry {

    // Dotted/fragmented path suggesting instability
    const group = new THREE.Group();
    const segments = Math.ceil(edge.length);

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const pos = from.clone().lerp(to, t);

      // Skip some segments for fragmented look
      if (this.rng.next() > 0.2) {
        const size = 0.15 + this.rng.next() * 0.1;
        const geometry = new THREE.OctahedronGeometry(size);
        const material = new THREE.MeshBasicMaterial({
          color: 0x636e72,
          transparent: true,
          opacity: 0.5 + t * 0.3,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(pos);
        mesh.rotation.set(
          this.rng.next() * Math.PI,
          this.rng.next() * Math.PI,
          this.rng.next() * Math.PI
        );
        group.add(mesh);
      }
    }

    return {
      mesh: group,
      animationData: {
        type: 'dissolve',
        speed: 0.5,
        amplitude: 1,
        phase: 0,
      },
    };
  }

  private getEdgeColor(type: LevelEdge['type']): number {
    const colors: Record<LevelEdge['type'], number> = {
      path: 0x667eea,
      bridge: 0x00ffff,
      conditional: 0xffaa00,
      'one-way': 0xff6b6b,
      'witness-only': 0xff00ff,
    };
    return colors[type] || 0x667eea;
  }
}

// ========================================
// Environment Geometry Generator
// ========================================

export class EnvironmentGenerator {
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  generateBackground(style: LayerStyle): THREE.Group {
    const group = new THREE.Group();

    switch (style.geometryStyle) {
      case 'crystalline':
        this.addCrystallineBackground(group, style);
        break;
      case 'organic':
        this.addOrganicBackground(group, style);
        break;
      case 'void':
        this.addVoidBackground(group, style);
        break;
      case 'fractal':
        this.addFractalBackground(group, style);
        break;
    }

    return group;
  }

  private addCrystallineBackground(group: THREE.Group, style: LayerStyle): void {
    // Floating crystal formations in the distance
    for (let i = 0; i < 50; i++) {
      const geometry = new THREE.OctahedronGeometry(this.rng.range(0.5, 3), 0);
      const material = new THREE.MeshBasicMaterial({
        color: style.primaryColor,
        transparent: true,
        opacity: 0.1 + this.rng.next() * 0.2,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        this.rng.range(-100, 100),
        this.rng.range(-50, 50),
        this.rng.range(-100, -20)
      );
      mesh.rotation.set(
        this.rng.next() * Math.PI,
        this.rng.next() * Math.PI,
        this.rng.next() * Math.PI
      );
      group.add(mesh);
    }
  }

  private addOrganicBackground(group: THREE.Group, style: LayerStyle): void {
    // Floating organic spheres
    for (let i = 0; i < 30; i++) {
      const geometry = new THREE.SphereGeometry(this.rng.range(1, 5), 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: style.primaryColor,
        transparent: true,
        opacity: 0.05 + this.rng.next() * 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        this.rng.range(-80, 80),
        this.rng.range(-40, 40),
        this.rng.range(-80, -15)
      );
      group.add(mesh);
    }
  }

  private addVoidBackground(group: THREE.Group, style: LayerStyle): void {
    // Distant stars/points in the void
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = this.rng.range(-200, 200);
      positions[i * 3 + 1] = this.rng.range(-100, 100);
      positions[i * 3 + 2] = this.rng.range(-200, -50);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
    });

    group.add(new THREE.Points(geometry, material));
  }

  private addFractalBackground(group: THREE.Group, style: LayerStyle): void {
    // Recursive triangle patterns
    const depth = 2;
    this.addBackgroundTriangles(group, new THREE.Vector3(0, 0, -50), 30, depth, style);
  }

  private addBackgroundTriangles(
    group: THREE.Group,
    center: THREE.Vector3,
    size: number,
    depth: number,
    style: LayerStyle
  ): void {
    if (depth === 0) return;

    const geometry = new THREE.BufferGeometry();
    const h = size * Math.sqrt(3) / 2;

    const vertices = new Float32Array([
      center.x, center.y + h * 0.67, center.z,
      center.x - size / 2, center.y - h * 0.33, center.z,
      center.x + size / 2, center.y - h * 0.33, center.z,
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.MeshBasicMaterial({
      color: style.primaryColor,
      transparent: true,
      opacity: 0.05 * depth,
      side: THREE.DoubleSide,
    });

    group.add(new THREE.Mesh(geometry, material));

    // Recurse to sub-triangles
    const newSize = size / 2;
    const newH = h / 2;

    const offsets = [
      new THREE.Vector3(0, newH * 0.67, -5),
      new THREE.Vector3(-newSize / 2, -newH * 0.33, -5),
      new THREE.Vector3(newSize / 2, -newH * 0.33, -5),
    ];

    for (const offset of offsets) {
      this.addBackgroundTriangles(
        group,
        center.clone().add(offset),
        newSize,
        depth - 1,
        style
      );
    }
  }
}
