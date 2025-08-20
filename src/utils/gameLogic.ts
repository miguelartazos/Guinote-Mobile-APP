import type {
  Card,
  CardId,
  PlayerId,
  GameState,
  TrickCard,
  TeamId,
  Cante,
  GamePhase,
  MatchScore,
  TeamIndex,
} from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';
import { CARD_POINTS } from '../types/game.types';
import { resetGameStateForVueltas } from './gameStateFactory';
import { validateGameState } from './gameStateValidator';

// Export constants for reuse
export const SPANISH_SUITS: SpanishSuit[] = ['espadas', 'bastos', 'oros', 'copas'];
export const CARD_VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const CARD_POWER: CardValue[] = [1, 3, 12, 10, 11, 7, 6, 5, 4, 2];
export const WINNING_SCORE = 101;
export const DEFAULT_PARTIDAS_PER_COTO = 3;
export const DEFAULT_COTOS_PER_MATCH = 2;

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
  currentPlayerId?: PlayerId,
  gameState?: GameState,
): boolean {
  // First card of trick is always valid
  if (currentTrick.length === 0) return true;

  // In Draw Phase (Fase de Robo), players can play ANY card
  if (gamePhase === 'playing') {
    return true; // Complete freedom in draw phase
  }

  const leadCard = currentTrick[0].card;
  const leadSuit = leadCard.suit;

  // ARRASTRE PHASE ONLY: Must follow suit if possible
  const hasSuit = hand.some(c => c.suit === leadSuit);
  if (hasSuit && card.suit !== leadSuit) return false;

  // In arrastre phase, additional rules apply
  if (gamePhase === 'arrastre') {
    // If we don't have full game state info, just check basic rules
    if (!currentPlayerId || !gameState) {
      return true; // Allow the play if we can't validate properly
    }

    // Check if partner is currently winning the trick
    let partnerIsWinning = false;
    if (currentTrick.length > 0) {
      const currentWinnerId = calculateTrickWinner(currentTrick, trumpSuit);
      const currentPlayerTeam = findPlayerTeam(currentPlayerId, gameState);
      const winnerTeam = findPlayerTeam(currentWinnerId, gameState);
      partnerIsWinning = currentPlayerTeam === winnerTeam && currentWinnerId !== currentPlayerId;
    }

    // RULE: Cannot "montarse" - can't beat partner's winning card
    if (partnerIsWinning && card.suit === leadSuit) {
      const canBeat = canBeatTrick(card, currentTrick, trumpSuit);
      if (canBeat) return false; // Would beat partner - not allowed
    }

    // If following suit, must beat if possible (unless partner is winning)
    if (card.suit === leadSuit && !partnerIsWinning) {
      const suitCards = hand.filter(c => c.suit === leadSuit);
      const canBeat = suitCards.some(c => canBeatTrick(c, currentTrick, trumpSuit));

      if (canBeat && !canBeatTrick(card, currentTrick, trumpSuit)) {
        // Has a card that can beat but playing one that doesn't
        return false;
      }
    }

    // If can't follow suit, must trump if possible (unless partner is winning)
    if (!hasSuit && card.suit !== trumpSuit && !partnerIsWinning) {
      const hasTrump = hand.some(c => c.suit === trumpSuit);
      if (hasTrump) return false;
    }

    // If trumping, must beat other trumps if possible (unless partner is winning)
    if (!hasSuit && card.suit === trumpSuit && !partnerIsWinning) {
      const trumpCards = hand.filter(c => c.suit === trumpSuit);
      const canBeatWithTrump = trumpCards.some(c => canBeatTrick(c, currentTrick, trumpSuit));

      if (canBeatWithTrump && !canBeatTrick(card, currentTrick, trumpSuit)) {
        return false;
      }
    }

    return true;
  }

  // This code should never be reached (only 'playing' and 'arrastre' phases)
  return true;
}

