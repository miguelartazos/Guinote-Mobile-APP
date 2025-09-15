import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { useUnifiedFriends } from '../../hooks/useUnifiedFriends';
import { PlayerCard } from './PlayerCard';

export function FriendRequests() {
  const { friendRequests, acceptFriendRequest } = useUnifiedFriends();

  return (
    <View style={styles.container}>
      <FlatList
        data={friendRequests}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No tienes solicitudes pendientes</Text>
            <Text style={styles.emptySubtitle}>Las solicitudes aparecerán aquí</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <PlayerCard
            username={item.senderName}
            subtitle={`ID: ${item.senderId}`}
            avatarUrl={item.senderAvatar || undefined}
            actions={[
              { label: 'Aceptar', variant: 'primary', onPress: () => acceptFriendRequest(String(item.id)) },
              { label: 'Rechazar', variant: 'danger', onPress: () => {} },
            ]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  emptySubtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});


