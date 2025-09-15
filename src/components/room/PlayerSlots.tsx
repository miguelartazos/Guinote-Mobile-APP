import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import type { Player } from '../../hooks/useUnifiedRooms';

interface PlayerSlotsProps {
  players: Player[];
  onAddAI: () => void;
  isHost: boolean;
}

export function PlayerSlots({ players, onAddAI, isHost }: PlayerSlotsProps) {
  const { width, height } = useWindowDimensions();
  const isTabletLike = Math.min(width, height) >= 768;
  const getTeamForPosition = (position: number): 'team1' | 'team2' => {
    // Positions 0, 2 are team1; positions 1, 3 are team2
    return position % 2 === 0 ? 'team1' : 'team2';
  };

  const getTeamColor = (team: 'team1' | 'team2') => {
    return team === 'team1' ? colors.cantarGreen : colors.accent;
  };

  const getPlayerAvatar = (player: Player) => {
    if (player.isBot) {
      return ['🤖', '🎮', '🎯', '🎲'][player.position % 4];
    }
    return ['👤', '🧑', '👨', '👩'][player.position % 4];
  };

  const renderSlot = (position: number) => {
    const player = players.find(p => p.position === position);
    const team = getTeamForPosition(position);
    const teamColor = getTeamColor(team);

    return (
      <View
        key={position}
        testID={`player-slot-${position}`}
        accessibilityLabel={`Player slot ${position} ${team}`}
        style={[
          styles.slot,
          { borderLeftColor: teamColor, borderLeftWidth: 4 },
          !player && styles.emptySlotStyle,
        ]}
      >
        {player ? (
          <View style={styles.playerInfo}>
            <View style={[styles.avatarContainer, { backgroundColor: teamColor + '20' }]}>
              <Text style={styles.playerIcon}>{getPlayerAvatar(player)}</Text>
              {player.isReady && (
                <View style={styles.readyBadge}>
                  <Text style={styles.readyIcon}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.playerDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </Text>
                {player.isBot && (
                  <View style={styles.botBadge}>
                    <Text style={styles.botBadgeText}>IA</Text>
                  </View>
                )}
              </View>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: player.isReady ? colors.cantarGreen : colors.warning },
                  ]}
                />
                <Text style={styles.playerStatus}>{player.isReady ? 'Listo' : 'Esperando'}</Text>
              </View>
            </View>
            {player.connectionStatus === 'disconnected' && (
              <View style={styles.disconnectedBadge}>
                <Text style={styles.disconnectedIcon}>⚠️</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptySlot}>
            <View style={styles.emptyAvatarContainer}>
              <Text style={styles.emptyIcon}>➕</Text>
            </View>
            <Text style={styles.emptySlotText}>Esperando jugador...</Text>
            {isHost && (
              <TouchableOpacity
                testID={`add-ai-button-${position}`}
                style={styles.addAIButton}
                onPress={onAddAI}
                activeOpacity={0.7}
              >
                <Text style={styles.addAIButtonText}>+ IA</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jugadores</Text>
        <View style={styles.playerCount}>
          <Text style={styles.playerCountText}>{players.length}/4</Text>
        </View>
      </View>
      <View
        style={[
          styles.slots,
          {
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: dimensions.spacing.md,
            rowGap: dimensions.spacing.md,
          },
        ]}
      >
        {[0, 1, 2, 3].map(position => (
          <View
            key={position}
            style={{
              flexBasis: isTabletLike ? '48%' : '48%',
              flexGrow: 0,
            }}
          >
            {renderSlot(position)}
          </View>
        ))}
      </View>
      <View style={styles.teamLegend}>
        <View style={styles.teamIndicator}>
          <View style={[styles.teamDot, { backgroundColor: colors.cantarGreen }]} />
          <Text style={styles.teamText}>Equipo 1</Text>
        </View>
        <View style={styles.teamIndicator}>
          <View style={[styles.teamDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.teamText}>Equipo 2</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  playerCount: {
    backgroundColor: colors.secondary,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: 20,
  },
  playerCountText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent,
  },
  slots: {
    gap: dimensions.spacing.md,
  },
  slot: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptySlotStyle: {
    backgroundColor: colors.background,
    borderStyle: 'dashed',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: dimensions.spacing.md,
    position: 'relative',
  },
  playerIcon: {
    fontSize: 32,
  },
  readyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.cantarGreen,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  readyIcon: {
    color: colors.white,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  playerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.xs,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  botBadge: {
    backgroundColor: colors.info,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 2,
    borderRadius: dimensions.borderRadius.sm,
    marginLeft: dimensions.spacing.xs,
  },
  botBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: dimensions.spacing.xs,
  },
  playerStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  disconnectedBadge: {
    padding: dimensions.spacing.xs,
  },
  disconnectedIcon: {
    fontSize: 20,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginRight: dimensions.spacing.md,
  },
  emptyIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  emptySlotText: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
  },
  addAIButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  addAIButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  teamLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: dimensions.spacing.xl,
    marginTop: dimensions.spacing.md,
    paddingTop: dimensions.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  teamIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: dimensions.spacing.xs,
  },
  teamText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
