import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CITIES } from '@/data/cities';


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: gameId } = await params;
  const { userId } = await req.json(); // Host userId must be provided

  // Check if user is host
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('created_by')
    .eq('id', gameId)
    .single();
  if (gameError || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  if (game.created_by !== userId) {
    return NextResponse.json({ error: 'Only the host can assign cities' }, { status: 403 });
  }

  // Fetch all active participants
  const { data: participants, error: partError } = await supabase
    .from('game_participants')
    .select('id')
    .eq('game_id', gameId)
    .eq('is_active', true);
  if (partError || !participants) {
    return NextResponse.json({ error: 'Could not fetch participants' }, { status: 500 });
  }

  // Shuffle and assign cities
  const shuffledCities = [...CITIES].sort(() => Math.random() - 0.5);
  const updates = [];
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    const city = shuffledCities[i % CITIES.length];
    // Update player_state with city_id
    updates.push(
      supabase
        .from('player_state')
        .update({ city_id: city.id })
        .eq('participant_id', participant.id)
        .eq('game_id', gameId)
    );
    // TODO: Apply startingEffect logic
  }
  await Promise.all(updates);

  return NextResponse.json({ success: true });
} 