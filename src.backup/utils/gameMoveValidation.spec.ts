import { describe, it, expect } from '@jest/globals';
import { isValidMove } from './gameMoveValidation';
import { createMove } from '../types/gameMove.types';
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

describe('isValidMove', () => {
  describe('turn validation', () => {
    it('rejects moves from players when not their turn', () => {
      const gameState = createTestGameState();
      const move = createMove.playCard('player2' as PlayerId, 'p2c1' as CardId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('accepts moves from the current player', () => {
      const gameState = createTestGameState();
      const move = createMove.playCard('player1' as PlayerId, 'p1c1' as CardId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(true);
    });
  });

  describe('PLAY_CARD validation', () => {
    it('validates legal card plays', () => {
      const gameState = createTestGameState();
      const move = createMove.playCard('player1' as PlayerId, 'p1c1' as CardId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(true);
    });

    it('rejects playing cards not in hand', () => {
      const gameState = createTestGameState();
      const move = createMove.playCard(
        'player1' as PlayerId,
        'wrong-card' as CardId,
      );

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects playing when player has no hand', () => {
      const gameState = createTestGameState();
      gameState.hands.delete('player1' as PlayerId);
      const move = createMove.playCard('player1' as PlayerId, 'p1c1' as CardId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('enforces suit following in arrastre phase', () => {
      const gameState = createTestGameState();
      gameState.phase = 'arrastre';
      gameState.currentTrick = [
        {
          playerId: 'player1' as PlayerId,
          card: createCard('p1c1', 'oros', 1),
        },
      ];
      gameState.currentPlayerIndex = 3; // player4's turn

      // Player4 has oros (p4c1, p4c2) so must follow suit
      const invalidMove = createMove.playCard(
        'player4' as PlayerId,
        'p4c3' as CardId,
      ); // copas 7
      const validMove = createMove.playCard(
        'player4' as PlayerId,
        'p4c1' as CardId,
      ); // oros 3

      expect(isValidMove(gameState, invalidMove)).toBe(false);
      expect(isValidMove(gameState, validMove)).toBe(true);
    });

    it('allows any card in playing (draw) phase', () => {
      const gameState = createTestGameState();
      gameState.phase = 'playing';
      gameState.currentTrick = [
        {
          playerId: 'player1' as PlayerId,
          card: createCard('p1c1', 'oros', 1),
        },
      ];
      gameState.currentPlayerIndex = 3; // player4's turn

      // In draw phase, any card is valid
      const move = createMove.playCard('player4' as PlayerId, 'p4c3' as CardId); // copas 7

      expect(isValidMove(gameState, move)).toBe(true);
    });
  });

  describe('CANTAR validation', () => {
    it('validates legal cante', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player2' as PlayerId;
      gameState.currentPlayerIndex = 1; // player2's turn
      // Player2 has Rey (p2c3) and Sota (p2c1 is 10 of oros, need 10 of copas)
      const hands = new Map(gameState.hands);
      hands.set('player2' as PlayerId, [
        createCard('p2c1', 'copas', 10), // Sota of copas
        createCard('p2c2', 'copas', 12), // Rey of copas
        createCard('p2c3', 'oros', 1),
      ]);
      gameState.hands = hands;

      const move = createMove.cantar('player2' as PlayerId, 'copas');

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(true);
    });

    it('rejects cante when not last trick winner', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player3' as PlayerId;

      const move = createMove.cantar('player1' as PlayerId, 'copas');

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects cante when trick already started', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player1' as PlayerId;
      gameState.currentTrick = [
        {
          playerId: 'player1' as PlayerId,
          card: createCard('p1c1', 'oros', 1),
        },
      ];

      const move = createMove.cantar('player1' as PlayerId, 'copas');

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects cante when not in playing phase', () => {
      const gameState = createTestGameState();
      gameState.phase = 'arrastre';
      gameState.lastTrickWinner = 'player1' as PlayerId;

      const move = createMove.cantar('player1' as PlayerId, 'copas');

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects cante without Rey-Sota pair', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player1' as PlayerId;

      // Player1 doesn't have Rey-Sota of bastos
      const move = createMove.cantar('player1' as PlayerId, 'espadas');

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects duplicate cante', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player2' as PlayerId;
      gameState.currentPlayerIndex = 1;

      // Give player2 Rey-Sota of copas
      const hands = new Map(gameState.hands);
      hands.set('player2' as PlayerId, [
        createCard('p2c1', 'copas', 10),
        createCard('p2c2', 'copas', 12),
      ]);
      gameState.hands = hands;

      // Team already canted copas
      gameState.teams[1].cantes = [
        {
          teamId: 'team2' as TeamId,
          suit: 'copas',
          points: 20,
          isVisible: true,
        },
      ];

      const move = createMove.cantar('player2' as PlayerId, 'copas');

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });
  });

  describe('CAMBIAR_7 validation', () => {
    it('validates legal cambiar 7', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player4' as PlayerId;
      gameState.currentPlayerIndex = 3;
      gameState.trumpCard = createCard('trump', 'oros', 3); // Has points

      // Player4 has 7 of oros (p4c2)
      const move = createMove.cambiar7('player4' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(true);
    });

    it('rejects cambiar 7 when not last trick winner', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player2' as PlayerId;

      const move = createMove.cambiar7('player4' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects cambiar 7 when trick already started', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player4' as PlayerId;
      gameState.currentPlayerIndex = 3;
      gameState.currentTrick = [
        {
          playerId: 'player4' as PlayerId,
          card: createCard('p4c1', 'oros', 3),
        },
      ];

      const move = createMove.cambiar7('player4' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects cambiar 7 when not in playing phase', () => {
      const gameState = createTestGameState();
      gameState.phase = 'arrastre';
      gameState.lastTrickWinner = 'player4' as PlayerId;
      gameState.currentPlayerIndex = 3;

      const move = createMove.cambiar7('player4' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects cambiar 7 when canCambiar7 is false', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player4' as PlayerId;
      gameState.currentPlayerIndex = 3;
      gameState.canCambiar7 = false;

      const move = createMove.cambiar7('player4' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects cambiar 7 without 7 of trump', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player1' as PlayerId;
      gameState.trumpSuit = 'copas'; // Player1 doesn't have 7 of copas

      const move = createMove.cambiar7('player1' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects cambiar 7 when deck is empty', () => {
      const gameState = createTestGameState();
      gameState.lastTrickWinner = 'player4' as PlayerId;
      gameState.currentPlayerIndex = 3;
      gameState.deck = [];

      const move = createMove.cambiar7('player4' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });
  });

  describe('DECLARE_VICTORY validation', () => {
    it('validates legal victory declaration', () => {
      const gameState = createTestGameState();
      gameState.isVueltas = true;
      gameState.initialScores = new Map([
        ['team1' as TeamId, 60],
        ['team2' as TeamId, 40],
      ]);
      gameState.teams[0].score = 45; // Total: 105
      gameState.teams[1].score = 35; // Total: 75

      const move = createMove.declareVictory('player1' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(true);
    });

    it('rejects victory declaration when not in vueltas', () => {
      const gameState = createTestGameState();
      gameState.isVueltas = false;

      const move = createMove.declareVictory('player1' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects victory declaration during a trick', () => {
      const gameState = createTestGameState();
      gameState.isVueltas = true;
      gameState.currentTrick = [
        {
          playerId: 'player1' as PlayerId,
          card: createCard('p1c1', 'oros', 1),
        },
      ];

      const move = createMove.declareVictory('player1' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });

    it('rejects victory declaration when team not winning', () => {
      const gameState = createTestGameState();
      gameState.isVueltas = true;
      gameState.initialScores = new Map([
        ['team1' as TeamId, 50],
        ['team2' as TeamId, 50],
      ]);
      gameState.teams[0].score = 45; // Total: 95 (not enough)
      gameState.teams[1].score = 45; // Total: 95

      const move = createMove.declareVictory('player1' as PlayerId);

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(false);
    });
  });

  describe('DECLARE_RENUNCIO validation', () => {
    it('always accepts renuncio declarations', () => {
      const gameState = createTestGameState();
      const move = createMove.declareRenuncio(
        'player1' as PlayerId,
        'Test reason',
      );

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(true);
    });

    it('requires renuncio to be declared on player turn', () => {
      const gameState = createTestGameState();
      gameState.currentPlayerIndex = 2; // Not player1's turn
      const move = createMove.declareRenuncio(
        'player1' as PlayerId,
        'Test reason',
      );

      const isValid = isValidMove(gameState, move);

      // Current implementation requires it to be player's turn
      expect(isValid).toBe(false);
    });

    it('accepts renuncio during a trick', () => {
      const gameState = createTestGameState();
      gameState.currentTrick = [
        {
          playerId: 'player1' as PlayerId,
          card: createCard('p1c1', 'oros', 1),
        },
      ];
      const move = createMove.declareRenuncio(
        'player1' as PlayerId,
        'Test reason',
      );

      const isValid = isValidMove(gameState, move);

      expect(isValid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('rejects unknown move types', () => {
      const gameState = createTestGameState();
      const unknownMove = {
        type: 'UNKNOWN_MOVE' as any,
        playerId: 'player1' as PlayerId,
        timestamp: Date.now(),
      };

      const isValid = isValidMove(gameState, unknownMove as any);

      expect(isValid).toBe(false);
    });

    it('handles missing player in teams gracefully', () => {
      const gameState = createTestGameState();
      // Remove player from teams
      gameState.teams[0].playerIds = ['player3' as PlayerId];

      const cantarMove = createMove.cantar('player1' as PlayerId, 'copas');
      const victoryMove = createMove.declareVictory('player1' as PlayerId);

      expect(isValidMove(gameState, cantarMove)).toBe(false);
      expect(isValidMove(gameState, victoryMove)).toBe(false);
    });
  });
});
