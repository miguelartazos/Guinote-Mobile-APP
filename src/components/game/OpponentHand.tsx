import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Card from './Card';
import { LAYOUT } from './PlayerPositions';
import { colors } from '../../constants/colors';
import {
  getPlayerCardPosition,
  OPPONENT_CARD_SCALE,
} from '../../utils/cardPositions';

interface OpponentHandProps {
  position: 'top' | 'left' | 'right';
  cardCount: number;
  isPartner?: boolean;
  isCurrentPlayer?: boolean;
}

export const OpponentHand: React.FC<OpponentHandProps> = ({
  position,
  cardCount,
  isPartner = false,
  isCurrentPlayer = false,
}) => {
  const isVertical = position === 'left' || position === 'right';

  // Map position to player index for consistent positioning
  const playerIndexMap = {
    top: 1,
    right: 2,
    left: 3,
  };
  const playerIndex = playerIndexMap[position];

  // Create dummy cards for opponent hands
  const cards = Array.from({ length: cardCount }, (_, i) => ({
    suit: 'oros' as const,
    value: 1,
    points: 0,
  }));

  const getCardStyle = (index: number) => {
    // Use the same positioning as dealing animations
    const cardPosition = getPlayerCardPosition(playerIndex, index, cardCount);
    const { width, height } = Dimensions.get('window');

    // Get the base position for this player
    let baseX = 0,
      baseY = 0;
    if (position === 'top') {
      baseX = width / 2;
      baseY = 100;
    } else if (position === 'left') {
      baseX = 100;
      baseY = height * 0.3;
    } else if (position === 'right') {
      baseX = width - 100;
      baseY = height * 0.3;
    }

    return {
      position: 'absolute' as const,
      left: cardPosition.x - baseX,
      top: cardPosition.y - baseY,
      transform: [{ rotate: `${cardPosition.rotation}deg` }],
    };
  };

  const containerStyle = [
    styles.container,
    position === 'top' && styles.topContainer,
    position === 'left' && styles.leftContainer,
    position === 'right' && styles.rightContainer,
    isCurrentPlayer && styles.currentPlayerGlow,
  ];

  return (
    <View style={containerStyle}>
      <View style={[styles.cardStack, isVertical && styles.verticalStack]}>
        {cards.map((_, index) => (
          <View key={`${position}-card-${index}`} style={getCardStyle(index)}>
            <Card
              card={cards[0]}
              faceUp={false}
              animationDelay={index * 30}
              style={{
                width: 70 * OPPONENT_CARD_SCALE,
                height: 100 * OPPONENT_CARD_SCALE,
              }}
            />
          </View>
        ))}
      </View>

      {/* Card count badge */}
      <View style={[styles.countBadge, styles[`${position}Badge`]]}>
        <Text style={styles.countText}>{cardCount}</Text>
      </View>

      {/* Partner indicator */}
      {isPartner && (
        <View style={styles.partnerIndicator}>
          <Text style={styles.partnerText}>Pareja</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  topContainer: {
    top: LAYOUT.players.top.y - 40,
    left: LAYOUT.players.top.x - 100,
    width: 200,
    height: 100,
    alignItems: 'center',
  },
  leftContainer: {
    left: LAYOUT.players.left.x - 30,
    top: LAYOUT.players.left.y - 100,
    width: 100,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    right: LAYOUT.players.right.x - 30,
    left: undefined,
    top: LAYOUT.players.right.y - 100,
    width: 100,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStack: {
    position: 'relative',
    width: 200,
    height: 85,
  },
  verticalStack: {
    width: 60,
    height: 200,
  },
  countBadge: {
    position: 'absolute',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBadge: {
    bottom: -10,
    right: 10,
  },
  leftBadge: {
    top: 10,
    right: -10,
  },
  rightBadge: {
    top: 10,
    left: -10,
  },
  countText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  partnerIndicator: {
    position: 'absolute',
    top: -25,
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  partnerText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  currentPlayerGlow: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default OpponentHand;
