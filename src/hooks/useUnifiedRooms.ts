/**
 * Unified rooms hook with offline-first support
 *
 * Provides:
 * - Room creation and joining
 * - Offline queue with optimistic updates
 * - Feature flag protection
 * - Automatic sync on reconnect
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useFeatureFlag } from '../config/featureFlags';
import { createRealtimeClient } from '../services/realtimeClient.native';
import { connectionService } from '../services/connectionService';
import { useConnectionStatus } from './useConnectionStatus';
import type { Brand } from '../types/game.types';
import type { Database } from '../types/database.types';
import type { ActionType, QueuedAction, RoomId, UserId } from '../services/connectionService';

// Types
export type Room = Database['public']['Tables']['rooms']['Row'];
export type RoomPlayer = Database['public']['Tables']['room_players']['Row'];
export type GameMode = Room['game_mode'];
export type RoomStatus = Room['status'];

export interface AIConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  personality: 'aggressive' | 'defensive' | 'balanced' | 'unpredictable';
}

export interface Player {
  id: string;
  name: string;
  position: number;
  teamId: 'team1' | 'team2' | null;
  isReady: boolean;
  isBot: boolean;
  botConfig?: AIConfig;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  authUserId?: string; // Maps to auth.users.id for current player identification
}

export interface RoomState {
  room: Room | null;
  players: Player[];
  isLoading: boolean;
  error: string | null;
  queuedActions: number;
}

export interface RoomActions {
  createFriendsRoom(hostId: string): Promise<Room>;
  joinRoomByCode(code: string, userId: string): Promise<Room>;
  leaveRoom(roomId: string): Promise<void>;
  addAIPlayer(roomId: string, config: AIConfig): Promise<void>;
  removeAIPlayer(roomId: string, playerIdOrPosition: string | number): Promise<void>;
  subscribeToRoom(roomId: string): () => void;
  getRoomPlayers(roomId: string): Promise<Player[]>;
  updateReadyStatus(roomId: string, playerId: string, isReady: boolean): Promise<void>;
  startGame(roomId: string): Promise<void>;
}

/**
 * Hook for unified room management with offline support
 */
