import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConvexAuth } from '../hooks/useConvexAuth';
import {
  useConvexFriends,
  useConvexUserSearch,
} from '../hooks/useConvexFriends';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export function FriendsScreen() {
  const { user } = useConvexAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>(
    'friends',
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    friends,
    onlineFriends,
    pendingRequests,
    sentRequests,
    isLoading,
    acceptRequest,
    declineRequest,
    removeFriend,
    sendRequest,
  } = useConvexFriends(user?._id);

  const { searchResults, isSearching } = useConvexUserSearch(
    searchQuery,
    user?._id,
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // The queries will automatically refetch
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSendRequest = async (toUserId: string) => {
    try {
      await sendRequest(toUserId as any);
      Alert.alert('Éxito', 'Solicitud de amistad enviada');
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la solicitud');
    }
  };

  const handleAcceptRequest = async (friendId: string) => {
    try {
      await acceptRequest(friendId as any);
      Alert.alert('Éxito', 'Solicitud aceptada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo aceptar la solicitud');
    }
  };

  const handleDeclineRequest = async (friendId: string) => {
    try {
      await declineRequest(friendId as any);
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    Alert.alert(
      'Eliminar amigo',
      '¿Estás seguro de que quieres eliminar a este amigo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId as any);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar al amigo');
            }
          },
        },
      ],
    );
  };

  const renderFriends = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      );
    }

    if (friends.length === 0) {
      return (
        <Text style={styles.emptyText}>No tienes amigos agregados todavía</Text>
      );
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {friends.map((friend: any) => (
          <View key={friend.id} style={styles.friendItem}>
            <View style={styles.friendInfo}>
              <Text style={styles.avatar}>{friend.avatar}</Text>
              <View>
                <Text style={styles.friendName}>
                  {friend.displayName || friend.username}
                </Text>
                <Text style={styles.friendStatus}>
                  {friend.isOnline ? '🟢 En línea' : '⚫ Desconectado'}
                </Text>
                <Text style={styles.friendElo}>ELO: {friend.elo}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveFriend(friend.id)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderRequests = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      );
    }

    const hasRequests = pendingRequests.length > 0 || sentRequests.length > 0;

    if (!hasRequests) {
      return (
        <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
      );
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {pendingRequests.length > 0 && (
          <>
            <Text style={styles.subHeader}>Solicitudes recibidas</Text>
            {pendingRequests.map((request: any) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.friendInfo}>
                  <Text style={styles.avatar}>{request.avatar}</Text>
                  <View>
                    <Text style={styles.friendName}>
                      {request.displayName || request.username}
                    </Text>
                    <Text style={styles.friendElo}>ELO: {request.elo}</Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptRequest(request.id)}
                  >
                    <Text style={styles.actionButtonText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => handleDeclineRequest(request.id)}
                  >
                    <Text style={styles.actionButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {sentRequests.length > 0 && (
          <>
            <Text style={[styles.subHeader, { marginTop: 20 }]}>
              Solicitudes enviadas
            </Text>
            {sentRequests.map((request: any) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.friendInfo}>
                  <Text style={styles.avatar}>{request.avatar}</Text>
                  <View>
                    <Text style={styles.friendName}>
                      {request.displayName || request.username}
                    </Text>
                    <Text style={styles.friendElo}>ELO: {request.elo}</Text>
                  </View>
                </View>
                <Text style={styles.pendingText}>Pendiente</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  const renderSearch = () => {
    return (
      <View>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar usuarios..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {isSearching && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        )}

        {searchResults.length > 0 && (
          <ScrollView style={styles.searchResults}>
            {searchResults.map((user: any) => (
              <View key={user.id} style={styles.searchItem}>
                <View style={styles.friendInfo}>
                  <Text style={styles.avatar}>{user.avatar}</Text>
                  <View>
                    <Text style={styles.friendName}>
                      {user.displayName || user.username}
                    </Text>
                    <Text style={styles.friendElo}>ELO: {user.elo}</Text>
                  </View>
                </View>
                {user.friendshipStatus === 'none' && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleSendRequest(user.id)}
                  >
                    <Text style={styles.addButtonText}>Agregar</Text>
                  </TouchableOpacity>
                )}
                {user.friendshipStatus === 'pending' && (
                  <Text style={styles.pendingText}>Pendiente</Text>
                )}
                {user.friendshipStatus === 'accepted' && (
                  <Text style={styles.friendText}>Amigo</Text>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authMessage}>
          <Text style={styles.authText}>
            Inicia sesión para gestionar tus amigos
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Amigos</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'friends' && styles.activeTabText,
            ]}
          >
            Amigos ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'requests' && styles.activeTabText,
            ]}
          >
            Solicitudes ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'search' && styles.activeTabText,
            ]}
          >
            Buscar
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'search' && renderSearch()}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 32,
    fontSize: typography.fontSize.base,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    fontSize: 32,
  },
  friendName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  friendStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  friendElo: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  removeButton: {
    width: 32,
    height: 32,
    backgroundColor: colors.error,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
  },
  subHeader: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: 12,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
  },
  pendingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  friendText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginBottom: 16,
  },
  searchResults: {
    maxHeight: 400,
  },
  searchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  authMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
