import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: gameId } = await params;
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  // Fetch the game to check its status
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('status')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  let updateFields;
  if (game.status === 'lobby' || game.status === 'setup') {
    // Waiting room or setup: mark as inactive
    updateFields = {
      is_active: false,
      left_at: new Date().toISOString(),
      left_reason: 'left',
    };
  } else {
    // Ongoing game: only mark as disconnected, do not set is_active = false
    updateFields = {
      left_at: new Date().toISOString(),
      left_reason: 'disconnected',
    };
  }

  const { error } = await supabase
    .from('game_participants')
    .update(updateFields)
    .eq('game_id', gameId)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 