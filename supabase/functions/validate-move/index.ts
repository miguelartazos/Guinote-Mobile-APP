// Edge Function for move validation in multiplayer Guiñote
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
  value: number;
}

interface GameState {
  id: string;
  phase: 'dealing' | 'playing' | 'ended';
  trump_suit: string;
  trump_card: Card;
  current_trick: any[];
  hands: Card[][];
  deck: Card[];
  team_scores: number[];
  cantes: any[];
  is_vueltas: boolean;
  current_player_index: number;
  players: Array<{ id: string; teamId: string }>;
  teams: Array<{ id: string; score: number }>;
  last_trick_winner?: string;
  can_cambiar7?: boolean;
  can_declare_victory?: boolean;
}

interface GameMove {
  type: 'play_card' | 'cambiar_7' | 'declare_cante' | 'declare_victory';
  playerId: string;
  data: any;
  timestamp: number;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
  validatedAction?: GameMove;
  newVersion?: number;
}

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, number[]>();

// Idempotency store (in-memory, stores recent move hashes)
const processedMoves = new Map<string, number>();
const IDEMPOTENCY_WINDOW_MS = 5000; // 5 seconds

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [hash, timestamp] of processedMoves.entries()) {
    if (now - timestamp > IDEMPOTENCY_WINDOW_MS) {
      processedMoves.delete(hash);
    }
  }
}, 10000); // Clean every 10 seconds

function getMoveHash(move: GameMove): string {
  return `${move.playerId}_${move.type}_${move.timestamp}_${JSON.stringify(move.data)}`;
}

function checkRateLimit(playerId: string): boolean {
  const now = Date.now();
  const windowStart = now - 1000; // 1 second window
  
  let timestamps = rateLimitStore.get(playerId) || [];
  // Remove old timestamps outside the window
  timestamps = timestamps.filter(t => t > windowStart);
  
  if (timestamps.length >= 10) {
    // Max 10 moves per second
    return false;
  }
  
  timestamps.push(now);
  rateLimitStore.set(playerId, timestamps);
  return true;
}

function checkIdempotency(move: GameMove): boolean {
  const hash = getMoveHash(move);
  const existing = processedMoves.get(hash);
  
  if (existing) {
    // Move already processed
    return false;
  }
  
  processedMoves.set(hash, Date.now());
  return true;
}

function validatePlayerTurn(gameState: GameState, playerId: string): boolean {
  const currentPlayer = gameState.players[gameState.current_player_index];
  return currentPlayer && currentPlayer.id === playerId;
}

function validateCardOwnership(gameState: GameState, playerId: string, cardId: string): boolean {
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return false;
  
  const playerHand = gameState.hands[playerIndex];
  if (!playerHand) return false;
  
  return playerHand.some(c => c.id === cardId);
}

function isValidPlay(
  card: Card,
  hand: Card[],
  currentTrick: any[],
  trumpSuit: string,
  phase: string,
  playerId: string,
  gameState: GameState
): boolean {
  // Simplified validation - in production, would import full logic
  // For now, basic rules:
  
  if (phase !== 'playing') return false;
  
  // If first card in trick, any card is valid
  if (currentTrick.length === 0) {
    return true;
  }
  
  const leadSuit = currentTrick[0].card.suit;
  const hasLeadSuit = hand.some(c => c.suit === leadSuit);
  
  // Must follow suit if possible
  if (hasLeadSuit && card.suit !== leadSuit) {
    return false;
  }
  
  // If can't follow suit, any card is valid in arrastre
  if (!gameState.is_vueltas) {
    return true;
  }
  
  // In vueltas, more complex rules apply
  // Simplified: must play trump if no lead suit
  const hasTrump = hand.some(c => c.suit === trumpSuit);
  if (!hasLeadSuit && hasTrump && card.suit !== trumpSuit) {
    return false;
  }
  
  return true;
}

