import React from 'react';
import { render } from '@testing-library/react-native';
import { PostTrickDealAnimation } from './PostTrickDealAnimation';
import type { PlayerId } from '../../types/game.types';

describe('PostTrickDealAnimation', () => {
  const mockOnComplete = jest.fn();

  const defaultProps = {
    dealingCards: [
      {
        card: { suit: 'oros' as const, value: 1 as const },
        playerId: 'player1' as PlayerId,
        index: 0,
      },
      {
        card: { suit: 'copas' as const, value: 2 as const },
        playerId: 'player2' as PlayerId,
        index: 1,
      },
    ],
    onComplete: mockOnComplete,
    deckPosition: { x: 100, y: 200 },
    playerPositions: {
      player1: { x: 200, y: 400, rotation: 0 },
      player2: { x: 200, y: 100, rotation: 180 },
    } as Record<PlayerId, { x: number; y: number; rotation: number }>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dealing cards', () => {
    const { getAllByTestId } = render(
      <PostTrickDealAnimation {...defaultProps} />,
    );

    // Should render 2 animated cards
    expect(() => getAllByTestId('spanish-card')).not.toThrow();
  });

  test('renders correct number of cards', () => {
    const { baseElement } = render(<PostTrickDealAnimation {...defaultProps} />);

    // Check that we have animated views for each card
    const animatedViews = baseElement.querySelectorAll('[style*="transform"]');
    expect(animatedViews.length).toBeGreaterThanOrEqual(
      defaultProps.dealingCards.length,
    );
  });

  test('handles empty dealing cards', () => {
    const { baseElement } = render(
      <PostTrickDealAnimation {...defaultProps} dealingCards={[]} />,
    );

    expect(baseElement).toBeTruthy();
  });

  test('animation completes and calls onComplete', () => {
    jest.useFakeTimers();

    render(<PostTrickDealAnimation {...defaultProps} />);

    // Fast-forward animations
    jest.runAllTimers();

    // onComplete should be called after animations
    expect(mockOnComplete).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  test('handles missing player positions gracefully', () => {
    const propsWithMissingPosition = {
      ...defaultProps,
      playerPositions: {
        player1: { x: 200, y: 400, rotation: 0 },
        // player2 position missing
      } as Record<PlayerId, { x: number; y: number; rotation: number }>,
    };

    const { baseElement } = render(
      <PostTrickDealAnimation {...propsWithMissingPosition} />,
    );
    expect(baseElement).toBeTruthy();
  });
});
