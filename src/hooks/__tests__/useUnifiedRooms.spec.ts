/**
 * Tests for useUnifiedRooms hook
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUnifiedRooms } from '../useUnifiedRooms';
import { connectionService } from '../../services/connectionService';
import * as featureFlags from '../../config/featureFlags';
import * as realtimeClient from '../../services/realtimeClient.native';
import * as connectionStatus from '../useConnectionStatus';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../config/featureFlags');
jest.mock('../../services/realtimeClient.native');
jest.mock('../useConnectionStatus');

describe('useUnifiedRooms', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (featureFlags.useFeatureFlag as jest.Mock).mockReturnValue(true);
    (connectionStatus.useConnectionStatus as jest.Mock).mockReturnValue({
      isOnline: true,
      status: 'connected',
      isConnected: true,
      isReconnecting: false,
    });

    // Mock Supabase client
    mockSupabaseClient = {
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
                  id: 'room-123',
                  code: 'ABC123',
                  host_id: 'user-123',
                  status: 'waiting',
                  game_mode: 'friend',
                  max_players: 4,
                  current_players: 1,
                  is_public: false,
                  created_at: new Date().toISOString(),
                  started_at: null,
                  finished_at: null,
                  last_activity_at: new Date().toISOString(),
                  game_state: null,
                },
                error: null,
              }),
            ),
          })),
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
                  id: 'room-123',
                  code: 'ABC123',
                  host_id: 'user-456',
                  status: 'waiting',
                  game_mode: 'friend',
                },
                error: null,
              }),
            ),
            is: jest.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              }),
            ),
          })),
          single: jest.fn(() =>
            Promise.resolve({
              data: {
                id: 'room-123',
                code: 'ABC123',
              },
              error: null,
            }),
          ),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      })),
      removeChannel: jest.fn(() => Promise.resolve()),
    };

    (realtimeClient.createRealtimeClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  afterEach(() => {
    // Clear connection service queue
    connectionService.clearQueue();
  });

  describe('when multiplayer is disabled', () => {
    beforeEach(() => {
      (featureFlags.useFeatureFlag as jest.Mock).mockReturnValue(false);
    });

    it('should return disabled state and throw on actions', async () => {
      const { result } = renderHook(() => useUnifiedRooms());

      expect(result.current.room).toBeNull();
      expect(result.current.players).toEqual([]);
      expect(result.current.error).toBe('Multiplayer is disabled');

      await expect(result.current.createFriendsRoom('user-123')).rejects.toThrow(
        'Multiplayer is disabled',
      );
      await expect(result.current.joinRoomByCode('ABC123', 'user-123')).rejects.toThrow(
        'Multiplayer is disabled',
      );
      await expect(
        result.current.addAIPlayer('room-123', { difficulty: 'medium', personality: 'balanced' }),
      ).rejects.toThrow('Multiplayer is disabled');
      await expect(result.current.startGame('room-123')).rejects.toThrow('Multiplayer is disabled');
    });
  });

  describe('when multiplayer is enabled', () => {
    describe('createFriendsRoom', () => {
      it('should create a room when online', async () => {
        const { result } = renderHook(() => useUnifiedRooms());

        let room: any;
        await act(async () => {
          room = await result.current.createFriendsRoom('user-123');
        });

        expect(room).toEqual({
          id: 'room-123',
          code: 'ABC123',
          host_id: 'user-123',
          status: 'waiting',
          game_mode: 'friend',
          max_players: 4,
          current_players: 1,
          is_public: false,
          created_at: expect.any(String),
          started_at: null,
          finished_at: null,
          last_activity_at: expect.any(String),
          game_state: null,
        });

        expect(result.current.room).toEqual(room);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      it('should queue room creation when offline', async () => {
        (connectionStatus.useConnectionStatus as jest.Mock).mockReturnValue({
          isOnline: false,
          status: 'disconnected',
          isConnected: false,
          isReconnecting: false,
        });

        const { result } = renderHook(() => useUnifiedRooms());

        let room: any;
        await act(async () => {
          room = await result.current.createFriendsRoom('user-123');
        });

        // Should return optimistic response
        expect(room.host_id).toBe('user-123');
        expect(room.status).toBe('waiting');
        expect(room.game_mode).toBe('friend');

        // Should have queued the action
        expect(connectionService.getQueuedCount()).toBe(1);
      });
    });

    describe('joinRoomByCode', () => {
      it('should join a room when online', async () => {
        const { result } = renderHook(() => useUnifiedRooms());

        let room: any;
        await act(async () => {
          room = await result.current.joinRoomByCode('ABC123', 'user-123');
        });

        expect(room).toEqual({
          id: 'room-123',
          code: 'ABC123',
          host_id: 'user-456',
          status: 'waiting',
          game_mode: 'friend',
        });

        expect(result.current.room).toEqual(room);
      });

      it('should queue join when offline', async () => {
        (connectionStatus.useConnectionStatus as jest.Mock).mockReturnValue({
          isOnline: false,
          status: 'disconnected',
          isConnected: false,
          isReconnecting: false,
        });

        const { result } = renderHook(() => useUnifiedRooms());

        let room: any;
        await act(async () => {
          room = await result.current.joinRoomByCode('ABC123', 'user-123');
        });

        // Should return optimistic response
        expect(room.code).toBe('ABC123');
        expect(room.status).toBe('waiting');

        // Should have queued the action
        expect(connectionService.getQueuedCount()).toBe(1);
      });
    });

    describe('addAIPlayer', () => {
      it('should add AI player to room', async () => {
        const { result } = renderHook(() => useUnifiedRooms());

        await act(async () => {
          await result.current.addAIPlayer('room-123', {
            difficulty: 'hard',
            personality: 'aggressive',
          });
        });

        // Should optimistically add player
        expect(result.current.players).toHaveLength(1);
        expect(result.current.players[0].isBot).toBe(true);
        expect(result.current.players[0].botConfig).toEqual({
          difficulty: 'hard',
          personality: 'aggressive',
        });
      });

      it('should queue AI player addition when offline', async () => {
        (connectionStatus.useConnectionStatus as jest.Mock).mockReturnValue({
          isOnline: false,
          status: 'disconnected',
          isConnected: false,
          isReconnecting: false,
        });

        const { result } = renderHook(() => useUnifiedRooms());

        await act(async () => {
          await result.current.addAIPlayer('room-123', {
            difficulty: 'easy',
            personality: 'defensive',
          });
        });

        // Should still add optimistically
        expect(result.current.players).toHaveLength(1);

        // Should have queued the action
        expect(connectionService.getQueuedCount()).toBe(1);
      });
    });

    describe('updateReadyStatus', () => {
      it('should update player ready status', async () => {
        const { result } = renderHook(() => useUnifiedRooms());

        // Add a player to state first
        await act(async () => {
          await result.current.addAIPlayer('room-123', {
            difficulty: 'medium',
            personality: 'balanced',
          });
        });

        const playerId = result.current.players[0].id;

        await act(async () => {
          await result.current.updateReadyStatus('room-123', playerId, false);
        });

        // Should optimistically update
        expect(result.current.players[0].isReady).toBe(false);
      });
    });

    describe('startGame', () => {
      it('should start the game', async () => {
        const { result } = renderHook(() => useUnifiedRooms());

        // Create a room first
        await act(async () => {
          await result.current.createFriendsRoom('user-123');
        });

        await act(async () => {
          await result.current.startGame('room-123');
        });

        // Should optimistically update status
        expect(result.current.room?.status).toBe('playing');
      });
    });

    describe('queue processing', () => {
      it('should process queue when coming back online', async () => {
        // Start offline
        const connectionHook = {
          isOnline: false,
          status: 'disconnected' as const,
          isConnected: false,
          isReconnecting: false,
        };
        (connectionStatus.useConnectionStatus as jest.Mock).mockReturnValue(connectionHook);

        const { result, rerender } = renderHook(() => useUnifiedRooms());

        // Queue an action while offline
        await act(async () => {
          await result.current.createFriendsRoom('user-123');
        });

        expect(connectionService.getQueuedCount()).toBe(1);

        // Come back online
        connectionHook.isOnline = true;
        connectionHook.status = 'connected';
        connectionHook.isConnected = true;

        // Wrap everything in act to prevent warnings
        await act(async () => {
          rerender();
        });

        // Wait for queue processing in act
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 150));
        });

        // Queue should be processed
        expect(connectionService.getQueuedCount()).toBe(0);
      });
    });

    describe('subscribeToRoom', () => {
      it('should set up room subscription', async () => {
        const { result } = renderHook(() => useUnifiedRooms());

        let unsubscribe: any;
        await act(async () => {
          unsubscribe = result.current.subscribeToRoom('room-123');
          // Wait for async setup
          await new Promise(resolve => setTimeout(resolve, 10));
        });

        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('room:room-123');
        expect(typeof unsubscribe).toBe('function');
      });

      it('should return noop when multiplayer disabled', () => {
        (featureFlags.useFeatureFlag as jest.Mock).mockReturnValue(false);
        const { result } = renderHook(() => useUnifiedRooms());

        const unsubscribe = result.current.subscribeToRoom('room-123');

        expect(mockSupabaseClient.channel).not.toHaveBeenCalled();
        expect(typeof unsubscribe).toBe('function');
      });
    });

    describe('getRoomPlayers', () => {
      it('should fetch room players', async () => {
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              is: jest.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      player_id: 'player-1',
                      position: 0,
                      team_id: 'team1',
                      is_ready: true,
                      is_bot: false,
                      connection_status: 'connected',
                      profiles: {
                        username: 'player1',
                        display_name: 'Player One',
                      },
                    },
                    {
                      player_id: 'ai-1',
                      position: 1,
                      team_id: 'team2',
                      is_ready: true,
                      is_bot: true,
                      bot_difficulty: 'hard',
                      bot_personality: 'aggressive',
                      connection_status: 'connected',
                    },
                  ],
                  error: null,
                }),
              ),
            })),
          })),
        });

        const { result } = renderHook(() => useUnifiedRooms());

        let players: any[];
        await act(async () => {
          players = await result.current.getRoomPlayers('room-123');
        });

        expect(players!).toHaveLength(2);
        expect(players![0].name).toBe('Player One');
        expect(players![1].isBot).toBe(true);
        expect(players![1].botConfig).toEqual({
          difficulty: 'hard',
          personality: 'aggressive',
        });
      });
    });
  });

  describe('error handling', () => {
    it('should handle room creation errors when offline', async () => {
      // Test offline error handling - actions get queued with optimistic response
      (connectionStatus.useConnectionStatus as jest.Mock).mockReturnValue({
        isOnline: false,
        status: 'disconnected',
        isConnected: false,
        isReconnecting: false,
      });

      const { result } = renderHook(() => useUnifiedRooms());

      let room: any;
      await act(async () => {
        // Should not throw when offline, returns optimistic response
        room = await result.current.createFriendsRoom('user-123');
      });

      // Should return optimistic response and queue action
      expect(room).toBeTruthy();
      expect(room.host_id).toBe('user-123');
      expect(connectionService.getQueuedCount()).toBe(1);
    });

    it('should queue join room when offline', async () => {
      (connectionStatus.useConnectionStatus as jest.Mock).mockReturnValue({
        isOnline: false,
        status: 'disconnected',
        isConnected: false,
        isReconnecting: false,
      });

      const { result } = renderHook(() => useUnifiedRooms());

      let room: any;
      await act(async () => {
        // Should not throw when offline, returns optimistic response
        room = await result.current.joinRoomByCode('INVALID', 'user-123');
      });

      // Should return optimistic response and queue action
      expect(room).toBeTruthy();
      expect(room.code).toBe('INVALID');
      expect(connectionService.getQueuedCount()).toBe(1);
    });
  });
});
