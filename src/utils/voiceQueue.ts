import type { VoiceRecordingId } from './voiceStorage';

export type QueuedVoiceMessage = {
  id: string;
  recordingId: VoiceRecordingId;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  position: 'top' | 'left' | 'right' | 'bottom';
  priority: number; // Higher number = higher priority
  timestamp: number;
};

export type VoiceQueueState = {
  queue: QueuedVoiceMessage[];
  currentlyPlaying: string | null;
  isPaused: boolean;
};

class VoiceMessageQueue {
  private queue: QueuedVoiceMessage[] = [];
  private currentlyPlaying: string | null = null;
  private listeners: Set<(state: VoiceQueueState) => void> = new Set();
  private isPaused = false;

  // Add a message to the queue
  add(message: Omit<QueuedVoiceMessage, 'id' | 'timestamp'>): string {
    const id = `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const queuedMessage: QueuedVoiceMessage = {
      ...message,
      id,
      timestamp: Date.now(),
    };

    // Insert based on priority
    const insertIndex = this.queue.findIndex(msg => msg.priority < message.priority);

    if (insertIndex === -1) {
      this.queue.push(queuedMessage);
    } else {
      this.queue.splice(insertIndex, 0, queuedMessage);
    }

    this.notifyListeners();
    return id;
  }

  // Remove a message from the queue
  remove(id: string): boolean {
    const index = this.queue.findIndex(msg => msg.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Get next message to play
  getNext(): QueuedVoiceMessage | null {
    if (this.isPaused) return null;
    return this.queue[0] || null;
  }

  // Mark message as currently playing
  setPlaying(id: string | null): void {
    this.currentlyPlaying = id;

    // Remove from queue if it's there
    if (id) {
      this.remove(id);
    }

    this.notifyListeners();
  }

  // Clear all messages
  clear(): void {
    this.queue = [];
    this.currentlyPlaying = null;
    this.notifyListeners();
  }

  // Pause/resume queue
  setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.notifyListeners();
  }

  // Get current state
  getState(): VoiceQueueState {
    return {
      queue: [...this.queue],
      currentlyPlaying: this.currentlyPlaying,
      isPaused: this.isPaused,
    };
  }

  // Subscribe to state changes
  subscribe(listener: (state: VoiceQueueState) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  // Get queue length
  getLength(): number {
    return this.queue.length;
  }

  // Check if a specific player has messages in queue
  hasMessagesFrom(playerId: string): boolean {
    return this.queue.some(msg => msg.playerId === playerId);
  }

  // Get priority for different message types
  static getPriority(isCurrentPlayer: boolean, isTeammate: boolean = false): number {
    if (isCurrentPlayer) return 100;
    if (isTeammate) return 50;
    return 10;
  }
}

// Export class for static methods
export { VoiceMessageQueue };

// Singleton instance
export const voiceQueue = new VoiceMessageQueue();
