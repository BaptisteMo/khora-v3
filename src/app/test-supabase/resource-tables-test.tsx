'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Game } from '@/lib/supabase';

// Define base types for resources
type ResourceBase = {
  id: string;
  name: string;
  description?: string;
  effects?: Record<string, unknown>;
};

type ResourceRecord = ResourceBase & {
  [key: string]: unknown;
};

type GameListItem = Pick<Game, 'id' | 'name'>;

// This component allows testing the game resource tables we created in task 1.3
export default function ResourceTablesTest() {
  const [selectedTable, setSelectedTable] = useState<string>('cities');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [results, setResults] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<GameListItem[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: 10,
    points: 5,
    level: 1,
    resource_type: 'production',
    effects: {},
    is_active: true
  });

  // Table options for testing
  const resourceTables = [
    { value: 'cities', label: 'Cities' },
    { value: 'city_developments', label: 'City Developments' },
    { value: 'politics_cards', label: 'Politics Cards' },
    { value: 'player_politics_cards', label: 'Player Politics Cards' },
    { value: 'knowledge_tokens', label: 'Knowledge Tokens' },
    { value: 'player_knowledge_tokens', label: 'Player Knowledge Tokens' },
    { value: 'event_cards', label: 'Event Cards' },
    { value: 'game_events', label: 'Game Events' }
  ];

  // Resource type options
  const resourceTypes = [
    { value: 'production', label: 'Production' },
    { value: 'military', label: 'Military' },
    { value: 'culture', label: 'Culture' },
    { value: 'commerce', label: 'Commerce' },
    { value: 'knowledge', label: 'Knowledge' },
    { value: 'politics', label: 'Politics' }
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
    
    // Handle numeric fields
    if (['cost', 'points', 'level'].includes(name)) {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 0,
      });
    } else if (name === 'is_active') {
      setFormData({
        ...formData,
        [name]: value === 'true',
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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
      if (selectedGame && ['player_politics_cards', 'player_knowledge_tokens', 'game_events'].includes(selectedTable)) {
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

  // Create a test city
  const createTestCity = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a city
      const cityData = {
        name: formData.name || 'Test City',
        description: formData.description || 'This is a test city',
        level: formData.level,
        resource_type: formData.resource_type,
        points: formData.points,
        effects: {
          production: formData.level * 2,
          culture: formData.level
        }
      };
      
      const { data, error } = await supabase
        .from('cities')
        .insert(cityData)
        .select();
      
      if (error) throw error;
      
      alert(`Successfully created city: ${formData.name || 'Test City'}`);
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error creating city:', err);
      setError(err instanceof Error ? err.message : 'Failed to create city');
    } finally {
      setLoading(false);
    }
  };

  // Create a test city development
  const createTestCityDevelopment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a city development
      const developmentData = {
        name: formData.name || 'Test Development',
        description: formData.description || 'This is a test city development',
        cost: formData.cost,
        points: formData.points,
        resource_type: formData.resource_type,
        effects: {
          [formData.resource_type]: formData.level * 2
        },
        requirements: {
          city_level: formData.level
        }
      };
      
      const { data, error } = await supabase
        .from('city_developments')
        .insert(developmentData)
        .select();
      
      if (error) throw error;
      
      alert(`Successfully created development: ${formData.name || 'Test Development'}`);
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error creating city development:', err);
      setError(err instanceof Error ? err.message : 'Failed to create city development');
    } finally {
      setLoading(false);
    }
  };

  // Create a test politics card
  const createTestPoliticsCard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a politics card
      const cardData = {
        name: formData.name || 'Test Politics Card',
        description: formData.description || 'This is a test politics card',
        cost: formData.cost,
        points: formData.points,
        effects: {
          culture: formData.level,
          military: formData.level
        },
        is_active: formData.is_active
      };
      
      const { data, error } = await supabase
        .from('politics_cards')
        .insert(cardData)
        .select();
      
      if (error) throw error;
      
      alert(`Successfully created politics card: ${formData.name || 'Test Politics Card'}`);
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error creating politics card:', err);
      setError(err instanceof Error ? err.message : 'Failed to create politics card');
    } finally {
      setLoading(false);
    }
  };

  // Create a test player politics card
  const createTestPlayerPoliticsCard = async () => {
    if (!selectedGame) {
      setError('Please select a game to assign a politics card');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First, get a politics card to assign
      const { data: cards, error: cardsError } = await supabase
        .from('politics_cards')
        .select('id')
        .limit(1);
      
      if (cardsError) throw cardsError;
      if (!cards || cards.length === 0) {
        throw new Error('No politics cards found. Please create a politics card first.');
      }
      
      // Get current user's profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to assign politics cards');
      }
      
      // Assign the politics card to the current user
      const playerCardData = {
        profile_id: session.user.id,
        politics_card_id: cards[0].id,
        game_id: selectedGame,
        is_active: formData.is_active
      };
      
      const { data, error } = await supabase
        .from('player_politics_cards')
        .insert(playerCardData)
        .select();
      
      if (error) throw error;
      
      alert('Successfully assigned politics card to current user');
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error assigning politics card:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign politics card');
    } finally {
      setLoading(false);
    }
  };

  // Create a test knowledge token
  const createTestKnowledgeToken = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a knowledge token
      const tokenData = {
        name: formData.name || 'Test Knowledge Token',
        description: formData.description || 'This is a test knowledge token',
        points: formData.points,
        effects: {
          science: formData.level * 2,
          culture: formData.level
        }
      };
      
      const { data, error } = await supabase
        .from('knowledge_tokens')
        .insert(tokenData)
        .select();
      
      if (error) throw error;
      
      alert(`Successfully created knowledge token: ${formData.name || 'Test Knowledge Token'}`);
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error creating knowledge token:', err);
      setError(err instanceof Error ? err.message : 'Failed to create knowledge token');
    } finally {
      setLoading(false);
    }
  };

  // Create a test player knowledge token
  const createTestPlayerKnowledgeToken = async () => {
    if (!selectedGame) {
      setError('Please select a game to assign a knowledge token');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First, get a knowledge token to assign
      const { data: tokens, error: tokensError } = await supabase
        .from('knowledge_tokens')
        .select('id')
        .limit(1);
      
      if (tokensError) throw tokensError;
      if (!tokens || tokens.length === 0) {
        throw new Error('No knowledge tokens found. Please create a knowledge token first.');
      }
      
      // Get current user's profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to assign knowledge tokens');
      }
      
      // Assign the knowledge token to the current user
      const playerTokenData = {
        profile_id: session.user.id,
        knowledge_token_id: tokens[0].id,
        game_id: selectedGame,
        acquired_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('player_knowledge_tokens')
        .insert(playerTokenData)
        .select();
      
      if (error) throw error;
      
      alert('Successfully assigned knowledge token to current user');
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error assigning knowledge token:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign knowledge token');
    } finally {
      setLoading(false);
    }
  };

  // Create a test event card
  const createTestEventCard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create an event card
      const eventCardData = {
        name: formData.name || 'Test Event Card',
        description: formData.description || 'This is a test event card',
        type: formData.resource_type,
        effects: {
          [formData.resource_type]: formData.level * (Math.random() > 0.5 ? 1 : -1)
        }
      };
      
      const { data, error } = await supabase
        .from('event_cards')
        .insert(eventCardData)
        .select();
      
      if (error) throw error;
      
      alert(`Successfully created event card: ${formData.name || 'Test Event Card'}`);
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error creating event card:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event card');
    } finally {
      setLoading(false);
    }
  };

  // Create a test game event
  const createTestGameEvent = async () => {
    if (!selectedGame) {
      setError('Please select a game to create a game event');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First, get an event card to use
      const { data: eventCards, error: eventCardsError } = await supabase
        .from('event_cards')
        .select('id')
        .limit(1);
      
      if (eventCardsError) throw eventCardsError;
      if (!eventCards || eventCards.length === 0) {
        throw new Error('No event cards found. Please create an event card first.');
      }
      
      // Create a game event
      const gameEventData = {
        game_id: selectedGame,
        event_card_id: eventCards[0].id,
        round: formData.level,
        resolved: formData.is_active,
        effects_applied: formData.is_active,
        notes: formData.description || 'Test game event'
      };
      
      const { data, error } = await supabase
        .from('game_events')
        .insert(gameEventData)
        .select();
      
      if (error) throw error;
      
      alert('Successfully created game event');
      setResults(data || []);
      
      // Refresh the results
      testTableQuery();
    } catch (err) {
      console.error('Error creating game event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create game event');
    } finally {
      setLoading(false);
    }
  };

  // Create appropriate test record based on selected table
  const createTestRecord = () => {
    switch (selectedTable) {
      case 'cities':
        return createTestCity();
      case 'city_developments':
        return createTestCityDevelopment();
      case 'politics_cards':
        return createTestPoliticsCard();
      case 'player_politics_cards':
        return createTestPlayerPoliticsCard();
      case 'knowledge_tokens':
        return createTestKnowledgeToken();
      case 'player_knowledge_tokens':
        return createTestPlayerKnowledgeToken();
      case 'event_cards':
        return createTestEventCard();
      case 'game_events':
        return createTestGameEvent();
      default:
        setError(`Creating test records for ${selectedTable} is not supported`);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold">Test Game Resource Tables</h3>
        <p className="text-sm text-gray-600 mb-4">
          This section lets you test the database tables created for game resources in task 1.3
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
              Required for player resources and game events
            </p>
          </div>
          
          {/* Table selection */}
          <div>
            <label htmlFor="table-select" className="block mb-1 text-sm font-medium">
              Resource Table:
            </label>
            <select
              id="table-select"
              className="w-full p-2 border rounded"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              {resourceTables.map((table) => (
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
              ['player_politics_cards', 'player_knowledge_tokens', 'game_events'].includes(selectedTable) && !selectedGame
            )}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Create Test Record
          </button>
        </div>
        
        {/* Form for creating test records */}
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h4 className="font-medium mb-2">Test Record Data</h4>
          <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Common fields */}
            <div>
              <label htmlFor="name" className="block text-sm">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="Enter name"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="Enter description"
                rows={2}
              />
            </div>
            
            {/* Fields for specific tables */}
            {['cities', 'city_developments', 'politics_cards'].includes(selectedTable) && (
              <div>
                <label htmlFor="cost" className="block text-sm">Cost:</label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  min={0}
                />
              </div>
            )}
            
            {['cities', 'city_developments', 'politics_cards', 'knowledge_tokens'].includes(selectedTable) && (
              <div>
                <label htmlFor="points" className="block text-sm">Points:</label>
                <input
                  type="number"
                  id="points"
                  name="points"
                  value={formData.points}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  min={0}
                />
              </div>
            )}
            
            {['cities', 'city_developments', 'game_events'].includes(selectedTable) && (
              <div>
                <label htmlFor="level" className="block text-sm">
                  {selectedTable === 'game_events' ? 'Round:' : 'Level:'}
                </label>
                <input
                  type="number"
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  min={1}
                  max={5}
                />
              </div>
            )}
            
            {['cities', 'city_developments', 'politics_cards', 'event_cards'].includes(selectedTable) && (
              <div>
                <label htmlFor="resource_type" className="block text-sm">Resource Type:</label>
                <select
                  id="resource_type"
                  name="resource_type"
                  value={formData.resource_type}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  {resourceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {['politics_cards', 'player_politics_cards', 'game_events'].includes(selectedTable) && (
              <div>
                <label htmlFor="is_active" className="block text-sm">
                  {selectedTable === 'game_events' ? 'Resolved:' : 'Is Active:'}
                </label>
                <select
                  id="is_active"
                  name="is_active"
                  value={String(formData.is_active)}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            )}
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