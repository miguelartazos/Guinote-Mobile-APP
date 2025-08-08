import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { SpanishCardData } from './SpanishCard';
import { useGameSettings } from '../../hooks/useGameSettings';
import { getCardDimensions } from '../../utils/responsive';
import {
  CARD_DEAL_DURATION,
  SMOOTH_EASING,
  getAnimationDuration,
} from '../../constants/animations';

type SingleCardDealAnimationProps = {
  card?: SpanishCardData;
  from: { x: number; y: number };
  to: { x: number; y: number; rotation: number };
  duration?: number;
  delay?: number;
  onComplete: () => void;
};

export function SingleCardDealAnimation({
  card,
  from,
  to,
  duration = CARD_DEAL_DURATION,
  delay = 0,
  onComplete,
}: SingleCardDealAnimationProps) {
  const { settings } = useGameSettings();
  const cardSize = settings?.cardSize || 'medium';
  const animSpeed = settings?.animationSpeed || 'normal';

  const position = useRef(new Animated.ValueXY(from)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animation with delay
    const startAnimation = () => {
      opacity.setValue(1);

      // Sound removed: deal sound

      const animDuration = getAnimationDuration(duration, animSpeed);

      Animated.parallel([
        Animated.timing(position, {
          toValue: to,
          duration: animDuration,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: animDuration,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: to.rotation,
          duration: animDuration,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete();
      });
    };

    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    } else {
      startAnimation();
    }
  }, [
    from,
    to,
    duration,
    delay,
    onComplete,
    position,
    opacity,
    scale,
    rotation,
    animSpeed,
  ]);

  const cardDimensions = getCardDimensions(cardSize);

  return (
    <Animated.View
      style={[
        styles.animatedCard,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { scale },
            {
              rotate: rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
          opacity,
          width: cardDimensions.hand.width,
          height: cardDimensions.hand.height,
        },
      ]}
    >
      <SpanishCard card={card} faceDown size={cardSize} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedCard: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
