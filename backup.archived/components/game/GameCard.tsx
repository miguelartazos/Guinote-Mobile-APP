import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { SpanishCard } from './SpanishCard';
import type { Card } from '../../types/game.types';

type AnimationType = 'spring' | 'timing';

interface GameCardProps {
  card: Card;
  position: { x: number; y: number; rotation: number; zIndex: number };
  scale?: number;
  faceUp?: boolean;
  selectable?: boolean;
  animationType?: AnimationType;
  animationDuration?: number;
  onAnimationComplete?: () => void;
  onPress?: () => void;
}

export function GameCard({
  card,
  position,
  scale = 1,
  faceUp = false,
  selectable = false,
  animationType = 'spring',
  animationDuration = 2000,
  onAnimationComplete,
  onPress,
}: GameCardProps) {
  const translateX = useSharedValue(position.x);
  const translateY = useSharedValue(position.y);
  const rotation = useSharedValue(position.rotation);
  const scaleValue = useSharedValue(scale);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (animationType === 'spring') {
      translateX.value = withSpring(position.x, {
        damping: 15,
        stiffness: 120,
      });
      translateY.value = withSpring(position.y, {
        damping: 15,
        stiffness: 120,
      });
      rotation.value = withSpring(position.rotation, {
        damping: 15,
        stiffness: 120,
      });
      scaleValue.value = withSpring(
        scale,
        {
          damping: 15,
          stiffness: 120,
        },
        () => {
          if (onAnimationComplete) {
            ('worklet');
            runOnJS(onAnimationComplete)();
          }
        },
      );
    } else {
      translateX.value = withTiming(position.x, {
        duration: animationDuration,
        easing: Easing.inOut(Easing.cubic),
      });
      translateY.value = withTiming(position.y, {
        duration: animationDuration,
        easing: Easing.inOut(Easing.cubic),
      });
      rotation.value = withTiming(position.rotation, {
        duration: animationDuration,
        easing: Easing.inOut(Easing.cubic),
      });
      scaleValue.value = withTiming(
        scale,
        {
          duration: animationDuration,
          easing: Easing.inOut(Easing.cubic),
        },
        () => {
          if (onAnimationComplete) {
            ('worklet');
            runOnJS(onAnimationComplete)();
          }
        },
      );
    }
  }, [position, scale, animationType, animationDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: translateX.value - 35, // Half card width
    top: translateY.value - 50, // Half card height
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scaleValue.value },
    ],
    opacity: opacity.value,
    zIndex: position.zIndex,
  }));

  const handlePress = () => {
    if (onPress && selectable) {
      onPress();
    }
  };

  return (
    <Animated.View
      style={animatedStyle}
      pointerEvents={selectable ? 'auto' : 'none'}
    >
      <SpanishCard
        card={card}
        size="small"
        faceUp={faceUp}
        selectable={selectable}
        onPress={handlePress}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({});
