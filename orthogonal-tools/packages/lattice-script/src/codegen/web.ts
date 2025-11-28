/**
 * LatticeScript Web Code Generator
 * Generates Three.js/TypeScript code from AST
 */

import * as AST from '../ast';

export interface GeneratedCode {
  dimensionConfig: string;    // TypeScript config file
  dimensionModule: string;    // Runtime module
  shaders: ShaderFile[];      // GLSL shaders
  types: string;              // Type definitions
}

export interface ShaderFile {
  name: string;
  vertex: string;
  fragment: string;
}

export class WebCodeGenerator {
  private dimension: AST.DimensionAST;
  private indentLevel = 0;

  constructor(dimension: AST.DimensionAST) {
    this.dimension = dimension;
  }

  generate(): GeneratedCode {
    return {
      dimensionConfig: this.generateConfig(),
      dimensionModule: this.generateModule(),
      shaders: this.generateShaders(),
      types: this.generateTypes(),
    };
  }

  // ========================================================================
  // Config Generation
  // ========================================================================

  private generateConfig(): string {
    const d = this.dimension;
    const lines: string[] = [];

    lines.push(`// Generated from ${d.name}.lattice`);
    lines.push(`// DO NOT EDIT - regenerate from source`);
    lines.push('');
    lines.push(`import { DimensionConfig, NodeConfig, EdgeConfig } from '@orthogonal/core';`);
    lines.push('');
    lines.push(`export const ${d.name.toUpperCase()}_CONFIG: DimensionConfig = {`);
    this.indentLevel++;

    lines.push(this.indent(`name: "${d.name}",`));
    lines.push('');

    // Visual
    if (d.visual) {
      lines.push(this.indent('visual: {'));
      this.indentLevel++;
      lines.push(this.indent(`palette: ${JSON.stringify(d.visual.palette)},`));
      lines.push(this.indent(`background: "${d.visual.background}",`));
      lines.push(this.indent(`style: "${d.visual.style}",`));
      if (d.visual.fractalBase) {
        lines.push(this.indent(`fractalBase: "${d.visual.fractalBase}",`));
      }
      lines.push(this.indent(`effects: ${this.stringifyEffects(d.visual.effects)},`));
      this.indentLevel--;
      lines.push(this.indent('},'));
    }

    // Rules
    if (d.rules) {
      lines.push(this.indent('rules: {'));
      this.indentLevel++;
      lines.push(this.indent(`movement: "${d.rules.movement}",`));
      lines.push(this.indent(`physics: "${d.rules.physics}",`));
      lines.push(this.indent(`time: "${d.rules.time}",`));
      lines.push(this.indent(`paradoxTolerance: ${d.rules.paradoxTolerance},`));
      this.indentLevel--;
      lines.push(this.indent('},'));
    }

    // Nodes
    lines.push('');
    lines.push(this.indent('nodes: ['));
    this.indentLevel++;
    for (const node of d.nodes) {
      lines.push(this.generateNodeConfig(node));
    }
    this.indentLevel--;
    lines.push(this.indent('],'));

    // Edges
    lines.push('');
    lines.push(this.indent('edges: ['));
    this.indentLevel++;
    for (const edge of d.edges) {
      lines.push(this.generateEdgeConfig(edge));
    }
    this.indentLevel--;
    lines.push(this.indent('],'));

    // Fractals
    if (d.fractals.length > 0) {
      lines.push('');
      lines.push(this.indent('fractals: ['));
      this.indentLevel++;
      for (const fractal of d.fractals) {
        lines.push(this.generateFractalConfig(fractal));
      }
      this.indentLevel--;
      lines.push(this.indent('],'));
    }

    // Fallacies
    if (d.fallacies.length > 0) {
      lines.push('');
      lines.push(this.indent('fallacies: ['));
      this.indentLevel++;
      for (const fallacy of d.fallacies) {
        lines.push(this.generateFallacyConfig(fallacy));
      }
      this.indentLevel--;
      lines.push(this.indent('],'));
    }

    // Meta
    if (d.meta) {
      lines.push('');
      lines.push(this.indent('meta: {'));
      this.indentLevel++;
      lines.push(this.indent(`hooks: ${this.stringifyMetaHooks(d.meta.hooks)},`));
      lines.push(this.indent(`scaleAwareness: ${this.stringifyScaleAwareness(d.meta.scaleAwareness)},`));
      this.indentLevel--;
      lines.push(this.indent('},'));
    }

    this.indentLevel--;
    lines.push('};');

    return lines.join('\n');
  }

