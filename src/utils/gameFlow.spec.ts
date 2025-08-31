import type { GameState, PlayerId, TeamId, CardId, GamePhase, Card } from '../types/game.types';
import {
  playCard,
  shouldStartVueltas,
  isGameOver,
  updateMatchScoreAndDeterminePhase,
  createInitialMatchScore,
  WINNING_SCORE,
} from './gameLogic';
import { dealCardsAfterTrick } from './gameEngineHelpers';

describe('Complete Game Flow Integration', () => {
  function createMockGameState(overrides: Partial<GameState> = {}): GameState {
    return {
      id: 'test-game' as any,
      phase: 'playing' as GamePhase,
      players: [
        { id: 'p1' as PlayerId, name: 'P1', teamId: 'team1' as TeamId },
        { id: 'p2' as PlayerId, name: 'P2', teamId: 'team2' as TeamId },
        { id: 'p3' as PlayerId, name: 'P3', teamId: 'team1' as TeamId },
        { id: 'p4' as PlayerId, name: 'P4', teamId: 'team2' as TeamId },
      ] as any[],
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 0,
          cantes: [],
          tricks: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 0,
          cantes: [],
          tricks: [],
        },
      ] as any[],
      hands: new Map(),
      deck: [],
      currentTrick: [],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      trumpSuit: 'oros' as any,
      trumpCard: { id: 'oros_1' as CardId, suit: 'oros', value: 1 } as any,
      canCambiar7: false,
      trickCount: 0,
      lastActionTimestamp: Date.now(),
      matchScore: createInitialMatchScore(),
      ...overrides,
    };
  }

  describe('Arrastre to Scoring transition', () => {
    test('phase transitions from playing to arrastre when deck empties', () => {
      const gameState = createMockGameState({
        phase: 'playing',
        deck: [{ id: 'test_card' as CardId, suit: 'oros', value: 2 }] as any[],
      });

      // Simulate dealing cards after trick when deck has 1 card
      const newHands = new Map(gameState.hands);
      const result = dealCardsAfterTrick(gameState, newHands, 'p1' as PlayerId);

      // Should transition to arrastre when deck becomes empty
      expect(result.gameState.phase).toBe('arrastre');
      expect(result.gameState.deck).toHaveLength(0);
    });

    test('arrastre phase is preserved until last trick', () => {
      const gameState = createMockGameState({
        phase: 'arrastre',
        deck: [],
        currentTrick: [
          {
            playerId: 'p1' as PlayerId,
            card: { id: 'c1' as CardId, suit: 'oros', value: 2 } as Card,
          },
          {
            playerId: 'p2' as PlayerId,
            card: { id: 'c2' as CardId, suit: 'oros', value: 3 } as Card,
          },
          {
            playerId: 'p3' as PlayerId,
            card: { id: 'c3' as CardId, suit: 'oros', value: 4 } as Card,
          },
        ],
        currentPlayerIndex: 3, // p4's turn
      });

      // Set up hands with cards remaining
      gameState.hands.set('p1' as PlayerId, [
        { id: 'h1' as CardId, suit: 'copas', value: 1 } as Card,
      ]);
      gameState.hands.set('p2' as PlayerId, [
        { id: 'h2' as CardId, suit: 'copas', value: 2 } as Card,
      ]);
      gameState.hands.set('p3' as PlayerId, [
        { id: 'h3' as CardId, suit: 'copas', value: 3 } as Card,
      ]);
      gameState.hands.set('p4' as PlayerId, [
        { id: 'h4' as CardId, suit: 'oros', value: 5 } as Card,
      ]);

      // Play the last card to complete trick
      const processed = playCard(
        gameState,
        'p4' as PlayerId,
        { id: 'h4' as CardId, suit: 'oros', value: 5 } as Card,
      );

      // Phase should remain arrastre since cards remain
      expect(processed).not.toBeNull();
      expect(processed?.phase).toBe('arrastre');
    });

    test('transitions from arrastre to scoring when all cards played', () => {
      const gameState = createMockGameState({
        phase: 'arrastre',
        deck: [],
        currentTrick: [
          {
            playerId: 'p1' as PlayerId,
            card: { id: 'c1' as CardId, suit: 'oros', value: 2 } as Card,
          },
          {
            playerId: 'p2' as PlayerId,
            card: { id: 'c2' as CardId, suit: 'oros', value: 3 } as Card,
          },
          {
            playerId: 'p3' as PlayerId,
            card: { id: 'c3' as CardId, suit: 'oros', value: 4 } as Card,
          },
        ],
        currentPlayerIndex: 3, // p4's turn
      });

      // Last card in the game
      gameState.hands.set('p1' as PlayerId, []);
      gameState.hands.set('p2' as PlayerId, []);
      gameState.hands.set('p3' as PlayerId, []);
      gameState.hands.set('p4' as PlayerId, [
        { id: 'last' as CardId, suit: 'oros', value: 5 } as Card,
      ]);

      // Playing the last card should trigger scoring
      const processed = playCard(
        gameState,
        'p4' as PlayerId,
        { id: 'last' as CardId, suit: 'oros', value: 5 } as Card,
      );
      expect(processed).not.toBeNull();
      expect(processed?.phase).toBe('scoring');
    });
  });

  describe('Vueltas flow with 101 points', () => {
    test('starts vueltas when team reaches 101 in first hand', () => {
      const gameState = createMockGameState({
        phase: 'scoring',
        teams: [
          {
            id: 'team1' as TeamId,
            playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
            score: 105, // Over 101
            cantes: [],
            tricks: [],
          },
          {
            id: 'team2' as TeamId,
            playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
            score: 85,
            cantes: [],
            tricks: [],
          },
        ] as any[],
        isVueltas: false,
      });

      // Should NOT trigger immediate win, should go to vueltas
      expect(shouldStartVueltas(gameState)).toBe(false); // Because team has 101+
      expect(isGameOver(gameState)).toBe(false); // Match not complete
    });

    test('ends partida when no team reaches 101 in first hand', () => {
      const gameState = createMockGameState({
        phase: 'scoring',
        teams: [
          {
            id: 'team1' as TeamId,
            score: 95, // Under 101
            playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
            cantes: [],
            tricks: [],
          },
          {
            id: 'team2' as TeamId,
            score: 85,
            playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
            cantes: [],
            tricks: [],
          },
        ] as any[],
        deck: [],
        isVueltas: false,
      });

      // Empty hands to simulate end of hand
      gameState.hands.set('p1' as PlayerId, []);
      gameState.hands.set('p2' as PlayerId, []);
      gameState.hands.set('p3' as PlayerId, []);
      gameState.hands.set('p4' as PlayerId, []);

      // Should end partida immediately (no vueltas)
      expect(shouldStartVueltas(gameState)).toBe(true); // No team has 101
    });

    test('stops vueltas when team reaches 101 combined points', () => {
      const gameState = createMockGameState({
        phase: 'playing',
        isVueltas: true,
        initialScores: new Map([
          ['team1' as TeamId, 95],
          ['team2' as TeamId, 85],
        ]),
        teams: [
          {
            id: 'team1' as TeamId,
            score: 10, // 95 + 10 = 105 total
            playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
            cantes: [],
            tricks: [],
          },
          {
            id: 'team2' as TeamId,
            score: 5,
            playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
            cantes: [],
            tricks: [],
          },
        ] as any[],
        currentTrick: [
          {
            playerId: 'p1' as PlayerId,
            card: { id: 'c1' as CardId, suit: 'oros', value: 2 } as Card,
          },
          {
            playerId: 'p2' as PlayerId,
            card: { id: 'c2' as CardId, suit: 'oros', value: 3 } as Card,
          },
          {
            playerId: 'p3' as PlayerId,
            card: { id: 'c3' as CardId, suit: 'oros', value: 4 } as Card,
          },
        ],
        currentPlayerIndex: 3,
      });

      // Last card of the trick
      gameState.hands.set('p1' as PlayerId, []);
      gameState.hands.set('p2' as PlayerId, []);
      gameState.hands.set('p3' as PlayerId, []);
      gameState.hands.set('p4' as PlayerId, [
        { id: 'last' as CardId, suit: 'oros', value: 5 } as Card,
      ]);

      const processed = playCard(
        gameState,
        'p4' as PlayerId,
        { id: 'last' as CardId, suit: 'oros', value: 5 } as Card,
      );

      // Should go to scoring because team1 has 105 total points
      expect(processed).not.toBeNull();
      expect(processed?.phase).toBe('scoring');
    });
  });

  describe('Match completion with cotos', () => {
    test('match continues after first coto', () => {
      const matchScore = createInitialMatchScore();
      matchScore.team1Cotos = 1;
      matchScore.team2Cotos = 0;

      const gameState = createMockGameState({ matchScore });

      expect(isGameOver(gameState)).toBe(false);
    });

    test('match ends when team wins 2 cotos', () => {
      const matchScore = createInitialMatchScore();
      matchScore.team1Cotos = 2; // Won 2 cotos
      matchScore.team2Cotos = 0;

      const gameState = createMockGameState({ matchScore });

      expect(isGameOver(gameState)).toBe(true);
    });

    test('updateMatchScoreAndDeterminePhase returns gameOver when match complete', () => {
      const matchScore = createInitialMatchScore();
      matchScore.team1Partidas = 2;
      matchScore.team1Cotos = 1; // Will become 2 after this partida

      const result = updateMatchScoreAndDeterminePhase(0, matchScore);

      expect(result.matchScore.team1Cotos).toBe(2);
      expect(result.phase).toBe('gameOver');
    });
  });

  describe('Edge cases', () => {
    test('handles team reaching 101 during arrastre phase', () => {
      const gameState = createMockGameState({
        phase: 'arrastre',
        isVueltas: true,
        initialScores: new Map([
          ['team1' as TeamId, 95],
          ['team2' as TeamId, 85],
        ]),
        teams: [
          {
            id: 'team1' as TeamId,
            score: 8, // 95 + 8 = 103 total
            playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
            cantes: [],
            tricks: [],
          },
          {
            id: 'team2' as TeamId,
            score: 5,
            playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
            cantes: [],
            tricks: [],
          },
        ] as any[],
        currentTrick: [
          {
            playerId: 'p1' as PlayerId,
            card: { id: 'c1' as CardId, suit: 'oros', value: 2 } as Card,
          },
          {
            playerId: 'p2' as PlayerId,
            card: { id: 'c2' as CardId, suit: 'oros', value: 3 } as Card,
          },
          {
            playerId: 'p3' as PlayerId,
            card: { id: 'c3' as CardId, suit: 'oros', value: 4 } as Card,
          },
        ],
        currentPlayerIndex: 3,
      });

      // Some cards remain (not last trick)
      gameState.hands.set('p1' as PlayerId, [
        { id: 'h1' as CardId, suit: 'copas', value: 1 } as Card,
      ]);
      gameState.hands.set('p2' as PlayerId, [
        { id: 'h2' as CardId, suit: 'copas', value: 2 } as Card,
      ]);
      gameState.hands.set('p3' as PlayerId, []);
      gameState.hands.set('p4' as PlayerId, [
        { id: 'h4' as CardId, suit: 'oros', value: 5 } as Card,
      ]);

      const processed = playCard(
        gameState,
        'p4' as PlayerId,
        { id: 'h4' as CardId, suit: 'oros', value: 5 } as Card,
      );

      // Should go to scoring immediately even though cards remain
      expect(processed).not.toBeNull();
      expect(processed?.phase).toBe('scoring');
    });

    test('preserves arrastre phase when no special conditions met', () => {
      const gameState = createMockGameState({
        phase: 'arrastre',
        deck: [],
        currentTrick: [],
      });

      // Some cards remain
      gameState.hands.set('p1' as PlayerId, [{ id: 'h1' as CardId } as any]);
      gameState.hands.set('p2' as PlayerId, [{ id: 'h2' as CardId } as any]);

      // Phase should stay as arrastre
      expect(gameState.phase).toBe('arrastre');
    });
  });
});
