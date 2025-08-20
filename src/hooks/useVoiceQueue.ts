import { useState, useEffect, useCallback, useRef } from 'react';
import { voiceQueue, VoiceQueueState, VoiceMessageQueue } from '../utils/voiceQueue';
import { useVoiceRecorder } from './useVoiceRecorder';
import type { VoiceRecordingId } from '../utils/voiceStorage';

export type VoiceMessageData = {
  recordingId: VoiceRecordingId;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  position: 'top' | 'left' | 'right' | 'bottom';
  isCurrentPlayer?: boolean;
  isTeammate?: boolean;
};

const PLAYBACK_DELAY = 500; // Delay between messages

export function useVoiceQueue() {
  const [queueState, setQueueState] = useState<VoiceQueueState>(voiceQueue.getState());
  const { playRecording, stopPlayback, isPlaying } = useVoiceRecorder();
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  // Subscribe to queue state changes
  useEffect(() => {
    const unsubscribe = voiceQueue.subscribe(setQueueState);
    return unsubscribe;
  }, []);

  // Process queue when not playing and queue has items
  useEffect(() => {
    if (!isPlaying && !queueState.isPaused && queueState.queue.length > 0) {
      // Add a small delay between messages
      playbackTimerRef.current = setTimeout(() => {
        processNextMessage();
      }, PLAYBACK_DELAY);
    }

    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, queueState.isPaused, queueState.queue.length]);

  const processNextMessage = useCallback(async () => {
    const nextMessage = voiceQueue.getNext();
    if (!nextMessage) return;

    currentMessageIdRef.current = nextMessage.id;
    voiceQueue.setPlaying(nextMessage.id);

    // Play the recording
    const success = await playRecording(nextMessage.recordingId);

    if (!success) {
      // If playback failed, move to next message
      voiceQueue.setPlaying(null);
      currentMessageIdRef.current = null;
    }
  }, [playRecording]);

  const addToQueue = useCallback((message: VoiceMessageData): string => {
    const priority = VoiceMessageQueue.getPriority(
      message.isCurrentPlayer || false,
      message.isTeammate || false,
    );

    return voiceQueue.add({
      recordingId: message.recordingId,
      playerId: message.playerId,
      playerName: message.playerName,
      playerAvatar: message.playerAvatar,
      position: message.position,
      priority,
    });
  }, []);

  const removeFromQueue = useCallback((id: string): boolean => {
    return voiceQueue.remove(id);
  }, []);

  const clearQueue = useCallback(() => {
    voiceQueue.clear();
  }, []);

  const pauseQueue = useCallback(() => {
    voiceQueue.setPaused(true);
  }, []);

  const resumeQueue = useCallback(() => {
    voiceQueue.setPaused(false);
  }, []);

  const skipCurrent = useCallback(async () => {
    if (currentMessageIdRef.current) {
      await stopPlayback();
      voiceQueue.setPlaying(null);
      currentMessageIdRef.current = null;
    }
  }, [stopPlayback]);

  return {
    // Queue state
    queue: queueState.queue,
    currentlyPlaying: queueState.currentlyPlaying,
    isPaused: queueState.isPaused,
    queueLength: queueState.queue.length,

    // Queue controls
    addToQueue,
    removeFromQueue,
    clearQueue,
    pauseQueue,
    resumeQueue,
    skipCurrent,
  };
}
