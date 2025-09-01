import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import type { SpanishSuit } from '../../types/cardTypes';

export interface CardInfo {
  suit: SpanishSuit;
  value: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  cards: CardInfo[];
  isEliminated: boolean;
}

interface SpectatorModeProps {
  enabled: boolean;
  players: PlayerInfo[];
  currentPlayerId: string;
  currentTurnPlayerId?: string;
  teamScores?: {
    team1: number;
    team2: number;
  };
}

export function SpectatorMode({
  enabled,
  players,
  currentPlayerId: _currentPlayerId,
  currentTurnPlayerId,
  teamScores,
}: SpectatorModeProps) {
  if (!enabled) {
    return null;
  }

  const activePlayers = players.filter(p => !p.isEliminated);

  return (
    <View style={styles.overlay} testID="spectator-overlay">
      <View style={styles.header}>
        <Text style={styles.title}>Modo Espectador</Text>
        <Text style={styles.subtitle}>
          Has sido eliminado. Puedes ver las cartas de todos los jugadores.
        </Text>
        <Text style={styles.activeCount}>
          Jugadores activos: {activePlayers.length}/{players.length}
        </Text>
      </View>

      {teamScores && (
        <View style={styles.scoresContainer}>
          <Text style={styles.scoreText}>Equipo 1: {teamScores.team1}</Text>
          <Text style={styles.scoreText}>Equipo 2: {teamScores.team2}</Text>
        </View>
      )}

      <ScrollView style={styles.playersContainer} horizontal>
        {players.map(player => (
          <View key={player.id} style={styles.playerSection}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerName}>
                {player.name}
                {player.isEliminated && ' (Eliminado)'}
              </Text>
              {player.id === currentTurnPlayerId && (
                <View testID={`current-turn-${player.id}`} style={styles.currentTurnIndicator} />
              )}
            </View>

            {!player.isEliminated && (
              <>
                <Text style={styles.cardCount}>
                  {player.cards.length} {player.cards.length === 1 ? 'carta' : 'cartas'}
                </Text>
                <View style={styles.cardsContainer}>
                  {player.cards.map((card, index) => (
                    <View key={index} style={styles.cardWrapper}>
                      <Card suit={card.suit} value={card.value} size="small" selectable={false} />
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 2000,
    paddingTop: dimensions.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: dimensions.spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.md,
  },
  activeCount: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.semibold,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.lg,
  },
  scoreText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  playersContainer: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.md,
  },
  playerSection: {
    marginRight: dimensions.spacing.xl,
    minWidth: 200,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  playerName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  currentTurnIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginLeft: dimensions.spacing.sm,
  },
  cardCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: dimensions.spacing.sm,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.spacing.sm,
  },
  cardWrapper: {
    marginBottom: dimensions.spacing.xs,
  },
});
