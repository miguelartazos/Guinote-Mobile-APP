import { describe, it, expect } from '@jest/globals';
import {
  serializeGameState,
  deserializeGameState,
  validateSerialization,
} from './gameStateAdapter';
import type {
  GameState,
  Card,
  CardId,
  PlayerId,
  TeamId,
  GameId,
} from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';

// Helper to create test data
function createTestCard(id: string, suit: SpanishSuit, value: CardValue): Card {
  return { id: id as CardId, suit, value };
}

function createCompleteGameState(): GameState {
  const players = [
    {
      id: 'p1' as PlayerId,
      name: 'Player 1',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team1' as TeamId,
      isBot: false,
    },
    {
      id: 'p2' as PlayerId,
      name: 'Bot 1',
      avatar: '🤖',
      ranking: 1200,
      teamId: 'team2' as TeamId,
      isBot: true,
      personality: 'aggressive' as const,
      difficulty: 'hard' as const,
    },
    {
      id: 'p3' as PlayerId,
      name: 'Player 3',
      avatar: '👤',
      ranking: 900,
      teamId: 'team1' as TeamId,
      isBot: false,
    },
    {
      id: 'p4' as PlayerId,
      name: 'Bot 2',
      avatar: '🤖',
      ranking: 1100,
      teamId: 'team2' as TeamId,
      isBot: true,
      personality: 'prudent' as const,
      difficulty: 'medium' as const,
    },
  ];

  const hands = new Map<PlayerId, ReadonlyArray<Card>>([
    [
      'p1' as PlayerId,
      [createTestCard('c1', 'oros', 1), createTestCard('c2', 'copas', 12)],
    ],
    [
      'p2' as PlayerId,
      [createTestCard('c3', 'espadas', 7), createTestCard('c4', 'bastos', 3)],
    ],
    ['p3' as PlayerId, []],
    ['p4' as PlayerId, [createTestCard('c5', 'oros', 11)]],
  ]);

  const trickWins = new Map<TeamId, number>([
    ['team1' as TeamId, 3],
    ['team2' as TeamId, 5],
  ]);

  const collectedTricks = new Map<
    PlayerId,
    ReadonlyArray<Array<{ playerId: PlayerId; card: Card }>>
  >([
    [
      'p1' as PlayerId,
      [
        [
          {
            playerId: 'p1' as PlayerId,
            card: createTestCard('old1', 'oros', 10),
          },
          {
            playerId: 'p2' as PlayerId,
            card: createTestCard('old2', 'oros', 3),
          },
          {
            playerId: 'p3' as PlayerId,
            card: createTestCard('old3', 'oros', 12),
          },
          {
            playerId: 'p4' as PlayerId,
            card: createTestCard('old4', 'oros', 11),
          },
        ],
      ],
    ],
    ['p2' as PlayerId, []],
    ['p3' as PlayerId, []],
    ['p4' as PlayerId, []],
  ]);

  const initialScores = new Map<TeamId, number>([
    ['team1' as TeamId, 45],
    ['team2' as TeamId, 55],
  ]);

  return {
    id: 'game123' as GameId,
    phase: 'playing',
    players,
    teams: [
      {
        id: 'team1' as TeamId,
        playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
        score: 68,
        cardPoints: 48,
        cantes: [
          {
            teamId: 'team1' as TeamId,
            suit: 'copas',
            points: 20,
            isVisible: true,
          },
        ],
      },
      {
        id: 'team2' as TeamId,
        playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
        score: 85,
        cardPoints: 65,
        cantes: [],
      },
    ],
    deck: [
      createTestCard('d1', 'bastos', 1),
      createTestCard('d2', 'espadas', 2),
    ],
    hands,
    trumpSuit: 'oros',
    trumpCard: createTestCard('trump', 'oros', 4),
    currentTrick: [
      { playerId: 'p1' as PlayerId, card: createTestCard('t1', 'copas', 7) },
      { playerId: 'p2' as PlayerId, card: createTestCard('t2', 'copas', 1) },
    ],
    currentPlayerIndex: 2,
    dealerIndex: 0,
    trickCount: 8,
    trickWins,
    collectedTricks,
    lastTrickWinner: 'p2' as PlayerId,
    lastTrick: [
      { playerId: 'p3' as PlayerId, card: createTestCard('lt1', 'bastos', 10) },
      { playerId: 'p4' as PlayerId, card: createTestCard('lt2', 'bastos', 11) },
      { playerId: 'p1' as PlayerId, card: createTestCard('lt3', 'bastos', 12) },
      { playerId: 'p2' as PlayerId, card: createTestCard('lt4', 'bastos', 1) },
    ],
    canCambiar7: false,
    gameHistory: [], // Not serialized
    isVueltas: true,
    initialScores,
    lastTrickWinnerTeam: 'team2' as TeamId,
    canDeclareVictory: true,
    lastActionTimestamp: 1234567890,
    matchScore: {
      team1Sets: 1,
      team2Sets: 0,
      currentSet: 'malas',
    },
  };
}

