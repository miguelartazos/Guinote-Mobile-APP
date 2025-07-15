import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

export function JugarHomeScreen({
  navigation,
}: JugarStackScreenProps<'JugarHome'>) {
  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>¿Cómo quieres jugar?</Text>
          <Text style={styles.subtitle}>Elige tu modo de juego favorito</Text>
        </View>

        <View style={styles.gameModesContainer}>
          {/* Partida Rápida */}
          <View style={styles.gameModeCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚡</Text>
            </View>
            <Text style={styles.gameModeTitle}>Partida Rápida</Text>
            <Text style={styles.gameModeSubtitle}>
              Encuentra jugadores al instante
            </Text>
            <Button
              onPress={() => navigation.navigate('QuickMatch')}
              style={styles.gameModeButton}
            >
              Buscar Partida
            </Button>
          </View>

          {/* Partida con Amigos */}
          <View style={styles.gameModeCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👥</Text>
            </View>
            <Text style={styles.gameModeTitle}>Partida con Amigos</Text>
            <Text style={styles.gameModeSubtitle}>
              Crea una sala privada e invita
            </Text>
            <Button
              onPress={() => navigation.navigate('CreateRoom')}
              style={styles.gameModeButton}
            >
              Crear Sala
            </Button>
          </View>

          {/* Modo Offline */}
          <View style={styles.gameModeCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🤖</Text>
            </View>
            <Text style={styles.gameModeTitle}>Modo Offline</Text>
            <Text style={styles.gameModeSubtitle}>
              Juega contra la IA sin internet
            </Text>
            <Button
              onPress={() => navigation.navigate('OfflineMode')}
              style={styles.gameModeButton}
            >
              Jugar vs IA
            </Button>
          </View>

          {/* Modo Historia - Coming Soon */}
          <View style={[styles.gameModeCard, styles.disabledCard]}>
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, styles.disabledIcon]}>📖</Text>
            </View>
            <Text style={[styles.gameModeTitle, styles.disabledText]}>
              Modo Historia
            </Text>
            <Text style={[styles.gameModeSubtitle, styles.disabledText]}>
              Aventuras por pueblos aragoneses
            </Text>
            <Button
              disabled
              style={[styles.gameModeButton, styles.disabledButton]}
            >
              Próximamente
            </Button>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>347</Text>
            <Text style={styles.statLabel}>Jugadores online</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5 min</Text>
            <Text style={styles.statLabel}>Tiempo promedio</Text>
          </View>
        </View>
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
    marginTop: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  gameModesContainer: {
    marginBottom: dimensions.spacing.xxl,
  },
  gameModeCard: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
    alignItems: 'center',
  },
  disabledCard: {
    opacity: 0.5,
  },
  iconContainer: {
    marginBottom: dimensions.spacing.lg,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
  },
  disabledIcon: {
    opacity: 0.5,
  },
  gameModeTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center',
  },
  gameModeSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginBottom: dimensions.spacing.lg,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.fontSize.md,
  },
  disabledText: {
    opacity: 0.5,
  },
  gameModeButton: {
    minWidth: 200,
    minHeight: dimensions.touchTarget.large,
    paddingHorizontal: dimensions.spacing.xl,
  },
  disabledButton: {
    opacity: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
});
