'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LeetStudyPage() {
  const [games, setGames] = useState([]);
  const [username, setUsername] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  
  useEffect(() => {
    fetchGames();
  }, []);
  
  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leetstudy?action=games');
      const data = await response.json();
      setGames(data.games || []);
      setError('');
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const createGame = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/leetstudy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_game',
          username,
          topic: topic || undefined,
          difficulty: difficulty || 'medium',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store player and game info in local storage
        localStorage.setItem('leetstudyPlayer', JSON.stringify(data.player));
        localStorage.setItem('leetstudyGame', JSON.stringify(data.game));
        
        // Navigate to the game room
        router.push(`/leetstudy/${data.game.id}`);
      } else {
        setError(data.error || 'Failed to create game');
      }
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const joinGame = async (gameId) => {
    if (!username.trim()) {
      setError('Username is required to join a game');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/leetstudy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join_game',
          gameId,
          username,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store player info in local storage
        localStorage.setItem('leetstudyPlayer', JSON.stringify(data.player));
        
        // Fetch the game info
        const gameResponse = await fetch(`/api/leetstudy?action=game&gameId=${gameId}`);
        const gameData = await gameResponse.json();
        
        if (gameResponse.ok) {
          localStorage.setItem('leetstudyGame', JSON.stringify(gameData.game));
          // Navigate to the game room
          router.push(`/leetstudy/${gameId}`);
        } else {
          setError(gameData.error || 'Failed to fetch game details');
        }
      } else {
        setError(data.error || 'Failed to join game');
      }
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Failed to join game. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">LeetStudy - Programming Quiz Game</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Game</h2>
          
          <form onSubmit={createGame}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Your Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Topic (Optional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                placeholder="e.g., Algorithms, Data Structures"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </form>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Join Existing Game</h2>
          
          {loading && !games.length ? (
            <p className="text-gray-500">Loading games...</p>
          ) : games.length === 0 ? (
            <p className="text-gray-500">No active games found. Create a new game!</p>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Your Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700"
                  placeholder="Enter your username"
                  required
                />
              </div>
              
              <div className="overflow-y-auto max-h-60">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                        Topic
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                        Difficulty
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                        Players
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                        Created
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => (
                      <tr key={game.id} className="border-t">
                        <td className="py-2">{game.topic || 'General'}</td>
                        <td className="py-2 capitalize">{game.difficulty || 'Medium'}</td>
                        <td className="py-2">{game.playerCount}</td>
                        <td className="py-2">{formatDate(game.createdAt)}</td>
                        <td className="py-2">
                          <button
                            onClick={() => joinGame(game.id)}
                            disabled={loading}
                            className="bg-green-500 hover:bg-green-700 text-white text-sm font-bold py-1 px-2 rounded"
                          >
                            Join
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <button
                onClick={fetchGames}
                className="mt-4 text-blue-500 hover:text-blue-700 text-sm"
              >
                Refresh List
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/" className="text-blue-500 hover:text-blue-700">
          Back to Home
        </Link>
      </div>
    </div>
  );
} 