import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type PlayerPanelProps = {
  playerName: string;
  ranking: number;
  isCurrentPlayer?: boolean;
  position: 'top' | 'left' | 'right' | 'bottom';
  avatar?: string;
};

export function PlayerPanel({
  playerName,
  ranking,
  isCurrentPlayer = false,
  position,
  avatar = '👤',
}: PlayerPanelProps) {
  const panelStyles = [
    styles.panel,
    styles[`${position}Panel`],
    isCurrentPlayer && styles.currentPlayerPanel,
  ];

  const getPlayerDisplayName = (name: string) => {
    if (name.length > 12) {
      return name.substring(0, 9) + '...';
    }
    return name;
  };

  const isVertical = position === 'left' || position === 'right';

  return (
    <View style={panelStyles}>
      <View
        style={[
          styles.avatarContainer,
          isVertical && styles.verticalAvatarContainer,
        ]}
      >
        <View style={[styles.avatar, isCurrentPlayer && styles.currentAvatar]}>
          <Text style={styles.avatarIcon}>{avatar}</Text>
        </View>
        {isCurrentPlayer && <View style={styles.currentIndicator} />}
      </View>

      <View
        style={[styles.playerInfo, isVertical && styles.verticalPlayerInfo]}
      >
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
    </View>
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
    top: 90,
    left: '50%',
    transform: [{ translateX: -55 }],
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftPanel: {
    left: 60,
    top: '50%',
    transform: [{ translateY: -30 }],
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 90,
  },
  rightPanel: {
    right: 60,
    top: '50%',
    transform: [{ translateY: -30 }],
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 90,
  },
  bottomPanel: {
    bottom: 70,
    left: '50%',
    transform: [{ translateX: -55 }],
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  currentAvatar: {
    borderColor: colors.accent,
    borderWidth: 3,
  },
  currentIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF00',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarIcon: {
    fontSize: typography.fontSize.md,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  ranking: {
    fontSize: typography.fontSize.xs,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  currentPlayerText: {
    color: colors.accent,
  },
  verticalAvatarContainer: {
    marginRight: 0,
    marginBottom: 4,
  },
  verticalPlayerInfo: {
    alignItems: 'center',
  },
});
