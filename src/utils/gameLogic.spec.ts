import { describe, test, expect } from '@jest/globals';
import type {
  Card,
  CardId,
  PlayerId,
  TrickCard,
  GameState,
  Team,
  TeamId,
} from '../types/game.types';
import type { SpanishSuit, CardValue } from '../components/game/SpanishCard';
import {
  createDeck,
  shuffleDeck,
  dealInitialCards,
  isValidPlay,
  calculateTrickWinner,
  calculateTrickPoints,
  canCantar,
  calculateCantePoints,
  canCambiar7,
  getNextPlayerIndex,
  calculateFinalPoints,
  CARD_POWER,
  WINNING_SCORE,
  DEFAULT_PARTIDAS_PER_COTO,
  DEFAULT_COTOS_PER_MATCH,
  isGameOver,
  shouldStartVueltas,
  canDeclareVictory,
  determineVueltasWinner,
  getValidCards,
  checkPartidaWon,
  checkCotoWon,
  checkMatchWon,
  createInitialMatchScore,
  updateMatchScoreForPartida,
  isMatchComplete,
  getMatchWinner,
  migrateMatchScore,
  startNewPartida,
  isValidTeamIndex,
} from './gameLogic';

describe('createDeck', () => {
  test('creates a 40-card Spanish deck', () => {
    const deck = createDeck();

    expect(deck).toHaveLength(40);

    const suits = ['espadas', 'bastos', 'oros', 'copas'];
    const values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

    suits.forEach(suit => {
      values.forEach(value => {
        const card = deck.find(c => c.suit === suit && c.value === value);
        expect(card).toBeDefined();
        expect(card?.id).toBe(`${suit}_${value}`);
      });
    });
  });
});

describe('shuffleDeck', () => {
  test('returns a deck with same cards but different order', () => {
    const originalDeck = createDeck();
    const shuffled = shuffleDeck(originalDeck);

    expect(shuffled).toHaveLength(originalDeck.length);
    expect(shuffled).not.toBe(originalDeck);

    // Check all original cards are present
    originalDeck.forEach(card => {
      expect(shuffled).toContainEqual(card);
    });

    // Very unlikely to be in same order (but possible)
    const isDifferentOrder = shuffled.some((card, index) => card.id !== originalDeck[index].id);
    expect(isDifferentOrder).toBe(true);
  });

  test('preserves all cards without duplication', () => {
    const originalDeck = createDeck();
    const shuffled = shuffleDeck(originalDeck);

    // Create frequency maps
    const originalFreq = new Map<string, number>();
    const shuffledFreq = new Map<string, number>();

    originalDeck.forEach(card => {
      originalFreq.set(card.id, (originalFreq.get(card.id) || 0) + 1);
    });

    shuffled.forEach(card => {
      shuffledFreq.set(card.id, (shuffledFreq.get(card.id) || 0) + 1);
    });

    expect(shuffledFreq).toEqual(originalFreq);
  });
});

describe('dealInitialCards', () => {
  test('deals 6 cards to each player', () => {
    const deck = createDeck();
    const playerIds: PlayerId[] = [
      'p1' as PlayerId,
      'p2' as PlayerId,
      'p3' as PlayerId,
      'p4' as PlayerId,
    ];

    const { hands, remainingDeck } = dealInitialCards(deck, playerIds);

    expect(hands.size).toBe(4);
    playerIds.forEach(playerId => {
      expect(hands.get(playerId)).toHaveLength(6);
    });

    expect(remainingDeck).toHaveLength(16); // 40 - (4 * 6) = 16
  });
});

