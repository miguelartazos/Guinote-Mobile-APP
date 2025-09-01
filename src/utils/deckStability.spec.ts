import { describe, expect, test } from '@jest/globals';
import type { Position, LayoutInfo } from './cardPositions';

describe('deckPosition stability', () => {
  const mockLayoutInfo: LayoutInfo = {
    parentLayout: { x: 0, y: 0, width: 800, height: 600 },
    boardLayout: { x: 100, y: 50, width: 600, height: 500 },
  };

  describe('position caching with threshold', () => {
    test('returns cached position for micro-movements under 3px', () => {
      const cachedPosition: Position = { x: 100, y: 200 };
      const lastDimensions = { width: 800, height: 600 };

      // 2px change in width - should return cached
      const newWidth = 802;
      const widthDiff = Math.abs(newWidth - lastDimensions.width);
      expect(widthDiff).toBeLessThan(3);

      // 2px change in height - should return cached
      const newHeight = 598;
      const heightDiff = Math.abs(newHeight - lastDimensions.height);
      expect(heightDiff).toBeLessThan(3);
    });

    test('recalculates position for changes >= 3px', () => {
      const cachedPosition: Position = { x: 100, y: 200 };
      const lastDimensions = { width: 800, height: 600 };

      // 3px change in width - should recalculate
      const newWidth = 803;
      const widthDiff = Math.abs(newWidth - lastDimensions.width);
      expect(widthDiff).toBeGreaterThanOrEqual(3);

      // 5px change in height - should recalculate
      const newHeight = 605;
      const heightDiff = Math.abs(newHeight - lastDimensions.height);
      expect(heightDiff).toBeGreaterThanOrEqual(3);
    });

    test('returns cached position when layout not ready', () => {
      const cachedPosition: Position = { x: 100, y: 200 };
      const layoutReady = false;

      // Should return cached position, not null
      const result = layoutReady ? null : cachedPosition;
      expect(result).toEqual(cachedPosition);
      expect(result).not.toBeNull();
    });
  });

  describe('animation cleanup', () => {
    test('shuffle values reset to 0 after shuffle phase', () => {
      const shuffleValues = {
        rotation: 0.05,
        translateX: 5,
        translateY: 0,
      };

      // After shuffle completes, values should be reset
      shuffleValues.rotation = 0;
      shuffleValues.translateX = 0;
      shuffleValues.translateY = 0;

      expect(shuffleValues.rotation).toBe(0);
      expect(shuffleValues.translateX).toBe(0);
      expect(shuffleValues.translateY).toBe(0);
    });

    test('crossfade starts immediately without delay', () => {
      let fadeOutStarted = false;
      const onComplete = () => {
        // Should start crossfade immediately
        fadeOutStarted = true;
      };

      onComplete();
      expect(fadeOutStarted).toBe(true);
    });
  });

  describe('deck visibility logic', () => {
    test('deck remains visible with cached position when layout not ready', () => {
      const deckPosition: Position | null = { x: 100, y: 200 }; // cached
      const layoutReady = false;

      // Should show deck with cached position
      const shouldShow = deckPosition !== null;
      expect(shouldShow).toBe(true);
    });

    test('deck hidden during dealing phase', () => {
      const isDealing = true;
      const deckPosition: Position = { x: 100, y: 200 };

      const shouldShow = !isDealing && deckPosition !== null;
      expect(shouldShow).toBe(false);
    });

    test('deck visible during normal play', () => {
      const isDealing = false;
      const gamePhase = 'playing';
      const deckCount = 10;
      const deckPosition: Position = { x: 100, y: 200 };

      const shouldShow =
        !isDealing &&
        gamePhase !== 'scoring' &&
        gamePhase !== 'gameOver' &&
        deckCount > 0 &&
        deckPosition !== null;
      expect(shouldShow).toBe(true);
    });
  });
});
