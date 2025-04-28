import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    
    const {id : gameId} = await params;

  // Use cookies synchronously as required by Next.js 15+
 // const supabase = createRouteHandlerClient<Database>({ cookies });
  


  // Fetch the game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  // Fetch participants
  const { data: participants, error: participantsError } = await supabase
    .from('game_participants')
    .select('*')
    .eq('game_id', gameId);

  if (participantsError) {
    return NextResponse.json({ error: participantsError.message }, { status: 500 });
  }

  return NextResponse.json({ game, participants }, { status: 200 });

} 