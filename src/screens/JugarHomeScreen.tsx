import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { FeedbackButton } from '../components/ui/FeedbackButton';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';
import { useGameStatistics } from '../hooks/useGameStatistics';

export function JugarHomeScreen({
  navigation,
}: JugarStackScreenProps<'JugarHome'>) {
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
          <Text style={styles.tagline}>
            El clásico Guiñote, mejorado para ti
          </Text>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
          </View>
        </View>

        {/* Primary Game Modes */}
        <View style={styles.primaryModes}>
          {/* Partida Rápida */}
          <TouchableOpacity
            style={styles.primaryModeCard}
            onPress={() => navigation.navigate('QuickMatch')}
            activeOpacity={0.8}
          >
            <View style={[styles.primaryModeContent, styles.quickMatchColor]}>
              <Text style={styles.primaryModeIcon}>🎯</Text>
              <Text style={styles.primaryModeTitle}>PARTIDA RÁPIDA</Text>
              <Text style={styles.primaryModeSubtitle}>
                Juega con otros jugadores
              </Text>
            </View>
          </TouchableOpacity>

          {/* Jugar con Amigos */}
          <TouchableOpacity
            style={styles.primaryModeCard}
            onPress={() => navigation.navigate('FriendsLobby')}
            activeOpacity={0.8}
          >
            <View style={[styles.primaryModeContent, styles.friendsColor]}>
              <Text style={styles.primaryModeIcon}>👥</Text>
              <Text style={styles.primaryModeTitle}>JUGAR CON AMIGOS</Text>
              <Text style={styles.primaryModeSubtitle}>
                Crea una sala o únete con código
              </Text>
            </View>
          </TouchableOpacity>

          {/* Contra la Máquina */}
          <TouchableOpacity
            style={styles.primaryModeCard}
            onPress={() => navigation.navigate('OfflineMode')}
            activeOpacity={0.8}
          >
            <View style={[styles.primaryModeContent, styles.aiColor]}>
              <Text style={styles.primaryModeIcon}>🤖</Text>
              <Text style={styles.primaryModeTitle}>CONTRA LA MÁQUINA</Text>
              <Text style={styles.primaryModeSubtitle}>
                Practica en solitario
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Secondary Options */}
        <View style={styles.secondaryOptions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('LocalMultiplayer')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonIcon}>📱</Text>
            <Text style={styles.secondaryButtonText}>Pasar y Jugar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('TutorialSetup')}
            activeOpacity={0.8}
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
                    ? `${Math.round(
                        (statistics.gamesWon / statistics.gamesPlayed) * 100,
                      )}%`
                    : '0%'}
                </Text>
                <Text style={styles.statLabel}>Victorias</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {statistics.currentWinStreak}
                </Text>
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
  primaryModeCard: {
    marginBottom: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  primaryModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.spacing.lg,
  },
  primaryModeIcon: {
    fontSize: 36,
    marginRight: dimensions.spacing.md,
  },
  primaryModeTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: 4,
  },
  primaryModeSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    position: 'absolute',
    bottom: dimensions.spacing.lg,
    left: dimensions.spacing.lg + 36 + dimensions.spacing.md,
  },
  quickMatchColor: {
    backgroundColor: '#FFA500',
  },
  friendsColor: {
    backgroundColor: '#4169E1',
  },
  aiColor: {
    backgroundColor: '#2E8B57',
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
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonIcon: {
    fontSize: 20,
    marginRight: dimensions.spacing.sm,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
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
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: dimensions.spacing.md,
  },
});
