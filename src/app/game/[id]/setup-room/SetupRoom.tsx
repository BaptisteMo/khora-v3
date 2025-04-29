import { useState } from 'react';
import { CITIES } from '@/data/cities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Participant {
  id: string;
  user_id: string;
  participant_name: string;
  is_active: boolean;
}

interface PlayerState {
  id: string;
  participant_id: string;
  city_id?: string;
  // ...other fields
}

interface SetupRoomProps {
  gameId: string;
  userId: string;
  hostId: string;
  participants: Participant[];
  playerStates: PlayerState[];
  onCitiesAssigned?: () => void;
}

export default function SetupRoom({
  gameId,
  userId,
  hostId,
  participants,
  playerStates,
  onCitiesAssigned
}: SetupRoomProps) {
  const [assigning, setAssigning] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // Check if all players have a city assigned
  const allAssigned = Array.isArray(playerStates) && playerStates.every(ps => !!ps.city_id);
  const isHost = userId === hostId;


  const handleAssignCities = async () => {
    setAssigning(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}/assign-cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to assign cities');
      } else {
        onCitiesAssigned?.();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setAssigning(false);
    }
  };

  const handleLaunchGame = async () => {
    setLaunching(true);
    setError(null);
    try {
      // Collect all present user IDs (those who are active participants)
      const presentUserIds = participants
        .filter((p) => p.is_active)
        .map((p) => p.user_id);

      const res = await fetch(`/api/games/${gameId}/start-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, presentUserIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to launch game');
      } else {
        router.push(`/game/${gameId}/ongoing-game`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-white rounded shadow p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center mb-4">Setup Room</h1>
        <div className="mb-4 text-center text-gray-600">Assigning cities to all players before the game starts.</div>
        {isHost && !allAssigned && (
          <Button
            className="w-full py-2 bg-blue-500 rounded hover:bg-blue-600 text-white font-bold mb-2"
            onClick={handleAssignCities}
            disabled={assigning}
          >
            {assigning ? 'Assigning...' : 'Assign Cities'}
          </Button>
        )}
        {isHost && allAssigned && (
          <Button
            className="w-full py-2 bg-green-600 rounded hover:bg-green-700 text-white font-bold mb-2"
            onClick={handleLaunchGame}
            disabled={launching}
          >
            {launching ? 'Launching...' : 'Launch Game'}
          </Button>
        )}
        {error && <div className="text-red-600 text-center">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {(participants ?? []).map((p) => {
            const ps = playerStates.find(ps => ps.participant_id === p.id);
            const city = ps?.city_id ? CITIES.find(c => c.id === ps.city_id) : null;
            return (
              <Card key={p.id} className="p-4 flex flex-col items-center">
                <div className="font-bold text-lg mb-1 flex items-center gap-2">
                  {p.participant_name || p.user_id}
                  {/* Dev-only: show is_active status */}
                  <span title={p.is_active ? 'Active (is_active=true)' : 'Inactive (is_active=false)'}>
                    {p.is_active ? '🟢' : '⚪️'}
                  </span>
                </div>
                {city ? (
                  <>
                    <div className="font-semibold text-blue-700 mb-1">{city.name}</div>
                    <div className="text-sm text-gray-700 mb-1">{city.description}</div>
                    <div className="text-xs text-gray-500 mb-1">Starting Effect:</div>
                    <div className="text-xs text-green-700 mb-1">{city.startingEffect.description}</div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">No city assigned yet</div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
} 