/**
 * PerformanceMonitor - Real-time FPS and memory tracking
 *
 * Wrap any screen or component with this monitor to track performance metrics
 *
 * Usage:
 * ```
 * import { PerformanceMonitor } from '../utils/PerformanceMonitor';
 *
 * function MyScreen() {
 *   return (
 *     <PerformanceMonitor name="MyScreen" showOverlay={true}>
 *       <View>...</View>
 *     </PerformanceMonitor>
 *   );
 * }
 * ```
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { performance } from 'react-native-performance';

// Global performance data storage
const performanceData = {};

export class PerformanceTracker {
  constructor(name) {
    this.name = name;
    this.frameCount = 0;
    this.totalFrameTime = 0;
    this.frameTimes = [];
    this.maxFrames = 60; // Keep last 60 frames
    this.startTime = Date.now();
    this.lastFrameTime = Date.now();

    // Memory tracking
    this.memoryBaseline = null;
    this.memoryPeak = 0;

    performanceData[name] = {
      fps: 0,
      avgFrameTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      frameCount: 0,
      memory: 0,
      memoryDelta: 0,
      dropped: 0,
    };
  }

  startFrame() {
    this.frameStartTime = performance.now();
  }

  endFrame() {
    if (!this.frameStartTime) return;

    const now = performance.now();
    const frameTime = now - this.frameStartTime;

    // Update statistics
    this.frameCount++;
    this.totalFrameTime += frameTime;
    this.frameTimes.push(frameTime);

    // Keep only last N frames
    if (this.frameTimes.length > this.maxFrames) {
      this.frameTimes.shift();
    }

    // Calculate metrics
    const avgFrameTime = this.totalFrameTime / this.frameCount;
    const fps = 1000 / avgFrameTime;
    const minFrameTime = Math.min(...this.frameTimes);
    const maxFrameTime = Math.max(...this.frameTimes);

    // Count dropped frames (> 16.67ms = below 60 FPS)
    const droppedFrames = this.frameTimes.filter(t => t > 16.67).length;

    // Update global data
    performanceData[this.name] = {
      fps: Math.round(fps * 10) / 10,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      minFrameTime: Math.round(minFrameTime * 100) / 100,
      maxFrameTime: Math.round(maxFrameTime * 100) / 100,
      frameCount: this.frameCount,
      dropped: droppedFrames,
      droppedPercent: Math.round((droppedFrames / this.frameTimes.length) * 100),
    };

    this.frameStartTime = null;
  }

  recordMemory(memoryMB) {
    if (this.memoryBaseline === null) {
      this.memoryBaseline = memoryMB;
    }

    if (memoryMB > this.memoryPeak) {
      this.memoryPeak = memoryMB;
    }

    performanceData[this.name].memory = Math.round(memoryMB);
    performanceData[this.name].memoryDelta = Math.round(memoryMB - this.memoryBaseline);
    performanceData[this.name].memoryPeak = Math.round(this.memoryPeak);
  }

  getMetrics() {
    return performanceData[this.name];
  }

  static getAllMetrics() {
    return performanceData;
  }

  static reset(name) {
    if (name) {
      delete performanceData[name];
    } else {
      Object.keys(performanceData).forEach(key => delete performanceData[key]);
    }
  }

  static getReport() {
    const names = Object.keys(performanceData);
    if (names.length === 0) {
      return 'No performance data collected';
    }

    let report = '\n┌─────────────────── PERFORMANCE REPORT ───────────────────┐\n';

    names.forEach(name => {
      const data = performanceData[name];
      const fpsColor = data.fps >= 55 ? '✅' : data.fps >= 40 ? '⚠️' : '❌';
      const memoryColor = data.memoryDelta < 50 ? '✅' : data.memoryDelta < 100 ? '⚠️' : '❌';

      report += `\n${name}:\n`;
      report += `  ${fpsColor} FPS: ${data.fps} (avg frame time: ${data.avgFrameTime}ms)\n`;
      report += `  📊 Frame Times: min=${data.minFrameTime}ms, max=${data.maxFrameTime}ms\n`;
      report += `  🔻 Dropped Frames: ${data.dropped} (${data.droppedPercent}%)\n`;
      if (data.memory) {
        report += `  ${memoryColor} Memory: ${data.memory}MB (Δ${data.memoryDelta}MB, peak=${data.memoryPeak}MB)\n`;
      }
      report += `  🎬 Total Frames: ${data.frameCount}\n`;
    });

    report += '\n└──────────────────────────────────────────────────────────┘\n';
    return report;
  }
}

/**
 * Performance Monitor Component
 *
 * Wraps children and tracks performance metrics
 */
