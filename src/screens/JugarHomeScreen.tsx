import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, RefreshControl } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { FeedbackButton } from '../components/ui/FeedbackButton';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { MenuOptionCard } from '../components/ui/MenuOptionCard';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';
import { useGameStatistics } from '../hooks/useGameStatistics';

export function JugarHomeScreen({ navigation }: JugarStackScreenProps<'JugarHome'>) {
  const { statistics, refresh: refreshStats } = useGameStatistics();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (refreshStats) {
      await refreshStats();
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScreenContainer scrollable gradient refreshing={refreshing} onRefresh={handleRefresh}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Hero Section - Compact */}
        <Card
          variant="gradient"
          elevated
          animateEntrance
          entranceDelay={100}
          style={styles.heroCard}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroTopRow}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>♠♥♣♦</Text>
                <Text style={styles.logoText}>GUIÑOTE</Text>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>👤</Text>
                </View>
              </View>
            </View>
            <Text style={styles.tagline}>El juego tradicional español</Text>
          </View>
        </Card>

        {/* Primary Game Modes */}
        <SectionHeader
          title="Modos de Juego"
          subtitle="Elige cómo quieres jugar"
          icon="🎮"
          animateEntrance
        />

        <MenuOptionCard
          title="PARTIDA RÁPIDA"
          subtitle="Juega con otros jugadores"
          icon="🎯"
          color="#FF7043"
          onPress={() => navigation.navigate('QuickMatch')}
          animateEntrance
          entranceDelay={200}
        />

        <MenuOptionCard
          title="JUGAR CON AMIGOS"
          subtitle="Crea una sala o únete"
          icon="👥"
          color="#5C6BC0"
          onPress={() => navigation.navigate('FriendsLobby')}
          animateEntrance
          entranceDelay={300}
        />

        <MenuOptionCard
          title="CONTRA LA MÁQUINA"
          subtitle="Practica en solitario"
          icon="🤖"
          color="#66BB6A"
          onPress={() => navigation.navigate('OfflineMode')}
          animateEntrance
          entranceDelay={400}
        />

        {/* Secondary Options */}
        <SectionHeader title="Más Opciones" icon="✨" animateEntrance />

        <View style={styles.secondaryOptions}>
          <Card
            variant="outlined"
            onPress={() => navigation.navigate('LocalMultiplayer')}
            animateEntrance
            entranceDelay={500}
            style={styles.secondaryCard}
          >
            <Text style={styles.secondaryButtonIcon}>📱</Text>
            <Text style={styles.secondaryButtonText}>Juego Local</Text>
          </Card>

          <Card
            variant="outlined"
            onPress={() => navigation.navigate('TutorialSetup')}
            animateEntrance
            entranceDelay={600}
            style={styles.secondaryCard}
          >
            <Text style={styles.secondaryButtonIcon}>🎓</Text>
            <Text style={styles.secondaryButtonText}>Tutorial</Text>
          </Card>
        </View>

        {/* Stats Section */}
        <SectionHeader title="Tus Estadísticas" icon="📊" animateEntrance />

        {statistics ? (
          <View style={styles.statsGrid}>
            <Card variant="filled" animateEntrance entranceDelay={700} style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.elo}</Text>
              <Text style={styles.statLabel}>ELO</Text>
            </Card>
            <Card variant="filled" animateEntrance entranceDelay={800} style={styles.statCard}>
              <Text style={styles.statValue}>
                {statistics.gamesPlayed > 0
                  ? `${Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100)}%`
                  : '0%'}
              </Text>
              <Text style={styles.statLabel}>Victorias</Text>
            </Card>
            <Card variant="filled" animateEntrance entranceDelay={900} style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.currentWinStreak}</Text>
              <Text style={styles.statLabel}>Racha</Text>
            </Card>
            <Card variant="filled" animateEntrance entranceDelay={1000} style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Partidas</Text>
            </Card>
          </View>
        ) : (
          <Card variant="default" style={styles.loadingCard}>
            <Text style={styles.loadingText}>Cargando estadísticas...</Text>
          </Card>
        )}
      </Animated.View>
      <FeedbackButton />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroCard: {
    marginHorizontal: dimensions.spacing.md,
    marginTop: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.md,
    padding: dimensions.spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: dimensions.spacing.xs,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    marginRight: dimensions.spacing.sm,
  },
  logoText: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  userInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarText: {
    fontSize: 18,
  },
  secondaryOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    gap: dimensions.spacing.md,
  },
  secondaryCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dimensions.spacing.lg,
  },
  secondaryButtonIcon: {
    fontSize: 28,
    marginBottom: dimensions.spacing.xs,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    gap: dimensions.spacing.xs,
    marginBottom: dimensions.spacing.md,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.md,
    marginBottom: dimensions.spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xxl,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
