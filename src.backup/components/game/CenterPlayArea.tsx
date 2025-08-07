import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import Card from './Card';
import { Card as CardType } from '../../types/game';

interface PlayedCard {
  card: CardType;
  playerId: string;
}

interface CenterPlayAreaProps {
  cards: PlayedCard[];
}

export const CenterPlayArea: React.FC<CenterPlayAreaProps> = ({ cards }) => {
  // Position cards in a slight spread pattern
  const getCardPosition = (index: number) => {
    const positions = [
      { x: 0, y: 20, rotation: -5 }, // First card
      { x: 30, y: 0, rotation: 10 }, // Second card
      { x: -20, y: -10, rotation: -15 }, // Third card
      { x: 10, y: -30, rotation: 20 }, // Fourth card
    ];

    return positions[index] || { x: 0, y: 0, rotation: 0 };
  };

  return (
    <View style={styles.container}>
      {cards.map((playedCard, index) => {
        const position = getCardPosition(index);

        return (
          <Animated.View
            key={`played-${index}`}
            style={[
              styles.playedCard,
              {
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate: `${position.rotation}deg` },
                ],
                zIndex: index,
              },
            ]}
          >
            <Card card={playedCard.card} faceUp={true} style={styles.card} />
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playedCard: {
    position: 'absolute',
  },
  card: {
    width: 80,
    height: 115,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
});

export default CenterPlayArea;