export function PerformanceMonitor({
  children,
  name = 'UnnamedComponent',
  showOverlay = false,
  logInterval = 5000, // Log every 5 seconds
  onMetricsUpdate,
}) {
  const trackerRef = useRef(null);
  const frameIdRef = useRef(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Initialize tracker
    trackerRef.current = new PerformanceTracker(name);

    // Frame tracking loop
    const trackFrame = () => {
      if (trackerRef.current) {
        trackerRef.current.startFrame();

        // Simulate frame end (in real app, this would be after render)
        requestAnimationFrame(() => {
          if (trackerRef.current) {
            trackerRef.current.endFrame();

            // Update overlay
            if (showOverlay) {
              setMetrics(trackerRef.current.getMetrics());
            }

            // Callback
            if (onMetricsUpdate) {
              onMetricsUpdate(trackerRef.current.getMetrics());
            }
          }

          // Next frame
          frameIdRef.current = requestAnimationFrame(trackFrame);
        });
      }
    };

    frameIdRef.current = requestAnimationFrame(trackFrame);

    // Logging interval
    const logIntervalId = setInterval(() => {
      if (trackerRef.current) {
        const metrics = trackerRef.current.getMetrics();
      }
    }, logInterval);

    // Memory tracking (iOS only, requires native module)
    let memoryIntervalId;
    if (Platform.OS === 'ios' && global.performance?.memory) {
      memoryIntervalId = setInterval(() => {
        if (trackerRef.current && global.performance.memory) {
          const memoryMB = global.performance.memory.usedJSHeapSize / 1024 / 1024;
          trackerRef.current.recordMemory(memoryMB);
        }
      }, 1000);
    }

    // Cleanup
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      clearInterval(logIntervalId);
      if (memoryIntervalId) {
        clearInterval(memoryIntervalId);
      }

      // Final report
    };
  }, [name, showOverlay, logInterval, onMetricsUpdate]);

  return (
    <View style={styles.container}>
      {children}

      {showOverlay && metrics && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Text style={styles.overlayTitle}>{name}</Text>
            <Text style={[styles.overlayText, getFPSStyle(metrics.fps)]}>
              FPS: {metrics.fps}
            </Text>
            <Text style={styles.overlayText}>
              Frame: {metrics.avgFrameTime}ms
            </Text>
            <Text style={styles.overlayText}>
              Dropped: {metrics.droppedPercent}%
            </Text>
            {metrics.memory && (
              <Text style={styles.overlayText}>
                Mem: {metrics.memory}MB (Δ{metrics.memoryDelta}MB)
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function getFPSStyle(fps) {
  if (fps >= 55) return styles.fpsGood;
  if (fps >= 40) return styles.fpsWarning;
  return styles.fpsBad;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8a2be2',
    minWidth: 150,
  },
  overlayContent: {
    gap: 4,
  },
  overlayTitle: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fpsGood: {
    color: '#51cf66',
  },
  fpsWarning: {
    color: '#ffa500',
  },
  fpsBad: {
    color: '#ff6b6b',
  },
});

/**
 * Hook version for functional components
 */
export function usePerformanceMonitor(name = 'UnnamedComponent') {
  const trackerRef = useRef(null);

  useEffect(() => {
    trackerRef.current = new PerformanceTracker(name);

    return () => {
      if (trackerRef.current) {
      }
    };
  }, [name]);

  return {
    startFrame: () => trackerRef.current?.startFrame(),
    endFrame: () => trackerRef.current?.endFrame(),
    getMetrics: () => trackerRef.current?.getMetrics(),
  };
}

/**
 * Utility to get all performance data
 */
export function getAllPerformanceMetrics() {
  return PerformanceTracker.getAllMetrics();
}

/**
 * Utility to reset performance data
 */
export function resetPerformanceMetrics(name) {
  PerformanceTracker.reset(name);
}

/**
 * Utility to print performance report
 */
export function printPerformanceReport() {
}

export default PerformanceMonitor;
