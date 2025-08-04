import { mutation, action, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import {
  createDeck,
  shuffleDeck,
  isValidMove,
  calculateTrickWinner,
  canCante,
  canCambiar7,
  calculateFinalScores,
  getCardFromId,
  CARD_VALUES,
} from './gameLogic';

// Initialize a new game
export const initializeGame = action({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.gameActions.initializeGameMutation, args);
  },
});

// Internal mutation for game initialization
export const initializeGameMutation = internalMutation({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    // Create and shuffle deck
    const deck = shuffleDeck(createDeck());

    // Deal cards: 6 to each player
    const hands: string[][] = [[], [], [], []];
    let cardIndex = 0;

    for (let round = 0; round < 6; round++) {
      for (let player = 0; player < 4; player++) {
        hands[player].push(deck[cardIndex].id);
        cardIndex++;
      }
    }

    // Trump card is the next card
    const trumpCard = deck[cardIndex];
    cardIndex++;

    // Initialize scores
    const scores = [
      { cardPoints: 0, lastTrick: false, cantes: [], total: 0 },
      { cardPoints: 0, lastTrick: false, cantes: [], total: 0 },
    ];

    // Create game state
    await ctx.db.insert('gameStates', {
      roomId: args.roomId,
      currentPlayer: 0,
      deck,
      hands,
      table: [],
      tricks: [],
      scores,
      trump: {
        suit: trumpCard.suit,
        card: trumpCard.id,
      },
      phase: 'initial',
    });
  },
});

// Play a card
export const playCard = mutation({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('users'),
    cardId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get game state
    const gameState = await ctx.db
      .query('gameStates')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .first();

    if (!gameState) {
      throw new Error('Estado del juego no encontrado');
    }

    // Get player position
    const player = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();

    if (!player) {
      throw new Error('No estás en esta partida');
    }

    // Validate move
    const validation = isValidMove(
      gameState,
      args.userId,
      args.cardId,
      player.position,
    );
    if (!validation.valid) {
      throw new Error(validation.error || 'Movimiento inválido');
    }

    // Remove card from hand
    const newHands = [...gameState.hands];
    newHands[player.position] = newHands[player.position].filter(
      c => c !== args.cardId,
    );

    // Add card to table
    const newTable = [...gameState.table, args.cardId];

    // Check if trick is complete
    if (newTable.length === 4) {
      // Calculate winner
      const tableCards = newTable.map(id => getCardFromId(id, gameState.deck)!);
      const { winner, points } = calculateTrickWinner(
        tableCards,
        gameState.trump.suit,
        (gameState.currentPlayer - 3 + 4) % 4, // Starting player of this trick
      );

      // Update scores
      const newScores = [...gameState.scores];
      const winnerTeam = winner % 2;
      newScores[winnerTeam].cardPoints += points;

      // Store trick
      const newTricks = [
        ...gameState.tricks,
        {
          cards: newTable,
          winner,
          points,
        },
      ];

      // Check if need to deal more cards (initial phase)
      if (gameState.phase === 'initial' && gameState.deck.length > 24) {
        // Deal one card to each player, starting with trick winner
        let deckIndex = 24; // Cards already dealt
        for (let i = 0; i < 4; i++) {
          const playerIndex = (winner + i) % 4;
          if (deckIndex < gameState.deck.length) {
            newHands[playerIndex].push(gameState.deck[deckIndex].id);
            deckIndex++;
          }
        }
      }

      // Check for phase change
      let newPhase = gameState.phase;
      if (gameState.phase === 'initial' && newHands.some(h => h.length === 0)) {
        newPhase = 'final';
      }

      // Update game state
      await ctx.db.patch(gameState._id, {
        hands: newHands,
        table: [],
        tricks: newTricks,
        scores: newScores,
        currentPlayer: winner,
        phase: newPhase,
        lastAction: {
          type: 'PLAY_CARD',
          playerId: args.userId,
          data: { cardId: args.cardId },
          timestamp: Date.now(),
        },
      });

      // Check for game end
      if (newHands.every(h => h.length === 0)) {
        await checkGameEnd(ctx, gameState._id, args.roomId);
      }
    } else {
      // Just add card to table
      await ctx.db.patch(gameState._id, {
        hands: newHands,
        table: newTable,
        currentPlayer: (player.position + 1) % 4,
        lastAction: {
          type: 'PLAY_CARD',
          playerId: args.userId,
          data: { cardId: args.cardId },
          timestamp: Date.now(),
        },
      });
    }

    // Log action
    await ctx.db.insert('gameActions', {
      roomId: args.roomId,
      playerId: args.userId,
      actionType: 'PLAY_CARD',
      actionData: { cardId: args.cardId },
      timestamp: Date.now(),
      validated: true,
    });
  },
});

