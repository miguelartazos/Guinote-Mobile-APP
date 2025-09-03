import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../constants/colors';
import { useLandscapeStyles } from '../../hooks/useLandscapeStyles';

type MatchVictoryTrophyProps = {
  isWinner: boolean;
  visible: boolean;
};

export function MatchVictoryTrophy({ isWinner, visible }: MatchVictoryTrophyProps) {
  const styles = useLandscapeStyles(portraitStyles, landscapeStyles);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trophy entrance animation
      Animated.parallel([
        // Scale in with bounce
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        // Gentle rotation
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Shine effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(shineAnim, {
              toValue: 1,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(shineAnim, {
              toValue: 0,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ).start(),
        // Vertical bounce
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -10,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ).start(),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      shineAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible, scaleAnim, rotateAnim, shineAnim, bounceAnim]);

  const trophyRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const shineOpacity = shineAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  if (!isWinner) {
    // Show a different icon for the loser (maybe a shield or medal)
    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }, { translateY: bounceAnim }],
          },
        ]}
      >
        <View style={styles.medalContainer}>
          <Text style={styles.medalIcon}>🥈</Text>
          <Text style={styles.medalText}>BUEN JUEGO</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }, { rotate: trophyRotation }, { translateY: bounceAnim }],
        },
      ]}
    >
      {/* Trophy base */}
      <View style={styles.trophyBase}>
        <View style={styles.trophyBaseTop} />
        <View style={styles.trophyBaseBottom} />
      </View>

      {/* Trophy cup */}
      <View style={styles.trophyCup}>
        {/* Trophy handles */}
        <View style={[styles.trophyHandle, styles.leftHandle]} />
        <View style={[styles.trophyHandle, styles.rightHandle]} />

        {/* Trophy body */}
        <View style={styles.trophyBody}>
          {/* Shine effect overlay */}
          <Animated.View
            style={[
              styles.trophyShine,
              {
                opacity: shineOpacity,
              },
            ]}
          />

          {/* Trophy star */}
          <Text style={styles.trophyStar}>★</Text>

          {/* Victory text */}
          <Text style={styles.trophyText}>CAMPEÓN</Text>
        </View>
      </View>

      {/* Floating stars around trophy */}
      {[0, 1, 2, 3].map(index => (
        <Animated.Text
          key={index}
          style={[
            styles.floatingStar,
            {
              left: index % 2 === 0 ? -30 : undefined,
              right: index % 2 === 1 ? -30 : undefined,
              top: index < 2 ? 20 : 80,
              opacity: shineAnim,
              transform: [
                {
                  scale: shineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          ✨
        </Animated.Text>
      ))}
    </Animated.View>
  );
}

const portraitStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  trophyBase: {
    position: 'absolute',
    bottom: -20,
    alignItems: 'center',
  },
  trophyBaseTop: {
    width: 80,
    height: 15,
    backgroundColor: colors.goldDark,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  trophyBaseBottom: {
    width: 100,
    height: 20,
    backgroundColor: colors.goldDark,
    borderRadius: 4,
    marginTop: 2,
  },
  trophyCup: {
    width: 120,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyHandle: {
    position: 'absolute',
    width: 25,
    height: 40,
    borderWidth: 4,
    borderColor: colors.gold,
    borderRadius: 20,
    top: 20,
  },
  leftHandle: {
    left: -10,
    borderRightWidth: 0,
  },
  rightHandle: {
    right: -10,
    borderLeftWidth: 0,
  },
  trophyBody: {
    width: 100,
    height: 80,
    backgroundColor: colors.gold,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.goldDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  trophyShine: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 30,
    height: 40,
    backgroundColor: colors.goldBright,
    borderRadius: 20,
    transform: [{ rotate: '-20deg' }],
  },
  trophyStar: {
    fontSize: 32,
    color: colors.primary,
    marginBottom: 4,
  },
  trophyText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  floatingStar: {
    position: 'absolute',
    fontSize: 20,
  },
  medalContainer: {
    alignItems: 'center',
  },
  medalIcon: {
    fontSize: 80,
    marginBottom: 10,
  },
  medalText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1.5,
  },
});

const landscapeStyles: Partial<typeof portraitStyles> = {
  container: {
    marginVertical: 30,
  },
  trophyCup: {
    width: 140,
    height: 120,
  },
  trophyBody: {
    width: 120,
    height: 100,
  },
  trophyStar: {
    fontSize: 38,
  },
  trophyText: {
    fontSize: 13,
  },
  trophyBaseTop: {
    width: 100,
    height: 18,
  },
  trophyBaseBottom: {
    width: 120,
    height: 24,
  },
  medalIcon: {
    fontSize: 100,
  },
  medalText: {
    fontSize: 18,
  },
};
