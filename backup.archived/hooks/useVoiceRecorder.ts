import { useState, useCallback, useRef, useEffect } from 'react';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
} from 'react-native-audio-recorder-player';
import {
  generateRecordingId,
  saveRecording,
  getRecording,
  clearAllRecordings,
} from '../utils/voiceStorage';
import type { VoiceRecordingId, VoiceRecording } from '../utils/voiceStorage';
import {
  getVolumeMultiplier,
  getFadeMultiplier,
  PlaybackSpeed,
} from '../utils/audioProcessing';

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
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(
    PlaybackSpeed.NORMAL,
  );
  const [volume, setVolume] = useState(1.0); // 0 to 1
  const [error, setError] = useState<string | null>(null);
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
      } catch (err) {
        console.error('Failed to start recording:', err);
        setError('No se pudo iniciar la grabación');
        setIsRecording(false);
        setCurrentRecordingId(null);
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
      } catch (err: any) {
        // If it's just "no recorder instance", that's OK - already stopped
        if (err.message?.includes('No recorder instance')) {
          console.log('Recorder already stopped - this is OK');
        } else {
          throw err; // Re-throw other errors
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
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Error al detener la grabación');
      setIsRecording(false);
      isStoppingRef.current = false;
      return false;
    }
  }, [isRecording, currentRecordingId, recordingDuration]);

  const playRecording = useCallback(
    async (
      recordingId: VoiceRecordingId,
      options?: { speed?: PlaybackSpeed; volume?: number },
    ): Promise<boolean> => {
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

        // Set playback speed if provided
        if (options?.speed) {
          setPlaybackSpeed(options.speed);
          // Note: react-native-audio-recorder-player doesn't support speed adjustment
          console.warn(
            'Playback speed adjustment is not supported by the audio library',
          );
        }

        // Set volume if provided
        if (options?.volume !== undefined) {
          setVolume(options.volume);
          const normalizedVolume = getVolumeMultiplier(options.volume);
          await audioRecorderPlayer.setVolume(normalizedVolume);
        }

        // Play with the stored path directly
        const msg = await audioRecorderPlayer.startPlayer(recording.filePath);
        console.log('Playback started:', msg);

        setIsPlaying(true);
        setPlaybackDuration(0);

        // Update playback duration with fade effects
        audioRecorderPlayer.addPlayBackListener((e: any) => {
          setPlaybackDuration(e.currentPosition);

          // Apply fade in/out
          const fadeMultiplier = getFadeMultiplier(
            e.currentPosition,
            e.duration,
          );
          const volumeWithFade = volume * fadeMultiplier;
          audioRecorderPlayer.setVolume(volumeWithFade);

          // Auto-stop when finished
          if (e.currentPosition >= e.duration) {
            stopPlayback();
          }
        });

        return true;
      } catch (err) {
        console.error('Failed to play recording:', err);
        setError('Error al reproducir grabación');
        setIsPlaying(false);
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [volume],
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
    } catch (err) {
      console.error('Failed to stop playback:', err);
      setError('Error al detener reproducción');
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
    } catch (err) {
      console.error('Failed to pause playback:', err);
      return false;
    }
  }, [isPlaying]);

  const resumePlayback = useCallback(async (): Promise<boolean> => {
    try {
      await audioRecorderPlayer.resumePlayer();
      return true;
    } catch (err) {
      console.error('Failed to resume playback:', err);
      return false;
    }
  }, []);

  const changePlaybackSpeed = useCallback(
    async (speed: PlaybackSpeed): Promise<boolean> => {
      try {
        setPlaybackSpeed(speed);
        if (isPlaying) {
          // Note: react-native-audio-recorder-player doesn't support speed adjustment
          console.warn(
            'Playback speed adjustment is not supported by the audio library',
          );
        }
        return true;
      } catch (err) {
        console.error('Failed to change playback speed:', err);
        return false;
      }
    },
    [isPlaying],
  );

  const changeVolume = useCallback(
    async (newVolume: number): Promise<boolean> => {
      try {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolume(clampedVolume);
        if (isPlaying) {
          const normalizedVolume = getVolumeMultiplier(clampedVolume);
          await audioRecorderPlayer.setVolume(normalizedVolume);
        }
        return true;
      } catch (err) {
        console.error('Failed to change volume:', err);
        return false;
      }
    },
    [isPlaying],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Recording state
    isRecording,
    recordingDuration,
    currentRecordingId,

    // Playback state
    isPlaying,
    playbackDuration,
    playbackSpeed,
    volume,

    // Error state
    error,
    clearError,

    // Recording controls
    startRecording,
    stopRecording,

    // Playback controls
    playRecording,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    changePlaybackSpeed,
    changeVolume,

    // Constants
    MAX_RECORDING_DURATION,
  };
}
