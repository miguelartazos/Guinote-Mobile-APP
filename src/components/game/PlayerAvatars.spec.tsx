import React from 'react';
import { render } from '@testing-library/react-native';
import { PlayerAvatars } from './PlayerAvatars';
import type { PlayerAvatarInfo } from './PlayerAvatars';

describe('PlayerAvatars', () => {
  const mockPlayers: PlayerAvatarInfo[] = [
    {
      id: 'player1',
      name: 'Juan',
      avatar: '👨',
      isOnline: true,
      isCurrentTurn: true,
      position: 'bottom',
    },
    {
      id: 'player2',
      name: 'María',
      avatar: '👩',
      isOnline: true,
      isCurrentTurn: false,
      position: 'right',
    },
    {
      id: 'player3',
      name: 'Carlos',
      avatar: '👨‍🦰',
      isOnline: false,
      isCurrentTurn: false,
      position: 'top',
    },
    {
      id: 'player4',
      name: 'Ana',
      avatar: '👩‍🦱',
      isOnline: true,
      isCurrentTurn: false,
      position: 'left',
    },
  ];

  it('renders all four players', () => {
    const { getByText } = render(<PlayerAvatars players={mockPlayers} currentPlayerId="player1" />);

    expect(getByText('Juan')).toBeTruthy();
    expect(getByText('María')).toBeTruthy();
    expect(getByText('Carlos')).toBeTruthy();
    expect(getByText('Ana')).toBeTruthy();
  });

  it('highlights current turn player', () => {
    const { getByTestId } = render(
      <PlayerAvatars players={mockPlayers} currentPlayerId="player1" />,
    );

    const currentPlayer = getByTestId('avatar-player1');
    // Style is an array, check the second element for animated styles
    const styles = currentPlayer.props.style;
    expect(styles[1]).toMatchObject(
      expect.objectContaining({
        borderColor: '#D4A574',
        borderWidth: 3,
      }),
    );
  });

  it('shows offline indicator for disconnected players', () => {
    const { getByTestId } = render(
      <PlayerAvatars players={mockPlayers} currentPlayerId="player3" />,
    );

    const offlineIndicator = getByTestId('offline-indicator-player3');
    expect(offlineIndicator).toBeTruthy();
  });

  it('positions players correctly', () => {
    const { getByTestId } = render(
      <PlayerAvatars players={mockPlayers} currentPlayerId="player1" />,
    );

    const bottomPlayer = getByTestId('avatar-container-player1');
    const rightPlayer = getByTestId('avatar-container-player2');
    const topPlayer = getByTestId('avatar-container-player3');
    const leftPlayer = getByTestId('avatar-container-player4');

    // Check positioning styles - style is an array
    expect(bottomPlayer.props.style[1]).toMatchObject(
      expect.objectContaining({
        bottom: expect.any(Number),
      }),
    );
    expect(rightPlayer.props.style[1]).toMatchObject(
      expect.objectContaining({
        right: expect.any(Number),
      }),
    );
    expect(topPlayer.props.style[1]).toMatchObject(
      expect.objectContaining({
        top: expect.any(Number),
      }),
    );
    expect(leftPlayer.props.style[1]).toMatchObject(
      expect.objectContaining({
        left: expect.any(Number),
      }),
    );
  });

  it('displays avatar emojis', () => {
    const { getByText } = render(<PlayerAvatars players={mockPlayers} currentPlayerId="player1" />);

    expect(getByText('👨')).toBeTruthy();
    expect(getByText('👩')).toBeTruthy();
    expect(getByText('👨‍🦰')).toBeTruthy();
    expect(getByText('👩‍🦱')).toBeTruthy();
  });

  it('shows turn indicator animation for current turn', () => {
    const { getByTestId } = render(
      <PlayerAvatars players={mockPlayers} currentPlayerId="player1" />,
    );

    const turnIndicator = getByTestId('turn-indicator-player1');
    expect(turnIndicator).toBeTruthy();
  });

  it('handles compact mode for smaller screens', () => {
    const { getByTestId } = render(
      <PlayerAvatars players={mockPlayers} currentPlayerId="player1" compact />,
    );

    const avatar = getByTestId('avatar-player1');
    // Style is an array, check the second element for animated styles
    const styles = avatar.props.style;
    expect(styles[1]).toMatchObject(
      expect.objectContaining({
        width: 40,
        height: 40,
      }),
    );
  });
});
