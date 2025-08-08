import type { GameState, Card, PlayerId } from '../types/game.types';
import type { GameMove } from '../types/gameMove.types';
import { isValidPlay } from './gameLogic';

/**
 * Validate a game move before applying it
 */
export function isValidMove(gameState: GameState, move: GameMove): boolean {
  try {
    switch (move.type) {
      case 'play_card': {
        const playerHand = gameState.hands.get(move.playerId);
        if (!playerHand) return false;

        // Check if it's this player's turn
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.id !== move.playerId) return false;

        // Check if player has the card
        const hasCard = playerHand.some(c => c.id === move.data.cardId);
        if (!hasCard) return false;

        // Get the actual card
        const card = playerHand.find(c => c.id === move.data.cardId);
        if (!card) return false;

        // Check if the play is valid according to game rules
        return isValidPlay(
          card,
          playerHand,
          gameState.currentTrick,
          gameState.trumpSuit,
        );
      }

      case 'cambiar_7': {
        // Check if cambiar is allowed
        if (!gameState.canCambiar7) return false;

        // Check if it's this player's turn
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.id !== move.playerId) return false;

        // Check if player has the 7 of trump
        const playerHand = gameState.hands.get(move.playerId);
        if (!playerHand) return false;

        return playerHand.some(
          c => c.suit === gameState.trumpSuit && c.value === 2,
        );
      }

      case 'declare_cante': {
        // Check if it's playing phase
        if (gameState.phase !== 'playing') return false;

        // Check if player has the cards
        const playerHand = gameState.hands.get(move.playerId);
        if (!playerHand) return false;

        const hasKing = playerHand.some(
          c => c.suit === move.data.suit && c.value === 10,
        );
        const hasKnight = playerHand.some(
          c => c.suit === move.data.suit && c.value === 11,
        );

        return hasKing && hasKnight;
      }

      case 'declare_victory': {
        // Check if victory can be declared
        if (!gameState.canDeclareVictory) return false;

        // Check if it's the player's team
        const player = gameState.players.find(p => p.id === move.playerId);
        if (!player) return false;

        const team = gameState.teams.find(t => t.id === player.teamId);
        if (!team) return false;

        // Check if team has enough points
        return team.score >= 101;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('Error validating move:', error);
    return false;
  }
}

/**
 * Check if a player can make any valid move
 */
export function canPlayerMove(
  gameState: GameState,
  playerId: PlayerId,
): boolean {
  // Check if it's this player's turn
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return false;

  // Check if game is in playing phase
  if (gameState.phase !== 'playing') return false;

  const playerHand = gameState.hands.get(playerId);
  if (!playerHand || playerHand.length === 0) return false;

  // Check if any card can be played
  return playerHand.some(card =>
    isValidPlay(card, playerHand, gameState.currentTrick, gameState.trumpSuit),
  );
}

/**
 * Get all valid moves for a player
 */
export function getValidMoves(
  gameState: GameState,
  playerId: PlayerId,
): GameMove[] {
  const moves: GameMove[] = [];

  // Check if it's this player's turn
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return moves;

  const playerHand = gameState.hands.get(playerId);
  if (!playerHand) return moves;

  // Add valid card plays
  playerHand.forEach(card => {
    if (
      isValidPlay(card, playerHand, gameState.currentTrick, gameState.trumpSuit)
    ) {
      moves.push({
        type: 'play_card',
        playerId,
        data: { cardId: card.id },
        timestamp: Date.now(),
      });
    }
  });

  // Add cambiar 7 if possible
  if (
    gameState.canCambiar7 &&
    playerHand.some(c => c.suit === gameState.trumpSuit && c.value === 2)
  ) {
    moves.push({
      type: 'cambiar_7',
      playerId,
      data: {},
      timestamp: Date.now(),
    });
  }

  // Add cante declarations if possible
  const suits = ['oros', 'copas', 'espadas', 'bastos'] as const;
  suits.forEach(suit => {
    const hasKing = playerHand.some(c => c.suit === suit && c.value === 10);
    const hasKnight = playerHand.some(c => c.suit === suit && c.value === 11);
    if (hasKing && hasKnight) {
      moves.push({
        type: 'declare_cante',
        playerId,
        data: { suit },
        timestamp: Date.now(),
      });
    }
  });

  // Add victory declaration if possible
  if (gameState.canDeclareVictory) {
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
      const team = gameState.teams.find(t => t.id === player.teamId);
      if (team && team.score >= 101) {
        moves.push({
          type: 'declare_victory',
          playerId,
          data: {},
          timestamp: Date.now(),
        });
      }
    }
  }

  return moves;
}
