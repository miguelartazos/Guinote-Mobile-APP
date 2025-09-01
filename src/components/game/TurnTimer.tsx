import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

interface TurnTimerProps {
  seconds: number;
  onExpire: () => void;
  playerName?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  paused?: boolean;
}

export function TurnTimer({
  seconds,
  onExpire,
  playerName,
  warningThreshold = 10,
  criticalThreshold = 5,
  paused = false,
}: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);

  // Update ref to avoid stale closure
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Reset timer when seconds changes to a higher value
  useEffect(() => {
    if (seconds > timeLeft) {
      setTimeLeft(seconds);
      hasExpiredRef.current = false;
    }
  }, [seconds, timeLeft]);

  // Countdown logic
  useEffect(() => {
    if (paused) {
      return undefined;
    }

    setTimeLeft(seconds);
    hasExpiredRef.current = false;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, paused]);

  // Pulse animation for low time
  useEffect(() => {
    if (timeLeft <= criticalThreshold && timeLeft > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [timeLeft, criticalThreshold, scaleAnim]);

  if (paused) {
    return null;
  }

  const getTimerColor = () => {
    if (timeLeft <= criticalThreshold) return colors.error;
    if (timeLeft <= warningThreshold) return '#FF9800';
    return colors.white;
  };

  return (
    <View style={styles.container} testID="turn-timer">
      {playerName && <Text style={styles.playerName}>Turno de {playerName}</Text>}
      <Animated.View style={[styles.timerContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Text testID="timer-text" style={[styles.timerText, { color: getTimerColor() }]}>
          {timeLeft}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'center',
    zIndex: 1000,
  },
  playerName: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
    marginBottom: dimensions.spacing.xs,
  },
  timerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
});
