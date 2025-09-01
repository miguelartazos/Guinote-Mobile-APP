import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import { CARD_PLAY_DURATION, STANDARD_EASING } from '../../constants/animations';

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
  const opacity = useRef(new Animated.Value(1)).current; // Start fully opaque

  // No need to track completion since we're not calling onComplete

  useEffect(() => {
    const runAnimation = async () => {
      playSound?.();

      // Initial rotation for side players
      const initialRotation = playerPosition === 'left' ? 90 : playerPosition === 'right' ? -90 : 0;
      rotation.setValue(initialRotation);

      // Animate card from hand to table
      await new Promise(resolve => {
        Animated.parallel([
          // Move to table position - using linear easing for immediate stop
          Animated.timing(position, {
            toValue: toPosition,
            duration: CARD_PLAY_DURATION,
            easing: STANDARD_EASING,
            useNativeDriver: true,
          }),
          // Rotate to flat position on table
          Animated.timing(rotation, {
            toValue: 0,
            duration: CARD_PLAY_DURATION,
            easing: STANDARD_EASING,
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

  // Always use medium size to match the table cards exactly
  const cardSize = 'medium';

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
