import type { Brand } from '../types/game.types';
import type { EloRating } from './eloCalculation';
import {
  getLeagueFromElo,
  getLeagueProgress,
  getNextLeague,
  getAllLeagues,
  type LeagueId,
  type League,
} from './leagueSystem';

describe('getLeagueFromElo', () => {
  test('returns Bronce league for low ELO', () => {
    const elo = 800 as EloRating;

    const league = getLeagueFromElo(elo);

    expect(league.name).toBe('Bronce');
    expect(league.id).toBe('bronce' as LeagueId);
    expect(league.icon).toBe('🥉');
  });

  test('returns Plata league for mid-low ELO', () => {
    const elo = 1300 as EloRating;

    const league = getLeagueFromElo(elo);

    expect(league.name).toBe('Plata');
    expect(league.id).toBe('plata' as LeagueId);
    expect(league.icon).toBe('🥈');
  });

  test('returns Oro league for mid-high ELO', () => {
    const elo = 1600 as EloRating;

    const league = getLeagueFromElo(elo);

    expect(league.name).toBe('Oro');
    expect(league.id).toBe('oro' as LeagueId);
    expect(league.icon).toBe('🥇');
  });

  test('returns Diamante league for high ELO', () => {
    const elo = 2100 as EloRating;

    const league = getLeagueFromElo(elo);

    expect(league.name).toBe('Diamante');
    expect(league.id).toBe('diamante' as LeagueId);
    expect(league.icon).toBe('💎');
  });

  test('returns correct league at boundary values', () => {
    expect(getLeagueFromElo(1199 as EloRating).name).toBe('Bronce');
    expect(getLeagueFromElo(1200 as EloRating).name).toBe('Plata');
    expect(getLeagueFromElo(1499 as EloRating).name).toBe('Plata');
    expect(getLeagueFromElo(1500 as EloRating).name).toBe('Oro');
    expect(getLeagueFromElo(1999 as EloRating).name).toBe('Oro');
    expect(getLeagueFromElo(2000 as EloRating).name).toBe('Diamante');
  });

  test('handles very low ELO', () => {
    const elo = 100 as EloRating;

    const league = getLeagueFromElo(elo);

    expect(league.name).toBe('Bronce');
  });

  test('handles very high ELO', () => {
    const elo = 3000 as EloRating;

    const league = getLeagueFromElo(elo);

    expect(league.name).toBe('Diamante');
  });
});

describe('getLeagueProgress', () => {
  test('returns 0% at league minimum', () => {
    const elo = 1200 as EloRating; // Plata minimum

    const progress = getLeagueProgress(elo);

    expect(progress.percentage).toBe(0);
    expect(progress.current).toBe(1200);
    expect(progress.nextThreshold).toBe(1500);
    expect(progress.pointsToNext).toBe(300);
  });

  test('returns 50% at league midpoint', () => {
    const elo = 1350 as EloRating; // Plata midpoint

    const progress = getLeagueProgress(elo);

    expect(progress.percentage).toBe(50);
    expect(progress.current).toBe(1350);
    expect(progress.nextThreshold).toBe(1500);
    expect(progress.pointsToNext).toBe(150);
  });

  test('returns near 100% just before promotion', () => {
    const elo = 1499 as EloRating; // Just before Oro

    const progress = getLeagueProgress(elo);

    expect(progress.percentage).toBeGreaterThan(99);
    expect(progress.percentage).toBeLessThan(100);
    expect(progress.pointsToNext).toBe(1);
  });

  test('returns 100% for top league', () => {
    const elo = 2500 as EloRating; // Diamante

    const progress = getLeagueProgress(elo);

    expect(progress.percentage).toBe(100);
    expect(progress.nextThreshold).toBeNull();
    expect(progress.pointsToNext).toBe(0);
  });

  test('handles Bronce league progress', () => {
    const elo = 1000 as EloRating;

    const progress = getLeagueProgress(elo);

    // 1000 is 83.33% of the way from 0 to 1200
    expect(progress.percentage).toBeCloseTo(83.33, 1);
    expect(progress.nextThreshold).toBe(1200);
    expect(progress.pointsToNext).toBe(200);
  });
});

describe('getNextLeague', () => {
  test('returns next league for Bronce', () => {
    const currentLeague = getLeagueFromElo(1000 as EloRating);

    const nextLeague = getNextLeague(currentLeague);

    expect(nextLeague?.name).toBe('Plata');
    expect(nextLeague?.minElo).toBe(1200);
  });

  test('returns next league for Plata', () => {
    const currentLeague = getLeagueFromElo(1300 as EloRating);

    const nextLeague = getNextLeague(currentLeague);

    expect(nextLeague?.name).toBe('Oro');
    expect(nextLeague?.minElo).toBe(1500);
  });

  test('returns next league for Oro', () => {
    const currentLeague = getLeagueFromElo(1700 as EloRating);

    const nextLeague = getNextLeague(currentLeague);

    expect(nextLeague?.name).toBe('Diamante');
    expect(nextLeague?.minElo).toBe(2000);
  });

  test('returns null for top league', () => {
    const currentLeague = getLeagueFromElo(2500 as EloRating);

    const nextLeague = getNextLeague(currentLeague);

    expect(nextLeague).toBeNull();
  });
});

describe('getAllLeagues', () => {
  test('returns all four leagues in order', () => {
    const leagues = getAllLeagues();

    expect(leagues).toHaveLength(4);
    expect(leagues[0].name).toBe('Bronce');
    expect(leagues[1].name).toBe('Plata');
    expect(leagues[2].name).toBe('Oro');
    expect(leagues[3].name).toBe('Diamante');
  });

  test('leagues have correct ELO ranges', () => {
    const leagues = getAllLeagues();

    expect(leagues[0].minElo).toBe(0);
    expect(leagues[0].maxElo).toBe(1199);
    expect(leagues[1].minElo).toBe(1200);
    expect(leagues[1].maxElo).toBe(1499);
    expect(leagues[2].minElo).toBe(1500);
    expect(leagues[2].maxElo).toBe(1999);
    expect(leagues[3].minElo).toBe(2000);
    expect(leagues[3].maxElo).toBe(Infinity);
  });

  test('leagues have unique IDs', () => {
    const leagues = getAllLeagues();
    const ids = leagues.map(l => l.id);

    expect(new Set(ids).size).toBe(leagues.length);
  });

  test('leagues have colors', () => {
    const leagues = getAllLeagues();

    leagues.forEach(league => {
      expect(league.color).toBeTruthy();
      expect(league.color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});
