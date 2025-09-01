import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { FriendCard } from './FriendCard';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { useUnifiedFriends } from '../../hooks/useUnifiedFriends';
import type { FriendRequest } from '../../types/friend.types';

export function FriendRequests() {
  const { friendRequests, acceptFriendRequest } = useUnifiedFriends();

  const handleAccept = (requestId: string) => {
    acceptFriendRequest(requestId);
  };

  const handleReject = (requestId: string) => {
    // TODO: Add reject functionality when available in hook
    console.log('Rejecting friend request', requestId);
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <FriendCard request={item} onAccept={handleAccept} onReject={handleReject} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No tienes solicitudes pendientes</Text>
      <Text style={styles.emptyStateText}>Las solicitudes de amistad aparecerán aquí</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {friendRequests.length > 0 && (
        <View style={styles.headerContainer}>
          <Text style={styles.requestCount}>
            {friendRequests.length}{' '}
            {friendRequests.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
          </Text>
        </View>
      )}

      <FlatList
        data={friendRequests}
        renderItem={renderRequest}
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
  requestCount: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
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
