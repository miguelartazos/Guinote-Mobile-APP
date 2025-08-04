import { query, internalQuery } from './_generated/server';
import { v } from 'convex/values';

// Get game state for a room
export const getGameState = query({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query('gameStates')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .first();

    return gameState;
  },
});

// Get game actions history
export const getGameActions = query({
  args: {
    roomId: v.id('rooms'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('gameActions')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .order('desc');

    const actions = args.limit
      ? await query.take(args.limit)
      : await query.collect();

    return actions;
  },
});

// Get player's view of game (with hidden info)
export const getPlayerGameView = query({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query('gameStates')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .first();

    if (!gameState) return null;

    // Get player position
    const player = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();

    if (!player) return null;

    // Return game state with only player's hand visible
    return {
      ...gameState,
      hands: gameState.hands.map((hand, index) =>
        index === player.position ? hand : hand.map(() => 'hidden'),
      ),
      deck: gameState.deck.map(() => ({ hidden: true })), // Hide deck
    };
  },
});

// Get available actions for current player
export const getAvailableActions = query({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query('gameStates')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .first();

    if (!gameState)
      return { canPlay: false, canCante: false, canCambiar: false };

    const player = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();

    if (!player) return { canPlay: false, canCante: false, canCambiar: false };

    const isMyTurn = gameState.currentPlayer === player.position;
    const hand = gameState.hands[player.position];

    // Check which cards can be played
    const playableCards = isMyTurn
      ? hand.filter(cardId => {
          // Import validation logic or simplify for now
          return true; // TODO: Implement actual validation
        })
      : [];

    // Check if can cante
    const canteSuits = ['oros', 'copas', 'espadas', 'bastos']
      .filter(suit => suit !== gameState.trump.suit)
      .filter(suit => {
        const hasRey = hand.includes(`${suit}_12`);
        const hasCaballo = hand.includes(`${suit}_11`);
        const notCanted = !gameState.scores[player.position % 2].cantes.some(
          c => c.suit === suit,
        );
        return hasRey && hasCaballo && notCanted;
      });

    // Check if can cambiar 7
    const canCambiar =
      isMyTurn &&
      gameState.phase === 'initial' &&
      hand.includes(`${gameState.trump.suit}_7`) &&
      gameState.trump.card !== undefined;

    return {
      canPlay: isMyTurn,
      playableCards,
      canCante: isMyTurn && canteSuits.length > 0,
      canteSuits,
      canCambiar,
    };
  },
});

// Internal query for AI to get game state
export const getGameStateInternal = internalQuery({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('gameStates')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .first();
  },
});
