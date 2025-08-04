import { action, internalAction, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';
import { getCardFromId, CARD_VALUES } from './gameLogic';

type AIPersonality = 'aggressive' | 'defensive' | 'balanced' | 'unpredictable';
type AIDifficulty = 'easy' | 'medium' | 'hard';

// Main AI action to process turn
export const processAITurn = internalAction({
  args: {
    roomId: v.id('rooms'),
    playerId: v.id('roomPlayers'),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    // Get game state
    const gameState = await ctx.runQuery(
      internal.gameQueries.getGameStateInternal,
      {
        roomId: args.roomId,
      },
    );

    if (!gameState || gameState.currentPlayer !== args.position) {
      return; // Not AI's turn
    }

    // Get AI player info
    const aiPlayer = await ctx.runQuery(internal.ai.getAIPlayer, {
      playerId: args.playerId,
    });

    if (!aiPlayer) return;

    // Analyze game state and make decision
    const hand = gameState.hands[args.position];
    const decision = analyzeAndDecide(
      gameState,
      hand,
      args.position,
      aiPlayer.aiDifficulty || 'medium',
      aiPlayer.aiPersonality || 'balanced',
    );

    // Execute decision with delay for realism
    await new Promise(resolve =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
    );

    switch (decision.type) {
      case 'PLAY_CARD':
        await ctx.runMutation(internal.gameActions.playCardInternal, {
          roomId: args.roomId,
          playerId: args.playerId,
          cardId: decision.cardId!,
          position: args.position,
        });
        break;

      case 'CANTAR':
        await ctx.runMutation(internal.gameActions.cantarInternal, {
          roomId: args.roomId,
          playerId: args.playerId,
          suit: decision.suit!,
          position: args.position,
        });
        // Then play a card
        if (decision.cardId) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await ctx.runMutation(internal.gameActions.playCardInternal, {
            roomId: args.roomId,
            playerId: args.playerId,
            cardId: decision.cardId,
            position: args.position,
          });
        }
        break;

      case 'CAMBIAR_7':
        await ctx.runMutation(internal.gameActions.cambiar7Internal, {
          roomId: args.roomId,
          playerId: args.playerId,
          position: args.position,
        });
        // Then play a card
        if (decision.cardId) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await ctx.runMutation(internal.gameActions.playCardInternal, {
            roomId: args.roomId,
            playerId: args.playerId,
            cardId: decision.cardId,
            position: args.position,
          });
        }
        break;
    }
  },
});

// Analyze game state and decide what to do
function analyzeAndDecide(
  gameState: any,
  hand: string[],
  position: number,
  difficulty: AIDifficulty,
  personality: AIPersonality,
): { type: string; cardId?: string; suit?: any } {
  const trumpSuit = gameState.trump.suit;
  const team = position % 2;
  const partner = (position + 2) % 4;

  // Check if can cante
  const canteSuits = ['oros', 'copas', 'espadas', 'bastos']
    .filter(suit => suit !== trumpSuit)
    .filter(suit => {
      const hasRey = hand.includes(`${suit}_12`);
      const hasCaballo = hand.includes(`${suit}_11`);
      const notCanted = !gameState.scores[team].cantes.some(
        (c: any) => c.suit === suit,
      );
      return hasRey && hasCaballo && notCanted;
    });

  // Always cante if possible (free points)
  if (canteSuits.length > 0) {
    const suit = canteSuits[0];
    const cardToPlay = selectCardToPlay(
      gameState,
      hand,
      position,
      difficulty,
      personality,
    );
    return { type: 'CANTAR', suit, cardId: cardToPlay };
  }

  // Check if can cambiar 7
  if (
    gameState.phase === 'initial' &&
    hand.includes(`${trumpSuit}_7`) &&
    gameState.trump.card
  ) {
    const trumpCard = getCardFromId(gameState.trump.card, gameState.deck);
    if (trumpCard && trumpCard.rank !== 7) {
      // Exchange if trump is valuable
      if (CARD_VALUES[trumpCard.rank] > 0) {
        const cardToPlay = selectCardToPlay(
          gameState,
          hand,
          position,
          difficulty,
          personality,
        );
        return { type: 'CAMBIAR_7', cardId: cardToPlay };
      }
    }
  }

  // Select card to play
  const cardToPlay = selectCardToPlay(
    gameState,
    hand,
    position,
    difficulty,
    personality,
  );
  return { type: 'PLAY_CARD', cardId: cardToPlay };
}