// Cantar (announce Rey-Caballo)
export const cantar = mutation({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('users'),
    suit: v.union(
      v.literal('oros'),
      v.literal('copas'),
      v.literal('espadas'),
      v.literal('bastos'),
    ),
  },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query('gameStates')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .first();

    if (!gameState) {
      throw new Error('Estado del juego no encontrado');
    }

    const player = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();

    if (!player) {
      throw new Error('No estás en esta partida');
    }

    // Validate cante
    if (!canCante(gameState, args.userId, args.suit, player.position)) {
      throw new Error('No puedes cantar este palo');
    }

    // Add cante to scores
    const newScores = [...gameState.scores];
    const team = player.position % 2;
    const points = 20; // 20 points for non-trump cante

    newScores[team].cantes.push({ suit: args.suit, points });
    newScores[team].total += points;

    // Update game state
    await ctx.db.patch(gameState._id, {
      scores: newScores,
      lastAction: {
        type: 'CANTAR',
        playerId: args.userId,
        data: { suit: args.suit, points },
        timestamp: Date.now(),
      },
    });

    // Log action
    await ctx.db.insert('gameActions', {
      roomId: args.roomId,
      playerId: args.userId,
      actionType: 'CANTAR',
      actionData: { suit: args.suit },
      timestamp: Date.now(),
      validated: true,
    });
  },
});

// Cambiar 7 (exchange 7 of trump)
export const cambiar7 = mutation({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query('gameStates')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .first();

    if (!gameState) {
      throw new Error('Estado del juego no encontrado');
    }

    const player = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();

    if (!player) {
      throw new Error('No estás en esta partida');
    }

    // Validate cambiar
    if (!canCambiar7(gameState, args.userId, player.position)) {
      throw new Error('No puedes cambiar el 7');
    }

    // Exchange cards
    const newHands = [...gameState.hands];
    const sevenId = `${gameState.trump.suit}_7`;
    const trumpCardId = gameState.trump.card!;

    // Remove 7 from hand, add trump card
    newHands[player.position] = newHands[player.position].filter(
      c => c !== sevenId,
    );
    newHands[player.position].push(trumpCardId);

    // Update trump card to 7
    await ctx.db.patch(gameState._id, {
      hands: newHands,
      trump: {
        ...gameState.trump,
        card: sevenId,
      },
      lastAction: {
        type: 'CAMBIAR_7',
        playerId: args.userId,
        data: {},
        timestamp: Date.now(),
      },
    });

    // Log action
    await ctx.db.insert('gameActions', {
      roomId: args.roomId,
      playerId: args.userId,
      actionType: 'CAMBIAR_7',
      actionData: {},
      timestamp: Date.now(),
      validated: true,
    });
  },
});

