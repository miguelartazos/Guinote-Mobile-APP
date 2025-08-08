/**
 * Deadlock detector to prevent game freezes
 */
export class DeadlockDetector {
  private lastStateChange: number = Date.now();
  private checkInterval: NodeJS.Timeout | null = null;
  private deadlockTimeout: number;
  private onDeadlock: () => void;
  private isActive: boolean = false;
  private lastRecoveryAttempt: number = 0;
  private recoveryCooldown: number = 10000; // 10 seconds between recovery attempts
  private recoveryAttempts: number = 0;
  private maxRecoveryAttempts: number = 3;

  constructor(timeoutMs: number = 3000, onDeadlock: () => void = () => {}) {
    this.deadlockTimeout = timeoutMs;
    this.onDeadlock = onDeadlock;
  }

  /**
   * Start monitoring for deadlocks
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.lastStateChange = Date.now();
    this.recoveryAttempts = 0;

    this.checkInterval = setInterval(() => {
      const timeSinceLastChange = Date.now() - this.lastStateChange;
      const timeSinceLastRecovery = Date.now() - this.lastRecoveryAttempt;

      if (timeSinceLastChange > this.deadlockTimeout) {
        // Check if we're in cooldown period
        if (timeSinceLastRecovery < this.recoveryCooldown) {
          return; // Skip this check, still in cooldown
        }

        // Check if we've exceeded max recovery attempts
        if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
          console.error('🚨 MAX DEADLOCK RECOVERY ATTEMPTS REACHED', {
            attempts: this.recoveryAttempts,
            timeSinceLastChange,
          });
          // Stop checking to prevent infinite loops
          this.stop();
          return;
        }

        console.error('🚨 DEADLOCK DETECTED:', {
          timeSinceLastChange,
          timeout: this.deadlockTimeout,
          recoveryAttempt: this.recoveryAttempts + 1,
          timestamp: new Date().toISOString(),
        });

        // Update recovery tracking
        this.lastRecoveryAttempt = Date.now();
        this.recoveryAttempts++;

        // Call the deadlock handler
        this.onDeadlock();

        // Don't automatically reset timer - let actual state changes do that
      }
    }, 500); // Check every 500ms
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isActive = false;
  }

  /**
   * Record that a state change occurred
   */
  recordStateChange(): void {
    this.lastStateChange = Date.now();
  }

  /**
   * Get time since last state change
   */
  getTimeSinceLastChange(): number {
    return Date.now() - this.lastStateChange;
  }

  /**
   * Check if system appears deadlocked
   */
  isDeadlocked(): boolean {
    return this.getTimeSinceLastChange() > this.deadlockTimeout;
  }

  /**
   * Reset the detector
   */
  reset(): void {
    this.lastStateChange = Date.now();
    this.recoveryAttempts = 0;
    this.lastRecoveryAttempt = 0;
  }
}

// Singleton instance for global deadlock detection
let globalDetector: DeadlockDetector | null = null;

export function getGlobalDeadlockDetector(): DeadlockDetector {
  if (!globalDetector) {
    // Increased timeout from 3s to 60s - humans need time to think!
    globalDetector = new DeadlockDetector(60000, () => {
      console.error('🚨 GLOBAL DEADLOCK - Forcing recovery after 60 seconds');
      // Force a page reload as last resort
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          console.error('🔄 Reloading page due to deadlock');
          window.location.reload();
        }, 1000);
      }
    });
  }
  return globalDetector;
}

/**
 * Hook to use deadlock detection in React components
 * NOTE: This is currently disabled due to false positives with human players
 * The timeout is too aggressive for games where humans need thinking time
 */
export function useDeadlockDetector(
  timeoutMs: number = 30000, // Increased from 3s to 30s
  onDeadlock?: () => void,
): {
  recordStateChange: () => void;
  isDeadlocked: () => boolean;
  start: () => void;
  stop: () => void;
} {
  const detector = new DeadlockDetector(timeoutMs, onDeadlock || (() => {}));

  // Don't auto-start - let the caller decide when to monitor
  // detector.start(); // DISABLED - was causing false positives

  return {
    recordStateChange: () => detector.recordStateChange(),
    isDeadlocked: () => detector.isDeadlocked(),
    start: () => detector.start(),
    stop: () => detector.stop(),
  };
}
