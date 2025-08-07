import type { Brand } from '../types/game.types';

export type QuickVoiceMessageId = Brand<string, 'QuickVoiceMessageId'>;

export type QuickVoiceMessage = {
  id: QuickVoiceMessageId;
  text: string;
  emoji: string;
  audioText: string; // Text for text-to-speech
  category: 'encouragement' | 'celebration' | 'game' | 'reaction';
};

export const QUICK_VOICE_MESSAGES: QuickVoiceMessage[] = [
  {
    id: 'buena_jugada' as QuickVoiceMessageId,
    text: '¡Buena jugada!',
    emoji: '👏',
    audioText: 'Buena jugada',
    category: 'encouragement',
  },
  {
    id: 'vamos_equipo' as QuickVoiceMessageId,
    text: '¡Vamos equipo!',
    emoji: '💪',
    audioText: 'Vamos equipo',
    category: 'encouragement',
  },
  {
    id: 'canto' as QuickVoiceMessageId,
    text: '¡Canto!',
    emoji: '🎵',
    audioText: 'Canto',
    category: 'game',
  },
  {
    id: 'que_suerte' as QuickVoiceMessageId,
    text: '¡Qué suerte!',
    emoji: '🍀',
    audioText: 'Qué suerte',
    category: 'reaction',
  },
  {
    id: 'bien_hecho' as QuickVoiceMessageId,
    text: '¡Bien hecho!',
    emoji: '✨',
    audioText: 'Bien hecho',
    category: 'celebration',
  },
  {
    id: 'ole' as QuickVoiceMessageId,
    text: '¡Olé!',
    emoji: '🔥',
    audioText: 'Olé',
    category: 'celebration',
  },
];

export function getQuickMessageById(
  id: QuickVoiceMessageId,
): QuickVoiceMessage | undefined {
  return QUICK_VOICE_MESSAGES.find(msg => msg.id === id);
}

export function getMessagesByCategory(
  category: QuickVoiceMessage['category'],
): QuickVoiceMessage[] {
  return QUICK_VOICE_MESSAGES.filter(msg => msg.category === category);
}

export function getAllCategories(): QuickVoiceMessage['category'][] {
  return [...new Set(QUICK_VOICE_MESSAGES.map(msg => msg.category))];
}
