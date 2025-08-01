import React from 'react';
import { render } from '@testing-library/react-native';
import { PlayerPanel } from './PlayerPanel';

describe('PlayerPanel', () => {
  const defaultProps = {
    playerName: 'Test Player',
    ranking: 1500,
    position: 'bottom' as const,
    avatar: '🃏',
  };

  it('renders player name correctly', () => {
    const { getByText } = render(<PlayerPanel {...defaultProps} />);
    expect(getByText('Test Player')).toBeTruthy();
  });

  it('truncates long player names', () => {
    const { getByText } = render(
      <PlayerPanel
        {...defaultProps}
        playerName="VeryLongPlayerNameThatShouldBeTruncated"
      />,
    );
    expect(getByText('VeryLongP...')).toBeTruthy();
  });

  it('shows ranking when showRanking is true', () => {
    const { getByText } = render(
      <PlayerPanel {...defaultProps} showRanking={true} />,
    );
    expect(getByText('Ranking: 1,500')).toBeTruthy();
  });

  it('does not show ranking when showRanking is false', () => {
    const { queryByText } = render(
      <PlayerPanel {...defaultProps} showRanking={false} />,
    );
    expect(queryByText('Ranking: 1,500')).toBeNull();
  });

  it('displays avatar emoji', () => {
    const { getByText } = render(<PlayerPanel {...defaultProps} />);
    expect(getByText('🃏')).toBeTruthy();
  });

  it('shows turn indicator when isCurrentPlayer', () => {
    const { getByText } = render(
      <PlayerPanel {...defaultProps} isCurrentPlayer={true} />,
    );
    expect(getByText('ES MI TURNO')).toBeTruthy();
  });

  it('does not show turn indicator when not current player', () => {
    const { queryByText } = render(
      <PlayerPanel {...defaultProps} isCurrentPlayer={false} />,
    );
    expect(queryByText('ES MI TURNO')).toBeNull();
  });

  it('applies correct team color for team1', () => {
    const { getByTestId } = render(
      <PlayerPanel {...defaultProps} teamId="team1" testID="player-panel" />,
    );
    const panel = getByTestId('player-panel');
    expect(panel.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderColor: '#3498DB',
        }),
      ]),
    );
  });

  it('applies correct team color for team2', () => {
    const { getByTestId } = render(
      <PlayerPanel {...defaultProps} teamId="team2" testID="player-panel" />,
    );
    const panel = getByTestId('player-panel');
    expect(panel.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderColor: '#E74C3C',
        }),
      ]),
    );
  });

  it('applies landscape positioning when in landscape mode', () => {
    jest.mock('../../hooks/useOrientation', () => ({
      useOrientation: () => 'landscape',
    }));

    const { getByTestId } = render(
      <PlayerPanel {...defaultProps} position="top" testID="player-panel" />,
    );
    const panel = getByTestId('player-panel');
    expect(panel.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          top: 20,
          left: 20,
        }),
      ]),
    );
  });
});
