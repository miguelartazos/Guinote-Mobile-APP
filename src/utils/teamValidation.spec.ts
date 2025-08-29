import { describe, test, expect } from '@jest/globals';
import type { GameState, TeamId, PlayerId, Team } from '../types/game.types';
import {
  hasTeam,
  getPlayerTeamSafe,
  areTeammates,
  isOnTeam,
  getOpposingTeam,
  getPlayerTeams,
  assertTeamExists,
} from './teamValidation';

describe('Team Validation Utilities', () => {
  const createMockGameState = (teams: Team[]): GameState =>
    ({
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
    } as GameState);

  const validTeams: Team[] = [
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

  describe('hasTeam', () => {
    test('returns true for player with team', () => {
      const gameState = createMockGameState(validTeams);
      expect(hasTeam('p1' as PlayerId, gameState)).toBe(true);
      expect(hasTeam('p2' as PlayerId, gameState)).toBe(true);
    });

    test('returns false for undefined player', () => {
      const gameState = createMockGameState(validTeams);
      expect(hasTeam(undefined, gameState)).toBe(false);
    });

    test('returns false for invalid player', () => {
      const gameState = createMockGameState(validTeams);
      expect(hasTeam('invalid' as PlayerId, gameState)).toBe(false);
    });

    test('type narrows correctly', () => {
      const gameState = createMockGameState(validTeams);
      const playerId: PlayerId | undefined = 'p1' as PlayerId;

      if (hasTeam(playerId, gameState)) {
        // TypeScript should know playerId is PlayerId here
        const _: PlayerId = playerId;
        expect(playerId).toBe('p1');
      }
    });
  });

  describe('getPlayerTeamSafe', () => {
    test('returns team for valid player', () => {
      const gameState = createMockGameState(validTeams);
      expect(getPlayerTeamSafe('p1' as PlayerId, gameState)).toBe('team1');
      expect(getPlayerTeamSafe('p2' as PlayerId, gameState)).toBe('team2');
    });

    test('returns undefined for invalid player', () => {
      const gameState = createMockGameState(validTeams);
      expect(getPlayerTeamSafe('invalid' as PlayerId, gameState)).toBeUndefined();
    });
  });

  describe('areTeammates', () => {
    test('returns true for players on same team', () => {
      const gameState = createMockGameState(validTeams);
      expect(areTeammates('p1' as PlayerId, 'p3' as PlayerId, gameState)).toBe(true);
      expect(areTeammates('p2' as PlayerId, 'p4' as PlayerId, gameState)).toBe(true);
    });

    test('returns false for players on different teams', () => {
      const gameState = createMockGameState(validTeams);
      expect(areTeammates('p1' as PlayerId, 'p2' as PlayerId, gameState)).toBe(false);
      expect(areTeammates('p3' as PlayerId, 'p4' as PlayerId, gameState)).toBe(false);
    });

    test('returns false if any player has no team', () => {
      const gameState = createMockGameState(validTeams);
      expect(areTeammates('p1' as PlayerId, 'invalid' as PlayerId, gameState)).toBe(false);
      expect(areTeammates('invalid' as PlayerId, 'p1' as PlayerId, gameState)).toBe(false);
    });
  });

  describe('isOnTeam', () => {
    test('returns true when player is on specified team', () => {
      const gameState = createMockGameState(validTeams);
      expect(isOnTeam('p1' as PlayerId, 'team1' as TeamId, gameState)).toBe(true);
      expect(isOnTeam('p2' as PlayerId, 'team2' as TeamId, gameState)).toBe(true);
    });

    test('returns false when player is on different team', () => {
      const gameState = createMockGameState(validTeams);
      expect(isOnTeam('p1' as PlayerId, 'team2' as TeamId, gameState)).toBe(false);
      expect(isOnTeam('p2' as PlayerId, 'team1' as TeamId, gameState)).toBe(false);
    });

    test('returns false for invalid player', () => {
      const gameState = createMockGameState(validTeams);
      expect(isOnTeam('invalid' as PlayerId, 'team1' as TeamId, gameState)).toBe(false);
    });
  });

  describe('getOpposingTeam', () => {
    test('returns the other team', () => {
      const gameState = createMockGameState(validTeams);
      expect(getOpposingTeam('team1' as TeamId, gameState)).toBe('team2');
      expect(getOpposingTeam('team2' as TeamId, gameState)).toBe('team1');
    });

    test('returns undefined for invalid team', () => {
      const gameState = createMockGameState(validTeams);
      expect(getOpposingTeam('invalid' as TeamId, gameState)).toBeUndefined();
    });
  });

  describe('getPlayerTeams', () => {
    test('returns both teams for valid players', () => {
      const gameState = createMockGameState(validTeams);
      const result = getPlayerTeams('p1' as PlayerId, 'p2' as PlayerId, gameState);
      expect(result).toEqual({
        team1: 'team1',
        team2: 'team2',
      });
    });

    test('returns undefined for invalid players', () => {
      const gameState = createMockGameState(validTeams);
      const result = getPlayerTeams('invalid1' as PlayerId, 'invalid2' as PlayerId, gameState);
      expect(result).toEqual({
        team1: undefined,
        team2: undefined,
      });
    });

    test('handles mixed valid and invalid players', () => {
      const gameState = createMockGameState(validTeams);
      const result = getPlayerTeams('p1' as PlayerId, 'invalid' as PlayerId, gameState);
      expect(result).toEqual({
        team1: 'team1',
        team2: undefined,
      });
    });
  });

  describe('assertTeamExists', () => {
    test('does not throw for player with team', () => {
      const gameState = createMockGameState(validTeams);
      expect(() => assertTeamExists('p1' as PlayerId, gameState)).not.toThrow();
    });

    test('throws for player without team', () => {
      const gameState = createMockGameState(validTeams);
      expect(() => assertTeamExists('invalid' as PlayerId, gameState)).toThrow(
        'Player invalid has no team assignment',
      );
    });
  });
});
