import { describe, expect, test } from '@jest/globals';
import type { LayoutInfo } from './cardPositions';
import {
  getBottomPlayerCardPosition,
  getTopPlayerCardPosition,
  getSidePlayerCardPosition,
  getDeckPosition,
  getTrumpPosition,
  getCenterPlayPosition,
  getCardWidth,
  getCardHeight,
  CARD_WIDTH,
  CARD_HEIGHT,
  BOTTOM_PLAYER_SCALE,
} from './cardPositions';

describe('cardPositions', () => {
  const mockScreenWidth = 375;
  const mockScreenHeight = 812;

  describe('getBottomPlayerCardPosition', () => {
    test('positions cards horizontally with slight overlap', () => {
      const totalCards = 6;
      const cardWidth = getCardWidth();
      const visibleWidth = cardWidth * 0.88; // 88% visible

      // Test first card
      const firstCard = getBottomPlayerCardPosition(
        0,
        totalCards,
        mockScreenWidth,
      );

      // Test second card - should be 88% of card width apart
      const secondCard = getBottomPlayerCardPosition(
        1,
        totalCards,
        mockScreenWidth,
      );
      expect(secondCard.x - firstCard.x).toBeCloseTo(visibleWidth, 5);

      // Test no rotation
      expect(firstCard.rotation).toBe(0);

      // Test z-index (left to right)
      expect(firstCard.zIndex).toBe(20);
      expect(secondCard.zIndex).toBe(21);
    });

    test('centers cards horizontally on screen', () => {
      const totalCards = 6;
      const cardWidth = getCardWidth();
      const visibleWidth = cardWidth * 0.88;
      const totalWidth = cardWidth + (totalCards - 1) * visibleWidth;
      const expectedStartX = (mockScreenWidth - totalWidth) / 2;

      const firstCard = getBottomPlayerCardPosition(
        0,
        totalCards,
        mockScreenWidth,
      );
      expect(firstCard.x).toBeCloseTo(expectedStartX, 5);
    });

    test('uses parent layout when provided', () => {
      const layoutInfo: LayoutInfo = {
        parentLayout: { x: 0, y: 0, width: 400, height: 600 },
      };

      const position = getBottomPlayerCardPosition(0, 6, 400, layoutInfo);

      // Should use parent height instead of window height
      const cardHeight = getCardHeight();
      expect(position.y).toBe(600 - 80 - cardHeight);
    });
  });

  describe('getTopPlayerCardPosition', () => {
    test('positions cards horizontally with compact overlap', () => {
      const totalCards = 6;
      const visibleCardWidth = getCardWidth('small') * 0.35; // 35% visible

      const firstCard = getTopPlayerCardPosition(
        0,
        totalCards,
        mockScreenWidth,
      );
      const secondCard = getTopPlayerCardPosition(
        1,
        totalCards,
        mockScreenWidth,
      );

      expect(secondCard.x - firstCard.x).toBeCloseTo(visibleCardWidth, 5);
      expect(firstCard.rotation).toBe(0);
    });

    test('uses decreasing z-index for leftmost on top', () => {
      const firstCard = getTopPlayerCardPosition(0, 6, mockScreenWidth);
      const secondCard = getTopPlayerCardPosition(1, 6, mockScreenWidth);

      expect(firstCard.zIndex).toBe(15);
      expect(secondCard.zIndex).toBe(14);
    });
  });

  describe('getSidePlayerCardPosition', () => {
    test('positions left player cards vertically with compact overlap and 90° rotation', () => {
      const totalCards = 6;
      const visibleCardHeight = getCardHeight('small') * 0.35; // 35% visible

      const firstCard = getSidePlayerCardPosition(
        0,
        totalCards,
        mockScreenHeight,
        true,
      );
      const secondCard = getSidePlayerCardPosition(
        1,
        totalCards,
        mockScreenHeight,
        true,
      );

      expect(secondCard.y - firstCard.y).toBeCloseTo(visibleCardHeight, 5);
      expect(firstCard.rotation).toBe(90);
    });

    test('positions right player cards vertically with compact overlap and -90° rotation', () => {
      const totalCards = 6;
      const visibleCardHeight = getCardHeight('small') * 0.35;

      const firstCard = getSidePlayerCardPosition(
        0,
        totalCards,
        mockScreenHeight,
        false,
      );
      const secondCard = getSidePlayerCardPosition(
        1,
        totalCards,
        mockScreenHeight,
        false,
      );

      expect(secondCard.y - firstCard.y).toBeCloseTo(visibleCardHeight, 5);
      expect(firstCard.rotation).toBe(-90);
    });

    test('uses parent layout width when provided', () => {
      const layoutInfo: LayoutInfo = {
        parentLayout: { x: 0, y: 0, width: 400, height: 600 },
      };

      const position = getSidePlayerCardPosition(0, 6, 600, false, layoutInfo);

      // Should position relative to parent width
      const cardWidth = getCardWidth('small');
      const cardHeight = getCardHeight('small');
      const rotationAdjustment = -cardHeight / 2 + cardWidth / 2;
      expect(position.x).toBeCloseTo(400 - 60 + rotationAdjustment, 5);
    });

    test('uses decreasing z-index for topmost on top', () => {
      const firstCard = getSidePlayerCardPosition(0, 6, mockScreenHeight, true);
      const secondCard = getSidePlayerCardPosition(
        1,
        6,
        mockScreenHeight,
        true,
      );

      expect(firstCard.zIndex).toBe(15);
      expect(secondCard.zIndex).toBe(14);
    });
  });

  describe('getDeckPosition', () => {
    test('positions deck at middle-left, slightly elevated', () => {
      const deckPos = getDeckPosition(mockScreenWidth, mockScreenHeight);

      // Should be on left side (about 15% from left edge)
      expect(deckPos.x).toBeLessThan(mockScreenWidth * 0.2);

      // Should be slightly below middle (about 45% from top)
      expect(deckPos.y).toBeLessThan(mockScreenHeight * 0.5);
      expect(deckPos.y).toBeGreaterThan(mockScreenHeight * 0.4);

      expect(deckPos.zIndex).toBe(100);
    });

    test('anchors to board layout when provided', () => {
      const layoutInfo: LayoutInfo = {
        boardLayout: { x: 100, y: 200, width: 300, height: 400 },
      };

      const deckPos = getDeckPosition(
        mockScreenWidth,
        mockScreenHeight,
        layoutInfo,
      );

      // Should be anchored to left of board with gap
      const cardWidth = getCardWidth('medium');
      const cardHeight = getCardHeight('medium');
      expect(deckPos.x).toBeCloseTo(100 - cardWidth - 20, 5);
      expect(deckPos.y).toBeCloseTo(200 + 200 - cardHeight / 2, 5);
    });
  });

  describe('getTrumpPosition', () => {
    test('positions trump card offset from deck', () => {
      const deckPos = getDeckPosition(mockScreenWidth, mockScreenHeight);
      const trumpPos = getTrumpPosition(mockScreenWidth, mockScreenHeight);

      expect(trumpPos.x).toBe(deckPos.x + 15);
      expect(trumpPos.y).toBe(deckPos.y + 15);
      expect(trumpPos.rotation).toBe(10);
      expect(trumpPos.zIndex).toBe(99);
    });
  });

  describe('getCenterPlayPosition', () => {
    test('positions 4 cards in center play area', () => {
      const positions = [0, 1, 2, 3].map(i =>
        getCenterPlayPosition(i, mockScreenWidth, mockScreenHeight),
      );

      // All cards should be near center
      positions.forEach(pos => {
        expect(Math.abs(pos.x - mockScreenWidth / 2)).toBeLessThan(100);
        expect(Math.abs(pos.y - mockScreenHeight / 2)).toBeLessThan(100);
        expect(pos.zIndex).toBeGreaterThanOrEqual(50);
        expect(pos.zIndex).toBeLessThanOrEqual(53);
      });
    });

    test('uses board center when board layout provided', () => {
      const layoutInfo: LayoutInfo = {
        boardLayout: { x: 50, y: 100, width: 200, height: 300 },
      };

      const position = getCenterPlayPosition(
        0,
        mockScreenWidth,
        mockScreenHeight,
        layoutInfo,
      );

      // Should be centered in board, not screen
      expect(position.x).toBe(150); // 50 + 200/2
      expect(position.y).toBe(250 + 40); // 100 + 300/2 + spread
    });

    test('cards have no rotation when played to center', () => {
      const pos = getCenterPlayPosition(0, mockScreenWidth, mockScreenHeight);
      expect(pos.rotation).toBe(0);
    });
  });
});
