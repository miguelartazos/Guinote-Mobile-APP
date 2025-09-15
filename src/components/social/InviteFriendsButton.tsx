import React from 'react';
import { ViewStyle, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { useUnifiedRooms } from '../../hooks/useUnifiedRooms';
import { shareRoomViaWhatsApp } from '../../services/sharing/whatsappShare';

type Props = {
  style?: ViewStyle;
  onPress?: () => void;
};

export function InviteFriendsButton({ style, onPress }: Props) {
  const { user } = useUnifiedAuth();
  const rooms = useUnifiedRooms();

  const handlePress = async () => {
    if (onPress) return onPress();
    const userId = user?.id || user?._id;
    if (!userId) return;
    try {
      const room = await rooms.createFriendsRoom(userId);
      await shareRoomViaWhatsApp(room.code);
    } catch (err) {
      // Silent fail; sharing is a convenience action
      if (__DEV__) console.warn('[InviteFriendsButton] invite failed', err);
    }
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handlePress} activeOpacity={0.9}>
      <Text style={styles.text}>Invitar amigos</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.primaryButtonText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});