  private generateNodeConfig(node: AST.NodeDefinition): string {
    const content = node.content
      ? `{ type: "${node.content.contentType}", value: "${node.content.value}" }`
      : 'null';

    const visual = node.visual
      ? JSON.stringify(node.visual)
      : 'undefined';

    return this.indent(`{
${this.indent('  ')}id: "${node.name}",
${this.indent('  ')}position: [${node.position.join(', ')}],
${this.indent('  ')}type: "${node.nodeType}",
${this.indent('  ')}content: ${content},
${this.indent('  ')}visual: ${visual},
${this.indent('  ')}handlers: ${this.stringifyHandlers(node.handlers)},
${this.indent('},')}`.trim());
  }

  private generateEdgeConfig(edge: AST.EdgeDefinition): string {
    return this.indent(`{
${this.indent('  ')}from: "${edge.from}",
${this.indent('  ')}to: "${edge.to}",
${this.indent('  ')}type: "${edge.edgeType}",
${this.indent('  ')}weight: ${edge.weight},
${this.indent('  ')}key: ${edge.key ? `"${edge.key}"` : 'undefined'},
${this.indent('  ')}visual: ${edge.visual ? JSON.stringify(edge.visual) : 'undefined'},
${this.indent('},')}`.trim());
  }

  private generateFractalConfig(fractal: AST.FractalDefinition): string {
    return this.indent(`{
${this.indent('  ')}name: "${fractal.name}",
${this.indent('  ')}type: "${fractal.fractalType}",
${this.indent('  ')}params: ${JSON.stringify(fractal.params)},
${this.indent('  ')}triggers: ${JSON.stringify(fractal.triggers)},
${this.indent('},')}`.trim());
  }

  private generateFallacyConfig(fallacy: AST.FallacyDefinition): string {
    return this.indent(`{
${this.indent('  ')}name: "${fallacy.name}",
${this.indent('  ')}type: "${fallacy.fallacyType}",
${this.indent('  ')}presentation: ${JSON.stringify(fallacy.presentation)},
${this.indent('  ')}solution: ${JSON.stringify(fallacy.solution)},
${this.indent('  ')}metaHook: ${fallacy.metaHook ? `"${fallacy.metaHook}"` : 'undefined'},
${this.indent('},')}`.trim());
  }

  // ========================================================================
  // Module Generation
  // ========================================================================

