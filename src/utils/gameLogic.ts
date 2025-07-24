import type {
  Card,
  CardId,
  PlayerId,
  GameState,
  TrickCard,
  TeamId,
  Cante,
  GamePhase,
} from '../types/game.types';
import type { SpanishSuit, CardValue } from '../components/game/SpanishCard';
import { CARD_POINTS } from '../types/game.types';

// Export constants for reuse
export const SPANISH_SUITS: SpanishSuit[] = [
  'espadas',
  'bastos',
  'oros',
  'copas',
];
export const CARD_VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const CARD_POWER: CardValue[] = [1, 3, 12, 11, 10, 7, 6, 5, 4, 2];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  SPANISH_SUITS.forEach(suit => {
    CARD_VALUES.forEach(value => {
      deck.push({
        id: `${suit}_${value}` as CardId,
        suit,
        value,
      });
    });
  });

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealInitialCards(
  deck: Card[],
  playerIds: PlayerId[],
): { hands: Map<PlayerId, Card[]>; remainingDeck: Card[] } {
  const hands = new Map<PlayerId, Card[]>();
  const mutableDeck = [...deck];

  // Deal 6 cards to each player
  playerIds.forEach(playerId => {
    const playerCards: Card[] = [];
    for (let i = 0; i < 6; i++) {
      const card = mutableDeck.pop();
      if (card) playerCards.push(card);
    }
    hands.set(playerId, playerCards);
  });

  return { hands, remainingDeck: mutableDeck };
}

function canBeatTrick(
  card: Card,
  currentTrick: readonly TrickCard[],
  trumpSuit: SpanishSuit,
): boolean {
  if (currentTrick.length === 0) return true;

  // Simulate adding this card to the trick
  const tempTrick = [...currentTrick, { playerId: 'temp' as PlayerId, card }];
  const winner = calculateTrickWinner(tempTrick, trumpSuit);

  // Check if the temporary player would win
  return winner === ('temp' as PlayerId);
}

export function isValidPlay(
  card: Card,
  hand: readonly Card[],
  currentTrick: readonly TrickCard[],
  trumpSuit: SpanishSuit,
  gamePhase: GamePhase = 'playing',
): boolean {
  // First card of trick is always valid
  if (currentTrick.length === 0) return true;

  const leadCard = currentTrick[0].card;
  const leadSuit = leadCard.suit;

  // Must follow suit if possible
  const hasSuit = hand.some(c => c.suit === leadSuit);
  if (hasSuit && card.suit !== leadSuit) return false;

  // In arrastre phase, additional rules apply
  if (gamePhase === 'arrastre') {
    // If following suit, must beat if possible
    if (card.suit === leadSuit) {
      const suitCards = hand.filter(c => c.suit === leadSuit);
      const canBeat = suitCards.some(c =>
        canBeatTrick(c, currentTrick, trumpSuit),
      );

      if (canBeat && !canBeatTrick(card, currentTrick, trumpSuit)) {
        // Has a card that can beat but playing one that doesn't
        return false;
      }
    }

    // If can't follow suit, must trump if possible
    if (!hasSuit && card.suit !== trumpSuit) {
      const hasTrump = hand.some(c => c.suit === trumpSuit);
      if (hasTrump) return false;
    }

    // If trumping, must beat other trumps if possible
    if (!hasSuit && card.suit === trumpSuit) {
      const trumpCards = hand.filter(c => c.suit === trumpSuit);
      const canBeatWithTrump = trumpCards.some(c =>
        canBeatTrick(c, currentTrick, trumpSuit),
      );

      if (canBeatWithTrump && !canBeatTrick(card, currentTrick, trumpSuit)) {
        return false;
      }
    }

    return true;
  }

  // Normal playing phase: If can't follow suit, must play trump if possible
  if (!hasSuit && card.suit !== trumpSuit) {
    const hasTrump = hand.some(c => c.suit === trumpSuit);
    if (hasTrump) return false;
  }

  return true;
}

