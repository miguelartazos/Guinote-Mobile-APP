export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      friendships: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          friend_id: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "me"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "me"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_states: {
        Row: {
          current_player: number | null
          current_player_index: number | null
          dealer_index: number | null
          deck: Json | null
          game_winner: number | null
          hands: Json | null
          id: string
          last_action: Json | null
          match_scores: Json | null
          phase: string | null
          players: Json | null
          room_id: string
          round_winner: number | null
          scores: Json | null
          table_cards: Json | null
          team_scores: Json | null
          tricks: Json | null
          trump: Json | null
          trump_card: Json | null
          trump_suit: string | null
          updated_at: string
          version: number
        }
        Insert: {
          current_player?: number | null
          current_player_index?: number | null
          dealer_index?: number | null
          deck?: Json | null
          game_winner?: number | null
          hands?: Json | null
          id?: string
          last_action?: Json | null
          match_scores?: Json | null
          phase?: string | null
          players?: Json | null
          room_id: string
          round_winner?: number | null
          scores?: Json | null
          table_cards?: Json | null
          team_scores?: Json | null
          tricks?: Json | null
          trump?: Json | null
          trump_card?: Json | null
          trump_suit?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          current_player?: number | null
          current_player_index?: number | null
          dealer_index?: number | null
          deck?: Json | null
          game_winner?: number | null
          hands?: Json | null
          id?: string
          last_action?: Json | null
          match_scores?: Json | null
          phase?: string | null
          players?: Json | null
          room_id?: string
          round_winner?: number | null
          scores?: Json | null
          table_cards?: Json | null
          team_scores?: Json | null
          tricks?: Json | null
          trump?: Json | null
          trump_card?: Json | null
          trump_suit?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_states_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_stats: {
        Row: {
          cantes: number
          elo_change: number
          game_duration: number
          game_mode: string
          id: string
          points_conceded: number
          points_scored: number
          timestamp: string | null
          user_id: string
          victories_20: number
          victories_40: number
          won: boolean
        }
        Insert: {
          cantes?: number
          elo_change: number
          game_duration: number
          game_mode: string
          id?: string
          points_conceded: number
          points_scored: number
          timestamp?: string | null
          user_id: string
          victories_20?: number
          victories_40?: number
          won: boolean
        }
        Update: {
          cantes?: number
          elo_change?: number
          game_duration?: number
          game_mode?: string
          id?: string
          points_conceded?: number
          points_scored?: number
          timestamp?: string | null
          user_id?: string
          victories_20?: number
          victories_40?: number
          won?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "game_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "me"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          joined_at: string | null
          mode: string | null
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          mode?: string | null
          user_id: string
        }
        Update: {
          joined_at?: string | null
          mode?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "me"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchmaking_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      move_validations: {
        Row: {
          created_at: string | null
          game_state_id: string
          id: string
          is_valid: boolean
          move_data: Json | null
          move_type: string
          player_id: string
          reason: string | null
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          game_state_id: string
          id?: string
          is_valid: boolean
          move_data?: Json | null
          move_type: string
          player_id: string
          reason?: string | null
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          game_state_id?: string
          id?: string
          is_valid?: boolean
          move_data?: Json | null
          move_type?: string
          player_id?: string
          reason?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      room_players: {
        Row: {
          ai_difficulty: string | null
          ai_personality: string | null
          connection_status: string | null
          id: string
          is_ai: boolean | null
          is_ready: boolean | null
          joined_at: string | null
          position: number | null
          room_id: string
          team: number | null
          user_id: string
        }
        Insert: {
          ai_difficulty?: string | null
          ai_personality?: string | null
          connection_status?: string | null
          id?: string
          is_ai?: boolean | null
          is_ready?: boolean | null
          joined_at?: string | null
          position?: number | null
          room_id: string
          team?: number | null
          user_id: string
        }
        Update: {
          ai_difficulty?: string | null
          ai_personality?: string | null
          connection_status?: string | null
          id?: string
          is_ai?: boolean | null
          is_ready?: boolean | null
          joined_at?: string | null
          position?: number | null
          room_id?: string
          team?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "me"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          ai_config: Json | null
          code: string
          created_at: string | null
          current_players: number | null
          finished_at: string | null
          game_mode: string | null
          host_id: string
          id: string
          invite_link_id: string | null
          is_public: boolean | null
          last_activity_at: string
          max_players: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          ai_config?: Json | null
          code: string
          created_at?: string | null
          current_players?: number | null
          finished_at?: string | null
          game_mode?: string | null
          host_id: string
          id?: string
          invite_link_id?: string | null
          is_public?: boolean | null
          last_activity_at?: string
          max_players?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          ai_config?: Json | null
          code?: string
          created_at?: string | null
          current_players?: number | null
          finished_at?: string | null
          game_mode?: string | null
          host_id?: string
          id?: string
          invite_link_id?: string | null
          is_public?: boolean | null
          last_activity_at?: string
          max_players?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "me"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          elo: number | null
          friend_code: string | null
          games_played: number | null
          games_won: number | null
          id: string
          is_online: boolean | null
          last_activity: string | null
          last_seen_at: string | null
          username: string | null
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          elo?: number | null
          friend_code?: string | null
          games_played?: number | null
          games_won?: number | null
          id?: string
          is_online?: boolean | null
          last_activity?: string | null
          last_seen_at?: string | null
          username?: string | null
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          elo?: number | null
          friend_code?: string | null
          games_played?: number | null
          games_won?: number | null
          id?: string
          is_online?: boolean | null
          last_activity?: string | null
          last_seen_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      voice_messages: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          id: string
          room_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          room_id: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          room_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "me"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      me: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          elo: number | null
          friend_code: string | null
          games_played: number | null
          games_won: number | null
          id: string | null
          is_online: boolean | null
          last_activity: string | null
          last_seen_at: string | null
          username: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          elo?: number | null
          friend_code?: string | null
          games_played?: number | null
          games_won?: number | null
          id?: string | null
          is_online?: boolean | null
          last_activity?: string | null
          last_seen_at?: string | null
          username?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          elo?: number | null
          friend_code?: string | null
          games_played?: number | null
          games_won?: number | null
          id?: string | null
          is_online?: boolean | null
          last_activity?: string | null
          last_seen_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_ai_player: {
        Args: {
          p_difficulty?: string
          p_personality?: string
          p_room_id: string
        }
        Returns: Json
      }
      cleanup_abandoned_rooms: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_validations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_room: {
        Args: { p_game_mode?: string; p_is_public?: boolean }
        Returns: Json
      }
      determine_trick_winner_v2: {
        Args: { p_trick: Json; p_trump_suit: string }
        Returns: Json
      }
      end_trick: {
        Args: {
          p_expected_version: number
          p_room_id: string
          p_winner_position: number
        }
        Returns: Json
      }
      ensure_user_exists: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_friend_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_room_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_card_points_v2: {
        Args: { p_card: Json }
        Returns: number
      }
      get_card_strength_v2: {
        Args: { p_card: Json; p_lead_suit: string; p_trump_suit: string }
        Returns: number
      }
      get_online_friends: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          elo: number
          friend_id: string
          is_online: boolean
          username: string
        }[]
      }
      initialize_game_state: {
        Args: { p_room_id: string }
        Returns: Json
      }
      join_room: {
        Args:
          | { p_position?: number; p_room_code: string }
          | { p_room_code: string }
        Returns: Json
      }
      leave_room: {
        Args: { p_room_id: string }
        Returns: undefined
      }
      play_card: {
        Args: {
          p_card_id: string
          p_expected_version?: number
          p_game_state_id: string
        }
        Returns: Json
      }
      remove_ai_player: {
        Args: { p_position: number; p_room_id: string }
        Returns: Json
      }
      start_game: {
        Args: { p_room_id: string }
        Returns: Json
      }
      toggle_ready: {
        Args: { p_room_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
