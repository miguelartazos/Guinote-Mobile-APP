import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type CardCountBadgeProps = {
  count: number;
  position: 'top' | 'left' | 'right' | 'bottom';
};

export function CardCountBadge({ count, position }: CardCountBadgeProps) {
  return (
    <View style={[styles.badge, styles[`${position}Badge`]]}>
      <Text style={styles.badgeText}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.goldDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 30,
  },
  topBadge: {
    top: -8,
    right: -8,
  },
  leftBadge: {
    top: -8,
    right: -8,
  },
  rightBadge: {
    top: -8,
    left: -8,
  },
  bottomBadge: {
    top: -8,
    right: -8,
  },
  badgeText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
});
