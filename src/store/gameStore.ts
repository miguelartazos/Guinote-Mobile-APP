import { create } from 'zustand';
import { Card } from '../types/game';

interface PlayedCard {
  card: Card;
  playerId: string;
}

interface GameStore {
  // Game state
  playerHand: Card[];
  opponentHands: {
    top: Card[];
    left: Card[];
    right: Card[];
  };
  playedCards: PlayedCard[];
  currentPlayer: number;
  isDealing: boolean;
  gamePhase: 'dealing' | 'playing' | 'trick-collection' | 'game-over';
  deckCount: number;
  trumpCard?: Card;

  // Game actions
  setPlayerHand: (cards: Card[]) => void;
  setOpponentHands: (hands: GameStore['opponentHands']) => void;
  playCard: (card: Card) => void;
  canPlay: (card: Card) => boolean;
  setCurrentPlayer: (player: number) => void;
  setGamePhase: (phase: GameStore['gamePhase']) => void;
  setDeckCount: (count: number) => void;
  setTrumpCard: (card: Card | undefined) => void;
  clearPlayedCards: () => void;

  // Special actions
  canCante: boolean;
  canChange7: boolean;
  setCanCante: (can: boolean) => void;
  setCanChange7: (can: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  playerHand: [],
  opponentHands: {
    top: [],
    left: [],
    right: [],
  },
  playedCards: [],
  currentPlayer: 0,
  isDealing: false,
  gamePhase: 'dealing',
  deckCount: 40,
  trumpCard: undefined,
  canCante: false,
  canChange7: false,

  // Actions
  setPlayerHand: cards => set({ playerHand: cards }),

  setOpponentHands: hands => set({ opponentHands: hands }),

  playCard: card =>
    set(state => {
      const playerId =
        state.currentPlayer === 0
          ? 'player'
          : state.currentPlayer === 1
          ? 'left'
          : state.currentPlayer === 2
          ? 'top'
          : 'right';

      return {
        playedCards: [...state.playedCards, { card, playerId }],
        playerHand:
          state.currentPlayer === 0
            ? state.playerHand.filter(c => c !== card)
            : state.playerHand,
      };
    }),

  canPlay: card => {
    const state = get();
    // Basic rule: can only play if it's your turn
    if (state.currentPlayer !== 0) return false;

    // TODO: Implement full Guiñote rules for valid plays
    // For now, allow any card
    return true;
  },

  setCurrentPlayer: player => set({ currentPlayer: player }),

  setGamePhase: phase =>
    set({ gamePhase: phase, isDealing: phase === 'dealing' }),

  setDeckCount: count => set({ deckCount: count }),

  setTrumpCard: card => set({ trumpCard: card }),

  clearPlayedCards: () => set({ playedCards: [] }),

  setCanCante: can => set({ canCante: can }),

  setCanChange7: can => set({ canChange7: can }),
}));
