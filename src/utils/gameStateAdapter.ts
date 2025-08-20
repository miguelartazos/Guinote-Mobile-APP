import type {
  GameState,
  Card,
  CardId,
  PlayerId,
  TeamId,
  Player,
  Team,
  TrickCard,
  Cante,
  GamePhase,
  MatchScore,
} from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';

// Serializable version of GameState for database storage
export interface SerializedGameState {
  id: string;
  phase: string;
  players: SerializedPlayer[];
  teams: SerializedTeam[];
  deck: SerializedCard[];
  hands: { [playerId: string]: SerializedCard[] };
  trumpSuit: string;
  trumpCard: SerializedCard;
  currentTrick: SerializedTrickCard[];
  currentPlayerIndex: number;
  dealerIndex: number;
  trickCount: number;
  trickWins: { [teamId: string]: number };
  collectedTricks: { [playerId: string]: SerializedTrickCard[][] };
  lastTrickWinner?: string;
  lastTrick?: SerializedTrickCard[];
  canCambiar7: boolean;
  isVueltas: boolean;
  initialScores?: { [teamId: string]: number };
  lastTrickWinnerTeam?: string;
  canDeclareVictory: boolean;
  lastActionTimestamp?: number;
  matchScore?: MatchScore;
  trickAnimating?: boolean;
  pendingTrickWinner?: {
    playerId: string;
    points: number;
    cards: SerializedCard[];
  };
}

interface SerializedCard {
  id: string;
  suit: string;
  value: number;
}

interface SerializedPlayer {
  id: string;
  name: string;
  avatar: string;
  ranking: number;
  teamId: string;
  isBot: boolean;
  personality?: string;
  difficulty?: string;
}

interface SerializedTeam {
  id: string;
  playerIds: [string, string];
  score: number;
  cardPoints: number;
  cantes: Cante[];
}

interface SerializedTrickCard {
  playerId: string;
  card: SerializedCard;
}

// Serialize a Card
function serializeCard(card: Card): SerializedCard {
  return {
    id: card.id,
    suit: card.suit,
    value: card.value,
  };
}

// Deserialize a Card
function deserializeCard(card: SerializedCard): Card {
  return {
    id: card.id as CardId,
    suit: card.suit as SpanishSuit,
    value: card.value as CardValue,
  };
}

// Serialize a Player
function serializePlayer(player: Player): SerializedPlayer {
  return {
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    ranking: player.ranking,
    teamId: player.teamId,
    isBot: player.isBot,
    personality: player.personality,
    difficulty: player.difficulty,
  };
}

// Deserialize a Player
function deserializePlayer(player: SerializedPlayer): Player {
  return {
    id: player.id as PlayerId,
    name: player.name,
    avatar: player.avatar,
    ranking: player.ranking,
    teamId: player.teamId as TeamId,
    isBot: player.isBot,
    personality: player.personality as any,
    difficulty: player.difficulty as any,
  };
}

// Serialize a Team
function serializeTeam(team: Team): SerializedTeam {
  return {
    id: team.id,
    playerIds: team.playerIds,
    score: team.score,
    cardPoints: team.cardPoints,
    cantes: team.cantes,
  };
}

// Deserialize a Team
function deserializeTeam(team: SerializedTeam): Team {
  return {
    id: team.id as TeamId,
    playerIds: team.playerIds as [PlayerId, PlayerId],
    score: team.score,
    cardPoints: team.cardPoints,
    cantes: team.cantes,
  };
}

// Serialize a TrickCard
function serializeTrickCard(trickCard: TrickCard): SerializedTrickCard {
  return {
    playerId: trickCard.playerId,
    card: serializeCard(trickCard.card),
  };
}

// Deserialize a TrickCard
function deserializeTrickCard(trickCard: SerializedTrickCard): TrickCard {
  return {
    playerId: trickCard.playerId as PlayerId,
    card: deserializeCard(trickCard.card),
  };
}

