import { describe, it, expect, beforeEach } from '@jest/globals';
import { playCard, cambiar7, declareCante } from './gameLogic';
import type { GameState, Card, CardId, PlayerId, TeamId, GameId, Team } from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';

// Helper to create test game state
function createTestGameState(): GameState {
  const players = [
    {
      id: 'player1' as PlayerId,
      name: 'Player 1',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team1' as TeamId,
      isBot: false,
    },
    {
      id: 'player2' as PlayerId,
      name: 'Player 2',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team2' as TeamId,
      isBot: false,
    },
    {
      id: 'player3' as PlayerId,
      name: 'Player 3',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team1' as TeamId,
      isBot: false,
    },
    {
      id: 'player4' as PlayerId,
      name: 'Player 4',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team2' as TeamId,
      isBot: false,
    },
  ];

  const teams: [Team, Team] = [
    {
      id: 'team1' as TeamId,
      playerIds: ['player1' as PlayerId, 'player3' as PlayerId],
      score: 0,
      cardPoints: 0,
      cantes: [],
    },
    {
      id: 'team2' as TeamId,
      playerIds: ['player2' as PlayerId, 'player4' as PlayerId],
      score: 0,
      cardPoints: 0,
      cantes: [],
    },
  ];

  const hands = new Map<PlayerId, ReadonlyArray<Card>>();
  hands.set('player1' as PlayerId, [
    { id: 'oros_1' as CardId, suit: 'oros', value: 1 },
    { id: 'oros_3' as CardId, suit: 'oros', value: 3 },
    { id: 'copas_12' as CardId, suit: 'copas', value: 12 },
    { id: 'copas_10' as CardId, suit: 'copas', value: 10 },
    { id: 'bastos_7' as CardId, suit: 'bastos', value: 7 },
    { id: 'oros_7' as CardId, suit: 'oros', value: 7 },
  ]);
  hands.set('player2' as PlayerId, [
    { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
    { id: 'espadas_3' as CardId, suit: 'espadas', value: 3 },
  ]);
  hands.set('player3' as PlayerId, [
    { id: 'copas_1' as CardId, suit: 'copas', value: 1 },
    { id: 'copas_3' as CardId, suit: 'copas', value: 3 },
  ]);
  hands.set('player4' as PlayerId, [
    { id: 'bastos_1' as CardId, suit: 'bastos', value: 1 },
    { id: 'bastos_3' as CardId, suit: 'bastos', value: 3 },
  ]);

  return {
    id: 'test_game' as GameId,
    phase: 'playing',
    players,
    teams,
    deck: [
      { id: 'deck_1' as CardId, suit: 'oros', value: 2 },
      { id: 'deck_2' as CardId, suit: 'oros', value: 4 },
    ],
    hands,
    trumpSuit: 'oros',
    trumpCard: { id: 'trump' as CardId, suit: 'oros', value: 11 },
    currentTrick: [],
    currentPlayerIndex: 0,
    dealerIndex: 3,
    trickCount: 0,
    trickWins: new Map(),
    collectedTricks: new Map(),
    canCambiar7: true,
    gameHistory: [],
    isVueltas: false,
    canDeclareVictory: false,
    lastActionTimestamp: Date.now(),
  };
}

describe('playCard (refactored)', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createTestGameState();
  });

  describe('validation', () => {
    it('returns null when not player turn', () => {
      const card = {
        id: 'espadas_1' as CardId,
        suit: 'espadas' as SpanishSuit,
        value: 1 as CardValue,
      };
      const result = playCard(gameState, 'player2' as PlayerId, card);
      expect(result).toBeNull();
    });

    it('returns null when card not in hand', () => {
      const card = { id: 'invalid' as CardId, suit: 'oros' as SpanishSuit, value: 5 as CardValue };
      const result = playCard(gameState, 'player1' as PlayerId, card);
      expect(result).toBeNull();
    });

    it('returns null when play is invalid', () => {
      // Set up arrastre phase with a trick in progress
      gameState.phase = 'arrastre';
      gameState.currentTrick = [
        {
          playerId: 'player4' as PlayerId,
          card: { id: 'copas_5' as CardId, suit: 'copas', value: 5 },
        },
      ];

      // Player1 has copas cards but tries to play oros
      const card = { id: 'oros_1' as CardId, suit: 'oros' as SpanishSuit, value: 1 as CardValue };
      const result = playCard(gameState, 'player1' as PlayerId, card);
      expect(result).toBeNull();
    });
  });

  describe('simple play', () => {
    it('plays a card and advances to next player', () => {
      const card = gameState.hands.get('player1' as PlayerId)![0];
      const result = playCard(gameState, 'player1' as PlayerId, card);

      expect(result).not.toBeNull();
      expect(result!.currentTrick).toHaveLength(1);
      expect(result!.currentTrick[0].card.id).toBe(card.id);
      expect(result!.currentPlayerIndex).toBe(3); // Counter-clockwise
      expect(result!.hands.get('player1' as PlayerId)).toHaveLength(5); // One card removed
    });
  });

  describe('trick completion', () => {
    it('completes trick and calculates winner', () => {
      // Set up a nearly complete trick
      gameState.currentTrick = [
        { playerId: 'player4' as PlayerId, card: { id: 'c1' as CardId, suit: 'copas', value: 5 } },
        { playerId: 'player3' as PlayerId, card: { id: 'c2' as CardId, suit: 'copas', value: 3 } },
        { playerId: 'player2' as PlayerId, card: { id: 'c3' as CardId, suit: 'oros', value: 5 } }, // Trump
      ];

      const card = gameState.hands.get('player1' as PlayerId)![0]; // Oros 1 (trump As)
      const result = playCard(gameState, 'player1' as PlayerId, card);

      expect(result).not.toBeNull();
      expect(result!.currentTrick).toHaveLength(0); // Trick cleared
      expect(result!.trickCount).toBe(1);
      expect(result!.currentPlayerIndex).toBe(0); // Player1 won with trump As
      expect(result!.teams[0].score).toBeGreaterThan(0); // Team1 scored points
    });

    it('deals new cards after trick in playing phase', () => {
      // Complete a trick
      gameState.currentTrick = [
        { playerId: 'player4' as PlayerId, card: { id: 'c1' as CardId, suit: 'copas', value: 5 } },
        { playerId: 'player3' as PlayerId, card: { id: 'c2' as CardId, suit: 'copas', value: 3 } },
        {
          playerId: 'player2' as PlayerId,
          card: { id: 'c3' as CardId, suit: 'espadas', value: 5 },
        },
      ];
      gameState.deck = [
        { id: 'd1' as CardId, suit: 'oros', value: 2 },
        { id: 'd2' as CardId, suit: 'oros', value: 4 },
        { id: 'd3' as CardId, suit: 'oros', value: 5 },
        { id: 'd4' as CardId, suit: 'oros', value: 6 },
      ];

      const initialHandSize = gameState.hands.get('player1' as PlayerId)!.length;
      const card = gameState.hands.get('player1' as PlayerId)![0];
      const result = playCard(gameState, 'player1' as PlayerId, card);

      expect(result).not.toBeNull();
      expect(result!.deck).toHaveLength(0); // 4 cards dealt
      // Each player should have same number of cards (one played, one drawn)
      expect(result!.hands.get('player1' as PlayerId)).toHaveLength(initialHandSize);
    });

    it('transitions to arrastre when deck empties', () => {
      gameState.currentTrick = [
        { playerId: 'player4' as PlayerId, card: { id: 'c1' as CardId, suit: 'copas', value: 5 } },
        { playerId: 'player3' as PlayerId, card: { id: 'c2' as CardId, suit: 'copas', value: 3 } },
        {
          playerId: 'player2' as PlayerId,
          card: { id: 'c3' as CardId, suit: 'espadas', value: 5 },
        },
      ];
      // Set deck with exactly 4 cards that will be dealt after trick
      gameState.deck = [
        { id: 'd1' as CardId, suit: 'oros', value: 2 },
        { id: 'd2' as CardId, suit: 'oros', value: 4 },
        { id: 'd3' as CardId, suit: 'oros', value: 5 },
        { id: 'd4' as CardId, suit: 'oros', value: 6 },
      ];

      const card = gameState.hands.get('player1' as PlayerId)![0];
      const result = playCard(gameState, 'player1' as PlayerId, card);

      expect(result).not.toBeNull();
      expect(result!.deck).toHaveLength(0); // Deck emptied after dealing
      expect(result!.phase).toBe('arrastre');
      expect(result!.canCambiar7).toBe(false);
    });

    it('awards last trick bonus and transitions to scoring', () => {
      // Set up last trick scenario
      gameState.deck = [];
      gameState.phase = 'arrastre';
      gameState.currentTrick = [
        { playerId: 'player4' as PlayerId, card: { id: 'c1' as CardId, suit: 'copas', value: 5 } },
        { playerId: 'player3' as PlayerId, card: { id: 'c2' as CardId, suit: 'copas', value: 3 } },
        {
          playerId: 'player2' as PlayerId,
          card: { id: 'c3' as CardId, suit: 'espadas', value: 1 },
        },
      ];

      // Clear other hands to simulate last trick
      gameState.hands.set('player2' as PlayerId, []);
      gameState.hands.set('player3' as PlayerId, []);
      gameState.hands.set('player4' as PlayerId, []);
      const lastCard = gameState.hands.get('player1' as PlayerId)![0];
      gameState.hands.set('player1' as PlayerId, [lastCard]);

      const result = playCard(gameState, 'player1' as PlayerId, lastCard);

      expect(result).not.toBeNull();
      expect(result!.phase).toBe('scoring');
      // Team1 should get 10 extra points for last trick (player1 wins with trump As)
      const team1 = result!.teams.find(t => t.id === 'team1');
      expect(team1!.score).toBeGreaterThanOrEqual(10);
    });
  });
});

