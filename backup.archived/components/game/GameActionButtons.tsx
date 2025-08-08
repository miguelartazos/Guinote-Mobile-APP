import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { AnimatedButton } from '../ui/AnimatedButton';
import { canCantar, canCambiar7 } from '../../utils/gameLogic';
import type { GameState } from '../../types/game.types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type GameActionButtonsProps = {
  gameState: GameState;
  onCantar: () => void;
  onCambiar7: () => void;
  onShowLastTrick?: () => void;
  onDeclareVictory: () => void;
  onRenuncio: () => void;
  disabled: boolean;
};

export const GameActionButtons = React.memo(function GameActionButtons({
  gameState,
  onCantar,
  onCambiar7,
  onShowLastTrick: _onShowLastTrick,
  onDeclareVictory,
  onRenuncio,
  disabled,
}: GameActionButtonsProps) {
  // Defensive checks
  if (
    !gameState ||
    !gameState.players ||
    gameState.currentPlayerIndex >= gameState.players.length
  ) {
    return null;
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer) {
    return null;
  }

  const currentPlayerHand = gameState.hands.get(currentPlayer.id) || [];

  // Find the current player's team to get their cantes
  const playerTeam = gameState.teams.find(team =>
    team.playerIds.includes(currentPlayer.id),
  );

  const cantableSuits = canCantar(
    currentPlayerHand,
    gameState.trumpSuit,
    playerTeam?.cantes || [],
  );

  const canPlayerCantar = cantableSuits.length > 0;

  const canPlayerCambiar7 = canCambiar7(
    currentPlayerHand,
    gameState.trumpCard,
    gameState.deck.length,
  );

  const canDeclare = gameState.canDeclareVictory && !currentPlayer.isBot;

  return (
    <View style={styles.container}>
      <View style={styles.actionButtons}>
        <AnimatedButton
          onPress={onCantar}
          disabled={disabled || !canPlayerCantar}
          style={[
            styles.actionButton,
            styles.cantarButton,
            disabled || !canPlayerCantar ? styles.disabledButton : null,
          ]}
        >
          <Text style={styles.buttonText}>Cantar</Text>
        </AnimatedButton>
        <AnimatedButton
          onPress={onCambiar7}
          disabled={disabled || !canPlayerCambiar7}
          style={[
            styles.actionButton,
            styles.cambiarButton,
            disabled || !canPlayerCambiar7 ? styles.disabledButton : null,
          ]}
        >
          <Text style={styles.buttonText}>Cambiar 7</Text>
        </AnimatedButton>
      </View>

      <View style={styles.bottomActions}>
        {canDeclare && (
          <AnimatedButton
            onPress={onDeclareVictory}
            style={[styles.declareButton, styles.primaryButton]}
          >
            <Text style={styles.declareButtonText}>¡Las 101!</Text>
          </AnimatedButton>
        )}
        <AnimatedButton
          onPress={onRenuncio}
          style={[styles.actionButton, styles.salirButton]}
        >
          <Text style={styles.buttonText}>Renuncio</Text>
        </AnimatedButton>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: dimensions.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: dimensions.spacing.sm,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: dimensions.spacing.md,
  },
  declareButton: {
    backgroundColor: colors.accent,
  },
  renuncioButton: {
    minWidth: 100,
  },
  actionButton: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
    minWidth: 120,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  cantarButton: {
    backgroundColor: colors.cantarGreen,
  },
  cambiarButton: {
    backgroundColor: colors.cambiarBlue,
  },
  salirButton: {
    backgroundColor: colors.salirRed,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  declareButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  dangerButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
});
