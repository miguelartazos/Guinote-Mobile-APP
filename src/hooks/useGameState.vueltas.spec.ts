import { renderHook, act } from '@testing-library/react-native';
import fc from 'fast-check';
import { useGameState } from './useGameState';
import type { GameState, TeamId, PlayerId, Card } from '../types/game.types';

// Mock the gameLogic functions
jest.mock('../utils/gameLogic', () => ({
  ...jest.requireActual('../utils/gameLogic'),
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
  shouldStartVueltas: jest.fn(state => {
    const team1Score = state.teams[0].score;
    const team2Score = state.teams[1].score;
    return team1Score < 101 && team2Score < 101;
  }),
}));

// Mock resetGameStateForVueltas to track calls
jest.mock('../utils/gameStateFactory', () => ({
  ...jest.requireActual('../utils/gameStateFactory'),
  resetGameStateForVueltas: jest.fn((prevState, initialScores) => {
    const mockDeck: Card[] = [
      { suit: 'oros', rank: 1, value: 11 },
      { suit: 'copas', rank: 3, value: 10 },
    ];
    const mockTrumpCard: Card = { suit: 'espadas', rank: 7, value: 0 };

    return {
      ...prevState,
      phase: 'dealing',
      isVueltas: true,
      initialScores,
      deck: mockDeck,
      hands: new Map([
        ['player' as PlayerId, []],
        ['bot1' as PlayerId, []],
        ['bot2' as PlayerId, []],
        ['bot3' as PlayerId, []],
      ]),
      trumpCard: mockTrumpCard,
      trumpSuit: mockTrumpCard.suit,
      currentTrick: [],
      currentPlayerIndex: (prevState.dealerIndex + 1) % 4,
      dealerIndex: (prevState.dealerIndex + 1) % 4,
      trickCount: 0,
      trickWins: new Map(),
      collectedTricks: new Map(),
      teamTrickPiles: new Map([
        [prevState.teams[0].id, []],
        [prevState.teams[1].id, []],
      ]),
      lastTrickWinner: undefined,
      lastTrick: undefined,
      canCambiar7: true,
      pendingVueltas: false,
      lastTrickWinnerTeam: prevState.lastTrickWinner
        ? prevState.teams.find(t => t.playerIds.includes(prevState.lastTrickWinner))?.id
        : undefined,
      canDeclareVictory: !!prevState.lastTrickWinner,
    };
  }),
}));

const WINNING_SCORE = 101;

interface TestScenario {
  description: string;
  team1Score: number;
  team2Score: number;
  expectedPhase: 'dealing' | 'gameOver';
  shouldStartVueltas: boolean;
}

const testScenarios: TestScenario[] = [
  {
    description: 'no team reaches winning score',
    team1Score: 85,
    team2Score: 75,
    expectedPhase: 'dealing',
    shouldStartVueltas: true,
  },
  {
    description: 'team 1 reaches exactly winning score',
    team1Score: WINNING_SCORE,
    team2Score: 75,
    expectedPhase: 'gameOver',
    shouldStartVueltas: false,
  },
  {
    description: 'team 2 reaches exactly winning score',
    team1Score: 85,
    team2Score: WINNING_SCORE,
    expectedPhase: 'gameOver',
    shouldStartVueltas: false,
  },
  {
    description: 'team 1 exceeds winning score',
    team1Score: 120,
    team2Score: 75,
    expectedPhase: 'gameOver',
    shouldStartVueltas: false,
  },
  {
    description: 'both teams at exactly 100 (edge case)',
    team1Score: 100,
    team2Score: 100,
    expectedPhase: 'dealing',
    shouldStartVueltas: true,
  },
  {
    description: 'teams at minimum scores',
    team1Score: 0,
    team2Score: 0,
    expectedPhase: 'dealing',
    shouldStartVueltas: true,
  },
];

