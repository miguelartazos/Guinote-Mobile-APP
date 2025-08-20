export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          elo: number;
          games_played: number;
          games_won: number;
          is_online: boolean;
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          elo?: number;
          games_played?: number;
          games_won?: number;
          is_online?: boolean;
          last_seen_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          elo?: number;
          games_played?: number;
          games_won?: number;
          is_online?: boolean;
          last_seen_at?: string;
          created_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          code: string;
          host_id: string;
          status: 'waiting' | 'playing' | 'finished' | 'abandoned';
          game_mode: string;
          is_public: boolean;
          max_players: number;
          current_players: number;
          created_at: string;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          host_id: string;
          status: 'waiting' | 'playing' | 'finished' | 'abandoned';
          game_mode?: string;
          is_public?: boolean;
          max_players?: number;
          current_players?: number;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          host_id?: string;
          status?: 'waiting' | 'playing' | 'finished' | 'abandoned';
          game_mode?: string;
          is_public?: boolean;
          max_players?: number;
          current_players?: number;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
      };
      room_players: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          position: number | null;
          team: number | null;
          is_ready: boolean;
          is_ai: boolean;
          ai_difficulty: string | null;
          ai_personality: string | null;
          connection_status: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          position?: number | null;
          team?: number | null;
          is_ready?: boolean;
          is_ai?: boolean;
          ai_difficulty?: string | null;
          ai_personality?: string | null;
          connection_status?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          position?: number | null;
          team?: number | null;
          is_ready?: boolean;
          is_ai?: boolean;
          ai_difficulty?: string | null;
          ai_personality?: string | null;
          connection_status?: string;
          joined_at?: string;
        };
      };
      game_states: {
        Row: {
          id: string;
          room_id: string;
          current_player: number | null;
          deck: Json | null;
          hands: Json | null;
          table_cards: Json | null;
          tricks: Json | null;
          scores: Json | null;
          trump: Json | null;
          phase: string | null;
          round_winner: number | null;
          game_winner: number | null;
          last_action: Json | null;
          version: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          current_player?: number | null;
          deck?: Json | null;
          hands?: Json | null;
          table_cards?: Json | null;
          tricks?: Json | null;
          scores?: Json | null;
          trump?: Json | null;
          phase?: string | null;
          round_winner?: number | null;
          game_winner?: number | null;
          last_action?: Json | null;
          version?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          current_player?: number | null;
          deck?: Json | null;
          hands?: Json | null;
          table_cards?: Json | null;
          tricks?: Json | null;
          scores?: Json | null;
          trump?: Json | null;
          phase?: string | null;
          round_winner?: number | null;
          game_winner?: number | null;
          last_action?: Json | null;
          version?: number;
          updated_at?: string;
        };
      };
      voice_messages: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          storage_path: string;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          storage_path: string;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          storage_path?: string;
          duration_ms?: number | null;
          created_at?: string;
        };
      };
      matchmaking_queue: {
        Row: {
          user_id: string;
          mode: string;
          joined_at: string;
        };
        Insert: {
          user_id: string;
          mode?: string;
          joined_at?: string;
        };
        Update: {
          user_id?: string;
          mode?: string;
          joined_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          accepted_at?: string | null;
        };
      };
      game_stats: {
        Row: {
          id: string;
          user_id: string;
          game_mode: 'ranked' | 'casual' | 'friends';
          won: boolean;
          elo_change: number;
          game_duration: number;
          points_scored: number;
          points_conceded: number;
          cantes: number;
          victories_20: number;
          victories_40: number;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_mode: 'ranked' | 'casual' | 'friends';
          won: boolean;
          elo_change: number;
          game_duration: number;
          points_scored: number;
          points_conceded: number;
          cantes: number;
          victories_20: number;
          victories_40: number;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_mode?: 'ranked' | 'casual' | 'friends';
          won?: boolean;
          elo_change?: number;
          game_duration?: number;
          points_scored?: number;
          points_conceded?: number;
          cantes?: number;
          victories_20?: number;
          victories_40?: number;
          timestamp?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      join_room: {
        Args: {
          p_room_code: string;
          p_position?: number;
        };
        Returns: Json;
      };
      start_game: {
        Args: {
          p_room_id: string;
        };
        Returns: Json;
      };
      play_card: {
        Args: {
          p_room_id: string;
          p_auth_user_id: string;
          p_card_id: string;
          p_expected_version: number;
        };
        Returns: Json;
      };
      cantar: {
        Args: {
          p_room_id: string;
          p_auth_user_id: string;
          p_suit: string;
          p_expected_version: number;
        };
        Returns: Json;
      };
      cambiar_7: {
        Args: {
          p_room_id: string;
          p_auth_user_id: string;
          p_expected_version: number;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
