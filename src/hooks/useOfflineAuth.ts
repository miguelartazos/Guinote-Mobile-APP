import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineUser {
  id: string;
  username: string;
  email?: string;
  isOffline: true;
}

const OFFLINE_USER_KEY = '@guinote/offline_user';

export function useOfflineAuth() {
  const [user, setUser] = useState<OfflineUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadOfflineUser();
  }, []);

  const loadOfflineUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(OFFLINE_USER_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // Create default offline user
        const defaultUser: OfflineUser = {
          id: 'offline-user-' + Date.now(),
          username: 'Jugador',
          isOffline: true,
        };
        await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(defaultUser));
        setUser(defaultUser);
      }
    } catch (error) {
      console.error('Error loading offline user:', error);
      // Create fallback user
      setUser({
        id: 'offline-user-fallback',
        username: 'Jugador',
        isOffline: true,
      });
    } finally {
      setIsLoaded(true);
    }
  };

  const updateUsername = async (username: string) => {
    if (!user) return;

    const updatedUser = { ...user, username };
    setUser(updatedUser);

    try {
      await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error saving offline user:', error);
    }
  };

  return {
    user,
    isLoaded,
    isSignedIn: !!user,
    updateUsername,
  };
}