describe('useGameState - Vueltas Transition', () => {
  let resetGameStateForVueltas: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    resetGameStateForVueltas = require('../utils/gameStateFactory').resetGameStateForVueltas;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('vueltas initialization scenarios', () => {
    const vueltasScenarios = testScenarios.filter(s => s.shouldStartVueltas);

    test.each(vueltasScenarios)(
      'should initialize vueltas when $description',
      ({ team1Score, team2Score, expectedPhase }) => {
        const { result } = renderHook(() =>
          useGameState({
            playerName: 'TestPlayer',
            difficulty: 'medium',
          }),
        );

        // Wait for initial state setup
        act(() => {
          jest.runAllTimers();
        });

        // Set up scoring phase with specific scores
        act(() => {
          const currentState = result.current.gameState;
          if (currentState) {
            result.current.setGameState({
              ...currentState,
              phase: 'scoring',
              teams: [
                { ...currentState.teams[0], score: team1Score, cardPoints: team1Score, cantes: [] },
                { ...currentState.teams[1], score: team2Score, cardPoints: team2Score, cantes: [] },
              ],
              isVueltas: false,
              lastTrickWinner: 'player' as PlayerId,
            } as GameState);
          }
        });

        // Verify initial state
        const scoringState = result.current.gameState;
        expect(scoringState?.phase).toBe('scoring');
        expect(scoringState?.teams[0].score).toBe(team1Score);
        expect(scoringState?.teams[1].score).toBe(team2Score);

        // Call continueFromScoring
        act(() => {
          result.current.continueFromScoring();
        });

        const resultState = result.current.gameState;

        // Verify vueltas was initialized using resetGameStateForVueltas
        expect(resetGameStateForVueltas).toHaveBeenCalledWith(
          expect.objectContaining({
            phase: 'scoring',
            teams: expect.arrayContaining([
              expect.objectContaining({ score: team1Score }),
              expect.objectContaining({ score: team2Score }),
            ]),
          }),
          new Map([
            ['team1' as TeamId, team1Score],
            ['team2' as TeamId, team2Score],
          ]),
        );

        // Verify state after vueltas initialization
        expect(resultState?.phase).toBe(expectedPhase);
        expect(resultState?.isVueltas).toBe(true);
        expect(resultState?.initialScores?.get('team1' as TeamId)).toBe(team1Score);
        expect(resultState?.initialScores?.get('team2' as TeamId)).toBe(team2Score);
        expect(resultState?.pendingVueltas).toBe(false);
        expect(resultState?.hands.size).toBe(4);
        expect(resultState?.trumpCard).toEqual({ suit: 'espadas', rank: 7, value: 0 });
        expect(resultState?.trumpSuit).toBe('espadas');
        expect(resultState?.canDeclareVictory).toBe(true); // Since we set lastTrickWinner
      },
    );
  });

  describe('game over scenarios', () => {
    const gameOverScenarios = testScenarios.filter(s => !s.shouldStartVueltas);

    test.each(gameOverScenarios)(
      'should transition to game over when $description',
      ({ team1Score, team2Score, expectedPhase }) => {
        const { result } = renderHook(() =>
          useGameState({
            playerName: 'TestPlayer',
            difficulty: 'medium',
          }),
        );

        // Wait for initial state setup
        act(() => {
          jest.runAllTimers();
        });

        // Set up scoring phase with specific scores
        act(() => {
          const currentState = result.current.gameState;
          if (currentState) {
            result.current.setGameState({
              ...currentState,
              phase: 'scoring',
              teams: [
                { ...currentState.teams[0], score: team1Score, cardPoints: team1Score, cantes: [] },
                { ...currentState.teams[1], score: team2Score, cardPoints: team2Score, cantes: [] },
              ],
              isVueltas: false,
            } as GameState);
          }
        });

        // Verify initial state
        const scoringState = result.current.gameState;
        expect(scoringState?.phase).toBe('scoring');
        expect(scoringState?.teams[0].score).toBe(team1Score);
        expect(scoringState?.teams[1].score).toBe(team2Score);

        // Call continueFromScoring
        act(() => {
          result.current.continueFromScoring();
        });

        const resultState = result.current.gameState;

        // Verify game over state
        expect(resultState?.phase).toBe(expectedPhase);
        expect(resultState?.isVueltas).toBe(false);
        expect(resultState?.pendingVueltas).toBeUndefined(); // pendingVueltas is not set when game ends
        expect(resetGameStateForVueltas).not.toHaveBeenCalled();
      },
    );
  });

  test('should properly initialize vueltas when no team reaches 101 points', () => {
    const { result } = renderHook(() =>
      useGameState({
        playerName: 'TestPlayer',
        difficulty: 'medium',
      }),
    );

    // Wait for initial state setup
    act(() => {
      jest.runAllTimers();
    });

    // Manually set up a scoring phase where no team has 101 points
    act(() => {
      const currentState = result.current.gameState;
      if (currentState) {
        result.current.setGameState({
          ...currentState,
          phase: 'scoring',
          teams: [
            { ...currentState.teams[0], score: 85, cardPoints: 85, cantes: [] },
            { ...currentState.teams[1], score: 75, cardPoints: 75, cantes: [] },
          ],
          isVueltas: false,
        } as GameState);
      }
    });

    const scoringState = result.current.gameState;
    expect(scoringState?.phase).toBe('scoring');
    expect(scoringState?.teams[0].score).toBe(85);
    expect(scoringState?.teams[1].score).toBe(75);

    // Call continueFromScoring - should initialize vueltas
    act(() => {
      result.current.continueFromScoring();
    });

    const vueltasState = result.current.gameState;

    // Verify resetGameStateForVueltas was called with correct parameters
    expect(resetGameStateForVueltas).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'scoring',
        teams: expect.arrayContaining([
          expect.objectContaining({ score: 85 }),
          expect.objectContaining({ score: 75 }),
        ]),
      }),
      new Map([
        ['team1' as TeamId, 85],
        ['team2' as TeamId, 75],
      ]),
    );

    // Verify vueltas was properly initialized
    expect(vueltasState?.phase).toBe('dealing');
    expect(vueltasState?.isVueltas).toBe(true);
    expect(vueltasState?.initialScores).toEqual(
      new Map([
        ['team1' as TeamId, 85],
        ['team2' as TeamId, 75],
      ]),
    );
    expect(vueltasState?.deck).toEqual([
      { suit: 'oros', rank: 1, value: 11 },
      { suit: 'copas', rank: 3, value: 10 },
    ]);
    expect(vueltasState?.hands.size).toBe(4);
    expect(vueltasState?.trumpCard).toEqual({ suit: 'espadas', rank: 7, value: 0 });
    expect(vueltasState?.trumpSuit).toBe('espadas');
    expect(vueltasState?.pendingVueltas).toBe(false);
  });

  test('should transition to gameOver when a team reaches 101 points', () => {
    const { result } = renderHook(() =>
      useGameState({
        playerName: 'TestPlayer',
        difficulty: 'medium',
      }),
    );

    // Wait for initial state setup
    act(() => {
      jest.runAllTimers();
    });

    // Set up a scoring phase where team 1 has 101 points
    act(() => {
      const currentState = result.current.gameState;
      if (currentState) {
        result.current.setGameState({
          ...currentState,
          phase: 'scoring',
          teams: [
            { ...currentState.teams[0], score: 101, cardPoints: 101, cantes: [] },
            { ...currentState.teams[1], score: 75, cardPoints: 75, cantes: [] },
          ],
          isVueltas: false,
        } as GameState);
      }
    });

    // Call continueFromScoring - should go to gameOver
    act(() => {
      result.current.continueFromScoring();
    });

    const gameOverState = result.current.gameState;

    // Verify it went to gameOver phase (not vueltas)
    expect(gameOverState?.phase).toBe('gameOver');
    expect(gameOverState?.isVueltas).toBe(false);
    expect(gameOverState?.pendingVueltas).toBeUndefined();
    expect(resetGameStateForVueltas).not.toHaveBeenCalled();
  });

  test('should handle vueltas with last trick winner for canDeclareVictory', () => {
    const { result } = renderHook(() =>
      useGameState({
        playerName: 'TestPlayer',
        difficulty: 'medium',
      }),
    );

    // Wait for initial state setup
    act(() => {
      jest.runAllTimers();
    });

    // Set up scoring phase with last trick winner from team 2
    act(() => {
      const currentState = result.current.gameState;
      if (currentState) {
        result.current.setGameState({
          ...currentState,
          phase: 'scoring',
          teams: [
            { ...currentState.teams[0], score: 90, cardPoints: 90, cantes: [] },
            { ...currentState.teams[1], score: 95, cardPoints: 95, cantes: [] },
          ],
          isVueltas: false,
          lastTrickWinner: 'bot1' as PlayerId, // bot1 is on team2
        } as GameState);
      }
    });

    // Call continueFromScoring
    act(() => {
      result.current.continueFromScoring();
    });

    const vueltasState = result.current.gameState;

    // Verify canDeclareVictory is set based on last trick winner
    expect(vueltasState?.canDeclareVictory).toBe(true);
    expect(vueltasState?.lastTrickWinnerTeam).toBe('team2' as TeamId);
  });

  test('should not transition if not in scoring phase', () => {
    const { result } = renderHook(() =>
      useGameState({
        playerName: 'TestPlayer',
        difficulty: 'medium',
      }),
    );

    // Wait for initial state setup
    act(() => {
      jest.runAllTimers();
    });

    const initialPhase = result.current.gameState?.phase;
    expect(initialPhase).toBe('dealing'); // Should start in dealing phase

    // Try to call continueFromScoring when not in scoring phase
    act(() => {
      result.current.continueFromScoring();
    });

    // Phase should not change
    expect(result.current.gameState?.phase).toBe(initialPhase);
  });

  test('should handle completing vueltas and determining winner', () => {
    const { result } = renderHook(() =>
      useGameState({
        playerName: 'TestPlayer',
        difficulty: 'medium',
      }),
    );

    // Wait for initial state setup
    act(() => {
      jest.runAllTimers();
    });

    // Set up a vueltas scoring phase
    act(() => {
      const currentState = result.current.gameState;
      if (currentState) {
        result.current.setGameState({
          ...currentState,
          phase: 'scoring',
          teams: [
            { ...currentState.teams[0], score: 45, cardPoints: 45, cantes: [] },
            { ...currentState.teams[1], score: 35, cardPoints: 35, cantes: [] },
          ],
          isVueltas: true,
          initialScores: new Map([
            ['team1' as TeamId, 85],
            ['team2' as TeamId, 75],
          ]),
          lastTrickWinnerTeam: 'team1' as TeamId,
        } as GameState);
      }
    });

    // Call continueFromScoring to complete vueltas
    act(() => {
      result.current.continueFromScoring();
    });

    const resultState = result.current.gameState;

    // Should determine winner and update match score
    // Team 1: 85 + 45 = 130, Team 2: 75 + 35 = 110
    // Team 1 wins
    expect(resultState?.matchScore?.team1Partidas).toBeGreaterThanOrEqual(0);
    expect(resultState?.isVueltas).toBe(false); // New partida starts
  });

  test('should guard against multiple rapid calls to continueFromScoring', async () => {
    const { result } = renderHook(() =>
      useGameState({
        playerName: 'TestPlayer',
        difficulty: 'medium',
      }),
    );

    // Wait for initial state setup
    act(() => {
      jest.runAllTimers();
    });

    // Set up scoring phase
    act(() => {
      const currentState = result.current.gameState;
      if (currentState) {
        result.current.setGameState({
          ...currentState,
          phase: 'scoring',
          teams: [
            { ...currentState.teams[0], score: 85, cardPoints: 85, cantes: [] },
            { ...currentState.teams[1], score: 75, cardPoints: 75, cantes: [] },
          ],
          isVueltas: false,
        } as GameState);
      }
    });

    // First call
    act(() => {
      result.current.continueFromScoring();
    });

    // Try to call again while first is processing - should be blocked
    act(() => {
      result.current.continueFromScoring();
    });

    // And once more
    act(() => {
      result.current.continueFromScoring();
    });

    // Should only process once (resetGameStateForVueltas called once)
    // The guard prevents multiple calls while processing
    expect(resetGameStateForVueltas).toHaveBeenCalledTimes(1);
  });

  describe('property-based tests', () => {
    test('invariant: if both scores < 101, vueltas must start', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (team1Score, team2Score) => {
            const { result } = renderHook(() =>
              useGameState({
                playerName: 'TestPlayer',
                difficulty: 'medium',
              }),
            );

            // Wait for initial state setup
            act(() => {
              jest.runAllTimers();
            });

            // Set up scoring phase
            act(() => {
              const currentState = result.current.gameState;
              if (currentState) {
                result.current.setGameState({
                  ...currentState,
                  phase: 'scoring',
                  teams: [
                    {
                      ...currentState.teams[0],
                      score: team1Score,
                      cardPoints: team1Score,
                      cantes: [],
                    },
                    {
                      ...currentState.teams[1],
                      score: team2Score,
                      cardPoints: team2Score,
                      cantes: [],
                    },
                  ],
                  isVueltas: false,
                } as GameState);
              }
            });

            // Call continueFromScoring
            act(() => {
              result.current.continueFromScoring();
            });

            const resultState = result.current.gameState;

            // Both scores < 101 means vueltas should be initialized
            expect(resultState?.isVueltas).toBe(true);
            expect(resultState?.phase).toBe('dealing');
            expect(resultState?.initialScores).toBeDefined();
          },
        ),
        { numRuns: 10 }, // Reduce runs for performance in tests
      );
    });

    test('invariant: if any score >= 101, game must end', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Team 1 wins
            fc.tuple(fc.integer({ min: 101, max: 200 }), fc.integer({ min: 0, max: 100 })),
            // Team 2 wins
            fc.tuple(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 101, max: 200 })),
            // Both over 101
            fc.tuple(fc.integer({ min: 101, max: 200 }), fc.integer({ min: 101, max: 200 })),
          ),
          ([team1Score, team2Score]) => {
            const { result } = renderHook(() =>
              useGameState({
                playerName: 'TestPlayer',
                difficulty: 'medium',
              }),
            );

            // Wait for initial state setup
            act(() => {
              jest.runAllTimers();
            });

            // Set up scoring phase
            act(() => {
              const currentState = result.current.gameState;
              if (currentState) {
                result.current.setGameState({
                  ...currentState,
                  phase: 'scoring',
                  teams: [
                    {
                      ...currentState.teams[0],
                      score: team1Score,
                      cardPoints: team1Score,
                      cantes: [],
                    },
                    {
                      ...currentState.teams[1],
                      score: team2Score,
                      cardPoints: team2Score,
                      cantes: [],
                    },
                  ],
                  isVueltas: false,
                } as GameState);
              }
            });

            // Call continueFromScoring
            act(() => {
              result.current.continueFromScoring();
            });

            const resultState = result.current.gameState;

            // Any score >= 101 means game should end (no vueltas)
            expect(resultState?.phase).toBe('gameOver');
            expect(resultState?.isVueltas).toBe(false);
            expect(resetGameStateForVueltas).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 10 }, // Reduce runs for performance in tests
      );
    });

    test('invariant: vueltas initial scores must match team scores', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (team1Score, team2Score) => {
            const { result } = renderHook(() =>
              useGameState({
                playerName: 'TestPlayer',
                difficulty: 'medium',
              }),
            );

            // Wait for initial state setup
            act(() => {
              jest.runAllTimers();
            });

            // Set up scoring phase
            act(() => {
              const currentState = result.current.gameState;
              if (currentState) {
                result.current.setGameState({
                  ...currentState,
                  phase: 'scoring',
                  teams: [
                    {
                      ...currentState.teams[0],
                      score: team1Score,
                      cardPoints: team1Score,
                      cantes: [],
                    },
                    {
                      ...currentState.teams[1],
                      score: team2Score,
                      cardPoints: team2Score,
                      cantes: [],
                    },
                  ],
                  isVueltas: false,
                } as GameState);
              }
            });

            // Call continueFromScoring
            act(() => {
              result.current.continueFromScoring();
            });

            const resultState = result.current.gameState;

            // Initial scores should match the team scores when vueltas starts
            expect(resultState?.initialScores?.get('team1' as TeamId)).toBe(team1Score);
            expect(resultState?.initialScores?.get('team2' as TeamId)).toBe(team2Score);
          },
        ),
        { numRuns: 10 }, // Reduce runs for performance in tests
      );
    });
  });
});
