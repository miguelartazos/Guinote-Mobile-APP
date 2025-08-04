import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { JugarStackNavigationProp } from '../types/navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
// Using Convex for backend
import { useConvexAuth } from '../hooks/useConvexAuth';
import { useConvexRooms } from '../hooks/useConvexRooms';
import { useConvexFriends } from '../hooks/useConvexFriends';

export function FriendsLobbyScreen() {
  const navigation = useNavigation<JugarStackNavigationProp>();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Auth hooks
  const { user: convexUser } = useConvexAuth();
  const profile = convexUser;

  // Convex hooks
  const convexRooms = useConvexRooms();
  const { onlineFriends } = useConvexFriends(convexUser?._id);

  const handleCreateRoom = async () => {
    if (!profile) {
      Alert.alert('Error', 'Debes iniciar sesión para crear una sala');
      return;
    }

    setIsCreating(true);
    try {
      if (!convexUser) {
        throw new Error('User not authenticated');
      }

      const room = await convexRooms.createFriendsRoom(convexUser._id);

      navigation.navigate('GameRoom', {
        roomId: room.roomId,
        roomCode: room.code,
      });
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo crear la sala',
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!profile) {
      Alert.alert('Error', 'Debes iniciar sesión para unirte a una sala');
      return;
    }

    if (roomCode.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 caracteres');
      return;
    }

    setIsJoining(true);
    try {
      if (!convexUser) {
        throw new Error('User not authenticated');
      }

      const result = await convexRooms.joinRoomByCode(
        roomCode.toUpperCase(),
        convexUser._id,
      );

      navigation.navigate('GameRoom', {
        roomId: result.roomId,
        roomCode: roomCode.toUpperCase(),
      });
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo unir a la sala',
      );
    } finally {
      setIsJoining(false);
    }
  };

  const renderOnlineFriends = () => {
    if (!convexUser) {
      return <Text style={styles.comingSoon}>Próximamente...</Text>;
    }

    if (onlineFriends.length === 0) {
      return (
        <Text style={styles.noFriendsText}>
          No hay amigos en línea en este momento
        </Text>
      );
    }

    return (
      <ScrollView style={styles.friendsList}>
        {onlineFriends.map((friend: any) => (
          <View key={friend.id} style={styles.friendItem}>
            <View style={styles.friendInfo}>
              <Text style={styles.friendAvatar}>{friend.avatar}</Text>
              <View>
                <Text style={styles.friendName}>
                  {friend.displayName || friend.username}
                </Text>
                <Text style={styles.friendElo}>ELO: {friend.elo}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => {
                // TODO: Implement invite functionality
                Alert.alert(
                  'Próximamente',
                  'Función de invitación en desarrollo',
                );
              }}
            >
              <Text style={styles.inviteButtonText}>Invitar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Create Room Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crear Nueva Sala</Text>
          <Text style={styles.sectionDescription}>
            Crea una sala privada y comparte el código con tus amigos
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleCreateRoom}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🏠</Text>
                <Text style={styles.buttonText}>Crear Sala</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>O</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Join Room Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unirse a Sala</Text>
          <Text style={styles.sectionDescription}>
            Introduce el código de 6 caracteres
          </Text>
          <TextInput
            style={styles.input}
            value={roomCode}
            onChangeText={setRoomCode}
            placeholder="ABC123"
            placeholderTextColor={colors.textSecondary}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.button,
              styles.joinButton,
              roomCode.length !== 6 && styles.buttonDisabled,
            ]}
            onPress={handleJoinRoom}
            disabled={isJoining || roomCode.length !== 6}
          >
            {isJoining ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🚪</Text>
                <Text style={[styles.buttonText, styles.joinButtonText]}>
                  Unirse
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Friends List Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amigos en Línea</Text>
          {renderOnlineFriends()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  createButton: {
    backgroundColor: colors.accent,
  },
  joinButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  joinButtonText: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  comingSoon: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  noFriendsText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  friendsList: {
    maxHeight: 200,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendAvatar: {
    fontSize: 24,
  },
  friendName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  friendElo: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  inviteButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