describe('gameStateAdapter', () => {
  describe('serializeGameState', () => {
    it('serializes all game state properties', () => {
      const gameState = createCompleteGameState();
      const serialized = serializeGameState(gameState);

      expect(serialized.id).toBe('game123');
      expect(serialized.phase).toBe('playing');
      expect(serialized.currentPlayerIndex).toBe(2);
      expect(serialized.dealerIndex).toBe(0);
      expect(serialized.trickCount).toBe(8);
      expect(serialized.trumpSuit).toBe('oros');
      expect(serialized.canCambiar7).toBe(false);
      expect(serialized.isVueltas).toBe(true);
      expect(serialized.canDeclareVictory).toBe(true);
      expect(serialized.lastActionTimestamp).toBe(1234567890);
    });

    it('serializes players correctly', () => {
      const gameState = createCompleteGameState();
      const serialized = serializeGameState(gameState);

      expect(serialized.players).toHaveLength(4);
      expect(serialized.players[1]).toEqual({
        id: 'p2',
        name: 'Bot 1',
        avatar: '🤖',
        ranking: 1200,
        teamId: 'team2',
        isBot: true,
        personality: 'aggressive',
        difficulty: 'hard',
      });
    });

    it('serializes teams with cantes', () => {
      const gameState = createCompleteGameState();
      const serialized = serializeGameState(gameState);

      expect(serialized.teams).toHaveLength(2);
      expect(serialized.teams[0].score).toBe(68);
      expect(serialized.teams[0].cardPoints).toBe(48);
      expect(serialized.teams[0].cantes).toHaveLength(1);
      expect(serialized.teams[0].cantes[0]).toEqual({
        teamId: 'team1',
        suit: 'copas',
        points: 20,
        isVisible: true,
      });
    });

    it('converts hands Map to object', () => {
      const gameState = createCompleteGameState();
      const serialized = serializeGameState(gameState);

      expect(serialized.hands).toBeInstanceOf(Object);
      expect(serialized.hands['p1']).toHaveLength(2);
      expect(serialized.hands['p1'][0]).toEqual({
        id: 'c1',
        suit: 'oros',
        value: 1,
      });
      expect(serialized.hands['p3']).toHaveLength(0);
    });

    it('converts trickWins Map to object', () => {
      const gameState = createCompleteGameState();
      const serialized = serializeGameState(gameState);

      expect(serialized.trickWins).toBeInstanceOf(Object);
      expect(serialized.trickWins['team1']).toBe(3);
      expect(serialized.trickWins['team2']).toBe(5);
    });

    it('serializes collectedTricks correctly', () => {
      const gameState = createCompleteGameState();
      const serialized = serializeGameState(gameState);

      expect(serialized.collectedTricks['p1']).toHaveLength(1);
      expect(serialized.collectedTricks['p1'][0]).toHaveLength(4);
      expect(serialized.collectedTricks['p1'][0][0]).toEqual({
        playerId: 'p1',
        card: { id: 'old1', suit: 'oros', value: 10 },
      });
    });

    it('handles optional properties', () => {
      const minimalState = createCompleteGameState();
      minimalState.lastTrickWinner = undefined;
      minimalState.lastTrick = undefined;
      minimalState.initialScores = undefined;
      minimalState.lastTrickWinnerTeam = undefined;
      minimalState.matchScore = undefined;

      const serialized = serializeGameState(minimalState);

      expect(serialized.lastTrickWinner).toBeUndefined();
      expect(serialized.lastTrick).toBeUndefined();
      expect(serialized.initialScores).toBeUndefined();
      expect(serialized.lastTrickWinnerTeam).toBeUndefined();
      expect(serialized.matchScore).toBeUndefined();
    });
  });

  describe('deserializeGameState', () => {
    it('deserializes back to GameState', () => {
      const gameState = createCompleteGameState();
      const serialized = serializeGameState(gameState);
      const deserialized = deserializeGameState(serialized);

      expect(deserialized.id).toBe(gameState.id);
      expect(deserialized.phase).toBe(gameState.phase);
      expect(deserialized.currentPlayerIndex).toBe(
        gameState.currentPlayerIndex,
      );
      expect(deserialized.players).toHaveLength(4);
      expect(deserialized.teams).toHaveLength(2);
    });

    it('recreates Maps correctly', () => {
      const gameState = createCompleteGameState();
      const serialized = serializeGameState(gameState);
      const deserialized = deserializeGameState(serialized);

      expect(deserialized.hands).toBeInstanceOf(Map);
      expect(deserialized.hands.size).toBe(4);
      expect(deserialized.hands.get('p1' as PlayerId)).toHaveLength(2);

      expect(deserialized.trickWins).toBeInstanceOf(Map);
      expect(deserialized.trickWins.get('team1' as TeamId)).toBe(3);

      expect(deserialized.collectedTricks).toBeInstanceOf(Map);
      expect(deserialized.collectedTricks.get('p1' as PlayerId)).toHaveLength(
        1,
      );
    });

    it('preserves complex nested data', () => {
      const gameState = createCompleteGameState();
      const serialized = serializeGameState(gameState);
      const deserialized = deserializeGameState(serialized);

      const team1 = deserialized.teams[0];
      expect(team1.cantes[0]).toEqual({
        teamId: 'team1',
        suit: 'copas',
        points: 20,
        isVisible: true,
      });

      expect(deserialized.currentTrick[1].card.value).toBe(1);
      expect(deserialized.currentTrick[1].card.suit).toBe('copas');
    });

    it('initializes gameHistory as empty array', () => {
      const gameState = createCompleteGameState();
      const serialized = serializeGameState(gameState);
      const deserialized = deserializeGameState(serialized);

      expect(deserialized.gameHistory).toEqual([]);
    });
  });

  describe('round-trip serialization', () => {
    it('preserves all data through serialize/deserialize cycle', () => {
      const original = createCompleteGameState();
      const serialized = serializeGameState(original);
      const deserialized = deserializeGameState(serialized);
      const reSerialized = serializeGameState(deserialized);

      // Compare serialized forms (excluding gameHistory which isn't serialized)
      expect(reSerialized).toEqual(serialized);
    });

    it('handles empty collections correctly', () => {
      const gameState = createCompleteGameState();
      gameState.hands.set('p2' as PlayerId, []);
      gameState.teams[1].cantes = [];
      gameState.currentTrick = [];
      gameState.deck = [];

      const serialized = serializeGameState(gameState);
      const deserialized = deserializeGameState(serialized);

      expect(deserialized.hands.get('p2' as PlayerId)).toEqual([]);
      expect(deserialized.teams[1].cantes).toEqual([]);
      expect(deserialized.currentTrick).toEqual([]);
      expect(deserialized.deck).toEqual([]);
    });
  });

  describe('validateSerialization', () => {
    it('returns true for valid serialization', () => {
      const gameState = createCompleteGameState();
      const isValid = validateSerialization(gameState);
      expect(isValid).toBe(true);
    });

    it('returns false for corrupted data', () => {
      const gameState = createCompleteGameState();
      // Corrupt the game state by setting invalid data
      (gameState as any).hands = 'not-a-map';

      const isValid = validateSerialization(gameState);
      expect(isValid).toBe(false);
    });
  });

  describe('animation state serialization', () => {
    it('serializes and deserializes animation states correctly', () => {
      const gameState = createCompleteGameState();
      gameState.trickAnimating = true;
      gameState.pendingTrickWinner = {
        playerId: 'p1' as PlayerId,
        points: 20,
        cards: [createTestCard('c1', 'oros', 1), createTestCard('c2', 'copas', 12)],
      };

      const serialized = serializeGameState(gameState);
      expect(serialized.trickAnimating).toBe(true);
      expect(serialized.pendingTrickWinner).toEqual({
        playerId: 'p1',
        points: 20,
        cards: [
          { id: 'c1', suit: 'oros', value: 1 },
          { id: 'c2', suit: 'copas', value: 12 },
        ],
      });

      const deserialized = deserializeGameState(serialized);
      expect(deserialized.trickAnimating).toBe(true);
      expect(deserialized.pendingTrickWinner).toEqual({
        playerId: 'p1' as PlayerId,
        points: 20,
        cards: [
          expect.objectContaining({ id: 'c1', suit: 'oros', value: 1 }),
          expect.objectContaining({ id: 'c2', suit: 'copas', value: 12 }),
        ],
      });
    });

    it('handles undefined animation states', () => {
      const gameState = createCompleteGameState();
      // Animation states are undefined by default
      
      const serialized = serializeGameState(gameState);
      expect(serialized.trickAnimating).toBeUndefined();
      expect(serialized.pendingTrickWinner).toBeUndefined();

      const deserialized = deserializeGameState(serialized);
      expect(deserialized.trickAnimating).toBeUndefined();
      expect(deserialized.pendingTrickWinner).toBeUndefined();
    });
  });
});
