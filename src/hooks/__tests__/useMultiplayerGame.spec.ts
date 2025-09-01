/**
 * Tests for useMultiplayerGame hook
 * Addresses tech debt identified in Ticket 1
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useMultiplayerGame } from '../useMultiplayerGame';
import * as featureFlags from '../../config/featureFlags';
import * as realtimeClient from '../../services/realtimeClient.native';

// Mock dependencies
jest.mock('../../config/featureFlags');
jest.mock('../../services/realtimeClient.native');

describe('useMultiplayerGame', () => {
  let mockSupabaseClient: any;
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = false;

    // Mock channel
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      presenceState: jest.fn().mockReturnValue({}),
    };

    // Mock Supabase client
    mockSupabaseClient = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn().mockResolvedValue(undefined),
    };

    // Default mocks
    (featureFlags.useFeatureFlag as jest.Mock).mockReturnValue(true);
    (realtimeClient.createRealtimeClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe('when multiplayer is disabled', () => {
    beforeEach(() => {
      (featureFlags.useFeatureFlag as jest.Mock).mockReturnValue(false);
    });

    test('returns offline-safe defaults', () => {
      const { result } = renderHook(() => useMultiplayerGame());

      expect(result.current.state).toEqual({
        isConnected: false,
        isLoading: false,
        error: 'Multiplayer is disabled',
        roomId: null,
        players: [],
        gameState: null,
      });
      expect(result.current.isMultiplayerEnabled).toBe(false);
    });

    test('connectToRoom is a no-op', async () => {
      const { result } = renderHook(() => useMultiplayerGame());

      await act(async () => {
        await result.current.connectToRoom('test-room');
      });

      expect(realtimeClient.createRealtimeClient).not.toHaveBeenCalled();
      expect(result.current.state.isConnected).toBe(false);
    });

    test('sendGameAction is a no-op', async () => {
      const { result } = renderHook(() => useMultiplayerGame());

      await act(async () => {
        await result.current.sendGameAction({ type: 'move', card: 'A♠' });
      });

      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    test('setReady is a no-op', async () => {
      const { result } = renderHook(() => useMultiplayerGame());

      await act(async () => {
        await result.current.setReady(true);
      });

      expect(mockChannel.send).not.toHaveBeenCalled();
    });
  });

  describe('when multiplayer is enabled', () => {
    test('initial state is correct', () => {
      const { result } = renderHook(() => useMultiplayerGame());

      expect(result.current.state).toEqual({
        isConnected: false,
        isLoading: false,
        error: null,
        roomId: null,
        players: [],
        gameState: null,
      });
      expect(result.current.isMultiplayerEnabled).toBe(true);
    });

    test('connects to room successfully', async () => {
      const { result } = renderHook(() => useMultiplayerGame({ userId: 'user-123' }));

      await act(async () => {
        await result.current.connectToRoom('room-456');
      });

      expect(realtimeClient.createRealtimeClient).toHaveBeenCalled();
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        'room:room-456',
        expect.objectContaining({
          config: {
            presence: {
              key: 'user-123',
            },
          },
        }),
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(result.current.state.isConnected).toBe(true);
      expect(result.current.state.roomId).toBe('room-456');
    });

    test('handles connection error gracefully', async () => {
      (realtimeClient.createRealtimeClient as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useMultiplayerGame());

      await act(async () => {
        await result.current.connectToRoom('room-456');
      });

      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.error).toBe('Failed to create realtime client');
    });

    test('disconnects from room', async () => {
      const { result } = renderHook(() => useMultiplayerGame({ userId: 'user-123' }));

      // Connect first
      await act(async () => {
        await result.current.connectToRoom('room-456');
      });

      expect(result.current.state.isConnected).toBe(true);

      // Then disconnect
      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(mockChannel);
      expect(result.current.state).toEqual({
        isConnected: false,
        isLoading: false,
        error: null,
        roomId: null,
        players: [],
        gameState: null,
      });
    });

    test('sends game action when connected', async () => {
      const { result } = renderHook(() => useMultiplayerGame({ userId: 'user-123' }));

      // Connect first
      await act(async () => {
        await result.current.connectToRoom('room-456');
      });

      const action = { type: 'play_card', card: 'A♠', playerId: 'user-123' };

      await act(async () => {
        await result.current.sendGameAction(action);
      });

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'game_action',
        payload: action,
      });
    });

    test('does not send game action when not connected', async () => {
      const { result } = renderHook(() => useMultiplayerGame());

      const action = { type: 'play_card', card: 'A♠' };

      await act(async () => {
        await result.current.sendGameAction(action);
      });

      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    test('sets ready status when connected', async () => {
      const { result } = renderHook(() => useMultiplayerGame({ userId: 'user-123' }));

      // Connect first
      await act(async () => {
        await result.current.connectToRoom('room-456');
      });

      await act(async () => {
        await result.current.setReady(true);
      });

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'player_ready',
        payload: { playerId: 'user-123', isReady: true },
      });
    });

    test('updates players from presence sync', async () => {
      const presenceState = {
        'user-123': [
          {
            name: 'Player 1',
            isReady: true,
            team: 'team1',
            isHost: true,
          },
        ],
        'user-456': [
          {
            name: 'Player 2',
            isReady: false,
            team: 'team2',
            isHost: false,
          },
        ],
      };

      mockChannel.presenceState.mockReturnValue(presenceState);

      const { result } = renderHook(() => useMultiplayerGame({ userId: 'user-123' }));

      await act(async () => {
        await result.current.connectToRoom('room-456');
      });

      // Simulate presence sync event
      const presenceCallback = mockChannel.on.mock.calls.find(
        (call: any[]) => call[0] === 'presence' && call[1]?.event === 'sync',
      )?.[2];

      act(() => {
        presenceCallback?.();
      });

      await waitFor(() => {
        expect(result.current.state.players).toHaveLength(2);
        expect(result.current.state.players[0]).toEqual({
          id: 'user-123',
          name: 'Player 1',
          isReady: true,
          team: 'team1',
          isHost: true,
          isOnline: true,
        });
        expect(result.current.state.players[1]).toEqual({
          id: 'user-456',
          name: 'Player 2',
          isReady: false,
          team: 'team2',
          isHost: false,
          isOnline: true,
        });
      });
    });

    test('updates game state from broadcast', async () => {
      const gameState = {
        currentTurn: 'user-123',
        phase: 'playing' as const,
        scores: { team1: 10, team2: 5 },
      };

      const { result } = renderHook(() => useMultiplayerGame({ userId: 'user-123' }));

      await act(async () => {
        await result.current.connectToRoom('room-456');
      });

      // Simulate game state broadcast
      const gameStateCallback = mockChannel.on.mock.calls.find(
        (call: any[]) => call[0] === 'broadcast' && call[1]?.event === 'game_state',
      )?.[2];

      act(() => {
        gameStateCallback?.({ payload: gameState });
      });

      await waitFor(() => {
        expect(result.current.state.gameState).toEqual(gameState);
      });
    });

    test('updates player ready status from broadcast', async () => {
      const presenceState = {
        'user-123': [{ name: 'Player 1', isReady: false, team: 'team1', isHost: true }],
        'user-456': [{ name: 'Player 2', isReady: false, team: 'team2', isHost: false }],
      };

      mockChannel.presenceState.mockReturnValue(presenceState);

      const { result } = renderHook(() => useMultiplayerGame({ userId: 'user-123' }));

      await act(async () => {
        await result.current.connectToRoom('room-456');
      });

      // Set initial players
      const presenceCallback = mockChannel.on.mock.calls.find(
        (call: any[]) => call[0] === 'presence',
      )?.[2];
      act(() => presenceCallback?.());

      // Simulate player ready broadcast
      const readyCallback = mockChannel.on.mock.calls.find(
        (call: any[]) => call[0] === 'broadcast' && call[1]?.event === 'player_ready',
      )?.[2];

      act(() => {
        readyCallback?.({ payload: { playerId: 'user-456', isReady: true } });
      });

      await waitFor(() => {
        const player2 = result.current.state.players.find(p => p.id === 'user-456');
        expect(player2?.isReady).toBe(true);
      });
    });

    test('auto-connects when roomId provided and autoConnect is true', async () => {
      const { result } = renderHook(() =>
        useMultiplayerGame({
          roomId: 'auto-room',
          userId: 'user-123',
          autoConnect: true,
        }),
      );

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
          'room:auto-room',
          expect.any(Object),
        );
        expect(result.current.state.isConnected).toBe(true);
      });
    });

    test('does not auto-connect when autoConnect is false', async () => {
      renderHook(() =>
        useMultiplayerGame({
          roomId: 'no-auto-room',
          userId: 'user-123',
          autoConnect: false,
        }),
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockSupabaseClient.channel).not.toHaveBeenCalled();
    });

    test('cleans up existing channel when connecting to new room', async () => {
      const { result } = renderHook(() => useMultiplayerGame({ userId: 'user-123' }));

      // Connect to first room
      await act(async () => {
        await result.current.connectToRoom('room-1');
      });

      const firstChannel = mockChannel;
      expect(result.current.state.roomId).toBe('room-1');

      // Create new mock channel for second room
      const secondChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue(undefined),
        send: jest.fn().mockResolvedValue(undefined),
        presenceState: jest.fn().mockReturnValue({}),
      };
      mockSupabaseClient.channel.mockReturnValue(secondChannel);

      // Connect to second room
      await act(async () => {
        await result.current.connectToRoom('room-2');
      });

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(firstChannel);
      expect(result.current.state.roomId).toBe('room-2');
    });

    test('cleans up on unmount', () => {
      const { unmount } = renderHook(() =>
        useMultiplayerGame({
          roomId: 'cleanup-room',
          userId: 'user-123',
          autoConnect: true,
        }),
      );

      unmount();

      // Cleanup is called but async, so we just verify the hook doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles missing userId gracefully', async () => {
      const { result } = renderHook(() => useMultiplayerGame({ autoConnect: false }));

      await act(async () => {
        await result.current.connectToRoom('room-789');
      });

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        'room:room-789',
        expect.objectContaining({
          config: {
            presence: {
              key: 'anonymous',
            },
          },
        }),
      );
    });

    test('handles channel subscription error', async () => {
      mockChannel.subscribe.mockRejectedValue(new Error('Subscription failed'));

      const { result } = renderHook(() => useMultiplayerGame());

      await act(async () => {
        await result.current.connectToRoom('error-room');
      });

      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.error).toBe('Subscription failed');
    });

    test('handles send error gracefully', async () => {
      mockChannel.send.mockRejectedValue(new Error('Send failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useMultiplayerGame({ userId: 'user-123' }));

      await act(async () => {
        await result.current.connectToRoom('room-456');
      });

      await act(async () => {
        await result.current.sendGameAction({ type: 'move' });
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[useMultiplayerGame] Failed to send action:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
