import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export function useConvexFriends(userId: Id<'users'> | undefined) {
  // Queries
  const friends = useQuery(
    api.friends.getFriends,
    userId ? { userId } : 'skip',
  );
  const onlineFriends = useQuery(
    api.friends.getOnlineFriends,
    userId ? { userId } : 'skip',
  );
  const pendingRequests = useQuery(
    api.friends.getPendingFriendRequests,
    userId ? { userId } : 'skip',
  );
  const sentRequests = useQuery(
    api.friends.getSentFriendRequests,
    userId ? { userId } : 'skip',
  );

  // Mutations
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptFriendRequest = useMutation(api.friends.acceptFriendRequest);
  const declineFriendRequest = useMutation(api.friends.declineFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);
  const blockUser = useMutation(api.friends.blockUser);

  return {
    // Data
    friends: friends || [],
    onlineFriends: onlineFriends || [],
    pendingRequests: pendingRequests || [],
    sentRequests: sentRequests || [],
    isLoading: friends === undefined || onlineFriends === undefined,

    // Actions
    sendRequest: async (toUserId: Id<'users'>) => {
      if (!userId) throw new Error('User not authenticated');
      await sendFriendRequest({ fromUserId: userId, toUserId });
    },

    acceptRequest: async (friendId: Id<'users'>) => {
      if (!userId) throw new Error('User not authenticated');
      await acceptFriendRequest({ userId, friendId });
    },

    declineRequest: async (friendId: Id<'users'>) => {
      if (!userId) throw new Error('User not authenticated');
      await declineFriendRequest({ userId, friendId });
    },

    removeFriend: async (friendId: Id<'users'>) => {
      if (!userId) throw new Error('User not authenticated');
      await removeFriend({ userId, friendId });
    },

    blockUser: async (blockedUserId: Id<'users'>) => {
      if (!userId) throw new Error('User not authenticated');
      await blockUser({ userId, blockedUserId });
    },
  };
}

// Hook to search for users
export function useConvexUserSearch(
  searchQuery: string,
  currentUserId: Id<'users'> | undefined,
) {
  const results = useQuery(
    api.friends.searchUsers,
    currentUserId && searchQuery.length >= 2
      ? { searchQuery, currentUserId }
      : 'skip',
  );

  return {
    searchResults: results || [],
    isSearching: results === undefined && searchQuery.length >= 2,
  };
}
