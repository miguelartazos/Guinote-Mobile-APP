import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '../../constants/colors';

type TopLeftActionsProps = {
  onMenuPress?: () => void;
  onEmojiPress?: () => void;
  onRankingPress?: () => void;
  onSettingsPress?: () => void;
};

export function TopLeftActions({
  onMenuPress,
  onEmojiPress,
  onRankingPress,
  onSettingsPress,
}: TopLeftActionsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.circularButton} onPress={onMenuPress}>
        <Text style={styles.buttonIcon}>☰</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.circularButton} onPress={onEmojiPress}>
        <Text style={styles.buttonIcon}>😊</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.circularButton} onPress={onRankingPress}>
        <Text style={styles.buttonIcon}>🏆</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.circularButton} onPress={onSettingsPress}>
        <Text style={styles.buttonIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 25,
  },
  circularButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: colors.goldDark,
  },
  buttonIcon: {
    fontSize: 18,
    color: colors.black,
  },
});
