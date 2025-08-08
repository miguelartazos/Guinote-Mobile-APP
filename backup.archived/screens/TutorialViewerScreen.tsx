import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import { getTutorialSteps } from '../data/tutorialContent';
import { tutorialType } from '../utils/brandedTypes';
import type { JugarStackScreenProps } from '../types/navigation';

export function TutorialViewerScreen({
  navigation,
  route,
}: JugarStackScreenProps<'TutorialViewer'>) {
  const { tutorialType: tutorialTypeParam } = route.params;
  const tutorialSteps = getTutorialSteps(tutorialType(tutorialTypeParam));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = tutorialSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tutorialSteps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    navigation.goBack();
  };

  if (!currentStep) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No se pudo cargar el tutorial seleccionado.
          </Text>
          <Button onPress={() => navigation.goBack()}>Volver</Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header with progress */}
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>
            Paso {currentStepIndex + 1} de {tutorialSteps.length}
          </Text>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${
                    ((currentStepIndex + 1) / tutorialSteps.length) * 100
                  }%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Tutorial content */}
        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentPadding}
        >
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.description}>{currentStep.description}</Text>
        </ScrollView>

        {/* Navigation buttons */}
        <View style={styles.navigationContainer}>
          <View style={styles.navigationButtons}>
            <Button
              variant="secondary"
              onPress={handlePrevious}
              disabled={isFirstStep}
              style={[styles.navButton, isFirstStep && styles.hiddenButton]}
            >
              Anterior
            </Button>

            <Button
              onPress={isLastStep ? handleComplete : handleNext}
              style={styles.navButton}
            >
              {isLastStep ? 'Finalizar' : 'Siguiente'}
            </Button>
          </View>

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {tutorialSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStepIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: dimensions.spacing.xl,
  },
  stepIndicator: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: dimensions.spacing.md,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
  contentPadding: {
    paddingBottom: dimensions.spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.lg,
    textAlign: 'left',
  },
  navigationContainer: {
    paddingTop: dimensions.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.lg,
  },
  navButton: {
    flex: 1,
    marginHorizontal: dimensions.spacing.sm,
  },
  hiddenButton: {
    opacity: 0,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: dimensions.spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
});
