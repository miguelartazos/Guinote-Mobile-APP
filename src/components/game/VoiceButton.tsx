import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { useVoicePermissions } from '../../hooks/useVoicePermissions';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import type { VoiceRecordingId } from '../../utils/voiceStorage';

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
    if (disabled || isProcessingRef.current) return;

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
    Vibration.vibrate(10);

    // Scale down animation
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Start recording
    const recordingId = await startRecording(playerId);
    if (recordingId) {
      recordingIdRef.current = recordingId;
    }

    isProcessingRef.current = false;
  };

  const handlePressOut = async () => {
    if (!isPressing || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsPressing(false);

    // Scale back animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Stop recording
    const success = await stopRecording();
    if (success && recordingIdRef.current) {
      onRecordingComplete(recordingIdRef.current);
      recordingIdRef.current = null;
    }

    isProcessingRef.current = false;
  };

  const remainingTime = Math.max(
    0,
    (MAX_RECORDING_DURATION - recordingDuration) / 1000,
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.recordingButton,
          disabled && styles.disabledButton,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
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

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>{remainingTime.toFixed(1)}s</Text>
        </View>
      )}

      {!isRecording && isPressing && (
        <Text style={styles.hintText}>Mantén pulsado</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: dimensions.touchTarget.senior,
    height: dimensions.touchTarget.senior,
    borderRadius: dimensions.touchTarget.senior / 2,
    backgroundColor: colors.accent,
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
    fontSize: typography.fontSize.xxxl,
  },
  recordingIndicator: {
    position: 'absolute',
    top: -30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginRight: 6,
  },
  recordingText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  hintText: {
    position: 'absolute',
    bottom: -25,
    color: colors.text,
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
  },
});
