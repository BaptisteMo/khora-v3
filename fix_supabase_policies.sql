-- Run these commands in your Supabase SQL Editor:

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Participants are viewable by anyone in the same game" ON game_participants;
DROP POLICY IF EXISTS "Hosts can update any participant" ON game_participants;
DROP POLICY IF EXISTS "Hosts can update participants" ON game_participants;

-- Then create the fixed policies
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

-- Participants can update their own records only
CREATE POLICY "Participants can update their own records" 
ON game_participants FOR UPDATE 
USING (user_id = auth.uid());

-- Extra simple host policy - separate from the participant self-update policy
CREATE POLICY "Game hosts can update any participant" 
ON game_participants FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM game_participants 
    WHERE game_participants.game_id = game_id
    AND game_participants.user_id = auth.uid() 
    AND game_participants.is_host = true
  )
); 