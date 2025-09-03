import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { useLandscapeStyles } from '../../hooks/useLandscapeStyles';

type GameEndCelebrationScoreProps = {
  playerScore: Animated.Value;
  opponentScore: Animated.Value;
  isWinner: boolean;
  scoreCardAnimation: {
    opacity: Animated.Value;
    translateY: Animated.Value;
  };
};

export const GameEndCelebrationScore = React.memo(
  ({ playerScore, opponentScore, isWinner, scoreCardAnimation }: GameEndCelebrationScoreProps) => {
    const styles = useLandscapeStyles(portraitStyles, landscapeStyles);

    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: scoreCardAnimation.opacity,
            transform: [{ translateY: scoreCardAnimation.translateY }],
          },
        ]}
      >
        <View style={[styles.scoreCard, isWinner && styles.winnerCard]}>
          <View style={styles.playerHeaderContainer}>
            <Text style={[styles.playerLabel, isWinner && styles.winnerLabel]}>NOSOTROS</Text>
            {isWinner && <Text style={styles.winnerBadge}>GANADOR</Text>}
          </View>
          <View style={styles.scoreRow}>
            <AnimatedScore
              value={playerScore}
              style={[styles.scoreText, isWinner && styles.winnerScoreText]}
            />
            <Text style={styles.pointsLabel}>PUNTOS</Text>
          </View>
        </View>

        <View style={styles.scoreDivider}>
          <View style={styles.vsContainer}>
            <View style={styles.vsLine} />
            <Text style={styles.versusText}>VS</Text>
            <View style={styles.vsLine} />
          </View>
        </View>

        <View style={[styles.scoreCard, !isWinner && styles.winnerCard]}>
          <View style={styles.playerHeaderContainer}>
            <Text style={[styles.playerLabel, !isWinner && styles.winnerLabel]}>ELLOS</Text>
            {!isWinner && <Text style={styles.winnerBadge}>GANADOR</Text>}
          </View>
          <View style={styles.scoreRow}>
            <AnimatedScore
              value={opponentScore}
              style={[styles.scoreText, !isWinner && styles.winnerScoreText]}
            />
            <Text style={styles.pointsLabel}>PUNTOS</Text>
          </View>
        </View>
      </Animated.View>
    );
  },
);

GameEndCelebrationScore.displayName = 'GameEndCelebrationScore';

// Helper component for animated score
function AnimatedScore({ value, style }: { value: Animated.Value; style: any }) {
  const [displayValue, setDisplayValue] = useState(0);

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

// Helper function for color with opacity
function colorWithOpacity(color: string, opacity: number): string {
  const hex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${hex}`;
}

const portraitStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 20,
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
  scoreDivider: {
    marginHorizontal: 16,
    justifyContent: 'center',
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
});

const landscapeStyles: Partial<typeof portraitStyles> = {
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
    marginTop: 8,
  },
  scoreCard: {
    backgroundColor: colors.background,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.goldDark,
    minWidth: 160,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.text,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pointsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    letterSpacing: 1,
    fontWeight: '600',
  },
  scoreDivider: {
    marginHorizontal: 16,
    justifyContent: 'center',
  },
  versusText: {
    fontSize: 16,
    color: colors.goldDark,
    fontWeight: '700',
    marginVertical: 6,
    letterSpacing: 1,
  },
};
