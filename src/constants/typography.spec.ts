import { describe, expect, test } from '@jest/globals';
import { typography } from './typography';

describe('typography', () => {
  test('defines large font sizes for older users', () => {
    expect(typography.fontSize.xs).toBe(14);
    expect(typography.fontSize.sm).toBe(16);
    expect(typography.fontSize.md).toBe(18);
    expect(typography.fontSize.lg).toBe(22);
    expect(typography.fontSize.xl).toBe(28);
    expect(typography.fontSize.xxl).toBe(36);
    expect(typography.fontSize.xxxl).toBe(48);
  });

  test('defines font weights', () => {
    expect(typography.fontWeight.regular).toBe('400');
    expect(typography.fontWeight.medium).toBe('500');
    expect(typography.fontWeight.semibold).toBe('600');
    expect(typography.fontWeight.bold).toBe('700');
  });

  test('defines line heights for readability', () => {
    expect(typography.lineHeight.tight).toBe(1.2);
    expect(typography.lineHeight.normal).toBe(1.5);
    expect(typography.lineHeight.relaxed).toBe(1.8);
  });
});