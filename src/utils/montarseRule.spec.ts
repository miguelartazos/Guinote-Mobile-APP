import { isValidPlay } from './gameLogic';
import type {
  Card,
  CardId,
  PlayerId,
  GameState,
  TrickCard,
  TeamId,
  Team,
} from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';

function createCard(value: CardValue, suit: SpanishSuit): Card {
  return {
    id: `${suit}_${value}` as CardId,
    value,
    suit,
  };
}

function createTrickCard(playerId: PlayerId, card: Card): TrickCard {
  return { playerId, card };
}

function createMockGameState(currentTrick: TrickCard[]): GameState {
  const teams: Team[] = [
    {
      id: 'team1' as TeamId,
      playerIds: ['p0' as PlayerId, 'p2' as PlayerId],
      score: 50,
      cardPoints: 30,
      cantes: [],
    },
    {
      id: 'team2' as TeamId,
      playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
      score: 45,
      cardPoints: 25,
      cantes: [],
    },
  ];

  return {
    teams,
    currentTrick,
    trumpSuit: 'oros' as SpanishSuit,
    phase: 'arrastre',
    players: [
      { id: 'p0' as PlayerId, name: 'Player 1' },
      { id: 'p1' as PlayerId, name: 'Player 2' },
      { id: 'p2' as PlayerId, name: 'Player 3' },
      { id: 'p3' as PlayerId, name: 'Player 4' },
    ],
  } as GameState;
}

