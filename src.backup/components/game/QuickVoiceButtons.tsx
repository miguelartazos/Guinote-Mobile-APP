import React, { useState, useRef } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import {
  QUICK_VOICE_MESSAGES,
  QuickVoiceMessage,
  QuickVoiceMessageId,
} from '../../utils/quickVoiceMessages';

type QuickVoiceButtonsProps = {
  onQuickMessage: (message: QuickVoiceMessage) => void;
  disabled?: boolean;
  visible?: boolean;
};

export function QuickVoiceButtons({
  onQuickMessage,
  disabled = false,
  visible = true,
}: QuickVoiceButtonsProps) {
  const [pressedButton, setPressedButton] =
    useState<QuickVoiceMessageId | null>(null);
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  const handleQuickMessagePress = (message: QuickVoiceMessage) => {
    if (disabled) return;

    setPressedButton(message.id);

    // Visual feedback with slight delay
    setTimeout(() => {
      setPressedButton(null);
      onQuickMessage(message);
    }, 150);
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {QUICK_VOICE_MESSAGES.map(message => (
          <TouchableOpacity
            key={message.id}
            style={[
              styles.quickButton,
              pressedButton === message.id && styles.pressedButton,
              disabled && styles.disabledButton,
            ]}
            onPress={() => handleQuickMessagePress(message)}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{message.emoji}</Text>
            <Text
              style={[
                styles.buttonText,
                pressedButton === message.id && styles.pressedButtonText,
                disabled && styles.disabledButtonText,
              ]}
            >
              {message.text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: dimensions.spacing.sm,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: dimensions.spacing.xs,
    gap: dimensions.spacing.xs,
  },
  quickButton: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    alignItems: 'center',
    minWidth: 80,
    maxWidth: 100,
    borderWidth: 1,
    borderColor: colors.secondary,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pressedButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    transform: [{ scale: 0.95 }],
  },
  disabledButton: {
    backgroundColor: colors.secondary,
    opacity: 0.5,
  },
  emoji: {
    fontSize: typography.fontSize.lg,
    marginBottom: 2,
  },
  buttonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
  pressedButtonText: {
    color: colors.white,
  },
  disabledButtonText: {
    color: colors.textMuted,
  },
});
