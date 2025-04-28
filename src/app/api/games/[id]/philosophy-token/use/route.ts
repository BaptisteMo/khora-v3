import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { playerStateId, phase } = await req.json();
  if (!playerStateId || !phase) {
    return NextResponse.json({ error: 'Missing playerStateId or phase' }, { status: 400 });
  }

  // Call the atomic RPC
  const { data, error } = await supabase.rpc('use_philosophy_token_atomic', {
    p_player_state_id: playerStateId,
    p_phase: phase,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'No data returned from RPC' }, { status: 500 });
  }
  return NextResponse.json({ playerState: data[0] }, { status: 200 });
} 