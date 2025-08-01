import { useState, useEffect, useCallback, useRef } from 'react';
import networkService from '../services/networkService';
import type {
  GameState,
  CardId,
  Card,
  GamePhase,
  PlayerId,
} from '../types/game.types';
import type { SpanishSuit } from '../types/cardTypes';
import { getValidCards } from '../utils/gameLogic';

interface NetworkGameStateProps {
  roomId: string;
  playerId: PlayerId;
  onGameEnd?: (winner: any) => void;
  onPlayerDisconnect?: (playerId: string) => void;
}

export function useNetworkGameState({
  roomId,
  playerId,
  onGameEnd,
  onPlayerDisconnect,
}: NetworkGameStateProps | any) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<string>('connecting');

  // Track pending actions for optimistic updates
  const pendingActions = useRef<Set<string>>(new Set());

  // Initialize network connection and join room
  useEffect(() => {
    let mounted = true;

    const initializeGame = async () => {
      try {
        // Join the game room
        networkService.joinRoom(roomId);
        setIsLoading(true);
      } catch (err) {
        console.error('Failed to join room:', err);
        if (mounted) {
          setError('Error al conectar con la partida');
          setIsLoading(false);
        }
      }
    };

    // Set up event listeners
    const handleGameState = (data: any) => {
      if (!mounted) return;

      setGameState(data as GameState);
      setIsLoading(false);

      // Check if it's my turn
      const currentPlayer = data.players[data.gameState.currentPlayerIndex];
      setIsMyTurn(currentPlayer.playerId === playerId);
    };

    const handleGameUpdate = (data: any) => {
      if (!mounted) return;

      setGameState(data.gameState);

      // Clear pending action if it was processed
      if (data.lastAction) {
        const actionKey = `${data.lastAction.type}_${data.lastAction.playerId}`;
        pendingActions.current.delete(actionKey);
      }

      // Check if it's my turn
      const currentPlayer =
        data.gameState.players[data.gameState.currentPlayerIndex];
      setIsMyTurn(currentPlayer.playerId === playerId);

      // Check if game ended
      if (data.gameState.phase === 'gameOver' && onGameEnd) {
        onGameEnd(data.gameState.winner);
      }
    };

    const handlePlayerDisconnected = (data: any) => {
      if (!mounted) return;

      if (onPlayerDisconnect) {
        onPlayerDisconnect(data.playerId);
      }
    };

    const handleConnectionStatus = (data: any) => {
      if (!mounted) return;
      setConnectionStatus(data.status);
    };

    const handleError = (error: any) => {
      if (!mounted) return;
      console.error('Game error:', error);
      setError(error.message || 'Error en el juego');
    };

    const handleVoiceMessage = (data: any) => {
      if (!mounted) return;
      // Voice messages are handled by the VoiceHistory component
      // Just emit an event that can be listened to
    };

    // Subscribe to events
    networkService.on('game_state', handleGameState);
    networkService.on('game_update', handleGameUpdate);
    networkService.on('player_disconnected', handlePlayerDisconnected);
    networkService.on('connection_status', handleConnectionStatus);
    networkService.on('error', handleError);
    networkService.on('voice_message', handleVoiceMessage);

    initializeGame();

    // Cleanup
    return () => {
      mounted = false;
      networkService.off('game_state', handleGameState);
      networkService.off('game_update', handleGameUpdate);
      networkService.off('player_disconnected', handlePlayerDisconnected);
      networkService.off('connection_status', handleConnectionStatus);
      networkService.off('error', handleError);
      networkService.off('voice_message', handleVoiceMessage);

      if (roomId) {
        networkService.leaveRoom(roomId);
      }
    };
  }, [roomId, playerId, onGameEnd, onPlayerDisconnect]);

  // Play a card with optimistic update
  const playCard = useCallback(
    (cardId: CardId) => {
      if (!gameState || !isMyTurn) return;

      try {
        // Add to pending actions
        const actionKey = `PLAY_CARD_${playerId}`;
        pendingActions.current.add(actionKey);

        // Send to server
        networkService.playCard(roomId, cardId);

        // Optimistic update
        setGameState(prevState => {
          if (!prevState) return null;

          // Find the card in player's hand
          const playerHand = prevState.hands.get(playerId);
          if (!playerHand) return prevState;

          const cardIndex = playerHand.findIndex(c => c.id === cardId);
          if (cardIndex === -1) return prevState;

          // Create new state with card removed from hand and added to trick
          const newHands = new Map(prevState.hands);
          const newHand = [...playerHand];
          const card = newHand.splice(cardIndex, 1)[0];
          newHands.set(playerId, newHand);

          const newCurrentTrick = [
            ...prevState.currentTrick,
            { playerId, card },
          ];

          return {
            ...prevState,
            hands: newHands,
            currentTrick: newCurrentTrick,
          };
        });
      } catch (err) {
        console.error('Failed to play card:', err);
        setError('Error al jugar carta');

        // Remove from pending actions
        const actionKey = `PLAY_CARD_${playerId}`;
        pendingActions.current.delete(actionKey);
      }
    },
    [gameState, isMyTurn, roomId, playerId],
  );

  // Cantar
  const cantar = useCallback(
    (suit: SpanishSuit) => {
      if (!gameState || !isMyTurn) return;

      try {
        networkService.cantar(roomId, suit);
      } catch (err) {
        console.error('Failed to cantar:', err);
        setError('Error al cantar');
      }
    },
    [gameState, isMyTurn, roomId],
  );

  // Cambiar 7
  const cambiar7 = useCallback(() => {
    if (!gameState || !isMyTurn) return;

    try {
      networkService.cambiar7(roomId);
    } catch (err) {
      console.error('Failed to cambiar 7:', err);
      setError('Error al cambiar 7');
    }
  }, [gameState, isMyTurn, roomId]);

  // Declare victory
  const declareVictory = useCallback(() => {
    if (!gameState || !isMyTurn) return;

    try {
      networkService.declareVictory(roomId);
    } catch (err) {
      console.error('Failed to declare victory:', err);
      setError('Error al declarar victoria');
    }
  }, [gameState, isMyTurn, roomId]);

  // Get current player's hand
  const getCurrentPlayerHand = useCallback((): Card[] => {
    if (!gameState) return [];

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return [];

    return [...(gameState.hands.get(playerId) || [])];
  }, [gameState, playerId]);

  // Get valid cards for current player
  const getValidCardsForCurrentPlayer = useCallback((): Card[] => {
    if (!gameState || !isMyTurn) return [];

    const playerHand = getCurrentPlayerHand();
    return getValidCards(playerHand, gameState, playerId);
  }, [gameState, isMyTurn, getCurrentPlayerHand, playerId]);

  // Check if reconnecting
  const isReconnecting = connectionStatus === 'reconnecting';

  // Stub for unused methods to match interface
  const declareRenuncio = useCallback(() => {
    console.log('Renuncio not implemented for online games');
  }, []);

  const continueFromScoring = useCallback(() => {
    console.log('Continue from scoring handled automatically online');
  }, []);

  const completeDealingAnimation = useCallback(() => {
    // Dealing is handled by server
  }, []);

  return {
    gameState,
    isLoading,
    error,
    isMyTurn,
    selectedCard,
    setSelectedCard,
    playCard,
    cantar,
    cambiar7,
    declareVictory,
    declareRenuncio,
    continueFromScoring,
    getCurrentPlayerHand,
    getValidCardsForCurrentPlayer,
    isPlayerTurn: () => isMyTurn,
    connectionStatus,
    isReconnecting,
    thinkingPlayer: null,
    isDealingComplete: gameState?.phase !== 'dealing',
    completeDealingAnimation,
  };
}
