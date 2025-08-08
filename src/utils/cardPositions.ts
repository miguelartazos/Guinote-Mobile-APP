import { Dimensions } from 'react-native';
import type { LayoutRectangle } from 'react-native';
import { getCardDimensions } from './responsive';

// Dynamic card dimensions - recalculated on each call
export function getCardWidth(
  size: 'small' | 'medium' | 'large' = 'large',
): number {
  const cardDimensions = getCardDimensions();
  return cardDimensions[size].width;
}

export function getCardHeight(
  size: 'small' | 'medium' | 'large' = 'large',
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
const SIDE_PLAYER_MARGIN = 60; // Keep current side spacing
const BOTTOM_PLAYER_OFFSET = EDGE_MARGIN_VERTICAL; // Move closer to bottom

type Position = {
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
export function computeBoardLayout(
  parentWidth: number,
  parentHeight: number,
): LayoutRectangle {
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
): Position {
  const cardWidth = getCardWidth();
  const cardHeight = getCardHeight();
  const visibleWidth = cardWidth * 0.82; // 18% overlap for bottom hand (more compact)
  const totalWidth = cardWidth + (totalCards - 1) * visibleWidth;

  // Use parent layout width if available for proper centering
  const parentWidth = layoutInfo?.parentLayout?.width ?? containerWidth;
  const startX = (parentWidth - totalWidth) / 2;

  // Use parent layout if available, otherwise fall back to window
  const parentHeight =
    layoutInfo?.parentLayout?.height ?? Dimensions.get('window').height;

  return {
    x: startX + index * visibleWidth,
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
  const cardWidth = getCardWidth('small');
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
  const cardWidth = getCardWidth('small');
  const cardHeight = getCardHeight('small');
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
  // If board layout available, anchor to left side of board
  if (layoutInfo?.boardLayout) {
    const board = layoutInfo.boardLayout;
    const cardWidth = getCardWidth('medium');
    const cardHeight = getCardHeight('medium');
    // Position deck near the middle-left of the board
    return {
      x: Math.floor(board.x + board.width * 0.26 - cardWidth / 2),
      y: board.y + board.height / 2 - cardHeight / 2, // Vertically centered with board
      rotation: 0,
      zIndex: 100,
    };
  }

  // Fallback to percentage-based positioning
  return {
    x: screenWidth * 0.12, // slightly further left to leave more center space
    y: screenHeight * 0.45, // 45% from top (slightly below middle)
    rotation: 0,
    zIndex: 100,
  };
}

export function getTrumpPosition(
  screenWidth: number,
  screenHeight: number,
  layoutInfo?: LayoutInfo,
): Position {
  // Trump card positioned slightly offset from deck
  const deckPos = getDeckPosition(screenWidth, screenHeight, layoutInfo);
  const cardOffset = 12; // Fixed pixel offset for trump card
  return {
    x: deckPos.x + cardOffset, // Slightly to the right
    y: deckPos.y + cardOffset, // Slightly below
    rotation: 90, // Rotate trump 90deg like reference
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
      );
    case 1:
      return getSidePlayerCardPosition(
        cardIndex,
        totalCards,
        height,
        false,
        layoutInfo,
      );
    case 2:
      return getTopPlayerCardPosition(cardIndex, totalCards, width, layoutInfo);
    case 3:
      return getSidePlayerCardPosition(
        cardIndex,
        totalCards,
        height,
        true,
        layoutInfo,
      );
    default:
      return { x: width / 2, y: height / 2, rotation: 0, zIndex: 0 };
  }
}

// Export scale constants for use in other components
export const OPPONENT_CARD_SCALE = 1; // Normal size for top and side players
