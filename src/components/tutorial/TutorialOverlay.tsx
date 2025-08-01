import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
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
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  action?: 'tap' | 'drag' | 'observe';
  targetElement?: string;
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
  const pulseAnim = useState(new Animated.Value(1))[0];

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

      // Pulse animation for highlight area
      if (currentStep.highlightArea) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
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
      }
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      pulseAnim.setValue(1);
    }
  }, [visible, currentStep, fadeAnim, scaleAnim, pulseAnim]);

  if (!visible) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const screenDimensions = Dimensions.get('window');

  // Calculate tooltip position based on highlight area
  const getTooltipPosition = () => {
    if (!currentStep.highlightArea) {
      return {
        top: screenDimensions.height * 0.3,
        left: dimensions.spacing.lg,
        right: dimensions.spacing.lg,
      };
    }

    const { y, height } = currentStep.highlightArea;
    const tooltipHeight = 200; // Approximate height

    // Position tooltip above or below highlight area
    if (y + height + tooltipHeight < screenDimensions.height * 0.8) {
      return {
        top: y + height + dimensions.spacing.lg,
        left: dimensions.spacing.lg,
        right: dimensions.spacing.lg,
      };
    } else {
      return {
        bottom: screenDimensions.height - y + dimensions.spacing.lg,
        left: dimensions.spacing.lg,
        right: dimensions.spacing.lg,
      };
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Dark overlay with cutout for highlighted area */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.overlay,
            { opacity: fadeAnim },
          ]}
          pointerEvents="none"
        />

        {/* Highlight area */}
        {currentStep.highlightArea && (
          <Animated.View
            style={[
              styles.highlightArea,
              {
                left: currentStep.highlightArea.x - 10,
                top: currentStep.highlightArea.y - 10,
                width: currentStep.highlightArea.width + 20,
                height: currentStep.highlightArea.height + 20,
                transform: [{ scale: pulseAnim }],
                opacity: fadeAnim,
              },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Tutorial tooltip */}
        <Animated.View
          style={[
            styles.tooltip,
            getTooltipPosition(),
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

          {currentStep.action && (
            <View style={styles.actionHint}>
              <Text style={styles.actionIcon}>
                {currentStep.action === 'tap' && '👆'}
                {currentStep.action === 'drag' && '👋'}
                {currentStep.action === 'observe' && '👀'}
              </Text>
              <Text style={styles.actionText}>
                {currentStep.action === 'tap' && 'Toca para continuar'}
                {currentStep.action === 'drag' && 'Arrastra la carta'}
                {currentStep.action === 'observe' && 'Observa'}
              </Text>
            </View>
          )}

          <View style={styles.navigationButtons}>
            {currentStepIndex > 0 && (
              <AnimatedButton
                onPress={() => {
                  haptics.light();
                  onPrevious();
                }}
                variant="secondary"
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
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  highlightArea: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.accent,
    borderRadius: dimensions.borderRadius.lg,
    backgroundColor: 'transparent',
  },
  tooltip: {
    position: 'absolute',
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
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.lg,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.sm,
  },
  actionText: {
    fontSize: typography.fontSize.md,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
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
