import type { ViewStyle, LayoutRectangle } from 'react-native';
import { getCardDimensions } from './responsive';

export function getTrickCardPositionWithinBoard(
  playerIndex: number,
  boardLayout?: LayoutRectangle,
): ViewStyle {
  // If we have board layout, place cards around the board center with
  // symmetric offsets toward each player's side (classic cross layout).
  if (boardLayout) {
    const { width, height } = boardLayout;
    const dims = getCardDimensions().medium; // Use medium dimensions for larger played cards
    const centerX = width / 2;
    const centerY = height / 2;

    // Adjusted offsets for medium cards - increased spacing for better visibility
    // Cards should be clearly separated in the center
    const spreadX = dims.width * 0.85; // 85% of card width for good horizontal separation
    const spreadY = dims.height * 0.45; // 45% of card height offset vertically

    const positions: ViewStyle[] = [
      // Bottom player - moved much higher to avoid overlap with hand cards
      {
        position: 'absolute',
        left: Math.round(centerX - dims.width / 2),
        top: Math.round(centerY - spreadY * 0.1), // Moved significantly higher - almost at center
        zIndex: 1,
      },
      // Left player - slightly left of center, moved up more
      {
        position: 'absolute',
        left: Math.round(centerX - spreadX - dims.width / 2),
        top: Math.round(centerY - dims.height / 2 - spreadY * 0.4), // More upward adjustment
        zIndex: 2,
      },
      // Top player - moved lower but still clearly separated
      {
        position: 'absolute',
        left: Math.round(centerX - dims.width / 2),
        top: Math.round(centerY - spreadY * 1.1 - dims.height), // Adjusted for new balance
        zIndex: 3,
      },
      // Right player - slightly right of center, moved up more
      {
        position: 'absolute',
        left: Math.round(centerX + spreadX - dims.width / 2),
        top: Math.round(centerY - dims.height / 2 - spreadY * 0.4), // More upward adjustment
        zIndex: 4,
      },
    ];

    return positions[playerIndex] || positions[0];
  }

  // Fallback to percentage-based positioning
  const dims = getCardDimensions().medium;
  const margin = 24;
  const positions: ViewStyle[] = [
    {
      position: 'absolute',
      bottom: margin,
      left: '50%',
      transform: [{ translateX: -dims.width / 2 }],
    },
    {
      position: 'absolute',
      left: margin,
      top: '50%',
      transform: [{ translateY: -dims.height / 2 }],
    },
    {
      position: 'absolute',
      top: margin,
      left: '50%',
      transform: [{ translateX: -dims.width / 2 }],
    },
    {
      position: 'absolute',
      right: margin,
      top: '50%',
      transform: [{ translateY: -dims.height / 2 }],
    },
  ];

  return positions[playerIndex] || positions[0];
}
