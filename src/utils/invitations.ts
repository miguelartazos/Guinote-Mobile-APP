import { Linking, Share, Platform } from 'react-native';
import { isMultiplayerEnabled } from '../config/featureFlags';

const APP_SCHEME = 'guinote';
const APP_STORE_URL = 'https://apps.apple.com/app/guinote/id1234567890';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.guinote.app';

export const createRoomDeepLink = (roomCode: string): string => {
  return `${APP_SCHEME}://room/${roomCode}`;
};

export const shareViaWhatsApp = async (code: string): Promise<void> => {
  if (!isMultiplayerEnabled()) {
    // Multiplayer features are disabled
    return;
  }

  const deepLink = createRoomDeepLink(code);

  const message =
    `🎮 ¡Únete a mi partida de Guiñote!\n\n` +
    `📱 Código: ${code}\n` +
    `🔗 Click aquí: ${deepLink}\n\n` +
    `¿No tienes la app?\n` +
    `iOS: ${APP_STORE_URL}\n` +
    `Android: ${PLAY_STORE_URL}`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to web WhatsApp
      const webWhatsAppUrl = `https://wa.me/?text=${encodedMessage}`;
      await Linking.openURL(webWhatsAppUrl);
    }
  } catch (error) {
    // Error opening WhatsApp - fallback to native share
    await shareRoomNative(code);
  }
};

export const shareRoomNative = async (code: string): Promise<void> => {
  if (!isMultiplayerEnabled()) {
    // Multiplayer features are disabled
    return;
  }

  const deepLink = createRoomDeepLink(code);

  const message =
    `🎮 ¡Únete a mi partida de Guiñote!\n\n` +
    `📱 Código: ${code}\n` +
    `🔗 Enlace: ${deepLink}\n\n` +
    `¿No tienes la app?\n` +
    `iOS: ${APP_STORE_URL}\n` +
    `Android: ${PLAY_STORE_URL}`;

  try {
    await Share.share({
      message,
      title: 'Invitación a Guiñote',
      ...(Platform.OS === 'ios' && { url: deepLink }),
    });
  } catch (error) {
    // Error sharing room - silently fail
  }
};

export const handleDeepLink = (
  url: string,
): { screen: string; params?: Record<string, unknown> } | null => {
  if (!url.startsWith(`${APP_SCHEME}://`)) {
    return null;
  }

  const path = url.replace(`${APP_SCHEME}://`, '');
  const parts = path.split('/');

  if (parts[0] === 'room' && parts[1]) {
    return {
      screen: 'GameRoom',
      params: {
        roomCode: parts[1],
        fromDeepLink: true,
      },
    };
  }

  return null;
};
