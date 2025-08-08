import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { AnimatedButton } from '../ui/AnimatedButton';
import { canCantar, canCambiar7 } from '../../utils/gameLogic';
import type { GameState } from '../../types/game.types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type CompactActionBarProps = {
  gameState: GameState;
  onCantar: () => void;
  onCambiar7: () => void;
  disabled: boolean;
};

export const CompactActionBar = React.memo(function CompactActionBar({
  gameState,
  onCantar,
  onCambiar7,
  disabled,
}: CompactActionBarProps) {
  const fadeAnimCantar = useRef(new Animated.Value(0)).current;
  const fadeAnimCambiar = useRef(new Animated.Value(0)).current;
  const scaleAnimCantar = useRef(new Animated.Value(0.8)).current;
  const scaleAnimCambiar = useRef(new Animated.Value(0.8)).current;

  const currentPlayer = gameState?.players?.[gameState.currentPlayerIndex];
  const currentPlayerHand = currentPlayer
    ? gameState.hands.get(currentPlayer.id) || []
    : [];
  const playerTeam = currentPlayer
    ? gameState.teams.find(team => team.playerIds.includes(currentPlayer.id))
    : undefined;

  const cantableSuits = canCantar(
    currentPlayerHand,
    gameState?.trumpSuit || 'oros',
    playerTeam?.cantes || [],
  );

  const canPlayerCantar = cantableSuits.length > 0 && !disabled;
  const canPlayerCambiar7 =
    gameState &&
    canCambiar7(
      currentPlayerHand,
      gameState.trumpCard,
      gameState.deck.length,
    ) &&
    !disabled;

  // Animate Cantar button
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimCantar, {
        toValue: canPlayerCantar ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimCantar, {
        toValue: canPlayerCantar ? 1 : 0.8,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [canPlayerCantar, fadeAnimCantar, scaleAnimCantar]);

  // Animate Cambiar 7 button
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimCambiar, {
        toValue: canPlayerCambiar7 ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimCambiar, {
        toValue: canPlayerCambiar7 ? 1 : 0.8,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [canPlayerCambiar7, fadeAnimCambiar, scaleAnimCambiar]);

  // Don't render if no actions available or invalid state
  if (!gameState || !currentPlayer || currentPlayer.isBot) {
    return null;
  }

  if (!canPlayerCantar && !canPlayerCambiar7) {
    return null;
  }

  return (
    <View style={styles.container}>
      {canPlayerCantar && (
        <Animated.View
          style={[
            styles.buttonWrapper,
            {
              opacity: fadeAnimCantar,
              transform: [{ scale: scaleAnimCantar }],
            },
          ]}
        >
          <AnimatedButton
            onPress={onCantar}
            style={[styles.actionButton, styles.cantarButton]}
            hapticType="medium"
          >
            <Text style={styles.buttonText}>Cantar</Text>
          </AnimatedButton>
        </Animated.View>
      )}

      {canPlayerCambiar7 && (
        <Animated.View
          style={[
            styles.buttonWrapper,
            {
              opacity: fadeAnimCambiar,
              transform: [{ scale: scaleAnimCambiar }],
            },
          ]}
        >
          <AnimatedButton
            onPress={onCambiar7}
            style={[styles.actionButton, styles.cambiarButton]}
            hapticType="medium"
          >
            <Text style={styles.buttonText}>Cambiar 7</Text>
          </AnimatedButton>
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: dimensions.spacing.md,
    zIndex: 50,
  },
  buttonWrapper: {
    // Wrapper for animation
  },
  actionButton: {
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.xl,
    minWidth: 100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cantarButton: {
    backgroundColor: colors.cantarGreen,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cambiarButton: {
    backgroundColor: colors.cambiarBlue,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
