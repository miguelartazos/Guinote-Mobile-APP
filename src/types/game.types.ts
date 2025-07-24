import type { SpanishSuit, CardValue } from '../components/game/SpanishCard';

type Brand<T, K> = T & { __brand: K };

export type CardId = Brand<string, 'CardId'>;
export type PlayerId = Brand<string, 'PlayerId'>;
export type GameId = Brand<string, 'GameId'>;
export type TeamId = Brand<string, 'TeamId'>;

export type Card = {
  id: CardId;
  suit: SpanishSuit;
  value: CardValue;
};

export type Player = {
  id: PlayerId;
  name: string;
  avatar: string;
  ranking: number;
  teamId: TeamId;
  isBot: boolean;
};

export type GamePhase =
  | 'dealing'
  | 'playing'
  | 'arrastre'
  | 'cantar'
  | 'scoring'
  | 'gameOver';

export type TrickCard = {
  playerId: PlayerId;
  card: Card;
};

export type Cante = {
  teamId: TeamId;
  suit: SpanishSuit;
  points: 20 | 40;
};

export type Team = {
  id: TeamId;
  playerIds: [PlayerId, PlayerId];
  score: number;
  cantes: Cante[];
};

export type GameState = Readonly<{
  id: GameId;
  phase: GamePhase;
  players: ReadonlyArray<Player>;
  teams: [Team, Team];
  deck: ReadonlyArray<Card>;
  hands: ReadonlyMap<PlayerId, ReadonlyArray<Card>>;
  trumpSuit: SpanishSuit;
  trumpCard: Card;
  currentTrick: ReadonlyArray<TrickCard>;
  currentPlayerIndex: number;
  trickWins: ReadonlyMap<TeamId, number>;
  lastTrickWinner?: PlayerId;
  lastTrick?: ReadonlyArray<TrickCard>;
  canCambiar7: boolean;
  gameHistory: ReadonlyArray<GameAction>;
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
  11: 3, // Caballo
  10: 2, // Sota
  7: 0,
  6: 0,
  5: 0,
  4: 0,
  2: 0,
};

export const WINNING_SCORE = 101;
