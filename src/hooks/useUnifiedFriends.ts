export function useUnifiedFriends(_userId?: string) {
  return {
    onlineFriends: [],
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    isLoading: false,
    error: null,
    sendFriendRequest: async () => {},
    acceptFriendRequest: async () => {},
    removeFriend: async () => {},
  };
}
