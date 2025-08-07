import type { PlayerId, TeamId, GameId, CardId } from '../types/game.types';

// Player ID constants
export const HUMAN_PLAYER_ID = 'player' as PlayerId;
export const AI_FALLBACK_ID = 'ai' as PlayerId;
export const BOT_ID_PREFIX = 'bot';

// Generate bot IDs
export const BOT_IDS = {
  BOT1: 'bot1' as PlayerId,
  BOT2: 'bot2' as PlayerId,
  BOT3: 'bot3' as PlayerId,
} as const;

// Team ID constants
export const TEAM_IDS = {
  TEAM1: 'team1' as TeamId,
  TEAM2: 'team2' as TeamId,
} as const;

// Card ID constants
export const TRUMP_CARD_ID = 'trump_card' as CardId;

// Game timing constants
export const AI_TIMING = {
  MIN_THINKING_TIME: 200, // Further reduced for snappier gameplay
  MAX_THINKING_TIME: 1200, // Reduced to prevent stuck states
  RECOVERY_TIMEOUT: 2000, // 2 seconds - aggressive recovery
  COMPLEXITY_BONUS: 200, // Minimal bonus to prevent delays
} as const;

// Game rules constants
export const GAME_RULES = {
  CARDS_PER_PLAYER: 6,
  TOTAL_PLAYERS: 4,
  WINNING_SCORE: 101,
  MINIMUM_CARD_POINTS: 30, // 30 malas
  LAST_TRICK_BONUS: 10, // diez de últimas
  CANTE_VEINTE: 20,
  CANTE_CUARENTA: 40,
} as const;

// AI thresholds
export const AI_DECISION_THRESHOLDS = {
  VALUABLE_TRICK: 10,
  HIGH_VALUE_TRICK: 15,
  LOW_POWER_CARD: 5,
  MANY_CARDS_LEFT: 20,
  LOW_VALUE_TRICK: 5,
  CANTE_AHEAD_THRESHOLD: 40,
  CANTE_BEHIND_THRESHOLD: -20,
  CANTE_FAR_BEHIND_THRESHOLD: -30,
  CANTE_DECK_THRESHOLD: 15,
  CANTE_FEW_CARDS: 8,
} as const;

// AI probability constants
export const AI_PROBABILITIES = {
  DUCK_LOW_TRICK: 0.5,
  AGGRESSIVE_CANTE: 0.8,
  AGGRESSIVE_TRUMP: 0.15, // Reduced from 0.7 - only 15% chance
  TRICKY_RANDOM: 0.3,
  TRICKY_CANTE: 0.6,
  SAVE_TRUMP_DRAW: 0.85, // 85% chance to save trumps in draw phase
  SAVE_TRUMP_EARLY: 0.7, // 70% chance to save trumps early game
} as const;

// Default AI personalities and names
export const AI_PERSONALITIES = {
  BOT1: {
    name: 'Ana la Prudente',
    personality: 'prudent' as const,
    avatar: '👩',
    ranking: 6780,
  },
  BOT2: {
    name: 'Carlos el Valiente',
    personality: 'aggressive' as const,
    avatar: '👨',
    ranking: 255,
  },
  BOT3: {
    name: 'María la Astuta',
    personality: 'tricky' as const,
    avatar: '👩‍🦰',
    ranking: 16163,
  },
} as const;

// Helper function to generate game ID
export function generateGameId(): GameId {
  return `game_${Date.now()}` as GameId;
}

// Helper function to generate card ID
export function generateCardId(suit: string, value: number): CardId {
  return `${suit}_${value}` as CardId;
}
