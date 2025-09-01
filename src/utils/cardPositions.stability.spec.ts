import { describe, expect, test } from '@jest/globals';
import type { LayoutInfo } from './cardPositions';
import { getDeckPosition } from './cardPositions';

describe('getDeckPosition stability', () => {
  const mockLayoutInfo: LayoutInfo = {
    parentLayout: { x: 0, y: 0, width: 375, height: 812 },
    boardLayout: { x: 120, y: 100, width: 255, height: 612 },
  };

  test('should return consistent position without Math.floor jumps', () => {
    const position1 = getDeckPosition(375, 812, mockLayoutInfo);
    const position2 = getDeckPosition(375, 812, mockLayoutInfo);

    // Positions should be exactly the same
    expect(position1.x).toBe(position2.x);
    expect(position1.y).toBe(position2.y);

    // Position values should be smooth (no floor operations)
    expect(position1.x).toBe(mockLayoutInfo.boardLayout!.x + 120 + 30);
    // The actual card height calculation is more complex, just verify it's consistent
    expect(typeof position1.y).toBe('number');
    expect(position1.y).toBeGreaterThan(0);
  });

  test('should handle missing board layout gracefully', () => {
    const noLayoutInfo: LayoutInfo = {
      parentLayout: { x: 0, y: 0, width: 375, height: 812 },
    };

    const position = getDeckPosition(375, 812, noLayoutInfo);

    // Should use fallback positioning
    expect(position.x).toBe(150); // 120 + 30
    // Y position should be approximately center (allowing for card height variations)
    expect(position.y).toBeGreaterThan(300);
    expect(position.y).toBeLessThan(400);
  });

  test('should not change position for minor dimension changes', () => {
    const position1 = getDeckPosition(375, 812, mockLayoutInfo);

    // Simulate minor layout change
    const slightlyDifferentLayout: LayoutInfo = {
      parentLayout: { x: 0, y: 0, width: 376, height: 813 },
      boardLayout: { x: 120, y: 100, width: 256, height: 613 },
    };

    const position2 = getDeckPosition(376, 813, slightlyDifferentLayout);

    // Positions should be very close (within 2 pixels)
    expect(Math.abs(position1.x - position2.x)).toBeLessThan(2);
    expect(Math.abs(position1.y - position2.y)).toBeLessThan(2);
  });

  test('should maintain z-index for proper layering', () => {
    const position = getDeckPosition(375, 812, mockLayoutInfo);

    // Deck should always have z-index 100 for consistent layering
    expect(position.zIndex).toBe(100);
  });

  test('should not have rotation', () => {
    const position = getDeckPosition(375, 812, mockLayoutInfo);

    // Deck should never rotate
    expect(position.rotation).toBe(0);
  });

  test('position should be deterministic', () => {
    const positions = Array.from({ length: 10 }, () => getDeckPosition(375, 812, mockLayoutInfo));

    // All positions should be identical
    positions.forEach((pos, index) => {
      if (index > 0) {
        expect(pos.x).toBe(positions[0].x);
        expect(pos.y).toBe(positions[0].y);
        expect(pos.rotation).toBe(positions[0].rotation);
        expect(pos.zIndex).toBe(positions[0].zIndex);
      }
    });
  });
});
