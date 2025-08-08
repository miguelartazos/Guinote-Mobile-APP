import { useAction, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useCallback, useState } from 'react';
import { useVoiceRecorder } from './useVoiceRecorder';
import type { VoiceRecordingId } from '../types/voice.types';
import { getRecording } from '../utils/voiceStorage';

export function useConvexVoice(roomId?: Id<'rooms'>) {
  const [isSending, setIsSending] = useState(false);
  
  // Convex actions and queries
  const uploadVoiceMessage = useAction(api.voice.uploadVoiceMessage);
  const getVoiceMessageUrl = useAction(api.voice.getVoiceMessageUrl);
  const voiceMessages = useQuery(
    api.voice.getVoiceMessages,
    roomId ? { roomId, limit: 50 } : 'skip'
  );
  
  // Local voice recorder
  const voiceRecorder = useVoiceRecorder();
  
  // Send a voice recording to Convex
  const sendRecording = useCallback(
    async (recordingId: VoiceRecordingId, senderId: Id<'users'>) => {
      if (!roomId) {
        throw new Error('No room ID provided');
      }
      
      setIsSending(true);
      try {
        // Get the recording data
        const recording = await getRecording(recordingId);
        if (!recording) {
          throw new Error('Recording not found');
        }
        
        // Read the file as base64
        const response = await fetch(recording.uri);
        const blob = await response.blob();
        
        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        
        const base64Data = await base64Promise;
        
        // Send to Convex
        const result = await uploadVoiceMessage({
          roomId,
          senderId,
          audioData: base64Data,
          duration: recording.duration,
        });
        
        return result;
      } finally {
        setIsSending(false);
      }
    },
    [roomId, uploadVoiceMessage]
  );
  
  // Get playback URL for a voice message
  const getPlaybackUrl = useCallback(
    async (storageId: string) => {
      try {
        const url = await getVoiceMessageUrl({ storageId });
        return url;
      } catch (error) {
        console.error('Failed to get playback URL:', error);
        return null;
      }
    },
    [getVoiceMessageUrl]
  );
  
  return {
    ...voiceRecorder,
    voiceMessages: voiceMessages || [],
    sendRecording,
    isSending,
    getPlaybackUrl,
  };
}