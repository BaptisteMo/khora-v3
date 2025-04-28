'use client';

import { useState, useEffect } from 'react';
import { testSupabaseConnection } from '@/lib/supabase-helpers';
import { gameUtils, participantUtils } from '@/lib/db-utils';
import CreateGameForm from './create-game-form';
import LoginForm from './login-form';
import ProgressTablesTest from './progress-tables-test';
import ResourceTablesTest from './resource-tables-test';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

// Define type for game data
interface Game {
  id: string;
  name: string;
  status: string;
  [key: string]: unknown;
  created_by: string;
}

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [publicGames, setPublicGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    async function testConnection() {
      try {
        // Test basic connection
        const isConnected = await testSupabaseConnection();
        setConnectionStatus(isConnected ? 'Connected successfully' : 'Connection failed');
        // Try to fetch public games (if tables are set up)
        if (isConnected) {
          try {
            const games = await gameUtils.getPublicLobbies();
            setPublicGames(games);
          } catch (err: unknown) {
            setError(`Error fetching games: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      } catch (err: unknown) {
        setConnectionStatus('Connection error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
    testConnection();
  }, []);

  const handleRefreshGames = async () => {
    try {
      const games = await gameUtils.getPublicLobbies();
      setPublicGames(games);
    } catch (err: unknown) {
      setError(`Error refreshing games: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Join game logic
  const handleJoinGame = async (game: Game) => {
    if (!isAuthenticated || !user?.id) {
      alert('You must be logged in to join a game.');
      return;
    }
    try {
      // Fetch latest game data
      const latest = await gameUtils.getGame(game.id);
      if (!latest) {
        alert('Game not found.');
        return;
      }
      const is_participant = await participantUtils.getParticipant(game.id, user.id);

      if (latest.status !== 'lobby' && !is_participant) {
        alert('Cannot join: game has already started and you are not a participant.');
        return;
      }
      // Check if already a participant
      const participant = await participantUtils.getParticipant(game.id, user.id);
      if (!participant) {
        // Find next available player number
        const participants = await participantUtils.getGameParticipants(game.id);
        const usedNumbers = participants.map((p) => p.player_number);
        let n = 1;
        while (usedNumbers.includes(n)) n++;
        if(user.id === game.created_by){
          await participantUtils.joinGame(game.id, user.id, n, true);
        }else{
          await participantUtils.joinGame(game.id, user.id, n, false);
        }
        
      } else {
        // If participant exists, set is_active=true and clear left_at/left_reason
        await participantUtils.reactivateParticipant(game.id, user.id);
      }
      // After join/reactivation, redirect based on game status
      const redirectPath = latest.status !== 'lobby'
        ? `/game/${game.id}/ongoing-game`
        : `/game/${game.id}/waiting-room`;
    window.location.href = redirectPath;
    } catch (err) {
      alert('Error joining game: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="font-semibold mb-2">Connection Status:</h2>
        <p className={`${connectionStatus === 'Connected successfully' ? 'text-green-600' : 'text-red-600'} font-medium`}>
          {connectionStatus}
        </p>
        {error && (
          <p className="text-red-500 mt-2">
            Error: {error}
          </p>
        )}
      </div>

      <div className="mb-6 p-4 border rounded">
        <h2 className="font-semibold mb-2">Environment Check:</h2>
        <p>
          Supabase URL set: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}
        </p>
        <p>
          Supabase Anon Key set: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Authentication Status:</h2>
          {isAuthenticated ? (
            <div>
              <p className="text-green-600">User is logged in</p>
              <p>User ID: {user?.id}</p>
              <p>Email: {user?.email}</p>
            </div>
          ) : (
            <div>
              <p className="text-yellow-600">User is not logged in</p>
              <p className="mt-2">
                To test game creation, you&apos;ll need to:
              </p>
              <ol className="list-decimal ml-5 mt-1">
                <li>Set up your Supabase project</li>
                <li>Run the SQL migrations</li>
                <li>Create a test user with the form below</li>
                <li>Log in with that user</li>
              </ol>
            </div>
          )}
        </div>

        <LoginForm />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Public Games:</h2>
          <div className="flex justify-between items-center mb-4">
            <span>{publicGames.length} games found</span>
            <Button
              onClick={handleRefreshGames}
              className="px-3 py-1rounded text-sm"
              variant='ghost'
            >
              Refresh
            </Button>
          </div>
          {publicGames.length > 0 ? (
            <ul className="list-disc pl-5">
              {publicGames.map((game) => (
                <li key={game.id} className="flex items-center gap-2">
                  {game.name} - Status: {game.status}
                  <Button
                    className="ml-2 px-2 py-1 text-xs"
                    onClick={() => handleJoinGame(game)}
                    variant='ghost'
                  >
                    Join
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No public games found. This is expected if you haven&apos;t created any games yet.</p>
          )}
        </div>

        {isAuthenticated ? <CreateGameForm /> : null}
      </div>
      
      {/* Game Progress Tables Test Section */}
      <div className="mt-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Game Progress Tables Test</h2>
        {isAuthenticated ? (
          <ProgressTablesTest />
        ) : (
          <p className="text-yellow-600">Please log in to test game progress tables</p>
        )}
      </div>
      
      {/* Game Resource Tables Test Section */}
      <div className="mt-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Game Resource Tables Test</h2>
        {isAuthenticated ? (
          <ResourceTablesTest />
        ) : (
          <p className="text-yellow-600">Please log in to test game resource tables</p>
        )}
      </div>
      
      <div className="mt-8 p-4 border rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Next Steps:</h2>
        <ul className="list-disc pl-5">
          <li>Ensure you&apos;ve created your Supabase project</li>
          <li>Verify you&apos;ve added NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local</li>
          <li>Run the SQL migration scripts in your Supabase SQL Editor</li>
          <li>Create a test user using the login form above</li>
          <li>Try creating games and testing game progress features</li>
        </ul>
      </div>
    </div>
  );
} 