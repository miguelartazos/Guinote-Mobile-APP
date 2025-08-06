import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Card from './Card';
import { Card as CardType } from '../../types/game';
import { LAYOUT } from './PlayerPositions';
import { getBottomPlayerCardPosition } from '../../utils/cardPositions';

interface PlayerHandProps {
  cards: CardType[];
  onCardPress: (card: CardType, index: number) => void;
  canPlay: (card: CardType) => boolean;
  isCurrentPlayer?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  onCardPress,
  canPlay,
  isCurrentPlayer = true,
}) => {
  const totalCards = cards.length;
  const { width } = Dimensions.get('window');

  const getCardPosition = (index: number) => {
    // Use the same positioning as dealing animations
    const position = getBottomPlayerCardPosition(index, totalCards, width);

    // Convert absolute positions to relative positions from center
    const centerX = width / 2;
    const centerY = Dimensions.get('window').height - 100;

    return {
      x: position.x - centerX,
      y: position.y - centerY,
      rotation: position.rotation,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.handContainer}>
        {cards.map((card, index) => {
          return (
            <AnimatedCard
              key={card.id}
              card={card}
              index={index}
              totalCards={totalCards}
              getCardPosition={getCardPosition}
              isPlayable={canPlay(card)}
              isCurrentPlayer={isCurrentPlayer}
              onPress={() => onCardPress(card, index)}
            />
          );
        })}
      </View>
    </View>
  );
};

interface AnimatedCardProps {
  card: CardType;
  index: number;
  totalCards: number;
  getCardPosition: (index: number) => {
    x: number;
    y: number;
    rotation: number;
  };
  isPlayable: boolean;
  isCurrentPlayer: boolean;
  onPress: () => void;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  card,
  index,
  totalCards,
  getCardPosition,
  isPlayable,
  isCurrentPlayer,
  onPress,
}) => {
  const position = getCardPosition(index);

  // Animated values for smooth transitions
  const translateX = useSharedValue(position.x);
  const translateY = useSharedValue(position.y);
  const rotation = useSharedValue(position.rotation);

  // Update position when index changes
  useEffect(() => {
    const newPosition = getCardPosition(index);
    translateX.value = withSpring(newPosition.x, {
      damping: 15,
      stiffness: 120,
    });
    translateY.value = withSpring(newPosition.y, {
      damping: 15,
      stiffness: 120,
    });
    rotation.value = withSpring(newPosition.rotation, {
      damping: 15,
      stiffness: 120,
    });
  }, [index, totalCards, getCardPosition, translateX, translateY, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.cardWrapper, animatedStyle, { zIndex: index }]}
    >
      <Card
        card={card}
        index={index}
        total={totalCards}
        isPlayerCard={true}
        isPlayable={isPlayable && isCurrentPlayer}
        onPress={onPress}
        faceUp={true}
        animationDelay={index * 50}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: LAYOUT.players.bottom.y + 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  handContainer: {
    position: 'relative',
    width: LAYOUT.players.bottom.handWidth,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    bottom: 0,
  },
});

export default PlayerHand;