describe('Montarse Rule in Arrastre', () => {
  describe('When partner is winning and following suit', () => {
    test('CAN beat partner (montarse is allowed)', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(7, 'espadas')),
        createTrickCard('p1' as PlayerId, createCard(10, 'espadas')), // Partner winning with Sota
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(12, 'espadas'), // Rey - can beat partner's Sota
        createCard(3, 'espadas'), // Lower card
        createCard(2, 'bastos'),
      ];

      // p3 is playing, partner p1 is winning with Sota
      // Playing Rey (beats partner) should be ALLOWED (montarse is legal)
      const montarse = createCard(12, 'espadas');
      expect(
        isValidPlay(montarse, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);
    });

    test('CAN play lower card when partner is winning', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(7, 'espadas')),
        createTrickCard('p1' as PlayerId, createCard(10, 'espadas')), // Partner winning
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(12, 'espadas'), // Higher card
        createCard(3, 'espadas'), // Lower card
        createCard(2, 'bastos'),
      ];

      // p3 can play lower card when partner is winning
      const lowerCard = createCard(3, 'espadas');
      expect(
        isValidPlay(lowerCard, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);
    });

    test('MUST still follow suit even when partner is winning', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(7, 'espadas')),
        createTrickCard('p1' as PlayerId, createCard(12, 'espadas')), // Partner winning with Rey
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(3, 'espadas'), // Have suit
        createCard(1, 'oros'), // Trump
        createCard(2, 'bastos'),
      ];

      // p3 MUST play espadas even though partner is winning
      const wrongSuit = createCard(2, 'bastos');
      expect(
        isValidPlay(wrongSuit, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(false);

      const correctSuit = createCard(3, 'espadas');
      expect(
        isValidPlay(correctSuit, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);
    });
  });

  describe('When partner is NOT winning', () => {
    test('MUST beat if possible when following suit (non-4th player)', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(10, 'espadas')), // Opponent winning
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(12, 'espadas'), // Rey - can beat
        createCard(5, 'espadas'), // Can't beat
        createCard(2, 'bastos'),
      ];

      // p1 is 2nd player, partner p3 is not in trick yet
      // p1 MUST play Rey to beat since opponent is winning
      const mustBeat = createCard(12, 'espadas');
      expect(
        isValidPlay(mustBeat, hand, trick, 'oros', 'arrastre', 'p1' as PlayerId, gameState),
      ).toBe(true);

      // This should be invalid because p1 has a card that can beat
      const cantBeat = createCard(5, 'espadas');
      expect(
        isValidPlay(cantBeat, hand, trick, 'oros', 'arrastre', 'p1' as PlayerId, gameState),
      ).toBe(false);
    });

    test('MUST trump if no suit and partner not winning', () => {
      const trick: TrickCard[] = [
        createTrickCard('p1' as PlayerId, createCard(10, 'espadas')), // Opponent winning
        createTrickCard('p3' as PlayerId, createCard(7, 'espadas')), // Partner losing
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(1, 'oros'), // Trump
        createCard(2, 'bastos'),
        createCard(4, 'copas'),
      ];

      // p0 (team1) has no espadas, partner p2 not in trick yet, opponent p1 is winning - MUST trump
      const trump = createCard(1, 'oros');
      expect(isValidPlay(trump, hand, trick, 'oros', 'arrastre', 'p0' as PlayerId, gameState)).toBe(
        true,
      );

      const noTrump = createCard(2, 'bastos');
      expect(
        isValidPlay(noTrump, hand, trick, 'oros', 'arrastre', 'p0' as PlayerId, gameState),
      ).toBe(false);
    });
  });

  describe('Trump over partner scenarios', () => {
    test('CAN trump over partner when they are winning with suit card', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(7, 'espadas')),
        createTrickCard('p1' as PlayerId, createCard(12, 'espadas')), // Partner winning with Rey
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(1, 'oros'), // Trump As
        createCard(2, 'bastos'),
        createCard(4, 'copas'),
      ];

      // p3 has no espadas, partner is winning
      // Can choose to trump (montarse) or discard - both valid
      const trumpOver = createCard(1, 'oros');
      expect(
        isValidPlay(trumpOver, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);

      const discard = createCard(2, 'bastos');
      expect(
        isValidPlay(discard, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);
    });

    test('CAN beat partner trump with higher trump', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(7, 'espadas')),
        createTrickCard('p1' as PlayerId, createCard(7, 'oros')), // Partner winning with trump 7
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(1, 'oros'), // Higher trump
        createCard(2, 'oros'), // Lower trump
        createCard(4, 'copas'),
      ];

      // p3 has no espadas, partner winning with trump
      // Can beat with higher trump (montarse) or play lower trump
      const higherTrump = createCard(1, 'oros');
      expect(
        isValidPlay(higherTrump, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);

      const lowerTrump = createCard(2, 'oros');
      expect(
        isValidPlay(lowerTrump, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);
    });
  });

  describe('AI test scenario', () => {
    test('p3 can discard when partner p1 winning and p3 has no suit', () => {
      const trick: TrickCard[] = [
        createTrickCard('p1' as PlayerId, createCard(1, 'espadas')), // p1 (team2) winning with As - p3's partner!
        createTrickCard('p2' as PlayerId, createCard(3, 'espadas')), // p2 (team1) playing 3
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(2, 'bastos'), // Non-trump
        createCard(10, 'oros'), // Trump
      ];

      // p3 (team2) has no espadas, PARTNER p1 is winning - can play anything in arrastre
      const canTrump = createCard(10, 'oros');
      expect(
        isValidPlay(canTrump, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);

      // Can also discard when partner is winning
      const canDiscard = createCard(2, 'bastos');
      expect(
        isValidPlay(canDiscard, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);
    });

    test('p3 must trump when opponents winning and p3 has no suit', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(1, 'espadas')), // p0 (team1) winning with As - opponent!
        createTrickCard('p1' as PlayerId, createCard(3, 'espadas')), // p1 (team2) playing 3 - partner losing
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(2, 'bastos'), // Non-trump
        createCard(10, 'oros'), // Trump
      ];

      // p2 (team1) has no espadas, no one from team played yet, will test with p3 instead
      // p3 (team2) has no espadas, partner p1 losing, opponent p0 winning - MUST trump
      const mustTrump = createCard(10, 'oros');
      expect(
        isValidPlay(mustTrump, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);

      // Cannot discard when must trump
      const cantDiscard = createCard(2, 'bastos');
      expect(
        isValidPlay(cantDiscard, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('First player of trick can play any card from hand', () => {
      const gameState = createMockGameState([]);
      const hand: Card[] = [
        createCard(12, 'espadas'),
        createCard(1, 'oros'),
        createCard(2, 'bastos'),
      ];

      // First player can lead with any card
      expect(
        isValidPlay(
          createCard(12, 'espadas'),
          hand,
          [],
          'oros',
          'arrastre',
          'p0' as PlayerId,
          gameState,
        ),
      ).toBe(true);
      expect(
        isValidPlay(
          createCard(1, 'oros'),
          hand,
          [],
          'oros',
          'arrastre',
          'p0' as PlayerId,
          gameState,
        ),
      ).toBe(true);
      expect(
        isValidPlay(
          createCard(2, 'bastos'),
          hand,
          [],
          'oros',
          'arrastre',
          'p0' as PlayerId,
          gameState,
        ),
      ).toBe(true);
    });

    test('Playing phase (robada) allows any card', () => {
      const trick: TrickCard[] = [createTrickCard('p0' as PlayerId, createCard(7, 'espadas'))];

      const gameState = { ...createMockGameState(trick), phase: 'playing' as const };
      const hand: Card[] = [
        createCard(12, 'espadas'),
        createCard(1, 'oros'),
        createCard(2, 'bastos'),
      ];

      // In playing phase, any card is valid
      expect(
        isValidPlay(
          createCard(2, 'bastos'),
          hand,
          trick,
          'oros',
          'playing',
          'p1' as PlayerId,
          gameState,
        ),
      ).toBe(true);
    });
  });
});
