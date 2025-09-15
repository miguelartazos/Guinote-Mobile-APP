import { useState, useCallback, useEffect, useRef } from 'react';
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
  TrickCard,
} from '../types/game.types';
import { WINNING_SCORE, MINIMUM_CARD_POINTS } from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';
import { StateMutex } from '../utils/StateMutex';
import { DeadlockDetector } from '../utils/DeadlockDetector';
import { CARD_PLAY_DELAY } from '../constants/animations';
import {
  createDeck,
  shuffleDeck,
  shuffleDeckWithSeed,
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
  canDeclareVictory,
  determineVueltasWinner,
  getValidCards,
  createInitialMatchScore,
  updateMatchScoreForPartida,
  isMatchComplete,
  updateMatchScoreAndDeterminePhase,
  startNewPartida,
  isValidTeamIndex,
  processVueltasCompletion,
  initializeVueltasState,
} from '../utils/gameLogic';
import { resetGameStateForVueltas } from '../utils/gameStateFactory';
import {
  createMemory,
  updateMemory,
  clearMemory,
  shouldClearMemory,
  clearMemoryOnPhaseChange,
} from '../utils/aiMemory';
import type { CardMemory } from '../utils/aiMemory';
import { useAITurn } from './useAITurn';
import { saveGameState, loadGameState, clearGameState } from '../utils/gameStatePersistence';
// Game constants are available in '../constants/gameConstants' when needed

type UseGameStateProps = {
  playerName: string;
  gameId?: GameId;
  difficulty?: DifficultyLevel;
  playerNames?: string[]; // For local multiplayer
  // Multiplayer bot behavior control
  autoPlayBotsMode?: 'always' | 'host-only' | 'never';
  isHost?: boolean;
  onBotAction?: (action:
    | { type: 'play_card'; cardId: string }
    | { type: 'declare_cante'; suit: SpanishSuit }
    | { type: 'cambiar_7' }
  ) => void;
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
  // Deterministic initialization (for multiplayer hand start). If provided, skip local shuffle
  deterministicInit?: {
    seed: string | number;
    dealerIndex: number; // who deals
    firstPlayerIndex?: number; // optional (mano). If omitted, computed from dealer
  } | null;
  // When provided, the hook will wait until this promise resolves with deterministicInit
  // before initializing the game. Useful on non-host clients.
  waitForDeterministicInit?: (() => Promise<{
    seed: string | number;
    dealerIndex: number;
    firstPlayerIndex?: number;
  }>) | null;
  // Online authoritative initialization: if provided, the hook will fetch a server snapshot
  // and use it to initialize the first hand consistently across devices.
  serverInitProvider?: (() => Promise<{
    handsByPosition: Array<ReadonlyArray<{ id: string; suit: SpanishSuit; value: CardValue }>>;
    deck: ReadonlyArray<{ id: string; suit: SpanishSuit; value: CardValue }>;
    trumpCard: { id: string; suit: SpanishSuit; value: CardValue };
    currentPlayerIndex: number;
    dealerIndex: number;
  }>) | null;
  // Online players metadata by seat position (0..3). Used to mark AI seats on host.
  onlinePlayersIsBotByPosition?: boolean[] | null;
  // Persistence control: in online/friends mode we should not load/save local state
  persistenceMode?: 'auto' | 'never';
};

