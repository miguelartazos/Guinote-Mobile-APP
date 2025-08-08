import React from 'react';
import { render } from '@testing-library/react-native';
import { PlayerInfoBox } from './PlayerInfoBox';

describe('PlayerInfoBox', () => {
  const defaultProps = {
    playerName: 'TestPlayer',
    ranking: 1234,
    position: 'top-left' as const,
  };

  test('renders player name correctly', () => {
    const { getByText } = render(
      React.createElement(PlayerInfoBox, defaultProps),
    );
    expect(getByText('TestPlayer')).toBeTruthy();
  });

  test('truncates long player names', () => {
    const { getByText } = render(
      React.createElement(PlayerInfoBox, {
        ...defaultProps,
        playerName: 'VeryLongPlayerName',
      }),
    );
    expect(getByText('VeryLong...')).toBeTruthy();
  });

  test('displays ranking correctly', () => {
    const { getByText } = render(
      React.createElement(PlayerInfoBox, defaultProps),
    );
    expect(getByText('Ranking: 1234')).toBeTruthy();
  });

  test('shows current player badge when isCurrentPlayer is true', () => {
    const { getByText } = render(
      React.createElement(PlayerInfoBox, {
        ...defaultProps,
        isCurrentPlayer: true,
      }),
    );
    expect(getByText('M')).toBeTruthy();
  });

  test('does not show current player badge when isCurrentPlayer is false', () => {
    const { queryByText } = render(
      React.createElement(PlayerInfoBox, {
        ...defaultProps,
        isCurrentPlayer: false,
      }),
    );
    expect(queryByText('M')).toBeNull();
  });

  test.each([
    'top-left' as const,
    'top-right' as const,
    'bottom-left' as const,
    'bottom-right' as const,
  ])('renders correctly in %s position', position => {
    const { container } = render(
      React.createElement(PlayerInfoBox, {
        ...defaultProps,
        position,
      }),
    );
    expect(container).toBeTruthy();
  });
});