  private generateModule(): string {
    const d = this.dimension;
    const name = d.name;
    const className = this.toPascalCase(name) + 'Dimension';

    return `// Generated ${className} runtime module
import * as THREE from 'three';
import { Dimension, AwarenessController, MetaAwarenessEngine } from '@orthogonal/core';
import { ${name.toUpperCase()}_CONFIG } from './${name.toLowerCase()}.config';
import { ${name}Shaders } from './${name.toLowerCase()}.shaders';

export class ${className} implements Dimension {
  private scene: THREE.Scene;
  private nodes: Map<string, THREE.Object3D> = new Map();
  private edges: Map<string, THREE.Line> = new Map();
  private fractals: Map<string, THREE.Mesh> = new Map();
  private config = ${name.toUpperCase()}_CONFIG;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async initialize() {
    // Create nodes
    for (const nodeConfig of this.config.nodes) {
      const node = this.createNode(nodeConfig);
      this.nodes.set(nodeConfig.id, node);
      this.scene.add(node);
    }

    // Create edges
    for (const edgeConfig of this.config.edges) {
      const fromNode = this.nodes.get(edgeConfig.from);
      const toNode = this.nodes.get(edgeConfig.to);
      if (fromNode && toNode) {
        const edge = this.createEdge(edgeConfig, fromNode, toNode);
        this.edges.set(\`\${edgeConfig.from}->\${edgeConfig.to}\`, edge);
        this.scene.add(edge);
      }
    }

    // Initialize fractals
    if (this.config.fractals) {
      for (const fractalConfig of this.config.fractals) {
        const fractal = this.createFractal(fractalConfig);
        this.fractals.set(fractalConfig.name, fractal);
        this.scene.add(fractal);
      }
    }
  }

  update(delta: number, awareness: AwarenessController, meta: MetaAwarenessEngine) {
    // Update node visuals based on awareness state
    const witnessLevel = meta.getWitnessLevel();

    this.nodes.forEach((node, id) => {
      this.updateNodeVisual(node, witnessLevel, delta);
    });

    // Update edge animations
    this.edges.forEach((edge, id) => {
      this.updateEdgeVisual(edge, delta);
    });

    // Update fractals
    this.fractals.forEach((fractal, name) => {
      this.updateFractal(fractal, meta, delta);
    });
  }

  private createNode(config: typeof this.config.nodes[0]): THREE.Object3D {
    const geometry = this.getNodeGeometry(config.visual?.shape || 'icosahedron');
    const material = new THREE.MeshBasicMaterial({
      color: config.visual?.color || this.config.visual?.palette[0] || '#0066FF',
      wireframe: this.config.visual?.style === 'wireframe',
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...config.position);
    mesh.scale.setScalar(config.visual?.scale || 1);
    mesh.userData = { config, type: 'node' };

    if (config.visual?.emissive) {
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: config.visual.color || '#FFFFFF' })
      );
      mesh.add(line);
    }

    return mesh;
  }

  private createEdge(
    config: typeof this.config.edges[0],
    from: THREE.Object3D,
    to: THREE.Object3D
  ): THREE.Line {
    const points = [from.position, to.position];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const color = config.visual?.color || this.config.visual?.palette[1] || '#00CCCC';
    const material = new THREE.LineBasicMaterial({ color });

    if (config.type === 'locked') {
      material.color.setHex(0xFF0000);
    }

    const line = new THREE.Line(geometry, material);
    line.userData = { config, type: 'edge' };

    return line;
  }

  private createFractal(config: typeof this.config.fractals[0]): THREE.Mesh {
    // Create a plane with fractal shader
    const geometry = new THREE.PlaneGeometry(10, 10, 1, 1);
    const shader = ${name}Shaders.getFractalShader(config.type);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        iterations: { value: config.params.iterations },
        scale: { value: config.params.scale },
        rotation: { value: config.params.rotation },
        colorPalette: { value: this.getPaletteTexture() },
        metaLevel: { value: 0 },
      },
      vertexShader: shader.vertex,
      fragmentShader: shader.fragment,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { config, type: 'fractal' };

    return mesh;
  }

  private getNodeGeometry(shape: string): THREE.BufferGeometry {
    switch (shape) {
      case 'sphere': return new THREE.SphereGeometry(0.5, 16, 16);
      case 'cube': return new THREE.BoxGeometry(1, 1, 1);
      case 'pyramid': return new THREE.TetrahedronGeometry(0.5);
      case 'torus': return new THREE.TorusGeometry(0.3, 0.1, 8, 16);
      case 'icosahedron':
      default: return new THREE.IcosahedronGeometry(0.5, 0);
    }
  }

  private updateNodeVisual(node: THREE.Object3D, witnessLevel: number, delta: number) {
    const config = node.userData.config;

    // Pulse effect based on witness level
    if (config.visual?.pulseRate) {
      const pulse = Math.sin(Date.now() * 0.001 * config.visual.pulseRate) * 0.1 + 1;
      node.scale.setScalar((config.visual?.scale || 1) * pulse * (1 + witnessLevel * 0.2));
    }
  }

  private updateEdgeVisual(edge: THREE.Line, delta: number) {
    const config = edge.userData.config;

    // Animate dashed lines
    if (config.visual?.style === 'pulse') {
      (edge.material as THREE.LineBasicMaterial).opacity =
        Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    }
  }

  private updateFractal(fractal: THREE.Mesh, meta: MetaAwarenessEngine, delta: number) {
    const material = fractal.material as THREE.ShaderMaterial;
    const config = fractal.userData.config;

    // Update time uniform
    material.uniforms.time.value += delta * (config.params.animationSpeed || 1);

    // Update based on meta-awareness level
    material.uniforms.metaLevel.value = meta.getMetaLevel();

    // Check triggers
    for (const trigger of config.triggers || []) {
      if (this.shouldTrigger(trigger, meta)) {
        this.applyFractalTransform(fractal, trigger.transform);
      }
    }
  }

  private shouldTrigger(trigger: any, meta: MetaAwarenessEngine): boolean {
    // Implement trigger logic based on meta state
    return false;
  }

  private applyFractalTransform(fractal: THREE.Mesh, transform: any) {
    const material = fractal.material as THREE.ShaderMaterial;

    if (transform.zoom) {
      material.uniforms.scale.value *= transform.zoom;
    }
    if (transform.rotate) {
      material.uniforms.rotation.value += transform.rotate;
    }
  }

  private getPaletteTexture(): THREE.DataTexture {
    const palette = this.config.visual?.palette || ['#0066FF', '#00CCCC', '#FFFFFF'];
    const data = new Uint8Array(palette.length * 4);

    palette.forEach((color, i) => {
      const hex = parseInt(color.slice(1), 16);
      data[i * 4] = (hex >> 16) & 255;
      data[i * 4 + 1] = (hex >> 8) & 255;
      data[i * 4 + 2] = hex & 255;
      data[i * 4 + 3] = 255;
    });

    return new THREE.DataTexture(data, palette.length, 1, THREE.RGBAFormat);
  }

  async dissolve(): Promise<void> {
    // Implement dimension exit animation
  }

  async materialize(): Promise<void> {
    // Implement dimension enter animation
  }

  dispose() {
    this.nodes.forEach(node => {
      this.scene.remove(node);
      (node as THREE.Mesh).geometry?.dispose();
      ((node as THREE.Mesh).material as THREE.Material)?.dispose();
    });

    this.edges.forEach(edge => {
      this.scene.remove(edge);
      edge.geometry?.dispose();
      (edge.material as THREE.Material)?.dispose();
    });

    this.fractals.forEach(fractal => {
      this.scene.remove(fractal);
      fractal.geometry?.dispose();
      (fractal.material as THREE.Material)?.dispose();
    });
  }
}

export default ${className};
`;
  }

