import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useUnifiedFriends } from '../hooks/useUnifiedFriends';
import { SocialHeader } from '../components/social/SocialHeader';
import { SidebarNavigation } from '../components/social/SidebarNavigation';
import { TabNavigation } from '../components/social/TabNavigation';
import { FriendsList } from '../components/social/FriendsList';
import { SearchPlayers } from '../components/social/SearchPlayers';
import { FriendRequests } from '../components/social/FriendRequestsPanel';
import { SuggestedPlayers } from '../components/social/SuggestedPlayers';
import { InviteFriendsButton } from '../components/social/InviteFriendsButton';

type CenterTab = 'friends' | 'search' | 'requests';

export function SocialScreen() {
  const { user } = useUnifiedAuth();
  const { friendRequests } = useUnifiedFriends();

  const [activeSidebar, setActiveSidebar] = useState<'amigos' | 'club' | 'observar'>('amigos');
  const [activeTab, setActiveTab] = useState<CenterTab>('friends');

  const tabs = useMemo(
    () => [
      { key: 'friends' as const, label: 'Amigos' },
      { key: 'search' as const, label: 'Buscar' },
      { key: 'requests' as const, label: 'Solicitud', badge: friendRequests.length || undefined },
    ],
    [friendRequests.length],
  );

  return (
    <View style={styles.container}>
      <SocialHeader username={user?.username || 'Jugador'} />

      <View style={styles.mainColumns}>
        <View style={styles.leftColumn}>
          <SidebarNavigation active={activeSidebar} onChange={setActiveSidebar} />
        </View>

        <View style={styles.centerColumn}>
          <TabNavigation tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
          <View style={styles.centerContent}>
            {activeTab === 'friends' && <FriendsList />}
            {activeTab === 'search' && <SearchPlayers />}
            {activeTab === 'requests' && <FriendRequests />}
          </View>
        </View>

        <View style={styles.rightColumn}>
          <ScrollView contentContainerStyle={styles.rightContent} showsVerticalScrollIndicator={false}>
            <SuggestedPlayers />
            <InviteFriendsButton style={styles.inviteButton} />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainColumns: {
    flex: 1,
    flexDirection: 'row',
    padding: dimensions.spacing.md,
    gap: dimensions.spacing.md,
  },
  leftColumn: {
    width: 140,
  },
  centerColumn: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
  },
  rightColumn: {
    width: 260,
  },
  rightContent: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
    minHeight: 200,
  },
  inviteButton: {
    marginTop: dimensions.spacing.lg,
  },
});


