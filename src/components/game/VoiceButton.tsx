import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { useVoicePermissions } from '../../hooks/useVoicePermissions';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import type { VoiceRecordingId } from '../../types/voice.types';

type VoiceButtonProps = {
  playerId: string;
  onRecordingComplete: (recordingId: VoiceRecordingId) => void;
  disabled?: boolean;
};

export function VoiceButton({
  playerId,
  onRecordingComplete,
  disabled = false,
}: VoiceButtonProps) {
  const { hasPermission, requestPermission } = useVoicePermissions();
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    MAX_RECORDING_DURATION,
  } = useVoiceRecorder();

  const [isPressing, setIsPressing] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const recordingIdRef = useRef<VoiceRecordingId | null>(null);
  const isProcessingRef = useRef(false);

  // Pulsing animation while recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const handlePressIn = async () => {
    if (disabled || isProcessingRef.current || isRecording || showCountdown)
      return;

    isProcessingRef.current = true;

    // Check permissions first
    if (hasPermission === false) {
      const granted = await requestPermission();
      if (!granted) {
        isProcessingRef.current = false;
        return;
      }
    } else if (hasPermission === null) {
      // First time, request permission
      const granted = await requestPermission();
      if (!granted) {
        isProcessingRef.current = false;
        return;
      }
    }

    setIsPressing(true);
    // Haptic feedback pattern: start countdown
    Vibration.vibrate([0, 10, 50, 20]);

    // Scale down animation
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Start countdown
    setShowCountdown(true);
    isProcessingRef.current = false;
  };

  const handlePressOut = async () => {
    if (!isPressing || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsPressing(false);
    setShowCountdown(false);

    // Haptic feedback: cancel
    Vibration.vibrate(5);

    // Scale back animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // If recording, stop it
    if (isRecording) {
      const success = await stopRecording();
      if (success && recordingIdRef.current) {
        onRecordingComplete(recordingIdRef.current);
        recordingIdRef.current = null;
      }
    }

    isProcessingRef.current = false;
  };

  const _remainingTime = Math.max(
    0,
    (MAX_RECORDING_DURATION - recordingDuration) / 1000,
  );

  const _recordingProgress = recordingDuration / MAX_RECORDING_DURATION;

  const _handleCountdownComplete = async () => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setShowCountdown(false);

    // Haptic feedback: recording starts
    Vibration.vibrate([0, 20, 10, 20]);

    // Start actual recording
    const recordingId = await startRecording(playerId);
    if (recordingId) {
      recordingIdRef.current = recordingId;
    }

    isProcessingRef.current = false;
  };

  // Haptic feedback at milestones
  useEffect(() => {
    if (isRecording) {
      if (recordingDuration >= 2500 && recordingDuration < 2600) {
        // Halfway milestone
        Vibration.vibrate(10);
      } else if (recordingDuration >= 4500 && recordingDuration < 4600) {
        // Near end warning
        Vibration.vibrate([0, 10, 50, 10]);
      }
    }
  }, [isRecording, recordingDuration]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isRecording && styles.recordingButton,
        disabled && styles.disabledButton,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.buttonInner,
          isRecording && {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.icon}>🎤</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingButton: {
    backgroundColor: '#DC2626',
  },
  disabledButton: {
    backgroundColor: colors.secondary,
    opacity: 0.5,
  },
  buttonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  progressContainer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: -45,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
  },
  recordingText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginTop: 4,
  },
  hintText: {
    position: 'absolute',
    bottom: -25,
    color: colors.text,
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
  },
});
