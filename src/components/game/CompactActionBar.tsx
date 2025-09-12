import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { AnimatedButton } from '../ui/AnimatedButton';
import { canCantar, canCambiar7, findPlayerTeam } from '../../utils/gameLogic';
import type { GameState } from '../../types/game.types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

// Animation constants
const ANIMATION_CONFIG = {
  INITIAL_SCALE: 0.3,
  OVERSHOOT_SCALE: 1.15,
  FINAL_SCALE: 1,
  HIDDEN_SCALE: 0.8,
  FADE_DURATION: 200,
  SPRING_FRICTION: 3,
  SPRING_TENSION: 40,
  SETTLE_FRICTION: 5,
} as const;

type CompactActionBarProps = {
  gameState: GameState;
  onCantar: () => void;
  onCambiar7: () => void;
  disabled: boolean;
};

export const CompactActionBar = React.memo(
  ({ gameState, onCantar, onCambiar7, disabled }: CompactActionBarProps) => {
    const fadeAnimCantar = useRef(new Animated.Value(0)).current;
    const fadeAnimCambiar = useRef(new Animated.Value(0)).current;
    const scaleAnimCantar = useRef(new Animated.Value(0.8)).current;
    const scaleAnimCambiar = useRef(new Animated.Value(0.8)).current;

    const currentPlayer = gameState?.players?.[gameState.currentPlayerIndex];
    const currentPlayerHand = currentPlayer ? gameState.hands.get(currentPlayer.id) || [] : [];
    const playerTeam = currentPlayer
      ? gameState.teams.find(team => team.playerIds.includes(currentPlayer.id))
      : undefined;

    const cantableSuits = canCantar(
      currentPlayerHand,
      gameState?.trumpSuit || 'oros',
      playerTeam?.cantes || [],
    );

    // Timing legality: trick not started AND (game start with mano OR team won last trick)
    const trickNotStarted = (gameState?.currentTrick?.length || 0) === 0;
    const isGameStart = !gameState?.lastTrickWinner && (gameState?.trickCount || 0) === 0;
    const isFirstPlayer = gameState
      ? gameState.currentPlayerIndex === (gameState.dealerIndex - 1 + 4) % 4
      : false;
    const lastWinnerTeamMatches = (() => {
      if (!gameState || !playerTeam || !gameState.lastTrickWinner) return false;
      const lwTeam = findPlayerTeam(gameState.lastTrickWinner, gameState);
      return !!lwTeam && lwTeam === playerTeam.id;
    })();
    const canteTimingOk = trickNotStarted && (isGameStart ? isFirstPlayer : lastWinnerTeamMatches);

    const canPlayerCantar = cantableSuits.length > 0 && canteTimingOk && !disabled;
    const canPlayerCambiar7 =
      gameState &&
      canCambiar7(currentPlayerHand, gameState.trumpCard, gameState.deck.length) &&
      !disabled;

    // Animate Cantar button with enhanced pop-up effect
    useEffect(() => {
      if (canPlayerCantar) {
        // Reset for bounce effect
        scaleAnimCantar.setValue(ANIMATION_CONFIG.INITIAL_SCALE);

        Animated.parallel([
          Animated.timing(fadeAnimCantar, {
            toValue: 1,
            duration: ANIMATION_CONFIG.FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.sequence([
            // Overshoot for pop effect
            Animated.spring(scaleAnimCantar, {
              toValue: ANIMATION_CONFIG.OVERSHOOT_SCALE,
              friction: ANIMATION_CONFIG.SPRING_FRICTION,
              tension: ANIMATION_CONFIG.SPRING_TENSION,
              useNativeDriver: true,
            }),
            // Settle back to normal
            Animated.spring(scaleAnimCantar, {
              toValue: ANIMATION_CONFIG.FINAL_SCALE,
              friction: ANIMATION_CONFIG.SETTLE_FRICTION,
              tension: ANIMATION_CONFIG.SPRING_TENSION,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(fadeAnimCantar, {
            toValue: 0,
            duration: ANIMATION_CONFIG.FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimCantar, {
            toValue: ANIMATION_CONFIG.HIDDEN_SCALE,
            duration: ANIMATION_CONFIG.FADE_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [canPlayerCantar, fadeAnimCantar, scaleAnimCantar]);

    // Animate Cambiar 7 button with enhanced pop-up effect
    useEffect(() => {
      if (canPlayerCambiar7) {
        // Reset for bounce effect
        scaleAnimCambiar.setValue(ANIMATION_CONFIG.INITIAL_SCALE);

        Animated.parallel([
          Animated.timing(fadeAnimCambiar, {
            toValue: 1,
            duration: ANIMATION_CONFIG.FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.sequence([
            // Overshoot for pop effect
            Animated.spring(scaleAnimCambiar, {
              toValue: ANIMATION_CONFIG.OVERSHOOT_SCALE,
              friction: ANIMATION_CONFIG.SPRING_FRICTION,
              tension: ANIMATION_CONFIG.SPRING_TENSION,
              useNativeDriver: true,
            }),
            // Settle back to normal
            Animated.spring(scaleAnimCambiar, {
              toValue: ANIMATION_CONFIG.FINAL_SCALE,
              friction: ANIMATION_CONFIG.SETTLE_FRICTION,
              tension: ANIMATION_CONFIG.SPRING_TENSION,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(fadeAnimCambiar, {
            toValue: 0,
            duration: ANIMATION_CONFIG.FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimCambiar, {
            toValue: ANIMATION_CONFIG.HIDDEN_SCALE,
            duration: ANIMATION_CONFIG.FADE_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [canPlayerCambiar7, fadeAnimCambiar, scaleAnimCambiar]);

    // Don't render if no actions available or invalid state
    if (!gameState || !currentPlayer || currentPlayer.isBot) {
      return null;
    }

    if (!canPlayerCantar && !canPlayerCambiar7) {
      return null;
    }

    return (
      <View style={styles.container} pointerEvents="box-none">
        {canPlayerCantar && (
          <Animated.View
            style={[
              styles.buttonWrapper,
              styles.rightWrapper,
              {
                opacity: fadeAnimCantar,
                transform: [{ scale: scaleAnimCantar }],
              },
            ]}
          >
            <AnimatedButton
              onPress={onCantar}
              style={[styles.actionButton, styles.cantarButton, styles.cambiarButtonSmall]}
              hapticType="medium"
            >
              <Text style={[styles.buttonText, styles.cambiarTextSmall]}>Cantar</Text>
            </AnimatedButton>
          </Animated.View>
        )}

        {canPlayerCambiar7 && (
          <Animated.View
            style={[
              styles.buttonWrapper,
              styles.leftWrapper,
              {
                opacity: fadeAnimCambiar,
                transform: [{ scale: scaleAnimCambiar }],
              },
            ]}
          >
            <AnimatedButton
              onPress={onCambiar7}
              style={[styles.actionButton, styles.cambiarButton, styles.cambiarButtonSmall]}
              hapticType="medium"
            >
              <Text style={[styles.buttonText, styles.cambiarTextSmall]}>Cambiar 7</Text>
            </AnimatedButton>
          </Animated.View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Align roughly with bottom-left name tag height
    bottom: 12,
    zIndex: 50,
  },
  buttonWrapper: {
    // Wrapper for animation
    position: 'absolute',
    bottom: 0,
  },
  leftWrapper: {
    // Place in the gap between bottom-left name tag and player's hand
    left: dimensions.spacing.xl * 3 + dimensions.spacing.lg + dimensions.spacing.sm + 12,
    // Raise slightly above the name tag line
    bottom: dimensions.spacing.md,
  },
  rightWrapper: {
    right:
      dimensions.spacing.xl * 3 +
      dimensions.spacing.lg +
      dimensions.spacing.sm +
      12 +
      dimensions.spacing.xs +
      dimensions.spacing.sm +
      dimensions.spacing.md +
      dimensions.spacing.sm,
    bottom: dimensions.spacing.md,
  },
  actionButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.lg,
    minWidth: 80,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
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
  cambiarButtonSmall: {
    paddingHorizontal: dimensions.spacing.xs,
    paddingVertical: 4,
    minWidth: 64,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cambiarTextSmall: {
    fontSize: typography.fontSize.xs,
  },
  // Keep both buttons visually symmetric in size and height
});
