import { describe, expect, test } from '@jest/globals';
import type { LayoutRectangle } from 'react-native';
import { getTrickCardPositionWithinBoard } from './trickCardPositions';

describe('trickCardPositions', () => {
  const mockBoardLayout: LayoutRectangle = {
    x: 50,
    y: 100,
    width: 300,
    height: 400,
  };

  describe('getTrickCardPositionWithinBoard', () => {
    test('positions cards in cross pattern when board layout provided', () => {
      // Test all 4 positions
      const positions = [0, 1, 2, 3].map(i => getTrickCardPositionWithinBoard(i, mockBoardLayout));

      // Bottom player card
      expect(positions[0]).toMatchObject({
        position: 'absolute',
        bottom: 155, // centerY (200) - spread (45)
        left: 115, // centerX (150) - 35
      });

      // Left player card
      expect(positions[1]).toMatchObject({
        position: 'absolute',
        left: 70, // centerX (150) - spread (45) - 35
        top: 155, // centerY (200) - 45
      });

      // Top player card
      expect(positions[2]).toMatchObject({
        position: 'absolute',
        top: 110, // centerY (200) - spread (45) - 45
        left: 115, // centerX (150) - 35
      });

      // Right player card
      expect(positions[3]).toMatchObject({
        position: 'absolute',
        right: 70, // centerX (150) - spread (45) - 35
        top: 155, // centerY (200) - 45
      });
    });

    test('falls back to percentage positioning without board layout', () => {
      const position = getTrickCardPositionWithinBoard(0, undefined);

      expect(position).toMatchObject({
        position: 'absolute',
        bottom: 60,
        left: '50%',
        transform: [{ translateX: -35 }],
      });
    });

    test('uses consistent spread distance for all positions', () => {
      const spread = 45;
      const cardHalfWidth = 35;
      const cardHalfHeight = 45;

      const centerX = mockBoardLayout.width / 2;
      const centerY = mockBoardLayout.height / 2;

      // Bottom position
      const bottomPos = getTrickCardPositionWithinBoard(0, mockBoardLayout);
      expect(bottomPos.bottom).toBe(centerY - spread);
      expect(bottomPos.left).toBe(centerX - cardHalfWidth);

      // Top position
      const topPos = getTrickCardPositionWithinBoard(2, mockBoardLayout);
      expect(topPos.top).toBe(centerY - spread - cardHalfHeight);
      expect(topPos.left).toBe(centerX - cardHalfWidth);
    });

    test('defaults to position 0 for invalid player index', () => {
      const invalidPosition = getTrickCardPositionWithinBoard(99, mockBoardLayout);
      const defaultPosition = getTrickCardPositionWithinBoard(0, mockBoardLayout);

      expect(invalidPosition).toEqual(defaultPosition);
    });
  });
});
