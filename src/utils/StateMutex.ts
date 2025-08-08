/**
 * Simple mutex implementation to prevent concurrent state updates
 */
export class StateMutex {
  private isLocked = false;
  private queue: Array<() => void> = [];

  /**
   * Acquire the lock
   */
  async acquire(): Promise<void> {
    return new Promise(resolve => {
      if (!this.isLocked) {
        this.isLocked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  /**
   * Release the lock
   */
  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    } else {
      this.isLocked = false;
    }
  }

  /**
   * Execute a function with the lock
   */
  async withLock<T>(fn: () => T | Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /**
   * Check if locked
   */
  get locked(): boolean {
    return this.isLocked;
  }

  /**
   * Get queue size
   */
  get queueSize(): number {
    return this.queue.length;
  }
}

/**
 * State update queue to ensure sequential processing
 */
export class StateUpdateQueue<T> {
  private queue: Array<{
    id: string;
    update: (prev: T) => T | Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing = false;
  private currentState: T;
  private updateCounter = 0;

  constructor(initialState: T) {
    this.currentState = initialState;
  }

  /**
   * Enqueue a state update
   */
  async enqueue(update: (prev: T) => T | Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `update_${++this.updateCounter}`;
      this.queue.push({ id, update, resolve, reject });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued updates sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      try {
        console.log(`📝 Processing state update: ${item.id}`);
        this.currentState = await item.update(this.currentState);
        item.resolve(this.currentState);
      } catch (error) {
        console.error(`❌ State update failed: ${item.id}`, error);
        item.reject(error as Error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get current state
   */
  getState(): T {
    return this.currentState;
  }

  /**
   * Clear all pending updates
   */
  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Get queue status
   */
  getStatus(): { isProcessing: boolean; queueSize: number } {
    return {
      isProcessing: this.isProcessing,
      queueSize: this.queue.length,
    };
  }
}

/**
 * Debounced state updater to prevent rapid successive updates
 */
export class DebouncedUpdater<T> {
  private timeoutId: NodeJS.Timeout | null = null;
  private pendingUpdate: ((prev: T) => T) | null = null;

  constructor(
    private readonly applyUpdate: (update: (prev: T) => T) => void,
    private readonly delay: number = 100,
  ) {}

  /**
   * Schedule an update (cancels previous pending update)
   */
  update(update: (prev: T) => T): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.pendingUpdate = update;
    this.timeoutId = setTimeout(() => {
      if (this.pendingUpdate) {
        this.applyUpdate(this.pendingUpdate);
        this.pendingUpdate = null;
      }
      this.timeoutId = null;
    }, this.delay);
  }

  /**
   * Cancel pending update
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingUpdate = null;
  }

  /**
   * Force immediate execution of pending update
   */
  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.pendingUpdate) {
      this.applyUpdate(this.pendingUpdate);
      this.pendingUpdate = null;
    }
  }
}