// Helper function to check game end
// Internal mutations for AI players
export const playCardInternal = internalMutation({
  args: {
    roomId: v.id('rooms'),
    playerId: v.id('roomPlayers'),
    cardId: v.string(),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    // Get game state
    const gameState = await ctx.db
      .query('gameStates')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .first();

    if (!gameState) {
      throw new Error('Game state not found');
    }

    // Validate it's the AI's turn
    if (gameState.currentPlayer !== args.position) {
      throw new Error('Not AI player turn');
    }

    // Validate card is in hand
    if (!gameState.hands[args.position].includes(args.cardId)) {
      throw new Error('Card not in AI hand');
    }

    // Remove card from hand
    const newHands = [...gameState.hands];
    newHands[args.position] = newHands[args.position].filter(
      c => c !== args.cardId,
    );

    // Add card to table
    const newTable = [...gameState.table, args.cardId];

    // Check if trick is complete
    if (newTable.length === 4) {
      // Calculate winner
      const tableCards = newTable.map(id => getCardFromId(id, gameState.deck)!);
      const { winner, points } = calculateTrickWinner(
        tableCards,
        gameState.trump.suit,
        (gameState.currentPlayer - 3 + 4) % 4,
      );

      // Update scores
      const newScores = [...gameState.scores];
      const winnerTeam = winner % 2;
      newScores[winnerTeam].cardPoints += points;

      // Store trick
      const newTricks = [
        ...gameState.tricks,
        {
          cards: newTable,
          winner,
          points,
        },
      ];

      // Check if need to deal more cards (initial phase)
      if (gameState.phase === 'initial' && gameState.deck.length > 24) {
        let deckIndex = 24;
        for (let i = 0; i < 4; i++) {
          const playerIndex = (winner + i) % 4;
          if (deckIndex < gameState.deck.length) {
            newHands[playerIndex].push(gameState.deck[deckIndex].id);
            deckIndex++;
          }
        }
      }

      // Check for phase change
      let newPhase = gameState.phase;
      if (gameState.phase === 'initial' && newHands.some(h => h.length === 0)) {
        newPhase = 'final';
      }

      // Update game state
      await ctx.db.patch(gameState._id, {
        hands: newHands,
        table: [],
        tricks: newTricks,
        scores: newScores,
        currentPlayer: winner,
        phase: newPhase,
        lastAction: {
          type: 'PLAY_CARD',
          playerId: args.playerId,
          data: { cardId: args.cardId },
          timestamp: Date.now(),
        },
      });

      // Check for game end
      if (newHands.every(h => h.length === 0)) {
        await checkGameEnd(ctx, gameState._id, args.roomId);
      }
    } else {
      // Just add card to table
      await ctx.db.patch(gameState._id, {
        hands: newHands,
        table: newTable,
        currentPlayer: (args.position + 1) % 4,
        lastAction: {
          type: 'PLAY_CARD',
          playerId: args.playerId,
          data: { cardId: args.cardId },
          timestamp: Date.now(),
        },
      });
    }

    // Log action
    await ctx.db.insert('gameActions', {
      roomId: args.roomId,
      playerId: args.playerId,
      actionType: 'PLAY_CARD',
      actionData: { cardId: args.cardId },
      timestamp: Date.now(),
      validated: true,
    });
  },
});

export const cantarInternal = internalMutation({
  args: {
    roomId: v.id('rooms'),
    playerId: v.id('roomPlayers'),
    suit: v.union(
      v.literal('oros'),
      v.literal('copas'),
      v.literal('espadas'),
      v.literal('bastos'),
    ),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query('gameStates')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .first();

    if (!gameState) {
      throw new Error('Game state not found');
    }

    // Check if AI has both Rey (12) and Caballo (11) of the suit
    const aiHand = gameState.hands[args.position];
    const hasRey = aiHand.includes(`${args.suit}_12`);
    const hasCaballo = aiHand.includes(`${args.suit}_11`);

    if (!hasRey || !hasCaballo) {
      throw new Error('AI cannot cante without Rey and Caballo');
    }

    // Only can cante in initial phase
    if (gameState.phase !== 'initial') {
      throw new Error('Cannot cante in final phase');
    }

    // Add cante to scores
    const newScores = [...gameState.scores];
    const team = args.position % 2;
    const points = args.suit === gameState.trump.suit ? 40 : 20;

    newScores[team].cantes.push({ suit: args.suit, points });
    newScores[team].total += points;

    // Update game state
    await ctx.db.patch(gameState._id, {
      scores: newScores,
      lastAction: {
        type: 'CANTAR',
        playerId: args.playerId,
        data: { suit: args.suit, points },
        timestamp: Date.now(),
      },
    });

    // Log action
    await ctx.db.insert('gameActions', {
      roomId: args.roomId,
      playerId: args.playerId,
      actionType: 'CANTAR',
      actionData: { suit: args.suit },
      timestamp: Date.now(),
      validated: true,
    });
  },
});

