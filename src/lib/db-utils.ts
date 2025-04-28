import { supabase } from './supabase';
import type { Game, GameParticipant, PlayerState, Profile } from './supabase';

/**
 * Profile-related utilities
 */
export const profileUtils = {
  // Get a user's profile
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  },
  
  // Get a user's profile by username
  async getProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }
    
    return data;
  },
  
  // Create or update a user's profile
  async upsertProfile(profile: Profile): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting profile:', error);
      return null;
    }
    
    return data;
  }
};

/**
 * Game-related utilities
 */
export const gameUtils = {
  // Create a new game
  async createGame(game: Omit<Game, 'id' | 'created_at' | 'updated_at'>): Promise<Game | null> {
    const { data, error } = await supabase
      .from('games')
      .insert(game)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating game:', JSON.stringify(error, null, 2));
      console.error('Error details - code:', error.code, 'message:', error.message, 'hint:', error.hint || 'none');
      console.error('Game data attempted:', JSON.stringify(game, null, 2));
      return null;
    }
    
    return data;
  },
  
  // Get a game by ID
  async getGame(gameId: string): Promise<Game | null> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    
    if (error) {
      console.error('Error fetching game:', error);
      return null;
    }
    
    return data;
  },
  
  // Get a game by join code
  async getGameByJoinCode(joinCode: string): Promise<Game | null> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('join_code', joinCode)
      .single();
    
    if (error) {
      console.error('Error fetching game by join code:', error);
      return null;
    }
    
    return data;
  },
  
  // Get all public games in lobby or started state
  async getPublicLobbies(): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_public', true)
      .in('status', ['lobby', 'started', 'in_progress'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching public lobbies:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Update a game's status
  async updateGameStatus(
    gameId: string, 
    status: 'lobby' | 'in_progress' | 'completed' | 'abandoned'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('games')
      .update({ status })
      .eq('id', gameId);
    
    if (error) {
      console.error('Error updating game status:', error);
      return false;
    }
    
    return true;
  },
  
  // Update game's current phase and round
  async updateGameProgress(
    gameId: string, 
    phase: string, 
    round?: number
  ): Promise<boolean> {
    const updates: any = { current_phase: phase };
    if (round !== undefined) {
      updates.current_round = round;
    }
    
    const { error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', gameId);
    
    if (error) {
      console.error('Error updating game progress:', error);
      return false;
    }
    
    return true;
  }
};

/**
 * Game Participant utilities
 */
export const participantUtils = {
  // Add a participant to a game
  async joinGame(
    gameId: string, 
    userId: string, 
    playerNumber: number, 
    isHost: boolean = false
  ): Promise<GameParticipant | null> {
    const { data, error } = await supabase
      .from('game_participants')
      .insert({
        game_id: gameId,
        user_id: userId,
        player_number: playerNumber,
        is_host: isHost
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error joining game:', error);
      return null;
    }
    
    return data;
  },
  
  // Get all participants in a game
  async getGameParticipants(gameId: string): Promise<GameParticipant[]> {
    const { data, error } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .order('player_number');
    
    if (error) {
      console.error('Error fetching game participants:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Get participant details
  async getParticipant(gameId: string, userId: string): Promise<GameParticipant | null> {
    const { data, error } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching participant:', error);
      return null;
    }
    
    return data;
  },
  
  // Leave game (mark participant as inactive)
  async leaveGame(gameId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('game_participants')
      .update({
        is_active: false,
        left_at: new Date().toISOString()
      })
      .eq('game_id', gameId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error leaving game:', error);
      return false;
    }
    
    return true;
  },
  
  // Reactivate a participant (set is_active=true, clear left_at/left_reason)
  async reactivateParticipant(gameId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('game_participants')
      .update({
        is_active: true,
        left_at: null,
        left_reason: null,
      })
      .eq('game_id', gameId)
      .eq('user_id', userId);
    if (error) {
      console.error('Error reactivating participant:', error);
      return false;
    }
    return true;
  }
};

/**
 * Player State utilities
 */
export const playerStateUtils = {
  // Get a player's state in a game
  async getPlayerState(gameId: string, participantId: string): Promise<PlayerState | null> {
    const { data, error } = await supabase
      .from('player_state')
      .select('*')
      .eq('game_id', gameId)
      .eq('participant_id', participantId)
      .single();
    
    if (error) {
      console.error('Error fetching player state:', error);
      return null;
    }
    
    return data;
  },
  
  // Get all player states in a game
  async getAllPlayerStates(gameId: string): Promise<PlayerState[]> {
    const { data, error } = await supabase
      .from('player_state')
      .select('*')
      .eq('game_id', gameId);
    
    if (error) {
      console.error('Error fetching all player states:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Update a player's track position
  async updateTrackPosition(
    stateId: string,
    track: 'glory' | 'citizen' | 'tax' | 'culture' | 'military' | 'economy' | 'philosophy',
    position: number
  ): Promise<boolean> {
    const trackField = `${track}_track_position`;
    const updates: any = {};
    updates[trackField] = position;
    
    const { error } = await supabase
      .from('player_state')
      .update(updates)
      .eq('id', stateId);
    
    if (error) {
      console.error(`Error updating ${track} track:`, error);
      return false;
    }
    
    return true;
  },
  
  // Update a player's resources
  async updateResources(
    stateId: string,
    resources: {
      citizens?: number;
      gold?: number;
      military?: number;
      culture?: number;
    }
  ): Promise<boolean> {
    // First get current resources
    const { data: currentState, error: fetchError } = await supabase
      .from('player_state')
      .select('resources')
      .eq('id', stateId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current player state:', fetchError);
      return false;
    }
    
    // Merge current resources with updates
    const updatedResources = {
      ...currentState.resources,
      ...resources
    };
    
    // Update the resources
    const { error: updateError } = await supabase
      .from('player_state')
      .update({ resources: updatedResources })
      .eq('id', stateId);
    
    if (updateError) {
      console.error('Error updating player resources:', updateError);
      return false;
    }
    
    return true;
  },
  
  // Update player's action count
  async updateActionCount(stateId: string, currentActions: number): Promise<boolean> {
    const { error } = await supabase
      .from('player_state')
      .update({ current_actions: currentActions })
      .eq('id', stateId);
    
    if (error) {
      console.error('Error updating action count:', error);
      return false;
    }
    
    return true;
  },
  
  // Reset action count (typically at the start of a new phase)
  async resetActionCount(gameId: string): Promise<boolean> {
    const { error } = await supabase
      .from('player_state')
      .update({ current_actions: 0 })
      .eq('game_id', gameId);
    
    if (error) {
      console.error('Error resetting action counts:', error);
      return false;
    }
    
    return true;
  }
}; 