export type Brand<K, T> = K & { __brand: T };

export type ColorName =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'text'
  | 'textMuted'
  | 'background'
  | 'surface'
  | 'error'
  | 'warning'
  | 'white'
  | 'black'
  | 'gold'
  | 'goldDark'
  | 'yellowText'
  | 'tableGreen'
  | 'tableShadow'
  | 'cardWhite'
  | 'success'
  | 'info'
  | 'darkOverlay'
  | 'lightOverlay'
  | 'cantarGreen'
  | 'cambiarBlue'
  | 'salirRed'
  | 'orangeRanking';

export type HexColor = Brand<string, 'HexColor'>;
export type RgbaColor = Brand<string, 'RgbaColor'>;

export const colors: Record<ColorName, HexColor | RgbaColor> = {
  primary: '#0F2619' as HexColor,
  accent: '#D4A574' as HexColor,
  secondary: '#1E3A2F' as HexColor,
  text: '#F5E6D3' as HexColor,
  textMuted: '#A0A096' as HexColor,
  background: '#0A1810' as HexColor,
  surface: '#162920' as HexColor,
  error: '#CF6679' as HexColor,
  warning: '#F9AA33' as HexColor,
  white: '#FFFFFF' as HexColor,
  black: '#000000' as HexColor,

  // Spanish theme colors
  gold: '#FFD700' as HexColor,
  goldDark: '#DAA520' as HexColor,
  yellowText: '#FFEB3B' as HexColor,
  tableGreen: '#0F5F3F' as HexColor,
  tableShadow: '#063D24' as HexColor,
  cardWhite: '#FFFEF7' as HexColor,
  success: '#4CAF50' as HexColor,
  info: '#2196F3' as HexColor,
  darkOverlay: 'rgba(0,0,0,0.7)' as RgbaColor,
  lightOverlay: 'rgba(255,255,255,0.1)' as RgbaColor,

  // GuiñotePro button colors
  cantarGreen: '#28A745' as HexColor,
  cambiarBlue: '#007BFF' as HexColor,
  salirRed: '#DC3545' as HexColor,
  orangeRanking: '#FF8C00' as HexColor,
};

export function isValidColor(value: string): value is ColorName {
  return value in colors;
}

// Table color options for game customization - updated with darker Spanish theme
export const TABLE_COLORS = {
  green: '#0F5F3F' as HexColor, // Spanish green table
  blue: '#0D47A1' as HexColor,
  red: '#8B0000' as HexColor, // Dark Spanish red
  wood: '#5D4037' as HexColor,
} as const;

export type TableColorKey = keyof typeof TABLE_COLORS;
