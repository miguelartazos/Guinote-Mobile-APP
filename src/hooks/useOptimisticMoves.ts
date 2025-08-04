import { useState, useCallback } from 'react';
import type { GameState } from '../types/game.types';
import type { GameMove } from '../types/gameMove.types';
import { applyGameMove } from '../utils/gameEngine';

interface OptimisticMove {
  move: GameMove;
  previousState: GameState;
  optimisticState: GameState;
}

export function useOptimisticMoves() {
  const [optimisticMoves, setOptimisticMoves] = useState<OptimisticMove[]>([]);

  const applyOptimisticMove = useCallback(
    (gameState: GameState, move: GameMove): GameState | null => {
      const newState = applyGameMove(gameState, move);

      if (newState) {
        setOptimisticMoves(prev => [
          ...prev,
          {
            move,
            previousState: gameState,
            optimisticState: newState,
          },
        ]);
      }

      return newState;
    },
    [],
  );

  const rollbackMove = useCallback((move: GameMove) => {
    setOptimisticMoves(prev => {
      const index = prev.findIndex(
        om =>
          om.move.playerId === move.playerId &&
          om.move.timestamp === move.timestamp,
      );

      if (index !== -1) {
        return prev.slice(0, index);
      }

      return prev;
    });
  }, []);

  const clearOptimisticMoves = useCallback(() => {
    setOptimisticMoves([]);
  }, []);

  const getOptimisticState = useCallback(
    (baseState: GameState): GameState => {
      return optimisticMoves.reduce(
        (state, om) => om.optimisticState,
        baseState,
      );
    },
    [optimisticMoves],
  );

  return {
    optimisticMoves,
    applyOptimisticMove,
    rollbackMove,
    clearOptimisticMoves,
    getOptimisticState,
  };
}
