import { MultiplayerGameService } from '../multiplayerGameService';
import type { RealtimeGameState } from '../../types/realtime.types';
import type { GameMove } from '../../types/gameMove.types';

// Mock dependencies
jest.mock('../realtimeClient.native', () => ({
  createRealtimeClient: jest.fn(() =>
    Promise.resolve({
      channel: jest.fn(() => ({
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        send: jest.fn(),
        on: jest.fn().mockReturnThis(),
      })),
      removeChannel: jest.fn(),
    }),
  ),
}));

jest.mock('../../config/featureFlags', () => ({
  isMultiplayerEnabled: jest.fn(() => true),
}));

describe('MultiplayerGameService Recovery', () => {
  let service: MultiplayerGameService;

  beforeEach(() => {
    service = MultiplayerGameService.getInstance();
    service.reset();
  });

  describe('requestStateSync', () => {
    test('should request state sync from server', async () => {
      const mockChannel = {
        send: jest.fn().mockResolvedValue(undefined),
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };

      service['channel'] = mockChannel as any;
      service['roomId'] = 'room_123' as any;
      service['currentState'] = {
        version: 5,
        lastModified: Date.now(),
      } as RealtimeGameState;

      const result = await service.requestStateSync();

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'request_state_sync',
        payload: {
          roomId: 'room_123',
          lastVersion: 5,
        },
      });

      expect(result).toEqual({
        version: 5,
        state: service['currentState'],
      });
    });

    test('should return empty state when no channel', async () => {
      const result = await service.requestStateSync();

      expect(result).toEqual({
        version: 0,
        state: null,
      });
    });

    test('should handle sync request failure', async () => {
      const mockChannel = {
        send: jest.fn().mockRejectedValue(new Error('Network error')),
        on: jest.fn().mockReturnThis(),
      };

      service['channel'] = mockChannel as any;
      service['roomId'] = 'room_123' as any;
      service['currentState'] = {
        version: 3,
      } as RealtimeGameState;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.requestStateSync();

      expect(result).toEqual({
        version: 3,
        state: service['currentState'],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[MultiplayerGameService] Failed to request state sync:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('applyStateDiff', () => {
    test('should apply server state and filter queued actions', () => {
      const serverState: RealtimeGameState = {
        version: 10 as any,
        lastModified: 1000,
        lastModifiedBy: 'player1' as any,
        currentTurn: 'player1' as any,
        phase: 'playing',
        hands: {},
        currentTrick: [],
        teams: {},
        scores: {},
        rounds: [],
        deck: [],
        trump: null,
        gameMode: 'vueltas',
        discardedCards: [],
        pastTricks: [],
        trickWinner: null,
      };

      const queuedActions: GameMove[] = [
        { type: 'PLAY_CARD', timestamp: 500, playerId: 'player1' as any },
        { type: 'PLAY_CARD', timestamp: 1500, playerId: 'player1' as any },
        { type: 'PLAY_CARD', timestamp: 2000, playerId: 'player1' as any },
      ];

      service.applyStateDiff(serverState, queuedActions);

      expect(service['currentState']).toEqual(serverState);
      expect(service['connectionState'].queuedActions).toHaveLength(2);
      expect(service['connectionState'].queuedActions[0].timestamp).toBe(1500);
      expect(service['connectionState'].queuedActions[1].timestamp).toBe(2000);
    });

    test('should clear rollback states', () => {
      service['rollbackStates'].set('action_1', {} as RealtimeGameState);
      service['rollbackStates'].set('action_2', {} as RealtimeGameState);

      const serverState: RealtimeGameState = {
        version: 5 as any,
        lastModified: Date.now(),
      } as RealtimeGameState;

      service.applyStateDiff(serverState, []);

      expect(service['rollbackStates'].size).toBe(0);
    });

    test('should handle null server state', () => {
      const originalState = service['currentState'];

      service.applyStateDiff(null as any, []);

      expect(service['currentState']).toBe(originalState);
    });
  });

  describe('handleRecovery', () => {
    test('should process queued actions when connected', async () => {
      const testAction = {
        type: 'PLAY_CARD' as const,
        timestamp: Date.now(),
        playerId: 'player1' as any,
      };
      service['connectionState'].isConnected = true;
      service['connectionState'].queuedActions = [testAction];

      const mockChannel = {
        send: jest.fn().mockResolvedValue(undefined),
        on: jest.fn().mockReturnThis(),
      };

      service['channel'] = mockChannel as any;
      service['currentState'] = { version: 1 } as RealtimeGameState;

      await service.handleRecovery();

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'game_action',
        payload: {
          action: testAction,
          version: 1,
          validated: false,
        },
      });
    });

    test('should not process when disconnected', async () => {
      service['connectionState'].isConnected = false;
      service['connectionState'].queuedActions = [
        { type: 'PLAY_CARD', timestamp: Date.now(), playerId: 'player1' as any },
      ];

      const mockChannel = {
        send: jest.fn(),
      };

      service['channel'] = mockChannel as any;

      await service.handleRecovery();

      expect(mockChannel.send).not.toHaveBeenCalled();
    });
  });
});

