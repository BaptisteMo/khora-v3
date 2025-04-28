import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { GameState, GamePhase, GameStatus } from "@/lib/game-state";
import { supabase } from "@/lib/supabase";

// Add types for participants, playerStates, politicsCards
export interface Participant {
  id: string;
  user_id: string;
  player_number: number;
  is_host: boolean;
  is_active: boolean;
  joined_at: string;
  left_at?: string;
  participant_name: string;
  left_reason?: string;
}
export interface PlayerState {
  id: string;
  game_id: string;
  participant_id: string;
  score: number;
  glory_track_position: number;
  citizen_track_position: number;
  tax_track_position: number;
  culture_track_position: number;
  military_track_position: number;
  economy_track_position: number;
  philosophy_token_num: number;
  drachmas: number;
  last_action?: { type: string; timestamp: string };
  any_color_counter: number;
  red_minor_counter: number;
  red_major_counter: number;
  blue_minor_counter: number;
  blue_major_counter: number;
  green_minor_counter: number;
  green_major_counter: number;
  victory_point: number;
  army_track_position: number;
}
export interface PoliticsCard {
  id: string;
  name: string;
  description: string;
  category: string;
  cost: number;
}

export interface GameContextValue {
  gameState: GameState | null;
  participants: Participant[];
  playerStates: PlayerState[];
  politicsCards: PoliticsCard[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updatePhase: (nextPhase: GamePhase) => Promise<boolean>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
};

export const GameProvider: React.FC<{ gameId: string; children: React.ReactNode }> = ({ gameId, children }) => {
  console.log('GameProvider MOUNTED with gameId:', gameId);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [playerStates, setPlayerStates] = useState<PlayerState[]>([]);
  const [politicsCards, setPoliticsCards] = useState<PoliticsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all game data from API
  const fetchGame = useCallback(async () => {
    if (!gameId) {
      console.warn('fetchGame called with undefined gameId');
      return;
    }
    console.log('fetchGame called with gameId:', gameId);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}`);
      if (!res.ok) throw new Error("Game not found");
      const data = await res.json();
      setGameState(new GameState({
        ...data.game,
        current_phase: data.game.current_phase as GamePhase,
        total_round: typeof data.game.total_round === 'number' ? data.game.total_round : 9,
        created_at: data.game.created_at || new Date().toISOString(),
        updated_at: data.game.updated_at || new Date().toISOString(),
        is_public: typeof data.game.is_public === 'boolean' ? data.game.is_public : true,
        game_options: data.game.game_options || {},
        status: data.game.status as GameStatus,
      }));
      setParticipants(data.participants || []);
      console.log('Participants set:', data.participants || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to load game");
      } else {
        setError("Failed to load game");
      }
    } finally {
      setLoading(false);
      console.log('Loading set to false');
    }
  }, [gameId]);

  // Fetch playerStates
  const fetchPlayerStates = useCallback(async () => {
    if (!gameId) return;
    const { data, error } = await supabase
      .from('player_state')
      .select('*')
      .eq('game_id', gameId);
    if (!error && data) {
      setPlayerStates(data as PlayerState[]);
      console.log('PlayerStates set:', data);
    }
  }, [gameId]);

  // Fetch politicsCards
//  const fetchPoliticsCards = useCallback(async () => {
//    if (!gameId) return;
//    const { data } = await supabase
//      .from('politics_cards')
//      .select('*');
//    if (data) setPoliticsCards(data as PoliticsCard[]);
//  }, [gameId]);

  // Initial fetch and subscriptions
  useEffect(() => {
    if (!gameId) {
      console.warn('GameProvider: gameId is undefined, skipping subscriptions/fetches');
      return;
    }
    try {
      // Participants subscription
      const participantsSub = supabase
        .channel('game_participants_realtime_' + gameId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_participants',
            filter: `game_id=eq.${gameId}`,
          },
          () => {
            try {
              fetchGame(); // This will update participants as well
            } catch (e) {
              console.error('Error in participantsSub fetchGame:', e);
            }
          }
        )
        .subscribe();

      // Player state subscription
      const playerStateSub = supabase
        .channel('player_state_realtime_' + gameId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'player_state',
            filter: `game_id=eq.${gameId}`,
          },
          () => {
            try {
              fetchPlayerStates();
            } catch (e) {
              console.error('Error in playerStateSub fetchPlayerStates:', e);
            }
          }
        )
        .subscribe();

      // Game row subscription
      const gameSub = supabase
        .channel('games_realtime_' + gameId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${gameId}`,
          },
          () => {
            try {
              fetchGame();
            } catch (e) {
              console.error('Error in gameSub fetchGame:', e);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(participantsSub);
        supabase.removeChannel(playerStateSub);
        supabase.removeChannel(gameSub);
        console.log('GameProvider UNMOUNTED with gameId:', gameId);
      };
    } catch (e) {
      console.error('GameProvider: error in subscriptions useEffect', e);
    }
  }, [gameId, fetchGame, fetchPlayerStates]);

  // Fetch game data on initial mount and when gameId changes
  useEffect(() => {
    if (!gameId) return;
    fetchGame();
  }, [gameId, fetchGame]);
  // Fetch game data on initial mount and when gameId changes
  useEffect(() => {
    if (!gameId) return;
    fetchPlayerStates();
  }, [gameId, fetchPlayerStates]);

  // Update phase
  const updatePhase = useCallback(async (nextPhase: GamePhase) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextPhase }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update phase");
        return false;
      }
      await fetchGame();
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to update phase");
      } else {
        setError("Failed to update phase");
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [gameId, fetchGame]);

  return (
    <GameContext.Provider value={{ gameState, participants, playerStates, politicsCards, loading, error, refresh: fetchGame, updatePhase }}>
      {children}
    </GameContext.Provider>
  );
}; 