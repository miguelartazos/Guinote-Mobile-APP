import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { JugarStackNavigator } from './JugarStackNavigator';
import { TorneosTab } from '../screens/TorneosTab';
import { SocialTab } from '../screens/SocialTab';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import type { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabItemProps = {
  label: string;
  icon: string;
  focused: boolean;
};

function TabItem({ label, icon, focused }: TabItemProps) {
  const scaleAnim = React.useRef(new Animated.Value(focused ? 1.1 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleAnim]);

  return (
    <View>
      <Animated.View
        style={[
          styles.iconContainer,
          focused && styles.iconContainerActive,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text
          style={[
            styles.icon,
            { color: focused ? colors.mediterraneanTerracotta : colors.textSecondary },
          ]}
        >
          {icon}
        </Text>
      </Animated.View>
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.mediterraneanTerracotta,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}
    >
      <Tab.Screen
        name="Jugar"
        component={JugarStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="JUGAR" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabItem label="JUGAR" icon="🎮" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Torneos"
        component={TorneosTab}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="TORNEOS" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabItem label="TORNEOS" icon="🏆" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialTab}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="SOCIAL" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabItem label="SOCIAL" icon="👥" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 12,
    minWidth: 48,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: `${colors.mediterraneanTerracotta}10`,
  },
  icon: {
    fontSize: 24,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: colors.mediterraneanTerracotta,
    fontWeight: typography.fontWeight.bold,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 3,
    backgroundColor: colors.mediterraneanTerracotta,
    borderRadius: 2,
  },
});
