import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useSounds } from '../../hooks/useSounds';
import { getRecording } from '../../utils/voiceStorage';
import {
  addReaction,
  removeReaction,
  getPlayerReaction,
  getReactionCounts,
  AVAILABLE_REACTIONS,
  ReactionType,
} from '../../utils/voiceReactions';
import type { VoiceRecordingId } from '../../types/voice.types';
import { REACTION_TO_AUDIO_MAP } from '../../utils/soundAssets';

type VoiceBubbleProps = {
  recordingId: VoiceRecordingId;
  playerName: string;
  playerAvatar: string;
  position: 'top' | 'left' | 'right' | 'bottom';
  currentPlayerId?: string;
  onExpire?: () => void;
};

const AUTO_HIDE_DURATION = 10000; // 10 seconds

export function VoiceBubble({
  recordingId,
  playerName,
  playerAvatar,
  position,
  currentPlayerId = 'current_player',
  onExpire,
}: VoiceBubbleProps) {
  const { isPlaying, playRecording, stopPlayback } = useVoiceRecorder();
  const { playReactionSound } = useSounds();
  const [isVisible, setIsVisible] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [reactionCounts, setReactionCounts] = useState(
    getReactionCounts(recordingId),
  );
  const [currentPlayerReaction, setCurrentPlayerReaction] = useState(
    getPlayerReaction(recordingId, currentPlayerId)?.reactionType || null,
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateX = useRef(
    new Animated.Value(getSwooshStart(position).x),
  ).current;
  const translateY = useRef(
    new Animated.Value(getSwooshStart(position).y),
  ).current;
  const reactionFadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Create animated values for wave animation
  const waveAnims = useRef([
    new Animated.Value(8),
    new Animated.Value(8),
    new Animated.Value(8),
    new Animated.Value(8),
  ]).current;

  useEffect(() => {
    // Swoosh entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide timer
    timerRef.current = setTimeout(() => {
      handleExpire();
    }, AUTO_HIDE_DURATION);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reaction animations
  useEffect(() => {
    Animated.timing(reactionFadeAnim, {
      toValue: showReactions ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showReactions, reactionFadeAnim]);

  const handleExpire = () => {
    // Animated exit with fade and shrink
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onExpire?.();
    });
  };

  // Wave animation when playing - follows PlayerPanel pattern
  useEffect(() => {
    if (isPlaying) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.parallel(
            waveAnims.map(anim =>
              Animated.timing(anim, {
                toValue: 16,
                duration: 600,
                useNativeDriver: false, // height animations need layout
              }),
            ),
          ),
          Animated.parallel(
            waveAnims.map(anim =>
              Animated.timing(anim, {
                toValue: 8,
                duration: 600,
                useNativeDriver: false,
              }),
            ),
          ),
        ]),
      );

      animation.start();

      // Cleanup: stop animation when effect re-runs or unmounts
      return () => {
        animation.stop();
        waveAnims.forEach(anim => anim.setValue(8));
      };
    } else {
      // Reset wave heights when not playing
      waveAnims.forEach(anim => anim.setValue(8));
    }
  }, [isPlaying, waveAnims]);

  const handlePlay = async () => {
    const recording = getRecording(recordingId);
    if (!recording) {
      console.error('Recording not found for playback');
      return;
    }

    if (isPlaying) {
      await stopPlayback();
    } else {
      const success = await playRecording(recordingId);
      if (!success) {
        // Show error feedback - for now just log
        console.error('Failed to play voice recording');
        // In a production app, you'd show a toast or alert here
      }
    }

    // Reset auto-hide timer when playing
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleExpire();
      }, AUTO_HIDE_DURATION);
    }
  };

  const handleReactionPress = (reactionType: ReactionType) => {
    if (currentPlayerReaction === reactionType) {
      // Remove reaction
      removeReaction(recordingId, currentPlayerId);
      setCurrentPlayerReaction(null);
    } else {
      // Add/change reaction
      addReaction(recordingId, currentPlayerId, reactionType);
      setCurrentPlayerReaction(reactionType);

      // Play reaction sound
      const audioType = REACTION_TO_AUDIO_MAP[reactionType];
      if (audioType) {
        playReactionSound(audioType);
      }
    }

    // Update counts
    setReactionCounts(getReactionCounts(recordingId));
    setShowReactions(false);
  };

  const handleLongPress = () => {
    setShowReactions(!showReactions);
  };

  const getTotalReactions = () => {
    return Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
  };

  if (!isVisible) return null;

  const bubblePositionStyle = getBubblePosition(position);

  return (
    <Animated.View
      style={[
        styles.container,
        bubblePositionStyle,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateX }, { translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.bubble, isPlaying && styles.playingBubble]}
        onPress={handlePlay}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{playerAvatar}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.playerName}>{playerName}</Text>
          <View style={styles.waveform}>
            {waveAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.wave,
                  {
                    height: anim,
                  },
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.playIcon}>
          <Text style={styles.playIconText}>{isPlaying ? '⏸' : '▶️'}</Text>
        </View>

        {getTotalReactions() > 0 && (
          <View style={styles.reactionSummary}>
            <Text style={styles.reactionCount}>{getTotalReactions()}</Text>
          </View>
        )}
      </TouchableOpacity>

      {showReactions && (
        <Animated.View
          style={[
            styles.reactionsOverlay,
            {
              opacity: reactionFadeAnim,
              transform: [
                {
                  scale: reactionFadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {AVAILABLE_REACTIONS.map(reaction => (
            <TouchableOpacity
              key={reaction}
              style={[
                styles.reactionButton,
                currentPlayerReaction === reaction && styles.selectedReaction,
              ]}
              onPress={() => handleReactionPress(reaction)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{reaction}</Text>
              {reactionCounts[reaction] > 0 && (
                <Text style={styles.reactionButtonCount}>
                  {reactionCounts[reaction]}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

function getBubblePosition(position: VoiceBubbleProps['position']) {
  switch (position) {
    case 'top':
      return styles.topPosition;
    case 'left':
      return styles.leftPosition;
    case 'right':
      return styles.rightPosition;
    case 'bottom':
      return styles.bottomPosition;
  }
}

function getSwooshStart(position: VoiceBubbleProps['position']) {
  switch (position) {
    case 'top':
      return { x: -100, y: -50 };
    case 'left':
      return { x: -100, y: 50 };
    case 'right':
      return { x: 100, y: -50 };
    case 'bottom':
      return { x: 100, y: 50 };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  topPosition: {
    top: 110,
    left: 10,
  },
  leftPosition: {
    bottom: 150,
    left: 10,
  },
  rightPosition: {
    top: 110,
    right: 10,
  },
  bottomPosition: {
    bottom: 150,
    right: 10,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.xl,
    padding: dimensions.spacing.xs,
    minWidth: 160,
    maxWidth: 200,
    borderWidth: 2,
    borderColor: colors.accent,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  playingBubble: {
    borderColor: '#00FF88',
    backgroundColor: colors.primary,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatar: {
    fontSize: typography.fontSize.md,
  },
  content: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    gap: 2,
  },
  wave: {
    width: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  playIcon: {
    marginLeft: 8,
  },
  playIconText: {
    fontSize: typography.fontSize.md,
  },
  reactionSummary: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  reactionCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  reactionsOverlay: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    right: -20,
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.xl,
    padding: dimensions.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  reactionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedReaction: {
    backgroundColor: colors.accent,
    transform: [{ scale: 1.1 }],
  },
  reactionEmoji: {
    fontSize: typography.fontSize.md,
  },
  reactionButtonCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 16,
  },
});
