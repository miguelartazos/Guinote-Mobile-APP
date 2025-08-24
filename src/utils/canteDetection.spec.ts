import type { Team, Cante, TeamId, GameState, Player, PlayerId } from '../types/game.types';
import {
  detectNewCante,
  getPlayerPositionForIndex,
  createCanteAnimationData,
  shouldShowCanteAnimation,
} from './canteDetection';

function createMockTeam(id: TeamId, cantes: Cante[] = []): Team {
  return {
    id,
    playerIds: ['player1' as PlayerId, 'player2' as PlayerId],
    score: 0,
    cardPoints: 0,
    cantes,
  };
}

function createMockCante(suit: string, points: 20 | 40): Cante {
  return {
    teamId: 'team1' as TeamId,
    suit: suit as any,
    points,
    isVisible: points === 20,
  };
}

function createMockGameState(currentPlayerIndex: number = 0): GameState {
  const players: Player[] = [
    {
      id: 'player0' as PlayerId,
      name: 'Player 0',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team1' as TeamId,
      isBot: false,
    },
    {
      id: 'player1' as PlayerId,
      name: 'Player 1',
      avatar: '👧',
      ranking: 1000,
      teamId: 'team2' as TeamId,
      isBot: true,
    },
    {
      id: 'player2' as PlayerId,
      name: 'Player 2',
      avatar: '👨',
      ranking: 1000,
      teamId: 'team1' as TeamId,
      isBot: true,
    },
    {
      id: 'player3' as PlayerId,
      name: 'Player 3',
      avatar: '👴',
      ranking: 1000,
      teamId: 'team2' as TeamId,
      isBot: true,
    },
  ];

  return {
    id: 'game1' as any,
    phase: 'playing',
    players,
    teams: [createMockTeam('team1' as TeamId), createMockTeam('team2' as TeamId)],
    deck: [],
    hands: new Map(),
    trumpSuit: 'oros',
    trumpCard: { id: 'trump' as any, suit: 'oros', value: 1 },
    currentTrick: [],
    currentPlayerIndex,
    dealerIndex: 0,
    trickCount: 0,
    trickWins: new Map(),
    collectedTricks: new Map(),
    canCambiar7: true,
    gameHistory: [],
    isVueltas: false,
    canDeclareVictory: false,
  };
}

describe('detectNewCante', () => {
  it('returns null when no new cantes', () => {
    const teams = [createMockTeam('team1' as TeamId, []), createMockTeam('team2' as TeamId, [])];

    const result = detectNewCante(teams, 0);
    expect(result).toBeNull();
  });

  it('detects new cante in team1', () => {
    const cante = createMockCante('oros', 40);
    const teams = [
      createMockTeam('team1' as TeamId, [cante]),
      createMockTeam('team2' as TeamId, []),
    ];

    const result = detectNewCante(teams, 0);
    expect(result).toEqual(cante);
  });

  it('detects new cante in team2', () => {
    const cante = createMockCante('copas', 20);
    const teams = [
      createMockTeam('team1' as TeamId, []),
      createMockTeam('team2' as TeamId, [cante]),
    ];

    const result = detectNewCante(teams, 0);
    expect(result).toEqual(cante);
  });

  it('detects newest cante when multiple exist', () => {
    const oldCante = createMockCante('oros', 40);
    const newCante = createMockCante('copas', 20);
    const teams = [
      createMockTeam('team1' as TeamId, [oldCante, newCante]),
      createMockTeam('team2' as TeamId, []),
    ];

    const result = detectNewCante(teams, 1);
    expect(result).toEqual(newCante);
  });

  it('returns null when cante count unchanged', () => {
    const cante = createMockCante('oros', 40);
    const teams = [
      createMockTeam('team1' as TeamId, [cante]),
      createMockTeam('team2' as TeamId, []),
    ];

    const result = detectNewCante(teams, 1);
    expect(result).toBeNull();
  });
});

describe('getPlayerPositionForIndex', () => {
  it('returns correct position for player 0 (bottom)', () => {
    const position = getPlayerPositionForIndex(0);
    expect(position).toEqual({ x: 400, y: 550 });
  });

  it('returns correct position for player 1 (right)', () => {
    const position = getPlayerPositionForIndex(1);
    expect(position).toEqual({ x: 700, y: 350 });
  });

  it('returns correct position for player 2 (top)', () => {
    const position = getPlayerPositionForIndex(2);
    expect(position).toEqual({ x: 400, y: 150 });
  });

  it('returns correct position for player 3 (left)', () => {
    const position = getPlayerPositionForIndex(3);
    expect(position).toEqual({ x: 100, y: 350 });
  });

  it('returns default position for invalid index', () => {
    const position = getPlayerPositionForIndex(5);
    expect(position).toEqual({ x: 400, y: 550 });
  });
});

describe('createCanteAnimationData', () => {
  it('creates animation data for current player', () => {
    const gameState = createMockGameState(1);
    const cante = createMockCante('espadas', 20);

    const result = createCanteAnimationData(gameState, cante);

    expect(result).toEqual({
      suit: 'espadas',
      points: 20,
      playerIndex: 1,
      playerName: 'Player 1',
      playerAvatar: '👧',
    });
  });

  it('handles player without avatar', () => {
    const gameState = createMockGameState(0);
    gameState.players[0].avatar = undefined;
    const cante = createMockCante('bastos', 40);

    const result = createCanteAnimationData(gameState, cante);

    expect(result).toEqual({
      suit: 'bastos',
      points: 40,
      playerIndex: 0,
      playerName: 'Player 0',
      playerAvatar: undefined,
    });
  });
});

describe('shouldShowCanteAnimation', () => {
  it('returns false for initial load', () => {
    const result = shouldShowCanteAnimation(2, 0);
    expect(result).toBe(false);
  });

  it('returns true for new cante', () => {
    const result = shouldShowCanteAnimation(3, 2);
    expect(result).toBe(true);
  });

  it('returns false when count unchanged', () => {
    const result = shouldShowCanteAnimation(2, 2);
    expect(result).toBe(false);
  });

  it('returns false when count decreases', () => {
    const result = shouldShowCanteAnimation(1, 2);
    expect(result).toBe(false);
  });
});
