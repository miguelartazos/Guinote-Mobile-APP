import { mutation, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';

// Join matchmaking queue
export const joinQueue = mutation({
  args: {
    userId: v.id('users'),
    gameMode: v.union(v.literal('ranked'), v.literal('casual')),
  },
  handler: async (ctx, args) => {
    // Get user for ELO
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Remove from queue if already there
    const existing = await ctx.db
      .query('matchmakingQueue')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Add to queue with ELO range
    const eloRange = 100; // Initial range
    await ctx.db.insert('matchmakingQueue', {
      userId: args.userId,
      gameMode: args.gameMode,
      eloMin: user.elo - eloRange,
      eloMax: user.elo + eloRange,
      region: 'global',
      joinedAt: Date.now(),
    });

    // Schedule matchmaking check
    await ctx.scheduler.runAfter(1000, internal.matchmaking.checkForMatches, {
      userId: args.userId,
    });
  },
});

// Leave matchmaking queue
export const leaveQueue = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query('matchmakingQueue')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .first();

    if (entry) {
      await ctx.db.delete(entry._id);
    }
  },
});

// Get queue status
export const getQueueStatus = query({
  args: {
    gameMode: v.union(v.literal('ranked'), v.literal('casual')),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query('matchmakingQueue')
      .withIndex('by_mode_and_elo', q => q.eq('gameMode', args.gameMode))
      .collect();

    return {
      playersInQueue: entries.length,
      averageElo:
        entries.length > 0
          ? Math.round(
              entries.reduce((sum, e) => sum + (e.eloMin + e.eloMax) / 2, 0) /
                entries.length,
            )
          : 1000,
    };
  },
});

// Internal: Check for matches
export const checkForMatches = internalMutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get the requesting player's queue entry
    const playerEntry = await ctx.db
      .query('matchmakingQueue')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .first();

    if (!playerEntry) return; // Player left queue

    // Find compatible players
    const compatiblePlayers = await ctx.db
      .query('matchmakingQueue')
      .withIndex('by_mode_and_elo', q => q.eq('gameMode', playerEntry.gameMode))
      .filter(q =>
        q.and(
          q.neq(q.field('userId'), args.userId),
          q.lte(q.field('eloMin'), playerEntry.eloMax),
          q.gte(q.field('eloMax'), playerEntry.eloMin),
        ),
      )
      .take(3); // Need 3 more players

    if (compatiblePlayers.length >= 3) {
      // Create match!
      const players = [playerEntry, ...compatiblePlayers.slice(0, 3)];

      // Sort by ELO for fair teams
      players.sort((a, b) => a.eloMin + a.eloMax - (b.eloMin + b.eloMax));

      // Create room
      const roomId = await ctx.db.insert('rooms', {
        code: generateRoomCode(),
        hostId: players[0].userId,
        status: 'waiting',
        gameMode: playerEntry.gameMode,
        isPublic: false,
        maxPlayers: 4,
        currentPlayers: 4,
        createdAt: Date.now(),
      });

      // Add players to room (alternating teams for balance)
      const positions = [0, 2, 1, 3]; // Team 0: pos 0,2; Team 1: pos 1,3
      for (let i = 0; i < 4; i++) {
        await ctx.db.insert('roomPlayers', {
          roomId,
          userId: players[i].userId,
          position: positions[i],
          team: positions[i] % 2 === 0 ? 0 : 1,
          isReady: true, // Auto-ready for matchmaking
          isAI: false,
          connectionStatus: 'connected',
          joinedAt: Date.now(),
        });

        // Remove from queue
        await ctx.db.delete(players[i]._id);
      }

      // Start game immediately
      await ctx.db.patch(roomId, {
        status: 'playing',
        startedAt: Date.now(),
      });

      // Initialize game
      await ctx.scheduler.runAfter(
        0,
        internal.gameActions.initializeGameMutation,
        {
          roomId,
        },
      );
    } else {
      // Not enough players yet, expand search range
      const timeSinceJoined = Date.now() - playerEntry.joinedAt;
      const expandedRange = Math.min(
        500,
        100 + Math.floor(timeSinceJoined / 5000) * 50,
      );

      await ctx.db.patch(playerEntry._id, {
        eloMin: playerEntry.eloMin - expandedRange + 100,
        eloMax: playerEntry.eloMax + expandedRange - 100,
      });

      // Check again in a few seconds
      if (timeSinceJoined < 60000) {
        // Give up after 1 minute
        await ctx.scheduler.runAfter(
          3000,
          internal.matchmaking.checkForMatches,
          {
            userId: args.userId,
          },
        );
      }
    }
  },
});

// Helper function to generate room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
