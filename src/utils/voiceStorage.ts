import { Platform } from 'react-native';
import type { Brand } from '../types/game.types';

export type VoiceRecordingId = Brand<string, 'VoiceRecordingId'>;

export type VoiceRecording = {
  id: VoiceRecordingId;
  playerId: string;
  filePath: string;
  timestamp: number;
  duration: number;
};

// In-memory storage for voice recordings during game session
let voiceRecordings: Map<VoiceRecordingId, VoiceRecording> = new Map();

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
}

export function getRecording(
  recordingId: VoiceRecordingId,
): VoiceRecording | undefined {
  return voiceRecordings.get(recordingId);
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

// Get recordings for a specific player
export function getPlayerRecordings(playerId: string): VoiceRecording[] {
  return getAllRecordings().filter(rec => rec.playerId === playerId);
}

// Get recent recordings (last 10)
export function getRecentRecordings(limit: number = 10): VoiceRecording[] {
  return getAllRecordings().slice(0, limit);
}
