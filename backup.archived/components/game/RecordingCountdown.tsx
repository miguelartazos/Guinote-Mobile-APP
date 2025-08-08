import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type RecordingCountdownProps = {
  isActive: boolean;
  onComplete: () => void;
  duration?: number; // Duration in seconds
};

const DEFAULT_DURATION = 5;

export function RecordingCountdown({
  isActive,
  onComplete,
  duration = DEFAULT_DURATION,
}: RecordingCountdownProps) {
  const [count, setCount] = useState(duration);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      setCount(duration);

      // Show countdown
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Start countdown timer
      intervalRef.current = setInterval(() => {
        setCount(prevCount => {
          if (prevCount <= 1) {
            // Countdown complete
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }

            // Hide countdown with animation
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              onComplete();
            });

            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
    } else {
      // Reset when not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setCount(duration);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, duration, fadeAnim, scaleAnim, onComplete]);

  // Animate each number change
  useEffect(() => {
    if (count > 0 && count <= duration) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [count, duration, scaleAnim]);

  if (!isActive || count <= 0) {
    return null;
  }

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
      <View style={styles.countdownBubble}>
        <Text style={styles.countdownText}>{count}</Text>
        <Text style={styles.countdownLabel}>Grabando en...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -80,
    left: -60,
    right: -60,
    alignItems: 'center',
    zIndex: 1000,
  },
  countdownBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  countdownText: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: 4,
  },
  countdownLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
});
