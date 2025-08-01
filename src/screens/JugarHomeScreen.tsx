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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { statistics, isLoading } = useGameStatistics();

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

  const glowInterpolation = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 193, 7, 0.3)', 'rgba(255, 193, 7, 0.8)'],
  });

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

        {/* Featured CTA - Partida Rápida */}
        <Animated.View
          style={[
            styles.featuredCTA,
            {
              shadowColor: glowInterpolation,
              shadowOpacity: 0.8,
              shadowRadius: 20,
              elevation: 10,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('QuickMatch')}
            onPressIn={() => {
              Animated.spring(scaleAnim, {
                toValue: 0.95,
                useNativeDriver: true,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
              }).start();
            }}
            activeOpacity={1}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <View
                style={[styles.featuredButton, { backgroundColor: '#FFA500' }]}
              >
                <View style={styles.featuredContent}>
                  <Text style={styles.featuredIcon}>⚡</Text>
                  <Text style={styles.featuredTitle}>PARTIDA RÁPIDA</Text>
                  <Text style={styles.featuredSubtitle}>
                    Encuentra rivales al instante
                  </Text>
                  <View style={styles.playNowButton}>
                    <Text style={styles.playNowText}>JUGAR AHORA</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Secondary Modes Grid */}
        <View style={styles.modesGrid}>
          {/* Paso y Juego */}
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => navigation.navigate('LocalMultiplayer')}
            activeOpacity={0.8}
          >
            <View
              style={[styles.modeCardGradient, { backgroundColor: '#2E8B57' }]}
            >
              <Text style={styles.modeIcon}>🤝</Text>
              <Text style={styles.modeTitle}>Paso y Juego</Text>
              <Text style={styles.modeSubtitle}>Con amigos</Text>
            </View>
          </TouchableOpacity>

          {/* Contra IA */}
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => navigation.navigate('OfflineMode')}
            activeOpacity={0.8}
          >
            <View
              style={[styles.modeCardGradient, { backgroundColor: '#4169E1' }]}
            >
              <Text style={styles.modeIcon}>🤖</Text>
              <Text style={styles.modeTitle}>Contra IA</Text>
              <Text style={styles.modeSubtitle}>Sin internet</Text>
            </View>
          </TouchableOpacity>

          {/* Online Mundial */}
          <TouchableOpacity
            style={[styles.modeCard, styles.disabledCard]}
            activeOpacity={0.5}
          >
            <View
              style={[styles.modeCardGradient, { backgroundColor: '#9370DB' }]}
            >
              <Text style={styles.modeIcon}>🌍</Text>
              <Text style={styles.modeTitle}>Online Mundial</Text>
              <Text style={styles.modeSubtitle}>Próximamente</Text>
            </View>
          </TouchableOpacity>

          {/* Tutorial */}
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => navigation.navigate('TutorialSetup')}
            activeOpacity={0.8}
          >
            <View
              style={[styles.modeCardGradient, { backgroundColor: '#FF6347' }]}
            >
              <Text style={styles.modeIcon}>🎓</Text>
              <Text style={styles.modeTitle}>Tutorial</Text>
              <Text style={styles.modeSubtitle}>Aprende</Text>
            </View>
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
  featuredCTA: {
    marginHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xxl,
  },
  featuredButton: {
    borderRadius: dimensions.borderRadius.xl,
    overflow: 'hidden',
  },
  featuredContent: {
    padding: dimensions.spacing.xxl,
    alignItems: 'center',
  },
  featuredIcon: {
    fontSize: 60,
    marginBottom: dimensions.spacing.md,
  },
  featuredTitle: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: dimensions.spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  featuredSubtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.white,
    marginBottom: dimensions.spacing.lg,
    opacity: 0.9,
  },
  playNowButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: dimensions.spacing.xxl,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.white,
  },
  playNowText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xxl,
  },
  modeCard: {
    width: '48%',
    marginBottom: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeCardGradient: {
    padding: dimensions.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: dimensions.spacing.sm,
  },
  modeTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  modeSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  disabledCard: {
    opacity: 0.6,
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
