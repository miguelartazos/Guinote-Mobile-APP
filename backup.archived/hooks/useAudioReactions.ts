import { useEffect, useRef, useCallback } from 'react';
import { useSounds } from './useSounds';
import type { ReactionSoundType } from '../utils/soundAssets';
import { REACTION_TO_AUDIO_MAP } from '../utils/soundAssets';
import type { GameState, Card, PlayerId } from '../types/game.types';
import type { ReactionType } from '../utils/voiceReactions';

type GameEvent = {
  type: 'cante' | 'good_play' | 'trick_won' | 'game_won' | 'reaction_pressed';
  playerId: PlayerId;
  data?: any;
};

export function useAudioReactions(gameState: GameState | null) {
  const {
    playReactionSound,
    playCanteSound,
    playVictorySound,
    playDefeatSound,
  } = useSounds();
  const lastGameStateRef = useRef<GameState | null>(null);
  const eventQueueRef = useRef<GameEvent[]>([]);
  const isProcessingRef = useRef(false);

  // Play reaction sound when emoji reaction is pressed
  const playReactionForEmoji = useCallback(
    (reactionType: ReactionType) => {
      const audioType = REACTION_TO_AUDIO_MAP[reactionType];
      if (audioType) {
        playReactionSound(audioType);
      }
    },
    [playReactionSound],
  );

  // Process game events queue
  const processEventQueue = useCallback(async () => {
    if (isProcessingRef.current || eventQueueRef.current.length === 0) return;

    isProcessingRef.current = true;
    const event = eventQueueRef.current.shift();

    if (event) {
      switch (event.type) {
        case 'cante':
          await playCanteSound(event.data.points);
          await new Promise(resolve => setTimeout(resolve, 500));
          await playReactionSound('ole');
          break;

        case 'good_play':
          // Random positive reaction for good plays
          const goodReactions: ReactionSoundType[] = [
            'bien',
            'ole',
            'applause',
          ];
          const randomGood =
            goodReactions[Math.floor(Math.random() * goodReactions.length)];
          await playReactionSound(randomGood);
          break;

        case 'trick_won':
          // 30% chance of reaction when winning a trick
          if (Math.random() < 0.3) {
            await playReactionSound('bien');
          }
          break;

        case 'game_won':
          await playVictorySound();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await playReactionSound('applause');
          break;

        case 'reaction_pressed':
          playReactionForEmoji(event.data.reactionType);
          break;
      }
    }

    isProcessingRef.current = false;

    // Process next event if any
    if (eventQueueRef.current.length > 0) {
      setTimeout(processEventQueue, 100);
    }
  }, [
    playCanteSound,
    playReactionSound,
    playVictorySound,
    playReactionForEmoji,
  ]);

  // Detect game events from state changes
  useEffect(() => {
    if (!gameState || !lastGameStateRef.current) {
      lastGameStateRef.current = gameState;
      return;
    }

    const oldState = lastGameStateRef.current;
    const newState = gameState;

    // Check for cantes - aggregate from both teams
    const oldCantes = [
      ...oldState.teams[0].cantes,
      ...oldState.teams[1].cantes,
    ];
    const newCantes = [
      ...newState.teams[0].cantes,
      ...newState.teams[1].cantes,
    ];

    if (newCantes.length > oldCantes.length) {
      // Find the new cante by comparing arrays
      const latestCante = newCantes[newCantes.length - 1];
      // Find which team made the cante
      const canteTeamIndex = newState.teams.findIndex(
        team => team.cantes.includes(latestCante)
      );
      const canteTeam = newState.teams[canteTeamIndex];
      // Use first player from the team that made the cante
      const playerId = canteTeam.playerIds[0];
      
      eventQueueRef.current.push({
        type: 'cante',
        playerId,
        data: { points: latestCante.points },
      });
    }

    // Check for trick completion
    if (
      oldState.currentTrick.length === 4 &&
      newState.currentTrick.length === 0
    ) {
      // Use lastTrickWinner from the new state
      const winner = newState.lastTrickWinner;
      if (winner) {
        eventQueueRef.current.push({
          type: 'trick_won',
          playerId: winner,
        });

        // Check if it was a good play (high value trick)
        const trickValue = oldState.currentTrick.reduce((sum, trickCard) => {
          return sum + getCardValue(trickCard.card);
        }, 0);

        if (trickValue >= 30) {
          eventQueueRef.current.push({
            type: 'good_play',
            playerId: winner,
          });
        }
      }
    }

    // Check for game end
    if (oldState.phase !== 'finished' && newState.phase === 'finished') {
      const team1Score = newState.teams[0].score;
      const team2Score = newState.teams[1].score;
      const winningTeam = team1Score > team2Score ? 0 : 1;
      const winner = newState.teams[winningTeam].playerIds[0];
      eventQueueRef.current.push({
        type: 'game_won',
        playerId: winner,
      });
    }

    lastGameStateRef.current = newState;
    processEventQueue();
  }, [gameState, processEventQueue]);

  // Return function to trigger reaction sounds manually
  return {
    playReactionForEmoji,
    triggerGameEvent: (event: GameEvent) => {
      eventQueueRef.current.push(event);
      processEventQueue();
    },
  };
}

// Helper function to get card value for determining "good plays"
function getCardValue(card: Card): number {
  const values: Record<string, number> = {
    '1': 11,
    '3': 10,
    '12': 4,
    '11': 3,
    '10': 2,
    '7': 0,
    '6': 0,
    '5': 0,
    '4': 0,
    '2': 0,
  };
  return values[card.value] || 0;
}
