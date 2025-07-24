import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type PlayerPanelProps = {
  playerName: string;
  ranking: number;
  isCurrentPlayer?: boolean;
  position: 'top' | 'left' | 'right' | 'bottom';
  avatar?: string;
  teamId?: 'team1' | 'team2';
};

export function PlayerPanel({
  playerName,
  ranking,
  isCurrentPlayer = false,
  position,
  avatar = '👤',
  teamId,
}: PlayerPanelProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCurrentPlayer) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [isCurrentPlayer, pulseAnim]);

  const getTeamColor = () => {
    if (teamId === 'team1') return '#3498DB'; // Blue
    if (teamId === 'team2') return '#E74C3C'; // Red
    return colors.accent;
  };

  const panelStyles = [
    styles.panel,
    styles[`${position}Panel`],
    isCurrentPlayer && styles.currentPlayerPanel,
    teamId && { borderColor: getTeamColor() },
  ];

  const getPlayerDisplayName = (name: string) => {
    if (name.length > 12) {
      return name.substring(0, 9) + '...';
    }
    return name;
  };

  const AnimatedViewWrapper = isCurrentPlayer ? Animated.View : View;

  return (
    <AnimatedViewWrapper
      style={[
        panelStyles,
        isCurrentPlayer && {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatar,
            isCurrentPlayer && styles.currentAvatar,
            teamId && { borderColor: getTeamColor() },
          ]}
        >
          <Text style={styles.avatarIcon}>{avatar}</Text>
        </View>
        {isCurrentPlayer && <View style={styles.currentIndicator} />}
      </View>

      <View style={styles.playerInfo}>
        <Text
          style={[
            styles.playerName,
            isCurrentPlayer && styles.currentPlayerText,
          ]}
        >
          {getPlayerDisplayName(playerName)}
        </Text>
        <Text
          style={[styles.ranking, isCurrentPlayer && styles.currentPlayerText]}
        >
          Ranking: {ranking.toLocaleString()}
        </Text>
      </View>
    </AnimatedViewWrapper>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondary,
    minWidth: 110,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  topPanel: {
    top: 60,
    left: 10,
    flexDirection: 'column',
    alignItems: 'center',
    width: 100,
    padding: 8,
  },
  leftPanel: {
    bottom: 200,
    left: 10,
    flexDirection: 'column',
    alignItems: 'center',
    width: 100,
    padding: 8,
  },
  rightPanel: {
    top: 60,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
    width: 100,
    padding: 8,
  },
  bottomPanel: {
    bottom: 200,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
    width: 100,
    padding: 8,
  },
  currentPlayerPanel: {
    borderColor: colors.accent,
    borderWidth: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  currentAvatar: {
    borderColor: '#FFD700',
    borderWidth: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  currentIndicator: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00FF88',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarIcon: {
    fontSize: typography.fontSize.md,
  },
  playerInfo: {
    alignItems: 'center',
  },
  playerName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 1,
    textAlign: 'center',
  },
  ranking: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  currentPlayerText: {
    color: colors.accent,
  },
});