// Select which card to play
function selectCardToPlay(
  gameState: any,
  hand: string[],
  position: number,
  difficulty: AIDifficulty,
  personality: AIPersonality,
): string {
  const table = gameState.table;
  const trumpSuit = gameState.trump.suit;
  const deck = gameState.deck;

  // If table is empty, we're leading
  if (table.length === 0) {
    return selectLeadingCard(hand, trumpSuit, deck, difficulty, personality);
  }

  // Must follow suit
  const leadingCard = getCardFromId(table[0], deck);
  if (!leadingCard) return hand[0]; // Fallback

  const validCards = getValidCards(hand, leadingCard.suit, trumpSuit, deck);

  // Analyze current trick
  const trickAnalysis = analyzeTrick(table, trumpSuit, deck, position);

  return selectFollowingCard(
    validCards,
    trickAnalysis,
    trumpSuit,
    deck,
    difficulty,
    personality,
  );
}

// Get valid cards to play
function getValidCards(
  hand: string[],
  leadingSuit: string,
  trumpSuit: string,
  deck: any[],
): string[] {
  const cards = hand.map(id => ({ id, card: getCardFromId(id, deck)! }));
  const hasSuit = cards.some(c => c.card.suit === leadingSuit);

  if (hasSuit) {
    return cards.filter(c => c.card.suit === leadingSuit).map(c => c.id);
  }

  // Can't follow suit - all cards valid
  return hand;
}

// Select card when leading
function selectLeadingCard(
  hand: string[],
  trumpSuit: string,
  deck: any[],
  difficulty: AIDifficulty,
  personality: AIPersonality,
): string {
  const cards = hand.map(id => ({
    id,
    card: getCardFromId(id, deck)!,
    value: CARD_VALUES[getCardFromId(id, deck)!.rank] || 0,
  }));

  // Easy AI: Random
  if (difficulty === 'easy') {
    return cards[Math.floor(Math.random() * cards.length)].id;
  }

  // Sort by value
  cards.sort((a, b) => b.value - a.value);

  switch (personality) {
    case 'aggressive':
      // Play high value cards
      return cards[0].id;

    case 'defensive':
      // Save trumps and high cards
      const nonTrumpLow = cards.filter(
        c => c.card.suit !== trumpSuit && c.value < 10,
      );
      if (nonTrumpLow.length > 0) return nonTrumpLow[0].id;
      return cards[cards.length - 1].id;

    case 'balanced':
      // Play medium value non-trumps
      const nonTrump = cards.filter(c => c.card.suit !== trumpSuit);
      if (nonTrump.length > 0)
        return nonTrump[Math.floor(nonTrump.length / 2)].id;
      return cards[Math.floor(cards.length / 2)].id;

    case 'unpredictable':
      // Random but avoid high trumps
      const choices = cards.filter(
        c => !(c.card.suit === trumpSuit && c.value > 4),
      );
      return choices[Math.floor(Math.random() * choices.length)].id;

    default:
      return cards[0].id;
  }
}

// Select card when following
function selectFollowingCard(
  validCards: string[],
  trickAnalysis: any,
  trumpSuit: string,
  deck: any[],
  difficulty: AIDifficulty,
  personality: AIPersonality,
): string {
  if (difficulty === 'easy') {
    return validCards[Math.floor(Math.random() * validCards.length)];
  }

  const cards = validCards.map(id => ({
    id,
    card: getCardFromId(id, deck)!,
    value: CARD_VALUES[getCardFromId(id, deck)!.rank] || 0,
    canWin: canWinTrick(id, trickAnalysis, trumpSuit, deck),
  }));

  // Partner is winning and it's last position
  if (
    trickAnalysis.winningPlayer % 2 === trickAnalysis.ourTeam &&
    trickAnalysis.position === 3
  ) {
    // Give points to partner
    return cards.sort((a, b) => b.value - a.value)[0].id;
  }

  // Need to win the trick
  const winningCards = cards.filter(c => c.canWin);

  if (winningCards.length > 0) {
    switch (personality) {
      case 'aggressive':
        // Win with highest
        return winningCards.sort((a, b) => b.value - a.value)[0].id;
      case 'defensive':
        // Win with lowest that can win
        return winningCards.sort((a, b) => a.value - b.value)[0].id;
      default:
        // Win with medium card
        return winningCards[Math.floor(winningCards.length / 2)].id;
    }
  }

  // Can't win - play low
  return cards.sort((a, b) => a.value - b.value)[0].id;
}

// Analyze current trick
function analyzeTrick(
  table: string[],
  trumpSuit: string,
  deck: any[],
  position: number,
) {
  // Implementation details...
  return {
    winningPlayer: 0,
    ourTeam: position % 2,
    position: table.length,
    highestValue: 0,
  };
}

// Check if card can win trick
function canWinTrick(
  cardId: string,
  trickAnalysis: any,
  trumpSuit: string,
  deck: any[],
): boolean {
  // Simplified implementation
  const card = getCardFromId(cardId, deck);
  if (!card) return false;

  if (card.suit === trumpSuit) return true;
  return (CARD_VALUES[card.rank] || 0) > trickAnalysis.highestValue;
}

// Internal query to get AI player
export const getAIPlayer = internalQuery({
  args: { playerId: v.id('roomPlayers') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});
