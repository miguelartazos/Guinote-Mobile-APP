import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Sync user from Clerk to Convex
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', args.clerkId))
      .first();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        username: args.username,
        displayName: args.displayName,
        avatar: args.avatar || '🎮',
        isOnline: true,
        lastSeenAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert('users', {
        clerkId: args.clerkId,
        username: args.username,
        displayName: args.displayName,
        avatar: args.avatar || '🎮',
        elo: 1000,
        gamesPlayed: 0,
        gamesWon: 0,
        isOnline: true,
        lastSeenAt: Date.now(),
      });
      return userId;
    }
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', args.clerkId))
      .first();
  },
});

// Update user online status
export const updateOnlineStatus = mutation({
  args: {
    userId: v.id('users'),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isOnline: args.isOnline,
      lastSeenAt: Date.now(),
    });
  },
});

// Get user profile
export const getProfile = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Calculate additional stats
    const winRate =
      user.gamesPlayed > 0
        ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1)
        : '0.0';

    return {
      ...user,
      winRate,
    };
  },
});

// Get user by username
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_username', q => q.eq('username', args.username))
      .first();
  },
});

// Get top players by ELO
export const getTopPlayers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const players = await ctx.db
      .query('users')
      .withIndex('by_elo')
      .order('desc')
      .take(limit);

    return players.map((player, index) => ({
      ...player,
      rank: index + 1,
      winRate:
        player.gamesPlayed > 0
          ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(1)
          : '0.0',
    }));
  },
});

// Update user stats after game
export const updateUserStats = mutation({
  args: {
    userId: v.id('users'),
    won: v.boolean(),
    eloChange: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    await ctx.db.patch(args.userId, {
      gamesPlayed: user.gamesPlayed + 1,
      gamesWon: user.gamesWon + (args.won ? 1 : 0),
      elo: Math.max(0, user.elo + args.eloChange),
    });
  },
});
