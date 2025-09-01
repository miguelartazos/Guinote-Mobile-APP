import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { shareRoomViaWhatsApp } from '../services/sharing/whatsappShare';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useUnifiedRooms } from '../hooks/useUnifiedRooms';

type GameRoomScreenProps = JugarStackScreenProps<'GameRoom'>;

export function GameRoomScreen({ route }: GameRoomScreenProps) {
  const navigation = useNavigation<JugarStackNavigationProp>();
  const { roomId, roomCode } = route.params;
  const { user } = useUnifiedAuth();
  const userId = user?.id;

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
    leaveRoom,
  } = useUnifiedRooms();

  const [localIsReady, setLocalIsReady] = useState(false);

  const isHost = room?.host_id === userId;
  const currentPlayer = players.find(p => p.id === userId);
  const allPlayersReady = players.length === 4 && players.every(p => p.isReady);

  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomId);
    getRoomPlayers(roomId);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomId, subscribeToRoom, getRoomPlayers]);

  useEffect(() => {
    if (currentPlayer) {
      setLocalIsReady(currentPlayer.isReady);
    }
  }, [currentPlayer]);

  const handleToggleReady = async () => {
    if (!userId) return;

    try {
      const newReadyStatus = !localIsReady;
      setLocalIsReady(newReadyStatus);
      await updateReadyStatus(roomId, userId, newReadyStatus);
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

  const handleAddAIPlayer = async (config: import('../hooks/useUnifiedRooms').AIConfig) => {
    if (!isHost) {
      Alert.alert('Solo el anfitrión', 'Solo el anfitrión puede añadir jugadores IA');
      return;
    }

    try {
      await addAIPlayer(roomId, config);
    } catch (error) {
      Alert.alert('Error', 'No se pudo añadir jugador IA');
    }
  };

  const handleStartGame = async () => {
    if (!isHost || !allPlayersReady) return;

    try {
      await startGame(roomId);
      navigation.navigate('Game', {
        gameMode: 'friends',
        roomId,
        roomCode,
        players,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la partida');
    }
  };

  const handleLeaveRoom = async () => {
    Alert.alert('Salir de la sala', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveRoom(roomId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'No se pudo salir de la sala');
          }
        },
      },
    ]);
  };

  if (error) {
    Alert.alert('Error', error);
  }

  return (
    <View style={styles.container}>
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
        <RoomHeader code={roomCode || roomId.slice(0, 6).toUpperCase()} onShare={handleShareRoom} />

        <PlayerSlots players={players} onAddAI={() => {}} isHost={isHost} />

        <AIPlayerManager
          players={players}
          roomId={roomId}
          isHost={isHost}
          onAddAI={handleAddAIPlayer}
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
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Cargando sala..." />
    </View>
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
