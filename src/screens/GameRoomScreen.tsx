import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { LandscapeContainer } from '../components/layout/LandscapeContainer';
import { useNavigation } from '@react-navigation/native';
import { createRealtimeClient } from '../services/realtimeClient.native';
import type { JugarStackNavigationProp, JugarStackScreenProps } from '../types/navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
// Room components
import { RoomHeader } from '../components/room/RoomHeader';
import { PlayerSlots } from '../components/room/PlayerSlots';
import { TeamIndicator } from '../components/room/TeamIndicator';
import { ReadyButton } from '../components/room/ReadyButton';
import { StartGameButton } from '../components/room/StartGameButton';
import { AIPlayerManager } from '../components/room/AIPlayerManager';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
// Using unified hooks for backend
import { shareRoomViaWhatsApp, copyRoomCode } from '../services/sharing/whatsappShare';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useUnifiedRooms } from '../hooks/useUnifiedRooms';

type GameRoomScreenProps = JugarStackScreenProps<'GameRoom'>;

export function GameRoomScreen({ route }: GameRoomScreenProps) {
  const { width, height } = useWindowDimensions();
  const isTabletLike = Math.min(width, height) >= 768;
  const navigation = useNavigation<JugarStackNavigationProp>();
  const { roomId, roomCode } = route.params;
  const { user } = useUnifiedAuth();
  const authUserId = user?.id;

  const {
    room,
    players,
    isLoading,
    error,
    getRoomPlayers,
    subscribeToRoom,
    updateReadyStatus,
    startGame,
    addAIPlayer,
    removeAIPlayer,
    leaveRoom,
    softLeaveRoom,
  } = useUnifiedRooms();

  const [localIsReady, setLocalIsReady] = useState(false);
  const aiManagerRef = React.useRef<any>(null);
  const hasNavigatedRef = React.useRef(false);

  // If the hook knows the real UUID for the room, prefer it over the
  // optimistic temp id passed via navigation.
  const isUuid = (value: string | null | undefined) =>
    !!value &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
  const [resolvedRoomId, setResolvedRoomId] = React.useState<string | null>(null);
  const effectiveRoomId =
    (isUuid(room?.id) ? (room!.id as string) : undefined) ||
    (isUuid(roomId) ? (roomId as string) : undefined) ||
    (resolvedRoomId as string);

  // Robust host detection: when offline auth is used (no authUserId),
  // if there is exactly one non-bot in the room, assume it's this device's user
  const nonBots = players.filter(p => !p.isBot);
  const currentUserPublicId =
    players.find(p => p.authUserId === authUserId)?.id ||
    (nonBots.length === 1 ? nonBots[0]?.id : undefined);
  const anyMemberCanManageBots = true; // temporary enable to unblock UI
  const isHost = room?.host_id === currentUserPublicId;
  const currentPlayer = players.find(p => p.authUserId === authUserId);
  const allPlayersReady = players.length === 4 && players.every(p => p.isReady);

  useEffect(() => {
    // Fallback: resolve room id by code when not available
    if (!effectiveRoomId && roomCode) {
      (async () => {
        try {
          const client = await import('../services/realtimeClient.native').then(m => m.createRealtimeClient());
          const supa = await client;
          if (supa) {
            const { data } = await (supa as any)
              .from('rooms')
              .select('id')
              .eq('code', roomCode)
              .single();
            if (data?.id && isUuid(data.id)) {
              setResolvedRoomId(data.id as string);
            }
          }
        } catch {}
      })();
    }

    const idToUse = effectiveRoomId;
    if (!idToUse) return;

    const unsubscribe = subscribeToRoom(idToUse);
    const t = setTimeout(() => {
      getRoomPlayers(idToUse);
    }, 50);

    return () => {
      clearTimeout(t);
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRoomId, roomCode]);

  useEffect(() => {
    if (currentPlayer && localIsReady !== currentPlayer.isReady) {
      setLocalIsReady(currentPlayer.isReady);
    }
  }, [currentPlayer]);

  // Auto-navigate when room status switches to 'playing' AND initial game_state exists
  useEffect(() => {
    if (!room) return;
    if (room.status === 'playing' && !hasNavigatedRef.current) {
      (async () => {
        try {
          // Check that a game_state row exists (ensures server init completed)
          const client = await createRealtimeClient();
          if (!client) return;
          const { data } = await client
            .from('game_states')
            .select('id')
            .eq('room_id', effectiveRoomId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (data?.id) {
            hasNavigatedRef.current = true;
            navigation.navigate('Game', {
              gameMode: 'friends',
              roomId: effectiveRoomId,
              roomCode,
              players,
              isHost,
            });
          } else {
            // Poll briefly for initial state (server may be creating it)
            setTimeout(async () => {
              try {
                const { data: again } = await client
                  .from('game_states')
                  .select('id')
                  .eq('room_id', effectiveRoomId)
                  .order('updated_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (again?.id && !hasNavigatedRef.current) {
                  hasNavigatedRef.current = true;
                  navigation.navigate('Game', {
                    gameMode: 'friends',
                    roomId: effectiveRoomId,
                    roomCode,
                    players,
                    isHost,
                  });
                }
              } catch {}
            }, 250);
          }
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status]);

  const handleToggleReady = async () => {
    if (!currentUserPublicId) return;

    try {
      const newReadyStatus = !localIsReady;
      setLocalIsReady(newReadyStatus);
      await updateReadyStatus(effectiveRoomId, currentUserPublicId, newReadyStatus);
    } catch (error) {
      setLocalIsReady(!localIsReady);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const handleShareRoom = () => {
    if (roomCode) {
      shareRoomViaWhatsApp(roomCode);
    }
  };

  const handleCopyCode = async () => {
    if (roomCode) {
      try {
        await copyRoomCode(roomCode);
        Alert.alert('Código copiado', 'El código de la sala se ha copiado al portapapeles');
      } catch (error) {
        Alert.alert('Error', 'No se pudo copiar el código');
      }
    }
  };

  const handleAddAIPlayer = async (config: import('../hooks/useUnifiedRooms').AIConfig) => {
    if (!isHost && !anyMemberCanManageBots) {
      Alert.alert('Solo el anfitrión', 'Solo el anfitrión puede añadir jugadores IA');
      return;
    }

    try {
      await addAIPlayer(effectiveRoomId, config);
    } catch (error) {
      Alert.alert('Error', 'No se pudo añadir jugador IA');
    }
  };

  const handleRemoveAI = async (playerId: string) => {
    if (!isHost && !anyMemberCanManageBots) return;
    try {
      await removeAIPlayer(effectiveRoomId, playerId);
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el jugador IA');
    }
  };

  const handleStartGame = async () => {
    if (!isHost || !allPlayersReady) return;

    try {
      await startGame(effectiveRoomId);
      // Navigate immediately for the host to avoid waiting on subscription timing
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        navigation.navigate('Game', {
          gameMode: 'friends',
          roomId: effectiveRoomId,
          roomCode,
          players,
          isHost,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la partida');
    }
  };

  const handleLeaveRoom = async () => {
    Alert.alert('Salir de la sala', '¿Cómo quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir y volveré (15 min)',
        onPress: async () => {
          try {
            await softLeaveRoom(effectiveRoomId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'No se pudo guardar tu lugar');
          }
        },
      },
      {
        text: 'Salir definitivamente',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveRoom(effectiveRoomId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'No se pudo salir de la sala');
          }
        },
      },
    ]);
  };

  // Show errors once to avoid render loops
  const lastErrorRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      lastErrorRef.current = error;
      Alert.alert('Error', error);
    }
  }, [error]);

  return (
    <LandscapeContainer>
      <View style={styles.header}>
        <TouchableOpacity
          testID="leave-room-button"
          onPress={handleLeaveRoom}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Salir</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sala de Juego</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ flexDirection: 'row', gap: dimensions.spacing.lg }}>
          <View style={{ flex: isTabletLike ? 2 : 1 }}>
            <RoomHeader 
              code={roomCode || roomId.slice(0, 6).toUpperCase()} 
              onShare={handleShareRoom}
              onCopy={handleCopyCode}
            />

            <PlayerSlots
              players={players}
              onAddAI={() => {
                if (aiManagerRef.current?.openModal) {
                  aiManagerRef.current.openModal();
                }
              }}
              isHost={anyMemberCanManageBots ? true : isHost}
            />
          </View>

          <View style={{ flex: 1 }}>
            <AIPlayerManager
              ref={aiManagerRef}
              players={players}
              roomId={effectiveRoomId}
              isHost={isHost}
              onAddAI={handleAddAIPlayer}
              onRemoveAI={handleRemoveAI}
              onOpenModal={() => {}}
            />

            <TeamIndicator
              teams={[
                { id: 'team1', name: 'Equipo 1', players: players.filter(p => p.teamId === 'team1') },
                { id: 'team2', name: 'Equipo 2', players: players.filter(p => p.teamId === 'team2') },
              ]}
            />

            <View style={styles.actions}>
              <ReadyButton isReady={localIsReady} onToggle={handleToggleReady} />
              {isHost && <StartGameButton enabled={allPlayersReady} onStart={handleStartGame} />}
            </View>
          </View>
        </View>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Cargando sala..." />
    </LandscapeContainer>
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
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: dimensions.spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flexGrow: 1,
    padding: dimensions.spacing.lg,
  },
  actions: {
    marginTop: dimensions.spacing.xl,
    gap: dimensions.spacing.md,
  },
});
