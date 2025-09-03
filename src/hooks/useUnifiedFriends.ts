/**
 * Unified friends hook with offline-first support
 *
 * Provides:
 * - Friend request management
 * - Online status tracking
 * - User search functionality
 * - Offline queue with optimistic updates
 * - Feature flag protection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useFeatureFlag } from '../config/featureFlags';
import { createRealtimeClient } from '../services/realtimeClient.native';
import { connectionService } from '../services/connectionService';
import { useConnectionStatus } from './useConnectionStatus';
import type { Brand } from '../types/game.types';
import type { Database } from '../types/database.types';
import type { QueuedAction } from '../services/connectionService';

// Types
// Use users table as the source of profile data (no profiles table in schema)
export type Profile = Database['public']['Tables']['users']['Row'];
export type Friendship = Database['public']['Tables']['friendships']['Row'];
export type FriendshipStatus = Friendship['status'];
export type FriendRequestId = Brand<string, 'FriendRequestId'>;
export type UserId = Brand<string, 'UserId'>;

export interface Friend {
  id: UserId;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  ranking: number;
  isOnline: boolean;
  lastSeenAt: string;
  friendshipId: FriendRequestId;
}

export interface FriendRequest {
  id: FriendRequestId;
  senderId: UserId;
  senderName: string;
  senderAvatar: string | null;
  recipientId: UserId;
  createdAt: string;
  status: 'pending';
}

export interface BlockedUser {
  id: UserId;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  blockedAt: string;
  friendshipId: FriendRequestId;
}

export interface FriendsState {
  friends: Friend[];
  onlineFriends: Friend[];
  friendRequests: FriendRequest[];
  blockedUsers: BlockedUser[];
  isLoading: boolean;
  error: string | null;
  queuedActions: number;
}

export interface FriendActions {
  sendFriendRequest(targetUserId: string): Promise<void>;
  acceptFriendRequest(requestId: string): Promise<void>;
  getFriends(): Promise<Friend[]>;
  getOnlineFriends(): Promise<Friend[]>;
  searchUsers(query: string): Promise<Profile[]>;
  blockUser(userId: string): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  removeFriend(friendId: string): Promise<void>;
  subscribeToFriendUpdates(): () => void;
}

/**
 * Hook for unified friends management with offline support
 */
