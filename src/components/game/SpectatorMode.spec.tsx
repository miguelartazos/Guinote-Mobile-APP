import React from 'react';
import { render } from '@testing-library/react-native';
import { SpectatorMode } from './SpectatorMode';
import type { PlayerInfo, CardInfo } from './SpectatorMode';

describe('SpectatorMode', () => {
  const mockPlayers: PlayerInfo[] = [
    {
      id: 'player1',
      name: 'Juan',
      cards: [
        { suit: 'oros', value: 1 },
        { suit: 'copas', value: 12 },
      ],
      isEliminated: false,
    },
    {
      id: 'player2',
      name: 'María',
      cards: [
        { suit: 'espadas', value: 7 },
        { suit: 'bastos', value: 3 },
      ],
      isEliminated: false,
    },
    {
      id: 'player3',
      name: 'Carlos',
      cards: [],
      isEliminated: true,
    },
    {
      id: 'player4',
      name: 'Ana',
      cards: [{ suit: 'oros', value: 10 }],
      isEliminated: false,
    },
  ];

  it('renders spectator overlay when enabled', () => {
    const { getByTestId } = render(
      <SpectatorMode enabled={true} players={mockPlayers} currentPlayerId="player3" />,
    );

    expect(getByTestId('spectator-overlay')).toBeTruthy();
  });

  it('does not render when not enabled', () => {
    const { queryByTestId } = render(
      <SpectatorMode enabled={false} players={mockPlayers} currentPlayerId="player1" />,
    );

    expect(queryByTestId('spectator-overlay')).toBeNull();
  });

  it('shows spectator message', () => {
    const { getByText } = render(
      <SpectatorMode enabled={true} players={mockPlayers} currentPlayerId="player3" />,
    );

    expect(getByText('Modo Espectador')).toBeTruthy();
    expect(
      getByText('Has sido eliminado. Puedes ver las cartas de todos los jugadores.'),
    ).toBeTruthy();
  });

  it('displays all players and their cards', () => {
    const { getByText } = render(
      <SpectatorMode enabled={true} players={mockPlayers} currentPlayerId="player3" />,
    );

    // Check player names
    expect(getByText('Juan')).toBeTruthy();
    expect(getByText('María')).toBeTruthy();
    expect(getByText('Ana')).toBeTruthy();

    // Carlos should show as eliminated
    expect(getByText('Carlos (Eliminado)')).toBeTruthy();
  });

  it('shows card count for each player', () => {
    const { getAllByText, getByText } = render(
      <SpectatorMode enabled={true} players={mockPlayers} currentPlayerId="player3" />,
    );

    // Two players have 2 cards each
    const twoCardsElements = getAllByText('2 cartas');
    expect(twoCardsElements).toHaveLength(2); // Juan and María
    expect(getByText('1 carta')).toBeTruthy(); // Ana
  });

  it('shows team scores when provided', () => {
    const { getByText } = render(
      <SpectatorMode
        enabled={true}
        players={mockPlayers}
        currentPlayerId="player3"
        teamScores={{ team1: 45, team2: 67 }}
      />,
    );

    expect(getByText('Equipo 1: 45')).toBeTruthy();
    expect(getByText('Equipo 2: 67')).toBeTruthy();
  });

  it('highlights current turn player', () => {
    const { getByTestId } = render(
      <SpectatorMode
        enabled={true}
        players={mockPlayers}
        currentPlayerId="player3"
        currentTurnPlayerId="player1"
      />,
    );

    const currentTurnIndicator = getByTestId('current-turn-player1');
    expect(currentTurnIndicator).toBeTruthy();
  });

  it('shows remaining players count', () => {
    const { getByText } = render(
      <SpectatorMode enabled={true} players={mockPlayers} currentPlayerId="player3" />,
    );

    expect(getByText('Jugadores activos: 3/4')).toBeTruthy();
  });
});
