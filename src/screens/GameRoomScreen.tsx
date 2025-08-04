import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  JugarStackNavigationProp,
  JugarStackScreenProps,
} from '../types/navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
// Using Convex for backend
import { shareRoomViaWhatsApp } from '../services/sharing/whatsappShare';
import { useConvexAuth } from '../hooks/useConvexAuth';
import { useConvexGame } from '../hooks/useConvexGame';
import { useConvexRooms } from '../hooks/useConvexRooms';
import type { Id } from '../../convex/_generated/dataModel';

type Props = JugarStackScreenProps<'GameRoom'>;

interface PlayerSlot {
  position: number;
  teamIndex: 0 | 1;
  isOccupied: boolean;
  isAI: boolean;
  name: string;
  isHost: boolean;
  userId?: string;
}

export function GameRoomScreen() {
  const navigation = useNavigation<JugarStackNavigationProp>();
  const route = useRoute<Props['route']>();
  const { roomId, roomCode } = route.params;

  const [playerSlots, setPlayerSlots] = useState<PlayerSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  // Auth hooks
  const { user: convexUser } = useConvexAuth();
  const profile = convexUser;

  // Convex hooks
  const { room: convexRoom, actions: convexActions } = useConvexGame(
    roomId ? (roomId as Id<'rooms'>) : undefined,
  );
  const convexRooms = useConvexRooms();

  // Data from Convex
  const players = convexRoom ? convexRoom.players : [];
  const isConnected = !!convexRoom;

  useEffect(() => {
    if (players && players.length > 0) {
      // Update player slots based on real-time data
      const slots: PlayerSlot[] = [0, 1, 2, 3].map(position => {
        const player = players.find((p: any) => p.position === position);
        const teamIndex = (position % 2) as 0 | 1;

        if (player) {
          let isCurrentUserHost = false;
          let playerName = 'Jugador';
          let isAI = false;
          let userId: string | undefined;

          // Convex data structure
          isCurrentUserHost =
            convexRoom?.hostId === convexUser?._id && position === 0;
          isAI = player.isAI || false;
          playerName = isAI
            ? `IA ${player.aiDifficulty || 'medium'}`
            : player.user?.username || 'Jugador';
          userId = player.userId;

          return {
            position,
            teamIndex,
            isOccupied: true,
            isAI,
            name: playerName,
            isHost: isCurrentUserHost,
            userId,
          };
        }

        return {
          position,
          teamIndex,
          isOccupied: false,
          isAI: false,
          name: '',
          isHost: false,
        };
      });

      setPlayerSlots(slots);
      setIsLoading(false);
    } else if (players && players.length === 0) {
      // Initialize empty slots
      const emptySlots: PlayerSlot[] = [0, 1, 2, 3].map(position => ({
        position,
        teamIndex: (position % 2) as 0 | 1,
        isOccupied: false,
        isAI: false,
        name: '',
        isHost: false,
      }));
      setPlayerSlots(emptySlots);
      setIsLoading(false);
    }
  }, [players, profile, convexRoom, convexUser]);

  const handleAddAI = async () => {
    const emptySlots = playerSlots.filter(slot => !slot.isOccupied).length;
    if (emptySlots === 0) {
      Alert.alert('Sala llena', 'No hay espacios disponibles');
      return;
    }

    try {
      if (convexRoom) {
        await convexActions.addAIPlayer('medium');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo añadir jugador IA');
    }
  };

  const handleRemoveAI = async () => {
    try {
      if (convexRoom) {
        // Find first AI player to remove
        const aiPlayer = playerSlots.find(slot => slot.isAI);
        if (aiPlayer) {
          await convexRooms.removeAIPlayer(
            roomId as Id<'rooms'>,
            aiPlayer.position,
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron eliminar jugadores IA');
    }
  };

  const handleShareRoom = () => {
    if (roomCode) {
      shareRoomViaWhatsApp(roomCode);
    }
  };

  const handleStartGame = async () => {
    const occupiedSlots = playerSlots.filter(slot => slot.isOccupied).length;

    if (occupiedSlots < 4) {
      Alert.alert('Sala incompleta', '¿Quieres completar con jugadores IA?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar con IA',
          onPress: async () => {
            if (convexRoom) {
              // Add AI players one by one
              for (let i = 0; i < 4 - occupiedSlots; i++) {
                await convexActions.addAIPlayer('medium');
              }
            }
            setTimeout(() => startGame(), 1000);
          },
        },
      ]);
    } else {
      startGame();
    }
  };

  const startGame = () => {
    setIsStarting(true);
    navigation.navigate('Game', {
      gameMode: 'friends',
      roomId,
      roomCode,
    });
  };

  const handleLeaveRoom = async () => {
    Alert.alert('Abandonar sala', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          if (convexUser) {
            await convexActions.leaveRoom(convexUser._id);
          }
          navigation.goBack();
        },
      },
    ]);
  };

  const isHost = convexRoom?.hostId === convexUser?._id;
  const hasAI = playerSlots.some(slot => slot.isAI);
  const canStart = playerSlots.filter(slot => slot.isOccupied).length >= 2;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Cargando sala...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Room Code */}
        <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCodeLabel}>Código de Sala</Text>
          <Text style={styles.roomCode}>
            {roomCode || convexRoom?.code || 'LOADING'}
          </Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareRoom}
          >
            <Text style={styles.shareButtonText}>
              📱 Compartir por WhatsApp
            </Text>
          </TouchableOpacity>
        </View>

        {/* Teams */}
        <View style={styles.teamsContainer}>
          {/* Team 1 */}
          <View style={styles.team}>
            <Text style={styles.teamTitle}>Equipo 1</Text>
            {playerSlots
              .filter(slot => slot.teamIndex === 0)
              .map(slot => (
                <View key={slot.position} style={styles.playerSlot}>
                  {slot.isOccupied ? (
                    <>
                      <Text style={styles.playerName}>
                        {slot.isAI ? '🤖 ' : '👤 '}
                        {slot.name}
                      </Text>
                      {slot.isHost && (
                        <Text style={styles.hostBadge}>Anfitrión</Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.emptySlot}>Esperando jugador...</Text>
                  )}
                </View>
              ))}
          </View>

          {/* Team 2 */}
          <View style={styles.team}>
            <Text style={styles.teamTitle}>Equipo 2</Text>
            {playerSlots
              .filter(slot => slot.teamIndex === 1)
              .map(slot => (
                <View key={slot.position} style={styles.playerSlot}>
                  {slot.isOccupied ? (
                    <>
                      <Text style={styles.playerName}>
                        {slot.isAI ? '🤖 ' : '👤 '}
                        {slot.name}
                      </Text>
                      {slot.isHost && (
                        <Text style={styles.hostBadge}>Anfitrión</Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.emptySlot}>Esperando jugador...</Text>
                  )}
                </View>
              ))}
          </View>
        </View>

        {/* Connection Status */}
        {!isConnected && (
          <View style={styles.connectionWarning}>
            <Text style={styles.connectionWarningText}>
              ⚠️ Conexión perdida. Intentando reconectar...
            </Text>
          </View>
        )}

        {/* Room Status */}
        {convexRoom && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Estado:{' '}
              {convexRoom.status === 'waiting'
                ? 'Esperando jugadores'
                : convexRoom.status === 'playing'
                ? 'En juego'
                : convexRoom.status}
            </Text>
            <Text style={styles.statusText}>
              Modo:{' '}
              {convexRoom.gameMode === 'friends'
                ? 'Amigos'
                : convexRoom.gameMode === 'ranked'
                ? 'Clasificatoria'
                : convexRoom.gameMode}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        {isHost && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={hasAI ? handleRemoveAI : handleAddAI}
            >
              <Text style={styles.secondaryButtonText}>
                {hasAI ? '➖ Quitar IA' : '➕ Añadir IA'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.primaryButton,
                !canStart && styles.buttonDisabled,
              ]}
              onPress={handleStartGame}
              disabled={!canStart || isStarting}
            >
              {isStarting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.primaryButtonText}>🎯 Empezar Partida</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleLeaveRoom}
        >
          <Text style={styles.dangerButtonText}>🚪 Salir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  roomCodeContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  roomCodeLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  roomCode: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    letterSpacing: 4,
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  teamsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  team: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  teamTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  playerSlot: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  playerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  emptySlot: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  hostBadge: {
    fontSize: typography.fontSize.xs,
    color: colors.accent,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 4,
  },
  connectionWarning: {
    backgroundColor: colors.warning,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  connectionWarningText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  actions: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dangerButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent,
  },
  dangerButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
});