export const cambiar7Internal = internalMutation({
  args: {
    roomId: v.id('rooms'),
    playerId: v.id('roomPlayers'),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query('gameStates')
      .withIndex('by_room', q => q.eq('roomId', args.roomId))
      .first();

    if (!gameState) {
      throw new Error('Game state not found');
    }

    // Only in initial phase
    if (gameState.phase !== 'initial') {
      throw new Error('Cannot cambiar 7 in final phase');
    }

    // Check if AI has 7 of trump
    const sevenId = `${gameState.trump.suit}_7`;
    if (!gameState.hands[args.position].includes(sevenId)) {
      throw new Error('AI does not have 7 of trump');
    }

    // Trump card must exist
    if (!gameState.trump.card) {
      throw new Error('No trump card to exchange');
    }

    // Exchange cards
    const newHands = [...gameState.hands];
    const trumpCardId = gameState.trump.card;

    // Remove 7 from hand, add trump card
    newHands[args.position] = newHands[args.position].filter(
      c => c !== sevenId,
    );
    newHands[args.position].push(trumpCardId);

    // Update trump card to 7
    await ctx.db.patch(gameState._id, {
      hands: newHands,
      trump: {
        ...gameState.trump,
        card: sevenId,
      },
      lastAction: {
        type: 'CAMBIAR_7',
        playerId: args.playerId,
        data: {},
        timestamp: Date.now(),
      },
    });

    // Log action
    await ctx.db.insert('gameActions', {
      roomId: args.roomId,
      playerId: args.playerId,
      actionType: 'CAMBIAR_7',
      actionData: {},
      timestamp: Date.now(),
      validated: true,
    });
  },
});

async function checkGameEnd(ctx: any, gameStateId: any, roomId: any) {
  const gameState = await ctx.db.get(gameStateId);
  if (!gameState) return;

  // Add last trick bonus (10 points)
  const lastTrick = gameState.tricks[gameState.tricks.length - 1];
  const lastTrickTeam = lastTrick.winner % 2;

  const newScores = [...gameState.scores];
  newScores[lastTrickTeam].lastTrick = true;
  newScores[lastTrickTeam].total += 10;

  // Calculate total scores
  newScores[0].total =
    newScores[0].cardPoints +
    newScores[0].cantes.reduce((sum: number, c: any) => sum + c.points, 0) +
    (newScores[0].lastTrick ? 10 : 0);

  newScores[1].total =
    newScores[1].cardPoints +
    newScores[1].cantes.reduce((sum: number, c: any) => sum + c.points, 0) +
    (newScores[1].lastTrick ? 10 : 0);

  // Check for round winner
  const { roundWinner } = calculateFinalScores({
    ...gameState,
    scores: newScores,
  });

  await ctx.db.patch(gameStateId, {
    scores: newScores,
    roundWinner,
    gameWinner: roundWinner, // For now, single round games
  });

  // Update room status
  if (roundWinner !== null) {
    await ctx.db.patch(roomId, {
      status: 'finished',
      finishedAt: Date.now(),
    });

    // Update player statistics
    const players = await ctx.db
      .query('roomPlayers')
      .withIndex('by_room', (q: any) => q.eq('roomId', roomId))
      .collect();

    for (const player of players) {
      if (!player.isAI && player.userId) {
        const user = await ctx.db.get(player.userId);
        if (user) {
          const isWinner = player.team === roundWinner;
          await ctx.db.patch(player.userId, {
            gamesPlayed: user.gamesPlayed + 1,
            gamesWon: user.gamesWon + (isWinner ? 1 : 0),
            elo: user.elo + (isWinner ? 25 : -15), // Simple ELO calculation
          });
        }
      }
    }
  }
}
