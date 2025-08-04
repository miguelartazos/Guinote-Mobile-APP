import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  GameState,
  Card,
  PlayerId,
  DifficultyLevel,
} from '../types/game.types';
import type { GameMove } from '../types/gameMove.types';
import { serializeGameState } from '../utils/gameStateAdapter';
import { continueFromScoring } from '../utils/gameEngine';
// useRealtimeGame removed - using Convex
import { useConvexGame } from './useConvexGame';
import { useGameState } from './useGameState';
import type { Id } from '../../convex/_generated/dataModel';
import { useOptimisticMoves } from './useOptimisticMoves';
import { useMoveQueue } from './useMoveQueue';
import { useGameActions } from './useGameActions';

interface UseNetworkGameStateProps {
  gameMode: 'offline' | 'online' | 'local-multiplayer';
  roomId?: string;
  userId?: string;
  playerName: string;
  difficulty?: DifficultyLevel;
  playerNames?: string[]; // For local multiplayer
}

/**
 * Main hook for game state management
 * Handles both offline and online modes with a clean interface
 */
export function useNetworkGameState({
  gameMode,
  roomId,
  userId,
  playerName,
  difficulty = 'medium',
  playerNames,
}: UseNetworkGameStateProps) {
  // For offline mode, use the existing hook
  if (gameMode === 'offline' || gameMode === 'local-multiplayer') {
    return useGameState({ playerName, difficulty, playerNames });
  }

  // Online mode: compose multiple hooks
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isDealingComplete, setIsDealingComplete] = useState(false);
  const [localGameState, setLocalGameState] = useState<GameState | null>(null);

  // Real-time game connection using Convex
  const { room, actions } = useConvexGame(roomId as Id<'rooms'> | undefined);

  const remoteGameState = room?.gameState || null;
  const remotePlayers = room?.players || [];
  const isConnected = !!room;
  const isLoading = false;
  const error = null;
  // These actions don't exist yet - need to implement or use existing actions
  const updateRemote = async (state: GameState) => {
    console.warn(
      'updateRemote not implemented - state updates should happen through game actions',
    );
  };
  const sendMoveToServer = async (move: GameMove) => {
    // Map move to appropriate action
    if (move.type === 'PLAY_CARD' && userId) {
      await actions.playCard(move.cardId, userId as Id<'users'>);
      return true;
    }
    console.warn('Move type not implemented:', move.type);
    return false;
  };

  // Optimistic move handling
  const {
    optimisticMoves,
    applyOptimisticMove,
    rollbackMove,
    clearOptimisticMoves,
  } = useOptimisticMoves();

  // Move queue for offline handling
  const { queueMove, processQueue } = useMoveQueue();

  // Sync remote state to local
  useEffect(() => {
    if (remoteGameState) {
      setLocalGameState(remoteGameState);
      clearOptimisticMoves();
    }
  }, [remoteGameState, clearOptimisticMoves]);

  // Send move with optimistic update and queueing
  const sendMove = useCallback(
    async (move: GameMove): Promise<boolean> => {
      if (!localGameState) return false;

      // Apply optimistically
      const newState = applyOptimisticMove(localGameState, move);
      if (newState) {
        setLocalGameState(newState);
      }

      if (!isConnected) {
        queueMove(move);
        return false;
      }

      try {
        const success = await sendMoveToServer(move);
        if (!success) {
          rollbackMove(move);
          if (remoteGameState) {
            setLocalGameState(remoteGameState);
          }
        }
        return success;
      } catch (error) {
        console.error('Failed to send move:', error);
        rollbackMove(move);
        if (remoteGameState) {
          setLocalGameState(remoteGameState);
        }
        return false;
      }
    },
    [
      localGameState,
      isConnected,
      applyOptimisticMove,
      sendMoveToServer,
      rollbackMove,
      queueMove,
      remoteGameState,
    ],
  );

  // Process queued moves when reconnected
  useEffect(() => {
    if (isConnected) {
      processQueue(sendMove);
    }
  }, [isConnected, processQueue, sendMove]);

  // Game actions
  const gameActions = useGameActions({
    gameState: localGameState,
    userId,
    sendMove,
  });

  // Helper functions
  const getCurrentPlayerHand = useCallback((): Card[] => {
    if (!localGameState || !userId) return [];
    return [...(localGameState.hands.get(userId as PlayerId) || [])];
  }, [localGameState, userId]);

  const isPlayerTurn = useCallback((): boolean => {
    if (!localGameState || !userId) return false;
    return (
      localGameState.players[localGameState.currentPlayerIndex].id === userId
    );
  }, [localGameState, userId]);

  const continueFromScoringPhase = useCallback(async () => {
    if (!localGameState || localGameState.phase !== 'scoring') return;

    const newState = continueFromScoring(localGameState);
    if (newState && roomId) {
      setLocalGameState(newState);
      await updateRemote(newState);
    }
  }, [localGameState, roomId, updateRemote]);

  const completeDealingAnimation = useCallback(() => {
    setIsDealingComplete(true);
    if (localGameState && roomId) {
      const newState = { ...localGameState, phase: 'playing' as const };
      setLocalGameState(newState);
      updateRemote(newState);
    }
  }, [localGameState, roomId, updateRemote]);

  const completeTrickAnimation = useCallback(() => {
    if (localGameState?.trickAnimating && roomId) {
      const newState = {
        ...localGameState,
        currentTrick: [],
        trickAnimating: false,
        pendingTrickWinner: undefined,
      };
      setLocalGameState(newState);
      updateRemote(newState);
    }
  }, [localGameState, roomId, updateRemote]);

  return {
    gameState: localGameState,
    ...gameActions,
    continueFromScoring: continueFromScoringPhase,
    selectedCard,
    setSelectedCard,
    getCurrentPlayerHand,
    getValidCardsForCurrentPlayer: useCallback(() => {
      if (!localGameState || !userId) return [];
      const hand = getCurrentPlayerHand();
      
      // If it's not the player's turn, no cards are valid
      if (!isPlayerTurn()) return [];
      
      // During initial phase, all cards are valid
      if (localGameState.phase === 'playing' || localGameState.phase === 'initial') {
        return hand;
      }
      
      // During arrastre (final phase), must follow suit if possible
      if (localGameState.phase === 'arrastre' && localGameState.currentTrick.length > 0) {
        const leadCard = localGameState.currentTrick[0].card;
        const sameSuitCards = hand.filter(card => card.suit === leadCard.suit);
        
        if (sameSuitCards.length > 0) {
          return sameSuitCards;
        }
        
        // If no cards of same suit, must play trump if possible
        const trumpCards = hand.filter(card => card.suit === localGameState.trumpSuit);
        if (trumpCards.length > 0) {
          return trumpCards;
        }
      }
      
      // Otherwise all cards are valid
      return hand;
    }, [localGameState, userId, getCurrentPlayerHand, isPlayerTurn]),
    isPlayerTurn,
    thinkingPlayer: useMemo(() => {
      if (!localGameState || !remotePlayers) return null;
      
      // Find current player
      const currentPlayer = remotePlayers.find(
        (_, index) => index === localGameState.currentPlayerIndex
      );
      
      // If current player is AI and it's their turn
      if (currentPlayer?.isAI && localGameState.phase === 'playing') {
        return localGameState.players[localGameState.currentPlayerIndex]?.id || null;
      }
      
      return null;
    }, [localGameState, remotePlayers]),
    isDealingComplete,
    completeDealingAnimation,
    completeTrickAnimation,
    setGameState: setLocalGameState,
    // Network-specific additions
    isConnected,
    isLoading,
    networkError: error,
    remotePlayers,
    optimisticMoves,
  };
}
