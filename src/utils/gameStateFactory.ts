import type { GameState, Player, GameId, Team, TeamId } from '../types/game.types';
import { createDeck, shuffleDeck, dealInitialCards } from './gameLogic';

interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  ranking: number;
  teamId: TeamId;
  isBot: boolean;
  personality?: 'aggressive' | 'defensive' | 'balanced' | 'unpredictable';
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Create initial game state for a new game
 */
export function createInitialGameState(playerInfos: PlayerInfo[]): GameState {
  if (playerInfos.length !== 4) {
    throw new Error('Game requires exactly 4 players');
  }

  // Create and shuffle deck
  const deck = shuffleDeck(createDeck());

  // Deal initial cards
  const { hands, remainingDeck } = dealInitialCards(
    deck,
    playerInfos.map(p => p.id as any),
  );

  // Trump card is the next card in deck (bottom of draw pile)
  const trumpCard = remainingDeck[remainingDeck.length - 1];
  const deckAfterTrump = remainingDeck.slice(0, -1);

  // Create players
  const players: Player[] = playerInfos.map((info, index) => ({
    id: info.id as any,
    name: info.name,
    avatar: info.avatar,
    ranking: info.ranking,
    teamId: info.teamId,
    isBot: info.isBot,
    ...(info.isBot && {
      personality: info.personality,
      difficulty: info.difficulty,
    }),
  }));

  // Create teams
  const team1Players = playerInfos.filter(p => p.teamId === 'team1').map(p => p.id as any);
  const team2Players = playerInfos.filter(p => p.teamId === 'team2').map(p => p.id as any);

  if (team1Players.length !== 2 || team2Players.length !== 2) {
    throw new Error('Each team must have exactly 2 players');
  }

  const teams: [Team, Team] = [
    {
      id: 'team1' as TeamId,
      playerIds: [team1Players[0], team1Players[1]],
      score: 0,
      cardPoints: 0,
      cantes: [],
    },
    {
      id: 'team2' as TeamId,
      playerIds: [team2Players[0], team2Players[1]],
      score: 0,
      cardPoints: 0,
      cantes: [],
    },
  ];

  const gameState: GameState = {
    id: `game_${Date.now()}` as GameId,
    phase: 'dealing',
    players,
    teams,
    deck: deckAfterTrump,
    hands,
    trumpSuit: trumpCard.suit,
    trumpCard,
    currentTrick: [],
    currentPlayerIndex: 0, // First player (position 0) starts
    dealerIndex: 3, // Last player (position 3) is dealer
    trickCount: 0,
    trickWins: new Map(),
    collectedTricks: new Map(),
    canCambiar7: true,
    gameHistory: [],
    isVueltas: false,
    canDeclareVictory: false,
  };

  return gameState;
}

/**
 * Reset game state for a new hand (vueltas)
 */
export function resetGameStateForVueltas(
  previousState: GameState,
  initialScores: Map<TeamId, number>,
): GameState {
  // Create and shuffle new deck
  const deck = shuffleDeck(createDeck());

  // Deal initial cards
  const { hands, remainingDeck } = dealInitialCards(
    deck,
    previousState.players.map(p => p.id),
  );

  // Trump card is the next card in deck (bottom of draw pile)
  const trumpCard = remainingDeck[remainingDeck.length - 1];
  const deckAfterTrump = remainingDeck.slice(0, -1);

  // Reset teams but keep scores
  const teams: [Team, Team] = [
    {
      ...previousState.teams[0],
      cardPoints: 0,
      cantes: [],
    },
    {
      ...previousState.teams[1],
      cardPoints: 0,
      cantes: [],
    },
  ];

  // Rotate dealer
  const newDealerIndex = (previousState.dealerIndex + 1) % 4;

  const gameState: GameState = {
    ...previousState,
    phase: 'dealing',
    teams,
    deck: deckAfterTrump,
    hands,
    trumpSuit: trumpCard.suit,
    trumpCard,
    currentTrick: [],
    currentPlayerIndex: (newDealerIndex + 1) % 4, // Player after dealer starts
    dealerIndex: newDealerIndex,
    trickCount: 0,
    trickWins: new Map(),
    collectedTricks: new Map(),
    canCambiar7: true,
    gameHistory: [],
    isVueltas: true,
    initialScores,
    lastTrickWinner: undefined,
    lastTrick: undefined,
    canDeclareVictory: false,
  };

  return gameState;
}
