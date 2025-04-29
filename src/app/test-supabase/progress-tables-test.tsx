'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Game } from '@/lib/supabase';

// Define types for progress tables
type Achievement = {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  icon_name: string;
  requirements: Record<string, unknown>;
};

type ProgressTableRecord = Achievement | { id: string; [key: string]: unknown };

type GameListItem = Pick<Game, 'id' | 'name'>;

// This component allows testing the game progress tables we created in task 1.4
export default function ProgressTablesTest() {
  const [selectedTable, setSelectedTable] = useState<string>('achievements');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [results, setResults] = useState<ProgressTableRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<GameListItem[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'progression',
    points: 10
  });

  // Table options for testing
  const progressTables = [
    { value: 'achievements', label: 'Achievements' },
    { value: 'player_achievements', label: 'Player Achievements' },
    { value: 'game_logs', label: 'Game Logs' }
  ];

  // Category options for achievements
  const achievementCategories = [
    { value: 'progression', label: 'Progression' },
    { value: 'collection', label: 'Collection' },
    { value: 'challenge', label: 'Challenge' },
    { value: 'special', label: 'Special' }
  ];

  // Fetch available games when the component mounts
  useEffect(() => {
    async function fetchGames() {
      try {
        const { data: userGames, error } = await supabase
          .from('games')
          .select('id, name')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setGames(userGames || []);
      } catch (err) {
        console.error('Error fetching games:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch games');
      }
    }
    
    fetchGames();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'points' ? parseInt(value, 10) : value,
    });
  };

  // Test fetching data from the selected table
  const testTableQuery = async () => {
    if (!selectedTable) {
      setError('Please select a table to query');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase.from(selectedTable).select('*');
      
      // Add game filter if a game is selected and table has game_id
      if (selectedGame && ['player_achievements', 'game_logs'].includes(selectedTable)) {
        query = query.eq('game_id', selectedGame);
      }
      
      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      
      setResults(data || []);
    } catch (err) {
      console.error(`Error querying ${selectedTable}:`, err);
      setError(err instanceof Error ? err.message : `Failed to query ${selectedTable}`);
    } finally {
      setLoading(false);
    }
  };

  // Create a test achievement
  const createTestAchievement = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create an achievement
      const achievementData = {
        name: formData.name || 'Test Achievement',
        description: formData.description || 'This is a test achievement',
        category: formData.category,
        points: formData.points,
        icon_name: 'trophy',
        requirements: {
          type: formData.category,
          threshold: 1
        }
      };
      
      const { data, error } = await supabase
        .from('achievements')
        .insert(achievementData)
        .select();
      
      if (error) throw error;
      
      alert(`Successfully created achievement: ${formData.name || 'Test Achievement'}`);
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error creating achievement:', err);
      setError(err instanceof Error ? err.message : 'Failed to create achievement');
    } finally {
      setLoading(false);
    }
  };

  // Create a test player achievement
  const awardTestAchievement = async () => {
    if (!selectedGame) {
      setError('Please select a game to award an achievement');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First, get an achievement to award
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('id')
        .limit(1);
      
      if (achievementsError) throw achievementsError;
      if (!achievements || achievements.length === 0) {
        throw new Error('No achievements found. Please create an achievement first.');
      }
      
      // Get current user's profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to award achievements');
      }
      
      // Award the achievement to the current user
      const playerAchievementData = {
        profile_id: session.user.id,
        achievement_id: achievements[0].id,
        game_id: selectedGame
      };
      
      const { data, error } = await supabase
        .from('player_achievements')
        .insert(playerAchievementData)
        .select();
      
      if (error) throw error;
      
      alert('Successfully awarded achievement to current user');
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error awarding achievement:', err);
      setError(err instanceof Error ? err.message : 'Failed to award achievement');
    } finally {
      setLoading(false);
    }
  };

  // Create a test game log entry
  const createTestLogEntry = async () => {
    if (!selectedGame) {
      setError('Please select a game to create a log entry');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current user's profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to create log entries');
      }
      
      // Create a log entry
      const logData = {
        game_id: selectedGame,
        player_id: session.user.id,
        event_type: 'custom_event',
        description: formData.description || 'Test log entry',
        event_data: {
          action: 'test',
          timestamp: new Date().toISOString()
        }
      };
      
      const { data, error } = await supabase
        .from('game_logs')
        .insert(logData)
        .select();
      
      if (error) throw error;
      
      alert('Successfully created game log entry');
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error creating log entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to create log entry');
    } finally {
      setLoading(false);
    }
  };

  // Create appropriate test record based on selected table
  const createTestRecord = () => {
    switch (selectedTable) {
      case 'achievements':
        return createTestAchievement();
      case 'player_achievements':
        return awardTestAchievement();
      case 'game_logs':
        return createTestLogEntry();
      default:
        setError(`Creating test records for ${selectedTable} is not supported`);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold">Test Game Progress Tables</h3>
        <p className="text-sm text-gray-600 mb-4">
          This section lets you test the database tables created for game progress in task 1.4
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Game selection */}
          <div>
            <label htmlFor="game-select" className="block mb-1 text-sm font-medium">
              Game:
            </label>
            <select
              id="game-select"
              className="w-full p-2 border rounded"
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
            >
              <option value="">-- Select a game --</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Required for player achievements and game logs
            </p>
          </div>
          
          {/* Table selection */}
          <div>
            <label htmlFor="table-select" className="block mb-1 text-sm font-medium">
              Progress Table:
            </label>
            <select
              id="table-select"
              className="w-full p-2 border rounded"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              {progressTables.map((table) => (
                <option key={table.value} value={table.value}>
                  {table.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={testTableQuery}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Query Table'}
          </button>
          
          <button
            onClick={createTestRecord}
            disabled={loading || (
              // Disable if no game is selected for tables that require it
              (selectedTable !== 'achievements' && !selectedGame)
            )}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Create Test Record
          </button>
        </div>
        
        {/* Form for creating test records */}
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h4 className="font-medium mb-2">Test Record Data</h4>
          <div className="space-y-2">
            {/* Only show name and category for achievements */}
            {selectedTable === 'achievements' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm">Name:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Enter achievement name"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm">Category:</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  >
                    {achievementCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="points" className="block text-sm">Points:</label>
                  <input
                    type="number"
                    id="points"
                    name="points"
                    value={formData.points}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min={1}
                    max={100}
                  />
                </div>
              </>
            )}
            
            {/* Always show description field */}
            <div>
              <label htmlFor="description" className="block text-sm">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder={
                  selectedTable === 'achievements' ? "Enter achievement description" : 
                  selectedTable === 'game_logs' ? "Enter log message" : 
                  "Enter description"
                }
                rows={2}
              />
            </div>
          </div>
        </div>
        
        {/* Display error if any */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">
            Error: {error}
          </div>
        )}
      </div>
      
      {/* Results display */}
      <div>
        <h3 className="font-semibold mb-2">Query Results ({results.length})</h3>
        {results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th key={key} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key} className="px-4 py-2 border-b whitespace-nowrap">
                        {typeof value === 'object' ? 
                          JSON.stringify(value, null, 2) : 
                          String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No results to display. Query a table or create a test record.</p>
        )}
      </div>
    </div>
  );
} 