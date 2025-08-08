import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import networkService from '../services/networkService';
import type { JugarStackNavigationProp } from '../types/navigation';

interface MatchmakingStatus {
  status: 'idle' | 'searching' | 'found' | 'error';
  playersInQueue: number;
  waitTime: number;
  estimatedTime: number;
  eloRange: number;
}

interface MatchData {
  roomId: string;
  players: any[];
  gameState: any;
}

export function useMatchmaking() {
  const navigation = useNavigation<JugarStackNavigationProp>();
  const [status, setStatus] = useState<MatchmakingStatus>({
    status: 'idle',
    playersInQueue: 0,
    waitTime: 0,
    estimatedTime: 45,
    eloRange: 50,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up event listeners
    const handleMatchmakingStatus = (data: any) => {
      setStatus(prev => ({
        ...prev,
        ...data,
        status: 'searching',
      }));
    };

    const handleMatchFound = (data: MatchData) => {
      setStatus(prev => ({ ...prev, status: 'found' }));

      // Navigate to game screen
      setTimeout(() => {
        navigation.navigate('Game', {
          gameMode: 'online',
          roomId: data.roomId,
          players: data.players,
        });
      }, 500);
    };

    const handleError = (error: any) => {
      setError(error.message || 'Error en matchmaking');
      setStatus(prev => ({ ...prev, status: 'error' }));
    };

    networkService.on('matchmaking_status', handleMatchmakingStatus);
    networkService.on('match_found', handleMatchFound);
    networkService.on('error', handleError);

    // Cleanup
    return () => {
      networkService.off('matchmaking_status', handleMatchmakingStatus);
      networkService.off('match_found', handleMatchFound);
      networkService.off('error', handleError);
    };
  }, [navigation]);

  const startMatchmaking = useCallback(async (gameMode: string = 'ranked') => {
    try {
      setError(null);
      setStatus(prev => ({ ...prev, status: 'searching' }));

      // Ensure we're connected
      if (!networkService.isConnected()) {
        await networkService.initialize();
      }

      networkService.joinMatchmaking(gameMode);
    } catch (err) {
      console.error('Failed to start matchmaking:', err);
      setError('Error al buscar partida');
      setStatus(prev => ({ ...prev, status: 'error' }));
    }
  }, []);

  const cancelMatchmaking = useCallback(() => {
    try {
      networkService.leaveMatchmaking();
      setStatus(prev => ({ ...prev, status: 'idle' }));
    } catch (err) {
      console.error('Failed to cancel matchmaking:', err);
    }
  }, []);

  return {
    status,
    error,
    startMatchmaking,
    cancelMatchmaking,
  };
}