export function useGameState({
  playerName,
  gameId,
  difficulty = 'medium',
  playerNames,
  autoPlayBotsMode = 'always',
  isHost = false,
  onBotAction,
  mockData,
  deterministicInit,
  waitForDeterministicInit,
  serverInitProvider,
  onlinePlayersIsBotByPosition,
  persistenceMode = 'auto',
}: UseGameStateProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [aiMemory, setAIMemory] = useState<CardMemory>(createMemory());
  const [isDealingComplete, setIsDealingComplete] = useState(false);
  const [hasLoadedSavedGame, setHasLoadedSavedGame] = useState(false);
  const [isProcessingScoring, setIsProcessingScoring] = useState(false);

  // Mutex to prevent concurrent state updates
  const stateMutex = useRef(new StateMutex());
  const isUpdatingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winnerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doubleTapGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playCardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deadlock detector to prevent freezes - DISABLED for now
  // The 3-second timeout is too aggressive for human players who need time to think
  // This was causing false positives when users were just considering their moves
  const deadlockDetector = useRef(
    new DeadlockDetector(30000, () => {
      // Changed from 3s to 30s
      console.error('🚨 Deadlock detected in game state');
      // Force clear the updating flag
      isUpdatingRef.current = false;

      // More aggressive recovery - force AI to play if it's stuck
      setGameState(prev => {
        if (!prev) return null;

        const currentPlayer = prev.players[prev.currentPlayerIndex];

        // Only force play if it's a bot's turn
        if (currentPlayer.isBot) {
          const botHand = prev.hands.get(currentPlayer.id);
          if (botHand && botHand.length > 0) {
            console.error('🚨 FORCING BOT TO PLAY:', currentPlayer.name);

            // Get valid cards
            const validCards = getValidCards(botHand, prev, currentPlayer.id);
            const cardToPlay = validCards.length > 0 ? validCards[0] : botHand[0];

            // Force play the card directly in state
            const newHands = new Map(prev.hands);
            const currentHand = [...(newHands.get(currentPlayer.id) || [])];
            const cardIndex = currentHand.findIndex(c => c.id === cardToPlay.id);
            if (cardIndex !== -1) {
              currentHand.splice(cardIndex, 1);
              newHands.set(currentPlayer.id, currentHand);

              const newTrick = [
                ...prev.currentTrick,
                { playerId: currentPlayer.id, card: cardToPlay },
              ];

              // Check if trick is complete
              if (newTrick.length === 4) {
                // Complete trick logic
                const winnerId = calculateTrickWinner(newTrick, prev.trumpSuit);
                const points = calculateTrickPoints(newTrick);
                const winnerTeam = findPlayerTeam(winnerId, prev);

                // Handle team detection failure - log warning but continue
                if (!winnerTeam) {
                  console.warn('Team detection failed for winner:', winnerId);
                }

                const newTeams = [...prev.teams] as [Team, Team];
                const teamIndex = winnerTeam ? newTeams.findIndex(t => t.id === winnerTeam) : -1;
                if (teamIndex !== -1) {
                  newTeams[teamIndex] = {
                    ...newTeams[teamIndex],
                    score: newTeams[teamIndex].score + points,
                    cardPoints: newTeams[teamIndex].cardPoints + points,
                  };
                }

                const winnerIndex = prev.players.findIndex(p => p.id === winnerId);

                return {
                  ...prev,
                  hands: newHands,
                  currentTrick: [],
                  currentPlayerIndex: winnerIndex,
                  teams: newTeams,
                  trickCount: prev.trickCount + 1,
                  lastTrickWinner: winnerId,
                  lastActionTimestamp: Date.now(),
                };
              } else {
                // Move to next player
                const nextPlayerIndex = getNextPlayerIndex(prev.currentPlayerIndex, 4);
                return {
                  ...prev,
                  hands: newHands,
                  currentTrick: newTrick,
                  currentPlayerIndex: nextPlayerIndex,
                  lastActionTimestamp: Date.now(),
                };
              }
            }
          }
        }

        // Fallback - just update timestamp
        return {
          ...prev,
          lastActionTimestamp: Date.now(),
        };
      });
    }),
  );

  // Deadlock detector disabled - it was causing false positives
  // When humans are playing, they need time to think (more than 3 seconds!)
  // This was triggering errors when users were just considering their moves
  // TODO: Re-enable only for bot turns with a longer timeout
  // useEffect(() => {
  //   deadlockDetector.current.start();
  //   return () => {
  //     deadlockDetector.current.stop();
  //   };
  // }, []);

  // Record state changes to prevent deadlock detection
  // Disabled along with the deadlock detector
  useEffect(() => {
    if (gameState) {
      // deadlockDetector.current.recordStateChange();
    }
  }, [gameState]);

  // Ensure dealing animations can run: whenever we enter dealing phase, clear the completion flag
  useEffect(() => {
    if (gameState?.phase === 'dealing') {
      setIsDealingComplete(false);
    }
  }, [gameState?.phase]);

  // Defensive: if we enter dealing with hands already populated and no pendingHands,
  // convert current hands into pendingHands so the dealing animation can play properly.
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase !== 'dealing') return;
    if (gameState.pendingHands) return;
    if (gameState.hands.size === 0) return;

    setGameState(prev => {
      if (!prev) return prev;
      if (prev.phase !== 'dealing') return prev;
      if (prev.pendingHands) return prev;
      if (prev.hands.size === 0) return prev;

      console.warn('♻️ Converting pre-filled hands to pendingHands for dealing animation');
      return {
        ...prev,
        pendingHands: new Map(prev.hands),
        hands: new Map(),
      } as GameState;
    });
  }, [gameState]);

  // Initialize game
  const hasInitializedRef = useRef(false);
  const initialPlayerNamesRef = useRef<string[] | undefined>(undefined);

  useEffect(() => {
    const initializeGame = async () => {
      // Guard against multiple initializations within the same mount
      if (hasInitializedRef.current) {
        return;
      }

      // Capture initial playerNames snapshot for local/online-localized mapping once
      if (initialPlayerNamesRef.current === undefined && playerNames && playerNames.length > 0) {
        // Store a stable copy
        initialPlayerNamesRef.current = [...playerNames];
      }

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

        // Build teams dynamically from mock data players
        let mockTeam1Players = players.filter(p => p.teamId === 'team1').map(p => p.id);
        let mockTeam2Players = players.filter(p => p.teamId === 'team2').map(p => p.id);

        // Validate mock data team sizes
        if (mockTeam1Players.length !== 2 || mockTeam2Players.length !== 2) {
          console.warn('Mock data has invalid team sizes, using fallback', {
            team1: mockTeam1Players,
            team2: mockTeam2Players,
          });

          // Use hardcoded fallback for mock data
          mockTeam1Players =
            mockTeam1Players.length === 2
              ? mockTeam1Players
              : ['player' as PlayerId, 'bot2' as PlayerId];
          mockTeam2Players =
            mockTeam2Players.length === 2
              ? mockTeam2Players
              : ['bot1' as PlayerId, 'bot3' as PlayerId];
        }

        const teams: [Team, Team] = [
          {
            id: 'team1' as TeamId,
            playerIds: mockTeam1Players as [PlayerId, PlayerId],
            score: 0,
            cardPoints: 0,
            cantes: [],
          },
          {
            id: 'team2' as TeamId,
            playerIds: mockTeam2Players as [PlayerId, PlayerId],
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
          const botCards = Array.from({ length: mockData.players[i].cards }, (_, j) => ({
            id: `card_bot${i}_${j}` as CardId,
            suit: 'oros' as SpanishSuit,
            value: 1 as CardValue,
          }));
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
          teamTrickPiles: new Map([
            [teams[0].id, []],
            [teams[1].id, []],
          ]),
          canCambiar7: true,
          gameHistory: [],
          isVueltas: false,
          canDeclareVictory: false,
          matchScore: createInitialMatchScore(),
        };

        setGameState(newGameState);
        return;
      }

      // Authoritative server initialization for online games
      if (serverInitProvider) {
        try {
          const snapshot = await serverInitProvider();

          // Build players from provided playerNames in fixed seat order (0..3)
          const names: string[] = (playerNames && playerNames.length >= 4)
            ? [...playerNames].slice(0, 4)
            : ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'];

          const players: Player[] = names.map((name, index) => ({
            id: (`pos${index}`) as PlayerId,
            name,
            avatar: ['👤', '👧', '👨', '👴'][index % 4],
            ranking: 1000 + index * 100,
            teamId: (index % 2 === 0 ? 'team1' : 'team2') as TeamId,
            isBot: Array.isArray(onlinePlayersIsBotByPosition)
              ? !!onlinePlayersIsBotByPosition[index]
              : false,
          }));

          // Convert server hands (by position) to a map keyed by player ids
          const hands = new Map<PlayerId, Card[]>();
          for (let i = 0; i < Math.min(4, snapshot.handsByPosition.length); i++) {
            const pid = players[i].id;
            const cards = snapshot.handsByPosition[i]?.map(c => ({
              id: c.id as any,
              suit: c.suit,
              value: c.value,
            })) || [];
            hands.set(pid, cards as any);
          }

          const trumpCard = {
            id: snapshot.trumpCard.id as any,
            suit: snapshot.trumpCard.suit,
            value: snapshot.trumpCard.value,
          } as Card;

          const deck = snapshot.deck.map(c => ({
            id: c.id as any,
            suit: c.suit,
            value: c.value,
          })) as Card[];

          const newGameState: GameState = {
            id: (gameId || `game_${Date.now()}`) as GameId,
            phase: 'dealing',
            players,
            teams: [
              { id: 'team1' as TeamId, playerIds: [players[0].id, players[2].id] as [PlayerId, PlayerId], score: 0, cardPoints: 0, cantes: [] },
              { id: 'team2' as TeamId, playerIds: [players[1].id, players[3].id] as [PlayerId, PlayerId], score: 0, cardPoints: 0, cantes: [] },
            ],
            deck,
            hands: new Map() as ReadonlyMap<PlayerId, ReadonlyArray<Card>>, // Start empty to allow dealing animation
            pendingHands: hands as ReadonlyMap<PlayerId, ReadonlyArray<Card>>, // Use server hands
            trumpSuit: trumpCard.suit,
            trumpCard,
            currentTrick: [],
            currentPlayerIndex: Math.max(0, Math.min(3, snapshot.currentPlayerIndex | 0)),
            dealerIndex: Math.max(0, Math.min(3, snapshot.dealerIndex | 0)),
            trickCount: 0,
            trickWins: new Map(),
            collectedTricks: new Map(),
            teamTrickPiles: new Map([
              ['team1' as TeamId, []],
              ['team2' as TeamId, []],
            ]),
            canCambiar7: true,
            gameHistory: [],
            isVueltas: false,
            canDeclareVictory: false,
            matchScore: createInitialMatchScore(),
          };

          setGameState(newGameState);
          setIsDealingComplete(false);
          hasInitializedRef.current = true;
          return;
        } catch (e) {
          console.error('Failed to initialize from server snapshot; not falling back to local init in online mode:', e);
          // In online mode, avoid creating a divergent local game. Wait for realtime or retry later.
          return;
        }
      }

      // Original initialization logic
      let players: Player[];

      const stablePlayerNames =
        initialPlayerNamesRef.current && initialPlayerNamesRef.current.length > 0
          ? initialPlayerNamesRef.current
          : playerNames;

      if (stablePlayerNames && stablePlayerNames.length >= 2) {
        // Local multiplayer mode
        const avatars = ['👤', '👧', '👨', '👴'];
        players = stablePlayerNames.slice(0, 4).map((name, index) => ({
          id: `player${index}` as PlayerId,
          name: name || `Jugador ${index + 1}`,
          avatar: avatars[index],
          ranking: 1000 + index * 100,
          teamId: (index % 2 === 0 ? 'team1' : 'team2') as TeamId,
          isBot: false,
        }));

        // Fill remaining slots with bots if less than 4 players
        if (players.length < 4) {
          const aiPersonalities: AIPersonality[] = ['prudent', 'aggressive', 'tricky'];
          const botNames = ['Ana la Prudente', 'Carlos el Valiente', 'María la Astuta'];
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

      // Build teams dynamically from actual player IDs
      let team1Players = players.filter(p => p.teamId === 'team1').map(p => p.id);
      let team2Players = players.filter(p => p.teamId === 'team2').map(p => p.id);

      // Validate team sizes - each team must have exactly 2 players
      if (team1Players.length !== 2 || team2Players.length !== 2) {
        console.error('Invalid team configuration', {
          team1Count: team1Players.length,
          team2Count: team2Players.length,
          team1Players,
          team2Players,
          allPlayers: players.map(p => ({ id: p.id, teamId: p.teamId })),
        });

        // For offline mode, we can't throw - must provide fallback
        // Use hardcoded fallback as last resort to prevent game breaking
        const validTeam1 =
          team1Players.length === 2 ? team1Players : ['player' as PlayerId, 'bot2' as PlayerId];
        const validTeam2 =
          team2Players.length === 2 ? team2Players : ['bot1' as PlayerId, 'bot3' as PlayerId];

        team1Players = validTeam1;
        team2Players = validTeam2;

        console.warn('Using hardcoded fallback teams to prevent game crash', {
          team1: team1Players,
          team2: team2Players,
        });
      }

      const teams: [Team, Team] = [
        {
          id: 'team1' as TeamId,
          playerIds: team1Players as [PlayerId, PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: team2Players as [PlayerId, PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
      ];

      // If deterministicInit is provided (or awaited), use seeded shuffle
      let init = deterministicInit;
      if (!init && waitForDeterministicInit) {
        // Non-host devices can wait for host seed
        try {
          init = await waitForDeterministicInit();
        } catch {}
      }

      const deck = init
        ? shuffleDeckWithSeed(createDeck(), init.seed)
        : shuffleDeck(createDeck());
      const { hands, remainingDeck } = dealInitialCards(
        deck,
        players.map(p => p.id),
      );

      // Use the last card of the remaining deck as the trump and remove it from the draw pile
      const trumpCard = remainingDeck[remainingDeck.length - 1];
      const deckAfterTrump = remainingDeck.slice(0, -1);

      // Select dealer (random or deterministic)
      const dealerIndex = init ? Math.max(0, Math.min(3, init.dealerIndex | 0)) : Math.floor(Math.random() * 4);
      // First player (mano) is to dealer's right (counter-clockwise), unless provided
      const firstPlayerIndex = init && typeof init.firstPlayerIndex === 'number'
        ? Math.max(0, Math.min(3, init.firstPlayerIndex | 0))
        : (dealerIndex - 1 + 4) % 4;

      const newGameState: GameState = {
        id: (gameId || `game_${Date.now()}`) as GameId,
        phase: 'dealing',
        players,
        teams,
        deck: deckAfterTrump,
        hands: new Map() as ReadonlyMap<PlayerId, ReadonlyArray<Card>>, // Start with empty hands for animation
        pendingHands: hands as ReadonlyMap<PlayerId, ReadonlyArray<Card>>, // Store dealt cards to be animated
        trumpSuit: trumpCard.suit,
        trumpCard,
        currentTrick: [],
        currentPlayerIndex: firstPlayerIndex,
        dealerIndex,
        trickCount: 0,
        trickWins: new Map(),
        collectedTricks: new Map(),
        teamTrickPiles: new Map([
          [teams[0].id, []],
          [teams[1].id, []],
        ]),
        canCambiar7: true,
        gameHistory: [],
        isVueltas: false,
        canDeclareVictory: false,
        matchScore: createInitialMatchScore(),
      };

      setGameState(newGameState);
      setIsDealingComplete(false);
      hasInitializedRef.current = true;
    };

    // Fire and forget
    initializeGame();
    // Intentionally exclude playerNames to avoid re-initialization loops when array identity changes
    // Only re-init when core settings change or mockData changes
  }, [playerName, gameId, mockData, difficulty]);

  // Internal function to actually play the card (after animation)
  const actuallyPlayCard = useCallback(
    (cardId: CardId | string) => {
      setGameState(prevState => {
        if (!prevState) return null;

        const currentPlayer = prevState.players[prevState.currentPlayerIndex];
        const playerHand = prevState.hands.get(currentPlayer.id);
        if (!playerHand) return prevState;

        const card = playerHand.find(c => c.id === cardId);
        if (!card) return prevState;

        // Remove card from player's hand
        const newHands = new Map(prevState.hands);
        const currentHand = [...(newHands.get(currentPlayer.id) || [])];
        const cardIndex = currentHand.findIndex(c => c.id === cardId);
        currentHand.splice(cardIndex, 1);
        newHands.set(currentPlayer.id, currentHand);

        // Add card to current trick
        const newTrick = [...prevState.currentTrick, { playerId: currentPlayer.id, card }];

        // Update AI memory for all played cards
        setAIMemory(prev => {
          const updated = updateMemory(prev, currentPlayer.id, card);
          // Clear memory if it's getting too large to prevent memory leaks
          if (shouldClearMemory(updated)) {
            return clearMemory();
          }
          return updated;
        });

        // Clear animation state now that the card is placed
        const clearedAnimationState = { ...prevState, cardPlayAnimation: undefined };

        // Check if trick is complete
        if (newTrick.length === 4) {
          // Calculate winner and points
          const winnerId = calculateTrickWinner(newTrick, prevState.trumpSuit);
          const points = calculateTrickPoints(newTrick);
          const winnerTeam = findPlayerTeam(winnerId, prevState);

          // Handle team detection failure
          if (!winnerTeam) {
            console.warn('Team detection failed for trick winner:', winnerId);
          }

          // Update scores
          let newTeams = [...prevState.teams] as [Team, Team];
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

          // Do NOT add to team trick piles yet – wait until the animation completes

          // Prepare pending draws if deck has cards, but do NOT mutate hands/deck yet
          const pendingDraws: Array<{
            playerId: PlayerId;
            card: Card;
            source: 'deck' | 'trump';
          }> = [];
          const deckSnapshot = [...prevState.deck];
          if (deckSnapshot.length > 0 && prevState.phase === 'playing') {
            // Winner draws first, then counter-clockwise
            const drawOrder = [winnerId];
            let nextIndex = prevState.players.findIndex(p => p.id === winnerId);
            for (let i = 0; i < 3; i++) {
              nextIndex = getNextPlayerIndex(nextIndex, 4);
              drawOrder.push(prevState.players[nextIndex].id);
            }

            const initialDeckCountForRound = deckSnapshot.length;
            let trumpAwarded = false;

            drawOrder.forEach(playerId => {
              if (deckSnapshot.length > 0) {
                const drawnCard = deckSnapshot.pop();
                if (drawnCard) {
                  pendingDraws.push({ playerId, card: drawnCard, source: 'deck' });
                }
              } else if (!trumpAwarded && initialDeckCountForRound < 4) {
                // Award the face-up trump to complete the round of draws
                pendingDraws.push({ playerId, card: prevState.trumpCard, source: 'trump' });
                trumpAwarded = true;
              }
            });
          }

          // Winner starts next trick
          const winnerIndex = prevState.players.findIndex(p => p.id === winnerId);

          // Check if this is the last trick of the game (deck already empty and hands empty before trick)
          const isLastTrick =
            prevState.deck.length === 0 &&
            Array.from(newHands.values()).every(hand => hand.length === 0);

          // Award last trick bonus if applicable
          let lastTrickBonusApplied = false;
          if (isLastTrick) {
            const teamIdx = newTeams.findIndex(t => t.id === winnerTeam);
            if (teamIdx !== -1) {
              newTeams[teamIdx] = {
                ...newTeams[teamIdx],
                score: newTeams[teamIdx].score + 10, // diez de últimas
              };
              lastTrickBonusApplied = true;
            }
          }

          // Determine if we will enter arrastre after dealing (computed but applied after dealing commits)
          const willEnterArrastre = deckSnapshot.length === 0 && !prevState.isVueltas;
          if (willEnterArrastre) {
          }

          // Early-finish check for VUELTAS: if combined totals reach 101+, end hand now
          const reached101InVueltas = (() => {
            if (!prevState.isVueltas || !prevState.initialScores) return false;
            const team1 = newTeams[0];
            const team2 = newTeams[1];
            const idasScore1 = prevState.initialScores.get(team1.id) || 0;
            const idasScore2 = prevState.initialScores.get(team2.id) || 0;
            const vueltasScore1 = team1.score;
            const vueltasScore2 = team2.score;
            const t1 = idasScore1 + vueltasScore1;
            const t2 = idasScore2 + vueltasScore2;
            
            const shouldEnd = t1 >= WINNING_SCORE || t2 >= WINNING_SCORE;
            
            if (shouldEnd) {
              console.log('🚨 [VUELTAS BUG CHECK] Early finish triggered:', {
                team1: { idas: idasScore1, vueltas: vueltasScore1, total: t1 },
                team2: { idas: idasScore2, vueltas: vueltasScore2, total: t2 },
                WINNING_SCORE,
                trickCount: prevState.trickCount,
                isLastTrick,
              });
            }
            
            return shouldEnd;
          })();

          // Don't clear the trick immediately - show animation first
          const nextStateAfterTrick: GameState = {
            ...clearedAnimationState,
            hands: newHands,
            // Keep deck unchanged until post-trick dealing animation commits
            deck: prevState.deck,
            currentTrick: newTrick, // Keep the full trick visible
            currentPlayerIndex: winnerIndex,
            teams: newTeams,
            trickCount: newTrickCount,
            collectedTricks: newCollectedTricks,
            teamTrickPiles: prevState.teamTrickPiles,
            lastTrickWinner: winnerId,
            lastTrick: newTrick,
            // If vueltas reached 101+, do not schedule post-trick dealing
            pendingPostTrickDraws: reached101InVueltas
              ? undefined
              : pendingDraws.length > 0
              ? pendingDraws
              : undefined,
            // Provide metadata for last trick overlay and points
            pendingTrickWinner: {
              playerId: winnerId,
              points: points + (lastTrickBonusApplied ? 10 : 0),
              cards: newTrick.map(tc => tc.card),
              teamId: winnerTeam as TeamId,
              isLastTrick,
              bonus: lastTrickBonusApplied ? 10 : 0,
            },
            phase: isLastTrick ? 'scoring' : prevState.phase,
            // Defer starting vueltas until the user taps "Continuar" from the scoring screen.
            // We only mark isVueltas and capture initialScores inside initializeVueltasState()
            // which is called by continueFromScoring(). This prevents premature VUELTAS state
            // during the Fin de Mano overlay.
            isVueltas: prevState.isVueltas,
            initialScores: prevState.initialScores,
            lastActionTimestamp: Date.now(),
            trickAnimating: false,
            // Keep cambiar7 until arrastre actually starts after dealing
            canCambiar7: prevState.canCambiar7,
          } as GameState;

          // If VUELTAS immediate victory, end partida right away (show celebration)
          if (reached101InVueltas) {
            console.log('🏁 Vueltas early finish: combined totals reached 101+, ending partida');
            return processVueltasCompletion(nextStateAfterTrick);
          }

          // Start trick animation after a short delay so last card settles visually
          if (winnerTimeoutRef.current) clearTimeout(winnerTimeoutRef.current);
          winnerTimeoutRef.current = setTimeout(() => {
            setGameState(p => (p ? { ...p, trickAnimating: true } : p));
          }, 250);

          return nextStateAfterTrick;
        }

        // Next player's turn
        const nextPlayerIndex = getNextPlayerIndex(prevState.currentPlayerIndex, 4);
        return {
          ...clearedAnimationState,
          hands: newHands,
          currentTrick: newTrick,
          currentPlayerIndex: nextPlayerIndex,
          lastActionTimestamp: Date.now(),
        };
      });
    },
    [setAIMemory],
  );

  // Play a card
  const playCard = useCallback(
    (cardId: CardId | string) => {
      if (!gameState || (gameState.phase !== 'playing' && gameState.phase !== 'arrastre')) return;
      // Hard block plays during trick/post-trick animations and the pre-dealing pause
      if (
        gameState.trickAnimating ||
        gameState.postTrickDealingAnimating ||
        (gameState as any).postTrickDealingPending ||
        gameState.cardPlayAnimation
      ) {
        console.warn('⚠️ Blocked playCard: animations or dealing in progress');
        return;
      }

      // Prevent concurrent updates with simple flag
      if (isUpdatingRef.current) {
        console.warn('⚠️ Blocked concurrent playCard call');
        return;
      }

      isUpdatingRef.current = true;
      try {
        // Record activity for deadlock detection
        deadlockDetector.current.recordStateChange();

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const playerHand = gameState.hands.get(currentPlayer.id);
        if (!playerHand) return;

        const card = playerHand.find(c => c.id === cardId);
        if (!card) return;

        const cardIndex = playerHand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

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

        // First, trigger the animation
        setGameState(prevState => {
          if (!prevState) return null;
          return {
            ...prevState,
            cardPlayAnimation: {
              playerId: currentPlayer.id,
              card,
              cardIndex,
            },
          };
        });

        // Clear any existing timeout for previous card play
        if (playCardTimeoutRef.current) {
          clearTimeout(playCardTimeoutRef.current);
          playCardTimeoutRef.current = null;
        }

        // Schedule the actual card play to happen after animation
        playCardTimeoutRef.current = setTimeout(() => {
          actuallyPlayCard(cardId);
          playCardTimeoutRef.current = null;
        }, CARD_PLAY_DELAY);
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [gameState, actuallyPlayCard],
  );

  // Cantar
  const cantar = useCallback(
    (suit: SpanishSuit) => {
      if (!gameState || gameState.phase !== 'playing') return;

      // Prevent concurrent updates
      if (isUpdatingRef.current) {
        console.warn('⚠️ Blocked concurrent cantar call');
        return;
      }

      isUpdatingRef.current = true;
      try {
        // Record activity for deadlock detection
        deadlockDetector.current.recordStateChange();

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const currentPlayerTeamId = findPlayerTeam(currentPlayer.id, gameState);

        // Can cantar at game start (mano) or after your team won the previous trick
        const lastWinner = gameState.lastTrickWinner;
        const lastWinnerTeamId = lastWinner ? findPlayerTeam(lastWinner, gameState) : undefined;
        const isGameStart = !lastWinner && gameState.trickCount === 0;
        const isFirstPlayer = gameState.currentPlayerIndex === (gameState.dealerIndex - 1 + 4) % 4;

        // Check if trick hasn't started yet
        if (gameState.currentTrick.length !== 0) {
          console.warn('Cannot cantar during a trick!');
          return;
        }

        if (!currentPlayerTeamId) {
          console.warn('Player has no team!');
          return;
        }

        // Check if it's a valid time to cantar
        if (!isGameStart) {
          // Not game start, so must have won last trick
          if (!lastWinnerTeamId || currentPlayerTeamId !== lastWinnerTeamId) {
            console.warn('Can only cantar after winning a trick!');
            return;
          }
        } else if (!isFirstPlayer) {
          // At game start, only mano can cantar
          console.warn('Only mano can cantar at game start!');
          return;
        }

        const playerHand = gameState.hands.get(currentPlayer.id);
        const playerTeam = findPlayerTeam(currentPlayer.id, gameState);
        if (!playerHand || !playerTeam) return;

        const team = gameState.teams.find(t => t.id === playerTeam);
        if (!team) return;

        const cantableSuits = canCantar(playerHand, gameState.trumpSuit, team.cantes);
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

          // Early finish during VUELTAS if combined totals reach 101+
          const reached101InVueltas = (() => {
            if (!prevState.isVueltas || !prevState.initialScores) return false;
            const team1 = newTeams[0];
            const team2 = newTeams[1];
            const t1 = (prevState.initialScores.get(team1.id) || 0) + team1.score;
            const t2 = (prevState.initialScores.get(team2.id) || 0) + team2.score;
            return t1 >= WINNING_SCORE || t2 >= WINNING_SCORE;
          })();

          if (reached101InVueltas) {
            console.log('🏁 Vueltas early finish via cante: combined totals reached 101+');
            const updated = { ...prevState, teams: newTeams } as GameState;
            return processVueltasCompletion(updated);
          }

          return {
            ...prevState,
            teams: newTeams,
            lastActionTimestamp: Date.now(), // Trigger AI re-run after cante
            phase: isGameOver({ ...prevState, teams: newTeams })
              ? 'gameOver'
              : 'playing',
          };
        });
      } finally {
        isUpdatingRef.current = false;
      }
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
    if (!gameState || gameState.phase !== 'playing' || !gameState.canCambiar7) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    // CAMBIAR7: Can be used anytime it's your turn and you have the 7 of trumps
    // No need to check last trick winner - just needs to be player's turn

    const playerHand = gameState.hands.get(currentPlayer.id);
    if (!playerHand) return;

    if (!canCambiar7(playerHand, gameState.trumpCard, gameState.deck.length)) return;

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

      // The table's trump card is stored in trumpCard and visible under the stock.
      // Replace the visible trump with the seven, and give the previous trump to the player.
      // Deck order should NOT be modified - only the visible trump card changes
      return {
        ...prevState,
        hands: newHands,
        trumpCard: seven,
        canCambiar7: false,
        deck: prevState.deck, // Keep deck unchanged
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
    return gameState.players[gameState.currentPlayerIndex].id === ('player' as PlayerId);
  }, [gameState]);

  // Create a unique key for the current turn to prevent re-triggers
  // Include phase, hand size, and timestamp to ensure uniqueness
  const currentTurnKey = gameState
    ? `${gameState.currentPlayerIndex}-${gameState.trickCount}-${gameState.currentTrick.length}-${
        gameState.phase
      }-${gameState.hands.get(gameState.players[gameState.currentPlayerIndex].id)?.length || 0}-${
        gameState.lastActionTimestamp || 0
      }-deal:${isDealingComplete ? 1 : 0}`
    : '';

  // Use the custom AI turn hook
  const shouldRunLocalBots = (() => {
    if (autoPlayBotsMode === 'never') return false;
    if (autoPlayBotsMode === 'host-only') return !!isHost;
    return true;
  })();

  const wrappedPlayCardForBot = useCallback(
    (cardId: string) => {
      // Online/friends: delegate to server only; wait for realtime snapshot
      if (onBotAction && isHost) {
        try {
          onBotAction({ type: 'play_card', cardId });
          return;
        } catch {}
      }
      // Offline/local: mutate local engine immediately
      (playCard as any)(cardId);
    },
    [onBotAction, playCard, isHost],
  );

  const wrappedCantarForBot = useCallback(
    (suit: SpanishSuit) => {
      (cantar as any)(suit);
      try {
        onBotAction?.({ type: 'declare_cante', suit });
      } catch {}
    },
    [onBotAction, cantar],
  );

  const { thinkingPlayer } = useAITurn({
    gameState,
    currentTurnKey,
    mockData,
    playCard: shouldRunLocalBots ? wrappedPlayCardForBot : (() => {}) as any,
    cantar: shouldRunLocalBots ? wrappedCantarForBot : (() => {}) as any,
    aiMemory,
    setAIMemory,
    isDealingComplete,
  });

  // Auto-save game state with debouncing
  useEffect(() => {
    if (!gameState || gameState.phase === 'gameOver') return;
    if (persistenceMode === 'never') return;

    // Clear any existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save after 500ms of no changes
    saveTimeoutRef.current = setTimeout(() => {
      saveGameState(gameState).catch(error => {
        console.error('Failed to save game state:', error);
      });
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [gameState]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (winnerTimeoutRef.current) {
        clearTimeout(winnerTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (playCardTimeoutRef.current) {
        clearTimeout(playCardTimeoutRef.current);
      }
    };
  }, []);

  // Load saved game on mount (only once)
  useEffect(() => {
    if (persistenceMode === 'never') {
      setHasLoadedSavedGame(true);
      return;
    }
    if (!hasLoadedSavedGame && !gameState && !mockData) {
      loadGameState()
        .then(savedState => {
          if (savedState) {
            // Normalize loaded state to avoid being stuck in non-playing phases/animations
            const normalizedState: GameState = {
              ...savedState,
              // Only skip dealing animation for initial game dealing, not vueltas
              phase: (() => {
                if (savedState.phase === 'dealing' && !savedState.isVueltas) {
                  return 'playing' as GamePhase;
                }
                return savedState.phase;
              })(),
              // Ensure we are not stuck waiting for an animation that won't replay on load
              trickAnimating: false,
              pendingTrickWinner: undefined,
              // Bump timestamp so AI effects compute a fresh turn key
              lastActionTimestamp: Date.now(),
            };
            setGameState(normalizedState);
            setIsDealingComplete(true); // Skip dealing animation for loaded games
          }
          setHasLoadedSavedGame(true);
        })
        .catch(error => {
          console.error('Failed to load saved game:', error);
          setHasLoadedSavedGame(true);
        });
    }
  }, [hasLoadedSavedGame, gameState, mockData]);

  // Handle vueltas dealing - Safety fallback only
  // Do NOT pre-populate hands here; that bypasses the dealing animation overlay.
  // If something went wrong and pendingHands were not prepared, create them now so the
  // animation can proceed normally and commit via completeDealingAnimation().
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase !== 'dealing' || !gameState.isVueltas) return;

    // Normal path: initializeVueltasState sets pendingHands and leaves hands empty.
    if (gameState.pendingHands && gameState.hands.size === 0) {
      return; // All good – let the dealing overlay run
    }

    // Fallback path: only when both hands are empty AND pendingHands are missing.
    if (gameState.hands.size === 0 && !gameState.pendingHands) {
      const deck = shuffleDeck(createDeck());
      const { hands, remainingDeck } = dealInitialCards(
        deck,
        gameState.players.map(p => p.id),
      );

      const trumpCard = remainingDeck[remainingDeck.length - 1];
      const deckAfterTrump = remainingDeck.slice(0, -1);

      setGameState(prev => ({
        ...prev!,
        deck: deckAfterTrump,
        pendingHands: hands, // Use pendingHands so the dealing animation can play
        trumpCard,
        trumpSuit: trumpCard.suit,
      }));
    }
  }, [
    gameState?.phase,
    gameState?.isVueltas,
    gameState?.hands.size,
    gameState?.players,
    gameState?.pendingHands,
  ]);

  // Extra robustness: if we ever end up in VUELTAS with empty hands and not in dealing phase,
  // re-initialize vueltas properly to trigger the dealing animation.
  useEffect(() => {
    if (!gameState) return;
    if (gameState.isVueltas && gameState.hands.size === 0 && gameState.phase !== 'dealing') {
      console.warn('⚠️ Detected invalid vueltas state (no hands, not dealing). Reinitializing.');
      const newState = initializeVueltasState(gameState);
      setGameState(newState);
      setIsDealingComplete(false);
      setAIMemory(clearMemory());
    }
  }, [gameState]);

  // Complete dealing animation
  const completeDealingAnimation = useCallback(() => {
    setIsDealingComplete(true);
    setGameState(prev => {
      if (!prev) return prev;

      // Move cards from pendingHands to actual hands
      const newHands = prev.pendingHands || prev.hands;

      return {
        ...prev,
        phase: 'playing' as GamePhase,
        hands: newHands,
        pendingHands: undefined, // Clear pending hands after animation
      };
    });
  }, []);

  // Complete card play animation
  const completeCardPlayAnimation = useCallback(() => {
    // Animation complete - card has already been played via actuallyPlayCard
    // No additional action needed since actuallyPlayCard handles everything
  }, []);

  // Complete trick animation
  const completeTrickAnimation = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;

      // End trick animation but keep trick visible already cleared by animation; schedule post-trick dealing
      const shouldStartPostDealing = (prev.pendingPostTrickDraws?.length || 0) > 0;

      // Commit last trick to winner's team pile now that the animation finished
      let committedPiles = prev.teamTrickPiles;
      if (prev.lastTrick && prev.lastTrickWinner) {
        const winnerTeamId = prev.teams.find(t =>
          t.playerIds.includes(prev.lastTrickWinner as PlayerId),
        )?.id;
        if (winnerTeamId) {
          const m = new Map(committedPiles);
          const arr = [...(m.get(winnerTeamId) || [])];
          // Idempotency: only append if this exact trick isn't already present
          const keyOf = (tr: ReadonlyArray<TrickCard>) =>
            tr
              .map(tc => tc.card.id)
              .sort()
              .join('-');
          const lastKey = keyOf(prev.lastTrick);
          const already = arr.some((t: ReadonlyArray<TrickCard>) => keyOf(t) === lastKey);
          if (!already) {
            arr.push([...prev.lastTrick]);
          }
          m.set(winnerTeamId, arr);
          committedPiles = m;
        }
      }

      let nextState = {
        ...prev,
        currentTrick: [],
        trickAnimating: false,
        pendingTrickWinner: undefined,
        teamTrickPiles: committedPiles,
      } as GameState;

      if (shouldStartPostDealing) {
        // Start post-trick dealing after a 2s pause
        setTimeout(() => {
          setGameState(p =>
            p ? { ...p, postTrickDealingAnimating: true, postTrickDealingPending: false } : p,
          );
        }, 2000);
        // Block interactions during the pause window
        nextState = { ...nextState, postTrickDealingPending: true } as GameState;
        // Log draw order for debugging mapping issues
        const names = (prev.pendingPostTrickDraws || []).map(
          d => prev.players.find(p => p.id === d.playerId)?.name || String(d.playerId),
        );
      }

      return nextState;
    });
  }, []);

  // Complete post-trick dealing: commit pending draws and update phase/flags
  const completePostTrickDealing = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      const draws = prev.pendingPostTrickDraws || [];
      if (draws.length === 0) {
        return { ...prev, postTrickDealingAnimating: false, postTrickDealingPending: false };
      }

      // Apply draws in order
      const newHands = new Map(prev.hands);
      const newDeck = [...prev.deck];
      let trumpConsumed = false;
      draws.forEach(d => {
        const newHand = [...(newHands.get(d.playerId) || [])];
        newHand.push(d.card);
        newHands.set(d.playerId, newHand);
        if (d.source === 'deck') {
          // Remove the specific card from the top of deck (it should match pop order)
          const top = newDeck.pop();
          // In case of mismatch, fallback to removing by id
          if (top && top.id !== d.card.id) {
            const idx = newDeck.findIndex(c => c.id === d.card.id);
            if (idx !== -1) newDeck.splice(idx, 1);
          }
        } else if (d.source === 'trump') {
          trumpConsumed = true;
        }
      });

      // Determine phase: enter arrastre if deck empty now
      const deckNowEmpty = newDeck.length === 0;
      const nextPhase: GamePhase = deckNowEmpty
        ? 'arrastre'
        : prev.phase === 'dealing'
        ? 'playing'
        : prev.phase;

      const nextState = {
        ...prev,
        hands: newHands,
        deck: newDeck,
        // If trump was consumed, leave trumpCard value as-is but deck count drives visibility
        postTrickDealingAnimating: false,
        postTrickDealingPending: false,
        pendingPostTrickDraws: undefined,
        phase: nextPhase,
        // Disable cambiar7 in arrastre
        canCambiar7: nextPhase === 'arrastre' ? false : prev.canCambiar7,
        lastActionTimestamp: Date.now(),
      } as GameState;
      return nextState;
    });
  }, []);

  /**
   * Apply an authoritative server snapshot.
   * Maps seat-indexed hands to current player ids in order, and updates
   * core turn fields. Keeps existing phase/animation flags intact.
   */
  const applyServerSnapshot = useCallback(
    (snapshot: {
      handsByPosition: Array<ReadonlyArray<{ id: string; suit: SpanishSuit; value: CardValue }>>;
      deck: ReadonlyArray<{ id: string; suit: SpanishSuit; value: CardValue }>;
      trumpCard: { id: string; suit: SpanishSuit; value: CardValue };
      currentPlayerIndex: number;
      dealerIndex: number;
      tableCards?: Array<{ playerId: PlayerId; card: { id: string; suit: SpanishSuit; value: CardValue } }>;
      version?: number;
      lastAction?: { type?: string } | null;
      phase?: string | null;
    }) => {
      setGameState(prev => {
        if (!prev) return prev;

        const playersInSeatOrder = prev.players; // 0..3

        // Build new hands map from seat-indexed snapshot
        const newHands = new Map<PlayerId, Card[]>();
        for (let i = 0; i < Math.min(4, snapshot.handsByPosition.length); i++) {
          const playerId = playersInSeatOrder[i]?.id as PlayerId | undefined;
          if (!playerId) continue;
          const cards = (snapshot.handsByPosition[i] || []).map(c => ({
            id: c.id as any,
            suit: c.suit,
            value: c.value,
          })) as Card[];
          newHands.set(playerId, cards);
        }

        const newDeck = snapshot.deck.map(c => ({ id: c.id as any, suit: c.suit, value: c.value })) as Card[];
        const newTrump = {
          id: snapshot.trumpCard.id as any,
          suit: snapshot.trumpCard.suit,
          value: snapshot.trumpCard.value,
        } as Card;

        // Optionally map server table cards to currentTrick
        const mappedTrick = Array.isArray(snapshot.tableCards)
          ? snapshot.tableCards.map(tc => ({
              playerId: tc.playerId as PlayerId,
              card: { id: tc.card.id as any, suit: tc.card.suit, value: tc.card.value } as Card,
            }))
          : prev.currentTrick;

        // Diff detection
        const prevTrickLen = (prev.currentTrick || []).length;
        const nextTrickLen = (mappedTrick || []).length;

        const tableCardAdded = nextTrickLen === prevTrickLen + 1;
        const trickCollected = prevTrickLen > 0 && nextTrickLen === 0;

        // Helper: compute added cards in hands per player (by id)
        const computeAddedCardsByPlayer = () => {
          const added = new Map<PlayerId, Card[]>();
          for (const p of prev.players) {
            const pid = p.id as PlayerId;
            const before = new Map((prev.hands.get(pid) || []).map(c => [String(c.id), c]));
            const after = newHands.get(pid) || [];
            const addList: Card[] = [];
            for (const c of after) {
              if (!before.has(String(c.id))) {
                addList.push(c);
              }
            }
            if (addList.length > 0) added.set(pid, addList);
          }
          return added;
        };

        // Case 1: Trick collected → animate collection and prepare dealing overlay
        // Prefer server signal via last_action.type === 'end_trick'
        const serverSaysEndTrick = (snapshot as any)?.lastAction?.type === 'end_trick';
        if (trickCollected || serverSaysEndTrick) {
          const prevTrick = prev.currentTrick || [];
          // Determine winner and points from last visible trick
          let winnerId = prev.lastTrickWinner as PlayerId | undefined;
          try {
            if (!winnerId && prevTrick.length > 0) {
              winnerId = calculateTrickWinner(prevTrick as any, newTrump.suit) as PlayerId;
            }
          } catch {}

          const points = (() => {
            try {
              return calculateTrickPoints(prevTrick as any);
            } catch {
              return 0;
            }
          })();

          // Prepare pending draws by diffing hands
          const addedByPlayer = computeAddedCardsByPlayer();
          const pendingDraws: Array<{ playerId: PlayerId; card: Card; source: 'deck' | 'trump' }> = [];

          // Determine draw order winner → counter-clockwise
          const winnerIndex = winnerId
            ? prev.players.findIndex(p => p.id === winnerId)
            : Math.max(0, Math.min(3, snapshot.currentPlayerIndex | 0));
          const drawOrder: PlayerId[] = [];
          let idx = winnerIndex;
          for (let i = 0; i < 4; i++) {
            drawOrder.push(prev.players[idx]?.id as PlayerId);
            idx = getNextPlayerIndex(idx, 4);
          }

          // Compute how many draws came from deck vs trump
          const addedTotal = Array.from(addedByPlayer.values()).reduce((sum, arr) => sum + arr.length, 0);
          const deckDelta = Math.max(0, (prev.deck?.length || 0) - (newDeck?.length || 0));
          const trumpDraws = Math.max(0, addedTotal - deckDelta);

          // Assign sources in draw order; if multiple cards added to same player, preserve list order
          const trumpRecipients = new Set<string>();
          let trumpRemaining = trumpDraws;
          for (const pid of drawOrder) {
            const addList = addedByPlayer.get(pid) || [];
            for (const c of addList) {
              let source: 'deck' | 'trump' = 'deck';
              if (trumpRemaining > 0) {
                // Assign trump to the last recipients in the order if near deck exhaustion
                source = 'trump';
                trumpRemaining--;
                trumpRecipients.add(String(pid));
              }
              pendingDraws.push({ playerId: pid, card: c, source });
            }
          }

          const winnerTeam = winnerId
            ? prev.teams.find(t => t.playerIds.includes(winnerId! as PlayerId))?.id
            : undefined;

          return {
            ...prev,
            // Defer hands/deck update until overlays commit
            hands: prev.hands,
            deck: prev.deck,
            // Clear table (server already cleared) but keep trick for overlay visuals
            currentTrick: prev.currentTrick,
            trickAnimating: true,
            pendingTrickWinner: winnerId
              ? {
                  playerId: winnerId,
                  points,
                  cards: prevTrick.map(t => t.card),
                  teamId: (winnerTeam || prev.teams[0].id) as TeamId,
                }
              : prev.pendingTrickWinner,
            pendingPostTrickDraws: pendingDraws.length > 0 ? pendingDraws : undefined,
            postTrickDealingPending: pendingDraws.length > 0 ? true : prev.postTrickDealingPending,
            // Keep turn and indices from server
            currentPlayerIndex: Math.max(0, Math.min(3, snapshot.currentPlayerIndex | 0)),
            dealerIndex: Math.max(0, Math.min(3, snapshot.dealerIndex | 0)),
            trumpCard: newTrump,
            trumpSuit: newTrump.suit,
            lastActionTimestamp: Date.now(),
          } as GameState;
        }

        // Case 2: A new table card was added → animate fly-from-hand
        // Do not animate or mutate if server is still in dealing phase
        const serverDealing = (snapshot as any)?.phase === 'dealing';
        if (!serverDealing && tableCardAdded) {
          // Identify the new play by card id difference
          const prevIds = new Set((prev.currentTrick || []).map(tc => String(tc.card.id)));
          const newPlay = (mappedTrick || []).find(tc => !prevIds.has(String(tc.card.id)));
          const actorId = newPlay?.playerId as PlayerId | undefined;

          // Determine hand index BEFORE removal for proper start position
          let cardIndex = 0;
          if (actorId) {
            const beforeHand = prev.hands.get(actorId) || [];
            const idxInHand = beforeHand.findIndex(c => String(c.id) === String(newPlay?.card.id));
            cardIndex = idxInHand >= 0 ? idxInHand : Math.max(0, beforeHand.length - 1);
          }

          // Schedule overlay cleanup slightly after animation duration
          setTimeout(() => {
            setGameState(p => (p ? { ...p, cardPlayAnimation: undefined } : p));
          }, Math.max(320, (CARD_PLAY_DELAY || 350)));

          // Guard against duplicate overlay when same card already animating
          const dupOverlay =
            prev.cardPlayAnimation &&
            String(prev.cardPlayAnimation.card?.id) === String(newPlay?.card.id) &&
            prev.cardPlayAnimation.playerId === actorId;

          return {
            ...prev,
            // Apply authoritative hands immediately so the played card disappears from hand
            hands: newHands,
            currentTrick: mappedTrick,
            cardPlayAnimation:
              !dupOverlay && actorId && newPlay
                ? {
                    playerId: actorId,
                    card: {
                      id: newPlay.card.id as any,
                      suit: newPlay.card.suit,
                      value: newPlay.card.value,
                    } as Card,
                    cardIndex,
                  }
                : prev.cardPlayAnimation,
            // Turn/indices from server
            currentPlayerIndex: Math.max(0, Math.min(3, snapshot.currentPlayerIndex | 0)),
            dealerIndex: Math.max(0, Math.min(3, snapshot.dealerIndex | 0)),
            trumpCard: newTrump,
            trumpSuit: newTrump.suit,
            lastActionTimestamp: Date.now(),
          } as GameState;
        }

        // Case 3: Normal commit (no animation-sensitive event) → apply server state
        return {
          ...prev,
          hands: newHands,
          deck: newDeck,
          trumpCard: newTrump,
          trumpSuit: newTrump.suit,
          currentPlayerIndex: Math.max(0, Math.min(3, snapshot.currentPlayerIndex | 0)),
          dealerIndex: Math.max(0, Math.min(3, snapshot.dealerIndex | 0)),
          currentTrick: mappedTrick,
          // Clear any stale play overlay
          cardPlayAnimation: nextTrickLen === 0 ? undefined : prev.cardPlayAnimation,
          lastActionTimestamp: Date.now(),
        } as GameState;
      });
    },
    [],
  );

  // Commit a single dealt card as it lands (incremental update so hands reflect immediately)
  const onPostTrickCardLanded = useCallback(
    (draw: { playerId: PlayerId; card: Card; source: 'deck' | 'trump' }) => {
      let shouldFinalizeAfterLast = false;
      setGameState(prev => {
        if (!prev) return prev;
        const pending = prev.pendingPostTrickDraws || [];
        // Remove one matching pending draw (first occurrence). Guard if not found to avoid loops
        const idx = pending.findIndex(
          d =>
            d.playerId === draw.playerId && d.card.id === draw.card.id && d.source === draw.source,
        );
        if (idx === -1) {
          // Fallback: if deck pop order progressed, try matching by player and source only (last occurrence)
          let fallbackIdx = -1;
          for (let i = pending.length - 1; i >= 0; i--) {
            const pd = pending[i];
            if (pd.playerId === draw.playerId && pd.source === draw.source) {
              fallbackIdx = i;
              break;
            }
          }
          if (fallbackIdx === -1) {
            console.warn('⚠️ onPostTrickCardLanded: draw not found in pending list, skipping', {
              playerId: draw.playerId,
              cardId: draw.card.id,
              source: draw.source,
              pendingCount: pending.length,
            });
            return prev; // no progress -> skip
          }
          // Use fallback index
          const remaining = [...pending.slice(0, fallbackIdx), ...pending.slice(fallbackIdx + 1)];
          const newHands = new Map(prev.hands);
          const hand = [...(newHands.get(draw.playerId) || [])];
          hand.push(draw.card);
          newHands.set(draw.playerId, hand);

          const newDeck = [...prev.deck];
          if (draw.source === 'deck') {
            newDeck.pop();
          }

          const playerName =
            prev.players.find(p => p.id === draw.playerId)?.name || String(draw.playerId);

          return {
            ...prev,
            hands: newHands,
            deck: newDeck,
            pendingPostTrickDraws: remaining,
          };
        }
        const remaining = [...pending.slice(0, idx), ...pending.slice(idx + 1)];

        // Apply to hands/deck incrementally with de-duplication by id
        const newHands = new Map(prev.hands);
        const hand = [...(newHands.get(draw.playerId) || [])];
        if (!hand.some(c => String(c.id) === String(draw.card.id))) {
          hand.push(draw.card);
        }
        newHands.set(draw.playerId, hand);

        const newDeck = [...prev.deck];
        if (draw.source === 'deck') {
          const top = newDeck.pop();
          if (top && top.id !== draw.card.id) {
            const didx = newDeck.findIndex(c => c.id === draw.card.id);
            if (didx !== -1) newDeck.splice(didx, 1);
          }
        } else if (draw.source === 'trump') {
          // nothing to pop from deck; visibility of trump is tied to deck count
        }

        const playerName =
          prev.players.find(p => p.id === draw.playerId)?.name || String(draw.playerId);

        if (remaining.length === 0) {
          // Schedule a safety finalize in case overlay onComplete is missed due to a race
          shouldFinalizeAfterLast = true;
        }

        if (remaining.length === 0) {
          const deckNowEmpty = newDeck.length === 0;
          const nextPhase: GamePhase = deckNowEmpty ? 'arrastre' : prev.phase;
          return {
            ...prev,
            hands: newHands,
            deck: newDeck,
            pendingPostTrickDraws: undefined,
            postTrickDealingAnimating: false,
            postTrickDealingPending: false,
            phase: nextPhase,
            canCambiar7: nextPhase === 'arrastre' ? false : prev.canCambiar7,
            lastActionTimestamp: Date.now(),
          };
        }
        return {
          ...prev,
          hands: newHands,
          deck: newDeck,
          pendingPostTrickDraws: remaining,
        };
      });
      if (shouldFinalizeAfterLast) {
        setTimeout(() => {
          // Double-check state flags in case overlay already finalized
          completePostTrickDealing();
        }, 120);
      }
    },
    [completePostTrickDealing],
  );

  // Safety watchdog for post-trick dealing overlay
  useEffect(() => {
    if (!gameState?.postTrickDealingAnimating) return;
    const draws = gameState.pendingPostTrickDraws?.length || 0;
    // Align with PostTrickDealingAnimation timings: 440ms per card + 60ms gap, add safety buffer
    const expectedMs = draws > 0 ? Math.ceil(draws * (440 + 60) + 350) : 900;
    const watchdog = setTimeout(() => {
      // Force-complete if animation did not signal completion
      completePostTrickDealing();
    }, expectedMs);
    return () => clearTimeout(watchdog);
  }, [
    gameState?.postTrickDealingAnimating,
    gameState?.pendingPostTrickDraws,
    completePostTrickDealing,
  ]);

  // Rescue starter: begin post-trick dealing ONLY after trick animation fully completed
  useEffect(() => {
    if (!gameState) return;
    const hasPendingDraws = (gameState.pendingPostTrickDraws?.length || 0) > 0;
    const shouldStart =
      hasPendingDraws &&
      !gameState.trickAnimating &&
      !gameState.pendingTrickWinner && // ensure onComplete cleared it
      !gameState.postTrickDealingAnimating &&
      !gameState.postTrickDealingPending;
    if (shouldStart) {
      console.warn('⚠️ Starting post-trick dealing via rescue starter');
      setGameState(prev => (prev ? { ...prev, postTrickDealingAnimating: true } : prev));
    }
  }, [
    gameState?.pendingPostTrickDraws,
    gameState?.trickAnimating,
    gameState?.pendingTrickWinner,
    gameState?.postTrickDealingAnimating,
    gameState?.postTrickDealingPending,
  ]);

  // Safety: if pending is true but overlay is not active and there are no draws, clear pending
  useEffect(() => {
    if (
      gameState?.postTrickDealingPending &&
      !gameState.postTrickDealingAnimating &&
      (gameState.pendingPostTrickDraws?.length || 0) === 0
    ) {
      console.warn('⚠️ Clearing stuck postTrickDealingPending flag');
      setGameState(prev => (prev ? { ...prev, postTrickDealingPending: false } : prev));
    }
  }, [
    gameState?.postTrickDealingPending,
    gameState?.postTrickDealingAnimating,
    gameState?.pendingPostTrickDraws,
  ]);

  // Safety watchdog: ensure trick animation cannot hang AI turns
  useEffect(() => {
    if (!gameState?.trickAnimating) return;

    const watchdog = setTimeout(() => {
      setGameState(prev => {
        if (!prev || !prev.trickAnimating) return prev;
        // Auto-complete trick if animation did not signal completion
        return {
          ...prev,
          currentTrick: [],
          trickAnimating: false,
          pendingTrickWinner: undefined,
        };
      });
    }, 2200); // ~2.2s to exceed animation durations comfortably

    return () => clearTimeout(watchdog);
  }, [gameState?.trickAnimating]);

  // Get valid cards for current player
  const getValidCardsForCurrentPlayer = useCallback((): Card[] => {
    if (!gameState) return [];

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const playerHand = gameState.hands.get(currentPlayer.id);

    if (!playerHand) return [];

    return getValidCards(playerHand, gameState, currentPlayer.id);
  }, [gameState]);

  // Continue from scoring phase (either to vueltas or end partida)
  const continueFromScoring = useCallback(() => {
    if (!gameState || gameState.phase !== 'scoring') {
      return;
    }

    // Guard against multiple clicks
    if (isProcessingScoring) {
      console.log('⚠️ Already processing scoring, ignoring duplicate call');
      return;
    }
    setIsProcessingScoring(true);

    console.log('📊 continueFromScoring called', {
      isVueltas: gameState.isVueltas,
      team1Score: gameState.teams[0].score,
      team2Score: gameState.teams[1].score,
      initialScores: gameState.initialScores,
    });

    // CASE 1: Completing vueltas - check for winner and transition to next partida
    if (gameState.isVueltas) {
      console.log('🎯 Processing vueltas completion');
      const newState = processVueltasCompletion(gameState);
      setGameState(newState);

      // Reset dealing complete flag to trigger animation if starting new partida
      if (newState.phase === 'dealing') {
        console.log('🎴 Starting new partida after vueltas');
        setIsDealingComplete(false);
        setAIMemory(clearMemory());
      }

      setIsProcessingScoring(false);
      return;
    }

    // CASE 2: Just finished first hand (idas) - decide whether partida ended or start vueltas
    const team1Score = gameState.teams[0].score;
    const team2Score = gameState.teams[1].score;

    if (team1Score >= WINNING_SCORE || team2Score >= WINNING_SCORE) {
      // Team reached 101 in first hand - end partida and update match score
      console.log('🏆 Team reached 101 in first hand, ending partida');
      setGameState(prev => {
        if (!prev) return prev;
        const currentMatchScore = prev.matchScore || createInitialMatchScore();
        const winningTeamIndex = team1Score >= WINNING_SCORE ? 0 : 1;
        const { matchScore: updatedMatchScore } = updateMatchScoreAndDeterminePhase(
          winningTeamIndex,
          currentMatchScore,
        );

        console.log('📈 Match score updated', {
          team1Partidas: updatedMatchScore.team1Partidas,
          team2Partidas: updatedMatchScore.team2Partidas,
          team1Cotos: updatedMatchScore.team1Cotos,
          team2Cotos: updatedMatchScore.team2Cotos,
        });

        return {
          ...prev,
          phase: 'gameOver',
          matchScore: updatedMatchScore,
        };
      });
      setIsProcessingScoring(false);
      return;
    }

    // No team reached 101 - proceed to vueltas (second hand)
    console.log('🔄 No team reached 101, starting vueltas');
    const newState = initializeVueltasState(gameState);
    setGameState(newState);
    setIsDealingComplete(false);
    setAIMemory(clearMemory());
    setIsProcessingScoring(false);
  }, [gameState, isProcessingScoring]);

  // Start vueltas after showing celebration
  const startVueltas = useCallback(() => {
    if (!gameState || !gameState.pendingVueltas) {
      return;
    }

    const newState = initializeVueltasState(gameState);
    setGameState(newState);
    setIsDealingComplete(false);
    setAIMemory(clearMemory());
  }, [gameState]);

  const declareVictory = useCallback(() => {
    if (!gameState?.isVueltas || gameState.currentTrick.length > 0) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const team = gameState.teams.find(t => t.playerIds.includes(currentPlayer.id));

    if (!team) return false;

    if (canDeclareVictory(team.id, gameState)) {
      // Correct declaration - team wins the partida
      setGameState(prev => {
        if (!prev) return null;

        const currentMatchScore = prev.matchScore || createInitialMatchScore();
        const winningTeamIndex = prev.teams.findIndex(t => t.id === team.id);

        // Validate team index
        if (!isValidTeamIndex(winningTeamIndex)) {
          console.error('⚠️ Invalid winning team index:', winningTeamIndex);
          return prev;
        }

        // Update match score and determine next phase
        const { matchScore: updatedMatchScore } = updateMatchScoreAndDeterminePhase(
          winningTeamIndex,
          currentMatchScore,
        );

        return {
          ...prev,
          // Show celebration immediately for partidas/cotos/match
          phase: 'gameOver',
          matchScore: updatedMatchScore,
        };
      });
      return true;
    } else {
      // Incorrect declaration - other team wins the partida
      const otherTeam = gameState.teams.find(t => t.id !== team.id);
      if (otherTeam) {
        setGameState(prev => {
          if (!prev) return null;

          const currentMatchScore = prev.matchScore || createInitialMatchScore();
          const winningTeamIndex = prev.teams.findIndex(t => t.id === otherTeam.id);

          // Validate team index
          if (!isValidTeamIndex(winningTeamIndex)) {
            console.error('⚠️ Invalid winning team index:', winningTeamIndex);
            return prev;
          }

          // Update match score and determine next phase
          const { matchScore: updatedMatchScore } = updateMatchScoreAndDeterminePhase(
            winningTeamIndex,
            currentMatchScore,
          );

          return {
            ...prev,
            teams: prev.teams.map(t => (t.id === otherTeam.id ? { ...t, score: 101 } : t)) as [
              Team,
              Team,
            ],
            // Show celebration immediately
            phase: 'gameOver',
            matchScore: updatedMatchScore,
          };
        });
      }
      return false;
    }
  }, [gameState]);

  // Declare renuncio
  const declareRenuncio = useCallback(
    (reason: string) => {
      if (!gameState) return;

      // The declaring team (player's team) loses, opponent wins
      const playerTeam = gameState.teams.find(t => t.playerIds.includes(gameState.players[0].id));
      const otherTeam = gameState.teams.find(t => t.id !== playerTeam?.id);

      if (otherTeam) {
        setGameState(prev => {
          if (!prev) return null;

          const currentMatchScore = prev.matchScore || createInitialMatchScore();
          const winningTeamIndex = prev.teams.findIndex(t => t.id === otherTeam.id);

          // Validate team index
          if (!isValidTeamIndex(winningTeamIndex)) {
            console.error('⚠️ Invalid winning team index:', winningTeamIndex);
            return prev;
          }

          // Update match score and determine next phase
          const { matchScore: updatedMatchScore, phase } = updateMatchScoreAndDeterminePhase(
            winningTeamIndex,
            currentMatchScore,
          );

          return {
            ...prev,
            teams: prev.teams.map(t => (t.id === otherTeam.id ? { ...t, score: 101 } : t)) as [
              Team,
              Team,
            ],
            phase,
            matchScore: updatedMatchScore,
          };
        });
      }
    },
    [gameState],
  );

  // Continue to next partida after one team wins a partida/coto
  const continueToNextPartida = useCallback(() => {
    // Prevent double-tap using the same pattern as VoiceButton
    if (doubleTapGuardRef.current) {
      console.log('⛔ continueToNextPartida blocked by doubleTapGuard');
      return;
    }

    doubleTapGuardRef.current = setTimeout(() => {
      doubleTapGuardRef.current = null;
    }, 500);

    // Start a new partida using the latest state snapshot (idempotent)
    setGameState(prev => {
      if (!prev) return null;

      // The match score in prev is already updated by continueFromScoring
      const currentMatchScore = prev.matchScore || createInitialMatchScore();

      // Don't allow continuing if match is complete (safety check)
      if (isMatchComplete(currentMatchScore)) {
        console.log('🏁 Match already complete. Blocking continue.');
        return prev;
      }

      // Start new partida with the updated match score regardless of current phase
      const next = startNewPartida(prev, currentMatchScore);
      console.log('✅ Starting next partida with matchScore:', currentMatchScore, 'from phase:', prev.phase, '-> next.phase:', next.phase);
      return next;
    });

    // Reset dealing complete flag to trigger animation
    setIsDealingComplete(false);

    // Clear AI memory for new partida
    setAIMemory(createMemory());
  }, []);

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
    continueToNextPartida,
    startVueltas,
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
    completeCardPlayAnimation,
    completePostTrickDealing,
    onPostTrickCardLanded,
    setGameState,
    applyServerSnapshot,
  };
}
