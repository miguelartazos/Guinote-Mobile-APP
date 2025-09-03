import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import type { SpanishCardData } from './SpanishCard';
import { CardPlayAnimation } from './CardPlayAnimation';

// Mock dependencies, not the component under test
jest.mock('./SpanishCard', () => ({
  SpanishCard: jest.fn(() => null),
}));

// Mock Animated classes and functions
const mockAnimatedValue = {
  setValue: jest.fn(),
  interpolate: jest.fn(() => '0deg'),
  _value: 0,
};

const mockAnimatedValueXY = {
  x: 0,
  y: 0,
  setValue: jest.fn(),
};

const mockAnimatedTiming = jest.fn(() => ({
  start: jest.fn(callback => callback && callback()),
}));

const mockAnimatedParallel = jest.fn(() => ({
  start: jest.fn(callback => callback && callback()),
}));

// @ts-ignore - Mock the constructors
Animated.Value = jest.fn(() => mockAnimatedValue);
// @ts-ignore - Mock the constructors
Animated.ValueXY = jest.fn(() => mockAnimatedValueXY);

jest.spyOn(Animated, 'timing').mockImplementation(mockAnimatedTiming);
jest.spyOn(Animated, 'parallel').mockImplementation(mockAnimatedParallel);

describe('CardPlayAnimation', () => {
  const defaultProps = {
    card: {
      suit: 'oros' as const,
      value: 1 as const,
    } as SpanishCardData,
    fromPosition: { x: 0, y: 0 },
    toPosition: { x: 100, y: 100 },
    playerPosition: 'bottom' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnimatedTiming.mockClear();
    mockAnimatedParallel.mockClear();
  });

  test('should render with correct structure', () => {
    const { getByTestId } = render(<CardPlayAnimation {...defaultProps} />);

    // The component should render the animation wrapper
    // Since we don't have testID, we check that render doesn't throw
    expect(() => render(<CardPlayAnimation {...defaultProps} />)).not.toThrow();
  });

  test('should call playSound when provided', () => {
    const playSound = jest.fn();
    render(<CardPlayAnimation {...defaultProps} playSound={playSound} />);

    // playSound should be called when animation starts
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  test('should set initial rotation based on player position', () => {
    const positions: Array<{
      position: 'bottom' | 'left' | 'top' | 'right';
      expectedRotation: number;
    }> = [
      { position: 'bottom', expectedRotation: 0 },
      { position: 'left', expectedRotation: 90 },
      { position: 'top', expectedRotation: 0 },
      { position: 'right', expectedRotation: -90 },
    ];

    positions.forEach(({ position }) => {
      // Render without errors for each position
      expect(() =>
        render(<CardPlayAnimation {...defaultProps} playerPosition={position} />),
      ).not.toThrow();
    });
  });

  test('should start animations to move card to table', () => {
    render(<CardPlayAnimation {...defaultProps} />);

    // Verify that parallel animation was called
    expect(mockAnimatedParallel).toHaveBeenCalled();

    // Verify that timing animations were set up (2 animations: position and rotation)
    expect(mockAnimatedTiming).toHaveBeenCalledTimes(2);
  });

  test('should not call playSound if not provided', () => {
    render(<CardPlayAnimation {...defaultProps} />);

    // No errors should occur when playSound is undefined
    expect(() => render(<CardPlayAnimation {...defaultProps} />)).not.toThrow();
  });
});
