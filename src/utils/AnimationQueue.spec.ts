import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { animationQueue } from './AnimationQueue';

describe('AnimationQueue', () => {
  beforeEach(async () => {
    animationQueue.clearAll();
    // Wait for any existing animations to complete
    await animationQueue.waitForCompletion();
  });

  test('enqueues animations in priority order', async () => {
    const mockAnimation = jest.fn(() => Promise.resolve());

    // Use a blocking animation to prevent auto-processing
    let resolveBlock: () => void;
    const blockingPromise = new Promise<void>(resolve => {
      resolveBlock = resolve;
    });
    animationQueue.enqueue('blocking', () => blockingPromise, 'critical');

    animationQueue.enqueue('card_play', mockAnimation, 'low');
    animationQueue.enqueue('trump_reveal', mockAnimation, 'high');
    animationQueue.enqueue('deal', mockAnimation, 'normal');
    animationQueue.enqueue('trick_collect', mockAnimation, 'critical');

    const status = animationQueue.getStatus();
    // First animation is already being processed, so we check the queue
    expect(status.queuedTypes).toEqual([
      'trick_collect',
      'trump_reveal',
      'deal',
      'card_play',
    ]);

    // Clean up
    resolveBlock!();
    await animationQueue.waitForCompletion();
  });

  test('processes animations sequentially', async () => {
    const order: number[] = [];

    const animation1 = jest.fn(
      () =>
        new Promise<void>(resolve => {
          setTimeout(() => {
            order.push(1);
            resolve();
          }, 10);
        }),
    );

    const animation2 = jest.fn(
      () =>
        new Promise<void>(resolve => {
          setTimeout(() => {
            order.push(2);
            resolve();
          }, 10);
        }),
    );

    animationQueue.enqueue('card_play', animation1);
    animationQueue.enqueue('trump_reveal', animation2);

    await animationQueue.waitForCompletion();

    expect(order).toEqual([1, 2]);
    expect(animation1).toHaveBeenCalledTimes(1);
    expect(animation2).toHaveBeenCalledTimes(1);
  });

  test('cancels animations by id', async () => {
    const mockAnimation = jest.fn(() => Promise.resolve());
    const onCancel = jest.fn();

    // Use a blocking animation to prevent auto-processing
    let resolveBlock: () => void;
    const blockingPromise = new Promise<void>(resolve => {
      resolveBlock = resolve;
    });
    animationQueue.enqueue('blocking', () => blockingPromise, 'critical');

    const id1 = animationQueue.enqueue('card_play', mockAnimation);
    const id2 = animationQueue.enqueue(
      'trump_reveal',
      mockAnimation,
      'normal',
      { onCancel },
    );

    const cancelled = animationQueue.cancel(id2);

    expect(cancelled).toBe(true);
    expect(onCancel).toHaveBeenCalled();

    const status = animationQueue.getStatus();
    expect(status.queueLength).toBe(1); // Only card_play remains

    // Clean up
    resolveBlock!();
    await animationQueue.waitForCompletion();
  });

  test('cancels all animations of a specific type', async () => {
    const mockAnimation = jest.fn(() => Promise.resolve());

    // Use a blocking animation to prevent auto-processing
    let resolveBlock: () => void;
    const blockingPromise = new Promise<void>(resolve => {
      resolveBlock = resolve;
    });
    animationQueue.enqueue('blocking', () => blockingPromise, 'critical');

    animationQueue.enqueue('card_play', mockAnimation);
    animationQueue.enqueue('card_play', mockAnimation);
    animationQueue.enqueue('trump_reveal', mockAnimation);
    animationQueue.enqueue('card_play', mockAnimation);

    const cancelledCount = animationQueue.cancelType('card_play');

    expect(cancelledCount).toBe(3);

    const status = animationQueue.getStatus();
    expect(status.queuedTypes).toEqual(['trump_reveal']);

    // Clean up
    resolveBlock!();
    await animationQueue.waitForCompletion();
  });

  test('clears all pending animations', async () => {
    const mockAnimation = jest.fn(() => Promise.resolve());
    const onCancel1 = jest.fn();
    const onCancel2 = jest.fn();

    // Use a blocking animation to prevent auto-processing
    let resolveBlock: () => void;
    const blockingPromise = new Promise<void>(resolve => {
      resolveBlock = resolve;
    });
    animationQueue.enqueue('blocking', () => blockingPromise, 'critical');

    animationQueue.enqueue('card_play', mockAnimation, 'normal', {
      onCancel: onCancel1,
    });
    animationQueue.enqueue('trump_reveal', mockAnimation, 'normal', {
      onCancel: onCancel2,
    });

    animationQueue.clearAll();

    expect(onCancel1).toHaveBeenCalled();
    expect(onCancel2).toHaveBeenCalled();

    const status = animationQueue.getStatus();
    expect(status.queueLength).toBe(0);

    // Clean up blocking animation
    resolveBlock!();
  });

  test('checks if animation type exists in queue', () => {
    const mockAnimation = jest.fn(() => Promise.resolve());

    animationQueue.enqueue('card_play', mockAnimation);
    animationQueue.enqueue('trump_reveal', mockAnimation);

    expect(animationQueue.hasAnimation('card_play')).toBe(true);
    expect(animationQueue.hasAnimation('trump_reveal')).toBe(true);
    expect(animationQueue.hasAnimation('cante')).toBe(false);
  });

  test('handles animation errors gracefully', async () => {
    const errorAnimation = jest.fn(() =>
      Promise.reject(new Error('Test error')),
    );
    const successAnimation = jest.fn(() => Promise.resolve());
    const onCancel = jest.fn();

    animationQueue.enqueue('card_play', errorAnimation, 'normal', { onCancel });
    animationQueue.enqueue('trump_reveal', successAnimation);

    await animationQueue.waitForCompletion();

    expect(errorAnimation).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
    expect(successAnimation).toHaveBeenCalled();
  });

  test('calls onComplete callback when animation succeeds', async () => {
    const mockAnimation = jest.fn(() => Promise.resolve());
    const onComplete = jest.fn();

    animationQueue.enqueue('card_play', mockAnimation, 'normal', {
      onComplete,
    });

    await animationQueue.waitForCompletion();

    expect(onComplete).toHaveBeenCalled();
  });

  test('does not process empty queue', async () => {
    const status = animationQueue.getStatus();
    expect(status.isProcessing).toBe(false);
    expect(status.currentAnimation).toBe(null);
    expect(status.queueLength).toBe(0);
  });
});
