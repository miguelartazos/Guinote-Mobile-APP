import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import {
  SMOOTH_EASING,
  CARD_PLAY_DURATION,
  CARD_PLAY_INITIAL_OPACITY,
} from '../../constants/animations';

type CardPlayAnimationProps = {
  card: SpanishCardData;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  playerPosition: 'bottom' | 'left' | 'top' | 'right';
  playSound?: () => void;
};

export function CardPlayAnimation({
  card,
  fromPosition,
  toPosition,
  playerPosition,
  playSound,
}: CardPlayAnimationProps) {
  // Animation values
  const position = useRef(new Animated.ValueXY(fromPosition)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(CARD_PLAY_INITIAL_OPACITY)).current; // Start slightly transparent for subtle effect
  const scale = useRef(new Animated.Value(1)).current; // Add scale animation

  // No need to track completion since we're not calling onComplete

  useEffect(() => {
    const runAnimation = async () => {
      playSound?.();

      // Initial rotation for side players
      const initialRotation = playerPosition === 'left' ? 90 : playerPosition === 'right' ? -90 : 0;
      rotation.setValue(initialRotation);

      // Calculate target scale
      // Cards from side/top players (small) need to scale up to match medium size on table
      // Medium cards are ~1.4x larger than small cards based on dimensions
      const targetScale = playerPosition === 'bottom' ? 1 : 1.4;

      // Animate card from hand to table
      await new Promise(resolve => {
        Animated.parallel([
          // Move to table position - using linear easing for immediate stop
          Animated.timing(position, {
            toValue: toPosition,
            duration: CARD_PLAY_DURATION,
            easing: Easing.linear, // Linear for no floating at the end
            useNativeDriver: true,
          }),
          // Rotate to flat position on table
          Animated.timing(rotation, {
            toValue: 0,
            duration: CARD_PLAY_DURATION,
            easing: SMOOTH_EASING, // Keep smooth for rotation
            useNativeDriver: true,
          }),
          // Scale animation for non-bottom players
          Animated.timing(scale, {
            toValue: targetScale,
            duration: CARD_PLAY_DURATION,
            easing: SMOOTH_EASING, // Keep smooth for scale
            useNativeDriver: true,
          }),
          // Subtle opacity animation
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => resolve(null));
      });

      // Don't call onComplete immediately - let the animation stay visible
      // The parent will handle cleanup when the actual card is placed
      // This prevents the flicker/disappear issue
    };

    // Start animation immediately
    runAnimation();

    // No cleanup needed since we're not using timers
  }, []);

  // Determine card size based on player
  const cardSize = playerPosition === 'bottom' ? 'large' : 'small';

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View
        style={[
          styles.animatedCard,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              {
                rotate: rotation.interpolate({
                  inputRange: [-90, 0, 90],
                  outputRange: ['-90deg', '0deg', '90deg'],
                }),
              },
              { scale },
            ],
            opacity,
          },
        ]}
      >
        <SpanishCard card={card} size={cardSize} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  animatedCard: {
    position: 'absolute',
    zIndex: 1000, // Above everything during animation
  },
});
