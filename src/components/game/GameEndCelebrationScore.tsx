import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { useLandscapeStyles } from '../../hooks/useLandscapeStyles';
import { AnimatedScore } from './AnimatedScore';

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
    marginBottom: 16,
  },
  scoreCard: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
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
    marginBottom: 8,
  },
  playerLabel: {
    fontSize: 14,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    fontSize: 42,
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
    marginBottom: 10,
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.goldDark,
    minWidth: 140,
    alignItems: 'center',
  },
  playerHeaderContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  playerLabel: {
    fontSize: 12,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pointsLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  winnerBadge: {
    fontSize: 9,
    color: colors.gold,
    backgroundColor: colorWithOpacity(colors.goldDark, 0.2),
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  scoreDivider: {
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsLine: {
    width: 1,
    height: 20,
    backgroundColor: colorWithOpacity(colors.goldDark, 0.3),
  },
  versusText: {
    fontSize: 14,
    color: colors.goldDark,
    fontWeight: '700',
    marginVertical: 4,
    letterSpacing: 0.8,
  },
};
