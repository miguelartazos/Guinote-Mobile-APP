import { describe, expect, test } from '@jest/globals';
import { colors, isValidColor } from './colors';

describe('colors', () => {
  test('exports all required color values', () => {
    expect(colors.primary).toBe('#0F2619');
    expect(colors.accent).toBe('#D4A574');
    expect(colors.secondary).toBe('#1E3A2F');
    expect(colors.text).toBe('#F5E6D3');
    expect(colors.background).toBe('#0A1810');
    expect(colors.surface).toBe('#162920');
    expect(colors.error).toBe('#CF6679');
    expect(colors.white).toBe('#FFFFFF');
    expect(colors.black).toBe('#000000');
  });

  test('color values are properly formatted', () => {
    const hexPattern = /^#[0-9A-F]{6}$/;
    const rgbaPattern = /^rgba\(\d+,\d+,\d+,[\d.]+\)$/;

    Object.values(colors).forEach(color => {
      const isHex = hexPattern.test(color);
      const isRgba = rgbaPattern.test(color);
      expect(isHex || isRgba).toBe(true);
    });
  });
});

describe('isValidColor', () => {
  test('validates correct color keys', () => {
    expect(isValidColor('primary')).toBe(true);
    expect(isValidColor('accent')).toBe(true);
    expect(isValidColor('secondary')).toBe(true);
  });

  test('rejects invalid color keys', () => {
    expect(isValidColor('invalid')).toBe(false);
    expect(isValidColor('')).toBe(false);
    expect(isValidColor('PRIMARY')).toBe(false);
  });
});
