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
    // Extract first name from bot names with titles (e.g., "Ana la Prudente" -> "Ana")
    if (name.includes(' la ') || name.includes(' el ')) {
      const firstName = name.split(' ')[0];
      return firstName;
    }
    // For regular names, show up to 12 characters
    if (name.length > 12) {
      return `${name.substring(0, 10)}...`;
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
          borderColor,
          borderWidth: isCurrentPlayer ? 2 : 0,
          shadowColor: colors.gold,
          shadowOpacity,
          shadowRadius: isCurrentPlayer ? 15 : 0,
        },
      ]}
    >
      <ThinkingIndicator playerName={playerName} visible={isThinking} />
      <View style={styles.teamIndicator}>
        <View
          style={[styles.teamDot, { backgroundColor: teamId ? getTeamColor() : 'transparent' }]}
        />
      </View>
      <Text style={styles.playerName}>{getPlayerDisplayName(playerName)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Corner positioning for visibility
  topPanel: {
    top: 8,
    left: 8,
  },
  leftPanel: {
    bottom: 8,
    left: 8,
  },
  rightPanel: {
    top: 8,
    right: 8,
  },
  bottomPanel: {
    bottom: 8,
    right: 8,
  },
  playerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    textAlign: 'center',
  },
  teamIndicator: {
    width: 8,
    height: 8,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
