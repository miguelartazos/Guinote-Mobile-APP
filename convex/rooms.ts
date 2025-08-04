import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';

// Generate a unique 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Create a new room
export const createRoom = mutation({
  args: {
    hostId: v.id('users'),
    gameMode: v.union(
      v.literal('ranked'),
      v.literal('casual'),
      v.literal('friends'),
      v.literal('local'),
    ),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Generate unique room code
    let code: string;
    let attempts = 0;
    do {
      code = generateRoomCode();
      const existing = await ctx.db
        .query('rooms')
        .withIndex('by_code', q => q.eq('code', code))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error('Failed to generate unique room code');
    }

    // Create room
    const roomId = await ctx.db.insert('rooms', {
      code,
      hostId: args.hostId,
      status: 'waiting',
      gameMode: args.gameMode,
      isPublic: args.isPublic,
      maxPlayers: 4,
      currentPlayers: 1,
      createdAt: Date.now(),
    });

    // Add host as first player
    await ctx.db.insert('roomPlayers', {
      roomId,
      userId: args.hostId,
      position: 0,
      team: 0,
      isReady: false,
      isAI: false,
      connectionStatus: 'connected',
      joinedAt: Date.now(),
    });

    return { roomId, code };
  },
});

// Join a room by code
export const joinRoom = mutation({
  args: {
    code: v.string(),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Find room by code
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_code', q => q.eq('code', args.code))
      .first();

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    if (room.status !== 'waiting') {
      throw new Error('La partida ya ha comenzado');
    }

    if (room.currentPlayers >= room.maxPlayers) {
      throw new Error('La sala está llena');
    }

    // Check if player already in room
    const existingPlayer = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', room._id))
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();

    if (existingPlayer) {
      throw new Error('Ya estás en esta sala');
    }

    // Find next available position
    const players = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', room._id))
      .collect();

    const occupiedPositions = players.map(p => p.position);
    const position = [0, 1, 2, 3].find(p => !occupiedPositions.includes(p))!;
    const team = position % 2 === 0 ? 0 : 1;

    // Add player to room
    await ctx.db.insert('roomPlayers', {
      roomId: room._id,
      userId: args.userId,
      position,
      team: team as 0 | 1,
      isReady: false,
      isAI: false,
      connectionStatus: 'connected',
      joinedAt: Date.now(),
    });

    // Update room player count
    await ctx.db.patch(room._id, {
      currentPlayers: room.currentPlayers + 1,
    });

    return { roomId: room._id, position };
  },
});

// Leave a room
export const leaveRoom = mutation({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return;

    // Find player in room
    const player = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();

    if (!player) return;

    // Remove player
    await ctx.db.delete(player._id);

    // Update room player count
    await ctx.db.patch(args.roomId, {
      currentPlayers: Math.max(0, room.currentPlayers - 1),
    });

    // If room is empty or host left, abandon room
    if (room.currentPlayers <= 1 || room.hostId === args.userId) {
      await ctx.db.patch(args.roomId, {
        status: 'abandoned',
        finishedAt: Date.now(),
      });
    }
  },
});

// Get room details
export const getRoom = query({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    // Get players
    const players = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .collect();

    // Get user details for each player
    const playersWithDetails = await Promise.all(
      players.map(async player => {
        if (player.isAI) {
          return {
            ...player,
            user: {
              username: `AI ${player.aiDifficulty}`,
              avatar: '🤖',
              elo: 1000,
            },
          };
        } else if (player.userId) {
          const user = await ctx.db.get(player.userId);
          return {
            ...player,
            user: user
              ? {
                  username: user.username,
                  avatar: user.avatar,
                  elo: user.elo,
                }
              : null,
          };
        }
        return { ...player, user: null };
      }),
    );

    return {
      ...room,
      players: playersWithDetails.sort((a, b) => a.position - b.position),
    };
  },
});

// Toggle ready status
export const toggleReady = mutation({
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

    if (!player) {
      throw new Error('No estás en esta sala');
    }

    await ctx.db.patch(player._id, {
      isReady: !player.isReady,
    });

    // Check if all players are ready
    const allPlayers = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .collect();

    const room = await ctx.db.get(args.roomId);
    if (room && room.currentPlayers === 4 && allPlayers.every(p => p.isReady)) {
      // Start game
      await ctx.db.patch(args.roomId, {
        status: 'playing',
        startedAt: Date.now(),
      });

      // Initialize game state
      await ctx.scheduler.runAfter(
        0,
        internal.gameActions.initializeGameMutation,
        {
          roomId: args.roomId,
        },
      );
    }
  },
});

