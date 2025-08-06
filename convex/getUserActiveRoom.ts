import { query } from './_generated/server';
import { v } from 'convex/values';

// Get user's active room (for matchmaking)
export const getUserActiveRoom = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    // Find any room where user is a player
    const playerEntry = await ctx.db
      .query('roomPlayers')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .filter(q => q.neq(q.field('isAI'), true))
      .first();

    if (!playerEntry) return null;

    const room = await ctx.db.get(playerEntry.roomId);
    if (!room || room.status === 'finished') return null;

    return {
      roomId: room._id,
      code: room.code,
      status: room.status,
    };
  },
});
