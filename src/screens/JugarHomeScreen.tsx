import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { FeedbackButton } from '../components/ui/FeedbackButton';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';
import { useGameStatistics } from '../hooks/useGameStatistics';

export function JugarHomeScreen({ navigation }: JugarStackScreenProps<'JugarHome'>) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const { statistics } = useGameStatistics();

  useEffect(() => {
    // Glow animation for main CTA
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [glowAnim]);

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>♠♥♣♦</Text>
            <Text style={styles.logoText}>GUIÑOTE</Text>
          </View>
          <Text style={styles.tagline}>El clásico Guiñote, mejorado para ti</Text>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
          </View>
        </View>

        {/* Primary Game Modes */}
        <View style={styles.primaryModes}>
          <TouchableOpacity
            style={[styles.primaryButton, styles.quickMatchButton]}
            onPress={() => navigation.navigate('QuickMatch')}
            activeOpacity={0.8}
            testID="quick-match-button"
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🎯</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>PARTIDA RÁPIDA</Text>
                <Text style={styles.buttonSubtitle}>Juega con otros jugadores</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, styles.friendsButton]}
            onPress={() => navigation.navigate('FriendsLobby')}
            activeOpacity={0.8}
            testID="friends-lobby-button"
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>👥</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>JUGAR CON AMIGOS</Text>
                <Text style={styles.buttonSubtitle}>Crea una sala o únete</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, styles.aiButton]}
            onPress={() => navigation.navigate('OfflineMode')}
            activeOpacity={0.8}
            testID="offline-mode-button"
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🤖</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>CONTRA LA MÁQUINA</Text>
                <Text style={styles.buttonSubtitle}>Practica en solitario</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Secondary Options */}
        <View style={styles.secondaryOptions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('LocalMultiplayer')}
            activeOpacity={0.8}
            testID="local-multiplayer-button"
          >
            <Text style={styles.secondaryButtonIcon}>📱</Text>
            <Text style={styles.secondaryButtonText}>Pasar y Jugar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('TutorialSetup')}
            activeOpacity={0.8}
            testID="tutorial-button"
          >
            <Text style={styles.secondaryButtonIcon}>🎓</Text>
            <Text style={styles.secondaryButtonText}>Tutorial</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        {statistics ? (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Tus Estadísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{statistics.elo}</Text>
                <Text style={styles.statLabel}>ELO</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {statistics.gamesPlayed > 0
                    ? `${Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100)}%`
                    : '0%'}
                </Text>
                <Text style={styles.statLabel}>Victorias</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{statistics.currentWinStreak}</Text>
                <Text style={styles.statLabel}>Racha</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{statistics.gamesPlayed}</Text>
                <Text style={styles.statLabel}>Partidas</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Tus Estadísticas</Text>
            <Text style={styles.loadingText}>Cargando estadísticas...</Text>
          </View>
        )}
      </ScrollView>
      <FeedbackButton />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.xxl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  logo: {
    fontSize: 36,
    marginRight: dimensions.spacing.md,
  },
  logoText: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: dimensions.spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.sm,
  },
  avatarText: {
    fontSize: 20,
  },
  welcomeText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  primaryModes: {
    paddingHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xl,
  },
  primaryButton: {
    marginBottom: dimensions.spacing.md,
    borderRadius: 16,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  quickMatchButton: {
    backgroundColor: '#FF7043',
  },
  friendsButton: {
    backgroundColor: '#5C6BC0',
  },
  aiButton: {
    backgroundColor: '#66BB6A',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 40,
    marginRight: dimensions.spacing.md,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  secondaryOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xxl,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonIcon: {
    fontSize: 20,
    marginRight: dimensions.spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statsSection: {
    paddingHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.lg,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: dimensions.spacing.md,
  },
});
