import React from 'react';
import { render } from '@testing-library/react-native';
import { CanteAnimation } from './CanteAnimation';
import type { CardValue } from '../../types/cardTypes';
import type { SpanishSuit } from '../../types/cardTypes';

describe('CanteAnimation', () => {
  const mockCards = [
    { suit: 'oros' as SpanishSuit, value: 11 as CardValue },
    { suit: 'oros' as SpanishSuit, value: 12 as CardValue },
  ];

  const mockPlayerPosition = { x: 200, y: 400 };
  const mockPartnerPosition = { x: 200, y: 100 };
  const mockOnComplete = jest.fn();
  const mockPlaySound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders cante animation for veinte', () => {
    const { getByText } = render(
      <CanteAnimation
        cards={mockCards}
        canteType="veinte"
        playerPosition={mockPlayerPosition}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(getByText('¡VEINTE!')).toBeTruthy();
  });

  test('renders cante animation for cuarenta', () => {
    const { getByText, queryAllByText } = render(
      <CanteAnimation
        cards={mockCards}
        canteType="cuarenta"
        playerPosition={mockPlayerPosition}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(getByText('¡CUARENTA!')).toBeTruthy();
    // Should render coin emojis for cuarenta
    const coins = queryAllByText('🪙');
    expect(coins.length).toBe(8);
  });

  test('renders partner notification when partner position provided', () => {
    const { getByText } = render(
      <CanteAnimation
        cards={mockCards}
        canteType="veinte"
        playerPosition={mockPlayerPosition}
        partnerPosition={mockPartnerPosition}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(getByText('¡Cante de tu compañero!')).toBeTruthy();
  });

  test('does not render partner notification when no partner position', () => {
    const { queryByText } = render(
      <CanteAnimation
        cards={mockCards}
        canteType="veinte"
        playerPosition={mockPlayerPosition}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(queryByText('¡Cante de tu compañero!')).toBeNull();
  });

  test('calls playSound when animation starts', () => {
    render(
      <CanteAnimation
        cards={mockCards}
        canteType="veinte"
        playerPosition={mockPlayerPosition}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    expect(mockPlaySound).toHaveBeenCalledTimes(1);
  });

  test('renders both cards with animation', () => {
    const { queryAllByTestId } = render(
      <CanteAnimation
        cards={mockCards}
        canteType="veinte"
        playerPosition={mockPlayerPosition}
        onComplete={mockOnComplete}
        playSound={mockPlaySound}
      />,
    );

    // Should render 2 animated cards
    const cardElements = queryAllByTestId(/card-/);
    expect(cardElements.length).toBeGreaterThanOrEqual(2);
  });
});
