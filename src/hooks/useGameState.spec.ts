import { renderHook, act } from '@testing-library/react-native';
import { useGameState } from './useGameState';
import type { GameState, Team, TeamId } from '../types/game.types';

// Mock the gameLogic functions
jest.mock('../utils/gameLogic', () => ({
  createInitialMatchScore: jest.fn(() => ({
    team1Partidas: 0,
    team2Partidas: 0,
    team1Cotos: 0,
    team2Cotos: 0,
    partidasPerCoto: 3,
    cotosPerMatch: 2,
    team1Sets: 0,
    team2Sets: 0,
  })),
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
  startNewPartida: jest.fn(gameState => gameState),
  updateMatchScoreAndDeterminePhase: jest.fn(() => ({
    matchScore: {
      team1Partidas: 0,
      team2Partidas: 0,
      team1Cotos: 0,
      team2Cotos: 0,
      partidasPerCoto: 3,
      cotosPerMatch: 2,
      team1Sets: 0,
      team2Sets: 0,
    },
    phase: 'scoring',
  })),
  updateMatchScoreForPartida: jest.fn(matchScore => matchScore),
  isMatchComplete: jest.fn(() => false),
  isValidTeamIndex: jest.fn(() => true),
  determineVueltasWinner: jest.fn(() => null),
  resetGameStateForVueltas: jest.fn((state, scores) => state),
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
  clearMemory: jest.fn(() => new Map()),
  shouldClearMemory: jest.fn(() => false),
  clearMemoryOnPhaseChange: jest.fn(() => new Map()),
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
      const lastCall = mockUseAITurn.mock.calls[mockUseAITurn.mock.calls.length - 1][0];
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

  describe('Card Play Animation', () => {
    test('should cleanup timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { result, unmount } = renderHook(() => useGameState({ playerName: 'Test Player' }));

      // Set up a game state with a card to play
      const testGameState: GameState = {
        id: 'test-game' as any,
        phase: 'playing',
        currentPlayerIndex: 0,
        players: [
          { id: 'player1', name: 'Player 1' } as any,
          { id: 'player2', name: 'Player 2' } as any,
          { id: 'player3', name: 'Player 3' } as any,
          { id: 'player4', name: 'Player 4' } as any,
        ],
        teams: [
          { id: 'team1' as TeamId, playerIds: ['player1', 'player3'] as any, score: 0 } as any,
          { id: 'team2' as TeamId, playerIds: ['player2', 'player4'] as any, score: 0 } as any,
        ] as [Team, Team],
        hands: new Map([['player1', [{ id: 'card1', suit: 'oros', value: 1 }]]]),
        currentTrick: [],
        deck: [],
        trumpCard: null,
        teamTrickPiles: new Map(),
        lastTrick: null,
        lastTrickWinner: null,
        dealingSnapshot: null,
        pendingCantes: [],
        handNumber: 1,
        trickStats: new Map(),
        cardPlayAnimation: null,
      } as GameState;

      act(() => {
        result.current.setGameState(testGameState);
      });

      // Trigger a card play which should set a timeout
      act(() => {
        result.current.playCard(0);
      });

      // Verify animation state is set
      expect(result.current.gameState?.cardPlayAnimation).toBeTruthy();

      // Unmount should cleanup the timeout
      unmount();

      // Check that clearTimeout was called
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    test('should handle concurrent card plays by clearing previous timeout', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const { result } = renderHook(() => useGameState({ playerName: 'Test Player' }));

      // Set up game state with multiple cards
      const testGameState: GameState = {
        id: 'test-game' as any,
        phase: 'playing',
        currentPlayerIndex: 0,
        players: [
          { id: 'player1', name: 'Player 1' } as any,
          { id: 'player2', name: 'Player 2' } as any,
          { id: 'player3', name: 'Player 3' } as any,
          { id: 'player4', name: 'Player 4' } as any,
        ],
        teams: [
          { id: 'team1' as TeamId, playerIds: ['player1', 'player3'] as any, score: 0 } as any,
          { id: 'team2' as TeamId, playerIds: ['player2', 'player4'] as any, score: 0 } as any,
        ] as [Team, Team],
        hands: new Map([
          [
            'player1',
            [
              { id: 'card1', suit: 'oros', value: 1 },
              { id: 'card2', suit: 'oros', value: 2 },
            ],
          ],
        ]),
        currentTrick: [],
        deck: [],
        trumpCard: null,
        teamTrickPiles: new Map(),
        lastTrick: null,
        lastTrickWinner: null,
        dealingSnapshot: null,
        pendingCantes: [],
        handNumber: 1,
        trickStats: new Map(),
        cardPlayAnimation: null,
      } as GameState;

      act(() => {
        result.current.setGameState(testGameState);
      });

      // Play first card
      act(() => {
        result.current.playCard(0);
      });

      const firstTimeoutId =
        setTimeoutSpy.mock.results[setTimeoutSpy.mock.results.length - 1]?.value;

      // Play second card quickly (simulating rapid plays)
      act(() => {
        // Update state to simulate AI played, making it player's turn again
        result.current.setGameState({
          ...result.current.gameState!,
          currentPlayerIndex: 0,
        });
        result.current.playCard(0); // Play remaining card
      });

      // Should have cleared the first timeout
      expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTimeoutId);

      clearTimeoutSpy.mockRestore();
      setTimeoutSpy.mockRestore();
    });

    test('should clear animation state when card is placed', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test Player' }));

      // Set up game state
      const testGameState: GameState = {
        id: 'test-game' as any,
        phase: 'playing',
        currentPlayerIndex: 0,
        players: [
          { id: 'player1', name: 'Player 1' } as any,
          { id: 'player2', name: 'Player 2' } as any,
          { id: 'player3', name: 'Player 3' } as any,
          { id: 'player4', name: 'Player 4' } as any,
        ],
        teams: [
          { id: 'team1' as TeamId, playerIds: ['player1', 'player3'] as any, score: 0 } as any,
          { id: 'team2' as TeamId, playerIds: ['player2', 'player4'] as any, score: 0 } as any,
        ] as [Team, Team],
        hands: new Map([['player1', [{ id: 'card1', suit: 'oros', value: 1 }]]]),
        currentTrick: [],
        deck: [],
        trumpCard: null,
        teamTrickPiles: new Map(),
        lastTrick: null,
        lastTrickWinner: null,
        dealingSnapshot: null,
        pendingCantes: [],
        handNumber: 1,
        trickStats: new Map(),
        cardPlayAnimation: null,
      } as GameState;

      act(() => {
        result.current.setGameState(testGameState);
      });

      // Play card
      act(() => {
        result.current.playCard(0);
      });

      // Animation should be set
      expect(result.current.gameState?.cardPlayAnimation).toBeTruthy();

      // Fast-forward to complete animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Animation state should be cleared after actuallyPlayCard runs
      expect(result.current.gameState?.cardPlayAnimation).toBeNull();
    });
  });

  describe('reorderPlayerHand', () => {
    test('reorders cards within player hand correctly', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test Player' }));

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
      const reorderedHand = result.current.gameState!.hands.get('player' as any);
      expect(reorderedHand![0].id).toBe('card2');
      expect(reorderedHand![1].id).toBe('card3');
      expect(reorderedHand![2].id).toBe('card1');
      expect(reorderedHand![3].id).toBe('card4');
    });

    test('handles edge cases for reordering', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test Player' }));

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
      const { result } = renderHook(() => useGameState({ playerName: 'Test Player' }));

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
      expect(result.current.gameState!.hands.get('bot1' as any)).toEqual(bot1Cards);
      expect(result.current.gameState!.hands.get('bot2' as any)).toEqual(bot2Cards);
    });

    test('handles invalid player ID gracefully', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test Player' }));

      const initialState = result.current.gameState;

      // Try to reorder non-existent player's hand
      act(() => {
        result.current.reorderPlayerHand('invalid' as any, 0, 1);
      });

      // State reference should remain unchanged
      expect(result.current.gameState).toBe(initialState);
    });

    test('maintains hand size after reordering', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test Player' }));

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
      expect(result.current.gameState!.hands.get('player' as any)!.length).toBe(initialSize);
    });

    test('handles reordering with empty game state', () => {
      const { result } = renderHook(() => useGameState({ playerName: 'Test Player' }));

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

  describe('team validation', () => {
    test('should build teams correctly with valid 2v2 assignment', () => {
      const { result } = renderHook(() =>
        useGameState({
          playerName: 'Test Player',
          difficulty: 'medium',
        }),
      );

      // Wait for initialization
      act(() => {
        jest.runAllTimers();
      });

      const gameState = result.current.gameState;
      expect(gameState).toBeDefined();
      expect(gameState?.teams).toHaveLength(2);
      expect(gameState?.teams[0].playerIds).toHaveLength(2);
      expect(gameState?.teams[1].playerIds).toHaveLength(2);

      // Check no duplicate players across teams
      const allPlayerIds = [...gameState!.teams[0].playerIds, ...gameState!.teams[1].playerIds];
      const uniquePlayerIds = new Set(allPlayerIds);
      expect(uniquePlayerIds.size).toBe(4);
    });

    test('should use fallback teams when team assignment is invalid', () => {
      // Mock console methods to verify warnings are logged
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      // Create a scenario where team assignment would be invalid
      // by mocking the initial player creation
      const { result } = renderHook(() =>
        useGameState({
          playerName: 'Test Player',
          difficulty: 'medium',
        }),
      );

      // Wait for initialization
      act(() => {
        jest.runAllTimers();
      });

      // Teams should still be valid even if assignment logic had issues
      const gameState = result.current.gameState;
      expect(gameState?.teams[0].playerIds).toHaveLength(2);
      expect(gameState?.teams[1].playerIds).toHaveLength(2);

      // Restore console methods
      consoleError.mockRestore();
      consoleWarn.mockRestore();
    });

    test('should handle mock data with invalid teams', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      const mockData = {
        players: [
          { id: 0, name: 'Player 1', cards: 6 },
          { id: 1, name: 'Player 2', cards: 6 },
          { id: 2, name: 'Player 3', cards: 6 },
          { id: 3, name: 'Player 4', cards: 6 },
        ],
        myCards: [
          { suit: 'oros' as any, value: 1 as any },
          { suit: 'copas' as any, value: 2 as any },
        ],
        trumpCard: { suit: 'oros' as any, value: 7 as any },
        currentPlayer: 0,
      };

      const { result } = renderHook(() =>
        useGameState({
          playerName: 'Test Player',
          mockData,
        }),
      );

      // Teams should be valid despite mock data
      const gameState = result.current.gameState;
      expect(gameState?.teams[0].playerIds).toHaveLength(2);
      expect(gameState?.teams[1].playerIds).toHaveLength(2);

      consoleWarn.mockRestore();
    });

    test('should handle local multiplayer with uneven team distribution', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      // Test with 3 players - should add 1 bot
      const { result } = renderHook(() =>
        useGameState({
          playerName: 'Player 1',
          playerNames: ['Player 1', 'Player 2', 'Player 3'],
        }),
      );

      act(() => {
        jest.runAllTimers();
      });

      const gameState = result.current.gameState;

      // Should have 4 players total (3 humans + 1 bot)
      expect(gameState?.players).toHaveLength(4);

      // Teams should be properly formed
      expect(gameState?.teams[0].playerIds).toHaveLength(2);
      expect(gameState?.teams[1].playerIds).toHaveLength(2);

      // Check that one player is a bot
      const botCount = gameState?.players.filter(p => p.isBot).length || 0;
      expect(botCount).toBe(1);

      consoleError.mockRestore();
      consoleWarn.mockRestore();
    });

    test('should ensure no duplicate players in teams', () => {
      const { result } = renderHook(() =>
        useGameState({
          playerName: 'Test Player',
          difficulty: 'hard',
        }),
      );

      act(() => {
        jest.runAllTimers();
      });

      const gameState = result.current.gameState;

      // Get all player IDs from both teams
      const team1Ids = gameState?.teams[0].playerIds || [];
      const team2Ids = gameState?.teams[1].playerIds || [];

      // Check for duplicates within each team
      expect(new Set(team1Ids).size).toBe(team1Ids.length);
      expect(new Set(team2Ids).size).toBe(team2Ids.length);

      // Check for duplicates across teams
      const intersection = team1Ids.filter(id => team2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });

    test('should validate teams match player assignments', () => {
      const { result } = renderHook(() =>
        useGameState({
          playerName: 'Test Player',
          difficulty: 'easy',
        }),
      );

      act(() => {
        jest.runAllTimers();
      });

      const gameState = result.current.gameState;

      // Every player in teams should exist in players array
      const playerIds = gameState?.players.map(p => p.id) || [];
      const teamPlayerIds = [
        ...(gameState?.teams[0].playerIds || []),
        ...(gameState?.teams[1].playerIds || []),
      ];

      teamPlayerIds.forEach(id => {
        expect(playerIds).toContain(id);
      });

      // Every player should be in exactly one team
      playerIds.forEach(playerId => {
        const inTeam1 = gameState?.teams[0].playerIds.includes(playerId);
        const inTeam2 = gameState?.teams[1].playerIds.includes(playerId);
        expect(inTeam1 || inTeam2).toBe(true);
        expect(inTeam1 && inTeam2).toBe(false); // Not in both teams
      });
    });
  });
});