export function useUnifiedRooms(): RoomState & RoomActions {
  const enableMultiplayer = useFeatureFlag('enableMultiplayer');
  const { isOnline } = useConnectionStatus();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [state, setState] = useState<RoomState>({
    room: null,
    players: [],
    isLoading: false,
    error: null,
    queuedActions: 0,
  });

  // Helper: strict UUID validation to avoid sending temp ids to Postgres
  const isUuid = useCallback((value: string) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      value,
    );
  }, []);

  // Set up action executor for connection service
  useEffect(() => {
    if (!enableMultiplayer) return;

    connectionService.setActionExecutor(async (action: QueuedAction) => {
      const client = await createRealtimeClient();
      if (!client) {
        throw new Error('Failed to create realtime client');
      }

      switch (action.type) {
        case 'CREATE_ROOM': {
          // Refresh session to ensure we have a valid token
          const { data: refreshData, error: refreshError } = await client.auth.refreshSession();

          let currentSession = refreshData?.session;

          if (refreshError || !currentSession) {
            // Try to get existing session as fallback
            const { data: sessionData, error: sessionError } = await client.auth.getSession();
            if (sessionError || !sessionData?.session) {
              throw new Error('Not authenticated. Please sign in again.');
            }
            currentSession = sessionData.session;
          }

          // Use RPC to create room with server-side constraints
          const { data, error } = await (client as any).rpc('create_room', {
            p_game_mode: 'friend',
            p_is_public: false,
          });

          if (error) {
            console.error('[CREATE_ROOM] RPC error:', error.message);
            throw error;
          }

          // Check if the RPC returned a success/error structure
          if (data && typeof data === 'object' && 'success' in data) {
            if (!data.success) {
              console.error('[CREATE_ROOM] Server returned error:', data.error);
              // Handle authentication errors specifically
              if (data.error === 'Not authenticated' || data.error?.includes('Not authenticated')) {
                throw new Error('Not authenticated. Please sign in again.');
              }
              throw new Error(data.error || 'Failed to create room on server');
            }
          }

          return data; // { success, room_id, code }
        }

        case 'JOIN_ROOM': {
          // Refresh session to ensure we have a valid token
          const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
          if (refreshError || !refreshData?.session) {
            // Try to get existing session as fallback
            const { data: sessionData, error: sessionError } = await client.auth.getSession();
            if (sessionError || !sessionData?.session) {
              throw new Error('Not authenticated. Please sign in again.');
            }
          }

          const code = action.payload.code as string;
          // Disambiguate overloaded SQL functions by passing both params
          const { data, error } = await (client as any).rpc('join_room', {
            p_room_code: code,
            p_position: null,
          });
          if (error) throw error;
          return data; // { success, room_id, ... }
        }

        case 'LEAVE_ROOM': {
          // Refresh session to ensure we have a valid token
          const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
          if (refreshError || !refreshData?.session) {
            // Try to get existing session as fallback
            const { data: sessionData, error: sessionError } = await client.auth.getSession();
            if (sessionError || !sessionData?.session) {
              throw new Error('Not authenticated. Please sign in again.');
            }
          }

          const { error } = await (client as any).rpc('leave_room', {
            p_room_id: action.payload.roomId as string,
          });
          if (error) throw error;
          return;
        }

        case 'ADD_AI_PLAYER': {
          // Refresh session to ensure we have a valid token
          const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
          if (refreshError || !refreshData?.session) {
            // Try to get existing session as fallback
            const { data: sessionData, error: sessionError } = await client.auth.getSession();
            if (sessionError || !sessionData?.session) {
              throw new Error('Not authenticated. Please sign in again.');
            }
          }

          const config = action.payload.config as AIConfig;
          const { error } = await (client as any).rpc('add_ai_player', {
            p_room_id: action.payload.roomId as string,
            p_difficulty: config.difficulty,
            p_personality: config.personality,
          });
          if (error) throw error;
          return;
        }

        case 'REMOVE_AI_PLAYER': {
          // Refresh session to ensure we have a valid token
          const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
          if (refreshError || !refreshData?.session) {
            const { data: sessionData, error: sessionError } = await client.auth.getSession();
            if (sessionError || !sessionData?.session) {
              throw new Error('Not authenticated. Please sign in again.');
            }
          }

          const payload = action.payload as any;
          const { error } = await (client as any).rpc('remove_ai_player', {
            p_room_id: payload.roomId as string,
            p_position: payload.position as number,
          });
          if (error) throw error;
          return;
        }

        case 'UPDATE_READY_STATUS': {
          // Refresh session to ensure we have a valid token
          const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
          if (refreshError || !refreshData?.session) {
            // Try to get existing session as fallback
            const { data: sessionData, error: sessionError } = await client.auth.getSession();
            if (sessionError || !sessionData?.session) {
              throw new Error('Not authenticated. Please sign in again.');
            }
          }

          // Server will toggle ready for the current auth user in the given room
          const { error } = await (client as any).rpc('toggle_ready', {
            p_room_id: action.payload.roomId as string,
          });
          if (error) throw error;
          return;
        }

        case 'START_GAME': {
          // Refresh session to ensure we have a valid token
          const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
          if (refreshError || !refreshData?.session) {
            // Try to get existing session as fallback
            const { data: sessionData, error: sessionError } = await client.auth.getSession();
            if (sessionError || !sessionData?.session) {
              throw new Error('Not authenticated. Please sign in again.');
            }
          }

          const { error } = await (client as any).rpc('start_game', {
            p_room_id: action.payload.roomId as string,
          });
          if (error) throw error;
          return;
        }

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    });
  }, [enableMultiplayer]);

  // Process queue when coming online
  useEffect(() => {
    if (isOnline && enableMultiplayer) {
      connectionService.processQueue().then(summary => {
        if (summary.processed > 0 && __DEV__) {
          console.log(`[useUnifiedRooms] Processed ${summary.processed} queued actions`);
        }
        setState(prev => ({ ...prev, queuedActions: summary.remaining }));
      });
    }
  }, [isOnline, enableMultiplayer]);

  // Update queued actions count
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({ ...prev, queuedActions: connectionService.getQueuedCount() }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Create a friends room
   */
  const createFriendsRoom = useCallback(
    async (hostId: string): Promise<Room> => {
      if (!enableMultiplayer) {
        throw new Error('Multiplayer is disabled');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // If online, wait for real room from server
        if (isOnline) {
          const { result, queued } = await connectionService.queueAction<any>(
            'CREATE_ROOM',
            { hostId },
            null, // No optimistic update when online
            isOnline,
          );

          if (__DEV__) {
            try {
              console.log('[createFriendsRoom] queueAction result:', result);
            } catch {}
          }

          if (result && result.room_id) {
            // Server returned real room data
            const room: Room = {
              id: result.room_id as string,
              code: result.code as string,
              host_id: hostId,
              game_state: null,
              status: 'waiting',
              game_mode: 'friend',
              max_players: 4,
              current_players: 1,
              is_public: false,
              created_at: new Date().toISOString(),
              started_at: null,
              finished_at: null,
              last_activity_at: new Date().toISOString(),
            };

            setState(prev => ({
              ...prev,
              room,
              isLoading: false,
              queuedActions: queued ? prev.queuedActions + 1 : prev.queuedActions,
            }));
            return room;
          } else {
            // Fallback: try RPC directly in case executor wasn't ready yet
            try {
              const client = await createRealtimeClient();
              if (!client) {
                throw new Error('Failed to create realtime client');
              }

              // Ensure session is valid
              const { data: refreshData } = await client.auth.refreshSession();
              if (!refreshData?.session) {
                const { data: sessionData } = await client.auth.getSession();
                if (!sessionData?.session) {
                  throw new Error('Not authenticated. Please sign in again.');
                }
              }

              const { data, error } = await (client as any).rpc('create_room', {
                p_game_mode: 'friend',
                p_is_public: false,
              });
              if (error) throw error;

              if (data && data.success && data.room_id) {
                const room: Room = {
                  id: data.room_id as string,
                  code: data.code as string,
                  host_id: hostId,
                  game_state: null,
                  status: 'waiting',
                  game_mode: 'friend',
                  max_players: 4,
                  current_players: 1,
                  is_public: false,
                  created_at: new Date().toISOString(),
                  started_at: null,
                  finished_at: null,
                  last_activity_at: new Date().toISOString(),
                };

                setState(prev => ({
                  ...prev,
                  room,
                  isLoading: false,
                  queuedActions: prev.queuedActions,
                }));
                return room;
              }

              // If server responded with structure but not success
              if (data && typeof data === 'object' && 'success' in data && !data.success) {
                throw new Error((data as any).error || 'Failed to create room on server');
              }
            } catch (fallbackError) {
              throw fallbackError;
            }

            throw new Error('Failed to create room on server');
          }
        } else {
          // Offline mode: create optimistic room with temp ID
          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
          const optimisticRoom: Room = {
            id: `temp_${Date.now()}` as string,
            code,
            host_id: hostId,
            game_state: null,
            status: 'waiting',
            game_mode: 'friend',
            max_players: 4,
            current_players: 1,
            is_public: false,
            created_at: new Date().toISOString(),
            started_at: null,
            finished_at: null,
            last_activity_at: new Date().toISOString(),
          };

          await connectionService.queueAction(
            'CREATE_ROOM',
            { code, hostId },
            optimisticRoom,
            isOnline,
          );

          setState(prev => ({
            ...prev,
            room: optimisticRoom,
            isLoading: false,
            queuedActions: prev.queuedActions + 1,
          }));
          return optimisticRoom;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
        setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [enableMultiplayer, isOnline],
  );

  /**
   * Join a room by code
   */
  const joinRoomByCode = useCallback(
    async (code: string, userId: string): Promise<Room> => {
      if (!enableMultiplayer) {
        throw new Error('Multiplayer is disabled');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // If online, wait for real room from server
        if (isOnline) {
          const { result, queued } = await connectionService.queueAction<any>(
            'JOIN_ROOM',
            { code: code.toUpperCase() },
            null, // No optimistic update when online
            isOnline,
          );

          if (result) {
            if (!result.success) {
              throw new Error(result.error || 'Failed to join room');
            }

            // Server returned real room data
            const room: Room = {
              id: result.room_id as string,
              code: result.code || code.toUpperCase(),
              host_id: null, // Will be fetched via subscription
              game_state: null,
              status: 'waiting',
              game_mode: 'friend',
              max_players: 4,
              current_players: 2,
              is_public: false,
              created_at: new Date().toISOString(),
              started_at: null,
              finished_at: null,
              last_activity_at: new Date().toISOString(),
            };

            setState(prev => ({
              ...prev,
              room,
              isLoading: false,
              queuedActions: queued ? prev.queuedActions + 1 : prev.queuedActions,
            }));
            return room;
          } else {
            throw new Error('No response from server');
          }
        } else {
          // Offline mode: create optimistic room with temp ID
          const optimisticRoom: Room = {
            id: `temp_${Date.now()}` as string,
            code: code.toUpperCase(),
            host_id: null,
            game_state: null,
            status: 'waiting',
            game_mode: 'friend',
            max_players: 4,
            current_players: 2,
            is_public: false,
            created_at: new Date().toISOString(),
            started_at: null,
            finished_at: null,
            last_activity_at: new Date().toISOString(),
          };

          await connectionService.queueAction(
            'JOIN_ROOM',
            { code: code.toUpperCase(), userId },
            optimisticRoom,
            isOnline,
          );

          setState(prev => ({
            ...prev,
            room: optimisticRoom,
            isLoading: false,
            queuedActions: prev.queuedActions + 1,
          }));
          return optimisticRoom;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
        setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [enableMultiplayer, isOnline],
  );

  /**
   * Leave the current room
   */
  const leaveRoom = useCallback(
    async (roomId: string): Promise<void> => {
      if (!enableMultiplayer) {
        return;
      }

      try {
        await connectionService.queueAction('LEAVE_ROOM', { roomId }, undefined, isOnline);

        // Clean up subscription
        if (channelRef.current) {
          const client = await createRealtimeClient();
          if (client) {
            await client.removeChannel(channelRef.current);
          }
          channelRef.current = null;
        }

        setState(prev => ({ ...prev, room: null, players: [] }));
      } catch (error) {
        console.error('[useUnifiedRooms] Failed to leave room:', error);
      }
    },
    [enableMultiplayer, isOnline],
  );

  /**
   * Add an AI player to the room
   */
  const addAIPlayer = useCallback(
    async (roomId: string, config: AIConfig): Promise<void> => {
      if (!enableMultiplayer) {
        throw new Error('Multiplayer is disabled');
      }

      try {
        const position = state.players.length;

        const { result } = await connectionService.queueAction<any>(
          'ADD_AI_PLAYER',
          { roomId, config, position },
          undefined,
          isOnline,
        );

        // Optimistically add AI player to state (or when online and RPC returned position)
        const newPosition =
          (result && (result as any).position !== undefined) ? (result as any).position : position;
        const aiPlayer: Player = {
          id: `ai_${Date.now()}`,
          name: `AI Player ${newPosition}`,
          position: newPosition,
          teamId: newPosition % 2 === 0 ? 'team1' : 'team2',
          isReady: true,
          isBot: true,
          botConfig: config,
          connectionStatus: 'connected',
        };

        setState(prev => ({
          ...prev,
          players: [...prev.players, aiPlayer],
        }));
      } catch (error) {
        console.error('[useUnifiedRooms] Failed to add AI player:', error);
        throw error;
      }
    },
    [enableMultiplayer, isOnline, state.players],
  );

  /**
   * Remove an AI player from the room (host only)
   */
  const removeAIPlayer = useCallback(
    async (roomId: string, playerIdOrPosition: string | number): Promise<void> => {
      if (!enableMultiplayer) {
        throw new Error('Multiplayer is disabled');
      }

      try {
        const position =
          typeof playerIdOrPosition === 'number'
            ? playerIdOrPosition
            : state.players.find(p => p.id === playerIdOrPosition)?.position ?? -1;

        if (position < 0) {
          throw new Error('Invalid AI position');
        }

        await connectionService.queueAction(
          'REMOVE_AI_PLAYER',
          { roomId, position },
          undefined,
          isOnline,
        );

        // Optimistically remove from state
        setState(prev => ({
          ...prev,
          players: prev.players.filter(p => !(p.isBot && p.position === position)),
        }));
      } catch (error) {
        console.error('[useUnifiedRooms] Failed to remove AI player:', error);
        throw error;
      }
    },
    [enableMultiplayer, isOnline, state.players],
  );

  /**
   * Subscribe to room updates
   */
  const subscribeToRoom = useCallback(
    (roomId: string): (() => void) => {
      if (!enableMultiplayer) {
        return () => {};
      }

      // If roomId is a temporary client id, skip realtime subscription
      if (!roomId || !isUuid(roomId)) {
        if (__DEV__) {
          console.warn('[useUnifiedRooms] subscribeToRoom skipped for non-UUID roomId:', roomId);
        }
        return () => {};
      }

      const setupSubscription = async () => {
        try {
          const client = await createRealtimeClient();
          if (!client) return;

          // Clean up existing channel
          if (channelRef.current) {
            await client.removeChannel(channelRef.current);
          }

          // Create new channel for the room
          const channel = client
            .channel(`room:${roomId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'rooms',
                filter: `id=eq.${roomId}`,
              },
              (() => {
                let tr: NodeJS.Timeout | null = null;
                return (payload: any) => {
                  if (!payload?.new) return;
                  if (tr) clearTimeout(tr);
                  tr = setTimeout(() => {
                    const nextRoom = payload.new as Room;
                    setState(prev => {
                      const current = prev.room;
                      const unchanged =
                        !!current &&
                        current.id === nextRoom.id &&
                        current.status === nextRoom.status &&
                        current.current_players === nextRoom.current_players &&
                        current.started_at === nextRoom.started_at;
                      if (unchanged) return prev;
                      return { ...prev, room: nextRoom };
                    });
                  }, 120);
                };
              })(),
            )
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'room_players',
                filter: `room_id=eq.${roomId}`,
              },
              (() => {
                let t: NodeJS.Timeout | null = null;
                return () => {
                  if (t) clearTimeout(t);
                  t = setTimeout(() => {
                    getRoomPlayers(roomId);
                  }, 150);
                };
              })(),
            )
            .subscribe();

          channelRef.current = channel;

          // Fetch current room status once on subscribe to avoid missing an initial update
          try {
            const { data: roomRow, error: roomError } = await client
              .from('rooms')
              .select('*')
              .eq('id', roomId)
              .single();
            if (!roomError && roomRow) {
              setState(prev => ({ ...prev, room: roomRow as Room }));
            }
          } catch {}
          // Also refresh players once (debounced)
          setTimeout(() => {
            getRoomPlayers(roomId);
          }, 50);
        } catch (error) {
          console.error('[useUnifiedRooms] Failed to subscribe to room:', error);
        }
      };

      setupSubscription();

      return () => {
        if (channelRef.current) {
          createRealtimeClient().then(client => {
            if (client && channelRef.current) {
              client.removeChannel(channelRef.current);
            }
          });
        }
      };
    },
    [enableMultiplayer, isUuid],
  );

  /**
   * Get players in a room
   */
  const getRoomPlayers = useCallback(
    async (roomId: string): Promise<Player[]> => {
      if (!enableMultiplayer) {
        return [];
      }

      try {
        // Avoid querying with temporary ids that are not valid UUIDs
        if (!roomId || !isUuid(roomId)) {
          if (__DEV__) {
            console.warn('[useUnifiedRooms] getRoomPlayers skipped for non-UUID roomId:', roomId);
          }
          return [];
        }

        const client = await createRealtimeClient();
        if (!client) {
          return [];
        }

        const { data, error } = await client
          .from('room_players')
          .select('*, users:user_id(username, display_name, auth_user_id)')
          .eq('room_id', roomId);

        if (error) throw error;

        const players: Player[] = data.map((p: any) => ({
          id: p.user_id,
          name: p.is_ai
            ? `AI Player ${p.position}`
            : p.users?.display_name || p.users?.username || 'Jugador',
          position: p.position,
          teamId:
            p.team === null || p.team === undefined ? null : p.team % 2 === 0 ? 'team1' : 'team2',
          isReady: p.is_ready,
          isBot: p.is_ai,
          botConfig: p.is_ai
            ? {
                difficulty: p.ai_difficulty || 'medium',
                personality: p.ai_personality || 'balanced',
              }
            : undefined,
          connectionStatus: p.connection_status || 'connected',
          authUserId: p.users?.auth_user_id || undefined,
        }));

        setState(prev => ({ ...prev, players }));
        return players;
      } catch (error) {
        console.error('[useUnifiedRooms] Failed to get room players:', error);
        return [];
      }
    },
    [enableMultiplayer, isUuid],
  );

  /**
   * Update player ready status
   */
  const updateReadyStatus = useCallback(
    async (roomId: string, playerId: string, isReady: boolean): Promise<void> => {
      if (!enableMultiplayer) return;

      try {
        await connectionService.queueAction(
          'UPDATE_READY_STATUS',
          { roomId, playerId, isReady },
          undefined,
          isOnline,
        );

        // Optimistically update state
        setState(prev => ({
          ...prev,
          players: prev.players.map(p => (p.id === playerId ? { ...p, isReady } : p)),
        }));
      } catch (error) {
        console.error('[useUnifiedRooms] Failed to update ready status:', error);
      }
    },
    [enableMultiplayer, isOnline],
  );

  /**
   * Start the game (host only)
   */
  const startGame = useCallback(
    async (roomId: string): Promise<void> => {
      if (!enableMultiplayer) {
        throw new Error('Multiplayer is disabled');
      }

      try {
        await connectionService.queueAction('START_GAME', { roomId }, undefined, isOnline);

        // Optimistically update room status
        setState(prev => ({
          ...prev,
          room: prev.room ? { ...prev.room, status: 'playing' } : null,
        }));
      } catch (error) {
        console.error('[useUnifiedRooms] Failed to start game:', error);
        throw error;
      }
    },
    [enableMultiplayer, isOnline],
  );

  // Return offline-safe defaults when multiplayer is disabled
  if (!enableMultiplayer) {
    return {
      room: null,
      players: [],
      isLoading: false,
      error: 'Multiplayer is disabled',
      queuedActions: 0,
      createFriendsRoom: async () => {
        throw new Error('Multiplayer is disabled');
      },
      joinRoomByCode: async () => {
        throw new Error('Multiplayer is disabled');
      },
      leaveRoom: async () => {},
      addAIPlayer: async () => {
        throw new Error('Multiplayer is disabled');
      },
      subscribeToRoom: () => () => {},
      getRoomPlayers: async () => [],
      updateReadyStatus: async () => {},
      startGame: async () => {
        throw new Error('Multiplayer is disabled');
      },
    };
  }

  return {
    ...state,
    createFriendsRoom,
    joinRoomByCode,
    leaveRoom,
    addAIPlayer,
    removeAIPlayer,
    subscribeToRoom,
    getRoomPlayers,
    updateReadyStatus,
    startGame,
  };
}
