import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import { useGameStatistics } from '../hooks/useGameStatistics';
import type { MainTabScreenProps } from '../types/navigation';

export function RankingScreen({ navigation: _ }: MainTabScreenProps<'Ranking'>) {
  const { statistics, winRate, averageScore, resetStatistics } = useGameStatistics();

  if (!statistics) {
    return (
      <ScreenContainer>
        <View style={styles.container}>
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Estadísticas</Text>
          <Text style={styles.subtitle}>Tu progreso en Guiñote</Text>
        </View>

        <View style={styles.content}>
          {/* Overall Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Resumen General</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Partidas jugadas:</Text>
              <Text style={styles.statValue}>{statistics.gamesPlayed}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Victorias:</Text>
              <Text style={[styles.statValue, styles.winText]}>{statistics.gamesWon}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Derrotas:</Text>
              <Text style={[styles.statValue, styles.lossText]}>{statistics.gamesLost}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Porcentaje de victorias:</Text>
              <Text style={styles.statValue}>{winRate}%</Text>
            </View>
          </View>

          {/* Score Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Puntuación</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mejor puntuación:</Text>
              <Text style={styles.statValue}>{statistics.bestScore}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Puntuación promedio:</Text>
              <Text style={styles.statValue}>{averageScore}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Racha actual:</Text>
              <Text style={styles.statValue}>{statistics.currentWinStreak} victorias</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mejor racha:</Text>
              <Text style={styles.statValue}>{statistics.longestWinStreak} victorias</Text>
            </View>
          </View>

          {/* Difficulty Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Por Dificultad</Text>
            <View style={styles.difficultySection}>
              <Text style={styles.difficultyTitle}>Fácil</Text>
              <Text style={styles.difficultyStats}>
                {statistics.difficultyStats.easy.won}/{statistics.difficultyStats.easy.played}{' '}
                ganadas
              </Text>
            </View>
            <View style={styles.difficultySection}>
              <Text style={styles.difficultyTitle}>Medio</Text>
              <Text style={styles.difficultyStats}>
                {statistics.difficultyStats.medium.won}/{statistics.difficultyStats.medium.played}{' '}
                ganadas
              </Text>
            </View>
            <View style={styles.difficultySection}>
              <Text style={styles.difficultyTitle}>Difícil</Text>
              <Text style={styles.difficultyStats}>
                {statistics.difficultyStats.hard.won}/{statistics.difficultyStats.hard.played}{' '}
                ganadas
              </Text>
            </View>
          </View>

          {/* Favorite Partner */}
          {statistics.favoritePartner && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Compañero Favorito</Text>
              <Text style={styles.partnerName}>{statistics.favoritePartner.name}</Text>
              <Text style={styles.partnerGames}>
                {statistics.favoritePartner.gamesPlayed} partidas juntos
              </Text>
            </View>
          )}

          {/* Reset Button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetStatistics}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>Reiniciar Estadísticas</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: dimensions.spacing.xxl }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xxl,
    marginBottom: dimensions.spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    paddingHorizontal: dimensions.spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    textAlign: 'center',
    marginTop: dimensions.spacing.xxl,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  statLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  statValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  winText: {
    color: '#4CAF50',
  },
  lossText: {
    color: '#F44336',
  },
  difficultySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  difficultyTitle: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  difficultyStats: {
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  partnerName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  partnerGames: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: colors.error,
    borderRadius: dimensions.borderRadius.lg,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    alignItems: 'center',
    marginTop: dimensions.spacing.xl,
  },
  resetButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
});
