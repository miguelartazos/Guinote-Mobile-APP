// Card rendering constants to avoid magic numbers
export const CARD_CONSTANTS = {
  BASE_WIDTH: 60,
  CORNER_OFFSET: 5,
  CORNER_FONT_BASE: 16,
  CORNER_SUIT_Y: 22,
  CENTER_SCALE_MULTIPLIER: 1.5,
  SUIT_SCALE_MULTIPLIER: 0.5,
  NUMBER_PATTERN_SPACING: 25,
  NUMBER_PATTERN_H_OFFSET: 0.6,
  ROYALTY_FONT_BASE: 20,
  ROYALTY_Y_OFFSET: -10,
  ROYALTY_SUIT_Y: 5,
} as const;

export const SUIT_PATHS = {
  oros: {
    path: 'M15,5 A10,10 0 1,1 15,25 A10,10 0 1,1 15,5',
    color: '#D4A574',
  },
  copas: {
    path: 'M15,22 L15,28 L10,28 L20,28 M15,22 C10,22 5,17 5,12 C5,7 10,5 15,10 C20,5 25,7 25,12 C25,17 20,22 15,22',
    color: '#DC2626',
  },
  espadas: {
    path: 'M15,5 L15,25 M10,10 L20,10 M15,5 C15,5 10,10 10,15 C10,20 15,25 15,25 C15,25 20,20 20,15 C20,10 15,5 15,5',
    color: '#2C5F41',
  },
  bastos: {
    path: 'M15,5 L15,25 M10,8 L20,22 M20,8 L10,22',
    color: '#8B4513',
  },
} as const;

export const VALUE_DISPLAY: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  10: 'S',
  11: 'C',
  12: 'R',
};