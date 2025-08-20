import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { VoiceBubble } from './VoiceBubble';
import { getVoiceHistory, clearVoiceHistory, getHistoryStats } from '../../utils/voiceStorage';
import type { VoiceRecording } from '../../utils/voiceStorage';

type VoiceHistoryProps = {
  visible: boolean;
  onClose: () => void;
  currentPlayerId?: string;
};

export function VoiceHistory({
  visible,
  onClose,
  currentPlayerId = 'current_player',
}: VoiceHistoryProps) {
  const [historyRecordings, setHistoryRecordings] = useState<VoiceRecording[]>([]);
  const [stats, setStats] = useState(getHistoryStats());
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      refreshHistory();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const refreshHistory = () => {
    setHistoryRecordings(getVoiceHistory());
    setStats(getHistoryStats());
  };

  const handleClearHistory = () => {
    clearVoiceHistory();
    refreshHistory();
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Hace un momento';
    } else if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `Hace ${hours}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPlayerPosition = (index: number): 'top' | 'left' | 'right' | 'bottom' => {
    // Alternate positions for visual variety
    const positions: Array<'top' | 'left' | 'right' | 'bottom'> = [
      'bottom',
      'left',
      'top',
      'right',
    ];
    return positions[index % positions.length];
  };

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Historial de Mensajes</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stats}>
            <Text style={styles.statsText}>
              {stats.totalRecordings} mensaje
              {stats.totalRecordings !== 1 ? 's' : ''}
            </Text>
            {stats.newestTimestamp && (
              <Text style={styles.statsText}>Último: {formatTimestamp(stats.newestTimestamp)}</Text>
            )}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {historyRecordings.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No hay mensajes de voz en el historial</Text>
                <Text style={styles.emptyStateSubtext}>
                  Los mensajes aparecerán aquí después de enviarlos
                </Text>
              </View>
            ) : (
              <View style={styles.recordingsList}>
                {historyRecordings.map((recording, index) => (
                  <View key={recording.id} style={styles.recordingItem}>
                    <View style={styles.recordingInfo}>
                      <Text style={styles.recordingTimestamp}>
                        {formatTimestamp(recording.timestamp)}
                      </Text>
                      <Text style={styles.recordingDuration}>
                        {(recording.duration / 1000).toFixed(1)}s
                      </Text>
                    </View>
                    <View style={styles.bubbleContainer}>
                      <VoiceBubble
                        recordingId={recording.id}
                        playerName="Tú"
                        playerAvatar="🎤"
                        position={getPlayerPosition(index)}
                        currentPlayerId={currentPlayerId}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {historyRecordings.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearHistory}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Limpiar Historial</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: dimensions.spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    backgroundColor: colors.primary,
  },
  statsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xxl,
  },
  emptyStateText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  recordingsList: {
    paddingVertical: dimensions.spacing.md,
  },
  recordingItem: {
    marginBottom: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    paddingBottom: dimensions.spacing.md,
  },
  recordingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  recordingTimestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  recordingDuration: {
    fontSize: typography.fontSize.xs,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  bubbleContainer: {
    alignItems: 'center',
    position: 'relative',
    minHeight: 60,
  },
  footer: {
    padding: dimensions.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  clearButton: {
    backgroundColor: '#DC2626',
    borderRadius: dimensions.borderRadius.lg,
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
