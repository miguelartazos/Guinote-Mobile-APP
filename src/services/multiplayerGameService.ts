/**
 * Multiplayer Game Service
 *
 * Manages realtime game state synchronization with server authority.
 * Features:
 * - Version tracking for conflict detection
 * - Optimistic updates with rollback
 * - Offline queue with sync on reconnect
 * - Server validation and broadcast
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { createRealtimeClient } from './realtimeClient.native';
import { isMultiplayerEnabled } from '../config/featureFlags';
import type {
  RealtimeEvent,
  RealtimeGameState,
  StateVersion,
  RoomId,
  RealtimeConnectionState,
  GameActionEvent,
  StateSyncEvent,
  ConflictDetectedEvent,
} from '../types/realtime.types';
import type { GameMove } from '../types/gameMove.types';
import type { PlayerId } from '../types/game.types';

interface ActionQueueItem {
  action: GameMove;
  optimisticState?: RealtimeGameState;
  timestamp: number;
}

interface EventHandlers {
  gameAction: Array<(event: GameActionEvent) => void>;
  stateSync: Array<(state: RealtimeGameState) => void>;
  conflict: Array<(event: ConflictDetectedEvent) => void>;
}

export class MultiplayerGameService {
  private static instance: MultiplayerGameService;

  private channel: RealtimeChannel | null = null;
  private roomId: RoomId | null = null;
  private playerId: PlayerId | null = null;
  private currentState: RealtimeGameState | null = null;
  private connectionState: RealtimeConnectionState;
  private actionQueue: ActionQueueItem[] = [];
  private eventHandlers: EventHandlers;
  private rollbackStates: Map<string, RealtimeGameState> = new Map();

  private constructor() {
    this.connectionState = {
      isConnected: false,
      isReconnecting: false,
      lastHeartbeat: Date.now(),
      missedHeartbeats: 0,
      queuedActions: [],
    };

    this.eventHandlers = {
      gameAction: [],
      stateSync: [],
      conflict: [],
    };
  }

  static getInstance(): MultiplayerGameService {
    if (!MultiplayerGameService.instance) {
      MultiplayerGameService.instance = new MultiplayerGameService();
    }
    return MultiplayerGameService.instance;
  }

  reset(): void {
    this.channel = null;
    this.roomId = null;
    this.playerId = null;
    this.currentState = null;
    this.actionQueue = [];
    this.rollbackStates.clear();
    this.connectionState = {
      isConnected: false,
      isReconnecting: false,
      lastHeartbeat: Date.now(),
      missedHeartbeats: 0,
      queuedActions: [],
    };
  }

  async connect(roomId: RoomId, playerId: PlayerId): Promise<void> {
    if (!isMultiplayerEnabled()) {
      throw new Error('Multiplayer is disabled');
    }

    this.roomId = roomId;
    this.playerId = playerId;

    try {
      const client = await createRealtimeClient();
      if (!client) {
        throw new Error('Failed to create realtime client');
      }

      if (this.channel) {
        await client.removeChannel(this.channel);
      }

      this.channel = client.channel(`room:${roomId}`, {
        config: {
          presence: {
            key: playerId,
          },
        },
      });

      this.setupEventListeners();
      await this.channel.subscribe();

      this.connectionState.isConnected = true;
      this.connectionState.isReconnecting = false;
      this.connectionState.lastHeartbeat = Date.now();
    } catch (error) {
      this.connectionState.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.unsubscribe();

      const client = await createRealtimeClient();
      if (client) {
        await client.removeChannel(this.channel);
      }
    }

    this.connectionState.isConnected = false;
    this.channel = null;
  }

  private setupEventListeners(): void {
    if (!this.channel) return;

    this.channel
      .on('broadcast', { event: 'game_action' }, ({ payload }) => {
        const event: GameActionEvent = {
          type: 'game_action',
          ...payload,
          timestamp: Date.now(),
          roomId: this.roomId!,
        };
        this.handleServerEvent(event);
      })
      .on('broadcast', { event: 'state_sync' }, ({ payload }) => {
        const event: StateSyncEvent = {
          type: 'state_sync',
          ...payload,
          timestamp: Date.now(),
          roomId: this.roomId!,
        };
        this.handleServerEvent(event);
      })
      .on('broadcast', { event: 'conflict_detected' }, ({ payload }) => {
        const event: ConflictDetectedEvent = {
          type: 'conflict_detected',
          ...payload,
          timestamp: Date.now(),
          roomId: this.roomId!,
        };
        this.handleServerEvent(event);
      });
  }

  async sendAction(
    action: GameMove,
    optimisticState?: RealtimeGameState,
  ): Promise<{ success: boolean; queued: boolean; optimisticState?: RealtimeGameState }> {
    const actionKey = `${action.type}_${action.timestamp}`;

    if (!this.connectionState.isConnected) {
      this.connectionState.queuedActions.push(action);
      this.actionQueue.push({
        action,
        optimisticState,
        timestamp: Date.now(),
      });

      if (optimisticState) {
        if (this.currentState) {
          this.rollbackStates.set(actionKey, this.currentState);
        }
        this.currentState = optimisticState;
      }

      return { success: false, queued: true, optimisticState };
    }

    if (!this.channel || !this.currentState) {
      return { success: false, queued: false };
    }

    // Server validation for multiplayer moves
    if (isMultiplayerEnabled()) {
      try {
        const validationResponse = await this.validateMoveOnServer(action);
        
        if (!validationResponse.valid) {
          // Validation failed - trigger rollback
          await this.handleValidationFailure(action, validationResponse.reason || 'Validation failed');
          return { success: false, queued: false };
        }
      } catch (error) {
        console.error('[MultiplayerGameService] Server validation error:', error);
        // On validation error, queue the action for retry
        this.connectionState.queuedActions.push(action);
        return { success: false, queued: true, optimisticState };
      }
    }

    if (this.currentState) {
      this.rollbackStates.set(actionKey, this.currentState);
    }

    if (optimisticState) {
      this.currentState = optimisticState;
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'game_action',
        payload: {
          action,
          version: this.currentState?.version || 1,
          validated: true, // Mark as validated after server check
        },
      });

      return { success: true, queued: false, optimisticState };
    } catch (error) {
      console.error('[MultiplayerGameService] Failed to send action:', error);
      this.connectionState.queuedActions.push(action);
      return { success: false, queued: true, optimisticState };
    }
  }

  private async validateMoveOnServer(
    action: GameMove,
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      const client = await createRealtimeClient();
      if (!client) {
        throw new Error('Failed to create client for validation');
      }

      // Get the Supabase URL from the client's auth URL
      const supabaseUrl = (client as any).supabaseUrl || (client as any).restUrl || '';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/validate-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(client as any).supabaseKey || ''}`,
        },
        body: JSON.stringify({
          gameState: this.currentState,
          move: action,
          playerId: this.playerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation request failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        valid: result.valid,
        reason: result.reason,
      };
    } catch (error) {
      console.error('[MultiplayerGameService] Failed to validate move on server:', error);
      // On network error, allow the move optimistically
      return { valid: true };
    }
  }

  async processQueuedActions(): Promise<void> {
    if (!this.connectionState.isConnected || !this.channel) {
      return;
    }

    const queue = [...this.connectionState.queuedActions];
    this.actionQueue = [];
    this.connectionState.queuedActions = [];

    for (const action of queue) {
      try {
        await this.channel.send({
          type: 'broadcast',
          event: 'game_action',
          payload: {
            action,
            version: this.currentState?.version || 1,
            validated: false,
          },
        });
      } catch (error) {
        console.error('[MultiplayerGameService] Failed to process queued action:', error);
      }
    }
  }

  handleServerEvent(event: RealtimeEvent): void {
    switch (event.type) {
      case 'game_action':
        this.eventHandlers.gameAction.forEach(handler => handler(event));
        break;

      case 'state_sync':
        this.handleStateSync(event.state);
        this.eventHandlers.stateSync.forEach(handler => handler(event.state));
        break;

      case 'conflict_detected':
        this.eventHandlers.conflict.forEach(handler => handler(event));
        break;
    }
  }

  handleStateSync(state: RealtimeGameState): void {
    this.currentState = state;
    this.actionQueue = [];
    this.connectionState.queuedActions = [];
    this.rollbackStates.clear();
  }

  async handleValidationFailure(action: GameMove, reason: string): Promise<void> {
    const actionKey = `${action.type}_${action.timestamp}`;
    const rollbackState = this.rollbackStates.get(actionKey);

    if (rollbackState) {
      this.currentState = rollbackState;
      this.rollbackStates.delete(actionKey);
    }

    if (__DEV__) {
      console.warn('[MultiplayerGameService] Validation failed:', reason, action);
    }
  }

  applyVersionedUpdate(state: RealtimeGameState, playerId: PlayerId): RealtimeGameState {
    return {
      ...state,
      version: ((state.version as number) + 1) as StateVersion,
      lastModified: Date.now(),
      lastModifiedBy: playerId,
    };
  }

  detectVersionConflict(serverVersion: StateVersion): boolean {
    if (!this.currentState) return false;
    return this.currentState.version !== serverVersion;
  }

  setCurrentState(state: RealtimeGameState): void {
    this.currentState = state;
  }

  getCurrentState(): RealtimeGameState | null {
    return this.currentState;
  }

  getConnectionState(): RealtimeConnectionState {
    return { ...this.connectionState };
  }

  setConnectionState(updates: Partial<RealtimeConnectionState>): void {
    this.connectionState = {
      ...this.connectionState,
      ...updates,
    };
  }

  onGameAction(handler: (event: GameActionEvent) => void): () => void {
    this.eventHandlers.gameAction.push(handler);
    return () => {
      const index = this.eventHandlers.gameAction.indexOf(handler);
      if (index >= 0) {
        this.eventHandlers.gameAction.splice(index, 1);
      }
    };
  }

  onStateSync(handler: (state: RealtimeGameState) => void): () => void {
    this.eventHandlers.stateSync.push(handler);
    return () => {
      const index = this.eventHandlers.stateSync.indexOf(handler);
      if (index >= 0) {
        this.eventHandlers.stateSync.splice(index, 1);
      }
    };
  }

  onConflict(handler: (event: ConflictDetectedEvent) => void): () => void {
    this.eventHandlers.conflict.push(handler);
    return () => {
      const index = this.eventHandlers.conflict.indexOf(handler);
      if (index >= 0) {
        this.eventHandlers.conflict.splice(index, 1);
      }
    };
  }

  /**
   * Request state sync from server
   * Returns current state and version for recovery
   */
  async requestStateSync(): Promise<{ version: number; state: RealtimeGameState | null }> {
    if (!this.channel || !this.roomId) {
      return { version: 0, state: null };
    }

    try {
      // Request latest state from server
      await this.channel.send({
        type: 'broadcast',
        event: 'request_state_sync',
        payload: {
          roomId: this.roomId,
          lastVersion: this.currentState?.version || 0,
        },
      });

      // Return current state for recovery
      return {
        version: (this.currentState?.version as number) || 0,
        state: this.currentState,
      };
    } catch (error) {
      console.error('[MultiplayerGameService] Failed to request state sync:', error);
      return {
        version: (this.currentState?.version as number) || 0,
        state: this.currentState,
      };
    }
  }

  /**
   * Apply state diff during recovery
   * Merges server state with local queued actions
   */
  applyStateDiff(serverState: RealtimeGameState, queuedActions: GameMove[]): void {
    if (!serverState) return;

    // Update to server state
    this.currentState = serverState;

    // Clear rollback states as they're now invalid
    this.rollbackStates.clear();

    // Re-queue actions that haven't been applied
    this.connectionState.queuedActions = queuedActions.filter(action => {
      // Check if action was already applied by comparing timestamps
      return action.timestamp > serverState.lastModified;
    });

    if (__DEV__) {
      console.log(
        `[MultiplayerGameService] State diff applied. Version: ${serverState.version}, Requeued: ${this.connectionState.queuedActions.length} actions`,
      );
    }
  }

  /**
   * Handle recovery after reconnection
   */
  async handleRecovery(): Promise<void> {
    if (!this.connectionState.isConnected) return;

    // Process any queued actions
    await this.processQueuedActions();
  }
}
