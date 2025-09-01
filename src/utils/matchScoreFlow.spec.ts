import { describe, test, expect } from '@jest/globals';
import {
  updateMatchScoreForPartida,
  createInitialMatchScore,
  isMatchComplete,
  getMatchWinner,
  checkCotoWon,
  checkMatchWon,
} from './gameLogic';
import type { MatchScore } from '../types/game.types';

describe('Match Score Flow - Complete Game Progression', () => {
  test('correctly tracks score through complete match (2 cotos, 3 partidas each)', () => {
    let matchScore = createInitialMatchScore();

    // Initial state
    expect(matchScore.team1Partidas).toBe(0);
    expect(matchScore.team2Partidas).toBe(0);
    expect(matchScore.team1Cotos).toBe(0);
    expect(matchScore.team2Cotos).toBe(0);
    expect(matchScore.currentSet).toBe('buenas');
    expect(isMatchComplete(matchScore)).toBe(false);

    // First Coto
    console.log('\n=== FIRST COTO ===');

    // Partida 1-1: Team 1 wins
    console.log('Partida 1-1: Team 1 wins');
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    expect(matchScore.team1Partidas).toBe(1);
    expect(matchScore.team2Partidas).toBe(0);
    expect(matchScore.currentSet).toBe('malas');
    expect(checkCotoWon(matchScore.team1Partidas, matchScore.partidasPerCoto)).toBe(false);

    // Partida 1-2: Team 2 wins
    console.log('Partida 1-2: Team 2 wins');
    matchScore = updateMatchScoreForPartida(matchScore, 1);
    expect(matchScore.team1Partidas).toBe(1);
    expect(matchScore.team2Partidas).toBe(1);
    expect(matchScore.currentSet).toBe('bella');

    // Partida 1-3: Team 1 wins
    console.log('Partida 1-3: Team 1 wins');
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    expect(matchScore.team1Partidas).toBe(2);
    expect(matchScore.team2Partidas).toBe(1);
    expect(matchScore.currentSet).toBe('malas');

    // Partida 1-4: Team 1 wins - WINS COTO
    console.log('Partida 1-4: Team 1 wins - WINS FIRST COTO');
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    expect(matchScore.team1Partidas).toBe(0); // Reset for new coto
    expect(matchScore.team2Partidas).toBe(0); // Reset for new coto
    expect(matchScore.team1Cotos).toBe(1); // Team 1 wins first coto
    expect(matchScore.team2Cotos).toBe(0);
    expect(matchScore.currentSet).toBe('buenas');
    expect(isMatchComplete(matchScore)).toBe(false);

    // Second Coto
    console.log('\n=== SECOND COTO ===');

    // Partida 2-1: Team 2 wins
    console.log('Partida 2-1: Team 2 wins');
    matchScore = updateMatchScoreForPartida(matchScore, 1);
    expect(matchScore.team1Partidas).toBe(0);
    expect(matchScore.team2Partidas).toBe(1);
    expect(matchScore.team1Cotos).toBe(1);
    expect(matchScore.team2Cotos).toBe(0);
    expect(matchScore.currentSet).toBe('malas');

    // Partida 2-2: Team 2 wins
    console.log('Partida 2-2: Team 2 wins');
    matchScore = updateMatchScoreForPartida(matchScore, 1);
    expect(matchScore.team1Partidas).toBe(0);
    expect(matchScore.team2Partidas).toBe(2);

    // Partida 2-3: Team 2 wins - WINS COTO
    console.log('Partida 2-3: Team 2 wins - WINS SECOND COTO');
    matchScore = updateMatchScoreForPartida(matchScore, 1);
    expect(matchScore.team1Partidas).toBe(0);
    expect(matchScore.team2Partidas).toBe(0);
    expect(matchScore.team1Cotos).toBe(1);
    expect(matchScore.team2Cotos).toBe(1); // Team 2 wins second coto
    expect(matchScore.currentSet).toBe('buenas');
    expect(isMatchComplete(matchScore)).toBe(false); // Match continues, tied 1-1

    // Third Coto (decisive)
    console.log('\n=== THIRD COTO (DECISIVE) ===');

    // Partida 3-1: Team 1 wins
    console.log('Partida 3-1: Team 1 wins');
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    expect(matchScore.team1Partidas).toBe(1);
    expect(matchScore.team2Partidas).toBe(0);

    // Partida 3-2: Team 1 wins
    console.log('Partida 3-2: Team 1 wins');
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    expect(matchScore.team1Partidas).toBe(2);
    expect(matchScore.team2Partidas).toBe(0);

    // Partida 3-3: Team 1 wins - WINS MATCH
    console.log('Partida 3-3: Team 1 wins - WINS THE MATCH!');
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    expect(matchScore.team1Partidas).toBe(0);
    expect(matchScore.team2Partidas).toBe(0);
    expect(matchScore.team1Cotos).toBe(2); // Team 1 wins the match with 2 cotos
    expect(matchScore.team2Cotos).toBe(1);
    expect(isMatchComplete(matchScore)).toBe(true);
    expect(getMatchWinner(matchScore)).toBe(0); // Team 1 wins

    console.log('\n=== FINAL MATCH SCORE ===');
    console.log(`Team 1: ${matchScore.team1Cotos} cotos`);
    console.log(`Team 2: ${matchScore.team2Cotos} cotos`);
    console.log(`Winner: Team ${getMatchWinner(matchScore) === 0 ? '1' : '2'}`);
  });

  test('handles partidas reset after coto win', () => {
    let matchScore = createInitialMatchScore();

    // Win 3 partidas for team 1
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    matchScore = updateMatchScoreForPartida(matchScore, 0);

    // Should have won a coto and reset partidas
    expect(matchScore.team1Cotos).toBe(1);
    expect(matchScore.team1Partidas).toBe(0);
    expect(matchScore.team2Partidas).toBe(0);

    // Continue playing for next coto
    matchScore = updateMatchScoreForPartida(matchScore, 1);
    expect(matchScore.team2Partidas).toBe(1);
    expect(matchScore.team1Cotos).toBe(1); // Cotos should not change
  });

  test('correctly identifies match completion', () => {
    let matchScore = createInitialMatchScore();

    // Team 1 wins first coto (3 partidas)
    for (let i = 0; i < 3; i++) {
      matchScore = updateMatchScoreForPartida(matchScore, 0);
    }
    expect(matchScore.team1Cotos).toBe(1);
    expect(isMatchComplete(matchScore)).toBe(false);

    // Team 1 wins second coto (3 more partidas)
    for (let i = 0; i < 3; i++) {
      matchScore = updateMatchScoreForPartida(matchScore, 0);
    }
    expect(matchScore.team1Cotos).toBe(2);
    expect(isMatchComplete(matchScore)).toBe(true);
    expect(getMatchWinner(matchScore)).toBe(0);
  });

  test('handles bella (1-1) situation correctly', () => {
    let matchScore = createInitialMatchScore();

    // Team 1 wins first partida
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    expect(matchScore.currentSet).toBe('malas');

    // Team 2 wins second partida - creates bella
    matchScore = updateMatchScoreForPartida(matchScore, 1);
    expect(matchScore.team1Partidas).toBe(1);
    expect(matchScore.team2Partidas).toBe(1);
    expect(matchScore.currentSet).toBe('bella');

    // Team 1 wins third partida
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    expect(matchScore.team1Partidas).toBe(2);
    expect(matchScore.team2Partidas).toBe(1);
    expect(matchScore.currentSet).toBe('malas');
  });

  test('custom match configuration (first to 3 cotos)', () => {
    let matchScore: MatchScore = {
      ...createInitialMatchScore(),
      cotosPerMatch: 3, // First to 3 cotos wins
    };

    // Win 2 cotos for team 1
    for (let coto = 0; coto < 2; coto++) {
      for (let partida = 0; partida < 3; partida++) {
        matchScore = updateMatchScoreForPartida(matchScore, 0);
      }
    }

    expect(matchScore.team1Cotos).toBe(2);
    expect(isMatchComplete(matchScore)).toBe(false); // Need 3 cotos

    // Win third coto
    for (let partida = 0; partida < 3; partida++) {
      matchScore = updateMatchScoreForPartida(matchScore, 0);
    }

    expect(matchScore.team1Cotos).toBe(3);
    expect(isMatchComplete(matchScore)).toBe(true); // Match complete with 3 cotos
    expect(checkMatchWon(matchScore.team1Cotos, matchScore.cotosPerMatch)).toBe(true);
  });

  test('legacy field compatibility', () => {
    let matchScore = createInitialMatchScore();

    // Win some partidas
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    matchScore = updateMatchScoreForPartida(matchScore, 1);

    // Check legacy fields are kept in sync
    expect(matchScore.team1Sets).toBe(matchScore.team1Partidas);
    expect(matchScore.team2Sets).toBe(matchScore.team2Partidas);

    // Win a coto
    matchScore = updateMatchScoreForPartida(matchScore, 0);
    matchScore = updateMatchScoreForPartida(matchScore, 0);

    // Legacy fields should reset with partidas
    expect(matchScore.team1Sets).toBe(0);
    expect(matchScore.team2Sets).toBe(0);
  });
});
