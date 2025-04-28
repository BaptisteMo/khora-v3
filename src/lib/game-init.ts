import { GameState } from "@/lib/game-state";
import { supabase } from "@/lib/supabase";

export async function createNewGame({
  name,
  created_by,
  max_players,
  min_players,
  total_round,
  current_round,
  is_public,
  game_options = {},
}: {
  name: string;
  created_by: string;
  max_players?: number;
  min_players?: number;
  total_round?: number;
  current_round?: number;
  is_public?: boolean;
  game_options?: Record<string, unknown>;
}) {
  const newGame = GameState.initNewGame({
    name,
    created_by,
    max_players,
    min_players,
    total_round,
    is_public,
    game_options,
    current_round,
  });

  const { data, error } = await supabase
    .from("games")
    .insert([newGame])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function buildNewGame({
  name,
  created_by,
  is_public = true,
  min_players = 2,
  max_players = 4,
  total_round = 9,
  game_options = {},
  description = "",
}: {
  name: string;
  created_by: string;
  is_public?: boolean;
  min_players?: number;
  max_players?: number;
  total_round?: number;
  game_options?: Record<string, unknown>;
  description?: string;
}) {
  return {
    name,
    created_by,
    is_public,
    min_players,
    max_players,
    total_round,
    current_round: 1,
    game_options,
    description,
    // created_at, updated_at, id will be set by Supabase
  };
} 