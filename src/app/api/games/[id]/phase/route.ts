import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GameState, GamePhase, GameStatus } from '@/lib/game-state';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { nextPhase } = await req.json();
  const { id: gameId } = await params;

  // Fetch the game
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  // Centralized validation using GameState
  const gameState = new GameState({
    ...game,
    current_phase: game.current_phase as GamePhase,
    total_round: typeof game.total_round === 'number' ? game.total_round : 9,
    created_at: game.created_at || new Date().toISOString(),
    updated_at: game.updated_at || new Date().toISOString(),
    is_public: typeof game.is_public === 'boolean' ? game.is_public : true,
    game_options: game.game_options || {},
    status: game.status as GameStatus,
  });
  const validation = gameState.validatePhaseTransition(nextPhase as GamePhase);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 403 });
  }
  const updates = validation.updates || {};

  // Update the game
  const { error: updateError } = await supabase
    .from('games')
    .update(updates)
    .eq('id', gameId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ...game, ...updates }, { status: 200 });
} 