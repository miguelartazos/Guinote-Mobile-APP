import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { ThinkingIndicator } from './ThinkingIndicator';

type MinimalPlayerPanelProps = {
  playerName: string;
  isCurrentPlayer?: boolean;
  position: 'top' | 'left' | 'right' | 'bottom';
  teamId?: 'team1' | 'team2';
  isThinking?: boolean;
};

export function MinimalPlayerPanel({
  playerName,
  isCurrentPlayer = false,
  position,
  teamId,
  isThinking = false,
}: MinimalPlayerPanelProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCurrentPlayer) {
      // Pulsing glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ]),
      ).start();

      // Scale pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    } else {
      glowAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isCurrentPlayer, pulseAnim, glowAnim]);

  const getTeamColor = () => {
    if (teamId === 'team1') return '#3498DB';
    if (teamId === 'team2') return '#E74C3C';
    return colors.gold;
  };

  const getPlayerDisplayName = (name: string) => {
    if (name.length > 10) {
      return name.substring(0, 8) + '...';
    }
    return name;
  };

  const borderColor = isCurrentPlayer
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.gold, colors.goldBright],
      })
    : 'transparent';

  const shadowOpacity = isCurrentPlayer
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
      })
    : 0;

  return (
    <Animated.View
      style={[
        styles.panel,
        styles[`${position}Panel`],
        {
          transform: [{ scale: pulseAnim }],
          borderColor: borderColor,
          borderWidth: isCurrentPlayer ? 2 : 0,
          shadowColor: colors.gold,
          shadowOpacity: shadowOpacity,
          shadowRadius: isCurrentPlayer ? 15 : 0,
        },
      ]}
    >
      <ThinkingIndicator playerName={playerName} visible={isThinking} />
      <View style={styles.teamIndicator}>
        <View
          style={[
            styles.teamDot,
            { backgroundColor: teamId ? getTeamColor() : 'transparent' },
          ]}
        />
      </View>
      <Text style={styles.playerName}>{getPlayerDisplayName(playerName)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: dimensions.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topPanel: {
    top: 5,
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  leftPanel: {
    left: 5,
    top: 20,
    transform: [{ translateY: 0 }],
  },
  rightPanel: {
    right: 5,
    top: 20,
    transform: [{ translateY: 0 }],
  },
  bottomPanel: {
    bottom: 5,
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  playerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  teamIndicator: {
    width: 8,
    height: 8,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
