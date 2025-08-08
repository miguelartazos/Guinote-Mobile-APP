import React from 'react';
import { render } from '@testing-library/react-native';
import { TrickCollectionAnimation } from './TrickCollectionAnimation';
import type { CardValue } from '../../types/cardTypes';
import type { SpanishSuit } from '../../types/cardTypes';

describe('TrickCollectionAnimation', () => {
  const mockCards = [
    { suit: 'oros' as SpanishSuit, value: 1 as CardValue },
    { suit: 'copas' as SpanishSuit, value: 12 as CardValue },
    { suit: 'espadas' as SpanishSuit, value: 10 as CardValue },
    { suit: 'bastos' as SpanishSuit, value: 11 as CardValue },
  ];

  const mockWinnerPosition = { x: 200, y: 300 };
  const mockOnComplete = jest.fn();
  const mockPlaySound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders trick collection animation with cards', () => {
    const { queryAllByTestId } = render(
      <TrickCollectionAnimation
        cards={mockCards}
        winnerPosition={mockWinnerPosition}
        points={10}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    // Should render 4 animated cards
    const cardElements = queryAllByTestId(/card-/);
    expect(cardElements.length).toBeGreaterThanOrEqual(4);
  });

  test('calls playSound when animation starts', () => {
    render(
      <TrickCollectionAnimation
        cards={mockCards}
        winnerPosition={mockWinnerPosition}
        points={10}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(mockPlaySound).toHaveBeenCalledTimes(1);
  });

  test('renders without score when points is 0', () => {
    const { queryByText } = render(
      <TrickCollectionAnimation
        cards={mockCards}
        winnerPosition={mockWinnerPosition}
        points={0}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(queryByText(/\+/)).toBeNull();
  });

  test('renders with score when points is positive', () => {
    const { getByText } = render(
      <TrickCollectionAnimation
        cards={mockCards}
        winnerPosition={mockWinnerPosition}
        points={20}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(getByText('+20')).toBeTruthy();
  });

  test('handles animation without playSound callback', () => {
    expect(() => {
      render(
        <TrickCollectionAnimation
          cards={mockCards}
          winnerPosition={mockWinnerPosition}
          points={10}
          onComplete={mockOnComplete}
        />,
      );
    }).not.toThrow();
  });
});