export function calculateTrickWinner(
  trick: readonly TrickCard[],
  trumpSuit: SpanishSuit,
): PlayerId {
  if (trick.length === 0) throw new Error('Cannot calculate winner of empty trick');

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
    10: 7, // Sota (higher than Caballo in Guiñote)
    11: 6, // Caballo (lower than Sota in Guiñote)
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

export function calculateCantePoints(suit: SpanishSuit, trumpSuit: SpanishSuit): 20 | 40 {
  return suit === trumpSuit ? 40 : 20;
}

export function canCambiar7(hand: readonly Card[], trumpCard: Card, deckSize: number): boolean {
  // Can only exchange if there are cards left in deck
  if (deckSize === 0) return false;

  // Can only exchange if trump card is not a 7
  if (trumpCard.value === 7) return false;

  // Must have 7 of trump suit
  return hand.some(c => c.suit === trumpCard.suit && c.value === 7);
}

export function getNextPlayerIndex(currentIndex: number, totalPlayers: number): number {
  // Counter-clockwise: 0 -> 3 -> 2 -> 1 -> 0
  return (currentIndex - 1 + totalPlayers) % totalPlayers;
}

export function findPlayerTeam(playerId: PlayerId, gameState: GameState): TeamId | undefined {
  const team = gameState.teams.find(t => t.playerIds.includes(playerId));
  return team?.id;
}

export function shouldStartVueltas(gameState: GameState): boolean {
  // Check if no team has reached 101 points
  const noWinner = !gameState.teams.some(team => team.score >= 101);

  // Check if all cards have been played
  const allHandsEmpty = Array.from(gameState.hands.values()).every(hand => hand.length === 0);
  const deckEmpty = gameState.deck.length === 0;

  return noWinner && allHandsEmpty && deckEmpty && !gameState.isVueltas;
}

export function canDeclareVictory(teamId: TeamId, gameState: GameState): boolean {
  if (!gameState.isVueltas || !gameState.initialScores) return false;

  const team = gameState.teams.find(t => t.id === teamId);
  const otherTeam = gameState.teams.find(t => t.id !== teamId);
  if (!team || !otherTeam) return false;

  // Team must have won the last trick in the first hand to declare victory
  if (gameState.lastTrickWinnerTeam !== teamId) return false;

  // Calculate total scores (initial + current)
  const teamTotal = (gameState.initialScores.get(teamId) || 0) + team.score;
  const otherTeamTotal = (gameState.initialScores.get(otherTeam.id) || 0) + otherTeam.score;

  // Win if:
  // 1. Total score >= 101 (not just > 100)
  // 2. Have more total points than opponent
  // 3. In case of tie, the team that won last trick in first hand wins
  return (
    teamTotal >= 101 &&
    (teamTotal > otherTeamTotal ||
      (teamTotal === otherTeamTotal && gameState.lastTrickWinnerTeam === teamId))
  );
}

export function determineVueltasWinner(gameState: GameState): TeamId | null {
  if (!gameState.isVueltas || !gameState.initialScores) return null;

  const team1 = gameState.teams[0];
  const team2 = gameState.teams[1];

  // Calculate total scores (initial + current)
  const team1Total = (gameState.initialScores.get(team1.id) || 0) + team1.score;
  const team2Total = (gameState.initialScores.get(team2.id) || 0) + team2.score;

  // Determine winner
  if (team1Total > team2Total) {
    return team1.id;
  } else if (team2Total > team1Total) {
    return team2.id;
  } else {
    // In case of tie, team that won last trick in first hand wins
    return gameState.lastTrickWinnerTeam || null;
  }
}

export function isGameOver(gameState: GameState): boolean {
  return gameState.teams.some(team => {
    // Must have 101+ points AND at least 30 points from cards (30 malas rule)
    return team.score >= 101 && team.cardPoints >= 30;
  });
}

export function calculateFinalPoints(gameState: GameState): Map<TeamId, number> {
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
// Get all valid cards that can be played in current game state
export function getValidCards(
  hand: readonly Card[],
  gameState: GameState,
  playerId: PlayerId,
): Card[] {
  const { currentTrick, trumpSuit, phase } = gameState;

  // In draw phase (Fase de Robo), all cards are valid
  if (phase === 'playing') {
    return [...hand];
  }

  // In arrastre phase, filter cards based on strict rules
  if (phase === 'arrastre') {
    const validCards = hand.filter(card =>
      isValidPlay(card, hand, currentTrick, trumpSuit, phase, playerId, gameState),
    );

    // If no cards are valid (shouldn't happen with correct rules), log error and return all cards
    if (validCards.length === 0 && hand.length > 0) {
      console.error('⚠️ No valid cards in arrastre! This should not happen.', {
        playerId,
        handSize: hand.length,
        trickSize: currentTrick.length,
        phase,
      });
      // Return all cards as fallback to prevent game from getting stuck
      return [...hand];
    }

    return validCards;
  }

  // Default: return all cards
  return [...hand];
}

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

// Validate if a number is a valid team index
export function isValidTeamIndex(index: number): index is TeamIndex {
  return index === 0 || index === 1;
}

// Match progression functions for Cotos and Partidas
export function checkPartidaWon(teamScore: number): boolean {
  return teamScore >= WINNING_SCORE;
}

export function checkCotoWon(partidas: number, partidasPerCoto: number): boolean {
  return partidas >= partidasPerCoto;
}

export function checkMatchWon(cotos: number, cotosPerMatch: number): boolean {
  return cotos >= cotosPerMatch;
}

export function createInitialMatchScore(): MatchScore {
  return {
    team1Partidas: 0,
    team2Partidas: 0,
    team1Cotos: 0,
    team2Cotos: 0,
    partidasPerCoto: DEFAULT_PARTIDAS_PER_COTO,
    cotosPerMatch: DEFAULT_COTOS_PER_MATCH,
    // Legacy compatibility
    team1Sets: 0,
    team2Sets: 0,
    currentSet: 'buenas',
  };
}

export function updateMatchScoreForPartida(
  matchScore: MatchScore,
  winningTeamIndex: TeamIndex,
): MatchScore {
  const newScore = { ...matchScore };

  // Award partida to winning team
  if (winningTeamIndex === 0) {
    newScore.team1Partidas++;
    newScore.team1Sets = newScore.team1Partidas; // Legacy compatibility
  } else {
    newScore.team2Partidas++;
    newScore.team2Sets = newScore.team2Partidas; // Legacy compatibility
  }

  // Check if team1 won the coto
  if (checkCotoWon(newScore.team1Partidas, newScore.partidasPerCoto)) {
    return {
      ...newScore,
      team1Cotos: newScore.team1Cotos + 1,
      team1Partidas: 0,
      team2Partidas: 0,
      team1Sets: 0, // Reset legacy
      team2Sets: 0,
      currentSet: 'buenas',
    };
  }

  // Check if team2 won the coto
  if (checkCotoWon(newScore.team2Partidas, newScore.partidasPerCoto)) {
    return {
      ...newScore,
      team2Cotos: newScore.team2Cotos + 1,
      team1Partidas: 0,
      team2Partidas: 0,
      team1Sets: 0, // Reset legacy
      team2Sets: 0,
      currentSet: 'buenas',
    };
  }

  // Update current set name based on partida count
  if (newScore.team1Partidas === 1 && newScore.team2Partidas === 1) {
    newScore.currentSet = 'bella';
  } else if (newScore.team1Partidas > 0 || newScore.team2Partidas > 0) {
    newScore.currentSet = 'malas';
  } else {
    newScore.currentSet = 'buenas';
  }

  return newScore;
}

export function isMatchComplete(matchScore: MatchScore): boolean {
  return (
    checkMatchWon(matchScore.team1Cotos, matchScore.cotosPerMatch) ||
    checkMatchWon(matchScore.team2Cotos, matchScore.cotosPerMatch)
  );
}

export function getMatchWinner(matchScore: MatchScore): 0 | 1 | null {
  if (checkMatchWon(matchScore.team1Cotos, matchScore.cotosPerMatch)) {
    return 0;
  }
  if (checkMatchWon(matchScore.team2Cotos, matchScore.cotosPerMatch)) {
    return 1;
  }
  return null;
}

export function migrateMatchScore(oldScore?: Partial<MatchScore>): MatchScore {
  if (!oldScore) {
    return createInitialMatchScore();
  }

  return {
    team1Partidas: oldScore.team1Partidas ?? oldScore.team1Sets ?? 0,
    team2Partidas: oldScore.team2Partidas ?? oldScore.team2Sets ?? 0,
    team1Cotos: oldScore.team1Cotos ?? 0,
    team2Cotos: oldScore.team2Cotos ?? 0,
    partidasPerCoto: oldScore.partidasPerCoto ?? DEFAULT_PARTIDAS_PER_COTO,
    cotosPerMatch: oldScore.cotosPerMatch ?? DEFAULT_COTOS_PER_MATCH,
    // Legacy fields
    team1Sets: oldScore.team1Sets ?? oldScore.team1Partidas ?? 0,
    team2Sets: oldScore.team2Sets ?? oldScore.team2Partidas ?? 0,
    currentSet: oldScore.currentSet ?? 'buenas',
  };
}

export function updateMatchScoreAndDeterminePhase(
  winningTeamIndex: TeamIndex,
  matchScore: MatchScore,
): { matchScore: MatchScore; phase: GamePhase } {
  // Update match score for this partida win
  const updatedMatchScore = updateMatchScoreForPartida(matchScore, winningTeamIndex);

  // Determine if the entire match is complete
  const phase: GamePhase = isMatchComplete(updatedMatchScore) ? 'gameOver' : 'scoring';

  return { matchScore: updatedMatchScore, phase };
}

export function startNewPartida(previousState: GameState, matchScore: MatchScore): GameState {
  // Create initial scores map from match score
  const initialScores = new Map<TeamId, number>();
  initialScores.set('team1' as TeamId, 0);
  initialScores.set('team2' as TeamId, 0);

  // Use the existing vueltas reset function to start a new partida
  const resetState = resetGameStateForVueltas(previousState, initialScores);

  // Return a new immutable state object with scores reset to 0
  return {
    ...resetState,
    phase: 'dealing' as GamePhase,
    isVueltas: false,
    initialScores: undefined,
    matchScore, // Preserve the match score
    teams: resetState.teams.map(team => ({
      ...team,
      score: 0, // Reset score for new partida
    })) as GameState['teams'],
  };
}

/**
 * Play a card from player's hand
 */
export function playCard(gameState: GameState, playerId: PlayerId, card: Card): GameState | null {
  // Validate that it's the player's turn
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    console.warn('Not player turn');
    return null;
  }

  // Get player's hand
  const playerHand = gameState.hands.get(playerId);
  if (!playerHand) {
    console.warn('Player hand not found');
    return null;
  }

  // Check if player has the card
  const cardIndex = playerHand.findIndex(c => c.id === card.id);
  if (cardIndex === -1) {
    console.warn('Card not in hand');
    return null;
  }

  // Validate the play
  if (
    !isValidPlay(
      card,
      playerHand,
      gameState.currentTrick,
      gameState.trumpSuit,
      gameState.phase,
      playerId,
      gameState,
    )
  ) {
    console.warn('Invalid play');
    return null;
  }

  // Remove card from player's hand
  const newHands = new Map(gameState.hands);
  const newPlayerHand = [...playerHand];
  newPlayerHand.splice(cardIndex, 1);
  newHands.set(playerId, newPlayerHand);

  // Add card to current trick
  const newTrick: TrickCard[] = [...gameState.currentTrick, { playerId, card }];

  // Check if trick is complete
  if (newTrick.length === 4) {
    // Calculate winner and points
    const winnerId = calculateTrickWinner(newTrick, gameState.trumpSuit);
    const points = calculateTrickPoints(newTrick);
    const winnerTeam = findPlayerTeam(winnerId, gameState);

    // Update scores
    const newTeams = [...gameState.teams] as [Team, Team];
    const teamIndex = newTeams.findIndex(t => t.id === winnerTeam);
    if (teamIndex !== -1) {
      newTeams[teamIndex] = {
        ...newTeams[teamIndex],
        score: newTeams[teamIndex].score + points,
        cardPoints: newTeams[teamIndex].cardPoints + points,
      };
    }

    // Update collected tricks
    const newCollectedTricks = new Map(gameState.collectedTricks);
    const winnerTricks = newCollectedTricks.get(winnerId) || [];
    newCollectedTricks.set(winnerId, [...winnerTricks, newTrick]);

    // Deal new cards if deck has cards (only in playing phase)
    let newDeck = [...gameState.deck];
    let newPhase = gameState.phase;

    if (newDeck.length > 0 && gameState.phase === 'playing') {
      // Winner draws first, then counter-clockwise
      const drawOrder = [winnerId];
      let nextIndex = gameState.players.findIndex(p => p.id === winnerId);
      for (let i = 0; i < 3; i++) {
        nextIndex = getNextPlayerIndex(nextIndex, 4);
        drawOrder.push(gameState.players[nextIndex].id);
      }

      // Deal cards
      drawOrder.forEach(pId => {
        if (newDeck.length > 0) {
          const drawnCard = newDeck.pop();
          if (drawnCard) {
            const playerCards = [...(newHands.get(pId) || [])];
            playerCards.push(drawnCard);
            newHands.set(pId, playerCards);
          }
        }
      });

      // Transition to arrastre if deck is empty
      if (newDeck.length === 0) {
        newPhase = 'arrastre';
      }
    }

    // Check if this is the last trick
    const isLastTrick =
      newDeck.length === 0 && Array.from(newHands.values()).every(hand => hand.length === 0);

    // Award last trick bonus
    if (isLastTrick) {
      const teamIdx = newTeams.findIndex(t => t.id === winnerTeam);
      if (teamIdx !== -1) {
        newTeams[teamIdx] = {
          ...newTeams[teamIdx],
          score: newTeams[teamIdx].score + 10,
        };
      }
    }

    // Winner starts next trick
    const winnerIndex = gameState.players.findIndex(p => p.id === winnerId);

    // Determine phase
    if (isGameOver({ ...gameState, teams: newTeams })) {
      newPhase = 'gameOver';
    } else if (isLastTrick) {
      newPhase = 'scoring';
    }

    const newState = {
      ...gameState,
      hands: newHands,
      deck: newDeck,
      currentTrick: [], // Clear trick after completion
      currentPlayerIndex: winnerIndex,
      teams: newTeams,
      trickCount: gameState.trickCount + 1,
      collectedTricks: newCollectedTricks,
      lastTrickWinner: winnerId,
      lastTrick: newTrick,
      phase: newPhase,
      canCambiar7: newPhase === 'arrastre' ? false : gameState.canCambiar7,
      lastActionTimestamp: Date.now(),
    };

    // Validate in development
    if (process.env.NODE_ENV === 'development') {
      const validation = validateGameState(newState);
      if (!validation.isValid) {
        console.error('Invalid state after trick completion:', validation.errors);
      }
    }

    return newState;
  }

  // Trick not complete, next player's turn
  const nextPlayerIndex = getNextPlayerIndex(gameState.currentPlayerIndex, 4);

  return {
    ...gameState,
    hands: newHands,
    currentTrick: newTrick,
    currentPlayerIndex: nextPlayerIndex,
    lastActionTimestamp: Date.now(),
  };
}

/**
 * Exchange 7 of trumps with the trump card
 */
export function cambiar7(gameState: GameState, playerId: PlayerId): GameState | null {
  // Validate phase and ability
  if (gameState.phase !== 'playing' || !gameState.canCambiar7) {
    return null;
  }

  // Check if it's after winning a trick
  const lastWinner = gameState.lastTrickWinner;
  if (!lastWinner) {
    return null;
  }

  const lastWinnerTeam = findPlayerTeam(lastWinner, gameState);
  const playerTeam = findPlayerTeam(playerId, gameState);
  if (lastWinnerTeam !== playerTeam || gameState.currentTrick.length !== 0) {
    return null;
  }

  // Get player's hand
  const playerHand = gameState.hands.get(playerId);
  if (!playerHand) {
    return null;
  }

  // Check if player has 7 of trumps
  if (!canCambiar7(playerHand, gameState.trumpCard, gameState.deck.length)) {
    return null;
  }

  // Find and remove 7 of trump
  const newHands = new Map(gameState.hands);
  const newPlayerHand = [...playerHand];
  const sevenIndex = newPlayerHand.findIndex(c => c.suit === gameState.trumpSuit && c.value === 7);

  if (sevenIndex === -1) {
    return null;
  }

  const seven = newPlayerHand[sevenIndex];
  newPlayerHand.splice(sevenIndex, 1);
  newPlayerHand.push(gameState.trumpCard);
  newHands.set(playerId, newPlayerHand);

  // Update deck if needed
  const newDeck = [...gameState.deck];
  if (newDeck.length > 0) {
    newDeck[newDeck.length - 1] = seven;
  }

  return {
    ...gameState,
    hands: newHands,
    trumpCard: seven,
    canCambiar7: false,
    deck: newDeck,
    lastActionTimestamp: Date.now(),
  };
}

/**
 * Declare cante (Rey + Sota of same suit)
 */
export function declareCante(
  gameState: GameState,
  playerId: PlayerId,
  suit: SpanishSuit,
): GameState | null {
  // Validate phase
  if (gameState.phase !== 'playing') {
    return null;
  }

  // Check if team won last trick and trick hasn't started
  const lastWinner = gameState.lastTrickWinner;
  if (!lastWinner || gameState.currentTrick.length !== 0) {
    return null;
  }

  const lastWinnerTeam = findPlayerTeam(lastWinner, gameState);
  const playerTeam = findPlayerTeam(playerId, gameState);
  if (lastWinnerTeam !== playerTeam) {
    return null;
  }

  // Get player's hand and team
  const playerHand = gameState.hands.get(playerId);
  if (!playerHand || !playerTeam) {
    return null;
  }

  const team = gameState.teams.find(t => t.id === playerTeam);
  if (!team) {
    return null;
  }

  // Check if can cante this suit
  const cantableSuits = canCantar(playerHand, gameState.trumpSuit, team.cantes);
  if (!cantableSuits.includes(suit)) {
    return null;
  }

  // Calculate points
  const points = calculateCantePoints(suit, gameState.trumpSuit);

  // Update team score and cantes
  const newTeams = [...gameState.teams] as [Team, Team];
  const teamIndex = newTeams.findIndex(t => t.id === playerTeam);
  if (teamIndex !== -1) {
    newTeams[teamIndex] = {
      ...newTeams[teamIndex],
      score: newTeams[teamIndex].score + points,
      cantes: [
        ...newTeams[teamIndex].cantes,
        {
          teamId: playerTeam,
          suit,
          points,
          isVisible: points === 20,
        },
      ],
    };
  }

  // Check if game is over
  const newPhase = isGameOver({ ...gameState, teams: newTeams }) ? 'gameOver' : 'playing';

  return {
    ...gameState,
    teams: newTeams,
    phase: newPhase,
    lastActionTimestamp: Date.now(),
  };
}
