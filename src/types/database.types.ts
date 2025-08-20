export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          ranking: number;
          games_played: number;
          games_won: number;
          total_sets_won: number;
          preferred_language: string;
          is_online: boolean;
          last_seen_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          ranking?: number;
          games_played?: number;
          games_won?: number;
          total_sets_won?: number;
          preferred_language?: string;
          is_online?: boolean;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          ranking?: number;
          games_played?: number;
          games_won?: number;
          total_sets_won?: number;
          preferred_language?: string;
          is_online?: boolean;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          code: string;
          host_id: string | null;
          game_state: Json | null;
          status: 'waiting' | 'playing' | 'finished' | 'abandoned';
          game_mode: 'ranked' | 'casual' | 'friend' | 'local';
          max_players: number;
          current_players: number;
          is_public: boolean;
          created_at: string;
          started_at: string | null;
          finished_at: string | null;
          last_activity_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          host_id?: string | null;
          game_state?: Json | null;
          status?: 'waiting' | 'playing' | 'finished' | 'abandoned';
          game_mode?: 'ranked' | 'casual' | 'friend' | 'local';
          max_players?: number;
          current_players?: number;
          is_public?: boolean;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
          last_activity_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          host_id?: string | null;
          game_state?: Json | null;
          status?: 'waiting' | 'playing' | 'finished' | 'abandoned';
          game_mode?: 'ranked' | 'casual' | 'friend' | 'local';
          max_players?: number;
          current_players?: number;
          is_public?: boolean;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
          last_activity_at?: string;
        };
      };
      room_players: {
        Row: {
          room_id: string;
          player_id: string;
          position: number;
          team_id: 'team1' | 'team2' | null;
          is_ready: boolean;
          is_bot: boolean;
          bot_difficulty: 'easy' | 'medium' | 'hard' | null;
          bot_personality: 'aggressive' | 'defensive' | 'balanced' | 'unpredictable' | null;
          connection_status: 'connected' | 'disconnected' | 'reconnecting';
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          room_id: string;
          player_id: string;
          position: number;
          team_id?: 'team1' | 'team2' | null;
          is_ready?: boolean;
          is_bot?: boolean;
          bot_difficulty?: 'easy' | 'medium' | 'hard' | null;
          bot_personality?: 'aggressive' | 'defensive' | 'balanced' | 'unpredictable' | null;
          connection_status?: 'connected' | 'disconnected' | 'reconnecting';
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          room_id?: string;
          player_id?: string;
          position?: number;
          team_id?: 'team1' | 'team2' | null;
          is_ready?: boolean;
          is_bot?: boolean;
          bot_difficulty?: 'easy' | 'medium' | 'hard' | null;
          bot_personality?: 'aggressive' | 'defensive' | 'balanced' | 'unpredictable' | null;
          connection_status?: 'connected' | 'disconnected' | 'reconnecting';
          joined_at?: string;
          left_at?: string | null;
        };
      };
      game_moves: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          move_number: number;
          move_type: 'PLAY_CARD' | 'CANTAR' | 'CAMBIAR_7' | 'DECLARE_VICTORY' | 'DECLARE_RENUNCIO';
          move_data: Json;
          game_state_before: Json | null;
          game_state_after: Json | null;
          is_validated: boolean;
          validation_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          move_number: number;
          move_type: 'PLAY_CARD' | 'CANTAR' | 'CAMBIAR_7' | 'DECLARE_VICTORY' | 'DECLARE_RENUNCIO';
          move_data: Json;
          game_state_before?: Json | null;
          game_state_after?: Json | null;
          is_validated?: boolean;
          validation_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          move_number?: number;
          move_type?: 'PLAY_CARD' | 'CANTAR' | 'CAMBIAR_7' | 'DECLARE_VICTORY' | 'DECLARE_RENUNCIO';
          move_data?: Json;
          game_state_before?: Json | null;
          game_state_after?: Json | null;
          is_validated?: boolean;
          validation_error?: string | null;
          created_at?: string;
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
          status?: 'pending' | 'accepted' | 'blocked';
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
      friend_invites: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          room_id: string;
          message: string | null;
          status: 'pending' | 'accepted' | 'declined' | 'expired';
          expires_at: string;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          room_id: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          expires_at?: string;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          room_id?: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          expires_at?: string;
          created_at?: string;
          responded_at?: string | null;
        };
      };
      matchmaking_queue: {
        Row: {
          id: string;
          player_id: string;
          game_mode: 'ranked' | 'casual';
          ranking_range_min: number;
          ranking_range_max: number;
          region: string | null;
          queued_at: string;
          matched_at: string | null;
          room_id: string | null;
        };
        Insert: {
          id?: string;
          player_id: string;
          game_mode: 'ranked' | 'casual';
          ranking_range_min: number;
          ranking_range_max: number;
          region?: string | null;
          queued_at?: string;
          matched_at?: string | null;
          room_id?: string | null;
        };
        Update: {
          id?: string;
          player_id?: string;
          game_mode?: 'ranked' | 'casual';
          ranking_range_min?: number;
          ranking_range_max?: number;
          region?: string | null;
          queued_at?: string;
          matched_at?: string | null;
          room_id?: string | null;
        };
      };
      game_statistics: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          team_id: 'team1' | 'team2' | null;
          final_score: number;
          card_points: number;
          cantes_made: number;
          tricks_won: number;
          is_winner: boolean;
          ranking_change: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          team_id?: 'team1' | 'team2' | null;
          final_score?: number;
          card_points?: number;
          cantes_made?: number;
          tricks_won?: number;
          is_winner?: boolean;
          ranking_change?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          team_id?: 'team1' | 'team2' | null;
          final_score?: number;
          card_points?: number;
          cantes_made?: number;
          tricks_won?: number;
          is_winner?: boolean;
          ranking_change?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      active_games: {
        Row: {
          id: string;
          code: string;
          status: string;
          game_mode: string;
          current_players: number;
          max_players: number;
          created_at: string;
          started_at: string | null;
          game_phase: string;
          human_players: number;
          bot_players: number;
        };
      };
      player_stats: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          ranking: number;
          games_played: number;
          games_won: number;
          win_rate: number;
          is_online: boolean;
          last_seen_at: string;
        };
      };
    };
    Functions: {
      generate_room_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_online_friends: {
        Args: { p_user_id: string };
        Returns: {
          friend_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          ranking: number;
          is_in_game: boolean;
        }[];
      };
      find_match_for_player: {
        Args: {
          p_player_id: string;
          p_game_mode: string;
          p_ranking: number;
          p_region?: string;
        };
        Returns: string | null;
      };
      finish_game: {
        Args: {
          p_room_id: string;
          p_winning_team: string;
        };
        Returns: void;
      };
      cleanup_abandoned_rooms: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      scheduled_cleanup: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
