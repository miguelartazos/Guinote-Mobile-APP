import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNetworkGameState } from './useNetworkGameState';
import { useRealtimeGame } from './useRealtimeGame';
import { useGameState } from './useGameState';
import { continueFromScoring } from '../utils/gameEngine';
import { createMove } from '../types/gameMove.types';
import type {
  GameState,
  Card,
  CardId,
  PlayerId,
  TeamId,
  GameId,
} from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';

// Mock dependencies
jest.mock('./useRealtimeGame');
jest.mock('./useGameState');
jest.mock('../utils/gameEngine');
jest.mock('./useOptimisticMoves', () => ({
  useOptimisticMoves: () => ({
    optimisticMoves: [],
    applyOptimisticMove: jest.fn(state => state),
    rollbackMove: jest.fn(),
    clearOptimisticMoves: jest.fn(),
  }),
}));
jest.mock('./useMoveQueue', () => ({
  useMoveQueue: () => ({
    queueMove: jest.fn(),
    processQueue: jest.fn(),
  }),
}));
jest.mock('./useGameActions', () => ({
  useGameActions: () => ({
    playCard: jest.fn(),
    cantar: jest.fn(),
    cambiar7: jest.fn(),
    declareVictory: jest.fn(),
  }),
}));

// Helper function to create a test card
function createCard(id: string, suit: SpanishSuit, value: CardValue): Card {
  return { id: id as CardId, suit, value };
}

// Helper function to create a test game state
function createTestGameState(): GameState {
  const players = [
    {
      id: 'player1' as PlayerId,
      name: 'P1',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team1' as TeamId,
      isBot: false,
    },
    {
      id: 'player2' as PlayerId,
      name: 'P2',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team2' as TeamId,
      isBot: false,
    },
    {
      id: 'player3' as PlayerId,
      name: 'P3',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team1' as TeamId,
      isBot: false,
    },
    {
      id: 'player4' as PlayerId,
      name: 'P4',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team2' as TeamId,
      isBot: false,
    },
  ];

  const hands = new Map<PlayerId, ReadonlyArray<Card>>([
    [
      'player1' as PlayerId,
      [createCard('p1c1', 'oros', 1), createCard('p1c2', 'oros', 12)],
    ],
    [
      'player2' as PlayerId,
      [createCard('p2c1', 'copas', 10), createCard('p2c2', 'copas', 12)],
    ],
    ['player3' as PlayerId, []],
    ['player4' as PlayerId, []],
  ]);

  return {
    id: 'test-game' as GameId,
    phase: 'playing',
    players,
    teams: [
      {
        id: 'team1' as TeamId,
        playerIds: ['player1' as PlayerId, 'player3' as PlayerId],
        score: 0,
        cardPoints: 0,
        cantes: [],
      },
      {
        id: 'team2' as TeamId,
        playerIds: ['player2' as PlayerId, 'player4' as PlayerId],
        score: 0,
        cardPoints: 0,
        cantes: [],
      },
    ],
    deck: [createCard('deck1', 'oros', 2)],
    hands,
    trumpSuit: 'oros',
    trumpCard: createCard('trump', 'oros', 2),
    currentTrick: [],
    currentPlayerIndex: 0,
    dealerIndex: 3,
    trickCount: 0,
    trickWins: new Map(),
    collectedTricks: new Map(),
    canCambiar7: true,
    gameHistory: [],
    isVueltas: false,
    canDeclareVictory: false,
  };
}

