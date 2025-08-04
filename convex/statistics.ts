import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Update player statistics after a game
export const updatePlayerStats = mutation({
  args: {
    userId: v.id('users'),
    won: v.boolean(),
    eloChange: v.number(),
    gameMode: v.union(
      v.literal('ranked'),
      v.literal('casual'),
      v.literal('friends')
    ),
    gameDuration: v.number(), // in seconds
    pointsScored: v.number(),
    pointsConceded: v.number(),
    cantes: v.number(),
    victories20: v.number(),
    victories40: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update basic stats
    const updates = {
      gamesPlayed: user.gamesPlayed + 1,
      gamesWon: user.gamesWon + (args.won ? 1 : 0),
      elo: Math.max(0, user.elo + args.eloChange),
    };

    await ctx.db.patch(args.userId, updates);

    // Store detailed game stats
    await ctx.db.insert('gameStats', {
      userId: args.userId,
      gameMode: args.gameMode,
      won: args.won,
      eloChange: args.eloChange,
      gameDuration: args.gameDuration,
      pointsScored: args.pointsScored,
      pointsConceded: args.pointsConceded,
      cantes: args.cantes,
      victories20: args.victories20,
      victories40: args.victories40,
      timestamp: Date.now(),
    });

    return { 
      newElo: updates.elo,
      totalGames: updates.gamesPlayed,
      totalWins: updates.gamesWon,
    };
  },
});

// Get player statistics
export const getPlayerStats = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get recent games
    const recentGames = await ctx.db
      .query('gameStats')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .order('desc')
      .take(20);

    // Calculate aggregated stats
    const stats = {
      basic: {
        username: user.username,
        elo: user.elo,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        winRate: user.gamesPlayed > 0 
          ? (user.gamesWon / user.gamesPlayed * 100).toFixed(1)
          : '0.0',
      },
      detailed: {
        totalCantes: 0,
        totalVictories20: 0,
        totalVictories40: 0,
        averagePointsPerGame: 0,
        bestWinStreak: 0,
        currentWinStreak: 0,
      },
      recentForm: [] as ('W' | 'L')[],
    };

    // Process recent games
    let currentStreak = 0;
    let totalPoints = 0;
    
    for (const game of recentGames) {
      stats.detailed.totalCantes += game.cantes;
      stats.detailed.totalVictories20 += game.victories20;
      stats.detailed.totalVictories40 += game.victories40;
      totalPoints += game.pointsScored;
      
      // Track recent form (last 10 games)
      if (stats.recentForm.length < 10) {
        stats.recentForm.push(game.won ? 'W' : 'L');
      }
      
      // Track win streaks
      if (game.won) {
        currentStreak++;
        stats.detailed.bestWinStreak = Math.max(
          stats.detailed.bestWinStreak,
          currentStreak
        );
      } else {
        currentStreak = 0;
      }
    }
    
    stats.detailed.currentWinStreak = currentStreak;
    stats.detailed.averagePointsPerGame = 
      recentGames.length > 0 
        ? Math.round(totalPoints / recentGames.length)
        : 0;

    return stats;
  },
});

// Get leaderboard
export const getLeaderboard = query({
  args: {
    gameMode: v.optional(v.union(
      v.literal('ranked'),
      v.literal('casual'),
      v.literal('friends'),
      v.literal('all')
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    // Get top players by ELO
    const topPlayers = await ctx.db
      .query('users')
      .withIndex('by_elo')
      .order('desc')
      .take(limit);

    // If filtering by game mode, get their stats for that mode
    if (args.gameMode && args.gameMode !== 'all') {
      const playersWithModeStats = await Promise.all(
        topPlayers.map(async (player) => {
          const modeGames = await ctx.db
            .query('gameStats')
            .withIndex('by_user', q => q.eq('userId', player._id))
            .filter(q => q.eq(q.field('gameMode'), args.gameMode))
            .collect();
          
          const modeWins = modeGames.filter(g => g.won).length;
          const modeWinRate = modeGames.length > 0
            ? (modeWins / modeGames.length * 100).toFixed(1)
            : '0.0';
          
          return {
            ...player,
            modeGamesPlayed: modeGames.length,
            modeGamesWon: modeWins,
            modeWinRate,
          };
        })
      );
      
      return playersWithModeStats;
    }

    // Return all-time stats
    return topPlayers.map((player, index) => ({
      rank: index + 1,
      userId: player._id,
      username: player.username,
      avatar: player.avatar,
      elo: player.elo,
      gamesPlayed: player.gamesPlayed,
      gamesWon: player.gamesWon,
      winRate: player.gamesPlayed > 0
        ? (player.gamesWon / player.gamesPlayed * 100).toFixed(1)
        : '0.0',
      isOnline: player.isOnline,
    }));
  },
});

// Get head-to-head statistics
export const getHeadToHeadStats = query({
  args: {
    userId1: v.id('users'),
    userId2: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get room players where both users played
    const roomsWithBoth = await ctx.db
      .query('roomPlayers')
      .withIndex('by_user', q => q.eq('userId', args.userId1))
      .collect();
    
    const h2hGames = [];
    
    for (const room of roomsWithBoth) {
      // Check if user2 was also in this room
      const user2InRoom = await ctx.db
        .query('roomPlayers')
        .withIndex('by_room_and_user', q => 
          q.eq('roomId', room.roomId).eq('userId', args.userId2)
        )
        .first();
      
      if (user2InRoom) {
        // Get game result
        const gameState = await ctx.db
          .query('gameStates')
          .withIndex('by_room', q => q.eq('roomId', room.roomId))
          .first();
        
        if (gameState && gameState.gameWinner !== undefined) {
          h2hGames.push({
            roomId: room.roomId,
            user1Team: room.team,
            user2Team: user2InRoom.team,
            winner: gameState.gameWinner,
            timestamp: room.joinedAt,
          });
        }
      }
    }
    
    // Calculate stats
    const user1Wins = h2hGames.filter(g => g.user1Team === g.winner).length;
    const user2Wins = h2hGames.filter(g => g.user2Team === g.winner).length;
    
    return {
      totalGames: h2hGames.length,
      user1Wins,
      user2Wins,
      draws: h2hGames.length - user1Wins - user2Wins,
      recentGames: h2hGames.slice(0, 5),
    };
  },
});