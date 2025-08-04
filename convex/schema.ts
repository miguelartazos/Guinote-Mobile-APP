import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // User profiles linked to Clerk
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    avatar: v.string(),
    elo: v.number(),
    gamesPlayed: v.number(),
    gamesWon: v.number(),
    isOnline: v.boolean(),
    lastSeenAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_username', ['username'])
    .index('by_elo', ['elo']),

  // Game rooms
  rooms: defineTable({
    code: v.string(),
    hostId: v.id('users'),
    status: v.union(
      v.literal('waiting'),
      v.literal('playing'),
      v.literal('finished'),
      v.literal('abandoned'),
    ),
    gameMode: v.union(
      v.literal('ranked'),
      v.literal('casual'),
      v.literal('friends'),
      v.literal('local'),
    ),
    isPublic: v.boolean(),
    maxPlayers: v.number(),
    currentPlayers: v.number(),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  })
    .index('by_code', ['code'])
    .index('by_status', ['status'])
    .index('by_created', ['createdAt']),

  // Players in rooms
  roomPlayers: defineTable({
    roomId: v.id('rooms'),
    userId: v.optional(v.id('users')),
    position: v.number(), // 0-3
    team: v.union(v.literal(0), v.literal(1)),
    isReady: v.boolean(),
    isAI: v.boolean(),
    aiDifficulty: v.optional(
      v.union(v.literal('easy'), v.literal('medium'), v.literal('hard')),
    ),
    aiPersonality: v.optional(
      v.union(
        v.literal('aggressive'),
        v.literal('defensive'),
        v.literal('balanced'),
        v.literal('unpredictable'),
      ),
    ),
    connectionStatus: v.union(
      v.literal('connected'),
      v.literal('disconnected'),
      v.literal('reconnecting'),
    ),
    joinedAt: v.number(),
  })
    .index('by_room', ['roomId'])
    .index('by_user', ['userId'])
    .index('by_room_and_user', ['roomId', 'userId']),

  // Game states
  gameStates: defineTable({
    roomId: v.id('rooms'),
    currentPlayer: v.number(),
    deck: v.array(
      v.object({
        suit: v.union(
          v.literal('oros'),
          v.literal('copas'),
          v.literal('espadas'),
          v.literal('bastos'),
        ),
        rank: v.number(),
        id: v.string(),
      }),
    ),
    hands: v.array(v.array(v.string())), // Array of card IDs for each player
    table: v.array(v.string()), // Card IDs on table
    tricks: v.array(
      v.object({
        cards: v.array(v.string()),
        winner: v.number(),
        points: v.number(),
      }),
    ),
    scores: v.array(
      v.object({
        cardPoints: v.number(),
        lastTrick: v.boolean(),
        cantes: v.array(
          v.object({
            suit: v.string(),
            points: v.number(),
          }),
        ),
        total: v.number(),
      }),
    ),
    trump: v.object({
      suit: v.union(
        v.literal('oros'),
        v.literal('copas'),
        v.literal('espadas'),
        v.literal('bastos'),
      ),
      card: v.optional(v.string()),
    }),
    phase: v.union(v.literal('initial'), v.literal('final')),
    roundWinner: v.optional(v.union(v.literal(0), v.literal(1))),
    gameWinner: v.optional(v.union(v.literal(0), v.literal(1))),
    lastAction: v.optional(
      v.object({
        type: v.string(),
        playerId: v.string(),
        data: v.any(),
        timestamp: v.number(),
      }),
    ),
  }).index('by_room', ['roomId']),

  // Game actions log
  gameActions: defineTable({
    roomId: v.id('rooms'),
    playerId: v.optional(v.id('users')),
    actionType: v.union(
      v.literal('PLAY_CARD'),
      v.literal('CANTAR'),
      v.literal('CAMBIAR_7'),
      v.literal('DECLARE_VICTORY'),
      v.literal('DECLARE_RENUNCIO'),
    ),
    actionData: v.any(),
    timestamp: v.number(),
    validated: v.boolean(),
    error: v.optional(v.string()),
  })
    .index('by_room', ['roomId'])
    .index('by_timestamp', ['timestamp']),

  // Matchmaking queue
  matchmakingQueue: defineTable({
    userId: v.id('users'),
    gameMode: v.union(v.literal('ranked'), v.literal('casual')),
    eloMin: v.number(),
    eloMax: v.number(),
    region: v.optional(v.string()),
    joinedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_mode_and_elo', ['gameMode', 'eloMin', 'eloMax'])
    .index('by_joined', ['joinedAt']),

  // Voice messages
  voiceMessages: defineTable({
    roomId: v.id('rooms'),
    senderId: v.id('users'),
    storageId: v.string(), // Convex storage ID
    duration: v.number(),
    timestamp: v.number(),
  })
    .index('by_room', ['roomId'])
    .index('by_timestamp', ['timestamp']),

  // Friend relationships
  friendships: defineTable({
    userId: v.id('users'),
    friendId: v.id('users'),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('blocked'),
    ),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_friend', ['friendId'])
    .index('by_status', ['status']),
    
  // Game statistics
  gameStats: defineTable({
    userId: v.id('users'),
    gameMode: v.union(
      v.literal('ranked'),
      v.literal('casual'),
      v.literal('friends')
    ),
    won: v.boolean(),
    eloChange: v.number(),
    gameDuration: v.number(),
    pointsScored: v.number(),
    pointsConceded: v.number(),
    cantes: v.number(),
    victories20: v.number(),
    victories40: v.number(),
    timestamp: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_timestamp', ['timestamp']),
});
