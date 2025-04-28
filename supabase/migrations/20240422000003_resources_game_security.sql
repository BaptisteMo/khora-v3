-- Migration: Game Resource Tables Security Policies
-- Description: Set up Row Level Security (RLS) policies for game resource tables

-- Enable Row Level Security on all tables
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE politics_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_politics_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_knowledge_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- ===============================
-- Cities and City Developments
-- ===============================

-- Cities are viewable by participants in the game
CREATE POLICY "Cities are viewable by game participants" 
ON cities FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.game_id = cities.game_id 
    AND game_participants.user_id = auth.uid()
  )
);

-- Players can only update their own city
CREATE POLICY "Players can only update their own city" 
ON cities FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM player_state
    WHERE player_state.id = cities.player_state_id
    AND EXISTS (
      SELECT 1 FROM game_participants
      WHERE game_participants.id = player_state.participant_id
      AND game_participants.user_id = auth.uid()
    )
  )
);

-- City developments are viewable by participants in the game
CREATE POLICY "City developments are viewable by game participants" 
ON city_developments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM cities
    JOIN game_participants ON cities.game_id = game_participants.game_id
    WHERE city_developments.city_id = cities.id
    AND game_participants.user_id = auth.uid()
  )
);

-- Players can only update developments in their own city
CREATE POLICY "Players can only update developments in their own city" 
ON city_developments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM cities
    JOIN player_state ON cities.player_state_id = player_state.id
    JOIN game_participants ON player_state.participant_id = game_participants.id
    WHERE city_developments.city_id = cities.id
    AND game_participants.user_id = auth.uid()
  )
);

-- ===============================
-- Politics Cards and Knowledge Tokens
-- ===============================

-- Global card and token definitions are readable by all authenticated users
CREATE POLICY "Politics cards definitions are readable by all authenticated users" 
ON politics_cards FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Knowledge tokens definitions are readable by all authenticated users" 
ON knowledge_tokens FOR SELECT 
TO authenticated
USING (true);

-- Player's cards are viewable by participants in the same game
CREATE POLICY "Player politics cards are viewable by game participants" 
ON player_politics_cards FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM player_state
    JOIN game_participants gp1 ON player_state.participant_id = gp1.id
    JOIN game_participants gp2 ON gp1.game_id = gp2.game_id
    WHERE player_politics_cards.player_state_id = player_state.id
    AND gp2.user_id = auth.uid()
  )
);

-- Players can only update their own politics cards
CREATE POLICY "Players can only update their own politics cards" 
ON player_politics_cards FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM player_state
    JOIN game_participants ON player_state.participant_id = game_participants.id
    WHERE player_politics_cards.player_state_id = player_state.id
    AND game_participants.user_id = auth.uid()
  )
);

-- Player's knowledge tokens are viewable by participants in the same game
CREATE POLICY "Player knowledge tokens are viewable by game participants" 
ON player_knowledge_tokens FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM player_state
    JOIN game_participants gp1 ON player_state.participant_id = gp1.id
    JOIN game_participants gp2 ON gp1.game_id = gp2.game_id
    WHERE player_knowledge_tokens.player_state_id = player_state.id
    AND gp2.user_id = auth.uid()
  )
);

-- Players can only update their own knowledge tokens
CREATE POLICY "Players can only update their own knowledge tokens" 
ON player_knowledge_tokens FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM player_state
    JOIN game_participants ON player_state.participant_id = game_participants.id
    WHERE player_knowledge_tokens.player_state_id = player_state.id
    AND game_participants.user_id = auth.uid()
  )
);

-- ===============================
-- Event Cards and Game Events
-- ===============================

-- Event card definitions are readable by all authenticated users
CREATE POLICY "Event cards definitions are readable by all authenticated users" 
ON event_cards FOR SELECT 
TO authenticated
USING (true);

-- Game events are viewable by participants in the game
CREATE POLICY "Game events are viewable by game participants" 
ON game_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.game_id = game_events.game_id
    AND game_participants.user_id = auth.uid()
  )
);

-- Only game hosts can update game events
CREATE POLICY "Only hosts can update game events" 
ON game_events FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.game_id = game_events.game_id
    AND game_participants.user_id = auth.uid()
    AND game_participants.is_host = true
  )
);