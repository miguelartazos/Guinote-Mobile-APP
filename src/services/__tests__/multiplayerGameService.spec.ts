/**
 * Tests for MultiplayerGameService
 * Tests realtime game state synchronization and server validation
 */

import { MultiplayerGameService } from '../multiplayerGameService';
import * as featureFlags from '../../config/featureFlags';
import * as realtimeClient from '../realtimeClient.native';
import type { GameMove } from '../../types/gameMove.types';
import type { RealtimeGameState } from '../../types/realtime.types';

// Mock dependencies
jest.mock('../../config/featureFlags');
jest.mock('../realtimeClient.native');

// Mock fetch for server validation
global.fetch = jest.fn();

describe('MultiplayerGameService', () => {
  let service: MultiplayerGameService;
  let mockSupabaseClient: any;
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = false;

    service = MultiplayerGameService.getInstance();
    service.reset();

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

  afterEach(() => {
    service.reset();
  });

  describe('connection management', () => {
    test('connects to room successfully', async () => {
      await service.connect('room-123' as any, 'player-456' as any);

      expect(realtimeClient.createRealtimeClient).toHaveBeenCalled();
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        'room:room-123',
        expect.objectContaining({
          config: {
            presence: {
              key: 'player-456',
            },
          },
        }),
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(service.getConnectionState().isConnected).toBe(true);
    });

    test('throws error when multiplayer is disabled', async () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(false);

      await expect(service.connect('room-123' as any, 'player-456' as any)).rejects.toThrow(
        'Multiplayer is disabled',
      );
    });

    test('handles connection failure', async () => {
      (realtimeClient.createRealtimeClient as jest.Mock).mockResolvedValue(null);

      await expect(service.connect('room-123' as any, 'player-456' as any)).rejects.toThrow(
        'Failed to create realtime client',
      );

      expect(service.getConnectionState().isConnected).toBe(false);
    });

    test('disconnects cleanly', async () => {
      await service.connect('room-123' as any, 'player-456' as any);
      await service.disconnect();

      expect(mockChannel.unsubscribe).toHaveBeenCalled();
      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(mockChannel);
      expect(service.getConnectionState().isConnected).toBe(false);
    });
  });

  describe('action sending', () => {
    const mockAction: GameMove = {
      type: 'PLAY_CARD',
      playerId: 'player-456' as any,
      card: { suit: 'oros', rank: 'as' } as any,
      timestamp: Date.now(),
    };

    const mockState: RealtimeGameState = {
      version: 1 as any,
      lastModified: Date.now(),
      lastModifiedBy: 'player-456' as any,
      gameState: {} as any,
    };

    test('sends action when connected', async () => {
      await service.connect('room-123' as any, 'player-456' as any);
      service.setCurrentState(mockState);

      const result = await service.sendAction(mockAction);

      expect(result.success).toBe(true);
      expect(result.queued).toBe(false);
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'game_action',
        payload: {
          action: mockAction,
          version: 1,
          validated: true,
        },
      });
    });

    test('queues action when disconnected', async () => {
      const result = await service.sendAction(mockAction, mockState);

      expect(result.success).toBe(false);
      expect(result.queued).toBe(true);
      expect(result.optimisticState).toBe(mockState);
      expect(service.getConnectionState().queuedActions).toContain(mockAction);
    });
  });

  describe('version control', () => {
    test('detects version conflict', () => {
      const state: RealtimeGameState = {
        version: 5 as any,
        lastModified: Date.now(),
        lastModifiedBy: 'player-456' as any,
        gameState: {} as any,
      };

      service.setCurrentState(state);

      expect(service.detectVersionConflict(5 as any)).toBe(false);
      expect(service.detectVersionConflict(6 as any)).toBe(true);
    });
  });

  describe('singleton pattern', () => {
    test('returns same instance', () => {
      const instance1 = MultiplayerGameService.getInstance();
      const instance2 = MultiplayerGameService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
