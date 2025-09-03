import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { JugarStackNavigationProp } from '../types/navigation';
import { colors } from '../constants/colors';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useUnifiedRooms } from '../hooks/useUnifiedRooms';
import { useFeatureFlag } from '../config/featureFlags';
// Temporarily disabled - causes prototype error
// import { useSupabaseMatchmaking as useSupabaseMatchmakingHook } from '../hooks/useSupabaseMatchmaking';

export function OnlineLobbyScreen() {
  const navigation = useNavigation<JugarStackNavigationProp>();

  const { user, isAuthenticated } = useUnifiedAuth();
  const useSupabaseMatchmakingFlag = useFeatureFlag('useSupabaseMatchmaking');

  // Matchmaking disabled
  const supabaseMatchmaking = null;

  // Room management
  const rooms = useUnifiedRooms();

  const [isLoading, setIsLoading] = useState(false);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'quick' | 'rooms' | 'friends'>('quick');

  // Get auth values
  const userId = user?.id || user?._id;
  const profile = user;

  useEffect(() => {
    if (activeTab === 'rooms') {
      loadPublicRooms();
    } else if (activeTab === 'friends' && userId) {
      loadOnlineFriends();
    }
  }, [activeTab, userId]);

  // Cancel matchmaking when leaving screen or switching tabs
  useEffect(() => {
    return () => {};
  }, [useSupabaseMatchmakingFlag]);

  const loadPublicRooms = async () => {
    setPublicRooms([]);
  };

  const loadOnlineFriends = async () => {
    setOnlineFriends([]);
  };

  const handleQuickMatch = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please sign in to play online');
      return;
    }

    Alert.alert('No disponible', 'Matchmaking en línea deshabilitado.');
  };

  const handleCreateRoom = async () => {
    if (!isAuthenticated || !userId) {
      Alert.alert('Error', 'Por favor inicia sesión para crear una sala');
      return;
    }

    setIsLoading(true);
    try {
      const room = await rooms.createFriendsRoom(userId);
      console.log('Room created:', room);

      // Navigate to the room lobby
      navigation.navigate('FriendsLobby', {
        roomCode: room.code,
        isHost: true,
      });
    } catch (error) {
      console.error('Failed to create room:', error);
      Alert.alert('Error', 'No se pudo crear la sala. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    if (!isAuthenticated || !userId) {
      Alert.alert('Error', 'Por favor inicia sesión para unirte a una sala');
      return;
    }

    setIsLoading(true);
    try {
      const room = await rooms.joinRoomByCode(roomCode, userId);
      console.log('Joined room:', room);

      // Navigate to the room lobby
      navigation.navigate('FriendsLobby', {
        roomCode: room.code,
        isHost: false,
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      Alert.alert('Error', 'No se pudo unir a la sala. Por favor verifica el código.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuickMatch = () => {
    const isSearching = false;

    const matchmakingStatus = { playersInQueue: 0, waitTime: 0 };

    const handleCancel = async () => {};

    return (
      <View style={styles.quickMatchContainer}>
        <Text style={styles.quickMatchTitle}>Quick Match</Text>
        <Text style={styles.quickMatchDescription}>
          Find opponents automatically based on your skill level
        </Text>

        {isSearching && (
          <View style={styles.searchingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.searchingText}>Searching for opponents...</Text>
            <Text style={styles.searchingStats}>
              Players in queue: {matchmakingStatus.playersInQueue}
            </Text>
            <Text style={styles.searchingStats}>Wait time: {matchmakingStatus.waitTime}s</Text>
            <TouchableOpacity
              style={[styles.quickMatchButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.quickMatchButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isSearching && (
          <TouchableOpacity
            style={styles.quickMatchButton}
            onPress={handleQuickMatch}
            disabled={isLoading || isSearching}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.quickMatchButtonText}>Find Match</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRoomsList = () => {
    const roomsToDisplay = rooms.publicRooms || [];

    return (
      <ScrollView style={styles.roomsList}>
        <TouchableOpacity
          style={styles.createRoomButton}
          onPress={handleCreateRoom}
          disabled={isLoading}
        >
          <Text style={styles.createRoomButtonText}>Crear Nueva Sala</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : roomsToDisplay.length === 0 ? (
          <Text style={styles.emptyText}>No public rooms available</Text>
        ) : (
          roomsToDisplay.map((room: any) => (
            <TouchableOpacity
              key={room._id || room.id}
              style={styles.roomItem}
              onPress={() => handleJoinRoom(room.code)}
            >
              <View>
                <Text style={styles.roomCode}>Room: {room.code}</Text>
                <Text style={styles.roomPlayers}>
                  Players:{' '}
                  {room.playerCount ||
                    room.current_players ||
                    room.currentPlayers ||
                    room.players?.length ||
                    0}
                  /4
                </Text>
                {(room.hostUsername || room.host?.username) && (
                  <Text style={styles.roomHost}>
                    Host: {room.hostUsername || room.host?.username}
                  </Text>
                )}
              </View>
              <Text style={styles.joinButton}>Join</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  const renderFriendsList = () => (
    <ScrollView style={styles.roomsList}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : onlineFriends.length === 0 ? (
        <Text style={styles.emptyText}>No friends online</Text>
      ) : (
        onlineFriends.map(friend => (
          <View key={friend.id} style={styles.friendItem}>
            <Text style={styles.friendName}>{friend.display_name}</Text>
            <TouchableOpacity style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Online Lobby</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quick' && styles.activeTab]}
          onPress={() => setActiveTab('quick')}
        >
          <Text style={[styles.tabText, activeTab === 'quick' && styles.activeTabText]}>
            Quick Match
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rooms' && styles.activeTab]}
          onPress={() => setActiveTab('rooms')}
        >
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.activeTabText]}>Rooms</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'quick' && renderQuickMatch()}
        {activeTab === 'rooms' && renderRoomsList()}
        {activeTab === 'friends' && renderFriendsList()}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
    fontSize: 16,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  quickMatchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  quickMatchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  quickMatchDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  quickMatchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
  },
  quickMatchButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  searchingContainer: {
    alignItems: 'center',
  },
  searchingText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  searchingStats: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cancelButton: {
    backgroundColor: colors.error,
    marginTop: 16,
  },
  roomsList: {
    flex: 1,
    padding: 16,
  },
  createRoomButton: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  createRoomButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  roomCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  roomPlayers: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  roomHost: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  joinButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
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
  friendName: {
    fontSize: 16,
    color: colors.text,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  inviteButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 32,
    fontSize: 16,
  },
});
