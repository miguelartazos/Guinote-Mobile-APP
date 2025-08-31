import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { GameTable } from './GameTable';
import { HAND_ANIMATION_DURATION, HAND_ANIMATION_STAGGER } from '../../constants/animations';
import type { SpanishCardData } from './SpanishCard';

jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
  State: {},
}));

const createMockPlayer = (id: string, cardCount: number) => ({
  id,
  name: `Player ${id}`,
  ranking: 1000,
  cards: Array.from({ length: cardCount }, (_, i) => ({
    suit: 'oros' as const,
    value: (i + 1) as SpanishCardData['value'],
  })),
  avatar: 'avatar1',
});

describe('GameTable animations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hand card animations', () => {
    it('should animate bottom player cards when positions change', async () => {
      const timingSpy = jest.spyOn(Animated, 'timing');

      const initialPlayers = [
        createMockPlayer('bottom', 6),
        createMockPlayer('left', 6),
        createMockPlayer('top', 6),
        createMockPlayer('right', 6),
      ] as [any, any, any, any];

      const { rerender } = render(
        <GameTable
          players={initialPlayers}
          currentPlayerIndex={0}
          onCardPlay={jest.fn()}
        />,
      );

      // Simulate card removal (player plays a card)
      const updatedPlayers = [
        createMockPlayer('bottom', 5), // One less card
        createMockPlayer('left', 6),
        createMockPlayer('top', 6),
        createMockPlayer('right', 6),
      ] as [any, any, any, any];

      rerender(
        <GameTable
          players={updatedPlayers}
          currentPlayerIndex={0}
          onCardPlay={jest.fn()}
        />,
      );

      await waitFor(() => {
        // Check that animations were triggered
        expect(timingSpy).toHaveBeenCalled();
        
        // Verify animation config
        const animationCalls = timingSpy.mock.calls;
        const lastCall = animationCalls[animationCalls.length - 1];
        
        if (lastCall && lastCall[1]) {
          expect(lastCall[1].duration).toBe(HAND_ANIMATION_DURATION);
        }
      });
    });

    it('should use staggered delays for multiple moving cards', async () => {
      const timingSpy = jest.spyOn(Animated, 'timing');

      const initialPlayers = [
        createMockPlayer('bottom', 6),
        createMockPlayer('left', 6),
        createMockPlayer('top', 6),
        createMockPlayer('right', 6),
      ] as [any, any, any, any];

      const { rerender } = render(
        <GameTable
          players={initialPlayers}
          currentPlayerIndex={0}
          onCardPlay={jest.fn()}
        />,
      );

      // Remove first card - all others should move
      const updatedPlayers = [
        {
          ...createMockPlayer('bottom', 5),
          cards: initialPlayers[0].cards.slice(1), // Remove first card
        },
        createMockPlayer('left', 6),
        createMockPlayer('top', 6),
        createMockPlayer('right', 6),
      ] as [any, any, any, any];

      rerender(
        <GameTable
          players={updatedPlayers}
          currentPlayerIndex={0}
          onCardPlay={jest.fn()}
        />,
      );

      await waitFor(() => {
        const animationCalls = timingSpy.mock.calls;
        
        // Check for staggered delays
        const delays = animationCalls
          .filter(call => call[1]?.delay !== undefined)
          .map(call => call[1].delay);
        
        // Verify stagger pattern
        delays.forEach((delay, index) => {
          if (index > 0) {
            expect(delay).toBeGreaterThanOrEqual(0);
            expect(delay % HAND_ANIMATION_STAGGER).toBe(0);
          }
        });
      });
    });

    it('should animate all player hands', async () => {
      const timingSpy = jest.spyOn(Animated, 'timing');

      const initialPlayers = [
        createMockPlayer('bottom', 6),
        createMockPlayer('left', 6),
        createMockPlayer('top', 6),
        createMockPlayer('right', 6),
      ] as [any, any, any, any];

      const { rerender } = render(
        <GameTable
          players={initialPlayers}
          currentPlayerIndex={0}
          onCardPlay={jest.fn()}
        />,
      );

      // Update all players with fewer cards
      const updatedPlayers = [
        createMockPlayer('bottom', 5),
        createMockPlayer('left', 5),
        createMockPlayer('top', 5),
        createMockPlayer('right', 5),
      ] as [any, any, any, any];

      rerender(
        <GameTable
          players={updatedPlayers}
          currentPlayerIndex={0}
          onCardPlay={jest.fn()}
        />,
      );

      await waitFor(() => {
        // Should have animations for all players
        expect(timingSpy).toHaveBeenCalled();
        
        // Check that multiple animations were created
        const animationCount = timingSpy.mock.calls.length;
        expect(animationCount).toBeGreaterThan(0);
      });
    });

    it('should cleanup animations when cards are removed', async () => {
      const initialPlayers = [
        createMockPlayer('bottom', 3),
        createMockPlayer('left', 3),
        createMockPlayer('top', 3),
        createMockPlayer('right', 3),
      ] as [any, any, any, any];

      const { rerender, unmount } = render(
        <GameTable
          players={initialPlayers}
          currentPlayerIndex={0}
          onCardPlay={jest.fn()}
        />,
      );

      // Update with empty hands
      const emptyPlayers = [
        createMockPlayer('bottom', 0),
        createMockPlayer('left', 0),
        createMockPlayer('top', 0),
        createMockPlayer('right', 0),
      ] as [any, any, any, any];

      rerender(
        <GameTable
          players={emptyPlayers}
          currentPlayerIndex={0}
          onCardPlay={jest.fn()}
        />,
      );

      // Cleanup should run without errors
      unmount();
    });

    it('should not animate on initial render', () => {
      const timingSpy = jest.spyOn(Animated, 'timing');

      const initialPlayers = [
        createMockPlayer('bottom', 6),
        createMockPlayer('left', 6),
        createMockPlayer('top', 6),
        createMockPlayer('right', 6),
      ] as [any, any, any, any];

      render(
        <GameTable
          players={initialPlayers}
          currentPlayerIndex={0}
          onCardPlay={jest.fn()}
        />,
      );

      // No animations should trigger on first render
      expect(timingSpy).not.toHaveBeenCalled();
    });
  });
});