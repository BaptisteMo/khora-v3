import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: gameId } = await params;
  const { userId, presentUserIds } = await req.json(); // host userId and array of present userIds

  console.log('presentUserIds:', presentUserIds, 'Type:', typeof presentUserIds, 'IsArray:', Array.isArray(presentUserIds));

  if (!userId || !Array.isArray(presentUserIds)) {
    return NextResponse.json({ error: 'Missing userId or presentUserIds' }, { status: 400 });
  }

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
    return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 });
  }

  // 3. Update game status to 'setup'
  const { error: gameStatusError } = await supabase
    .from('games')
    .update({ status: 'setup' })
    .eq('id', gameId);
  if (gameStatusError) {
    return NextResponse.json({ error: gameStatusError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 