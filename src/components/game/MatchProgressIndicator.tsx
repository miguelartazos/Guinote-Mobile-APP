import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { MatchScore } from '../../types/game.types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type MatchProgressIndicatorProps = {
  matchScore: MatchScore;
  compact?: boolean;
};

export function MatchProgressIndicator({
  matchScore,
  compact = false,
}: MatchProgressIndicatorProps) {
  const { team1Partidas, team2Partidas, team1Cotos, team2Cotos, partidasPerCoto, cotosPerMatch } =
    matchScore;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactText}>
          P: {team1Partidas}-{team2Partidas} | C: {team1Cotos}-{team2Cotos}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Partidas</Text>
        <View style={styles.scoreRow}>
          <View style={styles.teamScore}>
            <Text style={styles.teamLabel}>Nosotros</Text>
            <Text style={styles.score}>{team1Partidas}</Text>
            <View style={styles.progressBar}>
              {Array.from({ length: partidasPerCoto }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.progressDot, i < team1Partidas && styles.progressDotFilled]}
                />
              ))}
            </View>
          </View>
          <Text style={styles.separator}>-</Text>
          <View style={styles.teamScore}>
            <Text style={styles.teamLabel}>Ellos</Text>
            <Text style={styles.score}>{team2Partidas}</Text>
            <View style={styles.progressBar}>
              {Array.from({ length: partidasPerCoto }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.progressDot, i < team2Partidas && styles.progressDotFilled]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.label}>Cotos</Text>
        <View style={styles.scoreRow}>
          <View style={styles.teamScore}>
            <Text style={styles.cotoScore}>{team1Cotos}</Text>
            <View style={styles.progressBar}>
              {Array.from({ length: cotosPerMatch }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    styles.progressDotLarge,
                    i < team1Cotos && styles.progressDotFilled,
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={styles.separator}>-</Text>
          <View style={styles.teamScore}>
            <Text style={styles.cotoScore}>{team2Cotos}</Text>
            <View style={styles.progressBar}>
              {Array.from({ length: cotosPerMatch }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    styles.progressDotLarge,
                    i < team2Cotos && styles.progressDotFilled,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.info}>
        Primera a {partidasPerCoto} partidas gana el coto • Primera a {cotosPerMatch} cotos gana la
        partida
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
    marginVertical: dimensions.spacing.sm,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
  },
  compactText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  section: {
    marginBottom: dimensions.spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    marginBottom: dimensions.spacing.xs,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamScore: {
    alignItems: 'center',
    flex: 1,
  },
  teamLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  score: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  cotoScore: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  separator: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    marginHorizontal: dimensions.spacing.md,
  },
  progressBar: {
    flexDirection: 'row',
    marginTop: dimensions.spacing.xs,
    gap: 2,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotFilled: {
    backgroundColor: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: dimensions.spacing.sm,
  },
  info: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: dimensions.spacing.xs,
    fontStyle: 'italic',
  },
});
