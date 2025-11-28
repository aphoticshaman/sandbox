/**
 * Performance Monitoring Utilities
 * Track and log performance metrics
 *
 * Features:
 * - Screen load time tracking
 * - Memory usage monitoring
 * - Render performance tracking
 * - FPS monitoring (development only)
 */

import { InteractionManager } from 'react-native';

// Performance marks storage
const performanceMarks = new Map();

/**
 * Mark the start of a performance measurement
 */
export function markStart(label) {
  performanceMarks.set(label, Date.now());
}

/**
 * Mark the end of a performance measurement and log the duration
 */
export function markEnd(label) {
  const startTime = performanceMarks.get(label);
  if (startTime) {
    const duration = Date.now() - startTime;
    performanceMarks.delete(label);

    // Log in development
    if (__DEV__) {
      const status = duration < 100 ? '✅' : duration < 500 ? '⚠️' : '❌';
    }

    return duration;
  }
  return null;
}

/**
 * Measure the execution time of a function
 */
export async function measureAsync(label, fn) {
  markStart(label);
  try {
    const result = await fn();
    markEnd(label);
    return result;
  } catch (error) {
    markEnd(label);
    throw error;
  }
}

/**
 * Wait for interactions to complete before measuring
 * Useful for measuring actual user-perceived load time
 */
export function measureAfterInteractions(label, callback) {
  markStart(label);
  InteractionManager.runAfterInteractions(() => {
    markEnd(label);
    if (callback) callback();
  });
}

/**
 * Track component mount time
 * Use in useEffect(() => { trackMount('MyComponent'); }, []);
 */
export function trackMount(componentName) {
  markEnd(`${componentName}_mount`);
}

/**
 * Start tracking component mount
 * Call before component renders
 */
export function startTrackMount(componentName) {
  markStart(`${componentName}_mount`);
}

/**
 * Memory usage monitoring (development only)
 */
export function logMemoryUsage() {
  if (__DEV__ && global.performance && global.performance.memory) {
    const memory = global.performance.memory;
      used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
    });
  }
}

/**
 * Get current memory usage
 */
export function getMemoryUsage() {
  if (global.performance && global.performance.memory) {
    return {
      used: Math.round(global.performance.memory.usedJSHeapSize / 1048576),
      total: Math.round(global.performance.memory.totalJSHeapSize / 1048576),
      limit: Math.round(global.performance.memory.jsHeapSizeLimit / 1048576),
    };
  }
  return null;
}

/**
 * Performance targets
 */
export const PERFORMANCE_TARGETS = {
  SCREEN_LOAD: 100, // ms
  INTERACTION: 16, // ms (60fps)
  ANIMATION: 16, // ms (60fps)
  MEMORY_BASELINE: 50, // MB
  MEMORY_PEAK: 150, // MB
};

/**
 * Check if performance target is met
 */
export function meetsTarget(duration, target) {
  return duration <= target;
}

/**
 * Performance warning thresholds
 */
export const THRESHOLDS = {
  GOOD: 100,
  WARNING: 500,
  SLOW: 1000,
};

/**
 * Get performance status emoji
 */
export function getPerformanceStatus(duration) {
  if (duration < THRESHOLDS.GOOD) return '✅';
  if (duration < THRESHOLDS.WARNING) return '⚠️';
  return '❌';
}

/**
 * Batch performance logger
 * Logs multiple marks at once
 */
export function logPerformanceReport(marks) {
  if (!__DEV__) return;

  console.group('📊 Performance Report');
  Object.entries(marks).forEach(([label, duration]) => {
    const status = getPerformanceStatus(duration);
  });
  console.groupEnd();
}

/**
 * FPS Counter (development only)
 * Measures frames per second
 */
let lastFrameTime = Date.now();
let frameCount = 0;
let currentFPS = 60;

export function measureFPS() {
  if (!__DEV__) return 60;

  frameCount++;
  const now = Date.now();
  const delta = now - lastFrameTime;

  if (delta >= 1000) {
    currentFPS = Math.round((frameCount * 1000) / delta);
    frameCount = 0;
    lastFrameTime = now;
  }

  return currentFPS;
}

/**
 * Start FPS monitoring
 */
export function startFPSMonitoring() {
  if (!__DEV__) return;

  const interval = setInterval(() => {
    const fps = measureFPS();
    if (fps < 50) {
      console.warn(`[Performance] Low FPS: ${fps}`);
    }
  }, 1000);

  return () => clearInterval(interval);
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default {
  markStart,
  markEnd,
  measureAsync,
  measureAfterInteractions,
  trackMount,
  startTrackMount,
  logMemoryUsage,
  getMemoryUsage,
  meetsTarget,
  getPerformanceStatus,
  logPerformanceReport,
  measureFPS,
  startFPSMonitoring,
  debounce,
  throttle,
  PERFORMANCE_TARGETS,
  THRESHOLDS,
};
