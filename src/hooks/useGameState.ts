import { useState, useCallback, useEffect } from 'react';
import type {
  GameState,
  GameId,
  PlayerId,
  CardId,
  Card,
  Team,
  TeamId,
  Player,
  DifficultyLevel,
  AIPersonality,
} from '../types/game.types';
import type { SpanishSuit, CardValue } from '../components/game/SpanishCard';
import {
  createDeck,
  shuffleDeck,
  dealInitialCards,
  isValidPlay,
  calculateTrickWinner,
  calculateTrickPoints,
  canCantar,
  calculateCantePoints,
  canCambiar7,
  getNextPlayerIndex,
  findPlayerTeam,
  isGameOver,
} from '../utils/gameLogic';
import {
  playAICard,
  shouldAICante,
  getAIThinkingTime,
} from '../utils/aiPlayer';
import { createMemory, updateMemory } from '../utils/aiMemory';
import type { CardMemory } from '../utils/aiMemory';

type UseGameStateProps = {
  playerName: string;
  gameId?: GameId;
  difficulty?: DifficultyLevel;
  mockData?: {
    players: Array<{
      id: number;
      name: string;
      cards: number;
    }>;
    myCards: Array<{
      suit: SpanishSuit;
      value: CardValue;
    }>;
    trumpCard: {
      suit: SpanishSuit;
      value: CardValue;
    };
    currentPlayer: number;
  };
};

