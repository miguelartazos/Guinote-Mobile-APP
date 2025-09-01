// Edge Function for AI player decision making in Guiñote
// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Card {
  id: string;
  suit: string;
  rank: number;
}

interface GameState {
  id: string;
  phase: string;
  trump_suit: string;
  trump_card: Card;
  current_trick: any[];
  hands: Card[][];
  deck: Card[];
  team_scores: number[];
  cantes: any[];
  is_vueltas: boolean;
}

interface AIDecision {
  action: 'play_card' | 'cantar' | 'cambiar7';
  card?: Card;
  suit?: string;
}

// Card point values
const getCardPoints = (rank: number): number => {
  switch (rank) {
    case 1:
      return 11; // As
    case 3:
      return 10; // Tres
    case 12:
      return 4; // Rey
    case 10:
      return 3; // Sota
    case 11:
      return 2; // Caballo
    default:
      return 0;
  }
};

// Get card rank for trick-taking (NOT points!)
const getCardRank = (rank: number): number => {
  switch (rank) {
    case 1:
      return 10; // As (highest)
    case 3:
      return 9; // Tres
    case 12:
      return 8; // Rey
    case 10:
      return 7; // Sota (beats Caballo)
    case 11:
      return 6; // Caballo (loses to Sota)
    case 7:
      return 5;
    case 6:
      return 4;
    case 5:
      return 3;
    case 4:
      return 2;
    case 2:
      return 1; // Dos (lowest)
    default:
      return 0;
  }
};

// Get card strength for trick winning
const getCardStrength = (card: Card, trumpSuit: string, leadSuit?: string): number => {
  const rankValue = getCardRank(card.rank);

  if (card.suit === trumpSuit) {
    return 1000 + rankValue; // Trump always wins
  } else if (card.suit === leadSuit) {
    return 100 + rankValue; // Must follow suit
  } else {
    return rankValue; // Can't win trick
  }
};

// Check if player can cantar (has Rey and Caballo of same suit)
const canCantar = (hand: Card[], trumpSuit: string, teamCantes: any[]): string[] => {
  const cantableSuits: string[] = [];
  const suits = ['oros', 'copas', 'espadas', 'bastos'];

  for (const suit of suits) {
    const hasRey = hand.some(c => c.suit === suit && c.rank === 12);
    const hasCaballo = hand.some(c => c.suit === suit && c.rank === 11);
    const alreadyCanted = teamCantes.some(c => c.suit === suit);

    if (hasRey && hasCaballo && !alreadyCanted) {
      cantableSuits.push(suit);
    }
  }

  return cantableSuits;
};

// Check if player can exchange 7 of trumps
const canCambiar7 = (
  hand: Card[],
  trumpSuit: string,
  trumpCard: Card,
  isVueltas: boolean,
): boolean => {
  if (isVueltas) return false; // Can't exchange in vueltas

  const hasSeven = hand.some(c => c.suit === trumpSuit && c.rank === 7);
  const trumpCardValue = getCardPoints(trumpCard.rank);

  // Only exchange if trump card is valuable
  return hasSeven && trumpCardValue >= 3;
};

// Get valid cards to play
const getValidCards = (
  hand: Card[],
  currentTrick: any[],
  trumpSuit: string,
  isVueltas: boolean,
): Card[] => {
  // If first to play, all cards are valid
  if (currentTrick.length === 0) {
    return hand;
  }

  const leadSuit = currentTrick[0].card.suit;
  const cardsOfLeadSuit = hand.filter(c => c.suit === leadSuit);

  // In arrastre, must follow suit if possible
  if (!isVueltas) {
    return cardsOfLeadSuit.length > 0 ? cardsOfLeadSuit : hand;
  }

  // In vueltas, more complex rules
  const trumpCards = hand.filter(c => c.suit === trumpSuit);
  const currentWinningCard = getCurrentWinningCard(currentTrick, trumpSuit);

  // Must follow suit if possible
  if (cardsOfLeadSuit.length > 0) {
    // If partner is winning, can play any card of suit
    if (isPartnerWinning(currentTrick, currentWinningCard)) {
      return cardsOfLeadSuit;
    }

    // Must try to win if possible
    const winningCards = cardsOfLeadSuit.filter(
      c =>
        getCardStrength(c, trumpSuit, leadSuit) >
        getCardStrength(currentWinningCard.card, trumpSuit, leadSuit),
    );

    return winningCards.length > 0 ? winningCards : cardsOfLeadSuit;
  }

  // No cards of lead suit - must play trump if possible
  if (trumpCards.length > 0) {
    if (currentWinningCard.card.suit === trumpSuit) {
      // Must play higher trump if possible
      const higherTrumps = trumpCards.filter(
        c => getCardStrength(c, trumpSuit) > getCardStrength(currentWinningCard.card, trumpSuit),
      );
      return higherTrumps.length > 0 ? higherTrumps : trumpCards;
    }
    return trumpCards;
  }

  // No trump or lead suit - can play anything
  return hand;
};

