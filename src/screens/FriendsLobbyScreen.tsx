import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { JugarStackNavigationProp } from '../types/navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { Card } from '../components/ui/Card';
import { InputField } from '../components/ui/InputField';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { AuthModal } from '../components/ui/AuthModal';
// Using unified hooks
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useUnifiedRooms } from '../hooks/useUnifiedRooms';
import { useUnifiedFriends } from '../hooks/useUnifiedFriends';
import { shareRoomViaWhatsApp } from '../services/sharing/whatsappShare';
import { featureFlags } from '../config/featureFlags';

export function FriendsLobbyScreen() {
  const navigation = useNavigation<JugarStackNavigationProp>();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<'create' | 'join' | 'friends' | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'join' | 'invite' | null>(null);
  const [pendingFriendId, setPendingFriendId] = useState<string | null>(null);
  const [showFriends, setShowFriends] = useState(false);
  const friendsHeight = React.useRef(new Animated.Value(0)).current;

  // Auth hooks
  const { user, isAuthenticated, signIn, signUp } = useUnifiedAuth();
  const profile = user;
  const userId = user?.id || user?._id;

  // Unified hooks
  const rooms = useUnifiedRooms();
  const { onlineFriends } = useUnifiedFriends();

  // Clear stored flags in development to ensure proper dev settings
  React.useEffect(() => {
    if (__DEV__) {
      featureFlags.clearStoredFlags().catch(() => {
        // Silently handle any errors
      });
    }
  }, []);

  const handleCreateRoom = async () => {
    if (!profile || !userId) {
      setPendingAction('create');
      setShowAuthModal(true);
      return;
    }

    setIsCreating(true);
    try {
      const room = await rooms.createFriendsRoom(userId);

      navigation.navigate('GameRoom', {
        roomId: (room as any).id || (room as any).roomId,
        roomCode: room.code,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo crear la sala';
      console.error('[FriendsLobby] Create room error:', error);

      // Provide more specific error messages
      if (errorMessage.includes('Not authenticated')) {
        Alert.alert('Error de Autenticación', 'Por favor inicia sesión primero');
        setShowAuthModal(true);
      } else if (errorMessage.includes('Multiplayer is disabled')) {
        Alert.alert('Función No Disponible', 'El modo multijugador está deshabilitado');
      } else if (errorMessage.includes('Failed to create room on server')) {
        Alert.alert(
          'Error de Conexión',
          'No se pudo conectar con el servidor. Verifica tu conexión.',
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (roomCode.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 caracteres');
      return;
    }

    if (!profile || !userId) {
      setPendingAction('join');
      setShowAuthModal(true);
      return;
    }

    setIsJoining(true);
    try {
      const result = await rooms.joinRoomByCode(roomCode.toUpperCase(), userId);

      const joinedRoomId = (result as any).id || (result as any).roomId;
      if (!joinedRoomId) {
        throw new Error('No se pudo obtener el ID de la sala');
      }

      // Verify we can see at least ourselves in room_players before navigating
      let attempts = 0;
      let playersCount = 0;
      while (attempts < 3 && playersCount === 0) {
        const players = await rooms.getRoomPlayers(joinedRoomId);
        playersCount = players.length;
        if (playersCount === 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        attempts++;
      }

      if (playersCount === 0) {
        throw new Error('No se pudo entrar en la sala (jugadores no visibles)');
      }

      navigation.navigate('GameRoom', {
        roomId: joinedRoomId,
        roomCode: (result as any).code || roomCode.toUpperCase(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo unir a la sala';
      console.error('[FriendsLobby] Join room error:', error);

      // Provide more specific error messages
      if (errorMessage.includes('Not authenticated')) {
        Alert.alert('Error de Autenticación', 'Por favor inicia sesión primero');
        setShowAuthModal(true);
      } else if (errorMessage.includes('Room not found')) {
        Alert.alert('Código Inválido', 'No existe una sala con ese código');
      } else if (errorMessage.includes('Room is full')) {
        Alert.alert('Sala Llena', 'Esta sala ya tiene 4 jugadores');
      } else if (errorMessage.includes('Game already started')) {
        Alert.alert('Partida en Curso', 'Esta partida ya comenzó');
      } else if (errorMessage.includes('Multiplayer is disabled')) {
        Alert.alert('Función No Disponible', 'El modo multijugador está deshabilitado');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleInviteFriend = async (friendId: string) => {
    if (!profile || !userId) {
      setPendingAction('invite');
      setPendingFriendId(friendId);
      setShowAuthModal(true);
      return;
    }

    setIsCreating(true);
    try {
      const room = await rooms.createFriendsRoom(userId);
      await shareRoomViaWhatsApp(room.code);

      navigation.navigate('GameRoom', {
        roomId: (room as any).id || (room as any).roomId,
        roomCode: room.code,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear/invitar a la sala');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      throw new Error('Missing fields');
    }

    try {
      await signIn(email, password);
      // After successful sign in, execute pending action
      if (pendingAction === 'create') {
        handleCreateRoom();
      } else if (pendingAction === 'join') {
        handleJoinRoom();
      } else if (pendingAction === 'invite' && pendingFriendId) {
        handleInviteFriend(pendingFriendId);
      }
      setPendingAction(null);
      setPendingFriendId(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión');
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, username: string) => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      throw new Error('Missing fields');
    }

    try {
      await signUp(email, password, username);
      Alert.alert('Éxito', 'Cuenta creada exitosamente');
      // After successful sign up, execute pending action
      if (pendingAction === 'create') {
        handleCreateRoom();
      } else if (pendingAction === 'join') {
        handleJoinRoom();
      } else if (pendingAction === 'invite' && pendingFriendId) {
        handleInviteFriend(pendingFriendId);
      }
      setPendingAction(null);
      setPendingFriendId(null);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo crear la cuenta');
      throw error;
    }
  };

  const handleQuickSignIn = async () => {
    try {
      const knownTestAccounts = [
        { email: 'test@guinote.app', password: 'TestGuinote123!' },
        { email: 'demo@guinote.app', password: 'DemoGuinote123!' },
      ];

      let signedIn = false;

      for (const account of knownTestAccounts) {
        try {
          await signIn(account.email, account.password);
          signedIn = true;
          break;
        } catch (e) {
          // Try next account
        }
      }

      if (!signedIn) {
        Alert.alert(
          'Modo de Prueba',
          'No se pudo conectar con el servidor. Usando modo offline temporal.',
          [{ text: 'OK' }],
        );
      } else {
        // Execute pending action after successful sign in
        if (pendingAction === 'create') {
          handleCreateRoom();
        } else if (pendingAction === 'join') {
          handleJoinRoom();
        } else if (pendingAction === 'invite' && pendingFriendId) {
          handleInviteFriend(pendingFriendId);
        }
        setPendingAction(null);
        setPendingFriendId(null);
      }
    } catch (error: any) {
      Alert.alert(
        'Modo Offline',
        'Usando modo offline para pruebas. Las salas multijugador no estarán disponibles.',
        [{ text: 'OK' }],
      );
      throw error;
    }
  };

  const toggleFriends = () => {
    const newValue = !showFriends;
    setShowFriends(newValue);
    setSelectedColumn(newValue ? 'friends' : null);

    Animated.timing(friendsHeight, {
      toValue: newValue ? 300 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const renderOnlineFriends = () => {
    if (!showFriends) return null;

    if (!isAuthenticated || !user) {
      return (
        <Animated.View style={[styles.friendsExpandedContent, { height: friendsHeight }]}>
          <EmptyState
            icon="🔒"
            title="Inicia sesión"
            message="Necesitas iniciar sesión para ver tus amigos"
            actionLabel="Iniciar Sesión"
            onAction={() => setShowAuthModal(true)}
          />
        </Animated.View>
      );
    }

    if (onlineFriends.length === 0) {
      return (
        <Animated.View style={[styles.friendsExpandedContent, { height: friendsHeight }]}>
          <EmptyState
            icon="👥"
            title="Sin amigos en línea"
            message="Invita a tus amigos a jugar Guiñote"
            actionLabel="Invitar Amigos"
            onAction={() => {
              Alert.alert('Próximamente', 'Función de compartir en desarrollo');
            }}
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View style={[styles.friendsExpandedContent, { height: friendsHeight }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.friendsList}>
            {onlineFriends.map((friend: any) => (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendCard}
                onPress={() => handleInviteFriend(friend.id)}
                activeOpacity={0.7}
              >
                <View style={styles.friendInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.friendAvatar}>{friend.avatarUrl || '👤'}</Text>
                    <View style={styles.onlineIndicator} />
                  </View>
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{friend.displayName || friend.username}</Text>
                    <Text style={styles.friendStatus}>⭐ {friend.ranking} • En línea</Text>
                  </View>
                </View>
                <Text style={styles.inviteIcon}>📨</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jugar con Amigos</Text>
        {user && (
          <View style={styles.userBadge}>
            <Text style={styles.userIcon}>👤</Text>
            <Text style={styles.userName}>{user.username || 'Jugador'}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Three Column Layout */}
        <View style={styles.columnsContainer}>
          {/* Create Room Column */}
          <TouchableOpacity
            style={[styles.columnCard, selectedColumn === 'create' && styles.columnCardActive]}
            onPress={() => {
              setSelectedColumn('create');
              handleCreateRoom();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.columnIcon}>🎮</Text>
            <Text style={styles.columnTitle}>Crear</Text>
            <Text style={styles.columnSubtitle}>Sala</Text>
          </TouchableOpacity>

          {/* Join Room Column */}
          <TouchableOpacity
            style={[styles.columnCard, selectedColumn === 'join' && styles.columnCardActive]}
            onPress={() => setSelectedColumn('join')}
            activeOpacity={0.7}
          >
            <Text style={styles.columnIcon}>🔑</Text>
            <Text style={styles.columnTitle}>Unirse</Text>
            <Text style={styles.columnSubtitle}>a Sala</Text>
          </TouchableOpacity>

          {/* Friends Column */}
          <TouchableOpacity
            style={[styles.columnCard, selectedColumn === 'friends' && styles.columnCardActive]}
            onPress={toggleFriends}
            activeOpacity={0.7}
          >
            <Text style={styles.columnIcon}>👥</Text>
            <Text style={styles.columnTitle}>Amigos</Text>
            <View style={styles.friendsCount}>
              <Text style={styles.friendsCountText}>
                {isAuthenticated ? onlineFriends.length : 0}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Join Room Input Section */}
        {selectedColumn === 'join' && (
          <Card elevated style={styles.actionCard}>
            <Text style={styles.actionTitle}>Ingresa el código de invitación</Text>
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
                message: roomCode.length > 0 ? `${roomCode.length}/6 caracteres` : undefined,
              }}
            />
            <TouchableOpacity
              style={[styles.actionButton, roomCode.length !== 6 && styles.actionButtonDisabled]}
              onPress={handleJoinRoom}
              disabled={isJoining || roomCode.length !== 6}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>
                {isJoining ? 'Uniéndose...' : 'Unirse a Sala'}
              </Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Friends List Section */}
        {renderOnlineFriends()}

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <Card style={styles.infoCard}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              Crea una sala para jugar con hasta 3 amigos usando un código privado
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Authentication Modal */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
          setPendingFriendId(null);
        }}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onQuickSignIn={__DEV__ ? handleQuickSignIn : undefined}
        title={
          pendingAction === 'create'
            ? 'Iniciar sesión para crear sala'
            : pendingAction === 'join'
            ? 'Iniciar sesión para unirse'
            : 'Iniciar sesión para invitar'
        }
        message="Necesitas una cuenta para jugar con amigos"
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isCreating || isJoining}
        message={isCreating ? 'Creando sala...' : 'Uniéndose a sala...'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.lg,
    marginTop: dimensions.spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
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
  columnsContainer: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
  },
  columnCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 110,
  },
  columnCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.secondary,
  },
  columnIcon: {
    fontSize: 32,
    marginBottom: dimensions.spacing.xs,
  },
  columnTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  columnSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  friendsCount: {
    position: 'absolute',
    top: dimensions.spacing.sm,
    right: dimensions.spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendsCountText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  actionCard: {
    marginBottom: dimensions.spacing.lg,
    padding: dimensions.spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: colors.accent,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonDisabled: {
    backgroundColor: colors.disabled,
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: dimensions.spacing.lg,
  },
  cardIcon: {
    fontSize: 36,
    marginRight: dimensions.spacing.md,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  cardDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.lg,
    marginBottom: dimensions.spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: colors.disabled,
    opacity: 0.6,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: dimensions.spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  mainButton: {
    marginBottom: dimensions.spacing.md,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: dimensions.spacing.xs,
  },
  codeInput: {
    marginBottom: dimensions.spacing.md,
    fontSize: typography.fontSize.xl,
    letterSpacing: 3,
    textAlign: 'center',
    fontWeight: typography.fontWeight.bold,
  },
  friendsExpandedContent: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    marginBottom: dimensions.spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  joinButton: {
    flex: 1,
  },
  friendsList: {
    padding: dimensions.spacing.md,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: dimensions.spacing.md,
    backgroundColor: colors.secondary,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.sm,
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
    fontSize: 36,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.cantarGreen,
    borderWidth: 2,
    borderColor: colors.background,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  friendStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  inviteIcon: {
    fontSize: 20,
  },
  infoSection: {
    marginTop: dimensions.spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