export function useGameState({
  playerName,
  gameId,
  difficulty = 'medium',
  mockData,
}: UseGameStateProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [aiMemory, setAIMemory] = useState<CardMemory>(createMemory());
  const [thinkingPlayer, setThinkingPlayer] = useState<PlayerId | null>(null);

  // Initialize game
  useEffect(() => {
    const initializeGame = () => {
      if (mockData) {
        // Use mock data
        const players = mockData.players.map((p, index) => ({
          id: (index === 0 ? 'player' : `bot${index}`) as PlayerId,
          name: p.name,
          avatar: index === 0 ? '👤' : ['🧔', '👨', '👴'][index - 1],
          ranking: 1000 + index * 100,
          teamId: (index % 2 === 0 ? 'team1' : 'team2') as TeamId,
          isBot: index !== 0,
        }));

        const teams: [Team, Team] = [
          {
            id: 'team1' as TeamId,
            playerIds: ['player' as PlayerId, 'bot2' as PlayerId],
            score: 0,
            cantes: [],
          },
          {
            id: 'team2' as TeamId,
            playerIds: ['bot1' as PlayerId, 'bot3' as PlayerId],
            score: 0,
            cantes: [],
          },
        ];

        // Create hands map
        const hands = new Map<PlayerId, Card[]>();

        // Player's hand from mock data
        const playerCards = mockData.myCards.map((card, index) => ({
          id: `card_player_${index}` as CardId,
          suit: card.suit,
          value: card.value,
        }));
        hands.set('player' as PlayerId, playerCards);

        // Other players get dummy cards
        for (let i = 1; i < 4; i++) {
          const botCards = Array.from(
            { length: mockData.players[i].cards },
            (_, j) => ({
              id: `card_bot${i}_${j}` as CardId,
              suit: 'oros' as SpanishSuit,
              value: 1 as CardValue,
            }),
          );
          hands.set(`bot${i}` as PlayerId, botCards);
        }

        const trumpCard = {
          id: 'trump_card' as CardId,
          suit: mockData.trumpCard.suit,
          value: mockData.trumpCard.value,
        };

        const newGameState: GameState = {
          id: (gameId || `game_${Date.now()}`) as GameId,
          phase: 'playing',
          players,
          teams,
          deck: [], // Empty deck for mock
          hands: hands as ReadonlyMap<PlayerId, ReadonlyArray<Card>>,
          trumpSuit: mockData.trumpCard.suit,
          trumpCard,
          currentTrick: [],
          currentPlayerIndex: mockData.currentPlayer,
          trickWins: new Map(),
          canCambiar7: true,
          gameHistory: [],
        };

        setGameState(newGameState);
        return;
      }

      // Original initialization logic
      // Define AI personalities for the three bots
      const aiPersonalities: [AIPersonality, AIPersonality, AIPersonality] = [
        'prudent', // Ana la Prudente (Jorge A.)
        'aggressive', // Carlos el Valiente (Juancelotti)
        'tricky', // María la Astuta (Miguel A..N.)
      ];

      const players: Player[] = [
        {
          id: 'player' as PlayerId,
          name: playerName,
          avatar: '👤',
          ranking: 1325,
          teamId: 'team1' as TeamId,
          isBot: false,
        },
        {
          id: 'bot1' as PlayerId,
          name: 'Ana la Prudente',
          avatar: '👩',
          ranking: 6780,
          teamId: 'team2' as TeamId,
          isBot: true,
          personality: aiPersonalities[0],
          difficulty,
        },
        {
          id: 'bot2' as PlayerId,
          name: 'Carlos el Valiente',
          avatar: '👨',
          ranking: 255,
          teamId: 'team1' as TeamId,
          isBot: true,
          personality: aiPersonalities[1],
          difficulty,
        },
        {
          id: 'bot3' as PlayerId,
          name: 'María la Astuta',
          avatar: '👩‍🦰',
          ranking: 16163,
          teamId: 'team2' as TeamId,
          isBot: true,
          personality: aiPersonalities[2],
          difficulty,
        },
      ];

      const teams: [Team, Team] = [
        {
          id: 'team1' as TeamId,
          playerIds: ['player' as PlayerId, 'bot2' as PlayerId],
          score: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['bot1' as PlayerId, 'bot3' as PlayerId],
          score: 0,
          cantes: [],
        },
      ];

      const deck = shuffleDeck(createDeck());
      const { hands, remainingDeck } = dealInitialCards(
        deck,
        players.map(p => p.id),
      );

      const trumpCard = remainingDeck[remainingDeck.length - 1];

      const newGameState: GameState = {
        id: (gameId || `game_${Date.now()}`) as GameId,
        phase: 'playing',
        players,
        teams,
        deck: remainingDeck,
        hands: hands as ReadonlyMap<PlayerId, ReadonlyArray<Card>>,
        trumpSuit: trumpCard.suit,
        trumpCard,
        currentTrick: [],
        currentPlayerIndex: 0,
        trickWins: new Map(),
        canCambiar7: true,
        gameHistory: [],
      };

      setGameState(newGameState);
    };

    initializeGame();
  }, [playerName, gameId, mockData, difficulty]);

  // Play a card
  const playCard = useCallback(
    (cardId: CardId) => {
      if (!gameState || gameState.phase !== 'playing') return;

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const playerHand = gameState.hands.get(currentPlayer.id);
      if (!playerHand) return;

      const card = playerHand.find(c => c.id === cardId);
      if (!card) return;

      // Validate play
      if (
        !isValidPlay(
          card,
          playerHand,
          gameState.currentTrick,
          gameState.trumpSuit,
          gameState.phase,
        )
      ) {
        console.warn('Invalid play!');
        return;
      }

      // Update game state
      setGameState(prevState => {
        if (!prevState) return null;

        // Remove card from player's hand
        const newHands = new Map(prevState.hands);
        const currentHand = [...(newHands.get(currentPlayer.id) || [])];
        const cardIndex = currentHand.findIndex(c => c.id === cardId);
        currentHand.splice(cardIndex, 1);
        newHands.set(currentPlayer.id, currentHand);

        // Add card to current trick
        const newTrick = [
          ...prevState.currentTrick,
          { playerId: currentPlayer.id, card },
        ];

        // Update AI memory for all played cards
        setAIMemory(prev => updateMemory(prev, currentPlayer.id, card));

        // Check if trick is complete
        if (newTrick.length === 4) {
          // Calculate winner and points
          const winnerId = calculateTrickWinner(newTrick, prevState.trumpSuit);
          const points = calculateTrickPoints(newTrick);
          const winnerTeam = findPlayerTeam(winnerId, prevState);

          // Update scores
          const newTeams = [...prevState.teams] as [Team, Team];
          const teamIndex = newTeams.findIndex(t => t.id === winnerTeam);
          if (teamIndex !== -1) {
            newTeams[teamIndex] = {
              ...newTeams[teamIndex],
              score: newTeams[teamIndex].score + points,
            };
          }

          // Deal new cards if deck has cards
          let newDeck = [...prevState.deck];
          let newPhase = prevState.phase;

          if (newDeck.length >= 4) {
            // Winner draws first, then in order
            const drawOrder = [winnerId];
            let nextIndex = prevState.players.findIndex(p => p.id === winnerId);
            for (let i = 0; i < 3; i++) {
              nextIndex = getNextPlayerIndex(nextIndex, 4);
              drawOrder.push(prevState.players[nextIndex].id);
            }

            drawOrder.forEach(playerId => {
              const drawnCard = newDeck.pop();
              if (drawnCard) {
                const playerCards = [...(newHands.get(playerId) || [])];
                playerCards.push(drawnCard);
                newHands.set(playerId, playerCards);
              }
            });
          } else if (newDeck.length === 0 && prevState.phase === 'playing') {
            // Transition to arrastre phase when deck is empty
            newPhase = 'arrastre';
          }

          // Winner starts next trick
          const winnerIndex = prevState.players.findIndex(
            p => p.id === winnerId,
          );

          return {
            ...prevState,
            hands: newHands,
            deck: newDeck,
            currentTrick: [],
            currentPlayerIndex: winnerIndex,
            teams: newTeams,
            lastTrickWinner: winnerId,
            lastTrick: newTrick,
            phase: isGameOver({ ...prevState, teams: newTeams })
              ? 'gameOver'
              : newPhase,
          };
        }

        // Next player's turn
        return {
          ...prevState,
          hands: newHands,
          currentTrick: newTrick,
          currentPlayerIndex: getNextPlayerIndex(
            prevState.currentPlayerIndex,
            4,
          ),
        };
      });
    },
    [gameState],
  );

  // Cantar
  const cantar = useCallback(
    (suit: SpanishSuit) => {
      if (!gameState || gameState.phase !== 'playing') return;

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];

      // Can only cantar after winning the previous trick
      if (
        gameState.currentTrick.length !== 0 ||
        gameState.lastTrickWinner !== currentPlayer.id
      ) {
        console.warn('Can only cantar after winning a trick!');
        return;
      }

      const playerHand = gameState.hands.get(currentPlayer.id);
      const playerTeam = findPlayerTeam(currentPlayer.id, gameState);
      if (!playerHand || !playerTeam) return;

      const team = gameState.teams.find(t => t.id === playerTeam);
      if (!team) return;

      const cantableSuits = canCantar(
        playerHand,
        gameState.trumpSuit,
        team.cantes,
      );
      if (!cantableSuits.includes(suit)) return;

      const points = calculateCantePoints(suit, gameState.trumpSuit);

      setGameState(prevState => {
        if (!prevState) return null;

        const newTeams = [...prevState.teams] as [Team, Team];
        const teamIndex = newTeams.findIndex(t => t.id === playerTeam);
        if (teamIndex !== -1) {
          newTeams[teamIndex] = {
            ...newTeams[teamIndex],
            score: newTeams[teamIndex].score + points,
            cantes: [
              ...newTeams[teamIndex].cantes,
              { teamId: playerTeam, suit, points },
            ],
          };
        }

        return {
          ...prevState,
          teams: newTeams,
          phase: isGameOver({ ...prevState, teams: newTeams })
            ? 'gameOver'
            : 'playing',
        };
      });
    },
    [gameState],
  );

  // Cambiar 7
  const cambiar7 = useCallback(() => {
    if (!gameState || gameState.phase !== 'playing' || !gameState.canCambiar7)
      return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // Can only cambiar 7 after winning the previous trick
    if (
      gameState.currentTrick.length !== 0 ||
      gameState.lastTrickWinner !== currentPlayer.id
    ) {
      console.warn('Can only exchange 7 after winning a trick!');
      return;
    }

    const playerHand = gameState.hands.get(currentPlayer.id);
    if (!playerHand) return;

    if (!canCambiar7(playerHand, gameState.trumpCard, gameState.deck.length))
      return;

    setGameState(prevState => {
      if (!prevState) return null;

      const newHands = new Map(prevState.hands);
      const currentHand = [...(newHands.get(currentPlayer.id) || [])];

      // Find and remove 7 of trump
      const sevenIndex = currentHand.findIndex(
        c => c.suit === prevState.trumpSuit && c.value === 7,
      );
      if (sevenIndex === -1) return prevState;

      const seven = currentHand[sevenIndex];
      currentHand.splice(sevenIndex, 1);
      currentHand.push(prevState.trumpCard);
      newHands.set(currentPlayer.id, currentHand);

      return {
        ...prevState,
        hands: newHands,
        trumpCard: seven,
        canCambiar7: false,
      };
    });
  }, [gameState]);

  // Get current player's hand
  const getCurrentPlayerHand = useCallback((): Card[] => {
    if (!gameState) return [];
    const playerId = 'player' as PlayerId;
    return [...(gameState.hands.get(playerId) || [])];
  }, [gameState]);

  // Check if it's player's turn
  const isPlayerTurn = useCallback((): boolean => {
    if (!gameState) return false;
    return (
      gameState.players[gameState.currentPlayerIndex].id ===
      ('player' as PlayerId)
    );
  }, [gameState]);

  // Bot play simulation
  useEffect(() => {
    if (
      !gameState ||
      (gameState.phase !== 'playing' && gameState.phase !== 'arrastre') ||
      mockData
    )
      return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer.isBot) return;

    // Set thinking indicator
    setThinkingPlayer(currentPlayer.id);

    // Calculate thinking time based on AI difficulty and complexity
    const isComplexDecision =
      gameState.currentTrick.length > 0 ||
      gameState.phase === 'arrastre' ||
      botHand.length < 5;
    const thinkingTime = getAIThinkingTime(currentPlayer, isComplexDecision);

    // Smart AI logic with memory
    const timer = setTimeout(() => {
      const botHand = gameState.hands.get(currentPlayer.id);
      if (!botHand || botHand.length === 0) {
        setThinkingPlayer(null);
        return;
      }

      // Check for cante opportunities
      const cantesuit = shouldAICante(currentPlayer, botHand, gameState);
      if (cantesuit) {
        cantar(cantesuit);
        setThinkingPlayer(null);
        return;
      }

      // Play card with AI memory
      const cardToPlay = playAICard(
        botHand,
        gameState,
        currentPlayer,
        aiMemory,
      );
      if (cardToPlay) {
        playCard(cardToPlay.id);
        // Update AI memory with played card
        setAIMemory(prev => updateMemory(prev, currentPlayer.id, cardToPlay));
      }
      setThinkingPlayer(null);
    }, thinkingTime);

    return () => {
      clearTimeout(timer);
      setThinkingPlayer(null);
    };
  }, [gameState, playCard, cantar, mockData, aiMemory]);

  return {
    gameState,
    playCard,
    cantar,
    cambiar7,
    selectedCard,
    setSelectedCard,
    getCurrentPlayerHand,
    isPlayerTurn,
    thinkingPlayer,
  };
}
