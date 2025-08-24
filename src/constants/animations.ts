import { Easing } from 'react-native';

// Card animations
export const CARD_DEAL_DURATION = 500; // 0.5s per card as requested
export const CARD_DEAL_STAGGER = 80;
export const CARD_SHUFFLE_DURATION = 600;
export const CARD_HOVER_SCALE = 1.05;
export const CARD_DRAG_SCALE = 1.1;
export const CARD_FLIP_DURATION = 400;

// Trick collection
export const TRICK_SLIDE_DURATION = 600;
export const TRICK_STACK_OFFSET = 3;
export const TRICK_CELEBRATION_DURATION = 800;
export const SCORE_FLOAT_DURATION = 1200;
export const SCORE_FLOAT_HEIGHT = -80;

// Cante animations
export const CANTE_GLOW_DURATION = 600;
export const CANTE_FLIP_DURATION = 400;
export const CANTE_TEXT_DURATION = 500;
export const COIN_RAIN_DURATION = 1200;
export const PARTNER_NOTIFY_DURATION = 400;

// Game end celebration
export const CONFETTI_DURATION = 3000;
export const CARD_DANCE_DURATION = 2000;
export const SCORE_COUNT_DURATION = 1500;
export const REPLAY_TRANSITION_DURATION = 400;

// Micro-interactions
export const BUTTON_PRESS_SCALE = 0.95;
export const BUTTON_PRESS_DURATION = 100;
export const HAPTIC_LIGHT_DURATION = 10;
export const TRANSITION_DURATION = 300;

// Easing functions
export const SPRING_CONFIG = {
  speed: 16,
  bounciness: 8,
  useNativeDriver: true,
};

export const BOUNCE_CONFIG = {
  speed: 14,
  bounciness: 12,
  useNativeDriver: true,
};

export const SMOOTH_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);
export const BOUNCE_EASING = Easing.bounce;
export const ELASTIC_EASING = Easing.elastic(1.2);

// Animation presets
export const FADE_IN = {
  duration: 300,
  useNativeDriver: true,
  easing: SMOOTH_EASING,
};

export const FADE_OUT = {
  duration: 300,
  useNativeDriver: true,
  easing: SMOOTH_EASING,
};

export const SCALE_IN = {
  duration: 300,
  useNativeDriver: true,
  easing: BOUNCE_EASING,
};
