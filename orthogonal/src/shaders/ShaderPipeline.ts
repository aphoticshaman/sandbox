/**
 * ShaderPipeline.ts
 *
 * Post-processing effects and dimension-specific shaders for Orthogonal
 * Creates the visual identity of each dimension
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { DimensionType } from '../core/DimensionManager';

// =============================================================================
// CUSTOM SHADERS
// =============================================================================

// Dimension-specific color grading
const DimensionGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    dimension: { value: 0 },  // 0 = LATTICE, 1 = MARROW, 2 = VOID
    transitionProgress: { value: 0 },
    time: { value: 0 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float dimension;
    uniform float transitionProgress;
    uniform float time;
    varying vec2 vUv;

    // Color grading for each dimension
    vec3 gradeLattice(vec3 color) {
      // Cool crystalline blues and whites
      float luminance = dot(color, vec3(0.299, 0.587, 0.114));
      vec3 tint = vec3(0.9, 0.95, 1.0);
      color = mix(color, color * tint, 0.3);
      // Boost highlights
      color += pow(luminance, 3.0) * vec3(0.1, 0.15, 0.2);
      return color;
    }

    vec3 gradeMarrow(vec3 color) {
      // Warm organic amber and deep reds
      vec3 tint = vec3(1.0, 0.9, 0.8);
      color = mix(color, color * tint, 0.4);
      // Add warmth to shadows
      float luminance = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(color, color + vec3(0.1, 0.05, 0.0) * (1.0 - luminance), 0.3);
      return color;
    }

    vec3 gradeVoid(vec3 color) {
      // Deep purples and absence
      float luminance = dot(color, vec3(0.299, 0.587, 0.114));
      vec3 voidColor = vec3(0.1, 0.05, 0.15);
      // Crush blacks, ethereal highlights
      color = mix(voidColor, color, pow(luminance, 0.7));
      // Add purple shift
      color.r = mix(color.r, color.b * 0.8, 0.2);
      return color;
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      // Apply dimension-specific grading
      vec3 lattice = gradeLattice(color);
      vec3 marrow = gradeMarrow(color);
      vec3 voidGrade = gradeVoid(color);

      // Blend based on dimension
      if (dimension < 0.5) {
        color = lattice;
      } else if (dimension < 1.5) {
        color = marrow;
      } else {
        color = voidGrade;
      }

      // Transition effect
      if (transitionProgress > 0.0 && transitionProgress < 1.0) {
        float noise = fract(sin(dot(vUv * time, vec2(12.9898, 78.233))) * 43758.5453);
        float threshold = transitionProgress;
        color = mix(color, vec3(1.0), step(noise, threshold * 0.3));
      }

      gl_FragColor = vec4(color, texel.a);
    }
  `
};

// Witness mode overlay
const WitnessOverlayShader = {
  uniforms: {
    tDiffuse: { value: null },
    witnessIntensity: { value: 0 },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float witnessIntensity;
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      if (witnessIntensity > 0.0) {
        // Desaturate
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(color, vec3(luminance), witnessIntensity * 0.7);

        // Edge detection for hidden structure
        float edge = 0.0;
        vec2 texelSize = 1.0 / resolution;
        for (int i = -1; i <= 1; i++) {
          for (int j = -1; j <= 1; j++) {
            if (i == 0 && j == 0) continue;
            vec3 neighbor = texture2D(tDiffuse, vUv + vec2(float(i), float(j)) * texelSize * 2.0).rgb;
            edge += length(color - neighbor);
          }
        }
        edge = smoothstep(0.1, 0.5, edge / 8.0);

        // Add golden edge glow for hidden structure
        vec3 witnessGlow = vec3(1.0, 0.85, 0.4) * edge * witnessIntensity;
        color += witnessGlow;

        // Subtle scan lines
        float scanLine = sin(vUv.y * resolution.y * 0.5 + time * 2.0) * 0.5 + 0.5;
        color = mix(color, color * (0.95 + 0.05 * scanLine), witnessIntensity * 0.3);

        // Vignette
        float vignette = 1.0 - length(vUv - 0.5) * witnessIntensity * 0.5;
        color *= vignette;
      }

      gl_FragColor = vec4(color, texel.a);
    }
  `
};

// Void dimension distortion
const VoidDistortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0 },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    // Simplex noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = vUv;

      if (intensity > 0.0) {
        // Spatial distortion
        float n = snoise(uv * 3.0 + time * 0.1);
        float n2 = snoise(uv * 7.0 - time * 0.15);

        vec2 distort = vec2(n, n2) * intensity * 0.02;
        uv += distort;

        // Color aberration
        float r = texture2D(tDiffuse, uv + vec2(intensity * 0.003, 0.0)).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv - vec2(intensity * 0.003, 0.0)).b;

        vec3 color = vec3(r, g, b);

        // Static noise
        float staticNoise = fract(sin(dot(uv + time, vec2(12.9898, 78.233))) * 43758.5453);
        color = mix(color, vec3(staticNoise), intensity * 0.05);

        // Darken towards edges (void consumes)
        float edgeFade = 1.0 - length(uv - 0.5) * intensity * 0.3;
        color *= max(edgeFade, 0.2);

        gl_FragColor = vec4(color, 1.0);
      } else {
        gl_FragColor = texture2D(tDiffuse, uv);
      }
    }
  `
};

// Focus indicator
const FocusIndicatorShader = {
  uniforms: {
    tDiffuse: { value: null },
    focusPosition: { value: new THREE.Vector2(0.5, 0.5) },
    focusIntensity: { value: 0 },
    focusRadius: { value: 0.15 },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 focusPosition;
    uniform float focusIntensity;
    uniform float focusRadius;
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      if (focusIntensity > 0.0) {
        // Adjust for aspect ratio
        vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
        vec2 uv = vUv * aspect;
        vec2 focus = focusPosition * aspect;

        float dist = distance(uv, focus);

        // Ring indicator
        float ringWidth = 0.02;
        float ring = smoothstep(focusRadius - ringWidth, focusRadius, dist) *
                     (1.0 - smoothstep(focusRadius, focusRadius + ringWidth, dist));

        // Animate ring
        float pulse = sin(time * 5.0) * 0.5 + 0.5;
        ring *= 0.7 + 0.3 * pulse;

        // Ring color
        vec3 ringColor = vec3(0.4, 0.8, 1.0);
        color = mix(color, ringColor, ring * focusIntensity);

        // Subtle darkening outside focus
        float darken = smoothstep(0.0, focusRadius * 2.0, dist);
        color *= 1.0 - darken * focusIntensity * 0.2;
      }

      gl_FragColor = vec4(color, texel.a);
    }
  `
};

// Node pulse effect
const NodePulseShader = {
  uniforms: {
    tDiffuse: { value: null },
    pulsePositions: { value: [] },  // Array of vec3 (x, y, intensity)
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 pulsePositions[16];
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      // Apply pulse effects from all active positions
      vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
      vec2 uv = vUv * aspect;

      for (int i = 0; i < 16; i++) {
        vec3 pulse = pulsePositions[i];
        if (pulse.z <= 0.0) continue;

        vec2 pos = pulse.xy * aspect;
        float dist = distance(uv, pos);

        // Expanding ring
        float ringTime = fract(time * 0.5 + float(i) * 0.1);
        float ringRadius = ringTime * 0.3;
        float ring = smoothstep(ringRadius - 0.02, ringRadius, dist) *
                     (1.0 - smoothstep(ringRadius, ringRadius + 0.02, dist));
        ring *= (1.0 - ringTime);  // Fade as it expands

        vec3 pulseColor = vec3(0.5 + 0.5 * sin(float(i)), 0.8, 1.0);
        color += pulseColor * ring * pulse.z * 0.3;
      }

      gl_FragColor = vec4(color, texel.a);
    }
  `
};

// Dimension transition
const DimensionTransitionShader = {
  uniforms: {
    tDiffuse: { value: null },
    tPrevious: { value: null },
    progress: { value: 0 },
    transitionType: { value: 0 },  // 0 = dissolve, 1 = tear, 2 = fold
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tPrevious;
    uniform float progress;
    uniform float transitionType;
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 current = texture2D(tDiffuse, vUv);
      vec4 previous = texture2D(tPrevious, vUv);

      vec4 result;

      if (transitionType < 0.5) {
        // Dissolve with noise
        float n = noise(vUv * 50.0 + time);
        float threshold = progress;
        result = mix(previous, current, step(n, threshold));

        // Edge glow
        float edge = abs(n - threshold);
        if (edge < 0.05) {
          result.rgb += vec3(1.0, 0.8, 0.4) * (1.0 - edge / 0.05) * 0.5;
        }
      } else if (transitionType < 1.5) {
        // Reality tear
        float tear = smoothstep(0.4, 0.6, vUv.x + (progress - 0.5) * 2.0);
        tear += sin(vUv.y * 20.0 + time * 10.0) * 0.02 * (1.0 - abs(progress - 0.5) * 2.0);

        result = mix(previous, current, step(0.5, tear));

        // Tear edge
        float tearEdge = abs(tear - 0.5);
        if (tearEdge < 0.02) {
          result.rgb = vec3(1.0);
        }
      } else {
        // Fold
        vec2 uv = vUv;
        float fold = progress * 3.14159;
        uv.x = abs(uv.x - 0.5) * 2.0;
        uv.x = uv.x * cos(fold) + (1.0 - uv.x) * sin(fold);

        result = mix(previous, current, progress);
      }

      gl_FragColor = result;
    }
  `
};

// =============================================================================
// SHADER PIPELINE
// =============================================================================

export class ShaderPipeline {
  private composer: EffectComposer;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  // Passes
  private renderPass: RenderPass;
  private bloomPass: UnrealBloomPass;
  private dimensionPass: ShaderPass;
  private witnessPass: ShaderPass;
  private voidPass: ShaderPass;
  private focusPass: ShaderPass;
  private transitionPass: ShaderPass;

  // State
  private currentDimension: DimensionType = 'LATTICE';
  private transitionProgress: number = 0;
  private witnessIntensity: number = 0;
  private voidIntensity: number = 0;
  private time: number = 0;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.setupComposer();
  }

  private setupComposer(): void {
    const size = this.renderer.getSize(new THREE.Vector2());

    this.composer = new EffectComposer(this.renderer);

    // Base render
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // Bloom for glow effects
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.5,   // strength
      0.4,   // radius
      0.85   // threshold
    );
    this.composer.addPass(this.bloomPass);

    // Dimension color grading
    this.dimensionPass = new ShaderPass(DimensionGradingShader);
    this.composer.addPass(this.dimensionPass);

    // Void distortion (only active in void)
    this.voidPass = new ShaderPass(VoidDistortionShader);
    this.voidPass.uniforms.resolution.value.set(size.x, size.y);
    this.composer.addPass(this.voidPass);

    // Witness overlay
    this.witnessPass = new ShaderPass(WitnessOverlayShader);
    this.witnessPass.uniforms.resolution.value.set(size.x, size.y);
    this.composer.addPass(this.witnessPass);

    // Focus indicator
    this.focusPass = new ShaderPass(FocusIndicatorShader);
    this.focusPass.uniforms.resolution.value.set(size.x, size.y);
    this.composer.addPass(this.focusPass);

    // Dimension transition (render to screen)
    this.transitionPass = new ShaderPass(DimensionTransitionShader);
    this.transitionPass.uniforms.resolution.value.set(size.x, size.y);
    this.transitionPass.renderToScreen = true;
    this.composer.addPass(this.transitionPass);
  }

  /**
   * Update shader state
   */
  update(deltaTime: number): void {
    this.time += deltaTime / 1000;

    // Update time uniforms
    this.dimensionPass.uniforms.time.value = this.time;
    this.witnessPass.uniforms.time.value = this.time;
    this.voidPass.uniforms.time.value = this.time;
    this.focusPass.uniforms.time.value = this.time;
    this.transitionPass.uniforms.time.value = this.time;

    // Update transition
    this.dimensionPass.uniforms.transitionProgress.value = this.transitionProgress;
    this.transitionPass.uniforms.progress.value = this.transitionProgress;

    // Update intensities
    this.witnessPass.uniforms.witnessIntensity.value = this.witnessIntensity;
    this.voidPass.uniforms.intensity.value = this.voidIntensity;
  }

  /**
   * Render the scene with post-processing
   */
  render(): void {
    this.composer.render();
  }

  /**
   * Set the current dimension
   */
  setDimension(dimension: DimensionType): void {
    const dimIndex = dimension === 'LATTICE' ? 0 : dimension === 'MARROW' ? 1 : 2;
    this.dimensionPass.uniforms.dimension.value = dimIndex;
    this.currentDimension = dimension;

    // Update void intensity
    this.voidIntensity = dimension === 'VOID' ? 1.0 : 0.0;

    // Adjust bloom for each dimension
    switch (dimension) {
      case 'LATTICE':
        this.bloomPass.strength = 0.5;
        this.bloomPass.radius = 0.4;
        break;
      case 'MARROW':
        this.bloomPass.strength = 0.3;
        this.bloomPass.radius = 0.6;
        break;
      case 'VOID':
        this.bloomPass.strength = 0.8;
        this.bloomPass.radius = 0.2;
        break;
    }
  }

  /**
   * Start dimension transition
   */
  startTransition(from: DimensionType, to: DimensionType, duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const fromIndex = from === 'LATTICE' ? 0 : from === 'MARROW' ? 1 : 2;
      const toIndex = to === 'LATTICE' ? 0 : to === 'MARROW' ? 1 : 2;

      // Determine transition type based on dimensions
      let transitionType = 0;  // dissolve
      if ((from === 'LATTICE' && to === 'VOID') || (from === 'VOID' && to === 'LATTICE')) {
        transitionType = 1;  // tear
      } else if ((from === 'MARROW' && to === 'VOID') || (from === 'VOID' && to === 'MARROW')) {
        transitionType = 2;  // fold
      }

      this.transitionPass.uniforms.transitionType.value = transitionType;

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / duration);

        this.transitionProgress = progress;

        // Interpolate dimension
        const dimValue = fromIndex + (toIndex - fromIndex) * progress;
        this.dimensionPass.uniforms.dimension.value = dimValue;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.transitionProgress = 0;
          this.setDimension(to);
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Set witness mode intensity
   */
  setWitnessIntensity(intensity: number): void {
    this.witnessIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Animate witness mode in/out
   */
  animateWitness(active: boolean, duration: number = 500): void {
    const start = this.witnessIntensity;
    const target = active ? 1.0 : 0.0;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);  // ease out cubic

      this.witnessIntensity = start + (target - start) * eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Set focus indicator position
   */
  setFocusPosition(screenX: number, screenY: number, intensity: number): void {
    this.focusPass.uniforms.focusPosition.value.set(screenX, screenY);
    this.focusPass.uniforms.focusIntensity.value = intensity;
  }

  /**
   * Clear focus indicator
   */
  clearFocus(): void {
    this.focusPass.uniforms.focusIntensity.value = 0;
  }

  /**
   * Handle resize
   */
  resize(width: number, height: number): void {
    this.composer.setSize(width, height);

    // Update resolution uniforms
    const resolution = new THREE.Vector2(width, height);
    this.witnessPass.uniforms.resolution.value.copy(resolution);
    this.voidPass.uniforms.resolution.value.copy(resolution);
    this.focusPass.uniforms.resolution.value.copy(resolution);
    this.transitionPass.uniforms.resolution.value.copy(resolution);

    // Update bloom
    this.bloomPass.resolution.set(width, height);
  }

  /**
   * Get current state for debugging
   */
  getState(): object {
    return {
      dimension: this.currentDimension,
      transitionProgress: this.transitionProgress,
      witnessIntensity: this.witnessIntensity,
      voidIntensity: this.voidIntensity,
      time: this.time
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.composer.dispose();
  }
}

// =============================================================================
// NODE SHADERS (for individual node rendering)
// =============================================================================

export const NodeShaders = {
  // Base node shader
  base: {
    vertexShader: `
      uniform float time;
      uniform float pulse;
      uniform float chargeProgress;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vPulse;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;

        // Pulse effect
        float p = sin(time * pulse * 6.28318) * 0.5 + 0.5;
        vPulse = p;

        // Scale based on charge
        float scale = 1.0 + chargeProgress * 0.3 + p * 0.1 * pulse;
        vec3 pos = position * scale;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,

    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform float active;
      uniform float chargeProgress;
      uniform float locked;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vPulse;

      void main() {
        // Fresnel edge glow
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

        vec3 baseColor = color;

        // Locked state
        if (locked > 0.5) {
          baseColor = mix(baseColor, vec3(0.3, 0.0, 0.0), 0.5);
        }

        // Active state glow
        if (active > 0.5) {
          baseColor += vec3(0.2, 0.3, 0.4) * fresnel;
        }

        // Charge progress ring
        if (chargeProgress > 0.0) {
          float angle = atan(vPosition.y, vPosition.x) / 3.14159 * 0.5 + 0.5;
          if (angle < chargeProgress) {
            baseColor += vec3(0.3, 0.5, 0.8) * 0.5;
          }
        }

        // Pulse glow
        baseColor += vec3(0.1, 0.15, 0.2) * vPulse;

        gl_FragColor = vec4(baseColor, opacity);
      }
    `
  },

  // Void node shader (more ethereal)
  void: {
    vertexShader: `
      uniform float time;

      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vNoise;

      // Simple noise
      float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;

        // Distort with noise
        float n = noise(position + time * 0.5);
        vNoise = n;
        vec3 pos = position + normal * n * 0.1;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,

    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform float time;

      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vNoise;

      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);

        vec3 voidColor = color * 0.5;
        voidColor += vec3(0.2, 0.1, 0.3) * fresnel;

        // Flickering
        float flicker = sin(time * 10.0 + vNoise * 20.0) * 0.1 + 0.9;
        voidColor *= flicker;

        // Edge dissolution
        float edge = smoothstep(0.3, 0.5, fresnel);

        gl_FragColor = vec4(voidColor, opacity * (1.0 - edge * 0.5));
      }
    `
  }
};

// =============================================================================
// EDGE SHADERS
// =============================================================================

export const EdgeShaders = {
  // Base edge shader
  base: {
    vertexShader: `
      attribute float progress;

      uniform float time;
      uniform float flowSpeed;

      varying float vProgress;
      varying vec3 vPosition;

      void main() {
        vProgress = progress;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform float time;
      uniform float flowSpeed;
      uniform float dashed;

      varying float vProgress;
      varying vec3 vPosition;

      void main() {
        vec3 edgeColor = color;
        float alpha = opacity;

        // Flow animation
        float flow = fract(vProgress - time * flowSpeed);
        edgeColor += vec3(0.1, 0.2, 0.3) * (1.0 - flow) * 0.5;

        // Dashed pattern
        if (dashed > 0.5) {
          float dash = fract(vProgress * 10.0);
          if (dash > 0.5) {
            alpha *= 0.3;
          }
        }

        gl_FragColor = vec4(edgeColor, alpha);
      }
    `
  },

  // Hidden edge shader (only visible when witnessed)
  hidden: {
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform float time;
      uniform float revealProgress;

      varying vec3 vPosition;

      void main() {
        // Golden reveal color
        vec3 revealColor = vec3(1.0, 0.85, 0.4);
        vec3 edgeColor = mix(vec3(0.0), revealColor, revealProgress);

        // Sparkle effect
        float sparkle = fract(sin(dot(vPosition.xy + time, vec2(12.9898, 78.233))) * 43758.5453);
        if (sparkle > 0.95) {
          edgeColor = vec3(1.0);
        }

        float alpha = opacity * revealProgress;

        gl_FragColor = vec4(edgeColor, alpha);
      }
    `
  }
};
