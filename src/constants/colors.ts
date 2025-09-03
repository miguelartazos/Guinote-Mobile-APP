export type Brand<K, T> = K & { __brand: T };

export type ColorName =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'text'
  | 'textMuted'
  | 'textSecondary'
  | 'background'
  | 'surface'
  | 'border'
  | 'error'
  | 'warning'
  | 'white'
  | 'black'
  | 'gold'
  | 'goldDark'
  | 'goldBright'
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
  | 'orangeRanking'
  | 'primaryButton'
  | 'primaryButtonText'
  | 'secondaryButton'
  | 'secondaryButtonText'
  | 'cardBackground'
  | 'cardBorder'
  | 'iconPrimary'
  | 'iconSecondary'
  | 'successLight'
  | 'warningLight'
  | 'dangerLight'
  | 'mediterraneanTerracotta'
  | 'mediterraneanOlive'
  | 'mediterraneanSand'
  | 'mediterraneanSea'
  | 'neutralWarm'
  | 'neutralLight'
  | 'quickMatchBlue'
  | 'friendsGreen'
  | 'botOrange'
  | 'localPurple';

export type HexColor = Brand<string, 'HexColor'>;
export type RgbaColor = Brand<string, 'RgbaColor'>;

export const colors: Record<ColorName, HexColor | RgbaColor> = {
  // Original dark Spanish theme with professional enhancements
  primary: '#0F2619' as HexColor,
  accent: '#D4A574' as HexColor, // Professional gold
  secondary: '#1E3A2F' as HexColor,
  text: '#F5E6D3' as HexColor,
  textMuted: '#A0A096' as HexColor,
  textSecondary: '#C0C0B0' as HexColor,
  background: '#0A1810' as HexColor,
  surface: '#162920' as HexColor,
  border: '#2A3F32' as HexColor,
  error: '#CF6679' as HexColor,
  warning: '#F9AA33' as HexColor,
  white: '#FFFFFF' as HexColor,
  black: '#000000' as HexColor,

  // Spanish theme colors
  gold: '#FFD700' as HexColor,
  goldDark: '#DAA520' as HexColor,
  goldBright: '#FFFF00' as HexColor,
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

  // Enhanced button colors for better contrast
  primaryButton: '#D4A574' as HexColor, // Gold for primary actions
  primaryButtonText: '#0F2619' as HexColor, // Dark text on gold
  secondaryButton: '#1E3A2F' as HexColor, // Dark green for secondary
  secondaryButtonText: '#F5E6D3' as HexColor, // Light text

  // Card and component colors
  cardBackground: '#162920' as HexColor, // Dark surface
  cardBorder: '#2A3F32' as HexColor, // Subtle border
  iconPrimary: '#D4A574' as HexColor, // Gold icons
  iconSecondary: '#A0A096' as HexColor, // Muted icons

  // Status colors (for light theme)
  successLight: 'rgba(76, 175, 80, 0.1)' as RgbaColor,
  warningLight: 'rgba(249, 170, 51, 0.1)' as RgbaColor,
  dangerLight: 'rgba(207, 102, 121, 0.1)' as RgbaColor,

  // Mediterranean palette additions
  mediterraneanTerracotta: '#D05D47' as HexColor,
  mediterraneanOlive: '#9A6C63' as HexColor,
  mediterraneanSand: '#B4840D' as HexColor,
  mediterraneanSea: '#008989' as HexColor,
  neutralWarm: '#F7F1EA' as HexColor,
  neutralLight: '#FEFEFE' as HexColor,

  // Game mode colors
  quickMatchBlue: '#2196F3' as HexColor,
  friendsGreen: '#4CAF50' as HexColor,
  botOrange: '#FF9800' as HexColor,
  localPurple: '#9C27B0' as HexColor,
};

export function isValidColor(value: string): value is ColorName {
  return value in colors;
}

// Table color options for game customization - Mediterranean theme
export const TABLE_COLORS = {
  green: '#2E7D32' as HexColor, // Mediterranean green
  blue: '#1565C0' as HexColor, // Deep sea blue
  terracotta: '#A0522D' as HexColor, // Clay terracotta
  wood: '#6D4C41' as HexColor, // Warm wood
} as const;

export type TableColorKey = keyof typeof TABLE_COLORS;