  // ========================================================================
  // Shader Generation
  // ========================================================================

  private generateShaders(): ShaderFile[] {
    const shaders: ShaderFile[] = [];

    // Base dimension shader
    shaders.push({
      name: 'dimension',
      vertex: this.generateVertexShader(),
      fragment: this.generateFragmentShader(),
    });

    // Fractal shaders for each type used
    const fractalTypes = new Set(this.dimension.fractals.map(f => f.fractalType));
    fractalTypes.add(this.dimension.visual?.fractalBase || 'mandelbrot');

    for (const type of fractalTypes) {
      shaders.push({
        name: `fractal_${type}`,
        vertex: this.generateFractalVertex(),
        fragment: this.generateFractalFragment(type as AST.FractalType),
      });
    }

    // Effect shaders
    if (this.dimension.visual?.effects) {
      for (const effect of this.dimension.visual.effects) {
        if (this.needsShader(effect.name)) {
          shaders.push({
            name: `effect_${effect.name}`,
            vertex: this.generateEffectVertex(effect.name),
            fragment: this.generateEffectFragment(effect.name),
          });
        }
      }
    }

    return shaders;
  }

  private generateVertexShader(): string {
    return `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

uniform float time;
uniform float witnessLevel;

void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normal;

  vec3 pos = position;

  // Subtle breathing based on witness level
  pos *= 1.0 + sin(time * 2.0) * 0.02 * witnessLevel;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
  }

  private generateFragmentShader(): string {
    const style = this.dimension.visual?.style || 'wireframe';

    return `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

uniform float time;
uniform float witnessLevel;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;

void main() {
  vec3 color = mix(color1, color2, vUv.y);

  // Add witness glow
  float glow = witnessLevel * 0.3;
  color += vec3(glow);

  // Edge detection for wireframe feel
  float edge = 1.0 - smoothstep(0.0, 0.1, abs(fract(vUv.x * 10.0) - 0.5));
  edge = max(edge, 1.0 - smoothstep(0.0, 0.1, abs(fract(vUv.y * 10.0) - 0.5)));

  ${style === 'wireframe' ? 'color = mix(vec3(0.0), color, edge);' : ''}

  gl_FragColor = vec4(color, 1.0);
}
`;
  }

  private generateFractalVertex(): string {
    return `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
  }

