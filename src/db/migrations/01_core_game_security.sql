-- Migration: Core Game Data Tables Security Policies
-- Description: Set up Row Level Security (RLS) policies for core game tables

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_state ENABLE ROW LEVEL SECURITY;

-- Create policies for Profiles table
-- Users can read any profile
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Profiles are inserted automatically via trigger after auth.user creation
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create policies for Games table
-- Anyone can view public games, or games they are a participant in
CREATE POLICY "Games are viewable by participants and public games by anyone" 
ON games FOR SELECT 
USING (
  is_public = true OR 
  EXISTS (
    SELECT 1 FROM game_participants 
    WHERE game_participants.game_id = id 
    AND game_participants.user_id = auth.uid()
  )
);

-- Only hosts can update games
CREATE POLICY "Only hosts can update games" 
ON games FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM game_participants 
    WHERE game_participants.game_id = id 
    AND game_participants.user_id = auth.uid() 
    AND game_participants.is_host = true
  )
);

-- Authenticated users can create games
CREATE POLICY "Authenticated users can create games" 
ON games FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Only game creator can delete games
CREATE POLICY "Only game creator can delete games" 
ON games FOR DELETE 
USING (auth.uid() = created_by);

-- Create policies for Game Participants table
-- Participants can be viewed by anyone in the same game
CREATE POLICY "Participants are viewable by anyone in the same game" 
ON game_participants FOR SELECT 
TO authenticated
USING (
  -- Allow users to see their own participant records directly
  user_id = auth.uid() OR
  -- Allow users to see participant records for games they're in
  game_id IN (
    SELECT game_id FROM game_participants 
    WHERE user_id = auth.uid()
  )
);

-- Users can join games (insert themselves as participants)
CREATE POLICY "Users can join games" 
ON game_participants FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM games
    WHERE games.id = game_id
    AND (
      games.is_public = true OR
      -- Allow joining private games with join code, this would be checked in application code
      games.is_public = false
    )
  )
);

-- Participants can only update their own status
CREATE POLICY "Participants can update their own status" 
ON game_participants FOR UPDATE 
USING (auth.uid() = user_id);

-- Host can update any participant in their game
CREATE POLICY "Hosts can update participants" 
ON game_participants FOR UPDATE 
USING (
  -- First check if current user is updating their own record
  user_id = auth.uid() OR
  -- Otherwise, check if the participant belongs to a game where current user is host
  EXISTS (
    SELECT 1 FROM games g
    JOIN game_participants hp ON g.id = hp.game_id
    WHERE g.id = game_id
    AND hp.user_id = auth.uid()
    AND hp.is_host = true
  )
);

-- Create policies for Player State table
-- Player state is readable by all participants in the game
CREATE POLICY "Player state is readable by game participants" 
ON player_state FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.game_id = game_id 
    AND game_participants.user_id = auth.uid()
  )
);

-- Players can only update their own state
CREATE POLICY "Players can update their own state" 
ON player_state FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.id = participant_id 
    AND game_participants.user_id = auth.uid()
  )
);

-- Host can update any player state in their game
CREATE POLICY "Hosts can update any player state" 
ON player_state FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.game_id = game_id 
    AND game_participants.user_id = auth.uid() 
    AND game_participants.is_host = true
  )
);

-- Create a trigger function to create a profile after user signup
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile after a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user(); 