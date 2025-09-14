import { Linking, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

const APP_SCHEME = 'guinote';
const WEB_URL = 'https://guinote.app';

export const createDeepLink = (path: string): string => {
  return `${APP_SCHEME}://${path}`;
};

export const createWebFallback = (path: string): string => {
  return `${WEB_URL}/${path}`;
};

export const shareRoomViaWhatsApp = async (roomCode: string): Promise<void> => {
  const appLink = createDeepLink(`join/${roomCode}`);

  const message =
    `¡Únete a mi partida de Guiñote! 🃏\n\n` +
    `🎯 Código de sala: ${roomCode}\n\n` +
    `📱 Haz clic aquí para unirte:\n${appLink}\n\n` +
    `💡 O introduce el código ${roomCode} en la app`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to web WhatsApp
      await Linking.openURL(`https://wa.me/?text=${encodedMessage}`);
    }
  } catch (error) {
    // Fallback to native share
    await shareRoom(roomCode);
  }
};

export const shareRoom = async (roomCode: string): Promise<void> => {
  const appLink = createDeepLink(`join/${roomCode}`);

  const message =
    `¡Únete a mi partida de Guiñote! 🃏\n\n` +
    `Código de sala: ${roomCode}\n\n` +
    `Enlace: ${appLink}`;

  try {
    await Share.share({
      message,
      title: 'Invitación a Guiñote',
    });
  } catch (error) {
    console.error('Error sharing:', error);
  }
};

export const shareViaOtherApps = async (roomCode: string): Promise<void> => {
  await shareRoom(roomCode);
};

export const copyRoomCode = (roomCode: string): Promise<void> => {
  return new Promise(resolve => {
    Clipboard.setString(roomCode);
    resolve();
  });
};
