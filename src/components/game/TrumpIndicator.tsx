import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { SpanishCardData } from '../../types/cardTypes';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type TrumpIndicatorProps = {
  trumpCard: SpanishCardData;
  style?: StyleProp<ViewStyle>;
};

export function TrumpIndicator({ trumpCard, style }: TrumpIndicatorProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Triunfo</Text>
      <View style={styles.cardContainer}>
        <SpanishCard card={trumpCard} size="small" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.xs,
  },
  cardContainer: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
});
