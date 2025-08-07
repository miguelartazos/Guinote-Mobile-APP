import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { AnimatedButton } from '../ui/AnimatedButton';
import { haptics } from '../../utils/haptics';
import type { TutorialStepId } from '../../types/game.types';

export type TutorialStep = {
  id: TutorialStepId;
  title: string;
  description: string;
};

type TutorialOverlayProps = {
  visible: boolean;
  currentStep: TutorialStep;
  totalSteps: number;
  currentStepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
};

export function TutorialOverlay({
  visible,
  currentStep,
  totalSteps,
  currentStepIndex,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
}: TutorialOverlayProps) {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    if (visible) {
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
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Dark overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.overlay,
            { opacity: fadeAnim },
          ]}
          pointerEvents="none"
        />

        {/* Tutorial content centered */}
        <Animated.View
          style={[
            styles.tooltip,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.tooltipHeader}>
            <Text style={styles.stepIndicator}>
              Paso {currentStepIndex + 1} de {totalSteps}
            </Text>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Saltar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.description}>{currentStep.description}</Text>

          <View style={styles.navigationButtons}>
            {currentStepIndex > 0 && (
              <AnimatedButton
                onPress={() => {
                  haptics.light();
                  onPrevious();
                }}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>Anterior</Text>
              </AnimatedButton>
            )}

            <AnimatedButton
              onPress={() => {
                haptics.light();
                if (isLastStep) {
                  onComplete();
                } else {
                  onNext();
                }
              }}
              style={[styles.navButton, styles.nextButton]}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Finalizar' : 'Siguiente'}
              </Text>
            </AnimatedButton>
          </View>

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStepIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  tooltip: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.xl,
    padding: dimensions.spacing.xl,
    borderWidth: 2,
    borderColor: colors.accent,
    elevation: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    maxWidth: '90%',
    width: '100%',
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  stepIndicator: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  skipButton: {
    padding: dimensions.spacing.sm,
  },
  skipText: {
    fontSize: typography.fontSize.md,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.md,
  },
  description: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    lineHeight: typography.lineHeight.normal * typography.fontSize.lg,
    marginBottom: dimensions.spacing.lg,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: dimensions.spacing.md,
    marginBottom: dimensions.spacing.lg,
  },
  navButton: {
    flex: 1,
    minHeight: dimensions.touchTarget.comfortable,
  },
  navButtonText: {
    color: colors.text,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  nextButton: {
    backgroundColor: colors.accent,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: dimensions.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
    opacity: 0.3,
  },
  activeDot: {
    backgroundColor: colors.accent,
    opacity: 1,
  },
});
