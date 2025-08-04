import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Update player presence
export const updatePresence = mutation({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('users'),
    status: v.union(
      v.literal('connected'),
      v.literal('disconnected'),
      v.literal('reconnecting'),
    ),
  },
  handler: async (ctx, args) => {
    // Find player in room
    const player = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();

    if (!player) return;

    // Update connection status
    await ctx.db.patch(player._id, {
      connectionStatus: args.status,
    });

    // Update user online status
    await ctx.db.patch(args.userId, {
      isOnline: args.status === 'connected',
      lastSeenAt: Date.now(),
    });

    // Check if need to pause game
    if (args.status === 'disconnected') {
      const room = await ctx.db.get(args.roomId);
      if (room && room.status === 'playing') {
        // Could pause game or start AI takeover timer
        await ctx.scheduler.runAfter(
          30000,
          internal.presence.checkDisconnectedPlayer,
          {
            roomId: args.roomId,
            userId: args.userId,
          },
        );
      }
    }
  },
});

// Send heartbeat
export const heartbeat = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastSeenAt: Date.now(),
    });
  },
});

// Get room presence
export const getRoomPresence = query({
  args: {
    roomId: v.id('rooms'),
  },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .collect();

    const presence = await Promise.all(
      players.map(async player => {
        if (player.isAI) {
          return {
            position: player.position,
            isAI: true,
            status: 'connected' as const,
          };
        }

        const user = player.userId ? await ctx.db.get(player.userId) : null;
        const lastSeen = user?.lastSeenAt || 0;
        const isStale = Date.now() - lastSeen > 30000; // 30 seconds

        return {
          position: player.position,
          userId: player.userId,
          username: user?.username,
          status: isStale ? 'disconnected' : player.connectionStatus,
          lastSeenAt: lastSeen,
        };
      }),
    );

    return presence;
  },
});

// Internal: Check disconnected player
import { internalMutation } from './_generated/server';
import { internal } from './_generated/api';

export const checkDisconnectedPlayer = internalMutation({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();

    if (!player || player.connectionStatus === 'connected') {
      return; // Player reconnected
    }

    // Replace with AI if still disconnected
    const room = await ctx.db.get(args.roomId);
    if (room && room.status === 'playing') {
      // Convert to AI player
      await ctx.db.patch(player._id, {
        isAI: true,
        aiDifficulty: 'medium',
        aiPersonality: 'balanced',
        connectionStatus: 'connected',
      });

      // Schedule AI turn if it's their turn
      const gameState = await ctx.db
        .query('gameStates')
        .withIndex('by_room', q => q.eq('roomId', args.roomId))
        .first();

      if (gameState && gameState.currentPlayer === player.position) {
        await ctx.scheduler.runAfter(2000, internal.ai.processAITurn, {
          roomId: args.roomId,
          playerId: player._id,
          position: player.position,
        });
      }
    }
  },
});
