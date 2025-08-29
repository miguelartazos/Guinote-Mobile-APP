import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type VueltasScoreBannerProps = {
  visible: boolean;
  team1Score: number;
  team2Score: number;
};

export function VueltasScoreBanner({ visible, team1Score, team2Score }: VueltasScoreBannerProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide down and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Start glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    } else {
      // Hide banner
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity, glowAnim]);

  if (!visible) return null;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
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
        <View style={styles.vueltasLabel}>
          <Text style={styles.vueltasIcon}>⚔️</Text>
          <Text style={styles.vueltasText}>VUELTAS</Text>
          <Text style={styles.vueltasIcon}>⚔️</Text>
        </View>

        <View style={styles.scoresRow}>
          <View style={styles.teamScore}>
            <Text style={styles.teamLabel}>Nosotros</Text>
            <Text style={styles.score}>{team1Score}</Text>
          </View>

          <View style={styles.separator}>
            <Text style={styles.separatorText}>|</Text>
          </View>

          <View style={styles.teamScore}>
            <Text style={styles.teamLabel}>Ellos</Text>
            <Text style={styles.score}>{team2Score}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: [{ translateX: -200 }],
    width: 400,
    zIndex: 200,
  } as ViewStyle,
  glowBackground: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    backgroundColor: colors.gold,
    borderRadius: dimensions.borderRadius.lg,
  } as ViewStyle,
  content: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.xl,
    borderWidth: 2,
    borderColor: colors.gold,
    elevation: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  } as ViewStyle,
  vueltasLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dimensions.spacing.sm,
  } as ViewStyle,
  vueltasIcon: {
    fontSize: typography.fontSize.md,
    marginHorizontal: dimensions.spacing.sm,
  } as TextStyle,
  vueltasText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  } as TextStyle,
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  teamScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: dimensions.spacing.lg,
  } as ViewStyle,
  teamLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    marginRight: dimensions.spacing.sm,
  } as TextStyle,
  score: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  } as TextStyle,
  separator: {
    paddingHorizontal: dimensions.spacing.md,
  } as ViewStyle,
  separatorText: {
    fontSize: typography.fontSize.xl,
    color: colors.gold,
    fontWeight: typography.fontWeight.regular,
  } as TextStyle,
});
