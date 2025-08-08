import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import Card from './Card';
import { Card as CardType } from '../../types/game';
import {
  getBottomPlayerCardPosition,
  getCardWidth,
  getCardHeight,
  BOTTOM_PLAYER_SCALE,
} from '../../utils/cardPositions';
import type { CardSlot } from '../../types/slots.types';

interface PlayerHandProps {
  slots: CardSlot[]; // Always 6 slots
  onCardPress: (card: CardType, slotIndex: number) => void;
  canPlay: (card: CardType) => boolean;
  isCurrentPlayer?: boolean;
  isDealing?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  slots,
  onCardPress,
  canPlay,
  isCurrentPlayer = true,
  isDealing = false,
}) => {
  const { width } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      {slots.map(slot => {
        // Get absolute position for this slot
        const position = getBottomPlayerCardPosition(slot.slotIndex, 6, width);

        // Skip rendering empty slots but maintain their space
        if (slot.card === null) {
          return null;
        }

        const isPlayable = canPlay(slot.card) && isCurrentPlayer;

        return (
          <AnimatedCard
            key={slot.card.id}
            card={slot.card}
            position={position}
            isPlayable={isPlayable}
            onPress={() => onCardPress(slot.card, slot.slotIndex)}
            isDealing={isDealing}
          />
        );
      })}
    </View>
  );
};

interface AnimatedCardProps {
  card: CardType;
  position: { x: number; y: number; rotation: number; zIndex: number };
  isPlayable: boolean;
  onPress: () => void;
  isDealing: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  card,
  position,
  isPlayable,
  onPress,
  isDealing,
}) => {
  // Use absolute positioning directly
  const translateX = useSharedValue(position.x);
  const translateY = useSharedValue(position.y);
  const rotation = useSharedValue(position.rotation);
  const scale = useSharedValue(1); // No additional scale needed
  const opacity = useSharedValue(isDealing ? 0 : 1);

  useEffect(() => {
    // Animate to position if it changes
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
    opacity.value = withSpring(isDealing ? 0 : 1, {
      damping: 15,
      stiffness: 120,
    });
  }, [position, isDealing, translateX, translateY, rotation, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: translateX.value, // Use position directly as LEFT edge
    top: translateY.value, // Use position directly as TOP edge
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    opacity: opacity.value,
    zIndex: position.zIndex,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Card
        card={card}
        index={0}
        total={1}
        isPlayerCard={true}
        isPlayable={isPlayable}
        onPress={onPress}
        faceUp={true}
        animationDelay={0}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
});

export default PlayerHand;
