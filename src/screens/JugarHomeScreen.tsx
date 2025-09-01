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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { statistics } = useGameStatistics();

  useEffect(() => {
    // Subtle glow animation for main CTA
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [glowAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>♠♥♣♦</Text>
            <Text style={styles.logoText}>GUIÑOTE</Text>
          </View>
          <Text style={styles.tagline}>El juego tradicional español</Text>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
          </View>
        </View>

        {/* Primary Game Modes */}
        <View style={styles.primaryModes}>
          <Animated.View
            style={[
              styles.glowWrapper,
              {
                shadowOpacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.6],
                }),
                shadowRadius: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 16],
                }),
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.primaryButton, styles.quickMatchButton]}
              onPress={() => navigation.navigate('QuickMatch')}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.8}
              testID="quick-match-button"
            >
              <Animated.View style={[styles.buttonContent, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.buttonIcon}>🎯</Text>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>PARTIDA RÁPIDA</Text>
                  <Text style={styles.buttonSubtitle}>Juega con otros jugadores</Text>
                </View>
              </Animated.View>
              <View style={styles.buttonGradient} />
            </TouchableOpacity>
          </Animated.View>

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
            <View style={styles.buttonGradient} />
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
            <View style={styles.buttonGradient} />
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
    fontSize: 42, // Larger for seniors
    marginRight: dimensions.spacing.md,
  },
  logoText: {
    fontSize: 42, // Larger for seniors
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: typography.fontSize.lg, // Larger text
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: dimensions.spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48, // Larger avatar
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.sm,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarText: {
    fontSize: 24,
  },
  welcomeText: {
    fontSize: typography.fontSize.xl, // Larger text
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  primaryModes: {
    paddingHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xl,
  },
  glowWrapper: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: dimensions.spacing.md,
  },
  primaryButton: {
    borderRadius: 16,
    padding: dimensions.spacing.xl, // Larger padding
    overflow: 'hidden',
    position: 'relative',
    marginBottom: dimensions.spacing.md,
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: colors.white,
  },
  quickMatchButton: {
    backgroundColor: '#FF7043',
    borderWidth: 1,
    borderColor: '#FF8A65',
  },
  friendsButton: {
    backgroundColor: '#5C6BC0',
    borderWidth: 1,
    borderColor: '#7986CB',
  },
  aiButton: {
    backgroundColor: '#66BB6A',
    borderWidth: 1,
    borderColor: '#81C784',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  buttonIcon: {
    fontSize: 48, // Larger icons
    marginRight: dimensions.spacing.lg,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: typography.fontSize.lg, // Larger text
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  buttonSubtitle: {
    fontSize: typography.fontSize.md, // Larger text
    color: 'rgba(255, 255, 255, 0.95)',
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
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.lg, // Larger padding
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  secondaryButtonIcon: {
    fontSize: 24, // Larger icons
    marginRight: dimensions.spacing.sm,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.md, // Larger text
    fontWeight: '600',
    color: colors.text,
  },
  statsSection: {
    paddingHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xxl, // Larger text
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
    borderRadius: 14,
    padding: dimensions.spacing.xl, // Larger padding
    marginBottom: dimensions.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  statValue: {
    fontSize: typography.fontSize.xxl, // Larger text
    fontWeight: '700',
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.md, // Larger text
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
