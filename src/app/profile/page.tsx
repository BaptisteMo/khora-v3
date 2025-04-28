'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Game } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [averagePoints, setAveragePoints] = useState(0);

  useEffect(() => {
    async function fetchProfileAndGames() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch all game IDs where user is a participant
        const { data: participantRows, error: participantError } = await supabase
          .from('game_participants')
          .select('game_id')
          .eq('user_id', user.id);
        if (participantError) throw participantError;
        const participantGameIds = (participantRows || []).map(row => row.game_id);

        // Fetch games where user is a participant
        let participantGames: Game[] = [];
        if (participantGameIds.length > 0) {
          const { data: gamesByParticipation, error: gamesByParticipationError } = await supabase
            .from('games')
            .select('*')
            .in('id', participantGameIds)
            .order('created_at', { ascending: false });
          if (gamesByParticipationError) throw gamesByParticipationError;
          participantGames = gamesByParticipation || [];
        }

        // Fetch games where user is the creator
        const { data: gamesByCreator, error: gamesByCreatorError } = await supabase
          .from('games')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        if (gamesByCreatorError) throw gamesByCreatorError;

        // Merge and deduplicate games
        const allGames = [...participantGames, ...(gamesByCreator || [])];
        const uniqueGames = Array.from(new Map(allGames.map(g => [g.id, g])).values());
        setGames(uniqueGames);

        // Fetch player_state for this user and calculate points
        const { data: playerStates, error: playerStateError } = await supabase
          .from('player_state')
          .select('score')
          .in('game_id', uniqueGames.map(g => g.id));
        if (playerStateError) throw playerStateError;
        const totalPoints = (playerStates || []).reduce((sum, ps) => sum + (ps.score || 0), 0);
        const averagePoints = playerStates && playerStates.length > 0
          ? Math.round(totalPoints / playerStates.length)
          : 0;
        setTotalPoints(totalPoints);
        setAveragePoints(averagePoints);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile or games');
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchProfileAndGames();
  }, [user]);

  const gamesPlayed = profile?.games_played ?? 0;
  const gamesWon = profile?.games_won ?? 0;

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          {authLoading || loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>Error: {error}</p>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-white">
                  {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-6">
                  <h2 className="text-xl font-semibold">{profile?.username || user?.email?.split('@')[0]}</h2>
                  <p className="text-gray-500">{user?.email}</p>
                  <p className="text-gray-500 mt-1">User ID: {user?.id}</p>
                </div>
              </div>
              <div className="mt-8 border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Game Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Games Played</p>
                    <p className="text-2xl font-bold">{gamesPlayed}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Victories</p>
                    <p className="text-2xl font-bold">{gamesWon}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Average Points</p>
                    <p className="text-2xl font-bold">{averagePoints}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Total Points</p>
                    <p className="text-2xl font-bold">{totalPoints}</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Game History</h3>
                {games.length === 0 ? (
                  <p className="text-gray-500">No games found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {games.map((game) => (
                          <tr key={game.id}>
                            <td className="px-4 py-2">{game.name}</td>
                            <td className="px-4 py-2 capitalize">{game.status}</td>
                            <td className="px-4 py-2">{new Date(game.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-2">
                              {game.created_by === user?.id && (
                                <button
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                  onClick={async () => {
                                    if (!window.confirm('Are you sure you want to delete this game? This cannot be undone.')) return;
                                    const { error } = await supabase.from('games').delete().eq('id', game.id);
                                    if (error) {
                                      alert('Failed to delete game: ' + error.message);
                                    } else {
                                      setGames(games.filter(g => g.id !== game.id));
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="mt-8 border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/profile/edit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="mt-8">
            <Link href="/" className="text-blue-600 hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 