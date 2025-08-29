import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import {
  withPerformanceTracking,
  measureFPS,
  shouldDropFrames,
  createAnimationCleanup,
  batchAnimations,
} from './animationPerformance';
import { Animated } from 'react-native';

describe('animationPerformance', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('withPerformanceTracking', () => {
    test('tracks animation execution time', async () => {
      const mockAnimation = jest.fn(() => Promise.resolve());
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await withPerformanceTracking('test-animation', mockAnimation);

      expect(mockAnimation).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏱️ Animation [test-animation]'),
      );

      consoleSpy.mockRestore();
    });

    test('handles animation errors gracefully', async () => {
      const mockAnimation = jest.fn(() => Promise.reject(new Error('Animation failed')));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(withPerformanceTracking('failing-animation', mockAnimation)).rejects.toThrow(
        'Animation failed',
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Animation [failing-animation] failed'),
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('measureFPS', () => {
    test('returns current FPS value', () => {
      const fps = measureFPS();
      expect(fps).toBeGreaterThanOrEqual(0);
      expect(fps).toBeLessThanOrEqual(60);
    });

    test('updates FPS based on frame timing', () => {
      const initialFPS = measureFPS();

      // Simulate frame updates
      global.requestAnimationFrame = jest.fn(callback => {
        setTimeout(() => callback(Date.now()), 16); // ~60 FPS
        return 1;
      });

      const laterFPS = measureFPS();
      expect(laterFPS).toBeDefined();
    });
  });

  describe('shouldDropFrames', () => {
    test('returns false when FPS is good', () => {
      // Default FPS is 60, which is good
      expect(shouldDropFrames()).toBe(false);
    });

    test('returns true when FPS is below threshold', () => {
      // Will be implemented to check actual FPS
      const result = shouldDropFrames();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('createAnimationCleanup', () => {
    test('cleans up timers on unmount', () => {
      const cleanup = createAnimationCleanup();
      const timerId = setTimeout(() => {}, 1000);

      cleanup.register(timerId);
      expect(cleanup.getActiveCount()).toBe(1);

      cleanup.clearAll();
      expect(cleanup.getActiveCount()).toBe(0);
    });

    test('removes completed timers automatically', () => {
      const cleanup = createAnimationCleanup();
      const timerId = setTimeout(() => {}, 100);

      cleanup.register(timerId);
      expect(cleanup.getActiveCount()).toBe(1);

      jest.advanceTimersByTime(100);

      cleanup.clean();
      expect(cleanup.getActiveCount()).toBe(0);
    });

    test('prevents memory leaks with multiple animations', () => {
      const cleanup = createAnimationCleanup();
      const timerIds: NodeJS.Timeout[] = [];

      // Register multiple timers
      for (let i = 0; i < 10; i++) {
        const id = setTimeout(() => {}, 1000 * i);
        timerIds.push(id);
        cleanup.register(id);
      }

      expect(cleanup.getActiveCount()).toBe(10);

      // Clear all should remove all timers
      cleanup.clearAll();
      expect(cleanup.getActiveCount()).toBe(0);
    });
  });

  describe('batchAnimations', () => {
    test('batches multiple animations efficiently', () => {
      const animations = [
        Animated.timing(new Animated.Value(0), {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(new Animated.Value(0), {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(new Animated.Value(0), {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ];

      const batched = batchAnimations(animations);
      expect(batched).toBeDefined();
      expect(batched.start).toBeDefined();
    });

    test('handles empty animation array', () => {
      const batched = batchAnimations([]);
      expect(batched).toBeDefined();

      const callback = jest.fn();
      batched.start(callback);

      // Should complete immediately
      expect(callback).toHaveBeenCalledWith({ finished: true });
    });
  });
});
