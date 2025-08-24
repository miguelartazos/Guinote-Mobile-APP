import { describe, it, expect } from '@jest/globals';
import { applyGameMove, continueFromScoring } from './gameEngine';
import type {
  GameState,
  Card,
  CardId,
  PlayerId,
  TeamId,
  GameId,
  TrickCard,
} from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';
import { createMove } from '../types/gameMove.types';

// Helper function to create a test card
function createCard(id: string, suit: SpanishSuit, value: CardValue): Card {
  return { id: id as CardId, suit, value };
}

// Helper function to create a minimal game state
function createTestGameState(): GameState {
  const players = [
    {
      id: 'player1' as PlayerId,
      name: 'P1',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team1' as TeamId,
      isBot: false,
    },
    {
      id: 'player2' as PlayerId,
      name: 'P2',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team2' as TeamId,
      isBot: false,
    },
    {
      id: 'player3' as PlayerId,
      name: 'P3',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team1' as TeamId,
      isBot: false,
    },
    {
      id: 'player4' as PlayerId,
      name: 'P4',
      avatar: '👤',
      ranking: 1000,
      teamId: 'team2' as TeamId,
      isBot: false,
    },
  ];

  const hands = new Map<PlayerId, ReadonlyArray<Card>>([
    [
      'player1' as PlayerId,
      [
        createCard('p1c1', 'oros', 1),
        createCard('p1c2', 'oros', 12),
        createCard('p1c3', 'copas', 10),
        createCard('p1c4', 'espadas', 7),
        createCard('p1c5', 'bastos', 3),
        createCard('p1c6', 'bastos', 11),
      ],
    ],
    [
      'player2' as PlayerId,
      [
        createCard('p2c1', 'oros', 10),
        createCard('p2c2', 'copas', 1),
        createCard('p2c3', 'copas', 12),
        createCard('p2c4', 'espadas', 11),
        createCard('p2c5', 'bastos', 7),
        createCard('p2c6', 'bastos', 12),
      ],
    ],
    [
      'player3' as PlayerId,
      [
        createCard('p3c1', 'oros', 11),
        createCard('p3c2', 'copas', 3),
        createCard('p3c3', 'copas', 11),
        createCard('p3c4', 'espadas', 1),
        createCard('p3c5', 'espadas', 3),
        createCard('p3c6', 'bastos', 10),
      ],
    ],
    [
      'player4' as PlayerId,
      [
        createCard('p4c1', 'oros', 3),
        createCard('p4c2', 'oros', 7),
        createCard('p4c3', 'copas', 7),
        createCard('p4c4', 'espadas', 10),
        createCard('p4c5', 'espadas', 12),
        createCard('p4c6', 'bastos', 1),
      ],
    ],
  ]);

  return {
    id: 'test-game' as GameId,
    phase: 'playing',
    players,
    teams: [
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
    ],
    deck: [createCard('deck1', 'oros', 2)], // One card in deck
    hands,
    trumpSuit: 'oros',
    trumpCard: createCard('trump', 'oros', 2),
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
  };
}

