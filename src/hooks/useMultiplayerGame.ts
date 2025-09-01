/**
 * Safe multiplayer game hook with feature flag protection
 *
 * This hook provides a safe boundary for all multiplayer game features.
 * It checks the feature flag before any operations and returns offline-safe
 * defaults when multiplayer is disabled.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useFeatureFlag } from '../config/featureFlags';
import { createRealtimeClient } from '../services/realtimeClient.native';

export interface MultiplayerGameState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  roomId: string | null;
  players: Player[];
  gameState: GameState | null;
}

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  team: 'team1' | 'team2';
  isHost: boolean;
  isOnline: boolean;
}

export interface GameState {
  currentTurn: string;
  phase: 'waiting' | 'playing' | 'finished';
  scores: { team1: number; team2: number };
}

interface UseMultiplayerGameOptions {
  roomId?: string;
  userId?: string;
  autoConnect?: boolean;
}

/**
 * Hook for multiplayer game functionality
 * Returns offline-safe defaults when multiplayer is disabled
 */
export function useMultiplayerGame(options: UseMultiplayerGameOptions = {}) {
  const { roomId, userId, autoConnect = true } = options;
  const enableMultiplayer = useFeatureFlag('enableMultiplayer');
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [state, setState] = useState<MultiplayerGameState>({
    isConnected: false,
    isLoading: false,
    error: null,
    roomId: null,
    players: [],
    gameState: null,
  });

  /**
   * Connect to a multiplayer room
   * No-op if multiplayer is disabled
   */
  const connectToRoom = useCallback(
    async (newRoomId: string) => {
      if (!enableMultiplayer) {
        if (__DEV__) {
          console.log('[useMultiplayerGame] Multiplayer disabled - skipping connection');
        }
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const client = await createRealtimeClient();
        if (!client) {
          throw new Error('Failed to create realtime client');
        }

        // Clean up existing channel if any
        if (channelRef.current) {
          await client.removeChannel(channelRef.current);
        }

        // Create new channel for the room
        const channel = client.channel(`room:${newRoomId}`, {
          config: {
            presence: {
              key: userId || 'anonymous',
            },
          },
        });

        // Set up event listeners
        channel
          .on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState();
            if (__DEV__) {
              console.log('[useMultiplayerGame] Presence sync:', presenceState);
            }
            // Update players based on presence
            updatePlayersFromPresence(presenceState);
          })
          .on('broadcast', { event: 'game_state' }, ({ payload }) => {
            if (__DEV__) {
              console.log('[useMultiplayerGame] Game state update:', payload);
            }
            setState(prev => ({ ...prev, gameState: payload }));
          })
          .on('broadcast', { event: 'player_ready' }, ({ payload }) => {
            if (__DEV__) {
              console.log('[useMultiplayerGame] Player ready:', payload);
            }
            updatePlayerReady(payload.playerId, payload.isReady);
          });

        // Subscribe to the channel
        await channel.subscribe();
        
        // Store the channel reference
        channelRef.current = channel;
        setState(prev => ({
          ...prev,
          isConnected: true,
          isLoading: false,
          roomId: newRoomId,
        }));

        if (__DEV__) {
          console.log('[useMultiplayerGame] Successfully connected to room:', newRoomId);
        }
      } catch (error) {
        console.error('[useMultiplayerGame] Connection error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to connect',
        }));
      }
    },
    [enableMultiplayer, userId],
  );

  /**
   * Disconnect from the current room
   */
  const disconnect = useCallback(async () => {
    if (!channelRef.current) return;

    const client = await createRealtimeClient();
    if (client) {
      await client.removeChannel(channelRef.current);
    }

    channelRef.current = null;
    setState({
      isConnected: false,
      isLoading: false,
      error: null,
      roomId: null,
      players: [],
      gameState: null,
    });

    if (__DEV__) {
      console.log('[useMultiplayerGame] Disconnected from room');
    }
  }, []);

  /**
   * Send a game action to other players
   * No-op if multiplayer is disabled or not connected
   */
  const sendGameAction = useCallback(
    async (action: any) => {
      if (!enableMultiplayer || !channelRef.current) {
        if (__DEV__) {
          console.log('[useMultiplayerGame] Cannot send action - not connected or disabled');
        }
        return;
      }

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'game_action',
          payload: action,
        });

        if (__DEV__) {
          console.log('[useMultiplayerGame] Sent game action:', action);
        }
      } catch (error) {
        console.error('[useMultiplayerGame] Failed to send action:', error);
      }
    },
    [enableMultiplayer],
  );

  /**
   * Update ready status
   */
  const setReady = useCallback(
    async (isReady: boolean) => {
      if (!enableMultiplayer || !channelRef.current || !userId) {
        return;
      }

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'player_ready',
          payload: { playerId: userId, isReady },
        });
      } catch (error) {
        console.error('[useMultiplayerGame] Failed to set ready status:', error);
      }
    },
    [enableMultiplayer, userId],
  );

  // Helper functions
  const updatePlayersFromPresence = (presenceState: any) => {
    const players: Player[] = Object.entries(presenceState).map(([key, value]: [string, any]) => ({
      id: key,
      name: value[0]?.name || 'Unknown',
      isReady: value[0]?.isReady || false,
      team: value[0]?.team || 'team1',
      isHost: value[0]?.isHost || false,
      isOnline: true,
    }));

    setState(prev => ({ ...prev, players }));
  };

  const updatePlayerReady = (playerId: string, isReady: boolean) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === playerId ? { ...p, isReady } : p)),
    }));
  };

  // Auto-connect on mount if roomId provided
  useEffect(() => {
    if (autoConnect && roomId && enableMultiplayer) {
      connectToRoom(roomId);
    }

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        disconnect();
      }
    };
  }, []); // Only run on mount/unmount

  // Return safe defaults when multiplayer is disabled
  if (!enableMultiplayer) {
    return {
      state: {
        isConnected: false,
        isLoading: false,
        error: 'Multiplayer is disabled',
        roomId: null,
        players: [],
        gameState: null,
      },
      connectToRoom: () => Promise.resolve(),
      disconnect: () => Promise.resolve(),
      sendGameAction: () => Promise.resolve(),
      setReady: () => Promise.resolve(),
      isMultiplayerEnabled: false,
    };
  }

  return {
    state,
    connectToRoom,
    disconnect,
    sendGameAction,
    setReady,
    isMultiplayerEnabled: true,
  };
}
