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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.goldDark,
    marginBottom: 12,
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1.2,
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
    fontSize: 12,
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.gold,
    marginRight: 4,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: colorWithOpacity(colors.goldDark, 0.3),
    marginHorizontal: 16,
  },
});

const landscapeStyles: Partial<typeof portraitStyles> = {
  container: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.goldDark,
    marginBottom: 8,
    marginTop: 2,
    maxWidth: 500,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.gold,
    marginRight: 3,
  },
  label: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  divider: {
    width: 1,
    height: 35,
    backgroundColor: colorWithOpacity(colors.goldDark, 0.3),
    marginHorizontal: 12,
  },
};
