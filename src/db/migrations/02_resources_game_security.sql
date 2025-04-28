-- Migration: Game Resource Tables Security Policies
-- Description: Set up Row Level Security (RLS) policies for game resource tables

-- Enable Row Level Security on all resource tables
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE politics_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_politics_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_knowledge_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Cities Table Policies
-- Cities are viewable by everyone (reference data)
CREATE POLICY "Cities are viewable by everyone" ON cities
    FOR SELECT TO authenticated
    USING (true);

-- Only authenticated users can create cities (for testing)
CREATE POLICY "Only authenticated users can create cities" ON cities
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Users can only update cities they created
CREATE POLICY "Users can only update their own cities" ON cities
    FOR UPDATE TO authenticated
    USING (auth.uid() = created_by);

-- City Developments Table Policies
-- City developments are viewable by everyone (reference data)
CREATE POLICY "City developments are viewable by everyone" ON city_developments
    FOR SELECT TO authenticated
    USING (true);

-- Only authenticated users can create city developments (for testing)
CREATE POLICY "Only authenticated users can create city developments" ON city_developments
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Politics Cards Table Policies
-- Politics cards are viewable by everyone (reference data)
CREATE POLICY "Politics cards are viewable by everyone" ON politics_cards
    FOR SELECT TO authenticated
    USING (true);

-- Only authenticated users can create politics cards (for testing)
CREATE POLICY "Only authenticated users can create politics cards" ON politics_cards
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Player Politics Cards Table Policies
-- Player politics cards are viewable by game participants
CREATE POLICY "Player politics cards are viewable by game participants" ON player_politics_cards
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM game_participants
            WHERE game_participants.game_id = player_politics_cards.game_id
            AND game_participants.profile_id = auth.uid()
        )
    );

-- Players can only insert/update their own politics cards
CREATE POLICY "Players can only manage their own politics cards" ON player_politics_cards
    FOR ALL TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Knowledge Tokens Table Policies
-- Knowledge tokens are viewable by everyone (reference data)
CREATE POLICY "Knowledge tokens are viewable by everyone" ON knowledge_tokens
    FOR SELECT TO authenticated
    USING (true);

-- Only authenticated users can create knowledge tokens (for testing)
CREATE POLICY "Only authenticated users can create knowledge tokens" ON knowledge_tokens
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Player Knowledge Tokens Table Policies
-- Player knowledge tokens are viewable by game participants
CREATE POLICY "Player knowledge tokens are viewable by game participants" ON player_knowledge_tokens
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM game_participants
            WHERE game_participants.game_id = player_knowledge_tokens.game_id
            AND game_participants.profile_id = auth.uid()
        )
    );

-- Players can only insert/update their own knowledge tokens
CREATE POLICY "Players can only manage their own knowledge tokens" ON player_knowledge_tokens
    FOR ALL TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Event Cards Table Policies
-- Event cards are viewable by everyone (reference data)
CREATE POLICY "Event cards are viewable by everyone" ON event_cards
    FOR SELECT TO authenticated
    USING (true);

-- Only authenticated users can create event cards (for testing)
CREATE POLICY "Only authenticated users can create event cards" ON event_cards
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Game Events Table Policies
-- Game events are viewable by game participants
CREATE POLICY "Game events are viewable by game participants" ON game_events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM game_participants
            WHERE game_participants.game_id = game_events.game_id
            AND game_participants.profile_id = auth.uid()
        )
    );

-- Only game hosts can insert/update game events
CREATE POLICY "Only game hosts can manage game events" ON game_events
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM game_participants
            WHERE game_participants.game_id = game_events.game_id
            AND game_participants.profile_id = auth.uid()
            AND game_participants.is_host = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM game_participants
            WHERE game_participants.game_id = game_events.game_id
            AND game_participants.profile_id = auth.uid()
            AND game_participants.is_host = true
        )
    );