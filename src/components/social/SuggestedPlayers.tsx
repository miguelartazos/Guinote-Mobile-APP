import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { PlayerCard } from './PlayerCard';
import { useSuggestedPlayers } from '../../hooks/social/useSuggestedPlayers';
import { SkeletonList } from './Skeleton';

export function SuggestedPlayers() {
  const { suggested, loading } = useSuggestedPlayers();

  return (
    <View>
      <Text style={styles.sectionTitle}>SUGERIDO</Text>
      {loading && <SkeletonList count={3} />}
      {!loading && suggested.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay jugadores recomendados.</Text>
        </View>
      )}
      {!loading &&
        suggested.map(s => (
          <PlayerCard
            key={s.id}
            username={s.username}
            subtitle={s.reason || undefined}
            actions={[{ label: 'Agregar', variant: 'primary', onPress: () => {} }]}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.sm,
  },
  emptyState: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.md,
  },
  emptyText: {
    color: colors.textSecondary,
  },
});


