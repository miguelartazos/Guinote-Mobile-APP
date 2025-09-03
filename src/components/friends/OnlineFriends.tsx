import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { FriendCard } from './FriendCard';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { useUnifiedFriends } from '../../hooks/useUnifiedFriends';
import { useUnifiedRooms } from '../../hooks/useUnifiedRooms';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { shareRoomViaWhatsApp } from '../../services/sharing/whatsappShare';
import type { Friend } from '../../types/friend.types';

export function OnlineFriends() {
  const { friends, removeFriend } = useUnifiedFriends();
  const { createFriendsRoom } = useUnifiedRooms();
  const { user } = useUnifiedAuth();

  const onlineFriends = friends.filter(friend => friend.isOnline);

  const handleInvite = async (friendId: string) => {
    if (!user?.id) {
      return;
    }
    const room = await createFriendsRoom(user.id);
    if (room) {
      await shareRoomViaWhatsApp(room.code);
      // In a more advanced flow, we’d also notify the friend via in-app invite
    }
  };

  const handleRemove = (friendId: string) => {
    removeFriend(friendId);
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <FriendCard friend={item} onInvite={handleInvite} onRemove={handleRemove} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No hay amigos en línea</Text>
      <Text style={styles.emptyStateText}>Tus amigos aparecerán aquí cuando estén conectados</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.onlineCount}>
          {onlineFriends.length} {onlineFriends.length === 1 ? 'amigo' : 'amigos'} en línea
        </Text>
      </View>

      <FlatList
        data={onlineFriends}
        renderItem={renderFriend}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    padding: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  onlineCount: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
  },
  listContent: {
    paddingVertical: dimensions.spacing.sm,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: dimensions.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: dimensions.spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
