import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  Dimensions,
  TouchableOpacity,
  Easing,
} from 'react-native';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { useOrientation } from '../../hooks/useOrientation';
import {
  CONFETTI_DURATION,
  CARD_DANCE_DURATION,
  SCORE_COUNT_DURATION,
  BOUNCE_EASING,
  ELASTIC_EASING,
} from '../../constants/animations';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

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
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  // Title animation
  const titleAnimation = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.9),
    translateY: new Animated.Value(-30),
  }).current;

  // Score counting animation
  const playerScoreAnim = useRef(new Animated.Value(0)).current;
  const opponentScoreAnim = useRef(new Animated.Value(0)).current;

  // Background overlay animation
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Score card animations
  const scoreCardAnimation = useRef({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(50),
  }).current;

  // Button animation
  const buttonAnimation = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.95),
  }).current;

  // Traditional confetti for winner celebration
  const confettiPieces = useRef<ConfettiPiece[]>(
    Array.from({ length: isWinner ? 20 : 0 }, () => ({
      x: new Animated.Value(Math.random() * screenDimensions.width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0.9),
      color: [colors.gold, colors.goldDark, colors.accent, colors.goldBright][
        Math.floor(Math.random() * 4)
      ],
    })),
  ).current;

  // Match score animation values
  const [displayMatchScore, setDisplayMatchScore] = useState(
    matchScore || {
      team1Partidas: 0,
      team2Partidas: 0,
      team1Cotos: 0,
      team2Cotos: 0,
    },
  );
  const matchScoreOpacity = useRef(new Animated.Value(0)).current;
  const matchScoreScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const runAnimation = async () => {
      playSound?.();

      // 1. Fade in overlay
      await fadeInOverlay();

      // 2. Show title elegantly
      await showTitle();

      // 3. Show score cards with count
      await Promise.all([showScoreCards(), countScores()]);

      // 4. Animate match scores if partida ended
      if (celebrationType === 'partida' && matchScore) {
        await animateMatchScore();
      }

      // 5. Celebration for winner
      if (isWinner) {
        animateConfetti();
      }

      // 6. Show continue button
      await showButton();

      // Complete after a brief pause
      setTimeout(onComplete, 1500);
    };

    runAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fadeInOverlay = async () => {
    await new Promise(resolve => {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => resolve(null));
    });
  };

  const showTitle = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(titleAnimation.opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleAnimation.scale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleAnimation.translateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });
  };

  const showScoreCards = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(scoreCardAnimation.opacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scoreCardAnimation.translateY, {
          toValue: 0,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });
  };

  const showButton = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(buttonAnimation.opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnimation.scale, {
          toValue: 1,
          duration: 400,
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

  const animateConfetti = () => {
    const animations = confettiPieces.map((piece, index) =>
      Animated.parallel([
        Animated.timing(piece.y, {
          toValue: screenDimensions.height + 100,
          duration: 4000 + Math.random() * 1500,
          delay: index * 30,
          easing: Easing.quad,
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: (piece.x as any)._value + (Math.random() - 0.5) * 150,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: Math.random() * 6,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(2500),
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    Animated.parallel(animations).start();
  };

  const animateMatchScore = async () => {
    // Animate the match score update
    await new Promise(resolve => {
      // First show the container
      Animated.parallel([
        Animated.timing(matchScoreOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(matchScoreScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Then update the score with a bounce
      setTimeout(() => {
        if (celebrationType === 'partida' && matchScore) {
          // Increment the partida score for the winner
          const newScore = { ...matchScore };
          if (isWinner) {
            newScore.team1Partidas =
              matchScore.team1Partidas + (finalScore.player > finalScore.opponent ? 1 : 0);
            newScore.team2Partidas =
              matchScore.team2Partidas + (finalScore.opponent > finalScore.player ? 1 : 0);
          }
          setDisplayMatchScore(newScore);

          // Bounce animation when score updates
          Animated.sequence([
            Animated.timing(matchScoreScale, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(matchScoreScale, {
              toValue: 1,
              friction: 4,
              useNativeDriver: true,
            }),
          ]).start(() => resolve(null));
        } else {
          resolve(null);
        }
      }, 600);
    });
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, isLandscape && styles.landscapeContainer]}>
      {/* Dark overlay for better contrast */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: overlayOpacity }]}
      />

      {/* Main content container - Traditional Spanish card game style */}
      <View style={[styles.contentContainer, isLandscape && styles.landscapeContent]}>
        {/* Title with traditional Spanish decorations */}
        <Animated.View
          style={[
            styles.titleContainer,
            isLandscape && styles.landscapeTitleContainer,
            {
              opacity: titleAnimation.opacity,
              transform: [
                { scale: titleAnimation.scale },
                { translateY: titleAnimation.translateY },
              ],
            },
          ]}
        >
          {/* Traditional Spanish card suit decorations */}
          <View style={styles.suitDecoration}>
            <Text style={[styles.suitIcon, styles.suitBlack]}>♠</Text>
            <Text style={[styles.suitIcon, styles.suitRed]}>♥</Text>
            <Text style={[styles.suitIcon, styles.suitBlack]}>♣</Text>
            <Text style={[styles.suitIcon, styles.suitRed]}>♦</Text>
          </View>

          {isWinner && (
            <Animated.View
              style={[
                styles.crownContainer,
                {
                  transform: [
                    {
                      rotate: titleAnimation.scale.interpolate({
                        inputRange: [0.9, 1],
                        outputRange: ['-5deg', '0deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.crownIcon}>♔</Text>
            </Animated.View>
          )}

          <View style={styles.titleBorder}>
            <Text
              style={[
                styles.titleText,
                isLandscape && styles.landscapeTitleText,
                isWinner && styles.winnerText,
              ]}
            >
              {celebrationType === 'partida'
                ? isWinner
                  ? 'PARTIDA GANADA'
                  : 'PARTIDA PERDIDA'
                : celebrationType === 'coto'
                ? isWinner
                  ? 'COTO GANADO'
                  : 'COTO PERDIDO'
                : isWinner
                ? '¡VICTORIA FINAL!'
                : 'FIN DEL JUEGO'}
            </Text>
          </View>

          <View style={styles.decorativeContainer}>
            <View style={[styles.decorativeLine, isLandscape && styles.landscapeDecorativeLine]} />
            <Text style={styles.decorativeDot}>◆</Text>
            <View style={[styles.decorativeLine, isLandscape && styles.landscapeDecorativeLine]} />
          </View>
        </Animated.View>

        {/* Score cards - Traditional Spanish design */}
        <Animated.View
          style={[
            styles.scoreContainer,
            isLandscape && styles.landscapeScoreContainer,
            {
              opacity: scoreCardAnimation.opacity,
              transform: [{ translateY: scoreCardAnimation.translateY }],
            },
          ]}
        >
          <View
            style={[
              styles.scoreCard,
              isLandscape && styles.landscapeScoreCard,
              isWinner && styles.winnerCard,
            ]}
          >
            <View style={styles.playerHeaderContainer}>
              <Text style={[styles.playerLabel, isWinner && styles.winnerLabel]}>NOSOTROS</Text>
              {isWinner && <Text style={styles.winnerBadge}>GANADOR</Text>}
            </View>
            <View style={styles.scoreRow}>
              <AnimatedText
                value={playerScoreAnim}
                style={[
                  styles.scoreText,
                  isLandscape && styles.landscapeScoreText,
                  isWinner && styles.winnerScoreText,
                ]}
              />
              <Text style={[styles.pointsLabel, isLandscape && styles.landscapePointsLabel]}>
                PUNTOS
              </Text>
            </View>
          </View>

          <View style={[styles.scoreDivider, isLandscape && styles.landscapeScoreDivider]}>
            <View style={styles.vsContainer}>
              <View style={styles.vsLine} />
              <Text style={[styles.versusText, isLandscape && styles.landscapeVersusText]}>VS</Text>
              <View style={styles.vsLine} />
            </View>
          </View>

          <View
            style={[
              styles.scoreCard,
              isLandscape && styles.landscapeScoreCard,
              !isWinner && styles.winnerCard,
            ]}
          >
            <View style={styles.playerHeaderContainer}>
              <Text style={[styles.playerLabel, !isWinner && styles.winnerLabel]}>ELLOS</Text>
              {!isWinner && <Text style={styles.winnerBadge}>GANADOR</Text>}
            </View>
            <View style={styles.scoreRow}>
              <AnimatedText
                value={opponentScoreAnim}
                style={[
                  styles.scoreText,
                  isLandscape && styles.landscapeScoreText,
                  !isWinner && styles.winnerScoreText,
                ]}
              />
              <Text style={[styles.pointsLabel, isLandscape && styles.landscapePointsLabel]}>
                PUNTOS
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Match progress - Animated score update */}
        {matchScore && celebrationType === 'partida' && (
          <Animated.View
            style={[
              styles.matchProgressContainer,
              isLandscape && styles.landscapeMatchProgress,
              {
                opacity: matchScoreOpacity,
                transform: [
                  { scale: matchScoreScale },
                  { translateY: scoreCardAnimation.translateY },
                ],
              },
            ]}
          >
            <Text style={styles.matchProgressTitle}>MARCADOR DEL COTO</Text>
            <View style={styles.progressContent}>
              <View style={styles.progressTeam}>
                <Text style={styles.progressTeamLabel}>NOSOTROS</Text>
                <View style={styles.progressScoreContainer}>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressValue}>{displayMatchScore.team1Partidas}</Text>
                    <Text style={styles.progressLabel}>Partidas</Text>
                  </View>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressValue}>{displayMatchScore.team1Cotos}</Text>
                    <Text style={styles.progressLabel}>Cotos</Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressDivider} />

              <View style={styles.progressTeam}>
                <Text style={styles.progressTeamLabel}>ELLOS</Text>
                <View style={styles.progressScoreContainer}>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressValue}>{displayMatchScore.team2Partidas}</Text>
                    <Text style={styles.progressLabel}>Partidas</Text>
                  </View>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressValue}>{displayMatchScore.team2Cotos}</Text>
                    <Text style={styles.progressLabel}>Cotos</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Continue button - Traditional style */}
        {onContinue && (
          <Animated.View
            style={[
              styles.buttonContainer,
              isLandscape && styles.landscapeButtonContainer,
              {
                opacity: buttonAnimation.opacity,
                transform: [{ scale: buttonAnimation.scale }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.continueButton, isLandscape && styles.landscapeContinueButton]}
              onPress={onContinue}
              activeOpacity={0.85}
            >
              <View style={styles.buttonInner}>
                <Text
                  style={[
                    styles.continueButtonText,
                    isLandscape && styles.landscapeContinueButtonText,
                  ]}
                >
                  CONTINUAR
                </Text>
                <Text style={styles.continueButtonSubtext}>
                  {celebrationType === 'partida'
                    ? 'Siguiente Partida'
                    : celebrationType === 'coto'
                    ? 'Siguiente Coto'
                    : 'Nueva Partida'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Subtle confetti for winner */}
      {isWinner && (
        <Svg
          style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
          viewBox={`0 0 ${screenDimensions.width} ${screenDimensions.height}`}
        >
          {confettiPieces.map((piece, index) => (
            <AnimatedG
              key={`confetti-${index}`}
              opacity={piece.opacity}
              transform={[
                { translateX: piece.x },
                { translateY: piece.y },
                { rotate: piece.rotation },
              ]}
            >
              <Rect x="-4" y="-8" width="8" height="16" fill={piece.color} rx="1" />
            </AnimatedG>
          ))}
        </Svg>
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
  landscapeContainer: {
    flexDirection: 'row',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Darker for more drama
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  landscapeContent: {
    paddingHorizontal: 40, // Optimized for iPhone landscape
    maxWidth: 700, // Better for iPhone screens
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  landscapeTitleContainer: {
    marginBottom: 35,
  },
  suitDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    opacity: 0.7,
  },
  suitIcon: {
    fontSize: 22,
    marginHorizontal: 10,
  },
  suitBlack: {
    color: colors.primary,
    textShadowColor: colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  suitRed: {
    color: colors.error,
    textShadowColor: colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  crownContainer: {
    marginBottom: 10,
  },
  crownIcon: {
    fontSize: 42,
    color: colors.gold,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleBorder: {
    borderWidth: 2,
    borderColor: colors.goldDark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colorWithOpacity(colors.primary, 0.8),
  },
  titleText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  landscapeTitleText: {
    fontSize: 36,
    letterSpacing: 3,
  },
  winnerText: {
    color: colors.gold,
  },
  decorativeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  decorativeLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.goldDark,
    opacity: 0.8,
  },
  landscapeDecorativeLine: {
    width: 80,
    height: 2,
  },
  decorativeDot: {
    fontSize: 12,
    color: colors.goldDark,
    marginHorizontal: 8,
    opacity: 0.8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 24,
  },
  landscapeScoreContainer: {
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 580,
    marginBottom: 30,
  },
  scoreCard: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 140,
    alignItems: 'center',
  },
  landscapeScoreCard: {
    minWidth: 200,
    paddingHorizontal: 36,
    paddingVertical: 24,
  },
  winnerCard: {
    borderColor: colors.gold,
    borderWidth: 3,
    backgroundColor: colorWithOpacity(colors.goldDark, 0.15),
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playerHeaderContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  playerLabel: {
    fontSize: 16,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  winnerLabel: {
    color: colors.gold,
  },
  winnerBadge: {
    fontSize: 10,
    color: colors.gold,
    backgroundColor: colorWithOpacity(colors.goldDark, 0.2),
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scoreRow: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.text,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  landscapeScoreText: {
    fontSize: 64,
  },
  winnerScoreText: {
    color: colors.gold,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowRadius: 6,
  },
  pointsLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 1,
    fontWeight: '600',
  },
  landscapePointsLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  scoreDivider: {
    marginHorizontal: 16,
    justifyContent: 'center',
  },
  landscapeScoreDivider: {
    marginHorizontal: 24,
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsLine: {
    width: 1,
    height: 30,
    backgroundColor: colorWithOpacity(colors.goldDark, 0.3),
  },
  versusText: {
    fontSize: 18,
    color: colors.goldDark,
    fontWeight: '700',
    marginVertical: 8,
    letterSpacing: 1,
  },
  landscapeVersusText: {
    fontSize: 20,
    fontWeight: '800',
  },
  matchProgressContainer: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.goldDark,
    marginBottom: 24,
    marginTop: 8,
  },
  landscapeMatchProgress: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    minWidth: 480,
  },
  matchProgressTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  progressContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  progressTeam: {
    flex: 1,
    alignItems: 'center',
  },
  progressTeamLabel: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  progressScoreContainer: {
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.gold,
    marginRight: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  progressDivider: {
    width: 1,
    height: 60,
    backgroundColor: colorWithOpacity(colors.goldDark, 0.3),
    marginHorizontal: 20,
  },
  buttonContainer: {
    marginTop: 16,
  },
  landscapeButtonContainer: {
    marginTop: 24,
  },
  continueButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.goldDark,
    elevation: 6,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  landscapeContinueButton: {
    paddingHorizontal: 56,
    paddingVertical: 20,
    borderRadius: 12,
  },
  buttonInner: {
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  landscapeContinueButtonText: {
    fontSize: 20,
    letterSpacing: 2.5,
  },
  continueButtonSubtext: {
    fontSize: 12,
    color: colorWithOpacity(colors.primary, 0.8),
    marginTop: 2,
    fontWeight: '600',
  },
});

// Helper function for color with opacity
function colorWithOpacity(color: string, opacity: number): string {
  const hex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${hex}`;
}
