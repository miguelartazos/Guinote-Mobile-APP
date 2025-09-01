/**
 * Connection service for managing offline queue
 *
 * Simple queue manager that:
 * - Persists actions to AsyncStorage when offline
 * - Processes queue when connection restores
 * - Provides optimistic updates with rollback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Brand } from '../types/game.types';

export type ActionId = Brand<string, 'ActionId'>;
export type RoomId = Brand<string, 'RoomId'>;
export type UserId = Brand<string, 'UserId'>;

export type ActionType =
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'ADD_AI_PLAYER'
  | 'UPDATE_READY_STATUS'
  | 'START_GAME'
  | 'SEND_FRIEND_REQUEST'
  | 'ACCEPT_FRIEND_REQUEST'
  | 'BLOCK_USER'
  | 'UNBLOCK_USER'
  | 'REMOVE_FRIEND';

export interface QueuedAction {
  id: ActionId;
  type: ActionType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OptimisticUpdate<T = unknown> {
  actionId: ActionId;
  rollbackState: T;
  applyState: T;
}

const QUEUE_STORAGE_KEY = '@guinote/offline_queue';
const MAX_RETRY_COUNT = 3;
const RETRY_BACKOFF_BASE = 1000; // 1 second

class ConnectionService {
  private static instance: ConnectionService;
  private actionQueue: QueuedAction[] = [];
  private isProcessingQueue = false;
  private optimisticUpdates = new Map<ActionId, OptimisticUpdate>();
  private actionExecutor?: (action: QueuedAction) => Promise<unknown>;

  private constructor() {
    this.loadQueueFromStorage();
  }

  static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  /**
   * Set the action executor function
   * This will be called by useUnifiedRooms to execute actions
   */
  setActionExecutor(executor: (action: QueuedAction) => Promise<unknown>) {
    this.actionExecutor = executor;
  }

  private async loadQueueFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.actionQueue = JSON.parse(stored);
        if (__DEV__) {
          console.log(`[ConnectionService] Loaded ${this.actionQueue.length} queued actions`);
        }
      }
    } catch (error) {
      console.error('[ConnectionService] Failed to load queue from storage:', error);
    }
  }

  private async saveQueueToStorage() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.actionQueue));
    } catch (error) {
      console.error('[ConnectionService] Failed to save queue to storage:', error);
    }
  }

  /**
   * Queue an action for execution
   * Returns optimistic response immediately if offline
   */
  async queueAction<T>(
    type: ActionType,
    payload: Record<string, unknown>,
    optimisticResponse?: T,
    isOnline = true,
  ): Promise<{ actionId: ActionId; result: T | null; queued: boolean }> {
    const actionId = `${type}_${Date.now()}_${Math.random()}` as ActionId;

    const action: QueuedAction = {
      id: actionId,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRY_COUNT,
    };

    if (!isOnline) {
      // Queue for later and return optimistic response
      this.actionQueue.push(action);
      await this.saveQueueToStorage();

      if (optimisticResponse) {
        this.optimisticUpdates.set(actionId, {
          actionId,
          rollbackState: null as any,
          applyState: optimisticResponse,
        });
      }

      return {
        actionId,
        result: optimisticResponse || null,
        queued: true,
      };
    }

    // Execute immediately if online
    if (!this.actionExecutor) {
      // No executor set, queue the action
      this.actionQueue.push(action);
      await this.saveQueueToStorage();
      return {
        actionId,
        result: optimisticResponse || null,
        queued: true,
      };
    }

    try {
      const result = (await this.actionExecutor(action)) as T;
      return { actionId, result, queued: false };
    } catch (error) {
      // On failure, queue for retry
      this.actionQueue.push(action);
      await this.saveQueueToStorage();

      // Return optimistic response on failure too
      return {
        actionId,
        result: optimisticResponse || null,
        queued: true,
      };
    }
  }

  /**
   * Process all queued actions
   */
  async processQueue(): Promise<{ processed: number; failed: number; remaining: number }> {
    if (this.isProcessingQueue || this.actionQueue.length === 0 || !this.actionExecutor) {
      return { processed: 0, failed: 0, remaining: this.actionQueue.length };
    }

    this.isProcessingQueue = true;
    const processedActions: ActionId[] = [];
    const failedActions: QueuedAction[] = [];

    for (const action of this.actionQueue) {
      try {
        // Apply exponential backoff for retries
        if (action.retryCount > 0) {
          const delay = Math.min(RETRY_BACKOFF_BASE * Math.pow(2, action.retryCount - 1), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        await this.actionExecutor(action);
        processedActions.push(action.id);

        // Remove optimistic update on success
        this.optimisticUpdates.delete(action.id);
      } catch (error) {
        action.retryCount++;

        if (action.retryCount >= action.maxRetries) {
          // Max retries reached, remove from queue
          processedActions.push(action.id);

          // Get rollback state for caller to handle
          const optimistic = this.optimisticUpdates.get(action.id);
          if (optimistic) {
            // Caller will handle the rollback
            this.optimisticUpdates.delete(action.id);
          }

          if (__DEV__) {
            console.log(
              `[ConnectionService] Action ${action.type} failed after ${action.maxRetries} retries`,
            );
          }
        } else {
          failedActions.push(action);
        }
      }
    }

    // Update queue
    this.actionQueue = failedActions;
    await this.saveQueueToStorage();

    this.isProcessingQueue = false;

    const summary = {
      processed: processedActions.length,
      failed: failedActions.length,
      remaining: this.actionQueue.length,
    };

    if (__DEV__) {
      console.log('[ConnectionService] Queue processed:', summary);
    }

    return summary;
  }

  /**
   * Get optimistic update for an action
   */
  getOptimisticUpdate(actionId: ActionId): OptimisticUpdate | undefined {
    return this.optimisticUpdates.get(actionId);
  }

  /**
   * Get queued actions count
   */
  getQueuedCount(): number {
    return this.actionQueue.length;
  }

  /**
   * Get all queued actions
   */
  getQueuedActions(): QueuedAction[] {
    return [...this.actionQueue];
  }

  /**
   * Clear all queued actions
   */
  async clearQueue() {
    this.actionQueue = [];
    this.optimisticUpdates.clear();
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  }
}

export const connectionService = ConnectionService.getInstance();
