import { calculateHandPoints, getLastTrickBonus } from './scoringHelpers';
import type { TrickCard, Card, PlayerId, CardId, TeamId } from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';

describe('scoringHelpers', () => {
  describe('calculateHandPoints', () => {
    test('returns 0 for empty tricks', () => {
      expect(calculateHandPoints([])).toBe(0);
    });

    test('calculates points for single trick', () => {
      const tricks: TrickCard[][] = [
        [
          {
            playerId: 'p1' as PlayerId,
            card: {
              id: 'oros_1' as CardId,
              suit: 'oros' as SpanishSuit,
              value: 1 as CardValue, // As = 11 points
            },
          },
          {
            playerId: 'p2' as PlayerId,
            card: {
              id: 'oros_3' as CardId,
              suit: 'oros' as SpanishSuit,
              value: 3 as CardValue, // Tres = 10 points
            },
          },
        ],
      ];

      expect(calculateHandPoints(tricks)).toBe(21);
    });

    test('calculates points for multiple tricks', () => {
      const tricks: TrickCard[][] = [
        // First trick: 11 + 10 = 21
        [
          {
            playerId: 'p1' as PlayerId,
            card: { id: 'oros_1' as CardId, suit: 'oros' as SpanishSuit, value: 1 as CardValue },
          },
          {
            playerId: 'p2' as PlayerId,
            card: { id: 'oros_3' as CardId, suit: 'oros' as SpanishSuit, value: 3 as CardValue },
          },
        ],
        // Second trick: 4 + 3 = 7
        [
          {
            playerId: 'p1' as PlayerId,
            card: {
              id: 'bastos_12' as CardId,
              suit: 'bastos' as SpanishSuit,
              value: 12 as CardValue,
            },
          },
          {
            playerId: 'p2' as PlayerId,
            card: {
              id: 'bastos_10' as CardId,
              suit: 'bastos' as SpanishSuit,
              value: 10 as CardValue,
            },
          },
        ],
      ];

      expect(calculateHandPoints(tricks)).toBe(28);
    });

    test('handles cards with 0 points', () => {
      const tricks: TrickCard[][] = [
        [
          {
            playerId: 'p1' as PlayerId,
            card: { id: 'oros_7' as CardId, suit: 'oros' as SpanishSuit, value: 7 as CardValue },
          },
          {
            playerId: 'p2' as PlayerId,
            card: { id: 'oros_6' as CardId, suit: 'oros' as SpanishSuit, value: 6 as CardValue },
          },
          {
            playerId: 'p3' as PlayerId,
            card: { id: 'oros_5' as CardId, suit: 'oros' as SpanishSuit, value: 5 as CardValue },
          },
          {
            playerId: 'p4' as PlayerId,
            card: { id: 'oros_4' as CardId, suit: 'oros' as SpanishSuit, value: 4 as CardValue },
          },
        ],
      ];

      expect(calculateHandPoints(tricks)).toBe(0);
    });

    test('calculates full hand with all valuable cards', () => {
      const tricks: TrickCard[][] = [
        // All ases: 11 * 4 = 44
        [
          {
            playerId: 'p1' as PlayerId,
            card: { id: 'oros_1' as CardId, suit: 'oros' as SpanishSuit, value: 1 as CardValue },
          },
          {
            playerId: 'p2' as PlayerId,
            card: {
              id: 'bastos_1' as CardId,
              suit: 'bastos' as SpanishSuit,
              value: 1 as CardValue,
            },
          },
          {
            playerId: 'p3' as PlayerId,
            card: {
              id: 'espadas_1' as CardId,
              suit: 'espadas' as SpanishSuit,
              value: 1 as CardValue,
            },
          },
          {
            playerId: 'p4' as PlayerId,
            card: { id: 'copas_1' as CardId, suit: 'copas' as SpanishSuit, value: 1 as CardValue },
          },
        ],
        // All treses: 10 * 4 = 40
        [
          {
            playerId: 'p1' as PlayerId,
            card: { id: 'oros_3' as CardId, suit: 'oros' as SpanishSuit, value: 3 as CardValue },
          },
          {
            playerId: 'p2' as PlayerId,
            card: {
              id: 'bastos_3' as CardId,
              suit: 'bastos' as SpanishSuit,
              value: 3 as CardValue,
            },
          },
          {
            playerId: 'p3' as PlayerId,
            card: {
              id: 'espadas_3' as CardId,
              suit: 'espadas' as SpanishSuit,
              value: 3 as CardValue,
            },
          },
          {
            playerId: 'p4' as PlayerId,
            card: { id: 'copas_3' as CardId, suit: 'copas' as SpanishSuit, value: 3 as CardValue },
          },
        ],
      ];

      expect(calculateHandPoints(tricks)).toBe(84);
    });
  });

  describe('getLastTrickBonus', () => {
    test('returns 10 when team won last trick', () => {
      const lastTrickWinnerTeam = 'team1' as TeamId;
      const teamId = 'team1' as TeamId;

      expect(getLastTrickBonus(lastTrickWinnerTeam, teamId)).toBe(10);
    });

    test('returns 0 when team did not win last trick', () => {
      const lastTrickWinnerTeam = 'team1' as TeamId;
      const teamId = 'team2' as TeamId;

      expect(getLastTrickBonus(lastTrickWinnerTeam, teamId)).toBe(0);
    });

    test('returns 0 when no last trick winner', () => {
      expect(getLastTrickBonus(undefined, 'team1' as TeamId)).toBe(0);
    });
  });
});