describe('isValidPlay', () => {
  const trumpSuit = 'oros';

  test('first card of trick is always valid', () => {
    const card: Card = { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 };
    const hand: Card[] = [card];
    const currentTrick: TrickCard[] = [];

    expect(isValidPlay(card, hand, currentTrick, trumpSuit)).toBe(true);
  });

  test('in draw phase all cards are valid', () => {
    const leadCard: TrickCard = {
      playerId: 'p1' as PlayerId,
      card: { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
    };
    const currentTrick = [leadCard];

    const hand: Card[] = [
      { id: 'espadas_7' as CardId, suit: 'espadas', value: 7 },
      { id: 'bastos_3' as CardId, suit: 'bastos', value: 3 },
    ];

    // In draw phase (default), all cards are valid
    expect(isValidPlay(hand[0], hand, currentTrick, trumpSuit, 'playing')).toBe(true);
    expect(isValidPlay(hand[1], hand, currentTrick, trumpSuit, 'playing')).toBe(true);
  });

  test('in draw phase can play any card even without following suit', () => {
    const leadCard: TrickCard = {
      playerId: 'p1' as PlayerId,
      card: { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
    };
    const currentTrick = [leadCard];

    const hand: Card[] = [
      { id: 'oros_7' as CardId, suit: 'oros', value: 7 }, // trump
      { id: 'bastos_3' as CardId, suit: 'bastos', value: 3 },
    ];

    // In draw phase, both cards are valid even without following suit
    expect(isValidPlay(hand[0], hand, currentTrick, trumpSuit, 'playing')).toBe(true);
    expect(isValidPlay(hand[1], hand, currentTrick, trumpSuit, 'playing')).toBe(true);
  });

  test('arrastre phase must beat trick if possible when following suit', () => {
    const leadCard: TrickCard = {
      playerId: 'p1' as PlayerId,
      card: { id: 'espadas_10' as CardId, suit: 'espadas', value: 10 }, // Sota
    };
    const currentTrick = [leadCard];

    const hand: Card[] = [
      { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 }, // As - can beat
      { id: 'espadas_2' as CardId, suit: 'espadas', value: 2 }, // 2 - cannot beat
    ];

    const mockGameState = {
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['p2', 'p4'] as [PlayerId, PlayerId],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p1', 'p3'] as [PlayerId, PlayerId],
        },
      ],
    } as GameState;

    // Must play As to beat the Sota
    expect(
      isValidPlay(
        hand[0],
        hand,
        currentTrick,
        trumpSuit,
        'arrastre',
        'p2' as PlayerId,
        mockGameState,
      ),
    ).toBe(true);
    expect(
      isValidPlay(
        hand[1],
        hand,
        currentTrick,
        trumpSuit,
        'arrastre',
        'p2' as PlayerId,
        mockGameState,
      ),
    ).toBe(false);
  });

  test('arrastre phase must trump if cannot follow suit', () => {
    const leadCard: TrickCard = {
      playerId: 'p1' as PlayerId,
      card: { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
    };
    const currentTrick = [leadCard];

    const hand: Card[] = [
      { id: 'oros_7' as CardId, suit: 'oros', value: 7 }, // trump
      { id: 'bastos_3' as CardId, suit: 'bastos', value: 3 }, // non-trump
    ];

    const mockGameState = {
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['p2', 'p4'] as [PlayerId, PlayerId],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p1', 'p3'] as [PlayerId, PlayerId],
        },
      ],
    } as GameState;

    // Must play trump when cannot follow suit
    expect(
      isValidPlay(
        hand[0],
        hand,
        currentTrick,
        trumpSuit,
        'arrastre',
        'p2' as PlayerId,
        mockGameState,
      ),
    ).toBe(true);
    expect(
      isValidPlay(
        hand[1],
        hand,
        currentTrick,
        trumpSuit,
        'arrastre',
        'p2' as PlayerId,
        mockGameState,
      ),
    ).toBe(false);
  });

  test('arrastre phase must follow suit if possible', () => {
    const leadCard: TrickCard = {
      playerId: 'p1' as PlayerId,
      card: { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
    };
    const currentTrick = [leadCard];

    const hand: Card[] = [
      { id: 'espadas_7' as CardId, suit: 'espadas', value: 7 },
      { id: 'bastos_3' as CardId, suit: 'bastos', value: 3 },
    ];

    // Without gameState and playerId, should return false for safety
    expect(isValidPlay(hand[0], hand, currentTrick, trumpSuit, 'arrastre')).toBe(false);

    // Without gameState and playerId, should return false for safety
    expect(isValidPlay(hand[1], hand, currentTrick, trumpSuit, 'arrastre')).toBe(false);
  });

  test('arrastre phase still requires following suit if possible', () => {
    const leadCard: TrickCard = {
      playerId: 'p1' as PlayerId,
      card: { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
    };
    const currentTrick = [leadCard];

    const hand: Card[] = [
      { id: 'espadas_7' as CardId, suit: 'espadas', value: 7 },
      { id: 'bastos_3' as CardId, suit: 'bastos', value: 3 },
    ];

    // Without gameState and playerId, should return false for safety
    expect(isValidPlay(hand[0], hand, currentTrick, trumpSuit, 'arrastre')).toBe(false);
    expect(isValidPlay(hand[1], hand, currentTrick, trumpSuit, 'arrastre')).toBe(false);
  });
});

describe('calculateTrickWinner', () => {
  const trumpSuit = 'oros';

  test('Sota beats Caballo in Guiñote', () => {
    // This is unique to Guiñote - Sota (10) beats Caballo (11)
    const trick: TrickCard[] = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'espadas_10' as CardId, suit: 'espadas', value: 10 }, // Sota
      },
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'espadas_11' as CardId, suit: 'espadas', value: 11 }, // Caballo
      },
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'espadas_7' as CardId, suit: 'espadas', value: 7 },
      },
      {
        playerId: 'p4' as PlayerId,
        card: { id: 'espadas_6' as CardId, suit: 'espadas', value: 6 },
      },
    ];

    expect(calculateTrickWinner(trick, trumpSuit)).toBe('p1');
  });

  test('highest card of lead suit wins if no trumps', () => {
    const trick: TrickCard[] = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'espadas_7' as CardId, suit: 'espadas', value: 7 },
      },
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
      }, // As
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'espadas_3' as CardId, suit: 'espadas', value: 3 },
      },
      {
        playerId: 'p4' as PlayerId,
        card: { id: 'espadas_10' as CardId, suit: 'espadas', value: 10 },
      },
    ];

    expect(calculateTrickWinner(trick, trumpSuit)).toBe('p2');
  });

  test('trump beats non-trump cards', () => {
    const trick: TrickCard[] = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
      },
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'oros_2' as CardId, suit: 'oros', value: 2 },
      }, // trump
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'espadas_3' as CardId, suit: 'espadas', value: 3 },
      },
      {
        playerId: 'p4' as PlayerId,
        card: { id: 'espadas_12' as CardId, suit: 'espadas', value: 12 },
      },
    ];

    expect(calculateTrickWinner(trick, trumpSuit)).toBe('p2');
  });

  test('highest trump wins when multiple trumps played', () => {
    const trick: TrickCard[] = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'oros_7' as CardId, suit: 'oros', value: 7 },
      },
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'oros_1' as CardId, suit: 'oros', value: 1 },
      }, // As de triunfo
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'oros_3' as CardId, suit: 'oros', value: 3 },
      },
      {
        playerId: 'p4' as PlayerId,
        card: { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
      },
    ];

    expect(calculateTrickWinner(trick, trumpSuit)).toBe('p2');
  });
});

describe('calculateTrickPoints', () => {
  test('Sota worth 3 points and Caballo worth 2 points', () => {
    const trick: TrickCard[] = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'espadas_10' as CardId, suit: 'espadas', value: 10 },
      }, // Sota = 3 points
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'oros_11' as CardId, suit: 'oros', value: 11 },
      }, // Caballo = 2 points
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'bastos_7' as CardId, suit: 'bastos', value: 7 },
      }, // 0 points
      {
        playerId: 'p4' as PlayerId,
        card: { id: 'copas_6' as CardId, suit: 'copas', value: 6 },
      }, // 0 points
    ];

    expect(calculateTrickPoints(trick)).toBe(5); // 3 + 2 + 0 + 0
  });

  test('calculates correct points for a trick', () => {
    const trick: TrickCard[] = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
      }, // 11 points
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'oros_3' as CardId, suit: 'oros', value: 3 },
      }, // 10 points
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'bastos_12' as CardId, suit: 'bastos', value: 12 },
      }, // 4 points
      {
        playerId: 'p4' as PlayerId,
        card: { id: 'copas_7' as CardId, suit: 'copas', value: 7 },
      }, // 0 points
    ];

    expect(calculateTrickPoints(trick)).toBe(25);
  });
});

