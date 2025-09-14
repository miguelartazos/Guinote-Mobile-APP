import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, type ViewStyle, type TextStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { AnimatedScore } from './AnimatedScore';

type EnhancedVueltasDisplayProps = {
  team1Score: number;
  team2Score: number;
  visible: boolean;
};

const ANIMATION_CONFIG = {
  SCORE_CHANGE_DURATION: 800,
  PULSE_DURATION: 300,
  FLOAT_DURATION: 1500,
  GLOW_DURATION: 2000,
} as const;

export function EnhancedVueltasDisplay({
  team1Score,
  team2Score,
  visible,
}: EnhancedVueltasDisplayProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Score animation values
  const team1ScoreAnim = useRef(new Animated.Value(team1Score)).current;
  const team2ScoreAnim = useRef(new Animated.Value(team2Score)).current;

  // Pulse animations for score changes
  const team1PulseAnim = useRef(new Animated.Value(1)).current;
  const team2PulseAnim = useRef(new Animated.Value(1)).current;

  // Score change indicators
  const [team1Change, setTeam1Change] = useState<number | null>(null);
  const [team2Change, setTeam2Change] = useState<number | null>(null);
  const team1ChangeOpacity = useRef(new Animated.Value(0)).current;
  const team2ChangeOpacity = useRef(new Animated.Value(0)).current;
  const team1ChangeY = useRef(new Animated.Value(0)).current;
  const team2ChangeY = useRef(new Animated.Value(0)).current;

  // Previous scores for change detection
  const prevTeam1Score = useRef(team1Score);
  const prevTeam2Score = useRef(team2Score);

  // Visibility animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (visible) {
      // Start glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: ANIMATION_CONFIG.GLOW_DURATION,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: ANIMATION_CONFIG.GLOW_DURATION,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [visible, fadeAnim, glowAnim]);

  // Team 1 score change animation
  useEffect(() => {
    const scoreDiff = team1Score - prevTeam1Score.current;
    if (scoreDiff > 0) {
      // Show change indicator
      setTeam1Change(scoreDiff);
      team1ChangeY.setValue(0);
      team1ChangeOpacity.setValue(1);

      // Animate score
      Animated.parallel([
        // Score roll-up
        Animated.timing(team1ScoreAnim, {
          toValue: team1Score,
          duration: ANIMATION_CONFIG.SCORE_CHANGE_DURATION,
          useNativeDriver: false,
        }),
        // Pulse effect
        Animated.sequence([
          Animated.spring(team1PulseAnim, {
            toValue: 1.1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(team1PulseAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        // Float up change indicator
        Animated.parallel([
          Animated.timing(team1ChangeY, {
            toValue: -20,
            duration: ANIMATION_CONFIG.FLOAT_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(team1ChangeOpacity, {
            toValue: 0,
            duration: ANIMATION_CONFIG.FLOAT_DURATION,
            delay: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setTeam1Change(null);
      });
    } else {
      team1ScoreAnim.setValue(team1Score);
    }
    prevTeam1Score.current = team1Score;
  }, [team1Score, team1ScoreAnim, team1PulseAnim, team1ChangeY, team1ChangeOpacity]);

  // Team 2 score change animation
  useEffect(() => {
    const scoreDiff = team2Score - prevTeam2Score.current;
    if (scoreDiff > 0) {
      // Show change indicator
      setTeam2Change(scoreDiff);
      team2ChangeY.setValue(0);
      team2ChangeOpacity.setValue(1);

      // Animate score
      Animated.parallel([
        // Score roll-up
        Animated.timing(team2ScoreAnim, {
          toValue: team2Score,
          duration: ANIMATION_CONFIG.SCORE_CHANGE_DURATION,
          useNativeDriver: false,
        }),
        // Pulse effect
        Animated.sequence([
          Animated.spring(team2PulseAnim, {
            toValue: 1.1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(team2PulseAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        // Float up change indicator
        Animated.parallel([
          Animated.timing(team2ChangeY, {
            toValue: -20,
            duration: ANIMATION_CONFIG.FLOAT_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(team2ChangeOpacity, {
            toValue: 0,
            duration: ANIMATION_CONFIG.FLOAT_DURATION,
            delay: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setTeam2Change(null);
      });
    } else {
      team2ScoreAnim.setValue(team2Score);
    }
    prevTeam2Score.current = team2Score;
  }, [team2Score, team2ScoreAnim, team2PulseAnim, team2ChangeY, team2ChangeOpacity]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.2],
  });

  const isTeam1Ahead = team1Score > team2Score;
  const isTeam2Ahead = team2Score > team1Score;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.glowBackground,
          {
            opacity: glowOpacity,
          },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.vueltasLabel}>VUELTAS</Text>
        </View>

        <View style={styles.scoresContainer}>
          {/* Team 1 (Nosotros) */}
          <Animated.View
            style={[
              styles.teamScore,
              isTeam1Ahead && styles.teamScoreLeading,
              { transform: [{ scale: team1PulseAnim }] },
            ]}
          >
            <Text style={[styles.teamLabel, isTeam1Ahead && styles.teamLabelLeading]}>
              Nosotros
            </Text>
            <View style={styles.scoreWrapper}>
              <AnimatedScore
                value={team1ScoreAnim}
                style={[styles.scoreText, isTeam1Ahead && styles.scoreTextLeading]}
              />
              {team1Change !== null && (
                <Animated.View
                  style={[
                    styles.changeIndicator,
                    {
                      opacity: team1ChangeOpacity,
                      transform: [{ translateY: team1ChangeY }],
                    },
                  ]}
                >
                  <Text style={styles.changeText}>+{team1Change}</Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          <View style={styles.divider}>
            <Text style={styles.dividerText}>|</Text>
          </View>

          {/* Team 2 (Ellos) */}
          <Animated.View
            style={[
              styles.teamScore,
              isTeam2Ahead && styles.teamScoreLeading,
              { transform: [{ scale: team2PulseAnim }] },
            ]}
          >
            <Text style={[styles.teamLabel, isTeam2Ahead && styles.teamLabelLeading]}>Ellos</Text>
            <View style={styles.scoreWrapper}>
              <AnimatedScore
                value={team2ScoreAnim}
                style={[styles.scoreText, isTeam2Ahead && styles.scoreTextLeading]}
              />
              {team2Change !== null && (
                <Animated.View
                  style={[
                    styles.changeIndicator,
                    {
                      opacity: team2ChangeOpacity,
                      transform: [{ translateY: team2ChangeY }],
                    },
                  ]}
                >
                  <Text style={styles.changeText}>+{team2Change}</Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 100,
    minWidth: 220,
    zIndex: 100,
  } as ViewStyle,
  glowBackground: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    backgroundColor: colors.gold,
    borderRadius: 10,
    blur: 10,
  } as ViewStyle,
  content: {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.gold,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  } as ViewStyle,
  header: {
    alignItems: 'center',
    marginBottom: 1,
  } as ViewStyle,
  vueltasLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  } as TextStyle,
  scoresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  teamScore: {
    alignItems: 'center',
    paddingHorizontal: 10,
  } as ViewStyle,
  teamScoreLeading: {
    // Additional styling for leading team
  } as ViewStyle,
  teamLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 0,
    fontWeight: '600',
  } as TextStyle,
  teamLabelLeading: {
    color: colors.gold,
    fontWeight: 'bold',
  } as TextStyle,
  scoreWrapper: {
    position: 'relative',
    alignItems: 'center',
  } as ViewStyle,
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  scoreTextLeading: {
    color: colors.gold,
    textShadowColor: 'rgba(255, 215, 0, 0.2)',
    textShadowRadius: 3,
  } as TextStyle,
  divider: {
    paddingHorizontal: 10,
  } as ViewStyle,
  dividerText: {
    fontSize: 16,
    color: colors.gold,
    opacity: 0.4,
  } as TextStyle,
  changeIndicator: {
    position: 'absolute',
    top: -14,
    alignItems: 'center',
  } as ViewStyle,
  changeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gold,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  } as TextStyle,
});
