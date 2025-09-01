/**
 * Tests for useUnifiedFriends hook
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUnifiedFriends } from '../useUnifiedFriends';
import { connectionService } from '../../services/connectionService';
import * as featureFlags from '../../config/featureFlags';
import * as realtimeClient from '../../services/realtimeClient.native';
import * as connectionStatus from '../useConnectionStatus';
import type { FriendRequestId, UserId } from '../useUnifiedFriends';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../config/featureFlags');
jest.mock('../../services/realtimeClient.native');
jest.mock('../useConnectionStatus');

describe('useUnifiedFriends', () => {
  let mockSupabaseClient: any;
  const mockUserId = 'user-123';
  const mockFriendId = 'friend-456';

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

    // Mock Supabase client with proper chaining
    const mockFromChain = {
      insert: jest.fn(() => Promise.resolve({ error: null })),
      select: jest.fn().mockImplementation((query?: string) => {
        if (query && query.includes('friend:friend_id')) {
          // For getFriends query with join
          return {
            eq: jest.fn().mockImplementation(() => ({
              eq: jest.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      id: 'friendship-123',
                      user_id: mockUserId,
                      friend_id: mockFriendId,
                      status: 'accepted',
                      friend: {
                        id: mockFriendId,
                        username: 'frienduser',
                        display_name: 'Friend User',
                        avatar_url: null,
                        ranking: 1200,
                        is_online: false,
                        last_seen_at: new Date().toISOString(),
                      },
                    },
                  ],
                  error: null,
                }),
              ),
            })),
          };
        }
        // Default select chain
        return {
          or: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }, // Not found
              }),
            ),
          })),
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
                  id: 'friendship-123',
                  user_id: mockUserId,
                  friend_id: mockFriendId,
                  status: 'pending',
                },
                error: null,
              }),
            ),
            eq: jest.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              }),
            ),
          })),
          limit: jest.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: 'user-789',
                  username: 'testuser',
                  display_name: 'Test User',
                  avatar_url: null,
                  ranking: 1000,
                  is_online: false,
                  last_seen_at: new Date().toISOString(),
                },
              ],
              error: null,
            }),
          ),
        };
      }),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      })),
    };

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(() =>
          Promise.resolve({
            data: {
              user: {
                id: mockUserId,
              },
            },
          }),
        ),
      },
      from: jest.fn(() => mockFromChain),
      rpc: jest.fn(() =>
        Promise.resolve({
          data: [
            {
              friend_id: mockFriendId,
              username: 'frienduser',
              display_name: 'Friend User',
              avatar_url: null,
              ranking: 1200,
              is_in_game: false,
            },
          ],
          error: null,
        }),
      ),
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      })),
      removeChannel: jest.fn(() => Promise.resolve()),
    };

    (realtimeClient.createRealtimeClient as jest.Mock).mockResolvedValue(mockSupabaseClient);

    // Clear connection service queue
    connectionService.clearQueue();
  });

  describe('when multiplayer is enabled', () => {
    beforeEach(() => {
      (featureFlags.useFeatureFlag as jest.Mock).mockReturnValue(true);
    });

    test('returns initial state', () => {
      const { result } = renderHook(() => useUnifiedFriends());

      expect(result.current.friends).toEqual([]);
      expect(result.current.onlineFriends).toEqual([]);
      expect(result.current.friendRequests).toEqual([]);
      expect(result.current.blockedUsers).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.queuedActions).toBe(0);
    });

    test('sends friend request when online', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      // Wait for initial user setup
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.sendFriendRequest(mockFriendId);
      });

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('friendships');
      });
    });

    test('queues friend request when offline', async () => {
      (connectionStatus.useConnectionStatus as jest.Mock).mockReturnValue({
        isOnline: false,
        status: 'disconnected',
        isConnected: false,
        isReconnecting: false,
      });

      const { result } = renderHook(() => useUnifiedFriends());

      // Wait for initial user setup
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.sendFriendRequest(mockFriendId);
      });

      await waitFor(() => {
        expect(result.current.queuedActions).toBeGreaterThan(0);
      });

      // Verify action was saved to AsyncStorage
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('accepts friend request', async () => {
      const requestId = 'request-123';
      const { result } = renderHook(() => useUnifiedFriends());

      // Set up initial friend request
      act(() => {
        result.current.friendRequests.push({
          id: requestId as FriendRequestId,
          senderId: mockFriendId as UserId,
          senderName: 'Friend User',
          senderAvatar: null,
          recipientId: mockUserId as UserId,
          createdAt: new Date().toISOString(),
          status: 'pending',
        });
      });

      await act(async () => {
        await result.current.acceptFriendRequest(requestId);
      });

      await waitFor(() => {
        expect(result.current.friendRequests).toHaveLength(0);
      });
    });

    test('searches users', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      let searchResults: any[] = [];
      await act(async () => {
        searchResults = await result.current.searchUsers('test');
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].username).toBe('testuser');
    });

    test('gets online friends', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      let onlineFriends: any[] = [];
      await act(async () => {
        onlineFriends = await result.current.getOnlineFriends();
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_online_friends', {
        p_user_id: mockUserId,
      });
      expect(onlineFriends).toHaveLength(1);
      expect(onlineFriends[0].username).toBe('frienduser');
    });

    test('blocks a user', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      // Wait for initial user setup
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      });

      // Add a friend first
      act(() => {
        result.current.friends.push({
          id: mockFriendId as UserId,
          username: 'frienduser',
          displayName: null,
          avatarUrl: null,
          ranking: 1000,
          isOnline: false,
          lastSeenAt: new Date().toISOString(),
          friendshipId: 'friendship-123' as FriendRequestId,
        });
      });

      await act(async () => {
        await result.current.blockUser(mockFriendId);
      });

      // Friend should be removed optimistically
      expect(result.current.friends).toHaveLength(0);
    });

    test('unblocks a user', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      // Wait for initial user setup
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      });

      // Add a blocked user first
      act(() => {
        result.current.blockedUsers.push({
          id: mockFriendId as UserId,
          username: 'blockeduser',
          displayName: null,
          avatarUrl: null,
          blockedAt: new Date().toISOString(),
          friendshipId: 'friendship-123' as FriendRequestId,
        });
      });

      await act(async () => {
        await result.current.unblockUser(mockFriendId);
      });

      // Blocked user should be removed optimistically
      expect(result.current.blockedUsers).toHaveLength(0);
    });

    test('removes a friend', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      // Wait for initial user setup
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      });

      // Add friends first
      act(() => {
        result.current.friends.push({
          id: mockFriendId as UserId,
          username: 'frienduser',
          displayName: null,
          avatarUrl: null,
          ranking: 1000,
          isOnline: true,
          lastSeenAt: new Date().toISOString(),
          friendshipId: 'friendship-123' as FriendRequestId,
        });
        result.current.onlineFriends.push({
          id: mockFriendId as UserId,
          username: 'frienduser',
          displayName: null,
          avatarUrl: null,
          ranking: 1000,
          isOnline: true,
          lastSeenAt: new Date().toISOString(),
          friendshipId: 'friendship-123' as FriendRequestId,
        });
      });

      await act(async () => {
        await result.current.removeFriend(mockFriendId);
      });

      // Friend should be removed from both lists optimistically
      expect(result.current.friends).toHaveLength(0);
      expect(result.current.onlineFriends).toHaveLength(0);
    });

    test('subscribes to friend updates', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      // Wait for initial user setup
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      });

      const unsubscribe = result.current.subscribeToFriendUpdates();

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('friends');
      expect(typeof unsubscribe).toBe('function');

      // Clean up
      unsubscribe();
    });

    test('processes queue when coming online', async () => {
      // Start offline
      (connectionStatus.useConnectionStatus as jest.Mock).mockReturnValue({
        isOnline: false,
        status: 'disconnected',
        isConnected: false,
        isReconnecting: false,
      });

      const { result, rerender } = renderHook(() => useUnifiedFriends());

      // Wait for initial user setup
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      });

      // Queue an action while offline
      await act(async () => {
        await result.current.sendFriendRequest(mockFriendId);
      });

      expect(result.current.queuedActions).toBeGreaterThan(0);

      // Come back online
      (connectionStatus.useConnectionStatus as jest.Mock).mockReturnValue({
        isOnline: true,
        status: 'connected',
        isConnected: true,
        isReconnecting: false,
      });

      rerender();

      await waitFor(() => {
        expect(connectionService.getQueuedCount()).toBe(0);
      });
    });
  });

  describe('when multiplayer is disabled', () => {
    beforeEach(() => {
      (featureFlags.useFeatureFlag as jest.Mock).mockReturnValue(false);
    });

    test('returns safe defaults', () => {
      const { result } = renderHook(() => useUnifiedFriends());

      expect(result.current.friends).toEqual([]);
      expect(result.current.onlineFriends).toEqual([]);
      expect(result.current.friendRequests).toEqual([]);
      expect(result.current.blockedUsers).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Multiplayer is disabled');
      expect(result.current.queuedActions).toBe(0);
    });

    test('throws error when trying to send friend request', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      await expect(result.current.sendFriendRequest(mockFriendId)).rejects.toThrow(
        'Multiplayer is disabled',
      );
    });

    test('throws error when trying to accept friend request', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      await expect(result.current.acceptFriendRequest('request-123')).rejects.toThrow(
        'Multiplayer is disabled',
      );
    });

    test('returns empty array for getFriends', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      const friends = await result.current.getFriends();
      expect(friends).toEqual([]);
    });

    test('returns empty array for getOnlineFriends', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      const onlineFriends = await result.current.getOnlineFriends();
      expect(onlineFriends).toEqual([]);
    });

    test('returns empty array for searchUsers', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      const users = await result.current.searchUsers('test');
      expect(users).toEqual([]);
    });

    test('throws error when trying to block user', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      await expect(result.current.blockUser(mockFriendId)).rejects.toThrow(
        'Multiplayer is disabled',
      );
    });

    test('throws error when trying to unblock user', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      await expect(result.current.unblockUser(mockFriendId)).rejects.toThrow(
        'Multiplayer is disabled',
      );
    });

    test('throws error when trying to remove friend', async () => {
      const { result } = renderHook(() => useUnifiedFriends());

      await expect(result.current.removeFriend(mockFriendId)).rejects.toThrow(
        'Multiplayer is disabled',
      );
    });

    test('subscribeToFriendUpdates returns noop function', () => {
      const { result } = renderHook(() => useUnifiedFriends());

      const unsubscribe = result.current.subscribeToFriendUpdates();
      expect(typeof unsubscribe).toBe('function');
      expect(mockSupabaseClient.channel).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      (featureFlags.useFeatureFlag as jest.Mock).mockReturnValue(true);
    });

    test('handles error when sending friend request fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ error: { message: 'Database error' } })),
        select: jest.fn(() => ({
          or: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: null,
                error: { code: 'PGRST116' },
              }),
            ),
          })),
        })),
      });

      const { result } = renderHook(() => useUnifiedFriends());

      // Wait for initial user setup
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      });

      await expect(result.current.sendFriendRequest(mockFriendId)).rejects.toThrow();
      expect(result.current.error).toContain('Failed to send friend request');
    });

    test('handles authentication error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useUnifiedFriends());

      const friends = await result.current.getFriends();
      expect(friends).toEqual([]);
    });

    test('handles existing friendship error', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          or: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
                  id: 'existing-friendship',
                  status: 'accepted',
                },
                error: null,
              }),
            ),
          })),
        })),
      });

      const { result } = renderHook(() => useUnifiedFriends());

      // Wait for initial user setup
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      });

      await expect(result.current.sendFriendRequest(mockFriendId)).rejects.toThrow(
        'Friendship already exists',
      );
    });
  });
});
