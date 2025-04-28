import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: gameId } = await params;



  // 3. Update game status to 'setup'
  const { error: gameStatusError } = await supabase
    .from('games')
    .update({ status: 'started' })
    .eq('id', gameId);
  if (gameStatusError) {
    return NextResponse.json({ error: gameStatusError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 