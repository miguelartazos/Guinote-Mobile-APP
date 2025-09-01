import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { FriendCard } from './FriendCard';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { useUnifiedFriends } from '../../hooks/useUnifiedFriends';

interface BlockedUser {
  id: string;
  username: string;
}

export function BlockedUsers() {
  const { blockedUsers, unblockUser } = useUnifiedFriends();

  const handleUnblock = (userId: string) => {
    unblockUser(userId);
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <FriendCard blockedUser={item} onUnblock={handleUnblock} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No hay usuarios bloqueados</Text>
      <Text style={styles.emptyStateText}>Los usuarios que bloquees aparecerán aquí</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {blockedUsers.length > 0 && (
        <View style={styles.headerContainer}>
          <Text style={styles.blockedCount}>
            {blockedUsers.length}{' '}
            {blockedUsers.length === 1 ? 'usuario bloqueado' : 'usuarios bloqueados'}
          </Text>
        </View>
      )}

      <FlatList
        data={blockedUsers}
        renderItem={renderBlockedUser}
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
  blockedCount: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
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
