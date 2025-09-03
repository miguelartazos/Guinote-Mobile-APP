import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { FriendCard } from './FriendCard';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { useUnifiedFriends } from '../../hooks/useUnifiedFriends';
import { useUnifiedRooms } from '../../hooks/useUnifiedRooms';
import type { Friend } from '../../types/friend.types';

export function AllFriends() {
  const [searchQuery, setSearchQuery] = useState('');
  const { friends, removeFriend } = useUnifiedFriends();
  const { createFriendsRoom } = useUnifiedRooms();

  const filteredFriends = friends
    .filter(friend => friend.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.ranking || 0) - (a.ranking || 0));

  const handleInvite = async (friendId: string) => {
    const room = await createFriendsRoom(friendId);
    if (room) {
      // TODO: Send invitation to friend
      console.log('Inviting friend', friendId, 'to room', room.id);
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
      <Text style={styles.emptyStateTitle}>No tienes amigos agregados</Text>
      <Text style={styles.emptyStateText}>
        Busca usuarios por su código de amigo para agregarlos
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar amigos..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredFriends}
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
  searchContainer: {
    padding: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text,
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
