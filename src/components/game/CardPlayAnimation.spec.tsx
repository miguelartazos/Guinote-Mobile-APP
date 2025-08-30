import React from 'react';
import { render } from '@testing-library/react-native';
import { CardPlayAnimation } from './CardPlayAnimation';
import type { SpanishCardData } from './SpanishCard';

// Mock the SpanishCard component
jest.mock('./SpanishCard', () => ({
  SpanishCard: jest.fn(() => null),
}));

// Mock animation constants
jest.mock('../../constants/animations', () => ({
  SMOOTH_EASING: jest.fn(),
  CARD_PLAY_DURATION: 280,
  CARD_PLAY_INITIAL_OPACITY: 0.95,
}));

describe('CardPlayAnimation', () => {
  const mockCard: SpanishCardData = {
    suit: 'oros',
    value: 1,
  };

  const defaultProps = {
    card: mockCard,
    fromPosition: { x: 100, y: 200 },
    toPosition: { x: 300, y: 400 },
    playerPosition: 'bottom' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render without crashing', () => {
    const { getByTestId } = render(
      <CardPlayAnimation {...defaultProps} testID="card-animation" />
    );
    
    // Component should render
    expect(() => render(<CardPlayAnimation {...defaultProps} />)).not.toThrow();
  });

  test('should call playSound if provided', () => {
    const playSound = jest.fn();
    
    render(<CardPlayAnimation {...defaultProps} playSound={playSound} />);

    // PlaySound should be called when animation starts
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  test('should render with correct card size based on player position', () => {
    const { SpanishCard } = require('./SpanishCard');
    
    const { rerender } = render(<CardPlayAnimation {...defaultProps} playerPosition="bottom" />);
    expect(SpanishCard).toHaveBeenCalledWith(
      expect.objectContaining({ size: 'large' }),
      {}
    );

    SpanishCard.mockClear();

    rerender(<CardPlayAnimation {...defaultProps} playerPosition="top" />);
    expect(SpanishCard).toHaveBeenCalledWith(
      expect.objectContaining({ size: 'small' }),
      {}
    );
  });

  test('should handle different player positions', () => {
    // Test that component doesn't crash with different positions
    const positions: Array<'bottom' | 'left' | 'top' | 'right'> = ['bottom', 'left', 'top', 'right'];
    
    positions.forEach(position => {
      expect(() => render(
        <CardPlayAnimation {...defaultProps} playerPosition={position} />
      )).not.toThrow();
    });
  });

  test('should accept different card types', () => {
    const cards: SpanishCardData[] = [
      { suit: 'oros', value: 1 },
      { suit: 'copas', value: 12 },
      { suit: 'espadas', value: 7 },
      { suit: 'bastos', value: 10 },
    ];

    cards.forEach(card => {
      expect(() => render(
        <CardPlayAnimation {...defaultProps} card={card} />
      )).not.toThrow();
    });
  });
});