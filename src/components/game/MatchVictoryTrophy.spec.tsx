import React from 'react';
import { render } from '@testing-library/react-native';
import { MatchVictoryTrophy } from './MatchVictoryTrophy';

describe('MatchVictoryTrophy', () => {
  test('renders trophy for winner', () => {
    const { getByText } = render(<MatchVictoryTrophy isWinner={true} visible={true} />);

    expect(getByText('★')).toBeTruthy();
    expect(getByText('CAMPEÓN')).toBeTruthy();
  });

  test('renders medal for loser', () => {
    const { getByText } = render(<MatchVictoryTrophy isWinner={false} visible={true} />);

    expect(getByText('🥈')).toBeTruthy();
    expect(getByText('BUEN JUEGO')).toBeTruthy();
  });

  test('renders trophy components for winner', () => {
    const { getByText } = render(<MatchVictoryTrophy isWinner={true} visible={true} />);

    // Verify trophy elements are present
    expect(getByText('★')).toBeTruthy();
    expect(getByText('CAMPEÓN')).toBeTruthy();
  });

  test('does not render trophy for loser', () => {
    const { queryByText } = render(<MatchVictoryTrophy isWinner={false} visible={true} />);

    // Trophy elements should not be present for loser
    expect(queryByText('★')).toBeNull();
    expect(queryByText('CAMPEÓN')).toBeNull();
  });
});
