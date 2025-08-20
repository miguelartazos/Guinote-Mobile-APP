import type { Brand } from '../types/game.types';
import type { VoiceRecordingId } from './voiceStorage';

export type VoiceReactionId = Brand<string, 'VoiceReactionId'>;

export type VoiceReaction = {
  id: VoiceReactionId;
  recordingId: VoiceRecordingId;
  playerId: string;
  reactionType: ReactionType;
  timestamp: number;
};

export type ReactionType = '👍' | '😂' | '😮' | '👏' | '❤️';

export const AVAILABLE_REACTIONS: ReactionType[] = ['👍', '😂', '😮', '👏', '❤️'];

// In-memory storage for voice reactions
const voiceReactions: Map<VoiceRecordingId, VoiceReaction[]> = new Map();

export function generateReactionId(): VoiceReactionId {
  return `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as VoiceReactionId;
}

export function addReaction(
  recordingId: VoiceRecordingId,
  playerId: string,
  reactionType: ReactionType,
): VoiceReactionId {
  const reactionId = generateReactionId();
  const reaction: VoiceReaction = {
    id: reactionId,
    recordingId,
    playerId,
    reactionType,
    timestamp: Date.now(),
  };

  const existingReactions = voiceReactions.get(recordingId) || [];

  // Remove any existing reaction from this player for this recording
  const filteredReactions = existingReactions.filter(r => r.playerId !== playerId);

  // Add the new reaction
  filteredReactions.push(reaction);
  voiceReactions.set(recordingId, filteredReactions);

  return reactionId;
}

export function removeReaction(recordingId: VoiceRecordingId, playerId: string): boolean {
  const reactions = voiceReactions.get(recordingId);
  if (!reactions) return false;

  const initialLength = reactions.length;
  const filteredReactions = reactions.filter(r => r.playerId !== playerId);

  if (filteredReactions.length === initialLength) {
    return false; // No reaction was removed
  }

  if (filteredReactions.length === 0) {
    voiceReactions.delete(recordingId);
  } else {
    voiceReactions.set(recordingId, filteredReactions);
  }

  return true;
}

export function getReactions(recordingId: VoiceRecordingId): VoiceReaction[] {
  return voiceReactions.get(recordingId) || [];
}

export function getPlayerReaction(
  recordingId: VoiceRecordingId,
  playerId: string,
): VoiceReaction | undefined {
  const reactions = voiceReactions.get(recordingId) || [];
  return reactions.find(r => r.playerId === playerId);
}

export function hasPlayerReacted(recordingId: VoiceRecordingId, playerId: string): boolean {
  return getPlayerReaction(recordingId, playerId) !== undefined;
}

export function getReactionCounts(recordingId: VoiceRecordingId): Record<ReactionType, number> {
  const reactions = voiceReactions.get(recordingId) || [];
  const counts: Record<ReactionType, number> = {
    '👍': 0,
    '😂': 0,
    '😮': 0,
    '👏': 0,
    '❤️': 0,
  };

  reactions.forEach(reaction => {
    counts[reaction.reactionType]++;
  });

  return counts;
}

export function getMostPopularReaction(recordingId: VoiceRecordingId): ReactionType | null {
  const counts = getReactionCounts(recordingId);
  let maxCount = 0;
  let mostPopular: ReactionType | null = null;

  Object.entries(counts).forEach(([reaction, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostPopular = reaction as ReactionType;
    }
  });

  return maxCount > 0 ? mostPopular : null;
}

export function clearReactions(recordingId: VoiceRecordingId): void {
  voiceReactions.delete(recordingId);
}

export function clearAllReactions(): void {
  voiceReactions.clear();
}
