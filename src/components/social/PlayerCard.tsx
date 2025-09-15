import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type Action = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
};

type Props = {
  username: string;
  subtitle?: string;
  avatarUrl?: string;
  actions?: Action[];
};

export function PlayerCard({ username, subtitle, avatarUrl, actions = [] }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarEmoji}>👤</Text>
          )}
        </View>
        <View style={styles.texts}>
          <Text style={styles.username}>{username}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.actionsRow}>
        {actions.map((a, idx) => (
          <TouchableOpacity
            key={`${a.label}-${idx}`}
            onPress={a.onPress}
            style={[styles.actionButton, actionVariant[a.variant || 'secondary']]}
            activeOpacity={0.9}
          >
            <Text style={styles.actionText}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: dimensions.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: dimensions.spacing.md,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  texts: {
    flex: 1,
  },
  username: {
    color: colors.text,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: dimensions.spacing.sm,
    marginTop: dimensions.spacing.sm,
  },
  actionButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: 8,
    borderRadius: dimensions.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    color: colors.primaryButtonText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});

const actionVariant = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  danger: {
    backgroundColor: '#A23B3B',
    borderColor: '#A23B3B',
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
  },
});


