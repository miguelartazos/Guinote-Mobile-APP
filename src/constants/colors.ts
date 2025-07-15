export type Brand<K, T> = K & { __brand: T };

export type ColorName =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'text'
  | 'background'
  | 'surface'
  | 'error'
  | 'white'
  | 'black';

export type HexColor = Brand<string, 'HexColor'>;

export const colors: Record<ColorName, HexColor> = {
  primary: '#0F2619' as HexColor,
  accent: '#D4A574' as HexColor,
  secondary: '#1E3A2F' as HexColor,
  text: '#F5E6D3' as HexColor,
  background: '#0A1810' as HexColor,
  surface: '#162920' as HexColor,
  error: '#CF6679' as HexColor,
  white: '#FFFFFF' as HexColor,
  black: '#000000' as HexColor,
};

export function isValidColor(value: string): value is ColorName {
  return value in colors;
}
