import { useCallback } from 'react';
import type { GameState, Card, PlayerId } from '../types/game.types';
import type { GameMove } from '../types/gameMove.types';
import type { SpanishSuit } from '../types/cardTypes';

interface UseGameActionsProps {
  gameState: GameState | null;
  userId?: string;
  sendMove: (move: GameMove) => Promise<boolean>;
}

export function useGameActions({ gameState, userId, sendMove }: UseGameActionsProps) {
  const playCard = useCallback(
    async (card: Card): Promise<boolean> => {
      if (!gameState || !userId) return false;

      const move: GameMove = {
        type: 'play_card',
        playerId: userId as PlayerId,
        data: { cardId: card.id },
        timestamp: Date.now(),
      };

      return sendMove(move);
    },
    [gameState, userId, sendMove],
  );

  const cambiar7 = useCallback(async (): Promise<boolean> => {
    if (!gameState || !userId) return false;

    const move: GameMove = {
      type: 'cambiar_7',
      playerId: userId as PlayerId,
      data: {},
      timestamp: Date.now(),
    };

    return sendMove(move);
  }, [gameState, userId, sendMove]);

  const declareCante = useCallback(
    async (suit: SpanishSuit): Promise<boolean> => {
      if (!gameState || !userId) return false;

      const move: GameMove = {
        type: 'declare_cante',
        playerId: userId as PlayerId,
        data: { suit },
        timestamp: Date.now(),
      };

      return sendMove(move);
    },
    [gameState, userId, sendMove],
  );

  const declareVictory = useCallback(async (): Promise<boolean> => {
    if (!gameState || !userId) return false;

    const move: GameMove = {
      type: 'declare_victory',
      playerId: userId as PlayerId,
      data: {},
      timestamp: Date.now(),
    };

    return sendMove(move);
  }, [gameState, userId, sendMove]);

  // Check if player can perform actions
  const canCambiar7 = useCallback((): boolean => {
    if (!gameState || !userId) return false;
    if (!gameState.canCambiar7) return false;

    const playerHand = gameState.hands.get(userId as PlayerId);
    if (!playerHand) return false;

    return playerHand.some(card => card.suit === gameState.trumpSuit && card.value === 2);
  }, [gameState, userId]);

  const canDeclareCante = useCallback(
    (suit: SpanishSuit): boolean => {
      if (!gameState || !userId) return false;
      if (gameState.phase !== 'playing') return false;

      const playerHand = gameState.hands.get(userId as PlayerId);
      if (!playerHand) return false;

      const hasKing = playerHand.some(c => c.suit === suit && c.value === 10);
      const hasKnight = playerHand.some(c => c.suit === suit && c.value === 11);

      return hasKing && hasKnight;
    },
    [gameState, userId],
  );

  const canDeclareVictory = useCallback((): boolean => {
    if (!gameState || !userId || !gameState.canDeclareVictory) return false;

    const player = gameState.players.find(p => p.id === userId);
    if (!player) return false;

    const team = gameState.teams.find(t => t.id === player.teamId);
    return team ? team.score >= 101 : false;
  }, [gameState, userId]);

  return {
    playCard,
    cambiar7,
    declareCante,
    declareVictory,
    canCambiar7,
    canDeclareCante,
    canDeclareVictory,
  };
}
