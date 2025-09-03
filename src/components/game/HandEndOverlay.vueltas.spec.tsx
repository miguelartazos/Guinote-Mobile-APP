import React from 'react';
import { render } from '@testing-library/react-native';
import { HandEndOverlay } from './HandEndOverlay';

describe('HandEndOverlay - Vueltas Idas Score Display', () => {
  const defaultProps = {
    visible: true,
    team1Score: 150, // Total score (idas + vueltas)
    team2Score: 130, // Total score (idas + vueltas)
    team1HandPoints: 0,
    team2HandPoints: 0,
    team1Cantes: 0,
    team2Cantes: 0,
    isVueltas: true,
    shouldPlayVueltas: false,
    onAutoAdvance: jest.fn(),
  };

  test('displays idas scores when provided in vueltas phase', () => {
    const { queryByText } = render(
      <HandEndOverlay
        {...defaultProps}
        team1IdasScore={85} // Points from idas
        team2IdasScore={70} // Points from idas
      />,
    );

    // Check that idas scores are displayed
    expect(queryByText('85')).toBeTruthy(); // Team 1 idas score
    expect(queryByText('70')).toBeTruthy(); // Team 2 idas score
    expect(queryByText('de las idas')).toBeTruthy(); // Label for idas scores
  });

  test('does not display idas scores when not in vueltas', () => {
    const { queryByText } = render(
      <HandEndOverlay
        {...defaultProps}
        isVueltas={false}
        team1IdasScore={85}
        team2IdasScore={70}
      />,
    );

    // Idas scores should not be shown when not in vueltas
    expect(queryByText('de las idas')).toBeFalsy();
  });

  test('does not display idas scores when not provided', () => {
    const { queryByText } = render(
      <HandEndOverlay
        {...defaultProps}
        // No idas scores provided
      />,
    );

    // Should not show idas section when scores are undefined
    expect(queryByText('de las idas')).toBeFalsy();
  });

  test('shows correct total scores in vueltas with idas breakdown', () => {
    const { queryByText, debug } = render(
      <HandEndOverlay
        {...defaultProps}
        team1Score={101} // Total: reached 101!
        team2Score={95} // Total: didn't reach 101
        team1IdasScore={60} // From idas
        team2IdasScore={55} // From idas
      />,
    );

    // Should show victory message for team1 (reached 101)
    expect(queryByText('¡Victoria! Ganamos la partida')).toBeTruthy();

    // Should show idas scores
    expect(queryByText('60')).toBeTruthy(); // Team 1 idas
    expect(queryByText('55')).toBeTruthy(); // Team 2 idas
    expect(queryByText('de las idas')).toBeTruthy();
  });
});