describe('applyGameMove', () => {
  describe('PLAY_CARD move', () => {
    it('applies valid card play', () => {
      const gameState = createTestGameState();
      const move = createMove.playCard('player1' as PlayerId, 'p1c1' as CardId);

      const newState = applyGameMove(gameState, move);

      expect(newState).not.toBeNull();
      expect(newState!.currentTrick).toHaveLength(1);
      expect(newState!.currentTrick[0].playerId).toBe('player1');
      expect(newState!.currentTrick[0].card.id).toBe('p1c1');
      expect(newState!.currentPlayerIndex).toBe(3); // Counter-clockwise: 0 -> 3

      // Check card was removed from hand
      const player1Hand = newState!.hands.get('player1' as PlayerId);
      expect(player1Hand).toHaveLength(5);
      expect(player1Hand?.find(c => c.id === 'p1c1')).toBeUndefined();
    });

    it('rejects play from wrong player', () => {
      const gameState = createTestGameState();
      const move = createMove.playCard('player2' as PlayerId, 'p2c1' as CardId);

      const newState = applyGameMove(gameState, move);

      expect(newState).toBeNull();
    });

    it('rejects play of card not in hand', () => {
      const gameState = createTestGameState();
      const move = createMove.playCard('player1' as PlayerId, 'wrong-card' as CardId);

      const newState = applyGameMove(gameState, move);

      expect(newState).toBeNull();
    });

    it('completes trick and updates scores', () => {
      const gameState = createTestGameState();
      // Set up a trick with 3 cards already played
      gameState.currentTrick = [
        {
          playerId: 'player1' as PlayerId,
          card: createCard('p1c1', 'oros', 1),
        }, // 11 points
        {
          playerId: 'player2' as PlayerId,
          card: createCard('p2c1', 'oros', 10),
        }, // 3 points
        {
          playerId: 'player3' as PlayerId,
          card: createCard('p3c1', 'oros', 11),
        }, // 2 points
      ];
      gameState.currentPlayerIndex = 3;

      const move = createMove.playCard('player4' as PlayerId, 'p4c1' as CardId); // 3 de oros = 10 points
      const newState = applyGameMove(gameState, move);

      expect(newState).not.toBeNull();
      expect(newState!.currentTrick).toHaveLength(0); // Trick cleared
      expect(newState!.trickCount).toBe(1);
      expect(newState!.lastTrickWinner).toBe('player1'); // As de oros wins

      // Check team 1 got the points (11 + 3 + 2 + 10 = 26)
      const team1 = newState!.teams.find(t => t.id === 'team1');
      expect(team1?.score).toBe(26);
      expect(team1?.cardPoints).toBe(26);
    });
  });

  describe('CANTAR move', () => {
    it('applies valid cante', () => {
      const gameState = createTestGameState();
      // Give player Rey and Sota of copas
      const hands = new Map(gameState.hands);
      hands.set('player1' as PlayerId, [
        createCard('p1c1', 'copas', 12), // Rey
        createCard('p1c2', 'copas', 10), // Sota (value 10, not 11)
        createCard('p1c3', 'oros', 1),
      ]);
      gameState.hands = hands;
      gameState.lastTrickWinner = 'player1' as PlayerId;

      const move = createMove.cantar('player1' as PlayerId, 'copas');
      const newState = applyGameMove(gameState, move);

      expect(newState).not.toBeNull();
      const team1 = newState!.teams.find(t => t.id === 'team1');
      expect(team1?.score).toBe(20); // 20 points for non-trump cante
      expect(team1?.cantes).toHaveLength(1);
      expect(team1?.cantes[0]).toEqual({
        teamId: 'team1',
        suit: 'copas',
        points: 20,
        isVisible: true,
      });
    });

    it('rejects cante without Rey-Sota pair', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player1' as PlayerId;

      const move = createMove.cantar('player1' as PlayerId, 'bastos');
      const newState = applyGameMove(gameState, move);

      expect(newState).toBeNull();
    });

    it('rejects cante when not last trick winner', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player2' as PlayerId;

      const move = createMove.cantar('player1' as PlayerId, 'oros');
      const newState = applyGameMove(gameState, move);

      expect(newState).toBeNull();
    });
  });

  describe('CAMBIAR_7 move', () => {
    it('applies valid cambiar 7', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player1' as PlayerId;
      gameState.trumpCard = createCard('trump', 'oros', 3); // 3 has points (10)
      // Give player1 the 7 of oros
      const hands = new Map(gameState.hands);
      const p1Hand = [...hands.get('player1' as PlayerId)!];
      p1Hand[0] = createCard('p1c1', 'oros', 7); // Replace first card with 7 of oros
      hands.set('player1' as PlayerId, p1Hand);
      gameState.hands = hands;

      const move = createMove.cambiar7('player1' as PlayerId);
      const newState = applyGameMove(gameState, move);

      expect(newState).not.toBeNull();
      expect(newState!.trumpCard.value).toBe(7);
      expect(newState!.trumpCard.suit).toBe('oros'); // Trump suit is oros
      expect(newState!.canCambiar7).toBe(false);

      // Check player now has the 3
      const player1Hand = newState!.hands.get('player1' as PlayerId);
      expect(player1Hand?.find(c => c.value === 3 && c.suit === 'oros')).toBeDefined();
    });

    it('rejects cambiar 7 when deck is empty', () => {
      const gameState = createTestGameState();
      gameState.deck = [];
      gameState.lastTrickWinner = 'player1' as PlayerId;

      const move = createMove.cambiar7('player1' as PlayerId);
      const newState = applyGameMove(gameState, move);

      expect(newState).toBeNull();
    });
  });

  describe('DECLARE_VICTORY move', () => {
    it('accepts correct victory declaration in vueltas', () => {
      const gameState = createTestGameState();
      gameState.isVueltas = true;
      gameState.lastTrickWinnerTeam = 'team1' as TeamId;
      gameState.canDeclareVictory = true;
      gameState.initialScores = new Map([
        ['team1' as TeamId, 60],
        ['team2' as TeamId, 40],
      ]);
      gameState.teams[0].score = 80;
      gameState.teams[0].cardPoints = 35; // Add card points to meet 30 malas rule
      gameState.teams[1].score = 50;

      const move = createMove.declareVictory('player1' as PlayerId);
      const newState = applyGameMove(gameState, move);

      expect(newState).not.toBeNull();
      expect(newState!.phase).toBe('gameOver');
    });

    it('penalizes incorrect victory declaration', () => {
      const gameState = createTestGameState();
      gameState.isVueltas = true;
      gameState.lastTrickWinnerTeam = 'team2' as TeamId;
      gameState.canDeclareVictory = true;
      gameState.initialScores = new Map([
        ['team1' as TeamId, 50],
        ['team2' as TeamId, 50],
      ]);
      gameState.teams[0].score = 60;
      gameState.teams[0].cardPoints = 35; // Add card points
      gameState.teams[1].score = 60;
      gameState.teams[1].cardPoints = 35; // Add card points

      const move = createMove.declareVictory('player1' as PlayerId);
      const newState = applyGameMove(gameState, move);

      expect(newState).not.toBeNull();
      expect(newState!.phase).toBe('gameOver');
      // Other team wins
      expect(newState!.teams[1].score).toBe(101);
    });
  });

  describe('DECLARE_RENUNCIO move', () => {
    it('applies renuncio giving victory to other team', () => {
      const gameState = createTestGameState();

      const move = createMove.declareRenuncio('player1' as PlayerId, 'No puedo ganar');
      const newState = applyGameMove(gameState, move);

      expect(newState).not.toBeNull();
      expect(newState!.phase).toBe('gameOver');
      expect(newState!.teams[1].score).toBe(101); // Team 2 wins
    });
  });
});

