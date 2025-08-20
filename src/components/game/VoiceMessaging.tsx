import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { VoiceButton } from './VoiceButton';
import { VoiceHistoryList } from './VoiceHistoryList';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface VoiceMessagingProps {
  roomId?: string;
  gameMode: 'online' | 'friends' | 'offline';
}

export function VoiceMessaging({ roomId, gameMode }: VoiceMessagingProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();

  // Only use voice for online games
  const isOnline = gameMode === 'online' || gameMode === 'friends';

  const voiceMessages: any[] = [];
  const isSending = false;
  const isPlaying = false;
  const playRecording = async (_url: string) => {};
  const stopPlayback = async () => {};
  const getPlaybackUrl = async (_storageId: string) => null as string | null;
  const sendRecording = async (_recordingId: string, _userId: string) => {};

  if (!isOnline || !user) {
    return null;
  }

  const handleRecordingComplete = async (recordingId: string) => {
    try {
      await sendRecording(recordingId as any, user._id);
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Voice Button */}
      <View style={styles.voiceButtonContainer}>
        <VoiceButton
          playerId={user._id}
          onRecordingComplete={handleRecordingComplete}
          disabled={isSending}
        />
        {isSending && (
          <ActivityIndicator style={styles.sendingIndicator} size="small" color={colors.accent} />
        )}
      </View>

      {/* History Toggle */}
      <TouchableOpacity style={styles.historyToggle} onPress={() => setShowHistory(!showHistory)}>
        <Text style={styles.historyToggleText}>
          {showHistory ? 'Hide' : 'Show'} Voice History
          {voiceMessages.length > 0 && ` (${voiceMessages.length})`}
        </Text>
      </TouchableOpacity>

      {/* Voice History */}
      {showHistory && (
        <View style={styles.historyContainer}>
          <VoiceHistoryList
            messages={voiceMessages.map(msg => ({
              id: msg._id,
              playerId: msg.senderId,
              playerName: msg.senderName,
              timestamp: msg.timestamp,
              duration: msg.duration,
              storageId: msg.storageId,
            }))}
            onPlayMessage={async (storageId: string) => {
              const url = await getPlaybackUrl(storageId);
              if (url) {
                // Play the audio using the URL
                await playRecording(url);
              } else {
                console.error('Failed to get playback URL');
              }
            }}
            isPlaying={isPlaying}
            currentPlayerId={user?._id}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  voiceButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sendingIndicator: {
    marginLeft: 10,
  },
  historyToggle: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  historyToggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  historyContainer: {
    marginTop: 10,
    maxHeight: 200,
    width: 300,
  },
});
