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
    const dims = getCardDimensions().medium;
    const centerX = width / 2;
    const centerY = height / 2;

    // Spread distances based on card size and board size for balance
    const spreadX = Math.max(dims.width * 0.9, Math.min(width * 0.12, dims.width * 1.6));
    const spreadY = Math.max(dims.height * 1.0, Math.min(height * 0.12, dims.height * 1.8));

    const positions: ViewStyle[] = [
      // Bottom player
      {
        position: 'absolute',
        left: centerX - dims.width / 2,
        top: centerY + spreadY - dims.height / 2,
      },
      // Left player
      {
        position: 'absolute',
        left: centerX - spreadX - dims.width / 2,
        top: centerY - dims.height / 2,
      },
      // Top player
      {
        position: 'absolute',
        left: centerX - dims.width / 2,
        top: centerY - spreadY - dims.height / 2,
      },
      // Right player
      {
        position: 'absolute',
        left: centerX + spreadX - dims.width / 2,
        top: centerY - dims.height / 2,
      },
    ];

    return positions[playerIndex] || positions[0];
  }

  // Fallback to percentage-based positioning
  const dims = getCardDimensions().medium;
  const margin = 24;
  const positions: ViewStyle[] = [
    { position: 'absolute', bottom: margin, left: '50%', transform: [{ translateX: -dims.width / 2 }] },
    { position: 'absolute', left: margin, top: '50%', transform: [{ translateY: -dims.height / 2 }] },
    { position: 'absolute', top: margin, left: '50%', transform: [{ translateX: -dims.width / 2 }] },
    { position: 'absolute', right: margin, top: '50%', transform: [{ translateY: -dims.height / 2 }] },
  ];

  return positions[playerIndex] || positions[0];
}
