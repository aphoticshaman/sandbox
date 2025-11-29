/**
 * PerformanceManager.ts
 *
 * Maximizes hardware utilization for cloud gaming:
 * - GPU: WebGL2 with optimal settings
 * - CPU: Web Workers for parallel processing
 * - Memory: Efficient buffer management
 * - Storage: IndexedDB caching
 */

export interface PerformanceConfig {
  targetFPS: 60 | 120 | 'unlimited';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  useWorkers: boolean;
  maxWorkers: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  gpuTime: number;
  memoryUsed: number;
  workerCount: number;
}

class PerformanceManager {
  private config: PerformanceConfig = {
    targetFPS: 60,
    quality: 'high',
    useWorkers: true,
    maxWorkers: navigator.hardwareConcurrency || 4,
  };

  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    gpuTime: 0,
    memoryUsed: 0,
    workerCount: 0,
  };

  // FPS tracking
  private frameCount = 0;
  private lastFPSUpdate = 0;
  private frameTimes: number[] = [];

  // Workers pool
  private workers: Worker[] = [];
  private workerTasks: Map<number, (result: any) => void> = new Map();
  private nextTaskId = 0;

  // RAF management
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private frameInterval = 1000 / 60;

  constructor() {
    this.detectCapabilities();
  }

  /**
   * Detect hardware capabilities and set optimal config
   */
  private detectCapabilities(): void {
    // Check GPU capabilities via WebGL
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        console.log('[Performance] GPU:', renderer);

        // Auto-detect quality based on GPU
        if (renderer.includes('RTX') || renderer.includes('RX 6') || renderer.includes('RX 7')) {
          this.config.quality = 'ultra';
          this.config.targetFPS = 120;
        } else if (renderer.includes('GTX') || renderer.includes('RX 5')) {
          this.config.quality = 'high';
          this.config.targetFPS = 60;
        } else if (renderer.includes('Intel') || renderer.includes('Integrated')) {
          this.config.quality = 'medium';
          this.config.targetFPS = 60;
        }
      }

      // Check for WebGL2 features
      const isWebGL2 = gl instanceof WebGL2RenderingContext;
      console.log('[Performance] WebGL2:', isWebGL2);
    }

    // Check CPU cores
    const cores = navigator.hardwareConcurrency || 4;
    this.config.maxWorkers = Math.max(2, Math.min(cores - 1, 8)); // Leave 1 core for main thread
    console.log('[Performance] CPU cores:', cores, 'Workers:', this.config.maxWorkers);

    // Check memory (if available)
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      console.log('[Performance] Device memory:', memory, 'GB');
      if (memory < 4) {
        this.config.quality = 'low';
      }
    }

    // Check connection for cloud gaming
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      console.log('[Performance] Connection:', conn?.effectiveType, conn?.downlink + 'Mbps');
    }

    this.frameInterval = this.config.targetFPS === 'unlimited' ? 0 : 1000 / this.config.targetFPS;
  }

  /**
   * Initialize worker pool for parallel processing
   */
  initWorkers(): void {
    if (!this.config.useWorkers || typeof Worker === 'undefined') return;

    // Create worker pool
    const workerCode = `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        let result;

        switch (type) {
          case 'pathfind':
            result = computePath(data);
            break;
          case 'collision':
            result = checkCollisions(data);
            break;
          case 'physics':
            result = updatePhysics(data);
            break;
          default:
            result = data;
        }

        self.postMessage({ taskId, result });
      };

      function computePath(data) {
        // A* pathfinding would go here
        return { path: data.path || [] };
      }

      function checkCollisions(data) {
        // Collision detection
        return { collisions: [] };
      }

      function updatePhysics(data) {
        // Physics simulation
        return data;
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    for (let i = 0; i < this.config.maxWorkers; i++) {
      try {
        const worker = new Worker(workerUrl);
        worker.onmessage = (e) => {
          const { taskId, result } = e.data;
          const callback = this.workerTasks.get(taskId);
          if (callback) {
            callback(result);
            this.workerTasks.delete(taskId);
          }
        };
        this.workers.push(worker);
      } catch (err) {
        console.warn('[Performance] Worker creation failed:', err);
      }
    }

    this.metrics.workerCount = this.workers.length;
    console.log('[Performance] Worker pool initialized:', this.workers.length);
  }

  /**
   * Offload task to worker
   */
  offloadTask<T>(type: string, data: any): Promise<T> {
    return new Promise((resolve) => {
      if (this.workers.length === 0) {
        resolve(data as T);
        return;
      }

      const taskId = this.nextTaskId++;
      const workerIndex = taskId % this.workers.length;

      this.workerTasks.set(taskId, resolve);
      this.workers[workerIndex].postMessage({ taskId, type, data });
    });
  }

  /**
   * Start performance-optimized game loop
   */
  startLoop(update: (deltaTime: number) => void, render: () => void): void {
    const loop = (timestamp: number) => {
      this.rafId = requestAnimationFrame(loop);

      // Frame timing
      const deltaTime = timestamp - this.lastFrameTime;

      // Skip frame if too fast (for capped FPS)
      if (this.frameInterval > 0 && deltaTime < this.frameInterval) {
        return;
      }

      this.lastFrameTime = timestamp;

      // Track FPS
      this.frameCount++;
      this.frameTimes.push(deltaTime);
      if (this.frameTimes.length > 60) this.frameTimes.shift();

      if (timestamp - this.lastFPSUpdate >= 1000) {
        this.metrics.fps = this.frameCount;
        this.metrics.frameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.frameCount = 0;
        this.lastFPSUpdate = timestamp;
      }

      // Update game logic
      update(deltaTime / 1000);

      // Render
      render();
    };

    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * Stop game loop
   */
  stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Get optimal WebGL context attributes
   */
  getWebGLAttributes(): WebGLContextAttributes {
    return {
      alpha: false,               // No transparency needed
      antialias: this.config.quality !== 'low',
      depth: true,
      stencil: false,             // Not needed for this game
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
      desynchronized: true,       // Lower latency
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    // Update memory if available
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      this.metrics.memoryUsed = mem.usedJSHeapSize / (1024 * 1024);
    }

    return { ...this.metrics };
  }

  /**
   * Get current config
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  setConfig(updates: Partial<PerformanceConfig>): void {
    Object.assign(this.config, updates);
    if (updates.targetFPS) {
      this.frameInterval = updates.targetFPS === 'unlimited' ? 0 : 1000 / updates.targetFPS;
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopLoop();
    this.workers.forEach(w => w.terminate());
    this.workers = [];
  }
}

// Singleton
export const performanceManager = new PerformanceManager();
