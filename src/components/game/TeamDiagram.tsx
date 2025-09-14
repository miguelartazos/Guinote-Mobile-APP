import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, TABLE_COLORS } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type TeamDiagramProps = {
  playerNames: string[];
  playerCount: 2 | 4;
};

export function TeamDiagram({ playerNames, playerCount }: TeamDiagramProps) {
  if (playerCount === 2) {
    return (
      <View style={styles.container}>
        <View style={styles.twoPlayerLayout}>
          <View style={[styles.playerSeat, styles.team1]}>
            <Text style={styles.playerNumber}>1</Text>
            <Text style={styles.playerName}>{playerNames[0] || 'Jugador 1'}</Text>
            <Text style={styles.teamLabel}>Equipo 1</Text>
          </View>
          <View style={styles.vs}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={[styles.playerSeat, styles.team2]}>
            <Text style={styles.playerNumber}>2</Text>
            <Text style={styles.playerName}>{playerNames[1] || 'Jugador 2'}</Text>
            <Text style={styles.teamLabel}>Equipo 2</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.fourPlayerLayout}>
        {/* Top player */}
        <View style={styles.topRow}>
          <View style={[styles.playerSeat, styles.team2]}>
            <Text style={styles.playerNumber}>2</Text>
            <Text style={styles.playerName}>{playerNames[1] || 'Jugador 2'}</Text>
          </View>
        </View>

        {/* Middle row with left, center table, and right players */}
        <View style={styles.middleRow}>
          <View style={[styles.playerSeat, styles.team1]}>
            <Text style={styles.playerNumber}>1</Text>
            <Text style={styles.playerName}>{playerNames[0] || 'Jugador 1'}</Text>
          </View>

          <View style={styles.tableCenter}>
            <View style={styles.table}>
              <Text style={styles.tableIcon}>🎴</Text>
            </View>
            <View style={styles.teamIndicators}>
              <View style={styles.teamIndicator}>
                <View style={[styles.teamDot, styles.teamDot1]} />
                <Text style={styles.teamText}>Equipo 1</Text>
              </View>
              <View style={styles.teamIndicator}>
                <View style={[styles.teamDot, styles.teamDot2]} />
                <Text style={styles.teamText}>Equipo 2</Text>
              </View>
            </View>
          </View>

          <View style={[styles.playerSeat, styles.team1]}>
            <Text style={styles.playerNumber}>3</Text>
            <Text style={styles.playerName}>{playerNames[2] || 'Jugador 3'}</Text>
          </View>
        </View>

        {/* Bottom player */}
        <View style={styles.bottomRow}>
          <View style={[styles.playerSeat, styles.team2]}>
            <Text style={styles.playerNumber}>4</Text>
            <Text style={styles.playerName}>{playerNames[3] || 'Jugador 4'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.explanation}>Los jugadores enfrentados son compañeros de equipo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
  },
  twoPlayerLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  fourPlayerLayout: {
    aspectRatio: 1,
    minHeight: 250,
  },
  topRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  middleRow: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  playerSeat: {
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
  },
  team1: {
    borderColor: '#4FC3F7',
    backgroundColor: '#4FC3F710',
  },
  team2: {
    borderColor: '#FF7043',
    backgroundColor: '#FF704310',
  },
  playerNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  playerName: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
  teamLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.xs,
  },
  vs: {
    paddingHorizontal: dimensions.spacing.lg,
  },
  vsText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  tableCenter: {
    alignItems: 'center',
  },
  table: {
    width: 80,
    height: 80,
    backgroundColor: TABLE_COLORS.green,
    borderRadius: dimensions.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableIcon: {
    fontSize: 32,
  },
  teamIndicators: {
    flexDirection: 'row',
    marginTop: dimensions.spacing.sm,
    gap: dimensions.spacing.md,
  },
  teamIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.spacing.xs,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamDot1: {
    backgroundColor: '#4FC3F7',
  },
  teamDot2: {
    backgroundColor: '#FF7043',
  },
  teamText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  explanation: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: dimensions.spacing.lg,
  },
});

// Uses app-wide TABLE_COLORS from constants
