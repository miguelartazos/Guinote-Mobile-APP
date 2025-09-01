import type { RealtimeChannel } from '@supabase/supabase-js';
import { MultiplayerGameService } from '../multiplayerGameService';
import type { RealtimeGameState, StateVersion, RoomId } from '../../types/realtime.types';
import type { PlayerId } from '../../types/game.types';
import { createMove } from '../../types/gameMove.types';

jest.mock('../realtimeClient.native', () => ({
  createRealtimeClient: jest.fn(),
}));

jest.mock('../../config/featureFlags', () => ({
  isMultiplayerEnabled: jest.fn(() => true),
}));

describe('MultiplayerGameService', () => {
  let service: MultiplayerGameService;
  let mockChannel: Partial<RealtimeChannel>;
  let mockClient: any;

  beforeEach(() => {
    service = MultiplayerGameService.getInstance();
    service.reset();

    mockChannel = {
      send: jest.fn().mockResolvedValue({ type: 'ok' }),
      subscribe: jest.fn().mockResolvedValue('subscribed'),
      unsubscribe: jest.fn().mockResolvedValue('ok'),
      on: jest.fn().mockReturnThis(),
    };

    mockClient = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn().mockResolvedValue('ok'),
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createRealtimeClient } = require('../realtimeClient.native');
    createRealtimeClient.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be a singleton', () => {
      const instance1 = MultiplayerGameService.getInstance();
      const instance2 = MultiplayerGameService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default state', () => {
      const state = service.getConnectionState();
      expect(state.isConnected).toBe(false);
      expect(state.queuedActions).toEqual([]);
      expect(state.isReconnecting).toBe(false);
    });
  });

  describe('connect', () => {
    it('should establish connection to room', async () => {
      const roomId = 'room123' as RoomId;
      const playerId = 'player1' as PlayerId;

      await service.connect(roomId, playerId);

      expect(mockClient.channel).toHaveBeenCalledWith(
        `room:${roomId}`,
        expect.objectContaining({
          config: {
            presence: {
              key: playerId,
            },
          },
        }),
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should update connection state on successful connection', async () => {
      await service.connect('room123' as RoomId, 'player1' as PlayerId);

      const state = service.getConnectionState();
      expect(state.isConnected).toBe(true);
      expect(state.isReconnecting).toBe(false);
    });

    it('should handle connection failures', async () => {
      mockChannel.subscribe = jest.fn().mockRejectedValue(new Error('Connection failed'));

      await expect(service.connect('room123' as RoomId, 'player1' as PlayerId)).rejects.toThrow(
        'Connection failed',
      );

      const state = service.getConnectionState();
      expect(state.isConnected).toBe(false);
    });
  });

  describe('sendAction', () => {
    const roomId = 'room123' as RoomId;
    const playerId = 'player1' as PlayerId;
    const mockGameState: RealtimeGameState = {
      version: 1 as StateVersion,
      lastModified: Date.now(),
      lastModifiedBy: playerId,
    } as RealtimeGameState;

    beforeEach(async () => {
      await service.connect(roomId, playerId);
      service.setCurrentState(mockGameState);
    });

    it('should send game action with version', async () => {
      const move = createMove.playCard(playerId, 'card1' as any);

      await service.sendAction(move);

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'game_action',
        payload: expect.objectContaining({
          action: move,
          version: 1,
          validated: false,
        }),
      });
    });

    it('should queue actions when offline', async () => {
      service.setConnectionState({ isConnected: false });
      const move = createMove.playCard(playerId, 'card1' as any);

      const result = await service.sendAction(move);

      expect(result.queued).toBe(true);
      expect(service.getConnectionState().queuedActions).toHaveLength(1);
      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it('should apply optimistic updates', async () => {
      const move = createMove.playCard(playerId, 'card1' as any);
      const optimisticState = { ...mockGameState, version: 2 as StateVersion };

      const result = await service.sendAction(move, optimisticState);

      expect(result.optimisticState).toEqual(optimisticState);
      expect(service.getCurrentState()).toEqual(optimisticState);
    });
  });

  describe('version tracking', () => {
    it('should increment version on validated action', () => {
      const state: RealtimeGameState = {
        version: 1 as StateVersion,
        lastModified: Date.now(),
        lastModifiedBy: 'player1' as PlayerId,
      } as RealtimeGameState;

      const newState = service.applyVersionedUpdate(state, 'player2' as PlayerId);

      expect(newState.version).toBe(2);
      expect(newState.lastModifiedBy).toBe('player2');
    });

    it('should detect version conflicts', () => {
      const clientState: RealtimeGameState = {
        version: 3 as StateVersion,
      } as RealtimeGameState;

      const serverState: RealtimeGameState = {
        version: 5 as StateVersion,
      } as RealtimeGameState;

      service.setCurrentState(clientState);
      const hasConflict = service.detectVersionConflict(serverState.version);

      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict when versions match', () => {
      const state: RealtimeGameState = {
        version: 3 as StateVersion,
      } as RealtimeGameState;

      service.setCurrentState(state);
      const hasConflict = service.detectVersionConflict(3 as StateVersion);

      expect(hasConflict).toBe(false);
    });
  });

  describe('conflict resolution', () => {
    it('should rollback on validation failure', async () => {
      const originalState: RealtimeGameState = {
        version: 1 as StateVersion,
        lastModified: Date.now(),
        lastModifiedBy: 'player1' as PlayerId,
      } as RealtimeGameState;

      const optimisticState: RealtimeGameState = {
        ...originalState,
        version: 2 as StateVersion,
      };

      service.setCurrentState(originalState);
      const move = createMove.playCard('player1' as PlayerId, 'card1' as any);

      await service.sendAction(move, optimisticState);

      await service.handleValidationFailure(move, 'Invalid move');

      expect(service.getCurrentState()).toEqual(originalState);
    });

    it('should handle state sync from server', () => {
      const serverState: RealtimeGameState = {
        version: 10 as StateVersion,
        lastModified: Date.now(),
        lastModifiedBy: 'server' as PlayerId,
      } as RealtimeGameState;

      service.handleStateSync(serverState);

      expect(service.getCurrentState()).toEqual(serverState);
      expect(service.getConnectionState().queuedActions).toEqual([]);
    });
  });

  describe('queue processing', () => {
    it('should process queued actions on reconnect', async () => {
      const roomId = 'room123' as RoomId;
      const playerId = 'player1' as PlayerId;

      service.setConnectionState({ isConnected: false });

      const move1 = createMove.playCard(playerId, 'card1' as any);
      const move2 = createMove.cambiar7(playerId);

      await service.sendAction(move1);
      await service.sendAction(move2);

      expect(service.getConnectionState().queuedActions).toHaveLength(2);

      await service.connect(roomId, playerId);
      await service.processQueuedActions();

      expect(mockChannel.send).toHaveBeenCalledTimes(2);
      expect(service.getConnectionState().queuedActions).toEqual([]);
    });

    it('should maintain action order when processing queue', async () => {
      const playerId = 'player1' as PlayerId;
      service.setConnectionState({ isConnected: false });

      const moves = [
        createMove.playCard(playerId, 'card1' as any),
        createMove.cambiar7(playerId),
        createMove.declareCante(playerId, 'oros'),
      ];

      for (const move of moves) {
        await service.sendAction(move);
      }

      await service.connect('room123' as RoomId, playerId);
      await service.processQueuedActions();

      const sentActions = (mockChannel.send as any).mock.calls.map(
        (call: any[]) => call[0].payload.action,
      );

      expect(sentActions).toEqual(moves);
    });
  });

  describe('event handling', () => {
    it('should handle game_action events from server', () => {
      const handler = jest.fn();
      service.onGameAction(handler);

      const event = {
        type: 'game_action' as const,
        action: createMove.playCard('player2' as PlayerId, 'card1' as any),
        validated: true,
        version: 2 as StateVersion,
        timestamp: Date.now(),
        roomId: 'room123' as RoomId,
      };

      service.handleServerEvent(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle state_sync events', () => {
      const handler = jest.fn();
      service.onStateSync(handler);

      const newState: RealtimeGameState = {
        version: 5 as StateVersion,
        lastModified: Date.now(),
        lastModifiedBy: 'server' as PlayerId,
      } as RealtimeGameState;

      const event = {
        type: 'state_sync' as const,
        state: newState,
        version: 5 as StateVersion,
        timestamp: Date.now(),
        roomId: 'room123' as RoomId,
      };

      service.handleServerEvent(event);

      expect(handler).toHaveBeenCalledWith(newState);
      expect(service.getCurrentState()).toEqual(newState);
    });

    it('should handle conflict_detected events', () => {
      const handler = jest.fn();
      service.onConflict(handler);

      const event = {
        type: 'conflict_detected' as const,
        action: createMove.playCard('player1' as PlayerId, 'card1' as any),
        reason: 'Version mismatch',
        expectedVersion: 3 as StateVersion,
        actualVersion: 5 as StateVersion,
        timestamp: Date.now(),
        roomId: 'room123' as RoomId,
      };

      service.handleServerEvent(event);

      expect(handler).toHaveBeenCalledWith(event);
    });
  });

  describe('cleanup', () => {
    it('should disconnect and cleanup on disconnect', async () => {
      await service.connect('room123' as RoomId, 'player1' as PlayerId);
      await service.disconnect();

      expect(mockChannel.unsubscribe).toHaveBeenCalled();
      expect(mockClient.removeChannel).toHaveBeenCalled();
      expect(service.getConnectionState().isConnected).toBe(false);
    });

    it('should clear queued actions on reset', () => {
      service.setConnectionState({
        isConnected: false,
        queuedActions: [createMove.playCard('player1' as PlayerId, 'card1' as any)],
      });

      service.reset();

      expect(service.getConnectionState().queuedActions).toEqual([]);
    });
  });
});
