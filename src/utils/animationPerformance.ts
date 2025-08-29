import { Animated, InteractionManager } from 'react-native';

// FPS tracking
let lastFrameTime = Date.now();
let frameCount = 0;
let currentFPS = 60;

// Performance thresholds
const LOW_FPS_THRESHOLD = 30;
const TARGET_FPS = 60;
const FRAME_TIME_BUDGET = 1000 / TARGET_FPS; // ~16.67ms

/**
 * Track performance of an animation
 */
export async function withPerformanceTracking<T>(
  name: string,
  animationFn: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await animationFn();
    const duration = performance.now() - startTime;

    if (__DEV__) {
      console.log(`⏱️ Animation [${name}] completed in ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ Animation [${name}] failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Measure current FPS
 */
export function measureFPS(): number {
  const now = Date.now();
  const delta = now - lastFrameTime;

  if (delta >= 1000) {
    currentFPS = Math.min(60, (frameCount * 1000) / delta);
    frameCount = 0;
    lastFrameTime = now;
  }

  frameCount++;
  return Math.round(currentFPS);
}

/**
 * Determine if frames should be dropped for performance
 */
export function shouldDropFrames(): boolean {
  const fps = measureFPS();
  return fps < LOW_FPS_THRESHOLD;
}

/**
 * Animation cleanup manager
 */
export interface AnimationCleanup {
  register: (timer: NodeJS.Timeout) => void;
  unregister: (timer: NodeJS.Timeout) => void;
  clearAll: () => void;
  clean: () => void;
  getActiveCount: () => number;
}

export function createAnimationCleanup(): AnimationCleanup {
  const activeTimers = new Set<NodeJS.Timeout>();

  return {
    register(timer: NodeJS.Timeout) {
      activeTimers.add(timer);
    },

    unregister(timer: NodeJS.Timeout) {
      activeTimers.delete(timer);
    },

    clearAll() {
      activeTimers.forEach(timer => clearTimeout(timer));
      activeTimers.clear();
    },

    clean() {
      // Remove completed timers
      const toRemove: NodeJS.Timeout[] = [];
      activeTimers.forEach(timer => {
        // Check if timer is still active (this is a simplified check)
        if (!(timer as any)._destroyed) {
          toRemove.push(timer);
        }
      });
      toRemove.forEach(timer => activeTimers.delete(timer));
    },

    getActiveCount() {
      return activeTimers.size;
    },
  };
}

/**
 * Batch multiple animations for better performance
 */
export function batchAnimations(
  animations: Animated.CompositeAnimation[],
): Animated.CompositeAnimation {
  if (animations.length === 0) {
    // Return a no-op animation
    return {
      start: (callback?: Animated.EndCallback) => {
        callback?.({ finished: true });
      },
      stop: () => {},
      reset: () => {},
    };
  }

  return Animated.parallel(animations);
}

/**
 * Run animation after interactions complete
 */
export function runAfterInteractions(fn: () => void): void {
  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(fn);
  });
}

/**
 * Optimize animation value updates
 */
export function optimizeAnimationValue(
  value: Animated.Value,
  toValue: number,
  duration: number,
): Animated.CompositeAnimation {
  // Use native driver when possible
  return Animated.timing(value, {
    toValue,
    duration: shouldDropFrames() ? duration * 0.5 : duration, // Reduce duration if performance is poor
    useNativeDriver: true,
  });
}

/**
 * Create staggered animations with performance optimization
 */
export function createStaggeredAnimation(
  animations: Animated.CompositeAnimation[],
  staggerTime: number,
): Animated.CompositeAnimation {
  if (shouldDropFrames()) {
    // If performance is poor, run in parallel instead of staggered
    return Animated.parallel(animations);
  }

  return Animated.stagger(staggerTime, animations);
}

/**
 * Performance-aware spring animation
 */
export function performanceSpring(
  value: Animated.Value | Animated.ValueXY,
  config: Animated.SpringAnimationConfig,
): Animated.CompositeAnimation {
  const performanceConfig = { ...config };

  if (shouldDropFrames()) {
    // Reduce spring complexity for better performance
    performanceConfig.speed = (performanceConfig.speed || 12) * 1.5;
    performanceConfig.bounciness = Math.max(0, (performanceConfig.bounciness || 8) - 4);
  }

  return Animated.spring(value, {
    ...performanceConfig,
    useNativeDriver: performanceConfig.useNativeDriver ?? true,
  });
}

/**
 * Monitor and log performance in development
 */
export function startPerformanceMonitoring(): () => void {
  if (!__DEV__) {
    return () => {};
  }

  const interval = setInterval(() => {
    const fps = measureFPS();
    if (fps < LOW_FPS_THRESHOLD) {
      console.warn(`⚠️ Low FPS detected: ${fps} FPS`);
    }
  }, 2000);

  return () => clearInterval(interval);
}
