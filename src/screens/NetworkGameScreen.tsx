import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { JugarStackScreenProps } from '../types/navigation';
import { useConvexAuth } from '../hooks/useConvexAuth';
import { useNetworkGameState } from '../hooks/useNetworkGameState';
import { ConnectionStatus } from '../components/game/ConnectionStatus';
import { GameScreen } from './GameScreen';
import { colors } from '../constants/colors';

type Props = JugarStackScreenProps<'NetworkGame'>;

export function NetworkGameScreen() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Props['navigation']>();
  const { user: convexUser } = useConvexAuth();
  const userId = convexUser?._id;
  const profile = convexUser;
  const [isReady, setIsReady] = useState(false);

  const { gameState, isConnected, isLoading, networkError, ...gameActions } =
    useNetworkGameState({
      gameMode: 'online',
      roomId: route.params.roomId,
      userId: userId || undefined,
      playerName: profile?.display_name || 'Player',
    });

  useEffect(() => {
    if (networkError) {
      Alert.alert('Connection Error', networkError, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  }, [networkError, navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Connecting to game...</Text>
        <Text style={styles.roomCode}>Room Code: {route.params.roomCode}</Text>
      </View>
    );
  }

  if (!gameState) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Waiting for players...</Text>
        <Text style={styles.roomCode}>Room Code: {route.params.roomCode}</Text>
        <Text style={styles.shareText}>
          Share this code with friends to join!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConnectionStatus isConnected={isConnected} />
      <GameScreen
        route={{
          key: 'game-' + route.params.roomId,
          name: 'Game' as const,
          params: {
            gameMode: 'friends',
            roomId: route.params.roomId,
            roomCode: route.params.roomCode,
            playerName: profile?.display_name || 'Player',
          },
        }}
        navigation={navigation as any}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  roomCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  shareText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
