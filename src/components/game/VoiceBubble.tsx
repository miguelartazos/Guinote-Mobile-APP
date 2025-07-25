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
import { getRecording } from '../../utils/voiceStorage';
import type { VoiceRecordingId } from '../../utils/voiceStorage';

type VoiceBubbleProps = {
  recordingId: VoiceRecordingId;
  playerName: string;
  playerAvatar: string;
  position: 'top' | 'left' | 'right' | 'bottom';
  onExpire?: () => void;
};

const AUTO_HIDE_DURATION = 10000; // 10 seconds

export function VoiceBubble({
  recordingId,
  playerName,
  playerAvatar,
  position,
  onExpire,
}: VoiceBubbleProps) {
  const { isPlaying, playRecording, stopPlayback } = useVoiceRecorder();
  const [isVisible, setIsVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Create animated values for wave animation
  const waveAnims = useRef([
    new Animated.Value(8),
    new Animated.Value(8),
    new Animated.Value(8),
    new Animated.Value(8),
  ]).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
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

  const handleExpire = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
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

  if (!isVisible) return null;

  const bubblePositionStyle = getBubblePosition(position);

  return (
    <Animated.View
      style={[
        styles.container,
        bubblePositionStyle,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.bubble, isPlaying && styles.playingBubble]}
        onPress={handlePlay}
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
      </TouchableOpacity>
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
});
