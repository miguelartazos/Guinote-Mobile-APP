import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import type { MatchScore } from '../../types/game.types';

type MatchProgressIndicatorProps = {
  matchScore: MatchScore;
  team1Name?: string;
  team2Name?: string;
};

export function MatchProgressIndicator({
  matchScore,
  team1Name = 'Equipo 1',
  team2Name = 'Equipo 2',
}: MatchProgressIndicatorProps) {
  // Don't show for single games
  if (matchScore.matchFormat === 'single') {
    return null;
  }

  const renderCotos = (cotos: number, maxCotos: number) => {
    return Array.from({ length: maxCotos }, (_, i) => (
      <View
        key={i}
        style={[styles.cotoIcon, i < cotos && styles.cotoIconFilled]}
      />
    ));
  };

  const formatDescription = () => {
    switch (matchScore.matchFormat) {
      case 'coto':
        return `Jugando por un Coto (mejor de ${matchScore.partidasPerCoto})`;
      case 'coton':
        return `Cotón Tradicional (primero a ${matchScore.cotosToWin} cotos)`;
      case 'coton_largo':
        return `Cotón Largo (primero a ${matchScore.cotosToWin} cotos)`;
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{formatDescription()}</Text>

      <View style={styles.scoreContainer}>
        {/* Team 1 */}
        <View style={styles.teamSection}>
          <Text style={styles.teamName}>{team1Name}</Text>
          <View style={styles.cotosContainer}>
            {renderCotos(matchScore.team1Cotos, matchScore.cotosToWin)}
          </View>
          <Text style={styles.partidasText}>
            Partidas: {matchScore.team1PartidasInCoto}
          </Text>
        </View>

        {/* Separator */}
        <View style={styles.separator}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* Team 2 */}
        <View style={styles.teamSection}>
          <Text style={styles.teamName}>{team2Name}</Text>
          <View style={styles.cotosContainer}>
            {renderCotos(matchScore.team2Cotos, matchScore.cotosToWin)}
          </View>
          <Text style={styles.partidasText}>
            Partidas: {matchScore.team2PartidasInCoto}
          </Text>
        </View>
      </View>

      {/* Current Coto Progress */}
      {matchScore.matchFormat !== 'coto' && (
        <View style={styles.cotoProgress}>
          <Text style={styles.cotoProgressText}>
            Coto Actual: {matchScore.team1PartidasInCoto} -{' '}
            {matchScore.team2PartidasInCoto} (mejor de{' '}
            {matchScore.partidasPerCoto})
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: dimensions.spacing.md,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: dimensions.spacing.sm,
  },
  cotosContainer: {
    flexDirection: 'row',
    gap: dimensions.spacing.xs,
    marginBottom: dimensions.spacing.sm,
  },
  cotoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: 'transparent',
  },
  cotoIconFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  partidasText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  separator: {
    paddingHorizontal: dimensions.spacing.md,
  },
  vsText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
  },
  cotoProgress: {
    marginTop: dimensions.spacing.md,
    paddingTop: dimensions.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  cotoProgressText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
});
