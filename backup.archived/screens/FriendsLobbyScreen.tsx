import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { JugarStackNavigationProp } from '../types/navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { Button } from '../components/Button';
import { Card } from '../components/ui/Card';
import { InputField } from '../components/ui/InputField';
import { EmptyState } from '../components/ui/EmptyState';
import { Divider } from '../components/ui/Divider';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
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

  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copiado', 'Código copiado al portapapeles');
  };

  const renderOnlineFriends = () => {
    if (!convexUser) {
      return (
        <EmptyState
          icon="🔒"
          title="Inicia sesión"
          message="Necesitas iniciar sesión para ver tus amigos"
        />
      );
    }

    if (onlineFriends.length === 0) {
      return (
        <EmptyState
          icon="👥"
          title="Sin amigos en línea"
          message="Invita a tus amigos a jugar Guiñote"
          actionLabel="Invitar Amigos"
          onAction={() => {
            // TODO: Implement share functionality
            Alert.alert('Próximamente', 'Función de compartir en desarrollo');
          }}
        />
      );
    }

    return (
      <View style={styles.friendsList}>
        {onlineFriends.map((friend: any) => (
          <Card key={friend.id} style={styles.friendCard}>
            <View style={styles.friendInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.friendAvatar}>{friend.avatar || '👤'}</Text>
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.friendDetails}>
                <Text style={styles.friendName}>
                  {friend.displayName || friend.username}
                </Text>
                <View style={styles.friendStats}>
                  <Text style={styles.friendElo}>⭐ {friend.elo}</Text>
                  <Text style={styles.friendStatus}>En línea</Text>
                </View>
              </View>
            </View>
            <Button
              variant="primary"
              size="small"
              onPress={() => {
                Alert.alert(
                  'Próximamente',
                  'Función de invitación en desarrollo',
                );
              }}
              icon="📨"
            >
              Invitar
            </Button>
          </Card>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Jugar con Amigos</Text>
          <Text style={styles.headerSubtitle}>
            Crea o únete a una sala privada
          </Text>
          {convexUser && (
            <View style={styles.userBadge}>
              <Text style={styles.userIcon}>👤</Text>
              <Text style={styles.userName}>
                {convexUser.username || 'Jugador'}
              </Text>
            </View>
          )}
        </View>

        {/* Create Room Section */}
        <Card elevated style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🎮</Text>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Crear Nueva Sala</Text>
              <Text style={styles.cardDescription}>
                Invita hasta 3 amigos a jugar
              </Text>
            </View>
          </View>
          <Button
            variant="primary"
            size="large"
            onPress={handleCreateRoom}
            loading={isCreating}
            disabled={isCreating}
            icon="➕"
            style={styles.mainButton}
          >
            Crear Sala
          </Button>
          <Text style={styles.hint}>
            📍 Se generará un código único para compartir
          </Text>
        </Card>

        <Divider text="o" spacing="medium" />

        {/* Join Room Section */}
        <Card elevated style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🔑</Text>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Unirse a Sala</Text>
              <Text style={styles.cardDescription}>
                Ingresa el código de invitación
              </Text>
            </View>
          </View>

          <InputField
            icon="🎯"
            value={roomCode}
            onChangeText={text => setRoomCode(text.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.codeInput}
            validation={{
              isValid: roomCode.length === 6,
              message:
                roomCode.length > 0
                  ? `${roomCode.length}/6 caracteres`
                  : undefined,
            }}
          />

          <View style={styles.buttonRow}>
            <Button
              variant={roomCode.length === 6 ? 'primary' : 'secondary'}
              onPress={handleJoinRoom}
              loading={isJoining}
              disabled={isJoining || roomCode.length !== 6}
              icon="🚪"
              style={styles.joinButton}
            >
              Unirse
            </Button>
            {roomCode.length === 6 && (
              <Button
                variant="secondary"
                size="small"
                onPress={() => handleCopyCode(roomCode)}
                icon="📋"
              >
                Copiar
              </Button>
            )}
          </View>
        </Card>

        {/* Friends List Section */}
        <Card style={styles.friendsSection}>
          <View style={styles.friendsHeader}>
            <Text style={styles.friendsTitle}>👥 Amigos en Línea</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                // TODO: Refresh friends list
              }}
            >
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
          {renderOnlineFriends()}
        </Card>
      </ScrollView>

      <LoadingOverlay
        visible={isCreating || isJoining}
        message={isCreating ? 'Creando sala...' : 'Uniéndose a sala...'}
      />
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
    paddingHorizontal: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.md,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.lg,
    marginTop: dimensions.spacing.sm,
  },
  userIcon: {
    fontSize: 20,
    marginRight: dimensions.spacing.sm,
  },
  userName: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  card: {
    marginVertical: dimensions.spacing.md,
    padding: dimensions.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: dimensions.spacing.lg,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: dimensions.spacing.md,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  cardDescription: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  mainButton: {
    marginBottom: dimensions.spacing.md,
  },
  hint: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  codeInput: {
    marginBottom: dimensions.spacing.md,
    fontSize: typography.fontSize.xxl,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: typography.fontWeight.bold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  joinButton: {
    flex: 1,
  },
  friendsSection: {
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xl,
    minHeight: 200,
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  friendsTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  refreshButton: {
    padding: dimensions.spacing.sm,
  },
  refreshIcon: {
    fontSize: 24,
  },
  friendsList: {
    gap: dimensions.spacing.sm,
  },
  friendCard: {
    marginBottom: dimensions.spacing.sm,
    padding: dimensions.spacing.md,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: dimensions.spacing.md,
  },
  friendAvatar: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cantarGreen,
    borderWidth: 2,
    borderColor: colors.background,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  friendStats: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  friendElo: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  friendStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.cantarGreen,
    fontWeight: typography.fontWeight.medium,
  },
});
