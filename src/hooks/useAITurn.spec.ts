import { renderHook, act } from '@testing-library/react-native';
import { useAITurn } from './useAITurn';
import type { GameState, Player, Team, Card } from '../types/game.types';
import type { CardMemory } from '../utils/aiMemory';
import { createMemory } from '../utils/aiMemory';
import * as aiPlayer from '../utils/aiPlayer';

// Mock the AI player utilities
jest.mock('../utils/aiPlayer');

describe('useAITurn - Cante Workflow', () => {
  let mockGameState: GameState;
  let mockPlayCard: jest.Mock;
  let mockCantar: jest.Mock;
  let mockSetAIMemory: jest.Mock;
  let mockAIMemory: CardMemory;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    mockPlayCard = jest.fn();
    mockCantar = jest.fn();
    mockSetAIMemory = jest.fn();
    mockAIMemory = createMemory();

    // Create a basic game state with bot as current player
    mockGameState = {
      id: 'test-game' as any,
      phase: 'playing',
      players: [
        { id: 'human' as any, name: 'Human', isBot: false } as Player,
        { id: 'bot1' as any, name: 'Bot 1', isBot: true } as Player,
        { id: 'bot2' as any, name: 'Bot 2', isBot: true } as Player,
        { id: 'bot3' as any, name: 'Bot 3', isBot: true } as Player,
      ],
      teams: [
        {
          id: 'team1' as any,
          playerIds: ['human', 'bot2'] as any,
          score: 50,
          cardPoints: 20,
          cantes: [],
        },
        {
          id: 'team2' as any,
          playerIds: ['bot1', 'bot3'] as any,
          score: 45,
          cardPoints: 15,
          cantes: [],
        },
      ] as [Team, Team],
      currentPlayerIndex: 1, // Bot 1's turn
      currentTrick: [],
      lastTrickWinner: 'bot1' as any, // Bot won last trick, can cante
      trumpSuit: 'oros',
      trumpCard: { id: 'trump' as any, suit: 'oros', value: 7 } as Card,
      deck: [],
      hands: new Map([
        ['human', []],
        [
          'bot1',
          [
            { id: 'card1' as any, suit: 'oros', value: 11 } as Card,
            { id: 'card2' as any, suit: 'oros', value: 12 } as Card,
            { id: 'card3' as any, suit: 'copas', value: 5 } as Card,
          ],
        ],
        ['bot2', []],
        ['bot3', []],
      ]),
      dealerIndex: 0,
      trickCount: 5,
      trickWins: new Map(),
      canCambiar7: false,
      gameHistory: [],
      isVueltas: false,
      canDeclareVictory: false,
      lastActionTimestamp: Date.now(),
    } as GameState;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('bot plays card after declaring cante', async () => {
    // Mock AI functions
    (aiPlayer.shouldAICante as jest.Mock).mockReturnValue('oros');
    (aiPlayer.playAICard as jest.Mock).mockReturnValue({
      id: 'card3' as any,
      suit: 'copas',
      value: 5,
    });
    (aiPlayer.getAIThinkingTime as jest.Mock).mockReturnValue(500);

    const { result } = renderHook(() =>
      useAITurn({
        gameState: mockGameState,
        currentTurnKey: 'bot1-turn-1',
        mockData: undefined,
        playCard: mockPlayCard,
        cantar: mockCantar,
        aiMemory: mockAIMemory,
        setAIMemory: mockSetAIMemory,
      }),
    );

    // Initially thinking
    expect(result.current.thinkingPlayer).toBe('bot1');

    // Fast-forward through thinking time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Verify cantar was called
    expect(mockCantar).toHaveBeenCalledWith('oros');

    // Verify playCard was called immediately after (no delay)
    expect(mockPlayCard).toHaveBeenCalledWith('card3');

    // Verify no longer thinking
    expect(result.current.thinkingPlayer).toBeNull();
  });

  test('bot still plays card if cante throws error', async () => {
    // Mock cantar to throw error
    mockCantar.mockImplementation(() => {
      throw new Error('Cante error');
    });

    (aiPlayer.shouldAICante as jest.Mock).mockReturnValue('oros');
    (aiPlayer.playAICard as jest.Mock).mockReturnValue({
      id: 'card3' as any,
      suit: 'copas',
      value: 5,
    });
    (aiPlayer.getAIThinkingTime as jest.Mock).mockReturnValue(500);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() =>
      useAITurn({
        gameState: mockGameState,
        currentTurnKey: 'bot1-turn-2',
        mockData: undefined,
        playCard: mockPlayCard,
        cantar: mockCantar,
        aiMemory: mockAIMemory,
        setAIMemory: mockSetAIMemory,
      }),
    );

    // Fast-forward through thinking time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith('❌ Error declaring cante:', expect.any(Error));

    // Verify playCard was still called despite error
    expect(mockPlayCard).toHaveBeenCalledWith('card3');

    consoleSpy.mockRestore();
  });

  test('recovery timer stays armed during cante until card is played', async () => {
    (aiPlayer.shouldAICante as jest.Mock).mockReturnValue('oros');
    (aiPlayer.playAICard as jest.Mock).mockReturnValue({
      id: 'card3' as any,
      suit: 'copas',
      value: 5,
    });
    (aiPlayer.getAIThinkingTime as jest.Mock).mockReturnValue(500);

    const { result } = renderHook(() =>
      useAITurn({
        gameState: mockGameState,
        currentTurnKey: 'bot1-turn-3',
        mockData: undefined,
        playCard: mockPlayCard,
        cantar: mockCantar,
        aiMemory: mockAIMemory,
        setAIMemory: mockSetAIMemory,
      }),
    );

    // Fast-forward partially through thinking time
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Recovery timer should still be pending
    const pendingTimers = jest.getTimerCount();
    expect(pendingTimers).toBeGreaterThan(0);

    // Complete the turn
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Verify card was played
    expect(mockPlayCard).toHaveBeenCalled();
  });

  test('bot does not attempt cante when conditions are not met', async () => {
    // Remove last trick winner so bot can't cante
    mockGameState.lastTrickWinner = undefined;

    (aiPlayer.shouldAICante as jest.Mock).mockReturnValue('oros');
    (aiPlayer.playAICard as jest.Mock).mockReturnValue({
      id: 'card3' as any,
      suit: 'copas',
      value: 5,
    });
    (aiPlayer.getAIThinkingTime as jest.Mock).mockReturnValue(500);

    renderHook(() =>
      useAITurn({
        gameState: mockGameState,
        currentTurnKey: 'bot1-turn-4',
        mockData: undefined,
        playCard: mockPlayCard,
        cantar: mockCantar,
        aiMemory: mockAIMemory,
        setAIMemory: mockSetAIMemory,
      }),
    );

    // Fast-forward through thinking time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Verify cantar was NOT called
    expect(mockCantar).not.toHaveBeenCalled();

    // Verify playCard was still called
    expect(mockPlayCard).toHaveBeenCalledWith('card3');
  });
});
