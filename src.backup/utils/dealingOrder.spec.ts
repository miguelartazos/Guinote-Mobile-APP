import {
  getCounterClockwiseOrder,
  getPostTrickDealingOrder,
  getInitialDealingRounds,
  getInitialDealAnimationSequence,
} from './dealingOrder';
import type { PlayerId, Card } from '../types/game.types';

describe('dealingOrder', () => {
  describe('getCounterClockwiseOrder', () => {
    test('returns correct order starting from dealer at position 0 (Bottom)', () => {
      const order = getCounterClockwiseOrder(0);
      expect(order).toEqual([1, 2, 3, 0]); // right, top, left, bottom
    });

    test('returns correct order starting from dealer at position 1 (Right)', () => {
      const order = getCounterClockwiseOrder(1);
      expect(order).toEqual([2, 3, 0, 1]); // top, left, bottom, right
    });

    test('returns correct order starting from dealer at position 2 (Top)', () => {
      const order = getCounterClockwiseOrder(2);
      expect(order).toEqual([3, 0, 1, 2]); // left, bottom, right, top
    });

    test('returns correct order starting from dealer at position 3 (Left)', () => {
      const order = getCounterClockwiseOrder(3);
      expect(order).toEqual([0, 1, 2, 3]); // bottom, right, top, left
    });
  });

  describe('getPostTrickDealingOrder', () => {
    const players = [
      { id: 'player0' as PlayerId },
      { id: 'player1' as PlayerId },
      { id: 'player2' as PlayerId },
      { id: 'player3' as PlayerId },
    ];

    test('returns correct order starting from winner at position 0 (Bottom)', () => {
      const order = getPostTrickDealingOrder(0, players);
      expect(order).toEqual(['player0', 'player1', 'player2', 'player3']);
    });

    test('returns correct order starting from winner at position 1 (Right)', () => {
      const order = getPostTrickDealingOrder(1, players);
      expect(order).toEqual(['player1', 'player2', 'player3', 'player0']);
    });

    test('returns correct order starting from winner at position 2 (Top)', () => {
      const order = getPostTrickDealingOrder(2, players);
      expect(order).toEqual(['player2', 'player3', 'player0', 'player1']);
    });

    test('returns correct order starting from winner at position 3 (Left)', () => {
      const order = getPostTrickDealingOrder(3, players);
      expect(order).toEqual(['player3', 'player0', 'player1', 'player2']);
    });
  });

  describe('getInitialDealingRounds', () => {
    const players = [
      { id: 'player0' as PlayerId },
      { id: 'player1' as PlayerId },
      { id: 'player2' as PlayerId },
      { id: 'player3' as PlayerId },
    ];

    const deck = Array.from(
      { length: 40 },
      (_, i) =>
        ({
          id: `card${i}`,
          suit: 'oros',
          rank: 'as',
          value: 11,
        } as Card),
    );

    test('returns 8 rounds (2 rounds × 4 players)', () => {
      const rounds = getInitialDealingRounds(0, players, deck);
      expect(rounds).toHaveLength(8);
    });

    test('each round has correct player and 3 cards', () => {
      const rounds = getInitialDealingRounds(0, players, deck);

      // First round of 3 cards each (counter-clockwise from bottom: right, top, left, bottom)
      expect(rounds[0]).toEqual({
        playerId: 'player1',
        cards: [deck[0], deck[1], deck[2]],
        cardIndices: [0, 1, 2],
      });
      expect(rounds[1]).toEqual({
        playerId: 'player2',
        cards: [deck[3], deck[4], deck[5]],
        cardIndices: [0, 1, 2],
      });
      expect(rounds[2]).toEqual({
        playerId: 'player3',
        cards: [deck[6], deck[7], deck[8]],
        cardIndices: [0, 1, 2],
      });
      expect(rounds[3]).toEqual({
        playerId: 'player0',
        cards: [deck[9], deck[10], deck[11]],
        cardIndices: [0, 1, 2],
      });

      // Second round of 3 cards each
      expect(rounds[4]).toEqual({
        playerId: 'player1',
        cards: [deck[12], deck[13], deck[14]],
        cardIndices: [3, 4, 5],
      });
    });

    test('uses correct counter-clockwise order from dealer', () => {
      const rounds = getInitialDealingRounds(1, players, deck);

      // Should deal to players in order: 2, 3, 0, 1 (from right position)
      expect(rounds[0].playerId).toBe('player2');
      expect(rounds[1].playerId).toBe('player3');
      expect(rounds[2].playerId).toBe('player0');
      expect(rounds[3].playerId).toBe('player1');

      // Same order for second round
      expect(rounds[4].playerId).toBe('player2');
      expect(rounds[5].playerId).toBe('player3');
      expect(rounds[6].playerId).toBe('player0');
      expect(rounds[7].playerId).toBe('player1');
    });

    test('handles deck with fewer cards', () => {
      const smallDeck = Array.from(
        { length: 10 },
        (_, i) =>
          ({
            id: `card${i}`,
            suit: 'oros',
            rank: 'as',
            value: 11,
          } as Card),
      );
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

  describe('getInitialDealAnimationSequence', () => {
    const players = [
      { id: 'player0' as PlayerId },
      { id: 'player1' as PlayerId },
      { id: 'player2' as PlayerId },
      { id: 'player3' as PlayerId },
    ];

    const deck = Array.from(
      { length: 24 },
      (_, i) =>
        ({
          id: `card${i}`,
          suit: 'oros',
          rank: 'as',
          value: 11,
        } as Card),
    );

    test('returns 24 animation steps for initial deal', () => {
      const animations = getInitialDealAnimationSequence(0, players, deck);
      expect(animations).toHaveLength(24); // 6 cards × 4 players
    });

    test('animations have correct timing with 100ms per card', () => {
      const animations = getInitialDealAnimationSequence(0, players, deck);

      // First card should start immediately
      expect(animations[0].delay).toBe(0);

      // Second card should start after 100ms
      expect(animations[1].delay).toBe(100);

      // Third card should start after 200ms
      expect(animations[2].delay).toBe(200);

      // Last card (24th) should start after 2300ms (23 * 100ms)
      expect(animations[23].delay).toBe(2300);
    });

    test('each player receives cards at correct hand positions', () => {
      const animations = getInitialDealAnimationSequence(0, players, deck);

      // Player 1 (Right) gets first 3 cards at positions 0-2
      expect(animations[0]).toMatchObject({
        playerIndex: 1,
        cardIndex: 0,
        card: deck[0],
      });
      expect(animations[1]).toMatchObject({
        playerIndex: 1,
        cardIndex: 1,
        card: deck[1],
      });
      expect(animations[2]).toMatchObject({
        playerIndex: 1,
        cardIndex: 2,
        card: deck[2],
      });

      // Player 1 gets next 3 cards at positions 3-5 in second round
      const player1SecondRound = animations.filter(
        a => a.playerIndex === 1 && a.cardIndex >= 3,
      );
      expect(player1SecondRound[0]).toMatchObject({
        playerIndex: 1,
        cardIndex: 3,
      });
      expect(player1SecondRound[1]).toMatchObject({
        playerIndex: 1,
        cardIndex: 4,
      });
      expect(player1SecondRound[2]).toMatchObject({
        playerIndex: 1,
        cardIndex: 5,
      });
    });

    test('follows counter-clockwise dealing order', () => {
      const animations = getInitialDealAnimationSequence(0, players, deck);

      // First round: each player gets 3 cards in order 1,2,3,0
      expect(animations[0].playerIndex).toBe(1); // Right
      expect(animations[1].playerIndex).toBe(1);
      expect(animations[2].playerIndex).toBe(1);

      expect(animations[3].playerIndex).toBe(2); // Top
      expect(animations[4].playerIndex).toBe(2);
      expect(animations[5].playerIndex).toBe(2);

      expect(animations[6].playerIndex).toBe(3); // Left
      expect(animations[7].playerIndex).toBe(3);
      expect(animations[8].playerIndex).toBe(3);

      expect(animations[9].playerIndex).toBe(0); // Bottom
      expect(animations[10].playerIndex).toBe(0);
      expect(animations[11].playerIndex).toBe(0);
    });
  });
});
