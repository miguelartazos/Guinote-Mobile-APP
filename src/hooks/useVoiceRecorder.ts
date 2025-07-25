import { useState, useCallback, useRef, useEffect } from 'react';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
} from 'react-native-audio-recorder-player';
import {
  generateRecordingId,
  getRecordingPath,
  saveRecording,
  getRecording,
  clearAllRecordings,
} from '../utils/voiceStorage';
import type { VoiceRecordingId, VoiceRecording } from '../utils/voiceStorage';

const MAX_RECORDING_DURATION = 5000; // 5 seconds in milliseconds

// Audio recording configuration
const AUDIO_CONFIG = {
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AVNumberOfChannelsKeyIOS: 1,
};

// Use the singleton instance exported by the library
const audioRecorderPlayer = AudioRecorderPlayer;

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [currentRecordingId, setCurrentRecordingId] =
    useState<VoiceRecordingId | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllRecordings();
    };
  }, []);

  const startRecording = useCallback(
    async (playerId: string): Promise<VoiceRecordingId | null> => {
      try {
        if (isRecording) {
          console.warn('Already recording');
          return null;
        }

        const recordingId = generateRecordingId();

        // Start recording with predefined config
        // Don't pass a path - let the library use its default writable location
        const result = await audioRecorderPlayer.startRecorder(
          undefined,
          AUDIO_CONFIG,
          false,
        );
        console.log('Recording started:', result);

        // Set recording state
        setIsRecording(true);
        setCurrentRecordingId(recordingId);
        setRecordingDuration(0);

        // Update duration and auto-stop setup
        audioRecorderPlayer.addRecordBackListener((e: any) => {
          setRecordingDuration(e.currentPosition);
        });

        recordingTimerRef.current = setTimeout(async () => {
          console.log('Auto-stopping recording after max duration');
          await stopRecording();
        }, MAX_RECORDING_DURATION);

        // Save recording metadata with the actual path returned by the library
        const recording: VoiceRecording = {
          id: recordingId,
          playerId,
          filePath: result, // Use the path returned by startRecorder
          timestamp: Date.now(),
          duration: 0, // Updated when stopped
        };
        saveRecording(recording);

        return recordingId;
      } catch (error) {
        console.error('Failed to start recording:', error);
        setIsRecording(false);
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isRecording],
  );

  const stopRecording = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous stop attempts
    if (isStoppingRef.current) {
      console.log('Already stopping recording');
      return false;
    }

    if (!isRecording) {
      console.log('Stop recording called but not recording');
      return false;
    }

    isStoppingRef.current = true;

    try {
      // Clear timer first to prevent auto-stop during manual stop
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Set recording to false immediately to prevent race conditions
      setIsRecording(false);

      try {
        const result = await audioRecorderPlayer.stopRecorder();
        console.log('Recording stopped:', result);
      } catch (error: any) {
        // If it's just "no recorder instance", that's OK - already stopped
        if (error.message?.includes('No recorder instance')) {
          console.log('Recorder already stopped - this is OK');
        } else {
          throw error; // Re-throw other errors
        }
      }

      // Always try to remove listener
      try {
        audioRecorderPlayer.removeRecordBackListener();
      } catch (e) {
        // Ignore listener removal errors
        console.log('Could not remove record listener:', e);
      }

      // Update recording duration
      if (currentRecordingId) {
        const recording = getRecording(currentRecordingId);
        if (recording) {
          recording.duration = recordingDuration;
          saveRecording(recording);
        }
      }

      // Reset state
      setRecordingDuration(0);
      setCurrentRecordingId(null);
      isStoppingRef.current = false;
      return true;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      isStoppingRef.current = false;
      return false;
    }
  }, [isRecording, currentRecordingId, recordingDuration]);

  const playRecording = useCallback(
    async (recordingId: VoiceRecordingId): Promise<boolean> => {
      const recording = getRecording(recordingId);
      if (!recording) {
        console.error('Recording not found:', recordingId);
        return false;
      }

      try {
        if (isPlaying) {
          await stopPlayback();
        }

        console.log('Playing recording with path:', recording.filePath);

        // Play with the stored path directly
        const msg = await audioRecorderPlayer.startPlayer(recording.filePath);
        console.log('Playback started:', msg);

        setIsPlaying(true);
        setPlaybackDuration(0);

        // Update playback duration
        audioRecorderPlayer.addPlayBackListener((e: any) => {
          setPlaybackDuration(e.currentPosition);

          // Auto-stop when finished
          if (e.currentPosition >= e.duration) {
            stopPlayback();
          }
        });

        return true;
      } catch (error) {
        console.error('Failed to play recording:', error);
        setIsPlaying(false);
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const stopPlayback = useCallback(async (): Promise<boolean> => {
    try {
      if (!isPlaying) {
        return false;
      }

      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();

      setIsPlaying(false);
      setPlaybackDuration(0);

      return true;
    } catch (error) {
      console.error('Failed to stop playback:', error);
      setIsPlaying(false);
      return false;
    }
  }, [isPlaying]);

  const pausePlayback = useCallback(async (): Promise<boolean> => {
    try {
      if (!isPlaying) {
        return false;
      }

      await audioRecorderPlayer.pausePlayer();
      return true;
    } catch (error) {
      console.error('Failed to pause playback:', error);
      return false;
    }
  }, [isPlaying]);

  const resumePlayback = useCallback(async (): Promise<boolean> => {
    try {
      await audioRecorderPlayer.resumePlayer();
      return true;
    } catch (error) {
      console.error('Failed to resume playback:', error);
      return false;
    }
  }, []);

  return {
    // Recording state
    isRecording,
    recordingDuration,
    currentRecordingId,

    // Playback state
    isPlaying,
    playbackDuration,

    // Recording controls
    startRecording,
    stopRecording,

    // Playback controls
    playRecording,
    stopPlayback,
    pausePlayback,
    resumePlayback,

    // Constants
    MAX_RECORDING_DURATION,
  };
}
