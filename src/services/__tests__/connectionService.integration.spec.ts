/**
 * Integration tests for connection recovery
 * Tests network interruption handling and state synchronization
 */

import { connectionService } from '../connectionService';
import { MultiplayerGameService } from '../multiplayerGameService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as featureFlags from '../../config/featureFlags';
import * as realtimeClient from '../realtimeClient.native';
import type { GameMove } from '../../types/gameMove.types';
import type { RealtimeGameState } from '../../types/realtime.types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../config/featureFlags');
jest.mock('../realtimeClient.native');

// Mock fetch
global.fetch = jest.fn();

describe('Connection Recovery Integration', () => {
  let gameService: MultiplayerGameService;
  let mockSupabaseClient: any;
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = false;

    gameService = MultiplayerGameService.getInstance();
    gameService.reset();

    // Mock channel
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
    };

    // Mock Supabase client
    mockSupabaseClient = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn().mockResolvedValue(undefined),
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
    };

    // Default mocks
    (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(true);
    (realtimeClient.createRealtimeClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ valid: true }),
    });
  });

  describe('network interruption recovery', () => {
    test('queues actions during disconnection and processes on reconnect', async () => {
      // Connect initially
      await gameService.connect('room-123' as any, 'player-456' as any);

      const initialState: RealtimeGameState = {
        version: 1 as any,
        lastModified: Date.now(),
        lastModifiedBy: 'player-456' as any,
        gameState: {} as any,
      };
      gameService.setCurrentState(initialState);

      // Simulate disconnection
      gameService.setConnectionState({ isConnected: false });

      // Try to send actions while disconnected
      const action1: GameMove = {
        type: 'PLAY_CARD',
        playerId: 'player-456' as any,
        card: { suit: 'oros', rank: 'as' } as any,
        timestamp: Date.now(),
      };

      const action2: GameMove = {
        type: 'PLAY_CARD',
        playerId: 'player-456' as any,
        card: { suit: 'copas', rank: 'rey' } as any,
        timestamp: Date.now() + 1000,
      };

      const result1 = await gameService.sendAction(action1);
      const result2 = await gameService.sendAction(action2);

      expect(result1.queued).toBe(true);
      expect(result2.queued).toBe(true);
      expect(gameService.getConnectionState().queuedActions).toHaveLength(2);

      // Simulate reconnection
      gameService.setConnectionState({ isConnected: true });
      await connectionService.handleReconnect();

      // Process queued actions
      await gameService.processQueuedActions();

      // Verify actions were sent
      expect(mockChannel.send).toHaveBeenCalledTimes(2);
      expect(gameService.getConnectionState().queuedActions).toHaveLength(0);
    });

    test('handles state sync after reconnection', async () => {
      await gameService.connect('room-123' as any, 'player-456' as any);

      const oldState: RealtimeGameState = {
        version: 1 as any,
        lastModified: Date.now() - 10000,
        lastModifiedBy: 'player-456' as any,
        gameState: {} as any,
      };
      gameService.setCurrentState(oldState);

      // Simulate server state that's newer
      const serverState: RealtimeGameState = {
        version: 5 as any,
        lastModified: Date.now(),
        lastModifiedBy: 'server' as any,
        gameState: { updated: true } as any,
      };

      // Request state sync
      const syncResult = await gameService.requestStateSync();
      expect(syncResult.version).toBe(1);
      expect(syncResult.state).toEqual(oldState);

      // Apply server state diff
      gameService.applyStateDiff(serverState, []);

      expect(gameService.getCurrentState()).toEqual(serverState);
      expect(gameService.getCurrentState()?.version).toBe(5);
    });

    test('filters duplicate actions after state sync', async () => {
      await gameService.connect('room-123' as any, 'player-456' as any);

      const serverState: RealtimeGameState = {
        version: 10 as any,
        lastModified: Date.now(),
        lastModifiedBy: 'server' as any,
        gameState: {} as any,
      };

      // Actions with different timestamps
      const oldAction: GameMove = {
        type: 'PLAY_CARD',
        playerId: 'player-456' as any,
        card: { suit: 'oros', rank: 'as' } as any,
        timestamp: serverState.lastModified - 1000, // Before server state
      };

      const newAction: GameMove = {
        type: 'PLAY_CARD',
        playerId: 'player-456' as any,
        card: { suit: 'copas', rank: 'rey' } as any,
        timestamp: serverState.lastModified + 1000, // After server state
      };

      // Apply state diff with both actions
      gameService.applyStateDiff(serverState, [oldAction, newAction]);

      // Only new action should be requeued
      const queuedActions = gameService.getConnectionState().queuedActions;
      expect(queuedActions).toHaveLength(1);
      expect(queuedActions[0]).toEqual(newAction);
    });

    test('persists queue to AsyncStorage during disconnection', async () => {
      const action: GameMove = {
        type: 'PLAY_CARD',
        playerId: 'player-456' as any,
        card: { suit: 'oros', rank: 'as' } as any,
        timestamp: Date.now(),
      };

      // Queue action
      await connectionService.queueAction({
        id: 'action-1' as any,
        type: 'GAME_ACTION',
        payload: action,
        timestamp: Date.now(),
        retryCount: 0,
      });

      // Verify persistence
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@guinote/offline_queue',
        expect.any(String),
      );
    });

    test('restores queue from AsyncStorage on reconnect', async () => {
      const storedQueue = JSON.stringify([
        {
          id: 'action-1',
          type: 'GAME_ACTION',
          payload: {
            type: 'PLAY_CARD',
            playerId: 'player-456',
            card: { suit: 'oros', rank: 'as' },
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ]);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedQueue);

      // Initialize connection service (loads queue)
      await connectionService.handleReconnect();

      // Verify queue was loaded
      const queuedActions = await AsyncStorage.getItem('@guinote/offline_queue');
      expect(queuedActions).toBe(storedQueue);
    });

    test('handles version conflicts during recovery', async () => {
      await gameService.connect('room-123' as any, 'player-456' as any);

      const localState: RealtimeGameState = {
        version: 3 as any,
        lastModified: Date.now(),
        lastModifiedBy: 'player-456' as any,
        gameState: {} as any,
      };
      gameService.setCurrentState(localState);

      // Detect conflict with different server version
      expect(gameService.detectVersionConflict(3 as any)).toBe(false);
      expect(gameService.detectVersionConflict(5 as any)).toBe(true);

      // Handle conflict by accepting server state
      const serverState: RealtimeGameState = {
        version: 5 as any,
        lastModified: Date.now(),
        lastModifiedBy: 'server' as any,
        gameState: { authoritative: true } as any,
      };

      gameService.handleStateSync(serverState);
      expect(gameService.getCurrentState()).toEqual(serverState);
    });

    test('handles rapid disconnection/reconnection cycles', async () => {
      await gameService.connect('room-123' as any, 'player-456' as any);

      const actions: GameMove[] = [];

      // Simulate rapid connection changes
      for (let i = 0; i < 5; i++) {
        // Disconnect
        gameService.setConnectionState({ isConnected: false });

        // Queue action while disconnected
        const action: GameMove = {
          type: 'PLAY_CARD',
          playerId: 'player-456' as any,
          card: { suit: 'oros', rank: `${i}` } as any,
          timestamp: Date.now() + i,
        };
        actions.push(action);
        await gameService.sendAction(action);

        // Reconnect
        gameService.setConnectionState({ isConnected: true });
        await gameService.processQueuedActions();
      }

      // All actions should have been processed
      expect(mockChannel.send).toHaveBeenCalledTimes(5);
      expect(gameService.getConnectionState().queuedActions).toHaveLength(0);
    });

    test('maintains action order during recovery', async () => {
      const sentActions: any[] = [];
      mockChannel.send.mockImplementation(data => {
        sentActions.push(data.payload.action);
        return Promise.resolve();
      });

      // Queue actions in specific order
      const action1: GameMove = {
        type: 'PLAY_CARD',
        playerId: 'player-456' as any,
        card: { suit: 'oros', rank: '1' } as any,
        timestamp: 1000,
      };

      const action2: GameMove = {
        type: 'PLAY_CARD',
        playerId: 'player-456' as any,
        card: { suit: 'copas', rank: '2' } as any,
        timestamp: 2000,
      };

      const action3: GameMove = {
        type: 'PLAY_CARD',
        playerId: 'player-456' as any,
        card: { suit: 'espadas', rank: '3' } as any,
        timestamp: 3000,
      };

      gameService.setConnectionState({
        queuedActions: [action1, action2, action3],
      });

      await gameService.connect('room-123' as any, 'player-456' as any);
      await gameService.processQueuedActions();

      // Verify order was maintained
      expect(sentActions).toHaveLength(3);
      expect(sentActions[0].timestamp).toBe(1000);
      expect(sentActions[1].timestamp).toBe(2000);
      expect(sentActions[2].timestamp).toBe(3000);
    });

    test('handles server validation during recovery', async () => {
      await gameService.connect('room-123' as any, 'player-456' as any);

      const state: RealtimeGameState = {
        version: 1 as any,
        lastModified: Date.now(),
        lastModifiedBy: 'player-456' as any,
        gameState: {} as any,
      };
      gameService.setCurrentState(state);

      // Mock validation to fail for specific action
      (global.fetch as jest.Mock).mockImplementation(url => {
        if (url.includes('validate-move')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                valid: false,
                reason: 'Invalid move during recovery',
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      const invalidAction: GameMove = {
        type: 'PLAY_CARD',
        playerId: 'player-456' as any,
        card: { suit: 'oros', rank: 'invalid' } as any,
        timestamp: Date.now(),
      };

      const result = await gameService.sendAction(invalidAction);

      expect(result.success).toBe(false);
      expect(result.queued).toBe(false);
      expect(mockChannel.send).not.toHaveBeenCalled();
    });
  });

  describe('optimistic updates and rollback', () => {
    test('applies optimistic update and rolls back on failure', async () => {
      await gameService.connect('room-123' as any, 'player-456' as any);

      const originalState: RealtimeGameState = {
        version: 1 as any,
        lastModified: Date.now(),
        lastModifiedBy: 'player-456' as any,
        gameState: { score: 0 } as any,
      };
      gameService.setCurrentState(originalState);

      const optimisticState: RealtimeGameState = {
        version: 2 as any,
        lastModified: Date.now(),
        lastModifiedBy: 'player-456' as any,
        gameState: { score: 10 } as any,
      };

      const action: GameMove = {
        type: 'PLAY_CARD',
        playerId: 'player-456' as any,
        card: { suit: 'oros', rank: 'as' } as any,
        timestamp: Date.now(),
      };

      // Apply optimistic update
      await gameService.sendAction(action, optimisticState);
      expect(gameService.getCurrentState()).toEqual(optimisticState);

      // Simulate validation failure
      await gameService.handleValidationFailure(action, 'Invalid move');

      // Should rollback to original state
      expect(gameService.getCurrentState()).toEqual(originalState);
    });
  });
});
