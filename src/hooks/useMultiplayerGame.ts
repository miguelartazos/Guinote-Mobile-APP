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
  onGameAction?: (action: any) => void;
  onSystemEvent?: (
    event:
      | { type: 'hand_start'; seed: string; dealerIndex: number; firstPlayerIndex?: number }
      | { type: 'ack'; seq: number },
  ) => void;
  // Optional presence metadata
  displayName?: string;
  isHost?: boolean;
  team?: 'team1' | 'team2';
  isReady?: boolean;
  // Ack tuning
  ackTimeoutMs?: number;
  ackRetryMs?: number;
}

/**
 * Hook for multiplayer game functionality
 * Returns offline-safe defaults when multiplayer is disabled
 */
export function useMultiplayerGame(options: UseMultiplayerGameOptions = {}) {
  const {
    roomId,
    userId,
    autoConnect = true,
    onGameAction,
    displayName,
    isHost,
    team,
    isReady,
    ackTimeoutMs = 4000,
    ackRetryMs = 600,
  } = options;
  const enableMultiplayer = useFeatureFlag('enableMultiplayer');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceMetaRef = useRef({
    name: displayName || 'Jugador',
    isReady: !!isReady,
    team: team || 'team1',
    isHost: !!isHost,
  });

  const [state, setState] = useState<MultiplayerGameState>({
    isConnected: false,
    isLoading: false,
    error: null,
    roomId: null,
    players: [],
    gameState: null,
  });

  // Ack tracking
  const seqRef = useRef(1);
  const ackWaitersRef = useRef(
    new Map<
      number,
      {
        expected: Set<string>;
        timeout: NodeJS.Timeout;
        interval: NodeJS.Timeout;
        resolve: () => void;
        payload: any;
      }
    >(),
  );

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
          .on('broadcast', { event: 'game_action' }, ({ payload }) => {
            if (__DEV__) {
              console.log('[useMultiplayerGame] Game action received:', payload);
            }
            // Forward to consumer if provided
            try {
              onGameAction && onGameAction(payload);
            } catch (e) {
              console.error('[useMultiplayerGame] onGameAction handler error:', e);
            }
          })
          .on('broadcast', { event: 'player_ready' }, ({ payload }) => {
            if (__DEV__) {
              console.log('[useMultiplayerGame] Player ready:', payload);
            }
            updatePlayerReady(payload.playerId, payload.isReady);
          })
          .on('broadcast', { event: 'system' }, async ({ payload }) => {
            if (__DEV__) {
              console.log('[useMultiplayerGame] System event:', payload);
            }
            try {
              options.onSystemEvent?.(payload);
            } catch {}

            // Auto-ack for hand_start events
            try {
              if (payload && payload.type === 'hand_start' && typeof payload.seq === 'number') {
                if (userId && channelRef.current) {
                  await channelRef.current.send({
                    type: 'broadcast',
                    event: 'system',
                    payload: { type: 'ack', seq: payload.seq, from: userId },
                  });
                }
              }
              // Resolve ack waiters on ack
              if (payload && payload.type === 'ack' && typeof payload.seq === 'number') {
                const waiter = ackWaitersRef.current.get(payload.seq);
                if (waiter && payload.from && waiter.expected.has(payload.from)) {
                  waiter.expected.delete(payload.from);
                  if (waiter.expected.size === 0) {
                    clearTimeout(waiter.timeout);
                    clearInterval(waiter.interval);
                    ackWaitersRef.current.delete(payload.seq);
                    waiter.resolve();
                  }
                }
              }
            } catch (e) {
              if (__DEV__) console.warn('[useMultiplayerGame] Ack handling error', e);
            }
          });

        // Subscribe to the channel
        await channel.subscribe();

        // Store the channel reference
        channelRef.current = channel;
        // Track initial presence metadata
        try {
          await channelRef.current.track({ ...presenceMetaRef.current });
        } catch (e) {
          if (__DEV__) console.warn('[useMultiplayerGame] Failed to track presence:', e);
        }
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
        // Update presence metadata as well
        presenceMetaRef.current = { ...presenceMetaRef.current, isReady };
        try {
          await channelRef.current.track({ ...presenceMetaRef.current });
        } catch {}
      } catch (error) {
        console.error('[useMultiplayerGame] Failed to set ready status:', error);
      }
    },
    [enableMultiplayer, userId],
  );

  /**
   * Send a lightweight system event (e.g., hand_start) to all peers
   */
  const sendSystemEvent = useCallback(
    async (payload: any) => {
      if (!enableMultiplayer || !channelRef.current) {
        return;
      }
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'system',
          payload,
        });
      } catch (error) {
        console.error('[useMultiplayerGame] Failed to send system event:', error);
      }
    },
    [enableMultiplayer],
  );

  /**
   * Broadcast a system event and wait for acknowledgements from other peers.
   */
  const sendSystemEventWithAck = useCallback(
    async (basePayload: any): Promise<void> => {
      if (!enableMultiplayer || !channelRef.current) return;

      const seq = seqRef.current++;
      const others = new Set<string>(state.players.map(p => p.id).filter(id => id && id !== userId));
      if (others.size === 0) return; // nothing to wait for

      const payload = { ...basePayload, seq };

      await channelRef.current.send({ type: 'broadcast', event: 'system', payload });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          // Final attempt timed out; resolve anyway to avoid blocking forever
          if (__DEV__) console.warn('[useMultiplayerGame] Ack timeout for seq', seq);
          ackWaitersRef.current.delete(seq);
          clearInterval(interval);
          resolve();
        }, ackTimeoutMs);

        const interval = setInterval(async () => {
          const waiter = ackWaitersRef.current.get(seq);
          const expectedLeft = waiter ? waiter.expected.size : others.size;
          if (expectedLeft > 0 && channelRef.current) {
            await channelRef.current.send({ type: 'broadcast', event: 'system', payload });
          }
        }, ackRetryMs);

        ackWaitersRef.current.set(seq, {
          expected: new Set(others),
          timeout,
          interval,
          resolve,
          payload,
        });
      });
    },
    [enableMultiplayer, state.players, userId, ackRetryMs, ackTimeoutMs],
  );

  /**
   * Broadcast a minimal game state snapshot (host only typical usage).
   */
  const sendGameState = useCallback(
    async (snapshot: Partial<GameState> & Record<string, any>) => {
      if (!enableMultiplayer || !channelRef.current) return;
      try {
        await channelRef.current.send({ type: 'broadcast', event: 'game_state', payload: snapshot });
      } catch (e) {
        console.error('[useMultiplayerGame] Failed to send game_state:', e);
      }
    },
    [enableMultiplayer],
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

  // Update presence metadata when local props change
  useEffect(() => {
    presenceMetaRef.current = {
      name: displayName || presenceMetaRef.current.name,
      isReady: typeof isReady === 'boolean' ? isReady : presenceMetaRef.current.isReady,
      team: team || presenceMetaRef.current.team,
      isHost: !!isHost,
    };
    const pushUpdate = async () => {
      try {
        if (channelRef.current) {
          await channelRef.current.track({ ...presenceMetaRef.current });
        }
      } catch {}
    };
    pushUpdate();
  }, [displayName, isHost, team, isReady]);

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
      sendSystemEvent: () => Promise.resolve(),
      sendSystemEventWithAck: () => Promise.resolve(),
      sendGameState: () => Promise.resolve(),
      setReady: () => Promise.resolve(),
      isMultiplayerEnabled: false,
    };
  }

  return {
    state,
    connectToRoom,
    disconnect,
    sendGameAction,
    sendSystemEvent,
    sendSystemEventWithAck,
    sendGameState,
    setReady,
    isMultiplayerEnabled: true,
  };
}
