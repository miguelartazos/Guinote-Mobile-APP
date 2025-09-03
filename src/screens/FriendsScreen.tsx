import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { JugarStackNavigationProp } from '../types/navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { AllFriends } from '../components/friends/AllFriends';
import { OnlineFriends } from '../components/friends/OnlineFriends';
import { FriendRequests } from '../components/friends/FriendRequests';
import { BlockedUsers } from '../components/friends/BlockedUsers';
import { useUnifiedFriends } from '../hooks/useUnifiedFriends';
import { isMultiplayerEnabled } from '../config/featureFlags';

type TabName = 'all' | 'online' | 'requests' | 'blocked';

interface Tab {
  name: TabName;
  label: string;
  badge?: number;
}

export function FriendsScreen() {
  const navigation = useNavigation<JugarStackNavigationProp>();
  const [activeTab, setActiveTab] = useState<TabName>('all');
  const { friends, friendRequests, blockedUsers, isLoading } = useUnifiedFriends();

  if (!isMultiplayerEnabled()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disabledContainer}>
          <Text style={styles.disabledText}>El modo multijugador está desactivado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tabs: Tab[] = [
    { name: 'all', label: 'Todos' },
    { name: 'online', label: 'En línea' },
    { name: 'requests', label: 'Solicitudes', badge: friendRequests.length || undefined },
    { name: 'blocked', label: 'Bloqueados' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return <AllFriends />;
      case 'online':
        return <OnlineFriends />;
      case 'requests':
        return <FriendRequests />;
      case 'blocked':
        return <BlockedUsers />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Amigos</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, activeTab === tab.name && styles.activeTab]}
              onPress={() => setActiveTab(tab.name)}
            >
              <Text style={[styles.tabText, activeTab === tab.name && styles.activeTabText]}>
                {tab.label}
              </Text>
              {tab.badge && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <LoadingOverlay visible={true} message="Cargando amigos..." />
        ) : (
          renderTabContent()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 80,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabScrollContent: {
    paddingHorizontal: dimensions.spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    marginRight: dimensions.spacing.sm,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: typography.fontWeight.semibold,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: dimensions.spacing.xs,
  },
  badgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: dimensions.spacing.xl,
  },
  disabledText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
