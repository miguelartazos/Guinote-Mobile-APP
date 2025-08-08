import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type PlayerInfoBoxProps = {
  playerName: string;
  ranking: number;
  isCurrentPlayer?: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};

export function PlayerInfoBox({
  playerName,
  ranking,
  isCurrentPlayer = false,
  position,
}: PlayerInfoBoxProps) {
  const getPlayerDisplayName = (name: string) => {
    if (name.length > 10) {
      return name.substring(0, 8) + '...';
    }
    return name;
  };

  return (
    <View style={[styles.container, styles[position]]}>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar} />
          {isCurrentPlayer && (
            <View style={styles.currentPlayerBadge}>
              <Text style={styles.currentPlayerText}>M</Text>
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.playerName} numberOfLines={1}>
            {getPlayerDisplayName(playerName)}
          </Text>
          <Text style={styles.ranking}>Ranking: {ranking}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: dimensions.borderRadius.sm,
    padding: dimensions.spacing.sm,
    minWidth: 180,
    maxWidth: 220,
    zIndex: 20,
  },
  'top-left': {
    top: 20,
    left: 20,
  },
  'top-right': {
    top: 20,
    right: 20,
  },
  'bottom-left': {
    bottom: 20,
    left: 20,
  },
  'bottom-right': {
    bottom: 20,
    right: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3', // Blue color for avatar
  },
  currentPlayerBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF69B4', // Pink color for badge
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlayerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  infoContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.yellowText,
  },
  ranking: {
    fontSize: typography.fontSize.sm,
    color: colors.yellowText,
    marginTop: 2,
  },
});
