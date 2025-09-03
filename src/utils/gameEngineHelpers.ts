import type { GameState, Card, PlayerId, TeamId, TrickCard, Team } from '../types/game.types';
import type { SpanishSuit } from '../types/cardTypes';
import {
  calculateTrickWinner,
  calculateTrickPoints,
  getNextPlayerIndex,
  findPlayerTeam,
  isGameOver,
  shouldStartVueltas,
} from './gameLogic';
import { WINNING_SCORE, MINIMUM_CARD_POINTS, CARD_POINTS } from '../types/game.types';
import { validateGameState } from './gameStateValidator';

/**
 * Result of calculating a trick
 */
interface TrickResult {
  winnerId: PlayerId;
  winnerTeam: TeamId | undefined;
  points: number;
  cards: TrickCard[];
}

/**
 * Calculate the result of a completed trick
 */
export function calculateTrickResult(
  trick: TrickCard[],
  trumpSuit: SpanishSuit,
  gameState: GameState,
): TrickResult {
  const winnerId = calculateTrickWinner(trick, trumpSuit);
  const points = calculateTrickPoints(trick);
  const winnerTeam = findPlayerTeam(winnerId, gameState);

  return {
    winnerId,
    winnerTeam,
    points,
    cards: trick,
  };
}

/**
 * Apply scoring from a completed trick
 */
export function applyTrickScoring(gameState: GameState, trickResult: TrickResult): GameState {
  const newTeams = [...gameState.teams] as [Team, Team];

  // Handle team detection failure
  if (!trickResult.winnerTeam) {
    console.warn('No team found for trick winner:', trickResult.winnerId);
    return gameState;
  }

  const teamIndex = newTeams.findIndex(t => t.id === trickResult.winnerTeam);

  if (teamIndex !== -1) {
    newTeams[teamIndex] = {
      ...newTeams[teamIndex],
      score: newTeams[teamIndex].score + trickResult.points,
      cardPoints: newTeams[teamIndex].cardPoints + trickResult.points,
    };
  }

  // Update collected tricks
  const newCollectedTricks = new Map(gameState.collectedTricks);
  const winnerTricks = newCollectedTricks.get(trickResult.winnerId) || [];
  newCollectedTricks.set(trickResult.winnerId, [...winnerTricks, trickResult.cards]);

  const newState = {
    ...gameState,
    teams: newTeams,
    collectedTricks: newCollectedTricks,
    trickCount: gameState.trickCount + 1,
    lastTrickWinner: trickResult.winnerId,
    lastTrick: trickResult.cards,
  };

  // Validate in development
  if (process.env.NODE_ENV === 'development') {
    const validation = validateGameState(newState);
    if (!validation.isValid) {
      console.error('Invalid state after trick scoring:', validation.errors);
    }
  }

  return newState;
}

/**
 * Deal new cards after a trick (if deck has cards)
 */
export function dealCardsAfterTrick(
  gameState: GameState,
  newHands: Map<PlayerId, ReadonlyArray<Card>>,
  winnerId: PlayerId,
): {
  gameState: GameState;
  newHands: Map<PlayerId, ReadonlyArray<Card>>;
} {
  if (gameState.deck.length === 0 || gameState.phase !== 'playing') {
    return { gameState, newHands };
  }

  let newDeck = [...gameState.deck];
  const updatedHands = new Map(newHands);

  // Winner draws first, then counter-clockwise
  const drawOrder = [winnerId];
  let nextIndex = gameState.players.findIndex(p => p.id === winnerId);

  for (let i = 0; i < 3; i++) {
    nextIndex = getNextPlayerIndex(nextIndex, 4);
    drawOrder.push(gameState.players[nextIndex].id);
  }

  // Deal cards
  drawOrder.forEach(playerId => {
    if (newDeck.length > 0) {
      const drawnCard = newDeck.pop();
      if (drawnCard) {
        const playerCards = [...(updatedHands.get(playerId) || [])];
        playerCards.push(drawnCard);
        updatedHands.set(playerId, playerCards);
      }
    }
  });

  const newPhase = newDeck.length === 0 ? 'arrastre' : gameState.phase;

  return {
    gameState: {
      ...gameState,
      deck: newDeck,
      phase: newPhase,
    },
    newHands: updatedHands,
  };
}

