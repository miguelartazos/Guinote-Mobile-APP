import { useState, useCallback, useEffect } from 'react';
import type {
  GameState,
  GamePhase,
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
import { WINNING_SCORE, MINIMUM_CARD_POINTS } from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';
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
  shouldStartVueltas,
  canDeclareVictory,
  getValidCards,
} from '../utils/gameLogic';
import { createMemory, updateMemory } from '../utils/aiMemory';
import type { CardMemory } from '../utils/aiMemory';
import { useAITurn } from './useAITurn';
// Game constants are available in '../constants/gameConstants' when needed

type UseGameStateProps = {
  playerName: string;
  gameId?: GameId;
  difficulty?: DifficultyLevel;
  playerNames?: string[]; // For local multiplayer
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
  playerNames,
  mockData,
}: UseGameStateProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [aiMemory, setAIMemory] = useState<CardMemory>(createMemory());
  const [isDealingComplete, setIsDealingComplete] = useState(false);

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
            cardPoints: 0,
            cantes: [],
          },
          {
            id: 'team2' as TeamId,
            playerIds: ['bot1' as PlayerId, 'bot3' as PlayerId],
            score: 0,
            cardPoints: 0,
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
          dealerIndex: 0, // Mock dealer
          trickCount: 0,
          trickWins: new Map(),
          collectedTricks: new Map(),
          canCambiar7: true,
          gameHistory: [],
          isVueltas: false,
          canDeclareVictory: false,
          matchScore: { team1Sets: 0, team2Sets: 0, currentSet: 'buenas' },
        };

        setGameState(newGameState);
        return;
      }

      // Original initialization logic
      let players: Player[];

      if (playerNames && playerNames.length >= 2) {
        // Local multiplayer mode
        const avatars = ['👤', '👧', '👨', '👴'];
        players = playerNames.slice(0, 4).map((name, index) => ({
          id: `player${index}` as PlayerId,
          name: name || `Jugador ${index + 1}`,
          avatar: avatars[index],
          ranking: 1000 + index * 100,
          teamId: (index % 2 === 0 ? 'team1' : 'team2') as TeamId,
          isBot: false,
        }));

        // Fill remaining slots with bots if less than 4 players
        if (players.length < 4) {
          const aiPersonalities: AIPersonality[] = [
            'prudent',
            'aggressive',
            'tricky',
          ];
          const botNames = [
            'Ana la Prudente',
            'Carlos el Valiente',
            'María la Astuta',
          ];
          const botAvatars = ['👩', '👨', '👩‍🦰'];

          for (let i = players.length; i < 4; i++) {
            players.push({
              id: `bot${i}` as PlayerId,
              name: botNames[i - players.length],
              avatar: botAvatars[i - players.length],
              ranking: 1000 + i * 100,
              teamId: (i % 2 === 0 ? 'team1' : 'team2') as TeamId,
              isBot: true,
              personality: aiPersonalities[i - players.length],
              difficulty,
            });
          }
        }
      } else {
        // Original AI mode
        const aiPersonalities: [AIPersonality, AIPersonality, AIPersonality] = [
          'prudent', // Ana la Prudente (Jorge A.)
          'aggressive', // Carlos el Valiente (Juancelotti)
          'tricky', // María la Astuta (Miguel A..N.)
        ];

        players = [
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
      }

      const teams: [Team, Team] = [
        {
          id: 'team1' as TeamId,
          playerIds: ['player' as PlayerId, 'bot2' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['bot1' as PlayerId, 'bot3' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
      ];

      const deck = shuffleDeck(createDeck());
      const { hands, remainingDeck } = dealInitialCards(
        deck,
        players.map(p => p.id),
      );

      const trumpCard = remainingDeck[remainingDeck.length - 1];

      // Select dealer (randomly for first game)
      const dealerIndex = Math.floor(Math.random() * 4);
      // First player (mano) is to dealer's left (clockwise)
      const firstPlayerIndex = (dealerIndex + 1) % 4;

      const newGameState: GameState = {
        id: (gameId || `game_${Date.now()}`) as GameId,
        phase: 'dealing',
        players,
        teams,
        deck: remainingDeck,
        hands: hands as ReadonlyMap<PlayerId, ReadonlyArray<Card>>,
        trumpSuit: trumpCard.suit,
        trumpCard,
        currentTrick: [],
        currentPlayerIndex: firstPlayerIndex,
        dealerIndex,
        trickCount: 0,
        trickWins: new Map(),
        collectedTricks: new Map(),
        canCambiar7: true,
        gameHistory: [],
        isVueltas: false,
        canDeclareVictory: false,
        matchScore: { team1Sets: 0, team2Sets: 0, currentSet: 'buenas' },
      };

      setGameState(newGameState);
      setIsDealingComplete(false);
    };

    initializeGame();
  }, [playerName, gameId, mockData, difficulty, playerNames]);

  // Play a card
  const playCard = useCallback(
    (cardId: CardId) => {
      if (
        !gameState ||
        (gameState.phase !== 'playing' && gameState.phase !== 'arrastre')
      )
        return;

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
          currentPlayer.id,
          gameState,
        )
      ) {
        console.warn('Invalid play!', {
          card,
          currentTrick: gameState.currentTrick,
          phase: gameState.phase,
        });
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

        console.log('🃏 CARD PLAYED:', {
          player: currentPlayer.name,
          card: `${card.value} de ${card.suit}`,
          trickPosition: newTrick.length,
          isLastCard: newTrick.length === 4,
        });

        // Update AI memory for all played cards
        setAIMemory(prev => updateMemory(prev, currentPlayer.id, card));

        // Check if trick is complete
        if (newTrick.length === 4) {
          // Calculate winner and points
          const winnerId = calculateTrickWinner(newTrick, prevState.trumpSuit);
          const points = calculateTrickPoints(newTrick);
          const winnerTeam = findPlayerTeam(winnerId, prevState);

          console.log('🏆 TRICK COMPLETE:', {
            winner: winnerId,
            winnerName: prevState.players.find(p => p.id === winnerId)?.name,
            points: points,
            cards: newTrick.map(tc => ({
              player: tc.playerId,
              card: `${tc.card.value} de ${tc.card.suit}`,
            })),
          });

          // Update scores
          const newTeams = [...prevState.teams] as [Team, Team];
          const teamIndex = newTeams.findIndex(t => t.id === winnerTeam);
          if (teamIndex !== -1) {
            newTeams[teamIndex] = {
              ...newTeams[teamIndex],
              score: newTeams[teamIndex].score + points,
              cardPoints: newTeams[teamIndex].cardPoints + points, // Track card points separately
            };
          }

          // Increment trick count and store collected trick
          const newTrickCount = prevState.trickCount + 1;

          // Update collected tricks for the winner
          const newCollectedTricks = new Map(prevState.collectedTricks);
          const winnerTricks = newCollectedTricks.get(winnerId) || [];
          newCollectedTricks.set(winnerId, [...winnerTricks, newTrick]);

          // Deal new cards if deck has cards
          let newDeck = [...prevState.deck];
          let newPhase = prevState.phase;

          if (newDeck.length > 0 && prevState.phase === 'playing') {
            // Winner draws first, then counter-clockwise
            const drawOrder = [winnerId];
            let nextIndex = prevState.players.findIndex(p => p.id === winnerId);
            for (let i = 0; i < 3; i++) {
              nextIndex = getNextPlayerIndex(nextIndex, 4);
              drawOrder.push(prevState.players[nextIndex].id);
            }

            console.log('📦 DRAWING ORDER (counter-clockwise from winner):', {
              drawOrder: drawOrder.map(
                id => prevState.players.find(p => p.id === id)?.name,
              ),
              deckSize: newDeck.length,
            });

            drawOrder.forEach(playerId => {
              if (newDeck.length > 0) {
                const drawnCard = newDeck.pop();
                if (drawnCard) {
                  const playerCards = [...(newHands.get(playerId) || [])];
                  playerCards.push(drawnCard);
                  newHands.set(playerId, playerCards);
                }
              }
            });

            // If deck is now empty, transition to arrastre phase
            if (newDeck.length === 0) {
              newPhase = 'arrastre';
            }
          } else if (newDeck.length === 0 && prevState.phase === 'playing') {
            // Already in arrastre or deck was already empty
            newPhase = 'arrastre';
          }

          // Winner starts next trick
          const winnerIndex = prevState.players.findIndex(
            p => p.id === winnerId,
          );

          console.log('🎯 NEXT PLAYER:', {
            winnerIndex: winnerIndex,
            nextPlayerName: prevState.players[winnerIndex]?.name,
            nextPlayerId: prevState.players[winnerIndex]?.id,
          });

          // Check if this is the last trick of the game
          const isLastTrick =
            newDeck.length === 0 &&
            Array.from(newHands.values()).every(hand => hand.length === 0);

          // Award last trick bonus if applicable
          if (isLastTrick) {
            const teamIdx = newTeams.findIndex(t => t.id === winnerTeam);
            if (teamIdx !== -1) {
              newTeams[teamIdx] = {
                ...newTeams[teamIdx],
                score: newTeams[teamIdx].score + 10, // diez de últimas
              };
            }
          }

          const shouldVueltas = shouldStartVueltas({
            ...prevState,
            teams: newTeams,
            deck: newDeck,
            hands: newHands,
          });

          // Don't clear the trick immediately - show animation first
          return {
            ...prevState,
            hands: newHands,
            deck: newDeck,
            currentTrick: newTrick, // Keep the full trick visible
            currentPlayerIndex: winnerIndex,
            teams: newTeams,
            trickCount: newTrickCount,
            collectedTricks: newCollectedTricks,
            lastTrickWinner: winnerId,
            lastTrick: newTrick,
            phase: (() => {
              if (isGameOver({ ...prevState, teams: newTeams })) {
                return 'gameOver';
              }
              if (isLastTrick && !prevState.isVueltas) {
                // Show scores before deciding on vueltas
                return 'scoring';
              }
              return newPhase;
            })(),
            isVueltas: shouldVueltas ? true : prevState.isVueltas,
            initialScores: shouldVueltas
              ? new Map(newTeams.map(t => [t.id, t.score]))
              : prevState.initialScores,
            lastActionTimestamp: Date.now(),
            trickAnimating: true, // Start animation
            pendingTrickWinner: {
              playerId: winnerId,
              points: points,
              cards: newTrick.map(tc => tc.card),
            },
          };
        }

        // Next player's turn
        const nextPlayerIndex = getNextPlayerIndex(
          prevState.currentPlayerIndex,
          4,
        );
        console.log('Advancing turn:', {
          from: prevState.currentPlayerIndex,
          to: nextPlayerIndex,
          trickSize: newTrick.length,
        });
        return {
          ...prevState,
          hands: newHands,
          currentTrick: newTrick,
          currentPlayerIndex: nextPlayerIndex,
          lastActionTimestamp: Date.now(),
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
              {
                teamId: playerTeam,
                suit,
                points,
                isVisible: points === 20, // Veinte (20) is visible, Las Cuarenta (40) is hidden
              },
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

  // Reorder cards in player's hand
  const reorderPlayerHand = useCallback(
    (playerId: PlayerId, fromIndex: number, toIndex: number) => {
      if (!gameState || fromIndex === toIndex) return;

      setGameState(prevState => {
        if (!prevState) return null;

        const playerHand = prevState.hands.get(playerId);
        if (!playerHand) return prevState;

        // Create new hand with reordered cards
        const newHand = [...playerHand];
        const [movedCard] = newHand.splice(fromIndex, 1);
        newHand.splice(toIndex, 0, movedCard);

        // Update hands map
        const newHands = new Map(prevState.hands);
        newHands.set(playerId, newHand);

        return {
          ...prevState,
          hands: newHands,
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

  // Create a unique key for the current turn to prevent re-triggers
  // Include phase and last action timestamp to ensure uniqueness
  const currentTurnKey = gameState
    ? `${gameState.currentPlayerIndex}-${gameState.trickCount}-${
        gameState.currentTrick.length
      }-${gameState.phase}-${gameState.lastActionTimestamp || 0}`
    : '';

  // Use the custom AI turn hook
  const { thinkingPlayer } = useAITurn({
    gameState,
    currentTurnKey,
    mockData,
    playCard,
    cantar,
    aiMemory,
    setAIMemory,
  });

  // Handle vueltas dealing
  useEffect(() => {
    if (
      gameState?.phase === 'dealing' &&
      gameState.isVueltas &&
      gameState.hands.size === 0
    ) {
      // Need to deal cards for vueltas
      const deck = shuffleDeck(createDeck());
      const { hands, remainingDeck } = dealInitialCards(
        deck,
        gameState.players.map(p => p.id),
      );

      const trumpCard = remainingDeck[remainingDeck.length - 1];

      setGameState(prev => ({
        ...prev!,
        deck: remainingDeck,
        hands,
        trumpCard,
        trumpSuit: trumpCard.suit,
      }));
    }
  }, [
    gameState?.phase,
    gameState?.isVueltas,
    gameState?.hands.size,
    gameState?.players,
  ]);

  // Complete dealing animation
  const completeDealingAnimation = useCallback(() => {
    setIsDealingComplete(true);
    setGameState(prev => ({
      ...prev!,
      phase: 'playing' as GamePhase,
    }));
  }, []);

  // Complete trick animation
  const completeTrickAnimation = useCallback(() => {
    setGameState(prev => {
      if (!prev || !prev.trickAnimating) return prev;

      // Clear the trick and animation state
      return {
        ...prev,
        currentTrick: [],
        trickAnimating: false,
        pendingTrickWinner: undefined,
      };
    });
  }, []);

  // Get valid cards for current player
  const getValidCardsForCurrentPlayer = useCallback((): Card[] => {
    if (!gameState) return [];

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const playerHand = gameState.hands.get(currentPlayer.id);

    if (!playerHand) return [];

    return getValidCards(playerHand, gameState, currentPlayer.id);
  }, [gameState]);

  // Declare victory in vueltas
  // Continue from scoring phase (either to vueltas or game over)
  const continueFromScoring = useCallback(() => {
    if (!gameState || gameState.phase !== 'scoring') return;

    // Check if any team has won (101+ points AND 30+ card points)
    const winningTeam = gameState.teams.find(
      team =>
        team.score >= WINNING_SCORE && team.cardPoints >= MINIMUM_CARD_POINTS,
    );

    if (winningTeam) {
      // Auto-win: Team reached 101 points
      setGameState(prev => {
        if (!prev) return null;
        const currentMatchScore = prev.matchScore || {
          team1Sets: 0,
          team2Sets: 0,
          currentSet: 'buenas',
        };
        const winningTeamIndex = prev.teams.findIndex(
          t => t.id === winningTeam.id,
        );
        const updatedMatchScore = { ...currentMatchScore };

        if (winningTeamIndex === 0) {
          updatedMatchScore.team1Sets += 1;
        } else {
          updatedMatchScore.team2Sets += 1;
        }

        // Check if match is over (best of 3)
        const team1Won = updatedMatchScore.team1Sets >= 2;
        const team2Won = updatedMatchScore.team2Sets >= 2;

        if (team1Won || team2Won) {
          // Match over
          return {
            ...prev,
            phase: 'gameOver' as GamePhase,
            matchScore: updatedMatchScore,
          };
        } else {
          // Continue to next set
          updatedMatchScore.currentSet =
            updatedMatchScore.team1Sets === 1 &&
            updatedMatchScore.team2Sets === 1
              ? 'bella'
              : 'malas';
          // Reset for next game
          return {
            ...prev,
            phase: 'gameOver' as GamePhase, // Will be reset for new game
            matchScore: updatedMatchScore,
          };
        }
      });
    } else {
      // No winner - start vueltas (second hand)
      setGameState(prev => {
        if (!prev) return null;

        // Store current scores
        const initialScores = new Map(prev.teams.map(t => [t.id, t.score]));

        // Determine last trick winner team
        const lastWinner = prev.lastTrickWinner;
        const lastWinnerTeam = lastWinner
          ? prev.teams.find(t => t.playerIds.includes(lastWinner))?.id
          : undefined;

        // Deal new hand for vueltas
        const newDeck = shuffleDeck(createDeck());
        const { hands: newHands, remainingDeck } = dealInitialCards(
          newDeck,
          prev.players.map(p => p.id),
        );

        const newTrumpCard = remainingDeck[remainingDeck.length - 1];
        const newTrumpSuit = newTrumpCard.suit;

        return {
          ...prev,
          phase: 'dealing' as GamePhase, // Start with dealing phase for vueltas
          isVueltas: true,
          initialScores,
          lastTrickWinnerTeam: lastWinnerTeam,
          canDeclareVictory: !!lastWinnerTeam,
          deck: remainingDeck,
          hands: newHands,
          trumpCard: newTrumpCard,
          trumpSuit: newTrumpSuit,
          currentTrick: [],
          currentPlayerIndex: (prev.dealerIndex + 1) % 4,
          dealerIndex: (prev.dealerIndex + 1) % 4,
          trickCount: 0,
          lastTrickWinner: undefined,
          lastTrick: undefined,
          canCambiar7: true,
        };
      });
    }
  }, [gameState]);

  const declareVictory = useCallback(() => {
    if (!gameState?.isVueltas || gameState.currentTrick.length > 0)
      return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const team = gameState.teams.find(t =>
      t.playerIds.includes(currentPlayer.id),
    );

    if (!team) return false;

    if (canDeclareVictory(team.id, gameState)) {
      // Correct declaration - team wins
      setGameState(prev => ({
        ...prev!,
        phase: 'gameOver' as GamePhase,
      }));
      return true;
    } else {
      // Incorrect declaration - other team wins
      const otherTeam = gameState.teams.find(t => t.id !== team.id);
      if (otherTeam) {
        setGameState(prev => ({
          ...prev!,
          teams: prev!.teams.map(t =>
            t.id === otherTeam.id ? { ...t, score: 101 } : t,
          ) as [Team, Team],
          phase: 'gameOver' as GamePhase,
        }));
      }
      return false;
    }
  }, [gameState]);

  // Declare renuncio
  const declareRenuncio = useCallback(
    (reason: string) => {
      if (!gameState) return;

      // The declaring team (player's team) loses, opponent wins
      const playerTeam = gameState.teams.find(t =>
        t.playerIds.includes(gameState.players[0].id),
      );
      const otherTeam = gameState.teams.find(t => t.id !== playerTeam?.id);

      if (otherTeam) {
        console.log('Renuncio declared:', reason);
        setGameState(prev => ({
          ...prev!,
          teams: prev!.teams.map(t =>
            t.id === otherTeam.id ? { ...t, score: 101 } : t,
          ) as [Team, Team],
          phase: 'gameOver' as GamePhase,
        }));
      }
    },
    [gameState],
  );

  // Cleanup effect - only run on unmount
  useEffect(() => {
    return () => {
      // Clear game state to free memory
      setGameState(null);
      setSelectedCard(null);
      setAIMemory(createMemory());
    };
  }, []); // Empty dependency array - only cleanup on unmount

  return {
    gameState,
    playCard,
    cantar,
    cambiar7,
    reorderPlayerHand,
    continueFromScoring,
    declareVictory,
    declareRenuncio,
    selectedCard,
    setSelectedCard,
    getCurrentPlayerHand,
    getValidCardsForCurrentPlayer,
    isPlayerTurn,
    thinkingPlayer,
    isDealingComplete,
    completeDealingAnimation,
    completeTrickAnimation,
    setGameState,
  };
}
