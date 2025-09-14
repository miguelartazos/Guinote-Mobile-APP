import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { createRealtimeClient } from './realtimeClient.native';

export type GameStateRow = {
  id: string;
  room_id: string;
  current_player: number | null;
  deck: any[] | null;
  hands: Record<string, any[]> | any[] | null;
  table_cards: any[] | null;
  tricks: any[] | null;
  scores: any | null;
  trump: any | null;
  phase: string | null;
  round_winner: number | null;
  game_winner: number | null;
  last_action: any | null;
  version: number;
  updated_at: string;
};

export async function fetchGameStateByRoom(roomId: string): Promise<GameStateRow | null> {
  const client = await createRealtimeClient();
  if (!client) return null;

  const { data, error } = await client
    .from('game_states')
    .select('*')
    .eq('room_id', roomId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (__DEV__) console.warn('[onlineGame] fetchGameStateByRoom error', error.message);
    return null;
  }
  return (data as unknown) as GameStateRow | null;
}

export async function subscribeToGameState(
  roomId: string,
  onUpdate: (row: GameStateRow) => void,
): Promise<() => void> {
  const client = await createRealtimeClient();
  if (!client) return () => {};

  const channel = client
    .channel(`room-db:${roomId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_states',
      filter: `room_id=eq.${roomId}`,
    }, (payload: any) => {
      if (payload?.new) {
        onUpdate(payload.new as GameStateRow);
      }
    })
    .subscribe();

  return () => {
    try {
      client.removeChannel(channel as RealtimeChannel);
    } catch {}
  };
}

export async function playCardRpc(
  roomId: string,
  cardId: string,
  expectedVersion?: number,
): Promise<{ success: boolean } | null> {
  const client = await createRealtimeClient();
  if (!client) return null;

  // Fetch latest game state id for room (authoritative variant)
  const { data: row, error: selErr } = await client
    .from('game_states')
    .select('id')
    .eq('room_id', roomId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selErr || !row?.id) {
    if (__DEV__) console.warn('[onlineGame] play_card fetch state id error', selErr?.message);
    return null;
  }

  const { data, error } = await (client as any).rpc('play_card', {
    p_game_state_id: row.id,
    p_card_id: cardId,
    p_expected_version: typeof expectedVersion === 'number' ? expectedVersion : null,
  });
  if (error) {
    if (__DEV__) console.warn('[onlineGame] play_card error', error.message);
    return null;
  }
  return (data as any) || { success: true };
}

export async function continueFromScoringRpc(gameStateId: string): Promise<{ success: boolean } | null> {
  const client = await createRealtimeClient();
  if (!client) return null;
  const { data, error } = await (client as any).rpc('continue_from_scoring', {
    p_game_state_id: gameStateId,
  });
  if (error) {
    if (__DEV__) console.warn('[onlineGame] continue_from_scoring error', error.message);
    return null;
  }
  return (data as any) || { success: true };
}

export async function declareCanteRpc(roomId: string, suit: string): Promise<{ success: boolean } | null> {
  const client = await createRealtimeClient();
  if (!client) return null;
  // Fetch latest game state id for room
  const { data: row, error: selErr } = await client
    .from('game_states')
    .select('id')
    .eq('room_id', roomId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selErr || !row?.id) return null;

  const { data, error } = await (client as any).rpc('declare_cante', {
    p_game_state_id: row.id,
    p_suit: suit,
  });
  if (error) {
    if (__DEV__) console.warn('[onlineGame] declare_cante error', error.message);
    return null;
  }
  return (data as any) || { success: true };
}

export async function exchangeSevenRpc(roomId: string): Promise<{ success: boolean } | null> {
  const client = await createRealtimeClient();
  if (!client) return null;
  const { data: row, error: selErr } = await client
    .from('game_states')
    .select('id')
    .eq('room_id', roomId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selErr || !row?.id) return null;

  const { data, error } = await (client as any).rpc('exchange_seven', {
    p_game_state_id: row.id,
  });
  if (error) {
    if (__DEV__) console.warn('[onlineGame] exchange_seven error', error.message);
    return null;
  }
  return (data as any) || { success: true };
}

export async function maybePlayBotTurnRpc(
  roomId: string,
  expectedVersion?: number,
): Promise<{ success: boolean } | null> {
  const client = await createRealtimeClient();
  if (!client) return null;
  const { data: row, error: selErr } = await client
    .from('game_states')
    .select('id')
    .eq('room_id', roomId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selErr || !row?.id) return null;

  const { data, error } = await (client as any).rpc('maybe_play_bot_turn', {
    p_game_state_id: row.id,
    p_expected_version: typeof expectedVersion === 'number' ? expectedVersion : null,
  });
  if (error) {
    if (__DEV__) console.warn('[onlineGame] maybe_play_bot_turn error', error.message);
    return null;
  }
  return (data as any) || { success: true };
}


