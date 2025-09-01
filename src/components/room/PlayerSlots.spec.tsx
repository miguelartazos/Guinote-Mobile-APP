import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PlayerSlots } from './PlayerSlots';
import type { Player } from '../../hooks/useUnifiedRooms';

describe('PlayerSlots', () => {
  const mockOnAddAI = jest.fn();

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
      position: 1,
      teamId: 'team1',
      isReady: false,
      isBot: false,
      connectionStatus: 'connected',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays all 4 player slots', () => {
    const { getAllByTestId } = render(
      <PlayerSlots players={[]} onAddAI={mockOnAddAI} isHost={true} />,
    );

    const slots = getAllByTestId(/player-slot-/);
    expect(slots).toHaveLength(4);
  });

  test('shows player names for occupied slots', () => {
    const { getByText } = render(
      <PlayerSlots players={mockPlayers} onAddAI={mockOnAddAI} isHost={true} />,
    );

    expect(getByText('Player 1')).toBeTruthy();
    expect(getByText('Player 2')).toBeTruthy();
  });

  test('shows empty message for unoccupied slots', () => {
    const { getAllByText } = render(
      <PlayerSlots players={mockPlayers} onAddAI={mockOnAddAI} isHost={true} />,
    );

    const emptySlots = getAllByText(/Esperando jugador/i);
    expect(emptySlots).toHaveLength(2); // 4 total slots - 2 occupied
  });

  test('shows AI indicator for bot players', () => {
    const playersWithAI: Player[] = [
      ...mockPlayers,
      {
        id: 'ai-1',
        name: 'IA Medio',
        position: 2,
        teamId: 'team2',
        isReady: true,
        isBot: true,
        botConfig: { difficulty: 'medium', personality: 'balanced' },
        connectionStatus: 'connected',
      },
    ];

    const { getByText } = render(
      <PlayerSlots players={playersWithAI} onAddAI={mockOnAddAI} isHost={true} />,
    );

    expect(getByText(/🤖/)).toBeTruthy();
  });

  test('shows human indicator for non-bot players', () => {
    const { getAllByText } = render(
      <PlayerSlots players={mockPlayers} onAddAI={mockOnAddAI} isHost={true} />,
    );

    const humanIndicators = getAllByText(/👤/);
    expect(humanIndicators).toHaveLength(2);
  });

  test('shows ready status for players', () => {
    const { getByText } = render(
      <PlayerSlots players={mockPlayers} onAddAI={mockOnAddAI} isHost={true} />,
    );

    // Player 1 is ready
    expect(getByText('✅ Listo')).toBeTruthy();
  });

  test('shows add AI button for empty slots when host', () => {
    const { getByTestId } = render(
      <PlayerSlots players={mockPlayers} onAddAI={mockOnAddAI} isHost={true} />,
    );

    const addAIButton = getByTestId('add-ai-button-2');
    expect(addAIButton).toBeTruthy();
  });

  test('hides add AI button for non-hosts', () => {
    const { queryByTestId } = render(
      <PlayerSlots players={mockPlayers} onAddAI={mockOnAddAI} isHost={false} />,
    );

    const addAIButton = queryByTestId('add-ai-button-2');
    expect(addAIButton).toBeNull();
  });

  test('calls onAddAI when add AI button is pressed', () => {
    const { getByTestId } = render(
      <PlayerSlots players={mockPlayers} onAddAI={mockOnAddAI} isHost={true} />,
    );

    const addAIButton = getByTestId('add-ai-button-2');
    fireEvent.press(addAIButton);

    expect(mockOnAddAI).toHaveBeenCalledTimes(1);
  });

  test('assigns correct teams to slots', () => {
    const { getByTestId } = render(
      <PlayerSlots players={[]} onAddAI={mockOnAddAI} isHost={true} />,
    );

    // Positions 0, 2 should be team1
    // Positions 1, 3 should be team2
    const slot0 = getByTestId('player-slot-0');
    const slot1 = getByTestId('player-slot-1');

    expect(slot0.props.accessibilityLabel).toContain('team1');
    expect(slot1.props.accessibilityLabel).toContain('team2');
  });
});
