import { Dimensions } from 'react-native';
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
const TOP_SIDE_OVERLAP = 0.9; // 90% visible, 10% overlap for top and side players

// Position constants to avoid magic numbers
const TOP_PLAYER_Y_OFFSET = 80; // Distance from top edge for top player
const SIDE_PLAYER_MARGIN = 80; // Distance from side edges for left/right players
const BOTTOM_PLAYER_OFFSET = 70; // Distance from bottom edge for bottom player

type Position = {
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
};

export function getBottomPlayerCardPosition(
  index: number,
  totalCards: number,
  containerWidth: number,
): Position {
  // Bottom player cards use large size with NO overlap (side by side)
  const cardWidth = getCardWidth(); // Use dynamic card width
  const totalWidth = cardWidth * totalCards;
  const startX = (containerWidth - totalWidth) / 2;

  // Match GameTable positioning exactly:
  // Container is at bottom: 80, cards at bottom: -10 relative = 70 from screen bottom
  // But since we use top positioning, we need height - (BOTTOM_PLAYER_OFFSET + cardHeight)
  const cardHeight = getCardHeight();

  return {
    x: startX + index * cardWidth, // LEFT edge position
    y: Dimensions.get('window').height - BOTTOM_PLAYER_OFFSET - cardHeight, // TOP edge position
    rotation: 0,
    zIndex: 20 + index, // Match GameTable's z-index (20 + index)
  };
}

export function getTopPlayerCardPosition(
  index: number,
  totalCards: number,
  containerWidth: number,
): Position {
  // Top player cards have 10% overlap (90% visible) and use SMALL cards
  const cardWidth = getCardWidth('small');
  const visibleCardWidth = cardWidth * TOP_SIDE_OVERLAP;
  const totalWidth = visibleCardWidth * (totalCards - 1) + cardWidth;
  const startX = (containerWidth - totalWidth) / 2;

  return {
    x: startX + index * visibleCardWidth, // LEFT edge position
    y: TOP_PLAYER_Y_OFFSET, // TOP edge position
    rotation: 0,
    zIndex: 15 - index, // Decreasing z-index so leftmost is on top
  };
}

export function getSidePlayerCardPosition(
  index: number,
  totalCards: number,
  containerHeight: number,
  isLeft: boolean,
): Position {
  // Side player cards have 10% overlap (90% visible) and use SMALL cards
  const cardWidth = getCardWidth('small');
  const cardHeight = getCardHeight('small');
  const visibleCardHeight = cardHeight * TOP_SIDE_OVERLAP;
  const totalHeight = visibleCardHeight * (totalCards - 1) + cardHeight;

  // Center the card stack vertically
  const startY = (containerHeight - totalHeight) / 2;

  // For rotated cards, we need to account for the rotation transform
  // When rotated 90°, the card's width becomes its visual height and vice versa
  // We adjust the position to compensate for the center-based rotation pivot
  const rotationAdjustment = -cardHeight / 2 + cardWidth / 2;
  const baseX = isLeft
    ? SIDE_PLAYER_MARGIN + rotationAdjustment
    : Dimensions.get('window').width - SIDE_PLAYER_MARGIN + rotationAdjustment;
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
): Position {
  // Deck positioned at middle-left, slightly elevated
  return {
    x: screenWidth * 0.2, // 20% from left edge
    y: screenHeight * 0.4, // 40% from top (slightly above middle)
    rotation: 0,
    zIndex: 100,
  };
}

export function getTrumpPosition(
  screenWidth: number,
  screenHeight: number,
): Position {
  // Trump card positioned below the deck
  const deckPos = getDeckPosition(screenWidth, screenHeight);
  const cardHeight = getCardHeight();
  return {
    x: deckPos.x,
    y: deckPos.y + cardHeight * 0.3, // Slightly below deck
    rotation: 0,
    zIndex: 99,
  };
}

export function getCenterPlayPosition(
  playerIndex: number,
  screenWidth: number,
  screenHeight: number,
): Position {
  // Center play area for trick cards (4 positions)
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
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
  size?: 'small' | 'medium' | 'large',
): Position {
  const { width, height } = Dimensions.get('window');

  switch (playerIndex) {
    case 0: // Bottom player (user) - always uses large cards
      return getBottomPlayerCardPosition(cardIndex, totalCards, width);
    case 1: // Right player (counter-clockwise from bottom) - uses small cards
      return getSidePlayerCardPosition(cardIndex, totalCards, height, false);
    case 2: // Top player - uses small cards
      return getTopPlayerCardPosition(cardIndex, totalCards, width);
    case 3: // Left player - uses small cards
      return getSidePlayerCardPosition(cardIndex, totalCards, height, true);
    default:
      return { x: width / 2, y: height / 2, rotation: 0, zIndex: 0 };
  }
}

// Export scale constants for use in other components
export const OPPONENT_CARD_SCALE = 1; // Normal size for top and side players
