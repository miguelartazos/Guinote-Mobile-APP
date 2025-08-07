import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Card from './Card';
import { LAYOUT } from './PlayerPositions';
import { colors } from '../../constants/colors';
import {
  getPlayerCardPosition,
  getCardWidth,
  getCardHeight,
} from '../../utils/cardPositions';
import type { CardSlot } from '../../utils/cardSlots';

interface OpponentHandProps {
  position: 'top' | 'left' | 'right';
  slots: CardSlot[]; // Now using slots instead of cardCount
  isPartner?: boolean;
  isCurrentPlayer?: boolean;
}

export const OpponentHand: React.FC<OpponentHandProps> = ({
  position,
  slots,
  isPartner = false,
  isCurrentPlayer = false,
}) => {
  const isVertical = position === 'left' || position === 'right';

  // Map position to player index for consistent positioning
  // Counter-clockwise from bottom: Bottom(0) -> Right(1) -> Top(2) -> Left(3)
  const playerIndexMap = {
    right: 1,
    top: 2,
    left: 3,
  };
  const playerIndex = playerIndexMap[position];

  // Count actual cards (non-empty slots)
  const cardCount = slots.filter(slot => slot.card !== null).length;

  const getCardStyle = (slotIndex: number) => {
    // ALWAYS use 6 total cards for position calculation
    // This ensures positions never change
    const cardSize =
      position === 'top' || position === 'left' || position === 'right'
        ? 'small'
        : 'large';
    const cardPosition = getPlayerCardPosition(
      playerIndex,
      slotIndex,
      6,
      cardSize,
    );

    return {
      position: 'absolute' as const,
      left: cardPosition.x, // Use absolute position directly
      top: cardPosition.y, // Use absolute position directly
      transform: [{ rotate: `${cardPosition.rotation}deg` }],
      zIndex: cardPosition.zIndex,
    };
  };

  const containerStyle = [
    styles.container,
    isCurrentPlayer && styles.currentPlayerGlow,
  ];

  return (
    <View style={containerStyle} pointerEvents="none">
      <View style={styles.cardStack}>
        {slots.map(slot => {
          // Only render cards that exist (non-empty slots)
          if (slot.card === null) {
            return null; // Empty slot - no card rendered
          }

          return (
            <View
              key={`${position}-slot-${slot.slotIndex}`}
              style={getCardStyle(slot.slotIndex)}
            >
              <Card
                card={slot.card}
                faceUp={false}
                animationDelay={slot.slotIndex * 30}
                style={{
                  width: getCardWidth('small'),
                  height: getCardHeight('small'),
                }}
              />
            </View>
          );
        })}
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardStack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
