import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type Tab = { key: string; label: string; badge?: number };

type Props = {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: any) => void;
};

export function TabNavigation({ tabs, activeKey, onChange }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const selected = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selected && styles.activeTab]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selected && styles.activeTabText]}>{tab.label}</Text>
            {tab.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: dimensions.spacing.sm,
  },
  tab: {
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    marginRight: dimensions.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.accent,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  badge: {
    marginLeft: dimensions.spacing.xs,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});


