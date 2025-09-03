import type { Brand } from '../types/game.types';
import type { EloRating } from './eloCalculation';
import { colors } from '../constants/colors';

export type LeagueId = Brand<string, 'LeagueId'>;

export interface League {
  id: LeagueId;
  name: string;
  minElo: number;
  maxElo: number;
  color: string;
  icon: string;
}

export interface LeagueProgress {
  percentage: number;
  current: number;
  nextThreshold: number | null;
  pointsToNext: number;
}

const LEAGUES: League[] = [
  {
    id: 'bronce' as LeagueId,
    name: 'Bronce',
    minElo: 0,
    maxElo: 1199,
    color: '#CD7F32',
    icon: '🥉',
  },
  {
    id: 'plata' as LeagueId,
    name: 'Plata',
    minElo: 1200,
    maxElo: 1499,
    color: '#C0C0C0',
    icon: '🥈',
  },
  {
    id: 'oro' as LeagueId,
    name: 'Oro',
    minElo: 1500,
    maxElo: 1999,
    color: '#FFD700',
    icon: '🥇',
  },
  {
    id: 'diamante' as LeagueId,
    name: 'Diamante',
    minElo: 2000,
    maxElo: Infinity,
    color: '#B9F2FF',
    icon: '💎',
  },
];

/**
 * Get league information from ELO rating
 */
export function getLeagueFromElo(elo: EloRating): League {
  const league = LEAGUES.find(l => elo >= l.minElo && elo <= l.maxElo);

  // Should never happen, but default to Bronce for safety
  return league || LEAGUES[0];
}

/**
 * Calculate progress within current league
 */
export function getLeagueProgress(elo: EloRating): LeagueProgress {
  const league = getLeagueFromElo(elo);
  const nextLeague = getNextLeague(league);

  if (!nextLeague) {
    // Top league - always 100%
    return {
      percentage: 100,
      current: elo,
      nextThreshold: null,
      pointsToNext: 0,
    };
  }

  const rangeStart = league.minElo;
  const rangeEnd = nextLeague.minElo;
  const range = rangeEnd - rangeStart;
  const progress = elo - rangeStart;
  const percentage = Math.min(99.99, (progress / range) * 100);

  return {
    percentage: Math.max(0, percentage),
    current: elo,
    nextThreshold: rangeEnd,
    pointsToNext: Math.max(0, rangeEnd - elo),
  };
}

/**
 * Get the next league from current league
 */
export function getNextLeague(currentLeague: League): League | null {
  const currentIndex = LEAGUES.findIndex(l => l.id === currentLeague.id);

  if (currentIndex === -1 || currentIndex === LEAGUES.length - 1) {
    return null;
  }

  return LEAGUES[currentIndex + 1];
}

/**
 * Get all leagues for display purposes
 */
export function getAllLeagues(): League[] {
  return [...LEAGUES];
}
