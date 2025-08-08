import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

/**
 * Placeholder register screen for offline mode
 * The real RegisterScreen imports Clerk which causes errors
 * This will be replaced when online mode is properly implemented
 */
export function RegisterScreen({
  navigation,
}: JugarStackScreenProps<'Register'>) {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>Registro No Disponible</Text>
        <Text style={styles.subtitle}>
          El registro online está en desarrollo.
        </Text>
        <Text style={styles.subtitle}>
          Por ahora, puedes jugar offline sin cuenta.
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            onPress={() => navigation.navigate('JugarHome')}
            icon="🎮"
          >
            Volver al Menú
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 40,
    width: '100%',
    maxWidth: 300,
  },
});