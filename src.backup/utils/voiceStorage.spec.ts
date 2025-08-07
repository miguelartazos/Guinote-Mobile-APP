import { describe, expect, test, beforeEach } from '@jest/globals';
import {
  generateRecordingId,
  getRecordingPath,
  saveRecording,
  getRecording,
  getAllRecordings,
  deleteRecording,
  clearAllRecordings,
  getPlayerRecordings,
  getRecentRecordings,
} from './voiceStorage';
import type { VoiceRecording, VoiceRecordingId } from './voiceStorage';
import { Platform } from 'react-native';

describe('voiceStorage', () => {
  beforeEach(() => {
    clearAllRecordings();
  });

  describe('generateRecordingId', () => {
    test('generates unique IDs', () => {
      const id1 = generateRecordingId();
      const id2 = generateRecordingId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^voice_\d+_[a-z0-9]+$/);
    });
  });

  describe('getRecordingPath', () => {
    test('returns m4a extension for iOS', () => {
      Platform.OS = 'ios';
      const path = getRecordingPath('voice_123' as VoiceRecordingId);
      expect(path).toBe('voice_123.m4a');
    });

    test('returns mp4 extension for Android', () => {
      Platform.OS = 'android';
      const path = getRecordingPath('voice_123' as VoiceRecordingId);
      expect(path).toBe('voice_123.mp4');
    });
  });

  describe('recording operations', () => {
    const mockRecording: VoiceRecording = {
      id: 'voice_123' as VoiceRecordingId,
      playerId: 'player1',
      filePath: 'voice_123.m4a',
      timestamp: Date.now(),
      duration: 3500,
    };

    test('saves and retrieves recording', () => {
      saveRecording(mockRecording);
      const retrieved = getRecording(mockRecording.id);
      expect(retrieved).toEqual(mockRecording);
    });

    test('returns undefined for non-existent recording', () => {
      const retrieved = getRecording('voice_999' as VoiceRecordingId);
      expect(retrieved).toBeUndefined();
    });

    test('deletes recording', () => {
      saveRecording(mockRecording);
      deleteRecording(mockRecording.id);
      const retrieved = getRecording(mockRecording.id);
      expect(retrieved).toBeUndefined();
    });

    test('gets all recordings sorted by timestamp', () => {
      const recording1 = {
        ...mockRecording,
        id: 'voice_1' as VoiceRecordingId,
        timestamp: 1000,
      };
      const recording2 = {
        ...mockRecording,
        id: 'voice_2' as VoiceRecordingId,
        timestamp: 2000,
      };
      const recording3 = {
        ...mockRecording,
        id: 'voice_3' as VoiceRecordingId,
        timestamp: 1500,
      };

      saveRecording(recording1);
      saveRecording(recording2);
      saveRecording(recording3);

      const all = getAllRecordings();
      expect(all).toHaveLength(3);
      expect(all[0].id).toBe('voice_2');
      expect(all[1].id).toBe('voice_3');
      expect(all[2].id).toBe('voice_1');
    });

    test('clears all recordings', () => {
      saveRecording(mockRecording);
      saveRecording({ ...mockRecording, id: 'voice_456' as VoiceRecordingId });

      clearAllRecordings();
      const all = getAllRecordings();
      expect(all).toHaveLength(0);
    });

    test('gets recordings for specific player', () => {
      const player1Recording = { ...mockRecording, playerId: 'player1' };
      const player2Recording = {
        ...mockRecording,
        id: 'voice_456' as VoiceRecordingId,
        playerId: 'player2',
      };

      saveRecording(player1Recording);
      saveRecording(player2Recording);

      const playerRecordings = getPlayerRecordings('player1');
      expect(playerRecordings).toHaveLength(1);
      expect(playerRecordings[0].playerId).toBe('player1');
    });

    test('gets recent recordings with limit', () => {
      for (let i = 0; i < 15; i++) {
        saveRecording({
          ...mockRecording,
          id: `voice_${i}` as VoiceRecordingId,
          timestamp: Date.now() - i * 1000,
        });
      }

      const recent5 = getRecentRecordings(5);
      expect(recent5).toHaveLength(5);
      expect(recent5[0].id).toBe('voice_0');
      expect(recent5[4].id).toBe('voice_4');

      const recentDefault = getRecentRecordings();
      expect(recentDefault).toHaveLength(5); // Changed to match MAX_HISTORY_SIZE
    });
  });
});
