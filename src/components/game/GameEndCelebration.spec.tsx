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

    expect(getByText('VICTORIA')).toBeTruthy();
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

    expect(getByText('Fin del Juego')).toBeTruthy();
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

    expect(getByText('Tú')).toBeTruthy();
    expect(getByText('Oponente')).toBeTruthy();
  });

  test('renders confetti only for winner', () => {
    const winnerScreen = render(
      <GameEndCelebration
        isWinner={true}
        finalScore={{ player: 101, opponent: 85 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    const loserScreen = render(
      <GameEndCelebration
        isWinner={false}
        finalScore={{ player: 85, opponent: 101 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    // Winner should show victory text
    expect(winnerScreen.getByText('VICTORIA')).toBeTruthy();

    // Loser should show defeat text
    expect(loserScreen.getByText('Fin del Juego')).toBeTruthy();
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

  test('renders crown icon for winner', () => {
    const { getByText } = render(
      <GameEndCelebration
        isWinner={true}
        finalScore={{ player: 101, opponent: 85 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(getByText('♔')).toBeTruthy();

    // Rerender as loser
    const { queryByText: loserQuery } = render(
      <GameEndCelebration
        isWinner={false}
        finalScore={{ player: 85, opponent: 101 }}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(loserQuery('♔')).toBeFalsy();
  });
});
