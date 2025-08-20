import { Animated } from 'react-native';

export type AnimationType =
  | 'deal'
  | 'trump_reveal'
  | 'card_play'
  | 'trick_collect'
  | 'cante'
  | 'cambiar7'
  | 'score_update'
  | 'blocking'; // For testing purposes

export type AnimationPriority = 'low' | 'normal' | 'high' | 'critical';

interface QueuedAnimation {
  id: string;
  type: AnimationType;
  priority: AnimationPriority;
  animation: () => Promise<void>;
  onComplete?: () => void;
  onCancel?: () => void;
}

class AnimationQueueManager {
  private queue: QueuedAnimation[] = [];
  private isProcessing = false;
  private currentAnimation: QueuedAnimation | null = null;
  private animationCounter = 0;

  /**
   * Add an animation to the queue
   */
  enqueue(
    type: AnimationType,
    animation: () => Promise<void>,
    priority: AnimationPriority = 'normal',
    callbacks?: {
      onComplete?: () => void;
      onCancel?: () => void;
    },
  ): string {
    const id = `${type}_${++this.animationCounter}`;
    const queuedAnimation: QueuedAnimation = {
      id,
      type,
      priority,
      animation,
      ...callbacks,
    };

    // Insert based on priority
    const priorityOrder: AnimationPriority[] = ['critical', 'high', 'normal', 'low'];
    const insertIndex = this.queue.findIndex(
      item => priorityOrder.indexOf(item.priority) > priorityOrder.indexOf(priority),
    );

    if (insertIndex === -1) {
      this.queue.push(queuedAnimation);
    } else {
      this.queue.splice(insertIndex, 0, queuedAnimation);
    }

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Process animations in the queue
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      this.currentAnimation = this.queue.shift()!;

      try {
        console.log(`🎬 Starting animation: ${this.currentAnimation.type}`);
        await this.currentAnimation.animation();
        this.currentAnimation.onComplete?.();
        console.log(`✅ Completed animation: ${this.currentAnimation.type}`);
      } catch (error) {
        console.error(`❌ Animation failed: ${this.currentAnimation.type}`, error);
        this.currentAnimation.onCancel?.();
      }
    }

    this.currentAnimation = null;
    this.isProcessing = false;
  }

  /**
   * Cancel a specific animation
   */
  cancel(id: string): boolean {
    // If it's the current animation, we can't cancel it
    if (this.currentAnimation?.id === id) {
      console.warn(`Cannot cancel currently running animation: ${id}`);
      return false;
    }

    // Remove from queue
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      const cancelled = this.queue.splice(index, 1)[0];
      cancelled.onCancel?.();
      console.log(`🚫 Cancelled animation: ${cancelled.type}`);
      return true;
    }

    return false;
  }

  /**
   * Cancel all animations of a specific type
   */
  cancelType(type: AnimationType): number {
    const toCancel = this.queue.filter(item => item.type === type);
    toCancel.forEach(item => {
      this.cancel(item.id);
    });
    return toCancel.length;
  }

  /**
   * Clear all pending animations
   */
  clearAll(): void {
    const cancelled = [...this.queue];
    this.queue = [];
    cancelled.forEach(item => item.onCancel?.());
    console.log(`🧹 Cleared ${cancelled.length} animations from queue`);
  }

  /**
   * Check if a specific type of animation is queued or running
   */
  hasAnimation(type: AnimationType): boolean {
    return this.currentAnimation?.type === type || this.queue.some(item => item.type === type);
  }

  /**
   * Get queue status
   */
  getStatus(): {
    isProcessing: boolean;
    currentAnimation: AnimationType | null;
    queueLength: number;
    queuedTypes: AnimationType[];
  } {
    return {
      isProcessing: this.isProcessing,
      currentAnimation: this.currentAnimation?.type || null,
      queueLength: this.queue.length,
      queuedTypes: this.queue.map(item => item.type),
    };
  }

  /**
   * Wait for all animations to complete
   */
  async waitForCompletion(): Promise<void> {
    return new Promise(resolve => {
      const checkCompletion = () => {
        if (!this.isProcessing && this.queue.length === 0) {
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      checkCompletion();
    });
  }
}

// Singleton instance
export const animationQueue = new AnimationQueueManager();

// Helper functions for common animations
export const queueCardAnimation = (
  animation: Animated.CompositeAnimation,
  type: AnimationType = 'card_play',
  priority: AnimationPriority = 'normal',
): Promise<void> => {
  return new Promise((resolve, reject) => {
    animationQueue.enqueue(
      type,
      () =>
        new Promise((animResolve, animReject) => {
          animation.start(({ finished }) => {
            if (finished) {
              animResolve();
            } else {
              animReject(new Error('Animation interrupted'));
            }
          });
        }),
      priority,
      {
        onComplete: resolve,
        onCancel: () => reject(new Error('Animation cancelled')),
      },
    );
  });
};

export const queueSequentialAnimations = async (
  animations: Array<{
    animation: Animated.CompositeAnimation;
    type?: AnimationType;
    delay?: number;
  }>,
): Promise<void> => {
  for (const { animation, type = 'card_play', delay = 0 } of animations) {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    await queueCardAnimation(animation, type);
  }
};

export const queueParallelAnimations = (
  animations: Array<{
    animation: Animated.CompositeAnimation;
    type?: AnimationType;
  }>,
): Promise<void[]> => {
  return Promise.all(
    animations.map(({ animation, type = 'card_play' }) => queueCardAnimation(animation, type)),
  );
};
