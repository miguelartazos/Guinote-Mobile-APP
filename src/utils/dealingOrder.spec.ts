import {
  getCounterClockwiseOrder,
  getPostTrickDealingOrder,
  getInitialDealingRounds,
} from './dealingOrder';
import type { PlayerId } from '../types/game.types';

describe('dealingOrder', () => {
  describe('getCounterClockwiseOrder', () => {
    test('returns correct order starting from dealer at position 0', () => {
      const order = getCounterClockwiseOrder(0);
      expect(order).toEqual([3, 2, 1, 0]); // left, top-right, top-left, bottom
    });

    test('returns correct order starting from dealer at position 1', () => {
      const order = getCounterClockwiseOrder(1);
      expect(order).toEqual([0, 3, 2, 1]); // bottom, left, top-right, top-left
    });

    test('returns correct order starting from dealer at position 2', () => {
      const order = getCounterClockwiseOrder(2);
      expect(order).toEqual([1, 0, 3, 2]); // top-left, bottom, left, top-right
    });

    test('returns correct order starting from dealer at position 3', () => {
      const order = getCounterClockwiseOrder(3);
      expect(order).toEqual([2, 1, 0, 3]); // top-right, top-left, bottom, left
    });
  });

  describe('getPostTrickDealingOrder', () => {
    const players = [
      { id: 'player0' as PlayerId },
      { id: 'player1' as PlayerId },
      { id: 'player2' as PlayerId },
      { id: 'player3' as PlayerId },
    ];

    test('returns correct order starting from winner at position 0', () => {
      const order = getPostTrickDealingOrder(0, players);
      expect(order).toEqual(['player0', 'player3', 'player2', 'player1']);
    });

    test('returns correct order starting from winner at position 1', () => {
      const order = getPostTrickDealingOrder(1, players);
      expect(order).toEqual(['player1', 'player0', 'player3', 'player2']);
    });

    test('returns correct order starting from winner at position 2', () => {
      const order = getPostTrickDealingOrder(2, players);
      expect(order).toEqual(['player2', 'player1', 'player0', 'player3']);
    });

    test('returns correct order starting from winner at position 3', () => {
      const order = getPostTrickDealingOrder(3, players);
      expect(order).toEqual(['player3', 'player2', 'player1', 'player0']);
    });
  });

  describe('getInitialDealingRounds', () => {
    const players = [
      { id: 'player0' as PlayerId },
      { id: 'player1' as PlayerId },
      { id: 'player2' as PlayerId },
      { id: 'player3' as PlayerId },
    ];

    const deck = Array.from({ length: 40 }, (_, i) => ({ id: `card${i}` }));

    test('returns 8 rounds (2 rounds × 4 players)', () => {
      const rounds = getInitialDealingRounds(0, players, deck);
      expect(rounds).toHaveLength(8);
    });

    test('each round has correct player and 3 cards', () => {
      const rounds = getInitialDealingRounds(0, players, deck);

      // First round of 3 cards each
      expect(rounds[0]).toEqual({
        playerId: 'player3',
        cards: [deck[0], deck[1], deck[2]],
      });
      expect(rounds[1]).toEqual({
        playerId: 'player2',
        cards: [deck[3], deck[4], deck[5]],
      });
      expect(rounds[2]).toEqual({
        playerId: 'player1',
        cards: [deck[6], deck[7], deck[8]],
      });
      expect(rounds[3]).toEqual({
        playerId: 'player0',
        cards: [deck[9], deck[10], deck[11]],
      });

      // Second round of 3 cards each
      expect(rounds[4]).toEqual({
        playerId: 'player3',
        cards: [deck[12], deck[13], deck[14]],
      });
    });

    test('uses correct counter-clockwise order from dealer', () => {
      const rounds = getInitialDealingRounds(1, players, deck);

      // Should deal to players in order: 0, 3, 2, 1
      expect(rounds[0].playerId).toBe('player0');
      expect(rounds[1].playerId).toBe('player3');
      expect(rounds[2].playerId).toBe('player2');
      expect(rounds[3].playerId).toBe('player1');

      // Same order for second round
      expect(rounds[4].playerId).toBe('player0');
      expect(rounds[5].playerId).toBe('player3');
      expect(rounds[6].playerId).toBe('player2');
      expect(rounds[7].playerId).toBe('player1');
    });

    test('handles deck with fewer cards', () => {
      const smallDeck = Array.from({ length: 10 }, (_, i) => ({
        id: `card${i}`,
      }));
      const rounds = getInitialDealingRounds(0, players, smallDeck);

      // Should still have 8 rounds but some may have fewer cards
      expect(rounds).toHaveLength(8);

      // First 3 players get 3 cards each
      expect(rounds[0].cards).toHaveLength(3);
      expect(rounds[1].cards).toHaveLength(3);
      expect(rounds[2].cards).toHaveLength(3);

      // Fourth player gets only 1 card (10 total cards)
      expect(rounds[3].cards).toHaveLength(1);

      // Remaining rounds have no cards
      expect(rounds[4].cards).toHaveLength(0);
    });
  });
});
