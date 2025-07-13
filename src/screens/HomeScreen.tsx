import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { RootStackScreenProps } from '../types/navigation';

export function HomeScreen({ navigation }: RootStackScreenProps<'Home'>) {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Guiñote+</Text>
          <Text style={styles.subtitle}>El juego de cartas aragonés</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button onPress={() => navigation.navigate('Game')}>
            Jugar
          </Button>
          
          <Button 
            variant="secondary" 
            onPress={() => navigation.navigate('Multiplayer')}
            style={styles.button}
          >
            Multijugador
          </Button>
          
          <Button 
            variant="secondary" 
            onPress={() => navigation.navigate('Settings')}
            style={styles.button}
          >
            Ajustes
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  buttonContainer: {
    marginBottom: dimensions.spacing.xxl,
  },
  button: {
    marginTop: dimensions.spacing.md,
  },
});