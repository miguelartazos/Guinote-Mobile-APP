import { renderHook, act } from '@testing-library/react-native';
import { useGameState } from './useGameState';
import type { GameState, Team, TeamId } from '../types/game.types';

// Mock the gameLogic functions
jest.mock('../utils/gameLogic', () => ({
  createDeck: jest.fn(() => []),
  shuffleDeck: jest.fn(deck => deck),
  dealInitialCards: jest.fn(() => ({
    hands: new Map([
      [
        'player',
        [
          { id: '1', suit: 'oros', value: 1 },
          { id: '2', suit: 'copas', value: 2 },
          { id: '3', suit: 'espadas', value: 3 },
          { id: '4', suit: 'bastos', value: 4 },
        ],
      ],
      [
        'bot1',
        [
          { id: '5', suit: 'oros', value: 5 },
          { id: '6', suit: 'copas', value: 6 },
        ],
      ],
      [
        'bot2',
        [
          { id: '7', suit: 'espadas', value: 7 },
          { id: '8', suit: 'bastos', value: 8 },
        ],
      ],
      [
        'bot3',
        [
          { id: '9', suit: 'oros', value: 9 },
          { id: '10', suit: 'copas', value: 10 },
        ],
      ],
    ]),
    remainingDeck: [{ id: 'trump', suit: 'oros', value: 7 }],
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
    test('should wait 3 seconds before transitioning to game over when a team has won', () => {
      jest.useFakeTimers();
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

      // Should still be in scoring phase immediately
      expect(result.current.gameState?.phase).toBe('scoring');

      // Fast-forward 2 seconds - should still be scoring
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.gameState?.phase).toBe('scoring');

      // Fast-forward remaining 1 second - should now be gameOver
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.gameState?.phase).toBe('gameOver');

      jest.useRealTimers();
    });

    test('should transition to game over when a team has won', () => {
      jest.useFakeTimers();
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

      // Fast-forward 3 seconds for the timeout
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should transition to gameOver
      expect(result.current.gameState?.phase).toBe('gameOver');

      jest.useRealTimers();
    });

    test('should start dealing animation when entering vueltas', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test' }));

      // Set up game state in scoring phase without a winner
      act(() => {
        result.current.setGameState({
          id: 'test-game' as any,
          phase: 'scoring',
          players: [
            { id: 'p1' as any, name: 'P1', isBot: false } as any,
            { id: 'p2' as any, name: 'P2', isBot: true } as any,
            { id: 'p3' as any, name: 'P3', isBot: true } as any,
            { id: 'p4' as any, name: 'P4', isBot: true } as any,
          ],
          teams: [
            {
              id: 'team1' as TeamId,
              playerIds: ['p1', 'p2'] as any,
              score: 95, // Not enough to win
              cardPoints: 35,
              cantes: [],
            },
            {
              id: 'team2' as TeamId,
              playerIds: ['p3', 'p4'] as any,
              score: 90,
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

      // Should transition to dealing phase for vueltas
      expect(result.current.gameState?.phase).toBe('dealing');
      expect(result.current.gameState?.isVueltas).toBe(true);
      expect(result.current.gameState?.hands.size).toBe(0); // Empty hands - will be filled during animation
      expect(result.current.isDealingComplete).toBe(false); // Dealing animation should trigger
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

    test('prevents multiple scoring transitions on rapid clicks', () => {
      jest.useFakeTimers();
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

      // Call continueFromScoring multiple times rapidly
      act(() => {
        result.current.continueFromScoring();
        result.current.continueFromScoring(); // Second call should be ignored
        result.current.continueFromScoring(); // Third call should be ignored
      });

      // Should still be in scoring phase
      expect(result.current.gameState?.phase).toBe('scoring');

      // Fast-forward 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should transition to gameOver only once
      expect(result.current.gameState?.phase).toBe('gameOver');

      // Try calling again after transition - should do nothing
      act(() => {
        result.current.continueFromScoring();
      });

      expect(result.current.gameState?.phase).toBe('gameOver');

      jest.useRealTimers();
    });

    test('should cancel previous timeout when called multiple times', () => {
      jest.useFakeTimers();
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

      // Call continueFromScoring multiple times rapidly
      act(() => {
        result.current.continueFromScoring();
        result.current.continueFromScoring();
        result.current.continueFromScoring();
      });

      // Fast-forward 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should only transition once (not multiple times)
      expect(result.current.gameState?.phase).toBe('gameOver');

      jest.useRealTimers();
    });
  });

  describe('reorderPlayerHand', () => {
    test('reorders cards within player hand correctly', () => {
      const { result } = renderHook(() =>
        useGameState({ playerName: 'Test Player' }),
      );

      // Wait for initialization
      act(() => {
        jest.runAllTimers();
      });

      // Set up a test game state with known cards
      const testCards = [
        { id: 'card1', suit: 'oros', value: 1 },
        { id: 'card2', suit: 'copas', value: 2 },
        { id: 'card3', suit: 'espadas', value: 3 },
        { id: 'card4', suit: 'bastos', value: 4 },
      ] as any;

      act(() => {
        result.current.setGameState({
          ...result.current.gameState!,
          hands: new Map([
            ['player', testCards],
            ['bot1', []],
            ['bot2', []],
            ['bot3', []],
          ]),
        } as GameState);
      });

      // Reorder: move first card to position 2
      act(() => {
        result.current.reorderPlayerHand('player' as any, 0, 2);
      });

      // Check new order
      const reorderedHand = result.current.gameState!.hands.get(
        'player' as any,
      );
      expect(reorderedHand![0].id).toBe('card2');
      expect(reorderedHand![1].id).toBe('card3');
      expect(reorderedHand![2].id).toBe('card1');
      expect(reorderedHand![3].id).toBe('card4');
    });

    test('handles edge cases for reordering', () => {
      const { result } = renderHook(() =>
        useGameState({ playerName: 'Test Player' }),
      );

      // Set up test state
      const testCards = [
        { id: 'card1', suit: 'oros', value: 1 },
        { id: 'card2', suit: 'copas', value: 2 },
        { id: 'card3', suit: 'espadas', value: 3 },
      ] as any;

      act(() => {
        result.current.setGameState({
          ...result.current.gameState!,
          hands: new Map([['player', testCards]]),
        } as GameState);
      });

      // Test same index (no change)
      act(() => {
        result.current.reorderPlayerHand('player' as any, 1, 1);
      });
      const hand = result.current.gameState!.hands.get('player' as any)!;
      expect(hand[0].id).toBe('card1');
      expect(hand[1].id).toBe('card2');
      expect(hand[2].id).toBe('card3');

      // Test moving last card to first
      act(() => {
        result.current.reorderPlayerHand('player' as any, 2, 0);
      });
      const afterMove = result.current.gameState!.hands.get('player' as any)!;
      expect(afterMove[0].id).toBe('card3');
      expect(afterMove[1].id).toBe('card1');
      expect(afterMove[2].id).toBe('card2');
    });

    test('does not affect other players hands', () => {
      const { result } = renderHook(() =>
        useGameState({ playerName: 'Test Player' }),
      );

      // Set up test state with multiple players
      const playerCards = [{ id: 'p1', suit: 'oros', value: 1 }] as any;
      const bot1Cards = [{ id: 'b1', suit: 'copas', value: 2 }] as any;
      const bot2Cards = [{ id: 'b2', suit: 'espadas', value: 3 }] as any;

      act(() => {
        result.current.setGameState({
          ...result.current.gameState!,
          hands: new Map([
            ['player', playerCards],
            ['bot1', bot1Cards],
            ['bot2', bot2Cards],
          ]),
        } as GameState);
      });

      // Reorder player's hand
      act(() => {
        result.current.reorderPlayerHand('player' as any, 0, 0);
      });

      // Check other players' hands remain unchanged
      expect(result.current.gameState!.hands.get('bot1' as any)).toEqual(
        bot1Cards,
      );
      expect(result.current.gameState!.hands.get('bot2' as any)).toEqual(
        bot2Cards,
      );
    });

    test('handles invalid player ID gracefully', () => {
      const { result } = renderHook(() =>
        useGameState({ playerName: 'Test Player' }),
      );

      const initialState = result.current.gameState;

      // Try to reorder non-existent player's hand
      act(() => {
        result.current.reorderPlayerHand('invalid' as any, 0, 1);
      });

      // State reference should remain unchanged
      expect(result.current.gameState).toBe(initialState);
    });

    test('maintains hand size after reordering', () => {
      const { result } = renderHook(() =>
        useGameState({ playerName: 'Test Player' }),
      );

      // Set up test state
      const testCards = [
        { id: 'card1' },
        { id: 'card2' },
        { id: 'card3' },
        { id: 'card4' },
        { id: 'card5' },
      ] as any;

      act(() => {
        result.current.setGameState({
          ...result.current.gameState!,
          hands: new Map([['player', testCards]]),
        } as GameState);
      });

      const initialSize = 5;

      // Perform multiple reorders
      act(() => {
        result.current.reorderPlayerHand('player' as any, 0, 2);
        result.current.reorderPlayerHand('player' as any, 1, 3);
        result.current.reorderPlayerHand('player' as any, 2, 0);
      });

      // Check hand size remains the same
      expect(result.current.gameState!.hands.get('player' as any)!.length).toBe(
        initialSize,
      );
    });

    test('handles reordering with empty game state', () => {
      const { result } = renderHook(() =>
        useGameState({ playerName: 'Test Player' }),
      );

      // Force game state to be null
      act(() => {
        result.current.setGameState(null as any);
      });

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.reorderPlayerHand('player' as any, 0, 1);
        });
      }).not.toThrow();
    });
  });
});