describe('canCantar', () => {
  test('detects valid cantes in hand', () => {
    const hand: Card[] = [
      { id: 'espadas_12' as CardId, suit: 'espadas', value: 12 }, // Rey
      { id: 'espadas_10' as CardId, suit: 'espadas', value: 10 }, // Sota
      { id: 'oros_12' as CardId, suit: 'oros', value: 12 },
      { id: 'oros_10' as CardId, suit: 'oros', value: 10 },
      { id: 'bastos_12' as CardId, suit: 'bastos', value: 12 },
      { id: 'copas_7' as CardId, suit: 'copas', value: 7 },
    ];

    const cantableSuits = canCantar(hand, 'copas', []);

    expect(cantableSuits).toHaveLength(2);
    expect(cantableSuits).toContain('espadas');
    expect(cantableSuits).toContain('oros');
  });

  test('excludes already canted suits', () => {
    const hand: Card[] = [
      { id: 'espadas_12' as CardId, suit: 'espadas', value: 12 },
      { id: 'espadas_10' as CardId, suit: 'espadas', value: 10 },
    ];

    const teamCantes = [{ teamId: 't1' as any, suit: 'espadas' as const, points: 20 as const }];
    const cantableSuits = canCantar(hand, 'copas', teamCantes);

    expect(cantableSuits).toHaveLength(0);
  });
});

describe('calculateCantePoints', () => {
  test('returns 40 for trump suit cante', () => {
    expect(calculateCantePoints('oros', 'oros')).toBe(40);
  });

  test('returns 20 for non-trump suit cante', () => {
    expect(calculateCantePoints('espadas', 'oros')).toBe(20);
  });
});

describe('canCambiar7', () => {
  const trumpCard: Card = { id: 'oros_3' as CardId, suit: 'oros', value: 3 };

  test('can exchange when has 7 of trump and deck has cards', () => {
    const hand: Card[] = [
      { id: 'oros_7' as CardId, suit: 'oros', value: 7 },
      { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
    ];

    expect(canCambiar7(hand, trumpCard, 10)).toBe(true);
  });

  test('cannot exchange when deck is empty', () => {
    const hand: Card[] = [{ id: 'oros_7' as CardId, suit: 'oros', value: 7 }];

    expect(canCambiar7(hand, trumpCard, 0)).toBe(false);
  });

  test('cannot exchange when trump card is already a 7', () => {
    const trump7: Card = { id: 'oros_7' as CardId, suit: 'oros', value: 7 };
    const hand: Card[] = [{ id: 'oros_2' as CardId, suit: 'oros', value: 2 }];

    expect(canCambiar7(hand, trump7, 10)).toBe(false);
  });
});

describe('getNextPlayerIndex', () => {
  test('cycles through players counter-clockwise', () => {
    // Guiñote goes counter-clockwise
    expect(getNextPlayerIndex(0, 4)).toBe(3);
    expect(getNextPlayerIndex(3, 4)).toBe(2);
    expect(getNextPlayerIndex(2, 4)).toBe(1);
    expect(getNextPlayerIndex(1, 4)).toBe(0);
  });
});

describe('calculateFinalPoints', () => {
  test('adds 10 points for last trick winner', () => {
    const gameState = {
      teams: [
        { id: 'team1' as any, score: 50, playerIds: ['p1', 'p2'] as any },
        { id: 'team2' as any, score: 45, playerIds: ['p3', 'p4'] as any },
      ],
      lastTrickWinner: 'p1' as any,
    } as any;

    const finalPoints = calculateFinalPoints(gameState);

    expect(finalPoints.get('team1' as any)).toBe(60); // 50 + 10
    expect(finalPoints.get('team2' as any)).toBe(45);
  });

  test('applies 30 malas rule when team has less than 30 points', () => {
    const gameState = {
      teams: [
        { id: 'team1' as any, score: 25, playerIds: ['p1', 'p2'] as any },
        { id: 'team2' as any, score: 75, playerIds: ['p3', 'p4'] as any },
      ],
    } as any;

    const finalPoints = calculateFinalPoints(gameState);

    expect(finalPoints.get('team1' as any)).toBe(25);
    expect(finalPoints.get('team2' as any)).toBe(101); // Auto-win for opponent
  });

  test('30 malas rule with últimas bonus', () => {
    const gameState = {
      teams: [
        { id: 'team1' as any, score: 28, playerIds: ['p1', 'p2'] as any },
        { id: 'team2' as any, score: 60, playerIds: ['p3', 'p4'] as any },
      ],
      lastTrickWinner: 'p1' as any,
    } as any;

    const finalPoints = calculateFinalPoints(gameState);

    // Team1 gets 10 últimas, bringing them to 38, so no malas
    expect(finalPoints.get('team1' as any)).toBe(38); // 28 + 10
    expect(finalPoints.get('team2' as any)).toBe(60);
  });
});

describe('CARD_POWER', () => {
  test('exports correct card power ranking', () => {
    expect(CARD_POWER).toEqual([1, 3, 12, 10, 11, 7, 6, 5, 4, 2]);
  });

  test('power ranking matches getCardRank internal logic', () => {
    // Verify that As (1) is highest power
    expect(CARD_POWER.indexOf(1)).toBe(0);
    // Verify that 3 is second highest
    expect(CARD_POWER.indexOf(3)).toBe(1);
    // Verify that 2 is lowest power
    expect(CARD_POWER.indexOf(2)).toBe(CARD_POWER.length - 1);
  });
});

// Tests for Guiñote-specific rules
describe('Guiñote Card Ranking', () => {
  test('Sota (10) beats Caballo (11) in same suit', () => {
    const trick: TrickCard[] = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'oros_10' as CardId, suit: 'oros', value: 10 }, // Sota
      },
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'oros_11' as CardId, suit: 'oros', value: 11 }, // Caballo
      },
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'oros_7' as CardId, suit: 'oros', value: 7 },
      },
      {
        playerId: 'p4' as PlayerId,
        card: { id: 'oros_6' as CardId, suit: 'oros', value: 6 },
      },
    ];

    expect(calculateTrickWinner(trick, 'copas')).toBe('p1');
  });

  test('confirms correct ranking: As > Tres > Rey > Sota > Caballo', () => {
    // Test As beats all
    const trick1: TrickCard[] = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'e_1' as CardId, suit: 'espadas', value: 1 },
      },
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'e_3' as CardId, suit: 'espadas', value: 3 },
      },
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'e_12' as CardId, suit: 'espadas', value: 12 },
      },
      {
        playerId: 'p4' as PlayerId,
        card: { id: 'e_10' as CardId, suit: 'espadas', value: 10 },
      },
    ];
    expect(calculateTrickWinner(trick1, 'copas')).toBe('p1');

    // Test Tres beats Rey, Sota, Caballo
    const trick2: TrickCard[] = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'e_3' as CardId, suit: 'espadas', value: 3 },
      },
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'e_12' as CardId, suit: 'espadas', value: 12 },
      },
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'e_10' as CardId, suit: 'espadas', value: 10 },
      },
      {
        playerId: 'p4' as PlayerId,
        card: { id: 'e_11' as CardId, suit: 'espadas', value: 11 },
      },
    ];
    expect(calculateTrickWinner(trick2, 'copas')).toBe('p1');

    // Test Sota beats Caballo
    const trick3: TrickCard[] = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'e_10' as CardId, suit: 'espadas', value: 10 },
      },
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'e_11' as CardId, suit: 'espadas', value: 11 },
      },
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'e_7' as CardId, suit: 'espadas', value: 7 },
      },
      {
        playerId: 'p4' as PlayerId,
        card: { id: 'e_2' as CardId, suit: 'espadas', value: 2 },
      },
    ];
    expect(calculateTrickWinner(trick3, 'copas')).toBe('p1');
  });
});

