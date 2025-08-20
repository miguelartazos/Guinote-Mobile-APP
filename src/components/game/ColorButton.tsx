import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import type { HexColor } from '../../constants/colors';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

type ColorButtonProps = {
  color: HexColor;
  isSelected: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export function ColorButton({ color, isSelected, onPress, style }: ColorButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.colorButton,
        { backgroundColor: color },
        isSelected && styles.colorButtonActive,
        style,
      ]}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: colors.accent,
  },
});
