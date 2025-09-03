import React from 'react';
import { render } from '@testing-library/react-native';
import { MatchVictoryStats } from './MatchVictoryStats';
import type { GameState, MatchScore, TeamId } from '../../types/game.types';

const createMockGameState = (): GameState => ({
  phase: 'gameOver',
  currentPlayerIndex: 0,
  trumpSuit: 'oros',
  players: [
    { id: '1', name: 'Player 1', isAI: false },
    { id: '2', name: 'Player 2', isAI: true },
    { id: '3', name: 'Player 3', isAI: false },
    { id: '4', name: 'Player 4', isAI: true },
  ],
  teams: [
    {
      id: 'team1' as TeamId,
      playerIds: ['1', '3'],
      score: 120,
      cardPoints: 80,
      tricksWon: 8,
      cantas: [{ points: 20, suit: 'oros', playerId: '1' }],
      totalPoints: 120,
    },
    {
      id: 'team2' as TeamId,
      playerIds: ['2', '4'],
      score: 90,
      cardPoints: 60,
      tricksWon: 4,
      cantas: [],
      totalPoints: 90,
    },
  ],
  deck: [],
  currentTrick: [],
  tricks: [],
  isVueltas: false,
  startTime: Date.now() - 300000, // 5 minutes ago
});

const createMockMatchScore = (): MatchScore => ({
  team1Partidas: 3,
  team2Partidas: 2,
  team1Cotos: 2,
  team2Cotos: 0,
  partidasPerCoto: 3,
  cotosPerMatch: 2,
  currentSet: 'buenas',
  totalPartidasTeam1: 6,
  totalPartidasTeam2: 2,
  vueltasCount: 2,
  team1Sets: 3,
  team2Sets: 2,
});

describe('MatchVictoryStats', () => {
  test('renders all stat categories', () => {
    const gameState = createMockGameState();
    const matchScore = createMockMatchScore();

    const { getByText } = render(
      <MatchVictoryStats
        gameState={gameState}
        matchScore={matchScore}
        visible={true}
        playerTeamIndex={0}
      />,
    );

    expect(getByText('ESTADÍSTICAS DEL PARTIDO')).toBeTruthy();
    expect(getByText('Cotos Ganados')).toBeTruthy();
    expect(getByText('Partidas Totales')).toBeTruthy();
    expect(getByText('Puntos Totales')).toBeTruthy();
    expect(getByText('Bazas Ganadas')).toBeTruthy();
    expect(getByText('Cantas Realizadas')).toBeTruthy();
    expect(getByText('Vueltas Jugadas')).toBeTruthy();
  });

  test('displays correct team values', () => {
    const gameState = createMockGameState();
    const matchScore = createMockMatchScore();

    const { getAllByText } = render(
      <MatchVictoryStats
        gameState={gameState}
        matchScore={matchScore}
        visible={true}
        playerTeamIndex={0}
      />,
    );

    // Check various values exist (multiple occurrences expected)
    expect(getAllByText('2').length).toBeGreaterThan(0); // team1Cotos and other values
    expect(getAllByText('0').length).toBeGreaterThan(0); // team2Cotos
    expect(getAllByText('120').length).toBeGreaterThan(0); // team1 total points
    expect(getAllByText('90').length).toBeGreaterThan(0); // team2 total points
    expect(getAllByText('8').length).toBeGreaterThan(0); // team1 tricks
    expect(getAllByText('4').length).toBeGreaterThan(0); // team2 tricks
  });

  test('shows MVP section when cantas exist', () => {
    const gameState = createMockGameState();
    const matchScore = createMockMatchScore();

    const { getByText } = render(
      <MatchVictoryStats
        gameState={gameState}
        matchScore={matchScore}
        visible={true}
        playerTeamIndex={0}
      />,
    );

    expect(getByText('⭐ JUGADA DESTACADA ⭐')).toBeTruthy();
    expect(getByText('1 cantas del tu equipo')).toBeTruthy();
  });

  test('hides MVP section when no cantas', () => {
    const gameState = createMockGameState();
    gameState.teams[0].cantas = [];
    gameState.teams[1].cantas = [];
    const matchScore = createMockMatchScore();

    const { queryByText } = render(
      <MatchVictoryStats
        gameState={gameState}
        matchScore={matchScore}
        visible={true}
        playerTeamIndex={0}
      />,
    );

    expect(queryByText('⭐ JUGADA DESTACADA ⭐')).toBeNull();
  });

  test('formats duration correctly', () => {
    const gameState = createMockGameState();
    const matchScore = createMockMatchScore();

    const { getByText, getAllByText } = render(
      <MatchVictoryStats
        gameState={gameState}
        matchScore={matchScore}
        visible={true}
        playerTeamIndex={0}
      />,
    );

    expect(getByText('Duración')).toBeTruthy();
    // Duration appears twice (once for each team)
    expect(getAllByText('5:00').length).toBe(2);
  });

  test('correctly identifies player team labels', () => {
    const gameState = createMockGameState();
    const matchScore = createMockMatchScore();

    const { getAllByText } = render(
      <MatchVictoryStats
        gameState={gameState}
        matchScore={matchScore}
        visible={true}
        playerTeamIndex={0}
      />,
    );

    expect(getAllByText('Tu Equipo').length).toBeGreaterThan(0);
    expect(getAllByText('Rival').length).toBeGreaterThan(0);
  });

  test('correctly identifies rival team when playerTeamIndex is 1', () => {
    const gameState = createMockGameState();
    const matchScore = createMockMatchScore();

    const { getAllByText } = render(
      <MatchVictoryStats
        gameState={gameState}
        matchScore={matchScore}
        visible={true}
        playerTeamIndex={1}
      />,
    );

    expect(getAllByText('Tu Equipo').length).toBeGreaterThan(0);
    expect(getAllByText('Rival').length).toBeGreaterThan(0);
  });
});
