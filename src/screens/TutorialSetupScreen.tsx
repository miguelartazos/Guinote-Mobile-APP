import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

type TutorialType = 'complete' | 'basic' | 'cantes' | 'special';

export function TutorialSetupScreen({
  navigation,
}: JugarStackScreenProps<'TutorialSetup'>) {
  const [selectedTutorial, setSelectedTutorial] =
    useState<TutorialType>('complete');

  const tutorials = [
    {
      type: 'complete' as const,
      title: 'Tutorial Completo 🎓',
      description:
        '¡Las llaves del reino! Todo lo que necesitas para dominar el Guiñote como un maestro',
      duration: '10 min',
      icon: '🎓',
      recommended: true,
    },
    {
      type: 'basic' as const,
      title: 'Lo Básico 👶',
      description:
        '¡Hola, futuro campeón/a! Aprende lo esencial para jugar en menos de 5 minutos',
      duration: '5 min',
      icon: '👶',
    },
    {
      type: 'cantes' as const,
      title: 'Cantes y Puntuación 🚀',
      description:
        '¡Hora de subir de nivel! Desbloquea los superpoderes del Guiñote',
      duration: '8 min',
      icon: '🚀',
    },
    {
      type: 'special' as const,
      title: 'Reglas Especiales ⭐',
      description:
        'Situaciones avanzadas y reglas especiales. ¡Domínalas y serás imparable!',
      duration: '4 min',
      icon: '⭐',
    },
  ];

  const startTutorial = () => {
    navigation.navigate('TutorialViewer', {
      tutorialType: selectedTutorial,
    });
  };

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Aprende a Jugar</Text>
          <Text style={styles.subtitle}>Elige qué quieres aprender hoy</Text>
        </View>

        <View style={styles.tutorialsContainer}>
          {tutorials.map(tutorial => (
            <Button
              key={tutorial.type}
              onPress={() => setSelectedTutorial(tutorial.type)}
              variant={
                selectedTutorial === tutorial.type ? 'primary' : 'secondary'
              }
              style={[
                styles.tutorialCard,
                selectedTutorial === tutorial.type && styles.selectedCard,
              ]}
            >
              <View style={styles.tutorialContent}>
                <View style={styles.tutorialHeader}>
                  <Text style={styles.tutorialIcon}>{tutorial.icon}</Text>
                  <View style={styles.tutorialInfo}>
                    <Text
                      style={[
                        styles.tutorialTitle,
                        selectedTutorial === tutorial.type &&
                          styles.selectedTitle,
                      ]}
                    >
                      {tutorial.title}
                    </Text>
                    {tutorial.recommended && (
                      <Text style={styles.recommendedBadge}>RECOMENDADO</Text>
                    )}
                  </View>
                </View>
                <Text
                  style={[
                    styles.tutorialDescription,
                    selectedTutorial === tutorial.type &&
                      styles.selectedDescription,
                  ]}
                >
                  {tutorial.description}
                </Text>
                <Text
                  style={[
                    styles.tutorialDuration,
                    selectedTutorial === tutorial.type &&
                      styles.selectedDuration,
                  ]}
                >
                  ⏱ {tutorial.duration}
                </Text>
              </View>
            </Button>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            ¡Relájate y aprende a tu ritmo! Estos tutoriales son solo de
            lectura. Navega paso a paso y cuando termines, ¡estarás listo/a para
            conquistar el Guiñote!
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button onPress={startTutorial}>Comenzar Tutorial</Button>
          <Button
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Volver
          </Button>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  tutorialsContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  tutorialCard: {
    marginBottom: dimensions.spacing.md,
    minHeight: 'auto',
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: dimensions.borderRadius.lg,
    overflow: 'hidden',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  tutorialContent: {
    padding: dimensions.spacing.lg,
  },
  tutorialHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: dimensions.spacing.sm,
  },
  tutorialIcon: {
    fontSize: 32,
    marginRight: dimensions.spacing.md,
  },
  tutorialInfo: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  selectedTitle: {
    color: colors.primary,
  },
  recommendedBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 2,
    borderRadius: dimensions.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  tutorialDescription: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    marginBottom: dimensions.spacing.sm,
    lineHeight: typography.lineHeight.normal * typography.fontSize.md,
  },
  selectedDescription: {
    color: colors.primary,
  },
  tutorialDuration: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  selectedDuration: {
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.xxl,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: typography.lineHeight.normal * typography.fontSize.md,
  },
  buttonContainer: {
    marginBottom: dimensions.spacing.xxl,
  },
  backButton: {
    marginTop: dimensions.spacing.md,
  },
});