describe('useNetworkGameState', () => {
  const mockRealtimeGame = {
    gameState: null,
    players: [],
    isConnected: true,
    isLoading: false,
    error: null,
    updateGameState: jest.fn(),
    makeMove: jest.fn(),
  };

  const mockOfflineGameState = {
    gameState: createTestGameState(),
    playCard: jest.fn(),
    cantar: jest.fn(),
    cambiar7: jest.fn(),
    declareVictory: jest.fn(),
    continueFromScoring: jest.fn(),
    selectedCard: null,
    setSelectedCard: jest.fn(),
    getCurrentPlayerHand: jest.fn(),
    getValidCardsForCurrentPlayer: jest.fn(),
    isPlayerTurn: jest.fn(),
    thinkingPlayer: null,
    isDealingComplete: true,
    completeDealingAnimation: jest.fn(),
    completeTrickAnimation: jest.fn(),
    setGameState: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    (useRealtimeGame as jest.Mock).mockReturnValue(mockRealtimeGame);
    (useGameState as jest.Mock).mockReturnValue(mockOfflineGameState);
    (continueFromScoring as jest.Mock).mockReturnValue(createTestGameState());
  });

  describe('offline mode', () => {
    it('uses offline game state for offline mode', () => {
      const { result } = renderHook(() =>
        useNetworkGameState({
          gameMode: 'offline',
          playerName: 'Test Player',
          difficulty: 'medium',
        }),
      );

      expect(useGameState).toHaveBeenCalledWith({
        playerName: 'Test Player',
        difficulty: 'medium',
        playerNames: undefined,
      });
      expect(result.current.gameState).toBe(mockOfflineGameState.gameState);
    });

    it('uses offline game state for local multiplayer', () => {
      const playerNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

      const { result } = renderHook(() =>
        useNetworkGameState({
          gameMode: 'local-multiplayer',
          playerName: 'Player 1',
          playerNames,
        }),
      );

      expect(useGameState).toHaveBeenCalledWith({
        playerName: 'Player 1',
        difficulty: 'medium',
        playerNames,
      });
      expect(result.current.gameState).toBe(mockOfflineGameState.gameState);
    });
  });

  describe('online mode', () => {
    const onlineProps = {
      gameMode: 'online' as const,
      roomId: 'room123',
      userId: 'player1',
      playerName: 'Test Player',
    };

    it('initializes with null game state', () => {
      const { result } = renderHook(() => useNetworkGameState(onlineProps));

      expect(result.current.gameState).toBeNull();
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.networkError).toBeNull();
    });

    it('syncs remote game state to local', async () => {
      const remoteGameState = createTestGameState();

      const { result, rerender } = renderHook(() =>
        useNetworkGameState(onlineProps),
      );

      // Update mock to return game state
      (useRealtimeGame as jest.Mock).mockReturnValue({
        ...mockRealtimeGame,
        gameState: remoteGameState,
      });

      rerender();

      await waitFor(() => {
        expect(result.current.gameState).toBe(remoteGameState);
      });
    });

    it('handles connection status', () => {
      (useRealtimeGame as jest.Mock).mockReturnValue({
        ...mockRealtimeGame,
        isConnected: false,
        error: 'Connection lost',
      });

      const { result } = renderHook(() => useNetworkGameState(onlineProps));

      expect(result.current.isConnected).toBe(false);
      expect(result.current.networkError).toBe('Connection lost');
    });

    it('provides current player hand', () => {
      const gameState = createTestGameState();
      (useRealtimeGame as jest.Mock).mockReturnValue({
        ...mockRealtimeGame,
        gameState,
      });

      const { result, rerender } = renderHook(() =>
        useNetworkGameState(onlineProps),
      );

      rerender();

      const hand = result.current.getCurrentPlayerHand();
      expect(hand).toEqual([
        createCard('p1c1', 'oros', 1),
        createCard('p1c2', 'oros', 12),
      ]);
    });

    it('checks if it is player turn', () => {
      const gameState = createTestGameState();
      (useRealtimeGame as jest.Mock).mockReturnValue({
        ...mockRealtimeGame,
        gameState,
      });

      const { result, rerender } = renderHook(() =>
        useNetworkGameState(onlineProps),
      );

      rerender();

      expect(result.current.isPlayerTurn()).toBe(true);

      // Change current player
      gameState.currentPlayerIndex = 1;
      rerender();

      expect(result.current.isPlayerTurn()).toBe(false);
    });

    it('handles continue from scoring phase', async () => {
      const gameState = { ...createTestGameState(), phase: 'scoring' as const };
      const newState = { ...gameState, phase: 'dealing' as const };

      (useRealtimeGame as jest.Mock).mockReturnValue({
        ...mockRealtimeGame,
        gameState,
      });
      (continueFromScoring as jest.Mock).mockReturnValue(newState);

      const { result, rerender } = renderHook(() =>
        useNetworkGameState(onlineProps),
      );

      rerender();

      await act(async () => {
        await result.current.continueFromScoring();
      });

      expect(continueFromScoring).toHaveBeenCalledWith(gameState);
      expect(mockRealtimeGame.updateGameState).toHaveBeenCalledWith(newState);
    });

    it('completes dealing animation', async () => {
      const gameState = createTestGameState();
      (useRealtimeGame as jest.Mock).mockReturnValue({
        ...mockRealtimeGame,
        gameState,
      });

      const { result, rerender } = renderHook(() =>
        useNetworkGameState(onlineProps),
      );

      rerender();

      await act(async () => {
        result.current.completeDealingAnimation();
      });

      expect(mockRealtimeGame.updateGameState).toHaveBeenCalledWith({
        ...gameState,
        phase: 'playing',
      });
    });

    it('completes trick animation', async () => {
      const gameState = {
        ...createTestGameState(),
        trickAnimating: true,
        pendingTrickWinner: 'player1' as PlayerId,
      };

      (useRealtimeGame as jest.Mock).mockReturnValue({
        ...mockRealtimeGame,
        gameState,
      });

      const { result, rerender } = renderHook(() =>
        useNetworkGameState(onlineProps),
      );

      rerender();

      await act(async () => {
        result.current.completeTrickAnimation();
      });

      expect(mockRealtimeGame.updateGameState).toHaveBeenCalledWith({
        ...gameState,
        currentTrick: [],
        trickAnimating: false,
        pendingTrickWinner: undefined,
      });
    });
  });

  describe('edge cases', () => {
    it('handles missing roomId for online mode', () => {
      const { result } = renderHook(() =>
        useNetworkGameState({
          gameMode: 'online',
          roomId: undefined,
          userId: 'player1',
          playerName: 'Test Player',
        }),
      );

      expect(useRealtimeGame).toHaveBeenCalledWith(null, 'player1');
    });

    it('handles missing userId for online mode', () => {
      const { result } = renderHook(() =>
        useNetworkGameState({
          gameMode: 'online',
          roomId: 'room123',
          userId: undefined,
          playerName: 'Test Player',
        }),
      );

      expect(useRealtimeGame).toHaveBeenCalledWith('room123', null);

      const hand = result.current.getCurrentPlayerHand();
      expect(hand).toEqual([]);

      expect(result.current.isPlayerTurn()).toBe(false);
    });

    it('handles scoring phase when not in scoring', async () => {
      const gameState = createTestGameState();
      (useRealtimeGame as jest.Mock).mockReturnValue({
        ...mockRealtimeGame,
        gameState,
      });

      const { result, rerender } = renderHook(() =>
        useNetworkGameState({
          gameMode: 'online',
          roomId: 'room123',
          userId: 'player1',
          playerName: 'Test Player',
        }),
      );

      rerender();

      await act(async () => {
        await result.current.continueFromScoring();
      });

      expect(continueFromScoring).not.toHaveBeenCalled();
    });
  });
});
