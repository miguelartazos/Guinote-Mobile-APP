import { describe, expect, test } from '@jest/globals';
import { dimensions } from './dimensions';

describe('dimensions', () => {
  test('defines minimum touch target size for accessibility', () => {
    expect(dimensions.touchTarget.minimum).toBe(48);
    expect(dimensions.touchTarget.comfortable).toBe(56);
    expect(dimensions.touchTarget.large).toBe(64);
  });

  test('defines consistent spacing values', () => {
    expect(dimensions.spacing.xs).toBe(4);
    expect(dimensions.spacing.sm).toBe(8);
    expect(dimensions.spacing.md).toBe(16);
    expect(dimensions.spacing.lg).toBe(24);
    expect(dimensions.spacing.xl).toBe(32);
    expect(dimensions.spacing.xxl).toBe(48);
  });

  test('defines border radius values', () => {
    expect(dimensions.borderRadius.sm).toBe(4);
    expect(dimensions.borderRadius.md).toBe(8);
    expect(dimensions.borderRadius.lg).toBe(16);
    expect(dimensions.borderRadius.xl).toBe(24);
  });

  test('defines screen padding', () => {
    expect(dimensions.screen.paddingHorizontal).toBe(16);
    expect(dimensions.screen.paddingVertical).toBe(24);
  });
});
