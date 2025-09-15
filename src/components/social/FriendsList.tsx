import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { useUnifiedFriends } from '../../hooks/useUnifiedFriends';
import { PlayerCard } from './PlayerCard';
import { useUnifiedRooms } from '../../hooks/useUnifiedRooms';
import { shareRoomViaWhatsApp } from '../../services/sharing/whatsappShare';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { SkeletonList } from './Skeleton';

export function FriendsList() {
  const { friends, getFriends, removeFriend } = useUnifiedFriends();
  const rooms = useUnifiedRooms();
  const { user } = useUnifiedAuth();

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  return (
    <View style={styles.container}>
      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No tienes amigos todavía</Text>
          <Text style={styles.emptySubtitle}>Usa Buscar para enviar solicitudes</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <PlayerCard
              username={item.username}
              subtitle={item.isOnline ? 'En línea' : 'Desconectado'}
              avatarUrl={item.avatarUrl || undefined}
              actions={[
                {
                  label: 'Invitar',
                  variant: 'primary',
                  onPress: async () => {
                    const hostId = (user as any)?.id || (user as any)?._id;
                    if (!hostId) return;
                    const room = await rooms.createFriendsRoom(hostId);
                    await shareRoomViaWhatsApp(room.code);
                  },
                },
                { label: 'Eliminar', variant: 'danger', onPress: () => removeFriend(String(item.id)) },
              ]}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
      {friends.length === 0 && (
        <View style={{ marginTop: dimensions.spacing.md }}>
          <SkeletonList />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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


