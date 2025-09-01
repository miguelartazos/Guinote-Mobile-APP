import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  const getTeamForPosition = (position: number): 'team1' | 'team2' => {
    // Positions 0, 2 are team1; positions 1, 3 are team2
    return position % 2 === 0 ? 'team1' : 'team2';
  };

  const renderSlot = (position: number) => {
    const player = players.find(p => p.position === position);
    const team = getTeamForPosition(position);

    return (
      <View
        key={position}
        testID={`player-slot-${position}`}
        accessibilityLabel={`Player slot ${position} ${team}`}
        style={styles.slot}
      >
        {player ? (
          <View style={styles.playerInfo}>
            <Text style={styles.playerIcon}>{player.isBot ? '🤖' : '👤'}</Text>
            <View style={styles.playerDetails}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerStatus}>
                {player.isReady ? '✅ Listo' : '⏳ Esperando'}
              </Text>
            </View>
            {player.connectionStatus === 'disconnected' && (
              <Text style={styles.disconnectedIcon}>🔌</Text>
            )}
          </View>
        ) : (
          <View style={styles.emptySlot}>
            <Text style={styles.emptySlotText}>Esperando jugador...</Text>
            {isHost && (
              <TouchableOpacity
                testID={`add-ai-button-${position}`}
                style={styles.addAIButton}
                onPress={onAddAI}
              >
                <Text style={styles.addAIButtonText}>+ Añadir IA</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Jugadores</Text>
      <View style={styles.slots}>{[0, 1, 2, 3].map(position => renderSlot(position))}</View>
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
  slots: {
    gap: dimensions.spacing.sm,
  },
  slot: {
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerIcon: {
    fontSize: 28,
    marginRight: dimensions.spacing.sm,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  playerStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  disconnectedIcon: {
    fontSize: 20,
    color: colors.error,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptySlotText: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  addAIButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  addAIButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.semibold,
  },
});
