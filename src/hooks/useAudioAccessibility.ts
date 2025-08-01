import { useEffect, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSounds } from './useSounds';
import { useGameSettings } from './useGameSettings';
import type { GameState, Card } from '../types/game.types';

export function useAudioAccessibility(gameState: GameState | null) {
  const { settings } = useGameSettings();
  const {
    playCardSound,
    playTurnSound,
    playCanteSound,
    playTrickCollectSound,
    playReactionSound,
  } = useSounds();

  // Announce card information when screen reader is active
  const announceCard = useCallback(
    (card: Card) => {
      if (!settings?.accessibilityAudioCues) return;

      AccessibilityInfo.announceForAccessibility(
        `${getCardName(card.value)} de ${getSuitName(card.suit)}`,
      );
    },
    [settings?.accessibilityAudioCues],
  );

  // Announce game state changes
  const announceGameState = useCallback(
    (message: string) => {
      if (!settings?.accessibilityAudioCues) return;

      AccessibilityInfo.announceForAccessibility(message);
    },
    [settings?.accessibilityAudioCues],
  );

  // Play enhanced audio cues for important events
  const playAccessibilityCue = useCallback(
    async (event: 'turn' | 'card_played' | 'trick_won' | 'cante') => {
      if (!settings?.accessibilityAudioCues) return;

      switch (event) {
        case 'turn':
          await playTurnSound();
          await new Promise(resolve => setTimeout(resolve, 100));
          await playTurnSound(); // Double beep for turn notification
          break;
        case 'card_played':
          await playCardSound();
          break;
        case 'trick_won':
          await playTrickCollectSound();
          await new Promise(resolve => setTimeout(resolve, 200));
          await playReactionSound('bien');
          break;
        case 'cante':
          await playCanteSound(20); // Simplified for accessibility
          break;
      }
    },
    [
      settings?.accessibilityAudioCues,
      playTurnSound,
      playCardSound,
      playTrickCollectSound,
      playReactionSound,
      playCanteSound,
    ],
  );

  // Monitor game state for accessibility announcements
  useEffect(() => {
    if (!gameState || !settings?.accessibilityAudioCues) return;

    // Announce current player's turn
    if (gameState.currentPlayerIndex === 0) {
      announceGameState('Tu turno');
      playAccessibilityCue('turn');
    }

    // Announce trump suit at game start
    if (gameState.phase === 'playing' && gameState.trump) {
      announceGameState(`Triunfo: ${getSuitName(gameState.trump)}`);
    }

    // Announce cantes
    if (gameState.cantes.length > 0) {
      const lastCante = gameState.cantes[gameState.cantes.length - 1];
      announceGameState(`Cante de ${lastCante.points} puntos`);
      playAccessibilityCue('cante');
    }
  }, [
    gameState,
    settings?.accessibilityAudioCues,
    announceGameState,
    playAccessibilityCue,
  ]);

  return {
    announceCard,
    announceGameState,
    playAccessibilityCue,
  };
}

// Helper functions for card names in Spanish
function getCardName(value: string): string {
  const names: Record<string, string> = {
    '1': 'As',
    '3': 'Tres',
    '12': 'Rey',
    '11': 'Caballo',
    '10': 'Sota',
    '7': 'Siete',
    '6': 'Seis',
    '5': 'Cinco',
    '4': 'Cuatro',
    '2': 'Dos',
  };
  return names[value] || value;
}

function getSuitName(suit: string): string {
  const suits: Record<string, string> = {
    oros: 'Oros',
    copas: 'Copas',
    espadas: 'Espadas',
    bastos: 'Bastos',
  };
  return suits[suit] || suit;
}
