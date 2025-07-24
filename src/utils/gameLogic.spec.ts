import { describe, test, expect } from '@jest/globals';
import type { Card, CardId, PlayerId, TrickCard } from '../types/game.types';
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

  test('must follow suit if possible', () => {
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
    expect(isValidPlay(hand[0], hand, currentTrick, trumpSuit)).toBe(true);

    // Invalid: not following suit when able
    expect(isValidPlay(hand[1], hand, currentTrick, trumpSuit)).toBe(false);
  });

  test('must play trump if cannot follow suit and has trump', () => {
    const leadCard: TrickCard = {
      playerId: 'p1' as PlayerId,
      card: { id: 'espadas_1' as CardId, suit: 'espadas', value: 1 },
    };
    const currentTrick = [leadCard];

    const hand: Card[] = [
      { id: 'oros_7' as CardId, suit: 'oros', value: 7 }, // trump
      { id: 'bastos_3' as CardId, suit: 'bastos', value: 3 },
    ];

    // Valid: playing trump when cannot follow suit
    expect(isValidPlay(hand[0], hand, currentTrick, trumpSuit)).toBe(true);

    // Invalid: not playing trump when must
    expect(isValidPlay(hand[1], hand, currentTrick, trumpSuit)).toBe(false);
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

    // Must play As to beat the Sota
    expect(
      isValidPlay(hand[0], hand, currentTrick, trumpSuit, 'arrastre'),
    ).toBe(true);
    expect(
      isValidPlay(hand[1], hand, currentTrick, trumpSuit, 'arrastre'),
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

    // Must play trump when cannot follow suit
    expect(
      isValidPlay(hand[0], hand, currentTrick, trumpSuit, 'arrastre'),
    ).toBe(true);
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
  test('cycles through players correctly', () => {
    expect(getNextPlayerIndex(0, 4)).toBe(1);
    expect(getNextPlayerIndex(1, 4)).toBe(2);
    expect(getNextPlayerIndex(2, 4)).toBe(3);
    expect(getNextPlayerIndex(3, 4)).toBe(0);
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
    expect(CARD_POWER).toEqual([1, 3, 12, 11, 10, 7, 6, 5, 4, 2]);
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