// Add AI player to room
export const addAIPlayer = mutation({
  args: {
    roomId: v.id('rooms'),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
    personality: v.optional(
      v.union(
        v.literal('aggressive'),
        v.literal('defensive'),
        v.literal('balanced'),
        v.literal('unpredictable'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error('Sala no encontrada');
    }

    if (room.currentPlayers >= room.maxPlayers) {
      throw new Error('La sala está llena');
    }

    // Find next available position
    const players = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .collect();

    const occupiedPositions = players.map(p => p.position);
    const position = [0, 1, 2, 3].find(p => !occupiedPositions.includes(p))!;
    const team = position % 2 === 0 ? 0 : 1;

    // Add AI player
    await ctx.db.insert('roomPlayers', {
      roomId: args.roomId,
      position,
      team: team as 0 | 1,
      isReady: true,
      isAI: true,
      aiDifficulty: args.difficulty,
      aiPersonality: args.personality || 'balanced',
      connectionStatus: 'connected',
      joinedAt: Date.now(),
    });

    // Update room player count
    await ctx.db.patch(args.roomId, {
      currentPlayers: room.currentPlayers + 1,
    });
  },
});

// Get room by code
export const getRoomByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_code', q => q.eq('code', args.code))
      .first();

    if (!room) return null;

    // Get players
    const players = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', room._id))
      .collect();

    // Get user details for each player
    const playersWithDetails = await Promise.all(
      players.map(async player => {
        if (player.isAI) {
          return {
            ...player,
            user: {
              username: `AI ${player.aiDifficulty}`,
              avatar: '🤖',
              elo: 1000,
            },
          };
        } else if (player.userId) {
          const user = await ctx.db.get(player.userId);
          return {
            ...player,
            user: user
              ? {
                  username: user.username,
                  avatar: user.avatar,
                  elo: user.elo,
                }
              : null,
          };
        }
        return { ...player, user: null };
      }),
    );

    return {
      ...room,
      players: playersWithDetails.sort((a, b) => a.position - b.position),
    };
  },
});

// Update room settings
export const updateRoomSettings = mutation({
  args: {
    roomId: v.id('rooms'),
    hostId: v.id('users'),
    gameMode: v.optional(
      v.union(
        v.literal('ranked'),
        v.literal('casual'),
        v.literal('friends'),
        v.literal('local'),
      ),
    ),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error('Sala no encontrada');
    }

    // Only host can update settings
    if (room.hostId !== args.hostId) {
      throw new Error('Solo el anfitrión puede cambiar la configuración');
    }

    // Only update if room is still waiting
    if (room.status !== 'waiting') {
      throw new Error(
        'No se puede cambiar la configuración después de iniciar',
      );
    }

    const updates: Partial<typeof room> = {};
    if (args.gameMode !== undefined) {
      updates.gameMode = args.gameMode;
    }
    if (args.isPublic !== undefined) {
      updates.isPublic = args.isPublic;
    }

    await ctx.db.patch(args.roomId, updates);
  },
});

// Kick player from room
export const kickPlayer = mutation({
  args: {
    roomId: v.id('rooms'),
    hostId: v.id('users'),
    playerToKick: v.id('users'),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error('Sala no encontrada');
    }

    // Only host can kick players
    if (room.hostId !== args.hostId) {
      throw new Error('Solo el anfitrión puede expulsar jugadores');
    }

    // Can't kick yourself
    if (args.hostId === args.playerToKick) {
      throw new Error('No puedes expulsarte a ti mismo');
    }

    // Only kick if room is still waiting
    if (room.status !== 'waiting') {
      throw new Error('No se puede expulsar jugadores después de iniciar');
    }

    // Find player in room
    const player = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .filter(q => q.eq(q.field('userId'), args.playerToKick))
      .first();

    if (!player) {
      throw new Error('Jugador no encontrado en la sala');
    }

    // Remove player
    await ctx.db.delete(player._id);

    // Update room player count
    await ctx.db.patch(args.roomId, {
      currentPlayers: Math.max(0, room.currentPlayers - 1),
    });
  },
});

// Get public rooms
export const getPublicRooms = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Get public waiting rooms
    const rooms = await ctx.db
      .query('rooms')
      .withIndex('by_status', q => q.eq('status', 'waiting'))
      .filter(q => q.eq(q.field('isPublic'), true))
      .order('desc')
      .take(limit);

    // Get room details with player count
    const roomsWithDetails = await Promise.all(
      rooms.map(async room => {
        const players = await ctx.db
          .query('roomPlayers')
          .withIndex('by_room', q => q.eq('roomId', room._id))
          .collect();

        const host = await ctx.db.get(room.hostId);

        return {
          ...room,
          playerCount: players.length,
          hostUsername: host?.username || 'Unknown',
        };
      }),
    );

    return roomsWithDetails;
  },
});

// Remove AI player from room
export const removeAIPlayer = mutation({
  args: {
    roomId: v.id('rooms'),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error('Sala no encontrada');
    }

    // Find AI player at position
    const aiPlayer = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .filter(q =>
        q.and(
          q.eq(q.field('position'), args.position),
          q.eq(q.field('isAI'), true),
        ),
      )
      .first();

    if (!aiPlayer) {
      throw new Error('No hay un jugador AI en esa posición');
    }

    // Remove AI player
    await ctx.db.delete(aiPlayer._id);

    // Update room player count
    await ctx.db.patch(args.roomId, {
      currentPlayers: Math.max(0, room.currentPlayers - 1),
    });
  },
});
