import { describe, expect, test } from '@jest/globals';
import * as animations from './animations';

describe('animations', () => {
  test('card deal duration is 500ms as requested', () => {
    expect(animations.CARD_DEAL_DURATION).toBe(500);
  });

  test('animation durations are positive numbers', () => {
    expect(animations.CARD_DEAL_DURATION).toBeGreaterThan(0);
    expect(animations.TRICK_SLIDE_DURATION).toBeGreaterThan(0);
    expect(animations.CANTE_GLOW_DURATION).toBeGreaterThan(0);
    expect(animations.CONFETTI_DURATION).toBeGreaterThan(0);
  });

  test('scale values are reasonable', () => {
    expect(animations.CARD_HOVER_SCALE).toBeGreaterThan(1);
    expect(animations.CARD_HOVER_SCALE).toBeLessThan(1.2);
    expect(animations.CARD_DRAG_SCALE).toBeGreaterThan(1);
    expect(animations.CARD_DRAG_SCALE).toBeLessThan(1.3);
    expect(animations.BUTTON_PRESS_SCALE).toBeGreaterThan(0.9);
    expect(animations.BUTTON_PRESS_SCALE).toBeLessThan(1);
  });

  test('spring configs have required properties', () => {
    expect(animations.SPRING_CONFIG).toHaveProperty('speed');
    expect(animations.SPRING_CONFIG).toHaveProperty('bounciness');
    expect(animations.SPRING_CONFIG).toHaveProperty('useNativeDriver');
    expect(animations.SPRING_CONFIG.useNativeDriver).toBe(true);
  });

  test('animation presets have required properties', () => {
    expect(animations.FADE_IN).toHaveProperty('duration');
    expect(animations.FADE_IN).toHaveProperty('useNativeDriver');
    expect(animations.FADE_IN).toHaveProperty('easing');
    expect(animations.FADE_IN.useNativeDriver).toBe(true);
  });
});