  private generateFractalFragment(type: AST.FractalType): string {
    switch (type) {
      case 'mandelbrot':
        return this.mandelbrotShader();
      case 'julia':
        return this.juliaShader();
      case 'sierpinski':
        return this.sierpinskiShader();
      case 'flower_of_life':
        return this.flowerOfLifeShader();
      case 'sacred_spiral':
        return this.sacredSpiralShader();
      case 'metatron':
        return this.metatronShader();
      default:
        return this.mandelbrotShader();
    }
  }

  private mandelbrotShader(): string {
    return `
precision highp float;

varying vec2 vUv;

uniform float time;
uniform float iterations;
uniform float scale;
uniform float rotation;
uniform float metaLevel;
uniform sampler2D colorPalette;

vec2 complexMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  vec2 uv = (vUv - 0.5) * 4.0 / scale;
  uv = rotate2D(uv, rotation + time * 0.1);

  // Mandelbrot iteration
  vec2 c = uv;
  vec2 z = vec2(0.0);

  float n = 0.0;
  for (float i = 0.0; i < 256.0; i++) {
    if (i >= iterations) break;
    if (dot(z, z) > 4.0) break;

    z = complexMul(z, z) + c;
    n = i;
  }

  // Smooth coloring
  float smooth_n = n;
  if (n < iterations - 1.0) {
    float log_zn = log(dot(z, z)) / 2.0;
    float nu = log(log_zn / log(2.0)) / log(2.0);
    smooth_n = n + 1.0 - nu;
  }

  // Color from palette
  float t = smooth_n / iterations;
  t = fract(t * 3.0 + time * 0.05);

  // DMT-style color cycling based on meta level
  float cycle = t + metaLevel * 0.3;
  vec3 color = vec3(
    sin(cycle * 6.28318 + 0.0) * 0.5 + 0.5,
    sin(cycle * 6.28318 + 2.094) * 0.5 + 0.5,
    sin(cycle * 6.28318 + 4.188) * 0.5 + 0.5
  );

  // Boost saturation at higher meta levels
  float sat = 0.7 + metaLevel * 0.3;
  color = mix(vec3(dot(color, vec3(0.299, 0.587, 0.114))), color, sat);

  // Interior glow
  if (n >= iterations - 1.0) {
    color = vec3(0.0, 0.0, 0.1 + sin(time) * 0.05);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;
  }

  private juliaShader(): string {
    return `
precision highp float;

varying vec2 vUv;

uniform float time;
uniform float iterations;
uniform float scale;
uniform float rotation;
uniform float metaLevel;
uniform vec2 juliaC;

vec2 complexMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

void main() {
  vec2 uv = (vUv - 0.5) * 4.0 / scale;

  // Animate Julia constant
  vec2 c = juliaC;
  c.x += sin(time * 0.1) * 0.1;
  c.y += cos(time * 0.13) * 0.1;

  vec2 z = uv;
  float n = 0.0;

  for (float i = 0.0; i < 256.0; i++) {
    if (i >= iterations) break;
    if (dot(z, z) > 4.0) break;

    z = complexMul(z, z) + c;
    n = i;
  }

  float t = n / iterations;

  // Psychedelic color mapping
  vec3 color = vec3(
    sin(t * 10.0 + time) * 0.5 + 0.5,
    sin(t * 10.0 + time + 2.094) * 0.5 + 0.5,
    sin(t * 10.0 + time + 4.188) * 0.5 + 0.5
  );

  // Meta level affects intensity
  color *= 0.5 + metaLevel * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
`;
  }

  private sierpinskiShader(): string {
    return `
precision highp float;

varying vec2 vUv;

uniform float time;
uniform float iterations;
uniform float scale;
uniform float metaLevel;

float sierpinski(vec2 p) {
  float d = 0.0;

  for (float i = 0.0; i < 10.0; i++) {
    if (i >= iterations / 10.0) break;

    // Fold space
    if (p.x + p.y < 0.0) p.xy = -p.yx;
    if (p.x < 0.0) p.x = -p.x;
    if (p.y < 0.0) p.y = -p.y;

    // Scale and translate
    p = p * 2.0 - 1.0;

    d = max(d, 1.0 - length(p) * 0.5);
  }

  return d;
}

void main() {
  vec2 uv = (vUv - 0.5) * 4.0 / scale;

  float d = sierpinski(uv);

  vec3 color = vec3(d);
  color.r += sin(time + d * 10.0) * 0.3;
  color.g += sin(time * 1.1 + d * 10.0) * 0.3;
  color.b += sin(time * 0.9 + d * 10.0) * 0.3;

  color = clamp(color, 0.0, 1.0);
  color *= 0.5 + metaLevel * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
`;
  }

  private flowerOfLifeShader(): string {
    return `
precision highp float;

varying vec2 vUv;

uniform float time;
uniform float scale;
uniform float metaLevel;

float circle(vec2 p, float r) {
  return smoothstep(0.02, 0.0, abs(length(p) - r));
}

void main() {
  vec2 uv = (vUv - 0.5) * 6.0 / scale;

  float d = 0.0;

  // Central circle
  d += circle(uv, 1.0);

  // First ring (6 circles)
  for (float i = 0.0; i < 6.0; i++) {
    float angle = i * 3.14159 / 3.0 + time * 0.1;
    vec2 center = vec2(cos(angle), sin(angle));
    d += circle(uv - center, 1.0);
  }

  // Second ring (12 circles)
  for (float i = 0.0; i < 12.0; i++) {
    float angle = i * 3.14159 / 6.0 + time * 0.05;
    vec2 center = vec2(cos(angle), sin(angle)) * 2.0;
    d += circle(uv - center, 1.0);
  }

  // Third ring based on meta level
  if (metaLevel > 0.5) {
    for (float i = 0.0; i < 18.0; i++) {
      float angle = i * 3.14159 / 9.0;
      vec2 center = vec2(cos(angle), sin(angle)) * 3.0;
      d += circle(uv - center, 1.0) * (metaLevel - 0.5) * 2.0;
    }
  }

  // Sacred geometry color
  vec3 color = vec3(0.9, 0.8, 0.6) * d;
  color += vec3(0.2, 0.1, 0.3) * (1.0 - d);

  // Pulsing glow
  color += vec3(0.1, 0.05, 0.15) * sin(time * 2.0 + length(uv)) * d;

  gl_FragColor = vec4(color, 1.0);
}
`;
  }

  private sacredSpiralShader(): string {
    return `
precision highp float;

varying vec2 vUv;

uniform float time;
uniform float scale;
uniform float metaLevel;

const float PHI = 1.618033988749895;

void main() {
  vec2 uv = (vUv - 0.5) * 10.0 / scale;

  float r = length(uv);
  float theta = atan(uv.y, uv.x);

  // Golden spiral
  float spiral = fract(log(r) / log(PHI) - theta / (2.0 * 3.14159) + time * 0.1);

  // Multiple arms
  float arms = 0.0;
  for (float i = 0.0; i < 6.0; i++) {
    float offset = i * 3.14159 / 3.0;
    arms += smoothstep(0.1, 0.0, abs(fract(log(r) / log(PHI) - (theta + offset) / (2.0 * 3.14159)) - 0.5));
  }

  vec3 color = vec3(0.0);

  // Spiral arms
  color += vec3(0.3, 0.2, 0.5) * arms;

  // Center glow
  color += vec3(1.0, 0.8, 0.4) * smoothstep(1.0, 0.0, r);

  // Meta-awareness reveals deeper spirals
  if (metaLevel > 0.3) {
    float deep = fract(log(r * 2.0) / log(PHI) - theta * 2.0 / (2.0 * 3.14159) - time * 0.2);
    color += vec3(0.1, 0.3, 0.4) * smoothstep(0.1, 0.0, abs(deep - 0.5)) * metaLevel;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;
  }

  private metatronShader(): string {
    return `
precision highp float;

varying vec2 vUv;

uniform float time;
uniform float scale;
uniform float metaLevel;

float line(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return smoothstep(0.03, 0.0, length(pa - ba * t));
}

float circle(vec2 p, float r) {
  return smoothstep(0.02, 0.0, abs(length(p) - r));
}

void main() {
  vec2 uv = (vUv - 0.5) * 8.0 / scale;

  float d = 0.0;

  // Flower of life base (7 circles)
  d += circle(uv, 1.0);
  for (float i = 0.0; i < 6.0; i++) {
    float angle = i * 3.14159 / 3.0;
    d += circle(uv - vec2(cos(angle), sin(angle)), 1.0);
  }

  // Metatron's cube lines
  // Connect centers to form hexagram and cube projection
  vec2 points[13];
  points[0] = vec2(0.0, 0.0);
  for (int i = 1; i <= 6; i++) {
    float angle = float(i - 1) * 3.14159 / 3.0;
    points[i] = vec2(cos(angle), sin(angle));
  }
  for (int i = 7; i <= 12; i++) {
    float angle = float(i - 7) * 3.14159 / 3.0 + 3.14159 / 6.0;
    points[i] = vec2(cos(angle), sin(angle)) * 2.0;
  }

  // Draw all connecting lines (revealed by meta level)
  float lines = 0.0;
  for (int i = 0; i < 13; i++) {
    for (int j = i + 1; j < 13; j++) {
      float threshold = float(i + j) / 24.0;
      if (metaLevel > threshold) {
        lines += line(uv, points[i], points[j]) * (metaLevel - threshold);
      }
    }
  }

  vec3 color = vec3(0.1, 0.1, 0.2);
  color += vec3(0.4, 0.3, 0.5) * d;
  color += vec3(0.8, 0.7, 0.3) * lines;

  // Animate rotation of inner structure
  float rot = time * 0.2;
  vec2 ruv = vec2(
    uv.x * cos(rot) - uv.y * sin(rot),
    uv.x * sin(rot) + uv.y * cos(rot)
  );

  // Add rotating inner pattern at high meta levels
  if (metaLevel > 0.7) {
    float inner = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
      float angle = i * 3.14159 / 3.0 + rot * 2.0;
      inner += line(ruv, vec2(0.0), vec2(cos(angle), sin(angle)) * 0.5);
    }
    color += vec3(1.0, 0.9, 0.7) * inner * (metaLevel - 0.7) * 3.0;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;
  }

  private needsShader(effect: AST.EffectType): boolean {
    const shaderEffects: AST.EffectType[] = [
      'kaleidoscope',
      'fractal_zoom',
      'color_cycle',
      'geometric_morph',
      'dmt_flash',
      'ego_dissolution',
    ];
    return shaderEffects.includes(effect);
  }

  private generateEffectVertex(effect: AST.EffectType): string {
    return `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
  }

  private generateEffectFragment(effect: AST.EffectType): string {
    switch (effect) {
      case 'kaleidoscope':
        return this.kaleidoscopeShader();
      case 'dmt_flash':
        return this.dmtFlashShader();
      case 'ego_dissolution':
        return this.egoDissolveShader();
      default:
        return 'void main() { gl_FragColor = vec4(1.0); }';
    }
  }

  private kaleidoscopeShader(): string {
    return `
precision highp float;

varying vec2 vUv;
uniform float time;
uniform float segments;
uniform sampler2D inputTexture;

void main() {
  vec2 uv = vUv - 0.5;

  float angle = atan(uv.y, uv.x);
  float radius = length(uv);

  // Kaleidoscope fold
  float segmentAngle = 2.0 * 3.14159 / segments;
  angle = mod(angle, segmentAngle);
  if (mod(floor(atan(uv.y, uv.x) / segmentAngle), 2.0) == 1.0) {
    angle = segmentAngle - angle;
  }

  vec2 newUv = vec2(cos(angle), sin(angle)) * radius + 0.5;

  vec4 color = texture2D(inputTexture, newUv);

  // Add time-based color shift
  color.rgb = color.rgb * 0.7 + vec3(
    sin(time + radius * 5.0) * 0.15,
    sin(time * 1.1 + radius * 5.0) * 0.15,
    sin(time * 0.9 + radius * 5.0) * 0.15
  ) + 0.15;

  gl_FragColor = color;
}
`;
  }

  private dmtFlashShader(): string {
    return `
precision highp float;

varying vec2 vUv;
uniform float time;
uniform float intensity;
uniform float metaLevel;

// Psychedelic pattern based on DMT trip reports
void main() {
  vec2 uv = vUv * 2.0 - 1.0;

  // Recursive geometric patterns
  float pattern = 0.0;

  for (float i = 0.0; i < 7.0; i++) {
    float scale = pow(2.0, i);
    vec2 p = uv * scale;

    // Hexagonal tiling
    p.x += p.y * 0.5;
    vec2 cell = floor(p);
    vec2 f = fract(p);

    // Pattern within each cell
    float d = length(f - 0.5);
    pattern += sin(d * 20.0 - time * (i + 1.0)) / scale;
  }

  // Color based on pattern and time
  vec3 color = vec3(
    sin(pattern * 3.0 + time) * 0.5 + 0.5,
    sin(pattern * 3.0 + time + 2.094) * 0.5 + 0.5,
    sin(pattern * 3.0 + time + 4.188) * 0.5 + 0.5
  );

  // Intensity flash
  color = mix(color, vec3(1.0), intensity * sin(time * 10.0) * 0.5 + 0.5);

  // Center brightness
  float center = 1.0 - length(uv) * 0.5;
  color *= center;

  // Meta level intensifies the experience
  color = mix(vec3(0.5), color, 0.5 + metaLevel * 0.5);

  gl_FragColor = vec4(color, 1.0);
}
`;
  }

  private egoDissolveShader(): string {
    return `
precision highp float;

varying vec2 vUv;
uniform float time;
uniform float dissolveLevel;
uniform sampler2D inputTexture;

// Simulates boundary dissolution
void main() {
  vec2 uv = vUv;

  // Ripple distortion
  float dist = length(uv - 0.5);
  float ripple = sin(dist * 30.0 - time * 2.0) * 0.01 * dissolveLevel;

  // Noise-based boundary breaking
  float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  vec2 offset = vec2(noise * 2.0 - 1.0) * 0.1 * dissolveLevel;

  // Apply distortion
  vec2 distortedUv = uv + vec2(ripple) + offset * sin(time);

  vec4 color = texture2D(inputTexture, distortedUv);

  // Blend with environment (dissolving self-other boundary)
  float blend = dissolveLevel * 0.5;
  color.rgb = mix(color.rgb, 1.0 - color.rgb, blend * sin(time * 0.5) * 0.5 + 0.5);

  // Edge glow
  float edge = smoothstep(0.4, 0.5, dist);
  color.rgb += vec3(0.3, 0.2, 0.4) * edge * dissolveLevel;

  gl_FragColor = color;
}
`;
  }

  // ========================================================================
  // Type Generation
  // ========================================================================

  private generateTypes(): string {
    return `// Generated types for ${this.dimension.name}
export interface ${this.toPascalCase(this.dimension.name)}Node {
  id: string;
  position: [number, number, number];
  type: '${this.dimension.nodes.map(n => n.nodeType).join("' | '")}';
}

export interface ${this.toPascalCase(this.dimension.name)}Edge {
  from: string;
  to: string;
  type: '${this.dimension.edges.map(e => e.edgeType).join("' | '")}';
}
`;
  }

  // ========================================================================
  // Utilities
  // ========================================================================

  private indent(str: string): string {
    return '  '.repeat(this.indentLevel) + str;
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private stringifyEffects(effects: AST.VisualEffect[]): string {
    return JSON.stringify(
      effects.map(e => ({ name: e.name, params: e.params })),
      null,
      2
    ).replace(/\n/g, '\n' + '  '.repeat(this.indentLevel + 1));
  }

  private stringifyHandlers(handlers: AST.EventHandler[]): string {
    return JSON.stringify(
      handlers.map(h => ({ event: h.event, actions: h.actions })),
      null,
      2
    );
  }

  private stringifyMetaHooks(hooks: AST.MetaHook[]): string {
    return JSON.stringify(
      hooks.map(h => ({ trigger: h.trigger, actions: h.actions })),
      null,
      2
    );
  }

  private stringifyScaleAwareness(scale: AST.ScaleAwarenessConfig): string {
    return JSON.stringify(
      { levels: scale.levels, transitions: scale.transitions },
      null,
      2
    );
  }
}

export function generateWebCode(dimension: AST.DimensionAST): GeneratedCode {
  const generator = new WebCodeGenerator(dimension);
  return generator.generate();
}
