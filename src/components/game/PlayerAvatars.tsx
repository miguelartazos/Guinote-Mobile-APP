import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

export interface PlayerAvatarInfo {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  isCurrentTurn: boolean;
  position: 'top' | 'right' | 'bottom' | 'left';
}

interface PlayerAvatarsProps {
  players: PlayerAvatarInfo[];
  currentPlayerId: string;
  compact?: boolean;
}

export function PlayerAvatars({
  players,
  currentPlayerId: _currentPlayerId,
  compact = false,
}: PlayerAvatarsProps) {
  const avatarSize = compact ? 40 : 50;

  return (
    <>
      {players.map(player => (
        <PlayerAvatar key={player.id} player={player} avatarSize={avatarSize} />
      ))}
    </>
  );
}

interface PlayerAvatarProps {
  player: PlayerAvatarInfo;
  avatarSize: number;
}

function PlayerAvatar({ player, avatarSize }: PlayerAvatarProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (player.isCurrentTurn) {
      // Pulse animation for current turn
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

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [player.isCurrentTurn, pulseAnim, glowAnim]);

  const getPositionStyle = () => {
    switch (player.position) {
      case 'bottom':
        return { bottom: 20, left: '50%', transform: [{ translateX: -avatarSize / 2 }] };
      case 'top':
        return { top: 20, left: '50%', transform: [{ translateX: -avatarSize / 2 }] };
      case 'left':
        return { left: 20, top: '50%', transform: [{ translateY: -avatarSize / 2 }] };
      case 'right':
        return { right: 20, top: '50%', transform: [{ translateY: -avatarSize / 2 }] };
      default:
        return { bottom: 20, left: '50%', transform: [{ translateX: -avatarSize / 2 }] };
    }
  };

  return (
    <View
      testID={`avatar-container-${player.id}`}
      style={[styles.avatarContainer, getPositionStyle(), styles.absolutePosition]}
    >
      <Animated.View
        testID={`avatar-${player.id}`}
        style={[
          styles.avatar,
          player.isCurrentTurn && styles.avatarCurrentTurn,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={[styles.avatarEmoji, { fontSize: avatarSize * 0.6 }]}>
          {player.avatar || '👤'}
        </Text>
      </Animated.View>

      {player.isCurrentTurn && (
        <Animated.View
          testID={`turn-indicator-${player.id}`}
          style={[
            styles.turnIndicator,
            {
              opacity: glowAnim,
              width: avatarSize + 20,
              height: avatarSize + 20,
              borderRadius: (avatarSize + 20) / 2,
            },
          ]}
        />
      )}

      {!player.isOnline && (
        <View
          testID={`offline-indicator-${player.id}`}
          style={[
            styles.offlineIndicator,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      )}

      <Text style={styles.playerName}>{player.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    zIndex: 100,
  },
  absolutePosition: {
    position: 'absolute',
  },
  avatar: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: 2,
  },
  avatarCurrentTurn: {
    borderColor: colors.accent,
    borderWidth: 3,
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  playerName: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: dimensions.spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 2,
    borderRadius: dimensions.borderRadius.xs,
  },
  offlineIndicator: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  turnIndicator: {
    position: 'absolute',
    backgroundColor: colors.accent,
    opacity: 0.3,
  },
});
