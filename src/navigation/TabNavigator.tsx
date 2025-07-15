import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { JugarStackNavigator } from './JugarStackNavigator';
import { AmigosScreen } from '../screens/AmigosScreen';
import { RankingScreen } from '../screens/RankingScreen';
import { TiendaScreen } from '../screens/TiendaScreen';
import { ComunidadScreen } from '../screens/ComunidadScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import type { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopColor: colors.secondary,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
      }}
    >
      <Tab.Screen
        name="Jugar"
        component={JugarStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ color: focused ? colors.accent : colors.text }}>
              🎮
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Amigos"
        component={AmigosScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ color: focused ? colors.accent : colors.text }}>
              👥
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Ranking"
        component={RankingScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ color: focused ? colors.accent : colors.text }}>
              📈
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Tienda"
        component={TiendaScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ color: focused ? colors.accent : colors.text }}>
              🛍️
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Comunidad"
        component={ComunidadScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ color: focused ? colors.accent : colors.text }}>
              📰
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Ajustes"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ color: focused ? colors.accent : colors.text }}>
              ⚙️
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
