-- Simplest possible fix for the game_participants table
-- Run these in your Supabase SQL Editor

-- 1. First drop all existing policies for the game_participants table
DROP POLICY IF EXISTS "Participants are viewable by anyone in the same game" ON game_participants;
DROP POLICY IF EXISTS "Hosts can update any participant" ON game_participants;
DROP POLICY IF EXISTS "Hosts can update participants" ON game_participants;
DROP POLICY IF EXISTS "Participants can update their own status" ON game_participants;
DROP POLICY IF EXISTS "Users can join games" ON game_participants;
DROP POLICY IF EXISTS "Participants can update their own records" ON game_participants;
DROP POLICY IF EXISTS "Game hosts can update any participant" ON game_participants;

-- 2. Create one simple policy for SELECT (read) operations
CREATE POLICY "Anyone can view game participants" 
ON game_participants FOR SELECT 
USING (true);

-- 3. Create a simple policy for INSERT operations
CREATE POLICY "Users can join games" 
ON game_participants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Create a single, simple policy for UPDATE operations
CREATE POLICY "Users can update their own participant record" 
ON game_participants FOR UPDATE 
USING (auth.uid() = user_id);

-- This is the simplest configuration that will allow your game to work
-- You can refine these policies later once everything is working 