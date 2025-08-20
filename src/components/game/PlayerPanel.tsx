import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { ThinkingIndicator } from './ThinkingIndicator';
import { useOrientation } from '../../hooks/useOrientation';

type PlayerPanelProps = {
  playerName: string;
  ranking: number;
  isCurrentPlayer?: boolean;
  position: 'top' | 'left' | 'right' | 'bottom';
  avatar?: string;
  teamId?: 'team1' | 'team2';
  isThinking?: boolean;
  showRanking?: boolean;
};

export function PlayerPanel({
  playerName,
  ranking,
  isCurrentPlayer = false,
  position,
  avatar,
  teamId,
  isThinking = false,
  showRanking = false,
}: PlayerPanelProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const orientation = useOrientation();
  const landscape = orientation === 'landscape';

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
        landscape && styles[`${position}PanelLandscape`],
        isCurrentPlayer && {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {isCurrentPlayer && (
        <View style={styles.turnIndicator}>
          <Text style={styles.turnIndicatorText}>ES MI TURNO</Text>
        </View>
      )}
      <ThinkingIndicator playerName={playerName} visible={isThinking} />
      <View style={styles.playerInfoContainer}>
        {avatar && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{avatar}</Text>
          </View>
        )}
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, isCurrentPlayer && styles.currentPlayerText]}>
            {getPlayerDisplayName(playerName)}
          </Text>
          {showRanking && (
            <Text style={[styles.ranking, isCurrentPlayer && styles.currentPlayerText]}>
              Ranking: {ranking.toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </AnimatedViewWrapper>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 95, 63, 0.9)', // Semi-transparent table green
    borderRadius: dimensions.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 150,
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  topPanel: {
    top: 20,
    left: 20,
  },
  leftPanel: {
    bottom: 120,
    left: 20,
  },
  rightPanel: {
    top: 20,
    right: 20,
  },
  bottomPanel: {
    bottom: 120,
    right: 20,
  },
  // Landscape specific positions (same as above for consistency)
  topPanelLandscape: {
    top: 20,
    left: 20,
  },
  leftPanelLandscape: {
    bottom: 120,
    left: 20,
  },
  rightPanelLandscape: {
    top: 20,
    right: 20,
  },
  bottomPanelLandscape: {
    bottom: 120,
    right: 20,
  },
  currentPlayerPanel: {
    borderColor: colors.gold,
    borderWidth: 2,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  playerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.yellowText,
    fontFamily: 'System',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  ranking: {
    fontSize: 14,
    color: colors.orangeRanking,
    fontWeight: typography.fontWeight.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  currentPlayerText: {
    color: colors.yellowText,
  },
  turnIndicator: {
    position: 'absolute',
    top: -30,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 5,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  turnIndicatorText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
});
