// Card hand display constants and utilities
export const CARD_HAND_CONSTANTS = {
  FAN_START_ANGLE: -15,
  FAN_ANGLE_INCREMENT: 6,
  MIDDLE_CARD_INDEX: 2.5,
  ELEVATION_MULTIPLIER: 2,
} as const;

export function calculateCardRotation(index: number, totalCards: number): number {
  const angleRange = CARD_HAND_CONSTANTS.FAN_ANGLE_INCREMENT * (totalCards - 1);
  const startAngle = -angleRange / 2;
  return startAngle + index * CARD_HAND_CONSTANTS.FAN_ANGLE_INCREMENT;
}

export function calculateCardElevation(index: number, totalCards: number): number {
  const middleIndex = (totalCards - 1) / 2;
  return Math.abs(index - middleIndex) * CARD_HAND_CONSTANTS.ELEVATION_MULTIPLIER;
}
