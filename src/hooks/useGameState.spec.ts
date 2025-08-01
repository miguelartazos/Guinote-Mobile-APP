import { renderHook, act } from '@testing-library/react-hooks';
import { useGameState } from './useGameState';
import type { GameState, Team, TeamId } from '../types/game.types';

// Mock the gameLogic functions
jest.mock('../utils/gameLogic', () => ({
  createDeck: jest.fn(() => []),
  shuffleDeck: jest.fn(deck => deck),
  dealInitialCards: jest.fn(() => ({
    hands: new Map(),
    remainingDeck: [],
  })),
  isValidPlay: jest.fn(() => true),
  calculateTrickWinner: jest.fn(() => 'player1'),
  calculateTrickPoints: jest.fn(() => 10),
  canCantar: jest.fn(() => []),
  calculateCantePoints: jest.fn(() => 20),
  canCambiar7: jest.fn(() => false),
  getNextPlayerIndex: jest.fn(current => (current + 1) % 4),
  findPlayerTeam: jest.fn(() => 'team1'),
  isGameOver: jest.fn(() => false),
  shouldStartVueltas: jest.fn(() => false),
  canDeclareVictory: jest.fn(() => false),
  getValidCards: jest.fn(hand => hand),
}));

// Mock AI functions
jest.mock('../utils/aiPlayer', () => ({
  playAICard: jest.fn(() => null),
  shouldAICante: jest.fn(() => null),
  getAIThinkingTime: jest.fn(() => 100),
}));

// Mock memory functions
jest.mock('../utils/aiMemory', () => ({
  createMemory: jest.fn(() => new Map()),
  updateMemory: jest.fn(memory => memory),
}));

// Mock the useAITurn hook
jest.mock('./useAITurn', () => ({
  useAITurn: jest.fn(() => ({
    thinkingPlayer: null,
    botRecoveryTimer: null,
  })),
}));

