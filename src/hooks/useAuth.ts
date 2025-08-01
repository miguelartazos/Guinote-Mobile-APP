import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import networkService from '../services/networkService';

interface Player {
  id: string;
  username: string;
  email?: string;
  avatar: string;
  stats: {
    elo: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winStreak: number;
    bestWinStreak: number;
  };
  isGuest?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  player: Player | null;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    player: null,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // TEMPORARY: Mock authentication for testing
      const mockPlayer: Player = {
        id: 'test-player-123',
        username: 'TestPlayer',
        email: 'test@example.com',
        avatar: '🎮',
        stats: {
          elo: 1000,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          winStreak: 0,
          bestWinStreak: 0,
        },
        isGuest: false,
      };

      // Set mock auth token
      await AsyncStorage.setItem('authToken', 'mock-token-123');
      await AsyncStorage.setItem('player', JSON.stringify(mockPlayer));

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        player: mockPlayer,
        error: null,
      });

      // Initialize network service with mock token
      networkService.authToken = 'mock-token-123';

      console.log('🔧 Using mock authentication for testing');
      return;

      // ORIGINAL CODE (commented out for testing):
      /*
      const [token, playerData] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('player'),
      ]);

      if (token && playerData) {
        const player = JSON.parse(playerData);
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          player,
          error: null,
        });

        // Initialize network service
        await networkService.initialize();
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          player: null,
          error: null,
        });
      }
      */
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        player: null,
        error: 'Error al verificar sesión',
      });
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const data = await networkService.login(username, password);

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        player: data.player,
        error: null,
      });

      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Error al iniciar sesión';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      avatar?: string,
    ) => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

        const data = await networkService.register(
          username,
          email,
          password,
          avatar,
        );

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          player: data.player,
          error: null,
        });

        return data;
      } catch (error: any) {
        const errorMessage = error.message || 'Error al registrarse';
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [],
  );

  const loginAsGuest = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Create a local guest player without server connection
      const guestPlayer: Player = {
        id: `guest-${Date.now()}`,
        username: 'Invitado',
        email: undefined,
        avatar: '🎮',
        stats: {
          elo: 1000,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          winStreak: 0,
          bestWinStreak: 0,
        },
        isGuest: true,
      };

      // Save guest data locally
      await AsyncStorage.setItem('authToken', `guest-token-${Date.now()}`);
      await AsyncStorage.setItem('player', JSON.stringify(guestPlayer));

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        player: guestPlayer,
        error: null,
      });

      console.log('🎮 Guest login successful (offline mode)');
      return { player: guestPlayer };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al entrar como invitado';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await networkService.logout();

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        player: null,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        player: null,
        error: null,
      });
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Player>) => {
    try {
      const response = await fetch('/api/players/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedPlayer = await response.json();

      setAuthState(prev => ({
        ...prev,
        player: updatedPlayer,
      }));

      // Update stored player data
      await AsyncStorage.setItem('player', JSON.stringify(updatedPlayer));

      return updatedPlayer;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }, []);

  return {
    ...authState,
    login,
    register,
    loginAsGuest,
    logout,
    updateProfile,
    checkAuthStatus,
  };
}
