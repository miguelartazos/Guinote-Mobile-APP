import React from 'react';
import { render } from '@testing-library/react-native';
import { TeamIndicator } from './TeamIndicator';
import type { Player } from '../../hooks/useUnifiedRooms';

describe('TeamIndicator', () => {
  const mockPlayers: Player[] = [
    {
      id: 'user-1',
      name: 'Player 1',
      position: 0,
      teamId: 'team1',
      isReady: true,
      isBot: false,
      connectionStatus: 'connected',
    },
    {
      id: 'user-2',
      name: 'Player 2',
      position: 2,
      teamId: 'team1',
      isReady: false,
      isBot: false,
      connectionStatus: 'connected',
    },
    {
      id: 'user-3',
      name: 'Player 3',
      position: 1,
      teamId: 'team2',
      isReady: true,
      isBot: false,
      connectionStatus: 'connected',
    },
    {
      id: 'ai-1',
      name: 'IA Medio',
      position: 3,
      teamId: 'team2',
      isReady: true,
      isBot: true,
      connectionStatus: 'connected',
    },
  ];

  const teams = [
    { id: 'team1', name: 'Equipo 1', players: mockPlayers.filter(p => p.teamId === 'team1') },
    { id: 'team2', name: 'Equipo 2', players: mockPlayers.filter(p => p.teamId === 'team2') },
  ];

  test('displays team names', () => {
    const { getByText } = render(<TeamIndicator teams={teams} />);

    expect(getByText('Equipo 1')).toBeTruthy();
    expect(getByText('Equipo 2')).toBeTruthy();
  });

  test('shows VS separator between teams', () => {
    const { getByText } = render(<TeamIndicator teams={teams} />);

    expect(getByText('VS')).toBeTruthy();
  });

  test('displays player names for each team', () => {
    const { getByText } = render(<TeamIndicator teams={teams} />);

    // Team 1 players
    expect(getByText('Player 1')).toBeTruthy();
    expect(getByText('Player 2')).toBeTruthy();

    // Team 2 players
    expect(getByText('Player 3')).toBeTruthy();
    expect(getByText('IA Medio')).toBeTruthy();
  });

  test('shows team positions (1-2 vs 3-4)', () => {
    const { getByText } = render(<TeamIndicator teams={teams} />);

    expect(getByText(/Jugadores 1 y 3/i)).toBeTruthy();
    expect(getByText(/Jugadores 2 y 4/i)).toBeTruthy();
  });

  test('handles empty teams gracefully', () => {
    const emptyTeams = [
      { id: 'team1', name: 'Equipo 1', players: [] },
      { id: 'team2', name: 'Equipo 2', players: [] },
    ];

    const { getByText } = render(<TeamIndicator teams={emptyTeams} />);

    expect(getByText('Equipo 1')).toBeTruthy();
    expect(getByText('Equipo 2')).toBeTruthy();
  });

  test('shows AI badge for bot players', () => {
    const { getAllByText } = render(<TeamIndicator teams={teams} />);

    const aiBadges = getAllByText('🤖');
    expect(aiBadges).toHaveLength(1);
  });

  test('shows human badge for human players', () => {
    const { getAllByText } = render(<TeamIndicator teams={teams} />);

    const humanBadges = getAllByText('👤');
    expect(humanBadges).toHaveLength(3);
  });
});
