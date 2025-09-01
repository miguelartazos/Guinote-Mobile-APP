import type { SpanishSuit, CardValue } from './cardTypes';

export type Brand<T, K> = T & { __brand: K };

export type CardId = Brand<string, 'CardId'>;
export type PlayerId = Brand<string, 'PlayerId'>;
export type GameId = Brand<string, 'GameId'>;
export type TeamId = Brand<string, 'TeamId'>;
export type TutorialStepId = Brand<string, 'TutorialStepId'>;
export type HelpSectionId = Brand<string, 'HelpSectionId'>;
export type TutorialType = Brand<'complete' | 'basic' | 'cantes' | 'special', 'TutorialType'>;

export type Card = {
  id: CardId;
  suit: SpanishSuit;
  value: CardValue;
};

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// Align with personalities used across the app
export type AIPersonality = 'aggressive' | 'prudent' | 'tricky';

export type Player = {
  id: PlayerId;
  name: string;
  avatar: string;
  ranking: number;
  teamId: TeamId;
  isBot: boolean;
  personality?: AIPersonality;
  difficulty?: DifficultyLevel;
};

export type GamePhase =
  | 'waiting' // For online multiplayer - waiting for players to join
  | 'dealing'
  | 'playing'
  | 'arrastre'
  | 'scoring'
  | 'gameOver'
  | 'finished'; // Legacy phase - same as gameOver

export type GameSet = 'buenas' | 'malas' | 'bella';

// Type for team array indices
export type TeamIndex = 0 | 1;

export type MatchScore = {
  // Partidas won in current coto
  team1Partidas: number;
  team2Partidas: number;

  // Cotos won in the match
  team1Cotos: number;
  team2Cotos: number;

  // Match configuration
  partidasPerCoto: number; // Default: 3 (first to win 3 partidas wins the coto)
  cotosPerMatch: number; // Default: 2 (first to win 2 cotos wins the match)

  // Legacy compatibility - will be deprecated
  team1Sets: number; // Maps to team1Partidas for backward compatibility
  team2Sets: number; // Maps to team2Partidas for backward compatibility
  currentSet: GameSet; // Keep for UI compatibility
};

export type TrickCard = {
  playerId: PlayerId;
  card: Card;
};

export type Cante = {
  teamId: TeamId;
  suit: SpanishSuit;
  points: 20 | 40;
  isVisible: boolean; // True for Veinte (20), False for Las Cuarenta (40)
};

export type Team = {
  id: TeamId;
  playerIds: [PlayerId, PlayerId];
  score: number;
  cardPoints: number; // Points from cards only (for 30 malas rule)
  cantes: Cante[];
};

export type GameState = Readonly<{
  id: GameId;
  phase: GamePhase;
  players: ReadonlyArray<Player>;
  teams: [Team, Team];
  deck: ReadonlyArray<Card>;
  hands: ReadonlyMap<PlayerId, ReadonlyArray<Card>>;
  pendingHands?: ReadonlyMap<PlayerId, ReadonlyArray<Card>>; // Cards to be dealt during animation
  trumpSuit: SpanishSuit;
  trumpCard: Card;
  currentTrick: ReadonlyArray<TrickCard>;
  currentPlayerIndex: number;
  dealerIndex: number; // Track dealer position
  trickCount: number; // Total tricks played
  trickWins: ReadonlyMap<TeamId, number>;
  collectedTricks: ReadonlyMap<PlayerId, ReadonlyArray<TrickCard[]>>; // Tricks won by each player
  teamTrickPiles: ReadonlyMap<TeamId, ReadonlyArray<TrickCard[]>>; // Tricks won by each team
  lastTrickWinner?: PlayerId;
  lastTrick?: ReadonlyArray<TrickCard>;
  canCambiar7: boolean;
  gameHistory: ReadonlyArray<GameAction>;
  isVueltas: boolean; // Second hand if no one reached 101
  initialScores?: ReadonlyMap<TeamId, number>; // Scores from first hand in vueltas
  lastTrickWinnerTeam?: TeamId; // Team that won the last trick (for vueltas declaration)
  canDeclareVictory: boolean; // True when in vueltas and team can declare
  lastActionTimestamp?: number; // Timestamp of last action for turn key uniqueness
  trickAnimating?: boolean; // True when showing trick collection animation
  pendingTrickWinner?: {
    playerId: PlayerId;
    points: number;
    cards: ReadonlyArray<Card>;
    teamId: TeamId; // Add team ID for animation target
    // True when this pending trick was the very last trick of the hand
    isLastTrick?: boolean;
    // Bonus points applied to this trick (e.g., +10 de últimas)
    bonus?: number;
  }; // Data for trick animation
  // Post-trick dealing overlay state
  postTrickDealingAnimating?: boolean;
  // True during the pause after trick collection and before overlay starts
  postTrickDealingPending?: boolean;
  pendingPostTrickDraws?: ReadonlyArray<{
    playerId: PlayerId;
    card: Card;
    source: 'deck' | 'trump';
  }>;
  matchScore?: MatchScore; // Track buenas/malas sets
  // Card play animation state
  cardPlayAnimation?: {
    playerId: PlayerId;
    card: Card;
    cardIndex: number;
  };
  pendingVueltas?: boolean; // True when game should continue to vueltas after celebration
}>;

export type GameAction =
  | { type: 'DEAL_CARDS' }
  | { type: 'PLAY_CARD'; playerId: PlayerId; cardId: CardId }
  | { type: 'CANTAR'; playerId: PlayerId; suit: SpanishSuit }
  | { type: 'CAMBIAR_7'; playerId: PlayerId }
  | { type: 'END_TRICK'; winnerId: PlayerId }
  | { type: 'END_GAME'; winningTeamId: TeamId };

export type GameResult = {
  winningTeam: TeamId;
  finalScores: Map<TeamId, number>;
  duration: number;
};

export const CARD_POINTS: Record<CardValue, number> = {
  1: 11, // As
  3: 10, // Tres
  12: 4, // Rey
  10: 3, // Sota
  11: 2, // Caballo
  7: 0,
  6: 0,
  5: 0,
  4: 0,
  2: 0,
};

export const WINNING_SCORE = 101;
export const MINIMUM_CARD_POINTS = 30; // 30 malas rule
export const LAST_TRICK_BONUS = 10; // diez de últimas

// Re-export GameMove types
export type { GameMove } from './gameMove.types';
