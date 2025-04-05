'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GameRoom({ params }) {
  const { gameId } = params;
  const [player, setPlayer] = useState(null);
  const [game, setGame] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [players, setPlayers] = useState([]);
  
  const router = useRouter();
  
  useEffect(() => {
    // Load player and game info from local storage
    const storedPlayer = localStorage.getItem('leetstudyPlayer');
    const storedGame = localStorage.getItem('leetstudyGame');
    
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    }
    
    if (storedGame) {
      setGame(JSON.parse(storedGame));
    }
    
    // Fetch latest game data
    fetchGameData();
    
    // Fetch current question
    fetchCurrentQuestion();
    
    // Set up periodic refresh for game data
    const intervalId = setInterval(fetchGameData, 5000);
    
    return () => clearInterval(intervalId);
  }, [gameId]);
  
  const fetchGameData = async () => {
    try {
      const response = await fetch(`/api/leetstudy?action=game&gameId=${gameId}`);
      const data = await response.json();
      
      if (response.ok) {
        setGame(data.game);
        
        // Extract players from the game object
        if (data.game && data.game.playerObjects) {
          setPlayers(data.game.playerObjects);
        }
        
        setError('');
      } else {
        setError(data.error || 'Failed to load game data');
      }
    } catch (err) {
      console.error('Error fetching game data:', err);
      setError('Failed to load game data. Please try again.');
    }
  };
  
  const fetchCurrentQuestion = async () => {
    try {
      setLoadingQuestion(true);
      const response = await fetch(`/api/leetstudy?action=question&gameId=${gameId}`);
      const data = await response.json();
      
      if (response.ok) {
        setQuestion(data.question);
        setSelectedOption(null);
        setAnswer('');
        setResult(null);
        setError('');
      } else {
        if (data.error === 'No more questions') {
          setQuestion(null);
          setError('No more questions! Game completed.');
        } else {
          setError(data.error || 'Failed to load question');
        }
      }
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('Failed to load question. Please try again.');
    } finally {
      setLoadingQuestion(false);
    }
  };
  
  const submitAnswer = async () => {
    if (!player) {
      setError('Player information not found. Please rejoin the game.');
      return;
    }
    
    const currentAnswer = question.type === 'multiple_choice' 
      ? selectedOption 
      : answer.trim();
    
    if (currentAnswer === '' || currentAnswer === null || currentAnswer === undefined) {
      setError('Please provide an answer');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const response = await fetch('/api/leetstudy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submit_answer',
          gameId,
          playerId: player.id,
          answer: currentAnswer,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data.evaluation);
        
        // If everyone has answered and there are more questions, load the next question
        if (data.allAnswered && data.hasMoreQuestions) {
          setTimeout(() => {
            fetchCurrentQuestion();
          }, 3000); // Show result for 3 seconds before loading next question
        }
        
        // Refresh player data
        fetchGameData();
      } else {
        setError(data.error || 'Failed to submit answer');
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleLeaveGame = () => {
    localStorage.removeItem('leetstudyPlayer');
    localStorage.removeItem('leetstudyGame');
    router.push('/leetstudy');
  };
  
  if (!game) {
    return (
      <div className="container mx-auto p-4 max-w-4xl text-center">
        <h1 className="text-3xl font-bold mb-6">Loading Game...</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <div className="mt-2">
              <Link href="/leetstudy" className="text-blue-500 hover:text-blue-700">
                Return to Lobby
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">LeetStudy Game</h1>
        <button
          onClick={handleLeaveGame}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Leave Game
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {game.topic ? `Topic: ${game.topic}` : 'General Quiz'}
              </h2>
              <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded capitalize">
                {game.difficulty || 'Medium'} Difficulty
              </span>
            </div>
            
            <div className="mb-2 text-sm text-gray-600">
              Question {game.currentQuestionIndex + 1} of {game.questions?.length || 0}
            </div>
            
            {loadingQuestion ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">Loading question...</p>
              </div>
            ) : question ? (
              <div>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">{question.question}</h3>
                  
                  {question.type === 'multiple_choice' ? (
                    <div className="space-y-2">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center">
                          <input
                            type="radio"
                            id={`option-${index}`}
                            name="answer-option"
                            value={index}
                            checked={selectedOption === index}
                            onChange={() => setSelectedOption(index)}
                            disabled={result || submitting}
                            className="mr-2"
                          />
                          <label 
                            htmlFor={`option-${index}`}
                            className={`flex-1 p-2 cursor-pointer rounded ${
                              selectedOption === index ? 'bg-blue-100' : ''
                            }`}
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        disabled={result || submitting}
                        placeholder="Type your answer here..."
                        className="w-full p-2 border rounded-md"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
                
                {result ? (
                  <div className={`p-4 rounded-lg mb-4 ${
                    result.score > 90 ? 'bg-green-100 text-green-800' :
                    result.score > 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <h4 className="font-bold mb-2">Result:</h4>
                    <p className="mb-1">Score: {result.score}/100</p>
                    <p>{result.feedback}</p>
                  </div>
                ) : (
                  <button
                    onClick={submitAnswer}
                    disabled={submitting || 
                      (question.type === 'multiple_choice' && selectedOption === null) || 
                      (question.type === 'text' && !answer.trim())
                    }
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full ${
                      submitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Answer'}
                  </button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">
                  {game.currentQuestionIndex >= game.questions?.length
                    ? 'Game completed! No more questions.'
                    : 'Waiting for the first question...'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
          
          {players.length === 0 ? (
            <p className="text-gray-500">No players yet</p>
          ) : (
            <div className="space-y-4">
              {[...players].sort((a, b) => b.points - a.points).map(player => (
                <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div className="ml-2">
                      <p className="font-medium">
                        {player.username}
                        {player.isOwner && (
                          <span className="ml-1 text-xs bg-yellow-200 text-yellow-800 py-0.5 px-1 rounded">
                            Host
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold">{player.points}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/leetstudy" className="text-blue-500 hover:text-blue-700">
          Back to Lobby
        </Link>
      </div>
    </div>
  );
} 