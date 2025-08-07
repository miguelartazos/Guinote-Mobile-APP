import { Platform } from 'react-native';
import type { VoiceRecordingId } from '../types/voice.types';

export type { VoiceRecordingId } from '../types/voice.types';

export type VoiceRecording = {
  id: VoiceRecordingId;
  playerId: string;
  filePath: string;
  timestamp: number;
  duration: number;
};

// In-memory storage for voice recordings during game session
let voiceRecordings: Map<VoiceRecordingId, VoiceRecording> = new Map();

// History settings
const MAX_HISTORY_SIZE = 5;
const HISTORY_CLEANUP_THRESHOLD = 10;

export function generateRecordingId(): VoiceRecordingId {
  return `voice_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}` as VoiceRecordingId;
}

export function getRecordingPath(recordingId: VoiceRecordingId): string {
  const extension = Platform.OS === 'ios' ? 'm4a' : 'mp4';
  // AudioRecorderPlayer will automatically prepend the correct directory path
  // when we provide just the filename
  return `${recordingId}.${extension}`;
}

export function saveRecording(recording: VoiceRecording): void {
  voiceRecordings.set(recording.id, recording);

  // Clean up old recordings if we exceed threshold
  if (voiceRecordings.size > HISTORY_CLEANUP_THRESHOLD) {
    cleanupOldRecordings();
  }
}

export function getRecording(
  recordingId: VoiceRecordingId,
): VoiceRecording & { uri: string } | undefined {
  const recording = voiceRecordings.get(recordingId);
  if (!recording) return undefined;
  return {
    ...recording,
    uri: recording.filePath,
  };
}

export function getAllRecordings(): VoiceRecording[] {
  return Array.from(voiceRecordings.values()).sort(
    (a, b) => b.timestamp - a.timestamp,
  );
}

export function deleteRecording(recordingId: VoiceRecordingId): void {
  voiceRecordings.delete(recordingId);
}

export function clearAllRecordings(): void {
  voiceRecordings.clear();
}

// Clear only history (keep current recordings)
export function clearVoiceHistory(): void {
  const allRecordings = getAllRecordings();
  if (allRecordings.length <= MAX_HISTORY_SIZE) {
    return; // Nothing to clear
  }

  // Keep only the most recent recordings
  const toKeep = allRecordings.slice(0, MAX_HISTORY_SIZE);
  voiceRecordings.clear();

  toKeep.forEach(recording => {
    voiceRecordings.set(recording.id, recording);
  });
}

// Get recordings for a specific player
export function getPlayerRecordings(playerId: string): VoiceRecording[] {
  return getAllRecordings().filter(rec => rec.playerId === playerId);
}

// Get recent recordings (default to history limit)
export function getRecentRecordings(
  limit: number = MAX_HISTORY_SIZE,
): VoiceRecording[] {
  return getAllRecordings().slice(0, limit);
}

// Get voice message history (last 5 messages)
export function getVoiceHistory(): VoiceRecording[] {
  return getRecentRecordings(MAX_HISTORY_SIZE);
}

// Clean up old recordings, keeping only the most recent ones
function cleanupOldRecordings(): void {
  const recentRecordings = getRecentRecordings(MAX_HISTORY_SIZE);
  const recentIds = new Set(recentRecordings.map(r => r.id));

  // Remove recordings not in recent list
  for (const [id] of voiceRecordings) {
    if (!recentIds.has(id)) {
      voiceRecordings.delete(id);
    }
  }
}

// Get history statistics
export function getHistoryStats(): {
  totalRecordings: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
} {
  const recordings = getAllRecordings();

  if (recordings.length === 0) {
    return {
      totalRecordings: 0,
      oldestTimestamp: null,
      newestTimestamp: null,
    };
  }

  return {
    totalRecordings: recordings.length,
    oldestTimestamp: recordings[recordings.length - 1].timestamp,
    newestTimestamp: recordings[0].timestamp,
  };
}
