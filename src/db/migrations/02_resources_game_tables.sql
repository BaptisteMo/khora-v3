-- Migration: Game Resource Tables
-- Description: Creates tables for game resources including cities, developments, cards, and tokens

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- Cities and City Developments
-- ===============================

-- Cities Table - represents player cities
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_state_id UUID NOT NULL REFERENCES player_state(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  defense_value INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(player_state_id) -- Each player can only have one city
);

-- Create indexes for cities table
CREATE INDEX IF NOT EXISTS idx_cities_game_id ON cities(game_id);
CREATE INDEX IF NOT EXISTS idx_cities_player_state_id ON cities(player_state_id);

-- City Developments Table - represents buildings and improvements in cities
CREATE TABLE IF NOT EXISTS city_developments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  development_type VARCHAR(50) NOT NULL, -- e.g., "barracks", "temple", "market"
  level INTEGER DEFAULT 1 NOT NULL,
  effects JSONB DEFAULT '{}'::jsonb NOT NULL, -- Game effects of this development
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for city_developments table
CREATE INDEX IF NOT EXISTS idx_city_developments_city_id ON city_developments(city_id);
CREATE INDEX IF NOT EXISTS idx_city_developments_type ON city_developments(development_type);

-- ===============================
-- Politics Cards
-- ===============================

-- Politics Cards Table - global definitions of politics cards
CREATE TABLE IF NOT EXISTS politics_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  effects JSONB DEFAULT '{}'::jsonb NOT NULL, -- Game effects of this card
  category VARCHAR(50) NOT NULL, -- Card category/type
  cost INTEGER DEFAULT 0 NOT NULL -- Cost to acquire in resources
);

-- Player Politics Cards Table - links players to their politics cards
CREATE TABLE IF NOT EXISTS player_politics_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_state_id UUID NOT NULL REFERENCES player_state(id) ON DELETE CASCADE,
  politics_card_id UUID NOT NULL REFERENCES politics_cards(id) ON DELETE CASCADE,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL, -- Whether card is in play or discarded
  used_at TIMESTAMP WITH TIME ZONE -- When the card was last used (if applicable)
);

-- Create indexes for player_politics_cards table
CREATE INDEX IF NOT EXISTS idx_player_politics_cards_player_state_id ON player_politics_cards(player_state_id);
CREATE INDEX IF NOT EXISTS idx_player_politics_cards_politics_card_id ON player_politics_cards(politics_card_id);
CREATE INDEX IF NOT EXISTS idx_player_politics_cards_is_active ON player_politics_cards(is_active) WHERE is_active = TRUE;

-- ===============================
-- Knowledge Tokens
-- ===============================

-- Knowledge Tokens Table - global definitions of knowledge tokens
CREATE TABLE IF NOT EXISTS knowledge_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  effects JSONB DEFAULT '{}'::jsonb NOT NULL, -- Game effects of this token
  category VARCHAR(50) NOT NULL, -- Token category/type
  era INTEGER NOT NULL -- Game era when this token becomes available
);

-- Player Knowledge Tokens Table - links players to their knowledge tokens
CREATE TABLE IF NOT EXISTS player_knowledge_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_state_id UUID NOT NULL REFERENCES player_state(id) ON DELETE CASCADE,
  knowledge_token_id UUID NOT NULL REFERENCES knowledge_tokens(id) ON DELETE CASCADE,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  position INTEGER NOT NULL -- Position on player's knowledge track
);

-- Create indexes for player_knowledge_tokens table
CREATE INDEX IF NOT EXISTS idx_player_knowledge_tokens_player_state_id ON player_knowledge_tokens(player_state_id);
CREATE INDEX IF NOT EXISTS idx_player_knowledge_tokens_knowledge_token_id ON player_knowledge_tokens(knowledge_token_id);

-- ===============================
-- Event Cards and Game Events
-- ===============================

-- Event Cards Table - global definitions of event cards
CREATE TABLE IF NOT EXISTS event_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  effects JSONB DEFAULT '{}'::jsonb NOT NULL, -- Game effects of this event
  era INTEGER NOT NULL, -- Game era when this event can occur
  difficulty INTEGER DEFAULT 1 NOT NULL -- Difficulty level of the event
);

-- Game Events Table - tracks events that occur in specific games
CREATE TABLE IF NOT EXISTS game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_card_id UUID NOT NULL REFERENCES event_cards(id) ON DELETE CASCADE,
  round INTEGER NOT NULL, -- Game round when this event occurred
  resolved BOOLEAN DEFAULT FALSE NOT NULL, -- Whether the event has been resolved
  resolution_details JSONB DEFAULT '{}'::jsonb, -- Details about how the event was resolved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for game_events table
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_event_card_id ON game_events(event_card_id);
CREATE INDEX IF NOT EXISTS idx_game_events_round ON game_events(game_id, round);

-- ===============================
-- Triggers for updated_at fields
-- ===============================

-- Add triggers for updated_at fields
CREATE TRIGGER set_cities_updated_at
BEFORE UPDATE ON cities
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_city_developments_updated_at
BEFORE UPDATE ON city_developments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();