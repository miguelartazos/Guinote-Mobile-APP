import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { useUserStats } from '../../hooks/social/useUserStats';

type Props = {
  username: string;
};

export function SocialHeader({ username }: Props) {
  const { stats } = useUserStats();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AMIGOS</Text>
      <View style={styles.counters}>
        <View style={styles.counter}>
          <Text style={styles.counterIcon}>🪙</Text>
          <Text style={styles.counterText}>{stats.coins}</Text>
        </View>
        <View style={[styles.counter, styles.counterGem]}>
          <Text style={styles.counterIcon}>💎</Text>
          <Text style={styles.counterText}>{stats.gems}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.accent,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  counters: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterGem: {
    backgroundColor: colors.surface,
  },
  counterIcon: {
    marginRight: 6,
    fontSize: typography.fontSize.md,
  },
  counterText: {
    color: colors.text,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});


