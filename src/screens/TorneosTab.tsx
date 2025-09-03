import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import type { MainTabScreenProps } from '../types/navigation';
import { Card } from '../components/ui/Card';

type Tournament = {
  id: string;
  name: string;
  status: 'active' | 'upcoming' | 'completed';
  position?: number;
  totalPlayers?: number;
  prize?: string;
  startTime?: string;
  endTime?: string;
};

export function TorneosTab({ navigation }: MainTabScreenProps<'Torneos'>) {
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [achievements, setAchievements] = useState({
    tournamentsWon: 0,
    bestPosition: 0,
    totalPrizes: 0,
  });

  useEffect(() => {
    // Simulated data - replace with actual API calls
    setActiveTournament({
      id: '1',
      name: 'Torneo Semanal',
      status: 'active',
      position: 12,
      totalPlayers: 128,
      prize: '500 monedas',
    });

    setUpcomingTournaments([
      { id: '2', name: 'Torneo Diario', status: 'upcoming', startTime: '2h', prize: '100 monedas' },
      {
        id: '3',
        name: 'Copa Mensual',
        status: 'upcoming',
        startTime: '5 días',
        prize: '2000 monedas',
      },
    ]);

    setAchievements({
      tournamentsWon: 3,
      bestPosition: 2,
      totalPrizes: 1500,
    });
  }, []);

  const handleJoinTournament = () => {
    Alert.alert('Torneos', 'Función de torneos próximamente disponible');
  };

  const handleViewAll = () => {
    Alert.alert('Torneos', 'Lista completa de torneos próximamente');
  };

  const handleViewHistory = () => {
    Alert.alert('Historial', 'Historial de torneos próximamente');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TORNEOS</Text>
        <Text style={styles.headerSubtitle}>Compite y gana premios</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Active Tournament */}
        {activeTournament && (
          <Card elevated style={styles.activeTournamentCard}>
            <View style={styles.tournamentHeader}>
              <Text style={styles.tournamentIcon}>🏆</Text>
              <View style={styles.tournamentInfo}>
                <Text style={styles.tournamentName}>{activeTournament.name}</Text>
                <Text style={styles.tournamentStatus}>EN CURSO</Text>
              </View>
            </View>
            <View style={styles.tournamentStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>#{activeTournament.position}</Text>
                <Text style={styles.statLabel}>Posición</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{activeTournament.totalPlayers}</Text>
                <Text style={styles.statLabel}>Jugadores</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{activeTournament.prize}</Text>
                <Text style={styles.statLabel}>Premio</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleJoinTournament}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Jugar Ahora</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Upcoming Tournaments */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📅</Text>
            <Text style={styles.sectionTitle}>PRÓXIMOS TORNEOS</Text>
          </View>
          {upcomingTournaments.map((tournament, index) => (
            <View key={tournament.id} style={styles.upcomingItem}>
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingName}>{tournament.name}</Text>
                <Text style={styles.upcomingTime}>Empieza en {tournament.startTime}</Text>
              </View>
              <Text style={styles.upcomingPrize}>{tournament.prize}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.linkButton} onPress={handleViewAll} activeOpacity={0.7}>
            <Text style={styles.linkButtonText}>Ver Todos →</Text>
          </TouchableOpacity>
        </Card>

        {/* Achievements */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🥇</Text>
            <Text style={styles.sectionTitle}>TUS LOGROS</Text>
          </View>
          <View style={styles.achievementsGrid}>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementValue}>{achievements.tournamentsWon}</Text>
              <Text style={styles.achievementLabel}>Ganados</Text>
            </View>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementValue}>#{achievements.bestPosition}</Text>
              <Text style={styles.achievementLabel}>Mejor Pos.</Text>
            </View>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementValue}>{achievements.totalPrizes}</Text>
              <Text style={styles.achievementLabel}>Monedas</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleViewHistory}
            activeOpacity={0.7}
          >
            <Text style={styles.linkButtonText}>Ver Historial →</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: dimensions.spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: dimensions.spacing.md,
    gap: dimensions.spacing.md,
  },
  activeTournamentCard: {
    backgroundColor: colors.accent,
    padding: dimensions.spacing.lg,
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  tournamentIcon: {
    fontSize: 36,
    marginRight: dimensions.spacing.md,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  tournamentStatus: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  tournamentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: dimensions.borderRadius.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: dimensions.spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.white,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
  },
  sectionCard: {
    padding: dimensions.spacing.md,
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  upcomingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  upcomingTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  upcomingPrize: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
  },
  linkButton: {
    marginTop: dimensions.spacing.sm,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  achievementsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: dimensions.spacing.sm,
  },
  achievementItem: {
    alignItems: 'center',
  },
  achievementValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
  },
  achievementLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
