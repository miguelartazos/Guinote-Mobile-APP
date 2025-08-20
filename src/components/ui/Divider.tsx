import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type DividerProps = {
  text?: string;
  color?: string;
  thickness?: number;
  spacing?: 'small' | 'medium' | 'large';
};

export function Divider({
  text,
  color = colors.border,
  thickness = 1,
  spacing = 'medium',
}: DividerProps) {
  const getSpacing = () => {
    switch (spacing) {
      case 'small':
        return dimensions.spacing.sm;
      case 'large':
        return dimensions.spacing.xl;
      default:
        return dimensions.spacing.md;
    }
  };

  const marginVertical = getSpacing();

  if (text) {
    return (
      <View style={[styles.container, { marginVertical }]}>
        <View style={[styles.line, { backgroundColor: color, height: thickness }]} />
        <Text style={styles.text}>{text}</Text>
        <View style={[styles.line, { backgroundColor: color, height: thickness }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.simpleLine,
        {
          backgroundColor: color,
          height: thickness,
          marginVertical,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
  },
  simpleLine: {
    width: '100%',
  },
  text: {
    marginHorizontal: dimensions.spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
