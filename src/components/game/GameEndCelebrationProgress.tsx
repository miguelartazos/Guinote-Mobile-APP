import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { useLandscapeStyles } from '../../hooks/useLandscapeStyles';

type MatchScore = {
  team1Partidas: number;
  team2Partidas: number;
  team1Cotos: number;
  team2Cotos: number;
};

type GameEndCelebrationProgressProps = {
  matchScore: MatchScore;
  matchScoreOpacity: Animated.Value;
  matchScoreScale: Animated.Value;
  scoreCardAnimation: {
    translateY: Animated.Value;
  };
};

export const GameEndCelebrationProgress = React.memo(
  ({
    matchScore,
    matchScoreOpacity,
    matchScoreScale,
    scoreCardAnimation,
  }: GameEndCelebrationProgressProps) => {
    const styles = useLandscapeStyles(portraitStyles, landscapeStyles);

    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: matchScoreOpacity,
            transform: [{ scale: matchScoreScale }, { translateY: scoreCardAnimation.translateY }],
          },
        ]}
      >
        <Text style={styles.title}>MARCADOR DEL COTO</Text>
        <View style={styles.content}>
          <View style={styles.team}>
            <Text style={styles.teamLabel}>NOSOTROS</Text>
            <View style={styles.scoreContainer}>
              <View style={styles.row}>
                <Text style={styles.value}>{matchScore.team1Partidas}</Text>
                <Text style={styles.label}>Partidas</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.value}>{matchScore.team1Cotos}</Text>
                <Text style={styles.label}>Cotos</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.team}>
            <Text style={styles.teamLabel}>ELLOS</Text>
            <View style={styles.scoreContainer}>
              <View style={styles.row}>
                <Text style={styles.value}>{matchScore.team2Partidas}</Text>
                <Text style={styles.label}>Partidas</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.value}>{matchScore.team2Cotos}</Text>
                <Text style={styles.label}>Cotos</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  },
);

GameEndCelebrationProgress.displayName = 'GameEndCelebrationProgress';

// Helper function for color with opacity
function colorWithOpacity(color: string, opacity: number): string {
  const hex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${hex}`;
}

const portraitStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.goldDark,
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.gold,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: colorWithOpacity(colors.goldDark, 0.3),
    marginHorizontal: 20,
  },
});

const landscapeStyles: Partial<typeof portraitStyles> = {
  container: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    minWidth: 480,
  },
};
