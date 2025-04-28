import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { playerStateId, track, usePhilosophyToken } = await req.json();
  if (!['economy', 'culture', 'military'].includes(track)) {
    return NextResponse.json({ error: 'Invalid track' }, { status: 400 });
  }
  if (!playerStateId) {
    return NextResponse.json({ error: 'Missing playerStateId' }, { status: 400 });
  }

  // Call the atomic RPC
  const { data, error } = await supabase.rpc('upgrade_track_atomic', {
    p_player_state_id: playerStateId,
    p_track: track,
    p_use_philosophy_token: !!usePhilosophyToken,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'No data returned from RPC' }, { status: 500 });
  }
  return NextResponse.json({ playerState: data[0] }, { status: 200 });
} 