// Main serialization function
export function serializeGameState(gameState: GameState): SerializedGameState {
  // Convert hands Map to object
  const hands: { [playerId: string]: SerializedCard[] } = {};
  gameState.hands.forEach((cards, playerId) => {
    hands[playerId] = cards.map(serializeCard);
  });

  // Convert trickWins Map to object
  const trickWins: { [teamId: string]: number } = {};
  gameState.trickWins.forEach((wins, teamId) => {
    trickWins[teamId] = wins;
  });

  // Convert collectedTricks Map to object
  const collectedTricks: { [playerId: string]: SerializedTrickCard[][] } = {};
  gameState.collectedTricks.forEach((tricks, playerId) => {
    collectedTricks[playerId] = tricks.map(trick => trick.map(serializeTrickCard));
  });

  // Convert initialScores Map to object if exists
  const initialScores: { [teamId: string]: number } | undefined = gameState.initialScores
    ? Object.fromEntries(gameState.initialScores)
    : undefined;

  return {
    id: gameState.id,
    phase: gameState.phase,
    players: gameState.players.map(serializePlayer),
    teams: gameState.teams.map(serializeTeam),
    deck: gameState.deck.map(serializeCard),
    hands,
    trumpSuit: gameState.trumpSuit,
    trumpCard: serializeCard(gameState.trumpCard),
    currentTrick: gameState.currentTrick.map(serializeTrickCard),
    currentPlayerIndex: gameState.currentPlayerIndex,
    dealerIndex: gameState.dealerIndex,
    trickCount: gameState.trickCount,
    trickWins,
    collectedTricks,
    lastTrickWinner: gameState.lastTrickWinner,
    lastTrick: gameState.lastTrick?.map(serializeTrickCard),
    canCambiar7: gameState.canCambiar7,
    isVueltas: gameState.isVueltas,
    initialScores,
    lastTrickWinnerTeam: gameState.lastTrickWinnerTeam,
    canDeclareVictory: gameState.canDeclareVictory,
    lastActionTimestamp: gameState.lastActionTimestamp,
    matchScore: gameState.matchScore,
    trickAnimating: gameState.trickAnimating,
    pendingTrickWinner: gameState.pendingTrickWinner
      ? {
          playerId: gameState.pendingTrickWinner.playerId,
          points: gameState.pendingTrickWinner.points,
          cards: gameState.pendingTrickWinner.cards.map(serializeCard),
        }
      : undefined,
  };
}

// Main deserialization function
export function deserializeGameState(serialized: SerializedGameState): GameState {
  // Convert hands object to Map
  const hands = new Map<PlayerId, ReadonlyArray<Card>>();
  Object.entries(serialized.hands).forEach(([playerId, cards]) => {
    hands.set(playerId as PlayerId, cards.map(deserializeCard));
  });

  // Convert trickWins object to Map
  const trickWins = new Map<TeamId, number>();
  Object.entries(serialized.trickWins).forEach(([teamId, wins]) => {
    trickWins.set(teamId as TeamId, wins);
  });

  // Convert collectedTricks object to Map
  const collectedTricks = new Map<PlayerId, ReadonlyArray<TrickCard[]>>();
  Object.entries(serialized.collectedTricks).forEach(([playerId, tricks]) => {
    collectedTricks.set(
      playerId as PlayerId,
      tricks.map(trick => trick.map(deserializeTrickCard)),
    );
  });

  // Convert initialScores object to Map if exists
  const initialScores = serialized.initialScores
    ? new Map(Object.entries(serialized.initialScores) as Array<[TeamId, number]>)
    : undefined;

  return {
    id: serialized.id as any,
    phase: serialized.phase as GamePhase,
    players: serialized.players.map(deserializePlayer),
    teams: serialized.teams.map(deserializeTeam) as [Team, Team],
    deck: serialized.deck.map(deserializeCard),
    hands,
    trumpSuit: serialized.trumpSuit as SpanishSuit,
    trumpCard: deserializeCard(serialized.trumpCard),
    currentTrick: serialized.currentTrick.map(deserializeTrickCard),
    currentPlayerIndex: serialized.currentPlayerIndex,
    dealerIndex: serialized.dealerIndex,
    trickCount: serialized.trickCount,
    trickWins,
    collectedTricks,
    lastTrickWinner: serialized.lastTrickWinner as PlayerId | undefined,
    lastTrick: serialized.lastTrick?.map(deserializeTrickCard),
    canCambiar7: serialized.canCambiar7,
    gameHistory: [], // Not serialized as it's not needed for network games
    isVueltas: serialized.isVueltas,
    initialScores,
    lastTrickWinnerTeam: serialized.lastTrickWinnerTeam as TeamId | undefined,
    canDeclareVictory: serialized.canDeclareVictory,
    lastActionTimestamp: serialized.lastActionTimestamp,
    matchScore: serialized.matchScore,
    trickAnimating: serialized.trickAnimating,
    pendingTrickWinner: serialized.pendingTrickWinner
      ? {
          playerId: serialized.pendingTrickWinner.playerId as PlayerId,
          points: serialized.pendingTrickWinner.points,
          cards: serialized.pendingTrickWinner.cards.map(deserializeCard),
        }
      : undefined,
  };
}

// Validate that serialization/deserialization is lossless
export function validateSerialization(gameState: GameState): boolean {
  try {
    const serialized = serializeGameState(gameState);
    const deserialized = deserializeGameState(serialized);

    // Basic validation - check key properties match
    return (
      deserialized.id === gameState.id &&
      deserialized.phase === gameState.phase &&
      deserialized.currentPlayerIndex === gameState.currentPlayerIndex &&
      deserialized.trumpSuit === gameState.trumpSuit &&
      deserialized.hands.size === gameState.hands.size
    );
  } catch (error) {
    console.error('Serialization validation failed:', error);
    return false;
  }
}
