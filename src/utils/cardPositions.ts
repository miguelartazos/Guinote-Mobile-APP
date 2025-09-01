import { Dimensions } from 'react-native';
import type { LayoutRectangle } from 'react-native';
import { getCardDimensions } from './responsive';

// Dynamic card dimensions - recalculated on each call
function getCardDimensionsForLayout(layoutInfo?: LayoutInfo) {
  // If we have a layout, derive orientation and size from it to avoid window-based jumps
  const w = layoutInfo?.parentLayout?.width ?? Dimensions.get('window').width;
  const h = layoutInfo?.parentLayout?.height ?? Dimensions.get('window').height;
  const landscape = w > h;
  const shortestSide = Math.min(w, h);
  const isTablet = shortestSide >= 768;
  const isSmall = shortestSide < 375;

  if (isTablet) {
    return {
      small: landscape ? { width: 45, height: 70 } : { width: 54, height: 80 },
      medium: landscape ? { width: 68, height: 105 } : { width: 76, height: 112 },
      large: landscape ? { width: 86, height: 128 } : { width: 98, height: 146 },
      hand: landscape ? { width: 65, height: 100 } : { width: 72, height: 108 },
    } as const;
  } else if (isSmall) {
    return {
      small: landscape ? { width: 32, height: 48 } : { width: 36, height: 54 },
      medium: landscape ? { width: 46, height: 69 } : { width: 52, height: 78 },
      large: landscape ? { width: 60, height: 90 } : { width: 68, height: 102 },
      hand: landscape ? { width: 45, height: 70 } : { width: 50, height: 75 },
    } as const;
  }

  return {
    small: landscape ? { width: 35, height: 55 } : { width: 32, height: 48 },
    medium: landscape ? { width: 52, height: 80 } : { width: 46, height: 70 },
    large: landscape ? { width: 58, height: 88 } : { width: 62, height: 92 },
    hand: landscape ? { width: 50, height: 78 } : { width: 48, height: 72 },
  } as const;
}

export function getCardWidth(
  size: 'small' | 'medium' | 'large' = 'large',
  _layoutInfo?: LayoutInfo,
): number {
  const cardDimensions = getCardDimensions();
  return cardDimensions[size].width;
}

export function getCardHeight(
  size: 'small' | 'medium' | 'large' = 'large',
  _layoutInfo?: LayoutInfo,
): number {
  const cardDimensions = getCardDimensions();
  return cardDimensions[size].height;
}

// For backwards compatibility
export const CARD_WIDTH = 65; // Default fallback
export const CARD_HEIGHT = 95; // Default fallback
export const BOTTOM_PLAYER_SCALE = 1; // No additional scale - using large cards directly
// Visible fractions (not overlap). 1 = no overlap
const TOP_VISIBLE = 1; // Top: no overlap
const SIDE_VISIBLE = 0.6; // Sides: compact fan that looked good before

// Position constants to avoid magic numbers
const EDGE_MARGIN_VERTICAL = 8; // Match side player container margin for symmetry
const TOP_PLAYER_Y_OFFSET = EDGE_MARGIN_VERTICAL; // Move closer to top
const SIDE_PLAYER_MARGIN = 8; // Match side container margin in GameTable styles
// Positive offset to keep bottom hand fully in-frame
const BOTTOM_PLAYER_OFFSET = 8;

export type Position = {
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
};

export type LayoutInfo = {
  parentLayout?: LayoutRectangle;
  boardLayout?: LayoutRectangle;
};

// Compute a centered board layout with stable aspect ratio
export function computeBoardLayout(parentWidth: number, parentHeight: number): LayoutRectangle {
  // Make the board occupy the full available space of the table container
  // so the green table has no margins
  const width = Math.floor(parentWidth);
  const height = Math.floor(parentHeight);
  const x = 0;
  const y = 0;
  return { x, y, width, height } as LayoutRectangle;
}

export function getBottomPlayerCardPosition(
  index: number,
  totalCards: number,
  containerWidth: number,
  layoutInfo?: LayoutInfo,
  size: 'small' | 'medium' | 'large' = 'large',
): Position {
  const cardWidth = getCardWidth(size, layoutInfo);
  const cardHeight = getCardHeight(size, layoutInfo);

  // Dynamic spacing based on available width and number of cards
  const parentWidth = layoutInfo?.parentLayout?.width ?? containerWidth;
  const maxSpacing = cardWidth * 1.1; // Maximum spacing (10% gap between cards)
  const minSpacing = cardWidth * 0.5; // Minimum spacing (50% overlap)

  // Calculate ideal spacing to fit all cards comfortably
  const availableWidth = parentWidth - 100; // Leave 50px margin on each side
  const idealSpacing = Math.min(
    maxSpacing,
    Math.max(minSpacing, availableWidth / Math.max(1, totalCards)),
  );

  const totalWidth = cardWidth + (totalCards - 1) * idealSpacing;
  const startX = (parentWidth - totalWidth) / 2;

  // Use parent layout if available, otherwise fall back to window
  const parentHeight = layoutInfo?.parentLayout?.height ?? Dimensions.get('window').height;

  return {
    x: startX + index * idealSpacing,
    y: parentHeight - BOTTOM_PLAYER_OFFSET - cardHeight,
    rotation: 0,
    zIndex: 20 + index,
  };
}

