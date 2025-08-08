// Pure game logic functions (no database access)
// This mirrors the existing gameLogic.ts but adapted for Convex

import type { Doc } from './_generated/dataModel';

export type Card = {
  suit: 'oros' | 'copas' | 'espadas' | 'bastos';
  rank: number;
  id: string;
};

export type GamePhase = 'initial' | 'arrastre' | 'final';

// Card values for counting points
export const CARD_VALUES: Record<number, number> = {
  1: 11, // As
  3: 10, // Tres
  12: 4, // Rey
  11: 3, // Caballo
  10: 2, // Sota
  // Rest are 0
};

// Get card from ID
export function getCardFromId(cardId: string, deck: Card[]): Card | undefined {
  return deck.find(c => c.id === cardId);
}

// Check if a move is valid
export function isValidMove(
  gameState: Doc<'gameStates'>,
  playerId: string,
  cardId: string,
  playerPosition: number,
): { valid: boolean; error?: string } {
  // Check if it's player's turn
  if (gameState.currentPlayer !== playerPosition) {
    return { valid: false, error: 'No es tu turno' };
  }

  // Check if player has the card
  const playerHand = gameState.hands[playerPosition];
  if (!playerHand.includes(cardId)) {
    return { valid: false, error: 'No tienes esa carta' };
  }

  // If table is empty, any card is valid
  if (gameState.table.length === 0) {
    return { valid: true };
  }

  // Get leading card
  const leadingCardId = gameState.table[0];
  const leadingCard = getCardFromId(leadingCardId, gameState.deck);
  const playedCard = getCardFromId(cardId, gameState.deck);

  if (!leadingCard || !playedCard) {
    return { valid: false, error: 'Carta inválida' };
  }

  // Must follow suit if possible
  const hasSuit = playerHand.some(cId => {
    const c = getCardFromId(cId, gameState.deck);
    return c?.suit === leadingCard.suit;
  });

  if (hasSuit && playedCard.suit !== leadingCard.suit) {
    return { valid: false, error: 'Debes seguir el palo' };
  }

  // If can't follow suit, must play trump if possible (in arrastre/final phase)
  if ((gameState.phase === 'final' || gameState.phase === 'arrastre') && !hasSuit) {
    const hasTrump = playerHand.some(cId => {
      const c = getCardFromId(cId, gameState.deck);
      return c?.suit === gameState.trump.suit;
    });

    if (hasTrump && playedCard.suit !== gameState.trump.suit) {
      return { valid: false, error: 'Debes jugar triunfo' };
    }
  }

  return { valid: true };
}

// Calculate trick winner
export function calculateTrickWinner(
  cards: Card[],
  trumpSuit: string,
  startingPlayer: number,
): { winner: number; points: number } {
  let winningIndex = 0;
  let winningCard = cards[0];
  const leadingSuit = cards[0].suit;

  // Calculate points in trick
  const points = cards.reduce((sum, card) => {
    return sum + (CARD_VALUES[card.rank] || 0);
  }, 0);

  for (let i = 1; i < cards.length; i++) {
    const card = cards[i];

    // Trump beats everything
    if (card.suit === trumpSuit && winningCard.suit !== trumpSuit) {
      winningIndex = i;
      winningCard = card;
    }
    // Higher trump beats lower trump
    else if (card.suit === trumpSuit && winningCard.suit === trumpSuit) {
      if (compareCards(card, winningCard) > 0) {
        winningIndex = i;
        winningCard = card;
      }
    }
    // Follow suit beats off-suit (non-trump)
    else if (
      card.suit === leadingSuit &&
      winningCard.suit !== trumpSuit &&
      winningCard.suit !== leadingSuit
    ) {
      winningIndex = i;
      winningCard = card;
    }
    // Higher card of same suit
    else if (
      card.suit === winningCard.suit &&
      compareCards(card, winningCard) > 0
    ) {
      winningIndex = i;
      winningCard = card;
    }
  }

  const winner = (startingPlayer + winningIndex) % 4;
  return { winner, points };
}

// Compare two cards of the same suit
function compareCards(a: Card, b: Card): number {
  const order = [2, 4, 5, 6, 7, 10, 11, 12, 3, 1]; // Lowest to highest
  return order.indexOf(a.rank) - order.indexOf(b.rank);
}

// Check if cante is valid
export function canCante(
  gameState: Doc<'gameStates'>,
  playerId: string,
  suit: string,
  playerPosition: number,
): boolean {
  // Must be player's turn
  if (gameState.currentPlayer !== playerPosition) return false;

  // Can't cante trump suit
  if (suit === gameState.trump.suit) return false;

  // Must have both Rey (12) and Caballo (11) of the suit
  const playerHand = gameState.hands[playerPosition];
  const hasRey = playerHand.some(cId => {
    const c = getCardFromId(cId, gameState.deck);
    return c?.suit === suit && c.rank === 12;
  });
  const hasCaballo = playerHand.some(cId => {
    const c = getCardFromId(cId, gameState.deck);
    return c?.suit === suit && c.rank === 11;
  });

  // Check if already canted this suit
  const playerScore = gameState.scores[playerPosition % 2];
  const alreadyCanted = playerScore.cantes.some(c => c.suit === suit);

  return hasRey && hasCaballo && !alreadyCanted;
}

// Check if can cambiar 7
export function canCambiar7(
  gameState: Doc<'gameStates'>,
  playerId: string,
  playerPosition: number,
): boolean {
  // Must be initial phase
  if (gameState.phase !== 'initial') return false;

  // Must be player's turn
  if (gameState.currentPlayer !== playerPosition) return false;

  // Must have 7 of trump
  const playerHand = gameState.hands[playerPosition];
  const has7Trump = playerHand.some(cId => {
    const c = getCardFromId(cId, gameState.deck);
    return c?.suit === gameState.trump.suit && c.rank === 7;
  });

  // Trump card must exist and not be a 7
  return (
    has7Trump &&
    gameState.trump.card !== undefined &&
    !gameState.trump.card.includes('_7')
  );
}

// Calculate final scores
export function calculateFinalScores(gameState: Doc<'gameStates'>): {
  team0Score: number;
  team1Score: number;
  roundWinner: 0 | 1 | null;
} {
  const team0Score = gameState.scores[0].total;
  const team1Score = gameState.scores[1].total;

  // Need at least 101 points to win
  if (team0Score >= 101 && team0Score > team1Score) {
    return { team0Score, team1Score, roundWinner: 0 };
  } else if (team1Score >= 101 && team1Score > team0Score) {
    return { team0Score, team1Score, roundWinner: 1 };
  }

  return { team0Score, team1Score, roundWinner: null };
}

// Create initial deck
export function createDeck(): Card[] {
  const suits: Card['suit'][] = ['oros', 'copas', 'espadas', 'bastos'];
  const ranks = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        id: `${suit}_${rank}`,
      });
    }
  }

  return deck;
}

// Shuffle deck
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
