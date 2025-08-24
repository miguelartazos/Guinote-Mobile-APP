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

      // With new fixed positioning:
      // small card dimensions (from getCardDimensions) are { width: 32, height: 48 }
      // spreadX = 32 * 0.9 = 28.8 (increased for maximum separation)
      // spreadY = 48 * 0.5 = 24
      // centerX = 150, centerY = 200

      // Bottom player card - moved much higher to avoid overlap
      expect(positions[0]).toMatchObject({
        position: 'absolute',
        left: 134, // centerX (150) - cardWidth/2 (16)
        top: 197.6, // centerY (200) - spreadY * 0.1 (24 * 0.1 = 2.4)
        zIndex: 1,
      });

      // Left player card - moved up more and further left
      expect(positions[1]).toMatchObject({
        position: 'absolute',
        left: expect.closeTo(105.2, 1), // centerX - spreadX - cardWidth/2 = 150 - 28.8 - 16
        top: expect.closeTo(166.4, 1), // centerY - cardHeight/2 - spreadY * 0.4 = 200 - 24 - 9.6
        zIndex: 2,
      });

      // Top player card
      expect(positions[2]).toMatchObject({
        position: 'absolute',
        left: 134, // centerX (150) - cardWidth/2 (16)
        top: expect.closeTo(125.6, 1), // centerY - spreadY * 1.1 - cardHeight = 200 - 26.4 - 48
        zIndex: 3,
      });

      // Right player card - moved up more and further right
      expect(positions[3]).toMatchObject({
        position: 'absolute',
        left: expect.closeTo(162.8, 1), // centerX + spreadX - cardWidth/2 = 150 + 28.8 - 16
        top: expect.closeTo(166.4, 1), // centerY - cardHeight/2 - spreadY * 0.4 = 200 - 24 - 9.6
        zIndex: 4,
      });
    });

    test('falls back to percentage positioning without board layout', () => {
      const position = getTrickCardPositionWithinBoard(0, undefined);

      expect(position).toMatchObject({
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: [{ translateX: -16 }], // small card width/2 (32/2)
      });
    });

    test('uses consistent spread distance for all positions', () => {
      // With new logic, cards use fixed multipliers for spreads
      const centerX = mockBoardLayout.width / 2; // 150
      const centerY = mockBoardLayout.height / 2; // 200

      // Bottom position - now slightly above center for better clearance
      const bottomPos = getTrickCardPositionWithinBoard(0, mockBoardLayout);
      expect(bottomPos.top).toBeLessThan(centerY); // Now above center to avoid overlap
      expect(bottomPos.left).toBe(134); // Centered horizontally (150 - 16)

      // Top position
      const topPos = getTrickCardPositionWithinBoard(2, mockBoardLayout);
      expect(topPos.top).toBeLessThan(centerY); // Above center
      expect(topPos.left).toBe(134); // Centered horizontally (150 - 16)
    });

    test('defaults to position 0 for invalid player index', () => {
      const invalidPosition = getTrickCardPositionWithinBoard(99, mockBoardLayout);
      const defaultPosition = getTrickCardPositionWithinBoard(0, mockBoardLayout);

      expect(invalidPosition).toEqual(defaultPosition);
    });
  });
});