export function getTopPlayerCardPosition(
  index: number,
  totalCards: number,
  containerWidth: number,
  layoutInfo?: LayoutInfo,
): Position {
  // Top player cards with compact overlap using SMALL cards
  const cardWidth = getCardWidth('small', layoutInfo);
  const visibleCardWidth = cardWidth * TOP_VISIBLE;
  const totalWidth = visibleCardWidth * (totalCards - 1) + cardWidth;

  // Use parent or board layout for better centering
  const parentWidth = layoutInfo?.parentLayout?.width ?? containerWidth;
  const startX = (parentWidth - totalWidth) / 2;

  // Keep a consistent margin from the top edge for symmetry
  const yPosition = TOP_PLAYER_Y_OFFSET;

  return {
    x: startX + index * visibleCardWidth,
    y: yPosition,
    rotation: 0,
    zIndex: 15 - index,
  };
}

export function getSidePlayerCardPosition(
  index: number,
  totalCards: number,
  containerHeight: number,
  isLeft: boolean,
  layoutInfo?: LayoutInfo,
): Position {
  // Side player cards with compact overlap and SMALL size
  const cardHeight = getCardHeight('small', layoutInfo);
  const visibleCardHeight = cardHeight * SIDE_VISIBLE;
  const totalHeight = visibleCardHeight * (totalCards - 1) + cardHeight;

  // Center the card stack vertically
  const startY = (containerHeight - totalHeight) / 2;

  // For rotated cards, we need to account for the rotation transform
  // When rotated 90°, the card's width becomes its visual height and vice versa
  // We adjust the position to compensate for the center-based rotation pivot
  // center within a fixed side container (GameTable uses ~120 width)
  const rotatedWidth = cardHeight; // after 90deg rotation
  const containerWidth = 120;
  const sideOffset = (containerWidth - rotatedWidth) / 2;
  const parentWidth = layoutInfo?.parentLayout?.width ?? Dimensions.get('window').width;
  const baseX = isLeft
    ? SIDE_PLAYER_MARGIN + sideOffset
    : parentWidth - SIDE_PLAYER_MARGIN - containerWidth + sideOffset;
  const baseY = startY + index * visibleCardHeight; // TOP edge position

  return {
    x: baseX,
    y: baseY,
    rotation: isLeft ? 90 : -90,
    zIndex: 15 - index, // Decreasing z-index so topmost is on top
  };
}

export function getDeckPosition(
  screenWidth: number,
  screenHeight: number,
  layoutInfo?: LayoutInfo,
): Position {
  // Always use consistent positioning logic to avoid jumps
  const cardHeight = getCardHeight('medium', layoutInfo);
  const leftRailWidth = 120;
  const safeMargin = 30;

  // Use board layout if available for better centering
  if (layoutInfo?.boardLayout && layoutInfo.boardLayout.width > 0) {
    const board = layoutInfo.boardLayout;
    return {
      x: board.x + leftRailWidth + safeMargin,
      y: board.y + board.height / 2 - cardHeight / 2,
      rotation: 0,
      zIndex: 100,
    };
  }

  // Fallback with consistent positioning
  return {
    x: leftRailWidth + safeMargin,
    y: screenHeight * 0.45 - cardHeight / 2,
    rotation: 0,
    zIndex: 100,
  };
}

export function getTrumpPosition(
  screenWidth: number,
  screenHeight: number,
  layoutInfo?: LayoutInfo,
): Position {
  // Trump card positioned to the right of deck, rotated 180 degrees from original
  const deckPos = getDeckPosition(screenWidth, screenHeight, layoutInfo);
  const cardWidth = getCardWidth('medium', layoutInfo);
  // Position to the right of deck with card rotated -90deg (270deg)
  // When rotated, the card's width becomes height visually
  return {
    x: deckPos.x + cardWidth - 10, // Position to right of deck
    y: deckPos.y + 15, // Align with middle of deck (was too low before)
    rotation: -90, // Rotate trump -90deg (shows on right side)
    zIndex: 99,
  };
}

export function getCenterPlayPosition(
  playerIndex: number,
  screenWidth: number,
  screenHeight: number,
  layoutInfo?: LayoutInfo,
): Position {
  // Use board layout if available for precise centering
  const board = layoutInfo?.boardLayout;
  const centerX = board ? board.x + board.width / 2 : screenWidth / 2;
  const centerY = board ? board.y + board.height / 2 : screenHeight / 2;
  const spread = 40; // Distance from center for each card

  // Position cards in a cross pattern
  const positions: Position[] = [
    { x: centerX, y: centerY + spread, rotation: 0, zIndex: 50 }, // Bottom
    { x: centerX - spread, y: centerY, rotation: 0, zIndex: 51 }, // Left
    { x: centerX, y: centerY - spread, rotation: 0, zIndex: 52 }, // Top
    { x: centerX + spread, y: centerY, rotation: 0, zIndex: 53 }, // Right
  ];

  return positions[playerIndex] || positions[0];
}

export function getPlayerCardPosition(
  playerIndex: number,
  cardIndex: number,
  totalCards: number,
  _size?: 'small' | 'medium' | 'large',
  layoutInfo?: LayoutInfo,
): Position {
  const parentLayout = layoutInfo?.parentLayout;
  const width = parentLayout?.width ?? Dimensions.get('window').width;
  const height = parentLayout?.height ?? Dimensions.get('window').height;

  switch (playerIndex) {
    case 0:
      return getBottomPlayerCardPosition(
        cardIndex,
        totalCards,
        width,
        layoutInfo,
        _size || 'large',
      );
    case 1:
      return getSidePlayerCardPosition(cardIndex, totalCards, height, false, layoutInfo);
    case 2:
      return getTopPlayerCardPosition(cardIndex, totalCards, width, layoutInfo);
    case 3:
      return getSidePlayerCardPosition(cardIndex, totalCards, height, true, layoutInfo);
    default:
      return { x: width / 2, y: height / 2, rotation: 0, zIndex: 0 };
  }
}

// Export scale constants for use in other components
export const OPPONENT_CARD_SCALE = 1; // Normal size for top and side players