export function calculateTrickWinner(
  trick: readonly TrickCard[],
  trumpSuit: SpanishSuit,
): PlayerId {
  if (trick.length === 0)
    throw new Error('Cannot calculate winner of empty trick');

  const leadSuit = trick[0].card.suit;
  let winningIndex = 0;
  let winningCard = trick[0].card;

  for (let i = 1; i < trick.length; i++) {
    const currentCard = trick[i].card;

    // Trump beats everything
    if (currentCard.suit === trumpSuit && winningCard.suit !== trumpSuit) {
      winningIndex = i;
      winningCard = currentCard;
    }
    // Higher trump beats lower trump
    else if (currentCard.suit === trumpSuit && winningCard.suit === trumpSuit) {
      if (getCardRank(currentCard) > getCardRank(winningCard)) {
        winningIndex = i;
        winningCard = currentCard;
      }
    }
    // If no trumps played, highest card of lead suit wins
    else if (
      winningCard.suit !== trumpSuit &&
      currentCard.suit === leadSuit &&
      getCardRank(currentCard) > getCardRank(winningCard)
    ) {
      winningIndex = i;
      winningCard = currentCard;
    }
  }

  return trick[winningIndex].playerId;
}

function getCardRank(card: Card): number {
  // Rank order for trick-taking (not points)
  const rankOrder: Record<CardValue, number> = {
    1: 10, // As (highest)
    3: 9, // Tres
    12: 8, // Rey
    11: 7, // Caballo
    10: 6, // Sota
    7: 5,
    6: 4,
    5: 3,
    4: 2,
    2: 1, // Dos (lowest)
  };
  return rankOrder[card.value];
}

export function calculateTrickPoints(trick: readonly TrickCard[]): number {
  return trick.reduce((sum, trickCard) => {
    return sum + (CARD_POINTS[trickCard.card.value] || 0);
  }, 0);
}

export function canCantar(
  hand: readonly Card[],
  trumpSuit: SpanishSuit,
  teamCantes: readonly Cante[],
): SpanishSuit[] {
  const cantableSuits: SpanishSuit[] = [];
  const suits: SpanishSuit[] = ['espadas', 'bastos', 'oros', 'copas'];

  suits.forEach(suit => {
    // Check if player has both Rey and Sota of the same suit
    const hasRey = hand.some(c => c.suit === suit && c.value === 12);
    const hasSota = hand.some(c => c.suit === suit && c.value === 10);

    if (hasRey && hasSota) {
      // Check if this cante hasn't been done yet by the team
      const alreadyCanted = teamCantes.some(cante => cante.suit === suit);
      if (!alreadyCanted) {
        cantableSuits.push(suit);
      }
    }
  });

  return cantableSuits;
}

export function calculateCantePoints(
  suit: SpanishSuit,
  trumpSuit: SpanishSuit,
): 20 | 40 {
  return suit === trumpSuit ? 40 : 20;
}

export function canCambiar7(
  hand: readonly Card[],
  trumpCard: Card,
  deckSize: number,
): boolean {
  // Can only exchange if there are cards left in deck
  if (deckSize === 0) return false;

  // Can only exchange if trump card is not a 7
  if (trumpCard.value === 7) return false;

  // Must have 7 of trump suit
  return hand.some(c => c.suit === trumpCard.suit && c.value === 7);
}

export function getNextPlayerIndex(
  currentIndex: number,
  totalPlayers: number,
): number {
  return (currentIndex + 1) % totalPlayers;
}

export function findPlayerTeam(
  playerId: PlayerId,
  gameState: GameState,
): TeamId | undefined {
  const team = gameState.teams.find(t => t.playerIds.includes(playerId));
  return team?.id;
}

export function isGameOver(gameState: GameState): boolean {
  return gameState.teams.some(team => team.score >= 101);
}

export function calculateFinalPoints(
  gameState: GameState,
): Map<TeamId, number> {
  const finalPoints = new Map<TeamId, number>();

  gameState.teams.forEach(team => {
    let points = team.score;

    // Add 10 points for last trick
    if (gameState.lastTrickWinner) {
      const winnerTeam = findPlayerTeam(gameState.lastTrickWinner, gameState);
      if (winnerTeam === team.id) {
        points += 10;
      }
    }

    finalPoints.set(team.id, points);
  });

  // Check for 30 malas rule
  const [team1Points, team2Points] = [
    finalPoints.get(gameState.teams[0].id) || 0,
    finalPoints.get(gameState.teams[1].id) || 0,
  ];

  // If a team has less than 30 points, opponent wins with 101
  if (team1Points < 30) {
    finalPoints.set(gameState.teams[1].id, 101);
  } else if (team2Points < 30) {
    finalPoints.set(gameState.teams[0].id, 101);
  }

  return finalPoints;
}

// Utility function for drop zone detection
export function isPointInBounds(
  point: { x: number; y: number },
  bounds: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

// Generate a random Spanish card (for demo/testing)
export function generateRandomCard(): { suit: SpanishSuit; value: CardValue } {
  const suit = SPANISH_SUITS[Math.floor(Math.random() * SPANISH_SUITS.length)];
  const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
  return { suit, value };
}