export function useUnifiedFriends(): FriendsState & FriendActions {
  const enableMultiplayer = useFeatureFlag('enableMultiplayer');
  const { isOnline } = useConnectionStatus();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const [state, setState] = useState<FriendsState>({
    friends: [],
    onlineFriends: [],
    friendRequests: [],
    blockedUsers: [],
    isLoading: false,
    error: null,
    queuedActions: 0,
  });

  // Set up action executor for connection service
  useEffect(() => {
    if (!enableMultiplayer) return;

    connectionService.setActionExecutor(async (action: QueuedAction) => {
      const client = await createRealtimeClient();
      if (!client) {
        throw new Error('Failed to create realtime client');
      }

      switch (action.type) {
        case 'SEND_FRIEND_REQUEST': {
          const { data: existingFriendship, error: checkError } = await client
            .from('friendships')
            .select('*')
            .or(
              `and(user_id.eq.${action.payload.senderId},friend_id.eq.${action.payload.targetUserId}),and(user_id.eq.${action.payload.targetUserId},friend_id.eq.${action.payload.senderId})`,
            )
            .single();

          if (!checkError && existingFriendship) {
            throw new Error('Friendship already exists');
          }

          const { error } = await client.from('friendships').insert({
            user_id: action.payload.senderId as string,
            friend_id: action.payload.targetUserId as string,
            status: 'pending',
          });

          if (error) throw error;
          return;
        }

        case 'ACCEPT_FRIEND_REQUEST': {
          const { error: updateError1 } = await client
            .from('friendships')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
            })
            .eq('id', action.payload.requestId as string);

          if (updateError1) throw updateError1;

          // Create reciprocal friendship
          const { data: originalRequest } = await client
            .from('friendships')
            .select('*')
            .eq('id', action.payload.requestId as string)
            .single();

          if (originalRequest) {
            const { error: insertError } = await client.from('friendships').insert({
              user_id: originalRequest.friend_id,
              friend_id: originalRequest.user_id,
              status: 'accepted',
              accepted_at: new Date().toISOString(),
            });

            if (insertError && insertError.code !== '23505') {
              // Ignore duplicate key errors
              console.warn('Failed to create reciprocal friendship:', insertError);
            }
          }
          return;
        }

        case 'BLOCK_USER': {
          const { data: existingFriendship } = await client
            .from('friendships')
            .select('*')
            .eq('user_id', action.payload.blockerId as string)
            .eq('friend_id', action.payload.blockedId as string)
            .single();

          if (existingFriendship) {
            const { error } = await client
              .from('friendships')
              .update({ status: 'blocked' })
              .eq('id', existingFriendship.id);

            if (error) throw error;
          } else {
            const { error } = await client.from('friendships').insert({
              user_id: action.payload.blockerId as string,
              friend_id: action.payload.blockedId as string,
              status: 'blocked',
            });

            if (error) throw error;
          }
          return;
        }

        case 'UNBLOCK_USER': {
          const { error } = await client
            .from('friendships')
            .delete()
            .eq('user_id', action.payload.unblockerId as string)
            .eq('friend_id', action.payload.unblockedId as string)
            .eq('status', 'blocked');

          if (error) throw error;
          return;
        }

        case 'REMOVE_FRIEND': {
          const { error: deleteError1 } = await client
            .from('friendships')
            .delete()
            .eq('user_id', action.payload.userId as string)
            .eq('friend_id', action.payload.friendId as string)
            .eq('status', 'accepted');

          if (deleteError1) throw deleteError1;

          // Remove reciprocal friendship
          const { error: deleteError2 } = await client
            .from('friendships')
            .delete()
            .eq('user_id', action.payload.friendId as string)
            .eq('friend_id', action.payload.userId as string)
            .eq('status', 'accepted');

          if (deleteError2) {
            console.warn('Failed to remove reciprocal friendship:', deleteError2);
          }
          return;
        }

        default:
          // Let other actions be handled by their respective hooks
          return;
      }
    });
  }, [enableMultiplayer]);

  // Process queue when coming online
  useEffect(() => {
    if (isOnline && enableMultiplayer) {
      connectionService.processQueue().then(summary => {
        if (summary.processed > 0 && __DEV__) {
          console.log(`[useUnifiedFriends] Processed ${summary.processed} queued actions`);
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
   * Send a friend request
   */
  const sendFriendRequest = useCallback(
    async (targetUserId: string): Promise<void> => {
      if (!enableMultiplayer) {
        throw new Error('Multiplayer is disabled');
      }

      if (!currentUserIdRef.current) {
        throw new Error('User not authenticated');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const { queued } = await connectionService.queueAction(
          'SEND_FRIEND_REQUEST',
          {
            senderId: currentUserIdRef.current,
            targetUserId,
          },
          undefined,
          isOnline,
        );

        setState(prev => ({
          ...prev,
          isLoading: false,
          queuedActions: queued ? prev.queuedActions + 1 : prev.queuedActions,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send friend request';
        setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [enableMultiplayer, isOnline],
  );

  /**
   * Accept a friend request
   */
  const acceptFriendRequest = useCallback(
    async (requestId: string): Promise<void> => {
      if (!enableMultiplayer) {
        throw new Error('Multiplayer is disabled');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const { queued } = await connectionService.queueAction(
          'ACCEPT_FRIEND_REQUEST',
          { requestId },
          undefined,
          isOnline,
        );

        // Optimistically update state
        setState(prev => {
          const request = prev.friendRequests.find(r => r.id === (requestId as FriendRequestId));
          if (request) {
            const newFriend: Friend = {
              id: request.senderId,
              username: request.senderName,
              displayName: null,
              avatarUrl: request.senderAvatar,
              ranking: 1000,
              isOnline: false,
              lastSeenAt: new Date().toISOString(),
              friendshipId: request.id,
            };

            return {
              ...prev,
              friends: [...prev.friends, newFriend],
              friendRequests: prev.friendRequests.filter(r => r.id !== requestId),
              isLoading: false,
              queuedActions: queued ? prev.queuedActions + 1 : prev.queuedActions,
            };
          }
          return { ...prev, isLoading: false };
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to accept friend request';
        setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        throw error;
      }
    },
    [enableMultiplayer, isOnline],
  );

  /**
   * Get all friends
   */
  const getFriends = useCallback(async (): Promise<Friend[]> => {
    if (!enableMultiplayer) {
      return [];
    }

    try {
      const client = await createRealtimeClient();
      if (!client) {
        return [];
      }

      const { data: auth } = await client.auth.getUser();
      if (!auth?.user) {
        return [];
      }

      currentUserIdRef.current = auth.user.id;

      const { data, error } = await client
        .from('friendships')
        .select(
          `
          *,
          friend:friend_id(
            id,
            username,
            display_name,
            avatar_url,
            elo,
            is_online,
            last_seen_at
          )
        `,
        )
        .eq('user_id', auth.user.id)
        .eq('status', 'accepted');

      if (error) throw error;

      const friends: Friend[] = (data || []).map((f: any) => ({
        id: f.friend.id as UserId,
        username: f.friend.username,
        displayName: f.friend.display_name,
        avatarUrl: f.friend.avatar_url,
        ranking: f.friend.elo,
        isOnline: f.friend.is_online,
        lastSeenAt: f.friend.last_seen_at,
        friendshipId: f.id as FriendRequestId,
      }));

      setState(prev => ({ ...prev, friends }));
      return friends;
    } catch (error) {
      console.error('[useUnifiedFriends] Failed to get friends:', error);
      return [];
    }
  }, [enableMultiplayer]);

  /**
   * Get online friends
   */
  const getOnlineFriends = useCallback(async (): Promise<Friend[]> => {
    if (!enableMultiplayer) {
      return [];
    }

    try {
      const client = await createRealtimeClient();
      if (!client) {
        return [];
      }

      const { data: auth } = await client.auth.getUser();
      if (!auth?.user) {
        return [];
      }

      // Try RPC first; if missing, fall back to direct query
      let onlineFriends: Friend[] = [];
      const rpc = await (client as any).rpc('get_online_friends', {
        p_user_id: auth.user.id,
      });

      if (!rpc.error && rpc.data) {
        onlineFriends = (rpc.data || []).map((f: any) => ({
          id: f.friend_id as UserId,
          username: f.username,
          displayName: f.display_name,
          avatarUrl: f.avatar_url,
          ranking: f.elo,
          isOnline: true,
          lastSeenAt: new Date().toISOString(),
          friendshipId: '' as FriendRequestId,
        }));
      } else {
        // Fallback: accepted friendships where friend user is online
        const { data, error } = await client
          .from('friendships')
          .select(
            `
            *,
            friend:friend_id(
              id,
              username,
              display_name,
              avatar_url,
              elo,
              is_online,
              last_seen_at
            )
          `,
          )
          .eq('user_id', auth.user.id)
          .eq('status', 'accepted');

        if (error) throw error;

        onlineFriends = (data || [])
          .filter((f: any) => f.friend?.is_online)
          .map((f: any) => ({
            id: f.friend.id as UserId,
            username: f.friend.username,
            displayName: f.friend.display_name,
            avatarUrl: f.friend.avatar_url,
            ranking: f.friend.elo,
            isOnline: true,
            lastSeenAt: f.friend.last_seen_at,
            friendshipId: f.id as FriendRequestId,
          }));
      }

      setState(prev => ({ ...prev, onlineFriends }));
      return onlineFriends;
    } catch (error) {
      console.error('[useUnifiedFriends] Failed to get online friends:', error);
      return [];
    }
  }, [enableMultiplayer]);

  /**
   * Search users
   */
  const searchUsers = useCallback(
    async (query: string): Promise<Profile[]> => {
      if (!enableMultiplayer) {
        return [];
      }

      try {
        const client = await createRealtimeClient();
        if (!client) {
          return [];
        }

        const { data, error } = await client
          .from('users')
          .select('*')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(20);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('[useUnifiedFriends] Failed to search users:', error);
        return [];
      }
    },
    [enableMultiplayer],
  );

  /**
   * Block a user
   */
  const blockUser = useCallback(
    async (userId: string): Promise<void> => {
      if (!enableMultiplayer) {
        throw new Error('Multiplayer is disabled');
      }

      if (!currentUserIdRef.current) {
        throw new Error('User not authenticated');
      }

      try {
        const { queued } = await connectionService.queueAction(
          'BLOCK_USER',
          {
            blockerId: currentUserIdRef.current,
            blockedId: userId,
          },
          undefined,
          isOnline,
        );

        // Optimistically update state
        setState(prev => ({
          ...prev,
          friends: prev.friends.filter(f => f.id !== userId),
          queuedActions: queued ? prev.queuedActions + 1 : prev.queuedActions,
        }));
      } catch (error) {
        console.error('[useUnifiedFriends] Failed to block user:', error);
        throw error;
      }
    },
    [enableMultiplayer, isOnline],
  );

  /**
   * Unblock a user
   */
  const unblockUser = useCallback(
    async (userId: string): Promise<void> => {
      if (!enableMultiplayer) {
        throw new Error('Multiplayer is disabled');
      }

      if (!currentUserIdRef.current) {
        throw new Error('User not authenticated');
      }

      try {
        const { queued } = await connectionService.queueAction(
          'UNBLOCK_USER',
          {
            unblockerId: currentUserIdRef.current,
            unblockedId: userId,
          },
          undefined,
          isOnline,
        );

        // Optimistically update state
        setState(prev => ({
          ...prev,
          blockedUsers: prev.blockedUsers.filter(u => u.id !== userId),
          queuedActions: queued ? prev.queuedActions + 1 : prev.queuedActions,
        }));
      } catch (error) {
        console.error('[useUnifiedFriends] Failed to unblock user:', error);
        throw error;
      }
    },
    [enableMultiplayer, isOnline],
  );

  /**
   * Remove a friend
   */
  const removeFriend = useCallback(
    async (friendId: string): Promise<void> => {
      if (!enableMultiplayer) {
        throw new Error('Multiplayer is disabled');
      }

      if (!currentUserIdRef.current) {
        throw new Error('User not authenticated');
      }

      try {
        const { queued } = await connectionService.queueAction(
          'REMOVE_FRIEND',
          {
            userId: currentUserIdRef.current,
            friendId,
          },
          undefined,
          isOnline,
        );

        // Optimistically update state
        setState(prev => ({
          ...prev,
          friends: prev.friends.filter(f => f.id !== friendId),
          onlineFriends: prev.onlineFriends.filter(f => f.id !== friendId),
          queuedActions: queued ? prev.queuedActions + 1 : prev.queuedActions,
        }));
      } catch (error) {
        console.error('[useUnifiedFriends] Failed to remove friend:', error);
        throw error;
      }
    },
    [enableMultiplayer, isOnline],
  );

  /**
   * Subscribe to friend updates
   */
  const subscribeToFriendUpdates = useCallback((): (() => void) => {
    if (!enableMultiplayer || !currentUserIdRef.current) {
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

        // Create new channel for friend updates
        const channel = client
          .channel('friends')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'friendships',
              filter: `or(user_id.eq.${currentUserIdRef.current},friend_id.eq.${currentUserIdRef.current})`,
            },
            payload => {
              // Refresh friends list when changes occur
              getFriends();
            },
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
            },
            payload => {
              if (payload.new) {
                // Update online status for friends
                setState(prev => {
                  const updatedFriends = prev.friends.map(f =>
                    f.id === (payload.new as any).id
                      ? {
                          ...f,
                          isOnline: (payload.new as any).is_online,
                          lastSeenAt: (payload.new as any).last_seen_at,
                        }
                      : f,
                  );

                  const onlineFriends = updatedFriends.filter(f => f.isOnline);

                  return {
                    ...prev,
                    friends: updatedFriends,
                    onlineFriends,
                  };
                });
              }
            },
          )
          .subscribe();

        channelRef.current = channel;
      } catch (error) {
        console.error('[useUnifiedFriends] Failed to subscribe to friend updates:', error);
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
  }, [enableMultiplayer, getFriends]);

  // Initialize user ID on mount
  useEffect(() => {
    if (enableMultiplayer) {
      createRealtimeClient().then(client => {
        if (client) {
          client.auth.getUser().then(({ data }) => {
            if (data?.user) {
              currentUserIdRef.current = data.user.id;
              // Load initial data
              getFriends();
            }
          });
        }
      });
    }
  }, [enableMultiplayer, getFriends]);

  // Return offline-safe defaults when multiplayer is disabled
  if (!enableMultiplayer) {
    return {
      friends: [],
      onlineFriends: [],
      friendRequests: [],
      blockedUsers: [],
      isLoading: false,
      error: 'Multiplayer is disabled',
      queuedActions: 0,
      sendFriendRequest: async () => {
        throw new Error('Multiplayer is disabled');
      },
      acceptFriendRequest: async () => {
        throw new Error('Multiplayer is disabled');
      },
      getFriends: async () => [],
      getOnlineFriends: async () => [],
      searchUsers: async () => [],
      blockUser: async () => {
        throw new Error('Multiplayer is disabled');
      },
      unblockUser: async () => {
        throw new Error('Multiplayer is disabled');
      },
      removeFriend: async () => {
        throw new Error('Multiplayer is disabled');
      },
      subscribeToFriendUpdates: () => () => {},
    };
  }

  return {
    ...state,
    sendFriendRequest,
    acceptFriendRequest,
    getFriends,
    getOnlineFriends,
    searchUsers,
    blockUser,
    unblockUser,
    removeFriend,
    subscribeToFriendUpdates,
  };
}
