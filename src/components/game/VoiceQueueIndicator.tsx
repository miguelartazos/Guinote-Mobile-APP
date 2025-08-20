import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import type { QueuedVoiceMessage } from '../../utils/voiceQueue';

type VoiceQueueIndicatorProps = {
  queue: QueuedVoiceMessage[];
  isPaused: boolean;
  onPauseToggle: () => void;
  onClear: () => void;
  onSkip: () => void;
};

export function VoiceQueueIndicator({
  queue,
  isPaused,
  onPauseToggle,
  onClear,
  onSkip,
}: VoiceQueueIndicatorProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Show/hide animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: queue.length > 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [queue.length, fadeAnim]);

  // Pulse animation when not paused
  useEffect(() => {
    if (!isPaused && queue.length > 0) {
      const animation = Animated.loop(
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
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isPaused, queue.length, pulseAnim]);

  if (queue.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: fadeAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.queueIcon,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.queueIconText}>🎙️</Text>
        </Animated.View>
        <Text style={styles.queueCount}>{queue.length}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={onPauseToggle} activeOpacity={0.7}>
          <Text style={styles.controlButtonText}>{isPaused ? '▶️' : '⏸'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.controlButtonText}>⏭️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.clearButton]}
          onPress={onClear}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Preview of queued messages */}
      <View style={styles.preview}>
        {queue.slice(0, 3).map((msg, index) => (
          <View key={msg.id} style={styles.previewItem}>
            <Text style={styles.previewAvatar}>{msg.playerAvatar}</Text>
            {index < queue.length - 1 && <Text style={styles.previewSeparator}>›</Text>}
          </View>
        ))}
        {queue.length > 3 && <Text style={styles.moreIndicator}>+{queue.length - 3}</Text>}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 50,
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.xl,
    padding: dimensions.spacing.sm,
    minWidth: 120,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dimensions.spacing.xs,
  },
  queueIcon: {
    marginRight: dimensions.spacing.xs,
  },
  queueIconText: {
    fontSize: typography.fontSize.lg,
  },
  queueCount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: dimensions.spacing.xs,
  },
  controlButton: {
    width: 32,
    height: 32,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  clearButton: {
    backgroundColor: '#DC2626',
  },
  controlButtonText: {
    fontSize: typography.fontSize.sm,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    fontSize: typography.fontSize.sm,
    marginHorizontal: 2,
  },
  previewSeparator: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginHorizontal: 2,
  },
  moreIndicator: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginLeft: 4,
  },
});