describe('continueFromScoring', () => {
  it('starts vueltas when no team reaches 101', () => {
    const gameState = createTestGameState();
    gameState.phase = 'scoring';
    gameState.teams[0].score = 80;
    gameState.teams[0].cardPoints = 80;
    gameState.teams[1].score = 60;
    gameState.teams[1].cardPoints = 60;

    const newState = continueFromScoring(gameState);

    expect(newState).not.toBeNull();
    expect(newState!.phase).toBe('dealing');
    expect(newState!.isVueltas).toBe(true);
    expect(newState!.initialScores).toBeDefined();
    expect(newState!.initialScores?.get('team1' as TeamId)).toBe(80);
    expect(newState!.initialScores?.get('team2' as TeamId)).toBe(60);
  });

  it('ends game when team reaches 101 with 30+ card points', () => {
    const gameState = createTestGameState();
    gameState.phase = 'scoring';
    gameState.teams[0].score = 105;
    gameState.teams[0].cardPoints = 85;
    gameState.teams[1].score = 50;
    gameState.teams[1].cardPoints = 50;

    const newState = continueFromScoring(gameState);

    expect(newState).not.toBeNull();
    expect(newState!.phase).toBe('gameOver');
  });

  it('continues to vueltas when team has 101 but less than 30 card points', () => {
    const gameState = createTestGameState();
    gameState.phase = 'scoring';
    gameState.teams[0].score = 101;
    gameState.teams[0].cardPoints = 25; // Less than 30
    gameState.teams[1].score = 50;
    gameState.teams[1].cardPoints = 50;

    const newState = continueFromScoring(gameState);

    expect(newState).not.toBeNull();
    expect(newState!.phase).toBe('dealing');
    expect(newState!.isVueltas).toBe(true);
  });
});