const getCurrentWinningCard = (trick: any[], trumpSuit: string): any => {
  if (trick.length === 0) return null;

  const leadSuit = trick[0].card.suit;
  let winner = trick[0];
  let winnerStrength = getCardStrength(trick[0].card, trumpSuit, leadSuit);

  for (let i = 1; i < trick.length; i++) {
    const strength = getCardStrength(trick[i].card, trumpSuit, leadSuit);
    if (strength > winnerStrength) {
      winner = trick[i];
      winnerStrength = strength;
    }
  }

  return winner;
};

const isPartnerWinning = (trick: any[], winningCard: any): boolean => {
  if (!winningCard || trick.length !== 2) return false;
  // In 4-player game, positions 0,2 and 1,3 are partners
  return winningCard.position % 2 === 0; // Simplified - assumes AI is at position 1 or 3
};

// Seeded random number generator for deterministic behavior
class SeededRandom {
  private seed: number;
  private readonly a = 16807;
  private readonly m = 2147483647;

  constructor(seed: number) {
    this.seed = seed % this.m || 1;
  }

  next(): number {
    this.seed = (this.a * this.seed) % this.m;
    return this.seed / this.m;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// AI decision making based on difficulty
const makeAIDecision = (
  gameState: GameState,
  playerIndex: number,
  difficulty: 'easy' | 'medium' | 'hard',
  personality?: 'aggressive' | 'conservative' | 'balanced',
  roomId?: string,
): AIDecision => {
  // Create seeded RNG if room ID provided - use trick count for deterministic behavior
  const rng = roomId
    ? new SeededRandom(
        hashString(`${roomId}_${gameState.id}_trick_${gameState.current_trick?.length || 0}`),
      )
    : null;
  const hand = gameState.hands[playerIndex];
  const teamIndex = playerIndex % 2;
  const teamCantes = gameState.cantes?.[teamIndex] || [];

  // Check for special actions first
  const cantableSuits = canCantar(hand, gameState.trump_suit, teamCantes);
  if (cantableSuits.length > 0) {
    // Cantar if we have 40s or if winning
    const fortyInTrump = cantableSuits.includes(gameState.trump_suit);
    const shouldCantar = fortyInTrump || gameState.team_scores[teamIndex] > 50;

    if (shouldCantar) {
      return {
        action: 'cantar',
        suit: fortyInTrump ? gameState.trump_suit : cantableSuits[0],
      };
    }
  }

  // Check for cambiar7
  if (canCambiar7(hand, gameState.trump_suit, gameState.trump_card, gameState.is_vueltas)) {
    return { action: 'cambiar7' };
  }

  // Get valid cards
  const validCards = getValidCards(
    hand,
    gameState.current_trick,
    gameState.trump_suit,
    gameState.is_vueltas,
  );

  // Select card based on difficulty and personality
  let selectedCard: Card;

  if (difficulty === 'easy') {
    // Easy AI: Random valid card (require RNG for deterministic behavior)
    if (!rng) {
      // Fallback to first valid card if no RNG available
      selectedCard = validCards[0];
    } else {
      const randomIndex = rng.nextInt(0, validCards.length - 1);
      selectedCard = validCards[randomIndex];
    }
  } else if (difficulty === 'medium') {
    // Medium AI: Basic strategy
    selectedCard = selectMediumCard(
      validCards,
      gameState.current_trick,
      gameState.trump_suit,
      personality || 'balanced',
      rng,
    );
  } else {
    // Hard AI: Advanced strategy
    selectedCard = selectHardCard(
      validCards,
      hand,
      gameState,
      playerIndex,
      personality || 'balanced',
      rng,
    );
  }

  return {
    action: 'play_card',
    card: selectedCard,
  };
};

// Helper function: Select a card when leading a trick
const selectLeadingCard = (
  sortedCards: Card[],
  personality: string,
  rng?: SeededRandom | null,
): Card => {
  if (personality === 'aggressive') {
    // Play high cards
    return sortedCards[0];
  } else if (personality === 'conservative') {
    // Play low cards
    return sortedCards[sortedCards.length - 1];
  } else {
    // Balanced: play medium value
    if (rng) {
      const midIndex = rng.nextInt(
        Math.floor(sortedCards.length / 3),
        Math.floor((2 * sortedCards.length) / 3),
      );
      return sortedCards[midIndex];
    } else {
      // Fallback to middle card if no RNG
      return sortedCards[Math.floor(sortedCards.length / 2)];
    }
  }
};

// Helper function: Select a card when following in a trick
const selectFollowingCard = (
  validCards: Card[],
  sortedCards: Card[],
  currentTrick: any[],
  trumpSuit: string,
): Card => {
  const winningCard = getCurrentWinningCard(currentTrick, trumpSuit);
  const leadSuit = currentTrick[0].card.suit;

  // Find cards that can win the trick
  const winningCards = validCards.filter(
    c =>
      getCardStrength(c, trumpSuit, leadSuit) >
      getCardStrength(winningCard.card, trumpSuit, leadSuit),
  );

  if (winningCards.length > 0) {
    // Try to win with lowest possible card
    winningCards.sort((a, b) => getCardPoints(a.rank) - getCardPoints(b.rank));
    return winningCards[0];
  } else {
    // Can't win - play lowest card
    return sortedCards[sortedCards.length - 1];
  }
};

const selectMediumCard = (
  validCards: Card[],
  currentTrick: any[],
  trumpSuit: string,
  personality: string,
  rng?: SeededRandom | null,
): Card => {
  // Sort cards by value
  const sortedCards = [...validCards].sort((a, b) => getCardPoints(b.rank) - getCardPoints(a.rank));

  if (currentTrick.length === 0) {
    // Leading the trick
    return selectLeadingCard(sortedCards, personality, rng);
  } else {
    // Following in trick
    return selectFollowingCard(validCards, sortedCards, currentTrick, trumpSuit);
  }
};

// Helper function: Adjust personality based on score situation
const adjustPersonalityByScore = (
  personality: string,
  ourScore: number,
  theirScore: number,
): string => {
  const scoreDiff = ourScore - theirScore;

  if (scoreDiff < -30) {
    return 'aggressive'; // Behind - need to be aggressive
  } else if (scoreDiff > 30) {
    return 'conservative'; // Ahead - play safe
  }

  return personality; // Keep original personality
};

const selectHardCard = (
  validCards: Card[],
  fullHand: Card[],
  gameState: GameState,
  playerIndex: number,
  personality: string,
  rng?: SeededRandom | null,
): Card => {
  // Advanced AI adjusts strategy based on score
  const teamIndex = playerIndex % 2;
  const ourScore = gameState.team_scores[teamIndex];
  const theirScore = gameState.team_scores[1 - teamIndex];

  const adjustedPersonality = adjustPersonalityByScore(personality, ourScore, theirScore);

  // Use medium strategy with score-based adjustments
  return selectMediumCard(
    validCards,
    gameState.current_trick,
    gameState.trump_suit,
    adjustedPersonality,
    rng,
  );
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-ignore - Deno global
    const supabaseUrl = (globalThis as any).Deno?.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore - Deno global
    const supabaseServiceKey = (globalThis as any).Deno?.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      gameStateId,
      roomId,
      playerIndex,
      difficulty = 'medium',
      personality = 'balanced',
    } = await req.json();

    // Get game state
    const { data: gameState, error: gameError } = await supabase
      .from('game_states')
      .select('*')
      .eq('id', gameStateId)
      .single();

    if (gameError) {
      throw new Error(`Failed to get game state: ${gameError.message}`);
    }

    // Make AI decision with room-seeded RNG for deterministic behavior
    const decision = makeAIDecision(gameState, playerIndex, difficulty, personality, roomId);

    // Execute the decision
    let result;
    switch (decision.action) {
      case 'play_card':
        const { error: playError } = await supabase.rpc('play_card', {
          p_game_state_id: gameStateId,
          p_card_id: decision.card!.id,
        });

        if (playError) {
          throw new Error(`Failed to play card: ${playError.message}`);
        }
        result = { success: true, action: 'played_card', card: decision.card };
        break;

      case 'cantar':
        const { error: cantarError } = await supabase.rpc('declare_cante', {
          p_game_state_id: gameStateId,
          p_suit: decision.suit!,
        });

        if (cantarError) {
          throw new Error(`Failed to cantar: ${cantarError.message}`);
        }
        result = { success: true, action: 'canted', suit: decision.suit };
        break;

      case 'cambiar7':
        const { error: cambiarError } = await supabase.rpc('exchange_seven', {
          p_game_state_id: gameStateId,
        });

        if (cambiarError) {
          throw new Error(`Failed to exchange seven: ${cambiarError.message}`);
        }
        result = { success: true, action: 'exchanged_seven' };
        break;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
