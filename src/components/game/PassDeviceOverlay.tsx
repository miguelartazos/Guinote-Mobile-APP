import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type PassDeviceOverlayProps = {
  visible: boolean;
  playerName: string;
  playerAvatar: string;
  onContinue: () => void;
  autoHideDelay?: number; // milliseconds
};

export function PassDeviceOverlay({
  visible,
  playerName,
  playerAvatar,
  onContinue,
  autoHideDelay = 3000,
}: PassDeviceOverlayProps) {
  const [countdown, setCountdown] = useState(3);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    if (visible) {
      // Reset countdown
      setCountdown(Math.ceil(autoHideDelay / 1000));

      // Start animations
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

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto hide timer
      const hideTimer = setTimeout(() => {
        onContinue();
      }, autoHideDelay);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(hideTimer);
      };
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, autoHideDelay, fadeAnim, scaleAnim, onContinue]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={1}
        onPress={onContinue}
        testID="pass-device-container"
      >
        {/* Dark Background Overlay */}
        <View style={StyleSheet.absoluteFillObject} />

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Player Avatar */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{playerAvatar}</Text>
          </View>

          {/* Pass Device Message */}
          <Text style={styles.title}>Pasa el dispositivo a</Text>
          <Text style={styles.playerName}>{playerName}</Text>

          {/* Security Reminder */}
          <View style={styles.reminderContainer}>
            <Text style={styles.reminderIcon}>🤫</Text>
            <Text style={styles.reminderText}>No mires las cartas de otros jugadores</Text>
          </View>

          {/* Countdown */}
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>Continúa automáticamente en {countdown}...</Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Decorative Elements */}
        <View style={[styles.decorativeCircle, styles.topLeftCircle]} />
        <View style={[styles.decorativeCircle, styles.bottomRightCircle]} />
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.xl,
    padding: dimensions.spacing.xxl,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: dimensions.spacing.xl,
    borderWidth: 4,
    borderColor: colors.accent,
  },
  avatar: {
    fontSize: 60,
  },
  title: {
    fontSize: typography.fontSize.xl,
    color: colors.textMuted,
    marginBottom: dimensions.spacing.sm,
  },
  playerName: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.xl,
    textAlign: 'center',
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.lg,
    marginBottom: dimensions.spacing.xl,
  },
  reminderIcon: {
    fontSize: typography.fontSize.xl,
    marginRight: dimensions.spacing.sm,
  },
  reminderText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontStyle: 'italic',
  },
  countdownContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  countdownText: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
  },
  continueButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: dimensions.spacing.xxl,
    paddingVertical: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  continueButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.05,
  },
  topLeftCircle: {
    top: -100,
    left: -100,
  },
  bottomRightCircle: {
    bottom: -100,
    right: -100,
  },
});
