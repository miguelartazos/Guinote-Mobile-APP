import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import type { MainTabScreenProps } from '../types/navigation';
import { Card } from '../components/ui/Card';
import { useGameStatistics } from '../hooks/useGameStatistics';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useUnifiedFriends } from '../hooks/useUnifiedFriends';

type Friend = {
  id: string;
  username: string;
  status: 'online' | 'offline' | 'in_game';
  elo?: number;
};

export function SocialTab({ navigation }: MainTabScreenProps<'Social'>) {
  const { user } = useUnifiedAuth();
  const { statistics } = useGameStatistics();
  const { onlineFriends, getOnlineFriends } = useUnifiedFriends();
  const [displayFriends, setDisplayFriends] = useState<Friend[]>([]);

  useEffect(() => {
    // Load friends
    if (user) {
      getOnlineFriends();
    }

    // Mock friends for display
    setDisplayFriends([
      { id: '1', username: 'Carlos92', status: 'online', elo: 1320 },
      { id: '2', username: 'MariaG', status: 'online', elo: 1450 },
      { id: '3', username: 'PedroElGrande', status: 'in_game', elo: 1680 },
    ]);
  }, [user]);

  const handleViewDetails = () => {
    Alert.alert('Estadísticas', 'Vista detallada próximamente');
  };

  const handleInviteFriend = (friendId: string) => {
    Alert.alert('Invitar', 'Sistema de invitaciones próximamente');
  };

  const handleAddFriend = () => {
    Alert.alert('Añadir Amigo', 'Función próximamente disponible');
  };

  const handleViewProfile = (friendId: string) => {
    Alert.alert('Perfil', 'Vista de perfil próximamente');
  };

  const getStatusIcon = (status: Friend['status']) => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'in_game':
        return '🎮';
      case 'offline':
        return '⚫';
      default:
        return '⚫';
    }
  };

  const winRate = statistics
    ? Math.round((statistics.gamesWon / Math.max(statistics.gamesPlayed, 1)) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SOCIAL</Text>
        <Text style={styles.headerSubtitle}>Perfil y amigos</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Profile Section */}
        <Card elevated style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileIcon}>👤</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.username || 'Jugador'}</Text>
              <View style={styles.profileStats}>
                <Text style={styles.profileStat}>ELO: {statistics?.elo || 1200}</Text>
                <Text style={styles.profileDivider}>•</Text>
                <Text style={styles.profileStat}>Liga: Oro</Text>
                <Text style={styles.profileDivider}>•</Text>
                <Text style={styles.profileStat}>Nivel: 15</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Statistics Section */}
        <Card style={styles.statsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📊</Text>
            <Text style={styles.sectionTitle}>ESTADÍSTICAS</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{winRate}%</Text>
              <Text style={styles.statLabel}>Victorias</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{statistics?.gamesPlayed || 0}</Text>
              <Text style={styles.statLabel}>Partidas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{statistics?.currentWinStreak || 0}</Text>
              <Text style={styles.statLabel}>Racha</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleViewDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.linkButtonText}>Ver Detalles →</Text>
          </TouchableOpacity>
        </Card>

        {/* Friends Section */}
        <Card style={styles.friendsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👥</Text>
            <Text style={styles.sectionTitle}>
              AMIGOS ({displayFriends.filter(f => f.status === 'online').length} online)
            </Text>
          </View>
          <View style={styles.friendsList}>
            {displayFriends.slice(0, 3).map(friend => (
              <View key={friend.id} style={styles.friendItem}>
                <View style={styles.friendInfo}>
                  <Text style={styles.statusIcon}>{getStatusIcon(friend.status)}</Text>
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{friend.username}</Text>
                    <Text style={styles.friendElo}>ELO: {friend.elo}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.friendAction}
                  onPress={() =>
                    friend.status === 'online'
                      ? handleInviteFriend(friend.id)
                      : handleViewProfile(friend.id)
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.friendActionText}>
                    {friend.status === 'online' ? 'Invitar' : 'Ver Perfil'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={handleAddFriend}
            activeOpacity={0.7}
          >
            <Text style={styles.addFriendText}>Añadir Amigo +</Text>
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
  profileCard: {
    backgroundColor: colors.accent,
    padding: dimensions.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 40,
    marginRight: dimensions.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: 4,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileStat: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  profileDivider: {
    marginHorizontal: dimensions.spacing.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statsCard: {
    padding: dimensions.spacing.md,
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: dimensions.spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: dimensions.borderRadius.md,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  linkButton: {
    marginTop: dimensions.spacing.xs,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  friendsCard: {
    padding: dimensions.spacing.md,
    backgroundColor: colors.surface,
    flex: 1,
    maxHeight: 240,
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: dimensions.spacing.sm,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  friendElo: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  friendAction: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.sm,
  },
  friendActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  addFriendButton: {
    marginTop: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: dimensions.borderRadius.md,
  },
  addFriendText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});
