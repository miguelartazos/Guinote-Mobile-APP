import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { JugarHomeScreen } from '../screens/JugarHomeScreen';
import { QuickMatchScreen } from '../screens/QuickMatchScreen';
import { CreateRoomScreen } from '../screens/CreateRoomScreen';
import { OfflineModeScreen } from '../screens/OfflineModeScreen';
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
        name="JugarHome"
        component={JugarHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuickMatch"
        component={QuickMatchScreen}
        options={{ title: 'Partida Rápida' }}
      />
      <Stack.Screen
        name="CreateRoom"
        component={CreateRoomScreen}
        options={{ title: 'Crear Sala' }}
      />
      <Stack.Screen
        name="OfflineMode"
        component={OfflineModeScreen}
        options={{ title: 'Modo Offline' }}
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
