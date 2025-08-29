import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState } from '../types/game.types';

const STORAGE_KEYS = {
  CURRENT_GAME_STATE: '@guinote/current_game_state',
  HAS_SAVED_GAME: '@guinote/has_saved_game',
};

export async function saveGameState(gameState: GameState): Promise<void> {
  try {
    // Convert Maps to serializable objects
    const serializedState = {
      ...gameState,
      hands: Object.fromEntries(gameState.hands),
      trickWins: Object.fromEntries(gameState.trickWins),
      collectedTricks: Object.fromEntries(gameState.collectedTricks),
      teamTrickPiles: Object.fromEntries(gameState.teamTrickPiles),
      initialScores: gameState.initialScores
        ? Object.fromEntries(gameState.initialScores)
        : undefined,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_GAME_STATE, JSON.stringify(serializedState));
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_SAVED_GAME, 'true');
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export async function loadGameState(): Promise<GameState | null> {
  try {
    const hasSavedGame = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SAVED_GAME);
    if (hasSavedGame !== 'true') {
      return null;
    }

    const savedState = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_GAME_STATE);
    if (!savedState) {
      return null;
    }

    const parsedState = JSON.parse(savedState);

    // Convert objects back to Maps
    return {
      ...parsedState,
      hands: new Map(Object.entries(parsedState.hands)),
      trickWins: new Map(Object.entries(parsedState.trickWins)),
      collectedTricks: new Map(Object.entries(parsedState.collectedTricks || {})),
      teamTrickPiles: new Map(Object.entries(parsedState.teamTrickPiles || {})),
      initialScores: parsedState.initialScores
        ? new Map(Object.entries(parsedState.initialScores))
        : undefined,
    } as GameState;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

export async function clearGameState(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEYS.CURRENT_GAME_STATE, STORAGE_KEYS.HAS_SAVED_GAME]);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

export async function hasSavedGame(): Promise<boolean> {
  try {
    const result = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SAVED_GAME);
    return result === 'true';
  } catch (error) {
    console.error('Failed to check saved game:', error);
    return false;
  }
}
