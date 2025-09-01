import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  Dimensions,
  TouchableOpacity,
  Easing,
} from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { useLandscapeStyles } from '../../hooks/useLandscapeStyles';
import { GameEndCelebrationTitle } from './GameEndCelebrationTitle';
import { GameEndCelebrationScore } from './GameEndCelebrationScore';
import { GameEndCelebrationProgress } from './GameEndCelebrationProgress';
import { SCORE_COUNT_DURATION, ELASTIC_EASING } from '../../constants/animations';

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
  isVueltasTransition?: boolean; // True when transitioning to vueltas
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
  isVueltasTransition = false,
}: GameEndCelebrationProps) {
  const screenDimensions = Dimensions.get('window');
  const styles = useLandscapeStyles(portraitStyles, landscapeStyles);

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

      // Complete after a brief pause - but NOT for vueltas transition
      // For vueltas, user must click the continue button
      if (!isVueltasTransition) {
        setTimeout(onComplete, 1500);
      }
    };

    runAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVueltasTransition]);

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
    <View style={[StyleSheet.absoluteFillObject, styles.container]}>
      {/* Dark overlay for better contrast */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: overlayOpacity }]}
      />

      {/* Main content container - Traditional Spanish card game style */}
      <View style={styles.contentContainer}>
        {/* Title with traditional Spanish decorations */}
        <GameEndCelebrationTitle
          isWinner={isWinner}
          celebrationType={celebrationType}
          titleAnimation={titleAnimation}
          isVueltasTransition={isVueltasTransition}
        />

        {/* Score cards - Traditional Spanish design */}
        <GameEndCelebrationScore
          playerScore={playerScoreAnim}
          opponentScore={opponentScoreAnim}
          isWinner={isWinner}
          scoreCardAnimation={scoreCardAnimation}
        />

        {/* Match progress - Animated score update */}
        {matchScore && celebrationType === 'partida' && (
          <GameEndCelebrationProgress
            matchScore={displayMatchScore}
            matchScoreOpacity={matchScoreOpacity}
            matchScoreScale={matchScoreScale}
            scoreCardAnimation={scoreCardAnimation}
          />
        )}

        {/* Continue button - Traditional style */}
        {onContinue && (
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonAnimation.opacity,
                transform: [{ scale: buttonAnimation.scale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.continueButton}
              onPress={onContinue}
              activeOpacity={0.85}
            >
              <View style={styles.buttonInner}>
                <Text style={styles.continueButtonText}>CONTINUAR</Text>
                <Text style={styles.continueButtonSubtext}>
                  {isVueltasTransition
                    ? 'Jugar Vueltas'
                    : celebrationType === 'partida'
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

// Helper function for color with opacity
function colorWithOpacity(color: string, opacity: number): string {
  const hex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${hex}`;
}

const portraitStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    marginTop: 16,
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
  continueButtonSubtext: {
    fontSize: 12,
    color: colorWithOpacity(colors.primary, 0.8),
    marginTop: 2,
    fontWeight: '600',
  },
});

const landscapeStyles: Partial<typeof portraitStyles> = {
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  buttonContainer: {
    marginTop: 24,
  },
  continueButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: 56,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.goldDark,
    elevation: 6,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
};
