-- Migration: Game Progress Security Policies
-- Description: Set up Row Level Security (RLS) policies for game progress tables

-- Enable Row Level Security on all tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

-- ===============================
-- Policies for Achievements
-- ===============================

-- Achievements are readable by everyone
CREATE POLICY "Achievements are viewable by everyone" 
ON achievements FOR SELECT 
USING (true);

-- Only authenticated users can create/modify achievements
-- In a production environment, this would be restricted to admin roles
CREATE POLICY "Only authenticated users can create achievements" 
ON achievements FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update achievements" 
ON achievements FOR UPDATE 
TO authenticated
USING (true);

-- ===============================
-- Policies for Player Achievements
-- ===============================

-- Player achievements are readable by everyone
CREATE POLICY "Player achievements are viewable by everyone" 
ON player_achievements FOR SELECT 
USING (true);

-- Players can insert their own achievements or game hosts can insert achievements
CREATE POLICY "Players can insert their own achievements" 
ON player_achievements FOR INSERT 
WITH CHECK (
  auth.uid() = profile_id OR 
  -- Or if they are a host of the game where the achievement was earned
  (game_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM game_participants 
    WHERE game_participants.game_id = game_id 
    AND game_participants.user_id = auth.uid() 
    AND game_participants.is_host = true
  ))
);

-- No update policy - achievements are considered immutable once earned

-- ===============================
-- Policies for Game Logs
-- ===============================

-- Game logs are viewable by game participants
CREATE POLICY "Game logs are viewable by game participants" 
ON game_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.game_id = game_id 
    AND game_participants.user_id = auth.uid()
  )
);

-- Game logs can be inserted by participants
CREATE POLICY "Game logs can be inserted by participants" 
ON game_logs FOR INSERT 
WITH CHECK (
  -- Allow if the user is the player referenced in the log
  (player_id = auth.uid()) OR
  -- Or if they are in the game
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.game_id = game_id 
    AND game_participants.user_id = auth.uid()
  )
);

-- Game logs are immutable and cannot be updated or deleted
-- No UPDATE or DELETE policies needed 