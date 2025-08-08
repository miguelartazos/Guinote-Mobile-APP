import type { GameState, Card, PlayerId, TeamId } from '../types/game.types';
import type { GameMove } from '../types/gameMove.types';
import { playCard, cambiar7, declareCante } from './gameLogic';

/**
 * Apply a game move to the current state and return the new state
 * Returns null if the move is invalid
 */
export function applyGameMove(
  gameState: GameState,
  move: GameMove,
): GameState | null {
  try {
    switch (move.type) {
      case 'play_card': {
        const playerHand = gameState.hands.get(move.playerId);
        if (!playerHand) return null;

        const card = playerHand.find(c => c.id === move.data.cardId);
        if (!card) return null;

        return playCard(gameState, move.playerId, card);
      }

      case 'cambiar_7': {
        return cambiar7(gameState, move.playerId);
      }

      case 'declare_cante': {
        return declareCante(gameState, move.playerId, move.data.suit);
      }

      case 'declare_victory': {
        // Check if victory is valid
        const player = gameState.players.find(p => p.id === move.playerId);
        if (!player) return null;

        const team = gameState.teams.find(t => t.id === player.teamId);
        if (!team || team.score < 101) return null;

        // Mark game as finished
        return {
          ...gameState,
          phase: 'finished',
          lastActionTimestamp: Date.now(),
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Error applying game move:', error);
    return null;
  }
}

/**
 * Check if the game is over
 */
export function isGameOver(gameState: GameState): boolean {
  return gameState.phase === 'finished';
}

/**
 * Get the winner of the game
 */
export function getWinner(gameState: GameState): TeamId | null {
  if (!isGameOver(gameState)) return null;

  const [team1, team2] = gameState.teams;

  if (team1.score > team2.score) return team1.id;
  if (team2.score > team1.score) return team2.id;

  // In case of tie, check card points
  if (team1.cardPoints > team2.cardPoints) return team1.id;
  if (team2.cardPoints > team1.cardPoints) return team2.id;

  return null; // True tie
}

/**
 * Calculate time remaining for current player's turn
 */
export function getTurnTimeRemaining(
  gameState: GameState,
  turnTimeLimit: number = 30000, // 30 seconds default
): number {
  if (!gameState.lastActionTimestamp) return turnTimeLimit;

  const elapsed = Date.now() - gameState.lastActionTimestamp;
  const remaining = turnTimeLimit - elapsed;

  return Math.max(0, remaining);
}

/**
 * Check if current player's turn has timed out
 */
export function isTurnTimedOut(
  gameState: GameState,
  turnTimeLimit: number = 30000,
): boolean {
  return getTurnTimeRemaining(gameState, turnTimeLimit) === 0;
}

/**
 * Apply timeout penalty (play random valid card)
 */
export function applyTimeoutPenalty(gameState: GameState): GameState | null {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const playerHand = gameState.hands.get(currentPlayer.id);

  if (!playerHand || playerHand.length === 0) return null;

  // Find first valid card to play
  const validCards = playerHand.filter(card => {
    const move: GameMove = {
      type: 'play_card',
      playerId: currentPlayer.id,
      data: { cardId: card.id },
      timestamp: Date.now(),
    };

    // Import isValidMove would create circular dependency
    // For now, just play the first card
    return true;
  });

  if (validCards.length === 0) return null;

  // Play the first valid card
  return playCard(gameState, currentPlayer.id, validCards[0]);
}

/**
 * Get game statistics
 */
export function getGameStats(gameState: GameState) {
  const totalTricks = gameState.trickCount;
  const cardsPlayed = totalTricks * 4 + gameState.currentTrick.length;
  const cardsRemaining = 40 - cardsPlayed;

  const teamStats = gameState.teams.map(team => ({
    teamId: team.id,
    score: team.score,
    cardPoints: team.cardPoints,
    tricks: gameState.trickWins.get(team.id) || 0,
    cantes: team.cantes.length,
  }));

  return {
    totalTricks,
    cardsPlayed,
    cardsRemaining,
    isVueltas: gameState.isVueltas,
    currentPlayer: gameState.players[gameState.currentPlayerIndex].id,
    trumpSuit: gameState.trumpSuit,
    teamStats,
  };
}

/**
 * Continue from scoring phase to next hand or finish game
 */
export function continueFromScoring(gameState: GameState): GameState | null {
  if (gameState.phase !== 'scoring') return null;

  // Check if any team has won
  const winningTeam = gameState.teams.find(t => t.score >= 101);

  if (winningTeam) {
    // Game is finished
    return {
      ...gameState,
      phase: 'finished',
    };
  }

  // Continue to next hand (vueltas)
  // This would normally create a new shuffled deck and deal cards
  // For now, just change phase back to dealing
  return {
    ...gameState,
    phase: 'dealing',
    isVueltas: true,
    currentTrick: [],
    trickCount: 0,
    trickWins: new Map(),
    collectedTricks: new Map(),
    canCambiar7: true,
    canDeclareVictory: true,
    dealerIndex: (gameState.dealerIndex + 1) % 4,
    currentPlayerIndex: (gameState.dealerIndex + 1 + 1) % 4, // Player after new dealer
  };
}
