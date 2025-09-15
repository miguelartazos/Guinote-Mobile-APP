import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type NavKey = 'amigos' | 'club' | 'observar';

type Props = {
  active: NavKey;
  onChange: (key: NavKey) => void;
};

export function SidebarNavigation({ active, onChange }: Props) {
  const items: Array<{ key: NavKey; label: string }> = [
    { key: 'amigos', label: 'AMIGOS' },
    { key: 'club', label: 'CLUB' },
    { key: 'observar', label: 'OBSERVAR' },
  ];

  return (
    <View style={styles.container}>
      {items.map(item => {
        const selected = item.key === active;
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.item, selected && styles.itemSelected]}
            onPress={() => onChange(item.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.sm,
    gap: dimensions.spacing.sm,
  },
  item: {
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.md,
    backgroundColor: colors.secondary,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  labelSelected: {
    color: colors.primaryButtonText,
  },
});


