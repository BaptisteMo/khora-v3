-- Migration: Game Progress Tables
-- Description: Creates database tables for tracking game progress, achievements, and logs

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- Achievements
-- ===============================

-- Achievements Table - global definitions of achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon_name VARCHAR(100),
  category VARCHAR(50) NOT NULL, -- Type of achievement: progression, collection, challenge, etc.
  points INTEGER DEFAULT 10 NOT NULL, -- Point value of the achievement
  requirements JSONB DEFAULT '{}'::jsonb NOT NULL, -- Criteria needed to unlock
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Player Achievements Table - links players to their earned achievements
CREATE TABLE IF NOT EXISTS player_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL, -- Optional link to the game where achieved
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(profile_id, achievement_id) -- Each achievement can only be earned once per player
);

-- Create indexes for player_achievements table
CREATE INDEX IF NOT EXISTS idx_player_achievements_profile_id ON player_achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_achievement_id ON player_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_game_id ON player_achievements(game_id);

-- ===============================
-- Game Logs
-- ===============================

-- Game Log Table - tracks game history and events
CREATE TABLE IF NOT EXISTS game_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Can be NULL for system events
  event_type VARCHAR(50) NOT NULL, -- Type of event: turn, action, achievement, etc.
  event_data JSONB DEFAULT '{}'::jsonb NOT NULL, -- Structured data about the event
  description TEXT NOT NULL, -- Human-readable description of the event
  round INTEGER, -- Game round when the event occurred (if applicable)
  phase VARCHAR(20), -- Game phase when the event occurred (if applicable)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for game_logs table
CREATE INDEX IF NOT EXISTS idx_game_logs_game_id ON game_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_game_logs_player_id ON game_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_game_logs_event_type ON game_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_game_logs_created_at ON game_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_game_logs_round_phase ON game_logs(game_id, round, phase);

-- ===============================
-- Triggers for timestamps and logging
-- ===============================

-- Add game completion trigger to update player statistics when a game ends
CREATE OR REPLACE FUNCTION update_player_stats_on_game_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
    -- Update games_won count for the winner
    UPDATE profiles p
    SET games_won = games_won + 1
    FROM player_state ps
    JOIN game_participants gp ON ps.participant_id = gp.id
    WHERE ps.game_id = NEW.id 
    AND p.id = gp.user_id
    AND ps.score = (
      SELECT MAX(score) FROM player_state 
      WHERE game_id = NEW.id
    );
    
    -- Update games_lost count for all other players
    UPDATE profiles p
    SET games_lost = games_lost + 1
    FROM player_state ps
    JOIN game_participants gp ON ps.participant_id = gp.id
    WHERE ps.game_id = NEW.id 
    AND p.id = gp.user_id
    AND ps.score < (
      SELECT MAX(score) FROM player_state 
      WHERE game_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_stats
AFTER UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_player_stats_on_game_end();

-- Add trigger to automatically log game events
CREATE OR REPLACE FUNCTION log_game_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO game_logs (
      game_id, 
      event_type, 
      description, 
      event_data
    ) VALUES (
      NEW.id, 
      'game_status_change', 
      'Game status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  
  IF NEW.current_round != OLD.current_round THEN
    INSERT INTO game_logs (
      game_id, 
      event_type, 
      description, 
      round,
      event_data
    ) VALUES (
      NEW.id, 
      'round_change', 
      'Game advanced to round ' || NEW.current_round,
      NEW.current_round,
      jsonb_build_object(
        'old_round', OLD.current_round,
        'new_round', NEW.current_round
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_game_changes
AFTER UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION log_game_status_change();

-- Trigger function to create game log entries for player achievements
CREATE OR REPLACE FUNCTION log_achievement_earned()
RETURNS TRIGGER AS $$
DECLARE
  achievement_name TEXT;
  player_name TEXT;
BEGIN
  -- Get achievement name
  SELECT name INTO achievement_name FROM achievements WHERE id = NEW.achievement_id;
  
  -- Get player name
  SELECT username INTO player_name FROM profiles WHERE id = NEW.profile_id;
  
  -- Create log entry if this achievement was earned in a game
  IF NEW.game_id IS NOT NULL THEN
    INSERT INTO game_logs (
      game_id,
      player_id,
      event_type,
      description,
      event_data
    ) VALUES (
      NEW.game_id,
      NEW.profile_id,
      'achievement_earned',
      player_name || ' earned the achievement: ' || achievement_name,
      jsonb_build_object(
        'achievement_id', NEW.achievement_id,
        'achievement_name', achievement_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_achievement
AFTER INSERT ON player_achievements
FOR EACH ROW
EXECUTE FUNCTION log_achievement_earned(); 