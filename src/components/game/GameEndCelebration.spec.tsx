import React from 'react';
import { render } from '@testing-library/react-native';
import { GameEndCelebration } from './GameEndCelebration';

describe('GameEndCelebration', () => {
  const mockOnComplete = jest.fn();
  const mockPlaySound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders victory celebration for winner', () => {
    const { getByText } = render(
      <GameEndCelebration
        isWinner={true}
        finalScore={{ player: 101, opponent: 85 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(getByText('¡VICTORIA!')).toBeTruthy();
  });

  test('renders game end message for loser', () => {
    const { getByText } = render(
      <GameEndCelebration
        isWinner={false}
        finalScore={{ player: 85, opponent: 101 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(getByText('¡Fin del Juego!')).toBeTruthy();
  });

  test('displays score labels', () => {
    const { getByText } = render(
      <GameEndCelebration
        isWinner={true}
        finalScore={{ player: 101, opponent: 85 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(getByText('Tu puntuación')).toBeTruthy();
    expect(getByText('Oponente')).toBeTruthy();
  });

  test('renders confetti only for winner', () => {
    const { container: winnerContainer } = render(
      <GameEndCelebration
        isWinner={true}
        finalScore={{ player: 101, opponent: 85 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    const { container: loserContainer } = render(
      <GameEndCelebration
        isWinner={false}
        finalScore={{ player: 85, opponent: 101 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    // Winner should have SVG elements for confetti
    const winnerSvg = winnerContainer.querySelector('svg');
    expect(winnerSvg).toBeTruthy();

    // Loser should not have SVG elements
    const loserSvg = loserContainer.querySelector('svg');
    expect(loserSvg).toBeFalsy();
  });

  test('calls playSound when animation starts', () => {
    render(
      <GameEndCelebration
        isWinner={true}
        finalScore={{ player: 101, opponent: 85 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(mockPlaySound).toHaveBeenCalledTimes(1);
  });

  test('renders dancing cards emoji for winner', () => {
    const { getByText } = render(
      <GameEndCelebration
        isWinner={true}
        finalScore={{ player: 101, opponent: 85 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(getByText('🎴')).toBeTruthy();

    // Rerender as loser
    const { queryByText: loserQuery } = render(
      <GameEndCelebration
        isWinner={false}
        finalScore={{ player: 85, opponent: 101 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(loserQuery('🎴')).toBeFalsy();
  });
});
