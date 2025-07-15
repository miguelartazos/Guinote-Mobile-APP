import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

export function QuickMatchScreen({
  navigation,
}: JugarStackScreenProps<'QuickMatch'>) {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Partida Rápida</Text>
          <Text style={styles.subtitle}>Buscando jugadores...</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.onlineStats}>
            <Text style={styles.onlineIcon}>🌐</Text>
            <Text style={styles.onlineNumber}>347</Text>
            <Text style={styles.onlineLabel}>jugadores online ahora</Text>
          </View>

          <View style={styles.searchCard}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchText}>Buscando partida...</Text>
            <View style={styles.loadingDots}>
              <Text style={styles.dot}>●</Text>
              <Text style={styles.dot}>●</Text>
              <Text style={styles.dot}>●</Text>
            </View>
            <Text style={styles.searchSubtext}>
              Encontraremos jugadores de tu nivel
            </Text>
          </View>

          <View style={styles.playersContainer}>
            <Text style={styles.playersTitle}>Sala de juego (4 jugadores)</Text>
            <View style={styles.playersList}>
              <View style={styles.playerSlot}>
                <Text style={styles.playerIcon}>👤</Text>
                <Text style={styles.playerName}>Tú</Text>
                <Text style={styles.playerStatus}>Listo</Text>
              </View>
              <View style={[styles.playerSlot, styles.emptySlot]}>
                <Text style={styles.playerIcon}>⏳</Text>
                <Text style={styles.playerName}>Buscando...</Text>
                <Text style={styles.playerStatus}>—</Text>
              </View>
              <View style={[styles.playerSlot, styles.emptySlot]}>
                <Text style={styles.playerIcon}>⏳</Text>
                <Text style={styles.playerName}>Buscando...</Text>
                <Text style={styles.playerStatus}>—</Text>
              </View>
              <View style={[styles.playerSlot, styles.emptySlot]}>
                <Text style={styles.playerIcon}>⏳</Text>
                <Text style={styles.playerName}>Buscando...</Text>
                <Text style={styles.playerStatus}>—</Text>
              </View>
            </View>
          </View>

          <View style={styles.estimateContainer}>
            <Text style={styles.estimateText}>
              ⏱️ Tiempo estimado: 45 segundos
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={() =>
              navigation.navigate('Game', {
                gameMode: 'quick',
                difficulty: 'medium',
              })
            }
          >
            Jugar con IA
          </Button>

          <Button
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Cancelar Búsqueda
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xxl,
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
    flex: 1,
    marginTop: dimensions.spacing.xl,
  },
  onlineStats: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  onlineIcon: {
    fontSize: typography.fontSize.xl,
    marginBottom: dimensions.spacing.sm,
  },
  onlineNumber: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  onlineLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  searchIcon: {
    fontSize: typography.fontSize.xxxl,
    marginBottom: dimensions.spacing.md,
  },
  searchText: {
    fontSize: typography.fontSize.xl,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: dimensions.spacing.md,
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: dimensions.spacing.md,
  },
  dot: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    marginHorizontal: dimensions.spacing.xs,
  },
  searchSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playersContainer: {
    marginTop: dimensions.spacing.lg,
  },
  playersTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.md,
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  playerSlot: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    alignItems: 'center',
    width: '48%',
    marginBottom: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  emptySlot: {
    borderColor: colors.secondary,
    opacity: 0.6,
  },
  playerIcon: {
    fontSize: typography.fontSize.xl,
    marginBottom: dimensions.spacing.sm,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    marginBottom: dimensions.spacing.xs,
  },
  playerStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  estimateContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.lg,
  },
  estimateText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginBottom: dimensions.spacing.xxl,
  },
  button: {
    marginTop: dimensions.spacing.md,
  },
});