/**
 * Handle the last trick bonus
 */
export function applyLastTrickBonus(
  gameState: GameState,
  winnerTeam: TeamId | undefined,
): GameState {
  // Handle team detection failure
  if (!winnerTeam) {
    console.warn('No team found for last trick winner');
    return gameState;
  }

  const newTeams = [...gameState.teams] as [Team, Team];
  const teamIdx = newTeams.findIndex(t => t.id === winnerTeam);

  if (teamIdx !== -1) {
    newTeams[teamIdx] = {
      ...newTeams[teamIdx],
      score: newTeams[teamIdx].score + 10, // diez de últimas
    };
  }

  return {
    ...gameState,
    teams: newTeams,
  };
}

/**
 * Determine the next game phase
 */
export function determineNextPhase(gameState: GameState, isLastTrick: boolean): GameState {
  // Debug logging for phase transitions
  console.log('🎯 determineNextPhase called:', {
    currentPhase: gameState.phase,
    isLastTrick,
    isVueltas: gameState.isVueltas,
    team1Score: gameState.teams[0].score,
    team2Score: gameState.teams[1].score,
  });

  // Check if game is over
  if (isGameOver(gameState)) {
    console.log('🏆 Transitioning to gameOver phase');
    return {
      ...gameState,
      phase: 'gameOver',
    };
  }

  // Check if it's time for scoring phase
  if (isLastTrick && !gameState.isVueltas) {
    console.log('📊 Transitioning to scoring phase (end of hand)');
    return {
      ...gameState,
      phase: 'scoring',
    };
  }

  // Check if should start vueltas
  const shouldVueltas = shouldStartVueltas(gameState);
  if (shouldVueltas && !gameState.isVueltas) {
    return {
      ...gameState,
      isVueltas: true,
      initialScores: new Map(gameState.teams.map(t => [t.id, t.score])),
    };
  }

  return gameState;
}

/**
 * Check if this is the last trick of the game
 */
export function isLastTrick(
  deck: ReadonlyArray<Card>,
  hands: ReadonlyMap<PlayerId, ReadonlyArray<Card>>,
): boolean {
  const deckEmpty = deck.length === 0;
  const allHandsEmpty = Array.from(hands.values()).every(hand => hand.length === 0);
  const result = deckEmpty && allHandsEmpty;
  
  console.log('🃏 isLastTrick check:', {
    deckLength: deck.length,
    handSizes: Array.from(hands.values()).map(h => h.length),
    deckEmpty,
    allHandsEmpty,
    isLastTrick: result,
  });
  
  return result;
}

/**
 * Get fallback cards for arrastre phase when normal validation fails
 * This should rarely be needed with proper validation
 */
export function getArrastreFallbackCards(
  hand: readonly Card[],
  currentTrick: readonly TrickCard[],
  trumpSuit: SpanishSuit,
): Card[] {
  // If starting a trick, all cards should be valid
  if (currentTrick.length === 0) {
    console.warn('🔧 Arrastre fallback: Allowing all cards for trick start');
    return [...hand];
  }

  // Following in trick - must follow suit if possible
  const leadSuit = currentTrick[0].card.suit;
  const suitCards = hand.filter(c => c.suit === leadSuit);

  if (suitCards.length > 0) {
    console.warn('🔧 Arrastre fallback: Must follow suit - returning all suit cards');
    return suitCards;
  }

  // Can't follow suit - check for trumps
  const trumpCards = hand.filter(c => c.suit === trumpSuit);
  if (trumpCards.length > 0) {
    console.warn('🔧 Arrastre fallback: Must trump - returning all trumps');
    return trumpCards;
  }

  // No suit, no trumps - all cards are valid
  console.warn('🔧 Arrastre fallback: No suit or trump - returning all cards');
  return [...hand];
}