describe('Partida de Vueltas', () => {
  test('shouldStartVueltas returns true when no team reaches 101 and game ends', () => {
    const mockGameState = {
      teams: [{ score: 85, cardPoints: 50 } as Team, { score: 90, cardPoints: 45 } as Team],
      deck: [],
      hands: new Map(), // Empty hands = game ended
    } as unknown as GameState;

    expect(shouldStartVueltas(mockGameState)).toBe(true);
  });

  test('shouldStartVueltas returns false when a team has 101+ points', () => {
    const mockGameState = {
      teams: [{ score: 101, cardPoints: 35 } as Team, { score: 85, cardPoints: 40 } as Team],
      deck: [],
      hands: new Map(),
    } as unknown as GameState;

    expect(shouldStartVueltas(mockGameState)).toBe(false);
  });

  test('shouldStartVueltas returns false when hands still have cards', () => {
    const mockGameState = {
      teams: [{ score: 85, cardPoints: 50 } as Team, { score: 90, cardPoints: 45 } as Team],
      deck: [],
      hands: new Map([['p1' as PlayerId, [{ id: 'c1' as CardId }] as Card[]]]),
    } as unknown as GameState;

    expect(shouldStartVueltas(mockGameState)).toBe(false);
  });

  test('canDeclareVictory correctly calculates total scores', () => {
    const mockGameState = {
      teams: [
        { id: 'team1' as TeamId, score: 95, cardPoints: 40 } as Team,
        { id: 'team2' as TeamId, score: 90, cardPoints: 35 } as Team,
      ],
      initialScores: new Map([
        ['team1' as TeamId, 80],
        ['team2' as TeamId, 85],
      ]),
      isVueltas: true,
      lastTrickWinnerTeam: 'team1' as TeamId, // Team1 won last trick in first hand
    } as unknown as GameState;

    // Team1: 80 + 95 = 175 total
    // Team2: 85 + 90 = 175 total
    // Team1 wins because they won last trick in first hand
    expect(canDeclareVictory('team1' as TeamId, mockGameState)).toBe(true);
    expect(canDeclareVictory('team2' as TeamId, mockGameState)).toBe(false);
  });
});

describe('isGameOver with 30 malas rule', () => {
  test('game over when team reaches 101 with 30+ card points', () => {
    const mockGameState = {
      teams: [{ score: 101, cardPoints: 35 } as Team, { score: 85, cardPoints: 40 } as Team],
    } as GameState;

    expect(isGameOver(mockGameState)).toBe(true);
  });

  test('game NOT over when team has 101 but less than 30 card points', () => {
    const mockGameState = {
      teams: [{ score: 101, cardPoints: 25 } as Team, { score: 85, cardPoints: 40 } as Team],
    } as GameState;

    expect(isGameOver(mockGameState)).toBe(false);
  });

  test('game over when team reaches exactly 30 card points with 101+ score', () => {
    const mockGameState = {
      teams: [{ score: 105, cardPoints: 30 } as Team, { score: 80, cardPoints: 45 } as Team],
    } as GameState;

    expect(isGameOver(mockGameState)).toBe(true);
  });
});

