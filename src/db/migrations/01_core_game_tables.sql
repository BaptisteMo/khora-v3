-- Migration: Core Game Data Tables
-- Description: Creates foundational tables for users, games, and game participants

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
-- Note: Supabase already creates an auth.users table, so we're creating a profiles table
-- that extends the built-in users with additional game-related fields
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(24) UNIQUE NOT NULL,
  display_name VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  games_played INTEGER DEFAULT 0 NOT NULL,
  games_won INTEGER DEFAULT 0 NOT NULL,
  games_lost INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Games Table - stores information about each game session
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  max_players INTEGER DEFAULT 4 NOT NULL, -- Default max players
  min_players INTEGER DEFAULT 2 NOT NULL, -- Minimum required players
  status VARCHAR(20) DEFAULT 'lobby' NOT NULL, -- lobby, in_progress, completed, abandoned
  current_round INTEGER DEFAULT 0 NOT NULL,
  total_rounds INTEGER DEFAULT 7 NOT NULL, -- Default game length
  current_phase VARCHAR(20),
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  join_code VARCHAR(10) UNIQUE, -- Code for privately joining games
  game_options JSONB DEFAULT '{}'::jsonb NOT NULL -- Flexible game configuration options
);

-- Create indexes for games table
CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_is_public ON games(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_games_join_code ON games(join_code);

-- Game Participants Table - links users to games
CREATE TABLE IF NOT EXISTS game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  player_number INTEGER NOT NULL, -- 1, 2, 3, 4 - position in turn order
  is_host BOOLEAN DEFAULT FALSE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL, -- Player is still in the game
  left_at TIMESTAMP WITH TIME ZONE, -- If player left/disconnected
  UNIQUE(game_id, user_id), -- User can only join a game once
  UNIQUE(game_id, player_number) -- Player numbers must be unique within a game
);

-- Create indexes for game_participants table
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);

-- Player State Table - tracks current state of each player in a game
CREATE TABLE IF NOT EXISTS player_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES game_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  score INTEGER DEFAULT 0 NOT NULL,
  glory_track_position INTEGER DEFAULT 0 NOT NULL,
  citizen_track_position INTEGER DEFAULT 0 NOT NULL,
  tax_track_position INTEGER DEFAULT 0 NOT NULL,
  culture_track_position INTEGER DEFAULT 0 NOT NULL,
  military_track_position INTEGER DEFAULT 0 NOT NULL,
  economy_track_position INTEGER DEFAULT 0 NOT NULL,
  philosophy_track_position INTEGER DEFAULT 0 NOT NULL,
  resources JSONB DEFAULT '{
    "citizens": 5,
    "gold": 10,
    "military": 0,
    "culture": 0
  }'::jsonb NOT NULL, -- Starting resources
  city_id UUID, -- Will reference cities table once created
  current_actions INTEGER DEFAULT 0 NOT NULL, -- Actions taken in current phase
  max_actions INTEGER DEFAULT 2 NOT NULL, -- Maximum actions allowed per phase
  UNIQUE(game_id, participant_id)
);

-- Create indexes for player_state table
CREATE INDEX IF NOT EXISTS idx_player_state_game_id ON player_state(game_id);
CREATE INDEX IF NOT EXISTS idx_player_state_participant_id ON player_state(participant_id);

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at fields
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_games_updated_at
BEFORE UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_player_state_updated_at
BEFORE UPDATE ON player_state
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger to automatically create player_state when a participant joins a game
CREATE OR REPLACE FUNCTION create_player_state_on_join()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO player_state (game_id, participant_id)
  VALUES (NEW.game_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_player_state
AFTER INSERT ON game_participants
FOR EACH ROW
EXECUTE FUNCTION create_player_state_on_join();

-- Trigger to update games_played count when a game starts
CREATE OR REPLACE FUNCTION update_games_played()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_progress' AND OLD.status = 'lobby' THEN
    UPDATE profiles p
    SET games_played = games_played + 1
    FROM game_participants gp
    WHERE gp.game_id = NEW.id AND p.id = gp.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_games_played
AFTER UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_games_played(); 