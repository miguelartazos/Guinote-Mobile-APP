import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

export function useVoicePermissions() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const getMicrophonePermission = (): Permission | null => {
    if (Platform.OS === 'ios') {
      return PERMISSIONS.IOS.MICROPHONE;
    } else if (Platform.OS === 'android') {
      return PERMISSIONS.ANDROID.RECORD_AUDIO;
    }
    return null;
  };

  const checkPermission = useCallback(async () => {
    setIsChecking(true);
    try {
      const permission = getMicrophonePermission();
      if (!permission) {
        setHasPermission(false);
        return false;
      }

      const result = await check(permission);
      const granted = result === RESULTS.GRANTED;
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setHasPermission(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const permission = getMicrophonePermission();
    if (!permission) {
      Alert.alert('Error', 'Microphone permissions are not supported on this platform');
      return false;
    }

    // First check if we already have permission
    const currentStatus = await check(permission);
    if (currentStatus === RESULTS.GRANTED) {
      setHasPermission(true);
      return true;
    }

    // Show explanation before requesting
    return new Promise<boolean>(resolve => {
      Alert.alert(
        'Permiso de Micrófono',
        'Guiñote necesita acceso al micrófono para grabar mensajes de voz durante el juego. Podrás comunicarte con otros jugadores mediante notas de voz.',
        [
          {
            text: 'Cancelar',
            onPress: () => {
              setHasPermission(false);
              resolve(false);
            },
            style: 'cancel',
          },
          {
            text: 'Permitir',
            onPress: async () => {
              try {
                const result = await request(permission);
                const granted = result === RESULTS.GRANTED;
                setHasPermission(granted);

                if (!granted && result === RESULTS.BLOCKED) {
                  Alert.alert(
                    'Permiso Denegado',
                    'Has denegado el acceso al micrófono. Para usar mensajes de voz, ve a Configuración y activa el permiso de micrófono para Guiñote.',
                    [{ text: 'OK' }],
                  );
                }

                resolve(granted);
              } catch (error) {
                console.error('Error requesting microphone permission:', error);
                setHasPermission(false);
                resolve(false);
              }
            },
          },
        ],
      );
    });
  }, []);

  return {
    hasPermission,
    isChecking,
    checkPermission,
    requestPermission,
  };
}