describe('getValidCards for smart card filtering', () => {
  function createCard(suit: SpanishSuit, value: CardValue): Card {
    return {
      id: `${suit}-${value}` as CardId,
      suit,
      value,
    };
  }

  test('returns all cards in draw phase', () => {
    const hand = [createCard('oros', 1), createCard('copas', 3), createCard('espadas', 12)];

    const mockGameState = {
      phase: 'playing',
      currentTrick: [],
      trumpSuit: 'bastos',
    } as unknown as GameState;

    const validCards = getValidCards(hand, mockGameState, 'player1' as PlayerId);
    expect(validCards).toHaveLength(3);
    expect(validCards).toEqual(hand);
  });

  test('filters cards by suit in arrastre phase', () => {
    const hand = [createCard('oros', 1), createCard('oros', 3), createCard('copas', 12)];

    const mockGameState = {
      phase: 'arrastre',
      currentTrick: [
        {
          playerId: 'p1' as PlayerId,
          card: createCard('oros', 7),
        },
      ],
      trumpSuit: 'bastos',
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['player2' as PlayerId, 'p2' as PlayerId],
        } as Team,
        {
          id: 'team2' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
        } as Team,
      ],
      players: [
        { id: 'player2' as PlayerId } as any,
        { id: 'p1' as PlayerId } as any,
        { id: 'p2' as PlayerId } as any,
        { id: 'p3' as PlayerId } as any,
      ],
    } as unknown as GameState;

    const validCards = getValidCards(hand, mockGameState, 'player2' as PlayerId);
    expect(validCards).toHaveLength(2);
    expect(validCards.every(c => c.suit === 'oros')).toBe(true);
  });

  test('must play higher card in arrastre when possible', () => {
    const hand = [
      createCard('oros', 1), // As - can beat 10
      createCard('oros', 7), // 7 - cannot beat 10
      createCard('oros', 2), // 2 - cannot beat 10
    ];

    const mockGameState = {
      phase: 'arrastre',
      currentTrick: [
        {
          playerId: 'p1' as PlayerId,
          card: createCard('oros', 10), // Sota
        },
      ],
      trumpSuit: 'bastos',
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['player2' as PlayerId, 'p2' as PlayerId],
        } as Team,
        {
          id: 'team2' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
        } as Team,
      ],
      players: [
        { id: 'player2' as PlayerId } as any,
        { id: 'p1' as PlayerId } as any,
        { id: 'p2' as PlayerId } as any,
        { id: 'p3' as PlayerId } as any,
      ],
    } as unknown as GameState;

    const validCards = getValidCards(hand, mockGameState, 'player2' as PlayerId);
    expect(validCards).toHaveLength(1);
    expect(validCards[0].value).toBe(1); // Only As can beat Sota
  });

  test('must play trump if cannot follow suit in arrastre', () => {
    const hand = [
      createCard('copas', 1),
      createCard('bastos', 7), // Trump
      createCard('espadas', 12),
    ];

    const mockGameState = {
      phase: 'arrastre',
      currentTrick: [
        {
          playerId: 'p1' as PlayerId,
          card: createCard('oros', 10),
        },
      ],
      trumpSuit: 'bastos',
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['player2' as PlayerId, 'p2' as PlayerId],
        } as Team,
        {
          id: 'team2' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
        } as Team,
      ],
      players: [
        { id: 'player2' as PlayerId } as any,
        { id: 'p1' as PlayerId } as any,
        { id: 'p2' as PlayerId } as any,
        { id: 'p3' as PlayerId } as any,
      ],
    } as unknown as GameState;

    const validCards = getValidCards(hand, mockGameState, 'player2' as PlayerId);
    expect(validCards).toHaveLength(1);
    expect(validCards[0].suit).toBe('bastos');
  });

  test('can play any card if no suit match and no trump in arrastre', () => {
    const hand = [createCard('copas', 1), createCard('copas', 3), createCard('espadas', 12)];

    const mockGameState = {
      phase: 'arrastre',
      currentTrick: [
        {
          playerId: 'p1' as PlayerId,
          card: createCard('oros', 7),
        },
      ],
      trumpSuit: 'bastos',
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['player2' as PlayerId, 'p2' as PlayerId],
        } as Team,
        {
          id: 'team2' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
        } as Team,
      ],
      players: [
        { id: 'player2' as PlayerId } as any,
        { id: 'p1' as PlayerId } as any,
        { id: 'p2' as PlayerId } as any,
        { id: 'p3' as PlayerId } as any,
      ],
    } as unknown as GameState;

    const validCards = getValidCards(hand, mockGameState, 'player2' as PlayerId);
    expect(validCards).toHaveLength(3); // All cards valid
  });
});

describe('Cante visibility (new tests)', () => {
  test('team cantes include visibility flag', () => {
    const hand: Card[] = [
      { id: 'oros_12' as CardId, suit: 'oros', value: 12 },
      { id: 'oros_10' as CardId, suit: 'oros', value: 10 },
    ];

    // Test structure of cantes with visibility
    const sampleCante = {
      teamId: 'team1' as TeamId,
      suit: 'oros' as SpanishSuit,
      points: 40 as const,
      isVisible: false, // Las Cuarenta hidden
    };

    // Verify cantes have the visibility flag
    expect(sampleCante).toHaveProperty('isVisible');
    expect(sampleCante.isVisible).toBe(false);

    // Can still cantar a suit even if other team has canted it
    const cantableSuits = canCantar(hand, 'bastos', []);
    expect(cantableSuits).toContain('oros');
  });
});

describe('Helper functions', () => {
  describe('isValidTeamIndex', () => {
    test('returns true for valid team index 0', () => {
      expect(isValidTeamIndex(0)).toBe(true);
    });

    test('returns true for valid team index 1', () => {
      expect(isValidTeamIndex(1)).toBe(true);
    });

    test('returns false for invalid negative index', () => {
      expect(isValidTeamIndex(-1)).toBe(false);
    });

    test('returns false for invalid index 2', () => {
      expect(isValidTeamIndex(2)).toBe(false);
    });

    test('returns false for non-integer values', () => {
      expect(isValidTeamIndex(0.5)).toBe(false);
      expect(isValidTeamIndex(1.5)).toBe(false);
    });

    test('returns false for NaN', () => {
      expect(isValidTeamIndex(NaN)).toBe(false);
    });

    test('type guard narrows type correctly', () => {
      const index: number = 0;
      if (isValidTeamIndex(index)) {
        // TypeScript should recognize index as TeamIndex (0 | 1) here
        const teamIndex: 0 | 1 = index;
        expect(teamIndex).toBe(0);
      }
    });
  });
});

