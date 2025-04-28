'use client';

import { GameProvider, useGame } from "../GameStateContext";
import SetupRoom from './SetupRoom';
import { useEffect, useState } from 'react';
import React from "react";

// Server component
export default function SetupRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <SetupRoomPageClient gameId={id} />;
}

function SetupRoomPageClient({ gameId }: { gameId: string }) {
  console.log("OngoingGamePageClient rendered with gameId:", gameId);
  return (
    <GameProvider gameId={gameId}>
      <SetupRoomContent />
    </GameProvider>
  );
}

function SetupRoomContent() {
  const { gameState, participants, playerStates } = useGame();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user session
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUserId(session?.user?.id || null);
      });
    });
  }, []);

  useEffect(() => {
    if (!userId || !gameState?.game?.id) return;
    fetch(`/api/games/${gameState.game.id}/setup-room/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  }, [userId, gameState?.game?.id]);

  if (!userId || !gameState?.game) return <div>Loading...</div>;

  return (
    <SetupRoom
      gameId={gameState.game.id}
      userId={userId}
      hostId={gameState.game.created_by}
      participants={participants}
      playerStates={playerStates}
      onCitiesAssigned={() => {}}
    />
  );
} 