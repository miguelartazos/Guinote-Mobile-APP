import type { Brand } from '../types/game.types';
import {
  calculateEloChange,
  calculateTeamElo,
  getExpectedScore,
  type EloRating,
} from './eloCalculation';

describe('calculateEloChange', () => {
  test('returns equal changes for players with same ELO', () => {
    const winnerElo = 1500 as EloRating;
    const loserElo = 1500 as EloRating;

    const result = calculateEloChange(winnerElo, loserElo);

    expect(result.winnerChange).toBe(16);
    expect(result.loserChange).toBe(-16);
  });

  test('returns smaller gain for higher-rated winner', () => {
    const winnerElo = 2000 as EloRating;
    const loserElo = 1500 as EloRating;

    const result = calculateEloChange(winnerElo, loserElo);

    expect(result.winnerChange).toBeLessThan(16);
    expect(result.winnerChange).toBeGreaterThan(0);
    expect(result.loserChange).toBeGreaterThan(-16);
    expect(result.loserChange).toBeLessThan(0);
  });

  test('returns larger gain for lower-rated winner', () => {
    const winnerElo = 1500 as EloRating;
    const loserElo = 2000 as EloRating;

    const result = calculateEloChange(winnerElo, loserElo);

    expect(result.winnerChange).toBeGreaterThan(16);
    expect(result.loserChange).toBeLessThan(-16);
  });

  test('respects custom K-factor', () => {
    const winnerElo = 1500 as EloRating;
    const loserElo = 1500 as EloRating;
    const kFactor = 64;

    const result = calculateEloChange(winnerElo, loserElo, kFactor);

    expect(result.winnerChange).toBe(32);
    expect(result.loserChange).toBe(-32);
  });

  test('maintains zero-sum property', () => {
    const winnerElo = 1750 as EloRating;
    const loserElo = 1650 as EloRating;

    const result = calculateEloChange(winnerElo, loserElo);

    expect(result.winnerChange + result.loserChange).toBe(0);
  });

  test('handles extreme ELO differences', () => {
    const winnerElo = 2500 as EloRating;
    const loserElo = 1000 as EloRating;

    const result = calculateEloChange(winnerElo, loserElo);

    // Very high rated player beating very low rated should gain almost nothing
    expect(result.winnerChange).toBeLessThanOrEqual(1);
    expect(result.winnerChange).toBeGreaterThanOrEqual(0);
    expect(result.loserChange).toBeGreaterThanOrEqual(-1);
    expect(result.loserChange).toBeLessThanOrEqual(0);
  });

  test('handles upset victories correctly', () => {
    const winnerElo = 1000 as EloRating;
    const loserElo = 2500 as EloRating;

    const result = calculateEloChange(winnerElo, loserElo);

    // Major upset should result in near-maximum K-factor gain
    expect(result.winnerChange).toBeGreaterThan(31);
    expect(result.winnerChange).toBeLessThanOrEqual(32);
    expect(result.loserChange).toBeLessThan(-31);
    expect(result.loserChange).toBeGreaterThanOrEqual(-32);
  });
});

describe('getExpectedScore', () => {
  test('returns 0.5 for equal ratings', () => {
    const playerElo = 1500 as EloRating;
    const opponentElo = 1500 as EloRating;

    const expected = getExpectedScore(playerElo, opponentElo);

    expect(expected).toBe(0.5);
  });

  test('returns higher probability for higher-rated player', () => {
    const playerElo = 1600 as EloRating;
    const opponentElo = 1400 as EloRating;

    const expected = getExpectedScore(playerElo, opponentElo);

    expect(expected).toBeGreaterThan(0.5);
    expect(expected).toBeLessThan(1);
  });

  test('returns lower probability for lower-rated player', () => {
    const playerElo = 1400 as EloRating;
    const opponentElo = 1600 as EloRating;

    const expected = getExpectedScore(playerElo, opponentElo);

    expect(expected).toBeLessThan(0.5);
    expect(expected).toBeGreaterThan(0);
  });

  test('returns complementary probabilities', () => {
    const player1Elo = 1700 as EloRating;
    const player2Elo = 1300 as EloRating;

    const p1Expected = getExpectedScore(player1Elo, player2Elo);
    const p2Expected = getExpectedScore(player2Elo, player1Elo);

    expect(p1Expected + p2Expected).toBeCloseTo(1, 10);
  });

  test('handles extreme rating differences', () => {
    const highElo = 2800 as EloRating;
    const lowElo = 800 as EloRating;

    const highExpected = getExpectedScore(highElo, lowElo);
    const lowExpected = getExpectedScore(lowElo, highElo);

    expect(highExpected).toBeGreaterThan(0.99);
    expect(lowExpected).toBeLessThan(0.01);
  });
});

describe('calculateTeamElo', () => {
  test('returns average ELO for team of players', () => {
    const playerElos = [1500 as EloRating, 1600 as EloRating];

    const teamElo = calculateTeamElo(playerElos);

    expect(teamElo).toBe(1550);
  });

  test('handles single player team', () => {
    const playerElos = [1800 as EloRating];

    const teamElo = calculateTeamElo(playerElos);

    expect(teamElo).toBe(1800);
  });

  test('handles team of three players', () => {
    const playerElos = [1200 as EloRating, 1500 as EloRating, 1800 as EloRating];

    const teamElo = calculateTeamElo(playerElos);

    expect(teamElo).toBe(1500);
  });

  test('rounds to nearest integer', () => {
    const playerElos = [1501 as EloRating, 1500 as EloRating];

    const teamElo = calculateTeamElo(playerElos);

    expect(teamElo).toBe(1501); // 1500.5 rounds to 1501
  });

  test('handles empty team array', () => {
    const playerElos: EloRating[] = [];

    const teamElo = calculateTeamElo(playerElos);

    expect(teamElo).toBe(1000); // Default ELO for empty team
  });

  test('handles team with very different ratings', () => {
    const playerElos = [2400 as EloRating, 1000 as EloRating];

    const teamElo = calculateTeamElo(playerElos);

    expect(teamElo).toBe(1700);
  });
});
