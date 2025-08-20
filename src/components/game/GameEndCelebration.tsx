import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import {
  CONFETTI_DURATION,
  CARD_DANCE_DURATION,
  SCORE_COUNT_DURATION,
  BOUNCE_EASING,
  ELASTIC_EASING,
} from '../../constants/animations';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CelebrationType = 'partida' | 'coto' | 'match';

type GameEndCelebrationProps = {
  isWinner: boolean;
  finalScore: { player: number; opponent: number };
  onComplete: () => void;
  playSound?: () => void;
  celebrationType?: CelebrationType;
  matchScore?: {
    team1Partidas: number;
    team2Partidas: number;
    team1Cotos: number;
    team2Cotos: number;
  };
  onContinue?: () => void; // For continuing to next partida/coto
};

type ConfettiPiece = {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
};

export function GameEndCelebration({
  isWinner,
  finalScore,
  onComplete,
  playSound,
  celebrationType = 'match',
  matchScore,
  onContinue,
}: GameEndCelebrationProps) {
  const screenDimensions = Dimensions.get('window');

  // Title animation
  const titleAnimation = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
    translateY: new Animated.Value(-50),
  }).current;

  // Score counting animation
  const playerScoreAnim = useRef(new Animated.Value(0)).current;
  const opponentScoreAnim = useRef(new Animated.Value(0)).current;

  // Confetti pieces
  const confettiPieces = useRef<ConfettiPiece[]>(
    Array.from({ length: isWinner ? 30 : 0 }, () => ({
      x: new Animated.Value(Math.random() * screenDimensions.width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: [colors.accent, colors.warning, colors.text][Math.floor(Math.random() * 3)],
    })),
  ).current;

  // Card dance animation
  const cardDanceAnimation = useRef({
    rotation: new Animated.Value(0),
    scale: new Animated.Value(1),
  }).current;

  useEffect(() => {
    const runAnimation = async () => {
      playSound?.();

      // 1. Show title
      await showTitle();

      // 2. Count scores
      await countScores();

      // 3. Celebration effects
      if (isWinner) {
        await Promise.all([animateConfetti(), animateCardDance()]);
      }

      // Complete
      setTimeout(onComplete, 500);
    };

    runAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showTitle = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(titleAnimation.opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(titleAnimation.scale, {
          toValue: 1,
          speed: 14,
          bounciness: 12,
          useNativeDriver: true,
        }),
        Animated.timing(titleAnimation.translateY, {
          toValue: 0,
          duration: 500,
          easing: BOUNCE_EASING,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });
  };

  const countScores = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(playerScoreAnim, {
          toValue: finalScore.player,
          duration: SCORE_COUNT_DURATION,
          easing: ELASTIC_EASING,
          useNativeDriver: false,
        }),
        Animated.timing(opponentScoreAnim, {
          toValue: finalScore.opponent,
          duration: SCORE_COUNT_DURATION,
          easing: ELASTIC_EASING,
          useNativeDriver: false,
        }),
      ]).start(() => resolve(null));
    });
  };

  const animateConfetti = async () => {
    const animations = confettiPieces.map(piece =>
      Animated.parallel([
        Animated.timing(piece.y, {
          toValue: screenDimensions.height + 100,
          duration: CONFETTI_DURATION + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: (Math.random() - 0.5) * 200,
          duration: CONFETTI_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: Math.random() * 8,
          duration: CONFETTI_DURATION,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(CONFETTI_DURATION * 0.7),
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration: CONFETTI_DURATION * 0.3,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    await new Promise(resolve => {
      Animated.parallel(animations).start(() => resolve(null));
    });
  };

  const animateCardDance = async () => {
    await new Promise(resolve => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cardDanceAnimation.rotation, {
            toValue: 0.1,
            duration: CARD_DANCE_DURATION / 4,
            useNativeDriver: true,
          }),
          Animated.timing(cardDanceAnimation.rotation, {
            toValue: -0.1,
            duration: CARD_DANCE_DURATION / 4,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 },
      ).start(() => resolve(null));
    });
  };

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Title */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleAnimation.opacity,
            transform: [{ scale: titleAnimation.scale }, { translateY: titleAnimation.translateY }],
          },
        ]}
      >
        <Text style={[styles.titleText, isWinner && styles.winnerText]}>
          {celebrationType === 'partida'
            ? isWinner
              ? '¡Partida Ganada!'
              : 'Partida Perdida'
            : celebrationType === 'coto'
            ? isWinner
              ? '¡Coto Ganado!'
              : 'Coto Perdido'
            : isWinner
            ? '¡VICTORIA TOTAL!'
            : '¡Fin del Juego!'}
        </Text>
      </Animated.View>

      {/* Score display */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Tu puntuación</Text>
          <AnimatedText
            value={playerScoreAnim}
            style={[styles.scoreText, isWinner && styles.winnerScore]}
          />
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Oponente</Text>
          <AnimatedText
            value={opponentScoreAnim}
            style={[styles.scoreText, !isWinner && styles.winnerScore]}
          />
        </View>
      </View>

      {/* Match progress display */}
      {matchScore && celebrationType !== 'match' && (
        <View style={styles.matchProgressContainer}>
          <Text style={styles.matchProgressText}>
            Partidas: {matchScore.team1Partidas} - {matchScore.team2Partidas}
          </Text>
          <Text style={styles.matchProgressText}>
            Cotos: {matchScore.team1Cotos} - {matchScore.team2Cotos}
          </Text>
          {onContinue && (
            <View style={styles.continueButton}>
              <Text style={styles.continueButtonText} onPress={onContinue}>
                Continuar al siguiente {celebrationType === 'coto' ? 'coto' : 'partida'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Confetti */}
      {isWinner && (
        <Svg
          style={StyleSheet.absoluteFillObject}
          viewBox={`0 0 ${screenDimensions.width} ${screenDimensions.height}`}
        >
          {confettiPieces.map((piece, index) => (
            <AnimatedCircle
              key={`confetti-${index}`}
              cx={piece.x}
              cy={piece.y}
              r="5"
              fill={piece.color}
              opacity={piece.opacity}
              transform="rotate(0)"
            />
          ))}
        </Svg>
      )}

      {/* Dancing cards visual */}
      {isWinner && (
        <Animated.View
          style={[
            styles.dancingCards,
            {
              transform: [
                {
                  rotate: cardDanceAnimation.rotation.interpolate({
                    inputRange: [-0.1, 0.1],
                    outputRange: ['-5.7deg', '5.7deg'], // Convert radians to degrees
                  }),
                },
                { scale: cardDanceAnimation.scale },
              ],
            },
          ]}
        >
          <Text style={styles.cardEmoji}>🎴</Text>
        </Animated.View>
      )}
    </View>
  );
}

// Helper component for animated text
function AnimatedText({ value, style }: { value: Animated.Value; style: any }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const listener = value.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => {
      value.removeListener(listener);
    };
  }, [value]);

  return <Text style={style}>{displayValue}</Text>;
}

const styles = StyleSheet.create({
  titleContainer: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  titleText: {
    fontSize: typography.fontSize.xxxl * 1.5,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
  },
  winnerText: {
    color: colors.accent,
  },
  scoreContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    zIndex: 5,
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  scoreLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  winnerScore: {
    color: colors.accent,
  },
  dancingCards: {
    position: 'absolute',
    bottom: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  cardEmoji: {
    fontSize: 80,
  },
  matchProgressContainer: {
    position: 'absolute',
    bottom: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
    backgroundColor: colors.surface,
    marginHorizontal: 40,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchProgressText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginVertical: 4,
  },
  continueButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
