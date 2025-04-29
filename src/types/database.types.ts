export type Database = {
    public: {
      Tables: {
        achievements: {
          Row: {
            category: string
            created_at: string
            description: string
            icon_name: string | null
            id: string
            name: string
            points: number
            requirements: JSON
          }
          Insert: {
            category: string
            created_at?: string
            description: string
            icon_name?: string | null
            id?: string
            name: string
            points?: number
            requirements?: JSON
          }
          Update: {
            category?: string
            created_at?: string
            description?: string
            icon_name?: string | null
            id?: string
            name?: string
            points?: number
            requirements?: JSON
          }
          Relationships: []
        }
        cities: {
          Row: {
            created_at: string
            defense_value: number
            game_id: string
            id: string
            level: number
            name: string
            player_state_id: string
            updated_at: string
          }
          Insert: {
            created_at?: string
            defense_value?: number
            game_id: string
            id?: string
            level?: number
            name: string
            player_state_id: string
            updated_at?: string
          }
          Update: {
            created_at?: string
            defense_value?: number
            game_id?: string
            id?: string
            level?: number
            name?: string
            player_state_id?: string
            updated_at?: string
          }
          Relationships: [
            {
              foreignKeyName: "cities_game_id_fkey"
              columns: ["game_id"]
              isOneToOne: false
              referencedRelation: "games"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "cities_player_state_id_fkey"
              columns: ["player_state_id"]
              isOneToOne: true
              referencedRelation: "player_state"
              referencedColumns: ["id"]
            },
          ]
        }
        city_developments: {
          Row: {
            city_id: string
            created_at: string
            development_type: string
            effects: JSON
            id: string
            level: number
            updated_at: string
          }
          Insert: {
            city_id: string
            created_at?: string
            development_type: string
            effects?: JSON
            id?: string
            level?: number
            updated_at?: string
          }
          Update: {
            city_id?: string
            created_at?: string
            development_type?: string
            effects?: JSON
            id?: string
            level?: number
            updated_at?: string
          }
          Relationships: [
            {
              foreignKeyName: "city_developments_city_id_fkey"
              columns: ["city_id"]
              isOneToOne: false
              referencedRelation: "cities"
              referencedColumns: ["id"]
            },
          ]
        }
        event_cards: {
          Row: {
            description: string
            difficulty: number
            effects: JSON
            era: number
            id: string
            name: string
          }
          Insert: {
            description: string
            difficulty?: number
            effects?: JSON
            era: number
            id?: string
            name: string
          }
          Update: {
            description?: string
            difficulty?: number
            effects?: JSON
            era?: number
            id?: string
            name?: string
          }
          Relationships: []
        }
        game_events: {
          Row: {
            created_at: string
            event_card_id: string
            game_id: string
            id: string
            resolution_details: JSON | null
            resolved: boolean
            round: number
          }
          Insert: {
            created_at?: string
            event_card_id: string
            game_id: string
            id?: string
            resolution_details?: JSON | null
            resolved?: boolean
            round: number
          }
          Update: {
            created_at?: string
            event_card_id?: string
            game_id?: string
            id?: string
            resolution_details?: JSON | null
            resolved?: boolean
            round?: number
          }
          Relationships: [
            {
              foreignKeyName: "game_events_event_card_id_fkey"
              columns: ["event_card_id"]
              isOneToOne: false
              referencedRelation: "event_cards"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "game_events_game_id_fkey"
              columns: ["game_id"]
              isOneToOne: false
              referencedRelation: "games"
              referencedColumns: ["id"]
            },
          ]
        }
        game_knowledge_tokens: {
          Row: {
            game_id: string
            id: string
            is_taken: boolean | null
            taken_by: string | null
            token_type_id: string
          }
          Insert: {
            game_id: string
            id?: string
            is_taken?: boolean | null
            taken_by?: string | null
            token_type_id: string
          }
          Update: {
            game_id?: string
            id?: string
            is_taken?: boolean | null
            taken_by?: string | null
            token_type_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "game_knowledge_tokens_game_id_fkey"
              columns: ["game_id"]
              isOneToOne: false
              referencedRelation: "games"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "game_knowledge_tokens_taken_by_fkey"
              columns: ["taken_by"]
              isOneToOne: false
              referencedRelation: "game_participants"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "game_knowledge_tokens_token_type_id_fkey"
              columns: ["token_type_id"]
              isOneToOne: false
              referencedRelation: "knowledge_token_types"
              referencedColumns: ["id"]
            },
          ]
        }
        game_logs: {
          Row: {
            created_at: string
            description: string
            event_data: JSON
            event_type: string
            game_id: string
            id: string
            phase: string | null
            player_id: string | null
            round: number | null
          }
          Insert: {
            created_at?: string
            description: string
            event_data?: JSON
            event_type: string
            game_id: string
            id?: string
            phase?: string | null
            player_id?: string | null
            round?: number | null
          }
          Update: {
            created_at?: string
            description?: string
            event_data?: JSON
            event_type?: string
            game_id?: string
            id?: string
            phase?: string | null
            player_id?: string | null
            round?: number | null
          }
          Relationships: [
            {
              foreignKeyName: "game_logs_game_id_fkey"
              columns: ["game_id"]
              isOneToOne: false
              referencedRelation: "games"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "game_logs_player_id_fkey"
              columns: ["player_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
        }
        game_participants: {
          Row: {
            game_id: string
            id: string
            is_active: boolean
            is_host: boolean
            joined_at: string
            left_at: string | null
            left_reason: string | null
            player_number: number
            user_id: string
          }
          Insert: {
            game_id: string
            id?: string
            is_active?: boolean
            is_host?: boolean
            joined_at?: string
            left_at?: string | null
            left_reason?: string | null
            player_number: number
            user_id: string
          }
          Update: {
            game_id?: string
            id?: string
            is_active?: boolean
            is_host?: boolean
            joined_at?: string
            left_at?: string | null
            left_reason?: string | null
            player_number?: number
            user_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "game_participants_game_id_fkey"
              columns: ["game_id"]
              isOneToOne: false
              referencedRelation: "games"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "game_participants_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
        }
        game_politics_cards: {
          Row: {
            created_at: string
            drawn_at: string | null
            drawn_by: string | null
            game_id: string
            id: string
            is_drawn: boolean | null
            politics_card_id: string
          }
          Insert: {
            created_at?: string
            drawn_at?: string | null
            drawn_by?: string | null
            game_id: string
            id?: string
            is_drawn?: boolean | null
            politics_card_id: string
          }
          Update: {
            created_at?: string
            drawn_at?: string | null
            drawn_by?: string | null
            game_id?: string
            id?: string
            is_drawn?: boolean | null
            politics_card_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "game_politics_cards_drawn_by_fkey"
              columns: ["drawn_by"]
              isOneToOne: false
              referencedRelation: "game_participants"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "game_politics_cards_game_id_fkey"
              columns: ["game_id"]
              isOneToOne: false
              referencedRelation: "games"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "game_politics_cards_politics_card_id_fkey"
              columns: ["politics_card_id"]
              isOneToOne: false
              referencedRelation: "politics_cards"
              referencedColumns: ["id"]
            },
          ]
        }
        games: {
          Row: {
            created_at: string
            created_by: string
            current_phase: string | null
            current_round: number
            description: string | null
            ended_at: string | null
            game_options: JSON
            id: string
            is_public: boolean
            join_code: string | null
            max_players: number
            min_players: number
            name: string
            paused: boolean
            started_at: string | null
            status: string
            total_round: number
            updated_at: string
          }
          Insert: {
            created_at?: string
            created_by: string
            current_phase?: string | null
            current_round?: number
            description?: string | null
            ended_at?: string | null
            game_options?: JSON
            id?: string
            is_public?: boolean
            join_code?: string | null
            max_players?: number
            min_players?: number
            name: string
            paused?: boolean
            started_at?: string | null
            status?: string
            total_round?: number
            updated_at?: string
          }
          Update: {
            created_at?: string
            created_by?: string
            current_phase?: string | null
            current_round?: number
            description?: string | null
            ended_at?: string | null
            game_options?: JSON
            id?: string
            is_public?: boolean
            join_code?: string | null
            max_players?: number
            min_players?: number
            name?: string
            paused?: boolean
            started_at?: string | null
            status?: string
            total_round?: number
            updated_at?: string
          }
          Relationships: [
            {
              foreignKeyName: "games_created_by_fkey"
              columns: ["created_by"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
        }
        knowledge_token_types: {
          Row: {
            category: string | null
            description: string | null
            era: number | null
            id: string
            name: string
          }
          Insert: {
            category?: string | null
            description?: string | null
            era?: number | null
            id?: string
            name: string
          }
          Update: {
            category?: string | null
            description?: string | null
            era?: number | null
            id?: string
            name?: string
          }
          Relationships: []
        }
        player_achievements: {
          Row: {
            achievement_id: string
            earned_at: string
            game_id: string | null
            id: string
            profile_id: string
          }
          Insert: {
            achievement_id: string
            earned_at?: string
            game_id?: string | null
            id?: string
            profile_id: string
          }
          Update: {
            achievement_id?: string
            earned_at?: string
            game_id?: string | null
            id?: string
            profile_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "player_achievements_achievement_id_fkey"
              columns: ["achievement_id"]
              isOneToOne: false
              referencedRelation: "achievements"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "player_achievements_game_id_fkey"
              columns: ["game_id"]
              isOneToOne: false
              referencedRelation: "games"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "player_achievements_profile_id_fkey"
              columns: ["profile_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
        }
        player_knowledge_tokens: {
          Row: {
            acquired_at: string
            game_knowledge_token_id: string
            id: string
            player_state_id: string
          }
          Insert: {
            acquired_at?: string
            game_knowledge_token_id: string
            id?: string
            player_state_id: string
          }
          Update: {
            acquired_at?: string
            game_knowledge_token_id?: string
            id?: string
            player_state_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "player_knowledge_tokens_game_knowledge_token_id_fkey"
              columns: ["game_knowledge_token_id"]
              isOneToOne: false
              referencedRelation: "game_knowledge_tokens"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "player_knowledge_tokens_player_state_id_fkey"
              columns: ["player_state_id"]
              isOneToOne: false
              referencedRelation: "player_state"
              referencedColumns: ["id"]
            },
          ]
        }
        player_politics_cards: {
          Row: {
            game_politics_card_id: string
            id: string
            is_played: boolean | null
            played_at: string | null
            player_state_id: string
          }
          Insert: {
            game_politics_card_id: string
            id?: string
            is_played?: boolean | null
            played_at?: string | null
            player_state_id: string
          }
          Update: {
            game_politics_card_id?: string
            id?: string
            is_played?: boolean | null
            played_at?: string | null
            player_state_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "player_politics_cards_game_politics_card_id_fkey"
              columns: ["game_politics_card_id"]
              isOneToOne: false
              referencedRelation: "game_politics_cards"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "player_politics_cards_player_state_id_fkey"
              columns: ["player_state_id"]
              isOneToOne: false
              referencedRelation: "player_state"
              referencedColumns: ["id"]
            },
          ]
        }
        player_state: {
          Row: {
            citizen_track_position: number
            city_id: string | null
            created_at: string
            culture_track_position: number
            current_actions: number
            drachmas: number
            economy_track_position: number
            game_id: string
            glory_track_position: number
            id: string
            last_action: JSON | null
            max_actions: number
            military_track_position: number
            participant_id: string
            philosophy_track_position: number
            score: number
            tax_track_position: number
            updated_at: string
          }
          Insert: {
            citizen_track_position?: number
            city_id?: string | null
            created_at?: string
            culture_track_position?: number
            current_actions?: number
            drachmas?: number
            economy_track_position?: number
            game_id: string
            glory_track_position?: number
            id?: string
            last_action?: JSON | null
            max_actions?: number
            military_track_position?: number
            participant_id: string
            philosophy_track_position?: number
            score?: number
            tax_track_position?: number
            updated_at?: string
          }
          Update: {
            citizen_track_position?: number
            city_id?: string | null
            created_at?: string
            culture_track_position?: number
            current_actions?: number
            drachmas?: number
            economy_track_position?: number
            game_id?: string
            glory_track_position?: number
            id?: string
            last_action?: JSON | null
            max_actions?: number
            military_track_position?: number
            participant_id?: string
            philosophy_track_position?: number
            score?: number
            tax_track_position?: number
            updated_at?: string
          }
          Relationships: [
            {
              foreignKeyName: "player_state_game_id_fkey"
              columns: ["game_id"]
              isOneToOne: false
              referencedRelation: "games"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "player_state_participant_id_fkey"
              columns: ["participant_id"]
              isOneToOne: false
              referencedRelation: "game_participants"
              referencedColumns: ["id"]
            },
          ]
        }
        politics_cards: {
          Row: {
            category: string
            cost: number
            description: string
            effects: JSON
            id: string
            name: string
          }
          Insert: {
            category: string
            cost?: number
            description: string
            effects?: JSON
            id?: string
            name: string
          }
          Update: {
            category?: string
            cost?: number
            description?: string
            effects?: JSON
            id?: string
            name?: string
          }
          Relationships: []
        }
        profiles: {
          Row: {
            avatar_url: string | null
            created_at: string
            display_name: string | null
            games_lost: number
            games_played: number
            games_won: number
            id: string
            is_active: boolean
            last_login: string | null
            updated_at: string
            username: string
          }
          Insert: {
            avatar_url?: string | null
            created_at?: string
            display_name?: string | null
            games_lost?: number
            games_played?: number
            games_won?: number
            id: string
            is_active?: boolean
            last_login?: string | null
            updated_at?: string
            username: string
          }
          Update: {
            avatar_url?: string | null
            created_at?: string
            display_name?: string | null
            games_lost?: number
            games_played?: number
            games_won?: number
            id?: string
            is_active?: boolean
            last_login?: string | null
            updated_at?: string
            username?: string
          }
          Relationships: []
        }
      }
      Views: {
        [_ in never]: never
      }
      Functions: {
        [_ in never]: never
      }
      Enums: {
        [_ in never]: never
      }
      CompositeTypes: {
        [_ in never]: never
      }
    }
  }
  
  type DefaultSchema = Database[Extract<keyof Database, "public">]
  
  export type Tables<
    DefaultSchemaTableNameOrOptions extends
      | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
      | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
      schema: keyof Database
    }
      ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
          Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
      : never = never,
  > = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
      | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
      schema: keyof Database
    }
      ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
      : never = never,
  > = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
      | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
      schema: keyof Database
    }
      ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
      : never = never,
  > = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
      | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
      schema: keyof Database
    }
      ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
      : never = never,
  > = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
      ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
      : never
  
  export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
      | keyof DefaultSchema["CompositeTypes"]
      | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
      schema: keyof Database
    }
      ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
      : never = never,
  > = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
      ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
      : never
  
  export const Constants = {
    public: {
      Enums: {},
    },
  } as const