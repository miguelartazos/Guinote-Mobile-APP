import type { DealTarget, AnimationPhase, AnimationState, SlotIndex } from '../types/slots.types';
import type { PlayerId } from '../types/game.types';

/**
 * Manages animation queue and state synchronization
 */
export class AnimationStateManager {
  private static instance: AnimationStateManager;
  private animationQueue: DealTarget[] = [];
  private currentPhase: AnimationPhase = 'idle';
  private completionCallbacks: Array<() => void> = [];
  private phaseCallbacks: Map<AnimationPhase, Array<() => void>> = new Map();

  private constructor() {}

  static getInstance(): AnimationStateManager {
    if (!AnimationStateManager.instance) {
      AnimationStateManager.instance = new AnimationStateManager();
    }
    return AnimationStateManager.instance;
  }

  // Queue deal animations
  queueDealAnimation(targets: DealTarget[]): void {
    this.animationQueue.push(...targets);
  }

  // Get next animation target
  getNextTarget(): DealTarget | null {
    return this.animationQueue.shift() || null;
  }

  // Get all queued targets
  getAllTargets(): DealTarget[] {
    return [...this.animationQueue];
  }

  // Clear animation queue
  clearQueue(): void {
    this.animationQueue = [];
  }

  // Set current animation phase
  setPhase(phase: AnimationPhase): void {
    this.currentPhase = phase;
    this.triggerPhaseCallbacks(phase);
  }

  // Get current phase
  getPhase(): AnimationPhase {
    return this.currentPhase;
  }

  // Register callback for animation completion
  onAnimationComplete(callback: () => void): void {
    this.completionCallbacks.push(callback);
  }

  // Register callback for specific phase
  onPhase(phase: AnimationPhase, callback: () => void): void {
    if (!this.phaseCallbacks.has(phase)) {
      this.phaseCallbacks.set(phase, []);
    }
    this.phaseCallbacks.get(phase)?.push(callback);
  }

  // Trigger completion callbacks
  triggerCompletion(): void {
    this.completionCallbacks.forEach(cb => cb());
    this.completionCallbacks = [];
  }

  // Trigger phase callbacks
  private triggerPhaseCallbacks(phase: AnimationPhase): void {
    const callbacks = this.phaseCallbacks.get(phase) || [];
    callbacks.forEach(cb => cb());
  }

  // Clear all callbacks
  clearCallbacks(): void {
    this.completionCallbacks = [];
    this.phaseCallbacks.clear();
  }

  // Check if animations are running
  isAnimating(): boolean {
    return this.currentPhase !== 'idle' && this.animationQueue.length > 0;
  }

  // Reset manager state
  reset(): void {
    this.animationQueue = [];
    this.currentPhase = 'idle';
    this.clearCallbacks();
  }

  // Helper to create deal targets for initial deal
  createInitialDealTargets(
    playerIds: [PlayerId, PlayerId, PlayerId, PlayerId],
    deck: any[], // Card array
  ): DealTarget[] {
    const targets: DealTarget[] = [];
    let deckIndex = 0;

    // Two rounds of 3 cards each
    for (let round = 0; round < 2; round++) {
      for (const playerId of playerIds) {
        for (let i = 0; i < 3; i++) {
          if (deckIndex < deck.length) {
            targets.push({
              playerId,
              slotIndex: (round * 3 + i) as SlotIndex,
              card: deck[deckIndex],
            });
            deckIndex++;
          }
        }
      }
    }

    return targets;
  }

  // Helper to create post-trick deal targets
  createPostTrickDealTargets(
    emptySlotsByPlayer: Map<PlayerId, SlotIndex[]>,
    deck: any[], // Card array
  ): DealTarget[] {
    const targets: DealTarget[] = [];
    let deckIndex = 0;

    for (const [playerId, emptySlots] of emptySlotsByPlayer.entries()) {
      if (emptySlots.length > 0 && deckIndex < deck.length) {
        // Deal to first empty slot for this player
        targets.push({
          playerId,
          slotIndex: emptySlots[0],
          card: deck[deckIndex],
        });
        deckIndex++;
      }
    }

    return targets;
  }
}

// Export singleton instance
export const animationStateManager = AnimationStateManager.getInstance();