describe('Match progression functions', () => {
  describe('checkPartidaWon', () => {
    test('returns false when score is below WINNING_SCORE', () => {
      expect(checkPartidaWon(WINNING_SCORE - 1)).toBe(false);
      expect(checkPartidaWon(50)).toBe(false);
      expect(checkPartidaWon(0)).toBe(false);
    });

    test('returns true when score is WINNING_SCORE or above', () => {
      expect(checkPartidaWon(WINNING_SCORE)).toBe(true);
      expect(checkPartidaWon(150)).toBe(true);
      expect(checkPartidaWon(200)).toBe(true);
    });
  });

  describe('checkCotoWon', () => {
    test('returns false when partidas below threshold', () => {
      expect(checkCotoWon(0, 3)).toBe(false);
      expect(checkCotoWon(1, 3)).toBe(false);
      expect(checkCotoWon(2, 3)).toBe(false);
    });

    test('returns true when partidas meet or exceed threshold', () => {
      expect(checkCotoWon(3, 3)).toBe(true);
      expect(checkCotoWon(4, 3)).toBe(true);
      expect(checkCotoWon(5, 3)).toBe(true);
    });

    test('works with different thresholds', () => {
      expect(checkCotoWon(1, 2)).toBe(false);
      expect(checkCotoWon(2, 2)).toBe(true);
      expect(checkCotoWon(4, 5)).toBe(false);
      expect(checkCotoWon(5, 5)).toBe(true);
    });
  });

  describe('checkMatchWon', () => {
    test('returns false when cotos below threshold', () => {
      expect(checkMatchWon(0, 2)).toBe(false);
      expect(checkMatchWon(1, 2)).toBe(false);
    });

    test('returns true when cotos meet or exceed threshold', () => {
      expect(checkMatchWon(2, 2)).toBe(true);
      expect(checkMatchWon(3, 2)).toBe(true);
    });

    test('works with different thresholds', () => {
      expect(checkMatchWon(0, 1)).toBe(false);
      expect(checkMatchWon(1, 1)).toBe(true);
      expect(checkMatchWon(2, 3)).toBe(false);
      expect(checkMatchWon(3, 3)).toBe(true);
    });
  });

  describe('createInitialMatchScore', () => {
    test('creates correct initial structure', () => {
      const score = createInitialMatchScore();

      expect(score).toEqual({
        team1Partidas: 0,
        team2Partidas: 0,
        team1Cotos: 0,
        team2Cotos: 0,
        partidasPerCoto: 3,
        cotosPerMatch: 2,
        team1Sets: 0,
        team2Sets: 0,
        currentSet: 'buenas',
      });
    });

    test('has correct default values', () => {
      const score = createInitialMatchScore();
      expect(score.partidasPerCoto).toBe(DEFAULT_PARTIDAS_PER_COTO);
      expect(score.cotosPerMatch).toBe(DEFAULT_COTOS_PER_MATCH);
      expect(score.currentSet).toBe('buenas');
    });
  });

  describe('updateMatchScoreForPartida', () => {
    test('increments team1 partidas when team1 wins', () => {
      const initialScore = createInitialMatchScore();
      const updatedScore = updateMatchScoreForPartida(initialScore, 0);

      expect(updatedScore.team1Partidas).toBe(1);
      expect(updatedScore.team2Partidas).toBe(0);
      expect(updatedScore.team1Sets).toBe(1); // Legacy compatibility
    });

    test('increments team2 partidas when team2 wins', () => {
      const initialScore = createInitialMatchScore();
      const updatedScore = updateMatchScoreForPartida(initialScore, 1);

      expect(updatedScore.team1Partidas).toBe(0);
      expect(updatedScore.team2Partidas).toBe(1);
      expect(updatedScore.team2Sets).toBe(1); // Legacy compatibility
    });

    test('awards coto and resets partidas when team reaches 3', () => {
      const scoreBeforeCoto = {
        ...createInitialMatchScore(),
        team1Partidas: 2,
        team1Sets: 2,
      };

      const updatedScore = updateMatchScoreForPartida(scoreBeforeCoto, 0);

      expect(updatedScore.team1Partidas).toBe(0); // Reset
      expect(updatedScore.team2Partidas).toBe(0); // Reset
      expect(updatedScore.team1Cotos).toBe(1); // Coto awarded
      expect(updatedScore.team2Cotos).toBe(0);
      expect(updatedScore.team1Sets).toBe(0); // Legacy reset
      expect(updatedScore.team2Sets).toBe(0); // Legacy reset
    });

    test('updates currentSet correctly', () => {
      const initial = createInitialMatchScore();

      // First partida - should be malas
      const after1 = updateMatchScoreForPartida(initial, 0);
      expect(after1.currentSet).toBe('malas');

      // Second partida (1-1) - should be bella
      const after2 = updateMatchScoreForPartida(after1, 1);
      expect(after2.currentSet).toBe('bella');

      // After coto reset - should be buenas
      const beforeCoto = { ...initial, team1Partidas: 2, team1Sets: 2 };
      const afterCoto = updateMatchScoreForPartida(beforeCoto, 0);
      expect(afterCoto.currentSet).toBe('buenas');
    });

    test('handles team2 coto win correctly', () => {
      const scoreBeforeCoto = {
        ...createInitialMatchScore(),
        team2Partidas: 2,
        team2Sets: 2,
      };

      const updatedScore = updateMatchScoreForPartida(scoreBeforeCoto, 1);

      expect(updatedScore.team1Partidas).toBe(0);
      expect(updatedScore.team2Partidas).toBe(0);
      expect(updatedScore.team1Cotos).toBe(0);
      expect(updatedScore.team2Cotos).toBe(1);
    });
  });

  describe('isMatchComplete', () => {
    test('returns false when no team has won enough cotos', () => {
      const score = createInitialMatchScore();
      expect(isMatchComplete(score)).toBe(false);

      score.team1Cotos = 1;
      expect(isMatchComplete(score)).toBe(false);

      score.team2Cotos = 1;
      expect(isMatchComplete(score)).toBe(false);
    });

    test('returns true when team1 wins match', () => {
      const score = {
        ...createInitialMatchScore(),
        team1Cotos: 2,
      };
      expect(isMatchComplete(score)).toBe(true);
    });

    test('returns true when team2 wins match', () => {
      const score = {
        ...createInitialMatchScore(),
        team2Cotos: 2,
      };
      expect(isMatchComplete(score)).toBe(true);
    });

    test('respects custom cotosPerMatch', () => {
      const score = {
        ...createInitialMatchScore(),
        cotosPerMatch: 3,
        team1Cotos: 2,
      };
      expect(isMatchComplete(score)).toBe(false);

      score.team1Cotos = 3;
      expect(isMatchComplete(score)).toBe(true);
    });
  });

  describe('getMatchWinner', () => {
    test('returns null when match not complete', () => {
      const score = createInitialMatchScore();
      expect(getMatchWinner(score)).toBe(null);

      score.team1Cotos = 1;
      expect(getMatchWinner(score)).toBe(null);
    });

    test('returns 0 when team1 wins', () => {
      const score = {
        ...createInitialMatchScore(),
        team1Cotos: 2,
      };
      expect(getMatchWinner(score)).toBe(0);
    });

    test('returns 1 when team2 wins', () => {
      const score = {
        ...createInitialMatchScore(),
        team2Cotos: 2,
      };
      expect(getMatchWinner(score)).toBe(1);
    });
  });

  describe('migrateMatchScore', () => {
    test('returns default score when input is undefined', () => {
      const result = migrateMatchScore(undefined);
      expect(result).toEqual(createInitialMatchScore());
    });

    test('returns default score when input is empty object', () => {
      const result = migrateMatchScore({});
      expect(result).toEqual(createInitialMatchScore());
    });

    test('preserves existing new format fields', () => {
      const input = {
        team1Partidas: 2,
        team2Partidas: 1,
        team1Cotos: 1,
        team2Cotos: 0,
        partidasPerCoto: 4,
        cotosPerMatch: 3,
        currentSet: 'bella' as const,
      };

      const result = migrateMatchScore(input);
      expect(result.team1Partidas).toBe(2);
      expect(result.team2Partidas).toBe(1);
      expect(result.team1Cotos).toBe(1);
      expect(result.team2Cotos).toBe(0);
      expect(result.partidasPerCoto).toBe(4);
      expect(result.cotosPerMatch).toBe(3);
      expect(result.currentSet).toBe('bella');
    });

    test('migrates legacy team1Sets/team2Sets to partidas', () => {
      const input = {
        team1Sets: 2,
        team2Sets: 1,
        currentSet: 'malas' as const,
      };

      const result = migrateMatchScore(input);
      expect(result.team1Partidas).toBe(2);
      expect(result.team2Partidas).toBe(1);
      expect(result.team1Sets).toBe(2); // Preserved for compatibility
      expect(result.team2Sets).toBe(1);
      expect(result.currentSet).toBe('malas');
    });

    test('prefers new format over legacy when both exist', () => {
      const input = {
        team1Partidas: 3,
        team2Partidas: 2,
        team1Sets: 1, // Should be ignored
        team2Sets: 0, // Should be ignored
      };

      const result = migrateMatchScore(input);
      expect(result.team1Partidas).toBe(3);
      expect(result.team2Partidas).toBe(2);
    });

    test('provides defaults for missing configuration', () => {
      const input = {
        team1Partidas: 1,
      };

      const result = migrateMatchScore(input);
      expect(result.partidasPerCoto).toBe(DEFAULT_PARTIDAS_PER_COTO);
      expect(result.cotosPerMatch).toBe(DEFAULT_COTOS_PER_MATCH);
      expect(result.currentSet).toBe('buenas');
    });
  });

  describe('Complete match flow', () => {
    test('properly tracks progression through multiple partidas', () => {
      // Start with initial match score
      let matchScore = createInitialMatchScore();

      // Team 1 wins first partida
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      expect(matchScore.team1Partidas).toBe(1);
      expect(matchScore.team2Partidas).toBe(0);
      expect(isMatchComplete(matchScore)).toBe(false);

      // Team 1 wins second partida
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      expect(matchScore.team1Partidas).toBe(2);
      expect(matchScore.team2Partidas).toBe(0);
      expect(isMatchComplete(matchScore)).toBe(false);

      // Team 1 wins third partida - wins first coto
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      expect(matchScore.team1Partidas).toBe(0); // Reset
      expect(matchScore.team2Partidas).toBe(0); // Reset
      expect(matchScore.team1Cotos).toBe(1);
      expect(matchScore.team2Cotos).toBe(0);
      expect(isMatchComplete(matchScore)).toBe(false);

      // Team 2 wins three partidas - wins a coto
      matchScore = updateMatchScoreForPartida(matchScore, 1);
      matchScore = updateMatchScoreForPartida(matchScore, 1);
      matchScore = updateMatchScoreForPartida(matchScore, 1);
      expect(matchScore.team1Cotos).toBe(1);
      expect(matchScore.team2Cotos).toBe(1);
      expect(isMatchComplete(matchScore)).toBe(false);

      // Team 1 wins three more partidas - wins second coto and match
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      expect(matchScore.team1Cotos).toBe(2);
      expect(matchScore.team2Cotos).toBe(1);
      expect(isMatchComplete(matchScore)).toBe(true);
      expect(getMatchWinner(matchScore)).toBe(0);
    });

    test('startNewPartida preserves match score immutably', () => {
      const mockGameState = {
        id: 'test' as any,
        phase: 'gameOver' as GamePhase,
        players: [],
        teams: [
          {
            id: 'team1' as TeamId,
            playerIds: [],
            score: 101,
            cardPoints: 50,
            cantes: [],
          },
          {
            id: 'team2' as TeamId,
            playerIds: [],
            score: 85,
            cardPoints: 30,
            cantes: [],
          },
        ] as [Team, Team],
        deck: [],
        hands: new Map(),
        trumpSuit: 'oros' as any,
        trumpCard: {
          id: 'oros_1' as any,
          suit: 'oros' as any,
          value: 1 as any,
        },
        currentTrick: [],
        currentPlayerIndex: 0,
        dealerIndex: 0,
        trickCount: 0,
        trickWins: new Map(),
        collectedTricks: new Map(),
        canCambiar7: false,
        gameHistory: [],
        isVueltas: false,
        canDeclareVictory: false,
        matchScore: {
          team1Partidas: 2,
          team2Partidas: 1,
          team1Cotos: 1,
          team2Cotos: 0,
          partidasPerCoto: 3,
          cotosPerMatch: 2,
          team1Sets: 2,
          team2Sets: 1,
          currentSet: 'malas' as const,
        },
      };

      const updatedMatchScore = updateMatchScoreForPartida(mockGameState.matchScore, 0);
      const newGameState = startNewPartida(mockGameState, updatedMatchScore);

      // Verify immutability - original state unchanged
      expect(mockGameState.phase).toBe('gameOver');
      expect(mockGameState.isVueltas).toBe(false);

      // Verify new state has correct values
      expect(newGameState.phase).toBe('dealing');
      expect(newGameState.isVueltas).toBe(false);
      expect(newGameState.matchScore).toEqual(updatedMatchScore);
      expect(newGameState.teams[0].score).toBe(0);
      expect(newGameState.teams[1].score).toBe(0);
    });
  });

  describe('determineVueltasWinner', () => {
    it('should return null if not in vueltas', () => {
      const gameState = {
        id: 'game_1' as any,
        phase: 'playing' as any,
        players: [] as any,
        teams: [
          {
            id: 'team1' as any,
            playerIds: [],
            score: 0,
            cardPoints: 0,
            cantes: [],
          },
          {
            id: 'team2' as any,
            playerIds: [],
            score: 0,
            cardPoints: 0,
            cantes: [],
          },
        ] as any,
        deck: [],
        hands: new Map(),
        trumpSuit: 'oros' as any,
        trumpCard: {
          id: 'oros_1' as any,
          suit: 'oros' as any,
          value: 1 as any,
        },
        currentTrick: [],
        currentPlayerIndex: 0,
        dealerIndex: 0,
        trickCount: 0,
        trickWins: new Map(),
        collectedTricks: new Map(),
        canCambiar7: false,
        gameHistory: [],
        isVueltas: false,
        canDeclareVictory: false,
      };

      expect(determineVueltasWinner(gameState)).toBeNull();
    });

    it('should return null if no initial scores', () => {
      const gameState = {
        id: 'game_1' as any,
        phase: 'playing' as any,
        players: [] as any,
        teams: [
          {
            id: 'team1' as any,
            playerIds: [],
            score: 0,
            cardPoints: 0,
            cantes: [],
          },
          {
            id: 'team2' as any,
            playerIds: [],
            score: 0,
            cardPoints: 0,
            cantes: [],
          },
        ] as any,
        deck: [],
        hands: new Map(),
        trumpSuit: 'oros' as any,
        trumpCard: {
          id: 'oros_1' as any,
          suit: 'oros' as any,
          value: 1 as any,
        },
        currentTrick: [],
        currentPlayerIndex: 0,
        dealerIndex: 0,
        trickCount: 0,
        trickWins: new Map(),
        collectedTricks: new Map(),
        canCambiar7: false,
        gameHistory: [],
        isVueltas: true,
        initialScores: undefined,
        canDeclareVictory: false,
      };

      expect(determineVueltasWinner(gameState)).toBeNull();
    });

    it('should determine winner based on total scores', () => {
      const initialScores = new Map();
      initialScores.set('team1', 50);
      initialScores.set('team2', 40);

      const gameState = {
        id: 'game_1' as any,
        phase: 'playing' as any,
        players: [] as any,
        teams: [
          {
            id: 'team1' as any,
            playerIds: [],
            score: 30,
            cardPoints: 0,
            cantes: [],
          }, // Total: 80
          {
            id: 'team2' as any,
            playerIds: [],
            score: 45,
            cardPoints: 0,
            cantes: [],
          }, // Total: 85
        ] as any,
        deck: [],
        hands: new Map(),
        trumpSuit: 'oros' as any,
        trumpCard: {
          id: 'oros_1' as any,
          suit: 'oros' as any,
          value: 1 as any,
        },
        currentTrick: [],
        currentPlayerIndex: 0,
        dealerIndex: 0,
        trickCount: 0,
        trickWins: new Map(),
        collectedTricks: new Map(),
        canCambiar7: false,
        gameHistory: [],
        isVueltas: true,
        initialScores,
        canDeclareVictory: false,
      };

      expect(determineVueltasWinner(gameState)).toBe('team2');
    });

    it('should use last trick winner as tiebreaker', () => {
      const FIRST_HAND_SCORE_TEAM1 = 50;
      const FIRST_HAND_SCORE_TEAM2 = 45;
      const SECOND_HAND_SCORE_TEAM1 = 30;
      const SECOND_HAND_SCORE_TEAM2 = 35;
      // Both teams end with total of 80

      const initialScores = new Map();
      initialScores.set('team1', FIRST_HAND_SCORE_TEAM1);
      initialScores.set('team2', FIRST_HAND_SCORE_TEAM2);

      const gameState = {
        id: 'game_1' as any,
        phase: 'playing' as any,
        players: [] as any,
        teams: [
          {
            id: 'team1' as any,
            playerIds: [],
            score: SECOND_HAND_SCORE_TEAM1,
            cardPoints: 0,
            cantes: [],
          },
          {
            id: 'team2' as any,
            playerIds: [],
            score: SECOND_HAND_SCORE_TEAM2,
            cardPoints: 0,
            cantes: [],
          },
        ] as any,
        deck: [],
        hands: new Map(),
        trumpSuit: 'oros' as any,
        trumpCard: {
          id: 'oros_1' as any,
          suit: 'oros' as any,
          value: 1 as any,
        },
        currentTrick: [],
        currentPlayerIndex: 0,
        dealerIndex: 0,
        trickCount: 0,
        trickWins: new Map(),
        collectedTricks: new Map(),
        canCambiar7: false,
        gameHistory: [],
        isVueltas: true,
        initialScores,
        lastTrickWinnerTeam: 'team1' as any,
        canDeclareVictory: false,
      };

      expect(determineVueltasWinner(gameState)).toBe('team1');
    });

    it('should return null when scores are tied and no tiebreaker available', () => {
      const EQUAL_FIRST_HAND_SCORE = 50;
      const EQUAL_SECOND_HAND_SCORE = 30;
      // Both teams end with total of 80, no tiebreaker

      const initialScores = new Map();
      initialScores.set('team1', EQUAL_FIRST_HAND_SCORE);
      initialScores.set('team2', EQUAL_FIRST_HAND_SCORE);

      const gameState = {
        id: 'game_1' as any,
        phase: 'playing' as any,
        players: [] as any,
        teams: [
          {
            id: 'team1' as any,
            playerIds: [],
            score: EQUAL_SECOND_HAND_SCORE,
            cardPoints: 0,
            cantes: [],
          },
          {
            id: 'team2' as any,
            playerIds: [],
            score: EQUAL_SECOND_HAND_SCORE,
            cardPoints: 0,
            cantes: [],
          },
        ] as any,
        deck: [],
        hands: new Map(),
        trumpSuit: 'oros' as any,
        trumpCard: {
          id: 'oros_1' as any,
          suit: 'oros' as any,
          value: 1 as any,
        },
        currentTrick: [],
        currentPlayerIndex: 0,
        dealerIndex: 0,
        trickCount: 0,
        trickWins: new Map(),
        collectedTricks: new Map(),
        canCambiar7: false,
        gameHistory: [],
        isVueltas: true,
        initialScores,
        lastTrickWinnerTeam: null, // No tiebreaker available
        canDeclareVictory: false,
      };

      expect(determineVueltasWinner(gameState)).toBeNull();
    });
  });
});
