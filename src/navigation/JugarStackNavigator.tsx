import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainGameHubScreen } from '../screens/MainGameHubScreen';
import { GameScreen } from '../screens/GameScreen';
import { RoomScreen } from '../screens/RoomScreen';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import type { JugarStackParamList } from '../types/navigation';

const Stack = createStackNavigator<JugarStackParamList>();

export function JugarStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: typography.fontWeight.bold,
          fontSize: typography.fontSize.lg,
        },
        cardStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="MainGameHub"
        component={MainGameHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{ title: 'Juego' }}
      />
      <Stack.Screen
        name="Room"
        component={RoomScreen}
        options={{ title: 'Sala Multijugador' }}
      />
    </Stack.Navigator>
  );
}
