import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { VoiceBubble } from './VoiceBubble';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
// Convex types removed

type VoiceMessage = {
  id: string;
  playerId: string;
  playerName: string;
  timestamp: number;
  duration: number;
  storageId: string;
};

type VoiceHistoryListProps = {
  messages: VoiceMessage[];
  onPlayMessage: (storageId: string) => Promise<void>;
  isPlaying: boolean;
  currentPlayerId?: string;
};

export function VoiceHistoryList({
  messages,
  onPlayMessage,
  isPlaying,
  currentPlayerId,
}: VoiceHistoryListProps) {
  if (!messages || messages.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No voice messages yet</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {messages.map((message, index) => (
        <View key={message.id} style={styles.messageItem}>
          <Text style={styles.timestamp}>{new Date(message.timestamp).toLocaleTimeString()}</Text>
          <VoiceBubble
            recordingId={message.storageId as any}
            playerName={message.playerName}
            playerAvatar="🎮"
            position={index % 2 === 0 ? 'left' : 'right'}
            currentPlayerId={currentPlayerId}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  messageItem: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
