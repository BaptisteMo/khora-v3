"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { GameProvider, useGame } from "../GameStateContext";
import React from "react";

interface Participant {
  id: string;
  user_id: string;
  player_number: number;
  is_host: boolean;
  is_active: boolean;
  joined_at: string;
  left_at?: string;
  participant_name: string;
  left_reason?: string;
}

// Server component
export default function WaitingRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <WaitingRoomPageClient gameId={id} />;
}


function WaitingRoomPageClient({ gameId }: { gameId: string }) {
  console.log("OngoingGamePageClient rendered with gameId:", gameId);
  return (
    <GameProvider gameId={gameId}>
      <WaitingRoomContent />
    </GameProvider>
  );
}

function WaitingRoomContent() {
  const { gameState, participants, loading, error } = useGame();
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Host detection: the host is the user who created the game
  const hostId = gameState?.game?.created_by;
  const isHost = userId === hostId;

  // Fetch user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      console.log('Set userId:', session?.user?.id || null);
    });
  }, []);



  // Host: Kick player
  const handleKick = async (participantId: string) => {
    if (!isHost) return;
    if (!window.confirm("Are you sure you want to kick this player?")) return;
    if (!gameState?.game?.id) {
      console.warn('handleKick: gameState or gameState.game.id is undefined');
      return;
    }
    const { error } = await supabase
      .from("game_participants")
      .update({ is_active: false, left_at: new Date().toISOString(), left_reason: "kicked" })
      .eq("id", participantId);
    if (error) alert("Failed to kick player: " + error.message);
  };

  // Host: Promote player to host
  const handlePromote = async (participant: Participant) => {
    if (!isHost) return;
    if (!window.confirm(`Promote ${participant.participant_name} to host? You will lose host privileges.`)) return;
    if (!gameState?.game?.id) {
      console.warn('handlePromote: gameState or gameState.game.id is undefined');
      return;
    }
    // 1. Update games.created_by
    const { error: gameError } = await supabase
      .from("games")
      .update({ created_by: participant.user_id })
      .eq("id", gameState.game.id);
    // 2. Update is_host flags in game_participants
    const { error: hostError } = await supabase
      .from("game_participants")
      .update({ is_host: false })
      .eq("game_id", gameState.game.id)
      .eq("user_id", hostId!);
    const { error: promoteError } = await supabase
      .from("game_participants")
      .update({ is_host: true })
      .eq("game_id", gameState.game.id)
      .eq("user_id", participant.user_id);
    if (gameError || hostError || promoteError) {
      alert("Failed to promote host: " + (gameError?.message || hostError?.message || promoteError?.message));
    }
  };

  // Join game as participant (or reactivate if returning)
  useEffect(() => {
    if (!userId || !gameState?.game?.id) {
      if (!userId) console.warn('Join effect: userId is undefined');
      if (!gameState?.game?.id) console.warn('Join effect: gameState or gameState.game.id is undefined');
      return;
    }
    const myParticipant = participants.find((p) => p.user_id === userId);
    if (myParticipant && myParticipant.left_reason === "kicked") {
      // setError("You have been kicked from this game.");
      return;
    }
    const activeParticipant = participants.find((p) => p.user_id === userId && p.is_active);
    if (!activeParticipant && !joining && (!myParticipant || myParticipant.left_reason !== "kicked")) {
      setJoining(true);
      setJoinError("");
      (async () => {
        try {
          // Find existing participant record for this user
          const existing = participants.find((p) => p.user_id === userId);
          let player_number: number;
          if (existing) {
            player_number = existing.player_number;
          } else {
            // Find the next available player_number (lowest unused)
            const usedNumbers = participants.map((p) => p.player_number);
            let n = 1;
            while (usedNumbers.includes(n)) n++;
            player_number = n;
          }
          const { error } = await supabase
            .from("game_participants")
            .upsert(
              {
                game_id: gameState.game.id,
                user_id: userId,
                player_number,
                is_host: userId === hostId,
                is_active: true,
                left_at: null,
                left_reason: null,
              },
              { onConflict: "game_id,user_id" }
            );
          if (error) {
            setJoinError(error.message);
            alert("Join error: " + error.message);
          }
        } finally {
          setJoining(false);
        }
      })();
    }
  }, [userId, gameState, participants, joining, hostId]);

  // Host: Start Game logic
  const handleStartGame = async () => {
    if (!isHost) return;
    if (!gameState?.game?.id) {
      console.warn('handleStartGame: gameState or gameState.game.id is undefined');
      return;
    }
    // Get all present user IDs (those with is_active=true)
    const presentUserIds = participants.filter((p) => p.is_active).map((p) => p.user_id);
    console.log('Starting game with presentUserIds:', presentUserIds, 'userId:', userId);
    try {
      const res = await fetch(`/api/games/${gameState.game.id}/start-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, presentUserIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to start game');
      }
      // Optionally: show a message or let realtime/game status update handle the UI
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Network error starting game: ' + msg);
    }
  };

  // Leave game (works in both lobby and in-game)
  const handleLeave = async () => {
    if (!userId || !gameState?.game?.id) {
      if (!userId) console.warn('handleLeave: userId is undefined');
      if (!gameState?.game?.id) console.warn('handleLeave: gameState or gameState.game.id is undefined');
      return;
    }
    try {
      const res = await fetch(`/api/games/${gameState.game.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert('Error leaving room: ' + (data.error || 'Unknown error'));
        return;
      }
      router.push("/");
    } catch {
      alert('Network error leaving room');
    }
  };

  // Validation: full or started
  const isFull = gameState?.game && participants.length >= gameState.game.max_players;
  const isStarted = gameState?.game && gameState.game.status !== "lobby";

  // Call leave API on tab close/refresh/navigation
  useEffect(() => {
    if (!userId || !gameState?.game?.id) {
      if (!userId) console.warn('leave API effect: userId is undefined');
      if (!gameState?.game?.id) console.warn('leave API effect: gameState or gameState.game.id is undefined');
      return;
    }
    return () => {
      const url = `/api/games/${gameState.game.id}/leave`;
      const data = JSON.stringify({ userId });
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    };
  }, [userId, gameState?.game?.id]);

  // Redirect to setup-room if game has started
  useEffect(() => {
    if (isStarted && gameState?.game?.id) {
      router.push(`/game/${gameState.game.id}/setup-room`);
    }
  }, [isStarted, gameState?.game?.id, router]);

  if (loading) {
    return <div className="p-8 text-center">Loading waiting room...</div>;
  }
  if (error === "You have been kicked from this game.") {
    return <div className="p-8 text-center text-red-600 font-bold">You have been kicked from this game.<br/>You cannot rejoin unless the host invites you back.</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }
  if (!gameState || !gameState.game) {
    return <div className="p-8 text-center text-red-600">Game not found.</div>;
  }
  if (isStarted) {
    return null;
  }
  if (isFull) {
    return <div className="p-8 text-center text-yellow-600">This game is full. You cannot join.</div>;
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded shadow p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Waiting Room</h1>
        <div className="text-center text-lg font-semibold">{gameState?.game?.name}</div>
        <div className="text-center text-gray-600 mb-2">Game ID: {gameState?.game?.id}</div>
        <div className="mb-4">
          <div className="font-semibold mb-1">
            Connected Players ({participants.filter((p) => p.is_active).length}/{gameState?.game?.max_players ?? 0}):
          </div>
          <ul className="list-disc pl-5">
            {participants.filter((p) => p.is_active).map((p) => (
              <li key={p.user_id} className={p.user_id === hostId ? "font-bold" : ""}>
                {p.user_id} {p.user_id === hostId && <span className="text-xs text-blue-600">(Host)</span>}
                {isHost && p.user_id !== userId && (
                  <>
                    <Button
                      className="ml-2 px-2 py-0.5 bg-red-200 rounded text-xs text-red-800 hover:bg-red-300"
                      onClick={() => handleKick(p.id)}
                    >
                      Kick
                    </Button>
                    <Button
                      className="ml-1 px-2 py-0.5 bg-yellow-200 rounded text-xs text-yellow-800 hover:bg-yellow-300"
                      onClick={() => handlePromote(p)}
                    >
                      Promote
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
        {joinError && <div className="text-red-600 text-sm">{joinError}</div>}
        {isHost && (
          <Button
            className="w-full py-2 bg-blue-500 rounded hover:bg-blue-600 text-white font-bold mb-2"
            onClick={handleStartGame}
          >
            Start Game
          </Button>
        )}
        <Button
          className="w-full py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
          onClick={handleLeave}
        >
          Leave Waiting Room
        </Button>
      </div>
    </div>
  );
} 