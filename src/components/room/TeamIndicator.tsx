import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import type { Player } from '../../hooks/useUnifiedRooms';

interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface TeamIndicatorProps {
  teams: Team[];
}

export function TeamIndicator({ teams }: TeamIndicatorProps) {
  const renderTeam = (team: Team, isFirst: boolean) => {
    const positions = isFirst ? 'Jugadores 1 y 3' : 'Jugadores 2 y 4';

    return (
      <View style={styles.team}>
        <Text style={styles.teamName}>{team.name}</Text>
        <Text style={styles.teamPositions}>{positions}</Text>
        <View style={styles.playersList}>
          {team.players.length > 0 ? (
            team.players.map(player => (
              <View key={player.id} style={styles.playerRow}>
                <Text style={styles.playerIcon}>{player.isBot ? '🤖' : '👤'}</Text>
                <Text style={styles.playerName}>{player.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyTeam}>Sin jugadores</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Equipos</Text>
      <View style={styles.teamsContainer}>
        {teams[0] && (
          <View accessibilityLabel="Equipo 1" testID="team-1">
            {renderTeam(teams[0], true)}
          </View>
        )}
        <View style={styles.vsSeparator}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        {teams[1] && (
          <View accessibilityLabel="Equipo 2" testID="team-2">
            {renderTeam(teams[1], false)}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  team: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
    textAlign: 'center',
  },
  teamPositions: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playersList: {
    marginTop: dimensions.spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: dimensions.spacing.xs,
  },
  playerIcon: {
    fontSize: 18,
    marginRight: dimensions.spacing.xs,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    flex: 1,
  },
  emptyTeam: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: dimensions.spacing.sm,
  },
  vsSeparator: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: dimensions.spacing.md,
  },
  vsText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
  },
});