describe('cambiar7', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createTestGameState();
    gameState.lastTrickWinner = 'player1' as PlayerId;
  });

  it('swaps 7 of trumps with trump card', () => {
    const result = cambiar7(gameState, 'player1' as PlayerId);

    expect(result).not.toBeNull();
    expect(result!.trumpCard.value).toBe(7);
    expect(result!.canCambiar7).toBe(false);

    const playerHand = result!.hands.get('player1' as PlayerId);
    expect(playerHand).toContainEqual({ id: 'trump', suit: 'oros', value: 11 });
    expect(playerHand).not.toContainEqual({ id: 'oros_7', suit: 'oros', value: 7 });
  });

  it('returns null when not in playing phase', () => {
    gameState.phase = 'arrastre';
    const result = cambiar7(gameState, 'player1' as PlayerId);
    expect(result).toBeNull();
  });

  it('returns null when canCambiar7 is false', () => {
    gameState.canCambiar7 = false;
    const result = cambiar7(gameState, 'player1' as PlayerId);
    expect(result).toBeNull();
  });

  it('returns null when not player turn', () => {
    // Set current player to player2, try to cambiar7 as player1
    gameState.currentPlayerIndex = 1; // player2
    const result = cambiar7(gameState, 'player1' as PlayerId);
    expect(result).toBeNull();
  });

  it('allows cambiar7 on player turn regardless of last trick winner', () => {
    // Player1's turn, player2 won last trick - should still work
    gameState.currentPlayerIndex = 0; // player1
    gameState.lastTrickWinner = 'player2' as PlayerId;
    const result = cambiar7(gameState, 'player1' as PlayerId);
    expect(result).not.toBeNull();
    expect(result!.trumpCard.value).toBe(7);
  });

  it('returns null when player does not have 7 of trumps', () => {
    const hands = new Map(gameState.hands);
    hands.set('player1' as PlayerId, [
      { id: 'oros_1' as CardId, suit: 'oros', value: 1 },
      { id: 'oros_3' as CardId, suit: 'oros', value: 3 },
    ]);
    gameState.hands = hands;

    const result = cambiar7(gameState, 'player1' as PlayerId);
    expect(result).toBeNull();
  });

  it('returns null when deck is empty', () => {
    gameState.deck = [];
    const result = cambiar7(gameState, 'player1' as PlayerId);
    expect(result).toBeNull();
  });
});

