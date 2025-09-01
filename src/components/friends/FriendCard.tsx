import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import type { Friend, FriendRequest } from '../../types/friend.types';

interface FriendCardProps {
  friend?: Friend;
  request?: FriendRequest;
  blockedUser?: { id: string; username: string };
  onInvite?: (friendId: string) => void;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onUnblock?: (userId: string) => void;
  onRemove?: (friendId: string) => void;
}

export function FriendCard({
  friend,
  request,
  blockedUser,
  onInvite,
  onAccept,
  onReject,
  onUnblock,
  onRemove,
}: FriendCardProps) {
  const user = friend || request?.sender || blockedUser;
  if (!user) return null;

  const isOnline = friend?.isOnline;
  const isPending = !!request;
  const isBlocked = !!blockedUser;

  return (
    <Card style={styles.container}>
      <View style={styles.leftContent}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.username.substring(0, 2).toUpperCase()}</Text>
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.info}>
          <Text style={styles.username}>{user.username}</Text>
          {friend?.friendCode && <Text style={styles.friendCode}>#{friend.friendCode}</Text>}
          {isPending && <Text style={styles.pendingText}>Solicitud pendiente</Text>}
          {isBlocked && <Text style={styles.blockedText}>Usuario bloqueado</Text>}
        </View>
      </View>

      <View style={styles.actions}>
        {friend && isOnline && onInvite && (
          <TouchableOpacity
            style={[styles.actionButton, styles.inviteButton]}
            onPress={() => onInvite(friend.id)}
          >
            <Text style={styles.inviteButtonText}>Invitar</Text>
          </TouchableOpacity>
        )}

        {friend && onRemove && (
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => onRemove(friend.id)}
          >
            <Text style={styles.removeButtonText}>Eliminar</Text>
          </TouchableOpacity>
        )}

        {request && onAccept && onReject && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => onAccept(request.id)}
            >
              <Text style={styles.acceptButtonText}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onReject(request.id)}
            >
              <Text style={styles.rejectButtonText}>✗</Text>
            </TouchableOpacity>
          </>
        )}

        {blockedUser && onUnblock && (
          <TouchableOpacity
            style={[styles.actionButton, styles.unblockButton]}
            onPress={() => onUnblock(blockedUser.id)}
          >
            <Text style={styles.unblockButtonText}>Desbloquear</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: dimensions.spacing.md,
    marginHorizontal: dimensions.spacing.md,
    marginVertical: dimensions.spacing.xs,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.md,
    position: 'relative',
  },
  avatarText: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  friendCode: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pendingText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    marginTop: 2,
    fontStyle: 'italic',
  },
  blockedText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: 2,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.spacing.xs,
  },
  actionButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  inviteButton: {
    backgroundColor: colors.accent,
  },
  inviteButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  removeButton: {
    backgroundColor: colors.error + '20',
  },
  removeButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  acceptButton: {
    backgroundColor: colors.success,
    minWidth: 40,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  rejectButton: {
    backgroundColor: colors.error,
    minWidth: 40,
  },
  rejectButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  unblockButton: {
    backgroundColor: colors.secondary,
  },
  unblockButtonText: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
  },
});
