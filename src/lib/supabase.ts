import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are defined
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Core game data types
export type Profile = {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  is_active: boolean;
  last_login?: string;
};

export type Game = {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  ended_at?: string;
  max_players: number;
  min_players: number;
  status: 'lobby' | 'in_progress' | 'completed' | 'abandoned';
  current_round: number;
  total_round: number;
  current_phase?: string;
  is_public: boolean;
  join_code?: string;
  game_options: Record<string, unknown>;
  setup_started_at?: string;
};

export type GameParticipant = {
  id: string;
  game_id: string;
  user_id: string;
  joined_at: string;
  player_number: number;
  is_host: boolean;
  is_active: boolean;
  left_at?: string;
};

export type PlayerState = {
  id: string;
  game_id: string;
  participant_id: string;
  created_at: string;
  updated_at: string;
  score: number;
  glory_track_position: number;
  citizen_track_position: number;
  tax_track_position: number;
  culture_track_position: number;
  military_track_position: number;
  economy_track_position: number;
  philosophy_track_position: number;
  resources: {
    citizens: number;
    gold: number;
    military: number;
    culture: number;
  };
  city_id?: string;
  current_actions: number;
  max_actions: number;
};

// Types for database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'games_played' | 'games_won' | 'games_lost'>;
        Update: Partial<Profile>;
      };
      games: {
        Row: Game;
        Insert: Omit<Game, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Game>;
      };
      game_participants: {
        Row: GameParticipant;
        Insert: Omit<GameParticipant, 'id' | 'joined_at'>;
        Update: Partial<GameParticipant>;
      };
      player_state: {
        Row: PlayerState;
        Insert: Omit<PlayerState, 'id' | 'created_at' | 'updated_at' | 'score' | 'current_actions'>;
        Update: Partial<PlayerState>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}; 