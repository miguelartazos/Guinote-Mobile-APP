import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TutorialViewerScreen } from './TutorialViewerScreen';

const Stack = createStackNavigator();

const MockNavigationWrapper = ({
  tutorialType: type = 'basic',
}: {
  tutorialType?: 'complete' | 'basic' | 'cantes' | 'special';
}) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen
        name="TutorialViewer"
        component={TutorialViewerScreen}
        initialParams={{ tutorialType: type }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('TutorialViewerScreen', () => {
  test('renders first step of basic tutorial', () => {
    const { getByText } = render(
      <MockNavigationWrapper tutorialType="basic" />,
    );

    expect(getByText('Paso 1 de 7')).toBeTruthy();
    expect(getByText('¡Hola, futuro campeón/a de Guiñote! 🏆')).toBeTruthy();
    expect(
      getByText(/Estás a punto de aprender un juego legendario/),
    ).toBeTruthy();
  });

  test('renders first step of complete tutorial', () => {
    const { getByText } = render(
      <MockNavigationWrapper tutorialType="complete" />,
    );

    expect(getByText('Paso 1 de 9')).toBeTruthy();
    expect(getByText('🎓 Has llegado al final del camino')).toBeTruthy();
  });

  test('renders first step of cantes tutorial', () => {
    const { getByText } = render(
      <MockNavigationWrapper tutorialType="cantes" />,
    );

    expect(getByText('Paso 1 de 8')).toBeTruthy();
    expect(getByText('🚀 ¿Ya te sientes cómodo/a con lo básico?')).toBeTruthy();
  });

  test('renders first step of special tutorial', () => {
    const { getByText } = render(
      <MockNavigationWrapper tutorialType="special" />,
    );

    expect(getByText('Paso 1 de 4')).toBeTruthy();
    expect(
      getByText('⭐ Reglas Especiales y Situaciones Avanzadas'),
    ).toBeTruthy();
  });

  test('navigation buttons work correctly', () => {
    const { getByText, queryByText } = render(
      <MockNavigationWrapper tutorialType="basic" />,
    );

    // First step - no Previous button visible, only Next
    expect(queryByText('Anterior')).toBeTruthy(); // Button exists but is disabled/hidden
    expect(getByText('Siguiente')).toBeTruthy();

    // Go to next step
    fireEvent.press(getByText('Siguiente'));
    expect(getByText('Paso 2 de 7')).toBeTruthy();
    expect(getByText('🎯 Tu Misión (Si decides aceptarla...)')).toBeTruthy();

    // Previous button should now be enabled
    fireEvent.press(getByText('Anterior'));
    expect(getByText('Paso 1 de 7')).toBeTruthy();
    expect(getByText('¡Hola, futuro campeón/a de Guiñote! 🏆')).toBeTruthy();
  });

  test('shows Finalizar button on last step', () => {
    const { getByText } = render(
      <MockNavigationWrapper tutorialType="special" />,
    );

    // Navigate to last step (step 4 of 4)
    fireEvent.press(getByText('Siguiente')); // Step 2
    fireEvent.press(getByText('Siguiente')); // Step 3
    fireEvent.press(getByText('Siguiente')); // Step 4 (last)

    expect(getByText('Paso 4 de 4')).toBeTruthy();
    expect(getByText('Finalizar')).toBeTruthy();
    expect(getByText('El Capote: Victoria Total')).toBeTruthy();
  });

  test('navigates through multiple steps correctly', () => {
    const { getByText } = render(
      <MockNavigationWrapper tutorialType="basic" />,
    );

    // Navigate to step 3
    fireEvent.press(getByText('Siguiente')); // Step 2
    fireEvent.press(getByText('Siguiente')); // Step 3

    expect(getByText('Paso 3 de 7')).toBeTruthy();
    expect(getByText('🃏 Las Cartas y los Equipos')).toBeTruthy();
  });

  test('displays tutorial content with proper formatting', () => {
    const { getByText } = render(
      <MockNavigationWrapper tutorialType="basic" />,
    );

    // Check that the description text is displayed
    expect(
      getByText(/Estás a punto de aprender un juego legendario/),
    ).toBeTruthy();
  });

  test('step progress updates correctly', () => {
    const { getByText } = render(
      <MockNavigationWrapper tutorialType="basic" />,
    );

    // First step should show progress
    expect(getByText('Paso 1 de 7')).toBeTruthy();

    // Navigate forward and check progress updates
    fireEvent.press(getByText('Siguiente'));
    expect(getByText('Paso 2 de 7')).toBeTruthy();

    fireEvent.press(getByText('Siguiente'));
    expect(getByText('Paso 3 de 7')).toBeTruthy();
  });
});
