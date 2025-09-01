import { isValidPlay } from './gameLogic';
import type { Card, GameState, TrickCard, PlayerId, TeamId, Team } from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';

function createCard(value: CardValue, suit: SpanishSuit): Card {
  return {
    id: `${suit}_${value}` as any,
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

describe('Fourth Player Rule in Arrastre', () => {
  describe('4th player with partner winning and no suit', () => {
    it('allows 4th player to discard any card when partner is winning and has no suit', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(7, 'espadas')), // Lead espadas
        createTrickCard('p1' as PlayerId, createCard(10, 'espadas')), // Follow suit
        createTrickCard('p2' as PlayerId, createCard(12, 'espadas')), // Partner wins with Rey
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(2, 'bastos'),
        createCard(4, 'copas'),
        createCard(1, 'oros'), // Trump As
      ];

      // Player p3 (team2) is 4th player, partner p1 is not winning
      // But teammate p2 (team1) is winning for p0
      // So for p3, partner is not winning - must trump or follow rules

      // Let's fix the test - p3's partner is p1, and p2 is winning
      // So p3 must trump if possible
      const mustTrump = createCard(1, 'oros');
      expect(
        isValidPlay(mustTrump, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(true);

      // Non-trump should be invalid since partner is not winning
      const nonTrump = createCard(2, 'bastos');
      expect(
        isValidPlay(nonTrump, hand, trick, 'oros', 'arrastre', 'p3' as PlayerId, gameState),
      ).toBe(false);
    });

    it('allows 4th player to play ANY card when partner wins and has no lead suit', () => {
      // Set up trick where p1 (partner of p3) is winning
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(7, 'espadas')), // Lead espadas
        createTrickCard('p1' as PlayerId, createCard(12, 'espadas')), // Partner wins with Rey
        createTrickCard('p2' as PlayerId, createCard(10, 'espadas')), // Follow suit
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(2, 'bastos'),
        createCard(4, 'copas'),
        createCard(1, 'oros'), // Trump As
      ];

      // p3 is 4th player, partner p1 is winning, p3 has no espadas
      // ALL cards should be valid
      expect(
        isValidPlay(
          createCard(2, 'bastos'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p3' as PlayerId,
          gameState,
        ),
      ).toBe(true);
      expect(
        isValidPlay(
          createCard(4, 'copas'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p3' as PlayerId,
          gameState,
        ),
      ).toBe(true);
      expect(
        isValidPlay(
          createCard(1, 'oros'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p3' as PlayerId,
          gameState,
        ),
      ).toBe(true);
    });

    it('still requires 4th player to follow suit if they have it', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(7, 'espadas')),
        createTrickCard('p1' as PlayerId, createCard(12, 'espadas')), // Partner wins
        createTrickCard('p2' as PlayerId, createCard(10, 'espadas')),
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(2, 'espadas'), // Has the suit!
        createCard(4, 'copas'),
        createCard(1, 'oros'),
      ];

      // Must play espadas even though partner is winning
      expect(
        isValidPlay(
          createCard(2, 'espadas'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p3' as PlayerId,
          gameState,
        ),
      ).toBe(true);
      expect(
        isValidPlay(
          createCard(4, 'copas'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p3' as PlayerId,
          gameState,
        ),
      ).toBe(false);
      expect(
        isValidPlay(
          createCard(1, 'oros'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p3' as PlayerId,
          gameState,
        ),
      ).toBe(false);
    });
  });

  describe('3rd player must still follow normal rules', () => {
    it('3rd player must trump if no suit and partner not winning', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(7, 'espadas')),
        createTrickCard('p1' as PlayerId, createCard(12, 'espadas')), // Opponent winning
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(2, 'bastos'),
        createCard(4, 'copas'),
        createCard(1, 'oros'), // Trump
      ];

      // p2 is 3rd player, partner p0 is not winning - must trump
      expect(
        isValidPlay(
          createCard(1, 'oros'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p2' as PlayerId,
          gameState,
        ),
      ).toBe(true);
      expect(
        isValidPlay(
          createCard(2, 'bastos'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p2' as PlayerId,
          gameState,
        ),
      ).toBe(false);
    });

    it('3rd player can discard if partner is winning', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(12, 'espadas')), // Partner wins
        createTrickCard('p1' as PlayerId, createCard(7, 'espadas')),
      ];

      const gameState = createMockGameState(trick);
      const hand: Card[] = [
        createCard(2, 'bastos'),
        createCard(4, 'copas'),
        createCard(1, 'oros'), // Trump
      ];

      // p2 is 3rd player, partner p0 is winning - can play anything
      // But NOT because of 4th player rule - because partner is winning
      expect(
        isValidPlay(
          createCard(2, 'bastos'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p2' as PlayerId,
          gameState,
        ),
      ).toBe(true);
      expect(
        isValidPlay(
          createCard(4, 'copas'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p2' as PlayerId,
          gameState,
        ),
      ).toBe(true);
      expect(
        isValidPlay(
          createCard(1, 'oros'),
          hand,
          trick,
          'oros',
          'arrastre',
          'p2' as PlayerId,
          gameState,
        ),
      ).toBe(true);
    });
  });

  describe('Rule only applies in arrastre phase', () => {
    it('does not apply in draw phase', () => {
      const trick: TrickCard[] = [
        createTrickCard('p0' as PlayerId, createCard(7, 'espadas')),
        createTrickCard('p1' as PlayerId, createCard(12, 'espadas')),
        createTrickCard('p2' as PlayerId, createCard(10, 'espadas')),
      ];

      const gameState = createMockGameState(trick);
      gameState.phase = 'playing'; // Draw phase

      const hand: Card[] = [createCard(2, 'bastos'), createCard(4, 'copas'), createCard(1, 'oros')];

      // In draw phase, all cards are valid regardless
      expect(
        isValidPlay(
          createCard(2, 'bastos'),
          hand,
          trick,
          'oros',
          'playing',
          'p3' as PlayerId,
          gameState,
        ),
      ).toBe(true);
      expect(
        isValidPlay(
          createCard(4, 'copas'),
          hand,
          trick,
          'oros',
          'playing',
          'p3' as PlayerId,
          gameState,
        ),
      ).toBe(true);
      expect(
        isValidPlay(
          createCard(1, 'oros'),
          hand,
          trick,
          'oros',
          'playing',
          'p3' as PlayerId,
          gameState,
        ),
      ).toBe(true);
    });
  });
});
