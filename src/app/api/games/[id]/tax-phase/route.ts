import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

console.log("=== tax-phase API dynamic route file loaded ===");


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {

  const {id : gameId} = await params;

  console.log("gameId:", gameId);

  // Fetch all player states for this game
  const { data: playerStates, error: playerStatesError } = await supabase
    .from('player_state')
    .select('id, tax_track_position, drachmas')
    .eq('game_id', gameId);

  if (playerStatesError) {
    console.error("playerStatesError:", playerStatesError);
    return NextResponse.json({ error: playerStatesError.message }, { status: 500 });
  }
  console.log("playerStates result:", playerStates);

  const updates = [];
  for (const ps of playerStates ?? []) {
    const currentDrachmas = ps.drachmas ?? 0;
    const tax = ps.tax_track_position ?? 0;
    const newDrachmas = currentDrachmas + tax;
    const { error: updateError } = await supabase
      .from('player_state')
      .update({ drachmas: newDrachmas })
      .eq('id', ps.id);
    updates.push({ id: ps.id, oldDrachmas: currentDrachmas, tax, newDrachmas, error: updateError?.message });
  }

  return NextResponse.json({ updates }, { status: 200 });
}

