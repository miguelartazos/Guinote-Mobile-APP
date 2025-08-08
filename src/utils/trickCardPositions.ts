import type { ViewStyle, LayoutRectangle } from 'react-native';

export function getTrickCardPositionWithinBoard(
  playerIndex: number,
  boardLayout?: LayoutRectangle,
): ViewStyle {
  // If we have board layout, position relative to board center
  if (boardLayout) {
    const centerX = boardLayout.width / 2;
    const centerY = boardLayout.height / 2;
    const spread = 45; // Consistent spread for cross pattern

    const positions: ViewStyle[] = [
      // Bottom player - card closer to bottom edge
      {
        position: 'absolute',
        bottom: centerY - spread,
        left: centerX - 35,
      },
      // Left player - card closer to left edge
      {
        position: 'absolute',
        left: centerX - spread - 35,
        top: centerY - 45,
      },
      // Top player - card closer to top edge
      {
        position: 'absolute',
        top: centerY - spread - 45,
        left: centerX - 35,
      },
      // Right player - card closer to right edge
      {
        position: 'absolute',
        right: centerX - spread - 35,
        top: centerY - 45,
      },
    ];

    return positions[playerIndex] || positions[0];
  }

  // Fallback to percentage-based positioning
  const positions: ViewStyle[] = [
    {
      position: 'absolute',
      bottom: 60,
      left: '50%',
      transform: [{ translateX: -35 }],
    },
    {
      position: 'absolute',
      left: 60,
      top: '50%',
      transform: [{ translateY: -45 }],
    },
    {
      position: 'absolute',
      top: 60,
      left: '50%',
      transform: [{ translateX: -35 }],
    },
    {
      position: 'absolute',
      right: 60,
      top: '50%',
      transform: [{ translateY: -45 }],
    },
  ];

  return positions[playerIndex] || positions[0];
}