describe('useGameState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('AI turn management', () => {
    test('should use AI turn hook with correct parameters', () => {
      const mockUseAITurn = require('./useAITurn').useAITurn;

      const { result } = renderHook(() =>
        useGameState({
          playerName: 'Test Player',
          difficulty: 'medium',
        }),
      );

      // Verify useAITurn was called with expected structure
      expect(mockUseAITurn).toHaveBeenCalled();
      const lastCall =
        mockUseAITurn.mock.calls[mockUseAITurn.mock.calls.length - 1][0];
      expect(lastCall).toHaveProperty('gameState');
      expect(lastCall).toHaveProperty('currentTurnKey');
      expect(lastCall).toHaveProperty('playCard');
      expect(lastCall).toHaveProperty('cantar');
      expect(lastCall).toHaveProperty('aiMemory');
      expect(lastCall).toHaveProperty('setAIMemory');
    });
  });

  describe('continueFromScoring', () => {
    test('should transition to game over when a team has won', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test' }));

      // Set up game state in scoring phase with a winning team
      act(() => {
        result.current.setGameState({
          id: 'test-game' as any,
          phase: 'scoring',
          players: [] as any,
          teams: [
            {
              id: 'team1' as TeamId,
              playerIds: ['player1', 'player2'] as any,
              score: 105,
              cardPoints: 35,
              cantes: [],
            },
            {
              id: 'team2' as TeamId,
              playerIds: ['player3', 'player4'] as any,
              score: 80,
              cardPoints: 25,
              cantes: [],
            },
          ] as [Team, Team],
          deck: [],
          hands: new Map(),
          trumpSuit: 'oros',
          trumpCard: { id: 'trump', suit: 'oros', value: 7 } as any,
          currentTrick: [],
          currentPlayerIndex: 0,
          dealerIndex: 0,
          trickCount: 10,
          trickWins: new Map(),
          canCambiar7: false,
          gameHistory: [],
          isVueltas: false,
          canDeclareVictory: false,
        } as GameState);
      });

      // Call continueFromScoring
      act(() => {
        result.current.continueFromScoring();
      });

      // Should transition to gameOver
      expect(result.current.gameState?.phase).toBe('gameOver');
    });

    test('should transition to vueltas when no team has won', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test' }));

      // Set up game state in scoring phase without a winner
      act(() => {
        result.current.setGameState({
          id: 'test-game' as any,
          phase: 'scoring',
          players: [
            { id: 'player1', name: 'P1' },
            { id: 'player2', name: 'P2' },
            { id: 'player3', name: 'P3' },
            { id: 'player4', name: 'P4' },
          ] as any,
          teams: [
            {
              id: 'team1' as TeamId,
              playerIds: ['player1', 'player2'] as any,
              score: 95,
              cardPoints: 30,
              cantes: [],
            },
            {
              id: 'team2' as TeamId,
              playerIds: ['player3', 'player4'] as any,
              score: 90,
              cardPoints: 28,
              cantes: [],
            },
          ] as [Team, Team],
          deck: [],
          hands: new Map(),
          trumpSuit: 'oros',
          trumpCard: { id: 'trump', suit: 'oros', value: 7 } as any,
          currentTrick: [],
          currentPlayerIndex: 0,
          dealerIndex: 0,
          trickCount: 10,
          trickWins: new Map(),
          lastTrickWinner: 'player1' as any,
          canCambiar7: false,
          gameHistory: [],
          isVueltas: false,
          canDeclareVictory: false,
        } as GameState);
      });

      // Call continueFromScoring
      act(() => {
        result.current.continueFromScoring();
      });

      // Should transition to dealing phase for vueltas
      expect(result.current.gameState?.phase).toBe('dealing');
      expect(result.current.gameState?.isVueltas).toBe(true);
      expect(result.current.gameState?.initialScores).toBeDefined();
      expect(result.current.gameState?.lastTrickWinnerTeam).toBe('team1');
      expect(result.current.gameState?.canDeclareVictory).toBe(true);
    });

    test('should not transition to game over if 30 malas rule not met', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test' }));

      // Set up game state with 101+ points but less than 30 card points
      act(() => {
        result.current.setGameState({
          id: 'test-game' as any,
          phase: 'scoring',
          players: [
            { id: 'player1', name: 'P1' },
            { id: 'player2', name: 'P2' },
            { id: 'player3', name: 'P3' },
            { id: 'player4', name: 'P4' },
          ] as any,
          teams: [
            {
              id: 'team1' as TeamId,
              playerIds: ['player1', 'player2'] as any,
              score: 105,
              cardPoints: 25, // Less than 30!
              cantes: [],
            },
            {
              id: 'team2' as TeamId,
              playerIds: ['player3', 'player4'] as any,
              score: 80,
              cardPoints: 35,
              cantes: [],
            },
          ] as [Team, Team],
          deck: [],
          hands: new Map(),
          trumpSuit: 'oros',
          trumpCard: { id: 'trump', suit: 'oros', value: 7 } as any,
          currentTrick: [],
          currentPlayerIndex: 0,
          dealerIndex: 0,
          trickCount: 10,
          trickWins: new Map(),
          canCambiar7: false,
          gameHistory: [],
          isVueltas: false,
          canDeclareVictory: false,
        } as GameState);
      });

      // Call continueFromScoring
      act(() => {
        result.current.continueFromScoring();
      });

      // Should transition to vueltas, not game over
      expect(result.current.gameState?.phase).toBe('dealing');
      expect(result.current.gameState?.isVueltas).toBe(true);
    });

    test('should do nothing if not in scoring phase', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test' }));

      // Set up game state in playing phase
      const initialState = {
        id: 'test-game' as any,
        phase: 'playing' as const,
        players: [] as any,
        teams: [] as any,
        deck: [],
        hands: new Map(),
        trumpSuit: 'oros',
        trumpCard: { id: 'trump', suit: 'oros', value: 7 } as any,
        currentTrick: [],
        currentPlayerIndex: 0,
        dealerIndex: 0,
        trickCount: 5,
        trickWins: new Map(),
        canCambiar7: false,
        gameHistory: [],
        isVueltas: false,
        canDeclareVictory: false,
      } as GameState;

      act(() => {
        result.current.setGameState(initialState);
      });

      // Call continueFromScoring
      act(() => {
        result.current.continueFromScoring();
      });

      // State should remain unchanged
      expect(result.current.gameState?.phase).toBe('playing');
    });
  });
});
