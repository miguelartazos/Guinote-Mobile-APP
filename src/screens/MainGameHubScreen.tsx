import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

export function MainGameHubScreen({
  navigation,
}: JugarStackScreenProps<'MainGameHub'>) {
  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.profileSection}>
            <Text style={styles.profileIcon}>👤</Text>
            <Text style={styles.profileText}>Perfil</Text>
          </View>
          <View style={styles.coinsSection}>
            <Text style={styles.coinsIcon}>💰</Text>
            <Text style={styles.coinsText}>1,250</Text>
          </View>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </View>

        {/* Main Play Button */}
        <View style={styles.mainButtonContainer}>
          <Button
            onPress={() => navigation.navigate('Game')}
            style={styles.mainPlayButton}
          >
            JUGAR AHORA
          </Button>
          <Text style={styles.mainButtonSubtext}>Partida rápida con IA</Text>
        </View>

        {/* Liga Familiar Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🏆</Text>
            <Text style={styles.cardTitle}>Liga Familiar Activa</Text>
          </View>
          <Text style={styles.cardSubtext}>"Abuelo te espera"</Text>
          <Button
            variant="secondary"
            onPress={() => navigation.navigate('Room')}
            style={styles.cardButton}
          >
            Continuar
          </Button>
        </View>

        {/* Online Friends Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>👥</Text>
            <Text style={styles.cardTitle}>Amigos Online: 3</Text>
          </View>
          <Text style={styles.cardSubtext}>Miguel, Carlos, Ana</Text>
          <Button
            variant="secondary"
            onPress={() => navigation.navigate('Room')}
            style={styles.cardButton}
          >
            Crear Sala
          </Button>
        </View>

        {/* Mini Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statText}>Racha: 5 días</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statText}>73%</Text>
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    marginBottom: dimensions.spacing.xl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: typography.fontSize.lg,
    marginRight: dimensions.spacing.sm,
  },
  profileText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  coinsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinsIcon: {
    fontSize: typography.fontSize.lg,
    marginRight: dimensions.spacing.sm,
  },
  coinsText: {
    fontSize: typography.fontSize.md,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  settingsIcon: {
    fontSize: typography.fontSize.lg,
  },
  mainButtonContainer: {
    alignItems: 'center',
    marginBottom: dimensions.spacing.xl,
  },
  mainPlayButton: {
    paddingHorizontal: dimensions.spacing.xxl,
    paddingVertical: dimensions.spacing.lg,
    minHeight: dimensions.touchTarget.large + 16,
  },
  mainButtonSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginTop: dimensions.spacing.sm,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  cardIcon: {
    fontSize: typography.fontSize.lg,
    marginRight: dimensions.spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  cardSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginBottom: dimensions.spacing.md,
    fontStyle: 'italic',
  },
  cardButton: {
    alignSelf: 'flex-start',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
    marginBottom: dimensions.spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: typography.fontSize.md,
    marginRight: dimensions.spacing.sm,
  },
  statText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
});
