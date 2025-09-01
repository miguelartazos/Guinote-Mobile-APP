import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { GameRoomScreen } from './GameRoomScreen';
import { useUnifiedRooms } from '../hooks/useUnifiedRooms';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import type { JugarStackScreenProps } from '../types/navigation';

jest.mock('../hooks/useUnifiedRooms');
jest.mock('../hooks/useUnifiedAuth');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('GameRoomScreen', () => {
  const mockRoute = {
    params: {
      roomId: 'room-123',
      roomCode: 'ABC123',
    },
  } as JugarStackScreenProps<'GameRoom'>['route'];

  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  } as any;

  const mockRoomState = {
    room: {
      id: 'room-123',
      code: 'ABC123',
      host_id: 'user-1',
      status: 'waiting',
      game_mode: 'friend',
      max_players: 4,
      current_players: 2,
    },
    players: [
      {
        id: 'user-1',
        name: 'Player 1',
        position: 0,
        teamId: 'team1',
        isReady: false,
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
    ],
    isLoading: false,
    error: null,
    queuedActions: 0,
    getRoomPlayers: jest.fn().mockResolvedValue([]),
    subscribeToRoom: jest.fn().mockReturnValue(() => {}),
    updateReadyStatus: jest.fn(),
    startGame: jest.fn(),
    addAIPlayer: jest.fn(),
    leaveRoom: jest.fn(),
    createFriendsRoom: jest.fn(),
    joinRoomByCode: jest.fn(),
  };

  const mockAuth = {
    user: { id: 'user-1', username: 'TestUser' },
    isAuthenticated: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUnifiedRooms as jest.Mock).mockReturnValue(mockRoomState);
    (useUnifiedAuth as jest.Mock).mockReturnValue(mockAuth);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  test('renders room header with room code', () => {
    const { getByText } = render(<GameRoomScreen route={mockRoute} navigation={mockNavigation} />);

    expect(getByText('ABC123')).toBeTruthy();
  });

  test('displays all 4 player slots', () => {
    const { getAllByTestId } = render(
      <GameRoomScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const playerSlots = getAllByTestId(/player-slot-/);
    expect(playerSlots).toHaveLength(4);
  });

  test('shows team assignments', () => {
    const { getByText } = render(<GameRoomScreen route={mockRoute} navigation={mockNavigation} />);

    expect(getByText(/Equipo 1/i)).toBeTruthy();
    expect(getByText(/Equipo 2/i)).toBeTruthy();
  });

  test('allows toggling ready status', async () => {
    const { getByText } = render(<GameRoomScreen route={mockRoute} navigation={mockNavigation} />);

    const readyButton = getByText(/Listo/i);
    fireEvent.press(readyButton);

    await waitFor(() => {
      expect(mockRoomState.updateReadyStatus).toHaveBeenCalledWith('room-123', 'user-1', true);
    });
  });

  test('shows start button only for host', () => {
    const { getByText } = render(<GameRoomScreen route={mockRoute} navigation={mockNavigation} />);

    expect(getByText(/Iniciar Partida/i)).toBeTruthy();
  });

  test('hides start button for non-host', () => {
    const nonHostAuth = {
      user: { id: 'user-2', username: 'TestUser2' },
      isAuthenticated: true,
    };
    (useUnifiedAuth as jest.Mock).mockReturnValue(nonHostAuth);

    const { queryByText } = render(
      <GameRoomScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(queryByText(/Iniciar Partida/i)).toBeNull();
  });

  test('start button is disabled when not all players are ready', () => {
    const { getByTestId } = render(
      <GameRoomScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const startButton = getByTestId('start-game-button');
    expect(startButton.props.accessibilityState?.disabled).toBe(true);
  });

  test('start button is enabled when all players are ready', () => {
    const allReadyState = {
      ...mockRoomState,
      players: [
        ...mockRoomState.players.map(p => ({ ...p, isReady: true })),
        {
          id: 'user-3',
          name: 'Player 3',
          position: 2,
          teamId: 'team2',
          isReady: true,
          isBot: false,
          connectionStatus: 'connected',
        },
        {
          id: 'user-4',
          name: 'Player 4',
          position: 3,
          teamId: 'team2',
          isReady: true,
          isBot: false,
          connectionStatus: 'connected',
        },
      ],
    };
    (useUnifiedRooms as jest.Mock).mockReturnValue(allReadyState);

    const { getByTestId } = render(
      <GameRoomScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const startButton = getByTestId('start-game-button');
    expect(startButton.props.accessibilityState?.disabled).toBe(false);
  });

  test('subscribes to room updates on mount', () => {
    render(<GameRoomScreen route={mockRoute} navigation={mockNavigation} />);

    expect(mockRoomState.subscribeToRoom).toHaveBeenCalledWith('room-123');
  });

  test('handles leave room action', async () => {
    const { getByTestId } = render(
      <GameRoomScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const leaveButton = getByTestId('leave-room-button');
    fireEvent.press(leaveButton);

    await waitFor(() => {
      expect(mockRoomState.leaveRoom).toHaveBeenCalledWith('room-123');
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  test('handles add AI player action', async () => {
    const { getByTestId } = render(
      <GameRoomScreen route={mockRoute} navigation={mockNavigation} />,
    );

    const addAIButton = getByTestId('add-ai-button-2');
    fireEvent.press(addAIButton);

    await waitFor(() => {
      expect(mockRoomState.addAIPlayer).toHaveBeenCalledWith('room-123', expect.any(Object));
    });
  });
});
