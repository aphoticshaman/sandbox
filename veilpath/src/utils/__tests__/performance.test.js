/**
 * Performance Utilities Test Suite
 * Tests for performance monitoring and optimization utilities
 */

import {
  markStart,
  markEnd,
  measureAsync,
  measureAfterInteractions,
  trackMount,
  startTrackMount,
  getMemoryUsage,
  meetsTarget,
  getPerformanceStatus,
  logPerformanceReport,
  debounce,
  throttle,
  PERFORMANCE_TARGETS,
  THRESHOLDS,
} from '../performance';

// Mock global performance API
global.performance = {
  memory: {
    usedJSHeapSize: 50 * 1048576, // 50MB
    totalJSHeapSize: 100 * 1048576, // 100MB
    jsHeapSizeLimit: 200 * 1048576, // 200MB
  },
};

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn(),
};

// Mock __DEV__
global.__DEV__ = true;

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Performance Marking', () => {
    test('markStart and markEnd measure duration correctly', () => {
      markStart('test_operation');

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 50) {
        // Wait 50ms
      }

      const duration = markEnd('test_operation');

      expect(duration).toBeGreaterThanOrEqual(50);
      expect(duration).toBeLessThan(100);
    });

    test('markEnd returns null for non-existent mark', () => {
      const duration = markEnd('non_existent');
      expect(duration).toBeNull();
    });

    test('markEnd logs performance status in dev mode', () => {
      markStart('fast_operation');
      const duration = markEnd('fast_operation');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[Performance]')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('fast_operation')
      );
    });
  });

  describe('Async Measurement', () => {
    test('measureAsync measures async function duration', async () => {
      const asyncFn = async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('result'), 50);
        });
      };

      const result = await measureAsync('async_test', asyncFn);

      expect(result).toBe('result');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('async_test')
      );
    });

    test('measureAsync handles errors and still logs duration', async () => {
      const errorFn = async () => {
        throw new Error('Test error');
      };

      await expect(measureAsync('error_test', errorFn)).rejects.toThrow('Test error');
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('Component Mount Tracking', () => {
    test('startTrackMount and trackMount work together', () => {
      startTrackMount('TestComponent');

      // Simulate component mount time
      const start = Date.now();
      while (Date.now() - start < 30) {
        // Wait 30ms
      }

      trackMount('TestComponent');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent_mount')
      );
    });
  });

  describe('Memory Monitoring', () => {
    test('getMemoryUsage returns memory stats', () => {
      const memory = getMemoryUsage();

      expect(memory).toEqual({
        used: 50,
        total: 100,
        limit: 200,
      });
    });

    test('getMemoryUsage returns null when performance.memory is unavailable', () => {
      const originalPerformance = global.performance;
      global.performance = {};

      const memory = getMemoryUsage();
      expect(memory).toBeNull();

      global.performance = originalPerformance;
    });
  });

  describe('Performance Targets', () => {
    test('PERFORMANCE_TARGETS has correct values', () => {
      expect(PERFORMANCE_TARGETS.SCREEN_LOAD).toBe(100);
      expect(PERFORMANCE_TARGETS.INTERACTION).toBe(16);
      expect(PERFORMANCE_TARGETS.ANIMATION).toBe(16);
      expect(PERFORMANCE_TARGETS.MEMORY_BASELINE).toBe(50);
      expect(PERFORMANCE_TARGETS.MEMORY_PEAK).toBe(150);
    });

    test('meetsTarget correctly evaluates performance', () => {
      expect(meetsTarget(50, 100)).toBe(true);
      expect(meetsTarget(100, 100)).toBe(true);
      expect(meetsTarget(150, 100)).toBe(false);
    });
  });

  describe('Performance Status', () => {
    test('getPerformanceStatus returns correct emoji', () => {
      expect(getPerformanceStatus(50)).toBe('✅'); // Good
      expect(getPerformanceStatus(99)).toBe('✅'); // Good
      expect(getPerformanceStatus(100)).toBe('⚠️'); // Warning
      expect(getPerformanceStatus(499)).toBe('⚠️'); // Warning
      expect(getPerformanceStatus(500)).toBe('❌'); // Slow
      expect(getPerformanceStatus(1000)).toBe('❌'); // Slow
    });

    test('THRESHOLDS has correct values', () => {
      expect(THRESHOLDS.GOOD).toBe(100);
      expect(THRESHOLDS.WARNING).toBe(500);
      expect(THRESHOLDS.SLOW).toBe(1000);
    });
  });

  describe('Performance Reporting', () => {
    test('logPerformanceReport logs multiple marks', () => {
      const marks = {
        'screen_load': 95,
        'api_call': 250,
        'animation': 15,
      };

      logPerformanceReport(marks);

      expect(console.group).toHaveBeenCalledWith('📊 Performance Report');
      expect(console.log).toHaveBeenCalledTimes(3);
      expect(console.groupEnd).toHaveBeenCalled();
    });

    test('logPerformanceReport does not log in production', () => {
      global.__DEV__ = false;

      const marks = { 'test': 100 };
      logPerformanceReport(marks);

      expect(console.group).not.toHaveBeenCalled();

      global.__DEV__ = true;
    });
  });

  describe('Debounce', () => {
    jest.useFakeTimers();

    test('debounce delays function execution', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(99);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('debounce cancels previous calls', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      jest.advanceTimersByTime(50);
      debouncedFn();
      jest.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  describe('Throttle', () => {
    jest.useFakeTimers();

    test('throttle limits function execution rate', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      throttledFn();
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1); // Still only called once

      jest.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('throttle passes arguments correctly', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('arg1', 'arg2');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    jest.useRealTimers();
  });
});
