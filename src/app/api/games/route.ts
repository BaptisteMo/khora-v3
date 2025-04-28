import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/supabase-route';
import { getUserFromRequest } from '../../../lib/auth-helpers';

export async function POST(req: NextRequest) {
  const supabase = createRouteSupabaseClient();
  const user = await getUserFromRequest(req, supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description = '', options = {}, is_public = true, max_players = 4, min_players = 2 } = body;
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Generate a random join code
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Insert game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      name,
      description,
      created_by: user.id,
      is_public,
      max_players,
      min_players,
      join_code: joinCode,
      game_options: options
    })
    .select()
    .single();
  if (gameError) {
    return NextResponse.json({ error: gameError.message }, { status: 500 });
  }

  // Insert host as participant
  const { error: participantError } = await supabase
    .from('game_participants')
    .insert({
      game_id: game.id,
      user_id: user.id,
      player_number: 1,
      is_host: true
    });
  if (participantError) {
    return NextResponse.json({ error: participantError.message }, { status: 500 });
  }

  return NextResponse.json({ id: game.id, join_code: joinCode }, { status: 201 });
} 