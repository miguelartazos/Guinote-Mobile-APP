import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Send a friend request
export const sendFriendRequest = mutation({
  args: {
    fromUserId: v.id('users'),
    toUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { fromUserId, toUserId } = args;

    // Check if users are the same
    if (fromUserId === toUserId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if friendship already exists
    const existingFriendship = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', fromUserId))
      .filter(q => q.eq(q.field('friendId'), toUserId))
      .first();

    const reverseFriendship = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', toUserId))
      .filter(q => q.eq(q.field('friendId'), fromUserId))
      .first();

    if (existingFriendship || reverseFriendship) {
      throw new Error('Friend request already exists');
    }

    // Create friend request
    const friendshipId = await ctx.db.insert('friendships', {
      userId: fromUserId,
      friendId: toUserId,
      status: 'pending',
      createdAt: Date.now(),
    });

    return friendshipId;
  },
});

// Accept a friend request
export const acceptFriendRequest = mutation({
  args: {
    userId: v.id('users'),
    friendId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId, friendId } = args;

    // Find the pending request
    const friendship = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', friendId))
      .filter(q =>
        q.and(
          q.eq(q.field('friendId'), userId),
          q.eq(q.field('status'), 'pending'),
        ),
      )
      .first();

    if (!friendship) {
      throw new Error('Friend request not found');
    }

    // Update the request to accepted
    await ctx.db.patch(friendship._id, {
      status: 'accepted',
      acceptedAt: Date.now(),
    });

    // Create the reverse friendship for easier querying
    await ctx.db.insert('friendships', {
      userId: userId,
      friendId: friendId,
      status: 'accepted',
      createdAt: Date.now(),
      acceptedAt: Date.now(),
    });

    return { success: true };
  },
});

// Decline a friend request
export const declineFriendRequest = mutation({
  args: {
    userId: v.id('users'),
    friendId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId, friendId } = args;

    // Find the pending request
    const friendship = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', friendId))
      .filter(q =>
        q.and(
          q.eq(q.field('friendId'), userId),
          q.eq(q.field('status'), 'pending'),
        ),
      )
      .first();

    if (!friendship) {
      throw new Error('Friend request not found');
    }

    // Delete the request
    await ctx.db.delete(friendship._id);

    return { success: true };
  },
});

// Remove a friend
export const removeFriend = mutation({
  args: {
    userId: v.id('users'),
    friendId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId, friendId } = args;

    // Delete both directions of the friendship
    const friendship1 = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('friendId'), friendId))
      .first();

    const friendship2 = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', friendId))
      .filter(q => q.eq(q.field('friendId'), userId))
      .first();

    if (friendship1) {
      await ctx.db.delete(friendship1._id);
    }
    if (friendship2) {
      await ctx.db.delete(friendship2._id);
    }

    return { success: true };
  },
});

// Block a user
export const blockUser = mutation({
  args: {
    userId: v.id('users'),
    blockedUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId, blockedUserId } = args;

    // Check if friendship exists and update it, otherwise create new blocked entry
    const existingFriendship = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('friendId'), blockedUserId))
      .first();

    if (existingFriendship) {
      await ctx.db.patch(existingFriendship._id, {
        status: 'blocked',
      });
    } else {
      await ctx.db.insert('friendships', {
        userId: userId,
        friendId: blockedUserId,
        status: 'blocked',
        createdAt: Date.now(),
      });
    }

    // Remove any reverse friendship
    const reverseFriendship = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', blockedUserId))
      .filter(q => q.eq(q.field('friendId'), userId))
      .first();

    if (reverseFriendship) {
      await ctx.db.delete(reverseFriendship._id);
    }

    return { success: true };
  },
});

// Get user's friends list
export const getFriends = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Get all accepted friendships
    const friendships = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('status'), 'accepted'))
      .collect();

    // Get friend details
    const friends = await Promise.all(
      friendships.map(async friendship => {
        const friend = await ctx.db.get(friendship.friendId);
        return friend
          ? {
              id: friendship.friendId,
              username: friend.username,
              displayName: friend.displayName,
              avatar: friend.avatar,
              elo: friend.elo,
              isOnline: friend.isOnline,
              lastSeenAt: friend.lastSeenAt,
              friendshipId: friendship._id,
              friendSince: friendship.acceptedAt || friendship.createdAt,
            }
          : null;
      }),
    );

    return friends.filter(Boolean);
  },
});

