"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { TRACKS } from '@/config/track-upgrade';
import { Button } from "@/components/ui/button";
import { GameProvider, useGame } from "../GameStateContext";
import React from "react";
import type { Participant } from "../GameStateContext";

// Add a minimal local type for GamePhase
type GamePhase = string; // Replace with enum or union if stricter typing is needed

// Server component
export default function OngoingGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <OngoingGamePageClient gameId={id} />;
}

// Client component
function OngoingGamePageClient({ gameId }: { gameId: string }) {
  console.log("OngoingGamePageClient rendered with gameId:", gameId);

  return (
    <GameProvider gameId={gameId}>
      <OngoingGameContent />
    </GameProvider>
  );
}

function OngoingGameContent() {
  const { gameState, participants, playerStates, loading, error } = useGame();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [philosophyError, setPhilosophyError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<'economy' | 'culture' | 'military'>('economy');
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);


  console.log("OngoingGameContent rendered");

  // Fetch user session for correct host detection
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Host detection: the host is the user who created the game
  const hostId = gameState?.game?.created_by;
  const isHost = userId === hostId;

  // Host: Change phase logic
  const handlePhaseChange = async (direction: "next" | "prev") => {
    if (!isHost || !gameState) return;
    let newPhase: GamePhase = gameState.phase;
    const action: 'next' | 'previous' = direction === 'next' ? 'next' : 'previous';
    if (direction === 'next') {
      newPhase = gameState.nextPhase();
    } else if (direction === 'prev') {
      newPhase = gameState.prevPhase();
    }
    if (newPhase && newPhase !== gameState.phase) {
      try {
        const res = await fetch(`/api/games/${gameState.id}/phase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            nextPhase: newPhase
          })
        });
        if (!res.ok) {
          const data = await res.json();
          alert('Failed to change phase: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Failed to change phase: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  // Leave game (frontend only: just redirect, do not update backend)
  const handleLeave = async () => {
    router.push("/");
  };

  // Use GameState for phase/round management
  const currentPhase = gameState?.phase || 'Setup';

  // Host: Kick player
  const handleKick = useCallback(async (participantId: string) => {
    if (!isHost) return;
    if (!window.confirm("Are you sure you want to kick this player?")) return;
    setActionLoading(true);
    const { error } = await supabase
      .from("game_participants")
      .update({ is_active: false, left_at: new Date().toISOString(), left_reason: "kicked" })
      .eq("id", participantId);
    setActionLoading(false);
    if (error) alert("Failed to kick player: " + error.message);
  }, [isHost]);

  // Host: Promote player to host
  const handlePromote = useCallback(async (participant: Participant) => {
    if (!isHost) return;
    if (!window.confirm(`Promote ${participant.participant_name} to host? You will lose host privileges.`)) return;
    setActionLoading(true);
    // 1. Update games.created_by
    const { error: gameError } = await supabase
      .from("games")
      .update({ created_by: participant.user_id })
      .eq("id", gameState?.id);
    // 2. Update is_host flags in game_participants
    const { error: hostError } = await supabase
      .from("game_participants")
      .update({ is_host: false })
      .eq("game_id", gameState?.id)
      .eq("user_id", hostId!);
    const { error: promoteError } = await supabase
      .from("game_participants")
      .update({ is_host: true })
      .eq("game_id", gameState?.id)
      .eq("user_id", participant.user_id);
    setActionLoading(false);
    if (gameError || hostError || promoteError) {
      alert("Failed to promote host: " + (gameError?.message || hostError?.message || promoteError?.message));
    }
  }, [isHost, gameState?.id, hostId]);

  // Call leave API on unmount (route change/navigation away)
  useEffect(() => {
    if (!userId || !gameState?.id) return;
    const handleLeave = async () => {
      await fetch(`/api/games/${gameState?.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    };
    return () => {
      handleLeave();
    };
  }, [userId, gameState?.id]);

  if (error === "You have been kicked from this game.") {
    return <div className="p-8 text-center text-red-600 font-bold">You have been kicked from this game.<br/>You cannot rejoin unless the host invites you back.</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }
  if (!gameState) {
    return <div className="p-8 text-center text-red-600">Game not found.</div>;
  }

  // --- Host phase controls ---
  // Place this near the top of your main render
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
  
      <div className="w-full  bg-white rounded shadow p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center mb-4">Game In Progress</h1>
        <div className="text-center text-lg font-semibold">{gameState.game.name}</div>
        <div className="text-center text-lg font-semibold">Round: {gameState.round} / {gameState.totalRounds}</div>
        <div className="text-center text-gray-600 mb-2">Game ID: {gameState.game.id}</div>
        

        {/* Phase badge and controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Badge variant="secondary" className="text-lg px-4 py-2 flex items-center gap-2">
            Phase: {currentPhase}
            {loading && <span className="ml-2 animate-spin">⏳</span>}
          </Badge>

          {isHost && (
            <div className="flex gap-2 mb-4">
             <button
                type="button"
                className="..."
                onClick={e => {
                  e.preventDefault();
                  handlePhaseChange('prev');
                }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Previous Phase"}
              </button>
             <button
                type="button"
                className="..."
                onClick={e => {
                  e.preventDefault();
                  handlePhaseChange('next');
                }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Next Phase"}
              </button>
            </div>
          )}    
        </div>
        {/* Philosophy Token Counter and Use Button */}
        {(() => {
          const myParticipant = participants.find((p) => p.user_id === userId && p.is_active);
          const myPlayerState = playerStates.find((ps) => ps.participant_id === myParticipant?.id);
          const allowedPhases = ["Dice", "Action", "Progress"];
          const canUsePhilosophy = !!myPlayerState && myPlayerState.philosophy_token_num > 0 && allowedPhases.includes(currentPhase);
          const handleUsePhilosophy = async () => {
            setPhilosophyError(null);
            if (!myPlayerState) return;
            try {
              const res = await fetch(`/api/games/${gameState?.id}/philosophy-token/use`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phase: currentPhase,
                  playerStateId: myPlayerState.id,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                setPhilosophyError(data.error || 'Failed to use philosophy token');
                return;
              }
              // Optionally update local state with data.playerState
            } catch {
              setPhilosophyError('Network error');
            }
          };
          return myPlayerState ? (
            <div className="flex flex-col gap-1 mb-4">
              <div className="flex items-center gap-3">
                <span className="font-bold">Philosophy Tokens:</span>
                <span className="px-2 py-1 bg-yellow-100 rounded text-lg font-mono">{myPlayerState.philosophy_token_num}</span>
                <Button
                  className={`px-3 py-1 rounded ${canUsePhilosophy ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  disabled={!canUsePhilosophy}
                  onClick={handleUsePhilosophy}
                  title={
                    myPlayerState.philosophy_token_num === 0
                      ? 'No tokens available'
                      : !allowedPhases.includes(currentPhase)
                      ? 'Cannot use token in this phase'
                      : 'Use a philosophy token'
                  }
                >
                  Use Philosophy Token
                </Button>
              </div>
              {philosophyError && <div className="text-red-600 text-sm">{philosophyError}</div>}
            </div>
          ) : null;
        })()}
        {/* Player state table */}
        <div className="mb-4">
          <div className="font-semibold mb-2">Player States:</div>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Player</th>
                <th className="p-2 border">Citizen</th>
                <th className="p-2 border">Army</th>
                <th className="p-2 border">Tax</th>
                <th className="p-2 border">Glory</th>
                <th className="p-2 border">Victory Points</th>
                <th className="p-2 border">Culture</th>
                <th className="p-2 border">Military</th>
                <th className="p-2 border">Economy</th>
                <th className="p-2 border">Drachmas</th>
                <th className="p-2 border">Last Action</th>
              </tr>
            </thead>
            <tbody>
              {playerStates.map((ps) => {
                const participant = participants.find((p) => p.id === ps.participant_id);
                const isActive = participant?.is_active;
            
                return (
                  <tr key={ps.id} className={!isActive ? 'text-gray-400' : ''}>
                    <td className="p-2 border font-semibold">
                      {participant?.participant_name || participant?.user_id || ps.participant_id}
                      {participant?.user_id === hostId && <span className="text-xs text-blue-600 ml-1">(Host)</span>}
                      {participant?.user_id === userId && <span className="text-xs text-green-600 ml-1">(You)</span>}
                      {participant?.left_reason === 'disconnected' && <span className="text-xs text-red-500 ml-1">(Disconnected)</span>}
                      {isHost && participant && participant.user_id !== userId && (
                        <>
                          <Button
                            className="ml-2 px-2 py-0.5 bg-red-200 rounded text-xs text-red-800 hover:bg-red-300"
                            disabled={actionLoading}
                            onClick={() => handleKick(participant.id)}
                          >
                            Kick
                          </Button>
                          <Button
                            className="ml-1 px-2 py-0.5 bg-yellow-200 rounded text-xs text-yellow-800 hover:bg-yellow-300"
                            disabled={actionLoading || participant.user_id === hostId}
                            onClick={() => handlePromote(participant)}
                          >
                            Promote
                          </Button>
                        </>
                      )}
                    </td>
                    <td className="p-2 border text-center">
                      {ps.citizen_track_position}
                    </td>
                    <td className="p-2 border text-center">
                      {ps.army_track_position}
                    </td>
                    <td className="p-2 border text-center">{ps.tax_track_position}</td>
                    <td className="p-2 border text-center">{ps.glory_track_position}</td>
                    <td className="p-2 border text-center">
                      {ps.victory_point}
                    </td>
                    <td className="p-2 border text-center">{ps.culture_track_position}</td>
                    <td className="p-2 border text-center">{ps.military_track_position}</td>
                    <td className="p-2 border text-center">{ps.economy_track_position}</td>
                    <td className="p-2 border text-center">{ps.drachmas}</td>
                    <td className="p-2 border text-center">
                      {ps.last_action ? (typeof ps.last_action === 'string' ? ps.last_action : ps.last_action.type) : <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Token Counters Table */}
          <div className="mb-6">
            <div className="font-semibold mb-2">Token Counters (All Players):</div>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Player</th>
                  <th className="p-2 border">Red Minor</th>
                  <th className="p-2 border">Red Major</th>
                  <th className="p-2 border">Blue Minor</th>
                  <th className="p-2 border">Blue Major</th>
                  <th className="p-2 border">Green Minor</th>
                  <th className="p-2 border">Green Major</th>
                  <th className="p-2 border">Any Color</th>
                </tr>
              </thead>
              <tbody>
                {playerStates.map((ps) => {
                  const participant = participants.find((p) => p.id === ps.participant_id);
                  return (
                    <tr key={ps.id}>
                      <td className="p-2 border font-semibold">
                        {participant?.participant_name || participant?.user_id || ps.participant_id}
                      </td>
                      <td className="p-2 border text-center">{ps.red_minor_counter ?? 0}</td>
                      <td className="p-2 border text-center">{ps.red_major_counter ?? 0}</td>
                      <td className="p-2 border text-center">{ps.blue_minor_counter ?? 0}</td>
                      <td className="p-2 border text-center">{ps.blue_major_counter ?? 0}</td>
                      <td className="p-2 border text-center">{ps.green_minor_counter ?? 0}</td>
                      <td className="p-2 border text-center">{ps.green_major_counter ?? 0}</td>
                      <td className="p-2 border text-center">{ps.any_color_counter ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Upgrade Track Button for Current Player */}
            {(() => {
              const myParticipant = participants.find((p) => p.user_id === userId && p.is_active);
              const myPlayerState = playerStates.find((ps) => ps.participant_id === myParticipant?.id);
              const getNextLevel = (track: 'economy' | 'culture' | 'military') => {
                if (!myPlayerState) return 2;
                switch (track) {
                  case 'economy': return (myPlayerState.economy_track_position ?? 1) + 1;
                  case 'culture': return (myPlayerState.culture_track_position ?? 1) + 1;
                  case 'military': return (myPlayerState.military_track_position ?? 1) + 1;
                }
              };
              const nextLevel = getNextLevel(selectedTrack);
              const nextUpgrade = TRACKS[selectedTrack][nextLevel];
              function formatReward(reward: Record<string, number | undefined>) {
                if (!reward || Object.keys(reward).length === 0) return 'None';
                return Object.entries(reward)
                  .map(([k, v]) => {
                    const value = v ?? 0;
                    switch (k) {
                      case 'citizen': return `+${value} Citizen${value > 1 ? 's' : ''}`;
                      case 'victory_point': return `+${value} Victory Point${value > 1 ? 's' : ''}`;
                      case 'tax': return `+${value} Tax Track`;
                      case 'glory': return `+${value} Glory Track`;
                      case 'dice': return `+${value} Dice${value > 1 ? 's' : ''}`;
                      default: return `+${value} ${k}`;
                    }
                  })
                  .join(', ');
              }
              const canUpgrade = myPlayerState && currentPhase === 'Progress' && ['economy', 'culture', 'military'].some(track => {
                const nl = getNextLevel(track as 'economy' | 'culture' | 'military');
                const info = TRACKS[track as 'economy' | 'culture' | 'military'][nl];
                return info && myPlayerState.drachmas >= info.cost;
              });
              const handleUpgrade = async () => {
                setUpgradeError(null);
                setUpgradeLoading(true);
                try {
                  const res = await fetch(`/api/games/${gameState?.id}/track-upgrade`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      playerStateId: myPlayerState?.id,
                      track: selectedTrack,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setUpgradeError(data.error || 'Upgrade failed');
                    return;
                  }
                  // Optionally update local state with data.playerState
                } catch {
                  setUpgradeError('Network error');
                } finally {
                  setUpgradeLoading(false);
                }
              };
              if (!myPlayerState) return null;
              return (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="flex gap-2 items-center">
                    <label htmlFor="track-select">Upgrade Track:</label>
                    <select
                      id="track-select"
                      value={selectedTrack}
                      onChange={e => setSelectedTrack(e.target.value as 'economy' | 'culture' | 'military')}
                      className="border rounded px-2 py-1"
                    >
                      <option value="economy">Economy</option>
                      <option value="culture">Culture</option>
                      <option value="military">Military</option>
                    </select>
                    <Button
                      className={`px-3 py-1 rounded ${canUpgrade ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      disabled={!canUpgrade || upgradeLoading || !nextUpgrade}
                      onClick={handleUpgrade}
                    >
                      {upgradeLoading ? 'Upgrading...' : 'Upgrade'}
                    </Button>
                  </div>
                  {/* Show cost and reward for next upgrade */}
                  <div className="text-sm mt-1">
                    {nextUpgrade
                      ? (<span>Cost: <b>{nextUpgrade.cost}</b> drachmas. Reward: <b>{formatReward(nextUpgrade.reward)}</b></span>)
                      : (<span className="text-gray-500">No further upgrades available for this track.</span>)}
                  </div>
                  {upgradeError && <div className="text-red-600 text-sm">{upgradeError}</div>}
                </div>
              );
            })()}
          </div>
          {/* Mock action buttons for current user */}
          {(() => {
            const myParticipant = participants.find((p) => p.user_id === userId);
            const myPlayerState = playerStates.find((ps) => ps.participant_id === myParticipant?.id);
            if (!myParticipant || !myPlayerState) return null;
            const handleMockAction = async (actionType: string) => {
              await supabase
                .from('player_state')
                .update({ last_action: { type: actionType, timestamp: new Date().toISOString() } })
                .eq('id', myPlayerState.id);
            };
            return (
              <div className="flex gap-2 mt-4">
                <Button
                  className="px-3 py-1 bg-blue-200 rounded hover:bg-blue-300 text-blue-900 text-sm"
                  onClick={() => handleMockAction('Action 1')}
                >
                  Action 1
                </Button>
                <Button
                  className="px-3 py-1 bg-green-200 rounded hover:bg-green-300 text-green-900 text-sm"
                  onClick={() => handleMockAction('Action 2')}
                >
                  Action 2
                </Button>
                <Button
                  className="px-3 py-1 bg-purple-200 rounded hover:bg-purple-300 text-purple-900 text-sm"
                  onClick={() => handleMockAction('Action 3')}
                >
                  Action 3
                </Button>
              </div>
            );
          })()}
        </div>
        {/* Politics Card Draft UI */}

        <Button
          className="w-full py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
          onClick={handleLeave}
        >
          Leave Game
        </Button>
      </div>
    </div>
  );
} 