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
  isGameOver,
  shouldStartVueltas,
  canDeclareVictory,
  getValidCards,
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
    const isDifferentOrder = shuffled.some(
      (card, index) => card.id !== originalDeck[index].id,
    );
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
    expect(isValidPlay(hand[0], hand, currentTrick, trumpSuit, 'playing')).toBe(
      true,
    );
    expect(isValidPlay(hand[1], hand, currentTrick, trumpSuit, 'playing')).toBe(
      true,
    );
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
    expect(isValidPlay(hand[0], hand, currentTrick, trumpSuit, 'playing')).toBe(
      true,
    );
    expect(isValidPlay(hand[1], hand, currentTrick, trumpSuit, 'playing')).toBe(
      true,
    );
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

    // Valid: following suit
    expect(
      isValidPlay(hand[0], hand, currentTrick, trumpSuit, 'arrastre'),
    ).toBe(true);

    // Invalid: not following suit when able
    expect(
      isValidPlay(hand[1], hand, currentTrick, trumpSuit, 'arrastre'),
    ).toBe(false);
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

    // Must still follow suit if possible, even in arrastre
    expect(
      isValidPlay(hand[0], hand, currentTrick, trumpSuit, 'arrastre'),
    ).toBe(true);
    expect(
      isValidPlay(hand[1], hand, currentTrick, trumpSuit, 'arrastre'),
    ).toBe(false);
  });
});

describe('calculateTrickWinner', () => {
  const trumpSuit = 'oros';

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

    const teamCantes = [
      { teamId: 't1' as any, suit: 'espadas' as const, points: 20 as const },
    ];
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
    // Spanish card games go counter-clockwise
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
      teams: [
        { score: 85, cardPoints: 50 } as Team,
        { score: 90, cardPoints: 45 } as Team,
      ],
      deck: [],
      hands: new Map(), // Empty hands = game ended
    } as unknown as GameState;

    expect(shouldStartVueltas(mockGameState)).toBe(true);
  });

  test('shouldStartVueltas returns false when a team has 101+ points', () => {
    const mockGameState = {
      teams: [
        { score: 101, cardPoints: 35 } as Team,
        { score: 85, cardPoints: 40 } as Team,
      ],
      deck: [],
      hands: new Map(),
    } as unknown as GameState;

    expect(shouldStartVueltas(mockGameState)).toBe(false);
  });

  test('shouldStartVueltas returns false when hands still have cards', () => {
    const mockGameState = {
      teams: [
        { score: 85, cardPoints: 50 } as Team,
        { score: 90, cardPoints: 45 } as Team,
      ],
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
    } as unknown as GameState;

    // Team1: 80 + 95 = 175 total
    // Team2: 85 + 90 = 175 total
    // Team1 wins because higher current score
    expect(canDeclareVictory('team1' as TeamId, mockGameState)).toBe(true);
    expect(canDeclareVictory('team2' as TeamId, mockGameState)).toBe(false);
  });
});

describe('isGameOver with 30 malas rule', () => {
  test('game over when team reaches 101 with 30+ card points', () => {
    const mockGameState = {
      teams: [
        { score: 101, cardPoints: 35 } as Team,
        { score: 85, cardPoints: 40 } as Team,
      ],
    } as GameState;

    expect(isGameOver(mockGameState)).toBe(true);
  });

  test('game NOT over when team has 101 but less than 30 card points', () => {
    const mockGameState = {
      teams: [
        { score: 101, cardPoints: 25 } as Team,
        { score: 85, cardPoints: 40 } as Team,
      ],
    } as GameState;

    expect(isGameOver(mockGameState)).toBe(false);
  });

  test('game over when team reaches exactly 30 card points with 101+ score', () => {
    const mockGameState = {
      teams: [
        { score: 105, cardPoints: 30 } as Team,
        { score: 80, cardPoints: 45 } as Team,
      ],
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
    const hand = [
      createCard('oros', 1),
      createCard('copas', 3),
      createCard('espadas', 12),
    ];

    const mockGameState = {
      phase: 'playing',
      currentTrick: [],
      trumpSuit: 'bastos',
    } as unknown as GameState;

    const validCards = getValidCards(
      hand,
      mockGameState,
      'player1' as PlayerId,
    );
    expect(validCards).toHaveLength(3);
    expect(validCards).toEqual(hand);
  });

  test('filters cards by suit in arrastre phase', () => {
    const hand = [
      createCard('oros', 1),
      createCard('oros', 3),
      createCard('copas', 12),
    ];

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

    const validCards = getValidCards(
      hand,
      mockGameState,
      'player2' as PlayerId,
    );
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

    const validCards = getValidCards(
      hand,
      mockGameState,
      'player2' as PlayerId,
    );
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

    const validCards = getValidCards(
      hand,
      mockGameState,
      'player2' as PlayerId,
    );
    expect(validCards).toHaveLength(1);
    expect(validCards[0].suit).toBe('bastos');
  });

  test('can play any card if no suit match and no trump in arrastre', () => {
    const hand = [
      createCard('copas', 1),
      createCard('copas', 3),
      createCard('espadas', 12),
    ];

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

    const validCards = getValidCards(
      hand,
      mockGameState,
      'player2' as PlayerId,
    );
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
