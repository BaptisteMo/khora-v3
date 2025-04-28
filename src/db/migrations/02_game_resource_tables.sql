-- Migration: Game Resource Tables
-- Description: Create tables for game resources (cities, developments, cards, tokens, events)

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    resource_type TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    effects JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- City Developments Table
CREATE TABLE IF NOT EXISTS city_developments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    resource_type TEXT,
    effects JSONB DEFAULT '{}',
    requirements JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Politics Cards Table
CREATE TABLE IF NOT EXISTS politics_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    effects JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Player Politics Cards Table
CREATE TABLE IF NOT EXISTS player_politics_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    politics_card_id UUID NOT NULL REFERENCES politics_cards(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Knowledge Tokens Table
CREATE TABLE IF NOT EXISTS knowledge_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    effects JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Player Knowledge Tokens Table
CREATE TABLE IF NOT EXISTS player_knowledge_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    knowledge_token_id UUID NOT NULL REFERENCES knowledge_tokens(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Event Cards Table
CREATE TABLE IF NOT EXISTS event_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT,
    effects JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Game Events Table
CREATE TABLE IF NOT EXISTS game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    event_card_id UUID NOT NULL REFERENCES event_cards(id) ON DELETE CASCADE,
    round INTEGER,
    resolved BOOLEAN DEFAULT FALSE,
    effects_applied BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_politics_cards_game_id ON player_politics_cards(game_id);
CREATE INDEX IF NOT EXISTS idx_player_politics_cards_profile_id ON player_politics_cards(profile_id);
CREATE INDEX IF NOT EXISTS idx_player_knowledge_tokens_game_id ON player_knowledge_tokens(game_id);
CREATE INDEX IF NOT EXISTS idx_player_knowledge_tokens_profile_id ON player_knowledge_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id); 