describe('declareCante', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createTestGameState();
    gameState.lastTrickWinner = 'player1' as PlayerId;
  });

  it('declares cante and awards points', () => {
    const result = declareCante(gameState, 'player1' as PlayerId, 'copas');

    expect(result).not.toBeNull();
    expect(result!.teams[0].score).toBe(20); // 20 points for non-trump cante
    expect(result!.teams[0].cantes).toHaveLength(1);
    expect(result!.teams[0].cantes[0]).toEqual({
      teamId: 'team1',
      suit: 'copas',
      points: 20,
      isVisible: true,
    });
  });

  it('awards 40 points for trump cante', () => {
    // Give player Rey and Sota of trumps
    const hands = new Map(gameState.hands);
    hands.set('player1' as PlayerId, [
      { id: 'oros_12' as CardId, suit: 'oros', value: 12 },
      { id: 'oros_10' as CardId, suit: 'oros', value: 10 },
    ]);
    gameState.hands = hands;

    const result = declareCante(gameState, 'player1' as PlayerId, 'oros');

    expect(result).not.toBeNull();
    expect(result!.teams[0].score).toBe(40); // 40 points for trump cante
  });

  it('returns null when not in playing phase', () => {
    gameState.phase = 'arrastre';
    const result = declareCante(gameState, 'player1' as PlayerId, 'copas');
    expect(result).toBeNull();
  });

  it('returns null when team did not win last trick', () => {
    gameState.lastTrickWinner = 'player2' as PlayerId;
    const result = declareCante(gameState, 'player1' as PlayerId, 'copas');
    expect(result).toBeNull();
  });

  it('returns null when trick has started', () => {
    gameState.currentTrick = [
      { playerId: 'player1' as PlayerId, card: { id: 'c1' as CardId, suit: 'copas', value: 5 } },
    ];
    const result = declareCante(gameState, 'player1' as PlayerId, 'copas');
    expect(result).toBeNull();
  });

  it('returns null when player lacks Rey or Sota', () => {
    const hands = new Map(gameState.hands);
    hands.set('player1' as PlayerId, [
      { id: 'copas_12' as CardId, suit: 'copas', value: 12 }, // Only Rey, no Sota
      { id: 'oros_1' as CardId, suit: 'oros', value: 1 },
    ]);
    gameState.hands = hands;

    const result = declareCante(gameState, 'player1' as PlayerId, 'copas');
    expect(result).toBeNull();
  });

  it('returns null when suit already canted by team', () => {
    gameState.teams[0].cantes = [
      {
        teamId: 'team1' as TeamId,
        suit: 'copas',
        points: 20,
        isVisible: true,
      },
    ];

    const result = declareCante(gameState, 'player1' as PlayerId, 'copas');
    expect(result).toBeNull();
  });

  it('updates score correctly when declaring cante', () => {
    gameState.teams[0].score = 95;
    gameState.teams[0].cardPoints = 50;

    const result = declareCante(gameState, 'player1' as PlayerId, 'copas');

    expect(result).not.toBeNull();
    expect(result!.teams[0].score).toBe(115); // 95 + 20
    // Note: phase transitions are now handled elsewhere in the game flow
  });
});
