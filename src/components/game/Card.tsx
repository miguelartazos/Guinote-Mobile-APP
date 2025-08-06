import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Card as CardType } from '../../types/game';
import { getCardImage } from '../../utils/cardImages';
import { hapticFeedback } from '../../utils/haptics';

interface CardProps {
  card: CardType;
  index?: number;
  total?: number;
  isPlayerCard?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  faceUp?: boolean;
  animationDelay?: number;
}

export const Card: React.FC<CardProps> = ({
  card,
  index = 0,
  total = 1,
  isPlayerCard = false,
  isSelected = false,
  isPlayable = false,
  onPress,
  style,
  faceUp = true,
  animationDelay = 0,
}) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(50);
  const flipRotation = useSharedValue(faceUp ? 0 : 180);

  useEffect(() => {
    // Entry animation
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });

      if (isPlayerCard && total > 1) {
        // Fan effect for player cards
        const fanAngle = 10; // degrees per card
        const centerIndex = (total - 1) / 2;
        rotation.value = withTiming((index - centerIndex) * fanAngle);
      }
    }, animationDelay);
  }, []);

  useEffect(() => {
    // Flip animation when faceUp changes
    flipRotation.value = withTiming(faceUp ? 0 : 180, { duration: 300 });
  }, [faceUp]);

  const handlePress = () => {
    if (onPress && isPlayable) {
      runOnJS(hapticFeedback)('light');

      // Press animation
      scale.value = withSpring(0.95, { damping: 15 }, () => {
        scale.value = withSpring(1, { damping: 15 });
      });

      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const perspective = 1000;

    return {
      transform: [
        { perspective },
        { scale: scale.value },
        { rotateZ: `${rotation.value}deg` },
        { rotateY: `${flipRotation.value}deg` },
        { translateY: isSelected ? -30 : translateY.value },
      ],
      opacity: interpolate(
        scale.value,
        [0, 0.5, 1],
        [0, 0.7, 1],
        Extrapolation.CLAMP,
      ),
      elevation: isSelected ? 10 : 5,
      shadowOpacity: isSelected ? 0.4 : 0.3,
      shadowRadius: isSelected ? 8 : 5,
      shadowOffset: {
        width: 0,
        height: isSelected ? 5 : 3,
      },
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    if (!isPlayable && !isSelected) return {};

    return {
      borderWidth: 2,
      borderColor: isSelected ? '#FFD700' : '#4CAF50',
      shadowColor: isSelected ? '#FFD700' : '#4CAF50',
      shadowOpacity: 0.6,
      shadowRadius: 10,
    };
  });

  const cardFaceStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      flipRotation.value,
      [0, 90, 180],
      [1, 0, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  const cardBackStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      flipRotation.value,
      [0, 90, 180],
      [0, 0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      backfaceVisibility: 'hidden',
      transform: [{ rotateY: '180deg' }],
    };
  });

  return (
    <Pressable onPress={handlePress} disabled={!isPlayable}>
      <Animated.View
        style={[styles.container, animatedStyle, glowStyle, style]}
      >
        <Animated.View style={[styles.cardFace, cardFaceStyle]}>
          <Image
            source={getCardImage(card)}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.cardBack, cardBackStyle]}>
          <Image
            source={require('../../assets/images/cards/back.png')}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 70,
    height: 100,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBack: {
    ...StyleSheet.absoluteFillObject,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});

export default Card;
