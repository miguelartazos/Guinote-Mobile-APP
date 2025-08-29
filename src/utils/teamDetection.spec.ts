import { describe, test, expect } from '@jest/globals';
import type { GameState, TeamId, PlayerId, Team } from '../types/game.types';
import { findPlayerTeam } from './gameLogic';
import { calculateTrickResult, applyTrickScoring, applyLastTrickBonus } from './gameEngineHelpers';
import type { TrickCard } from '../types/game.types';

describe('Team Detection Edge Cases', () => {
  const createMockGameState = (teams: Team[]): GameState => ({
    id: 'test' as any,
    phase: 'playing',
    players: [
      { id: 'p1' as PlayerId, name: 'Player 1' },
      { id: 'p2' as PlayerId, name: 'Player 2' },
      { id: 'p3' as PlayerId, name: 'Player 3' },
      { id: 'p4' as PlayerId, name: 'Player 4' },
    ] as any,
    teams: teams as [Team, Team],
    deck: [],
    hands: new Map(),
    trumpSuit: 'oros',
    trumpCard: { id: 'trump' as any, suit: 'oros', value: 7 },
    currentTrick: [],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trickCount: 0,
    trickWins: new Map(),
    collectedTricks: new Map(),
    teamTrickPiles: new Map(),
    canCambiar7: false,
    gameHistory: [],
    isVueltas: false,
    canDeclareVictory: false,
  });

  describe('findPlayerTeam', () => {
    test('returns team id for valid player', () => {
      const teams: Team[] = [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
      ];

      const gameState = createMockGameState(teams);

      expect(findPlayerTeam('p1' as PlayerId, gameState)).toBe('team1');
      expect(findPlayerTeam('p2' as PlayerId, gameState)).toBe('team2');
      expect(findPlayerTeam('p3' as PlayerId, gameState)).toBe('team1');
      expect(findPlayerTeam('p4' as PlayerId, gameState)).toBe('team2');
    });

    test('returns undefined for invalid player id', () => {
      const teams: Team[] = [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
      ];

      const gameState = createMockGameState(teams);

      expect(findPlayerTeam('invalid' as PlayerId, gameState)).toBeUndefined();
      expect(findPlayerTeam('' as PlayerId, gameState)).toBeUndefined();
      expect(findPlayerTeam(null as any, gameState)).toBeUndefined();
      expect(findPlayerTeam(undefined as any, gameState)).toBeUndefined();
    });

    test('returns undefined when teams array is malformed', () => {
      const teams: Team[] = [
        {
          id: 'team1' as TeamId,
          playerIds: [], // Empty team
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
      ];

      const gameState = createMockGameState(teams);

      expect(findPlayerTeam('p1' as PlayerId, gameState)).toBeUndefined();
      expect(findPlayerTeam('p3' as PlayerId, gameState)).toBeUndefined();
      expect(findPlayerTeam('p4' as PlayerId, gameState)).toBeUndefined();
    });
  });

  describe('calculateTrickResult with team detection', () => {
    test('handles valid player with team', () => {
      const teams: Team[] = [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
      ];

      const gameState = createMockGameState(teams);
      const trick: TrickCard[] = [
        { playerId: 'p1' as PlayerId, card: { id: 'c1' as any, suit: 'oros', value: 1 } },
        { playerId: 'p2' as PlayerId, card: { id: 'c2' as any, suit: 'oros', value: 2 } },
        { playerId: 'p3' as PlayerId, card: { id: 'c3' as any, suit: 'oros', value: 3 } },
        { playerId: 'p4' as PlayerId, card: { id: 'c4' as any, suit: 'oros', value: 7 } },
      ];

      const result = calculateTrickResult(trick, 'oros', gameState);

      expect(result.winnerId).toBe('p1'); // As (1) wins
      expect(result.winnerTeam).toBe('team1');
      expect(result.points).toBe(11 + 0 + 10 + 0); // As + 2 + 3 + 7
    });

    test('returns undefined team for invalid player', () => {
      const teams: Team[] = [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
      ];

      const gameState = createMockGameState(teams);
      const trick: TrickCard[] = [
        { playerId: 'invalid' as PlayerId, card: { id: 'c1' as any, suit: 'oros', value: 1 } },
        { playerId: 'p2' as PlayerId, card: { id: 'c2' as any, suit: 'oros', value: 2 } },
        { playerId: 'p3' as PlayerId, card: { id: 'c3' as any, suit: 'oros', value: 3 } },
        { playerId: 'p4' as PlayerId, card: { id: 'c4' as any, suit: 'oros', value: 7 } },
      ];

      const result = calculateTrickResult(trick, 'oros', gameState);

      expect(result.winnerId).toBe('invalid'); // As (1) still wins
      expect(result.winnerTeam).toBeUndefined(); // But no team found
    });
  });

  describe('applyTrickScoring with defensive checks', () => {
    test('handles valid team correctly', () => {
      const teams: Team[] = [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 50,
          cardPoints: 20,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 45,
          cardPoints: 15,
          cantes: [],
        },
      ];

      const gameState = createMockGameState(teams);
      const trickResult = {
        winnerId: 'p1' as PlayerId,
        winnerTeam: 'team1' as TeamId,
        points: 21,
        cards: [] as TrickCard[],
      };

      const newState = applyTrickScoring(gameState, trickResult);

      expect(newState.teams[0].score).toBe(71); // 50 + 21
      expect(newState.teams[0].cardPoints).toBe(41); // 20 + 21
      expect(newState.teams[1].score).toBe(45); // unchanged
    });

    test('returns unchanged state when team is undefined', () => {
      const teams: Team[] = [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 50,
          cardPoints: 20,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 45,
          cardPoints: 15,
          cantes: [],
        },
      ];

      const gameState = createMockGameState(teams);
      const trickResult = {
        winnerId: 'invalid' as PlayerId,
        winnerTeam: undefined,
        points: 21,
        cards: [] as TrickCard[],
      };

      const newState = applyTrickScoring(gameState, trickResult);

      // State should be unchanged
      expect(newState).toBe(gameState);
      expect(newState.teams[0].score).toBe(50);
      expect(newState.teams[1].score).toBe(45);
    });
  });

  describe('applyLastTrickBonus with defensive checks', () => {
    test('applies bonus for valid team', () => {
      const teams: Team[] = [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 90,
          cardPoints: 40,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 85,
          cardPoints: 35,
          cantes: [],
        },
      ];

      const gameState = createMockGameState(teams);
      const newState = applyLastTrickBonus(gameState, 'team1' as TeamId);

      expect(newState.teams[0].score).toBe(100); // 90 + 10
      expect(newState.teams[1].score).toBe(85); // unchanged
    });

    test('returns unchanged state when team is undefined', () => {
      const teams: Team[] = [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 90,
          cardPoints: 40,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 85,
          cardPoints: 35,
          cantes: [],
        },
      ];

      const gameState = createMockGameState(teams);
      const newState = applyLastTrickBonus(gameState, undefined);

      // State should be unchanged
      expect(newState).toBe(gameState);
      expect(newState.teams[0].score).toBe(90);
      expect(newState.teams[1].score).toBe(85);
    });
  });
});
