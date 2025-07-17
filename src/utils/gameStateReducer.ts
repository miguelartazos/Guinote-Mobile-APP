import type {
  GameState,
  Card,
  CardId,
  PlayerId,
  Team,
  TeamId,
} from '../types/game.types';
import type { SpanishSuit } from '../components/game/SpanishCard';
import {
  calculateTrickWinner,
  calculateTrickPoints,
  findPlayerTeam,
  getNextPlayerIndex,
  isGameOver,
  canCantar as canCantarCheck,
  calculateCantePoints,
  canCambiar7 as canCambiar7Check,
} from './gameLogic';

export type GameStateAction =
  | { type: 'PLAY_CARD'; playerId: PlayerId; card: Card }
  | { type: 'COMPLETE_TRICK'; winnerId: PlayerId; points: number }
  | { type: 'CANTAR'; playerId: PlayerId; suit: SpanishSuit; points: number }
  | { type: 'CAMBIAR_7'; playerId: PlayerId; seven: Card }
  | { type: 'DRAW_CARDS'; draws: Array<{ playerId: PlayerId; card: Card }> };

export function gameStateReducer(
  state: GameState,
  action: GameStateAction
): GameState {
  switch (action.type) {
    case 'PLAY_CARD': {
      const newHands = new Map(state.hands);
      const playerHand = [...(newHands.get(action.playerId) || [])];
      const cardIndex = playerHand.findIndex(c => c.id === action.card.id);
      
      if (cardIndex === -1) return state;
      
      playerHand.splice(cardIndex, 1);
      newHands.set(action.playerId, playerHand);

      const newTrick = [
        ...state.currentTrick,
        { playerId: action.playerId, card: action.card },
      ];

      return {
        ...state,
        hands: newHands,
        currentTrick: newTrick,
        currentPlayerIndex: getNextPlayerIndex(state.currentPlayerIndex, 4),
      };
    }

    case 'COMPLETE_TRICK': {
      const winnerTeam = findPlayerTeam(action.winnerId, state);
      const newTeams = [...state.teams] as [Team, Team];
      const teamIndex = newTeams.findIndex(t => t.id === winnerTeam);
      
      if (teamIndex !== -1) {
        newTeams[teamIndex] = {
          ...newTeams[teamIndex],
          score: newTeams[teamIndex].score + action.points,
        };
      }

      const winnerIndex = state.players.findIndex(p => p.id === action.winnerId);

      return {
        ...state,
        currentTrick: [],
        currentPlayerIndex: winnerIndex,
        teams: newTeams,
        lastTrickWinner: action.winnerId,
        phase: isGameOver({ ...state, teams: newTeams }) ? 'gameOver' : 'playing',
      };
    }

    case 'CANTAR': {
      const playerTeam = findPlayerTeam(action.playerId, state);
      const newTeams = [...state.teams] as [Team, Team];
      const teamIndex = newTeams.findIndex(t => t.id === playerTeam);
      
      if (teamIndex !== -1) {
        newTeams[teamIndex] = {
          ...newTeams[teamIndex],
          score: newTeams[teamIndex].score + action.points,
          cantes: [
            ...newTeams[teamIndex].cantes,
            { teamId: playerTeam!, suit: action.suit, points: action.points },
          ],
        };
      }

      return {
        ...state,
        teams: newTeams,
        phase: isGameOver({ ...state, teams: newTeams }) ? 'gameOver' : 'playing',
      };
    }

    case 'CAMBIAR_7': {
      const newHands = new Map(state.hands);
      const playerHand = [...(newHands.get(action.playerId) || [])];
      const sevenIndex = playerHand.findIndex(
        c => c.id === action.seven.id
      );
      
      if (sevenIndex === -1) return state;
      
      playerHand.splice(sevenIndex, 1);
      playerHand.push(state.trumpCard);
      newHands.set(action.playerId, playerHand);

      return {
        ...state,
        hands: newHands,
        trumpCard: action.seven,
        canCambiar7: false,
      };
    }

    case 'DRAW_CARDS': {
      const newHands = new Map(state.hands);
      const newDeck = [...state.deck];
      
      action.draws.forEach(({ playerId, card }) => {
        const playerCards = [...(newHands.get(playerId) || [])];
        playerCards.push(card);
        newHands.set(playerId, playerCards);
      });

      return {
        ...state,
        hands: newHands,
        deck: newDeck,
      };
    }

    default:
      return state;
  }
}

export function processTrickCompletion(
  state: GameState
): { newState: GameState; draws: Array<{ playerId: PlayerId; card: Card }> } {
  const trick = state.currentTrick;
  if (trick.length !== 4) {
    return { newState: state, draws: [] };
  }

  const winnerId = calculateTrickWinner(trick, state.trumpSuit);
  const points = calculateTrickPoints(trick);
  
  // Calculate draw order
  const draws: Array<{ playerId: PlayerId; card: Card }> = [];
  const mutableDeck = [...state.deck];
  
  if (mutableDeck.length >= 4) {
    const drawOrder = [winnerId];
    let nextIndex = state.players.findIndex(p => p.id === winnerId);
    for (let i = 0; i < 3; i++) {
      nextIndex = getNextPlayerIndex(nextIndex, 4);
      drawOrder.push(state.players[nextIndex].id);
    }

    drawOrder.forEach(playerId => {
      const drawnCard = mutableDeck.pop();
      if (drawnCard) {
        draws.push({ playerId, card: drawnCard });
      }
    });
  }

  let newState = gameStateReducer(state, {
    type: 'COMPLETE_TRICK',
    winnerId,
    points,
  });

  if (draws.length > 0) {
    newState = gameStateReducer(newState, {
      type: 'DRAW_CARDS',
      draws,
    });
  }

  return { newState, draws };
}