import type { GameState, PlayerId, TeamId } from '../types/game.types';
import type { UserId } from '../types/friend.types';
import type { EloRating } from './eloCalculation';
import { calculatePostGameElo, prepareEloUpdatePayload, shouldUpdateElo } from './gameEloUpdates';

// Mock gameState factory
function createMockGameState(overrides?: Partial<GameState>): GameState {
  return {
    id: 'game-1',
    currentPlayerIndex: 0,
    players: [
      {
        id: 'p1' as PlayerId,
        name: 'Player 1',
        teamId: 'team1' as TeamId,
        isAI: false,
        userId: 'user1' as UserId,
      },
      {
        id: 'p2' as PlayerId,
        name: 'Player 2',
        teamId: 'team2' as TeamId,
        isAI: false,
        userId: 'user2' as UserId,
      },
      {
        id: 'p3' as PlayerId,
        name: 'Player 3',
        teamId: 'team1' as TeamId,
        isAI: false,
        userId: 'user3' as UserId,
      },
      {
        id: 'p4' as PlayerId,
        name: 'Player 4',
        teamId: 'team2' as TeamId,
        isAI: false,
        userId: 'user4' as UserId,
      },
    ],
    teams: {
      team1: { id: 'team1' as TeamId, players: ['p1' as PlayerId, 'p3' as PlayerId], score: 0 },
      team2: { id: 'team2' as TeamId, players: ['p2' as PlayerId, 'p4' as PlayerId], score: 0 },
    },
    winner: 'team1' as TeamId,
    matchScore: {
      team1Partidas: 1,
      team2Partidas: 0,
      team1Cotos: 2,
      team2Cotos: 1,
    },
    gameMode: 'online',
    ...overrides,
  } as GameState;
}

describe('shouldUpdateElo', () => {
  test('returns true for online games with winner', () => {
    const gameState = createMockGameState({
      gameMode: 'online',
      winner: 'team1' as TeamId,
    });

    expect(shouldUpdateElo(gameState)).toBe(true);
  });

  test('returns false for local games', () => {
    const gameState = createMockGameState({
      gameMode: 'local',
      winner: 'team1' as TeamId,
    });

    expect(shouldUpdateElo(gameState)).toBe(false);
  });

  test('returns false for games without winner', () => {
    const gameState = createMockGameState({
      gameMode: 'online',
      winner: null,
    });

    expect(shouldUpdateElo(gameState)).toBe(false);
  });

  test('returns false for games with AI players', () => {
    const gameState = createMockGameState({
      gameMode: 'online',
      winner: 'team1' as TeamId,
      players: [
        {
          id: 'p1' as PlayerId,
          name: 'Player 1',
          teamId: 'team1' as TeamId,
          isAI: false,
          userId: 'user1' as UserId,
        },
        { id: 'p2' as PlayerId, name: 'AI Player', teamId: 'team2' as TeamId, isAI: true },
        {
          id: 'p3' as PlayerId,
          name: 'Player 3',
          teamId: 'team1' as TeamId,
          isAI: false,
          userId: 'user3' as UserId,
        },
        {
          id: 'p4' as PlayerId,
          name: 'Player 4',
          teamId: 'team2' as TeamId,
          isAI: false,
          userId: 'user4' as UserId,
        },
      ],
    });

    expect(shouldUpdateElo(gameState)).toBe(false);
  });
});

