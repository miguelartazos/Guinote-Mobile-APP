import { Dimensions } from 'react-native';

const CARD_WIDTH = 70;
const CARD_HEIGHT = 100;
const OVERLAP_PERCENTAGE = 0.8; // 80% of card visible, 20% overlap
const OPPONENT_SCALE = 0.8; // Opponent cards are 80% of player card size

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
  // No overlay for bottom player - cards spread horizontally
  const cardSpacing = CARD_WIDTH + 10; // Full card width plus small gap
  const totalWidth = cardSpacing * (totalCards - 1) + CARD_WIDTH;
  const startX = (containerWidth - totalWidth) / 2;

  return {
    x: startX + index * cardSpacing + CARD_WIDTH / 2,
    y: Dimensions.get('window').height - 100,
    rotation: 0, // No rotation for bottom player
    zIndex: index,
  };
}

export function getTopPlayerCardPosition(
  index: number,
  totalCards: number,
  containerWidth: number,
): Position {
  // Apply opponent scaling
  const scaledCardWidth = CARD_WIDTH * OPPONENT_SCALE;
  const visibleCardWidth = scaledCardWidth * OVERLAP_PERCENTAGE;
  const totalWidth = visibleCardWidth * (totalCards - 1) + scaledCardWidth;
  const startX = (containerWidth - totalWidth) / 2;

  return {
    x: startX + index * visibleCardWidth + scaledCardWidth / 2,
    y: 60, // Positioned closer to top edge
    rotation: 0,
    zIndex: index,
  };
}

export function getSidePlayerCardPosition(
  index: number,
  totalCards: number,
  containerHeight: number,
  isLeft: boolean,
): Position {
  // Apply opponent scaling
  const scaledCardHeight = CARD_HEIGHT * OPPONENT_SCALE;
  const visibleCardHeight = scaledCardHeight * OVERLAP_PERCENTAGE;
  const totalHeight = visibleCardHeight * (totalCards - 1) + scaledCardHeight;

  // Center the middle of the stack at screen height / 2
  const startY = (containerHeight - totalHeight) / 2;

  const baseX = isLeft ? 60 : Dimensions.get('window').width - 60;
  const baseY = startY + index * visibleCardHeight + scaledCardHeight / 2;

  return {
    x: baseX,
    y: baseY,
    rotation: isLeft ? 90 : -90,
    zIndex: index,
  };
}

export function getPlayerCardPosition(
  playerIndex: number,
  cardIndex: number,
  totalCards: number,
): Position {
  const { width, height } = Dimensions.get('window');

  switch (playerIndex) {
    case 0: // Bottom player (user)
      return getBottomPlayerCardPosition(cardIndex, totalCards, width);
    case 1: // Top player
      return getTopPlayerCardPosition(cardIndex, totalCards, width);
    case 2: // Right player
      return getSidePlayerCardPosition(cardIndex, totalCards, height, false);
    case 3: // Left player
      return getSidePlayerCardPosition(cardIndex, totalCards, height, true);
    default:
      return { x: width / 2, y: height / 2, rotation: 0, zIndex: 0 };
  }
}

// Export the scale constant for use in other components
export const OPPONENT_CARD_SCALE = OPPONENT_SCALE;