// Get pending friend requests
export const getPendingFriendRequests = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Get all pending requests where user is the recipient
    const pendingRequests = await ctx.db
      .query('friendships')
      .withIndex('by_friend', q => q.eq('friendId', userId))
      .filter(q => q.eq(q.field('status'), 'pending'))
      .collect();

    // Get requester details
    const requests = await Promise.all(
      pendingRequests.map(async request => {
        const requester = await ctx.db.get(request.userId);
        return requester
          ? {
              id: request.userId,
              username: requester.username,
              displayName: requester.displayName,
              avatar: requester.avatar,
              elo: requester.elo,
              requestId: request._id,
              requestedAt: request.createdAt,
            }
          : null;
      }),
    );

    return requests.filter(Boolean);
  },
});

// Get sent friend requests
export const getSentFriendRequests = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Get all pending requests sent by user
    const sentRequests = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('status'), 'pending'))
      .collect();

    // Get recipient details
    const requests = await Promise.all(
      sentRequests.map(async request => {
        const recipient = await ctx.db.get(request.friendId);
        return recipient
          ? {
              id: request.friendId,
              username: recipient.username,
              displayName: recipient.displayName,
              avatar: recipient.avatar,
              elo: recipient.elo,
              requestId: request._id,
              requestedAt: request.createdAt,
            }
          : null;
      }),
    );

    return requests.filter(Boolean);
  },
});

// Get blocked users
export const getBlockedUsers = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Get all blocked relationships
    const blockedRelationships = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('status'), 'blocked'))
      .collect();

    // Get blocked user details
    const blockedUsers = await Promise.all(
      blockedRelationships.map(async relationship => {
        const user = await ctx.db.get(relationship.friendId);
        return user
          ? {
              id: relationship.friendId,
              username: user.username,
              displayName: user.displayName,
              avatar: user.avatar,
              blockedAt: relationship.createdAt,
            }
          : null;
      }),
    );

    return blockedUsers.filter(Boolean);
  },
});

// Check if two users are friends
export const areFriends = query({
  args: {
    userId: v.id('users'),
    friendId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { userId, friendId } = args;

    const friendship = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q =>
        q.and(
          q.eq(q.field('friendId'), friendId),
          q.eq(q.field('status'), 'accepted'),
        ),
      )
      .first();

    return !!friendship;
  },
});

// Get online friends
export const getOnlineFriends = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get all accepted friendships
    const friendships = await ctx.db
      .query('friendships')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .filter(q => q.eq(q.field('status'), 'accepted'))
      .collect();

    // Get friend details
    const friends = await Promise.all(
      friendships.map(async friendship => {
        const friend = await ctx.db.get(friendship.friendId);
        return friend
          ? {
              id: friendship.friendId,
              username: friend.username,
              displayName: friend.displayName,
              avatar: friend.avatar,
              elo: friend.elo,
              isOnline: friend.isOnline,
              lastSeenAt: friend.lastSeenAt,
              friendshipId: friendship._id,
              friendSince: friendship.acceptedAt || friendship.createdAt,
            }
          : null;
      }),
    );

    const validFriends = friends.filter(Boolean) as NonNullable<typeof friends[0]>[];
    return validFriends.filter(friend => friend.isOnline);
  },
});

// Search for users (for adding friends)
export const searchUsers = query({
  args: {
    searchQuery: v.string(),
    currentUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { searchQuery, currentUserId } = args;

    if (searchQuery.length < 2) {
      return [];
    }

    // Search by username (case insensitive)
    const users = await ctx.db
      .query('users')
      .withIndex('by_username')
      .collect();

    const matchingUsers = users
      .filter(
        user =>
          user._id !== currentUserId &&
          user.username.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .slice(0, 20); // Limit results

    // Check friendship status for each user
    const usersWithFriendshipStatus = await Promise.all(
      matchingUsers.map(async user => {
        const friendship = await ctx.db
          .query('friendships')
          .withIndex('by_user', q => q.eq('userId', currentUserId))
          .filter(q => q.eq(q.field('friendId'), user._id))
          .first();

        const reverseFriendship = await ctx.db
          .query('friendships')
          .withIndex('by_user', q => q.eq('userId', user._id))
          .filter(q => q.eq(q.field('friendId'), currentUserId))
          .first();

        let friendshipStatus: 'none' | 'pending' | 'accepted' | 'blocked' =
          'none';
        if (friendship) {
          friendshipStatus = friendship.status;
        } else if (
          reverseFriendship &&
          reverseFriendship.status === 'pending'
        ) {
          friendshipStatus = 'pending';
        }

        return {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          elo: user.elo,
          isOnline: user.isOnline,
          friendshipStatus,
        };
      }),
    );

    return usersWithFriendshipStatus;
  },
});