async function validateMove(
  gameState: GameState,
  move: GameMove,
  playerId: string
): Promise<ValidationResult> {
  // 1. Check rate limiting
  if (!checkRateLimit(playerId)) {
    return {
      valid: false,
      reason: 'Rate limit exceeded (max 10 moves/second)',
    };
  }
  
  // 2. Check idempotency
  if (!checkIdempotency(move)) {
    return {
      valid: false,
      reason: 'Duplicate move detected',
    };
  }
  
  // 3. Check if it's player's turn
  if (!validatePlayerTurn(gameState, playerId)) {
    return {
      valid: false,
      reason: 'Not your turn',
    };
  }
  
  // 4. Validate based on move type
  switch (move.type) {
    case 'play_card': {
      const cardId = move.data.cardId;
      
      // Check card ownership
      if (!validateCardOwnership(gameState, playerId, cardId)) {
        return {
          valid: false,
          reason: 'You do not own this card',
        };
      }
      
      // Get player's hand and the card
      const playerIndex = gameState.players.findIndex(p => p.id === playerId);
      const playerHand = gameState.hands[playerIndex];
      const card = playerHand.find(c => c.id === cardId);
      
      if (!card) {
        return {
          valid: false,
          reason: 'Card not found',
        };
      }
      
      // Check move legality
      if (!isValidPlay(
        card,
        playerHand,
        gameState.current_trick,
        gameState.trump_suit,
        gameState.phase,
        playerId,
        gameState
      )) {
        return {
          valid: false,
          reason: 'Invalid card play according to game rules',
        };
      }
      
      break;
    }
    
    case 'cambiar_7': {
      if (!gameState.can_cambiar7) {
        return {
          valid: false,
          reason: 'Cannot exchange 7 at this time',
        };
      }
      
      const playerIndex = gameState.players.findIndex(p => p.id === playerId);
      const playerHand = gameState.hands[playerIndex];
      
      const hasSeven = playerHand.some(c => 
        c.suit === gameState.trump_suit && c.value === 7
      );
      
      if (!hasSeven) {
        return {
          valid: false,
          reason: 'You do not have the 7 of trump',
        };
      }
      
      break;
    }
    
    case 'declare_cante': {
      if (gameState.phase !== 'playing') {
        return {
          valid: false,
          reason: 'Can only declare cante during playing phase',
        };
      }
      
      // Must have won last trick or be on same team
      if (!gameState.last_trick_winner) {
        return {
          valid: false,
          reason: 'No last trick winner',
        };
      }
      
      const player = gameState.players.find(p => p.id === playerId);
      const lastWinner = gameState.players.find(p => p.id === gameState.last_trick_winner);
      
      if (!player || !lastWinner) {
        return {
          valid: false,
          reason: 'Player not found',
        };
      }
      
      // Check if on same team
      if (player.teamId !== lastWinner.teamId) {
        return {
          valid: false,
          reason: 'Your team did not win the last trick',
        };
      }
      
      // Check if player has Rey and Sota
      const playerIndex = gameState.players.findIndex(p => p.id === playerId);
      const playerHand = gameState.hands[playerIndex];
      const suit = move.data.suit;
      
      const hasRey = playerHand.some(c => c.suit === suit && c.value === 12);
      const hasSota = playerHand.some(c => c.suit === suit && c.value === 10);
      
      if (!hasRey || !hasSota) {
        return {
          valid: false,
          reason: 'You do not have Rey and Sota of the declared suit',
        };
      }
      
      break;
    }
    
    case 'declare_victory': {
      if (!gameState.can_declare_victory) {
        return {
          valid: false,
          reason: 'Cannot declare victory at this time',
        };
      }
      
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) {
        return {
          valid: false,
          reason: 'Player not found',
        };
      }
      
      const team = gameState.teams.find(t => t.id === player.teamId);
      if (!team || team.score < 101) {
        return {
          valid: false,
          reason: 'Your team does not have enough points',
        };
      }
      
      break;
    }
    
    default:
      return {
        valid: false,
        reason: `Unknown move type: ${move.type}`,
      };
  }
  
  // Move is valid
  return {
    valid: true,
    validatedAction: move,
    newVersion: Date.now(), // Simple versioning using timestamp
  };
}

async function logValidation(
  supabase: any,
  gameStateId: string,
  playerId: string,
  move: GameMove,
  result: ValidationResult
): Promise<void> {
  try {
    await supabase.from('move_validations').insert({
      game_state_id: gameStateId,
      player_id: playerId,
      move_type: move.type,
      move_data: move.data,
      is_valid: result.valid,
      reason: result.reason,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Log error but don't fail the validation
    console.error('Failed to log validation:', error);
  }
}

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
    
    const { gameState, move, playerId } = await req.json();
    
    if (!gameState || !move || !playerId) {
      throw new Error('Missing required parameters: gameState, move, or playerId');
    }
    
    // Validate the move
    const result = await validateMove(gameState, move, playerId);
    
    // Log the validation attempt
    await logValidation(supabase, gameState.id, playerId, move, result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        valid: false,
        reason: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});