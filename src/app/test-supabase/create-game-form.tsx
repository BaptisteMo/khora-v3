'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { buildNewGame } from '@/lib/game-init';

export default function CreateGameForm() {
  const [gameName, setGameName] = useState<string>('');
  const [gameDescription, setGameDescription] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Creating game...');
    setError(null);
    if (!isAuthenticated || !user?.id) {
      setError('You must be logged in to create a game');
      setStatus(null);
      return;
    }
    const newGame = buildNewGame({
      name: gameName,
      created_by: user.id,
      is_public: isPublic,
      description: gameDescription,
      // add more options if needed
    });
    const { data, error } = await supabase
      .from('games')
      .insert([newGame])
      .select()
      .single();
    if (error) {
      setError(error.message);
      setStatus(null);
    } else {
      setStatus(`Game created successfully! ID: ${data.id}`);
      setGameName('');
      setGameDescription('');
    }
  };

  if (!isAuthenticated || !user?.id) {
    return (
      <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
        <h3 className="font-semibold">Authentication Required</h3>
        <p>You must be logged in to create a game. Please sign in first.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="font-semibold mb-4">Create a Test Game</h2>
      <form onSubmit={handleCreateGame} className="space-y-4">
        <div>
          <label htmlFor="game-name" className="block mb-1">Game Name:</label>
          <input
            id="game-name"
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="game-description" className="block mb-1">Description:</label>
          <textarea
            id="game-description"
            value={gameDescription}
            onChange={(e) => setGameDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
        </div>
        <div className="flex items-center">
          <input
            id="is-public"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="is-public">Public Game</label>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Game
        </button>
      </form>
      {status && (
        <div className="mt-4 p-2 bg-green-100 text-green-800 rounded">
          {status}
        </div>
      )}
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
} 