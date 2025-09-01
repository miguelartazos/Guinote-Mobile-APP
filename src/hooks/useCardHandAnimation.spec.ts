import { renderHook } from '@testing-library/react-native';
import { useCardHandAnimation } from './useCardHandAnimation';
import type { Card } from '../types/game.types';
import type { LayoutInfo } from '../utils/cardPositions';

describe('useCardHandAnimation', () => {
  const mockLayoutInfo: LayoutInfo = {
    board: { x: 100, y: 100, width: 600, height: 400 },
    table: { x: 0, y: 0, width: 800, height: 600 },
  };

  const createCard = (id: number): Card => ({
    id: `card_${id}`,
    suit: 'oros',
    value: id,
  });

  const createCards = (count: number): Card[] => {
    return Array.from({ length: count }, (_, i) => createCard(i));
  };

  test('returns animated position for each card', () => {
    const cards = createCards(5);
    const { result } = renderHook(() => useCardHandAnimation(cards, 'left', mockLayoutInfo));

    cards.forEach((_, index) => {
      const position = result.current.getAnimatedPosition(index);
      expect(position).toBeDefined();
      expect(position).not.toBeNull();
    });
  });

  test('handles empty card array', () => {
    const { result } = renderHook(() => useCardHandAnimation([], 'left', mockLayoutInfo));

    expect(result.current.isAnimating()).toBe(false);
  });

  test('cleanup function exists', () => {
    const cards = createCards(5);
    const { result } = renderHook(() => useCardHandAnimation(cards, 'left', mockLayoutInfo));

    expect(result.current.cleanup).toBeDefined();
    expect(typeof result.current.cleanup).toBe('function');
  });

  test('isAnimating function exists', () => {
    const cards = createCards(5);
    const { result } = renderHook(() => useCardHandAnimation(cards, 'left', mockLayoutInfo));

    expect(result.current.isAnimating).toBeDefined();
    expect(typeof result.current.isAnimating).toBe('function');
  });

  test('handles different player positions', () => {
    const cards = createCards(3);

    const { result: leftResult } = renderHook(() =>
      useCardHandAnimation(cards, 'left', mockLayoutInfo),
    );

    const { result: topResult } = renderHook(() =>
      useCardHandAnimation(cards, 'top', mockLayoutInfo),
    );

    const { result: rightResult } = renderHook(() =>
      useCardHandAnimation(cards, 'right', mockLayoutInfo),
    );

    // Each position should return valid animated positions
    expect(leftResult.current.getAnimatedPosition(0)).toBeDefined();
    expect(topResult.current.getAnimatedPosition(0)).toBeDefined();
    expect(rightResult.current.getAnimatedPosition(0)).toBeDefined();
  });
});
