import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { JugarHomeScreen } from '../screens/JugarHomeScreen';
import { QuickMatchScreen } from '../screens/QuickMatchScreen';
import { FriendsLobbyScreen } from '../screens/FriendsLobbyScreen';
import { GameRoomScreen } from '../screens/GameRoomScreen';
import { CreateRoomScreen } from '../screens/CreateRoomScreen';
import { OfflineModeScreen } from '../screens/OfflineModeScreen';
import { LocalMultiplayerScreen } from '../screens/LocalMultiplayerScreen';
import { TutorialSetupScreen } from '../screens/TutorialSetupScreen';
import { TutorialViewerScreen } from '../screens/TutorialViewerScreen';
import { GameScreen } from '../screens/GameScreen';
// Using offline placeholders - real screens import Clerk which causes errors
import { LoginScreen } from '../screens/LoginScreenOffline';
import { RegisterScreen } from '../screens/RegisterScreenOffline';
import { OnlineLobbyScreen } from '../screens/OnlineLobbyScreen';
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
      <Stack.Screen name="JugarHome" component={JugarHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="QuickMatch"
        component={QuickMatchScreen}
        options={{ title: 'Partida Rápida' }}
      />
      <Stack.Screen
        name="FriendsLobby"
        component={FriendsLobbyScreen}
        options={{ title: 'Jugar con Amigos' }}
      />
      <Stack.Screen
        name="GameRoom"
        component={GameRoomScreen}
        options={{ title: 'Sala de Juego' }}
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
        name="LocalMultiplayer"
        component={LocalMultiplayerScreen}
        options={{ title: 'Paso y Juego' }}
      />
      <Stack.Screen
        name="TutorialSetup"
        component={TutorialSetupScreen}
        options={{ title: 'Tutorial' }}
      />
      <Stack.Screen
        name="TutorialViewer"
        component={TutorialViewerScreen}
        options={{ title: 'Tutorial' }}
      />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{
          title: 'Juego',
          headerShown: false,
        }}
      />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar Sesión' }} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Crear Cuenta' }}
      />
      <Stack.Screen
        name="OnlineLobby"
        component={OnlineLobbyScreen}
        options={{ title: 'Lobby Online' }}
      />
    </Stack.Navigator>
  );
}