describe('calculatePostGameElo', () => {
  test('calculates ELO changes for winning team', () => {
    const gameState = createMockGameState();
    const playerElos = new Map<UserId, EloRating>([
      ['user1' as UserId, 1500 as EloRating],
      ['user2' as UserId, 1500 as EloRating],
      ['user3' as UserId, 1500 as EloRating],
      ['user4' as UserId, 1500 as EloRating],
    ]);

    const result = calculatePostGameElo(gameState, playerElos);

    // Team 1 won, so user1 and user3 should gain ELO
    expect(result.updates.get('user1' as UserId)).toBeGreaterThan(1500);
    expect(result.updates.get('user3' as UserId)).toBeGreaterThan(1500);

    // Team 2 lost, so user2 and user4 should lose ELO
    expect(result.updates.get('user2' as UserId)).toBeLessThan(1500);
    expect(result.updates.get('user4' as UserId)).toBeLessThan(1500);
  });

  test('maintains zero-sum property across teams', () => {
    const gameState = createMockGameState();
    const playerElos = new Map<UserId, EloRating>([
      ['user1' as UserId, 1600 as EloRating],
      ['user2' as UserId, 1400 as EloRating],
      ['user3' as UserId, 1500 as EloRating],
      ['user4' as UserId, 1500 as EloRating],
    ]);

    const result = calculatePostGameElo(gameState, playerElos);

    const team1Gain =
      result.updates.get('user1' as UserId)! -
      1600 +
      (result.updates.get('user3' as UserId)! - 1500);

    const team2Loss =
      result.updates.get('user2' as UserId)! -
      1400 +
      (result.updates.get('user4' as UserId)! - 1500);

    // Total gain should equal total loss (zero-sum)
    expect(team1Gain + team2Loss).toBeCloseTo(0, 0);
  });

  test('returns empty updates for invalid game state', () => {
    const gameState = createMockGameState({
      winner: null,
    });
    const playerElos = new Map<UserId, EloRating>();

    const result = calculatePostGameElo(gameState, playerElos);

    expect(result.updates.size).toBe(0);
    expect(result.changes.size).toBe(0);
  });

  test('handles missing player ELOs with default value', () => {
    const gameState = createMockGameState();
    const playerElos = new Map<UserId, EloRating>([
      ['user1' as UserId, 1500 as EloRating],
      // user2, user3, user4 missing - should use default 1000
    ]);

    const result = calculatePostGameElo(gameState, playerElos);

    // Should have updates for all players
    expect(result.updates.size).toBe(4);
    expect(result.updates.get('user2' as UserId)).toBeDefined();
    expect(result.updates.get('user3' as UserId)).toBeDefined();
    expect(result.updates.get('user4' as UserId)).toBeDefined();
  });

  test('calculates changes correctly', () => {
    const gameState = createMockGameState();
    const playerElos = new Map<UserId, EloRating>([
      ['user1' as UserId, 1500 as EloRating],
      ['user2' as UserId, 1500 as EloRating],
      ['user3' as UserId, 1500 as EloRating],
      ['user4' as UserId, 1500 as EloRating],
    ]);

    const result = calculatePostGameElo(gameState, playerElos);

    // Winners should have positive changes
    expect(result.changes.get('user1' as UserId)).toBeGreaterThan(0);
    expect(result.changes.get('user3' as UserId)).toBeGreaterThan(0);

    // Losers should have negative changes
    expect(result.changes.get('user2' as UserId)).toBeLessThan(0);
    expect(result.changes.get('user4' as UserId)).toBeLessThan(0);
  });
});

describe('prepareEloUpdatePayload', () => {
  test('creates payload with all required fields', () => {
    const updates = new Map<UserId, EloRating>([
      ['user1' as UserId, 1516 as EloRating],
      ['user2' as UserId, 1484 as EloRating],
    ]);

    const changes = new Map<UserId, number>([
      ['user1' as UserId, 16],
      ['user2' as UserId, -16],
    ]);

    const payload = prepareEloUpdatePayload(updates, changes, 'game-123');

    expect(payload).toEqual({
      gameId: 'game-123',
      updates: [
        { userId: 'user1', newElo: 1516, change: 16 },
        { userId: 'user2', newElo: 1484, change: -16 },
      ],
    });
  });

  test('handles empty updates', () => {
    const updates = new Map<UserId, EloRating>();
    const changes = new Map<UserId, number>();

    const payload = prepareEloUpdatePayload(updates, changes, 'game-123');

    expect(payload).toEqual({
      gameId: 'game-123',
      updates: [],
    });
  });

  test('includes all users with updates', () => {
    const updates = new Map<UserId, EloRating>([
      ['user1' as UserId, 1600 as EloRating],
      ['user2' as UserId, 1400 as EloRating],
      ['user3' as UserId, 1550 as EloRating],
      ['user4' as UserId, 1450 as EloRating],
    ]);

    const changes = new Map<UserId, number>([
      ['user1' as UserId, 20],
      ['user2' as UserId, -20],
      ['user3' as UserId, 10],
      ['user4' as UserId, -10],
    ]);

    const payload = prepareEloUpdatePayload(updates, changes, 'game-456');

    expect(payload.updates).toHaveLength(4);
    expect(payload.updates.map(u => u.userId)).toEqual(['user1', 'user2', 'user3', 'user4']);
  });
});
